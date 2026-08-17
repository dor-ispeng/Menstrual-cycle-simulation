'use client'

import { useEffect, useMemo, useRef } from 'react'
import { motion, useAnimate } from 'framer-motion'
import type { AnimationPlaybackControlsWithThen } from 'framer-motion'
import type { HormoneKey, StagePrimaryHormones } from '@/types/simulation'
import { OVARY_DX, OVARY_DY, FOLLICLE_POSITIONS, DOMINANT_IDX } from './AnatomyLayer'
import { clamp } from '@/utils/interpolate'

// ── Brain geometry ─────────────────────────────────────────────────────────────
// Brain structures sit near the very top of the canvas (y ≈ 0–112).
// With the default camera showing anatomy bottom, the brain is above the
// visible area on most screens — users pan upward to inspect it.
const WIN_CX  = 700
const HYP_CY  =  42   // hypothalamus centre
const PIT_CY  =  94   // pituitary centre
const PIT_R   =  18
const EMIT_Y  = PIT_CY + PIT_R   // = 112 — FSH/LH emerge here
const ARRIVE_Y = 60               // ascending hormones converge near hypothalamus

const TIMES = [0, 0.05, 0.95, 1] as const

// ── Hormone colors — must match HormoneGraph COLORS exactly ──────────────────
const C_FSH   = '#9a8ac8'   // purple
const C_LH    = '#c96875'   // rose
const C_EST   = '#e8954a'   // orange
const C_PROG  = '#5aab8a'   // green

// Light/dark companions for the painterly particle body gradient (lit
// upper-left, matching the follicleOuterGrad idiom in AnatomyLayer). The
// base colors above are unchanged — they're the graph legend colors.
const C_FSH_LIGHT  = '#c4b8e0';  const C_FSH_DARK  = '#6d5f96'
const C_LH_LIGHT   = '#e5a3ab';  const C_LH_DARK   = '#96434f'
const C_EST_LIGHT  = '#f5c191';  const C_EST_DARK  = '#b06a2c'
const C_PROG_LIGHT = '#96cfb8';  const C_PROG_DARK = '#3a7a5f'

// Specular highlight color — 70% white / 30% base hormone color (not plain
// white), so the highlight reads as "this particle's own surface catching
// light" rather than a generic white dot dropped on top.
const C_FSH_HILITE  = '#e1dcef'
const C_LH_HILITE   = '#efd2d6'
const C_EST_HILITE  = '#f8dfc9'
const C_PROG_HILITE = '#cee6dc'

type Pt = { sx: number; sy: number; ex: number; ey: number; r: number; delay: number }

// ── Particle pools ─────────────────────────────────────────────────────────────
// Base positions below are canvas-space BEFORE the ovary group's own offset:
// local follicle y + 250 (the anatomy group's translate in SimulationCanvas).
// The ovary group (ovary + follicles + corpus luteum) is then shifted by
// (OVARY_DX, OVARY_DY) inside AnatomyLayer, so every follicle-side endpoint
// here adds that same offset to stay aligned with where the follicles are
// actually drawn. Brain-side coordinates (WIN_CX, EMIT_Y, ARRIVE_Y) are
// unaffected and left as-is.

// FSH: 6 particles fanning toward the follicle ring from the pituitary.
//
// Endpoints are DERIVED from FOLLICLE_POSITIONS (AnatomyLayer's actual
// follicle layout) rather than hand-typed, because hand-typed coordinates
// silently drifted out of sync with where follicles are actually drawn — 4 of
// the previous 6 endpoints landed 34–50px from the nearest follicle (radius
// 27px), i.e. in empty ovary stroma.
//
// Must match SimulationCanvas's exported ANATOMY_GROUP_Y_OFFSET (250). Not
// imported directly — SimulationCanvas imports BrainLayer, so importing back
// would be circular. Every other follicle-side particle endpoint below
// (EST_MULTI_PTS, EST_DOM_PTS, PROG_PTS) already bakes this same +250 into
// its hardcoded sy literal; this constant just makes that assumption
// explicit for the derived FSH endpoints instead of hiding it in arithmetic.
const ANATOMY_GROUP_Y = 250

// particle i (array position, 0–5) targets FOLLICLE_POSITIONS/
// folliclePositions index DEFAULT_FSH_TARGETS[i] — the natural i→i mapping.
// A condition with a non-scatter layout (e.g. PCOS's ring) can override which
// follicle each particle targets via Condition.fshTargetIndices.
const DEFAULT_FSH_TARGETS = [0, 1, 2, 3, 4, 5] as const

// Deterministic per-particle offset (NOT Math.random — must stay stable
// across re-renders, or particles would visibly jump every frame) so each
// FSH particle lands NEAR its target follicle's centre rather than exactly
// on it — reads as plausible biological scatter instead of a laser-precise
// hit. Magnitude ~0.35 × RECRUITED_R (27px) ≈ 9px, comfortably inside even
// the smallest (BASE_R=18) follicle body.
const FSH_JITTER: readonly [number, number][] = [
  [-8, 5], [7, -8], [-6, -9], [9, 6], [-9, 4], [6, 9],
]
const FSH_DELAYS = [0.0, 1.0, 2.0, 0.4, 3.0, 4.0] as const
const FSH_RADII  = [10, 9, 11, 10, 9, 9] as const

function buildFshPoints(
  folliclePositions: readonly (readonly [number, number])[],
  targetIndices: readonly number[],
): Pt[] {
  return targetIndices.map((targetIdx, i) => {
    const pos = folliclePositions[targetIdx] ?? folliclePositions[DOMINANT_IDX]!
    const [fx, fy] = pos
    const [jx, jy] = FSH_JITTER[i % FSH_JITTER.length]!
    return {
      sx: WIN_CX, sy: EMIT_Y,
      ex: fx + jx + OVARY_DX,
      ey: fy + jy + OVARY_DY + ANATOMY_GROUP_Y,
      r: FSH_RADII[i % FSH_RADII.length]!,
      delay: FSH_DELAYS[i % FSH_DELAYS.length]!,
    }
  })
}

