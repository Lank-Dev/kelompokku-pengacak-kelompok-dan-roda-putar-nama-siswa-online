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

// Curated Anti-Slop Palette: Professional, high-contrast, distinct
export const GROUP_PALETTE = [
  { color: '#DC2626', name: 'Ruby' },
  { color: '#D97706', name: 'Amber' },
  { color: '#059669', name: 'Emerald' },
  { color: '#0891B2', name: 'Teal' },
  { color: '#2563EB', name: 'Blue' },
  { color: '#7C3AED', name: 'Violet' },
  { color: '#DB2777', name: 'Rose' },
  { color: '#EA580C', name: 'Orange' },
  { color: '#4F46E5', name: 'Indigo' },
  { color: '#0284C7', name: 'Sky' },
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
      name: `Group ${label}`,
      capacity: Math.max(1, capacity),
      color: palette.color,
      members: [],
    }
  })
}
