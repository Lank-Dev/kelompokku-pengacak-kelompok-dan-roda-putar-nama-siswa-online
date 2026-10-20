import {
  POOL_1,
  POOL_2,
  POOL_3,
  PROMOTION_CANDIDATES,
  ALL_35_STUDENTS,
  GROUP_PALETTE,
  normalizeName,
  detectSmartRules,
  buildInitialGroups,
  type GroupData,
  type GroupMember,
} from './participants'

export type DividerStage =
  | 'STAGE_1_PROMOTION' // Wheel: Dzaky vs Ibra (1 winner promoted to Groups A & B pool)
  | 'STAGE_2_GROUPS_AB' // Wheel: 11 Pool 1 + 1 Promoted (12 people) -> Fills A (6) then B (6)
  | 'STAGE_3_GROUPS_CDEF' // Wheel: 23+ Remaining -> Fills C (6), D (6), E (6), F (5+)
  | 'CUSTOM_RANDOM' // Custom list: Balanced random division into N groups without special priority
  | 'COMPLETED'

export type DividerMode = 'rule_35' | 'custom'

export interface WinnerEvent {
  name: string
  note: string
  isPromotion?: boolean
  groupColor?: string
  timestamp: string
}

export interface GroupEngineState {
  mode: DividerMode
  stage: DividerStage
  promotedStudent: string | null
  groups: GroupData[]
  wheelItems: string[]
  recentWinner: WinnerEvent | null
  allParticipants: string[]
}

/**
 * Creates balanced groups dynamically for any group count (1-10).
 * For example:
 * - 10 students into 3 groups -> [4, 3, 3]
 * - 10 students into 6 groups -> [2, 2, 2, 2, 1, 1]
 */
