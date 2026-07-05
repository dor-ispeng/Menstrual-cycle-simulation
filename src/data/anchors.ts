import { Anchor } from '@/types/simulation'

export const anchors: Anchor[] = [
  {
    id: 'cycle-end',
    title: 'Previous Cycle Ends',
    question: 'Why is bleeding happening?',
    t: 0,
  },
  {
    id: 'recruitment',
    title: 'Recruitment',
    question: 'Why are multiple follicles growing?',
    t: 0.14,
  },
  {
    id: 'competition',
    title: 'Competition',
    question: 'Why does one follicle usually win?',
    t: 0.28,
  },
  {
    id: 'dominant',
    title: 'Dominant Follicle',
    question: 'How does the ovary influence the brain?',
    t: 0.43,
  },
  {
    id: 'ovulation-decision',
    title: 'Ovulation Decision',
    question: 'What causes the egg to be released?',
    t: 0.57,
  },
  {
    id: 'after-release',
    title: 'After Release',
    question: 'What happens to the follicle after ovulation?',
    t: 0.67,
  },
  {
    id: 'preparation',
    title: 'Preparation',
    question: 'Why is the uterus still changing?',
    t: 0.82,
  },
  {
    id: 'continue-restart',
    title: 'Continue or Restart',
    question: 'How does the body decide whether to continue the cycle?',
    t: 1.0,
  },
]

export const anchorTs = anchors.map((a) => a.t)
