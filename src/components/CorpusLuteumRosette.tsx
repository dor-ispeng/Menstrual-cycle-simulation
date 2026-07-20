'use client'

import Corp1Lobes from './Corp1Lobes'
import Corp2Lobes from './Corp2Lobes'
import Corp3Lobes from './Corp3Lobes'
import CorpusLuteumBeadMorph from './CorpusLuteumBeadMorph'

// EXPERIMENT (Option C prototype): when true, the ENTIRE stageT 0->2 range
// is rendered by CorpusLuteumBeadMorph -- one live parametric renderer that
// is the plump 3D tissue at every frame (fingers + a recessed cavity by
// corp3), with no flatter point-morph fallback and no static-twin crossfade
// anywhere, including the corp3 rest state itself (no terminal crossfade to
// Corp3Lobes). Flip to false to instantly revert to the original
// three-system rendering below, byte-for-byte. Corp1Lobes/Corp2Lobes/
// Corp3Lobes stay imported for that flag-off path and for A/B comparison.
const PARAMETRIC_MORPH = true

// ── Corpus luteum rosette ────────────────────────────────────────────────────
// Reusable, animatable inline-SVG component covering all three post-ovulation
// luteal stages as ONE continuously-morphing structure:
//   corp1 (corpus hemorrhagicum, fully formed at Ovulation Decision)
//   → corp2 (forming ring, fully formed at After Release)
//   → corp3 (mature rosette, fully formed at Preparation)
//
// All three shapes' silhouettes (CORP1_SHAPE/CORP2_SHAPE/CORP3_NEW_SHAPE, see
// "derived morph profiles" below) are 96-sample polar profiles derived
// directly from each stage's CURRENT approved artwork by an offline script
// (derive_morph_shapes.py) — corp1/corp2 by re-running their bead-generator
// math, corp3 by parsing SVG/corp3.svg directly — sharing the same 15-lobe
// angular skeleton and the same SAMPLES resolution, so `stageT` performs a
// genuine point-by-point interpolation of one CURRENT silhouette into the
// next — the tissue reads as forming/twisting/thickening inward, not as
// images crossfading. corp1's real opening (where its two frayed knob
// clusters leave a gap) tapers smoothly to zero width at each tip (no
// polygonal pinch); that taper is what visibly "closes" into corp2's full
// ring as the corp1→corp2 morph proceeds. Colour, cavity fill, fold texture
// and highlight placement are all driven by the same stage parameter.
//
// corp1 and corp2 each also have a redesigned, hand-tuned static-markup twin
// (Corp1Lobes / Corp2Lobes — plump individually-shaded bead rings, generated
// offline from SVG/corp1.svg / SVG/corp2.svg exactly like Corp3Lobes was),
// which takes over from the legacy rendering above only right at that
// shape's own resting stage — corp1Weight / corp2LobesWeight below, the same
// crossfade technique corp3Weight already uses for corp3. The legacy
// point-morph keeps driving every transitional (in-between) frame, so the
// continuous forming/twisting/thickening animation is untouched; the redesigned
// art only ever appears once a stage has (nearly) fully arrived.

type Pt = [number, number]

// ── geometry helpers ─────────────────────────────────────────────────────

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

