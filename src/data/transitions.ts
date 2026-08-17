import { ConditionId, Transition } from '@/types/simulation'

// Normal-cycle transitions. Kept as the original array so existing index
// math (findIndex/positional lookups) is unchanged.
export const transitions: Transition[] = [
  {
    fromAnchorId: 'cycle-end',
    toAnchorId: 'recruitment',
    explanation:
      'As progesterone and estrogen fall, the pituitary is no longer suppressed. FSH rises and reaches a new cohort of follicles, signaling them to begin growing.',
    brainEvents: ['FSH rising from pituitary', 'GnRH pulses increasing'],
    beats: [
      'Progesterone and estrogen are falling.',
      'The pituitary is released from suppression.',
      'FSH rises — a new follicle cohort is recruited.',
    ],
    guidedDuration: 10,
  },
  {
    fromAnchorId: 'recruitment',
    toAnchorId: 'competition',
    explanation:
      'All recruited follicles produce estrogen, which gradually suppresses FSH. Only follicles that have become sensitive enough to survive on lower FSH levels continue growing. The others begin to regress.',
    brainEvents: ['FSH being suppressed by rising estrogen'],
    beats: [
      'Each follicle produces estrogen as it grows.',
      'Rising estrogen begins suppressing FSH.',
      'Only the most FSH-sensitive follicles survive.',
    ],
    guidedDuration: 10,
  },
  {
    fromAnchorId: 'competition',
    toAnchorId: 'dominant',
    explanation:
      'One follicle has outpaced the others. It produces enough estrogen to suppress FSH entirely, starving the remaining follicles. The dominant follicle becomes the primary source of estrogen for the cycle.',
    brainEvents: ['Estrogen feedback to hypothalamus and pituitary', 'FSH declining'],
    beats: [
      'One follicle pulls decisively ahead.',
      'Its estrogen output starves the competition.',
      'The dominant follicle is now the cycle\'s engine.',
    ],
    guidedDuration: 10,
  },
  {
    fromAnchorId: 'dominant',
    toAnchorId: 'ovulation-decision',
    explanation:
      'As the dominant follicle grows, estrogen rises above a threshold and sustains that level. This switches the pituitary from negative to positive feedback — triggering a sudden, dramatic LH surge.',
    brainEvents: ['Positive feedback switch', 'LH surge forming'],
    beats: [
      'Estrogen sustains above the ovulation threshold.',
      'The hypothalamus switches to positive feedback.',
      'A dramatic LH surge is triggered.',
    ],
    guidedDuration: 10,
  },
  {
    fromAnchorId: 'ovulation-decision',
    toAnchorId: 'after-release',
    explanation:
      'The LH surge triggers enzymes that weaken the follicle wall. The follicle ruptures, releasing the egg into the fallopian tube. The collapsed follicle immediately begins transforming into the corpus luteum.',
    brainEvents: ['LH surge completing', 'LH levels declining'],
    beats: [
      'The LH surge activates enzymes in the follicle wall.',
      'The follicle ruptures — the egg is released.',
      'The egg begins its journey through the fallopian tube.',
      'The empty follicle starts becoming the corpus luteum.',
    ],
    guidedDuration: 14,
  },
  {
    fromAnchorId: 'after-release',
    toAnchorId: 'preparation',
    explanation:
      'The corpus luteum secretes progesterone, which transforms the uterine lining into a secretory state — rich with nutrients and blood vessels. Progesterone also suppresses new follicular development.',
    brainEvents: ['Progesterone feedback suppressing GnRH', 'FSH and LH remaining low'],
    beats: [
      'The corpus luteum secretes progesterone.',
      'Progesterone converts the lining to a secretory state.',
      'The uterus becomes receptive to implantation.',
    ],
    guidedDuration: 10,
  },
  {
    fromAnchorId: 'preparation',
    toAnchorId: 'continue-restart',
    explanation:
      'Without pregnancy, the corpus luteum loses hormonal support and degenerates. Progesterone and estrogen fall. The pituitary begins increasing FSH again, and the uterine lining begins to break down.',
    brainEvents: ['FSH beginning to rise again', 'Progesterone withdrawal'],
    beats: [
      'Without pregnancy, the corpus luteum degenerates.',
      'Progesterone and estrogen fall sharply.',
      'FSH begins rising — preparing for a new cycle.',
    ],
    guidedDuration: 10,
  },
]