export function createBalancedGroups(groupCount: number, totalStudents: number): GroupData[] {
  const count = Math.max(1, Math.min(10, groupCount))
  const safeTotal = Math.max(1, totalStudents)
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

/**
 * Check if the input name list matches the standard 35 students set.
 */
export function isStandard35Students(names: string[]): boolean {
  if (names.length !== 35) return false
  const nameSet = new Set(names.map((n) => normalizeName(n)))
  const all35 = ALL_35_STUDENTS.map((n) => normalizeName(n))
  return all35.every((name) => nameSet.has(name))
}

/**
 * Determine which mode to use based on the input names.
 * Uses smart detection: if list contains the master Nomor 1, 2, 3 dataset
 * (even if extra names are appended), returns 'rule_35'.
 * If the names are completely custom/different, returns 'custom'.
 */
export function determineDividerMode(names: string[]): DividerMode {
  const analysis = detectSmartRules(names)
  return analysis.isSmart ? 'rule_35' : 'custom'
}

/**
 * Initializes the engine state for the 35 participants priority rules.
 * Supports extra appended custom participants if provided.
 */
export function init35StudentsEngine(customNames?: string[]): GroupEngineState {
  const cleanParticipants = customNames && customNames.length > 0
    ? customNames.map((n) => n.trim()).filter((n) => n.length > 0)
    : [...ALL_35_STUDENTS]

  const initialGroups = buildInitialGroups(cleanParticipants.length, true)

  return {
    mode: 'rule_35',
    stage: 'STAGE_1_PROMOTION',
    promotedStudent: null,
    groups: initialGroups,
    wheelItems: [...PROMOTION_CANDIDATES],
    recentWinner: null,
    allParticipants: cleanParticipants,
  }
}

/**
 * Initializes the engine state for a custom list of names (random balanced division).
 */
export function initCustomEngine(names: string[], groupCount: number = 6): GroupEngineState {
  const cleanNames = names.map((n) => n.trim()).filter((n) => n.length > 0)
  const groups = createBalancedGroups(groupCount, cleanNames.length)

  return {
    mode: 'custom',
    stage: cleanNames.length === 0 ? 'COMPLETED' : 'CUSTOM_RANDOM',
    promotedStudent: null,
    groups,
    wheelItems: [...cleanNames],
    recentWinner: null,
    allParticipants: [...cleanNames],
  }
}

/**
 * Auto-initializes the engine based on input names.
 * If names contain the 35 students pattern (Nomor 1, 2, 3), starts the smart rule engine.
 * Otherwise, starts the custom random division engine.
 */
export function initEngine(names?: string[], groupCount: number = 6): GroupEngineState {
  if (!names || names.length === 0) {
    return init35StudentsEngine()
  }

  const mode = determineDividerMode(names)
  if (mode === 'rule_35') {
    return init35StudentsEngine(names)
  }
  return initCustomEngine(names, groupCount)
}

/**
 * Gets the current active target group that is accepting members.
 */
export function getActiveTargetGroupId(state: GroupEngineState): string | null {
  if (state.stage === 'STAGE_1_PROMOTION' || state.stage === 'COMPLETED') {
    return null
  }

  if (state.stage === 'STAGE_2_GROUPS_AB') {
    const groupA = state.groups.find((g) => g.id === 'A')
    if (groupA && groupA.members.length < groupA.capacity) return 'A'
    const groupB = state.groups.find((g) => g.id === 'B')
    if (groupB && groupB.members.length < groupB.capacity) return 'B'
    return null
  }

  if (state.stage === 'STAGE_3_GROUPS_CDEF') {
    for (const gid of ['C', 'D', 'E', 'F'] as const) {
      const g = state.groups.find((grp) => grp.id === gid)
      if (g && g.members.length < g.capacity) return gid
    }
    return null
  }

  if (state.stage === 'CUSTOM_RANDOM') {
    const available = state.groups.find((g) => g.members.length < g.capacity)
    return available ? available.id : null
  }

  return null
}

/**
 * Executes a single spin step in the group division engine.
 *
 * @param state Current engine state
 * @param specificWinner Optional winner to force (for deterministic tests or user selection)
 * @param timestamp Optional timestamp string
 * @returns Next engine state
 */
export function stepSpinEngine(
  state: GroupEngineState,
  specificWinner?: string,
  timestamp: string = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
): GroupEngineState {
  if (state.stage === 'COMPLETED' || state.wheelItems.length === 0) {
    return { ...state, stage: 'COMPLETED' }
  }

  // 1. Pick winner
  let winner: string
  if (specificWinner !== undefined) {
    if (!state.wheelItems.includes(specificWinner)) {
      throw new Error(
        `Stage ${state.stage} violation: Specified winner "${specificWinner}" is not among active wheel items: [${state.wheelItems.join(', ')}]`
      )
    }
    winner = specificWinner
  } else {
    const randomIndex = Math.floor(Math.random() * state.wheelItems.length)
    winner = state.wheelItems[randomIndex]
  }

  // ==========================================
  // STAGE 1: PROMOTION DRAW (Dzaky vs Ibra)
  // ==========================================
  if (state.stage === 'STAGE_1_PROMOTION') {
    if (!PROMOTION_CANDIDATES.includes(winner)) {
      throw new Error(
        `Stage 1 violation: Winner "${winner}" is not a valid promotion candidate (${PROMOTION_CANDIDATES.join(
          ', '
        )})`
      )
    }

    // Stage 2 Pool: All Pool 1 members that exist in allParticipants (default 11) + the 1 promoted winner
    const pool1Found = state.allParticipants.filter((p) =>
      POOL_1.some((p1) => normalizeName(p1) === normalizeName(p))
    )
    const stage2Items = [...pool1Found, winner]

    return {
      ...state,
      stage: 'STAGE_2_GROUPS_AB',
      promotedStudent: winner,
      wheelItems: stage2Items,
      recentWinner: {
        name: winner,
        note: 'Terpilih Naik ke Kelompok A & B!',
        isPromotion: true,
        groupColor: '#D97706',
        timestamp,
      },
    }
  }

  // ==========================================
  // STAGE 2: GROUPS A & B (12 People)
  // ==========================================
  if (state.stage === 'STAGE_2_GROUPS_AB') {
    const targetGid = getActiveTargetGroupId(state)
    if (!targetGid) {
      throw new Error('Stage 2 violation: No available capacity in Group A or B')
    }

    const currentTarget = state.groups.find((g) => g.id === targetGid)!
    const isPromo = winner === state.promotedStudent
    const newMember: GroupMember = {
      name: winner,
      timestamp,
      isPromoted: isPromo,
    }

    const updatedGroups = state.groups.map((g) =>
      g.id === targetGid
        ? { ...g, members: [...g.members, newMember] }
        : g
    )

    const nextWheelItems = state.wheelItems.filter((item) => item !== winner)

    // Check if Groups A & B are now full (12 members allocated)
    const totalAB = updatedGroups
      .filter((g) => g.id === 'A' || g.id === 'B')
      .reduce((sum, g) => sum + g.members.length, 0)

    if (totalAB >= 12) {
      // Transition to Stage 3: Remaining Participants (Pool 2 remainder + Pool 3 + extra custom names)
      const unchosenCandidate = PROMOTION_CANDIDATES.find(
        (c) => c !== state.promotedStudent
      )
      const remainingPool2 = POOL_2.filter(
        (p) => p !== state.promotedStudent && p !== unchosenCandidate
      )
      // Custom members in state.allParticipants that are not in pool 1, 2, 3
      const customMembers = state.allParticipants.filter(
        (p) => !ALL_35_STUDENTS.some((s) => normalizeName(s) === normalizeName(p))
      )
      const stage3Students = [
        ...(unchosenCandidate ? [unchosenCandidate] : []),
        ...remainingPool2,
        ...POOL_3,
        ...customMembers,
      ]

      return {
        ...state,
        stage: 'STAGE_3_GROUPS_CDEF',
        groups: updatedGroups,
        wheelItems: stage3Students,
        recentWinner: {
          name: winner,
          note: `Masuk ke ${currentTarget.name}`,
          isPromotion: isPromo,
          groupColor: currentTarget.color,
          timestamp,
        },
      }
    }

    return {
      ...state,
      groups: updatedGroups,
      wheelItems: nextWheelItems,
      recentWinner: {
        name: winner,
        note: `Masuk ke ${currentTarget.name}`,
        isPromotion: isPromo,
        groupColor: currentTarget.color,
        timestamp,
      },
    }
  }

  // ==========================================
  // STAGE 3: GROUPS C, D, E & F (23+ People)
  // ==========================================
  if (state.stage === 'STAGE_3_GROUPS_CDEF') {
    const targetGid = getActiveTargetGroupId(state)
    if (!targetGid) {
      throw new Error('Stage 3 violation: No available capacity in Groups C, D, E, or F')
    }

    const currentTarget = state.groups.find((g) => g.id === targetGid)!
    const newMember: GroupMember = {
      name: winner,
      timestamp,
    }

    const updatedGroups = state.groups.map((g) =>
      g.id === targetGid
        ? { ...g, members: [...g.members, newMember] }
        : g
    )

    const nextWheelItems = state.wheelItems.filter((item) => item !== winner)
    const totalAllocated = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)

    if (totalAllocated >= state.allParticipants.length || nextWheelItems.length === 0) {
      return {
        ...state,
        stage: 'COMPLETED',
        groups: updatedGroups,
        wheelItems: [],
        recentWinner: {
          name: winner,
          note: `Masuk ke ${currentTarget.name}`,
          groupColor: currentTarget.color,
          timestamp,
        },
      }
    }

    return {
      ...state,
      groups: updatedGroups,
      wheelItems: nextWheelItems,
      recentWinner: {
        name: winner,
        note: `Masuk ke ${currentTarget.name}`,
        groupColor: currentTarget.color,
        timestamp,
      },
    }
  }

  // ==========================================
  // CUSTOM RANDOM MODE (Arbitrary Names)
  // ==========================================
  if (state.stage === 'CUSTOM_RANDOM') {
    const targetGid = getActiveTargetGroupId(state)
    if (!targetGid) {
      return {
        ...state,
        stage: 'COMPLETED',
        wheelItems: [],
      }
    }

    const currentTarget = state.groups.find((g) => g.id === targetGid)!
    const newMember: GroupMember = {
      name: winner,
      timestamp,
    }

    const updatedGroups = state.groups.map((g) =>
      g.id === targetGid
        ? { ...g, members: [...g.members, newMember] }
        : g
    )

    const nextWheelItems = state.wheelItems.filter((item) => item !== winner)
    const totalAllocated = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)
    const isFinished = totalAllocated >= state.allParticipants.length || nextWheelItems.length === 0

    return {
      ...state,
      stage: isFinished ? 'COMPLETED' : 'CUSTOM_RANDOM',
      groups: updatedGroups,
      wheelItems: isFinished ? [] : nextWheelItems,
      recentWinner: {
        name: winner,
        note: `Masuk ke ${currentTarget.name}`,
        groupColor: currentTarget.color,
        timestamp,
      },
    }
  }

  return state
}

