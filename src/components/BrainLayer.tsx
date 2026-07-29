'use client'

import { motion } from 'framer-motion'

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

type Pt = { sx: number; sy: number; ex: number; ey: number; r: number; delay: number }

// ── Particle pools ─────────────────────────────────────────────────────────────
// All anatomy positions are offset +250 px vertically (the anatomy group is
// wrapped in translate(0, 250) in SimulationCanvas). FOLLICLE_POSITIONS in
// AnatomyLayer are in local coords; add 250 to match canvas-space positions.

// FSH: 6 particles fanning toward the follicle ring from the pituitary.
const FSH_PTS: Pt[] = [
  { sx: WIN_CX, sy: EMIT_Y, ex: 702, ey: 885, r: 10, delay: 0.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 732, ey: 948, r:  9, delay: 1.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 850, ey: 770, r: 11, delay: 2.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 845, ey: 865, r: 10, delay: 0.4 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 948, ey: 833, r:  9, delay: 3.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 920, ey: 956, r:  9, delay: 4.0 },
]

// LH: 4 particles converging on the dominant follicle.
const LH_PTS: Pt[] = [
  { sx: WIN_CX, sy: EMIT_Y, ex: 834, ey: 808, r: 13, delay: 0.0 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 845, ey: 810, r: 12, delay: 0.6 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 838, ey: 810, r: 11, delay: 1.2 },
  { sx: WIN_CX, sy: EMIT_Y, ex: 851, ey: 805, r: 10, delay: 1.8 },
]

// Estrogen from multiple follicles (early cycle). sy = local y + 250.
const EST_MULTI_PTS: Pt[] = [
  { sx: 800, sy: 785, ex: 686, ey: ARRIVE_Y, r: 10, delay: 0.0 },
  { sx: 905, sy: 788, ex: 703, ey: ARRIVE_Y, r:  9, delay: 1.1 },
  { sx: 948, sy: 833, ex: 710, ey: ARRIVE_Y, r:  9, delay: 2.2 },
  { sx: 732, sy: 948, ex: 694, ey: ARRIVE_Y, r:  9, delay: 3.3 },
]

// Estrogen from dominant follicle / CL (late cycle). sy = 615 + 250 = 865.
const EST_DOM_PTS: Pt[] = [
  { sx: 845, sy: 865, ex: 700, ey: ARRIVE_Y, r: 10, delay: 0.0 },
  { sx: 845, sy: 865, ex: 690, ey: ARRIVE_Y, r:  9, delay: 0.9 },
  { sx: 845, sy: 865, ex: 710, ey: ARRIVE_Y, r: 10, delay: 1.8 },
]

// Progesterone from CL — broader spread than estrogen. sy = 615 + 250 = 865.
const PROG_PTS: Pt[] = [
  { sx: 845, sy: 865, ex: 700, ey: ARRIVE_Y, r: 11, delay: 0.0 },
  { sx: 845, sy: 865, ex: 682, ey: ARRIVE_Y, r:  9, delay: 1.0 },
  { sx: 845, sy: 865, ex: 718, ey: ARRIVE_Y, r: 10, delay: 2.0 },
  { sx: 845, sy: 865, ex: 700, ey: ARRIVE_Y, r:  9, delay: 3.0 },
]

// ── Stage-based primary hormone ───────────────────────────────────────────────
const PRIMARY_BY_STAGE = [
  'progesterone',
  'fsh',
  'estrogen',
  'estrogen',
  'lh',
  'progesterone',
  'progesterone',
] as const

type HormoneKey = 'fsh' | 'lh' | 'estrogen' | 'progesterone'
const SECONDARY_DIM = 0.20

// ── Helpers ───────────────────────────────────────────────────────────────────
function levelToOpacity(level: number): number {
  return Math.max(0, Math.min(1, (level - 0.08) / 0.92))
}

function particleGate(level: number, i: number, total: number): number {
  const threshold = (i + 0.5) / total
  return Math.max(0, Math.min(1, (level - threshold + 0.15) / 0.15))
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
  onStructureClick?:      (id: string) => void
}

