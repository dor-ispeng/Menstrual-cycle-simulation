import { ConditionId } from '@/types/simulation'

export type ConditionCardEntry = {
  conditionChange: string
  keyResult: string
}

// Shared normal-cycle copy — identical regardless of which complication is
// being viewed, keyed by anchor id (not array position, which the old
// pcosCards array used and was fragile against reordering).
export const normalProcessByAnchor: Record<string, string> = {
  'cycle-end':
    'The corpus luteum breaks down, progesterone and estrogen fall, and menstruation begins. Rising FSH starts recruiting a new group of follicles.',
  'recruitment':
    'A group of small follicles begins growing in response to FSH. Each follicle competes to become the dominant follicle.',
  'competition':
    'One follicle becomes dominant and produces increasing amounts of estrogen while the remaining follicles stop growing.',
  'dominant':
    'The dominant follicle produces sustained high estrogen levels, signaling the brain to prepare the LH surge.',
  'ovulation-decision':
    'A rapid LH surge causes the mature follicle to rupture and release its egg into the fallopian tube.',
  'after-release':
    'After ovulation, the ruptured follicle transforms into the corpus luteum and begins producing progesterone.',
  'preparation':
    'Progesterone maintains the uterine lining and prepares it for possible implantation.',
  'continue-restart':
    'If pregnancy does not occur, the corpus luteum degenerates, hormone levels fall, menstruation begins, and a new cycle starts.',
}

// Condition-specific copy, keyed by condition then anchor id.
export const conditionCards: Partial<Record<ConditionId, Record<string, ConditionCardEntry>>> = {
  pcos: {
    'cycle-end': {
      conditionChange:
        'Many immature follicles from previous cycles remain in the ovary. FSH begins to rise, but these follicles respond poorly and continue producing excess androgens.',
      keyResult: 'The new cycle begins with many arrested follicles already present.',
    },
    'recruitment': {
      conditionChange:
        'Follicles begin growing, but excess androgen production and reduced FSH responsiveness prevent one follicle from gaining a clear advantage.',
      keyResult: 'Multiple follicles grow together instead of one becoming dominant.',
    },
    'competition': {
      conditionChange:
        'No follicle becomes fully dominant. Several follicles remain at similar sizes while estrogen production stays too low to continue normal progression.',
      keyResult: 'Dominant follicle selection fails.',
    },
    'dominant': {
      conditionChange:
        'Estrogen never reaches the sustained level required to switch the brain into positive feedback.',
      keyResult: 'The brain never prepares for ovulation.',
    },
    'ovulation-decision': {
      conditionChange:
        'Although baseline LH may already be elevated, the true LH surge never occurs. The follicle does not rupture and the egg remains trapped.',
      keyResult: 'Ovulation does not occur (anovulation).',
    },
    'after-release': {
      conditionChange:
        'Because ovulation never occurred, no corpus luteum forms and progesterone remains low.',
      keyResult: 'The uterus does not receive normal progesterone support.',
    },
    'preparation': {
      conditionChange:
        'Without progesterone, the uterine lining receives unopposed estrogen stimulation while the arrested follicles continue contributing to hormonal imbalance.',
      keyResult: 'Hormonal imbalance continues throughout the cycle.',
    },
    'continue-restart': {
      conditionChange:
        'Without ovulation there was no functional corpus luteum, so progesterone never rises and then falls normally. Menstruation becomes irregular, delayed, absent, or occasionally heavy after prolonged endometrial growth.',
      keyResult: 'The next cycle often begins with the same arrested follicles still present.',
    },
  },
  'functional-hypothalamic-amenorrhea': {
    'cycle-end': {
      conditionChange:
        'Hormone levels are low, often due to too little food, too much exercise, or high stress — so there is no withdrawal to trigger bleeding. The lining is thin and the ovary is quiet, though structurally normal.',
      keyResult: 'The cycle begins with reduced signaling from the brain.',
    },
    'recruitment': {
      conditionChange:
        'Reduced GnRH pulses mean the pituitary releases little FSH and even less LH. A few follicles begin growing, but the stimulation is insufficient.',
      keyResult: 'Follicles are present and capable, but under-stimulated.',
    },
    'competition': {
      conditionChange:
        'Without enough FSH, no follicle gains an advantage. The cohort stalls early at a small size rather than competing.',
      keyResult: 'Follicle development stops before selection can occur.',
    },
    'dominant': {
      conditionChange: 'No dominant follicle develops, so estrogen never rises above baseline.',
      keyResult: 'The brain receives no signal that a follicle is ready.',
    },
    'ovulation-decision': {
      conditionChange:
        'Estrogen never reaches the threshold needed to switch the hypothalamus into positive feedback, so no LH surge occurs.',
      keyResult: 'Ovulation does not occur.',
    },
    'after-release': {
      conditionChange:
        'Because no follicle ruptured, no corpus luteum forms and progesterone stays at baseline.',
      keyResult: 'The uterus receives no progesterone support.',
    },
    'preparation': {
      conditionChange:
        'With neither sustained estrogen nor progesterone, the lining stays thin and never becomes secretory.',
      keyResult: 'The uterus is not prepared for implantation.',
    },
    'continue-restart': {
      conditionChange:
        'There is no thickened lining to shed and no progesterone to withdraw, so menstruation is delayed or absent. The ovaries remain capable — signaling can recover if the underlying strain resolves.',
      keyResult: 'Cycles stay suppressed until hypothalamic signaling is restored.',
    },
  },
  'primary-ovarian-insufficiency': {
    'cycle-end': {
      conditionChange:
        'Few follicles remain in the ovary, and FSH is already elevated as the brain pushes for a response. POI is defined by the ovary losing normal function before age 40, so bleeding may be irregular or absent, and the lining is thin.',
      keyResult: 'The cycle begins with a diminished ovarian reserve.',
    },
    'recruitment': {
      conditionChange:
        'FSH is high, but only a small number of follicles are available to respond, and those respond weakly.',
      keyResult: 'High stimulation reaches very few follicles.',
    },
    'competition': {
      conditionChange:
        'With so few follicles growing, no meaningful competition occurs and none gains a clear lead.',
      keyResult: 'There is no cohort from which to select.',
    },
    'dominant': {
      conditionChange:
        'No dominant follicle develops, so estrogen stays low despite persistently high FSH.',
      keyResult: 'The brain signals harder, but the ovary cannot respond.',
    },
    'ovulation-decision': {
      conditionChange:
        'Estrogen never reaches the level needed to trigger positive feedback, so no LH surge occurs.',
      keyResult: 'Ovulation does not occur in this cycle.',
    },
    'after-release': {
      conditionChange:
        'With no rupture, no corpus luteum forms and progesterone stays at baseline.',
      keyResult: 'The uterus receives no progesterone support.',
    },
    'preparation': {
      conditionChange:
        'Low estrogen and absent progesterone leave the lining thin and unprepared.',
      keyResult: 'The uterus is not prepared for implantation.',
    },
    'continue-restart': {
      conditionChange:
        'There is little lining to shed, so bleeding is irregular or absent. Ovarian function in POI can fluctuate — some cycles may differ, and occasional ovulation is possible.',
      keyResult: 'The next cycle begins with the same reduced reserve.',
    },
  },
}
