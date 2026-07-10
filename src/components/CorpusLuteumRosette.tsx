'use client'

import Corp3Lobes from './Corp3Lobes'

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

// corp3 (redesigned) — Corp3Lobes.tsx's ring of overlapping radial-finger
// lobes around a recessed cavity: outer boundary points lifted from every
// lobe's own traced blob path, inner boundary from the cavity fill path —
// so the corp2→corp3 morph still deforms point-by-point into a silhouette
// that matches what Corp3Lobes actually renders (see CORP3_NEW_SHAPE and
// corp3Weight below), instead of morphing into an unrelated placeholder.
const CORP3_LOBES_OUTER: Pt[] = [
  [-50,412],[-51,374],[-30,341],[-8,311],[34,308],[65,301],[97,322],[119,326],[139,331],[167,321],
  [197,323],[229,333],[250,359],[264,389],[261,423],[262,457],[245,486],[217,504],[192,521],[158,514],
  [133,508],[112,506],[89,516],[61,522],[20,530],[-16,515],[-30,482],[-40,448],[-50,412],[30,254],
  [51,229],[70,204],[97,189],[131,197],[158,209],[179,223],[193,241],[209,249],[234,252],[257,264],
  [278,283],[285,310],[281,338],[276,366],[263,391],[240,408],[212,414],[186,413],[162,404],[144,395],
  [127,386],[106,384],[77,382],[56,366],[28,346],[22,316],[20,284],[30,254],[134,115],[168,101],
  [196,78],[234,91],[264,99],[287,125],[298,154],[310,172],[323,187],[342,202],[364,223],[367,250],
  [371,280],[363,311],[337,329],[318,356],[286,358],[257,363],[230,344],[210,327],[196,307],[185,291],
  [160,284],[136,268],[109,245],[98,212],[100,177],[115,146],[134,115],[308,36],[336,21],[366,33],
  [396,35],[417,58],[424,90],[427,114],[427,135],[432,152],[440,170],[448,193],[448,219],[437,242],
  [422,266],[395,272],[369,279],[343,278],[318,271],[302,248],[293,225],[290,203],[284,188],[274,172],
  [257,153],[246,126],[240,93],[257,68],[282,52],[308,36],[532,-26],[570,-11],[610,0],[635,33],
  [651,69],[637,112],[630,142],[613,167],[617,192],[615,220],[606,248],[596,287],[565,302],[532,314],
  [497,311],[459,314],[433,286],[405,266],[399,229],[399,197],[411,169],[415,146],[401,118],[396,84],
  [405,49],[415,2],[449,-22],[492,-20],[532,-26],[740,56],[774,70],[790,103],[807,134],[797,170],
  [781,199],[756,219],[740,235],[729,253],[718,275],[702,300],[677,316],[647,320],[618,315],[584,312],
  [565,285],[545,262],[539,232],[541,202],[557,177],[570,157],[584,140],[590,118],[595,86],[612,54],
  [641,29],[676,31],[714,28],[740,56],[889,192],[903,220],[898,252],[897,280],[884,305],[860,321],
  [830,323],[814,330],[801,342],[786,356],[765,368],[742,370],[716,367],[698,350],[679,333],[666,310],
  [657,286],[664,260],[681,240],[702,227],[720,219],[732,207],[744,193],[760,176],[783,153],[812,149],
  [843,151],[865,173],[889,192],[954,343],[954,376],[951,408],[937,438],[910,456],[875,459],[847,454],
  [825,449],[808,459],[787,463],[762,468],[737,460],[715,446],[695,425],[679,400],[680,370],[686,342],
  [702,318],[729,306],[755,301],[775,297],[794,297],[812,282],[836,270],[866,262],[894,272],[919,290],
  [942,313],[954,343],[966,516],[963,552],[939,578],[915,601],[881,608],[847,598],[821,582],[802,568],
  [783,565],[756,569],[733,557],[708,542],[690,518],[683,488],[682,457],[699,430],[709,400],[742,392],
  [766,380],[796,388],[818,393],[837,404],[861,396],[892,391],[924,399],[946,422],[976,447],[983,483],
  [966,516],[847,664],[834,692],[803,699],[776,704],[749,704],[726,685],[711,666],[701,648],[688,637],
  [672,626],[650,613],[632,592],[632,566],[636,540],[655,521],[668,498],[691,485],[719,488],[742,487],
  [761,507],[775,521],[787,531],[809,534],[828,545],[860,558],[864,584],[878,614],[869,643],[847,664],
  [704,788],[674,800],[642,807],[611,796],[589,770],[572,749],[570,719],[565,700],[557,684],[540,666],
  [532,643],[524,614],[540,593],[554,569],[575,550],[601,540],[629,535],[655,550],[678,561],[691,585],
  [694,610],[703,625],[721,638],[745,656],[757,683],[759,714],[750,744],[733,772],[704,788],[549,855],
  [515,856],[482,849],[452,834],[436,802],[432,769],[442,738],[442,717],[438,698],[432,675],[426,646],
  [433,616],[457,601],[479,581],[508,576],[537,577],[566,580],[592,593],[606,621],[604,652],[605,674],
  [609,693],[624,713],[632,738],[635,768],[632,803],[608,826],[579,839],[549,855],[332,833],[297,824],
  [272,800],[256,770],[260,732],[266,703],[282,680],[294,661],[302,644],[309,623],[311,590],[333,574],
  [357,555],[387,555],[417,556],[442,574],[462,595],[479,618],[481,646],[476,672],[462,693],[459,712],
  [457,733],[460,764],[448,791],[431,826],[400,842],[366,831],[332,833],[138,738],[116,711],[103,679],
  [109,644],[113,613],[137,590],[164,576],[181,564],[195,550],[210,532],[229,509],[255,506],[284,503],
  [313,510],[336,528],[360,548],[369,577],[369,607],[358,634],[342,655],[319,668],[308,684],[298,703],
  [285,727],[263,750],[234,762],[202,760],[170,752],[138,738],[10,595],[4,563],[-2,531],[11,500],
  [28,474],[61,463],[91,462],[112,459],[131,456],[150,446],[176,431],[203,434],[236,437],[251,463],
  [271,486],[271,517],[269,545],[265,573],[245,593],[216,601],[197,611],[179,620],[162,632],[139,654],
  [108,668],[80,659],[45,652],[20,628],[10,595],
]
const CORP3_LOBES_INNER: Pt[] = [
  [223,421],[244,343],[298,277],[384,227],[506,210],[616,245],[692,313],[727,387],[725,470],[682,550],
  [603,614],[515,640],[398,632],[300,578],[242,506],[223,421],
]