// Open (non-wrapping) Catmull-Rom — for stroking an arc segment without
// closing it back on itself, so a boundary can be split at a gap without a
// stray line cutting across the opening.
function catmullRomOpen(pts: Pt[]): string {
  const n = pts.length
  if (n < 2) return ''
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x.toFixed(1)} ${cp1y.toFixed(1)},${cp2x.toFixed(1)} ${cp2y.toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
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

const SAMPLES = 96

interface ShapeData {
  outerProfile: number[]
  innerProfile: number[]
  highlights: { angle: number; rFrac: number }[]
  /** Index range (into the SAMPLES-length profile arrays) of a real open
   *  gap, if this shape has one — only corp1's crescent does. */
  gapRange?: [number, number]
}

// Circular 1-2-1 moving-average — softens the sharp local corners that
// nearest-angle resampling of a hand-traced polygon introduces (each vertex
// becomes a hard V in the profile) into rounded bumps, without discarding
// the traced silhouette's actual lobe count/placement.
function smoothProfileCircular(profile: number[], passes: number): number[] {
  let p = profile
  const n = p.length
  for (let pass = 0; pass < passes; pass++) {
    const next = new Array(n)
    for (let i = 0; i < n; i++) {
      next[i] = (p[(i - 1 + n) % n] + p[i] * 2 + p[(i + 1) % n]) / 4
    }
    p = next
  }
  return p
}

// Cubic ease, zero slope at both ends — used everywhere a value needs to
// ease smoothly between two states with no corner (C1-continuous), instead
// of a linear ramp or a hard cutoff.
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

// ── derived morph profiles (SVG/corp1.svg, SVG/corp2.svg, SVG/corp3.svg) ──
// 96-sample polar radius/refR profiles, generated offline (derive_morph_shapes.py)
// directly from each stage's CURRENT approved artwork -- corp1/corp2 by
// re-running the same bead-generator math the SVGs themselves come from,
// corp3 by parsing SVG/corp3.svg's 15 lobeClip paths + cavityClip path --
// then envelope-sampling (max/min radius per angular bin) around the shared
// (477,428) centre. All three sit on the SAME 15-lobe angular skeleton, so
// sample i means the same angle in every shape and the point-morph below is
// a genuine point-by-point deform between the CURRENT designs, not stale
// placeholder silhouettes. corp1's real opening (where the frayed knob
// clusters leave a gap) is preserved as CORP1_GAP_RANGE, tapering to a true
// zero-width pinch there exactly like the crescent this replaces did.

const CORP1_OUTER_PROFILE: number[] = [
  1.06405, 1.06066, 1.04451, 1.04929, 1.05791, 1.05702, 1.01957, 0.97384,
  0.98864, 1.01635, 1.01850, 1.01112, 0.98574, 0.94113, 0.93134, 0.96527,
  0.98740, 0.98773, 0.97321, 0.94481, 0.91243, 0.86297, 0.91057, 0.95656,
  0.96736, 0.97096, 0.97663, 0.98365, 0.98400, 0.97259, 0.91950, 0.95390,
  0.98415, 0.99719, 1.00404, 1.00635, 1.00573, 0.98315, 1.01814, 1.03240,
  1.04345, 1.03938, 1.02607, 0.98410, 0.93697, 0.81565, 0.79067, 0.78484,
  0.78232, 0.78202, 0.81593, 0.91175, 0.97449, 1.01462, 1.04147, 1.04848,
  1.03484, 1.03464, 0.99751, 0.98119, 1.00428, 1.00921, 1.00925, 1.00689,
  0.99716, 0.96382, 0.94393, 0.96247, 0.97033, 0.96978, 0.95146, 0.92036,
  0.88859, 0.84328, 0.90995, 0.95016, 0.96839, 0.97574, 0.97578, 0.96586,
  0.94384, 0.91435, 0.93321, 0.96071, 1.01397, 1.04416, 1.04428, 1.03210,
  1.00672, 1.03209, 1.04049, 1.04072, 1.03144, 1.00380, 1.03004, 1.05861,
]
const CORP1_INNER_PROFILE: number[] = [
  0.58525, 0.58975, 0.57005, 0.55753, 0.55440, 0.55680, 0.57842, 0.57058,
  0.55643, 0.55165, 0.55183, 0.55859, 0.57092, 0.58617, 0.57121, 0.56344,
  0.56040, 0.55920, 0.55957, 0.56437, 0.57917, 0.55761, 0.54203, 0.53632,
  0.53544, 0.53593, 0.53829, 0.54152, 0.54707, 0.55863, 0.58102, 0.58247,
  0.54301, 0.52093, 0.51271, 0.51311, 0.52531, 0.55505, 0.60012, 0.61126,
  0.64181, 0.68639, 0.73785, 0.78264, 0.82024, 0.78072, 0.78405, 0.78484,
  0.78232, 0.77757, 0.78266, 0.80751, 0.77606, 0.71672, 0.65540, 0.60620,
  0.57237, 0.55830, 0.56456, 0.57867, 0.56704, 0.56248, 0.56147, 0.56212,
  0.56749, 0.56177, 0.54202, 0.52885, 0.52312, 0.52158, 0.52175, 0.52564,
  0.53512, 0.55031, 0.55055, 0.52441, 0.50905, 0.50253, 0.50248, 0.51204,
  0.53570, 0.57288, 0.59154, 0.56650, 0.55247, 0.54733, 0.54705, 0.55072,
  0.56059, 0.57984, 0.57690, 0.57342, 0.57351, 0.57698, 0.58651, 0.58495,
]
const CORP1_GAP_RANGE: [number, number] = [47, 48]
const CORP1_GLINTS: { angle: number; rFrac: number }[] = [
  { angle: -3.11192, rFrac: 0.74635 },
  { angle: -2.79078, rFrac: 0.74635 },
  { angle: -2.43822, rFrac: 0.74635 },
  { angle: -2.00015, rFrac: 0.74635 },
  { angle: -1.43990, rFrac: 0.74635 },
  { angle: -0.92328, rFrac: 0.74635 },
  { angle: -0.49393, rFrac: 0.74635 },
  { angle: 0.54105, rFrac: 0.74635 },
  { angle: 0.97738, rFrac: 0.74635 },
  { angle: 1.39626, rFrac: 0.74635 },
  { angle: 1.93732, rFrac: 0.74635 },
  { angle: 2.43648, rFrac: 0.74635 },
  { angle: 2.81696, rFrac: 0.74635 },
]
const CORP2_OUTER_PROFILE: number[] = [
  1.02916, 1.02681, 1.01295, 1.01492, 1.02953, 1.03020, 1.01686, 0.98525,
  0.97682, 1.00614, 1.01819, 1.01786, 1.00592, 0.97979, 0.95138, 0.98590,
  1.01145, 1.01709, 1.01305, 0.99172, 0.96180, 0.91816, 0.94333, 0.99244,
  1.00870, 1.01349, 1.01525, 1.01519, 1.00626, 0.96545, 0.95278, 0.99186,
  1.00994, 1.01662, 1.01701, 1.01501, 1.00179, 0.97122, 0.99534, 1.00875,
  1.01054, 1.00736, 0.99202, 1.00994, 1.02889, 1.03250, 1.03097, 1.01692,
  1.00293, 1.01488, 1.01878, 1.01891, 1.01648, 1.00073, 0.99112, 1.00232,
  1.00371, 1.00294, 0.99601, 0.96740, 1.00468, 1.01995, 1.02448, 1.02445,
  1.01940, 1.00069, 0.96535, 0.99528, 1.01057, 1.01150, 1.00322, 0.97493,
  0.93529, 0.90627, 0.96730, 0.99525, 1.00820, 1.01031, 1.00710, 0.99096,
  0.96069, 0.93635, 0.96279, 1.00025, 1.03137, 1.03501, 1.03044, 1.00954,
  0.99457, 1.01372, 1.01819, 1.01780, 1.00442, 0.97464, 1.00349, 1.02489,
]
const CORP2_INNER_PROFILE: number[] = [
  0.53782, 0.54035, 0.54600, 0.52813, 0.52218, 0.52210, 0.52804, 0.54752,
  0.54702, 0.53731, 0.53428, 0.53506, 0.54187, 0.55831, 0.58014, 0.56632,
  0.56088, 0.56004, 0.56064, 0.56576, 0.57718, 0.60187, 0.57172, 0.55896,
  0.55342, 0.55278, 0.55312, 0.55661, 0.56728, 0.58321, 0.58100, 0.54796,
  0.52708, 0.51845, 0.51852, 0.52736, 0.54780, 0.58014, 0.56879, 0.56214,
  0.56115, 0.56213, 0.56880, 0.54475, 0.52936, 0.52620, 0.52688, 0.53449,
  0.55314, 0.55974, 0.55864, 0.55832, 0.55884, 0.55396, 0.53400, 0.52486,
  0.52339, 0.52483, 0.53337, 0.54884, 0.56617, 0.55702, 0.55412, 0.55420,
  0.55793, 0.56806, 0.56437, 0.55010, 0.54295, 0.54205, 0.54275, 0.54952,
  0.56389, 0.58965, 0.56012, 0.53789, 0.52697, 0.52464, 0.52713, 0.53873,
  0.56650, 0.57889, 0.55553, 0.53911, 0.53214, 0.53115, 0.53348, 0.54218,
  0.55681, 0.54110, 0.53495, 0.53412, 0.53601, 0.54357, 0.54156, 0.53790,
]
const CORP2_GLINTS: { angle: number; rFrac: number }[] = [
  { angle: -3.11192, rFrac: 0.77842 },
  { angle: -2.79078, rFrac: 0.77842 },
  { angle: -2.43822, rFrac: 0.77842 },
  { angle: -2.00015, rFrac: 0.77842 },
  { angle: -1.43990, rFrac: 0.77842 },
  { angle: -0.92328, rFrac: 0.77842 },
  { angle: -0.49393, rFrac: 0.77842 },
  { angle: -0.16406, rFrac: 0.77842 },
  { angle: 0.16581, rFrac: 0.77842 },
  { angle: 0.54105, rFrac: 0.77842 },
  { angle: 0.97738, rFrac: 0.77842 },
  { angle: 1.39626, rFrac: 0.77842 },
  { angle: 1.93732, rFrac: 0.77842 },
  { angle: 2.43648, rFrac: 0.77842 },
  { angle: 2.81696, rFrac: 0.77842 },
]
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

const CORP1_SHAPE: ShapeData = {
  outerProfile: CORP1_OUTER_PROFILE,
  innerProfile: CORP1_INNER_PROFILE,
  highlights: CORP1_GLINTS,
  gapRange: CORP1_GAP_RANGE,
}
const CORP2_SHAPE: ShapeData = {
  outerProfile: CORP2_OUTER_PROFILE,
  innerProfile: CORP2_INNER_PROFILE,
  highlights: CORP2_GLINTS,
}
// Light circular smoothing softens residual 96-bin quantization noise from
// envelope-sampling without losing the lobe count/placement -- same
// technique the old traced corp3 used.
const CORP3_NEW_SHAPE: ShapeData = {
  outerProfile: smoothProfileCircular(CORP3_OUTER_PROFILE, 2),
  innerProfile: smoothProfileCircular(CORP3_INNER_PROFILE, 2),
  highlights: [],
}

// ── gradient stop palettes (kept consistent with the rest of AnatomyLayer) ─

// Matches Corp1Lobes' cream bead palette (#FFFBEA -> #F8ECC4 -> #EDD89E -> #DEC17C).
const CORP1_OUTER_STOPS: [number, string][] = [
  [0, '#FFFBEA'], [25, '#F8ECC4'], [50, '#EDD89E'], [75, '#E0C48A'], [100, '#DEC17C'],
]
// Radial, inner-edge-out: lightest right where the band starts at the
// cavity hole, darkening steadily out to the outer rim — gives the ring's
// tube cross-section a rounded, non-flat read instead of one flat fill.
// Matches Corp2Lobes' lemon bead palette (#FFF3A0 -> #F9DE5E -> #EFC53E -> #DFA92A).
const CORP2_OUTER_STOPS: [number, string][] = [
  [0, '#FFF3A0'], [25, '#F9DE5E'], [50, '#F2D24E'], [75, '#EFC53E'], [100, '#DFA92A'],
]
const CORP2_RIM = '#DFA92A'
// Matches Corp3Lobes' lobeBaseShared gradient (#FBE49C -> #F3D073 -> #E8B94E -> #D89F3A).
const CORP3_OUTER_STOPS: [number, string][] = [
  [0, '#FBE49C'], [25, '#F6DA88'], [50, '#F3D073'], [75, '#E8B94E'], [100, '#D89F3A'],
]

// ── shape → path ─────────────────────────────────────────────────────────

function profileToPoints(cx: number, cy: number, R: number, profile: number[]): Pt[] {
  const n = profile.length
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2 - Math.PI
    // Small fixed high-frequency ripple so the traced silhouette reads as
    // hand-painted, twisting tissue rather than a perfect vector trace.
    const wobble = 1 + 0.012 * Math.sin(7 * theta + 1.3)
    const r = R * profile[i] * wobble
    pts.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)])
  }
  return pts
}

