'use client'

// CorpusLuteumBeadMorph -- "Option C" prototype: ONE live parametric renderer
// for the corp1 (torn cream bead crescent) <-> corp2 (closed lemon bead ring)
// transition, generalizing the plump 3D bead-ring look that currently only
// exists as two BAKED static twins (Corp1Lobes.tsx / Corp2Lobes.tsx, built
// offline by tools/corpgen/build_corp1.py / build_corp2.py). Unlike those,
// this component IS the art at every frame of t in [0,1], not just at the
// t=0/t=1 rest points -- there is no flatter fallback shape to crossfade
// out of. t=0 reads as corp1, t=1 reads as corp2.
//
// Ported directly from tools/corpgen/gen.py + build_corp1.py + build_corp2.py
// (same constants: CX/CY/LOBE_ANGLES/R_CENTER/BASE_R/oval-stretch/frayed-
// knob geometry/color stops), generalized so every quantity that differs
// between the two Python scripts becomes a t-driven lerp instead of two
// separate hardcoded runs. Two simplifications from a literal port, both
// acceptable because this is an experiment where morph CONTINUITY matters
// more than pixel-exact endpoints (see the calling prompt):
//   1. Jitter/streak/elongation randomness uses a small local seeded PRNG
//      (mulberry32) instead of porting Python's Mersenne Twister bit-for-
//      bit -- the shape/proportion CONSTANTS (angles, radii, oval stretch,
//      knob reach) are the real spec and are ported exactly; only the
//      organic per-vertex wobble is approximated.
//   2. The 13 regular lobes reuse ONE seed per lobe for both endpoints (so
//      corp1 and corp2 draw the identical per-vertex random numbers, exactly
//      as the Python does -- same seed 1000+i, called with the same n_pts
//      both scripts), which means jitterT below linearly interpolates a
//      TRUE point-by-point deform between the two real target shapes, not
//      an approximation.
//
// The two GAP lobes (7 & 8, the rupture tear) are the one place with no
// direct Python equivalent to interpolate against: corp1 renders each as
// THREE separate tapering knobs reaching away from the ring, corp2 renders
// it as a single ordinary bead sealing the ring shut. See gapLobeGeometry()
// for the strategy: the knobs' reach retracts to 0 as t->1 (converging back
// onto the ring), the two smaller knobs fade out, and the primary knob's own
// size/jitter eases toward a normal bead -- so by t=1 what's left is one
// bead sitting in the closed ring position, and the crease between lobes 7
// and 8 (which corp1 omits, since that's the tear, not a seam) fades in in
// lockstep to sell the ring sealing shut.

type Pt = [number, number]

const CX = 477
const CY = 428
const N = 15

const LOBE_ANGLES = [
  -178.3, -159.9, -139.7, -114.6, -82.5, -52.9, -28.3, -9.4,
  9.5, 31.0, 56.0, 80.0, 111.0, 139.6, 161.4,
]

const R_CENTER = 300
const BASE_R = 92

const GAP_LOBES = new Set([7, 8])
const ANGLE_OVERRIDE: Record<number, number> = { 7: -27.0, 8: 29.0 }

const OVAL_STRETCH_X = 1.095

const KNOB_SCALE = [1.0, 0.6, 0.35]
const KNOB_U = [0.12, 0.62, 1.00]
const FRAYED_FORWARD_PUSH = 1.20
const KNOB_RX_BASE = 88
const KNOB_RY_DEPTH = 104
const FRAYED_DIRECTION_DEG = 0.0

const LOBE_X_STRETCH: Record<number, number> = { 4: 1.12, 11: 1.12, 12: 1.05 }
const LOBE_ROTATE_CCW_DEG: Record<number, number> = { 6: 30.0 }

const ELONG_PROBABILITY = 0.60
const ELONG_FACTOR_RANGE: [number, number] = [1.05, 1.10]
const STREAK_SIZE_RANGE: [number, number] = [0.85, 1.18]
const STREAK_RATIO_RANGE: [number, number] = [0.32, 0.46]
const STREAK_OFFSET_RANGE: [number, number] = [0.75, 1.25]
const STREAK_ANGLE_JITTER = 7
const RADIAL_BOOST_PROBABILITY = 0.50
const RADIAL_BOOST_RANGE: [number, number] = [1.10, 1.15]

// Reference space matches Corp1Lobes/Corp2Lobes exactly, so this component
// drops into the same cx/cy/R contract everywhere they're used.
const REF_CX = 477
const REF_CY = 428
const REF_R = 375

const CORP1_BEAD_STOPS: [number, string][] = [
  [0, '#FFFBEA'], [35, '#F8ECC4'], [72, '#EDD89E'], [100, '#DEC17C'],
]
const CORP2_BEAD_STOPS: [number, string][] = [
  [0, '#FFF3A0'], [35, '#F9DE5E'], [72, '#EFC53E'], [100, '#DFA92A'],
]
const CORP1_HL = ['#FFFFFA', '#FFFDF0']
const CORP2_HL = ['#FFFEF6', '#FFFBE0']
const CORP1_SHADOW = '#C2A468'
const CORP2_SHADOW = '#CDA02E'
const CORP1_CREASE = '#CBB081'
const CORP2_CREASE = '#C0942E'
const CORP1_INNER_RIM = '#C7AD78'
const CORP2_INNER_RIM = '#C79E33'

// ── corp3 target (SECOND segment, stage 1->2) ─────────────────────────────
// corp3 has NO Python generator (SVG/corp3.svg is hand-authored), so unlike
// corp1<->corp2 there's no second "endpoint spec" to port formulas from.
// Instead each of the 15 corp2 spheres is grown into a corp3 FINGER: radially
// elongated (outer tip reaching CORP3_OUTER_PROFILE's real traced radius,
// inner/proximal edge receding to CORP3_INNER_PROFILE's real traced radius --
// both 96-sample polar profiles already derived from the actual corp3.svg by
// tools/corpgen/derive_morph_shapes.py and copied verbatim below) and tapered
// narrower toward its base. The recessed cavity, fold spokes, cavity stroke
// and deepening shadow are ported from CorpusLuteumRosette.tsx's legacy
// second-half rendering (same colors/opacity curves), since that code
// already solved "a believable procedural corpus-luteum cavity" once.
//
// Colors below are read directly from SVG/corp3.svg's own gradient defs
// (lobeBaseShared / lobeHighlightSoft / lobeShadowSoft / junctionAO), not
// guessed -- see that file for the source of truth.

