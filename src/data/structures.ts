import { Structure } from '@/types/simulation'

export const structures: Structure[] = [

  // ── Brain ──────────────────────────────────────────────────────────────────
  {
    id: 'brain',
    name: 'Brain and Pituitary',
    shortDescription: 'The hypothalamus and pituitary gland coordinate hormone release to drive the menstrual cycle.',
    zoomRequired: false,
    svgX: 700, svgY: 70, svgRadius: 60,
    contextContent: {
      'cycle-end': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Progesterone and estrogen are falling as the corpus luteum degenerates.',
        whyItMatters: 'This allows FSH production to begin rising again.',
      },
      'recruitment': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'GnRH stimulates the pituitary to release FSH.',
        whyItMatters: 'FSH recruits a new group of follicles.',
      },
      'competition': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'The brain is receiving increasing estrogen feedback from the ovary.',
        whyItMatters: 'This feedback helps regulate follicle selection.',
      },
      'dominant': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Sustained estrogen from the dominant follicle continues signaling to the brain.',
        whyItMatters: 'The system is approaching the conditions needed for the LH surge.',
      },
      'ovulation-decision': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Sustained high estrogen has switched feedback from negative to positive. The pituitary releases a surge of LH.',
        whyItMatters: 'The LH surge directly triggers ovulation.',
      },
      'after-release': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Progesterone from the corpus luteum is beginning to influence the brain.',
        whyItMatters: 'The body is transitioning into the luteal phase.',
      },
      'preparation': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Progesterone suppresses GnRH, FSH, and LH release.',
        whyItMatters: 'This prevents recruitment of new follicles during the luteal phase.',
      },
      'continue-restart': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Falling progesterone removes suppression of FSH production.',
        whyItMatters: 'The next cycle can begin.',
      },
    },
  },

  // ── Ovary ──────────────────────────────────────────────────────────────────
  {
    id: 'ovary',
    name: 'Ovary',
    shortDescription: 'Contains follicles that develop and produce hormones during the cycle.',
    zoomRequired: false,
    svgX: 540, svgY: 500, svgRadius: 110,
    contextContent: {
      'cycle-end': {
        title: 'Ovary',
        whatIsHappening: 'Hormone levels are low and a new cycle is beginning.',
        whyItMatters: 'The ovary contains both the eggs and the structures that produce reproductive hormones.',
      },
      'recruitment': {
        title: 'Ovary',
        whatIsHappening: 'Several follicles are beginning to grow in response to rising FSH.',
        whyItMatters: 'This is the start of follicle selection and increasing estrogen production.',
      },
      'competition': {
        title: 'Ovary',
        whatIsHappening: 'Several follicles are competing while one begins gaining an advantage.',
        whyItMatters: 'The ovary is selecting the follicle most likely to ovulate.',
      },
      'dominant': {
        title: 'Ovary',
        whatIsHappening: 'One follicle has become dominant and is producing most of the ovary\'s estrogen.',
        whyItMatters: 'The ovary is preparing for ovulation.',
      },
      'ovulation-decision': {
        title: 'Ovary',
        whatIsHappening: 'The mature follicle is responding to the LH surge and preparing for rupture.',
        whyItMatters: 'Ovulation will release the egg from the ovary.',
      },
      'after-release': {
        title: 'Ovary',
        whatIsHappening: 'The egg has been released and the follicle is transforming into the corpus luteum.',
        whyItMatters: 'The ovary is shifting toward progesterone production.',
      },
      'preparation': {
        title: 'Ovary',
        whatIsHappening: 'The corpus luteum is actively producing progesterone and estrogen.',
        whyItMatters: 'These hormones prepare the uterus for possible implantation.',
      },
      'continue-restart': {
        title: 'Ovary',
        whatIsHappening: 'The corpus luteum is degenerating because pregnancy has not occurred.',
        whyItMatters: 'Hormone levels will fall and the next cycle will begin.',
      },
    },
  },

  // ── Follicle ───────────────────────────────────────────────────────────────
  {
    id: 'follicle',
    name: 'Follicle',
    shortDescription: 'A fluid-filled sac in the ovary that contains a developing egg.',
    zoomRequired: false,
    svgX: 540, svgY: 470, svgRadius: 40,
    contextContent: {
      'cycle-end': {
        title: 'Small Follicles',
        whatIsHappening: 'These small follicles each contain an immature egg. Many are present in the ovary, but only some will begin growing during the new cycle.',
        whyItMatters: 'These follicles form the pool of candidates from which ovulation will eventually occur.',
      },
      'recruitment': {
        title: 'Small Follicles',
        whatIsHappening: 'FSH is stimulating a group of follicles to begin growing. Several follicles are becoming hormonally active.',
        whyItMatters: 'This marks the beginning of follicle selection.',
      },
      'competition': {
        title: 'Dominant Follicle Candidate',
        whatIsHappening: 'One follicle is beginning to grow faster than the others and is producing increasing amounts of estrogen.',
        whyItMatters: 'This follicle is becoming the leading candidate for ovulation.',
      },
      'dominant': {
        title: 'Dominant Follicle',
        whatIsHappening: 'One follicle has become dominant and now produces most of the ovary\'s estrogen.',
        whyItMatters: 'Its estrogen production helps trigger the hormonal events leading to ovulation.',
      },
      'ovulation-decision': {
        title: 'Mature Follicle',
        whatIsHappening: 'The dominant follicle is responding to the LH surge and preparing to rupture.',
        whyItMatters: 'Ovulation cannot occur until the follicle releases its egg.',
      },
    },
  },

  // ── Granulosa Cells ────────────────────────────────────────────────────────
  {
    id: 'granulosa-cells',
    name: 'Granulosa Cells',
    shortDescription: 'Cells lining the follicle that produce estrogen and respond to FSH.',
    zoomRequired: true,
    svgX: 540, svgY: 480, svgRadius: 20,
    contextContent: {
      'recruitment': {
        title: 'Granulosa Cells',
        whatIsHappening: 'These cells surround the egg and respond strongly to FSH.',
        whyItMatters: 'They help support follicle growth and begin producing estrogen.',
      },
      'competition': {
        title: 'Granulosa Cells',
        whatIsHappening: 'Granulosa cells are multiplying and converting theca-cell androgens into estrogen.',
        whyItMatters: 'Their estrogen production helps drive follicle development.',
      },
      'dominant': {
        title: 'Granulosa Cells',
        whatIsHappening: 'The dominant follicle contains many granulosa cells producing large amounts of estrogen.',
        whyItMatters: 'They are responsible for much of the estrogen that triggers the ovulatory sequence.',
      },
      'ovulation-decision': {
        title: 'Granulosa Cells',
        whatIsHappening: 'The granulosa cells are responding to the LH surge and helping prepare the follicle for ovulation.',
        whyItMatters: 'They play a major role in the final maturation process.',
      },
    },
  },

  // ── Egg ───────────────────────────────────────────────────────────────────
  {
    id: 'egg',
    name: 'Egg (Oocyte)',
    shortDescription: 'The female reproductive cell, released from the follicle at ovulation.',
    zoomRequired: false,
    svgX: 590, svgY: 420, svgRadius: 18,
    contextContent: {
      'recruitment': {
        title: 'Egg',
        whatIsHappening: 'Each growing follicle contains an immature egg.',
        whyItMatters: 'Usually only one egg will continue toward ovulation.',
      },
      'competition': {
        title: 'Egg',
        whatIsHappening: 'The egg remains protected and supported by surrounding follicle cells.',
        whyItMatters: 'The follicle prepares the egg for eventual release.',
      },
      'ovulation-decision': {
        title: 'Egg',
        whatIsHappening: 'The egg is completing its preparation for ovulation.',
        whyItMatters: 'The LH surge helps trigger the events that will release it.',
      },
      'after-release': {
        title: 'Released Egg',
        whatIsHappening: 'The egg has left the ovary and is being guided toward the fallopian tube.',
        whyItMatters: 'This is the egg\'s opportunity to encounter sperm.',
      },
      'preparation': {
        title: 'Egg in the Fallopian Tube',
        whatIsHappening: 'The egg is being transported through the fallopian tube.',
        whyItMatters: 'Fertilization usually occurs during this journey.',
      },
      'continue-restart': {
        title: 'Egg',
        whatIsHappening: 'If fertilization does not occur, the egg will degenerate.',
        whyItMatters: 'The cycle will continue toward menstruation.',
      },
    },
  },

  // ── Corpus Luteum ──────────────────────────────────────────────────────────
  {
    id: 'corpus-luteum',
    name: 'Corpus Luteum',
    shortDescription: 'The structure that forms from the ruptured follicle and secretes progesterone.',
    zoomRequired: false,
    svgX: 540, svgY: 480, svgRadius: 40,
    contextContent: {
      'after-release': {
        title: 'Corpus Luteum',
        whatIsHappening: 'The follicle that released the egg has transformed into the corpus luteum.',
        whyItMatters: 'It begins producing progesterone and estrogen.',
      },
      'preparation': {
        title: 'Corpus Luteum',
        whatIsHappening: 'The corpus luteum is fully active and releasing high levels of progesterone.',
        whyItMatters: 'These hormones maintain and prepare the uterine lining.',
      },
      'continue-restart': {
        title: 'Corpus Luteum',
        whatIsHappening: 'The corpus luteum is degenerating because pregnancy has not occurred.',
        whyItMatters: 'Hormone withdrawal will trigger menstruation.',
      },
    },
  },

  // ── Fallopian Tube ────────────────────────────────────────────────────────
  {
    id: 'fallopian-tube',
    name: 'Fallopian Tube',
    shortDescription: 'Transports the egg from the ovary toward the uterus.',
    zoomRequired: false,
    svgX: 460, svgY: 480, svgRadius: 30,
    contextContent: {
      'after-release': {
        title: 'Fallopian Tube',
        whatIsHappening: 'The egg is entering the fallopian tube, guided by finger-like fimbriae that sweep near the ovary.',
        whyItMatters: 'This is the most common site of fertilization.',
      },
      'preparation': {
        title: 'Fallopian Tube',
        whatIsHappening: 'Cilia and gentle muscular contractions move the egg toward the uterus.',
        whyItMatters: 'The tube provides time and opportunity for fertilization.',
      },
      'continue-restart': {
        title: 'Fallopian Tube',
        whatIsHappening: 'The egg has reached the end of its viable lifespan.',
        whyItMatters: 'Without fertilization, development cannot continue.',
      },
    },
  },

  // ── Uterus ────────────────────────────────────────────────────────────────
  {
    id: 'uterus',
    name: 'Uterus',
    shortDescription: 'The muscular organ whose lining builds and sheds each cycle.',
    zoomRequired: false,
    svgX: 290, svgY: 730, svgRadius: 120,
    contextContent: {
      'cycle-end': {
        title: 'Uterus',
        whatIsHappening: 'The uterus is shedding part of its inner lining.',
        whyItMatters: 'This marks the beginning of a new cycle.',
      },
      'recruitment': {
        title: 'Uterus',
        whatIsHappening: 'The uterus remains relatively inactive while follicles begin developing.',
        whyItMatters: 'It will later respond to hormones from the ovary.',
      },
      'competition': {
        title: 'Uterus',
        whatIsHappening: 'Rising estrogen is beginning to influence the uterus.',
        whyItMatters: 'The uterus is preparing for a possible pregnancy.',
      },
      'dominant': {
        title: 'Uterus',
        whatIsHappening: 'Increasing estrogen continues shaping the uterine environment.',
        whyItMatters: 'The uterus is becoming more supportive for implantation.',
      },
      'ovulation-decision': {
        title: 'Uterus',
        whatIsHappening: 'The uterus has responded to rising estrogen and is ready for the post-ovulation phase.',
        whyItMatters: 'Future changes will depend on progesterone.',
      },
      'after-release': {
        title: 'Uterus',
        whatIsHappening: 'Progesterone levels are beginning to rise.',
        whyItMatters: 'The uterus is transitioning from growth to preparation.',
      },
      'preparation': {
        title: 'Uterus',
        whatIsHappening: 'The uterus is in its most receptive state.',
        whyItMatters: 'An embryo would implant here if fertilization occurred.',
      },
      'continue-restart': {
        title: 'Uterus',
        whatIsHappening: 'Falling progesterone causes the uterus to lose support for the lining.',
        whyItMatters: 'Menstruation will soon begin.',
      },
    },
  },

  // ── Endometrium ───────────────────────────────────────────────────────────
  {
    id: 'endometrium',
    name: 'Endometrium',
    shortDescription: 'The inner lining of the uterus that thickens and sheds each cycle.',
    zoomRequired: false,
    svgX: 290, svgY: 700, svgRadius: 80,
    contextContent: {
      'cycle-end': {
        title: 'Endometrium',
        whatIsHappening: 'The endometrium is breaking down and being shed.',
        whyItMatters: 'This shedding is menstrual bleeding.',
      },
      'recruitment': {
        title: 'Endometrium',
        whatIsHappening: 'The lining is thin and beginning to rebuild.',
        whyItMatters: 'A new lining must be formed before implantation is possible.',
      },
      'competition': {
        title: 'Endometrium',
        whatIsHappening: 'Rising estrogen is stimulating growth of the lining.',
        whyItMatters: 'The uterus is preparing for possible implantation.',
      },
      'dominant': {
        title: 'Endometrium',
        whatIsHappening: 'The lining continues thickening under estrogen\'s influence.',
        whyItMatters: 'A thicker lining is more capable of supporting pregnancy.',
      },
      'ovulation-decision': {
        title: 'Endometrium',
        whatIsHappening: 'The lining has been built by estrogen and is preparing for progesterone\'s effects.',
        whyItMatters: 'Its function is about to shift from growth to support.',
      },
      'preparation': {
        title: 'Endometrium',
        whatIsHappening: 'Progesterone is transforming the lining into a nutrient-rich, secretory tissue.',
        whyItMatters: 'This creates the optimal environment for implantation.',
      },
      'continue-restart': {
        title: 'Endometrium',
        whatIsHappening: 'Progesterone withdrawal causes the lining to become unstable.',
        whyItMatters: 'The lining will soon be shed.',
      },
    },
  },
]