function lerpProfile(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t)
}

// Splits a closed ring of points at [gapLo, gapHi] into two open arcs — the
// gap span itself, and everything else (wrapping around through index 0)
// as one continuous arc — so the gap span can be stroked separately (and
// faded independently) instead of drawing one unbroken line around a shape
// that has a real opening in it.
function splitAtGap(pts: Pt[], gapLo: number, gapHi: number): { main: Pt[]; gap: Pt[] } {
  return {
    main: [...pts.slice(gapHi + 1), ...pts.slice(0, gapLo + 1)],
    gap: pts.slice(gapLo, gapHi + 1),
  }
}

// ── fold texture (corp2→corp3 fibrous striations) ─────────────────────────

function FoldSpokes({ cx, cy, R, innerPts, opacity }: { cx: number; cy: number; R: number; innerPts: Pt[]; opacity: number }) {
  if (opacity <= 0.01) return null
  const step = 8
  const spokes = []
  for (let i = 0; i < innerPts.length; i += step) {
    const [ex, ey] = innerPts[i]
    const innerR = R * (0.07 + 0.05 * Math.abs(Math.sin(i * 1.7)))
    const angle = Math.atan2(ey - cy, ex - cx)
    const sx = cx + innerR * Math.cos(angle)
    const sy = cy + innerR * Math.sin(angle)
    const mx = cx + (ex - cx) * 0.5 + (ey - cy) * 0.06
    const my = cy + (ey - cy) * 0.5 - (ex - cx) * 0.06
    spokes.push(
      <path
        key={i}
        d={`M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)},${ex.toFixed(1)} ${ey.toFixed(1)}`}
        stroke="#C08850"
        strokeWidth={R * 0.018}
        strokeLinecap="round"
        fill="none"
        opacity={opacity * 0.42}
      />
    )
  }
  return <>{spokes}</>
}

