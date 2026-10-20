import { describe, it, expect } from 'vitest'
import {
  POOL_1,
  POOL_2,
  POOL_3,
  PROMOTION_CANDIDATES,
  ALL_35_STUDENTS,
} from '../src/utils/participants'
import {
  init35StudentsEngine,
  initCustomEngine,
  initEngine,
  stepSpinEngine,
  simulate35Division,
  simulateCustomDivision,
  verify35DivisionInvariants,
  isStandard35Students,
  determineDividerMode,
  createBalancedGroups,
  type GroupEngineState,
} from '../src/utils/groupEngine'

describe('Group Division Engine - Priority Rules 35 Siswa', () => {
  it('Master Data Integrity: Harus terdapat 11 siswa Pool 1, 12 siswa Pool 2, dan 12 siswa Pool 3 (Total 35)', () => {
    expect(POOL_1).toHaveLength(11)
    expect(POOL_2).toHaveLength(12)
    expect(POOL_3).toHaveLength(12)
    expect(ALL_35_STUDENTS).toHaveLength(35)

    // Uniqueness across all 35 students
    const uniqueStudents = new Set(ALL_35_STUDENTS)
    expect(uniqueStudents.size).toBe(35)

    // Promotion candidates must be in Pool 2
    expect(PROMOTION_CANDIDATES).toEqual(['Dzaky Almer Rafif', 'Ibra Muhammad'])
    expect(POOL_2).toContain('Dzaky Almer Rafif')
    expect(POOL_2).toContain('Ibra Muhammad')
  })

  it('Tahap 1: Inisialisasi awal hanya memutar 2 kandidat promosi (Dzaky Almer Rafif vs Ibra Muhammad)', () => {
    const state = init35StudentsEngine()

    expect(state.mode).toBe('rule_35')
    expect(state.stage).toBe('STAGE_1_PROMOTION')
    expect(state.wheelItems).toEqual([...PROMOTION_CANDIDATES])
    expect(state.wheelItems).toHaveLength(2)
    expect(state.promotedStudent).toBeNull()
    expect(state.groups).toHaveLength(6)

    // Semua kelompok masih kosong
    state.groups.forEach((g) => {
      expect(g.members).toHaveLength(0)
    })
  })

  it('Tahap 1: Jika dipaksa nama di luar kandidat promosi, engine melempar error invariant', () => {
    const state = init35StudentsEngine()
    expect(() => {
      stepSpinEngine(state, 'Bukan Kandidat')
    }).toThrow(/violation: Specified winner "Bukan Kandidat" is not among active wheel items/)
  })

  it('Tahap 2 (Skenario Dzaky Menang Promosi): 12 orang (11 Pool 1 + Dzaky) mengisi Kelompok A & B', () => {
    let state = init35StudentsEngine()

    // 1. Putar Tahap 1 dengan pemenang Dzaky
    state = stepSpinEngine(state, 'Dzaky Almer Rafif')

    expect(state.stage).toBe('STAGE_2_GROUPS_AB')
    expect(state.promotedStudent).toBe('Dzaky Almer Rafif')
    expect(state.wheelItems).toHaveLength(12)
    expect(state.wheelItems).toContain('Dzaky Almer Rafif')
    expect(state.wheelItems).not.toContain('Ibra Muhammad') // Ibra TIDAK boleh di Tahap 2

    // Semua 11 siswa Pool 1 ada di roda Tahap 2
    POOL_1.forEach((student) => {
      expect(state.wheelItems).toContain(student)
    })

    // Roda Tahap 2 TIDAK boleh memuat anggota Pool 3 sama sekali
    POOL_3.forEach((student) => {
      expect(state.wheelItems).not.toContain(student)
    })

    // 2. Putar 6 orang pertama untuk mengisi Kelompok A
    const itemsBeforeA = [...state.wheelItems]
    for (let i = 0; i < 6; i++) {
      const winner = itemsBeforeA[i]
      state = stepSpinEngine(state, winner)
    }

    const groupA = state.groups.find((g) => g.id === 'A')!
    expect(groupA.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'B')!.members).toHaveLength(0)
    expect(state.stage).toBe('STAGE_2_GROUPS_AB')
    expect(state.wheelItems).toHaveLength(6)

    // 3. Putar 6 orang sisa untuk mengisi Kelompok B
    const itemsBeforeB = [...state.wheelItems]
    for (let i = 0; i < 6; i++) {
      const winner = itemsBeforeB[i]
      state = stepSpinEngine(state, winner)
    }

    const groupB = state.groups.find((g) => g.id === 'B')!
    expect(groupB.members).toHaveLength(6)

    // Setelah 12 orang terisi di A & B, stage harus otomatis beralih ke STAGE_3_GROUPS_CDEF
    expect(state.stage).toBe('STAGE_3_GROUPS_CDEF')
  })

  it('Tahap 2 (Skenario Ibra Menang Promosi): 12 orang (11 Pool 1 + Ibra) mengisi Kelompok A & B', () => {
    let state = init35StudentsEngine()

    // 1. Putar Tahap 1 dengan pemenang Ibra
    state = stepSpinEngine(state, 'Ibra Muhammad')

    expect(state.stage).toBe('STAGE_2_GROUPS_AB')
    expect(state.promotedStudent).toBe('Ibra Muhammad')
    expect(state.wheelItems).toHaveLength(12)
    expect(state.wheelItems).toContain('Ibra Muhammad')
    expect(state.wheelItems).not.toContain('Dzaky Almer Rafif') // Dzaky TIDAK boleh di Tahap 2

    // 2. Putar 12 kali untuk menyelesaikan Tahap 2
    while (state.stage === 'STAGE_2_GROUPS_AB') {
      state = stepSpinEngine(state)
    }

    const groupA = state.groups.find((g) => g.id === 'A')!
    const groupB = state.groups.find((g) => g.id === 'B')!
    expect(groupA.members).toHaveLength(6)
    expect(groupB.members).toHaveLength(6)

    const membersAB = [...groupA.members, ...groupB.members].map((m) => m.name)
    expect(membersAB).toContain('Ibra Muhammad')
    expect(membersAB).not.toContain('Dzaky Almer Rafif')

    expect(state.stage).toBe('STAGE_3_GROUPS_CDEF')
  })

  it('Tahap 3: 23 orang sisa (Nomor 2 & 3) mengisi Kelompok C (6), D (6), E (6), dan F (5)', () => {
    let state = init35StudentsEngine()

    // Step 1: Dzaky terpilih promosi
    state = stepSpinEngine(state, 'Dzaky Almer Rafif')

    // Step 2: Selesaikan Tahap 2 (12 orang masuk ke A & B)
    while (state.stage === 'STAGE_2_GROUPS_AB') {
      state = stepSpinEngine(state)
    }

    // Verifikasi daftar roda Tahap 3
    expect(state.stage).toBe('STAGE_3_GROUPS_CDEF')
    expect(state.wheelItems).toHaveLength(23)

    // Kandidat yang tidak promosi (Ibra) HARUS ada di roda Tahap 3
    expect(state.wheelItems).toContain('Ibra Muhammad')
    // Pemenang promosi (Dzaky) TIDAK BOLEH ada di roda Tahap 3
    expect(state.wheelItems).not.toContain('Dzaky Almer Rafif')

    // TIDAK BOLEH ada orang Pool 1 di roda Tahap 3
    POOL_1.forEach((p1) => {
      expect(state.wheelItems).not.toContain(p1)
    })

    // SEMUA orang Pool 3 HARUS ada di roda Tahap 3
    POOL_3.forEach((p3) => {
      expect(state.wheelItems).toContain(p3)
    })

    // 10 sisa orang Pool 2 HARUS ada di roda Tahap 3
    const remainingPool2 = POOL_2.filter((p) => p !== 'Dzaky Almer Rafif')
    remainingPool2.forEach((p2) => {
      expect(state.wheelItems).toContain(p2)
    })

    // Step 3: Putar terus hingga selesai
    let spinCount = 0
    while (state.stage === 'STAGE_3_GROUPS_CDEF') {
      spinCount++
      state = stepSpinEngine(state)
    }

    expect(spinCount).toBe(23)
    expect(state.stage).toBe('COMPLETED')
    expect(state.wheelItems).toHaveLength(0)

    // Verifikasi kapasitas masing-masing kelompok
    expect(state.groups.find((g) => g.id === 'A')!.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'B')!.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'C')!.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'D')!.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'E')!.members).toHaveLength(6)
    expect(state.groups.find((g) => g.id === 'F')!.members).toHaveLength(5)
  })

  it('Verifikasi Aturan Mutlak: TIDAK ADA orang Nomor 1 yang masuk ke C, D, E, atau F', () => {
    // Jalankan simulasi penuh
    const { finalState } = simulate35Division()

    const membersCDEF = finalState.groups
      .filter((g) => ['C', 'D', 'E', 'F'].includes(g.id))
      .flatMap((g) => g.members.map((m) => m.name))

    for (const no1 of POOL_1) {
      expect(membersCDEF).not.toContain(no1)
    }
  })

  it('Verifikasi Aturan Mutlak: TIDAK ADA orang Nomor 2 atau 3 yang masuk ke A atau B (selain 1 pemenang promosi)', () => {
    const { finalState } = simulate35Division()
    const promoted = finalState.promotedStudent!

    const membersAB = finalState.groups
      .filter((g) => ['A', 'B'].includes(g.id))
      .flatMap((g) => g.members.map((m) => m.name))

    // Pastikan pemenang promosi memang ada di A atau B
    expect(membersAB).toContain(promoted)

    // Pastikan peserta Pool 2 lainnya TIDAK ada di A atau B
    for (const no2 of POOL_2) {
      if (no2 === promoted) continue
      expect(membersAB).not.toContain(no2)
    }

    // Pastikan peserta Pool 3 sama sekali TIDAK ada di A atau B
    for (const no3 of POOL_3) {
      expect(membersAB).not.toContain(no3)
    }
  })

  it('Monte Carlo Rigor: 1.000 simulasi acak penuh 100% lolos verifikasi invariant tanpa celah bug', () => {
    const totalSimulations = 1000
    let dzakyWins = 0
    let ibraWins = 0

    for (let i = 0; i < totalSimulations; i++) {
      const { finalState } = simulate35Division()

      if (finalState.promotedStudent === 'Dzaky Almer Rafif') dzakyWins++
      if (finalState.promotedStudent === 'Ibra Muhammad') ibraWins++

      const validation = verify35DivisionInvariants(
        finalState.groups,
        finalState.promotedStudent
      )

      if (!validation.passed) {
        throw new Error(
          `Simulasi ke-${i + 1} GAGAL memenuhi aturan mutlak:\n` +
            validation.violations.join('\n')
        )
      }
      expect(validation.passed).toBe(true)
      expect(validation.violations).toHaveLength(0)
    }

    // Both candidates should have won roughly evenly (binomial distribution check)
    expect(dzakyWins).toBeGreaterThan(350)
    expect(ibraWins).toBeGreaterThan(350)
  })
})

