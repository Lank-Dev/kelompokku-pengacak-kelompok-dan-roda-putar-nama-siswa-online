// Master Data & Configuration for Group Divider

export const DEFAULT_STUDENTS: string[] = [
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
]

export interface GroupMember {
  name: string
  timestamp: string
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
  darkBg: string      // Dark mode subtle tinted background (Slate base + 12% hue)
  darkBorder: string  // Dark mode subtle border
  darkText: string    // Dark mode high-contrast text label (WCAG AAA >= 7:1)
}

// World-Class Anti-Slop 10-Group Design System (Apple/Linear/Stripe Standard)
// Verified 100% WCAG AAA (>= 7:1 contrast) in both Light & Dark modes
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

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

/**
 * Creates balanced groups dynamically for any group count between 1 and 10.
 * For example, 35 students into 6 groups yields capacities of [6, 6, 6, 6, 6, 5].
 */
export function createBalancedGroups(groupCount: number, totalStudents: number): GroupData[] {
  const count = Math.max(1, Math.min(10, groupCount))
  const safeTotal = Math.max(1, totalStudents)
  const baseCapacity = Math.floor(safeTotal / count)
  const remainder = safeTotal % count

  return Array.from({ length: count }, (_, i) => {
    const capacity = i < remainder ? baseCapacity + 1 : baseCapacity
    const label = GROUP_LABELS[i] || `${i + 1}`
    const palette = GROUP_PALETTE[i % GROUP_PALETTE.length]

    return {
      id: label,
      name: `Kelompok ${label}`,
      capacity: Math.max(1, capacity),
      color: palette.color,
      members: [],
    }
  })
}
