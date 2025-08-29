export interface EditorialMember {
  id: string
  fullName: string
  credentials: string[]
  displayTitle: string
  affiliation: string
  orcid?: string
  researchInterests?: string[]
  regionsOfWork?: string[]
  roles?: string[]
  publicationsCount?: number
  category: 'editor-in-chief' | 'associate-editor' | 'advisory' | 'international-advisory' | 'managing-editor' | 'section-editor'
  photo?: string
  bio: string
}

export const editorialMembers: EditorialMember[] = [
  {
    id: 'edmund-ong',
    fullName: 'Dr. Edmund L. C. Ong',
    credentials: ['MBBS', 'MSc', 'FRCP', 'FRCPI', 'DTMH'],
    displayTitle: 'Honorary Professor of Medicine & Consultant in Infectious Diseases',
    affiliation: 'Faculty of Medical Sciences, Newcastle University Medicine Malaysia',
    orcid: '0000-0002-6594-0509',
    researchInterests: [
      'Opportunistic infections',
      'Anti-infective evaluation',
      'Clinical epidemiology',
      'Healthcare quality improvement',
      'Clinical audit',
      'HIV',
      'Tuberculosis',
      'Dengue'
    ],
    regionsOfWork: ['Nigeria', 'South Africa', 'Myanmar', 'Malaysia'],
    roles: [
      'Principal Investigator & collaborator in multinational infectious disease studies',
      'International Global Advisor (Malaysia) – Royal College of Physicians (London)',
      'Former Chair – British HIV Association Audit & Standards of Care Committee',
      'Undergraduate & postgraduate examiner (MRCP, Dip HIV Med, MMed)'
    ],
    publicationsCount: 160,
    category: 'international-advisory',
    photo: '/people/edmund-ong.jpg',
    bio: 'Dr Edmund L C Ong graduated from the University of Newcastle Medical School, UK and trained in Infectious Diseases, Tropical Medicine and General Internal Medicine. His research interests span opportunistic infections, evaluation of anti-infective agents, clinical epidemiology, and innovations in healthcare quality improvement and clinical audit. He serves as principal investigator or collaborator on research in HIV, Tuberculosis, and dengue fever across Nigeria, South Africa, Myanmar and Malaysia. Dr Ong has contributed to numerous textbooks on infection and co-authored more than 160 papers in peer-reviewed journals. He is an examiner for MRCP, Diploma in HIV Medicine, and MMed qualifications, and serves as International Global Advisor (Malaysia) for the Royal College of Physicians (London). He is a member and former Chairperson of the British HIV Association Audit and Standard of Care Committee.'
  },
  // Core Editorial Leadership
  {
    id: 'tubonye-harry',
    fullName: 'Prof. Tubonye C. Harry',
    credentials: [],
    displayTitle: 'Editor-in-Chief',
    affiliation: 'Affiliation forthcoming',
    category: 'editor-in-chief',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'sylvester-izah',
    fullName: 'Dr. Sylvester Izah',
    credentials: [],
    displayTitle: 'Deputy Editor-in-Chief',
    affiliation: 'Affiliation forthcoming',
    category: 'managing-editor',
    bio: 'Biography forthcoming.'
  },
  // Editors
  {
    id: 'aloysius-ligha',
    fullName: 'Prof. Aloysius E. Ligha',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'phillip-eyimina',
    fullName: 'Prof. Phillip D. Eyimina',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'stephen-olali',
    fullName: 'Prof. Stephen Olali',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'gift-timighe',
    fullName: 'Dr. Gift Timighe',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'godwin-angaye',
    fullName: 'Dr. Godwin Angaye',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'chinma-daokoru-olukole',
    fullName: 'Dr. Chinma Daokoru-Olukole',
    credentials: [],
    displayTitle: 'Editor',
    affiliation: 'Affiliation forthcoming',
    category: 'associate-editor',
    bio: 'Biography forthcoming.'
  },
  // International Editorial Advisory Board (locations used as provisional affiliation)
  {
    id: 'dimie-ogoina',
    fullName: 'Prof. Dimie Ogoina',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Yenagoa, Nigeria',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'tarila-tebepah',
    fullName: 'Prof. Tarila Tebepah',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Yenagoa, Nigeria',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'samuel-dagogo-jack',
    fullName: 'Prof. Samuel Dagogo-Jack',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Tennessee, USA',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'usiakimi-igbaseimokumo',
    fullName: 'Prof. Usiakimi Igbaseimokumo',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Texas, USA',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'bams-abila',
    fullName: 'Prof. Bams Abila',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'London, UK',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'ebitimitula-etebu',
    fullName: 'Prof. Ebitimitula Etebu',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Yenagoa, Nigeria',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'iheanyi-okpala',
    fullName: 'Prof. Iheanyi Okpala',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Enugu, Nigeria',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  // Edmund Ong already listed above in detail
  {
    id: 'matthew-ogwu',
    fullName: 'Dr. Matthew Ogwu',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Boone, USA',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'raul-delgado-wise',
    fullName: 'Prof. Raul Delgado Wise',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Zacatecas, Mexico',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'milan-hait',
    fullName: 'Dr. Milan Hait',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Chhattisgarh, India',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'muhammad-akram',
    fullName: 'Dr. Muhammad Akram',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Islamabad, Pakistan',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  },
  {
    id: 'noble-kurian',
    fullName: 'Dr. Noble Kurian',
    credentials: [],
    displayTitle: 'International Editorial Advisory Board Member',
    affiliation: 'Chennai, India',
    category: 'international-advisory',
    bio: 'Biography forthcoming.'
  }
]

export function groupEditorialMembers() {
  return editorialMembers.reduce<Record<string, EditorialMember[]>>((acc, m) => {
    acc[m.category] = acc[m.category] || []
    acc[m.category].push(m)
    return acc
  }, {})
}