// Every remaining follicle-side endpoint below is derived from the same
// `folliclePositions` list for exactly the reason the FSH endpoints are: the
// hand-typed originals had drifted out of registration with where follicles
// are actually drawn. Measured before this change, against the default
// scatter: the 4 estrogen source points sat 14–47px from the nearest follicle
// centre (radius 27), and all 4 LH endpoints clustered 55–60px ABOVE the
// dominant follicle's centre — inside the body only because MAX_DOM_R is 72,
// with their glow spilling past the rim. That LH offset is a fossil of an
// earlier, ~28% larger dominant follicle (see MAX_DOM_R's own comment in
// AnatomyLayer): the follicle was shrunk and these endpoints were never
// brought along with it.

// LH acts on the dominant follicle, so all 4 endpoints resolve to the
// dominant slot with a small deterministic spread — a tight converging
// cluster on the structure that actually ruptures. The spread is kept small
// relative to BASE_R (18) so the cluster still reads as "on the follicle"
// even in conditions where the dominant slot never grows past its resting
// size (PCOS/POI, where dominantFollicleRadius is pinned at 0).
const LH_SPREAD: readonly [number, number][] = [
  [-9, -4], [4, 6], [-3, 7], [8, -5],
]
const LH_DELAYS = [0.0, 0.6, 1.2, 1.8] as const
const LH_RADII  = [13, 12, 11, 10] as const

function buildLhPoints(
  folliclePositions: readonly (readonly [number, number])[],
): Pt[] {
  const [dx, dy] = folliclePositions[DOMINANT_IDX] ?? [845, 615]
  return LH_SPREAD.map(([jx, jy], i) => ({
    sx: WIN_CX, sy: EMIT_Y,
    ex: dx + jx + OVARY_DX,
    ey: dy + jy + OVARY_DY + ANATOMY_GROUP_Y,
    r: LH_RADII[i]!,
    delay: LH_DELAYS[i]!,
  }))
}

// Estrogen from the wider cohort (early cycle) — these flow ovary → brain, so
// the FOLLICLE is the source (sx/sy) and the hypothalamus is the destination.
// Targets reuse the condition's own FSH target list minus the dominant slot:
// the follicles making estrogen are precisely the ones FSH is stimulating
// (FSH drives granulosa aromatase), so sharing the list is biologically
// principled rather than merely convenient — and it means a condition that
// relocates its follicles (PCOS's ring) relocates its estrogen sources too.
const EST_MULTI_ARRIVE_X = [686, 703, 710, 694] as const
const EST_MULTI_SPREAD: readonly [number, number][] = [
  [6, -7], [-8, 5], [7, 8], [-5, -8],
]
const EST_MULTI_DELAYS = [0.0, 1.1, 2.2, 3.3] as const
const EST_MULTI_RADII  = [10, 9, 9, 9] as const

function buildEstMultiPoints(
  folliclePositions: readonly (readonly [number, number])[],
  cohortIndices: readonly number[],
): Pt[] {
  return EST_MULTI_ARRIVE_X.map((arriveX, i) => {
    const targetIdx = cohortIndices[i % Math.max(1, cohortIndices.length)] ?? 1
    const [fx, fy] = folliclePositions[targetIdx] ?? folliclePositions[DOMINANT_IDX]!
    const [jx, jy] = EST_MULTI_SPREAD[i]!
    return {
      sx: fx + jx + OVARY_DX,
      sy: fy + jy + OVARY_DY + ANATOMY_GROUP_Y,
      ex: arriveX, ey: ARRIVE_Y,
      r: EST_MULTI_RADII[i]!,
      delay: EST_MULTI_DELAYS[i]!,
    }
  })
}

// Estrogen and progesterone from the dominant follicle / corpus luteum — one
// source point, the dominant slot, fanning to slightly different arrival
// points on the hypothalamus.
const EST_DOM_ARRIVE_X = [700, 690, 710] as const
const EST_DOM_DELAYS   = [0.0, 0.9, 1.8] as const
const EST_DOM_RADII    = [10, 9, 10] as const
const PROG_ARRIVE_X    = [700, 682, 718, 700] as const
const PROG_DELAYS      = [0.0, 1.0, 2.0, 3.0] as const
const PROG_RADII       = [11, 9, 10, 9] as const

function buildFromDominant(
  folliclePositions: readonly (readonly [number, number])[],
  arriveXs: readonly number[],
  radii: readonly number[],
  delays: readonly number[],
): Pt[] {
  const [dx, dy] = folliclePositions[DOMINANT_IDX] ?? [845, 615]
  return arriveXs.map((arriveX, i) => ({
    sx: dx + OVARY_DX,
    sy: dy + OVARY_DY + ANATOMY_GROUP_Y,
    ex: arriveX, ey: ARRIVE_Y,
    r: radii[i]!,
    delay: delays[i]!,
  }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function levelToOpacity(level: number): number {
  return Math.max(0, Math.min(1, (level - 0.05) / 0.65))
}

function particleGate(level: number, i: number, total: number): number {
  const threshold = ((i + 0.5) / total) * 0.9
  return Math.max(0, Math.min(1, (level - threshold + 0.15) / 0.15))
}

// ── Organic highlight blob ───────────────────────────────────────────────────
// The specular highlight is a small irregular blob (Catmull-Rom spline
// through a wobbled ellipse) rather than a perfect ellipse — a much smaller
// echo of AnatomyLayer's smallFollicleBlobPath — so it reads as an irregular
// catch-light instead of a stamped dot. One shape per variant, paired with
// that variant's position/size.
const HILITE_SHAPE_SEEDS = [
  [0.22, 0.14, 0.6, 3.1],
  [0.16, 0.20, 2.4, 0.8],
  [0.24, 0.12, 4.2, 1.6],
] as const

function highlightBlobPath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const [amp1, amp2, phase1, phase2] = HILITE_SHAPE_SEEDS[seed % HILITE_SHAPE_SEEDS.length]
  const N = 10
  const pts: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2
    const wobble = 1 + amp1 * Math.sin(2 * theta + phase1) + amp2 * Math.sin(3 * theta + phase2)
    pts.push([cx + rx * wobble * Math.cos(theta), cy + ry * wobble * Math.sin(theta)])
  }
  const n = pts.length
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)},${cp2x.toFixed(2)} ${cp2y.toFixed(2)},${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d + 'Z'
}

