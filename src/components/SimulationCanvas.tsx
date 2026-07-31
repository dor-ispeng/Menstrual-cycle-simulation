'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { useSimulationStore } from '@/store/simulation'
import { conditions } from '@/data/conditions'
import { anchors, anchorTs } from '@/data/anchors'
import { interpolateKeyframes, nearestAnchorIndex, activeTransitionIndex } from '@/utils/interpolate'
import BrainLayer from './BrainLayer'
import AnatomyLayer from './AnatomyLayer'

const CANVAS_W = 1400
// Canvas height: large enough to always exceed the viewport so limitToBounds
// gives the library a real negative minY to work with before our override.
const CANVAS_H = 1800

// Vertical shift applied to the whole AnatomyLayer group (see the <g transform>
// below). Exported so other components (e.g. BrainLayer's particle endpoints)
// can derive canvas-space anatomy coordinates instead of re-hardcoding this.
export const ANATOMY_GROUP_Y_OFFSET = 250

// Normalisation denominators: peak values from normal-cycle keyframes
const FSH_NORM  = 65
const LH_NORM   = 95
const EST_NORM  = 82
const PROG_NORM = 80

// Half-width of the visual freeze zone around each anchor (progress units).
// Anatomy, hormones, and particle visibility all clamp to the anchor state
// inside this band.  0.04 matches the timeline's SNAP_RADIUS so the
// handle, hold zone, and snap all activate at the exact same distance.
const ANCHOR_HOLD_RADIUS = 0.008

function applyAnchorHold(p: number): number {
  for (const t of anchorTs) {
    if (Math.abs(p - t) <= ANCHOR_HOLD_RADIUS) return t
  }
  return p
}

// ── Explicit scene regions (canvas-space Y coordinates) ─────────────────────
// Brain sits at the TOP of the canvas (y=0–112).
// Anatomy group has translate(0, 250) applied, so all AnatomyLayer local
// coordinates are offset by +250 in canvas space.
const BRAIN_TOP_Y   = 0      // top of hypothalamus
const BRAIN_BOT_Y   = 112    // pituitary bottom / hormone emission point
const ANATOMY_TOP_Y = 315    // top of uterus  (AnatomyLayer local y=65  + 250)
const ANATOMY_BOT_Y = 1125   // bottom of uterus (AnatomyLayer local y=875 + 250)
const ANATOMY_MID_Y = (ANATOMY_TOP_Y + ANATOMY_BOT_Y) / 2   // = 720

// Padding visible beyond the scene edges at the pan limits
const PAN_PAD_ABOVE_BRAIN    = 80   // px of empty space above brain when panned all the way up
const PAN_PAD_BELOW_ANATOMY  = 250  // px of empty space below anatomy when panned all the way down

void BRAIN_BOT_Y  // referenced indirectly via BRAIN_TOP_Y/PAN_PAD_ABOVE_BRAIN

// ── Camera bounds (posY space) ───────────────────────────────────────────────
// posY = CSS translateY on the content div.
// At posY=p: visible canvas top = −p, visible canvas bottom = −p + wrapperHeight.
//
// maxY (most "up" the camera goes, shows brain):
//   at posY=maxY, viewport top = canvas y = −PAN_PAD_ABOVE_BRAIN (above brain)
//   → maxY = PAN_PAD_ABOVE_BRAIN
//
// minY (most "down" the camera goes, shows anatomy bottom):
//   at posY=minY, viewport bottom = ANATOMY_BOT_Y + PAN_PAD_BELOW_ANATOMY
//   → −minY + wh = ANATOMY_BOT_Y + PAN_PAD_BELOW_ANATOMY
//   → minY = wh − ANATOMY_BOT_Y − PAN_PAD_BELOW_ANATOMY
function computePanBounds(wh: number): { minY: number; maxY: number } {
  return {
    maxY: PAN_PAD_ABOVE_BRAIN,
    minY: wh - ANATOMY_BOT_Y - PAN_PAD_BELOW_ANATOMY,
  }
}

