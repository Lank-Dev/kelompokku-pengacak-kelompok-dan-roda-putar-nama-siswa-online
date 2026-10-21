import { describe, it, expect } from 'vitest'
import {
  setupEngine,
  parseParticipants,
  checkSecretMode,
  formatExportResults,
  simulateSpinnerDivision,
  DEFAULT_RAW_STUDENTS,
  normalizeName,
  MASTER_POOL_1,
  MASTER_POOL_2,
  MASTER_POOL_3,
} from '../src/utils/spinnerEngine'
import {
  createBalancedGroups,
} from '../src/utils/groupEngine'
import {
  POOL_1,
  POOL_3,
  ALL_35_STUDENTS,
} from '../src/utils/participants'

describe('Pre-Deployment QA & Verification Suite', () => {
  // =========================================================================
  // 1. VALIDASI BATAS KELOMPOK (MIN 2 KELOMPOK S/D 10 KELOMPOK)
  // =========================================================================
  describe('1. Validasi Batas Kelompok (Min 2 s/d 10 Kelompok)', () => {
    const sampleNames = 'Ali\nBudi\nCitra\nDewi\nEko\nFajar\nGita\nHadi'

    it('menguji count < 2 dikoreksi ke 2 kelompok', () => {
      // Test count = 1
      const setup1 = setupEngine(sampleNames, 1)
      expect(setup1.groupCount).toBe(2)
      expect(setup1.groups).toHaveLength(2)

      // Test count = 0
      const setup0 = setupEngine(sampleNames, 0)
      expect(setup0.groupCount).toBe(2)
      expect(setup0.groups).toHaveLength(2)

      // Test count negatif (-5)
      const setupNeg = setupEngine(sampleNames, -5)
      expect(setupNeg.groupCount).toBe(2)
      expect(setupNeg.groups).toHaveLength(2)
    })

    it('menguji count > 10 dikoreksi ke 10 kelompok', () => {
      // Test count = 11
      const setup11 = setupEngine(sampleNames, 11)
      expect(setup11.groupCount).toBe(10)
      expect(setup11.groups).toHaveLength(10)

      // Test count = 25
      const setup25 = setupEngine(sampleNames, 25)
      expect(setup25.groupCount).toBe(10)
      expect(setup25.groups).toHaveLength(10)

      // Test count = 100
      const setup100 = setupEngine(sampleNames, 100)
      expect(setup100.groupCount).toBe(10)
      expect(setup100.groups).toHaveLength(10)
    })

    it('menguji nilai batas valid (2, 3, 5, 6, 8, 10) tetap presisi sesuai target', () => {
      const validCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10]
      for (const count of validCounts) {
        const setup = setupEngine(sampleNames, count)
        expect(setup.groupCount).toBe(count)
        expect(setup.groups).toHaveLength(count)
      }
    })

    it('menguji createBalancedGroups mengklem count ke rentang 1-10', () => {
      const grp0 = createBalancedGroups(0, 10)
      expect(grp0).toHaveLength(1)

      const grp15 = createBalancedGroups(15, 10)
      expect(grp15).toHaveLength(10)
    })
  })

  // =========================================================================
  // 2. PEMBAGIAN KELOMPOK DENGAN VARIASI JUMLAH PESERTA & DISTRIBUSI SEIMBANG
  // =========================================================================
  describe('2. Pembagian Kelompok & Distribusi Kapasitas Seimbang', () => {
    it('10 peserta dibagi ke 2 s/d 10 kelompok: selisih kapasitas maksimal 1', () => {
      const names10 = Array.from({ length: 10 }, (_, i) => `Peserta ${i + 1}`).join('\n')

      for (let k = 2; k <= 10; k++) {
        const setup = setupEngine(names10, k)
        expect(setup.groups).toHaveLength(k)

        const capacities = setup.groups.map((g) => g.capacity)
        const totalCapacity = capacities.reduce((sum, c) => sum + c, 0)
        expect(totalCapacity).toBe(10)

        const maxCap = Math.max(...capacities)
        const minCap = Math.min(...capacities)
        expect(maxCap - minCap).toBeLessThanOrEqual(1)
      }
    })

    it('35 peserta (normal mode) dibagi ke 2 s/d 10 kelompok: selisih kapasitas maksimal 1', () => {
      // 35 nama generik (bukan master dataset) agar berjalan dalam mode normal
      const generic35 = Array.from({ length: 35 }, (_, i) => `Siswa Reguler ${i + 1}`).join('\n')

      for (let k = 2; k <= 10; k++) {
        const setup = setupEngine(generic35, k)
        expect(setup.isSecretMode).toBe(false)
        expect(setup.groups).toHaveLength(k)

        const capacities = setup.groups.map((g) => g.capacity)
        const totalCapacity = capacities.reduce((sum, c) => sum + c, 0)
        expect(totalCapacity).toBe(35)

        const maxCap = Math.max(...capacities)
        const minCap = Math.min(...capacities)
        expect(maxCap - minCap).toBeLessThanOrEqual(1)
      }
    })

    it('100 peserta dibagi ke 2 s/d 10 kelompok: selisih kapasitas maksimal 1', () => {
      const names100 = Array.from({ length: 100 }, (_, i) => `Member ${i + 1}`).join('\n')

      for (let k = 2; k <= 10; k++) {
        const setup = setupEngine(names100, k)
        expect(setup.groups).toHaveLength(k)

        const capacities = setup.groups.map((g) => g.capacity)
        const totalCapacity = capacities.reduce((sum, c) => sum + c, 0)
        expect(totalCapacity).toBe(100)

        const maxCap = Math.max(...capacities)
        const minCap = Math.min(...capacities)
        expect(maxCap - minCap).toBeLessThanOrEqual(1)
      }
    })

    it('menguji variasi jumlah ganjil vs genap terdistribusi seimbang', () => {
      // 11 peserta ke 3 kelompok -> [4, 4, 3]
      const setup11 = setupEngine(Array.from({ length: 11 }, (_, i) => `P${i}`).join('\n'), 3)
      expect(setup11.groups.map((g) => g.capacity)).toEqual([4, 4, 3])

      // 25 peserta ke 4 kelompok -> [7, 6, 6, 6]
      const setup25 = setupEngine(Array.from({ length: 25 }, (_, i) => `P${i}`).join('\n'), 4)
      expect(setup25.groups.map((g) => g.capacity)).toEqual([7, 6, 6, 6])

      // 50 peserta ke 7 kelompok -> [8, 7, 7, 7, 7, 7, 7]
      const setup50 = setupEngine(Array.from({ length: 50 }, (_, i) => `P${i}`).join('\n'), 7)
      expect(setup50.groups.map((g) => g.capacity)).toEqual([8, 7, 7, 7, 7, 7, 7])

      // 12 peserta ke 2 kelompok -> [6, 6] (rata)
      const setup12 = setupEngine(Array.from({ length: 12 }, (_, i) => `P${i}`).join('\n'), 2)
      expect(setup12.groups.map((g) => g.capacity)).toEqual([6, 6])

      // 13 peserta ke 2 kelompok -> [7, 6]
      const setup13 = setupEngine(Array.from({ length: 13 }, (_, i) => `P${i}`).join('\n'), 2)
      expect(setup13.groups.map((g) => g.capacity)).toEqual([7, 6])
    })

    it('simulasi alokasi penuh: semua peserta teralokasi unik tanpa duplikasi atau kehilangan', () => {
      const namesList = Array.from({ length: 23 }, (_, i) => `Peserta ${i + 1}`)
      const raw = namesList.join('\n')

      const { finalGroups } = simulateSpinnerDivision(raw, 5)
      expect(finalGroups).toHaveLength(5)

      const assignedNames = finalGroups.flatMap((g) => g.members)
      expect(assignedNames).toHaveLength(23)
      expect(new Set(assignedNames).size).toBe(23)

      for (const name of namesList) {
        expect(assignedNames).toContain(name)
      }
    })
  })

  // =========================================================================
  // 3. TEST INPUT EKSTREM (EDGE CASES)
  // =========================================================================
  describe('3. Test Input Ekstrem (Edge Cases)', () => {
    it('teks kosong: menghasilkan engine siap pakai dengan totalCount 0 tanpa crash', () => {
      const setup = setupEngine('', 6)
      expect(setup.totalCount).toBe(0)
      expect(setup.allNames).toHaveLength(0)
      expect(setup.groups).toHaveLength(6)
      expect(setup.groups.map((g) => g.capacity)).toEqual([0, 0, 0, 0, 0, 0])
      expect(setup.isSecretMode).toBe(false)
    })

    it('whitespace only (spasi, newline, tab): diproses bersih sebagai 0 peserta', () => {
      const whitespaceText = '   \n\t  \n  \r\n   \t  '
      const parsed = parseParticipants(whitespaceText)
      expect(parsed).toHaveLength(0)

      const setup = setupEngine(whitespaceText, 4)
      expect(setup.totalCount).toBe(0)
      expect(setup.allNames).toHaveLength(0)
    })

    it('baris kosong berulang di antara nama: hanya menyaring nama yang valid', () => {
      const messyInput = `
        Ahmad Dahlan
        
        
        Cut Nyak Dien
        
             
        Mohammad Hatta
        
      `
      const parsed = parseParticipants(messyInput)
      expect(parsed).toHaveLength(3)
      expect(parsed.map((p) => p.name)).toEqual(['Ahmad Dahlan', 'Cut Nyak Dien', 'Mohammad Hatta'])
    })

    it('karakter unicode, tanda kutip lengkung, aksen, dan simbol khusus', () => {
      const rawSpecial = [
        "Muhammad Akbar Ar'rafa",
        'Muhammad Akbar Ar’rafa', // curved quote
        'M. Gilank Putra Ramadhan',
        'José René Higuita',
        'Chloë Müller',
        'Siti Nur-Haliza',
        'Dra. Hj. Fatimah, M.Pd.',
      ].join('\n')

      const parsed = parseParticipants(rawSpecial)
      expect(parsed).toHaveLength(7)
      expect(parsed[0].name).toBe("Muhammad Akbar Ar'rafa")
      expect(parsed[1].name).toBe('Muhammad Akbar Ar’rafa')
      expect(parsed[3].name).toBe('José René Higuita')
      expect(parsed[4].name).toBe('Chloë Müller')
      expect(parsed[5].name).toBe('Siti Nur-Haliza')
      expect(parsed[6].name).toBe('Dra. Hj. Fatimah, M.Pd.')

      // Normalization handles curved apostrophe identically
      expect(normalizeName("Muhammad Akbar Ar'rafa")).toBe(
        normalizeName('Muhammad Akbar Ar’rafa')
      )
    })

    it('nama sangat panjang (150+ karakter): diproses utuh tanpa truncate tak disengaja', () => {
      const veryLongName =
        'Gusti Raden Mas Rangga Sasana Prawiradiningrat Kusuma Atmaja Hadiningrat Putra Mahkota Kesultanan Nusantara Indonesia Abadi Jaya Raya Perkasa Nan Megah 2026'
      const parsed = parseParticipants(veryLongName)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].name).toBe(veryLongName)
      expect(parsed[0].name.length).toBeGreaterThan(140)

      const setup = setupEngine(veryLongName, 2)
      expect(setup.allNames).toContain(veryLongName)
    })
  })

  // =========================================================================
  // 4. TEST SECRET MODE EDGE CASES & ZERO LEAKAGE
  // =========================================================================
  describe('4. Test Secret Mode Edge Cases & Zero Leakage', () => {
    it('variasi format nomor: titik (1. Nama), kurung (1) Nama), dash (1 - Nama), spasi (1 Nama)', () => {
      const variations = `
        1. Adika Ramzi
        1) M. Gilank Putra Ramadhan
        1 - Nayaka Nur Zaky
        1 Shalahuddin Yusuf Azka
        2. Dzaky Almer Rafif
        2) Ibra Muhammad
        2 - Pauziah Lestari
        3. Fatah Rezky Al Gyfari
        3) Kamal Al-Fathir Iskandar
        3 - Nava Olivia
      `
      const parsed = parseParticipants(variations)
      expect(parsed).toHaveLength(10)

      // Format 1.
      expect(parsed[0].groupNum).toBe(1)
      expect(parsed[0].name).toBe('Adika Ramzi')

      // Format 1)
      expect(parsed[1].groupNum).toBe(1)
      expect(parsed[1].name).toBe('M. Gilank Putra Ramadhan')

      // Format 1 -
      expect(parsed[2].groupNum).toBe(1)
      expect(parsed[2].name).toBe('Nayaka Nur Zaky')

      // Format 1 (spasi)
      expect(parsed[3].groupNum).toBe(1)
      expect(parsed[3].name).toBe('Shalahuddin Yusuf Azka')

      // Format 2
      expect(parsed[4].groupNum).toBe(2)
      expect(parsed[4].name).toBe('Dzaky Almer Rafif')
      expect(parsed[5].groupNum).toBe(2)
      expect(parsed[5].name).toBe('Ibra Muhammad')

      // Secret mode is triggered
      expect(checkSecretMode(parsed)).toBe(true)
    })

    it('35 nama master tanpa nomor prefix sama sekali tetap memicu secret mode via pool recognition', () => {
      const rawWithoutNumbers = ALL_35_STUDENTS.join('\n')
      const parsed = parseParticipants(rawWithoutNumbers)

      expect(parsed).toHaveLength(35)
      // All pool 1 must have groupNum 1 mapped from master pool
      for (const p of parsed) {
        const norm = normalizeName(p.name)
        if (MASTER_POOL_1.includes(norm)) {
          expect(p.groupNum).toBe(1)
        } else if (MASTER_POOL_2.includes(norm)) {
          expect(p.groupNum).toBe(2)
        } else if (MASTER_POOL_3.includes(norm)) {
          expect(p.groupNum).toBe(3)
        }
      }

      expect(checkSecretMode(parsed)).toBe(true)
      const setup = setupEngine(rawWithoutNumbers, 6)
      expect(setup.isSecretMode).toBe(true)
    })

    it('anti-false-positive: nomor 1, 2, 3 dengan nama acak tidak mengaktifkan secret mode', () => {
      const fakeNumbered = `
        1. Robert Baratheon
        1. Eddard Stark
        2. Jon Snow
        3. Tyrion Lannister
      `
      const parsed = parseParticipants(fakeNumbered)
      expect(checkSecretMode(parsed)).toBe(false)
      const setup = setupEngine(fakeNumbered, 2)
      expect(setup.isSecretMode).toBe(false)
    })

    it('verifikasi ZERO LEAKAGE di 6 kelompok (standard)', () => {
      const { setup, finalGroups } = simulateSpinnerDivision(DEFAULT_RAW_STUDENTS, 6)
      expect(setup.isSecretMode).toBe(true)
      expect(setup.secretGroupIndices).toHaveLength(2)

      const priorityGroupIndices = new Set(setup.secretGroupIndices)
      const priorityMembers = finalGroups
        .filter((_, idx) => priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)
      const nonPriorityMembers = finalGroups
        .filter((_, idx) => !priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)

      expect(priorityMembers).toHaveLength(12)
      expect(nonPriorityMembers).toHaveLength(23)

      const priorityNormSet = new Set(priorityMembers.map(normalizeName))
      const nonPriorityNormSet = new Set(nonPriorityMembers.map(normalizeName))

      // 1. Seluruh 11 orang Pool 1 HARUS ada di priority members
      for (const p1 of POOL_1) {
        expect(priorityNormSet.has(normalizeName(p1))).toBe(true)
        // ZERO LEAKAGE: Tidak boleh ada di non-priority
        expect(nonPriorityNormSet.has(normalizeName(p1))).toBe(false)
      }

      // 2. Tepat 1 promosi (Dzaky ATAU Ibra) ada di priority
      const normPromoted = normalizeName(setup.promotedPerson!)
      expect(priorityNormSet.has(normPromoted)).toBe(true)
      expect(nonPriorityNormSet.has(normPromoted)).toBe(false)

      // 3. Seluruh 12 orang Pool 3 TIDAK BOLEH bocor ke priority members
      for (const p3 of POOL_3) {
        expect(priorityNormSet.has(normalizeName(p3))).toBe(false)
        expect(nonPriorityNormSet.has(normalizeName(p3))).toBe(true)
      }
    })

    it('verifikasi ZERO LEAKAGE di 4 kelompok', () => {
      const { setup, finalGroups } = simulateSpinnerDivision(DEFAULT_RAW_STUDENTS, 4)
      expect(setup.isSecretMode).toBe(true)

      const priorityGroupIndices = new Set(setup.secretGroupIndices)
      const priorityMembers = finalGroups
        .filter((_, idx) => priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)
      const nonPriorityMembers = finalGroups
        .filter((_, idx) => !priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)

      const priorityNormSet = new Set(priorityMembers.map(normalizeName))
      const nonPriorityNormSet = new Set(nonPriorityMembers.map(normalizeName))

      // ZERO LEAKAGE: Seluruh orang Pool 1 hanya ada di priority groups
      for (const p1 of POOL_1) {
        expect(priorityNormSet.has(normalizeName(p1))).toBe(true)
        expect(nonPriorityNormSet.has(normalizeName(p1))).toBe(false)
      }

      // Pool 3 tidak boleh di priority groups
      for (const p3 of POOL_3) {
        expect(priorityNormSet.has(normalizeName(p3))).toBe(false)
      }
    })

    it('verifikasi ZERO LEAKAGE di 8 kelompok', () => {
      const { setup, finalGroups } = simulateSpinnerDivision(DEFAULT_RAW_STUDENTS, 8)
      expect(setup.isSecretMode).toBe(true)

      const priorityGroupIndices = new Set(setup.secretGroupIndices)
      const priorityMembers = finalGroups
        .filter((_, idx) => priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)
      const nonPriorityMembers = finalGroups
        .filter((_, idx) => !priorityGroupIndices.has(idx))
        .flatMap((g) => g.members)

      const priorityNormSet = new Set(priorityMembers.map(normalizeName))
      const nonPriorityNormSet = new Set(nonPriorityMembers.map(normalizeName))

      // ZERO LEAKAGE
      for (const p1 of POOL_1) {
        expect(priorityNormSet.has(normalizeName(p1))).toBe(true)
        expect(nonPriorityNormSet.has(normalizeName(p1))).toBe(false)
      }

      for (const p3 of POOL_3) {
        expect(priorityNormSet.has(normalizeName(p3))).toBe(false)
      }
    })
  })

  // =========================================================================
  // 5. TEST EXPORT / COPY FORMATTING HASIL KELOMPOK
  // =========================================================================
  describe('5. Test Export / Copy Formatting Hasil Kelompok', () => {
    it('memformat hasil kelompok dengan penomoran rapi dan pemisah konsisten', () => {
      const mockGroups = [
        {
          name: 'Kelompok 1',
          members: ['Adika Ramzi', 'M. Gilank Putra Ramadhan'],
        },
        {
          name: 'Kelompok 2',
          members: ['Dzaky Almer Rafif'],
        },
        {
          name: 'Kelompok 3',
          members: [],
        },
      ]

      const formatted = formatExportResults(mockGroups)

      const expected = [
        'Kelompok 1:',
        '1. Adika Ramzi',
        '2. M. Gilank Putra Ramadhan',
        '',
        'Kelompok 2:',
        '1. Dzaky Almer Rafif',
        '',
        'Kelompok 3:',
        '-',
      ].join('\n')

      expect(formatted).toBe(expected)
    })

    it('mendukung struktur member berupa object { name: string }', () => {
      const mockObjGroups = [
        {
          name: 'Kelompok A',
          members: [{ name: 'Dzaky Almer Rafif' }, { name: 'Adika Ramzi' }],
        },
        {
          name: 'Kelompok B',
          members: [],
        },
      ]

      const formatted = formatExportResults(mockObjGroups)
      expect(formatted).toContain('Kelompok A:')
      expect(formatted).toContain('1. Dzaky Almer Rafif')
      expect(formatted).toContain('2. Adika Ramzi')
      expect(formatted).toContain('Kelompok B:')
      expect(formatted).toContain('-')
    })

    it('menghasilkan teks tanpa trailing whitespace yang tidak rapi', () => {
      const emptyGroups = [
        { name: 'Kelompok 1', members: [] },
        { name: 'Kelompok 2', members: [] },
      ]
      const formatted = formatExportResults(emptyGroups)
      expect(formatted.endsWith('\n')).toBe(false)
      expect(formatted).toBe('Kelompok 1:\n-\n\nKelompok 2:\n-')
    })
  })
})
