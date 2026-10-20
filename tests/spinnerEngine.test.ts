import { describe, it, expect } from 'vitest'
import {
  parseParticipants,
  checkSecretMode,
  setupEngine,
  DEFAULT_RAW_STUDENTS,
  normalizeName,
} from '../src/utils/spinnerEngine'

describe('Minimalist Spinner Group Engine', () => {
  it('parses participants and strips number prefixes cleanly', () => {
    const raw = `1. Adika Ramzi\n2  Dzaky Almer Rafif\n3 - Fatah Rezky\nBudi Santoso`
    const parsed = parseParticipants(raw)

    expect(parsed).toHaveLength(4)
    expect(parsed[0]).toEqual({
      raw: '1. Adika Ramzi',
      name: 'Adika Ramzi',
      groupNum: 1,
    })
    expect(parsed[1]).toEqual({
      raw: '2  Dzaky Almer Rafif',
      name: 'Dzaky Almer Rafif',
      groupNum: 2,
    })
    expect(parsed[2]).toEqual({
      raw: '3 - Fatah Rezky',
      name: 'Fatah Rezky',
      groupNum: 3,
    })
    expect(parsed[3]).toEqual({
      raw: 'Budi Santoso',
      name: 'Budi Santoso',
      groupNum: null,
    })
  })

  it('detects secret mode correctly only when numbers 1, 2, 3 and Dzaky & Ibra are present', () => {
    // 1. Default 35 students -> must be true
    const parsed35 = parseParticipants(DEFAULT_RAW_STUDENTS)
    expect(checkSecretMode(parsed35)).toBe(true)

    // 2. Missing numbers (just clean names) -> must be false
    const withoutNumbers = parsed35.map((p) => p.name).join('\n')
    expect(checkSecretMode(parseParticipants(withoutNumbers))).toBe(false)

    // 3. Has numbers 1, 2, 3 but missing Dzaky & Ibra -> must be false
    const customWithNumbers = `1. Alice\n2. Bob\n3. Charlie`
    expect(checkSecretMode(parseParticipants(customWithNumbers))).toBe(false)

    // 4. Has Dzaky and Ibra but no numbers -> must be false
    const dzakyNoNum = `Dzaky Almer Rafif\nIbra Muhammad\nAdika Ramzi`
    expect(checkSecretMode(parseParticipants(dzakyNoNum))).toBe(false)
  })

  it('sets up 35 students in Secret Mode with 12 priority and 23 remaining', () => {
    const setup = setupEngine(DEFAULT_RAW_STUDENTS, 6)

    expect(setup.isSecretMode).toBe(true)
    expect(setup.totalCount).toBe(35)
    expect(setup.groupCount).toBe(6)

    // Priority pool: 11 (group 1) + 1 (promoted) = 12
    expect(setup.priorityNames).toHaveLength(12)
    // Remaining pool: 23
    expect(setup.remainingNames).toHaveLength(23)

    // Promoted person must be either Dzaky or Ibra
    const normPromoted = normalizeName(setup.promotedPerson || '')
    expect(normPromoted === 'dzaky almer rafif' || normPromoted === 'ibra muhammad').toBe(true)

    // Groups capacities: [6, 6, 6, 6, 6, 5]
    expect(setup.groups.map((g) => g.capacity)).toEqual([6, 6, 6, 6, 6, 5])

    // Kelompok 1 + Kelompok 2 capacity = 12 (exact match for priority pool)
    expect(setup.groups[0].capacity + setup.groups[1].capacity).toBe(12)
    // Kelompok 3..6 capacity = 23 (exact match for remaining pool)
    const remainingCap = setup.groups.slice(2).reduce((sum, g) => sum + g.capacity, 0)
    expect(remainingCap).toBe(23)
  })

  it('runs Normal Mode for generic custom names without numbers', () => {
    const raw = `Budi\nAndi\nCitra\nDewi\nEka\nFajar`
    const setup = setupEngine(raw, 2)

    expect(setup.isSecretMode).toBe(false)
    expect(setup.totalCount).toBe(6)
    expect(setup.groupCount).toBe(2)
    expect(setup.groups).toHaveLength(2)
    expect(setup.groups[0].capacity).toBe(3)
    expect(setup.groups[1].capacity).toBe(3)
    expect(setup.remainingNames).toHaveLength(6)
  })

  it('Monte Carlo test (500 runs): Secret Mode strictly enforces 100% invariant separation', () => {
    let dzakyCount = 0
    let ibraCount = 0

    const pool1Names = parseParticipants(DEFAULT_RAW_STUDENTS)
      .filter((p) => p.groupNum === 1)
      .map((p) => normalizeName(p.name))

    for (let i = 0; i < 500; i++) {
      const setup = setupEngine(DEFAULT_RAW_STUDENTS, 6)

      expect(setup.isSecretMode).toBe(true)
      expect(setup.priorityNames).toHaveLength(12)
      expect(setup.remainingNames).toHaveLength(23)

      const normPromoted = normalizeName(setup.promotedPerson!)
      if (normPromoted === 'dzaky almer rafif') dzakyCount++
      else if (normPromoted === 'ibra muhammad') ibraCount++

      // INVARIANT: All 11 group 1 members MUST be in priorityNames
      const priorityNormSet = new Set(setup.priorityNames.map(normalizeName))
      for (const p1 of pool1Names) {
        expect(priorityNormSet.has(p1)).toBe(true)
      }

      // INVARIANT: ZERO group 1 members in remainingNames
      const remainingNormSet = new Set(setup.remainingNames.map(normalizeName))
      for (const p1 of pool1Names) {
        expect(remainingNormSet.has(p1)).toBe(false)
      }
    }

    // Both Dzaky and Ibra must get promoted roughly equally
    expect(dzakyCount).toBeGreaterThan(180)
    expect(ibraCount).toBeGreaterThan(180)
  })
})
