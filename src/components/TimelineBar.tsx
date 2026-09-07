'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
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
    // Without this, mousedown starts a native text selection that tracks the
    // cursor for the rest of the drag — since the move/up listeners below are
    // on `window` (so the drag keeps working even once the cursor leaves the
    // track), that selection sweeps across whatever page text the cursor
    // crosses, not just the track itself. preventDefault stops the selection
    // from starting; the body-level user-select toggle below is what stops
    // it for elements outside the track specifically.
    e.preventDefault()
    document.body.style.userSelect = 'none'

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
      cleanup()
    }

    // Releasing the mouse button outside the browser window entirely (over
    // another app) never fires `mouseup` here, which would otherwise leave
    // the page permanently unselectable. Window blur is the closest
    // available proxy for "the drag session is over" in that case.
    const onBlur = () => cleanup()

    function cleanup() {
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('blur', onBlur)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('blur', onBlur)
  }, [getProgressFromEvent, setProgress, setIsPlaying])

  const currentAnchor = anchors.reduce((best, a) =>
    Math.abs(a.t - progress) < Math.abs(best.t - progress) ? a : best
  )

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-8 pb-5 pt-3"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-fredoka), sans-serif' }}
    >
      {/* Current event label */}
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold" style={{ color: 'var(--accent)', fontSize: 14, lineHeight: '13.6px' }}>
          {currentAnchor.title}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: '13.6px' }}>
          Drag to explore ·&nbsp;
          <span style={{ color: 'var(--site-heading-rose-dark)' }}>
            {Math.round(progress * 100)}%
          </span>
        </p>
      </div>

      {/* Persistent disclaimer. The model page renders no Footer (it's a
          full-viewport canvas), so this bar is the only always-visible
          surface on the page a user actually reads health information from.
          The full KEY NOTE text still lives on the canvas below the anatomy,
          but that requires dragging to reach — a disclaimer the reader has to
          go looking for is not a conspicuous one. This line needs no
          interaction to be seen, which is the whole point; it also carries
          the Privacy/Terms links, since the Footer that holds them elsewhere
          never renders here. */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2"
        style={{ fontSize: 11, lineHeight: '12px', color: 'var(--text-muted)' }}
      >
        <span>Educational model — not medical advice.</span>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" style={{ color: 'var(--site-heading-rose-dark)', textDecoration: 'underline' }}>
          Privacy
        </Link>
        <Link href="/terms" style={{ color: 'var(--site-heading-rose-dark)', textDecoration: 'underline' }}>
          Terms
        </Link>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        className="relative h-2 rounded-full cursor-pointer"
        style={{ background: 'var(--border)', userSelect: 'none', WebkitUserSelect: 'none' }}
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
        {anchors.map((a, i) => {
          const isFirst = i === 0
          const isLast = i === anchors.length - 1
          const translateX = isFirst ? '0' : isLast ? '-100%' : '-50%'
          return (
            <span
              key={a.id}
              className="absolute whitespace-nowrap"
              style={{
                left: `${a.t * 100}%`,
                transform: `translateX(${translateX})`,
                color: Math.abs(a.t - progress) < 0.04 ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: Math.abs(a.t - progress) < 0.04 ? 600 : 400,
                fontSize: 11,
              }}
            >
              {a.title}
            </span>
          )
        })}
      </div>
    </div>
  )
}
