import { useState, useRef, useCallback, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Wheel, type WheelHandle } from './components/Wheel'
import {
  setupEngine,
  DEFAULT_RAW_STUDENTS,
  type GroupResult,
} from './utils/spinnerEngine'
import { WHEEL_THEMES } from './utils/themes'

export function App() {
  // Theme state (Dark & Light support)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kocok_dark_mode')
      if (saved !== null) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return false
  })

  // Synchronize document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('kocok_dark_mode', JSON.stringify(darkMode))
    } catch {
      // ignore
    }
  }, [darkMode])

  // Screen view state: 'input' (Kotak nama) or 'spinner' (Roda & Hasil)
  const [view, setView] = useState<'input' | 'spinner'>('input')

  // Kotak Nama inputs
  const [rawText, setRawText] = useState<string>(DEFAULT_RAW_STUDENTS)
  const [groupCountInput, setGroupCountInput] = useState<number>(6)

  // Spinner & Group state
  const [groups, setGroups] = useState<GroupResult[]>([])
  const [wheelItems, setWheelItems] = useState<string[]>([])
  const [currentGroupIdx, setCurrentGroupIdx] = useState<number>(0)
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Engine references for rock-solid async / auto-spin state handling
  const wheelRef = useRef<WheelHandle | null>(null)
  const autoSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSecretModeRef = useRef<boolean>(false)
  const priorityPoolRef = useRef<string[]>([])
  const remainingPoolRef = useRef<string[]>([])
  const wheelItemsRef = useRef<string[]>([])
  const groupsRef = useRef<GroupResult[]>([])
  const currentGroupIdxRef = useRef<number>(0)
  const totalCountRef = useRef<number>(0)
  const isAutoSpinningRef = useRef<boolean>(false)
  const priorityGroupCountRef = useRef<number>(2)

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current)
      }
    }
  }, [])

  // Start button action: switch from Kotak Nama to Roda & Hasil
  const handleStart = () => {
    const trimmed = rawText.trim()
    if (!trimmed) return

    const count = Math.max(1, Math.min(20, groupCountInput || 6))
    const setup = setupEngine(trimmed, count)

    isSecretModeRef.current = setup.isSecretMode
    priorityPoolRef.current = [...setup.priorityNames]
    remainingPoolRef.current = [...setup.remainingNames]
    groupsRef.current = setup.groups.map((g) => ({ ...g, members: [] }))
    currentGroupIdxRef.current = 0
    totalCountRef.current = setup.totalCount
    setTotalCount(setup.totalCount)
    isAutoSpinningRef.current = false

    // In secret mode: initial groups (usually Kelompok 1 & 2) hold priorityPool
    if (setup.isSecretMode) {
      priorityGroupCountRef.current = Math.max(
        1,
        Math.min(count, Math.round(setup.priorityNames.length / (setup.totalCount / count)))
      )
      wheelItemsRef.current = [...setup.priorityNames]
    } else {
      wheelItemsRef.current = [...setup.remainingNames]
    }

    setGroups(groupsRef.current)
    setWheelItems(wheelItemsRef.current)
    setCurrentGroupIdx(0)
    setIsSpinning(false)
    setIsAutoSpinning(false)
    setView('spinner')
  }

  // Spin Start callback
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
  }, [])

  // Spin End callback
  const handleSpinEnd = useCallback((winner: string) => {
    setIsSpinning(false)

    // 1. Add winner to current active group
    const targetIdx = currentGroupIdxRef.current
    if (targetIdx < groupsRef.current.length) {
      groupsRef.current[targetIdx].members.push(winner)
      setGroups([...groupsRef.current])
    }

    // Small celebratory confetti per winner
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
      })
    } catch {
      // ignore
    }

    // 2. Remove winner from current wheel items
    wheelItemsRef.current = wheelItemsRef.current.filter((item) => item !== winner)

    // 3. Check if active group has reached capacity
    const currentGroup = groupsRef.current[targetIdx]
    if (currentGroup && currentGroup.members.length >= currentGroup.capacity) {
      currentGroupIdxRef.current++
      setCurrentGroupIdx(currentGroupIdxRef.current)
    }

    // 4. Update wheel items for next turn
    if (isSecretModeRef.current) {
      // Transition from priority pool to remaining pool once priority groups are filled
      if (
        currentGroupIdxRef.current >= priorityGroupCountRef.current &&
        wheelItemsRef.current.length === 0
      ) {
        wheelItemsRef.current = [...remainingPoolRef.current]
      }
    }

    setWheelItems([...wheelItemsRef.current])

    // 5. Check if all participants are placed
    const totalAssigned = groupsRef.current.reduce((acc, g) => acc + g.members.length, 0)
    if (
      totalAssigned >= totalCountRef.current ||
      currentGroupIdxRef.current >= groupsRef.current.length ||
      wheelItemsRef.current.length === 0
    ) {
      isAutoSpinningRef.current = false
      setIsAutoSpinning(false)
      wheelItemsRef.current = []
      setWheelItems([])

      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.5 },
        })
      } catch {
        // ignore
      }
      return
    }

    // 6. If auto-spin is running, trigger next spin
    if (isAutoSpinningRef.current) {
      autoSpinTimeoutRef.current = setTimeout(() => {
        if (isAutoSpinningRef.current && wheelRef.current) {
          wheelRef.current.spin()
        }
      }, 550)
    }
  }, [])

  // Single spin button
  const handleSingleSpin = () => {
    if (isSpinning || isAutoSpinning || wheelItems.length === 0) return
    if (wheelRef.current) {
      wheelRef.current.spin()
    }
  }

  // Auto spin toggle
  const handleToggleAutoSpin = () => {
    if (wheelItems.length === 0) return

    if (isAutoSpinning) {
      setIsAutoSpinning(false)
      isAutoSpinningRef.current = false
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current)
        autoSpinTimeoutRef.current = null
      }
    } else {
      setIsAutoSpinning(true)
      isAutoSpinningRef.current = true
      if (!isSpinning && wheelRef.current) {
        wheelRef.current.spin()
      }
    }
  }

  // Reset / Ulang button: returns to Kotak Nama screen
  const handleReset = () => {
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    setTotalCount(0)
    totalCountRef.current = 0
    if (autoSpinTimeoutRef.current) {
      clearTimeout(autoSpinTimeoutRef.current)
      autoSpinTimeoutRef.current = null
    }
    setView('input')
  }

  // Salin hasil button
  const handleCopyResults = () => {
    const lines: string[] = []
    groups.forEach((grp) => {
      lines.push(`${grp.name}:`)
      if (grp.members.length === 0) {
        lines.push('-')
      } else {
        grp.members.forEach((m, idx) => {
          lines.push(`${idx + 1}. ${m}`)
        })
      }
      lines.push('')
    })

    navigator.clipboard.writeText(lines.join('\n').trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isCompleted =
    groups.length > 0 &&
    totalCount > 0 &&
    groups.reduce((acc, g) => acc + g.members.length, 0) >= totalCount

  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Discreet Theme Switch (Sun/Moon) Top-Right */}
      <header className="w-full flex items-center justify-end px-4 py-3 sm:px-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl transition-colors cursor-pointer border ${
            darkMode
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Ubah tema"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Content: Only Three Things (Kotak Nama, Roda, Hasil) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-8 flex flex-col justify-center">
        {/* ================================================================= */}
        {/* 1. KOTAK NAMA (Before Mulai)                                      */}
        {/* ================================================================= */}
        {view === 'input' && (
          <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
            <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm flex flex-col gap-4 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}>
              {/* Textarea for pasting names */}
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={14}
                placeholder="Tempel daftar nama di sini, satu nama per baris..."
                className={`w-full p-3 rounded-xl border text-sm font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
                spellCheck={false}
              />

              {/* Group Count Input & Mulai Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <label htmlFor="group-count" className="text-sm font-semibold select-none">
                    Jumlah kelompok
                  </label>
                  <input
                    id="group-count"
                    type="number"
                    min={1}
                    max={20}
                    value={groupCountInput}
                    onChange={(e) => setGroupCountInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className={`w-16 px-2.5 py-2 rounded-xl border text-center font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  onClick={handleStart}
                  disabled={!rawText.trim()}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Mulai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2 & 3. RODA DAN HASIL (After Mulai)                               */}
        {/* ================================================================= */}
        {view === 'spinner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            {/* Left: Roda & 4 Action Buttons */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center gap-4">
              <div className={`w-full rounded-2xl border p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
              }`}>
                <Wheel
                  ref={wheelRef}
                  items={wheelItems}
                  colors={wheelColors}
                  spinDuration={isAutoSpinning ? 1.2 : 2.5}
                  isSpinning={isSpinning}
                  darkMode={darkMode}
                  onSpinStart={handleSpinStart}
                  onSpinEnd={handleSpinEnd}
                />
              </div>

              {/* 4 Action Buttons: Putar, Otomatis, Salin, Ulang */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {/* Putar */}
                <button
                  onClick={handleSingleSpin}
                  disabled={isSpinning || isAutoSpinning || isCompleted || wheelItems.length === 0}
                  className="min-h-[44px] px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center"
                >
                  Putar
                </button>

                {/* Otomatis / Berhenti */}
                <button
                  onClick={handleToggleAutoSpin}
                  disabled={isCompleted || (wheelItems.length === 0 && !isAutoSpinning)}
                  className={`min-h-[44px] px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center ${
                    isAutoSpinning
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isAutoSpinning ? 'Berhenti' : 'Otomatis'}
                </button>

                {/* Salin */}
                <button
                  onClick={handleCopyResults}
                  className={`min-h-[44px] px-3 py-2.5 rounded-xl font-bold text-xs border shadow-xs active:scale-95 transition-all cursor-pointer text-center ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : darkMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  {copied ? 'Tersalin!' : 'Salin'}
                </button>

                {/* Ulang */}
                <button
                  onClick={handleReset}
                  className={`min-h-[44px] px-3 py-2.5 rounded-xl font-bold text-xs border shadow-xs active:scale-95 transition-all cursor-pointer text-center ${
                    darkMode
                      ? 'border-slate-800 hover:bg-rose-950/40 text-rose-400'
                      : 'border-slate-300 hover:bg-rose-50 text-rose-600'
                  }`}
                >
                  Ulang
                </button>
              </div>
            </div>

            {/* Right / Bottom: Hasil (Daftar Kelompok) */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((group, idx) => {
                  const isActive = idx === currentGroupIdx && !isCompleted
                  const isFull = group.members.length >= group.capacity

                  return (
                    <div
                      key={group.id}
                      className={`rounded-2xl border p-4 transition-all shadow-xs ${
                        isActive
                          ? darkMode
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20'
                            : 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40'
                          : darkMode
                          ? 'border-slate-800 bg-slate-900'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {group.name}
                        </span>
                        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
                          isFull
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {group.members.length}/{group.capacity}
                        </span>
                      </div>

                      {/* Members List (Clean names only, zero tags, zero numbers/categories) */}
                      <div className="space-y-1.5 min-h-[90px]">
                        {group.members.map((member, mIdx) => (
                          <div
                            key={mIdx}
                            className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate py-0.5"
                          >
                            {member}
                          </div>
                        ))}

                        {/* Empty slot placeholders */}
                        {Array.from({ length: Math.max(0, group.capacity - group.members.length) }).map((_, eIdx) => (
                          <div
                            key={`empty-${eIdx}`}
                            className={`text-xs truncate py-0.5 ${
                              isActive && eIdx === 0
                                ? 'text-blue-500 font-medium animate-pulse'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          >
                            {isActive && eIdx === 0 ? '...' : '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