// ── dimple shadows (corp2 only) ────────────────────────────────────────────
// Each lobe's highlight sits in a shallow dimple, not on a flat surface —
// corp2_ref.png shows a soft, irregularly-shaped shadow tucked just below
// every sheen spot, one per bump around the ring, instead of a single
// uniform corner shadow. This builds that same organic (non-circular) blob
// via a closed Catmull-Rom spline through a wobbled ring of points, sized
// larger than the highlight ellipse it sits under so it peeks out around it.
function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const N = 9
  const pts: Pt[] = []
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2
    const wobble = 1 + 0.22 * Math.sin(theta * 2.3 + seed) + 0.14 * Math.cos(theta * 3.7 + seed * 1.7)
    pts.push([cx + rx * wobble * Math.cos(theta), cy + ry * wobble * Math.sin(theta)])
  }
  return catmullRomClosed(pts)
}

function DimpleShadows({ cx, cy, R, shape, opacity }: { cx: number; cy: number; R: number; shape: ShapeData; opacity: number }) {
  if (opacity <= 0.01) return null
  return (
    <>
      {shape.highlights.map((h, i) => {
        const hx = cx + R * h.rFrac * Math.cos(h.angle)
        const hy = cy + R * h.rFrac * Math.sin(h.angle)
        // Offset toward lower-right of the highlight (away from the
        // upper-left light bias) so the shadow reads as the dimple's far
        // wall, with the highlight sitting on its near/lit edge.
        const sx = hx + R * 0.028 * Math.cos(h.angle + 0.7)
        const sy = hy + R * 0.028 * Math.sin(h.angle + 0.7) + R * 0.018
        const lit = (Math.cos(h.angle + Math.PI * 0.75) + 1) / 2
        return (
          <path
            key={i}
            d={blobPath(sx, sy, R * 0.10, R * 0.082, i * 1.37)}
            fill="#C9A034"
            opacity={opacity * (0.30 + (1 - lit) * 0.30)}
          />
        )
      })}
    </>
  )
}