// ── Particle personality variants ────────────────────────────────────────────
// 3 highlight/shadow arrangements, cycled by index, so particles of the same
// hormone don't read as identical stamped-out spheres. A small-scale echo of
// the follicle "personality" idea in AnatomyLayer (FOLLICLE_VARIATIONS) —
// just highlight + shadow position and size, since particles are tiny.
const PARTICLE_VARIANTS = [
  { specX: -0.30, specY: -0.35, specRX: 0.22, specRY: 0.16,
    shadowX: 0.28, shadowY: 0.32, shadowRX: 0.34, shadowRY: 0.26, shadowOpacity: 0.22 },
  { specX: -0.18, specY: -0.42, specRX: 0.17, specRY: 0.20,
    shadowX: 0.36, shadowY: 0.16, shadowRX: 0.30, shadowRY: 0.30, shadowOpacity: 0.18 },
  { specX: -0.40, specY: -0.18, specRX: 0.15, specRY: 0.24,
    shadowX: 0.16, shadowY: 0.40, shadowRX: 0.28, shadowRY: 0.34, shadowOpacity: 0.26 },
] as const

// ── Hormone particle: glow ring + gradient body + specular ──────────────────
// Position is carried by the inner motion.g's x/y transform (GPU-compositable,
// one animated property) rather than animating cx/cy on each child layer
// separately — same idiom as EggGroup in AnatomyLayer.
type HormoneParticleProps = {
  p: Pt
  opacity: number          // hormone-level driven group opacity
  duration: number         // flight loop duration (seconds)
  ease: 'easeIn' | 'easeOut'
  peakOpacity: number      // flight-path peak opacity (matches prior per-hormone value)
  bodyGradient: string
  glowGradient: string
  glowRadiusMult?: number  // default 1.6; LH uses a smaller value to avoid its
                            // 4 converging particles smudging into one blob
  variantIndex: number     // cycles through PARTICLE_VARIANTS
  hiliteColor: string      // specular tint — the hormone's own lightened color
  shadowColor: string      // shadow tint — the hormone's dark companion color
  isOnAnchor: boolean
  isFrozen: boolean        // guided playback paused on a clicked structure — hold
                            // the particle exactly where it is, mid-flight
}

