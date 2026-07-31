'use client'

import { useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { useSimulationStore } from '@/store/simulation'
import { conditions } from '@/data/conditions'
import { anchorTs, anchors } from '@/data/anchors'
import { interpolateKeyframes, activeTransitionIndex, nearestAnchorIndex } from '@/utils/interpolate'
import { getTransitions } from '@/data/transitions'
import type { Transition } from '@/types/simulation'

const COLORS = {
  FSH: '#9a8ac8',
  LH: '#c96875',
  Estrogen: '#e8954a',
  Progesterone: '#5aab8a',
}

// Consider the timeline "on anchor" within this distance.
// Matches the snap behaviour in TimelineBar so the button appears
// as soon as the handle snaps into place.
const ON_ANCHOR_THRESH = 0.02

type PlaybackData = {
  fromIdx: number
  fromTransitionIdx: number
  startProgress: number
  targetProgress: number
  startTime: number        // performance.now() when playback began
  duration: number         // ms
  totalPausedMs: number    // accumulated pause time (ms)
  pauseStartedAt: number | null  // performance.now() when current pause started, or null
}

export default function HormoneGraph() {
  const {
    isHormoneGraphOpen, toggleHormoneGraph,
    progress, condition,
    isPlaying, setIsPlaying, setProgress,
  } = useSimulationStore()

  const cond = conditions.find((c) => c.id === condition) ?? conditions[0]
  const kf   = cond.keyframes
  const activeTransitions = getTransitions(condition)

  // ── Timeline position ──────────────────────────────────────────────────────
  const nearestIdx   = nearestAnchorIndex(anchorTs, progress)
  const onAnchor     = Math.abs((anchorTs[nearestIdx] ?? 0) - progress) < ON_ANCHOR_THRESH
  const isLastAnchor = nearestIdx === anchors.length - 1

  // Transition being crossed during free (non-guided) scrubbing
  const manualTransIdx = !isPlaying ? activeTransitionIndex(anchorTs, progress) : -1
  const manualTransition: Transition | null = manualTransIdx >= 0 ? (activeTransitions[manualTransIdx] ?? null) : null
  const manualFrom = manualTransition ? anchors.find(a => a.id === manualTransition.fromAnchorId) : null
  const manualTo   = manualTransition ? anchors.find(a => a.id === manualTransition.toAnchorId)   : null

  // ── Playback engine ────────────────────────────────────────────────────────
  const playbackRef = useRef<PlaybackData | null>(null)
  const rafRef      = useRef<number | null>(null)

  // tick is stable (empty deps) — reads all live state via getState() or refs.
  const tick = useCallback((now: number) => {
    const store = useSimulationStore.getState()

    if (!store.isPlaying) {
      // Cancelled externally (e.g. timeline drag)
      playbackRef.current = null
      return
    }

    const pb = playbackRef.current
    if (!pb) return

    // ── Pause while the structure panel is open ────────────────────────────
    if (store.selectedStructureId !== null) {
      if (pb.pauseStartedAt === null) pb.pauseStartedAt = now
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    if (pb.pauseStartedAt !== null) {
      pb.totalPausedMs  += now - pb.pauseStartedAt
      pb.pauseStartedAt  = null
    }

    // ── Advance progress ───────────────────────────────────────────────────
    const elapsed = now - pb.startTime - pb.totalPausedMs
    const frac    = Math.min(1, elapsed / pb.duration)
    const newP    = pb.startProgress + (pb.targetProgress - pb.startProgress) * frac

    store.setProgress(newP)

    if (frac >= 1) {
      store.setIsPlaying(false)
      playbackRef.current = null
    } else {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, []) // stable — no captured reactive values

  const startPlayback = useCallback(() => {
    const idx = nearestIdx
    if (!onAnchor || idx >= anchors.length - 1) return

    const fromA = anchors[idx]!
    const toA   = anchors[idx + 1]!
    const tIdx  = activeTransitions.findIndex(t => t.fromAnchorId === fromA.id)
    const trans  = tIdx >= 0 ? activeTransitions[tIdx] : null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    playbackRef.current = {
      fromIdx:           idx,
      fromTransitionIdx: tIdx,
      startProgress:     fromA.t,
      targetProgress:    toA.t,
      startTime:         performance.now(),
      duration:          (trans?.guidedDuration ?? 9) * 1000,
      totalPausedMs:     0,
      pauseStartedAt:    null,
    }

    setProgress(fromA.t)   // snap to exact anchor before animating
    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [nearestIdx, onAnchor, activeTransitions, setProgress, setIsPlaying, tick])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Beat display ───────────────────────────────────────────────────────────
  const pb = playbackRef.current
  const playingTransition: Transition | null =
    isPlaying && pb ? (activeTransitions[pb.fromTransitionIdx] ?? null) : null
  const playingFrom = playingTransition
    ? anchors.find(a => a.id === playingTransition.fromAnchorId)
    : null
  const playingTo = playingTransition
    ? anchors.find(a => a.id === playingTransition.toAnchorId)
    : null

  let beatIdx  = 0
  let beatText = ''
  if (isPlaying && pb && playingTransition) {
    const span = pb.targetProgress - pb.startProgress
    const frac = span > 0
      ? Math.max(0, Math.min(1, (progress - pb.startProgress) / span))
      : 0
    beatIdx  = Math.min(playingTransition.beats.length - 1, Math.floor(frac * playingTransition.beats.length))
    beatText = playingTransition.beats[beatIdx] ?? ''
  }

  // ── Chart data (memoised) ──────────────────────────────────────────────────
  const data = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const t = i / 119
      return {
        t,
        FSH:          interpolateKeyframes(kf.fsh,          anchorTs, t),
        LH:           interpolateKeyframes(kf.lh,           anchorTs, t),
        Estrogen:     interpolateKeyframes(kf.estrogen,     anchorTs, t),
        Progesterone: interpolateKeyframes(kf.progesterone, anchorTs, t),
      }
    })
  }, [kf])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Top-right panel: button / beats / manual-transition info ── */}
      <AnimatePresence>

        {isPlaying && playingTransition && (
          /* Guided playback: show animated beats */
          <motion.div
            key="beats-panel"
            className="absolute top-2 right-6 z-30 w-72 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,245,250,0.94)', border: '1px solid var(--border)' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {playingFrom && playingTo && (
              <p className="font-semibold mb-1.5" style={{ color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
                {playingFrom.title} → {playingTo.title}
              </p>
            )}
            <AnimatePresence mode="wait">
              <motion.p
                key={beatIdx}
                style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {beatText}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {!isPlaying && onAnchor && !isLastAnchor && (
          /* At a non-final anchor: offer guided playback */
          <motion.button
            key="next-btn"
            onClick={startPlayback}
            className="absolute top-2 right-6 z-30 px-4 py-2 rounded-xl font-semibold shadow-sm"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            whileHover={{ opacity: 0.85 }}
          >
            What happens next? ▶
          </motion.button>
        )}

        {!isPlaying && manualTransition && (
          /* Free scrubbing between anchors: show transition context */
          <motion.div
            key="manual-panel"
            className="absolute top-2 right-6 z-30 w-72 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,245,250,0.94)', border: '1px solid var(--border)' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {manualFrom && manualTo && (
              <p className="font-semibold mb-1" style={{ color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
                {manualFrom.title} → {manualTo.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {manualTransition.brainEvents.map((ev, i) => (
                <li key={i} style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}>
                  • {ev}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Hormones toggle ── */}
      <button
        onClick={toggleHormoneGraph}
        className="absolute top-20 right-6 z-30 px-3 py-1.5 rounded-xl font-medium shadow-sm transition-opacity hover:opacity-80"
        style={{
          background: isHormoneGraphOpen ? 'var(--accent)' : 'var(--surface)',
          color:      isHormoneGraphOpen ? '#fff'          : 'var(--text-muted)',
          border: '1px solid var(--border)',
          fontFamily: 'var(--font-fredoka), sans-serif',
          fontSize: 14,
          lineHeight: '13.6px',
        }}
      >
        Hormones
      </button>

      {/* ── Hormone graph panel ── */}
      <AnimatePresence>
        {isHormoneGraphOpen && (
          <motion.div
            className="absolute top-32 right-6 z-30 rounded-2xl p-4 shadow-lg w-80"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="font-semibold mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
              Hormone Levels (relative, 0–100)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid var(--border)' }}
                  formatter={(v) => (typeof v === 'number' ? v.toFixed(0) : v)}
                  labelFormatter={() => ''}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine x={progress} stroke="var(--accent)" strokeDasharray="4 2" strokeWidth={1.5} />
                {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[key]}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center" style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '13.6px' }}>
              Values are simplified and relative — not measured concentrations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