// ── surface sheen glints ───────────────────────────────────────────────────

function HighlightGlints({ cx, cy, R, shape, opacity, tint }: { cx: number; cy: number; R: number; shape: ShapeData; opacity: number; tint: string }) {
  if (opacity <= 0.01) return null
  return (
    <>
      {shape.highlights.map((h, i) => {
        const hx = cx + R * h.rFrac * Math.cos(h.angle)
        const hy = cy + R * h.rFrac * Math.sin(h.angle)
        // Upper-left lighting bias, consistent with the rest of the scene.
        const lit = (Math.cos(h.angle + Math.PI * 0.75) + 1) / 2
        return (
          <ellipse
            key={i}
            cx={hx} cy={hy}
            rx={R * 0.075} ry={R * 0.06}
            fill={tint}
            opacity={opacity * (0.32 + lit * 0.5)}
          />
        )
      })}
    </>
  )
}

// ── public component ───────────────────────────────────────────────────────

export interface CorpusLuteumRosetteProps {
  cx: number
  cy: number
  R: number
  /**
   * 0 → corp1 (Ovulation Decision) fully formed
   * 1 → corp2 (After Release) fully formed
   * 2 → corp3 (Preparation) fully formed
   * Values in between continuously morph the two adjacent shapes/colours —
   * one structure twisting and thickening into the next, never crossfading.
   */
  stageT: number
  opacity?: number
  /** Unique id fragment so multiple instances don't clash on gradient ids. */
  id?: string
}

