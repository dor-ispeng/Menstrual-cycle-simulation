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
    guidedDuration: 7,
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
    guidedDuration: 7,
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
    guidedDuration: 7,
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
    guidedDuration: 7,
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
    guidedDuration: 7,
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
    guidedDuration: 7,
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
    guidedDuration: 7,
  },
]

export function getTransitions(condition: ConditionId): Transition[] {
  return condition === 'pcos' ? pcosTransitions : transitions
}
