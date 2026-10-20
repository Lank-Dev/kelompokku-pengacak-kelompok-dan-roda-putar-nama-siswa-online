/**
 * Core Engine for Minimalist Group Spinner Wheel.
 * Supports:
 * 1. Clean name parsing with hidden prefix number stripping (e.g., "1. Adika Ramzi" -> "Adika Ramzi").
 * 2. Silent secret mode detection (triggered when numbers 1, 2, 3 and Dzaky & Ibra exist).
 * 3. Secret mode fair-split algorithm with strict separation of group 1 members.
 * 4. Normal mode unbiased random split.
 */

export interface ParsedParticipant {
  raw: string
  name: string
  groupNum: number | null
}

export interface GroupResult {
  id: number
  name: string
  capacity: number
  members: string[]
}

export interface EngineSetup {
  isSecretMode: boolean
  totalCount: number
  groupCount: number
  groups: GroupResult[]
  // In secret mode: priority names for the initial groups
  priorityNames: string[]
  // In secret mode: remaining names for subsequent groups
  remainingNames: string[]
  // All clean names in list
  allNames: string[]
  // Secretly promoted person (if secret mode)
  promotedPerson: string | null
  // In secret mode: randomized group indices where priority students are placed
  secretGroupIndices: number[]
}

/**
 * Master Reference Pools for the 35 students.
 * Allows secret mode to activate whether pasted with "1. Name" or just raw "Name".
 */
export const MASTER_POOL_1 = [
  'adika ramzi',
  'm. gilank putra ramadhan',
  'm gilank putra ramadhan',
  'muhammad gilank putra ramadhan',
  'nayaka nur zaky',
  'shalahuddin yusuf azka',
  'aila putri noviyan',
  'dirlha hainnun ningsih',
  'hafizal gustyo pratama',
  'neyna hendriani liu',
  'syahrul salam',
  'muhammad haikal',
  'ardilla putri wulansari',
]

export const MASTER_POOL_2 = [
  'daffa putra gemilang',
  "muhammad akbar ar'rafa",
  'muhammad akbar arrafa',
  'alfino fazrurachman',
  'dzaky almer rafif',
  'ibra muhammad',
  'pauziah lestari',
  'fahril ilham',
  'inayah nur azizah',
  'rafiq fadhil fathin',
  'zidane adlyndra assami',
  'muhammad zainal abidin',
  'raka apriansyah',
]

export const MASTER_POOL_3 = [
  'fatah rezky al gyfari',
  'kamal al-fathir iskandar',
  'nava olivia',
  'riyan ade geandra',
  'ahmad daniel ghifari',
  'dimas wahyu setiyawan',
  'fatur rahman al-ghozy',
  'vani oktaviani',
  'muhammad nur asyifa',
  'bayu oktara',
  'fahrizal fery utama',
  'jamal dwi andika',
]

/**
 * Normalizes string for reliable comparison (case-insensitive, trims quotes and spaces)
 */
export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses raw multiline text into clean participant entries.
 * Handles prefixes like "1. Name", "1 Name", "1 - Name", "1) Name", or just "Name".
 * Automatically maps to master pools 1, 2, or 3 if names match.
 */
export function parseParticipants(rawText: string): ParsedParticipant[] {
  const lines = rawText.split(/\r?\n/)
  const result: ParsedParticipant[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let cleanName = trimmed
    let groupNum: number | null = null

    // Regex checking optional leading number followed by punctuation or whitespace
    const match = trimmed.match(/^(\d+)[.)\-:\s]+(.*)$/)
    if (match) {
      groupNum = parseInt(match[1], 10)
      cleanName = match[2].trim()
    }

    if (!cleanName) continue

    // If no prefix number, check master pools
    if (groupNum === null) {
      const norm = normalizeName(cleanName)
      if (MASTER_POOL_1.includes(norm)) {
        groupNum = 1
      } else if (MASTER_POOL_2.includes(norm)) {
        groupNum = 2
      } else if (MASTER_POOL_3.includes(norm)) {
        groupNum = 3
      }
    }

    result.push({
      raw: trimmed,
      name: cleanName,
      groupNum,
    })
  }

  return result
}

