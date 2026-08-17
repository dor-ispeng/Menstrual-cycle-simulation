export type SourceEntry = {
  name: string
  desc: string
  url?: string
}

export type SupportEntry = {
  name: string
  focus: string
  desc: string
  url?: string
}

export const sources: SourceEntry[] = [
  {
    name: 'American College of Obstetricians and Gynecologists (ACOG)',
    desc: 'Clinical Guidance, Committee Opinions, Practice Bulletins, and Patient Education.',
    url: 'https://www.acog.org/',
  },
  {
    name: 'Williams Gynecology',
    desc: 'Hoffman, B. L., Schorge, J. O., Halvorson, L. M., et al. McGraw Hill Education, via McGraw Hill AccessMedicine.',
    url: 'https://accessmedicine.mhmedical.com/',
  },
  {
    name: 'Endocrine Society Clinical Practice Guidelines',
    desc: 'Endocrine Society. Clinical Practice Guidelines.',
    url: 'https://www.endocrine.org/clinical-practice-guidelines',
  },
  {
    name: 'American Society for Reproductive Medicine (ASRM)',
    desc: 'Practice Committee Guidelines and Patient Education.',
    url: 'https://www.asrm.org/',
  },
  {
    name: 'International Evidence-based Guideline for PCOS',
    desc: 'Monash University, ASRM, ESHRE, and collaborating organizations. International Evidence-Based Guideline for the Assessment and Management of Polycystic Ovary Syndrome.',
    url: 'https://www.monash.edu/medicine/mchri/pcos',
  },
  {
    name: 'StatPearls / NCBI Bookshelf',
    desc: 'StatPearls Publishing, hosted by the National Center for Biotechnology Information.',
    url: 'https://www.ncbi.nlm.nih.gov/books',
  },
]

export const supportItems: SupportEntry[] = [
  {
    name: "Office on Women's Health (U.S. Department of Health and Human Services)",
    focus: "General Women's Health",
    desc: 'A trusted U.S. government resource providing evidence-based information on menstrual health, PCOS, endometriosis, menopause, contraception, pregnancy, and other reproductive health topics.',
    url: 'https://womenshealth.gov/',
  },
  {
    name: 'PCOS Challenge',
    focus: 'PCOS',
    desc: 'A nonprofit dedicated to PCOS education, advocacy, and support. Offers educational resources, webinars, patient conferences, and peer support communities.',
    url: 'https://pcoschallenge.org/',
  },
  {
    name: 'International Association for Premenstrual Disorders (IAPMD)',
    focus: 'PMDD & PME',
    desc: 'Provides education, symptom tracking tools, moderated support groups, and resources for individuals affected by PMDD and other severe premenstrual disorders.',
    url: 'https://www.iapmd.org/',
  },
  {
    name: 'Daisy Network',
    focus: 'POI',
    desc: 'A nonprofit supporting people affected by primary ovarian insufficiency through educational resources, peer communities, online support groups, and counseling, while also promoting awareness and research.',
    url: 'https://daisynetwork.org',
  },
  {
    name: 'Anxiety and Depression Association of America (ADAA)',
    focus: 'Stress & Mental Health',
    desc: 'Provides evidence-based resources, therapist directories, and educational materials for managing stress, anxiety, and depression, which can influence menstrual health.',
    url: 'https://adaa.org/',
  },
  {
    name: 'The Pad Project',
    focus: 'Menstrual Equity',
    desc: 'A nonprofit working to reduce period poverty by providing menstrual products, education, and advocacy for underserved communities around the world.',
    url: 'https://thepadproject.org/',
  },
]
