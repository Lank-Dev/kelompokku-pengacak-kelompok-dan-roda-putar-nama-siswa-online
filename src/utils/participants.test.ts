import { describe, it, expect } from 'vitest'
import {
  POOL_1,
  POOL_2,
  POOL_3,
  ALL_35_STUDENTS,
  PROMOTION_CANDIDATES,
  detectSmartRules,
  buildInitialGroups,
} from './participants'
import {
  determineDividerMode,
  initEngine,
  stepSpinEngine,
} from './groupEngine'

describe('Smart Rules Detection & Group Building', () => {
  it('correctly identifies the default 35 participants as smart rules', () => {
    expect(POOL_1).toHaveLength(11)
    expect(POOL_2).toHaveLength(12)
    expect(POOL_3).toHaveLength(12)
    expect(PROMOTION_CANDIDATES).toEqual(['Dzaky Almer Rafif', 'Ibra Muhammad'])
    const analysis = detectSmartRules(ALL_35_STUDENTS)
    expect(analysis.isSmart).toBe(true)
    expect(analysis.pool1Members.length).toBe(11)
    expect(analysis.promoCandidates.length).toBe(2)
    expect(analysis.totalRecognized).toBe(35)
  })

  it('triggers smart rules when additional custom names are added to the 35 participants', () => {
    const customList = [...ALL_35_STUDENTS, 'Budi Santoso', 'Siti Rahma']
    const analysis = detectSmartRules(customList)
    expect(analysis.isSmart).toBe(true)
    expect(analysis.customMembers).toEqual(['Budi Santoso', 'Siti Rahma'])
    expect(analysis.promoCandidates.length).toBe(2)
  })

  it('detects regular mode when list has completely custom names', () => {
    const randomStudents = [
      'Budi Santoso',
      'Siti Nurhaliza',
      'Andi Wijaya',
      'Dewi Sartika',
      'Eko Prasetyo',
      'Fajar Nugraha',
      'Gita Gutawa',
      'Hendra Setiawan',
      'Indah Permatasari',
      'Joko Anwar',
      'Kartika Putri',
      'Lukman Sardi',
    ]
    const analysis = detectSmartRules(randomStudents)
    expect(analysis.isSmart).toBe(false)
    expect(analysis.pool1Members.length).toBe(0)
    expect(analysis.promoCandidates.length).toBe(0)
    expect(analysis.totalRecognized).toBe(0)
  })

  it('builds initial groups for smart rules with 35 participants (A:6, B:6, C:6, D:6, E:6, F:5)', () => {
    const groups = buildInitialGroups(35, true)
    expect(groups).toHaveLength(6)
    expect(groups.map((g) => g.capacity)).toEqual([6, 6, 6, 6, 6, 5])
    expect(groups.reduce((acc, g) => acc + g.capacity, 0)).toBe(35)
  })

  it('builds initial groups for smart rules with 36 participants (A:6, B:6, C:6, D:6, E:6, F:6)', () => {
    const groups = buildInitialGroups(36, true)
    expect(groups).toHaveLength(6)
    expect(groups.map((g) => g.capacity)).toEqual([6, 6, 6, 6, 6, 6])
    expect(groups.reduce((acc, g) => acc + g.capacity, 0)).toBe(36)
  })

  it('builds initial groups for regular mode with 24 participants (A:4, B:4, C:4, D:4, E:4, F:4)', () => {
    const groups = buildInitialGroups(24, false)
    expect(groups).toHaveLength(6)
    expect(groups.map((g) => g.capacity)).toEqual([4, 4, 4, 4, 4, 4])
    expect(groups.reduce((acc, g) => acc + g.capacity, 0)).toBe(24)
  })

  it('builds initial groups for regular mode with 25 participants (A:5, B:4, C:4, D:4, E:4, F:4)', () => {
    const groups = buildInitialGroups(25, false)
    expect(groups).toHaveLength(6)
    expect(groups.map((g) => g.capacity)).toEqual([5, 4, 4, 4, 4, 4])
    expect(groups.reduce((acc, g) => acc + g.capacity, 0)).toBe(25)
  })
})

describe('Smart Rules with Extra Participants (Rule Mutlak Verification)', () => {
  it('When 35 participants have extra names appended, extra names are routed to Stage 3 and NEVER enter Group A or B', () => {
    const listWithExtras = [...ALL_35_STUDENTS, 'Peserta Tambahan 1', 'Peserta Tambahan 2']
    expect(determineDividerMode(listWithExtras)).toBe('rule_35')

    let state = initEngine(listWithExtras, 6)
    expect(state.mode).toBe('rule_35')
    expect(state.stage).toBe('STAGE_1_PROMOTION')
    expect(state.wheelItems).toEqual(['Dzaky Almer Rafif', 'Ibra Muhammad'])

    // Stage 1: Dzaky wins
    state = stepSpinEngine(state, 'Dzaky Almer Rafif')
    expect(state.stage).toBe('STAGE_2_GROUPS_AB')

    // Stage 2: 12 members fill A & B
    while (state.stage === 'STAGE_2_GROUPS_AB') {
      state = stepSpinEngine(state)
    }

    const groupA = state.groups.find((g) => g.id === 'A')!
    const groupB = state.groups.find((g) => g.id === 'B')!
    expect(groupA.members).toHaveLength(6)
    expect(groupB.members).toHaveLength(6)

    const membersAB = [...groupA.members, ...groupB.members].map((m) => m.name)
    expect(membersAB).not.toContain('Peserta Tambahan 1')
    expect(membersAB).not.toContain('Peserta Tambahan 2')

    // Stage 3: Wheel items must contain the extra participants + unchosen Ibra + remaining pool 2 + pool 3
    expect(state.stage).toBe('STAGE_3_GROUPS_CDEF')
    expect(state.wheelItems).toContain('Peserta Tambahan 1')
    expect(state.wheelItems).toContain('Peserta Tambahan 2')
    expect(state.wheelItems).toContain('Ibra Muhammad')
    expect(state.wheelItems).not.toContain('Dzaky Almer Rafif')
    expect(state.wheelItems).toHaveLength(25) // 23 standard remaining + 2 extras = 25

    // Run until completion
    while (state.stage !== 'COMPLETED') {
      state = stepSpinEngine(state)
    }

    expect(state.stage).toBe('COMPLETED')
    const totalAllocated = state.groups.reduce((sum, g) => sum + g.members.length, 0)
    expect(totalAllocated).toBe(37) // 35 + 2 = 37

    const membersCDEF = state.groups
      .filter((g) => ['C', 'D', 'E', 'F'].includes(g.id))
      .flatMap((g) => g.members.map((m) => m.name))

    expect(membersCDEF).toContain('Peserta Tambahan 1')
    expect(membersCDEF).toContain('Peserta Tambahan 2')
  })
})
