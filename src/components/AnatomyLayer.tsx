'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import CorpusLuteumRosette from './CorpusLuteumRosette'
import { endometriumMorph } from '@/data/endometrium'
import { useImageAlpha, svgLocalPointFromEvent } from '@/utils/imageAlpha'

// ── Shared uterus-artwork placement box ──────────────────────────────────────
// The uterus+tube PNG (public/uterofallop.png) and the endometrium SVG data
// (src/data/endometrium.ts) are both exported from the SAME 1491×1055 Figma
// frame. This box is the single source of truth for placing both: the PNG
// <image> uses these values directly as x/y/width/height; the endometrium
// group derives its transform from the same numbers (translate + the scale
// implied by width/height vs. the shared native size) so the two can never
// drift out of registration.
const UTERUS_ART_NATIVE_W = 1491
const UTERUS_ART_NATIVE_H = 1055
const UTERUS_ART_X = -213
const UTERUS_ART_Y = -88
const UTERUS_ART_W = 1548
const UTERUS_ART_H = 1096

// ── Shared ovary-artwork placement box ───────────────────────────────────────
// Same idea as above, for public/ovary.png — single source of truth for the
// <image> placement and for converting a click's local coordinate into that
// PNG's native pixel space (used by the alpha-gated click handler).
const OVARY_ART_NATIVE_W = 1402
const OVARY_ART_NATIVE_H = 1122
const OVARY_ART_X = 504
const OVARY_ART_Y = 395
const OVARY_ART_W = 588
const OVARY_ART_H = 471

// ── Canvas: 1400 × 900 ──────────────────────────────────────────────────────
// Composition (left→right):
//   Uterus  : connected uterus+tube PNG (public/uterofallop.png), left edge x≈30
//   Tube    : part of the same PNG, arching up-right then hooking down into
//             fimbriae that end at ~(1089,498), just above the ovary
//   Ovary   : organic oval at (830,630), rx=185, ry=150
//   Follicles / dominant / corpus luteum: all inside ovary
//   Egg     : travels from dominant follicle to fimbriae opening, then up tube

// ── Uterus ───────────────────────────────────────────────────────────────────
// Uterus + fallopian tube are now a single connected PNG (public/uterofallop.png).
// Invisible click-target paths below stand in for the old UTERUS_OUTER geometry.
// The endometrium lining (previously UTERUS_CAVITY-based) is handled in a
// follow-up pass — only an invisible cavity click-target remains for now.

// Invisible click target covering the uterus body (approximates the PNG's
// uterus silhouette). Not used for rendering — fill is transparent.
const UTERUS_HIT =
  'M 590,215 ' +
  'C 645,255 665,355 665,470 ' +
  'C 665,585 645,695 590,755 ' +
  'C 500,835 360,875 220,875 ' +
  'C 60,875 30,660 30,470 ' +
  'C 30,280 60,65 220,65 ' +
  'C 360,65 500,135 590,215 Z'

// ── Fallopian tube ────────────────────────────────────────────────────────────

// Four-segment cubic bezier tracing the uterofallop.png tube centerline:
// exits uterus upper-right (uterine junction, 514,390), arcs across the top,
// curves down-right through the hook, then curls back left into the
// fimbriae opening. Control points tuned against the rendered PNG in-browser.
//
// The click target below starts at (722,188), past the first segment —
// the wide funnel where the tube flares out to meet the uterus wall — so
// clicking that funnel/junction area is attributed to the uterus, not
// the tube.
const TUBE_HIT_PATH =
  'M 722,188 ' +
  'C 820,150 950,110 1044,114 ' +
  'C 1120,118 1170,140 1160,280 ' +
  'C 1150,380 1120,460 1089,498'

// ── Ovary ─────────────────────────────────────────────────────────────────────

// Shifts the whole ovary group (ovary + follicles + corpus luteum + glow) so
// the ovary's upper-right edge sits under the fimbriae opening at (1089,498).
// Positive x = right, negative y = up. Applied via a single wrapper <g>
// transform in the render tree — the coordinates below stay unchanged.
export const OVARY_DX = -18
export const OVARY_DY = -118

// eggProgress threshold where the persistent dominant-structure element
// hands off from "follicle" to "corpus luteum" (see the collapse-window
// comment below). Shared with StructurePanel so the selected-structure card
// flips at the same instant the on-canvas structure does.
export const FOLLICLE_COLLAPSE_END = 0.06

// Bezier-approximated ellipse (rx=185, ry=150, Bézier factor ≈ 0.5523)
// Centred at (830,630) so the right edge sits at x≈1015, giving a clear
// anatomical gap to the fimbriae opening at (1089,498). Actual on-screen
// position is offset by OVARY_DX/OVARY_DY via the wrapper group.
const OVARY_PATH =
  'M 830,480 ' +
  'C 932,480 1015,547 1015,630 ' +
  'C 1015,713 932,780 830,780 ' +
  'C 728,780 645,713 645,630 ' +
  'C 645,547 728,480 830,480 Z'

// ── Follicle layout ───────────────────────────────────────────────────────────
//
// Index 0 is the persistent dominant candidate.  It is always rendered and
// grows from BASE_R to MAX_DOM_R as dominantFollicleRadius increases.
// Indices 1–11 are recruited antral follicles; each regresses when
// smallFollicleCount drops below its array index (see render logic below).
//
// All positions shifted 50 px left to match the new ovary centre (830,630).
// Each point has ≥40 px clearance from the ovary boundary.

// Normal cycle's smallFollicleCount tops out at 8, so only indices 1–7 ever
// render there and indices 8–11 sit unused. PCOS uses up to 12, so indices
// 1–11 all render — every slot must be distinct. Index 5 was moved from its
// original right/lower-right scatter position onto what was index 8's old
// (then-unused) left-side coordinates; index 8 has since been moved off that
// same spot to its own unused slot to avoid the resulting overlap.
// Exported so BrainLayer can derive its FSH particle endpoints from the same
// list instead of hand-typed coordinates that can (and did) silently drift
// out of sync with where the follicles are actually drawn.
export const FOLLICLE_POSITIONS: [number, number][] = [
  [845, 615],  // [0] dominant candidate — grows with dominantFollicleRadius
  [790, 545], [845, 540], [920, 555],  // upper scatter
  [960, 615], [750, 620], [880, 700],  // [5] moved to the left side (was [940,670])
  [775, 680], [940, 670],              // [8] moved off [5]'s old spot to avoid overlap
  [810, 595], [905, 595], [850, 670],  // inner scatter (unused)
]

export const DOMINANT_IDX = 0   // index of the persistent dominant candidate
const BASE_R       = 18  // resting radius — matches the follic1.svg "cycle-end" scale
export const RECRUITED_R = 27  // radius once FSH drives recruitment — matches follic2.svg scale
const MAX_DOM_R    = 72  // peak dominant follicle radius (~28 % smaller than before)
const CL_PEAK_R    = 62  // corpus luteum at maturity (slightly less than max follicle)

// ── Per-follicle variation table ─────────────────────────────────────────────
// 5 "painting personalities" — cycled through by follicle index.
// Each entry shifts the specular reflection, the broad ambient highlight,
// adds a unique tonal brushmark, and places an edge-irregularity mark at a
// different angle around the rim.  Together they ensure no two follicles look
// like the same stamp while staying within the same illustrated style.
//
//  sX / sY   : specular highlight centre offset (× RECRUITED_R)
//  aOffY     : Blob-A vertical centre offset (negative = above follicle centre)
//  aA        : Blob-A opacity
//  mX / mY   : unique tonal mark centre (× R)
//  mRX / mRY : unique tonal mark radii (× R)
//  mA / mF   : mark opacity / fill colour
//  sBoost    : extra follicleShadeGrad pass for heavier-shadow follicles
//  eX / eY   : edge-irregularity mark position (× R, sits at ~0.87 R from centre)
const FOLLICLE_VARIATIONS = [
  { sX: -0.12, sY: -0.16, aOffY: -0.28, aA: 0.26, mX:  0.42, mY: -0.55, mRX: 0.18, mRY: 0.12, mA: 0.09, mF: '#E8A0AA', sBoost: 0,    eX:  0.21, eY: -0.79 },
  { sX: -0.07, sY: -0.22, aOffY: -0.34, aA: 0.31, mX: -0.50, mY:  0.36, mRX: 0.22, mRY: 0.13, mA: 0.07, mF: '#F4BCBC', sBoost: 0.04, eX:  0.79, eY: -0.21 },
  { sX: -0.17, sY: -0.11, aOffY: -0.23, aA: 0.21, mX:  0.14, mY:  0.64, mRX: 0.16, mRY: 0.11, mA: 0.11, mF: '#E09098', sBoost: 0.02, eX:  0.41, eY:  0.71 },
  { sX: -0.10, sY: -0.20, aOffY: -0.32, aA: 0.29, mX: -0.30, mY: -0.42, mRX: 0.21, mRY: 0.13, mA: 0.08, mF: '#EAB0B6', sBoost: 0.06, eX: -0.71, eY:  0.41 },
  { sX: -0.15, sY: -0.13, aOffY: -0.26, aA: 0.23, mX:  0.52, mY:  0.20, mRX: 0.19, mRY: 0.12, mA: 0.10, mF: '#E898A6', sBoost: 0.03, eX: -0.53, eY: -0.63 },
] as const

