import { Condition } from '@/types/simulation'

//
// Keyframe values are indexed 0–7, one per anchor:
// [cycle-end, recruitment, competition, dominant, ovulation-decision, after-release, preparation, continue-restart]
//

export const normalCondition: Condition = {
  id: 'normal',
  label: 'Normal',
  shortLabel: 'Normal',
  description: 'Typical menstrual physiology with normal hormonal signaling and ovulation.',
  keyframes: {
    smallFollicleCount:     [5, 8, 4, 1, 0, 0, 0, 3],
    dominantFollicleRadius: [0.30, 0.42, 0.58, 0.85, 1.0, 0, 0, 0],
    corpusLuteumRadius:     [0, 0, 0,   0,    0,   0.7, 1.0, 0.25],
    eggProgress:            [-1, -1, -1, -1, 0, 0.20, 0.70, 1.0],
    //                        shed  thinnest  grow  thick  maxProlif  secTrans  secretory  destab
    endometriumThickness:   [0.15, 0.0,      0.25, 0.42,  0.58,      0.75,     0.8,       0.50],
    brainActivity:          [0.4, 0.8, 0.6, 0.5,  0.95, 0.3,  0.4,  0.35],
    fsh:                    [25, 65, 40, 25, 28, 12, 12, 28],
    lh:                     [10, 15, 18, 22, 95, 28, 14, 10],
    estrogen:               [18, 32, 55, 82, 68, 42, 62, 14],
    progesterone:           [10, 10, 10, 12, 14, 22, 80, 12],
  },
  // One entry per transition — which hormone is visually emphasized as the
  // "driver" of that stage. Non-primary hormones dim to secondaryDim.
  primaryHormoneByStage: ['progesterone', 'fsh', 'estrogen', 'estrogen', 'lh', 'progesterone', 'progesterone'],
  secondaryDim: 0.20,
}

export const pcosCondition: Condition = {
  id: 'pcos',
  label: 'PCOS',
  shortLabel: 'PCOS',
  description:
    'One common PCOS pattern: elevated LH, arrested follicular development, and absent ovulation. PCOS is heterogeneous — this is a simplified representation.',
  keyframes: {
    // Many small follicles throughout; no dominant follicle selected
    smallFollicleCount:     [5, 9, 12, 12, 12, 11, 10, 9],
    dominantFollicleRadius: [0, 0, 0,  0,  0,  0,  0,  0],
    corpusLuteumRadius:     [0, 0, 0,  0,  0,  0,  0,  0],
    eggProgress:            [-1, -1, -1, -1, -1, -1, -1, -1],
    // Endometrium thickens due to unopposed estrogen but no secretory transformation
    endometriumThickness:   [0.1, 0.3, 0.5, 0.62, 0.65, 0.65, 0.68, 0.55],
    brainActivity:          [0.3, 0.5, 0.4, 0.35, 0.35, 0.3,  0.3,  0.3],
    // Elevated LH:FSH ratio; no midcycle LH surge
    fsh:                    [22, 42, 30, 24, 24, 12, 12, 22],
    lh:                     [35, 48, 50, 52, 50, 45, 40, 38],
    estrogen:               [18, 28, 42, 48, 46, 35, 42, 20],
    progesterone:           [10, 10, 10, 11, 11, 11, 14, 10],
  },
  // No LH surge occurs in PCOS, so LH must never be spotlit as the driver of
  // ovulation — FSH/estrogen carry emphasis throughout instead. LH stays
  // visible (it's genuinely elevated) but at a less dimmed baseline than
  // normal's non-primary hormones, so "elevated but flat" reads clearly.
  primaryHormoneByStage: ['fsh', 'fsh', 'estrogen', 'estrogen', 'estrogen', 'estrogen', 'fsh'],
  secondaryDim: 0.45,
}