// PCOS transitions — same fromAnchorId/toAnchorId pairs, in the same order, so
// HormoneGraph's positional lookups (findIndex, index arithmetic) work
// unchanged regardless of which set is active.
export const pcosTransitions: Transition[] = [
  {
    fromAnchorId: 'cycle-end',
    toAnchorId: 'recruitment',
    explanation:
      'Progesterone was never high, so there is no true withdrawal. FSH rises into an ovary that still holds arrested follicles from previous cycles, and a new cohort begins growing alongside them.',
    brainEvents: ['FSH rising from pituitary', 'LH already elevated at baseline'],
    beats: [
      'Progesterone was never high, so there is no true withdrawal.',
      'FSH rises into an ovary that still holds arrested follicles.',
      'A new cohort begins growing alongside the old ones.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'recruitment',
    toAnchorId: 'competition',
    explanation:
      'Many follicles grow, but none pulls ahead. Excess androgen production blunts each follicle\'s response to FSH, and estrogen stays too low to reshape the cohort.',
    brainEvents: ['FSH only weakly suppressed', 'LH remains elevated'],
    beats: [
      'Many follicles grow, but none pulls ahead.',
      'Excess androgen blunts each follicle\'s response to FSH.',
      'Estrogen stays too low to reshape the cohort.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'competition',
    toAnchorId: 'dominant',
    explanation:
      'No single follicle outpaces the others. The cohort arrests at a similar, small size, and dominant-follicle selection fails.',
    brainEvents: ['Estrogen feedback remains weak', 'LH to FSH ratio stays high'],
    beats: [
      'No single follicle outpaces the others.',
      'The cohort arrests at a similar, small size.',
      'Selection fails — there is no dominant follicle.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'dominant',
    toAnchorId: 'ovulation-decision',
    explanation:
      'Estrogen never sustains above the ovulation threshold. The hypothalamus stays in negative feedback, and no LH surge is triggered.',
    brainEvents: ['Positive feedback switch never occurs', 'LH stays elevated but flat'],
    beats: [
      'Estrogen never sustains above the ovulation threshold.',
      'The hypothalamus stays in negative feedback.',
      'No LH surge is triggered.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'ovulation-decision',
    toAnchorId: 'after-release',
    explanation:
      'Without a surge, the follicle wall is never weakened. No follicle ruptures and no egg is released — the arrested follicles remain in the ovary, and no corpus luteum forms.',
    brainEvents: ['No LH surge', 'Progesterone stays low'],
    beats: [
      'Without a surge, the follicle wall is never weakened.',
      'No follicle ruptures and no egg is released.',
      'The arrested follicles remain in the ovary.',
      'No corpus luteum forms.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'after-release',
    toAnchorId: 'preparation',
    explanation:
      'With no corpus luteum, progesterone stays low. The lining continues thickening under unopposed estrogen but never becomes secretory.',
    brainEvents: ['No progesterone feedback', 'GnRH pulses remain rapid'],
    beats: [
      'With no corpus luteum, progesterone stays low.',
      'The lining continues under unopposed estrogen.',
      'It thickens but never becomes secretory.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'preparation',
    toAnchorId: 'continue-restart',
    explanation:
      'There is no progesterone to withdraw. Bleeding becomes irregular, delayed, or absent, and the next cycle often begins with the same arrested follicles still present.',
    brainEvents: ['FSH rising again', 'No progesterone withdrawal'],
    beats: [
      'There is no progesterone to withdraw.',
      'Bleeding becomes irregular, delayed, or absent.',
      'The next cycle begins with the same arrested follicles.',
    ],
    guidedDuration: 8,
  },
]

// FHA transitions — same fromAnchorId/toAnchorId pairs and order as above.
export const fhaTransitions: Transition[] = [
  {
    fromAnchorId: 'cycle-end',
    toAnchorId: 'recruitment',
    explanation:
      'Hormone levels were already low, so there is no true withdrawal. GnRH pulses from the hypothalamus stay slow and infrequent, and FSH rises only slightly — too little to drive a cohort of follicles.',
    brainEvents: ['GnRH pulse frequency reduced', 'FSH rising only weakly'],
    beats: [
      'Hormone levels were already low, so there is no withdrawal.',
      'GnRH pulses from the hypothalamus stay slow and infrequent.',
      'FSH rises only slightly — too little to drive a cohort.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'recruitment',
    toAnchorId: 'competition',
    explanation:
      'A few follicles begin growing on minimal FSH, but stimulation is too weak to sustain their development, and growth slows almost as soon as it begins.',
    brainEvents: ['Pituitary output remains low', 'LH stays below FSH'],
    beats: [
      'A few follicles begin growing on minimal FSH.',
      'Stimulation is too weak to sustain their development.',
      'Growth slows almost as soon as it begins.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'competition',
    toAnchorId: 'dominant',
    explanation:
      'With so little FSH, no follicle gains an advantage. The cohort stalls at a small size, and no follicle is selected to lead the cycle.',
    brainEvents: ['Estrogen feedback remains minimal', 'No rise in gonadotropins'],
    beats: [
      'With so little FSH, no follicle gains an advantage.',
      'The cohort stalls at a small size.',
      'No follicle is selected to lead the cycle.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'dominant',
    toAnchorId: 'ovulation-decision',
    explanation:
      'Estrogen never rises above baseline, so the hypothalamus receives no signal to switch feedback. The conditions for an LH surge are never met.',
    brainEvents: ['No positive feedback switch', 'LH remains flat and low'],
    beats: [
      'Estrogen never rises above baseline.',
      'The hypothalamus receives no signal to switch feedback.',
      'The conditions for an LH surge are never met.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'ovulation-decision',
    toAnchorId: 'after-release',
    explanation:
      'No LH surge arrives to weaken the follicle wall. No follicle ruptures and no egg is released — the follicles simply remain where they are, and no corpus luteum forms.',
    brainEvents: ['No LH surge', 'Progesterone stays at baseline'],
    beats: [
      'No LH surge arrives to weaken the follicle wall.',
      'No follicle ruptures and no egg is released.',
      'The follicles simply remain where they are.',
      'No corpus luteum forms.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'after-release',
    toAnchorId: 'preparation',
    explanation:
      'Without a corpus luteum, progesterone never rises. The lining receives neither estrogen nor progesterone support, and stays thin and underdeveloped.',
    brainEvents: ['No progesterone feedback', 'Gonadotropins remain suppressed'],
    beats: [
      'Without a corpus luteum, progesterone never rises.',
      'The lining receives neither estrogen nor progesterone support.',
      'It stays thin and underdeveloped.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'preparation',
    toAnchorId: 'continue-restart',
    explanation:
      'There is no thickened lining to shed. Menstruation is delayed or absent, and the cycle stays suppressed until signaling is restored.',
    brainEvents: ['Hypothalamic signaling still reduced', 'No progesterone withdrawal'],
    beats: [
      'There is no thickened lining to shed.',
      'Menstruation is delayed or absent.',
      'The cycle stays suppressed until signaling is restored.',
    ],
    guidedDuration: 8,
  },
]

// POI transitions — same fromAnchorId/toAnchorId pairs and order as above.
export const poiTransitions: Transition[] = [
  {
    fromAnchorId: 'cycle-end',
    toAnchorId: 'recruitment',
    explanation:
      'FSH is already high before the cycle even begins. The pituitary pushes harder against a depleted ovary, but only a few follicles remain to respond.',
    brainEvents: ['FSH elevated at baseline', 'LH also raised'],
    beats: [
      'FSH is already high before the cycle even begins.',
      'The pituitary pushes harder against a depleted ovary.',
      'Only a few follicles remain to respond.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'recruitment',
    toAnchorId: 'competition',
    explanation:
      'High FSH reaches only a small number of follicles, and those few respond weakly, if at all — there is no cohort large enough to compete.',
    brainEvents: ['FSH remains elevated', 'Little estrogen returning to the brain'],
    beats: [
      'High FSH reaches only a small number of follicles.',
      'Those few respond weakly, if at all.',
      'There is no cohort large enough to compete.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'competition',
    toAnchorId: 'dominant',
    explanation:
      'With so few follicles, no real competition takes place. None grows enough to pull ahead, and selection ends before it begins.',
    brainEvents: ['Estrogen feedback stays weak', 'FSH stays high in response'],
    beats: [
      'With so few follicles, no real competition takes place.',
      'None grows enough to pull ahead.',
      'Selection ends before it begins.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'dominant',
    toAnchorId: 'ovulation-decision',
    explanation:
      'No follicle matures, so estrogen stays low. The brain keeps raising FSH, but the ovary cannot answer, and the threshold for an LH surge is never reached.',
    brainEvents: ['No positive feedback switch', 'Gonadotropins remain elevated'],
    beats: [
      'No follicle matures, so estrogen stays low.',
      'The brain keeps raising FSH, but the ovary cannot answer.',
      'The threshold for an LH surge is never reached.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'ovulation-decision',
    toAnchorId: 'after-release',
    explanation:
      'No LH surge occurs, and no follicle is ready to rupture. No egg is released and no corpus luteum forms — FSH stays high throughout.',
    brainEvents: ['No LH surge', 'Progesterone stays at baseline'],
    beats: [
      'No LH surge occurs, and no follicle is ready to rupture.',
      'No egg is released.',
      'No corpus luteum forms.',
      'FSH stays high throughout.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'after-release',
    toAnchorId: 'preparation',
    explanation:
      'Without a corpus luteum, progesterone never rises. Low estrogen leaves the lining thin, and the uterus is never prepared.',
    brainEvents: ['No progesterone feedback', 'FSH still elevated'],
    beats: [
      'Without a corpus luteum, progesterone never rises.',
      'Low estrogen leaves the lining thin.',
      'The uterus is never prepared.',
    ],
    guidedDuration: 8,
  },
  {
    fromAnchorId: 'preparation',
    toAnchorId: 'continue-restart',
    explanation:
      'There is little lining to shed, so bleeding is irregular or absent. The next cycle begins with the same depleted reserve, though ovarian function can fluctuate.',
    brainEvents: ['FSH remains elevated', 'No progesterone withdrawal'],
    beats: [
      'There is little lining to shed, so bleeding is irregular or absent.',
      'The next cycle begins with the same depleted reserve.',
      'Ovarian function can fluctuate — some cycles differ.',
    ],
    guidedDuration: 8,
  },
]

// Exhaustive map — a condition added without a transitions entry is a
// compile error here rather than silently falling back to normal-cycle
// narration.
const TRANSITIONS_BY_CONDITION: Record<ConditionId, Transition[]> = {
  normal: transitions,
  pcos: pcosTransitions,
  'functional-hypothalamic-amenorrhea': fhaTransitions,
  'primary-ovarian-insufficiency': poiTransitions,
}

export function getTransitions(condition: ConditionId): Transition[] {
  return TRANSITIONS_BY_CONDITION[condition]
}