// ── Small-follicle silhouette variants ───────────────────────────────────────
// 5 very low-amplitude outlines (shared 1:1 with the personality table above
// via the same i % 5 cycle) — mostly spherical, with just enough per-variant
// difference to avoid looking like a single stamped-out circle. Kept
// deliberately subtle: this should read as "round, hand-painted," not
// "organic blob."
const FOLLICLE_SHAPE_SEEDS = [
  [0.018, 0.010, 0.4, 2.6],
  [0.012, 0.017, 2.0, 0.2],
  [0.020, 0.008, 3.4, 5.5],
  [0.013, 0.015, 1.1, 3.8],
  [0.017, 0.012, 4.6, 1.4],
] as const

function catmullRomClosedLite(pts: [number, number][]): string {
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

function smallFollicleBlobPath(cx: number, cy: number, R: number, seed: number): string {
  const [amp1, amp2, phase1, phase2] = FOLLICLE_SHAPE_SEEDS[seed % FOLLICLE_SHAPE_SEEDS.length]
  const N = 28
  const pts: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2
    const r = R * (1 + amp1 * Math.sin(2 * theta + phase1) + amp2 * Math.sin(3 * theta + phase2))
    pts.push([cx + r * Math.cos(theta), cy + r * Math.sin(theta)])
  }
  return catmullRomClosedLite(pts)
}

// ── Per-follicle shadow/highlight rotation ───────────────────────────────────
// The follicle gradients (follicleOuterGrad/ShadeGrad/RimGrad) all use
// percentage-based centres, so every follicle painted the same lit-upper-left
// / shadow-lower-right direction regardless of where it actually sits on the
// ovary artwork (public/ovary.png) — which is itself lit from the top, with
// its own shading falling off toward the bottom and left. Follicles close to
// the ovary's own shaded rim need their gradient rotated (around their own
// centre) to read consistently with the surface right behind them; follicles
// where the generic direction already roughly matches the local artwork (e.g.
// #4, on the right, closest to the ovary's own lit side) are left untouched.
// Keyed by FOLLICLE_POSITIONS index; anything absent defaults to 0deg.
const FOLLICLE_SHADE_ROTATION: Record<number, number> = {
  1: 180,  // top-left of the top pair — flipped to meet the ovary's shaded top rim
  2: 180,  // top-right of the top pair — same flip
  3: -40,  // upper-right — nudged 20deg, then 60deg counter-clockwise
  5: 140,  // moved onto the left side — was -40deg, then flipped 180deg so the shadow lands on the left
  7: -25,  // lower-left — small nudge, mirrors #3's treatment on the opposite side
}

// Per-follicle shadow-crescent opacity multiplier (default 1 = untouched).
// Keyed by FOLLICLE_POSITIONS index.
const FOLLICLE_SHADE_OPACITY: Record<number, number> = {
  5: 0.55,  // lightened — its shadow read too heavy after the rotation change
}

// ── Egg travel: arc-length parameterized along the fallopian tube ────────────
// Pre-sampled once at module load. No DOM or ref needed.
//
// The egg follows: dominant follicle (845,615)
//   → fimbriae opening (1098,470)   [linear approach, T_APPROACH fraction]
//   → along reversed tube beziers   [arc-length parameterized]
//   → uterine cavity (420,395), between the endometrial linings, closer to
//     the right wall — verified against the rasterized endometrium artwork
//     (see endometrium.ts) rather than eyeballed. The path's final segment
//     (rev seg1 below) crosses from the cornu into the cavity proper.

type Pt2 = [number, number]

function evalCubic(u: number, p0: Pt2, p1: Pt2, p2: Pt2, p3: Pt2): Pt2 {
  const m = 1 - u
  return [
    m*m*m*p0[0] + 3*m*m*u*p1[0] + 3*m*u*u*p2[0] + u*u*u*p3[0],
    m*m*m*p0[1] + 3*m*m*u*p1[1] + 3*m*u*u*p2[1] + u*u*u*p3[1],
  ]
}

// Reversed fallopian tube segments (fimbriae opening → uterine cavity).
// Each entry reverses one segment of TUBE_PATH: swap P0↔P3, swap P1↔P2.
// Control points below are NOT the tube's visual centerline — they were
// solved against the rasterized artwork to minimize the egg disc (15px
// radius) hanging off-image, since a centerline-only fit still let the egg's
// edge clip transparent pixels at the fimbrial gaps and along the funnel.
// The 5th segment is new: the original path ended at (514,390), which sits
// outside the endometrium entirely (59px past the right lining's inner edge,
// 13px past its OUTER edge — resting in the myometrium). It now continues
// through the cornu into the cavity proper, ending between the three
// endometrium sub-paths, biased toward the right lining.
const EGG_TUBE_SEGS: [Pt2, Pt2, Pt2, Pt2][] = [
  [[1098,470], [1110,420], [1160,340], [1160,280]],  // rev seg5 — fimbrial pickup
  [[1160,280], [1170,140], [1120,118], [1044,114]],  // rev seg4
  [[1044,114], [950,110],  [820,150],  [722,188]],   // rev seg3
  [[722,188],  [620,200],  [545,260],  [520,335]],   // rev seg2 — funnel → cornu
  [[520,335],  [492,352],  [455,375],  [420,395]],   // rev seg1 — into the cavity
]

// d attribute for the invisible SVG guide path (matches EGG_TUBE_SEGS)
const EGG_GUIDE_D =
  'M 1098,470 C 1110,420 1160,340 1160,280 ' +
  'C 1170,140 1120,118 1044,114 ' +
  'C 950,110 820,150 722,188 ' +
  'C 620,200 545,260 520,335 ' +
  'C 492,352 455,375 420,395'

// Build arc-length table — 25 uniform samples per segment
const _N = 25
const _tubePts: Pt2[] = []
for (const [p0, p1, p2, p3] of EGG_TUBE_SEGS) {
  for (let k = 0; k < _N; k++) {
    _tubePts.push(evalCubic(k / _N, p0, p1, p2, p3))
  }
}
_tubePts.push([420, 395])

const _arcs: number[] = [0]
for (let i = 1; i < _tubePts.length; i++) {
  const a = _tubePts[i - 1]!
  const b = _tubePts[i]!
  _arcs.push(_arcs[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]))
}
const _totalLen = _arcs[_arcs.length - 1]!

function sampleTube(frac: number): Pt2 {
  const target = Math.max(0, Math.min(1, frac)) * _totalLen
  for (let i = 1; i < _arcs.length; i++) {
    if (_arcs[i]! >= target) {
      const span = _arcs[i]! - _arcs[i - 1]!
      const u = span > 0 ? (target - _arcs[i - 1]!) / span : 0
      const a = _tubePts[i - 1]!
      const b = _tubePts[i]!
      return [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]
    }
  }
  return _tubePts[_tubePts.length - 1]!
}

// Fraction of eggProgress (0–1) used for the follicle→fimbriae approach
const T_APPROACH = 0.18

