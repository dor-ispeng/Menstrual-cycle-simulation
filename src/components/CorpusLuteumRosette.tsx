'use client'

// ── Corpus luteum rosette ────────────────────────────────────────────────────
// Reusable, animatable inline-SVG component covering all three post-ovulation
// luteal stages as ONE continuously-morphing structure:
//   corp1 (corpus hemorrhagicum, fully formed at Ovulation Decision)
//   → corp2 (forming ring, fully formed at After Release)
//   → corp3 (mature rosette, fully formed at Preparation)
//
// corp2 and corp3's lobed silhouettes are traced directly from the reference
// vector files (SVG/corp2.svg, SVG/corp3.svg) rather than synthesized from
// sine waves, so their outline is biologically grounded. corp1 is different:
// it's an open "C"-shaped crescent (the follicle's rupture point hasn't
// sealed yet, matching corp1_ref.png) representing collapsed tissue under
// slight tension, and is built as a continuous low-frequency spline (see
// buildCollapsedMembraneShape) rather than resampled from traced vertices —
// densely resampling the hand-drawn polygon baked in every small notch of
// the source art and read as faceted/zig-zaggy. All three shapes share the
// same angular resolution (SAMPLES) so `stageT` performs a genuine
// point-by-point interpolation of one silhouette into the next — the tissue
// reads as forming/twisting/thickening inward, not as images crossfading.
// corp1's real opening tapers smoothly to zero width at each tip (no
// polygonal pinch); that taper is what visibly "closes" into corp2's full
// ring as the corp1→corp2 morph proceeds. Colour, cavity fill, fold texture
// and highlight placement are all driven by the same stage parameter and
// tuned against corp1_ref.png / corp2_ref.png / corp3_ref.png for the
// painterly shading, softness and gradients.

type Pt = [number, number]

// ── geometry helpers ─────────────────────────────────────────────────────

function centroidOf(pts: Pt[]): Pt {
  let sx = 0, sy = 0
  for (const [x, y] of pts) { sx += x; sy += y }
  return [sx / pts.length, sy / pts.length]
}

function meanRadius(pts: Pt[], center: Pt): number {
  let s = 0
  for (const [x, y] of pts) s += Math.hypot(x - center[0], y - center[1])
  return s / pts.length
}

// Resample a closed polygon into `samples` points evenly spaced by angle
// around `center`, returning radius/refR (a size-normalized ratio) per angle.
function toPolarProfile(pts: Pt[], center: Pt, refR: number, samples: number): number[] {
  const proj = pts
    .map(([x, y]): Pt => [
      Math.atan2(y - center[1], x - center[0]),
      Math.hypot(x - center[0], y - center[1]) / refR,
    ])
    .sort((a, b) => a[0] - b[0])
  const profile: number[] = []
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2 - Math.PI
    let hi = proj[0]
    let lo = proj[proj.length - 1]
    for (let j = 0; j < proj.length; j++) {
      if (proj[j][0] >= theta) { hi = proj[j]; lo = proj[(j - 1 + proj.length) % proj.length]; break }
    }
    let span = hi[0] - lo[0]
    if (span <= 0) span += Math.PI * 2
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, (((theta - lo[0]) + Math.PI * 2) % (Math.PI * 2)) / span))
    profile.push(lo[1] + (hi[1] - lo[1]) * t)
  }
  return profile
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

function highlightsFromGroups(groups: Pt[][], center: Pt, refR: number) {
  return groups.map((pts) => {
    const c = centroidOf(pts)
    const dx = c[0] - center[0], dy = c[1] - center[1]
    return { angle: Math.atan2(dy, dx), rFrac: Math.hypot(dx, dy) / refR }
  })
}

function buildShape(outerPts: Pt[], innerPts: Pt[], highlightGroups: Pt[][]): ShapeData {
  const center = centroidOf(outerPts)
  const refR = meanRadius(outerPts, center)
  const outerProfile = toPolarProfile(outerPts, center, refR, SAMPLES)
  const innerProfile = toPolarProfile(innerPts, center, refR, SAMPLES)
  return { outerProfile, innerProfile, highlights: highlightsFromGroups(highlightGroups, center, refR) }
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

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2)
  if (d > Math.PI) d = Math.PI * 2 - d
  return d
}

// Cubic ease, zero slope at both ends — used everywhere a value needs to
// ease smoothly between two states with no corner (C1-continuous), instead
// of a linear ramp or a hard cutoff.
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

