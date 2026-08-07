'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { HormoneKey, StagePrimaryHormones } from '@/types/simulation'
import { OVARY_DX, OVARY_DY } from './AnatomyLayer'

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
const FSH_PTS: Pt[] = [
  { sx: WIN_CX, sy: EMIT_Y, ex: 702 + OVARY_DX, ey: 885 + OVARY_DY, r: 10, delay: 0.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 732 + OVARY_DX, ey: 948 + OVARY_DY, r:  9, delay: 1.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 850 + OVARY_DX, ey: 770 + OVARY_DY, r: 11, delay: 2.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 845 + OVARY_DX, ey: 865 + OVARY_DY, r: 10, delay: 0.4 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 948 + OVARY_DX, ey: 833 + OVARY_DY, r:  9, delay: 3.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 920 + OVARY_DX, ey: 956 + OVARY_DY, r:  9, delay: 4.0 },
]

// LH: 4 particles converging on the dominant follicle.
const LH_PTS: Pt[] = [
  { sx: WIN_CX, sy: EMIT_Y, ex: 834 + OVARY_DX, ey: 808 + OVARY_DY, r: 13, delay: 0.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 845 + OVARY_DX, ey: 810 + OVARY_DY, r: 12, delay: 0.6 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 838 + OVARY_DX, ey: 810 + OVARY_DY, r: 11, delay: 1.2 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 851 + OVARY_DX, ey: 805 + OVARY_DY, r: 10, delay: 1.8 },
]

// Estrogen from multiple follicles (early cycle). Base sy = local y + 250.
const EST_MULTI_PTS: Pt[] = [
  { sx: 800 + OVARY_DX, sy: 785 + OVARY_DY, ex: 686, ey: ARRIVE_Y, r: 10, delay: 0.0 },
  { sx: 905 + OVARY_DX, sy: 788 + OVARY_DY, ex: 703, ey: ARRIVE_Y, r:  9, delay: 1.1 },
  { sx: 948 + OVARY_DX, sy: 833 + OVARY_DY, ex: 710, ey: ARRIVE_Y, r:  9, delay: 2.2 },
  { sx: 732 + OVARY_DX, sy: 948 + OVARY_DY, ex: 694, ey: ARRIVE_Y, r:  9, delay: 3.3 },
]

// Estrogen from dominant follicle / CL (late cycle). Base (845, 865) =
// local (845, 615) + 250 — the dominant follicle's position.
const EST_DOM_PTS: Pt[] = [
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 700, ey: ARRIVE_Y, r: 10, delay: 0.0 },
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 690, ey: ARRIVE_Y, r:  9, delay: 0.9 },
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 710, ey: ARRIVE_Y, r: 10, delay: 1.8 },
]

// Progesterone from CL — broader spread than estrogen. Same base as EST_DOM_PTS.
const PROG_PTS: Pt[] = [
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 700, ey: ARRIVE_Y, r: 11, delay: 0.0 },
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 682, ey: ARRIVE_Y, r:  9, delay: 1.0 },
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 718, ey: ARRIVE_Y, r: 10, delay: 2.0 },
  { sx: 845 + OVARY_DX, sy: 865 + OVARY_DY, ex: 700, ey: ARRIVE_Y, r:  9, delay: 3.0 },
]

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
}

function HormoneParticle({
  p, opacity, duration, ease, peakOpacity,
  bodyGradient, glowGradient, glowRadiusMult = 1.6,
  variantIndex, hiliteColor, shadowColor, isOnAnchor,
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

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.7 }}
    >
      <motion.g
        initial={{ x: p.sx, y: p.sy, opacity: 0 }}
        animate={flightAnimate}
        transition={flightTransition}
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
      </motion.g>
    </motion.g>
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
  stageIndex:             number
  isOnAnchor?:            boolean
  primaryHormoneByStage:  StagePrimaryHormones
  secondaryDim:           number
  onStructureClick?:      (id: string) => void
}

