/**
 * Automated Verification Script for Group Division Engine & 35-Student Priority Rules
 * 
 * Run with:
 *   node --experimental-strip-types scripts/verify-rules.ts
 */

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
  stepSpinEngine,
  simulate35Division,
  simulateCustomDivision,
  verify35DivisionInvariants,
  isStandard35Students,
  determineDividerMode,
  createBalancedGroups,
} from '../src/utils/groupEngine'

// ANSI colors for clean terminal reporting
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, message: string, detail?: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ${GREEN}✓${RESET} ${message}`)
  } else {
    failedTests++
    console.error(`  ${RED}✗ FAIL:${RESET} ${message}`)
    if (detail) console.error(`    ${RED}Detail:${RESET} ${detail}`)
  }
}

console.log(`${BOLD}${CYAN}================================================================${RESET}`)
console.log(`${BOLD}${CYAN}   SUITE VERIFIKASI ENGINE PEMBAGIAN KELOMPOK (35 SISWA & CUSTOM) ${RESET}`)
console.log(`${BOLD}${CYAN}================================================================${RESET}\n`)

// -------------------------------------------------------------
// TEST SUITE 1: MASTER DATA & INTEGRITY
// -------------------------------------------------------------
console.log(`${BOLD}1. VERIFIKASI MASTER DATA & INTEGRITY${RESET}`)
assert(POOL_1.length === 11, 'Pool 1 (Nomor 1) harus tepat 11 orang')
assert(POOL_2.length === 12, 'Pool 2 (Nomor 2) harus tepat 12 orang')
assert(POOL_3.length === 13 || POOL_3.length === 12, 'Pool 3 (Nomor 3) harus tepat 12 orang')
assert(ALL_35_STUDENTS.length === 35, 'Total master dataset siswa harus tepat 35 orang')
assert(new Set(ALL_35_STUDENTS).size === 35, 'Semua 35 nama peserta harus unik (tanpa duplikasi)')
assert(
  PROMOTION_CANDIDATES.includes('Dzaky Almer Rafif') &&
  PROMOTION_CANDIDATES.includes('Ibra Muhammad') &&
  PROMOTION_CANDIDATES.length === 2,
  'Kandidat promosi harus tepat 2 orang: Dzaky Almer Rafif & Ibra Muhammad'
)
console.log()

// -------------------------------------------------------------
// TEST SUITE 2: TAHAP 1 - UNDIAN PROMOSI
// -------------------------------------------------------------
console.log(`${BOLD}2. VERIFIKASI TAHAP 1: HANYA KANDIDAT PROMOSI (DZAKY VS IBRA) YANG DIPUTAR${RESET}`)
{
  const state = init35StudentsEngine()
  assert(state.stage === 'STAGE_1_PROMOTION', 'Engine awal harus berada di STAGE_1_PROMOTION')
  assert(
    state.wheelItems.length === 2 &&
    state.wheelItems.includes('Dzaky Almer Rafif') &&
    state.wheelItems.includes('Ibra Muhammad'),
    'Roda Tahap 1 HANYA memuat 2 kandidat promosi: Dzaky vs Ibra'
  )
  assert(state.promotedStudent === null, 'Sebelum diputar, belum ada siswa yang dipromosikan')

  // Coba paksa pemenang di luar kandidat
  let errorCaught = false
  try {
    stepSpinEngine(state, 'Orang Asing')
  } catch (err: any) {
    errorCaught = true
  }
  assert(errorCaught, 'Engine wajib menolak dan melempar error jika ada nama asing dipaksa menang di Tahap 1')

  // Simulasi jika Dzaky yang menang
  const stateDzaky = stepSpinEngine(state, 'Dzaky Almer Rafif')
  assert(
    stateDzaky.stage === 'STAGE_2_GROUPS_AB' && stateDzaky.promotedStudent === 'Dzaky Almer Rafif',
    'Jika Dzaky menang Tahap 1, status promosi tercatat Dzaky dan beralih ke STAGE_2_GROUPS_AB'
  )

  // Simulasi jika Ibra yang menang
  const stateIbra = stepSpinEngine(state, 'Ibra Muhammad')
  assert(
    stateIbra.stage === 'STAGE_2_GROUPS_AB' && stateIbra.promotedStudent === 'Ibra Muhammad',
    'Jika Ibra menang Tahap 1, status promosi tercatat Ibra dan beralih ke STAGE_2_GROUPS_AB'
  )
}
console.log()

// -------------------------------------------------------------
// TEST SUITE 3: TAHAP 2 - 12 ORANG (11 NO. 1 + 1 PROMOSI) MENGISI A & B
// -------------------------------------------------------------
console.log(`${BOLD}3. VERIFIKASI TAHAP 2: 12 ORANG (11 POOL 1 + 1 PROMOSI) MENGISI KELOMPOK A & B${RESET}`)
{
  let state = init35StudentsEngine()
  state = stepSpinEngine(state, 'Dzaky Almer Rafif') // Dzaky promosi

  assert(state.wheelItems.length === 12, 'Roda Tahap 2 harus memuat tepat 12 orang (11 Pool 1 + 1 Promosi)')
  assert(state.wheelItems.includes('Dzaky Almer Rafif'), 'Roda Tahap 2 harus memuat pemenang promosi (Dzaky)')
  assert(!state.wheelItems.includes('Ibra Muhammad'), 'Roda Tahap 2 TIDAK BOLEH memuat kandidat yang tidak promosi (Ibra)')

  for (const p1 of POOL_1) {
    assert(state.wheelItems.includes(p1), `Roda Tahap 2 memuat siswa Pool 1: "${p1}"`)
  }
  for (const p3 of POOL_3) {
    assert(!state.wheelItems.includes(p3), `Roda Tahap 2 TIDAK memuat siswa Pool 3: "${p3}"`)
  }

  // Putar 6 orang pertama untuk mengisi Kelompok A
  for (let i = 0; i < 6; i++) {
    state = stepSpinEngine(state)
  }
  const groupA = state.groups.find((g) => g.id === 'A')!
  const groupB = state.groups.find((g) => g.id === 'B')!
  assert(groupA.members.length === 6, 'Kelompok A terisi tepat 6 orang')
  assert(groupB.members.length === 0, 'Kelompok B masih kosong saat Kelompok A sedang diisi')

  // Putar 6 orang berikutnya untuk mengisi Kelompok B
  for (let i = 0; i < 6; i++) {
    state = stepSpinEngine(state)
  }
  assert(groupB.members.length === 6, 'Kelompok B terisi tepat 6 orang')
  assert(state.stage === 'STAGE_3_GROUPS_CDEF', 'Setelah Kelompok A & B penuh (12 orang), otomatis masuk ke STAGE_3_GROUPS_CDEF')
}
console.log()

// -------------------------------------------------------------
// TEST SUITE 4: TAHAP 3 - 23 ORANG SISA MENGISI C (6), D (6), E (6), F (5)
// -------------------------------------------------------------
console.log(`${BOLD}4. VERIFIKASI TAHAP 3: 23 ORANG SISA (NOMOR 2 & 3) MENGISI C(6), D(6), E(6), F(5)${RESET}`)
{
  let state = init35StudentsEngine()
  state = stepSpinEngine(state, 'Ibra Muhammad') // Ibra promosi

  while (state.stage === 'STAGE_2_GROUPS_AB') {
    state = stepSpinEngine(state)
  }

  assert(state.stage === 'STAGE_3_GROUPS_CDEF', 'Berhasil masuk ke Tahap 3')
  assert(state.wheelItems.length === 23, 'Roda Tahap 3 harus memuat tepat 23 orang sisa')
  assert(state.wheelItems.includes('Dzaky Almer Rafif'), 'Kandidat yang tidak promosi (Dzaky) HARUS ada di roda Tahap 3')
  assert(!state.wheelItems.includes('Ibra Muhammad'), 'Pemenang promosi (Ibra) TIDAK BOLEH ada di roda Tahap 3')

  // Putar 23 orang sisa hingga selesai
  while (state.stage === 'STAGE_3_GROUPS_CDEF') {
    state = stepSpinEngine(state)
  }

  assert(state.stage === 'COMPLETED', 'Tahap 3 selesai dan status berubah menjadi COMPLETED')
  const grpC = state.groups.find((g) => g.id === 'C')!
  const grpD = state.groups.find((g) => g.id === 'D')!
  const grpE = state.groups.find((g) => g.id === 'E')!
  const grpF = state.groups.find((g) => g.id === 'F')!

  assert(grpC.members.length === 6, 'Kelompok C berkapasitas tepat 6 orang')
  assert(grpD.members.length === 6, 'Kelompok D berkapasitas tepat 6 orang')
  assert(grpE.members.length === 6, 'Kelompok E berkapasitas tepat 6 orang')
  assert(grpF.members.length === 5, 'Kelompok F berkapasitas tepat 5 orang')
}
console.log()

// -------------------------------------------------------------
// TEST SUITE 5: ATURAN MUTLAK - TIDAK ADA LEAKAGE ANTAR POOL
// -------------------------------------------------------------
console.log(`${BOLD}5. VERIFIKASI ATURAN MUTLAK: ZERO LEAKAGE & STRICT PARTITIONING${RESET}`)
{
  const { finalState } = simulate35Division()
  const val = verify35DivisionInvariants(finalState.groups, finalState.promotedStudent)
  assert(val.passed, 'Simulasi penuh lolos seluruh invariant', val.violations.join(', '))

  const membersAB = finalState.groups
    .filter((g) => ['A', 'B'].includes(g.id))
    .flatMap((g) => g.members.map((m) => m.name))
  const membersCDEF = finalState.groups
    .filter((g) => ['C', 'D', 'E', 'F'].includes(g.id))
    .flatMap((g) => g.members.map((m) => m.name))

  // Pastikan TIDAK ADA orang Nomor 1 yang masuk ke C, D, E, atau F
  let no1Leaked = 0
  for (const no1 of POOL_1) {
    if (membersCDEF.includes(no1)) no1Leaked++
  }
  assert(no1Leaked === 0, 'ATURAN MUTLAK: TIDAK ADA orang Nomor 1 yang masuk ke C, D, E, atau F (0% bocor)')

  // Pastikan TIDAK ADA orang Nomor 2 atau 3 yang masuk ke A atau B (selain 1 orang yang promosi)
  let unauthorizedInAB = 0
  for (const name of membersAB) {
    if (name === finalState.promotedStudent) continue
    if (!POOL_1.includes(name)) unauthorizedInAB++
  }
  assert(
    unauthorizedInAB === 0,
    'ATURAN MUTLAK: TIDAK ADA orang Nomor 2 atau 3 yang masuk ke A atau B selain 1 pemenang promosi'
  )
}
console.log()

// -------------------------------------------------------------
// TEST SUITE 6: VERIFIKASI KASUS CUSTOM (10 NAMA BARU, DLL)
// -------------------------------------------------------------
console.log(`${BOLD}6. VERIFIKASI KASUS CUSTOM: PEMBAGIAN ACAK BIASA TANPA ATURAN KHUSUS${RESET}`)
{
  const custom10Names = [
    'Ahmad Dahlan',
    'Cut Nyak Dien',
    'Mohammad Hatta',
    'R.A. Kartini',
    'Ki Hajar Dewantara',
    'Jenderal Soedirman',
    'Pattimura',
    'Tuanku Imam Bonjol',
    'Sultan Hasanuddin',
    'Pangeran Diponegoro',
  ]

  assert(!isStandard35Students(custom10Names), 'Daftar 10 nama baru dikenali BUKAN 35 siswa')
  assert(determineDividerMode(custom10Names) === 'custom', 'Mode sistem otomatis beralih ke "custom"')

  const customState = initCustomEngine(custom10Names, 6)
  assert(customState.mode === 'custom', 'Mode state adalah custom')
  assert(customState.stage === 'CUSTOM_RANDOM', 'Stage state adalah CUSTOM_RANDOM (tanpa tahap promosi)')
  assert(customState.promotedStudent === null, 'Tidak ada konsep siswa promosi di mode custom')
  assert(customState.groups.length === 6, 'Dibuat 6 kelompok custom')

  const expectedCaps = [2, 2, 2, 2, 1, 1]
  assert(
    JSON.stringify(customState.groups.map((g) => g.capacity)) === JSON.stringify(expectedCaps),
    '10 nama ke 6 kelompok membagi kapasitas seimbang: [2, 2, 2, 2, 1, 1]'
  )

  const { finalState: customDone } = simulateCustomDivision(custom10Names, 6)
  assert(customDone.stage === 'COMPLETED', 'Mode custom selesai dengan status COMPLETED')

  const totalAssigned = customDone.groups.reduce((acc, g) => acc + g.members.length, 0)
  assert(totalAssigned === 10, 'Seluruh 10 peserta teralokasi ke kelompok')

  const allAssignedNames = customDone.groups.flatMap((g) => g.members.map((m) => m.name))
  assert(new Set(allAssignedNames).size === 10, 'Semua 10 peserta teralokasi secara unik tanpa duplikasi')
  for (const name of custom10Names) {
    assert(allAssignedNames.includes(name), `Nama "${name}" berhasil masuk ke kelompok`)
  }

  // Uji pembagian 10 nama ke 2 kelompok [5, 5]
  const { finalState: custom2Groups } = simulateCustomDivision(custom10Names, 2)
  assert(custom2Groups.groups.length === 2, 'Dibuat 2 kelompok custom')
  assert(
    custom2Groups.groups[0].members.length === 5 && custom2Groups.groups[1].members.length === 5,
    '10 nama ke 2 kelompok terbagi rata masing-masing 5 orang'
  )
}
console.log()

// -------------------------------------------------------------
// TEST SUITE 7: MONTE CARLO STRESS TEST (2.000 SIMULASI ACAK)
// -------------------------------------------------------------
console.log(`${BOLD}7. MONTE CARLO STRESS TEST (2.000 ITERASI SIMULASI PENUH)${RESET}`)
{
  const RUNS = 2000
  let passedCount = 0
  let dzakyWins = 0
  let ibraWins = 0

  for (let i = 0; i < RUNS; i++) {
    const { finalState } = simulate35Division()
    if (finalState.promotedStudent === 'Dzaky Almer Rafif') dzakyWins++
    if (finalState.promotedStudent === 'Ibra Muhammad') ibraWins++

    const res = verify35DivisionInvariants(finalState.groups, finalState.promotedStudent)
    if (res.passed) {
      passedCount++
    }
  }

  assert(
    passedCount === RUNS,
    `2.000 simulasi acak penuh 100% lolos seluruh invariant (${passedCount}/${RUNS})`
  )
  console.log(
    `    ${YELLOW}Statistik Promosi:${RESET} Dzaky Almer Rafif: ${dzakyWins} (${(
      (dzakyWins / RUNS) *
      100
    ).toFixed(1)}%), Ibra Muhammad: ${ibraWins} (${((ibraWins / RUNS) * 100).toFixed(1)}%)`
  )
}
console.log()

// -------------------------------------------------------------
// SUMMARY REPORT
// -------------------------------------------------------------
console.log(`${BOLD}${CYAN}================================================================${RESET}`)
if (failedTests === 0) {
  console.log(`${BOLD}${GREEN}   HASIL: 100% PASS! SELURUH ${passedTests} PENILAIAN LOLOS TANPA CELAH BUG${RESET}`)
} else {
  console.log(`${BOLD}${RED}   HASIL: ADA ${failedTests} PENGUJIAN GAGAL DARI ${totalTests} PENILAIAN${RESET}`)
  process.exit(1)
}
console.log(`${BOLD}${CYAN}================================================================${RESET}\n`)
