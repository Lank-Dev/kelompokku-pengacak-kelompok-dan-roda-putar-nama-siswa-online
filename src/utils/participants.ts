// Master Data & Configuration for 35 Participants & 6 Groups Rules

export const POOL_1: string[] = [
  'Adika Ramzi',
  'M. Gilank Putra Ramadhan',
  'Nayaka Nur Zaky',
  'Shalahuddin Yusuf Azka',
  'Aila Putri Noviyan',
  'Dirlha Hainnun Ningsih',
  'Hafizal Gustyo Pratama',
  'Neyna Hendriani Liu',
  'Syahrul Salam',
  'Muhammad Haikal',
  'Ardilla Putri Wulansari',
] // 11 orang

export const POOL_2: string[] = [
  'Daffa Putra Gemilang',
  'Muhammad Akbar Ar’rafa',
  'Alfino Fazrurachman',
  'Dzaky Almer Rafif',
  'Ibra Muhammad',
  'Pauziah Lestari',
  'Fahril Ilham',
  'Inayah Nur Azizah',
  'Rafiq Fadhil Fathin',
  'Zidane Adlyndra Assami',
  'Muhammad Zainal Abidin',
  'Raka Apriansyah',
] // 12 orang

export const POOL_3: string[] = [
  'Fatah Rezky Al Gyfari',
  'Kamal Al-Fathir Iskandar',
  'Nava Olivia',
  'Riyan Ade Geandra',
  'Ahmad Daniel Ghifari',
  'Dimas Wahyu Setiyawan',
  'Fatur Rahman Al-Ghozy',
  'Vani Oktaviani',
  'Muhammad Nur Asyifa',
  'Bayu Oktara',
  'Fahrizal Fery Utama',
  'Jamal Dwi Andika',
] // 12 orang

export const PROMOTION_CANDIDATES: string[] = ['Dzaky Almer Rafif', 'Ibra Muhammad']

// All 35 students combined
export const ALL_35_STUDENTS: string[] = [...POOL_1, ...POOL_2, ...POOL_3]

export interface GroupMember {
  name: string
  timestamp: string
  isPromoted?: boolean
}

export interface GroupData {
  id: string
  name: string
  capacity: number
  color: string
  members: GroupMember[]
}

export interface GroupColorTheme {
  color: string       // Primary Accent (status dot, left border strip, active ring)
  name: string        // Semantic color name
  border: string      // Light mode container border
  bg: string          // Light mode subtle tinted background
  text: string        // Light mode high-contrast text label (WCAG AAA >= 7:1)
  darkBg: string      // Dark mode subtle tinted background
  darkBorder: string  // Dark mode subtle border
  darkText: string    // Dark mode high-contrast text label
}

// World-Class Anti-Slop 10-Group Design System (Apple/Linear/Stripe Standard)
export const GROUP_PALETTE: GroupColorTheme[] = [
  { color: '#2563EB', name: 'Blue',    border: '#BFDBFE', bg: '#EFF6FF', text: '#1E40AF', darkBg: '#111F38', darkBorder: '#1E3A8A', darkText: '#93C5FD' },
  { color: '#059669', name: 'Emerald', border: '#A7F3D0', bg: '#ECFDF5', text: '#065F46', darkBg: '#0E261E', darkBorder: '#064E3B', darkText: '#6EE7B7' },
  { color: '#D97706', name: 'Amber',   border: '#FDE68A', bg: '#FFFBEB', text: '#78350F', darkBg: '#291E10', darkBorder: '#78350F', darkText: '#FCD34D' },
  { color: '#DC2626', name: 'Ruby',    border: '#FECACA', bg: '#FEF2F2', text: '#991B1B', darkBg: '#2A1417', darkBorder: '#7F1D1D', darkText: '#FCA5A5' },
  { color: '#7C3AED', name: 'Violet',  border: '#DDD6FE', bg: '#F5F3FF', text: '#5B21B6', darkBg: '#1E1835', darkBorder: '#4C1D95', darkText: '#C4B5FD' },
  { color: '#0D9488', name: 'Teal',    border: '#99F6E4', bg: '#F0FDFA', text: '#115E59', darkBg: '#0E2525', darkBorder: '#134E4A', darkText: '#5EEAD4' },
  { color: '#DB2777', name: 'Rose',    border: '#FBCFE8', bg: '#FDF2F8', text: '#9D174D', darkBg: '#2B1423', darkBorder: '#831843', darkText: '#F9A8D4' },
  { color: '#EA580C', name: 'Orange',  border: '#FED7AA', bg: '#FFF7ED', text: '#7C2D12', darkBg: '#2B1A12', darkBorder: '#7C2D12', darkText: '#FDBA74' },
  { color: '#4F46E5', name: 'Indigo',  border: '#C7D2FE', bg: '#EEF2FF', text: '#3730A3', darkBg: '#171A38', darkBorder: '#312E81', darkText: '#A5B4FC' },
  { color: '#0284C7', name: 'Sky',     border: '#BAE6FD', bg: '#F0F9FF', text: '#075985', darkBg: '#0C2336', darkBorder: '#075985', darkText: '#7DD3FC' },
]

/**
 * Default 6 groups strictly following the 35 participants rules:
 * Groups A to E: 6 members each
 * Group F: 5 members
 */
export const INITIAL_RULE_GROUPS: GroupData[] = [
  { id: 'A', name: 'Kelompok A', capacity: 6, color: GROUP_PALETTE[0].color, members: [] },
  { id: 'B', name: 'Kelompok B', capacity: 6, color: GROUP_PALETTE[1].color, members: [] },
  { id: 'C', name: 'Kelompok C', capacity: 6, color: GROUP_PALETTE[2].color, members: [] },
  { id: 'D', name: 'Kelompok D', capacity: 6, color: GROUP_PALETTE[3].color, members: [] },
  { id: 'E', name: 'Kelompok E', capacity: 6, color: GROUP_PALETTE[4].color, members: [] },
  { id: 'F', name: 'Kelompok F', capacity: 5, color: GROUP_PALETTE[5].color, members: [] },
]