const CORP1_SHAPE = buildCollapsedMembraneShape()
const CORP2_SHAPE = buildShape(CORP2_OUTER, CORP2_INNER, CORP2_HIGHLIGHTS)
// Same light circular smoothing already used for the old traced corp3 —
// rounds off the faceting nearest-angle resampling introduces without
// losing the lobe count/placement. No highlight glints here (empty array):
// Corp3Lobes carries its own per-lobe streak highlights, which take over
// via corp3Weight well before this profile shape is the only thing left.
const CORP3_NEW_SHAPE_TRACED = buildShape(CORP3_LOBES_OUTER, CORP3_LOBES_INNER, [])
const CORP3_NEW_SHAPE: ShapeData = {
  ...CORP3_NEW_SHAPE_TRACED,
  outerProfile: smoothProfileCircular(CORP3_NEW_SHAPE_TRACED.outerProfile, 3),
  innerProfile: smoothProfileCircular(CORP3_NEW_SHAPE_TRACED.innerProfile, 3),
}

// ── gradient stop palettes (kept consistent with the rest of AnatomyLayer) ─

const CORP1_OUTER_STOPS: [number, string][] = [
  [0, '#FFFCE0'], [25, '#F8F0B4'], [50, '#EEE4A0'], [75, '#E0D488'], [100, '#C8C060'],
]
// Radial, inner-edge-out: lightest right where the band starts at the
// cavity hole, darkening steadily out to the outer rim — gives the ring's
// tube cross-section a rounded, non-flat read instead of one flat fill.
const CORP2_OUTER_STOPS: [number, string][] = [
  [0, '#FFFAE0'], [25, '#FBEA9A'], [50, '#F5DC70'], [75, '#E8C850'], [100, '#D0A838'],
]
const CORP2_RIM = '#D0A838'
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
  const inFirstHalf = stage <= 1
  const shapeA = inFirstHalf ? CORP1_SHAPE : CORP2_SHAPE
  const shapeB = inFirstHalf ? CORP2_SHAPE : CORP3_NEW_SHAPE
  const stopsA = inFirstHalf ? CORP1_OUTER_STOPS : CORP2_OUTER_STOPS
  const stopsB = inFirstHalf ? CORP2_OUTER_STOPS : CORP3_OUTER_STOPS
  // corp2's rim matches its own gradient's outer-edge stop (no visible
  // outline at that endpoint), while corp1's and corp3's rim colours are
  // untouched.
  const rimA = inFirstHalf ? '#D8C860' : CORP2_RIM
  const rimB = inFirstHalf ? CORP2_RIM : '#B09020'
  const tintA = inFirstHalf ? '#FFFCE0' : '#FFFFF0'
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

  return (
    <>
    <g opacity={opacity * (1 - corp3Weight)} style={{ pointerEvents: 'none' }}>
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
    {corp3Weight > 0.001 && (
      <Corp3Lobes cx={cx} cy={cy} R={R * 0.7} opacity={opacity * corp3Weight} id={id} />
    )}
    </>
  )
}