/**
 * Runs a complete simulation of the 35 participants division process from start to finish.
 *
 * @param winnerPicker Optional callback to choose winner at each spin
 * @returns Final state and log of spin events
 */
export function simulate35Division(
  winnerPicker?: (stage: DividerStage, available: string[]) => string
): { finalState: GroupEngineState; history: WinnerEvent[] } {
  let state = init35StudentsEngine()
  const history: WinnerEvent[] = []

  let safetyCount = 0
  while (state.stage !== 'COMPLETED' && safetyCount < 100) {
    safetyCount++
    const stage = state.stage
    const available = state.wheelItems
    const chosen = winnerPicker ? winnerPicker(stage, available) : undefined

    state = stepSpinEngine(state, chosen)
    if (state.recentWinner) {
      history.push(state.recentWinner)
    }
  }

  return { finalState: state, history }
}

/**
 * Runs a complete simulation of the custom random group division from start to finish.
 *
 * @param names Custom list of names
 * @param groupCount Number of groups (default 6)
 * @param winnerPicker Optional callback to pick winner at each spin
 */
export function simulateCustomDivision(
  names: string[],
  groupCount: number = 6,
  winnerPicker?: (stage: DividerStage, available: string[]) => string
): { finalState: GroupEngineState; history: WinnerEvent[] } {
  let state = initCustomEngine(names, groupCount)
  const history: WinnerEvent[] = []

  let safetyCount = 0
  while (state.stage !== 'COMPLETED' && safetyCount < 200) {
    safetyCount++
    const stage = state.stage
    const available = state.wheelItems
    const chosen = winnerPicker ? winnerPicker(stage, available) : undefined

    state = stepSpinEngine(state, chosen)
    if (state.recentWinner) {
      history.push(state.recentWinner)
    }
  }

  return { finalState: state, history }
}

