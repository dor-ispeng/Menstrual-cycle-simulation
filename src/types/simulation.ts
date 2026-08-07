export type ConditionId =
  | 'normal'
  | 'pcos'
  | 'functional-hypothalamic-amenorrhea'
  | 'primary-ovarian-insufficiency'

export type HormoneKey = 'fsh' | 'lh' | 'estrogen' | 'progesterone'

// One entry per transition (7 total) — which hormone is visually "primary"
// during that stage of the cycle.
export type StagePrimaryHormones = [
  HormoneKey, HormoneKey, HormoneKey, HormoneKey,
  HormoneKey, HormoneKey, HormoneKey,
]

export type Anchor = {
  id: string
  title: string
  question: string
  t: number // 0–1 position on timeline
}

export type Transition = {
  fromAnchorId: string
  toAnchorId: string
  explanation: string
  brainEvents: string[]
  beats: string[]        // short single-line descriptions for guided playback
  guidedDuration: number // seconds for the guided transition animation
}

export type StructureContent = {
  title: string
  whatIsHappening: string
  whyItMatters: string
}

export type Structure = {
  id: string
  name: string
  shortDescription: string
  zoomRequired: boolean
  svgX: number
  svgY: number
  svgRadius: number
  contextContent: Partial<Record<string, StructureContent>>
}

// One value per anchor (8 total), interpolated by the engine
export type PropertyKeyframes = [number, number, number, number, number, number, number, number]

export type ConditionKeyframes = {
  smallFollicleCount:    PropertyKeyframes
  dominantFollicleRadius:PropertyKeyframes // 0–1 normalized
  corpusLuteumRadius:    PropertyKeyframes // 0–1 normalized
  eggProgress:           PropertyKeyframes // -1=hidden, 0=in follicle, 1=released+moving
  endometriumThickness:  PropertyKeyframes // 0–1 normalized
  brainActivity:         PropertyKeyframes // 0–1
  fsh:                   PropertyKeyframes // 0–100 scale
  lh:                    PropertyKeyframes
  estrogen:              PropertyKeyframes
  progesterone:          PropertyKeyframes
}

export type Condition = {
  id: ConditionId
  label: string       // full name — canvas badge, context card
  shortLabel: string   // compact name — nav dropdown
  description: string
  keyframes: ConditionKeyframes
  primaryHormoneByStage: StagePrimaryHormones
  secondaryDim: number
  // How strongly follicles grow in response to FSH. Omitted = 1.0 (normal
  // responsiveness). Lower values model an ovary that receives a strong FSH
  // signal but cannot act on it — the FSH glow (driven by raw fshLevel) can
  // stay bright while follicle growth (driven by fshLevel * this factor)
  // stays suppressed.
  follicleFshResponse?: number
}