export default function BrainLayer({
  fshLevel, lhLevel, estrogenLevel, progesteroneLevel,
  dominantFollicleRadius, corpusLuteumRadius, stageIndex,
  isOnAnchor = false,
  onStructureClick,
}: Props) {
  const primary: HormoneKey = PRIMARY_BY_STAGE[stageIndex] ?? 'fsh'

  const fshScale  = primary === 'fsh'          ? 1.0 : SECONDARY_DIM
  const lhScale   = primary === 'lh'           ? 1.0 : SECONDARY_DIM
  const estScale  = primary === 'estrogen'     ? 1.0 : SECONDARY_DIM
  const progScale = primary === 'progesterone' ? 1.0 : SECONDARY_DIM

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
  const pitFillColor = pituitaryOut > 0.25
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
        variants={{
          dimmed: { opacity: 0.28, transition: { duration: 0.7, ease: 'easeOut' } },
          full:   { opacity: 1.0,  transition: { duration: 0.25, ease: 'easeOut' } },
        }}
        animate={isOnAnchor ? 'dimmed' : 'full'}
      >

        {/* ── FSH particles: pituitary → follicle ring (fan) ─────────────── */}
        {FSH_PTS.map((p, i) => (
          <motion.g key={`fsh-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: particleOp(fshLevel, fshScale, i, FSH_PTS.length) }}
            transition={{ duration: 0.7 }}>
            <motion.circle r={p.r} fill={C_FSH}
              initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
              animate={{
                cx: [p.sx, p.sx, p.ex, p.ex],
                cy: [p.sy, p.sy, p.ey, p.ey],
                opacity: [0, 0.88, 0.88, 0],
              }}
              transition={{ duration: 4.5, repeat: Infinity, repeatType: 'loop',
                delay: p.delay, times: [...TIMES], ease: 'easeIn' }} />
          </motion.g>
        ))}

        {/* ── LH particles: pituitary → dominant follicle (focused) ────────── */}
        {LH_PTS.map((p, i) => (
          <motion.g key={`lh-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: particleOp(lhLevel, lhScale, i, LH_PTS.length) }}
            transition={{ duration: 0.7 }}>
            <motion.circle r={p.r} fill={C_LH}
              initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
              animate={{
                cx: [p.sx, p.sx, p.ex, p.ex],
                cy: [p.sy, p.sy, p.ey, p.ey],
                opacity: [0, 0.94, 0.94, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: 'loop',
                delay: p.delay, times: [...TIMES], ease: 'easeIn' }} />
          </motion.g>
        ))}

        {/* ── Estrogen from multiple follicles (early cycle) ──────────────── */}
        {EST_MULTI_PTS.map((p, i) => (
          <motion.g key={`em-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: estBase * estMultiW * particleGate(estrogenLevel, i, EST_MULTI_PTS.length) }}
            transition={{ duration: 0.7 }}>
            <motion.circle r={p.r} fill={C_EST}
              initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
              animate={{
                cx: [p.sx, p.sx, p.ex, p.ex],
                cy: [p.sy, p.sy, p.ey, p.ey],
                opacity: [0, 0.80, 0.80, 0],
              }}
              transition={{ duration: 4.5, repeat: Infinity, repeatType: 'loop',
                delay: p.delay, times: [...TIMES], ease: 'easeOut' }} />
          </motion.g>
        ))}

        {/* ── Estrogen from dominant follicle / CL ─────────────────────────── */}
        {EST_DOM_PTS.map((p, i) => (
          <motion.g key={`ed-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: estBase * estDomW * particleGate(estrogenLevel, i, EST_DOM_PTS.length) }}
            transition={{ duration: 0.7 }}>
            <motion.circle r={p.r} fill={C_EST}
              initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
              animate={{
                cx: [p.sx, p.sx, p.ex, p.ex],
                cy: [p.sy, p.sy, p.ey, p.ey],
                opacity: [0, 0.84, 0.84, 0],
              }}
              transition={{ duration: 4.5, repeat: Infinity, repeatType: 'loop',
                delay: p.delay, times: [...TIMES], ease: 'easeOut' }} />
          </motion.g>
        ))}

        {/* ── Progesterone from CL → hypothalamus ──────────────────────────── */}
        {PROG_PTS.map((p, i) => (
          <motion.g key={`prog-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: levelToOpacity(progesteroneLevel) * progScale * particleGate(progesteroneLevel, i, PROG_PTS.length) }}
            transition={{ duration: 0.7 }}>
            <motion.circle r={p.r} fill={C_PROG}
              initial={{ cx: p.sx, cy: p.sy, opacity: 0 }}
              animate={{
                cx: [p.sx, p.sx, p.ex, p.ex],
                cy: [p.sy, p.sy, p.ey, p.ey],
                opacity: [0, 0.84, 0.84, 0],
              }}
              transition={{ duration: 4.8, repeat: Infinity, repeatType: 'loop',
                delay: p.delay, times: [...TIMES], ease: 'easeOut' }} />
          </motion.g>
        ))}

      </motion.g>

    </g>
  )
}