// A single smooth, compact-support bump — zero and zero-slope at
// ±halfWidth, peaking at `amplitude` at the centre (a raised cosine). This
// is the building block for both the centerline's folds and the tip
// closure: everything is C¹-continuous, so nothing ever meets at a corner.
function raisedCosineBump(d: number, halfWidth: number): number {
  if (d >= halfWidth) return 0
  return 0.5 * (1 + Math.cos((Math.PI * d) / halfWidth))
}

// A small number of broad folds, each with its own hand-set amplitude and
// angular width — deliberately irregular (not evenly spaced, not a shared
// frequency) so the silhouette reads as organically folded tissue rather
// than a mathematically regular ripple. Angles are degrees for readability
// (converted below); 0° points screen-right, matching corp1_ref.png's
// opening direction.
const CORP1_FOLDS: { angle: number; amplitude: number; halfWidth: number }[] = [
  { angle: 172, amplitude: 0.20, halfWidth: 48 },  // the big rounded lobe opposite the opening
  { angle: 96, amplitude: 0.11, halfWidth: 34 },
  { angle: 246, amplitude: 0.14, halfWidth: 38 },
  { angle: 46, amplitude: 0.07, halfWidth: 26 },
  { angle: 298, amplitude: 0.08, halfWidth: 24 },
]

// corp1 is collapsed follicular tissue under slight tension, not a faceted
// ring. It's built the way a folded ribbon actually is: a smooth centerline
// spline (its radius is a base value plus a handful of broad, irregular
// fold bumps — CORP1_FOLDS) with the outer/inner boundaries offset from
// that centerline by a slowly-varying half-width. The folds live in the
// centerline itself, so both boundaries bow together where the tissue
// folds — not two independently-wobbling curves. Near the opening the
// half-width eases to zero via smoothstep (C¹-continuous, no corner), so
// both boundaries curve into a shared, rounded point at each tip — an
// organic taper, not a pinch. Silhouette proportions (opening direction and
// width, the big lobe opposite it, overall size) are tuned to match
// corp1_ref.png / SVG/corp1.svg's shape language; nothing here is resampled
// from that file's traced vertices.
function buildCollapsedMembraneShape(): ShapeData {
  const GAP_CENTER = -0.16          // opening faces right, slightly upward on screen
  const GAP_HALF = 0.22             // half-width of the fully-collapsed (zero-width) span
  const TAPER_HALF = 0.62           // half-width of the broader easing zone around it
  const CENTER_BASE = 0.80          // centerline's resting radius
  const WIDTH_BASE = 0.20           // resting wall half-width (outer/inner offset each side)

  const foldsRad = CORP1_FOLDS.map((f) => ({
    angle: (f.angle * Math.PI) / 180,
    amplitude: f.amplitude,
    halfWidth: (f.halfWidth * Math.PI) / 180,
  }))

  const centerlineRadius = (theta: number): number => {
    let r = CENTER_BASE
    for (const f of foldsRad) r += f.amplitude * raisedCosineBump(angularDistance(theta, f.angle), f.halfWidth)
    return r
  }

  // Wall half-width varies on its own slow, single-harmonic curve —
  // independent of the centerline's folds, so thickness isn't just a fixed
  // offset from the silhouette.
  const wallHalfWidth = (theta: number): number => WIDTH_BASE + 0.03 * Math.cos(2 * theta + 0.8)

  const outerProfile: number[] = []
  const innerProfile: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const theta = (i / SAMPLES) * Math.PI * 2 - Math.PI
    const center = centerlineRadius(theta)

    const d = angularDistance(theta, GAP_CENTER)
    let closure = 1
    if (d <= GAP_HALF) {
      closure = 0
    } else if (d < TAPER_HALF) {
      closure = smoothstep((d - GAP_HALF) / (TAPER_HALF - GAP_HALF))
    }

    const half = wallHalfWidth(theta) * closure
    outerProfile.push(center + half)
    innerProfile.push(center - half)
  }

  // The fully-collapsed span (closure === 0 exactly) is what the stroke
  // treats as the real opening — see splitAtGap / gapRange usage below.
  const gapIdx: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const theta = (i / SAMPLES) * Math.PI * 2 - Math.PI
    if (angularDistance(theta, GAP_CENTER) <= GAP_HALF) gapIdx.push(i)
  }

  return {
    outerProfile,
    innerProfile,
    highlights: [],
    gapRange: [gapIdx[0], gapIdx[gapIdx.length - 1]],
  }
}

// ── traced vertex data (SVG/corp2.svg, SVG/corp3.svg) ────────────────────
// Coordinates lifted directly from each file's path `d` — outer-body
// boundary, inner-cavity/hole boundary, and the small sheen-patch groups —
// so the overall silhouette and lobe placement match the source art. corp1
// is built procedurally instead (see buildCollapsedMembraneShape above).