const CORP3_OUTER_PROFILE: number[] = [
  1.15876, 1.16066, 1.14788, 1.11442, 1.04996, 1.05033, 1.04250, 1.02415,
  1.00744, 1.00262, 1.01448, 1.01513, 0.99329, 0.98542, 0.95459, 0.92442,
  0.92652, 0.93400, 0.94265, 0.93803, 0.89226, 0.95061, 0.98390, 0.98751,
  0.98635, 0.99893, 0.99837, 0.98275, 0.98172, 0.96541, 0.96585, 1.01109,
  1.01551, 1.00551, 1.01644, 1.00772, 0.98043, 0.99680, 1.01246, 1.03565,
  1.04019, 1.03690, 0.99704, 1.03618, 1.05603, 1.05769, 1.05222, 1.04132,
  1.10308, 1.11127, 1.10514, 1.09645, 1.09160, 1.05413, 1.00728, 0.97708,
  0.97099, 0.97040, 0.95901, 0.90580, 0.90932, 0.93305, 0.93707, 0.93316,
  0.92493, 0.91497, 0.91297, 0.92301, 0.93861, 0.94595, 0.94483, 0.93448,
  0.91538, 0.88913, 0.92100, 0.92106, 0.93362, 0.94969, 0.95152, 0.94465,
  0.91859, 0.92038, 0.95674, 0.98840, 1.00593, 1.00604, 0.99996, 1.00632,
  1.07483, 1.08996, 1.08981, 1.08186, 1.07527, 1.10826, 1.12363, 1.14334,
]
const CORP3_INNER_PROFILE: number[] = [
  0.55550, 0.55539, 0.55391, 0.55100, 0.54706, 0.54247, 0.53724, 0.53254,
  0.52615, 0.52073, 0.51366, 0.50803, 0.50318, 0.49997, 0.49603, 0.49219,
  0.48917, 0.48589, 0.48245, 0.47943, 0.47722, 0.47605, 0.47619, 0.47738,
  0.47914, 0.48038, 0.48202, 0.48357, 0.48528, 0.48737, 0.48995, 0.49307,
  0.49668, 0.50205, 0.50608, 0.51109, 0.51480, 0.51990, 0.52390, 0.52943,
  0.53639, 0.54134, 0.54638, 0.55011, 0.55263, 0.55416, 0.55472, 0.55472,
  0.55415, 0.55298, 0.55046, 0.54661, 0.54285, 0.53868, 0.53419, 0.52810,
  0.52275, 0.51660, 0.51170, 0.50535, 0.50098, 0.49591, 0.49265, 0.48887,
  0.48573, 0.48278, 0.47970, 0.47721, 0.47371, 0.47026, 0.46799, 0.46650,
  0.46615, 0.46720, 0.46928, 0.47208, 0.47519, 0.47805, 0.48067, 0.48342,
  0.48654, 0.49017, 0.49437, 0.49909, 0.50595, 0.51112, 0.51767, 0.52381,
  0.52949, 0.53589, 0.54045, 0.54528, 0.54834, 0.55090, 0.55345, 0.55488,
]

// [offset%, color] -- offsets differ from corp1/corp2's (0/35/72/100), so
// both offset AND color are lerped per stop index across the second segment.
const CORP3_BEAD_STOPS: [number, string][] = [
  [0, '#FBE49C'], [40, '#F3D073'], [75, '#E8B94E'], [100, '#D89F3A'],
]
const CORP3_HL = ['#FFFDF2', '#FFFAE2']
// A warm burnt-orange/amber, deeper than corp2's #CDA02E but deliberately
// kept clear of muddy olive-brown -- the original #96662C at .58 core
// opacity, stacked with the (now-removed) deepening-shadow ellipse, read as
// near-black rather than "a darker yellow/orange" per fidelity-pass notes.
const CORP3_SHADOW = '#B8722A'
const CORP3_SHADOW_CORE_OP = 0.42, CORP3_SHADOW_MID_OP = 0.18 // corp2's are .40/.17 -- close enough to lerp smoothly, but not so dark it reads black
// NOTE: no CORP3_CREASE -- the corp2-style junction-crease ring was removed
// from the second segment entirely (see CorpusLuteumSecondSegment): 15
// dark ellipses positioned right at the cavity's outer rim read as one
// continuous dark ring once the cavity shrank, rather than individual seams.

// Cavity fill -- re-anchored on the requested #F7CD6C (same uniform hue/
// brightness shift applied to all 4 stops, so the gradient's depth-cueing
// shape is preserved, just recentered on the new target color).
const CAVITY_STOPS: [number, string][] = [
  [0, '#FFFFD3'], [35, '#FFE799'], [70, '#F7CD6C'], [100, '#DEB149'],
]
const CAVITY_STROKE = '#D8B060'
const CAVITY_SAMPLES = 48
// A finger's base narrows to 70% of its own tip width at full taper, by
// default. The three topmost lobes (angle closest to screen "up", verified
// empirically against the rendered SVG bounding boxes: indices 3/4/5) and
// the three bottommost lobes directly across from them (indices 10/11/12,
// same empirical method) kept showing the most visible pink/ovary peeking
// through between the cavity and the bead bases, so both groups get extra
// widening on top of the rest.
const FINGER_TAPER_MIN = 0.70
const TOP_LOBES = new Set([3, 4, 5])
const BOTTOM_LOBES = new Set([10, 11, 12])
function taperMinFor(i: number): number {
  let m = TOP_LOBES.has(i) ? FINGER_TAPER_MIN * 1.15 : FINGER_TAPER_MIN * 1.10
  if (TOP_LOBES.has(i) || BOTTOM_LOBES.has(i)) m *= 1.10 // gap was still visible here -- another 10%
  return m
}

// Fidelity-pass-2 cavity/finger sizing, replacing the earlier crude
// "inflate the cavity 12%" gap hack with an explicit relationship: the
// cavity reads noticeably smaller/deeper-set (per notes), the fingers
// elongate inward to reach it, and a small deliberate overlap guarantees
// coverage regardless of jitter -- rather than papering over the gap by
// oversizing the cavity itself.
const CORP3_CAVITY_SHRINK = 0.75 // cavity's own target radius, 25% smaller
const FINGER_ELONGATE = 1.20 // fingers reach 20% further inward (tip position untouched, so overall corp3 size is unaffected)
// Fidelity-pass-3: fingers now shift inward as a rigid translation (own
// size/length unchanged, cavity size unchanged) so the inner edge overlaps
// the cavity boundary by this fraction -- replaces the old FINGER_CAVITY_
// OVERLAP shape-deformation approach (see fingerSpan).
const LOBE_OVERLAP_FRAC = 0.10
// Lobe 4 (angle -82.5deg, the topmost/most-vertical lobe -- verified
// empirically, smallest rendered bounding-box cy of all 15) gets pulled in
// another 10% on top of the standard overlap. Lobes 3/5 (flanking 4) and
// 11/12 (flanking the bottommost lobe, 11) get pulled in another 6%.
const MOST_VERTICAL_LOBE = 4
const EXTRA_PULL_LOBES = new Set([3, 5, 11, 12])
function overlapFracFor(i: number): number {
  if (i === MOST_VERTICAL_LOBE) return LOBE_OVERLAP_FRAC + 0.10
  if (EXTRA_PULL_LOBES.has(i)) return LOBE_OVERLAP_FRAC + 0.06
  return LOBE_OVERLAP_FRAC
}

