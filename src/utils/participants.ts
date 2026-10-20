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
 * Normalize names for fuzzy or standard string matching (handle curved quotes, double spaces)
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/[\s\t\n]+/g, ' ')
}

export interface SmartRulesAnalysis {
  isSmart: boolean
  pool1Members: string[]
  pool2Members: string[]
  pool3Members: string[]
  promoCandidates: string[]
  customMembers: string[]
  totalRecognized: number
  reason: string
}

/**
 * Detects whether the given list contains the special master dataset (Nomor 1, 2, 3 + Promotion Candidates).
 * - If yes -> Strict Smart Priority Rules are triggered (3 Stages: Promotion -> AB -> CDEF).
 * - If no (completely custom names) -> Regular fair division applies directly to the wheel.
 */
export function detectSmartRules(names: string[]): SmartRulesAnalysis {
  const normPool1 = new Map(POOL_1.map((p) => [normalizeName(p), p]))
  const normPool2 = new Map(POOL_2.map((p) => [normalizeName(p), p]))
  const normPool3 = new Map(POOL_3.map((p) => [normalizeName(p), p]))
  const normPromo = new Map(PROMOTION_CANDIDATES.map((p) => [normalizeName(p), p]))

  const pool1Members: string[] = []
  const pool2Members: string[] = []
  const pool3Members: string[] = []
  const promoCandidates: string[] = []
  const customMembers: string[] = []

  names.forEach((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const key = normalizeName(trimmed)

    if (normPromo.has(key)) {
      promoCandidates.push(trimmed)
    } else if (normPool1.has(key)) {
      pool1Members.push(trimmed)
    } else if (normPool2.has(key)) {
      pool2Members.push(trimmed)
    } else if (normPool3.has(key)) {
      pool3Members.push(trimmed)
    } else {
      customMembers.push(trimmed)
    }
  })

  const totalRecognized =
    pool1Members.length + pool2Members.length + pool3Members.length + promoCandidates.length

  // Smart Rules activate when the list contains the promotion candidates (Dzaky & Ibra)
  // and significant members of Pool 1 and Pool 2/3 (or the majority of the 35 students).
  const hasBothCandidates = promoCandidates.length >= 2
  const hasSubstantialPool1 = pool1Members.length >= 4
  const hasSubstantialPool2Or3 = pool2Members.length + pool3Members.length >= 4

  const isSmart =
    (hasBothCandidates && hasSubstantialPool1 && hasSubstantialPool2Or3) ||
    totalRecognized >= 15

  let reason = ''
  if (isSmart) {
    reason = `Terdeteksi ${pool1Members.length} No.1, ${pool2Members.length} No.2, ${pool3Members.length} No.3, dan ${promoCandidates.length} kandidat promosi.`
  } else {
    reason = 'Daftar nama tidak mengandung pola 35 siswa (No. 1, 2, 3). Roda membagi kelompok secara acak biasa.'
  }

  return {
    isSmart,
    pool1Members,
    pool2Members,
    pool3Members,
    promoCandidates,
    customMembers,
    totalRecognized,
    reason,
  }
}

/**
 * Creates balanced initial groups for either Smart Rules or Regular Random Mode.
 * - In Smart Rules: Group A (6), Group B (6), and C, D, E, F distribute the remaining count (e.g. 23 -> 6, 6, 6, 5).
 * - In Regular Mode: Distributes totalCount evenly across groupCount groups.
 */
export function buildInitialGroups(
  totalCount = 35,
  isSmartRulesOrGroupCount: boolean | number = true,
  groupCount = 6
): GroupData[] {
  const safeTotal = Math.max(1, totalCount)
  const isSmartRules = typeof isSmartRulesOrGroupCount === 'boolean'
    ? isSmartRulesOrGroupCount
    : false
  const effectiveGroupCount = typeof isSmartRulesOrGroupCount === 'number'
    ? isSmartRulesOrGroupCount
    : groupCount

  if (isSmartRules) {
    // Stage 1 & 2: Group A and B have capacity 6 each (total 12)
    const capA = 6
    const capB = 6

    // Stage 3: Groups C, D, E, F distribute the remainder
    const remaining = Math.max(0, safeTotal - 12)
    const baseCDEF = Math.floor(remaining / 4)
    const remCDEF = remaining % 4

    const capC = baseCDEF + (remCDEF > 0 ? 1 : 0)
    const capD = baseCDEF + (remCDEF > 1 ? 1 : 0)
    const capE = baseCDEF + (remCDEF > 2 ? 1 : 0)
    const capF = baseCDEF

    const capacities = [capA, capB, capC, capD, capE, capF]

    return ['A', 'B', 'C', 'D', 'E', 'F'].map((id, index) => ({
      id,
      name: `Kelompok ${id}`,
      capacity: Math.max(1, capacities[index]),
      color: GROUP_PALETTE[index % GROUP_PALETTE.length].color,
      members: [],
    }))
  }

  // Regular Random Mode: Distribute evenly across effectiveGroupCount groups
  const count = Math.max(1, Math.min(10, effectiveGroupCount))
  const baseCapacity = Math.floor(safeTotal / count)
  const remainder = safeTotal % count

  return Array.from({ length: count }, (_, i) => {
    const capacity = i < remainder ? baseCapacity + 1 : baseCapacity
    const label = String.fromCharCode(65 + i) // 'A', 'B', 'C', ...
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

export const INITIAL_RULE_GROUPS: GroupData[] = buildInitialGroups(35, true)
