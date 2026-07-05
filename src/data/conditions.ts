import { Condition } from '@/types/simulation'

//
// Keyframe values are indexed 0–7, one per anchor:
// [cycle-end, recruitment, competition, dominant, ovulation-decision, after-release, preparation, continue-restart]
//

export const normalCondition: Condition = {
  id: 'normal',
  label: 'Normal',
  description: 'Typical menstrual physiology with normal hormonal signaling and ovulation.',
  keyframes: {
    smallFollicleCount:     [5, 8, 4, 1, 0, 0, 0, 3],
    dominantFollicleRadius: [0.30, 0.42, 0.58, 0.85, 1.0, 0, 0, 0],
    corpusLuteumRadius:     [0, 0, 0,   0,    0,   0.7, 1.0, 0.25],
    eggProgress:            [-1, -1, -1, -1, 0, 0.20, 0.70, 1.0],
    //                        shed  thinnest  grow  thick  maxProlif  secTrans  secretory  destab
    endometriumThickness:   [0.15, 0.0,      0.23, 0.37,  0.49,      0.50,     0.54,      0.43],
    brainActivity:          [0.4, 0.8, 0.6, 0.5,  0.95, 0.3,  0.4,  0.35],
    fsh:                    [25, 65, 40, 25, 28, 12, 12, 28],
    lh:                     [10, 15, 18, 22, 95, 28, 14, 10],
    estrogen:               [18, 32, 55, 82, 68, 42, 62, 14],
    progesterone:           [10, 10, 10, 12, 14, 22, 80, 12],
  },
}

export const pcosCondition: Condition = {
  id: 'pcos',
  label: 'PCOS',
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
}

export const conditions: Condition[] = [normalCondition, pcosCondition]