// corp2.svg — thin forming ring ("After Release"): outer + inner boundary
const CORP2_OUTER: Pt[] = [
  [46, 172], [10, 204], [10, 248], [28, 292], [46, 326], [28, 350], [0, 388], [0, 432], [28, 482], [10, 524], [10, 572],
  [28, 608], [80, 632], [106, 672], [116, 726], [152, 756], [244, 756], [276, 778], [304, 806], [350, 830], [412, 820],
  [440, 806], [472, 796], [518, 806], [556, 796], [584, 756], [596, 746], [670, 726], [684, 706], [696, 672], [706, 632],
  [742, 632], [760, 608], [760, 496], [794, 482], [804, 446], [804, 418], [794, 388], [766, 342], [778, 306], [778, 276],
  [766, 228], [742, 204], [724, 184], [684, 184], [650, 172], [638, 126], [638, 82], [612, 58], [556, 46], [518, 28],
  [492, 10], [456, 0], [428, 10], [392, 28], [350, 10], [326, 10], [276, 28], [258, 46], [224, 46], [190, 52], [152, 68],
  [132, 82], [116, 112], [106, 142], [80, 160],
]
const CORP2_INNER: Pt[] = [
  [238, 186], [252, 152], [316, 152], [328, 142], [346, 108], [412, 108], [446, 128], [482, 152], [530, 152], [530, 186],
  [550, 222], [550, 258], [568, 270], [612, 288], [638, 304], [654, 330], [654, 428], [664, 460], [664, 488], [638, 508],
  [612, 526], [578, 556], [578, 632], [568, 644], [530, 660], [506, 660], [494, 692], [482, 704], [464, 714], [434, 704],
  [388, 704], [362, 692], [346, 660], [328, 632], [298, 622], [264, 622], [238, 600], [208, 556], [218, 526], [218, 488],
  [190, 460], [164, 446], [138, 428], [138, 406], [164, 384], [176, 362], [176, 330], [164, 304], [164, 270], [190, 246],
  [218, 246], [238, 222],
]
const CORP2_HIGHLIGHTS: Pt[][] = [
  [[103, 479], [121, 470], [162, 470], [178, 489], [169, 524], [148, 536], [108, 524]],
  [[3, 385], [35, 366], [61, 375], [51, 416], [35, 429], [3, 416]],
  [[61, 311], [78, 290], [103, 290], [121, 302], [121, 336], [94, 341]],
  [[20, 204], [51, 188], [83, 188], [94, 197], [88, 209], [78, 238], [51, 254], [27, 238]],
  [[148, 99], [162, 85], [205, 71], [205, 104], [162, 123]],
  [[291, 33], [325, 17], [338, 17], [359, 41], [359, 53], [331, 53], [299, 66], [253, 85], [263, 66]],
  [[524, 76], [560, 71], [600, 76], [607, 116], [585, 133], [536, 104]],
  [[415, 33], [459, 41], [466, 59], [474, 76], [498, 76], [505, 47], [487, 22], [459, 17], [428, 22]],
  [[566, 227], [577, 197], [618, 197], [648, 227], [635, 262], [600, 271]],
  [[679, 238], [698, 215], [762, 271], [743, 331], [712, 336], [688, 311]],
  [[683, 413], [715, 379], [743, 385], [769, 406], [755, 453], [712, 463]],
  [[623, 585], [648, 552], [659, 531], [688, 500], [707, 500], [712, 544], [669, 562], [669, 603], [648, 603]],
  [[600, 658], [618, 626], [679, 638], [659, 686]],
  [[326, 747], [359, 741], [408, 755], [430, 770], [408, 790], [350, 801], [316, 781]],
  [[131, 705], [139, 648], [139, 633], [169, 638], [216, 658], [236, 648], [295, 648], [312, 689], [286, 705], [236, 700], [189, 729]],
]

