'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulation'
import { anchors, anchorTs } from '@/data/anchors'
import { getTransitions } from '@/data/transitions'
import { nearestAnchorIndex, activeTransitionIndex } from '@/utils/interpolate'
import { pcosCards } from '@/data/pcosCards'

export default function ContentCard() {
  const { progress, condition } = useSimulationStore()
  const [expanded, setExpanded] = useState(false)

  const nearestIdx = nearestAnchorIndex(anchorTs, progress)
  const transitionIdx = activeTransitionIndex(anchorTs, progress)
  const onAnchor = transitionIdx === -1

  const anchor = anchors[nearestIdx]
  const transition = transitionIdx >= 0 ? getTransitions(condition)[transitionIdx] : null

  const isPcos = condition === 'pcos'

  if (isPcos) {
    const card = pcosCards[nearestIdx]

    return (
      <div
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
        <AnimatePresence mode="wait">
          <motion.p
            key={anchor.id + '-label'}
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: '#C85C72' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {anchor.title}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
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
                className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 mb-1"
                style={{ background: '#FCE3E8', color: '#D97A91' }}
              >
                Normal Process
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#5a3040' }}>
                {card.normalProcess}
              </p>
            </div>

            {/* PCOS Change */}
            <div>
              <span
                className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 mb-1"
                style={{ background: '#F7CDD5', color: '#B94A62' }}
              >
                PCOS Change
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#5a3040' }}>
                {card.pcosChange}
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
              <p className="text-xs font-semibold" style={{ color: '#8F2F46' }}>
                ⭐ {card.keyResult}
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

  return (
    <div
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
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
          {onAnchor ? 'Event' : 'Transition'}
        </p>
      </div>

      {/* Title */}
      <AnimatePresence mode="wait">
        <motion.h3
          key={title}
          className="text-sm font-semibold mb-1"
          style={{ color: 'var(--foreground)' }}
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
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--lavender)' }}
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
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {explanation}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Brain events — expandable */}
      {brainEvents.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs underline cursor-pointer"
            style={{ color: 'var(--lavender)' }}
          >
            {expanded ? 'Hide brain events' : 'Show brain events'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.ul
                className="mt-1 space-y-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {brainEvents.map((ev, i) => (
                  <li key={i} className="text-xs flex gap-1" style={{ color: 'var(--lavender)' }}>
                    <span>↑</span>{ev}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
