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

// Normalisation denominators: absolute scale (same 0–100 axis the hormone
// graph plots on), not normal-cycle peaks. A peak-based denominator would
// mean nothing could ever render as more intense than normal — any future
// condition with a genuinely elevated hormone would clamp and become
// indistinguishable from normal's peak.
const FSH_NORM  = 100
const LH_NORM   = 100
const EST_NORM  = 100
const PROG_NORM = 100

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
const PAN_PAD_BELOW_ANATOMY  = 320  // px of empty space below anatomy when panned all the way down —
                                     // large enough to hold the KEY NOTE plate (see below) with margin
                                     // beneath it before the hard pan limit

void BRAIN_BOT_Y  // referenced indirectly via BRAIN_TOP_Y/PAN_PAD_ABOVE_BRAIN

// ── Key note (below the anatomy) ─────────────────────────────────────────────
// Mirrors Footer.tsx's "KEY NOTE" disclaimer, but the model page renders no
// Footer — this is the ONLY disclaimer on the model page, reachable by
// dragging the canvas down past the anatomy. Lives inside the pannable SVG
// (not a fixed overlay) so it's discovered by exploring, matching the rest of
// the canvas's show-don't-tell design. No background plate, by design — the
// text sits directly on the canvas, widened into 4 longer lines rather than
// the original 5 short ones.
//
// Line width is capped well short of what the canvas itself could fit,
// because HormoneGraph's panel is a FIXED screen-space overlay (not part of
// the pannable SVG) sitting at the right edge of the viewport. At a 1280px
// viewport its left edge lands at canvas x≈996 — centered text wider than
// ~550px starts running under it. 4 lines at ~70 chars keeps every line
// under that on common desktop widths; going to 3 longer lines (as first
// tried) measured ~660px and clipped visibly under the panel.
//
// Flat white on this band's worst-case backdrop (base rect #e3a3a8 composited
// with all three overlapping bgShadowEdge ellipses, ≈rgb(186,121,129)) measures
// ≈3.4:1 — under the 4.5:1 body-text minimum, since there's no opaque plate
// (or stroked halo — deliberately removed) to lean on. Plain white was the
// explicit ask over the contrast-safer alternatives; flagging the number
// here rather than silently making that trade.
const KEYNOTE_CENTER_X     = 700
const KEYNOTE_LABEL_Y      = 1235
const KEYNOTE_BODY_FIRST_Y = 1266
const KEYNOTE_BODY_LINE_H  = 26

const KEYNOTE_TEXT_COLOR   = '#ffffff'