// corp3.svg — mature rosette ("Preparation"): outer body + inner-cavity boundary
const CORP3_OUTER: Pt[] = [
  [259, 630], [242, 592], [235, 577], [200, 592], [191, 568], [185, 546], [174, 540], [167, 524], [154, 516], [111, 516],
  [78, 472], [78, 421], [57, 405], [38, 342], [57, 297], [78, 244], [99, 186], [154, 140], [191, 96], [235, 66], [294, 76],
  [396, 41], [491, 57], [516, 81], [572, 71], [628, 96], [668, 127], [709, 158], [724, 172], [737, 209], [788, 264],
  [814, 287], [814, 350], [843, 398], [861, 421], [861, 440], [821, 421], [854, 455], [843, 503], [832, 516], [809, 558],
  [772, 592], [762, 587], [742, 624], [717, 652], [704, 652], [668, 657], [636, 672], [593, 662], [588, 662], [557, 672],
  [525, 685], [469, 685], [452, 657], [422, 672], [365, 657], [352, 630],
]
const CORP3_INNER: Pt[] = [
  [333, 180], [326, 145], [333, 113], [348, 137], [376, 145], [382, 145], [365, 94], [388, 107], [402, 155], [430, 180],
  [437, 166], [437, 132], [451, 180], [488, 161], [488, 124], [478, 86], [508, 86], [508, 113], [518, 145], [536, 124],
  [536, 196], [555, 202], [582, 166], [582, 213], [604, 223], [615, 207], [626, 161], [647, 185], [637, 238], [657, 266],
  [690, 266], [682, 274], [676, 313], [702, 329], [739, 360], [745, 386], [739, 409], [731, 421], [707, 434], [676, 483],
  [669, 514], [637, 530], [604, 530], [591, 550], [562, 563], [524, 538], [421, 520], [410, 493], [359, 477], [321, 488],
  [308, 439], [288, 402], [246, 409], [246, 344], [201, 324], [184, 329], [166, 308], [157, 266], [193, 266], [193, 247],
  [166, 207], [201, 223], [234, 218], [226, 196], [217, 155], [246, 174], [269, 213], [294, 207], [294, 166], [321, 196],
]
const CORP3_HIGHLIGHTS: Pt[][] = [
  // major sheen spots (#F9E982)
  [[187, 459], [242, 443], [262, 443], [283, 443], [288, 469], [274, 501], [235, 541], [205, 555], [187, 541], [168, 509]],
  [[219, 184], [194, 158], [168, 152], [128, 152], [103, 164], [128, 191], [168, 197], [205, 208]],
  [[370, 60], [395, 37], [404, 26], [437, 48], [444, 70], [437, 106], [432, 152], [418, 152], [404, 152], [395, 121], [370, 89]],
  [[729, 343], [775, 327], [813, 343], [813, 359], [794, 359], [775, 372], [729, 365]],
  [[613, 555], [630, 533], [656, 533], [687, 584], [687, 623], [630, 611]],
  [[418, 663], [437, 647], [440, 643], [437, 611], [462, 570], [479, 546], [467, 524], [444, 533], [407, 580], [388, 623], [395, 656]],
  // secondary sparkle spots (#FBEF9E)
  [[373, 50], [394, 50], [409, 63], [422, 50], [434, 66], [428, 88], [422, 96], [405, 88], [386, 102], [373, 88]],
  [[562, 102], [581, 88], [604, 96], [596, 110], [581, 129], [574, 129], [562, 129]],
  [[666, 194], [688, 174], [720, 187], [702, 194], [696, 218], [666, 213]],
  [[713, 275], [739, 258], [763, 258], [763, 275], [742, 284], [720, 288]],
  [[727, 345], [750, 331], [776, 331], [791, 348], [787, 356], [763, 362], [727, 362]],
  [[409, 591], [440, 566], [465, 585], [472, 614], [422, 614]],
  [[175, 507], [214, 466], [230, 487], [230, 516], [208, 526], [203, 507]],
  [[93, 409], [127, 385], [152, 369], [158, 385], [158, 393], [158, 409], [158, 429], [127, 437], [127, 421], [113, 421]],
  [[113, 242], [119, 231], [113, 218], [127, 213], [98, 206], [79, 213], [93, 226], [79, 231], [98, 242]],
  [[225, 80], [246, 80], [271, 80], [280, 102], [265, 114], [249, 114], [230, 102]],
]

const CORP1_SHAPE = buildCollapsedMembraneShape()
const CORP2_SHAPE = buildShape(CORP2_OUTER, CORP2_INNER, CORP2_HIGHLIGHTS)
// corp3's traced polygon has ~15 real lobes, but nearest-angle resampling
// turns each vertex into a hard V; a light circular smoothing pass rounds
// those into soft bumps (matching corp3_ref.png) without losing the lobes.
const CORP3_SHAPE_TRACED = buildShape(CORP3_OUTER, CORP3_INNER, CORP3_HIGHLIGHTS)
const CORP3_SHAPE: ShapeData = {
  ...CORP3_SHAPE_TRACED,
  outerProfile: smoothProfileCircular(CORP3_SHAPE_TRACED.outerProfile, 3),
  innerProfile: smoothProfileCircular(CORP3_SHAPE_TRACED.innerProfile, 3),
}