function HormoneParticle({
  p, opacity, duration, ease, peakOpacity,
  bodyGradient, glowGradient, glowRadiusMult = 1.6,
  variantIndex, hiliteColor, shadowColor, isOnAnchor, isFrozen,
}: HormoneParticleProps) {
  const v = PARTICLE_VARIANTS[variantIndex % PARTICLE_VARIANTS.length]
  // The repeating flight-path animate/transition objects must be
  // referentially stable across re-renders. framer-motion treats a fresh
  // array/object literal on every render as a new animation target and
  // restarts the tween from its first keyframe — for an Infinity-repeat
  // loop that means it silently freezes at frame 0 forever if the parent
  // re-renders before the loop ever completes one cycle. p/peakOpacity/
  // duration/ease never actually change for a given particle, so memoizing
  // on them is safe.
  const flightAnimate = useMemo(() => ({
    x: [p.sx, p.sx, p.ex, p.ex],
    y: [p.sy, p.sy, p.ey, p.ey],
    opacity: [0, peakOpacity, peakOpacity, 0],
  }), [p, peakOpacity])
  const flightTransition = useMemo(() => ({
    duration, repeat: Infinity, repeatType: 'loop' as const,
    delay: p.delay, times: [...TIMES], ease,
  }), [duration, p, ease])
  const hilitePath = useMemo(
    () => highlightBlobPath(p.r * v.specX, p.r * v.specY, p.r * v.specRX, p.r * v.specRY, variantIndex),
    [p, v, variantIndex],
  )

  // The flight loop is driven imperatively so it can be genuinely PAUSED —
  // not restarted, not skipped — when isFrozen flips true. A declarative
  // `animate={false}` looks like it should do this but doesn't: framer-motion
  // treats a boolean `animate` prop as "nothing to animate here" and skips
  // the element's animation processing entirely (see the `typeof prop ===
  // "boolean"` early-continue in its animateChanges loop), leaving the
  // already-running Infinity-repeat loop completely untouched. The
  // AnimationPlaybackControls returned by useAnimate's imperative animate()
  // call has real .pause()/.play(), which hold and resume from the exact
  // current position — what "freeze mid-flight" actually needs. (These run on
  // framer-motion's own JS ticker, not WAAPI — the multi-keyframe `times`
  // table below isn't WAAPI-eligible, so Element.getAnimations() stays empty.)
  const [scope, animateImperative] = useAnimate<SVGGElement>()
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null)

  // Start the loop exactly once, on mount. flightAnimate/flightTransition
  // are memoized on values that never change for a mounted particle (see
  // comment above) — they're a one-time animation definition, not reactive
  // inputs — so capturing them in this mount-only effect is safe.
  useEffect(() => {
    controlsRef.current = animateImperative(scope.current, flightAnimate, flightTransition)
    if (isFrozen) controlsRef.current.pause()
    return () => controlsRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // .pause() holds the animation at its current position; .play() resumes
  // from there. Neither restarts the keyframe sequence from the top.
  useEffect(() => {
    if (isFrozen) controlsRef.current?.pause()
    else controlsRef.current?.play()
  }, [isFrozen])

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.7 }}
    >
      {/* Plain <g>, not motion.g — its animation is driven entirely by the
          imperative controls above. Both values below are only the
          pre-animation default (avoiding a first-frame flash) and are
          superseded once the mount effect's animateImperative() call starts.

          `opacity` MUST be the SVG presentation attribute here, not an inline
          style. On SVG elements framer-motion's imperative animate() writes
          opacity via setAttribute, and an inline `style="opacity:…"` outranks
          a presentation attribute in the CSS cascade — so a style-based
          default would pin every particle at its initial value forever and
          silently hide them all, even while the animation ran correctly
          underneath. Position is the mirror image: framer writes
          style.transform, which correctly outranks this transform attribute. */}
      <g
        ref={scope}
        transform={`translate(${p.sx}, ${p.sy})`}
        opacity={0}
      >
        {/* Rim glow — sits ~8% brighter than the body so a distinct edge
            reads at a glance; disappears at anchors so it doesn't distract
            from a settled state, independent of the body's own dimming.
            Plain CSS transition rather than a framer-motion `animate` prop:
            nested independently-animated motion components inside a parent
            running an infinite keyframe loop (the flight path above) don't
            reliably pick up their own prop-driven animate changes — this
            sidesteps that by letting the browser's native transition engine
            handle it instead. */}
        <circle
          r={p.r * glowRadiusMult}
          fill={`url(#${glowGradient})`}
          style={{ opacity: isOnAnchor ? 0 : 1, transition: 'opacity 0.45s ease-out' }}
        />
        {/* Painterly body — lit upper-left, matches follicleOuterGrad */}
        <circle r={p.r} fill={`url(#${bodyGradient})`} opacity={0.92} />
        {/* Shadow — a soft crescent of the hormone's dark companion color,
            generally opposite the highlight; position/size cycles per
            variant so particles don't read as identical stamped spheres. */}
        <ellipse
          cx={p.r * v.shadowX} cy={p.r * v.shadowY}
          rx={p.r * v.shadowRX} ry={p.r * v.shadowRY}
          fill={shadowColor} opacity={v.shadowOpacity}
        />
        {/* Specular highlight — an organic blob (not a perfect ellipse) in a
            lightened shade of the hormone's own color (not plain white);
            position/size/shape all cycle per variant */}
        <path d={hilitePath} fill={hiliteColor} opacity={0.5} />
      </g>
    </motion.g>
  )
}

// ── GnRH pulse ────────────────────────────────────────────────────────────────
// Hypothalamus bottom edge is y=56 (HYP_CY 42, ry 14), pituitary top edge is
// y=76 (PIT_CY 94, PIT_R 18) — a 20px gap, previously just a static "↓"
// glyph. GnRH is named 16+ times in the condition/transition copy with
// nothing on screen to point at, so this draws the actual arrow and travels
// a small dot along it on a discrete, non-flowing repeat: the whole point is
// that it reads as pulses, not a stream, in contrast to the continuous
// FSH/LH particle flights below.
const GNRH_ARROW_TOP_Y = 58
const GNRH_ARROW_BOT_Y = 74
const GNRH_LABEL_X     = 706
const GNRH_LABEL_Y     = 70
const GNRH_COLOR       = 'rgba(148,112,175,0.9)'   // hypothalamus's own stroke family —
                                                     // deliberately not a new hue, so this
                                                     // doesn't read as a 5th legend colour
                                                     // to hunt for in the hormone graph
const GNRH_TRAVEL_DURATION = 0.45   // seconds for one dot to cross the gap

// activity→interval is log-linear in a^EXPONENT, not linear in a. A plain
// linear map puts POI (brainActivity 0.65–0.80, elevated because estrogen
// feedback is absent) almost as fast as normal's 0.95 ovulatory peak —
// visually claiming POI is the most hormonally active state on the site,
// which is backwards. Raising a to a power >1 before the log-linear blend
// compresses the low/mid range and stretches the top, so at EXPONENT=2.5 the
// four conditions land where their own copy says they should:
//   normal  0.4→0.95  2.35s baseline, 0.62s at the ovulatory peak (fastest)
//   PCOS    ~0.75     ~1.2s, flat — "GnRH pulses are rapid", self-sustaining
//   POI     0.65–0.80 1.4–1.6s — elevated, no estrogen/inhibin feedback
//   FHA     0.16–0.25 ~2.7s — "slow and infrequent", the slowest of the four
// Normal's peri-ovulatory peak stays the single fastest moment anywhere.
const GNRH_MIN_INTERVAL      = 0.5   // fastest — normal's ovulatory-decision peak
const GNRH_MAX_INTERVAL      = 2.8   // slowest — FHA's suppressed range
const GNRH_INTERVAL_EXPONENT = 2.5

function activityToInterval(activity: number): number {
  const a = clamp(activity, 0, 1)
  const ratio = GNRH_MIN_INTERVAL / GNRH_MAX_INTERVAL
  const g = Math.pow(a, GNRH_INTERVAL_EXPONENT)
  return GNRH_MAX_INTERVAL * Math.pow(ratio, g)
}

