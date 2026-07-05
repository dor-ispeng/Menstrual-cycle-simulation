export type PcosCard = {
  anchorId: string
  normalProcess: string
  pcosChange: string
  keyResult: string
}

export const pcosCards: PcosCard[] = [
  {
    anchorId: 'cycle-end',
    normalProcess:
      'The corpus luteum breaks down, progesterone and estrogen fall, and menstruation begins. Rising FSH starts recruiting a new group of follicles.',
    pcosChange:
      'Many immature follicles from previous cycles remain in the ovary. FSH begins to rise, but these follicles respond poorly and continue producing excess androgens.',
    keyResult: 'The new cycle begins with many arrested follicles already present.',
  },
  {
    anchorId: 'recruitment',
    normalProcess:
      'A group of small follicles begins growing in response to FSH. Each follicle competes to become the dominant follicle.',
    pcosChange:
      'Follicles begin growing, but excess androgen production and reduced FSH responsiveness prevent one follicle from gaining a clear advantage.',
    keyResult: 'Multiple follicles grow together instead of one becoming dominant.',
  },
  {
    anchorId: 'competition',
    normalProcess:
      'One follicle becomes dominant and produces increasing amounts of estrogen while the remaining follicles stop growing.',
    pcosChange:
      'No follicle becomes fully dominant. Several follicles remain at similar sizes while estrogen production stays too low to continue normal progression.',
    keyResult: 'Dominant follicle selection fails.',
  },
  {
    anchorId: 'dominant',
    normalProcess:
      'The dominant follicle produces sustained high estrogen levels, signaling the brain to prepare the LH surge.',
    pcosChange:
      'Estrogen never reaches the sustained level required to switch the brain into positive feedback.',
    keyResult: 'The brain never prepares for ovulation.',
  },
  {
    anchorId: 'ovulation-decision',
    normalProcess:
      'A rapid LH surge causes the mature follicle to rupture and release its egg into the fallopian tube.',
    pcosChange:
      'Although baseline LH may already be elevated, the true LH surge never occurs. The follicle does not rupture and the egg remains trapped.',
    keyResult: 'Ovulation does not occur (anovulation).',
  },
  {
    anchorId: 'after-release',
    normalProcess:
      'After ovulation, the ruptured follicle transforms into the corpus luteum and begins producing progesterone.',
    pcosChange:
      'Because ovulation never occurred, no corpus luteum forms and progesterone remains low.',
    keyResult: 'The uterus does not receive normal progesterone support.',
  },
  {
    anchorId: 'preparation',
    normalProcess:
      'Progesterone maintains the uterine lining and prepares it for possible implantation.',
    pcosChange:
      'Without progesterone, the uterine lining receives unopposed estrogen stimulation while the arrested follicles continue contributing to hormonal imbalance.',
    keyResult: 'Hormonal imbalance continues throughout the cycle.',
  },
  {
    anchorId: 'continue-restart',
    normalProcess:
      'If pregnancy does not occur, the corpus luteum degenerates, hormone levels fall, menstruation begins, and a new cycle starts.',
    pcosChange:
      'Without ovulation there was no functional corpus luteum, so progesterone never rises and then falls normally. Menstruation becomes irregular, delayed, absent, or occasionally heavy after prolonged endometrial growth.',
    keyResult: 'The next cycle often begins with the same arrested follicles still present.',
  },
]
