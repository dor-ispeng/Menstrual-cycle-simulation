import { ConditionId, StructureContent } from '@/types/simulation'

// Condition-specific overrides for the structure detail panel. SPARSE by
// design — only structures whose role meaningfully changes for a given
// condition appear here. Anything absent falls through to the normal-cycle
// content in structures.ts (resolved in StructurePanel.tsx).
//
// granulosa-cells and corpus-luteum have no PCOS entries below: both are
// unreachable in PCOS. granulosa-cells requires structR > 20, but PCOS's
// dominantFollicleRadius is always 0 so structR is pinned at BASE_R (18).
// corpus-luteum's click target only activates once eggProgress passes the
// post-ovulation collapse window, and PCOS's eggProgress is -1 throughout.
export const conditionStructureContent: Partial<
  Record<ConditionId, Partial<Record<string, Partial<Record<string, StructureContent>>>>>
> = {
  pcos: {
    brain: {
      'cycle-end': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'Progesterone never rose during the last cycle, so there is no withdrawal. FSH rises modestly while LH is already elevated above normal.',
        whyItMatters:
          'The cycle starts with an abnormal LH-to-FSH balance rather than a clean hormonal reset.',
      },
      'recruitment': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'GnRH pulses are rapid, which favors LH release over FSH. The pituitary puts out relatively little FSH.',
        whyItMatters:
          'Reduced FSH means the follicle cohort never gets a strong enough growth signal.',
      },
      'competition': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'The brain receives only weak estrogen feedback because no follicle is producing much.',
        whyItMatters:
          'Without a rising estrogen signal, the brain cannot identify a leading follicle.',
      },
      'dominant': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'Estrogen never reaches the sustained high level the brain is waiting for. LH remains elevated but flat.',
        whyItMatters: 'The switch from negative to positive feedback never happens.',
      },
      'ovulation-decision': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'No LH surge is generated. Baseline LH stays high, but there is no sharp midcycle spike.',
        whyItMatters:
          'Elevated LH is not the same as an LH surge — only a surge can trigger ovulation.',
      },
      'after-release': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'No ovulation occurred, so no progesterone signal returns to the brain.',
        whyItMatters: 'The brain never receives confirmation that ovulation happened.',
      },
      'preparation': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Without progesterone, GnRH pulses stay rapid and LH remains elevated.',
        whyItMatters: 'The rapid pulse pattern that favors LH over FSH is self-sustaining.',
      },
      'continue-restart': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'There is no progesterone withdrawal to reset the axis. FSH rises slightly and the same pattern repeats.',
        whyItMatters: 'The cycle can repeat without ovulation, sometimes for months.',
      },
    },

    ovary: {
      'cycle-end': {
        title: 'Ovary',
        whatIsHappening:
          'Many small follicles from previous cycles are still present, giving the ovary a crowded appearance.',
        whyItMatters:
          'These arrested follicles are the accumulated result of repeated cycles without ovulation.',
      },
      'recruitment': {
        title: 'Ovary',
        whatIsHappening: 'A new group of follicles begins growing alongside the ones already there.',
        whyItMatters: 'The ovary keeps recruiting even though earlier cohorts never resolved.',
      },
      'competition': {
        title: 'Ovary',
        whatIsHappening:
          'Multiple follicles grow to a similar small size. The ovary produces excess androgens.',
        whyItMatters:
          'Androgen excess interferes with the selection process the ovary normally performs.',
      },
      'dominant': {
        title: 'Ovary',
        whatIsHappening:
          'No single follicle is selected. The ovary contains many follicles of similar size rather than one large one.',
        whyItMatters:
          "Selecting one dominant follicle is the ovary's central job in the cycle, and here it fails.",
      },
      'ovulation-decision': {
        title: 'Ovary',
        whatIsHappening: 'No follicle is mature enough to rupture, and no LH surge arrives to trigger it.',
        whyItMatters: 'The ovary does not release an egg this cycle.',
      },
      'after-release': {
        title: 'Ovary',
        whatIsHappening: 'Nothing has ruptured, so the ovary does not form a corpus luteum.',
        whyItMatters: 'Without a corpus luteum the ovary cannot switch to progesterone production.',
      },
      'preparation': {
        title: 'Ovary',
        whatIsHappening: 'The ovary continues producing estrogen and androgens, but no progesterone.',
        whyItMatters: 'The hormonal output stays stuck in a follicular-phase pattern.',
      },
      'continue-restart': {
        title: 'Ovary',
        whatIsHappening: 'The arrested follicles remain, and the ovary enters the next cycle in the same state.',
        whyItMatters: 'The polycystic appearance persists from cycle to cycle.',
      },
    },

    follicle: {
      'cycle-end': {
        title: 'Small Follicles',
        whatIsHappening:
          'Many small follicles are present, left over from previous cycles that did not complete.',
        whyItMatters: 'They remain hormonally active and contribute to androgen excess.',
      },
      'recruitment': {
        title: 'Small Follicles',
        whatIsHappening: 'A new cohort begins growing, but the available FSH is limited.',
        whyItMatters: 'Weak FSH support means none will be strongly favored.',
      },
      'competition': {
        title: 'Arrested Follicles',
        whatIsHappening: 'Follicles reach roughly 2–9 mm and then stop growing. None pulls ahead.',
        whyItMatters: 'Growth arrest at this stage is the defining follicular feature of PCOS.',
      },
      'dominant': {
        title: 'Arrested Follicles',
        whatIsHappening: 'No dominant follicle emerges. Several follicles remain at a similar size.',
        whyItMatters:
          'Without a dominant follicle there is no source of the sustained estrogen needed for ovulation.',
      },
      'ovulation-decision': {
        title: 'Arrested Follicles',
        whatIsHappening: 'No follicle has matured to ovulatory size, and none ruptures.',
        whyItMatters: 'The follicles persist rather than releasing an egg.',
      },
    },

    egg: {
      'recruitment': {
        title: 'Egg',
        whatIsHappening: 'Each small follicle still contains an immature egg.',
        whyItMatters: 'The eggs themselves are present and viable — the problem is the follicles around them.',
      },
      'competition': {
        title: 'Egg',
        whatIsHappening: 'The egg remains inside its follicle, which has stopped growing.',
        whyItMatters: 'The egg cannot mature further while the follicle is arrested.',
      },
      'ovulation-decision': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'Without an LH surge the follicle wall never weakens, and the egg stays inside.',
        whyItMatters: 'The egg is not defective — it simply never gets the signal to be released.',
      },
      'after-release': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No ovulation occurred. The egg remains within its follicle in the ovary.',
        whyItMatters: 'With no egg in the fallopian tube, fertilization is not possible this cycle.',
      },
      'preparation': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'The egg is still in the ovary. Some arrested follicles will eventually break down.',
        whyItMatters: 'Eggs are retained rather than released, which is why ovarian reserve is often preserved in PCOS.',
      },
      'continue-restart': {
        title: 'Egg (Not Released)',
        whatIsHappening:
          'The egg was never released and the follicle containing it may persist into the next cycle.',
        whyItMatters: 'Ovulation may still occur in other cycles — PCOS ovulation is irregular, not always absent.',
      },
    },

    uterus: {
      'cycle-end': {
        title: 'Uterus',
        whatIsHappening: 'Bleeding may be occurring, but it is often irregular, delayed, or unusually heavy.',
        whyItMatters:
          'Without a regular progesterone cycle, the timing of bleeding becomes unpredictable.',
      },
      'recruitment': {
        title: 'Uterus',
        whatIsHappening:
          'The uterus responds to estrogen, which is present but not following the usual rising pattern.',
        whyItMatters: 'The uterus depends on ovarian signals that are disordered in PCOS.',
      },
      'competition': {
        title: 'Uterus',
        whatIsHappening: 'Estrogen continues to stimulate the uterus without a clear midcycle peak.',
        whyItMatters: 'Steady estrogen without progesterone drives continuous growth.',
      },
      'dominant': {
        title: 'Uterus',
        whatIsHappening: 'The uterus continues receiving estrogen but no signal that ovulation is approaching.',
        whyItMatters: 'It never transitions out of the growth phase.',
      },
      'ovulation-decision': {
        title: 'Uterus',
        whatIsHappening: 'No ovulation occurs, so the uterus receives no progesterone.',
        whyItMatters: 'Progesterone is what normally converts the uterus from growth to readiness.',
      },
      'after-release': {
        title: 'Uterus',
        whatIsHappening: 'No corpus luteum has formed, so no progesterone reaches the uterus.',
        whyItMatters: 'The uterus stays in an estrogen-only state.',
      },
      'preparation': {
        title: 'Uterus',
        whatIsHappening:
          'The uterus remains under unopposed estrogen stimulation rather than becoming receptive.',
        whyItMatters: 'Prolonged unopposed estrogen is why PCOS raises long-term endometrial risk.',
      },
      'continue-restart': {
        title: 'Uterus',
        whatIsHappening: 'With no progesterone to withdraw, shedding is irregular and may be heavy when it does occur.',
        whyItMatters: 'Bleeding becomes unpredictable in both timing and volume.',
      },
    },

    endometrium: {
      'cycle-end': {
        title: 'Endometrium',
        whatIsHappening:
          'The lining is shedding, but often irregularly and sometimes heavily after a long buildup.',
        whyItMatters: 'A thicker-than-usual lining takes longer and sheds less predictably.',
      },
      'recruitment': {
        title: 'Endometrium',
        whatIsHappening: 'The lining begins rebuilding under estrogen, sometimes from an incompletely shed base.',
        whyItMatters: 'Rebuilding may start from a thicker starting point than normal.',
      },
      'competition': {
        title: 'Endometrium',
        whatIsHappening: 'Estrogen drives steady proliferation with no progesterone to balance it.',
        whyItMatters: 'This is the start of unopposed estrogen exposure.',
      },
      'dominant': {
        title: 'Endometrium',
        whatIsHappening: 'The lining keeps thickening under continued estrogen stimulation.',
        whyItMatters: 'Growth continues past the point where it would normally stop.',
      },
      'ovulation-decision': {
        title: 'Endometrium',
        whatIsHappening: 'No ovulation occurs, so the switch to progesterone never happens.',
        whyItMatters: 'The lining cannot begin secretory transformation without progesterone.',
      },
      'preparation': {
        title: 'Endometrium (Unopposed Estrogen)',
        whatIsHappening:
          'The lining remains proliferative. It does not become the nutrient-rich secretory tissue seen in a normal cycle.',
        whyItMatters: 'It may be thick, but it is not receptive — thickness and readiness are not the same thing.',
      },
      'continue-restart': {
        title: 'Endometrium',
        whatIsHappening:
          'With no progesterone withdrawal, the lining becomes unstable and sheds erratically rather than on schedule.',
        whyItMatters: 'Long-term unopposed estrogen increases the risk of endometrial hyperplasia.',
      },
    },

    // The tube's function is NOT altered by PCOS — this override exists only
    // because the base text asserts an egg is present ("The egg is entering
    // the fallopian tube"), which is false when no ovulation occurred.
    'fallopian-tube': {
      'after-release': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg was released, so the fimbriae have nothing to collect.',
        whyItMatters: 'The tube is healthy and functional in PCOS — there is simply no egg for it to transport.',
      },
      'preparation': {
        title: 'Fallopian Tube',
        whatIsHappening: 'The tube continues its normal cilia movement, but no egg is passing through it.',
        whyItMatters: "The tube's function is unaffected by PCOS itself.",
      },
      'continue-restart': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg entered the tube during this cycle.',
        whyItMatters: 'When ovulation does occur in PCOS, the tube works normally.',
      },
    },
  },

  // FHA's through-line: THE OVARY IS FINE. The interruption starts in the
  // brain and is typically reversible — copy repeatedly reinforces that the
  // ovary is capable and merely under-stimulated. This is the deliberate
  // contrast with POI, where the ovary genuinely cannot respond.
  //
  // corpus-luteum has no entry: FHA's eggProgress is -1 at every anchor, so
  // the click handler always routes to 'follicle'.
  // granulosa-cells IS marginally reachable (unlike in PCOS): its gate is
  // structR > 20, and structR = max(18, dominantFollicleRadius * 72). FHA's
  // dominantFollicleRadius peaks at 0.30 → structR = 21.6, clearing the gate
  // at Competition only (and only when zoomed >= 2.5x). Two brief anchors.
  'functional-hypothalamic-amenorrhea': {
    brain: {
      'cycle-end': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'Energy availability is low, so the hypothalamus has slowed its GnRH pulses. FSH and LH are both low, with LH lower than FSH.',
        whyItMatters: 'The interruption begins here, in the brain, not in the ovary.',
      },
      'recruitment': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'Slow, infrequent GnRH pulses reach the pituitary, which releases only a small amount of FSH.',
        whyItMatters: 'Follicles need sustained FSH to grow, and this signal is too weak.',
      },
      'competition': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Pituitary output stays low. There is no rise in FSH to drive the cohort forward.',
        whyItMatters: 'The brain is not responding to the ovary — it is simply not signaling.',
      },
      'dominant': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'With no follicle producing much estrogen, there is nothing for the brain to respond to.',
        whyItMatters: 'The feedback loop is quiet at both ends.',
      },
      'ovulation-decision': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'No sustained estrogen rise occurs, so the hypothalamus never switches to positive feedback and no LH surge is generated.',
        whyItMatters:
          'The surge depends on an estrogen signal the ovary was never stimulated enough to produce.',
      },
      'after-release': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Nothing was released, so no progesterone feedback returns.',
        whyItMatters: 'The axis stays in its suppressed state.',
      },
      'preparation': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'GnRH pulses remain slow and both gonadotropins stay low.',
        whyItMatters: 'This is a protective response — the body is conserving energy rather than malfunctioning.',
      },
      'continue-restart': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'Signaling stays suppressed. It can recover when energy availability, stress, or training load improve.',
        whyItMatters:
          'FHA is typically reversible — the reproductive axis is intact and waiting for conditions to change.',
      },
    },

    ovary: {
      'cycle-end': {
        title: 'Ovary',
        whatIsHappening:
          'The ovary is structurally normal, with a healthy reserve of follicles. It is simply receiving very little stimulation.',
        whyItMatters: 'Nothing is wrong with the ovary itself in FHA.',
      },
      'recruitment': {
        title: 'Ovary',
        whatIsHappening:
          'A cohort of follicles is available and begins to respond, but the FSH reaching them is minimal.',
        whyItMatters: 'The ovary can only act on the signal it receives.',
      },
      'competition': {
        title: 'Ovary',
        whatIsHappening: 'Follicle growth stalls early, and the ovary produces very little estrogen as a result.',
        whyItMatters: 'Without stimulation the ovary cannot progress toward selecting a follicle.',
      },
      'dominant': {
        title: 'Ovary',
        whatIsHappening: 'No follicle is selected, because none received enough support to pull ahead.',
        whyItMatters: 'This is a signaling failure, not an ovarian one.',
      },
      'ovulation-decision': {
        title: 'Ovary',
        whatIsHappening: 'No follicle has matured, and no LH surge arrives.',
        whyItMatters: 'The ovary does not release an egg this cycle.',
      },
      'after-release': {
        title: 'Ovary',
        whatIsHappening: 'Nothing ruptured, so no corpus luteum forms.',
        whyItMatters: 'The ovary produces almost no progesterone.',
      },
      'preparation': {
        title: 'Ovary',
        whatIsHappening: 'The ovary remains quiet, producing low estrogen and no progesterone.',
        whyItMatters: 'Its output reflects the low signal it is receiving, not damage.',
      },
      'continue-restart': {
        title: 'Ovary',
        whatIsHappening: 'The follicle reserve is unchanged and remains ready to respond.',
        whyItMatters: 'When signaling returns, the ovary can resume normal cycles.',
      },
    },

    follicle: {
      'cycle-end': {
        title: 'Small Follicles',
        whatIsHappening: 'A healthy pool of small follicles is present in the ovary.',
        whyItMatters:
          'Ovarian reserve is not reduced in FHA — these follicles are simply not being stimulated.',
      },
      'recruitment': {
        title: 'Small Follicles',
        whatIsHappening: 'A few follicles begin growing on the small amount of FSH available.',
        whyItMatters: 'Growth depends on FSH, and there is very little of it.',
      },
      'competition': {
        title: 'Stalled Follicles',
        whatIsHappening: 'Follicles grow slightly and then stop. None gains a clear advantage.',
        whyItMatters: 'They arrest early because stimulation is insufficient, not because they are abnormal.',
      },
      'dominant': {
        title: 'Stalled Follicles',
        whatIsHappening: 'No dominant follicle develops. The largest follicle regresses rather than continuing to grow.',
        whyItMatters: 'Without a dominant follicle there is no estrogen rise and no ovulation.',
      },
      'ovulation-decision': {
        title: 'Stalled Follicles',
        whatIsHappening: 'No follicle reached ovulatory size, and none ruptures.',
        whyItMatters: 'The follicles gradually regress instead.',
      },
    },

    'granulosa-cells': {
      'recruitment': {
        title: 'Granulosa Cells',
        whatIsHappening: 'These cells respond to FSH, but very little FSH is reaching them.',
        whyItMatters: 'They cannot produce much estrogen without FSH stimulation.',
      },
      'competition': {
        title: 'Granulosa Cells',
        whatIsHappening: 'Granulosa cell numbers stay low and estrogen output remains minimal.',
        whyItMatters:
          'Their estrogen production is the signal the brain is waiting for, and it never arrives.',
      },
    },

    egg: {
      'recruitment': {
        title: 'Egg',
        whatIsHappening: 'Each follicle contains an immature egg, unaffected by the low hormone levels.',
        whyItMatters: 'Egg quality and quantity are generally preserved in FHA.',
      },
      'competition': {
        title: 'Egg',
        whatIsHappening: 'The egg remains inside a follicle that has stopped growing.',
        whyItMatters: 'The egg cannot mature while the follicle is stalled.',
      },
      'ovulation-decision': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No LH surge arrives, so the follicle never ruptures and the egg stays inside.',
        whyItMatters: 'The egg is healthy — it simply never receives the signal to be released.',
      },
      'after-release': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No ovulation occurred. The egg remains in the ovary.',
        whyItMatters: 'There is no egg in the fallopian tube this cycle.',
      },
      'preparation': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'The egg remains in its follicle, which will slowly regress.',
        whyItMatters: 'Eggs are conserved rather than lost — reserve is preserved.',
      },
      'continue-restart': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'The egg was not released this cycle.',
        whyItMatters: 'Ovulation typically resumes once hypothalamic signaling recovers.',
      },
    },

    uterus: {
      'cycle-end': {
        title: 'Uterus',
        whatIsHappening: 'The uterus is quiet. With little estrogen or progesterone, there may be no bleeding at all.',
        whyItMatters: 'Absent periods are the defining feature of FHA.',
      },
      'recruitment': {
        title: 'Uterus',
        whatIsHappening: 'Very little estrogen reaches the uterus.',
        whyItMatters: 'The uterus depends on ovarian hormones it is not receiving.',
      },
      'competition': {
        title: 'Uterus',
        whatIsHappening: 'Estrogen stays low, so the uterus receives minimal stimulation.',
        whyItMatters: 'Growth of the lining requires estrogen the ovary is not producing.',
      },
      'dominant': {
        title: 'Uterus',
        whatIsHappening: 'There is no rise in estrogen for the uterus to respond to.',
        whyItMatters: 'The uterus stays in a low-activity state.',
      },
      'ovulation-decision': {
        title: 'Uterus',
        whatIsHappening: 'No ovulation occurs, so no progesterone will follow.',
        whyItMatters: 'The uterus never enters the second half of the cycle.',
      },
      'after-release': {
        title: 'Uterus',
        whatIsHappening: 'No corpus luteum formed, so no progesterone reaches the uterus.',
        whyItMatters: 'The uterus receives neither of the signals it normally responds to.',
      },
      'preparation': {
        title: 'Uterus',
        whatIsHappening: 'The uterus remains inactive rather than becoming receptive.',
        whyItMatters: 'Implantation would not be possible in this state.',
      },
      'continue-restart': {
        title: 'Uterus',
        whatIsHappening: 'With almost no lining built up, there is little or nothing to shed.',
        whyItMatters:
          'Prolonged low estrogen also affects bone density, which is a key clinical concern in FHA.',
      },
    },

    endometrium: {
      'cycle-end': {
        title: 'Endometrium',
        whatIsHappening: 'The lining is thin and there may be little or no bleeding.',
        whyItMatters: 'Without a preceding buildup there is not much tissue to shed.',
      },
      'recruitment': {
        title: 'Endometrium',
        whatIsHappening: 'The lining stays thin because estrogen levels are very low.',
        whyItMatters: 'Rebuilding the lining requires estrogen the ovary is not producing.',
      },
      'competition': {
        title: 'Endometrium',
        whatIsHappening: 'Minimal estrogen reaches the lining, so proliferation is limited.',
        whyItMatters: 'The lining cannot thicken without hormonal support.',
      },
      'dominant': {
        title: 'Endometrium',
        whatIsHappening: 'The lining remains thin. There is no estrogen rise to drive growth.',
        whyItMatters: 'A thin lining cannot support implantation.',
      },
      'ovulation-decision': {
        title: 'Endometrium',
        whatIsHappening: 'No ovulation occurs, so the lining will not receive progesterone.',
        whyItMatters: 'The lining stays in its thin, inactive state.',
      },
      'preparation': {
        title: 'Endometrium (Thin)',
        whatIsHappening: 'The lining is thin and underdeveloped rather than secretory.',
        whyItMatters: 'Unlike PCOS, the problem here is too little estrogen rather than too much.',
      },
      'continue-restart': {
        title: 'Endometrium',
        whatIsHappening: 'There is little lining to shed, so periods are typically absent or very light.',
        whyItMatters: 'Prolonged low estrogen is also associated with reduced bone density.',
      },
    },

    // The tube's function is NOT altered by FHA — this override exists only
    // because the base text asserts an egg is present.
    'fallopian-tube': {
      'after-release': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg was released, so the fimbriae have nothing to collect.',
        whyItMatters: 'The tube is structurally normal in FHA — there is simply no egg to transport.',
      },
      'preparation': {
        title: 'Fallopian Tube',
        whatIsHappening: 'The tube continues its normal movement, but no egg is passing through.',
        whyItMatters: 'The tube is unaffected by FHA itself.',
      },
      'continue-restart': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg entered the tube this cycle.',
        whyItMatters: 'When ovulation resumes, the tube functions normally.',
      },
    },
  },

  // POI's through-line: a LOUD brain and an ovary that genuinely cannot
  // answer — the precise inverse of FHA, where the ovary is fine and the
  // brain is quiet. Copy keeps returning to that asymmetry.
  //
  // Neither corpus-luteum nor granulosa-cells has an entry: POI's eggProgress
  // is -1 throughout, so the click handler always routes to 'follicle', and
  // dominantFollicleRadius is 0 at every anchor so structR is pinned at
  // BASE_R (18), below the > 20 gate granulosa-cells needs.
  //
  // MEDICAL FRAMING: POI is not menopause. Ovarian function is intermittent —
  // spontaneous ovulation and pregnancy occur in a minority of cases. The
  // not-menopause caveat is preserved in ovary/continue-restart,
  // follicle/ovulation-decision, and egg/continue-restart below.
  'primary-ovarian-insufficiency': {
    brain: {
      'cycle-end': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'FSH is already elevated because the brain is not receiving enough estrogen feedback from the ovary.',
        whyItMatters: 'High FSH at the start of a cycle is the classic marker of reduced ovarian reserve.',
      },
      'recruitment': {
        title: 'Brain and Pituitary',
        whatIsHappening:
          'The pituitary releases high levels of FSH, trying to stimulate the few follicles that remain.',
        whyItMatters: 'The brain is compensating for an ovary that cannot respond.',
      },
      'competition': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'FSH stays high because almost no estrogen returns to signal that a follicle is growing.',
        whyItMatters: 'Low estrogen feedback keeps the brain pushing harder.',
      },
      'dominant': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'The brain continues raising FSH, but there is no follicle capable of answering.',
        whyItMatters: 'The loop cannot close — the signal is loud but there is no response.',
      },
      'ovulation-decision': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'Estrogen never reaches the threshold for positive feedback, so no LH surge is triggered.',
        whyItMatters: 'Both FSH and LH stay elevated, but neither can force ovulation.',
      },
      'after-release': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'No ovulation occurred, so no progesterone feedback returns.',
        whyItMatters: 'Gonadotropins remain high throughout.',
      },
      'preparation': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'FSH and LH stay elevated with no progesterone to suppress them.',
        whyItMatters:
          'This persistently high-gonadotropin state is what distinguishes POI from Functional Hypothalamic Amenorrhea, where both are low.',
      },
      'continue-restart': {
        title: 'Brain and Pituitary',
        whatIsHappening: 'The brain enters the next cycle still signaling strongly.',
        whyItMatters: 'Ovarian function in POI can fluctuate — some cycles may respond better than others.',
      },
    },

    ovary: {
      'cycle-end': {
        title: 'Ovary',
        whatIsHappening: 'Only a small number of follicles remain. The ovary is noticeably less populated than usual.',
        whyItMatters: 'Reduced follicle reserve is the central feature of POI.',
      },
      'recruitment': {
        title: 'Ovary',
        whatIsHappening: 'Despite high FSH, only a few follicles are available to respond.',
        whyItMatters: 'Stimulation cannot create follicles that are no longer there.',
      },
      'competition': {
        title: 'Ovary',
        whatIsHappening: 'The few follicles present grow weakly or not at all.',
        whyItMatters: 'There is no cohort from which a dominant follicle could be selected.',
      },
      'dominant': {
        title: 'Ovary',
        whatIsHappening: 'No dominant follicle develops, and the ovary produces very little estrogen.',
        whyItMatters: 'The ovary cannot meet the demand the brain is placing on it.',
      },
      'ovulation-decision': {
        title: 'Ovary',
        whatIsHappening: 'No follicle is ready to rupture, and no LH surge occurs.',
        whyItMatters: 'Ovulation does not happen in this representative cycle.',
      },
      'after-release': {
        title: 'Ovary',
        whatIsHappening: 'Nothing ruptured, so no corpus luteum forms.',
        whyItMatters: 'The ovary produces almost no progesterone.',
      },
      'preparation': {
        title: 'Ovary',
        whatIsHappening: 'The ovary remains quiet, with low estrogen and no progesterone output.',
        whyItMatters: 'Its reduced hormone output affects the uterus, bones, and other tissues.',
      },
      'continue-restart': {
        title: 'Ovary',
        whatIsHappening: 'The remaining follicles are unchanged going into the next cycle.',
        whyItMatters: 'POI is not menopause — ovarian activity fluctuates and occasional ovulation does occur.',
      },
    },

    follicle: {
      'cycle-end': {
        title: 'Few Follicles',
        whatIsHappening: 'Only a small number of follicles remain in the ovary.',
        whyItMatters: 'This reduced reserve is what defines POI.',
      },
      'recruitment': {
        title: 'Few Follicles',
        whatIsHappening: 'High FSH reaches the few follicles present, but they respond poorly.',
        whyItMatters: 'The problem is both how few there are and how weakly they respond.',
      },
      'competition': {
        title: 'Few Follicles',
        whatIsHappening: 'The remaining follicles grow very little. None approaches ovulatory size.',
        whyItMatters: 'There are too few responsive follicles for competition to occur.',
      },
      'dominant': {
        title: 'Few Follicles',
        whatIsHappening: 'No dominant follicle emerges.',
        whyItMatters: 'Without one there is no estrogen rise and no path to ovulation.',
      },
      'ovulation-decision': {
        title: 'Few Follicles',
        whatIsHappening: 'No follicle matured, and none ruptures.',
        whyItMatters: 'Some follicles may still respond in other cycles — POI function is intermittent.',
      },
    },

    egg: {
      'recruitment': {
        title: 'Egg',
        whatIsHappening: 'The few remaining follicles each still contain an egg.',
        whyItMatters: 'Eggs remain, but far fewer than in a typical ovary.',
      },
      'competition': {
        title: 'Egg',
        whatIsHappening: 'The egg stays inside a follicle that is barely growing.',
        whyItMatters: 'Without follicle growth the egg cannot mature.',
      },
      'ovulation-decision': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No LH surge occurs and no follicle ruptures, so the egg is not released.',
        whyItMatters: 'Reduced reserve means fewer opportunities for an egg to be released.',
      },
      'after-release': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No ovulation occurred. The egg remains in the ovary.',
        whyItMatters: 'No egg enters the fallopian tube this cycle.',
      },
      'preparation': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'The egg remains in its follicle.',
        whyItMatters: 'Eggs are limited in POI, which is why fertility is significantly reduced.',
      },
      'continue-restart': {
        title: 'Egg (Not Released)',
        whatIsHappening: 'No egg was released this cycle.',
        whyItMatters: 'Spontaneous ovulation and pregnancy do occur in a minority of people with POI.',
      },
    },

    uterus: {
      'cycle-end': {
        title: 'Uterus',
        whatIsHappening:
          'Bleeding is irregular and often absent, depending on how much estrogen the ovary produced.',
        whyItMatters: 'Cycle timing becomes unpredictable as ovarian output declines.',
      },
      'recruitment': {
        title: 'Uterus',
        whatIsHappening: 'Very little estrogen reaches the uterus.',
        whyItMatters: 'The uterus itself is healthy but is receiving minimal hormonal input.',
      },
      'competition': {
        title: 'Uterus',
        whatIsHappening: 'Estrogen stays low, so the uterus receives little stimulation.',
        whyItMatters: 'The uterus depends entirely on ovarian hormones.',
      },
      'dominant': {
        title: 'Uterus',
        whatIsHappening: 'There is no rise in estrogen for the uterus to respond to.',
        whyItMatters: 'The uterus remains in a low-activity state.',
      },
      'ovulation-decision': {
        title: 'Uterus',
        whatIsHappening: 'No ovulation occurs, so no progesterone will follow.',
        whyItMatters: 'The uterus never enters the second half of the cycle.',
      },
      'after-release': {
        title: 'Uterus',
        whatIsHappening: 'No corpus luteum formed, so no progesterone reaches the uterus.',
        whyItMatters: 'Neither of the normal hormonal signals arrives.',
      },
      'preparation': {
        title: 'Uterus',
        whatIsHappening: 'The uterus stays inactive rather than becoming receptive.',
        whyItMatters:
          'The uterus can still support pregnancy if hormones are supplied, which is why donor-egg pregnancy is possible in POI.',
      },
      'continue-restart': {
        title: 'Uterus',
        whatIsHappening: 'With little lining built up, bleeding is light, irregular, or absent.',
        whyItMatters:
          'Long-term low estrogen affects bone and cardiovascular health, which is why hormone therapy is often recommended.',
      },
    },

    endometrium: {
      'cycle-end': {
        title: 'Endometrium',
        whatIsHappening: 'The lining is thin, and any bleeding is typically light and unpredictable.',
        whyItMatters: 'There is little tissue to shed after a cycle with minimal estrogen.',
      },
      'recruitment': {
        title: 'Endometrium',
        whatIsHappening: 'The lining stays thin because estrogen is low.',
        whyItMatters: 'Rebuilding requires estrogen the ovary can no longer reliably produce.',
      },
      'competition': {
        title: 'Endometrium',
        whatIsHappening: 'Minimal estrogen reaches the lining, so growth is limited.',
        whyItMatters: 'The lining cannot thicken without hormonal support.',
      },
      'dominant': {
        title: 'Endometrium',
        whatIsHappening: 'The lining remains thin, with no estrogen rise to drive proliferation.',
        whyItMatters: 'A thin lining cannot support implantation.',
      },
      'ovulation-decision': {
        title: 'Endometrium',
        whatIsHappening: 'No ovulation occurs, so progesterone will not follow.',
        whyItMatters: 'The lining stays thin and inactive.',
      },
      'preparation': {
        title: 'Endometrium (Thin)',
        whatIsHappening: 'The lining stays thin and never becomes secretory.',
        whyItMatters:
          'As in FHA the limitation is too little estrogen — the opposite of the unopposed-estrogen picture in PCOS.',
      },
      'continue-restart': {
        title: 'Endometrium',
        whatIsHappening: 'There is little lining to shed, so bleeding is light or absent.',
        whyItMatters: 'The lining responds normally to hormones when they are supplied.',
      },
    },

    // The tube's function is NOT altered by POI — this override exists only
    // because the base text asserts an egg is present.
    'fallopian-tube': {
      'after-release': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg was released, so the fimbriae have nothing to collect.',
        whyItMatters: 'The tube is structurally normal in POI — there is simply no egg to transport.',
      },
      'preparation': {
        title: 'Fallopian Tube',
        whatIsHappening: 'The tube continues its normal movement, but no egg is passing through.',
        whyItMatters: 'The tube is unaffected by POI itself.',
      },
      'continue-restart': {
        title: 'Fallopian Tube',
        whatIsHappening: 'No egg entered the tube this cycle.',
        whyItMatters: 'If ovulation does occur, the tube functions normally.',
      },
    },
  },
}