function GnRHPulse({ brainActivity, isFrozen }: { brainActivity: number; isFrozen: boolean }) {
  const interval = activityToInterval(brainActivity)
  const repeatDelay = Math.max(0, interval - GNRH_TRAVEL_DURATION)

  // Unlike HormoneParticle's flight (mounted once, endpoints/duration fixed
  // for the particle's lifetime), this loop's pacing is meant to track the
  // CURRENT brainActivity as the user scrubs — so the effect below restarts
  // the loop whenever repeatDelay changes, rather than mounting once. That
  // means a scrub can visibly reset the dot to the top of its travel; that's
  // an acceptable trade against a stale pulse rate, since it only happens
  // while the user is actively dragging the timeline.
  // x/y must be ABSOLUTE target coordinates on a <g>, not a delta animated
  // on the circle's own cx/cy — framer's imperative animate() writes x/y as
  // style.transform (translate), which composes with (doesn't replace) an
  // SVG position attribute. Animating y:[58,74] directly on a <circle
  // cy={58}> lands it at cy 58 PLUS a translateY of up to 74, i.e. y≈132,
  // well past the pituitary. HormoneParticle avoids this by animating a <g>
  // whose children sit at local origin — same fix here.
  //
  // Each keyframe array must have exactly as many entries as `times` below
  // (4) — a 2-entry array with a 4-entry `times` isn't padded or
  // interpolated, it silently jumps straight to the last value with no
  // visible tween. x/y therefore hold-then-move-then-hold in the same
  // shape as HormoneParticle's [sx, sx, ex, ex]: parked at the top while
  // opacity ramps in, travel through the middle span, parked at the bottom
  // while opacity ramps out.
  const flightAnimate = useMemo(() => ({
    x: [WIN_CX, WIN_CX, WIN_CX, WIN_CX],
    y: [GNRH_ARROW_TOP_Y, GNRH_ARROW_TOP_Y, GNRH_ARROW_BOT_Y, GNRH_ARROW_BOT_Y],
    opacity: [0, 1, 1, 0],
  }), [])
  const flightTransition = useMemo(() => ({
    duration: GNRH_TRAVEL_DURATION,
    repeat: Infinity,
    repeatDelay,
    times: [0, 0.15, 0.8, 1],
    ease: 'easeInOut' as const,
  }), [repeatDelay])

  const [scope, animateImperative] = useAnimate<SVGGElement>()
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null)

  // See HormoneParticle above for why this needs useAnimate's imperative
  // controls rather than a declarative `animate` prop: only .pause()/.play()
  // genuinely hold and resume an Infinity-repeat loop mid-flight.
  useEffect(() => {
    controlsRef.current?.stop()
    controlsRef.current = animateImperative(scope.current, flightAnimate, flightTransition)
    if (isFrozen) controlsRef.current.pause()
    return () => controlsRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightTransition])

  useEffect(() => {
    if (isFrozen) controlsRef.current?.pause()
    else controlsRef.current?.play()
  }, [isFrozen])

  // opacity must stay a presentation attribute (not inline style) — framer's
  // imperative animate() writes opacity via setAttribute on SVG elements,
  // and an inline style would outrank it in the cascade and pin the dot
  // invisible forever. See HormoneParticle's comment for the full story.
  return (
    <g ref={scope} transform={`translate(${WIN_CX}, ${GNRH_ARROW_TOP_Y})`} opacity={0}>
      <circle r={3} fill={GNRH_COLOR} />
    </g>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  fshLevel:               number
  lhLevel:                number
  estrogenLevel:          number
  progesteroneLevel:      number
  dominantFollicleRadius: number
  corpusLuteumRadius:     number
  smallFollicleCount:     number  // drives which FSH particles have a live target follicle
  stageIndex:             number
  isOnAnchor?:            boolean
  primaryHormoneByStage:  StagePrimaryHormones
  secondaryDim:           number
  brainActivity:          number  // 0–1, drives GnRH pulse frequency
  // Condition-specific follicle layout/FSH targeting (e.g. PCOS's ring +
  // its fshTargetIndices). Omitted = AnatomyLayer's default scatter +
  // DEFAULT_FSH_TARGETS. conditionId is used only to key the FSH particles
  // so they remount (and pick up new endpoints) on a condition switch — see
  // the framer-motion mount-once comment on HormoneParticle.
  folliclePositions?:     readonly (readonly [number, number])[]
  fshTargetIndices?:      readonly number[]
  conditionId:            string
  onStructureClick?:      (id: string) => void
  isFrozen?:              boolean  // guided playback paused on a clicked structure
}