export default function CorpusLuteumRosette({
  cx, cy, R, stageT, opacity = 1, id = 'cl',
}: CorpusLuteumRosetteProps) {
  const stage = Math.max(0, Math.min(2, stageT))

  // Option C prototype hand-off: the entire stage range is owned by the
  // live parametric renderer below (no legacy point-morph, no static
  // Corp1Lobes/Corp2Lobes/Corp3Lobes twins, no terminal crossfade at corp3).
  // Flag off falls through to the untouched original rendering unchanged.
  if (PARAMETRIC_MORPH) {
    return <CorpusLuteumBeadMorph cx={cx} cy={cy} R={R} stage={stage} opacity={opacity} id={id} />
  }

  const inFirstHalf = stage <= 1
  const shapeA = inFirstHalf ? CORP1_SHAPE : CORP2_SHAPE
  const shapeB = inFirstHalf ? CORP2_SHAPE : CORP3_NEW_SHAPE
  const stopsA = inFirstHalf ? CORP1_OUTER_STOPS : CORP2_OUTER_STOPS
  const stopsB = inFirstHalf ? CORP2_OUTER_STOPS : CORP3_OUTER_STOPS
  // corp2's rim matches its own gradient's outer-edge stop (no visible
  // outline at that endpoint), while corp1's and corp3's rim colours are
  // untouched.
  const rimA = inFirstHalf ? '#DEC17C' : CORP2_RIM
  const rimB = inFirstHalf ? CORP2_RIM : '#B09020'
  const tintA = inFirstHalf ? '#FFFBEA' : '#FFFFF0'
  const tintB = inFirstHalf ? '#FFFFF0' : '#F9E982'
  const localT = inFirstHalf ? stage : stage - 1
  // corp3 renders 30% smaller than corp1/corp2 — eased in continuously
  // across corp2→corp3 (not a size jump-cut at the crossfade) so it reads
  // as the same kind of shrink-and-reshape the tissue already does through
  // corp1→corp2, rather than a discontinuity. Unchanged (=R) through
  // corp1→corp2, exactly R*0.7 at corp3 (Preparation, stage 2).
  const localR = inFirstHalf ? R : R * (1 - 0.3 * localT)

  const outerProfile = lerpProfile(shapeA.outerProfile, shapeB.outerProfile, localT)
  const innerProfile = lerpProfile(shapeA.innerProfile, shapeB.innerProfile, localT)
  const outerPts = profileToPoints(cx, cy, localR, outerProfile)
  const innerPts = profileToPoints(cx, cy, localR, innerProfile)
  const d = catmullRomClosed(outerPts) + ' ' + catmullRomClosed(innerPts)

  // corp1's crescent has a real opening — while it's still (partly) open,
  // the rim shouldn't trace a continuous line across it, or the gap reads
  // as a closed ring with a lighter centre instead of an actual opening.
  // Stroke that span separately, faded by how much the opening has closed
  // (localT: 0 = fully open/transparent at pure corp1, 1 = fully closed —
  // matching corp2, which has no gap left to hide).
  const gapRange = inFirstHalf ? CORP1_SHAPE.gapRange : undefined

  const rimStroke = lerpHex(rimA, rimB, localT)
  // Fibrous scar tissue (cavity fill / fold texture) only appears as the CL
  // matures past corp2 into corp3 — absent through corp1 and the corp1→corp2
  // segment.
  const corp2to3T = inFirstHalf ? 0 : localT
  const cavityOpacity = Math.max(0, (corp2to3T - 0.04) / 0.96) * 0.90
  const foldOpacity = Math.max(0, (corp2to3T - 0.15) / 0.85)
  // Overall maturity (0 at corp1 → 1 at corp3) drives shadow depth and rim
  // weight continuously across all three stages (no per-segment resets).
  const maturity = stage / 2
  // 1 exactly at corp2, ramping to 0 at corp1 and corp3 — scopes the dimpled
  // per-lobe shading to corp2 only, leaving the corp1/corp3 endpoints (where
  // this is 0) untouched.
  const corp2Weight = Math.max(0, 1 - Math.abs(stage - 1))
  // corp1/corp3 keep the shared upper-left-biased gradient centre (33%,25%);
  // corp2 eases it toward the shape's own centre so the radial fill actually
  // originates at the inner (cavity) edge and radiates out to the rim,
  // rather than reading as a generic top-left sphere highlight.
  const outerGradCx = 33 + (50 - 33) * corp2Weight
  const outerGradCy = 25 + (50 - 25) * corp2Weight
  const outerGradR = 71 + (58 - 71) * corp2Weight
  // 1 throughout corp1→corp2 (both endpoints, and every shape between them,
  // are the crescent/ring with a genuinely open centre), ramping back to 0
  // across corp2→corp3 so corp3's own shadow/highlight rendering — which
  // relies on the separate, already-clipped cavity fill instead — is left
  // byte-for-bit unchanged.
  const fixWeight = inFirstHalf ? 1 : 1 - localT
  // The redesigned corp3 (Corp3Lobes — see that file) takes over from the
  // legacy point-morph rendering only right at the end of corp2→corp3: 0
  // through corp1→corp2 and the first 80% of corp2→corp3 (so corp1/corp2
  // are completely untouched — same code path, same values, and almost the
  // entire corp2→corp3 transition still genuinely morphs point-by-point
  // into CORP3_NEW_SHAPE — same silhouette Corp3Lobes itself renders,
  // traced from its own lobes/cavity — the way corp1→corp2 always has),
  // easing in over the last 20% to reach 1 exactly at corp3 (Preparation,
  // stage 2), where it hands off to Corp3Lobes' per-lobe streak highlights
  // and cavity spokes for the crisp final detail. The legacy rendering
  // below fades out in lockstep so the two crossfade instead of
  // double-exposing.
  const corp3Weight = inFirstHalf ? 0 : smoothstep((localT - 0.8) / 0.2)
  // The redesigned corp1 (Corp1Lobes — plump cream bead ring, torn open at
  // the rupture point) takes over from the legacy procedural crescent only
  // right at its own resting stage: 1 exactly at stage 0 (Ovulation
  // Decision), easing back to 0 by 20% of the way into the corp1→corp2
  // morph. Unlike corp3Weight this endpoint has nothing "before" it to stay
  // continuous with, so a full takeover in that opening window is safe —
  // mirroring corp3Weight's own one-sided ease, just at the other end of the
  // timeline. Zero for the entire corp2→corp3 segment.
  const corp1Weight = inFirstHalf ? smoothstep((0.2 - localT) / 0.2) : 0
  // The redesigned corp2 (Corp2Lobes — plump lemon-yellow bead ring) takes
  // over only in a narrow window right at its own resting stage (stage
  // exactly 1, i.e. After Release): unlike corp1/corp3, which sit at the
  // very ends of the timeline, corp2 is a mid-point with genuine morphing on
  // *both* sides (corp1→corp2 and corp2→corp3), so a wide takeover here
  // would break the continuous-morph illusion on one side or the other. A
  // narrow ±15%-of-a-stage tent keeps it a brief crossfade exactly at rest,
  // handing back to the legacy point-morph immediately as either transition
  // begins.
  const corp2LobesWeight = smoothstep((0.15 - Math.abs(stage - 1)) / 0.15)

  return (
    <>
    <g
      opacity={opacity * (1 - corp3Weight) * (1 - corp1Weight) * (1 - corp2LobesWeight)}
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        <radialGradient id={`${id}-outer`} cx={`${outerGradCx}%`} cy={`${outerGradCy}%`} r={`${outerGradR}%`}>
          {stopsA.map(([o, ca], i) => (
            <stop key={o} offset={`${o}%`} stopColor={lerpHex(ca, stopsB[i][1], localT)} />
          ))}
        </radialGradient>
        {corp2Weight > 0.01 && (
          <linearGradient id={`${id}-corp2-wash`} x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#FFF8D8" stopOpacity={0.60} />
            <stop offset="42%" stopColor="#FFF8D8" stopOpacity={0} />
            <stop offset="58%" stopColor="#8A6010" stopOpacity={0} />
            <stop offset="100%" stopColor="#8A6010" stopOpacity={0.40} />
          </linearGradient>
        )}
        <radialGradient id={`${id}-cavity`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFE8D0" />
          <stop offset="35%" stopColor="#F8C8A0" />
          <stop offset="70%" stopColor="#EAA880" />
          <stop offset="100%" stopColor="#CC8860" />
        </radialGradient>
        {/* Clips the shadow/highlight blobs below to the actual traced
            crescent/ring band (same evenodd cutout as the body fill) so
            they read as shading on the tissue instead of floating loose
            in the open centre — corp1/corp2 only, see fixWeight. */}
        {fixWeight > 0.01 && (
          <clipPath id={`${id}-tissue-clip`}>
            <path d={d} fillRule="evenodd" />
          </clipPath>
        )}
      </defs>

      {/* Deepening shadow — tissue reads as thicker/denser as it matures.
          This unclipped ellipse is the corp3 rendering (fixWeight === 0
          there, so it's untouched); for corp1/corp2 it fades out in favor
          of the silhouette-clipped, irregular version below. */}
      <ellipse
        cx={cx + localR * 0.12} cy={cy + localR * 0.46}
        rx={localR * 0.55} ry={localR * 0.30}
        fill="#8A6010" opacity={(0.06 + maturity * 0.14) * (1 - fixWeight)}
      />

      {/* Outer lobed body — evenodd cuts the cavity hole from the same silhouette */}
      <path
        d={d}
        fillRule="evenodd"
        fill={`url(#${id}-outer)`}
        stroke={gapRange ? 'none' : rimStroke}
        strokeWidth={1 + maturity * 0.4}
      />

      {/* Whole-shape directional wash (corp2 only) — a single light source
          across the entire ring band (bright upper-left, dark lower-right),
          matching corp2_ref.png's overall shading, layered on top of the
          per-lobe highlights/dimples below rather than replacing them. */}
      {corp2Weight > 0.01 && (
        <path
          d={d}
          fillRule="evenodd"
          fill={`url(#${id}-corp2-wash)`}
          opacity={corp2Weight}
        />
      )}

      {/* Rim stroke, split at corp1's real opening so the line doesn't cut
          across it — the gap segment fades in as the opening closes. */}
      {gapRange && (() => {
        const [gapLo, gapHi] = gapRange
        const outerSplit = splitAtGap(outerPts, gapLo, gapHi)
        const innerSplit = splitAtGap(innerPts, gapLo, gapHi)
        const w = 1 + maturity * 0.4
        return (
          <>
            <path d={catmullRomOpen(outerSplit.main)} fill="none" stroke={rimStroke} strokeWidth={w} strokeLinecap="round" />
            <path d={catmullRomOpen(innerSplit.main)} fill="none" stroke={rimStroke} strokeWidth={w} strokeLinecap="round" />
            <path d={catmullRomOpen(outerSplit.gap)} fill="none" stroke={rimStroke} strokeWidth={w} strokeLinecap="round" opacity={localT} />
            <path d={catmullRomOpen(innerSplit.gap)} fill="none" stroke={rimStroke} strokeWidth={w} strokeLinecap="round" opacity={localT} />
          </>
        )
      })()}

      {/* Shape-following shadow (corp1/corp2) — an irregular blob (not a
          clean ellipse) clipped to the actual crescent/ring silhouette, so
          it shades the tissue band itself rather than sitting in the open
          cavity. Drawn on top of the body fill (unlike the ellipse above,
          which is drawn underneath it and so is invisible on the tissue). */}
      {fixWeight > 0.01 && (
        <g clipPath={`url(#${id}-tissue-clip)`}>
          <path
            d={blobPath(cx + localR * 0.12, cy + localR * 0.46, localR * 0.55, localR * 0.30, 2.1)}
            fill="#8A6010"
            opacity={(0.10 + maturity * 0.20) * fixWeight}
          />
        </g>
      )}

      {/* Cavity fill — follows the actual traced inner boundary (the same
          hole the outer path's evenodd cuts), not an independent circle, so
          there's no mismatched ring of transparency between them. */}
      {cavityOpacity > 0.01 && (
        <>
          <path d={catmullRomClosed(innerPts)} fill={`url(#${id}-cavity)`} opacity={cavityOpacity} />
          <path
            d={catmullRomClosed(innerPts)}
            fill="none" stroke="#C07840"
            strokeWidth={localR * 0.035} strokeOpacity={cavityOpacity * 0.4}
          />
        </>
      )}

      <FoldSpokes cx={cx} cy={cy} R={localR} innerPts={innerPts} opacity={foldOpacity} />

      {/* Ambient sheen, upper-left — matches the painterly softness of the
          PNG refs. This is the corp3 rendering (fixWeight === 0 there, so
          untouched); for corp1/corp2 it fades out in favor of the
          silhouette-clipped, irregular version below. */}
      <ellipse cx={cx - localR * 0.10} cy={cy - localR * 0.20} rx={localR * 0.30} ry={localR * 0.20} fill="#FFF8E0" opacity={0.30 * (1 - fixWeight)} />

      {/* Shape-following sheen (corp1/corp2) — irregular blob clipped to
          the crescent/ring silhouette, so it highlights the tissue band
          itself instead of floating in the open cavity. */}
      {fixWeight > 0.01 && (
        <g clipPath={`url(#${id}-tissue-clip)`}>
          <path
            d={blobPath(cx - localR * 0.10, cy - localR * 0.20, localR * 0.30, localR * 0.20, 4.6)}
            fill="#FFF8E0"
            opacity={0.30 * fixWeight}
          />
        </g>
      )}

      <DimpleShadows cx={cx} cy={cy} R={localR} shape={CORP2_SHAPE} opacity={corp2Weight} />
      <HighlightGlints cx={cx} cy={cy} R={localR} shape={shapeA} opacity={1 - localT} tint={tintA} />
      <HighlightGlints cx={cx} cy={cy} R={localR} shape={shapeB} opacity={localT} tint={tintB} />
    </g>
    {corp1Weight > 0.001 && (
      <Corp1Lobes cx={cx} cy={cy} R={localR} opacity={opacity * corp1Weight} id={id} />
    )}
    {corp2LobesWeight > 0.001 && (
      <Corp2Lobes cx={cx} cy={cy} R={localR} opacity={opacity * corp2LobesWeight} id={id} />
    )}
    {corp3Weight > 0.001 && (
      <Corp3Lobes cx={cx} cy={cy} R={R * 0.7} opacity={opacity * corp3Weight} id={id} />
    )}
    </>
  )
}