/**
 * Rigorous Invariant Verification for 35 Students Division.
 * Tests all absolute business rules:
 * 1. Groups A-E have exactly 6 members, F has 5 members (Total 35).
 * 2. All 35 participants are unique and match the master list.
 * 3. Promoted candidate is either Dzaky or Ibra.
 * 4. Rule Mutlak: Groups A & B MUST ONLY contain POOL_1 (11 students) + the 1 promoted winner (Total 12).
 * 5. Rule Mutlak: Groups C, D, E & F MUST ONLY contain POOL_2 (remaining 11) + POOL_3 (12) = 23 students.
 * 6. Rule Mutlak: ZERO POOL_1 members in C, D, E, or F.
 * 7. Rule Mutlak: ZERO POOL_2 or POOL_3 members in A or B (except the 1 promoted winner).
 */
export function verify35DivisionInvariants(
  groups: GroupData[],
  promotedStudent: string | null
): { passed: boolean; violations: string[] } {
  const violations: string[] = []

  // 1. Group Count
  if (groups.length !== 6) {
    violations.push(`Expected 6 groups, found ${groups.length}`)
  }

  // 2. Capacities & Member Counts
  const expectedCapacities: Record<string, number> = {
    A: 6,
    B: 6,
    C: 6,
    D: 6,
    E: 6,
    F: 5,
  }

  for (const [gid, cap] of Object.entries(expectedCapacities)) {
    const grp = groups.find((g) => g.id === gid)
    if (!grp) {
      violations.push(`Missing group with id "${gid}"`)
    } else if (grp.members.length !== cap) {
      violations.push(
        `Group ${gid} has ${grp.members.length} members; expected exact capacity ${cap}`
      )
    }
  }

  // 3. Total Participants
  const allAssigned = groups.flatMap((g) => g.members.map((m) => m.name))
  if (allAssigned.length !== 35) {
    violations.push(`Expected total 35 assigned participants, got ${allAssigned.length}`)
  }

  // 4. Uniqueness
  const uniqueAssigned = new Set(allAssigned)
  if (uniqueAssigned.size !== allAssigned.length) {
    violations.push(
      `Duplicate names detected in groups: ${allAssigned.length - uniqueAssigned.size} duplicate entries`
    )
  }

  // 5. Promoted Student Identity
  if (!promotedStudent || !PROMOTION_CANDIDATES.includes(promotedStudent)) {
    violations.push(
      `Invalid promoted student "${promotedStudent}". Must be one of: ${PROMOTION_CANDIDATES.join(
        ', '
      )}`
    )
  }

  // 6. Partition Check: Groups A & B vs Groups C, D, E, F
  const groupA = groups.find((g) => g.id === 'A')?.members.map((m) => m.name) || []
  const groupB = groups.find((g) => g.id === 'B')?.members.map((m) => m.name) || []
  const groupAB = new Set([...groupA, ...groupB])

  const groupC = groups.find((g) => g.id === 'C')?.members.map((m) => m.name) || []
  const groupD = groups.find((g) => g.id === 'D')?.members.map((m) => m.name) || []
  const groupE = groups.find((g) => g.id === 'E')?.members.map((m) => m.name) || []
  const groupF = groups.find((g) => g.id === 'F')?.members.map((m) => m.name) || []
  const groupCDEF = new Set([...groupC, ...groupD, ...groupE, ...groupF])

  // Invariant 6a: ALL 11 Pool 1 members MUST be in A or B
  for (const p1 of POOL_1) {
    if (!groupAB.has(p1)) {
      violations.push(`Pool 1 student "${p1}" is NOT in Group A or B!`)
    }
    if (groupCDEF.has(p1)) {
      violations.push(`RULE VIOLATION: Pool 1 student "${p1}" leaked into Group C, D, E, or F!`)
    }
  }

  // Invariant 6b: Promoted student MUST be in A or B
  if (promotedStudent && !groupAB.has(promotedStudent)) {
    violations.push(
      `RULE VIOLATION: Promoted student "${promotedStudent}" is NOT in Group A or B!`
    )
  }
  if (promotedStudent && groupCDEF.has(promotedStudent)) {
    violations.push(
      `RULE VIOLATION: Promoted student "${promotedStudent}" leaked into Group C, D, E, or F!`
    )
  }

  // Invariant 6c: EXACTLY 12 students in A & B combined
  if (groupAB.size !== 12) {
    violations.push(
      `Groups A & B combined must have exactly 12 members, found ${groupAB.size}`
    )
  }

  // Invariant 6d: NO non-promoted Pool 2 student in A or B
  for (const p2 of POOL_2) {
    if (p2 === promotedStudent) continue
    if (groupAB.has(p2)) {
      violations.push(
        `RULE VIOLATION: Non-promoted Pool 2 student "${p2}" improperly placed in Group A or B!`
      )
    }
    if (!groupCDEF.has(p2)) {
      violations.push(
        `Non-promoted Pool 2 student "${p2}" is missing from Groups C, D, E, or F!`
      )
    }
  }

  // Invariant 6e: NO Pool 3 student in A or B
  for (const p3 of POOL_3) {
    if (groupAB.has(p3)) {
      violations.push(
        `RULE VIOLATION: Pool 3 student "${p3}" improperly placed in Group A or B!`
      )
    }
    if (!groupCDEF.has(p3)) {
      violations.push(
        `Pool 3 student "${p3}" is missing from Groups C, D, E, or F!`
      )
    }
  }

  // Invariant 6f: EXACTLY 23 students in C, D, E, F combined
  if (groupCDEF.size !== 23) {
    violations.push(
      `Groups C, D, E & F combined must have exactly 23 members, found ${groupCDEF.size}`
    )
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}
