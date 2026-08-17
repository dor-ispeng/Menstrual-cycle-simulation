'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulation'
import { anchors, anchorTs, phaseByAnchor } from '@/data/anchors'
import { getTransitions } from '@/data/transitions'
import { nearestAnchorIndex, activeTransitionIndex } from '@/utils/interpolate'
import { normalProcessByAnchor, conditionCards } from '@/data/conditionCards'
import { conditions } from '@/data/conditions'
import { highlightHormones } from '@/utils/highlightHormones'

const PHASE_LABEL: Record<string, string> = {
  follicular: 'Follicular Phase',
  luteal: 'Luteal Phase',
}

export default function ContentCard() {
  const { progress, condition } = useSimulationStore()
  const [expanded, setExpanded] = useState(false)

  const nearestIdx = nearestAnchorIndex(anchorTs, progress)
  const transitionIdx = activeTransitionIndex(anchorTs, progress)
  const onAnchor = transitionIdx === -1

  const anchor = anchors[nearestIdx]
  const transition = transitionIdx >= 0 ? getTransitions(condition)[transitionIdx] : null

  if (condition !== 'normal') {
    const cond = conditions.find((c) => c.id === condition)
    const card = conditionCards[condition]?.[anchor.id]
    const normalProcess = normalProcessByAnchor[anchor.id]
    const changeLabel = `${cond?.label ?? ''} Change`

    return (
      <div
        key="condition-card"
        className="z-30 rounded-2xl shadow-lg"
        style={{
          position: 'fixed',
          bottom: 112,
          left: 24,
          width: 400,
          background: '#FFF7F8',
          border: '1px solid #E8A7B0',
          padding: '16px 18px',
        }}
      >
        {/* Stage label */}
        {/* initial={false}: this whole condition-card branch only mounts
            fresh when switching AWAY from Normal — Normal and the condition
            card are structurally different JSX (the early return above), so
            React remounts this subtree rather than updating it in place.
            That remount's very first enter tween (opacity 0→1) could end up
            never completing — landing the card permanently stuck invisible
            at its initial opacity:0 with fully-populated but invisible text,
            rather than a visibly blank/empty card. initial={false} skips
            animating the FIRST appearance entirely (content just shows,
            already at its animate state) while leaving exit/enter animation
            intact for later anchor-to-anchor changes within a condition,
            which aren't affected by this since they update in place rather
            than remounting. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={anchor.id + '-label'}
            className="font-bold uppercase tracking-wider mb-2"
            style={{ color: '#C85C72', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {anchor.title}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={anchor.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            {/* Normal Process */}
            <div>
              <span
                className="inline-block font-semibold rounded-full px-2 py-0.5 mb-1"
                style={{ background: '#FCE3E8', color: '#D97A91', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
              >
                Normal Process
              </span>
              <p style={{ color: '#5a3040', fontSize: 14, lineHeight: '16.575px' }}>
                {highlightHormones(normalProcess)}
              </p>
            </div>

            {/* Condition Change */}
            <div>
              <span
                className="inline-block font-semibold rounded-full px-2 py-0.5 mb-1"
                style={{ background: '#F7CDD5', color: '#B94A62', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
              >
                {changeLabel}
              </span>
              <p style={{ color: '#5a3040', fontSize: 14, lineHeight: '16.575px' }}>
                {card?.conditionChange && highlightHormones(card.conditionChange)}
              </p>
            </div>

            {/* Key Result */}
            <div
              className="rounded-lg px-3 py-2"
              style={{
                background: '#FFECEF',
                borderLeft: '4px solid #C85C72',
              }}
            >
              <p className="font-semibold" style={{ color: '#8F2F46', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
                ⭐ {card?.keyResult && highlightHormones(card.keyResult)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Normal mode (existing behaviour) ──────────────────────────────────────
  const title = onAnchor
    ? anchor.title
    : transition
      ? `${anchors[transitionIdx].title} → ${anchors[transitionIdx + 1].title}`
      : anchor.title
  const question = onAnchor ? anchor.question : null
  const explanation = transition?.explanation ?? null
  const brainEvents = transition?.brainEvents ?? []

  // Only shown inside the expanded "brain events" list (transitions only —
  // anchors never have brain events, so the phase never surfaces on the
  // main card where it was too distracting).
  const phaseLabel = transition
    ? (() => {
        const fromPhase = phaseByAnchor[anchors[transitionIdx]!.id]!
        const toPhase = phaseByAnchor[anchors[transitionIdx + 1]!.id]!
        return fromPhase === toPhase ? PHASE_LABEL[fromPhase] : 'Ovulation'
      })()
    : null

  return (
    <div
      key="normal-card"
      className="z-30 w-72 rounded-2xl p-4 shadow-lg"
      style={{
        position: 'fixed',
        bottom: 112,
        left: 24,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        height: 'auto',
        maxHeight: 'min(45vh, 420px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-bold uppercase tracking-wider" style={{ color: 'var(--accent)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
          {onAnchor ? 'Event' : 'Transition'}
        </p>
      </div>

      {/* Title */}
      <AnimatePresence mode="wait">
        <motion.h3
          key={title}
          className="font-semibold"
          style={{ color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 16, lineHeight: '17px', marginBottom: 6 }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {title}
        </motion.h3>
      </AnimatePresence>

      {/* Question */}
      {question && (
        <AnimatePresence mode="wait">
          <motion.p
            key={question}
            className="font-medium mb-2"
            style={{ color: 'var(--lavender)', fontSize: 14, lineHeight: '13.6px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {question}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Explanation */}
      {explanation && (
        <AnimatePresence mode="wait">
          <motion.p
            key={explanation.slice(0, 30)}
            style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {highlightHormones(explanation)}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Brain events — expandable */}
      {brainEvents.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 underline cursor-pointer"
            style={{ color: 'var(--lavender)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
          >
            {expanded ? 'Hide brain events' : 'Show brain events'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                className="mt-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {phaseLabel && (
                  <span
                    className="inline-block font-semibold rounded-full px-2 py-0.5 mb-1"
                    style={{ background: 'var(--lavender-light)', color: 'var(--lavender)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 11, lineHeight: '11px', whiteSpace: 'nowrap' }}
                  >
                    {phaseLabel}
                  </span>
                )}
                <ul className="space-y-1">
                  {brainEvents.map((ev, i) => (
                    <li key={i} className="flex gap-1" style={{ color: 'var(--lavender)', fontSize: 14, lineHeight: '13.6px' }}>
                      <span>↑</span>{highlightHormones(ev)}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