/**
 * Checks if the secret mode conditions are met:
 * 1. Contains group 1 participants.
 * 2. "Dzaky Almer Rafif" and "Ibra Muhammad" are both in the list.
 */
export function checkSecretMode(participants: ParsedParticipant[]): boolean {
  let hasNum1 = false
  let hasDzaky = false
  let hasIbra = false

  for (const p of participants) {
    if (p.groupNum === 1) hasNum1 = true

    const norm = normalizeName(p.name)
    if (norm === 'dzaky almer rafif') hasDzaky = true
    if (norm === 'ibra muhammad') hasIbra = true
  }

  return hasNum1 && hasDzaky && hasIbra
}

/**
 * Shuffles an array immutably using Fisher-Yates.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

/**
 * Sets up the engine for either Secret Mode or Normal Mode.
 */
export function setupEngine(rawText: string, targetGroupCount: number): EngineSetup {
  const participants = parseParticipants(rawText)
  const totalCount = participants.length
  const groupCount = Math.max(2, Math.min(20, targetGroupCount || 6))
  const allNames = participants.map((p) => p.name)

  const isSecretMode = checkSecretMode(participants)

  if (!isSecretMode) {
    // Normal Mode: standard balanced distribution
    const baseCap = Math.floor(totalCount / groupCount)
    const remainder = totalCount % groupCount

    const groups: GroupResult[] = Array.from({ length: groupCount }, (_, i) => ({
      id: i + 1,
      name: `Kelompok ${i + 1}`,
      capacity: i < remainder ? baseCap + 1 : baseCap,
      members: [],
    }))

    return {
      isSecretMode: false,
      totalCount,
      groupCount,
      groups,
      priorityNames: [],
      remainingNames: shuffleArray(allNames),
      allNames,
      promotedPerson: null,
      secretGroupIndices: [],
    }
  }

  // =========================================================================
  // SECRET MODE
  // =========================================================================
  const pool1 = participants.filter((p) => p.groupNum === 1).map((p) => p.name)

  // Find promotion candidates
  const dzakyCandidate = participants.find(
    (p) => normalizeName(p.name) === 'dzaky almer rafif'
  )
  const ibraCandidate = participants.find(
    (p) => normalizeName(p.name) === 'ibra muhammad'
  )

  // Silently choose one to promote
  const promoteDzaky = Math.random() < 0.5
  const promotedPerson = promoteDzaky
    ? dzakyCandidate?.name || 'Dzaky Almer Rafif'
    : ibraCandidate?.name || 'Ibra Muhammad'

  const unchosenCandidate = promoteDzaky
    ? ibraCandidate?.name || 'Ibra Muhammad'
    : dzakyCandidate?.name || 'Dzaky Almer Rafif'

  // Priority pool: All pool 1 members + the chosen promoted person
  const priorityNames = shuffleArray([...pool1, promotedPerson])
  const priorityCount = priorityNames.length // Typically 11 + 1 = 12

  // Remaining pool: The unchosen candidate + remaining pool 2 + pool 3 + others
  const remainingCandidates: string[] = []
  if (unchosenCandidate) {
    remainingCandidates.push(unchosenCandidate)
  }

  for (const p of participants) {
    // Exclude pool 1 and both candidates (they are already handled)
    if (p.groupNum === 1) continue
    const norm = normalizeName(p.name)
    if (norm === 'dzaky almer rafif' || norm === 'ibra muhammad') continue
    remainingCandidates.push(p.name)
  }

  const remainingNames = shuffleArray(remainingCandidates)

  // Compute capacities:
  // For standard 35 students in 6 groups:
  // Groups 1 to 5 each have capacity 6, Group 6 has capacity 5.
  // The 12 priority students are allocated to ANY 2 groups randomly chosen among Groups 1 to 5!
  let groups: GroupResult[] = []
  let secretGroupIndices: number[] = []

  if (totalCount === 35 && groupCount === 6) {
    groups = [
      { id: 1, name: 'Kelompok 1', capacity: 6, members: [] },
      { id: 2, name: 'Kelompok 2', capacity: 6, members: [] },
      { id: 3, name: 'Kelompok 3', capacity: 6, members: [] },
      { id: 4, name: 'Kelompok 4', capacity: 6, members: [] },
      { id: 5, name: 'Kelompok 5', capacity: 6, members: [] },
      { id: 6, name: 'Kelompok 6', capacity: 5, members: [] },
    ]
    // Randomly pick 2 distinct groups with capacity 6 (indices 0 to 4: Kelompok 1 to 5)
    const eligibleIndices = [0, 1, 2, 3, 4]
    secretGroupIndices = shuffleArray(eligibleIndices).slice(0, 2).sort((a, b) => a - b)
  } else {
    // Dynamic calculation:
    // Determine how many groups are needed for priority pool
    const numPriorityGroups = Math.max(1, Math.min(groupCount - 1, Math.round(priorityCount / (totalCount / groupCount))))
    const basePriorityCap = Math.floor(priorityCount / numPriorityGroups)
    const remPriority = priorityCount % numPriorityGroups

    const priorityCaps = Array.from({ length: numPriorityGroups }, (_, i) =>
      i < remPriority ? basePriorityCap + 1 : basePriorityCap
    )

    const remainingGroupsCount = Math.max(1, groupCount - numPriorityGroups)
    const remainingCount = remainingNames.length
    const baseRemCap = Math.floor(remainingCount / remainingGroupsCount)
    const remRem = remainingCount % remainingGroupsCount

    const remainingCaps = Array.from({ length: remainingGroupsCount }, (_, i) =>
      i < remRem ? baseRemCap + 1 : baseRemCap
    )

    const allCaps = [...priorityCaps, ...remainingCaps]

    groups = allCaps.map((cap, i) => ({
      id: i + 1,
      name: `Kelompok ${i + 1}`,
      capacity: Math.max(1, cap),
      members: [],
    }))

    secretGroupIndices = Array.from({ length: numPriorityGroups }, (_, i) => i)
  }

  return {
    isSecretMode: true,
    totalCount,
    groupCount,
    groups,
    priorityNames,
    remainingNames,
    allNames,
    promotedPerson,
    secretGroupIndices,
  }
}