function eggPosition(t: number, domX: number, domY: number): Pt2 {
  if (t <= T_APPROACH) {
    const frac = t / T_APPROACH
    // dominant follicle position is passed in (positions[DOMINANT_IDX] at
    // the call site) rather than hardcoded, so this follows a condition's
    // folliclePositions override (e.g. PCOS's ring) instead of always
    // assuming the default (845, 615). Shifted by the ovary-group offset
    // (OVARY_DX, OVARY_DY) since EggGroup sits outside that wrapper.
    // Approaching the fimbriae opening at (1098, 470) — matches EGG_TUBE_SEGS'
    // first segment start.
    const startX = domX + OVARY_DX
    const startY = domY + OVARY_DY
    return [startX + (1098 - startX) * frac, startY + (470 - startY) * frac]
  }
  return sampleTube((t - T_APPROACH) / (1 - T_APPROACH))
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  smallFollicleCount: number
  dominantFollicleRadius: number  // 0–1
  corpusLuteumRadius: number      // 0–1
  eggProgress: number             // –1=hidden, 0=just released, 1=in tube
  endometriumThickness: number    // 0–1
  fshLevel: number                // 0–1 — drives FSH glow opacity ("how loud")
  follicleFshDrive: number        // 0–1 — drives follicle growth ("how much grows")
  lhLevel: number                 // 0–1 — drives dominant follicle activation ring
  progesteroneLevel: number       // 0–1 — drives endometrium secretory response
  zoomLevel?: number
  onStructureClick: (id: string) => void
  // Condition-specific override for follicle placement (e.g. PCOS's
  // peripheral ring). Omitted = the default FOLLICLE_POSITIONS scatter.
  folliclePositions?: readonly (readonly [number, number])[]
}


// Corpus luteum corp1→corp2→corp3 rendering lives in CorpusLuteumRosette.tsx,
// traced from SVG/corp1.svg, SVG/corp2.svg and SVG/corp3.svg.
//
// Maps eggProgress (monotonic from Ovulation Decision through Continue/Restart)
// to a single 0→2 stage value: 0 = corp1, 1 = corp2 (After Release), 2 = corp3
// (Preparation). corp1 forms as the follicle collapses just after Ovulation
// Decision (see the collapse window in the component body), peaks ~0.12, then
// morphs into corp2 by After Release (0.20). corp2 holds, then morphs into
// corp3, reaching full form at Preparation (0.70) — and stays there
// (eggProgress rises monotonically, so nothing reverts afterwards).
function corpusStageFromEggProgress(eggProgress: number): number {
  const HOLD1_END  = 0.12  // corp1 peaks here, then morphs to corp2 by After Release (0.20)
  const MORPH1_END = 0.20  // After Release hard stop — corp2 fully formed
  const HOLD2_END  = 0.40  // a bit before halfway between After Release (0.20) and Preparation (0.70)
  const MORPH2_END = 0.70  // Preparation hard stop — corp3 fully formed

  if (eggProgress <= HOLD1_END) return 0
  if (eggProgress <= MORPH1_END) return (eggProgress - HOLD1_END) / (MORPH1_END - HOLD1_END)
  if (eggProgress <= HOLD2_END) return 1
  if (eggProgress <= MORPH2_END) return 1 + (eggProgress - HOLD2_END) / (MORPH2_END - HOLD2_END)
  return 2
}