export default function BrainLayer({
  fshLevel, lhLevel, estrogenLevel, progesteroneLevel,
  dominantFollicleRadius, corpusLuteumRadius, smallFollicleCount, stageIndex,
  isOnAnchor = false,
  primaryHormoneByStage,
  secondaryDim,
  brainActivity,
  folliclePositions,
  fshTargetIndices,
  conditionId,
  onStructureClick,
  isFrozen = false,
}: Props) {
  const primary: HormoneKey = primaryHormoneByStage[stageIndex] ?? primaryHormoneByStage[0]

  const activeFolliclePositions = folliclePositions ?? FOLLICLE_POSITIONS
  const activeFshTargets = fshTargetIndices ?? DEFAULT_FSH_TARGETS
  const fshPts = useMemo(
    () => buildFshPoints(activeFolliclePositions, activeFshTargets),
    [activeFolliclePositions, activeFshTargets],
  )

  // The estrogen-producing cohort: the condition's own FSH targets minus the
  // dominant slot (the dominant follicle has its own dedicated pool below, so
  // including it here would double up on one point).
  const estCohortIndices = useMemo(
    () => {
      const rest = activeFshTargets.filter((i) => i !== DOMINANT_IDX)
      return rest.length > 0 ? rest : [DOMINANT_IDX]
    },
    [activeFshTargets],
  )
  const lhPts = useMemo(() => buildLhPoints(activeFolliclePositions), [activeFolliclePositions])
  const estMultiPts = useMemo(
    () => buildEstMultiPoints(activeFolliclePositions, estCohortIndices),
    [activeFolliclePositions, estCohortIndices],
  )
  const estDomPts = useMemo(
    () => buildFromDominant(activeFolliclePositions, EST_DOM_ARRIVE_X, EST_DOM_RADII, EST_DOM_DELAYS),
    [activeFolliclePositions],
  )
  const progPts = useMemo(
    () => buildFromDominant(activeFolliclePositions, PROG_ARRIVE_X, PROG_RADII, PROG_DELAYS),
    [activeFolliclePositions],
  )

  // Gate each FSH particle's opacity on whether its target follicle actually
  // exists, so particles stop streaming into empty stroma once a follicle
  // has regressed (or hasn't grown yet). The non-dominant branch reuses the
  // EXACT SAME `smallFollicleCount - targetIdx` fraction AnatomyLayer uses
  // to fade a follicle's own scale/opacity (FolliclesGroup), so a particle's
  // presence tracks its follicle's actual fade in/out timing, not an
  // independently-tuned approximation.
  function fshPresence(targetIdx: number): number {
    return targetIdx === DOMINANT_IDX
      ? clamp((dominantFollicleRadius - 0.05) / 0.05, 0, 1)
      : clamp(smallFollicleCount - targetIdx, 0, 1)
  }

  // FSH gets a higher secondary-stage floor than the generic secondaryDim
  // (0.20 for Normal). At cycle-end→recruitment, FSH is already genuinely
  // rising (fshLevel ~0.25, climbing toward ~0.65) but progesterone is the
  // spotlighted stage hormone, so the old flat 0.20 multiplier crushed that
  // real signal to near-invisible — then jumped 5x the instant the
  // recruitment anchor flipped `primary` to 'fsh'. Reads as "does nothing,
  // then suddenly appears" instead of the gradual pre-recruitment rise it
  // should show. 0.5 keeps FSH clearly secondary to whichever hormone IS
  // spotlighted, while staying visible throughout — including later
  // non-primary stages, which is an intentional side effect, not scoped to
  // only the opening stage.
  const fshScale  = primary === 'fsh'          ? 1.0 : Math.max(secondaryDim, 0.5)
  const estScale  = primary === 'estrogen'     ? 1.0 : secondaryDim
  const progScale = primary === 'progesterone' ? 1.0 : secondaryDim

  // LH earns its own emphasis once it's genuinely surging, independent of
  // which hormone the current stage spotlights. Without this, LH stays
  // dimmed to secondaryDim through the entire run-up to ovulation (that
  // stage spotlights estrogen instead — sustained estrogen is what triggers
  // the surge, and that's the stage's teaching point) and only lights up
  // once the NEXT stage begins — i.e. right as LH is already falling, after
  // the egg has released. That reads as "LH peaks after ovulation," backwards
  // from reality. Bounds are tuned, not arbitrary: PCOS (0.35–0.52) and POI
  // (0.44–0.52) run elevated-but-flat and must never cross secondaryDim
  // (0.45) here — at their peak (0.52) this yields surgeT≈0.40, safely
  // below. FHA (0.07–0.09) never approaches the lower bound at all. Normal's
  // climb (0.22→0.95 through the dominant→ovulation-decision stage) crosses
  // the lower bound well before the Ovulation Decision anchor, so the surge
  // now visibly builds beforehand instead of only lighting up afterward.
  const surgeT  = clamp((lhLevel - 0.40) / 0.30, 0, 1)
  const lhScale = Math.max(primary === 'lh' ? 1.0 : secondaryDim, surgeT)

  // Estrogen source blending
  const focus     = Math.max(dominantFollicleRadius, corpusLuteumRadius)
  const estBase   = levelToOpacity(estrogenLevel) * estScale
  const estMultiW = Math.max(0, 1 - focus * 0.85)
  const estDomW   = Math.min(1, focus * 1.5)

  // Brain anatomy opacity
  const pituitaryOut  = Math.max(fshLevel, lhLevel)
  const feedbackIn    = Math.max(estrogenLevel, progesteroneLevel)
  const lowProgSignal = Math.max(0, 0.30 - progesteroneLevel) / 0.30 * 0.45
  const windowAct     = Math.max(pituitaryOut, levelToOpacity(feedbackIn) * 0.45, lowProgSignal)
  const windowOp      = 0.18 + windowAct * 0.82

  // Pituitary glow — use chart colors for FSH vs LH
  const pitGlowOp    = Math.max(levelToOpacity(fshLevel) * fshScale, levelToOpacity(lhLevel) * lhScale)
  const isLHPrimary  = lhLevel * lhScale > fshLevel * fshScale
  const pitGlowColor = isLHPrimary ? 'rgba(201,104,117,0.72)' : 'rgba(154,138,200,0.72)'
  const pitFillColor = pituitaryOut > 0.20
    ? isLHPrimary ? 'rgba(220,160,175,0.95)' : 'rgba(200,190,228,0.95)'
    : 'rgba(240,220,235,0.92)'

  // Hypothalamus glow — use chart colors for estrogen vs progesterone
  const hypGlowOp    = levelToOpacity(feedbackIn) * Math.max(estScale, progScale) * 0.55
  const hypGlowColor = estrogenLevel * estScale >= progesteroneLevel * progScale
    ? 'rgba(232,149,74,0.65)'   // estrogen orange
    : 'rgba(90,171,138,0.65)'   // progesterone green

  function particleOp(baseLevel: number, scale: number, i: number, total: number) {
    return levelToOpacity(baseLevel) * scale * particleGate(baseLevel, i, total)
  }

  return (
    <g>

      {/* Hormone particle gradients. BrainLayer shares its <svg> document with
          AnatomyLayer, so every id is prefixed "hormone" to avoid colliding
          with the follicle gradients (follicleOuterGrad, follicleRimGrad, …). */}
      <defs>
        {/* Body: lit upper-left, matches follicleOuterGrad's cx/cy/r. Base
            colors (C_FSH etc.) are unchanged — required to match HormoneGraph's
            legend colors. */}
        <radialGradient id="hormoneBodyFsh" cx="33%" cy="25%" r="71%">
          <stop offset="0%" stopColor={C_FSH_LIGHT} />
          <stop offset="55%" stopColor={C_FSH} />
          <stop offset="100%" stopColor={C_FSH_DARK} />
        </radialGradient>
        <radialGradient id="hormoneBodyLh" cx="33%" cy="25%" r="71%">
          <stop offset="0%" stopColor={C_LH_LIGHT} />
          <stop offset="55%" stopColor={C_LH} />
          <stop offset="100%" stopColor={C_LH_DARK} />
        </radialGradient>
        <radialGradient id="hormoneBodyEst" cx="33%" cy="25%" r="71%">
          <stop offset="0%" stopColor={C_EST_LIGHT} />
          <stop offset="55%" stopColor={C_EST} />
          <stop offset="100%" stopColor={C_EST_DARK} />
        </radialGradient>
        <radialGradient id="hormoneBodyProg" cx="33%" cy="25%" r="71%">
          <stop offset="0%" stopColor={C_PROG_LIGHT} />
          <stop offset="55%" stopColor={C_PROG} />
          <stop offset="100%" stopColor={C_PROG_DARK} />
        </radialGradient>

        {/* Glow: transparent center, peak brightness at the body's edge
            (62.5% of the 1.6×-radius glow circle = 1× the body radius),
            fading to transparent at the outer boundary. */}
        <radialGradient id="hormoneGlowFsh" cx="50%" cy="50%" r="50%">
          <stop offset="0%"    stopColor={C_FSH} stopOpacity="0" />
          <stop offset="45%"   stopColor={C_FSH} stopOpacity="0" />
          <stop offset="62.5%" stopColor={C_FSH} stopOpacity="1" />
          <stop offset="100%"  stopColor={C_FSH} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hormoneGlowLh" cx="50%" cy="50%" r="50%">
          <stop offset="0%"    stopColor={C_LH} stopOpacity="0" />
          <stop offset="45%"   stopColor={C_LH} stopOpacity="0" />
          <stop offset="62.5%" stopColor={C_LH} stopOpacity="1" />
          <stop offset="100%"  stopColor={C_LH} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hormoneGlowEst" cx="50%" cy="50%" r="50%">
          <stop offset="0%"    stopColor={C_EST} stopOpacity="0" />
          <stop offset="45%"   stopColor={C_EST} stopOpacity="0" />
          <stop offset="62.5%" stopColor={C_EST} stopOpacity="1" />
          <stop offset="100%"  stopColor={C_EST} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hormoneGlowProg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"    stopColor={C_PROG} stopOpacity="0" />
          <stop offset="45%"   stopColor={C_PROG} stopOpacity="0" />
          <stop offset="62.5%" stopColor={C_PROG} stopOpacity="1" />
          <stop offset="100%"  stopColor={C_PROG} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Brain anatomy — fades based on hormonal activity ─────────────────── */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: windowOp }} transition={{ duration: 0.9 }}>

        {/* Hypothalamus glow (responds to arriving feedback hormones) */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: hypGlowOp }} transition={{ duration: 0.6 }}>
          <motion.ellipse cx={WIN_CX} cy={HYP_CY} rx={44} ry={18}
            fill={hypGlowColor}
            animate={{ rx: [44, 48, 44] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>

        {/* Hypothalamus — clickable */}
        <ellipse cx={WIN_CX} cy={HYP_CY} rx={40} ry={14}
          fill="rgba(218,204,235,0.82)" stroke="rgba(148,112,175,0.45)" strokeWidth={1}
          style={{ cursor: 'pointer' }}
          onClick={() => onStructureClick?.('brain')} />
        <text x={WIN_CX} y={HYP_CY + 4} textAnchor="middle"
          fontSize="10.5" fontWeight="600" fill="rgba(75,48,100,0.85)"
          fontFamily="var(--font-fredoka), sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
          Hypothalamus
        </text>

        {/* Connector — drawn arrow + "GnRH" label, not dimmed by the
            particle wrapper below: this is labeling the causal chain
            (hypothalamus → GnRH → pituitary → FSH/LH), not particle noise,
            so it stays legible even when the user is settled on an anchor. */}
        <g style={{ pointerEvents: 'none' }}>
          <line x1={WIN_CX} y1={GNRH_ARROW_TOP_Y} x2={WIN_CX} y2={GNRH_ARROW_BOT_Y - 6}
            stroke={GNRH_COLOR} strokeWidth={1.5} />
          <path d={`M${WIN_CX - 4} ${GNRH_ARROW_BOT_Y - 8} L${WIN_CX} ${GNRH_ARROW_BOT_Y} L${WIN_CX + 4} ${GNRH_ARROW_BOT_Y - 8} Z`}
            fill={GNRH_COLOR} />
          <text x={GNRH_LABEL_X} y={GNRH_LABEL_Y} textAnchor="start" fontSize="9" fontWeight="600"
            fill={GNRH_COLOR}
            fontFamily="var(--font-fredoka), sans-serif" style={{ userSelect: 'none' }}>
            GnRH
          </text>
          <GnRHPulse brainActivity={brainActivity} isFrozen={isFrozen} />
        </g>

        {/* Pituitary glow ring */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: pitGlowOp }} transition={{ duration: 0.5 }}>
          <motion.circle cx={WIN_CX} cy={PIT_CY} r={PIT_R + 8}
            fill={pitGlowColor}
            animate={{ r: [PIT_R + 7, PIT_R + 14, PIT_R + 7] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>

        {/* Pituitary — clickable */}
        <motion.circle cx={WIN_CX} cy={PIT_CY} r={PIT_R}
          animate={{ fill: pitFillColor }} transition={{ duration: 0.6 }}
          stroke="rgba(170,128,155,0.65)" strokeWidth={1.4}
          style={{ cursor: 'pointer' }}
          onClick={() => onStructureClick?.('brain')} />
        <text x={WIN_CX} y={PIT_CY + 4} textAnchor="middle"
          fontSize="11" fontWeight="600" fill="rgba(95,60,80,0.90)"
          fontFamily="var(--font-fredoka), sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
          Pituitary
        </text>

      </motion.g>

      {/*
        ── Hormone particles ──────────────────────────────────────────────────
        Outer wrapper dims all particles when the user is settled at an anchor
        so the biological state is visible without visual noise.  The particles
        continue their loop animations — they just become more subtle.
        Brain anatomy (above) stays at full opacity throughout.
      */}
      <motion.g
        initial={false}
        variants={{
          dimmed: { opacity: 0.28, transition: { duration: 0.7, ease: 'easeOut' } },
          full:   { opacity: 1.0,  transition: { duration: 0.25, ease: 'easeOut' } },
        }}
        animate={isOnAnchor ? 'dimmed' : 'full'}
      >

        {/* ── FSH particles: pituitary → follicle ring (fan) ─────────────── */}
        {/* key includes conditionId so switching conditions REMOUNTS these
            particles rather than reusing them: HormoneParticle starts its
            flight loop in a mount-only effect (deps []) and memoizes the
            animation on `p`, so an in-place endpoint change would silently
            keep flying to the OLD condition's coordinates. See
            HormoneParticle's own comment for the full mount-once story. */}
        {fshPts.map((p, i) => {
          const targetIdx = activeFshTargets[i] ?? i
          return (
            <HormoneParticle key={`fsh-${conditionId}-${i}`} p={p}
              opacity={particleOp(fshLevel, fshScale, i, fshPts.length) * fshPresence(targetIdx)}
              duration={4.5} ease="easeIn" peakOpacity={0.88}
              bodyGradient="hormoneBodyFsh" glowGradient="hormoneGlowFsh"
              variantIndex={i} hiliteColor={C_FSH_HILITE} shadowColor={C_FSH_DARK}
              isOnAnchor={isOnAnchor} isFrozen={isFrozen} />
          )
        })}

        {/* ── LH particles: pituitary → dominant follicle (focused) ────────── */}
        {/* Smaller glow multiplier: these 4 particles converge into a ~17px
            cluster at the dominant follicle, so the default 1.6× radius would
            merge into a smudge rather than a readable hot spot. */}
        {lhPts.map((p, i) => (
          <HormoneParticle key={`lh-${conditionId}-${i}`} p={p}
            opacity={particleOp(lhLevel, lhScale, i, lhPts.length)}
            duration={3.5} ease="easeIn" peakOpacity={0.94}
            bodyGradient="hormoneBodyLh" glowGradient="hormoneGlowLh"
            glowRadiusMult={1.35}
            variantIndex={i} hiliteColor={C_LH_HILITE} shadowColor={C_LH_DARK}
            isOnAnchor={isOnAnchor} isFrozen={isFrozen} />
        ))}

        {/* ── Estrogen from the wider follicle cohort (early cycle) ────────── */}
        {/* Gated on the source follicle actually being present, same as FSH —
            otherwise estrogen streams out of empty stroma in the conditions
            with only a couple of follicles (POI) or once the cohort has
            regressed (normal, past the dominant anchor). */}
        {estMultiPts.map((p, i) => (
          <HormoneParticle key={`em-${conditionId}-${i}`} p={p}
            opacity={estBase * estMultiW * particleGate(estrogenLevel, i, estMultiPts.length)
                     * fshPresence(estCohortIndices[i % estCohortIndices.length] ?? 1)}
            duration={4.5} ease="easeOut" peakOpacity={0.80}
            bodyGradient="hormoneBodyEst" glowGradient="hormoneGlowEst"
            variantIndex={i} hiliteColor={C_EST_HILITE} shadowColor={C_EST_DARK}
            isOnAnchor={isOnAnchor} isFrozen={isFrozen} />
        ))}

        {/* ── Estrogen from dominant follicle / CL ─────────────────────────── */}
        {estDomPts.map((p, i) => (
          <HormoneParticle key={`ed-${conditionId}-${i}`} p={p}
            opacity={estBase * estDomW * particleGate(estrogenLevel, i, estDomPts.length)}
            duration={4.5} ease="easeOut" peakOpacity={0.84}
            bodyGradient="hormoneBodyEst" glowGradient="hormoneGlowEst"
            variantIndex={i + 1} hiliteColor={C_EST_HILITE} shadowColor={C_EST_DARK}
            isOnAnchor={isOnAnchor} isFrozen={isFrozen} />
        ))}

        {/* ── Progesterone from CL → hypothalamus ──────────────────────────── */}
        {progPts.map((p, i) => (
          <HormoneParticle key={`prog-${conditionId}-${i}`} p={p}
            opacity={levelToOpacity(progesteroneLevel) * progScale * particleGate(progesteroneLevel, i, progPts.length)}
            duration={4.8} ease="easeOut" peakOpacity={0.84}
            bodyGradient="hormoneBodyProg" glowGradient="hormoneGlowProg"
            variantIndex={i} hiliteColor={C_PROG_HILITE} shadowColor={C_PROG_DARK}
            isOnAnchor={isOnAnchor} isFrozen={isFrozen} />
        ))}

      </motion.g>

    </g>
  )
}