export const functionalHypothalamicAmenorrheaCondition: Condition = {
  id: 'functional-hypothalamic-amenorrhea',
  label: 'Functional Hypothalamic Amenorrhea',
  shortLabel: 'FHA',
  description:
    'Reduced hypothalamic signaling from energy deficit, stress, or high training load. ' +
    'The ovaries remain structurally capable — the interruption begins in the brain. ' +
    'Signaling can recover when the underlying strain resolves.',
  keyframes: {
    // Reserve is intact — a normal-ish cohort is present but never stimulated
    // enough to grow, compete, or resolve into one follicle. Deliberately sits
    // between normal (drops to 0 as one wins) and PCOS (climbs to 12 arrested).
    smallFollicleCount:     [5, 7, 7, 6, 6, 5, 5, 5],
    // "Tried and stalled": a candidate enlarges slightly, then regresses.
    // AnatomyLayer floors this at BASE_R (structR = max(18, r * 72)), so any
    // value below ~0.25 is visually identical to 0. The 0.30 peak is chosen
    // to be just visible (~21.6px vs 18px baseline) without ever reading as a
    // real dominant follicle — antral morphology needs > 0.63.
    dominantFollicleRadius: [0, 0.26, 0.30, 0.24, 0.16, 0.08, 0, 0],
    corpusLuteumRadius:     [0, 0, 0, 0, 0, 0, 0, 0],
    eggProgress:            [-1, -1, -1, -1, -1, -1, -1, -1],
    // Thin and flat — amenorrhea, so it never builds and never sheds. Stays
    // visibly present rather than disappearing.
    endometriumThickness:   [0.12, 0.12, 0.13, 0.15, 0.16, 0.16, 0.15, 0.13],
    brainActivity:          [0.20, 0.25, 0.22, 0.20, 0.18, 0.16, 0.16, 0.18],
    // Low-normal FSH with a weak, insufficient rise at recruitment.
    fsh:                    [14, 22, 19, 16, 15, 13, 13, 14],
    // LH low and flat, sitting BELOW FSH — the ratio inversion that
    // distinguishes this from PCOS's elevated LH. No surge at any point.
    lh:                     [8, 9, 9, 8, 8, 7, 7, 8],
    estrogen:               [12, 16, 19, 20, 18, 15, 14, 12],
    // Capped below the secretory-tint threshold (raw > 24 required), so the
    // endometrium correctly never becomes secretory, with no extra code.
    progesterone:           [9, 9, 9, 9, 9, 9, 10, 9],
  },
  // Keeps the eye on the brain→ovary channel, since the teaching point is
  // that the failure originates upstream of the ovary.
  primaryHormoneByStage: ['fsh', 'fsh', 'fsh', 'estrogen', 'estrogen', 'fsh', 'fsh'],
  secondaryDim: 0.45,
}

export const primaryOvarianInsufficiencyCondition: Condition = {
  id: 'primary-ovarian-insufficiency',
  label: 'Primary Ovarian Insufficiency',
  shortLabel: 'POI',
  description:
    'Reduced ovarian reserve with elevated FSH — the brain signals strongly but ' +
    'few follicles remain to respond. Unlike menopause, ovarian function in POI ' +
    'can fluctuate, and occasional ovulation is possible.',
  // The ovary receives a loud FSH signal but cannot act on it. This keeps the
  // FSH glow bright while the follicles stay small — the core POI visual.
  follicleFshResponse: 0.25,
  keyframes: {
    // Diminished reserve — the deliberate contrast against the other three.
    // normal drops to 0 as one wins; PCOS climbs to 12 arrested; FHA holds a
    // normal-ish 5-7 that stall. POI simply has very few follicles at all.
    smallFollicleCount:     [2, 3, 3, 2, 2, 2, 2, 2],
    // Flat zero — unlike FHA there is no candidate that even attempts to grow.
    // This also guarantees the LH activation ring can never fire, since that
    // gate requires dominantFollicleRadius > 0.12.
    dominantFollicleRadius: [0, 0, 0, 0, 0, 0, 0, 0],
    corpusLuteumRadius:     [0, 0, 0, 0, 0, 0, 0, 0],
    eggProgress:            [-1, -1, -1, -1, -1, -1, -1, -1],
    // Thin from low estrogen, but with a small drop at cycle-end suggesting
    // irregular unpredictable bleeding — distinct from FHA's flat amenorrhea.
    endometriumThickness:   [0.18, 0.10, 0.13, 0.16, 0.18, 0.18, 0.17, 0.15],
    brainActivity:          [0.70, 0.80, 0.75, 0.70, 0.68, 0.65, 0.65, 0.70],
    // ELEVATED throughout — the signature of POI, and the reason the
    // normalization retune was a prerequisite. Peaks at 0.88 on the new
    // absolute scale, above normal's 0.65 peak, so it renders genuinely
    // brighter than normal rather than clamping.
    fsh:                    [78, 88, 85, 82, 80, 78, 76, 78],
    // Also elevated, but BELOW FSH. Contrast the ratios across conditions:
    // POI FSH > LH (both high) · PCOS LH > FSH · FHA both low, FSH > LH.
    lh:                     [45, 52, 50, 48, 47, 45, 44, 45],
    estrogen:               [14, 16, 18, 18, 17, 15, 14, 13],
    // Below the secretory-tint threshold, so no secretory transformation.
    progesterone:           [9, 9, 9, 9, 9, 9, 10, 9],
  },
  // FSH carries emphasis almost throughout — a relentlessly loud signal that
  // never produces a result is the entire teaching point.
  primaryHormoneByStage: ['fsh', 'fsh', 'fsh', 'estrogen', 'fsh', 'fsh', 'fsh'],
  secondaryDim: 0.45,
}

export const conditions: Condition[] = [
  normalCondition,
  pcosCondition,
  functionalHypothalamicAmenorrheaCondition,
  primaryOvarianInsufficiencyCondition,
]