// Hand-broken so no line is a stub — SVG <text> doesn't wrap on its own.
const KEYNOTE_BODY_LINES = [
  'This is not a diagnostic tool — it is solely for education and empowerment.',
  'If you have personal health concerns, please consult a professional',
  'medical provider. The visuals above are simplified and may not be',
  'anatomically precise; hormone levels and cycle timing vary between individuals.',
]

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
  const { progress, condition, setSelectedStructure, isPlaying, selectedStructureId } = useSimulationStore()

  // Guided playback already freezes progress advancement while a structure
  // card is open (see HormoneGraph's tick loop) — this makes the hormone
  // particles freeze in place too, since their flight loops are otherwise
  // driven independently of `progress` and would keep flying through the
  // pause. Scoped to guided playback only: manual scrubbing + a clicked
  // structure isn't "paused" in the same sense, so particles keep flying.
  const particlesFrozen = isPlaying && selectedStructureId !== null
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

  const brainActivityLevel = interpolateKeyframes(kf.brainActivity, anchorTs, heldProgress)

  const fshLevel         = interpolateKeyframes(kf.fsh,          anchorTs, heldProgress) / FSH_NORM
  const lhLevel          = interpolateKeyframes(kf.lh,           anchorTs, heldProgress) / LH_NORM
  const estrogenLevel    = interpolateKeyframes(kf.estrogen,     anchorTs, heldProgress) / EST_NORM
  const progesteroneLevel= interpolateKeyframes(kf.progesterone, anchorTs, heldProgress) / PROG_NORM

  // How much follicles actually GROW in response to FSH — separate from
  // fshLevel itself, which still drives how bright the FSH glow reads. A
  // condition can set follicleFshResponse below 1 to show a loud FSH signal
  // reaching an ovary that can't respond to it (e.g. diminished reserve).
  // All current conditions omit the field, so this equals fshLevel for them.
  const follicleFshDrive = fshLevel * (cond.follicleFshResponse ?? 1)

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
      {condition !== 'normal' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full font-semibold"
          style={{ background: 'var(--lavender-light)', color: 'var(--lavender)', border: '1px solid var(--lavender)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
        >
          {cond.label}
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => transformRef.current?.zoomIn()}
          className="w-8 h-8 rounded-lg font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 16, lineHeight: '17px' }}
          title="Zoom in"
        >+</button>
        <button
          onClick={() => transformRef.current?.zoomOut()}
          className="w-8 h-8 rounded-lg font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--site-heading-rose-dark)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 16, lineHeight: '17px' }}
          title="Zoom out"
        >−</button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-fredoka), sans-serif', fontSize: 14, lineHeight: '13.6px' }}
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
          wrapperStyle={{ width: '100%', height: '100%', background: '#e3a3a8' }}
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
              <defs>
                <radialGradient id="bgGlowBrain" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f8ddd4" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#f8ddd4" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="bgGlowAnatomy" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e0a8ab" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#e0a8ab" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="bgShadowEdge" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a15f68" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a15f68" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base cavity tone */}
              <rect width={CANVAS_W} height={CANVAS_H} fill="#e3a3a8" />

              {/* Soft depth shadows along the edges — each ellipse is sized/positioned so its
                  fade reaches exactly 0% opacity at the canvas boundary (cx = rx, or cx = CANVAS_W - rx,
                  etc.), so there's no visible seam against the flat wrapper background beyond the frame. */}
              <ellipse cx={500} cy={450} rx={500} ry={400} fill="url(#bgShadowEdge)" />
              <ellipse cx={500} cy={1300} rx={500} ry={400} fill="url(#bgShadowEdge)" />
              <ellipse cx={900} cy={450} rx={500} ry={400} fill="url(#bgShadowEdge)" />
              <ellipse cx={900} cy={1300} rx={500} ry={400} fill="url(#bgShadowEdge)" />
              <ellipse cx={700} cy={350} rx={600} ry={350} fill="url(#bgShadowEdge)" />
              <ellipse cx={700} cy={1450} rx={650} ry={350} fill="url(#bgShadowEdge)" />

              {/* Lighter "cavity" glow pockets behind the brain and the uterus/ovary/tube group,
                  so a lit-interior look is visible at typical pan/zoom, not just fully zoomed out. */}
              <ellipse cx={700} cy={65} rx={95} ry={60} fill="url(#bgGlowBrain)" />
              <ellipse cx={700} cy={700} rx={620} ry={480} fill="url(#bgGlowAnatomy)" />
              <ellipse cx={980} cy={580} rx={320} ry={260} fill="url(#bgGlowAnatomy)" />

              {/* Key note — the model page's only disclaimer, see the constants'
                  comments above for why it's plain white text with no
                  background plate. pointerEvents none so a drag starting
                  here still pans the canvas instead of being swallowed by
                  text. */}
              <g style={{ pointerEvents: 'none' }}>
                <text
                  x={KEYNOTE_CENTER_X}
                  y={KEYNOTE_LABEL_Y}
                  textAnchor="middle"
                  fontFamily="var(--font-fredoka), sans-serif"
                  fontWeight={600}
                  fontSize={14}
                  letterSpacing="0.3px"
                  fill={KEYNOTE_TEXT_COLOR}
                >
                  KEY NOTE
                </text>
                <text
                  x={KEYNOTE_CENTER_X}
                  y={KEYNOTE_BODY_FIRST_Y}
                  textAnchor="middle"
                  fontFamily="var(--font-quicksand), sans-serif"
                  fontSize={15}
                  fill={KEYNOTE_TEXT_COLOR}
                >
                  {KEYNOTE_BODY_LINES.map((line, i) => (
                    <tspan key={i} x={KEYNOTE_CENTER_X} dy={i === 0 ? 0 : KEYNOTE_BODY_LINE_H}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>

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
                  follicleFshDrive={follicleFshDrive}
                  lhLevel={lhLevel}
                  progesteroneLevel={progesteroneLevel}
                  zoomLevel={zoomLevel}
                  onStructureClick={setSelectedStructure}
                  folliclePositions={cond.folliclePositions}
                />
              </g>

              <BrainLayer
                fshLevel={fshLevel}
                lhLevel={lhLevel}
                estrogenLevel={estrogenLevel}
                progesteroneLevel={progesteroneLevel}
                brainActivity={brainActivityLevel}
                dominantFollicleRadius={dominantFollicleR}
                corpusLuteumRadius={corpusLuteumR}
                smallFollicleCount={smallFollicleCount}
                stageIndex={stageIndex}
                isOnAnchor={isOnAnchor}
                primaryHormoneByStage={cond.primaryHormoneByStage}
                secondaryDim={cond.secondaryDim}
                folliclePositions={cond.folliclePositions}
                fshTargetIndices={cond.fshTargetIndices}
                conditionId={cond.id}
                onStructureClick={setSelectedStructure}
                isFrozen={particlesFrozen}
              />
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
