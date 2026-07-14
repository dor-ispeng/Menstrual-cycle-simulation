// Endometrial lining — three growth stages (thin→mid→thick) morphed continuously.
// Path data is copied verbatim from endo_thin.svg / endo_mid.svg / endo_thick.svg —
// each exported from a full 1491×1055 Figma frame aligned to the native uterofallop.png
// canvas (viewBox="0 0 1491 1055"). Coordinates are LEFT UNMODIFIED: no bbox-cropping,
// no recentering, no independent offsets. AnatomyLayer places the resulting group with
// the exact same x/y/width/height box used for the uterus PNG image, so this data's
// own (0,0)-(1491,1055) coordinate space maps 1:1 onto the uterus artwork.
// Each stage is 3 sub-paths (left wall, top band, right wall): pure M/L/H/V/Z polylines,
// resampled to a common point count so they interpolate 1:1 despite differing vertex counts.
// endometriumMorph(t) returns the 3 morphed sub-path d-strings + the interpolated fill color.

const STAGE_PATHS: string[][] = [
  // thin (#CA2459) — endo_thin.svg
  [
    "M537.051 525.787L554.469 562.307L571.375 605L567.789 575.166L554.469 542.247L543.711 513.956L519.12 483.094L497.603 443.487L482.747 408.51L460.718 361.188L437.152 326.725L410 311.293L432.541 332.897L457.644 377.648L477.111 430.628L487.87 452.231L497.603 472.292L514.509 496.982L537.051 525.787Z",
    "M451.496 278.888L426.394 265L457.644 273.744L485.308 283.003L533.465 296.891L578.035 302.549L633.876 299.977L674.347 288.661L728.139 273.744L764 265L751.705 273.744L725.577 283.003L705.598 288.661L670.761 299.977L643.097 306.664L593.916 311.293H547.809L514.509 299.977L480.698 290.204L451.496 278.888Z",
    "M732.237 348.328L758.877 319.523L732.237 335.469L714.819 361.188L700.475 393.593L690.741 423.941L676.909 452.231L661.027 472.292L638.486 501.611L616.97 534.531L607.748 559.221L603.137 578.253L598.527 596.256V605L603.137 593.684L616.97 555.62L633.876 528.873L648.732 505.212L674.347 476.407L687.667 456.346L697.913 434.743L703.036 417.769L714.819 381.762L732.237 348.328Z",
  ],
  // mid (#C83866) — endo_mid.svg
  [
    "M537.79 526.381L556.856 559.565L572.314 605V578.453L560.463 533.018L549.642 508.514L529.546 469.715L509.965 443.168L490.9 405.901L470.288 369.655L445.039 334.94L410 313.498L432.672 334.94L457.921 379.354L477.502 431.937L488.323 453.378L500.69 469.715L516.148 494.219L537.79 526.381Z",
    "M452.253 285.42L426.489 267.553L457.921 276.231L485.747 285.42L544.489 297.673L588.288 302.267H635.179L675.886 291.036L729.991 276.231L764 265L752.664 271.637L727.415 285.42L702.166 302.267L674.341 315.541L639.817 321.667L594.472 324.219L544.489 318.604L509.965 310.435L480.079 297.673L452.253 285.42Z",
    "M734.114 350.255L760.908 321.667L727.415 340.045L710.411 363.018L689.284 398.243L675.886 431.937L654.245 465.631L628.996 502.898L614.568 535.571L608.9 559.565L604.262 578.453L599.624 596.321V605L604.262 593.769L618.175 555.991L635.179 529.444L650.122 505.961L675.886 477.372L689.284 457.462L704.742 419.174L716.594 383.438L734.114 350.255Z",
  ],
  // thk (#B01E4C) — endo_thick.svg
  [
    "M537.79 526.381L556.856 559.565L572.314 605V578.453L561.493 529.444L554.279 505.961L537.79 466.652L513.057 424.79L500.69 389.054L480.079 360.465L445.039 334.94L415.668 313.498H410L432.672 334.94L457.921 379.354L477.502 431.937L488.323 453.378L500.69 469.715L516.148 494.219L537.79 526.381Z",
    "M477.502 302.267L452.253 285.42L430.611 273.168L426.489 267.553L457.921 276.231L485.747 285.42L544.489 297.673L588.288 302.267H635.179L675.886 291.036L729.991 276.231L764 265L752.664 271.637L729.991 288.483L704.742 305.841L675.886 321.667L642.393 327.793L595.502 331.877L541.913 327.793L507.389 317.072L477.502 302.267Z",
    "M734.114 350.255L760.908 321.667H752.664L727.415 334.94L702.166 355.36L685.162 395.691L670.218 424.79L644.969 457.462L625.904 494.219L613.022 526.381L608.9 555.991L604.262 578.453L599.624 596.321V605L604.262 593.769L618.175 555.991L635.179 529.444L650.122 505.961L675.886 477.372L689.284 457.462L704.742 419.174L716.594 383.438L734.114 350.255Z",
  ],
]
const STAGE_COLORS = ["#CA2459", "#C83866", "#B01E4C"]
const N = 48

