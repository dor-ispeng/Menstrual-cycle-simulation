'use client'

import { useRef, useCallback } from 'react'
import { useSimulationStore } from '@/store/simulation'
import { anchors } from '@/data/anchors'
import { clamp } from '@/utils/interpolate'

// When the user releases the mouse within this distance of an anchor the
// handle snaps cleanly to it — giving each stop a tactile "click" feel
// while leaving the drag itself fully free.
const SNAP_RADIUS = 0.015

export default function TimelineBar() {
  const { progress, setProgress, setIsPlaying } = useSimulationStore()
  const trackRef = useRef<HTMLDivElement>(null)

  const getProgressFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    setProgress(clamp((clientX - rect.left) / rect.width, 0, 1))
  }, [setProgress])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPlaying(false)   // cancel guided playback the moment the user grabs the timeline
    getProgressFromEvent(e.clientX)

    const onMove = (ev: MouseEvent) => getProgressFromEvent(ev.clientX)

    const onUp = (ev: MouseEvent) => {
      // Snap to the nearest anchor if the release is close enough.
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect()
        const finalP = clamp((ev.clientX - rect.left) / rect.width, 0, 1)
        const nearest = anchors.reduce((best, a) =>
          Math.abs(a.t - finalP) < Math.abs(best.t - finalP) ? a : best
        )
        if (Math.abs(nearest.t - finalP) <= SNAP_RADIUS) {
          setProgress(nearest.t)
        }
      }
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [getProgressFromEvent, setProgress, setIsPlaying])

  const currentAnchor = anchors.reduce((best, a) =>
    Math.abs(a.t - progress) < Math.abs(best.t - progress) ? a : best
  )

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-8 pb-5 pt-3"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      {/* Current event label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {currentAnchor.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag to explore ·&nbsp;
          <span style={{ color: 'var(--foreground)' }}>
            {Math.round(progress * 100)}%
          </span>
        </p>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        className="relative h-2 rounded-full cursor-pointer"
        style={{ background: 'var(--border)' }}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-none"
          style={{ width: `${progress * 100}%`, background: 'var(--accent)' }}
        />

        {/* Anchor markers */}
        {anchors.map((a) => (
          <button
            key={a.id}
            onClick={() => setProgress(a.t)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 transition-all duration-200"
            style={{
              left: `${a.t * 100}%`,
              width: Math.abs(a.t - progress) < 0.04 ? 14 : 10,
              height: Math.abs(a.t - progress) < 0.04 ? 14 : 10,
              background: a.t <= progress ? 'var(--accent)' : 'var(--surface)',
              borderColor: 'var(--accent)',
            }}
            title={a.title}
          />
        ))}

        {/* Thumb — one source of truth, directly under the cursor */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow pointer-events-none"
          style={{ left: `${progress * 100}%`, background: 'var(--accent)', border: '2px solid white' }}
        />
      </div>

      {/* Anchor labels */}
      <div className="relative mt-2 h-4">
        {anchors.map((a) => (
          <span
            key={a.id}
            className="absolute text-xs -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${a.t * 100}%`,
              color: Math.abs(a.t - progress) < 0.04 ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: Math.abs(a.t - progress) < 0.04 ? 600 : 400,
              fontSize: 9,
            }}
          >
            {a.title}
          </span>
        ))}
      </div>
    </div>
  )
}