export default function AnatomyLayer({
  smallFollicleCount,
  dominantFollicleRadius,
  corpusLuteumRadius,
  eggProgress,
  endometriumThickness,
  fshLevel,
  follicleFshDrive,
  lhLevel,
  progesteroneLevel,
  zoomLevel = 1,
  onStructureClick,
  folliclePositions,
}: Props) {
  // Resolved once per render: every follicle-position read in this component
  // goes through `positions`, never the FOLLICLE_POSITIONS module constant
  // directly, so a condition's override (or its absence) is applied
  // consistently everywhere — the dominant-slot lookup, both follicle render
  // maps, and the FSH glow that tracks them.
  const positions = folliclePositions ?? FOLLICLE_POSITIONS

  // Secretory-phase tint: progesterone transforms the lining from merely
  // "thick" (estrogen-driven proliferation) into glandular, nutrient-rich
  // tissue. Below ~0.3 (PCOS never crosses this — its progesterone stays
  // low because no corpus luteum forms) no tint is applied; above it, a
  // warm overlay fades in atop the base endometrium color, peaking at 0.5
  // opacity once progesterone is fully elevated (normal's Preparation stage).
  const secretoryTintOpacity = Math.min(1, Math.max(0, (progesteroneLevel - 0.25) / 0.5)) * 0.5

  // Endometrium lining — driven directly from endometriumThickness every
  // frame, exactly like dominantFollicleRadius/eggProgress below, so it
  // tracks a timeline drag in real time instead of re-triggering a fresh
  // tween on every prop change (which starved it mid-drag and only let the
  // last tween finish once the drag stopped).
  const endo = endometriumMorph(endometriumThickness)

  // ── Pixel-precise click gating ───────────────────────────────────────────
  // The uterus/tube/ovary click targets below (UTERUS_HIT, TUBE_PATH,
  // OVARY_PATH) are hand-drawn approximations of each PNG's silhouette, not
  // exact traces — so their rough regions can extend past the artwork into
  // the PNG's transparent padding. Each handler below converts the click to
  // that image's native pixel space and only fires if the pixel there is
  // actually opaque, so clicking blank canvas never opens a popup.
  const isOpaqueUterusArt = useImageAlpha('/uterofallop.png')
  const isOpaqueOvaryArt = useImageAlpha('/ovary.png')

  const handleUterusClick = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    const pt = svgLocalPointFromEvent(e)
    if (!pt) { onStructureClick('uterus'); return }
    const nx = (pt.x - UTERUS_ART_X) / (UTERUS_ART_W / UTERUS_ART_NATIVE_W)
    const ny = (pt.y - UTERUS_ART_Y) / (UTERUS_ART_H / UTERUS_ART_NATIVE_H)
    if (isOpaqueUterusArt(nx, ny, 3)) onStructureClick('uterus')
  }, [isOpaqueUterusArt, onStructureClick])

  const handleTubeClick = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    const pt = svgLocalPointFromEvent(e)
    if (!pt) { onStructureClick('fallopian-tube'); return }
    const nx = (pt.x - UTERUS_ART_X) / (UTERUS_ART_W / UTERUS_ART_NATIVE_W)
    const ny = (pt.y - UTERUS_ART_Y) / (UTERUS_ART_H / UTERUS_ART_NATIVE_H)
    // Wider tolerance than the uterus check: the fimbriae fan out into
    // separate fingers with small gaps of blank canvas between them, and
    // clicking those gaps should still register as "the tube" (one region),
    // not fall through as a blank-canvas click.
    if (isOpaqueUterusArt(nx, ny, 18)) onStructureClick('fallopian-tube')
  }, [isOpaqueUterusArt, onStructureClick])

  const handleOvaryClick = useCallback((e: React.MouseEvent<SVGPathElement>) => {
    const pt = svgLocalPointFromEvent(e)
    if (!pt) { onStructureClick('ovary'); return }
    const nx = (pt.x - OVARY_ART_X) / (OVARY_ART_W / OVARY_ART_NATIVE_W)
    const ny = (pt.y - OVARY_ART_Y) / (OVARY_ART_H / OVARY_ART_NATIVE_H)
    if (isOpaqueOvaryArt(nx, ny, 3)) onStructureClick('ovary')
  }, [isOpaqueOvaryArt, onStructureClick])

  // ── Persistent dominant structure: follicle → ruptured follicle → CL ────
  // One SVG element lives here through the entire lifecycle.
  // Nothing is deleted or created; only r, fill, and stroke morph.
  const isPreOvulation = eggProgress < 0
  const tEgg = Math.max(0, Math.min(1, eggProgress))        // 0→1 after egg release
  const tCL  = Math.max(0, Math.min(1, corpusLuteumRadius)) // 0→1 CL maturity

  // ── Post-ovulation collapse window ───────────────────────────────────────
  // The intact Graafian follicle stays whole through the Ovulation Decision
  // rest (eggProgress = 0), then buckles into corp1 over eggProgress 0 → 0.06.
  // The follicle fades out across that window while corp1 fades in over
  // 0 → 0.10, so corp1 emerges *from* the collapsing follicle rather than
  // popping in. corp1 peaks ~0.12, then morphs on to corp2 by After Release.
  const COLLAPSE_END    = FOLLICLE_COLLAPSE_END
  const follicleFadeOut = Math.min(1, Math.max(0, 1 - eggProgress / COLLAPSE_END)) // 1 at eP≤0 → 0 at eP≥0.06
  const corp1FadeIn     = Math.min(1, Math.max(0, eggProgress / 0.10))             // 0 at eP=0 → 1 at eP≥0.10
  const follicleVisible = eggProgress < COLLAPSE_END

  // Radius: grows as dominant, collapses on rupture, re-expands as CL
  let structR: number
  if (isPreOvulation) {
    structR = Math.max(BASE_R, dominantFollicleRadius * MAX_DOM_R)
  } else {
    const collapseT = Math.min(1, tEgg * 5)               // collapses in first 20 % of egg travel
    const rupturedR = MAX_DOM_R * (1 - 0.28 * collapseT)  // 72 → ~52 px
    structR         = rupturedR + (CL_PEAK_R - rupturedR) * tCL  // ~52 → 62 px as CL matures
  }

  // Corpus luteum evolution — corp1 (forms just after Ovulation Decision) →
  // corp2 (After Release) → corp3 (Preparation), rendered by CorpusLuteumRosette
  // as one continuously-morphing structure. See corpusStageFromEggProgress above.
  const corpusStageT = isPreOvulation ? 0 : corpusStageFromEggProgress(eggProgress)

  const showGranulosa = zoomLevel >= 2.5 && structR > 20 && isPreOvulation

  // Dominant follicle visual evolution across competition→dominant→ovulation-decision stages.
  // follic3T: fades in the antral follicle look (granulosa wall ring + bump ring) starting
  //           a bit after competition (DR=0.63) and reaching full appearance by early dominant (DR=0.77).
  // follic5T: fades in the Graafian antrum look as the dominant follicle matures (DR 0.88→0.97) and —
  //           crucially — HOLDS at full through the Ovulation Decision rest (eggProgress = 0), only
  //           deflating over the collapse window (eggProgress 0 → 0.06) as the follicle buckles.
  const follic3T = Math.min(1, Math.max(0, (dominantFollicleRadius - 0.63) / 0.14))
  const follic5Base = Math.min(1, Math.max(0, (dominantFollicleRadius - 0.88) / 0.09))
  const follic5T = eggProgress <= 0 ? follic5Base : follicleFadeOut

  // Egg — a single constant-size egg.svg, present from the very first stage
  // (in the dominant candidate follicle, even while it's still small) and never
  // rescaled: the follicle grows around it, and after ovulation the same egg
  // travels up the tube.  Replaces the old crossfading in-follicle oocyte.
  // Pre-ovulation it sits at the follicle centre (eggPosition(0) === centre).
  const eggVisible = eggProgress >= 0 || isPreOvulation   // always: in the follicle, then up the tube

  const [domFX, domFY] = positions[DOMINANT_IDX]

  return (
    <g>

      {/* Follicle glyph gradients — warm-shifted to sit cohesively on the ovary PNG.
          Hues align with the ovary's painted salmon-rose palette; the organic
          blob layers below replace any procedural noise. */}
      <defs>
        {/* Outer membrane: #FFC9C9 mid-tone, lit upper-left (all 7 stops shifted by
            the same tiny delta from the previous #FFCECE mid-tone, preserving the
            gradient's painterly shape). Shared by every follicle, small and dominant.
            Extra stops at 20 % and 54 % create a non-monotonic dip then lift — the
            gradient no longer eases perfectly, giving a painted rather than rendered look. */}
        <radialGradient id="follicleOuterGrad" cx="33%" cy="25%" r="71%">
          <stop offset="0%"   stopColor="#FFE3E3" />
          <stop offset="20%"  stopColor="#FFD3D5" />
          <stop offset="36%"  stopColor="#FFC9C9" />
          <stop offset="54%"  stopColor="#F8BFC3" />
          <stop offset="70%"  stopColor="#EAA3AB" />
          <stop offset="84%"  stopColor="#E2959F" />
          <stop offset="100%" stopColor="#C87383" />
        </radialGradient>
        {/* Antrum ring: now near-white (#FEF2F2 mid-tone) — colors swapped with core.
            Stop positions and gradient shape unchanged; only the colour palette swapped. */}
        <radialGradient id="follicleRingGrad" cx="35%" cy="29%" r="68%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="26%"  stopColor="#FFF0F0" />
          <stop offset="45%"  stopColor="#FFE4E4" />
          <stop offset="62%"  stopColor="#FFE0E0" />
          <stop offset="80%"  stopColor="#FADDDD" />
          <stop offset="92%"  stopColor="#F6D2D2" />
          <stop offset="100%" stopColor="#F0CCCC" />
        </radialGradient>
        {/* Fluid core: now medium pink (#FAB0B0 mid-tone) — colors swapped with ring.
            Stop positions and gradient shape unchanged; only the colour palette swapped. */}
        <radialGradient id="follicleCoreGrad" cx="38%" cy="32%" r="63%">
          <stop offset="0%"   stopColor="#FDD0D0" />
          <stop offset="28%"  stopColor="#FCC4C4" />
          <stop offset="52%"  stopColor="#FAB0B0" />
          <stop offset="70%"  stopColor="#F4A8A8" />
          <stop offset="88%"  stopColor="#EC9898" />
          <stop offset="100%" stopColor="#E89090" />
        </radialGradient>
        {/* Shadow crescent: slight opacity plateau at 28 % — pigment pooling effect */}
        <radialGradient id="follicleShadeGrad" cx="66%" cy="71%" r="61%">
          <stop offset="0%"   stopColor="#8A3040" stopOpacity="0.17" />
          <stop offset="28%"  stopColor="#8A3040" stopOpacity="0.13" />
          <stop offset="52%"  stopColor="#8A3040" stopOpacity="0.06" />
          <stop offset="72%"  stopColor="#8A3040" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#8A3040" stopOpacity="0.01" />
        </radialGradient>
        {/* Rim/crevice shadow: non-monotonic — rises to 0.13 at 84 %, dips to 0.08 at 90 %,
            then to 0.20 at edge.  The dip creates a subtle inner light ring before the
            outer dark band, mimicking how brush edges feather on rough paper/tissue. */}
        <radialGradient id="follicleRimGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#7A2838" stopOpacity="0" />
          <stop offset="60%"  stopColor="#7A2838" stopOpacity="0" />
          <stop offset="74%"  stopColor="#7A2838" stopOpacity="0.04" />
          <stop offset="84%"  stopColor="#7A2838" stopOpacity="0.13" />
          <stop offset="90%"  stopColor="#7A2838" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#7A2838" stopOpacity="0.20" />
        </radialGradient>
        {/* Egg outer: lit upper-left, rosy at edge */}
        <radialGradient id="eggOuterGrad" cx="33%" cy="25%" r="71%">
          <stop offset="0%"   stopColor="#FEFCFC" />
          <stop offset="25%"  stopColor="#FFF4F4" />
          <stop offset="50%"  stopColor="#FFE4E4" />
          <stop offset="72%"  stopColor="#F8D0D0" />
          <stop offset="88%"  stopColor="#F0BCBC" />
          <stop offset="100%" stopColor="#E8A8A8" />
        </radialGradient>
        {/* Egg interior wash (component #3): subtle, slightly-darker accent — not meant to read as directional lighting */}
        <linearGradient id="eggWashGrad" x1="20%" y1="15%" x2="80%" y2="85%">
          <stop offset="0%"   stopColor="#FFE9E9" />
          <stop offset="100%" stopColor="#F5D6D6" />
        </linearGradient>
      </defs>
      {/* Corp1/corp2/corp3 gradients now live inside CorpusLuteumRosette,
          which blends its own stop colours by stageT instead of using
          separate static gradients per stage. */}

      {/* Shifts the ovary, all follicles, the dominant structure, corpus
          luteum, FSH glow, LH ring, and granulosa cells together so the
          ovary's upper-right edge tucks under the fimbriae opening. The egg
          (EggGroup, below) lives outside this wrapper — its start point is
          adjusted separately in eggPosition(). */}
      <g transform={`translate(${OVARY_DX}, ${OVARY_DY})`}>

      {/* ── OvaryGroup — rendered BEFORE UterusTubeGroup so the uterus body ──
           tucks the ovary's stalk behind it.                               */}
      <g id="OvaryGroup">
        {/* Not itself clickable — SVG <image> hit-tests its full rectangular
            bounding box regardless of the raster's transparency, which let
            clicks on blank canvas register as the ovary. The invisible path
            below (gated by real pixel alpha) is the only click target. */}
        <image
          href="/ovary.png"
          x={OVARY_ART_X} y={OVARY_ART_Y}
          width={OVARY_ART_W} height={OVARY_ART_H}
          style={{ pointerEvents: 'none' }}
        />
        {/* Invisible boundary path — rough candidate region; handleOvaryClick
            gates the actual popup on real pixel alpha (see above). */}
        <path
          d={OVARY_PATH}
          fill="transparent"
          style={{ cursor: 'pointer', pointerEvents: 'fill' }}
          onClick={handleOvaryClick}
        />
      </g>

      {/*
        FSH follicle-stimulation glow.
        Each visible follicle emits a soft yellow halo when FSH is active,
        visually showing that FSH is the cause of follicle growth.
        Rendered between OvaryGroup and FolliclesGroup so glows sit behind
        the follicle circles.
      */}
      {fshLevel > 0.10 && (
        <g id="FSHGlowGroup" style={{ pointerEvents: 'none' }}>
          {positions.map(([fx, fy], i) => {
            if (i === DOMINANT_IDX) {
              if (!isPreOvulation || dominantFollicleRadius < 0.06) return null
              const gr = structR + 7
              return (
                <motion.circle key="fsh-glow-dom" cx={fx} cy={fy} r={gr}
                  fill="rgba(154,138,200,0.22)"
                  stroke="rgba(154,138,200,0.42)" strokeWidth={1.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.min(0.85, fshLevel * 0.95) }}
                  transition={{ duration: 0.5 }}
                />
              )
            }
            const fraction = Math.min(1, Math.max(0, smallFollicleCount - i))
            if (fraction < 0.12) return null
            // Follicles swell from the follic1.svg scale toward the larger
            // follic2.svg scale as FSH rises through recruitment — the glow
            // ring tracks the same growth so it always sits just outside
            // the visible follicle body. Driven by follicleFshDrive (not raw
            // fshLevel) so a condition can keep the glow bright while
            // suppressing actual growth — see the Props comment.
            const growT   = Math.min(1, Math.max(0, (follicleFshDrive - 0.20) / 0.45))
            const targetR = BASE_R + (RECRUITED_R - BASE_R) * growT
            return (
              <motion.circle key={`fsh-glow-${i}`} cx={fx} cy={fy} r={targetR * fraction + 5}
                fill="rgba(154,138,200,0.18)"
                stroke="rgba(154,138,200,0.36)" strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: Math.min(0.80, fshLevel * 0.88) }}
                transition={{ duration: 0.5 }}
              />
            )
          })}
        </g>
      )}

      {/* ── FolliclesGroup ────────────────────────────────────────────────── */}
      <g id="FolliclesGroup">
        {/*
          Non-dominant recruited follicles (indices 1–11): regress via atresia.

          Visual style matches the follic1.svg ("cycle-end") / follic2.svg
          ("recruitment") reference illustrations — a pale outer membrane,
          a darker antrum ring, and a bright specular core. Each follicle is
          drawn once at the larger RECRUITED_R geometry and uniformly scaled,
          so the outer body, ring, and highlight stay proportional and in
          lock-step as the follicle grows or regresses — giving a continuous
          biological transformation rather than a swap between two images.
        */}
        {positions.map(([fx, fy], i) => {
          if (i === DOMINANT_IDX) return null  // dominant handled separately below

          const fraction = Math.min(1, Math.max(0, smallFollicleCount - i))
          if (fraction < 0.02) return null

          // FSH-driven growth: follic1 scale (BASE_R) at cycle-end →
          // follic2 scale (RECRUITED_R) once FSH rises through recruitment.
          // Driven by follicleFshDrive, not raw fshLevel — see Props comment.
          const growT   = Math.min(1, Math.max(0, (follicleFshDrive - 0.20) / 0.45))
          const targetR = BASE_R + (RECRUITED_R - BASE_R) * growT
          const scale   = (targetR / RECRUITED_R) * fraction

          if (scale < 0.03) return null

          // Pick this follicle's painting personality (cycles every 5) — the
          // matching shape-seed cycle reuses the same index, so a personality
          // and its silhouette always travel together.
          const v = FOLLICLE_VARIATIONS[i % FOLLICLE_VARIATIONS.length]
          const blobPath = smallFollicleBlobPath(fx, fy, RECRUITED_R, i)
          const shadeRotation = FOLLICLE_SHADE_ROTATION[i] ?? 0
          const shadeOpacity = FOLLICLE_SHADE_OPACITY[i] ?? 1

          return (
            <motion.g
              key={`follicle-${i}`}
              style={{ cursor: 'pointer', transformOrigin: `${fx}px ${fy}px` }}
              onClick={() => onStructureClick('follicle')}
              initial={{ scale: 0, opacity: 0, rotate: shadeRotation }}
              animate={{ scale, opacity: fraction, rotate: shadeRotation }}
              transition={{ duration: 0.5 }}
            >
              {/* 1 · Outer membrane — slightly irregular silhouette, not a perfect circle */}
              <path d={blobPath} fill="url(#follicleOuterGrad)" />
              {/* 2 · Shadow crescent — 10% lighter (outer ring only; follicleShadeGrad
                  is reused elsewhere at its own opacity, e.g. the granulosa wall ring
                  below, so the lightening is scoped here via opacity, not the shared
                  gradient's own stops). */}
              <path d={blobPath} fill="url(#follicleShadeGrad)" opacity={shadeOpacity * 0.9} />
              {/* Per-follicle shadow weight — some follicles carry heavier pigment */}
              {v.sBoost > 0 && (
                <path d={blobPath} fill="url(#follicleShadeGrad)" opacity={v.sBoost * shadeOpacity * 0.9} />
              )}
              {/* 3 · Crevice / rim shadow — 10% lighter (outer ring only) */}
              <path d={blobPath} fill="url(#follicleRimGrad)" opacity={0.9} />

              {/* ── Organic texture blobs ── */}

              {/* A · Ambient highlight wash — vertical centre varies per follicle,
                      shifting where the broad light falls across the membrane */}
              <ellipse
                cx={fx - RECRUITED_R * 0.08} cy={fy + RECRUITED_R * v.aOffY}
                rx={RECRUITED_R * 0.68} ry={RECRUITED_R * 0.44}
                fill="#FFEAEC" opacity={v.aA}
              />
              {/* B · Right-centre warming tone */}
              <ellipse
                cx={fx + RECRUITED_R * 0.32} cy={fy + RECRUITED_R * 0.06}
                rx={RECRUITED_R * 0.32} ry={RECRUITED_R * 0.50}
                fill="#E5ACBA" opacity={0.09}
                transform={`rotate(-22,${fx + RECRUITED_R * 0.32},${fy + RECRUITED_R * 0.06})`}
              />
              {/* C · Lower form shadow */}
              <ellipse
                cx={fx + RECRUITED_R * 0.10} cy={fy + RECRUITED_R * 0.52}
                rx={RECRUITED_R * 0.50} ry={RECRUITED_R * 0.26}
                fill="#C07888" opacity={0.10}
              />
              {/* D · Left subsurface scatter */}
              <ellipse
                cx={fx - RECRUITED_R * 0.26} cy={fy - RECRUITED_R * 0.12}
                rx={RECRUITED_R * 0.28} ry={RECRUITED_R * 0.42}
                fill="#FFF0F2" opacity={0.28}
                transform={`rotate(8,${fx - RECRUITED_R * 0.26},${fy - RECRUITED_R * 0.12})`}
              />

              {/* Unique tonal mark — a single brushstroke placed at a different
                  position for each personality so no two follicles share the same
                  tonal arrangement */}
              <ellipse
                cx={fx + RECRUITED_R * v.mX} cy={fy + RECRUITED_R * v.mY}
                rx={RECRUITED_R * v.mRX} ry={RECRUITED_R * v.mRY}
                fill={v.mF} opacity={v.mA}
              />

              {/* Edge irregularity — subtle dark ellipse near the rim at a unique
                  angle, breaking the optically perfect circle silhouette */}
              <ellipse
                cx={fx + RECRUITED_R * v.eX} cy={fy + RECRUITED_R * v.eY}
                rx={RECRUITED_R * 0.14} ry={RECRUITED_R * 0.11}
                fill="#C07888" opacity={0.10}
              />

              {/* ── Outer-ring surface bumps ── */}
              <ellipse cx={fx + RECRUITED_R * 0.02} cy={fy - RECRUITED_R * 0.78}
                rx={RECRUITED_R * 0.13} ry={RECRUITED_R * 0.11} fill="#FFE8EC" opacity={0.27} />
              <ellipse cx={fx + RECRUITED_R * 0.56} cy={fy - RECRUITED_R * 0.50}
                rx={RECRUITED_R * 0.11} ry={RECRUITED_R * 0.09} fill="#FFE0E8" opacity={0.21} />
              <ellipse cx={fx + RECRUITED_R * 0.76} cy={fy + RECRUITED_R * 0.20}
                rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.10} fill="#F8CCCC" opacity={0.18} />
              <ellipse cx={fx - RECRUITED_R * 0.36} cy={fy + RECRUITED_R * 0.72}
                rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.09} fill="#F4C8CC" opacity={0.16} />
              <ellipse cx={fx - RECRUITED_R * 0.74} cy={fy - RECRUITED_R * 0.12}
                rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.10} fill="#FFDCE4" opacity={0.22} />

              {/* 4 · Antrum ring */}
              <circle cx={fx} cy={fy} r={RECRUITED_R * 0.62} fill="url(#follicleRingGrad)" opacity={0.92} />

              {/* E · Antrum interior shadow */}
              <ellipse
                cx={fx + RECRUITED_R * 0.04} cy={fy + RECRUITED_R * 0.28}
                rx={RECRUITED_R * 0.36} ry={RECRUITED_R * 0.20}
                fill="#C07888" opacity={0.10}
              />

              {/* ── Inner-ring surface bumps ── */}
              <ellipse cx={fx - RECRUITED_R * 0.26} cy={fy - RECRUITED_R * 0.42}
                rx={RECRUITED_R * 0.09} ry={RECRUITED_R * 0.07} fill="#FFE4E8" opacity={0.22} />
              <ellipse cx={fx + RECRUITED_R * 0.30} cy={fy + RECRUITED_R * 0.32}
                rx={RECRUITED_R * 0.09} ry={RECRUITED_R * 0.07} fill="#F8C8CC" opacity={0.16} />

              {/* 5 · Fluid core */}
              <circle cx={fx} cy={fy} r={RECRUITED_R * 0.24} fill="url(#follicleCoreGrad)" />
              {/* 6 · Specular — position varies per follicle personality, creating
                      different reflected-light angles across neighbouring follicles */}
              <ellipse
                cx={fx + RECRUITED_R * v.sX} cy={fy + RECRUITED_R * v.sY}
                rx={RECRUITED_R * 0.20} ry={RECRUITED_R * 0.14}
                fill="#FFFFFF" opacity={0.52}
              />
            </motion.g>
          )
        })}

        {/*
          Persistent dominant structure.
          This single group morphs continuously through all lifecycle stages:
            • Dominant follicle (white, growing)
            • Ruptured follicle (rose-pink, slightly collapsed)
            • Corpus luteum (orange, re-inflated, dark border + inner core)
          Nothing is deleted or created — only r, fill, stroke, and inner
          opacity change as eggProgress and corpusLuteumRadius increase.
        */}
        {structR > 0.5 && (
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onStructureClick(eggProgress < COLLAPSE_END ? 'follicle' : 'corpus-luteum')}
          >
            {/* Invisible hit target. CorpusLuteumRosette (and Corp1/2/3Lobes)
                render their artwork with pointerEvents:'none', so once the
                follicle fades out (follicleVisible = false) this group would
                have no interactive descendant left and the click handler
                above would be unreachable — the corpus luteum phase would be
                permanently unclickable. This transparent circle guarantees an
                always-present hit area; it sits behind the visible artwork so
                it never affects appearance, and during the follicle phase the
                follicle art on top still routes to the same handler. */}
            <circle
              cx={domFX} cy={domFY} r={structR}
              fill="transparent"
              style={{ pointerEvents: 'fill' }}
            />
            {follicleVisible && (
              /*
                Graafian follicle: stays fully intact through the Ovulation
                Decision rest (eP = 0), then buckles/deflates and fades out
                across the collapse window (eP 0 → 0.06) as corp1 forms.
              */
              <motion.g
                key="dom-structure"
                style={{ transformOrigin: `${domFX}px ${domFY}px` }}
                animate={{ scale: structR / RECRUITED_R }}
                transition={{ duration: 0.5 }}
                opacity={0.94 * follicleFadeOut}
              >
                {/* 1 · Outer membrane */}
                <circle cx={domFX} cy={domFY} r={RECRUITED_R} fill="url(#follicleOuterGrad)" />
                {/* 2 · Shadow crescent — 10% lighter (outer ring only; see small-follicle
                    note above about follicleShadeGrad being reused elsewhere) */}
                <circle cx={domFX} cy={domFY} r={RECRUITED_R} fill="url(#follicleShadeGrad)" opacity={0.9} />
                {/* 3 · Crevice/rim shadow — 10% lighter (outer ring only) */}
                <circle cx={domFX} cy={domFY} r={RECRUITED_R} fill="url(#follicleRimGrad)" opacity={0.9} />

                {/* A · Ambient highlight */}
                <ellipse
                  cx={domFX - RECRUITED_R * 0.08} cy={domFY - RECRUITED_R * 0.31}
                  rx={RECRUITED_R * 0.68} ry={RECRUITED_R * 0.44}
                  fill="#FFEAEC" opacity={0.28}
                />
                {/* B · Right-centre warming tone */}
                <ellipse
                  cx={domFX + RECRUITED_R * 0.32} cy={domFY + RECRUITED_R * 0.06}
                  rx={RECRUITED_R * 0.32} ry={RECRUITED_R * 0.50}
                  fill="#E5ACBA" opacity={0.09}
                  transform={`rotate(-22,${domFX + RECRUITED_R * 0.32},${domFY + RECRUITED_R * 0.06})`}
                />
                {/* C · Lower form shadow */}
                <ellipse
                  cx={domFX + RECRUITED_R * 0.10} cy={domFY + RECRUITED_R * 0.52}
                  rx={RECRUITED_R * 0.50} ry={RECRUITED_R * 0.26}
                  fill="#C07888" opacity={0.10}
                />
                {/* D · Left subsurface scatter */}
                <ellipse
                  cx={domFX - RECRUITED_R * 0.26} cy={domFY - RECRUITED_R * 0.12}
                  rx={RECRUITED_R * 0.28} ry={RECRUITED_R * 0.42}
                  fill="#FFF0F2" opacity={0.28}
                  transform={`rotate(8,${domFX - RECRUITED_R * 0.26},${domFY - RECRUITED_R * 0.12})`}
                />

                {/* Dominant follicle unique tonal mark */}
                <ellipse
                  cx={domFX + RECRUITED_R * 0.38} cy={domFY + RECRUITED_R * 0.50}
                  rx={RECRUITED_R * 0.21} ry={RECRUITED_R * 0.14}
                  fill="#ECA0A8" opacity={0.09}
                />

                {/* Edge irregularity — bottom rim */}
                <ellipse
                  cx={domFX - RECRUITED_R * 0.16} cy={domFY + RECRUITED_R * 0.86}
                  rx={RECRUITED_R * 0.14} ry={RECRUITED_R * 0.11}
                  fill="#C07888" opacity={0.10}
                />

                {/* ── Follic3: mural granulosa cell wall ring ───────────────────────
                    Appears during competition→dominant transition.  Darker annular band
                    (visible between this 0.80R circle and the antrum ring below)
                    represents the thickening granulosa cell layer of an antral follicle.
                    Deepens to #E9B1B1 in follic5 as the wall thickens further. */}
                {follic3T > 0 && (
                  <>
                    <circle cx={domFX} cy={domFY} r={RECRUITED_R * 0.80}
                      fill="#F7C3C3" opacity={follic3T * 0.82} />
                    <circle cx={domFX} cy={domFY} r={RECRUITED_R * 0.80}
                      fill="url(#follicleShadeGrad)" opacity={follic3T * 0.40} />
                    {follic5T > 0 && (
                      <circle cx={domFX} cy={domFY} r={RECRUITED_R * 0.80}
                        fill="#E9B1B1" opacity={follic5T * 0.55} />
                    )}
                  </>
                )}

                {/* ── Outer-ring surface bumps ─────────────────────────────────── */}
                <ellipse cx={domFX + RECRUITED_R * 0.02} cy={domFY - RECRUITED_R * 0.78}
                  rx={RECRUITED_R * 0.13} ry={RECRUITED_R * 0.11} fill="#FFE8EC" opacity={0.27} />
                <ellipse cx={domFX + RECRUITED_R * 0.56} cy={domFY - RECRUITED_R * 0.50}
                  rx={RECRUITED_R * 0.11} ry={RECRUITED_R * 0.09} fill="#FFE0E8" opacity={0.21} />
                <ellipse cx={domFX + RECRUITED_R * 0.76} cy={domFY + RECRUITED_R * 0.20}
                  rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.10} fill="#F8CCCC" opacity={0.18} />
                <ellipse cx={domFX - RECRUITED_R * 0.36} cy={domFY + RECRUITED_R * 0.72}
                  rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.09} fill="#F4C8CC" opacity={0.16} />
                <ellipse cx={domFX - RECRUITED_R * 0.74} cy={domFY - RECRUITED_R * 0.12}
                  rx={RECRUITED_R * 0.12} ry={RECRUITED_R * 0.10} fill="#FFDCE4" opacity={0.22} />

                {/* ── Follic5: antrum depth lighting ───────────────────────────────
                    As antrum fluid expands the lower cavity darkens (fluid absorption)
                    and the upper area brightens (transmitted light through thin wall). */}
                {follic5T > 0 && (
                  <>
                    <ellipse
                      cx={domFX + RECRUITED_R * 0.05} cy={domFY + RECRUITED_R * 0.24}
                      rx={RECRUITED_R * 0.58} ry={RECRUITED_R * 0.35}
                      fill="#D99D9D" opacity={follic5T * 0.28}
                    />
                    <ellipse
                      cx={domFX - RECRUITED_R * 0.04} cy={domFY - RECRUITED_R * 0.18}
                      rx={RECRUITED_R * 0.46} ry={RECRUITED_R * 0.28}
                      fill="#FFEDED" opacity={follic5T * 0.36}
                    />
                  </>
                )}

                {/* 4 · Antrum ring — radius expands as fluid accumulates (follic5) */}
                <circle cx={domFX} cy={domFY}
                  r={RECRUITED_R * (0.62 + follic5T * 0.12)}
                  fill="url(#follicleRingGrad)" opacity={0.92} />

                {/* ── Granulosa cell bump ring ─────────────────────────────────────
                    22 pearl-like bumps at the granulosa-antrum boundary (corona radiata /
                    mural granulosa cells lining the inner follicle wall).  Colors shift
                    lit→shadow around the ring following upper-left illumination.
                    Bumps grow slightly larger in follic5 as the antrum wall matures. */}
                {follic3T > 0 && (
                  <>
                    {Array.from({ length: 22 }, (_, b) => {
                      const angle = (b / 22) * Math.PI * 2 - Math.PI / 2
                      const ringR = RECRUITED_R * (0.62 + follic5T * 0.12)
                      const bx = domFX + Math.cos(angle) * ringR
                      const by = domFY + Math.sin(angle) * ringR
                      // Lighting peaks at upper-left (angle ≈ −135° from +x axis)
                      const litF = (Math.cos(angle + Math.PI * 0.75) + 1) / 2
                      const bumpFill = litF > 0.60 ? '#FFF4F4' : litF > 0.28 ? '#F9DBDB' : '#F1BBBB'
                      const br = RECRUITED_R * (0.096 + follic5T * 0.020)
                      return (
                        <g key={`gbump-${b}`}>
                          <ellipse
                            cx={bx} cy={by}
                            rx={br} ry={br * 0.91}
                            fill={bumpFill}
                            opacity={follic3T * (0.72 + litF * 0.28)}
                          />
                          <ellipse
                            cx={bx - br * 0.24} cy={by - br * 0.26}
                            rx={br * 0.38} ry={br * 0.30}
                            fill="#FFFAFA"
                            opacity={follic3T * litF * 0.62}
                          />
                        </g>
                      )
                    })}
                  </>
                )}

                {/* E · Antrum interior shadow */}
                <ellipse
                  cx={domFX + RECRUITED_R * 0.04} cy={domFY + RECRUITED_R * 0.28}
                  rx={RECRUITED_R * 0.36} ry={RECRUITED_R * 0.20}
                  fill="#C07888" opacity={0.10}
                />

                {/* ── Inner-ring surface bumps ──────────────────────────────────── */}
                <ellipse cx={domFX - RECRUITED_R * 0.26} cy={domFY - RECRUITED_R * 0.42}
                  rx={RECRUITED_R * 0.09} ry={RECRUITED_R * 0.07} fill="#FFE4E8" opacity={0.22} />
                <ellipse cx={domFX + RECRUITED_R * 0.30} cy={domFY + RECRUITED_R * 0.32}
                  rx={RECRUITED_R * 0.09} ry={RECRUITED_R * 0.07} fill="#F8C8CC" opacity={0.16} />

                {/* The oocyte / cumulus-oocyte complex is now drawn once as a
                    constant-size egg.svg in the EggGroup below (identical from
                    the dominant follicle through tube travel), so the old
                    crossfading in-follicle oocyte and cumulus dome are gone. */}
                {/* 6 · Specular — (-0.09, -0.19) unique to dominant follicle */}
                <ellipse
                  cx={domFX - RECRUITED_R * 0.09} cy={domFY - RECRUITED_R * 0.19}
                  rx={RECRUITED_R * 0.20} ry={RECRUITED_R * 0.14}
                  fill="#FFFFFF" opacity={0.52}
                />
              </motion.g>
            )}
            {eggProgress >= 0 && (
              /* Post-ovulation: corp1 forms as the follicle collapses (fading
                 in over the collapse window), then morphs corp2 → corp3.  One
                 continuous structure. */
              <CorpusLuteumRosette
                cx={domFX} cy={domFY} R={structR}
                stageT={corpusStageT}
                opacity={corp1FadeIn}
              />
            )}
          </g>
        )}

        {/*
          LH surge activation ring.
          When LH surges it triggers final follicle maturation and ovulation.
          A pulsing pink ring around the dominant follicle communicates this
          "activation" signal — the follicle wall is about to rupture.
          Only shown pre-ovulation when the follicle is large enough to ovulate.
        */}
        {lhLevel > 0.15 && isPreOvulation && dominantFollicleRadius > 0.12 && structR > BASE_R && (
          <motion.circle
            cx={domFX} cy={domFY}
            r={structR + 16}
            fill="none"
            stroke="rgba(201,104,117,0.80)"
            strokeWidth={4}
            initial={{ opacity: 0, strokeWidth: 3 }}
            animate={{
              opacity: [lhLevel * 0.55, lhLevel * 0.92, lhLevel * 0.55],
              strokeWidth: [3, 5.5, 3],
            }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Granulosa cells — zoom-in detail, pre-ovulation dominant follicle only */}
        {showGranulosa && (
          <>
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <circle
                  key={`gc-${angle}`}
                  cx={domFX + (structR - 12) * Math.cos(rad)}
                  cy={domFY + (structR - 12) * Math.sin(rad)}
                  r={9}
                  fill="var(--lavender)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onStructureClick('granulosa-cells')}
                />
              )
            })}
          </>
        )}
      </g>

      </g>
      {/* ── end ovary-group wrapper (translate OVARY_DX, OVARY_DY) ── */}

      {/* ── UterusTubeGroup — connected uterus+tube PNG, drawn AFTER the ──
           ovary group so the uterus body hides the ovary's stalk behind it. */}
      <g id="UterusTubeGroup">
        {/* Connected illustration — white background removed. Native 1491×1055,
            placed via the shared UTERUS_ART_* box (see top of file). */}
        <image
          href="/uterofallop.png"
          x={UTERUS_ART_X} y={UTERUS_ART_Y}
          width={UTERUS_ART_W} height={UTERUS_ART_H}
          style={{ pointerEvents: 'none' }}
        />

        {/* Invisible click target — uterus body; rough candidate region,
            handleUterusClick gates the actual popup on real pixel alpha. */}
        <path
          d={UTERUS_HIT}
          fill="transparent"
          style={{ cursor: 'pointer', pointerEvents: 'fill' }}
          onClick={handleUterusClick}
        />

        {/* Endometrium — morphs continuously between thin/mid/thick artwork
            (see src/data/endometrium.ts) as endometriumThickness changes.
            Path data shares the uterus PNG's native 1491×1055 coordinate space,
            so it's placed with the EXACT SAME box (translate + the scale that
            box implies) — no independent offset or separate scaleX/scaleY. */}
        <g
          transform={
            `translate(${UTERUS_ART_X}, ${UTERUS_ART_Y}) ` +
            `scale(${UTERUS_ART_W / UTERUS_ART_NATIVE_W}, ${UTERUS_ART_H / UTERUS_ART_NATIVE_H})`
          }
          style={{ cursor: 'pointer' }}
          onClick={() => onStructureClick('endometrium')}
        >
          {endo.paths.map((d, i) => (
            <path key={i} d={d} fill={endo.color} stroke={endo.color} strokeWidth={1} />
          ))}
          {/* Secretory-phase tint — progesterone-driven, see secretoryTintOpacity above */}
          {secretoryTintOpacity > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {endo.paths.map((d, i) => (
                <path key={`secretory-${i}`} d={d} fill="#7A2438" opacity={secretoryTintOpacity} />
              ))}
            </g>
          )}
        </g>

        {/* Invisible thick-stroke click target along the tube centreline;
            rough candidate region, handleTubeClick gates the actual popup on
            real pixel alpha (with a wider tolerance for the fimbriae gaps). */}
        <path
          d={TUBE_HIT_PATH}
          fill="none"
          stroke="transparent"
          strokeWidth="70"
          strokeLinecap="round"
          style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
          onClick={handleTubeClick}
        />
      </g>

      {/* ── EggGroup ──────────────────────────────────────────────────────── */}
      <g id="EggGroup">
        {/* Invisible guide path — documents the egg's arc-length travel route */}
        <path d={EGG_GUIDE_D} fill="none" stroke="none" visibility="hidden" />

        {eggVisible && (() => {
          const [ex, ey] = eggPosition(Math.max(0, eggProgress), domFX, domFY)
          const eggS = 15 / 280
          return (
            <motion.g
              animate={{ x: ex, y: ey }}
              initial={{ x: ex, y: ey }}
              transition={{ duration: 0.5 }}
              style={{ cursor: 'pointer' }}
              onClick={() => onStructureClick('egg')}
            >
              {/* Inline egg paths — scale from 561×558 SVG space, centre (280,279) → (0,0) */}
              <g transform={`translate(${-280 * eggS}, ${-279 * eggS}) scale(${eggS})`}>
                <path className="egg-outer"  d="M17 379C8.5 356.8,3.7 333,1 309C-1.7 285,-1.7 258.2,1 235C3.7 211.8,8.5 191.2,17 170C25.5 148.8,39.3 125.5,52 108C64.7 90.5,75.3 79.3,93 65C110.7 50.7,134.5 32.7,158 22C181.5 11.3,204.8 4.5,234 1C263.2 -2.5,301.2 -4.7,333 1C364.8 6.7,396.3 17.2,425 35C453.7 52.8,483.8 79.7,505 108C526.2 136.3,543 173.8,552 205C561 236.2,563.2 262.2,559 295C554.8 327.8,542.3 370.7,527 402C511.7 433.3,487 462,467 483C447 504,427.7 516.8,407 528C386.3 539.2,367.2 545.2,343 550C318.8 554.8,289.7 558.8,262 557C234.3 555.2,202.7 548.5,177 539C151.3 529.5,128.8 516.2,108 500C87.2 483.8,67.2 462.2,52 442C36.8 421.8,25.5 401.2,17 379Z" fill="url(#eggOuterGrad)" stroke="#FFE4E4" strokeWidth="2" />
                <path className="egg-inner"  d="M34 212C38.5 189,52.3 158.3,56 156C59.7 153.7,56 180.5,56 198C56 215.5,55 236.8,56 261C57 285.2,51.2 315.7,62 343C72.8 370.3,95.5 401.2,121 425C146.5 448.8,172.2 477.7,215 486C257.8 494.3,338.8 485.2,378 475C417.2 464.8,430.5 448.7,450 425C469.5 401.3,486.3 364,495 333C503.7 302,504.7 266.3,502 239C499.3 211.7,489 189.7,479 169C469 148.3,455.7 131.3,442 115C428.3 98.7,414.5 83.3,397 71C379.5 58.7,361.8 46,337 41C312.2 36,275.5 41,248 41C220.5 41,172 44.5,172 41C172 37.5,217.7 21.5,248 20C278.3 18.5,322.7 22.3,354 32C385.3 41.7,411.3 57.3,436 78C460.7 98.7,487 126.3,502 156C517 185.7,523.2 224,526 256C528.8 288,526.8 319.8,519 348C511.2 376.2,496.2 401,479 425C461.8 449,441.2 475.5,416 492C390.8 508.5,360 519.7,328 524C296 528.3,256.8 524.3,224 518C191.2 511.7,156 499,131 486C106 473,86.5 458.3,74 440C61.5 421.7,63.5 400.3,56 376C48.5 351.7,32.7 321.3,29 294C25.3 266.7,29.5 235,34 212Z" fill="#FFCECE" fillOpacity={0.4} />
                <path                        d="M97 367C78.8 337.3,77 280.8,72 258C67 235.2,60.8 224.8,67 230C73.2 235.2,89.2 264.5,109 289C128.8 313.5,151.3 358.8,186 377C220.7 395.2,278.7 402.7,317 398C355.3 393.3,395.5 369.5,416 349C436.5 328.5,436 300.2,440 275C444 249.8,445.5 218.2,440 198C434.5 177.8,415.3 167.8,407 154C398.7 140.2,384.5 116.2,390 115C395.5 113.8,423.3 126.2,440 147C456.7 167.8,481.7 206.3,490 240C498.3 273.7,503.8 314,490 349C476.2 384,437.7 430.8,407 450C376.3 469.2,343.7 466.3,306 464C268.3 461.7,215.8 452.2,181 436C146.2 419.8,115.2 396.7,97 367Z" fill="url(#eggWashGrad)" />
                <path                        d="M81 151C91.5 125.3,110.5 109.7,124 98C137.5 86.3,145.3 85.7,162 81C178.7 76.3,194.5 70,224 70C253.5 70,305.8 71.5,339 81C372.2 90.5,405.8 101.7,423 127C440.2 152.3,442 197.2,442 233C442 268.8,437.3 312.2,423 342C408.7 371.8,379.3 399,356 412C332.7 425,317.5 423,283 420C248.5 417,180.7 407,149 394C117.3 381,107.7 365.7,93 342C78.3 318.3,63 283.8,61 252C59 220.2,70.5 176.7,81 151Z" fill="#FFEDED" />
                <path className="egg-center" d="M182 246C184.5 233,189.5 225.5,197 215C204.5 204.5,214.5 190.7,227 183C239.5 175.3,256.2 170.2,272 169C287.8 167.8,306.5 168.3,322 176C337.5 183.7,355.5 200.7,365 215C374.5 229.3,379 245.7,379 262C379 278.3,373 298.2,365 313C357 327.8,344.2 342.8,331 351C317.8 359.2,302 362,286 362C270 362,248.8 357,235 351C221.2 345,211.8 335.7,203 326C194.2 316.3,185.5 306.3,182 293C178.5 279.7,179.5 259,182 246Z" fill="url(#follicleCoreGrad)" stroke="#E9B1B1" strokeWidth="1" />
                <path                        d="M241 246C244.5 238.5,248.5 235,256 230C263.5 225,276.8 216.8,286 216C295.2 215.2,304.7 218.8,311 225C317.3 231.2,321.8 243.3,324 253C326.2 262.7,328.8 274.3,324 283C319.2 291.7,306.3 302.8,295 305C283.7 307.2,266 301,256 296C246 291,237.5 283.3,235 275C232.5 266.7,237.5 253.5,241 246Z" fill="#FFADAD" />
                <path                        d="M228 233C228 238,234.7 246,239 246C243.3 246,248.8 238,254 233C259.2 228,264.3 218.8,270 216C275.7 213.2,285 217.5,288 216C291 214.5,291.8 208.5,288 207C284.2 205.5,273.2 205.5,265 207C256.8 208.5,245.2 211.7,239 216C232.8 220.3,228 228,228 233Z" fill="#FFE4E4" />
              </g>
            </motion.g>
          )
        })()}
      </g>

    </g>
  )
}