// Initial camera Y: center the viewport on ANATOMY_MID_Y, clamped to pan bounds.
function computeInitialY(wh: number): number {
  const { minY, maxY } = computePanBounds(wh)
  const rawY = -(ANATOMY_MID_Y - wh / 2)
  return Math.max(minY, Math.min(maxY, rawY))
}

// Initial camera X: center the canvas horizontally.
function computeInitialX(ww: number): number {
  return (ww - CANVAS_W) / 2
}

export default function SimulationCanvas() {
  const { progress, condition, setSelectedStructure } = useSimulationStore()
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const cond = conditions.find((c) => c.id === condition) ?? conditions[0]
  const kf = cond.keyframes

  // Single derived value: clamps to the nearest anchor's t when within
  // ANCHOR_HOLD_RADIUS. Drives ALL visual state (anatomy + hormones) so
  // every system freezes and unfreezes at exactly the same point.
  // The raw `progress` value (handle, labels, event card) is never touched.
  const heldProgress = applyAnchorHold(progress)

  const smallFollicleCount   = interpolateKeyframes(kf.smallFollicleCount,    anchorTs, heldProgress)
  const dominantFollicleR    = interpolateKeyframes(kf.dominantFollicleRadius, anchorTs, heldProgress)
  const corpusLuteumR        = interpolateKeyframes(kf.corpusLuteumRadius,     anchorTs, heldProgress)
  const eggProgress          = interpolateKeyframes(kf.eggProgress,            anchorTs, heldProgress)
  const endometriumThickness = interpolateKeyframes(kf.endometriumThickness,   anchorTs, heldProgress)

  const fshLevel         = interpolateKeyframes(kf.fsh,          anchorTs, heldProgress) / FSH_NORM
  const lhLevel          = interpolateKeyframes(kf.lh,           anchorTs, heldProgress) / LH_NORM
  const estrogenLevel    = interpolateKeyframes(kf.estrogen,     anchorTs, heldProgress) / EST_NORM
  const progesteroneLevel= interpolateKeyframes(kf.progesterone, anchorTs, heldProgress) / PROG_NORM

  const nearestIdx  = nearestAnchorIndex(anchorTs, progress)
  const stageIndex  = activeTransitionIndex(anchorTs, progress)
  const isOnAnchor  = Math.abs((anchorTs[nearestIdx] ?? 0) - progress) <= ANCHOR_HOLD_RADIUS
  void anchors[nearestIdx]

  // ── onInit: earliest safe point (wrapperComponent is set, but ref not yet
  // assigned). Sets anatomy-centered initial position via the ref passed in.
  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const wrapper = ref.instance.wrapperComponent as HTMLElement | null
      if (!wrapper) return
      const wh = wrapper.offsetHeight
      const ww = wrapper.offsetWidth
      const y = computeInitialY(wh)
      const x = computeInitialX(ww)
      console.log('[init] wh=', wh, 'initY=', y.toFixed(1))
      ref.setTransform(x, y, 1.0, 0)
    },
    [],
  )

  // ── useEffect backup: runs after TransformComponent's useEffect has called
  // init() and assignRef(), so transformRef.current is guaranteed set.
  // Idempotent with onInit — sets the same anatomy-centered position.
  useEffect(() => {
    const ref = transformRef.current
    if (!ref) return
    const wrapper = ref.instance.wrapperComponent as HTMLElement | null
    if (!wrapper) return
    const wh = wrapper.offsetHeight
    const ww = wrapper.offsetWidth
    const y = computeInitialY(wh)
    const x = computeInitialX(ww)
    ref.setTransform(x, y, 1.0, 0)
  }, [])

  // ── Pan bounds: override the library's DOM-measurement bounds with explicit
  // anatomy-based values on every drag start. Bounds are scaled by the current
  // zoom level — at scale > 1 the content is physically larger so the valid
  // pan range grows proportionally. Without this correction, zoomed-in drags
  // snap back because the hardcoded minY is far above the actual position.
  const handlePanningStart = useCallback(
    (ref: ReactZoomPanPinchRef, _e: TouchEvent | MouseEvent) => {
      const wh    = (ref.instance.wrapperComponent as HTMLElement | null)?.offsetHeight ?? 0
      const scale = ref.state.scale
      if (ref.instance.bounds) {
        ref.instance.bounds.maxPositionY =  PAN_PAD_ABOVE_BRAIN * scale
        ref.instance.bounds.minPositionY =  wh - (ANATOMY_BOT_Y + PAN_PAD_BELOW_ANATOMY) * scale
      }
    },
    [],
  )

  const handleReset = () => {
    const ref = transformRef.current
    if (!ref) return
    const wrapper = ref.instance.wrapperComponent as HTMLElement | null
    if (!wrapper) { ref.resetTransform(250); return }
    const wh = wrapper.offsetHeight
    const ww = wrapper.offsetWidth
    ref.setTransform(computeInitialX(ww), computeInitialY(wh), 1.0, 250)
  }

  const handleTransform = useCallback(
    (_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
      setZoomLevel(state.scale)
    },
    [],
  )

  return (
    <div className="w-full h-full relative">
      {condition === 'pcos' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--lavender-light)', color: 'var(--lavender)', border: '1px solid var(--lavender)' }}
        >
          PCOS pattern
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => transformRef.current?.zoomIn()}
          className="w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          title="Zoom in"
        >+</button>
        <button
          onClick={() => transformRef.current?.zoomOut()}
          className="w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          title="Zoom out"
        >−</button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg text-xs flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          title="Reset view"
        >⌂</button>
      </div>

      <TransformWrapper
        ref={transformRef}
        initialScale={1.0}
        minScale={1.0}
        maxScale={5.0}
        limitToBounds={true}
        autoAlignment={{ disabled: true }}
        velocityAnimation={{ disabled: true }}
        onInit={handleInit}
        onTransform={handleTransform}
        onPanningStart={handlePanningStart}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%', background: '#f5cdd4' }}
        >
          {/* Explicit-size div guarantees contentComponent.offsetHeight = CANVAS_H
              regardless of the library's CSS class (height:fit-content). */}
          <div style={{ width: CANVAS_W, height: CANVAS_H, overflow: 'visible' }}>
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ display: 'block', userSelect: 'none' }}
            >
              <rect width={CANVAS_W} height={CANVAS_H} fill="#f5cdd4" />

              {/* Anatomy group: shifts all AnatomyLayer elements so uterus top
                  lands at canvas y=315 and bottom at y=1125. */}
              <g transform={`translate(0, ${ANATOMY_GROUP_Y_OFFSET})`}>
                <AnatomyLayer
                  smallFollicleCount={smallFollicleCount}
                  dominantFollicleRadius={dominantFollicleR}
                  corpusLuteumRadius={corpusLuteumR}
                  eggProgress={eggProgress}
                  endometriumThickness={endometriumThickness}
                  fshLevel={fshLevel}
                  lhLevel={lhLevel}
                  progesteroneLevel={progesteroneLevel}
                  zoomLevel={zoomLevel}
                  onStructureClick={setSelectedStructure}
                />
              </g>

              <BrainLayer
                fshLevel={fshLevel}
                lhLevel={lhLevel}
                estrogenLevel={estrogenLevel}
                progesteroneLevel={progesteroneLevel}
                dominantFollicleRadius={dominantFollicleR}
                corpusLuteumRadius={corpusLuteumR}
                stageIndex={stageIndex}
                isOnAnchor={isOnAnchor}
                primaryHormoneByStage={cond.primaryHormoneByStage}
                secondaryDim={cond.secondaryDim}
                onStructureClick={setSelectedStructure}
              />
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
