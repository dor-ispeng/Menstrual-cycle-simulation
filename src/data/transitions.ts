import { Transition } from '@/types/simulation'

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