/**
 * Default sample dataset (35 students from user prompt)
 */
export const DEFAULT_RAW_STUDENTS = `1. Adika Ramzi
1. M. Gilank Putra Ramadhan
1. Nayaka Nur Zaky
1. Shalahuddin Yusuf Azka
1. Aila Putri Noviyan
1. Dirlha Hainnun Ningsih
1. Hafizal Gustyo Pratama
1. Neyna Hendriani Liu
1. Syahrul Salam
1. Muhammad Haikal
1. Ardilla Putri Wulansari
2. Daffa Putra Gemilang
2. Muhammad Akbar Ar’rafa
2. Alfino Fazrurachman
2. Dzaky Almer Rafif
2. Ibra Muhammad
2. Pauziah Lestari
2. Fahril Ilham
2. Inayah Nur Azizah
2. Rafiq Fadhil Fathin
2. Zidane Adlyndra Assami
2. Muhammad Zainal Abidin
2. Raka Apriansyah
3. Fatah Rezky Al Gyfari
3. Kamal Al-Fathir Iskandar
3. Nava Olivia
3. Riyan Ade Geandra
3. Ahmad Daniel Ghifari
3. Dimas Wahyu Setiyawan
3. Fatur Rahman Al-Ghozy
3. Vani Oktaviani
3. Muhammad Nur Asyifa
3. Bayu Oktara
3. Fahrizal Fery Utama
3. Jamal Dwi Andika`