describe('Kasus Custom: Daftar Nama Kustom / Baru', () => {
  it('Deteksi: Daftar nama baru (misal 10 nama) dikenali sebagai custom mode tanpa aturan khusus', () => {
    const customNames = [
      'Budi Santoso',
      'Siti Aminah',
      'Rudi Hartono',
      'Dewi Lestari',
      'Agus Pratama',
      'Nina Marlina',
      'Eko Prasetyo',
      'Maya Indah',
      'Reza Rahadian',
      'Putri Ayu',
    ]

    expect(isStandard35Students(customNames)).toBe(false)
    expect(determineDividerMode(customNames)).toBe('custom')

    const state = initEngine(customNames, 6)
    expect(state.mode).toBe('custom')
    expect(state.stage).toBe('CUSTOM_RANDOM')
    expect(state.promotedStudent).toBeNull()
    expect(state.wheelItems).toEqual(customNames)

    // Direct initCustomEngine test
    const customState: GroupEngineState = initCustomEngine(customNames, 6)
    expect(customState.mode).toBe('custom')
    expect(customState.stage).toBe('CUSTOM_RANDOM')
    expect(customState.groups).toHaveLength(6)
  })

  it('Kasus Custom 10 Nama ke 6 Kelompok: Kapasitas seimbang [2, 2, 2, 2, 1, 1] dan terisi penuh', () => {
    const customNames = [
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Foxtrot',
      'Golf',
      'Hotel',
      'India',
      'Juliet',
    ]

    const balancedGroups = createBalancedGroups(6, 10)
    expect(balancedGroups).toHaveLength(6)
    expect(balancedGroups.map((g) => g.capacity)).toEqual([2, 2, 2, 2, 1, 1])

    const { finalState, history } = simulateCustomDivision(customNames, 6)

    expect(finalState.stage).toBe('COMPLETED')
    expect(finalState.wheelItems).toHaveLength(0)
    expect(history).toHaveLength(10)

    // Total alokasi tepat 10
    const totalAllocated = finalState.groups.reduce((sum, g) => sum + g.members.length, 0)
    expect(totalAllocated).toBe(10)

    // Setiap kelompok terisi sesuai kapasitasnya
    finalState.groups.forEach((g) => {
      expect(g.members.length).toBe(g.capacity)
    })

    // Semua nama ada dan unik
    const assignedNames = finalState.groups.flatMap((g) => g.members.map((m) => m.name))
    expect(new Set(assignedNames).size).toBe(10)
    customNames.forEach((name) => {
      expect(assignedNames).toContain(name)
    })
  })

  it('Kasus Custom 10 Nama ke 2 Kelompok: Kapasitas [5, 5] terisi penuh', () => {
    const customNames = Array.from({ length: 10 }, (_, i) => `Peserta #${i + 1}`)

    const { finalState } = simulateCustomDivision(customNames, 2)

    expect(finalState.groups).toHaveLength(2)
    expect(finalState.groups[0].members).toHaveLength(5)
    expect(finalState.groups[1].members).toHaveLength(5)

    const allMembers = finalState.groups.flatMap((g) => g.members.map((m) => m.name))
    expect(allMembers).toHaveLength(10)
    expect(new Set(allMembers).size).toBe(10)
  })

  it('Kasus Custom: Bebas tanpa aturan prioritas/promosi', () => {
    const customNames = [
      'Dzaky Almer Rafif', // Bahkan jika nama mirip, jika bukan 35 siswa lengkap, diperlakukan murni custom
      'Peserta 2',
      'Peserta 3',
      'Peserta 4',
      'Peserta 5',
    ]

    const state = initEngine(customNames, 2)
    expect(state.mode).toBe('custom')
    expect(state.stage).toBe('CUSTOM_RANDOM')
    expect(state.promotedStudent).toBeNull()

    const { finalState } = simulateCustomDivision(customNames, 2)
    expect(finalState.stage).toBe('COMPLETED')

    // Tidak ada flag isPromoted pada anggota custom
    finalState.groups.forEach((g) => {
      g.members.forEach((m) => {
        expect(m.isPromoted).toBeFalsy()
      })
    })
  })
})