// ── gradient stop palettes (kept consistent with the rest of AnatomyLayer) ─

const CORP1_OUTER_STOPS: [number, string][] = [
  [0, '#FFFCE0'], [25, '#F8F0B4'], [50, '#EEE4A0'], [75, '#E0D488'], [100, '#C8C060'],
]
const CORP2_OUTER_STOPS: [number, string][] = [
  [0, '#FEFBE0'], [25, '#F9F2A8'], [50, '#F2E870'], [75, '#E8D858'], [100, '#D4C040'],
]
const CORP3_OUTER_STOPS: [number, string][] = [
  [0, '#FFF2C8'], [25, '#F8DC90'], [50, '#EFCA68'], [75, '#E2B040'], [100, '#C89828'],
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
  const inFirstHalf = stage <= 1
  const shapeA = inFirstHalf ? CORP1_SHAPE : CORP2_SHAPE
  const shapeB = inFirstHalf ? CORP2_SHAPE : CORP3_SHAPE
  const stopsA = inFirstHalf ? CORP1_OUTER_STOPS : CORP2_OUTER_STOPS
  const stopsB = inFirstHalf ? CORP2_OUTER_STOPS : CORP3_OUTER_STOPS
  const rimA = inFirstHalf ? '#D8C860' : '#C0A820'
  const rimB = inFirstHalf ? '#C0A820' : '#B09020'
  const tintA = inFirstHalf ? '#FFFCE0' : '#FFFFF0'
  const tintB = inFirstHalf ? '#FFFFF0' : '#F9E982'
  const localT = inFirstHalf ? stage : stage - 1

  const outerProfile = lerpProfile(shapeA.outerProfile, shapeB.outerProfile, localT)
  const innerProfile = lerpProfile(shapeA.innerProfile, shapeB.innerProfile, localT)
  const outerPts = profileToPoints(cx, cy, R, outerProfile)
  const innerPts = profileToPoints(cx, cy, R, innerProfile)
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

  return (
    <g opacity={opacity} style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id={`${id}-outer`} cx="33%" cy="25%" r="71%">
          {stopsA.map(([o, ca], i) => (
            <stop key={o} offset={`${o}%`} stopColor={lerpHex(ca, stopsB[i][1], localT)} />
          ))}
        </radialGradient>
        <radialGradient id={`${id}-cavity`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFE8D0" />
          <stop offset="35%" stopColor="#F8C8A0" />
          <stop offset="70%" stopColor="#EAA880" />
          <stop offset="100%" stopColor="#CC8860" />
        </radialGradient>
      </defs>

      {/* Deepening shadow — tissue reads as thicker/denser as it matures */}
      <ellipse
        cx={cx + R * 0.12} cy={cy + R * 0.46}
        rx={R * 0.55} ry={R * 0.30}
        fill="#8A6010" opacity={0.06 + maturity * 0.14}
      />

      {/* Outer lobed body — evenodd cuts the cavity hole from the same silhouette */}
      <path
        d={d}
        fillRule="evenodd"
        fill={`url(#${id}-outer)`}
        stroke={gapRange ? 'none' : rimStroke}
        strokeWidth={1 + maturity * 0.4}
      />

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

      {/* Cavity fill — follows the actual traced inner boundary (the same
          hole the outer path's evenodd cuts), not an independent circle, so
          there's no mismatched ring of transparency between them. */}
      {cavityOpacity > 0.01 && (
        <>
          <path d={catmullRomClosed(innerPts)} fill={`url(#${id}-cavity)`} opacity={cavityOpacity} />
          <path
            d={catmullRomClosed(innerPts)}
            fill="none" stroke="#C07840"
            strokeWidth={R * 0.035} strokeOpacity={cavityOpacity * 0.4}
          />
        </>
      )}

      <FoldSpokes cx={cx} cy={cy} R={R} innerPts={innerPts} opacity={foldOpacity} />

      {/* Ambient sheen, upper-left — matches the painterly softness of the PNG refs */}
      <ellipse cx={cx - R * 0.10} cy={cy - R * 0.20} rx={R * 0.30} ry={R * 0.20} fill="#FFF8E0" opacity={0.30} />

      <HighlightGlints cx={cx} cy={cy} R={R} shape={shapeA} opacity={1 - localT} tint={tintA} />
      <HighlightGlints cx={cx} cy={cy} R={R} shape={shapeB} opacity={localT} tint={tintB} />
    </g>
  )
}
