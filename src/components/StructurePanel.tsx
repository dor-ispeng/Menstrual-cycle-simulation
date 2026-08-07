'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulation'
import { structures } from '@/data/structures'
import { conditionStructureContent } from '@/data/conditionStructures'
import { conditions } from '@/data/conditions'
import { anchors, anchorTs } from '@/data/anchors'
import { nearestAnchorIndex } from '@/utils/interpolate'
import { StructureContent } from '@/types/simulation'

// Anchor IDs in chronological order — used for fallback traversal.
const ANCHOR_ORDER = anchors.map((a) => a.id)

// Returns content for the current anchor, or the nearest previous anchor
// that has content, or null if the structure has no content at all.
function resolveContent(
  contextContent: Record<string, StructureContent | undefined>,
  anchorId: string,
): StructureContent | null {
  if (contextContent[anchorId]) return contextContent[anchorId]!
  const idx = ANCHOR_ORDER.indexOf(anchorId)
  for (let i = idx - 1; i >= 0; i--) {
    const id = ANCHOR_ORDER[i]!
    if (contextContent[id]) return contextContent[id]!
  }
  return null
}

export default function StructurePanel() {
  const { selectedStructureId, setSelectedStructure, progress, condition } = useSimulationStore()

  const structure = structures.find((s) => s.id === selectedStructureId)
  const nearestIdx = nearestAnchorIndex(anchorTs, progress)
  const anchorId   = anchors[nearestIdx]!.id

  // Condition-specific content is resolved FIRST, with its own backward-walk
  // over only that condition's entries, before falling back to the
  // normal-cycle content in structures.ts. Merging the two maps together and
  // walking once would let a base-content entry from a LATER normal-cycle
  // anchor leak into a gap inside the condition's own narrative — resolving
  // condition content in isolation first avoids that.
  const overrideMap = structure ? conditionStructureContent[condition]?.[structure.id] : undefined
  const overrideContent = overrideMap
    ? resolveContent(overrideMap as Record<string, StructureContent | undefined>, anchorId)
    : null
  const content = structure
    ? overrideContent ?? resolveContent(structure.contextContent as Record<string, StructureContent | undefined>, anchorId)
    : null

  const cond = conditions.find((c) => c.id === condition)

  return (
    <AnimatePresence>
      {structure && (
        <motion.div
          className="absolute bottom-28 right-6 z-30 w-64 rounded-2xl p-4 shadow-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close */}
          <button
            onClick={() => setSelectedStructure(null)}
            className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full hover:opacity-70"
            style={{ background: 'var(--border)', color: 'var(--text-muted)', fontSize: 14, lineHeight: '13.6px' }}
          >
            ×
          </button>

          {/* Zoom hint for granulosa cells */}
          {structure.zoomRequired && (
            <p className="mb-2 px-2 py-1 rounded-lg" style={{ background: 'var(--lavender-light)', color: 'var(--lavender)', fontSize: 14, lineHeight: '13.6px' }}>
              Zoom in to see this structure
            </p>
          )}

          <p className="font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
            {overrideContent ? `Structure · ${cond?.shortLabel ?? ''}` : 'Structure'}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${condition}-${selectedStructureId}-${anchorId}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <h3 className="font-semibold mb-3" style={{ color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 16, lineHeight: '17px' }}>
                {content?.title ?? structure.name}
              </h3>

              {content ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--lavender)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
                      What&apos;s happening
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}>
                      {content.whatIsHappening}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--lavender)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}>
                      Why it matters
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}>
                      {content.whyItMatters}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '16.575px' }}>
                  {structure.shortDescription}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