function parsePolyline(d: string): number[][] {
  const toks = d.match(/[MLHVZ]|-?\d*\.?\d+/g) || []
  const pts: number[][] = []
  let i = 0, cx = 0, cy = 0
  while (i < toks.length) {
    const t = toks[i]
    if (t === "M" || t === "L") { cx = parseFloat(toks[i + 1]); cy = parseFloat(toks[i + 2]); pts.push([cx, cy]); i += 3 }
    else if (t === "H") { cx = parseFloat(toks[i + 1]); pts.push([cx, cy]); i += 2 }
    else if (t === "V") { cy = parseFloat(toks[i + 1]); pts.push([cx, cy]); i += 2 }
    else i += 1
  }
  return pts
}

function resample(pts: number[][], n: number): number[][] {
  const loop = pts.concat([pts[0]])
  const seg: number[] = []
  let total = 0
  for (let k = 0; k < loop.length - 1; k++) {
    const d = Math.hypot(loop[k + 1][0] - loop[k][0], loop[k + 1][1] - loop[k][1])
    seg.push(d); total += d
  }
  const out: number[][] = []
  for (let k = 0; k < n; k++) {
    const target = (total * k) / n
    let acc = 0, j = 0
    while (j < seg.length && acc + seg[j] < target) { acc += seg[j]; j++ }
    if (j >= seg.length) { out.push(loop[loop.length - 1]); continue }
    const f = seg[j] > 0 ? (target - acc) / seg[j] : 0
    const a = loop[j], b = loop[j + 1]
    out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])])
  }
  return out
}

// No manual alignment correction here — the raw traced coordinates are used as-is.
// Placement onto the uterus artwork happens entirely via the shared box transform
// applied in AnatomyLayer.tsx (same x/y/width/height as the uterus PNG image).
const RESAMPLED = STAGE_PATHS.map((subs) => subs.map((d) => resample(parsePolyline(d), N)))

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function hexToRgb(h: string): number[] { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function rgbToHex(r: number, g: number, b: number): string { return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") }
function lerpColor(h1: string, h2: string, t: number): string { const a = hexToRgb(h1), b = hexToRgb(h2); return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)) }

function ptsToPath(pts: number[][]): string {
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let k = 1; k < pts.length; k++) d += `L${pts[k][0].toFixed(2)} ${pts[k][1].toFixed(2)}`
  return d + "Z"
}

export function endometriumMorph(thickness: number): { paths: string[]; color: string } {
  const t = Math.max(0, Math.min(1, thickness))
  const scaled = t * 2
  const lo = Math.min(1, Math.floor(scaled))
  const hi = Math.min(2, lo + 1)
  const f = scaled - lo
  const paths = RESAMPLED[lo].map((subLo, s) => {
    const subHi = RESAMPLED[hi][s]
    const morphed = subLo.map((p, k) => [lerp(p[0], subHi[k][0], f), lerp(p[1], subHi[k][1], f)])
    return ptsToPath(morphed)
  })
  const color = lerpColor(STAGE_COLORS[lo], STAGE_COLORS[hi], f)
  return { paths, color }
}