// ── small math helpers ──────────────────────────────────────────────────

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}
function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
}
function ringPos(angDeg: number, r: number, stretchX: number): Pt {
  return [CX + r * Math.cos(toRad(angDeg)) * stretchX, CY + r * Math.sin(toRad(angDeg))]
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`
}

// Deterministic, seeded, dependency-free PRNG (mulberry32) -- see file
// header note (1) on why this replaces Python's random module here.
function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Samples a 96-bin polar profile (see CORP3_OUTER/INNER_PROFILE) at an
// arbitrary angle, matching derive_morph_shapes.py's bin_index() convention
// (theta_i = i/96*2pi - pi), with linear interpolation between the two
// nearest bins so the sampled radius doesn't step at bin boundaries.
function sampleProfile(profile: number[], angleDeg: number): number {
  const SAMPLES = 96
  const theta = toRad(angleDeg)
  let tt = (theta + Math.PI) % (2 * Math.PI)
  if (tt < 0) tt += 2 * Math.PI
  const posF = (tt / (2 * Math.PI)) * SAMPLES
  const i0 = Math.floor(posF) % SAMPLES
  const i1 = (i0 + 1) % SAMPLES
  const frac = posF - Math.floor(posF)
  return profile[i0] + (profile[i1] - profile[i0]) * frac
}

// Scales a point toward/away from the ring's own center (CX,CY) -- the
// internal-coordinate equivalent of the legacy's `localR = R*(1-0.3*t)`
// shrink, applied here to point clouds instead of to the outer R prop so
// the wrapping transform (scale(R/REF_R)) never needs to change with stage.
function shrinkPt(p: Pt, shrink: number): Pt {
  return [CX + (p[0] - CX) * shrink, CY + (p[1] - CY) * shrink]
}

function catmullRomClosed(pts: Pt[]): string {
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x.toFixed(1)} ${cp1y.toFixed(1)},${cp2x.toFixed(1)} ${cp2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

// ── precomputed per-lobe randomness (t-independent -- see header note 2) ──

const ballRadii: [number, number][] = Array.from({ length: N }, (_, i) => {
  const rnd = mulberry32(5006 + i)
  if (rnd() < ELONG_PROBABILITY) {
    const factor = ELONG_FACTOR_RANGE[0] + rnd() * (ELONG_FACTOR_RANGE[1] - ELONG_FACTOR_RANGE[0])
    return [BASE_R, BASE_R * factor] as [number, number]
  }
  return [BASE_R, BASE_R] as [number, number]
})

// ── corp3 size calibration ────────────────────────────────────────────────
// CORP3_OUTER_PROFILE's values are normalized to corp3.svg's OWN mean outer
// radius (an unrelated number to REF_R=375), so multiplying by REF_R alone
// systematically undershoots corp2's actual apparent size -- this is *in
// addition* to the deliberate CORP3_SIZE_TARGET shrink/grow, and was why the
// first pass read smaller than intended. Calibrating against corp2's own
// real mean outer radius (computed from the same ballRadii this file already
// uses) fixes that mismatch once, for both outer and inner sampling, instead
// of guessing a magic constant.
// NOTE: uses rx (ballRadii[i][0]), not ry. Per fingerPoints' own rotation
// (rot=toRad(angDeg)), the LOCAL X-AXIS is what ends up pointing in the true
// screen-radial direction -- and regularBeadPoints puts rx (not ry) on that
// axis (lx = rx*cos(theta)*jr). So rx -- always exactly BASE_R, ballRadii
// never varies it -- is corp2's real screen-radial bead half-extent; ry is
// the (sometimes-elongated) TANGENTIAL half-extent. Calibrating against ry
// here would target the wrong on-screen dimension.
const CORP2_MEAN_RX = ballRadii.reduce((s, [rx]) => s + rx, 0) / N
const CORP3_OUTER_PROFILE_MEAN = CORP3_OUTER_PROFILE.reduce((a, b) => a + b, 0) / CORP3_OUTER_PROFILE.length
// corp3 should NOT read smaller than corp2 -- same size or up to ~5% bigger
// at full maturity (stage=2). 1.03 sits in the middle of that range.
const CORP3_SIZE_TARGET = 1.03
const CORP3_CALIBRATION = ((R_CENTER + CORP2_MEAN_RX) * CORP3_SIZE_TARGET) / (REF_R * CORP3_OUTER_PROFILE_MEAN)

interface StreakVar { sizeMult: number; ryRatio: number; offsetMult: number; angleJitter: number }
const streakVar: StreakVar[] = Array.from({ length: N }, (_, i) => {
  const rnd = mulberry32(7000 + i)
  return {
    sizeMult: STREAK_SIZE_RANGE[0] + rnd() * (STREAK_SIZE_RANGE[1] - STREAK_SIZE_RANGE[0]),
    ryRatio: STREAK_RATIO_RANGE[0] + rnd() * (STREAK_RATIO_RANGE[1] - STREAK_RATIO_RANGE[0]),
    offsetMult: STREAK_OFFSET_RANGE[0] + rnd() * (STREAK_OFFSET_RANGE[1] - STREAK_OFFSET_RANGE[0]),
    angleJitter: (rnd() * 2 - 1) * STREAK_ANGLE_JITTER,
  }
})

const radialBoost: number[] = Array.from({ length: N }, (_, i) => {
  const rnd = mulberry32(8020 + i)
  return rnd() < RADIAL_BOOST_PROBABILITY
    ? RADIAL_BOOST_RANGE[0] + rnd() * (RADIAL_BOOST_RANGE[1] - RADIAL_BOOST_RANGE[0])
    : 1.0
})

// Per-spoke irregularity for the cavity texture (fidelity-pass-2: "lines
// more imperfect") -- corp3_ref.png's real fibrous striations don't radiate
// as a perfectly uniform star; each spoke there has its own curvature,
// thickness and reach. Precomputed once (t2-independent) like every other
// per-lobe randomness in this file.
interface SpokeVar { curveBend: number; widthMult: number; innerFrac: number; angleJitterDeg: number }
const spokeVar: SpokeVar[] = Array.from({ length: N }, (_, i) => {
  const rnd = mulberry32(9000 + i)
  return {
    curveBend: 0.03 + rnd() * 0.10, // was a fixed 0.06
    widthMult: 0.7 + rnd() * 0.9, // was a fixed 1.0 -- now roughly 0.7x-1.6x
    innerFrac: 0.07 + rnd() * 0.09, // was 0.09 + 0.05*|sin| -- now fully random per spoke
    angleJitterDeg: (rnd() * 2 - 1) * 6, // spokes don't all radiate exactly toward their lobe
  }
})

// Same seed (1000+i) drives both endpoints for regular lobes -- corp1 and
// corp2 draw the identical per-vertex jitter values, only the jitter
// MAGNITUDE (jitterT below) differs, so the interpolation is a genuine
// point-by-point deform between the two real target shapes.
const jitterVals: number[][] = Array.from({ length: N }, (_, i) => {
  const rnd = mulberry32(1000 + i)
  return Array.from({ length: 10 }, () => rnd())
})

// Independent jitter for the two fading secondary knobs of each gap lobe.
const knobJitter: Record<number, number[][]> = {}
for (const i of GAP_LOBES) {
  knobJitter[i] = KNOB_SCALE.map((_, k) => {
    const rnd = mulberry32(2000 + i * 3 + k)
    return Array.from({ length: 8 }, () => rnd())
  })
}

// ── geometry ─────────────────────────────────────────────────────────────

function regularBeadPoints(i: number, t: number): Pt[] {
  const angDeg = LOBE_ANGLES[i]
  const [rx, ry] = ballRadii[i]
  const stretchXt = lerp(OVAL_STRETCH_X, 1.0, t)
  const [baseX, baseY] = ringPos(angDeg, R_CENTER, stretchXt)
  const jitterT = lerp(0.14, 0.09, t)
  const rot = toRad(angDeg)

  let pts: Pt[] = jitterVals[i].map((rv, k) => {
    const theta = (2 * Math.PI * k) / 10
    const jr = 1 + (rv - 0.5) * 2 * jitterT
    const lx = rx * Math.cos(theta) * jr
    const ly = ry * Math.sin(theta) * jr
    const rxp = lx * Math.cos(rot) - ly * Math.sin(rot)
    const ryp = lx * Math.sin(rot) + ly * Math.cos(rot)
    return [baseX + rxp, baseY + ryp]
  })

  if (i in LOBE_X_STRETCH) {
    const stretchT = lerp(LOBE_X_STRETCH[i], 1, t)
    pts = pts.map(([x, y]) => [baseX + (x - baseX) * stretchT, y] as Pt)
  }
  if (i in LOBE_ROTATE_CCW_DEG) {
    const rotT = lerp(LOBE_ROTATE_CCW_DEG[i], 0, t)
    const a = toRad(-rotT) // negated to match visual-CCW convention in SVG's y-down space
    pts = pts.map(([x, y]) => {
      const dx = x - baseX, dy = y - baseY
      const rxp = dx * Math.cos(a) - dy * Math.sin(a)
      const ryp = dx * Math.sin(a) + dy * Math.cos(a)
      return [baseX + rxp, baseY + ryp] as Pt
    })
  }
  return pts
}

interface KnobGeom { cx: number; cy: number; rx: number; ry: number; opacity: number; jitterT: number }
interface GapLobeGeom { angT: number; baseX: number; baseY: number; lightDirDeg: number; knobs: KnobGeom[] }

function gapLobeGeometry(i: number, t: number): GapLobeGeom {
  const angT = lerp(ANGLE_OVERRIDE[i], LOBE_ANGLES[i], t)
  const stretchXt = lerp(OVAL_STRETCH_X, 1.0, t)
  const [baseX, baseY] = ringPos(angT, R_CENTER, stretchXt)
  const reachT = lerp(1, 0, t) // frayed reach retracts to 0 as the ring seals
  // Lighting direction eases from the frayed knobs' own horizontal growth
  // axis (matching corp1's real streak rotation) to the lobe's natural
  // radial direction (matching every regular bead's convention at corp2).
  const lightDirDeg = lerp(FRAYED_DIRECTION_DEG, LOBE_ANGLES[i], t)

  const knobs: KnobGeom[] = KNOB_SCALE.map((scale, k) => {
    const reach = KNOB_RY_DEPTH * KNOB_U[k] * FRAYED_FORWARD_PUSH * reachT
    const kcx = baseX + reach * Math.cos(toRad(FRAYED_DIRECTION_DEG))
    const kcy = baseY + reach * Math.sin(toRad(FRAYED_DIRECTION_DEG))
    if (k === 0) {
      // primary knob: the one that remains, easing from its frayed-tip size
      // into an ordinary bead size as the ring closes
      return {
        cx: kcx, cy: kcy,
        rx: lerp(KNOB_RX_BASE * scale, BASE_R, t),
        ry: lerp(KNOB_RY_DEPTH * scale, BASE_R * 1.05, t),
        opacity: 1,
        jitterT: lerp(0.11, 0.09, t),
      }
    }
    // secondary knobs fade out as they're reabsorbed into the primary bead
    return { cx: kcx, cy: kcy, rx: KNOB_RX_BASE * scale, ry: KNOB_RY_DEPTH * scale, opacity: 1 - t, jitterT: 0.11 }
  })

  return { angT, baseX, baseY, lightDirDeg, knobs }
}

function knobPoints(k: KnobGeom, jitter: number[]): Pt[] {
  const rot = toRad(FRAYED_DIRECTION_DEG)
  const n = jitter.length
  return jitter.map((rv, idx) => {
    const theta = (2 * Math.PI * idx) / n
    const jr = 1 + (rv - 0.5) * 2 * k.jitterT
    const lx = k.rx * Math.cos(theta) * jr
    const ly = k.ry * Math.sin(theta) * jr
    const rxp = lx * Math.cos(rot) - ly * Math.sin(rot)
    const ryp = lx * Math.sin(rot) + ly * Math.cos(rot)
    return [k.cx + rxp, k.cy + ryp]
  })
}

interface HighlightShadow { hl: Pt; hlRx: number; hlRy: number; hlRot: number; sh: Pt; shRx: number; shRy: number }

// corp1's flip (highlight OUTER / shadow INNER) eases continuously into
// corp2's convention (highlight INNER-ish w/ perpendicular offset / shadow
// OUTER) -- both endpoint formulas are the real Python ones; only the
// journey between them is a linear lerp (see file header).
function highlightShadowFor(cx: number, cy: number, angDeg: number, spanRx: number, spanRy: number, i: number, t: number): HighlightShadow {
  const a = toRad(angDeg)
  const { sizeMult, ryRatio, offsetMult, angleJitter } = streakVar[i]

  const hl1: Pt = [cx + spanRy * 0.30 * offsetMult * Math.cos(a), cy + spanRy * 0.30 * offsetMult * Math.sin(a)]
  const offBase = spanRy * 0.30 * offsetMult, offPerp = spanRy * 0.20 * offsetMult
  const hl2: Pt = [cx - offBase * Math.cos(a) - offPerp * Math.sin(a), cy - offBase * Math.sin(a) + offPerp * Math.cos(a)]
  const hl = lerpPt(hl1, hl2, t)

  let streakRx = spanRx * sizeMult
  const streakRy = streakRx * ryRatio
  streakRx *= radialBoost[i]

  const sh1: Pt = [cx - spanRy * 0.35 * Math.cos(a) - spanRy * 0.25 * Math.sin(a), cy - spanRy * 0.35 * Math.sin(a) + spanRy * 0.25 * Math.cos(a)]
  const sh2: Pt = [cx + spanRy * 0.30 * Math.cos(a), cy + spanRy * 0.30 * Math.sin(a)]
  const sh = lerpPt(sh1, sh2, t)
  const shRx = lerp(spanRx * 0.8, spanRx * 0.95, t)
  const shRy = lerp(spanRy * 0.8, spanRy * 0.95, t)

  return { hl, hlRx: streakRx, hlRy: streakRy, hlRot: angDeg + angleJitter, sh, shRx, shRy }
}

// ── second-segment geometry (corp2 -> corp3 finger growth + cavity) ──────

// Grows lobe i's corp2 sphere into a corp3 finger. At t2=0 this is
// mathematically IDENTICAL to regularBeadPoints(i, 1) (same seed, same
// jitter magnitude 0.09, same center on R_CENTER, no taper) -- verified by
// construction below -- so the hinge at stage=1 has no discontinuity. No
// special-casing for the former gap lobes (7,8): by t=1 of the first
// segment they've already converged to an ordinary ballRadii-sized bead
// (see gapLobeGeometry's primary knob), so all 15 lobes are uniform here.
interface FingerSpan { angDeg: number; centerR: number; halfSpan: number; tangentialHalf: number }

// Cavity boundary radius at an arbitrary angle -- shared by the smooth fill
// ring (cavityRingPoints), the spoke endpoints (cavitySpokeEndpoints), AND
// fingerSpan's own overlap guarantee below, so all three can never drift
// apart. CORP3_CAVITY_SHRINK makes the cavity itself read smaller/deeper-set
// (fidelity-pass-2 note); fingerSpan is what reaches in to meet it.
function cavityBoundaryR(angDeg: number, t2: number): number {
  const corp2InnerR = R_CENTER - CORP2_MEAN_RX
  const targetR = REF_R * sampleProfile(CORP3_INNER_PROFILE, angDeg) * CORP3_CALIBRATION * CORP3_CAVITY_SHRINK
  return lerp(corp2InnerR, targetR, t2)
}

// Shared radial span math for a finger, used by both its own outline
// (fingerPoints) and its highlight/shadow placement -- keeps those in sync
// without recomputing the corp2->corp3 radius lerp twice with drifted logic.
function fingerSpan(i: number, t2: number): FingerSpan {
  const angDeg = LOBE_ANGLES[i]
  const [rx2, ry2] = ballRadii[i]
  // Baseline uses rx2, not ry2 -- see fingerPoints' rotation comment: rx2 is
  // the axis that actually renders radially on screen for a corp2 bead, so
  // it's rx2 (always exactly BASE_R) that must anchor the t2=0 endpoint for
  // hinge continuity. Outer tip position is untouched by the elongate/
  // overlap logic below, so corp3's overall size stays as calibrated.
  const outerR = lerp(R_CENTER + rx2, REF_R * sampleProfile(CORP3_OUTER_PROFILE, angDeg) * CORP3_CALIBRATION, t2)
  const naturalInnerR = lerp(R_CENTER - rx2, REF_R * sampleProfile(CORP3_INNER_PROFILE, angDeg) * CORP3_CALIBRATION, t2)
  // Elongate: the finger's own length grows by FINGER_ELONGATE, anchored at
  // the (unchanged) outer tip -- i.e. it reaches further inward, not outward.
  const elongatedInnerR = outerR - (outerR - naturalInnerR) * lerp(1, FINGER_ELONGATE, t2)
  // Rigid inward shift -- translates BOTH ends by the same amount, so
  // halfSpan (the finger's own length/"size") is algebraically unchanged --
  // just enough to make the inner edge overlap the cavity's own (unchanged)
  // boundary by LOBE_OVERLAP_FRAC. desiredInnerR reduces to exactly
  // elongatedInnerR at t2=0 (both equal R_CENTER-rx2, since rx2 is always
  // BASE_R, matching cavityBoundaryR's own t2=0 baseline), so shift is
  // exactly 0 at the hinge and eases in continuously with t2.
  const cavityR = cavityBoundaryR(angDeg, t2)
  const desiredInnerR = cavityR * (1 - overlapFracFor(i) * t2)
  const shift = Math.max(0, elongatedInnerR - desiredInnerR)
  const outerRShifted = outerR - shift
  const innerR = elongatedInnerR - shift
  return { angDeg, centerR: (outerRShifted + innerR) / 2, halfSpan: (outerRShifted - innerR) / 2, tangentialHalf: ry2 }
}

// corp3 must NOT read smaller than corp2 -- the tissue can visibly contract
// early in the transition (real luteinization involves the collapsed
// follicle condensing before the mature CL forms), but by t2=1 it settles
// back to exactly 1.0 (no extra scaling beyond what fingerSpan's own
// CORP3_CALIBRATION-driven growth already provides -- see below).
function corp3SizeMult(t2: number): number {
  const DIP_T = 0.35, DIP_VAL = 0.90
  if (t2 <= DIP_T) return lerp(1.0, DIP_VAL, smoothstep(t2 / DIP_T))
  return lerp(DIP_VAL, 1.0, smoothstep((t2 - DIP_T) / (1 - DIP_T)))
}

// BUG FOUND during fidelity-pass-2 verification, fixed here: rotating the
// local point (1,0) by rot=toRad(angDeg) gives (cos(rot),sin(rot)) -- the
// lobe's own radial direction. So it's the COS(theta)/lx term that ends up
// radial on screen after rotation, and the SIN(theta)/ly term that ends up
// tangential. regularBeadPoints (first segment) puts rx on the cos/lx term
// -- harmless there since rx and ry are nearly equal (corp1/corp2 beads are
// ~circular). This function's PREVIOUS version put halfSpan (the carefully
// computed corp2->corp3 radial reach) on the sin/ly term instead -- meaning
// all of fingerSpan's elongation math had ZERO effect on the rendered
// shape's actual radial extent, which instead stayed pinned to ~rx2 (a
// roughly-constant ~92-101), regardless of t2. That's why fingers stayed
// round/plump instead of elongating, and why the cavity gap fixes above had
// no visible effect -- confirmed by measuring the live SVG's actual path
// coordinates. Fixed by swapping which term carries cos vs sin.
function fingerPoints(i: number, t2: number, sizeMult: number): Pt[] {
  const { angDeg, centerR, halfSpan, tangentialHalf } = fingerSpan(i, t2)
  const rot = toRad(angDeg)
  const [baseX, baseY] = ringPos(angDeg, centerR, 1.0)

  const tangentialShrinkT2 = lerp(1.0, 0.80, t2) // fingers read a bit slimmer than beads
  const jitterT = lerp(0.09, 0.07, t2)
  const taperMin = taperMinFor(i)

  const pts: Pt[] = jitterVals[i].map((rv, k) => {
    const theta = (2 * Math.PI * k) / 10
    const jr = 1 + (rv - 0.5) * 2 * jitterT
    const innerness = Math.max(0, -Math.cos(theta)) // 1 at the proximal/base point (theta=180deg), 0 at the tip (theta=0)
    const taper = lerp(1.0, taperMin, innerness * t2)
    const lx = halfSpan * Math.cos(theta) * jr
    const ly = tangentialHalf * tangentialShrinkT2 * taper * Math.sin(theta) * jr
    const rxp = lx * Math.cos(rot) - ly * Math.sin(rot)
    const ryp = lx * Math.sin(rot) + ly * Math.cos(rot)
    return [baseX + rxp, baseY + ryp] as Pt
  })
  return pts.map((p) => shrinkPt(p, sizeMult))
}

// Ring of points tracing the cavity's inner boundary -- a plain circle
// (matching corp2's open hole) at t2=0, easing per-angle into corp3's real
// traced CORP3_INNER_PROFILE silhouette (plus the overlap margin) by t2=1.
function cavityRingPoints(t2: number, sizeMult: number): Pt[] {
  const pts: Pt[] = []
  for (let k = 0; k < CAVITY_SAMPLES; k++) {
    const angDeg = (k / CAVITY_SAMPLES) * 360 - 180
    const r = cavityBoundaryR(angDeg, t2)
    pts.push(shrinkPt(ringPos(angDeg, r, 1.0), sizeMult))
  }
  return pts
}

// One spoke endpoint per lobe (15 total, matching corp3.svg's own real
// spoke count) rather than stepping through the 48-sample ring -- gives
// each spoke a clear per-lobe correspondence instead of an arbitrary count.
function cavitySpokeEndpoints(t2: number, sizeMult: number): Pt[] {
  return LOBE_ANGLES.map((angDeg) => {
    const r = cavityBoundaryR(angDeg, t2) * 0.94 // stop just inside the fill edge, not flush with it
    return shrinkPt(ringPos(angDeg, r, 1.0), sizeMult)
  })
}

// Fibrous cavity spokes -- geometry ported from CorpusLuteumRosette.tsx's
// FoldSpokes, but each spoke's curvature/width/reach/angle now carries its
// own irregularity (spokeVar) instead of one uniform formula, and the color
// is lighter per fidelity-pass-2 ("more imperfect and lighter").
function CavitySpokes({ points, rEquiv, opacity }: { points: Pt[]; rEquiv: number; opacity: number }) {
  if (opacity <= 0.01) return null
  const spokes = []
  for (let i = 0; i < points.length; i++) {
    const [ex, ey] = points[i]
    const { curveBend, widthMult, innerFrac, angleJitterDeg } = spokeVar[i]
    const innerR = rEquiv * innerFrac
    const angle = Math.atan2(ey - CY, ex - CX) + toRad(angleJitterDeg)
    const sx = CX + innerR * Math.cos(angle)
    const sy = CY + innerR * Math.sin(angle)
    const mx = CX + (ex - CX) * 0.5 + (ey - CY) * curveBend
    const my = CY + (ey - CY) * 0.5 - (ex - CX) * curveBend
    spokes.push(
      <path
        key={i}
        d={`M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)},${ex.toFixed(1)} ${ey.toFixed(1)}`}
        stroke="#E8C888"
        strokeWidth={rEquiv * 0.018 * widthMult}
        strokeLinecap="round"
        fill="none"
        opacity={opacity * 0.30}
      />
    )
  }
  return <>{spokes}</>
}

// ── public component ────────────────────────────────────────────────────

export interface CorpusLuteumBeadMorphProps {
  cx: number
  cy: number
  R: number
  /**
   * 0 = corp1 (Ovulation Decision, torn crescent)
   * 1 = corp2 (After Release, closed ring)
   * 2 = corp3 (Preparation, finger rosette around a recessed cavity)
   * Covers the FULL corp1->corp2->corp3 morph as one live parametric
   * renderer -- plump 3D tissue at every frame, no flat point-morph and no
   * static-twin crossfade anywhere in the range.
   */
  stage: number
  opacity?: number
  id?: string
}

export default function CorpusLuteumBeadMorph({
  cx, cy, R, stage: stageRaw, opacity = 1, id = 'clbm',
}: CorpusLuteumBeadMorphProps) {
  const stage = Math.max(0, Math.min(2, stageRaw))
  const scale = R / REF_R
  const transform = `translate(${cx} ${cy}) scale(${scale}) translate(${-REF_CX} ${-REF_CY})`

  if (stage > 1) {
    return <CorpusLuteumSecondSegment stage={stage} opacity={opacity} id={id} transform={transform} />
  }

  // ── FIRST SEGMENT: corp1 -> corp2 (unchanged since it shipped) ─────────
  const t = stage
  const stretchXt = lerp(OVAL_STRETCH_X, 1.0, t)

  const beadFillId = `${id}-beadFill`
  const hlGradId = `${id}-hlGrad`
  const shGradId = `${id}-shGrad`
  const creaseGradId = `${id}-creaseGrad`
  const innerRimId = `${id}-innerRimGrad`

  // per-lobe geometry
  const regular = Array.from({ length: N }, (_, i) => i).filter((i) => !GAP_LOBES.has(i))
  const regularPaths = regular.map((i) => ({ i, pts: regularBeadPoints(i, t) }))
  const gapGeoms = Array.from(GAP_LOBES).map((i) => ({ i, geom: gapLobeGeometry(i, t) }))

  // angle used for junction midpoints -- static for regular lobes, closing for gap lobes
  const lobeAngleAt = (i: number) => (GAP_LOBES.has(i) ? gapGeoms.find((g) => g.i === i)!.geom.angT : LOBE_ANGLES[i])

  const junctions = Array.from({ length: N }, (_, k) => {
    const i = k, j = (k + 1) % N
    const isTornSeam = (i === 7 && j === 8) || (i === 8 && j === 7)
    let a1 = lobeAngleAt(i), a2 = lobeAngleAt(j)
    if (a2 < a1) a2 += 360
    const mid = (a1 + a2) / 2
    const [jx, jy] = ringPos(mid, R_CENTER * 0.92, stretchXt)
    return { key: `j${k}`, x: jx, y: jy, mid, opacity: isTornSeam ? t : 1 }
  })

  const innerR = R_CENTER - BASE_R * 0.55

  return (
    <g opacity={opacity} style={{ pointerEvents: 'none' }} transform={transform}>
      <defs>
        <linearGradient id={beadFillId} gradientUnits="userSpaceOnUse" x1="0" y1="19" x2="0" y2="837">
          {CORP1_BEAD_STOPS.map(([off, c1], idx) => (
            <stop key={off} offset={`${off}%`} stopColor={lerpHex(c1, CORP2_BEAD_STOPS[idx][1], t)} />
          ))}
        </linearGradient>
        <radialGradient id={hlGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP1_HL[0], CORP2_HL[0], t)} stopOpacity={0.92} />
          <stop offset="55%" stopColor={lerpHex(CORP1_HL[1], CORP2_HL[1], t)} stopOpacity={0.40} />
          <stop offset="100%" stopColor={lerpHex(CORP1_HL[1], CORP2_HL[1], t)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={shGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP1_SHADOW, CORP2_SHADOW, t)} stopOpacity={lerp(0.38, 0.40, t)} />
          <stop offset="55%" stopColor={lerpHex(CORP1_SHADOW, CORP2_SHADOW, t)} stopOpacity={lerp(0.15, 0.17, t)} />
          <stop offset="100%" stopColor={lerpHex(CORP1_SHADOW, CORP2_SHADOW, t)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={creaseGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP1_CREASE, CORP2_CREASE, t)} stopOpacity={0.16} />
          <stop offset="60%" stopColor={lerpHex(CORP1_CREASE, CORP2_CREASE, t)} stopOpacity={0.07} />
          <stop offset="100%" stopColor={lerpHex(CORP1_CREASE, CORP2_CREASE, t)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={innerRimId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP1_INNER_RIM, CORP2_INNER_RIM, t)} stopOpacity={0} />
          <stop offset="78%" stopColor={lerpHex(CORP1_INNER_RIM, CORP2_INNER_RIM, t)} stopOpacity={0} />
          <stop offset="92%" stopColor={lerpHex(CORP1_INNER_RIM, CORP2_INNER_RIM, t)} stopOpacity={0.10} />
          <stop offset="100%" stopColor={lerpHex(CORP1_INNER_RIM, CORP2_INNER_RIM, t)} stopOpacity={0.16} />
        </radialGradient>

        {regularPaths.map(({ i, pts }) => (
          <clipPath key={`clip${i}`} id={`${id}-beadClip${i}`}><path d={catmullRomClosed(pts)} /></clipPath>
        ))}
        {gapGeoms.map(({ i, geom }) => (
          <clipPath key={`gclip${i}`} id={`${id}-beadClip${i}`}>
            <path d={catmullRomClosed(knobPoints(geom.knobs[0], knobJitter[i][0]))} />
          </clipPath>
        ))}
      </defs>

      <ellipse cx={CX} cy={CY} rx={innerR * stretchXt} ry={innerR} fill={`url(#${innerRimId})`} />

      {/* bead fills */}
      {regularPaths.map(({ i, pts }) => (
        <path key={`bead${i}`} d={catmullRomClosed(pts)} fill={`url(#${beadFillId})`} />
      ))}
      {gapGeoms.map(({ i, geom }) =>
        geom.knobs.map((k, kIdx) => (
          <path
            key={`gbead${i}-${kIdx}`}
            d={catmullRomClosed(knobPoints(k, knobJitter[i][kIdx]))}
            fill={`url(#${beadFillId})`}
            opacity={k.opacity}
          />
        ))
      )}

      {/* creases */}
      {junctions.map((j) => (
        <ellipse
          key={j.key}
          cx={j.x} cy={j.y} rx={14} ry={30}
          fill={`url(#${creaseGradId})`}
          opacity={j.opacity}
          transform={`rotate(${j.mid.toFixed(1)} ${j.x.toFixed(1)} ${j.y.toFixed(1)})`}
        />
      ))}

      {/* shadows */}
      {regularPaths.map(({ i }) => {
        const angDeg = LOBE_ANGLES[i]
        const stretchXtLocal = stretchXt
        const [bx, by] = ringPos(angDeg, R_CENTER, stretchXtLocal)
        const [rx, ry] = ballRadii[i]
        const hs = highlightShadowFor(bx, by, angDeg, rx, ry, i, t)
        return (
          <g key={`sh${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse cx={hs.sh[0]} cy={hs.sh[1]} rx={hs.shRx} ry={hs.shRy} fill={`url(#${shGradId})`} />
          </g>
        )
      })}
      {gapGeoms.map(({ i, geom }) => {
        const k0 = geom.knobs[0]
        const hs = highlightShadowFor(k0.cx, k0.cy, geom.lightDirDeg, k0.rx, k0.ry, i, t)
        return (
          <g key={`gsh${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse cx={hs.sh[0]} cy={hs.sh[1]} rx={hs.shRx} ry={hs.shRy} fill={`url(#${shGradId})`} />
          </g>
        )
      })}

      {/* highlights */}
      {regularPaths.map(({ i }) => {
        const angDeg = LOBE_ANGLES[i]
        const [bx, by] = ringPos(angDeg, R_CENTER, stretchXt)
        const [rx, ry] = ballRadii[i]
        const hs = highlightShadowFor(bx, by, angDeg, rx, ry, i, t)
        return (
          <g key={`hl${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse
              cx={hs.hl[0]} cy={hs.hl[1]} rx={hs.hlRx} ry={hs.hlRy}
              fill={`url(#${hlGradId})`} opacity={0.9}
              transform={`rotate(${hs.hlRot.toFixed(1)} ${hs.hl[0].toFixed(1)} ${hs.hl[1].toFixed(1)})`}
            />
          </g>
        )
      })}
      {gapGeoms.map(({ i, geom }) => {
        const k0 = geom.knobs[0]
        const hs = highlightShadowFor(k0.cx, k0.cy, geom.lightDirDeg, k0.rx, k0.ry, i, t)
        return (
          <g key={`ghl${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse
              cx={hs.hl[0]} cy={hs.hl[1]} rx={hs.hlRx} ry={hs.hlRy}
              fill={`url(#${hlGradId})`} opacity={0.9}
              transform={`rotate(${hs.hlRot.toFixed(1)} ${hs.hl[0].toFixed(1)} ${hs.hl[1].toFixed(1)})`}
            />
          </g>
        )
      })}
    </g>
  )
}

// ── SECOND SEGMENT: corp2 -> corp3 (fingers + recessed cavity) ───────────
// stage in (1,2], t2 = stage-1 in (0,1]. At t2=0 every quantity here is
// mathematically identical to the first segment's own corp2 endpoint (see
// fingerPoints' header note), so the hinge at stage=1 is seamless.
function CorpusLuteumSecondSegment({
  stage, opacity, id, transform,
}: { stage: number; opacity: number; id: string; transform: string }) {
  const t2 = stage - 1
  const sizeMult = corp3SizeMult(t2)
  const rEquiv = REF_R * sizeMult

  const beadFillId = `${id}-beadFill`
  const hlGradId = `${id}-hlGrad`
  const shGradId = `${id}-shGrad`
  const cavityGradId = `${id}-cavityGrad`

  const fingers = Array.from({ length: N }, (_, i) => ({ i, pts: fingerPoints(i, t2, sizeMult) }))

  const cavityPts = cavityRingPoints(t2, sizeMult)
  const spokePts = cavitySpokeEndpoints(t2, sizeMult)
  // Cavity/fold-spoke fade curves ported verbatim from the legacy second-
  // half rendering in CorpusLuteumRosette.tsx (cavityOpacity / foldOpacity).
  const cavityOpacity = Math.max(0, (t2 - 0.04) / 0.96) * 0.90
  const foldOpacity = Math.max(0, (t2 - 0.15) / 0.85)

  return (
    <g opacity={opacity} style={{ pointerEvents: 'none' }} transform={transform}>
      <defs>
        <linearGradient id={beadFillId} gradientUnits="userSpaceOnUse" x1="0" y1="19" x2="0" y2="837">
          {CORP2_BEAD_STOPS.map(([off2, c2], idx) => {
            const [off3, c3] = CORP3_BEAD_STOPS[idx]
            return <stop key={idx} offset={`${lerp(off2, off3, t2)}%`} stopColor={lerpHex(c2, c3, t2)} />
          })}
        </linearGradient>
        <radialGradient id={hlGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP2_HL[0], CORP3_HL[0], t2)} stopOpacity={0.92} />
          <stop offset="55%" stopColor={lerpHex(CORP2_HL[1], CORP3_HL[1], t2)} stopOpacity={0.40} />
          <stop offset="100%" stopColor={lerpHex(CORP2_HL[1], CORP3_HL[1], t2)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={shGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lerpHex(CORP2_SHADOW, CORP3_SHADOW, t2)} stopOpacity={lerp(0.40, CORP3_SHADOW_CORE_OP, t2)} />
          <stop offset="55%" stopColor={lerpHex(CORP2_SHADOW, CORP3_SHADOW, t2)} stopOpacity={lerp(0.17, CORP3_SHADOW_MID_OP, t2)} />
          <stop offset="100%" stopColor={lerpHex(CORP2_SHADOW, CORP3_SHADOW, t2)} stopOpacity={0} />
        </radialGradient>
        {/* Ported verbatim (colors + geometry) from the legacy `${id}-cavity` gradient. */}
        <radialGradient id={cavityGradId} cx="42%" cy="38%" r="62%">
          {CAVITY_STOPS.map(([off, c]) => (
            <stop key={off} offset={`${off}%`} stopColor={c} />
          ))}
        </radialGradient>
        {fingers.map(({ i, pts }) => (
          <clipPath key={`clip${i}`} id={`${id}-beadClip${i}`}><path d={catmullRomClosed(pts)} /></clipPath>
        ))}
      </defs>

      {/* finger bodies */}
      {fingers.map(({ i, pts }) => (
        <path key={`finger${i}`} d={catmullRomClosed(pts)} fill={`url(#${beadFillId})`} />
      ))}

      {/* recessed cavity: fill + stroke + fibrous spokes, ported from the legacy
          (the legacy's separate unclipped "deepening shadow" ellipse is NOT
          ported -- it relied on the legacy's single evenodd body path to hide
          it behind solid tissue except through the cavity hole; here it would
          float on top of the finger fills and the gaps between them as a
          visible stray oval, so it's dropped rather than adapted) */}
      {cavityOpacity > 0.01 && (
        <>
          <path d={catmullRomClosed(cavityPts)} fill={`url(#${cavityGradId})`} opacity={cavityOpacity} />
          <path
            d={catmullRomClosed(cavityPts)}
            fill="none" stroke={CAVITY_STROKE}
            strokeWidth={rEquiv * 0.035} strokeOpacity={cavityOpacity * 0.4}
          />
        </>
      )}
      <CavitySpokes points={spokePts} rEquiv={rEquiv} opacity={foldOpacity} />

      {/* finger shadows */}
      {fingers.map(({ i }) => {
        const { angDeg, centerR, halfSpan, tangentialHalf } = fingerSpan(i, t2)
        const [bx, by] = ringPos(angDeg, centerR, 1.0)
        const hs = highlightShadowFor(bx, by, angDeg, halfSpan, tangentialHalf * lerp(1, 0.8, t2), i, 1)
        const [shx, shy] = shrinkPt(hs.sh, sizeMult)
        return (
          <g key={`sh${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse cx={shx} cy={shy} rx={hs.shRx * sizeMult} ry={hs.shRy * sizeMult} fill={`url(#${shGradId})`} />
          </g>
        )
      })}

      {/* finger highlights -- corp3's own highlights read 15% smaller than
          corp2's, eased in continuously across the morph (exactly 1.0, i.e.
          no change, at t2=0) so only the highlight SIZE differs; nothing
          else about the corp2->corp3 transition is touched. */}
      {fingers.map(({ i }) => {
        const { angDeg, centerR, halfSpan, tangentialHalf } = fingerSpan(i, t2)
        const [bx, by] = ringPos(angDeg, centerR, 1.0)
        const hs = highlightShadowFor(bx, by, angDeg, halfSpan, tangentialHalf * lerp(1, 0.8, t2), i, 1)
        const [hlx, hly] = shrinkPt(hs.hl, sizeMult)
        const highlightShrink = lerp(1.0, 0.85, t2)
        return (
          <g key={`hl${i}`} clipPath={`url(#${id}-beadClip${i})`}>
            <ellipse
              cx={hlx} cy={hly} rx={hs.hlRx * sizeMult * highlightShrink} ry={hs.hlRy * sizeMult * highlightShrink}
              fill={`url(#${hlGradId})`} opacity={0.9}
              transform={`rotate(${hs.hlRot.toFixed(1)} ${hlx.toFixed(1)} ${hly.toFixed(1)})`}
            />
          </g>
        )
      })}
    </g>
  )
}