export default function BrainLayer({
  fshLevel, lhLevel, estrogenLevel, progesteroneLevel,
  dominantFollicleRadius, corpusLuteumRadius, stageIndex,
  isOnAnchor = false,
  primaryHormoneByStage,
  secondaryDim,
  onStructureClick,
}: Props) {
  const primary: HormoneKey = primaryHormoneByStage[stageIndex] ?? primaryHormoneByStage[0]

  const fshScale  = primary === 'fsh'          ? 1.0 : secondaryDim
  const lhScale   = primary === 'lh'           ? 1.0 : secondaryDim
  const estScale  = primary === 'estrogen'     ? 1.0 : secondaryDim
  const progScale = primary === 'progesterone' ? 1.0 : secondaryDim

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

        {/* Connector */}
        <text x={WIN_CX} y={71} textAnchor="middle" fontSize="13"
          fill="rgba(140,105,125,0.55)"
          fontFamily="var(--font-fredoka), sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>↓</text>

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
        {FSH_PTS.map((p, i) => (
          <HormoneParticle key={`fsh-${i}`} p={p}
            opacity={particleOp(fshLevel, fshScale, i, FSH_PTS.length)}
            duration={4.5} ease="easeIn" peakOpacity={0.88}
            bodyGradient="hormoneBodyFsh" glowGradient="hormoneGlowFsh"
            variantIndex={i} hiliteColor={C_FSH_HILITE} shadowColor={C_FSH_DARK}
            isOnAnchor={isOnAnchor} />
        ))}

        {/* ── LH particles: pituitary → dominant follicle (focused) ────────── */}
        {/* Smaller glow multiplier: these 4 particles converge into a ~17px
            cluster at the dominant follicle, so the default 1.6× radius would
            merge into a smudge rather than a readable hot spot. */}
        {LH_PTS.map((p, i) => (
          <HormoneParticle key={`lh-${i}`} p={p}
            opacity={particleOp(lhLevel, lhScale, i, LH_PTS.length)}
            duration={3.5} ease="easeIn" peakOpacity={0.94}
            bodyGradient="hormoneBodyLh" glowGradient="hormoneGlowLh"
            glowRadiusMult={1.35}
            variantIndex={i} hiliteColor={C_LH_HILITE} shadowColor={C_LH_DARK}
            isOnAnchor={isOnAnchor} />
        ))}

        {/* ── Estrogen from multiple follicles (early cycle) ──────────────── */}
        {EST_MULTI_PTS.map((p, i) => (
          <HormoneParticle key={`em-${i}`} p={p}
            opacity={estBase * estMultiW * particleGate(estrogenLevel, i, EST_MULTI_PTS.length)}
            duration={4.5} ease="easeOut" peakOpacity={0.80}
            bodyGradient="hormoneBodyEst" glowGradient="hormoneGlowEst"
            variantIndex={i} hiliteColor={C_EST_HILITE} shadowColor={C_EST_DARK}
            isOnAnchor={isOnAnchor} />
        ))}

        {/* ── Estrogen from dominant follicle / CL ─────────────────────────── */}
        {EST_DOM_PTS.map((p, i) => (
          <HormoneParticle key={`ed-${i}`} p={p}
            opacity={estBase * estDomW * particleGate(estrogenLevel, i, EST_DOM_PTS.length)}
            duration={4.5} ease="easeOut" peakOpacity={0.84}
            bodyGradient="hormoneBodyEst" glowGradient="hormoneGlowEst"
            variantIndex={i + 1} hiliteColor={C_EST_HILITE} shadowColor={C_EST_DARK}
            isOnAnchor={isOnAnchor} />
        ))}

        {/* ── Progesterone from CL → hypothalamus ──────────────────────────── */}
        {PROG_PTS.map((p, i) => (
          <HormoneParticle key={`prog-${i}`} p={p}
            opacity={levelToOpacity(progesteroneLevel) * progScale * particleGate(progesteroneLevel, i, PROG_PTS.length)}
            duration={4.8} ease="easeOut" peakOpacity={0.84}
            bodyGradient="hormoneBodyProg" glowGradient="hormoneGlowProg"
            variantIndex={i} hiliteColor={C_PROG_HILITE} shadowColor={C_PROG_DARK}
            isOnAnchor={isOnAnchor} />
        ))}

      </motion.g>

    </g>
  )
}
