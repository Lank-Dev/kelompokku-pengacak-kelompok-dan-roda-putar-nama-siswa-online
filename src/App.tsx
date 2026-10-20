import { useState, useRef, useCallback, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Wheel, type WheelHandle } from './components/Wheel'
import {
  setupEngine,
  parseParticipants,
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

  // Initial state: starts completely empty as requested by user
  const [rawText, setRawText] = useState<string>('')
  const [groupCount, setGroupCount] = useState<number>(6)

  // Spinner & Group state
  const [groups, setGroups] = useState<GroupResult[]>(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Kelompok ${i + 1}`,
      capacity: 0,
      members: [],
    }))
  })
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
  const secretGroupIndicesRef = useRef<Set<number>>(new Set())
  const wheelItemsRef = useRef<string[]>([])
  const groupsRef = useRef<GroupResult[]>([])
  const currentGroupIdxRef = useRef<number>(0)
  const totalCountRef = useRef<number>(0)
  const isAutoSpinningRef = useRef<boolean>(false)

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current)
      }
    }
  }, [])

  // Re-initializes engine state from text & groupCount
  const reinitializeEngine = useCallback((text: string, count: number) => {
    const setup = setupEngine(text, count)

    isSecretModeRef.current = setup.isSecretMode
    priorityPoolRef.current = [...setup.priorityNames]
    remainingPoolRef.current = [...setup.remainingNames]
    secretGroupIndicesRef.current = new Set(setup.secretGroupIndices)
    groupsRef.current = setup.groups.map((g) => ({ ...g, members: [] }))
    currentGroupIdxRef.current = 0
    totalCountRef.current = setup.totalCount
    setTotalCount(setup.totalCount)

    wheelItemsRef.current = [...setup.allNames]
    setWheelItems([...setup.allNames])
    setGroups(groupsRef.current)
    setCurrentGroupIdx(0)
  }, [])

  // Handle name input changes in the right bar
  const handleTextChange = (text: string) => {
    setRawText(text)
    reinitializeEngine(text, groupCount)
  }

  // Handle group count changes from header
  const handleGroupCountChange = (count: number) => {
    setGroupCount(count)
    reinitializeEngine(rawText, count)
  }

  // Determine next target winner (silently respecting secret mode when active)
  const getNextWinner = useCallback((currentItems: string[]): string => {
    if (currentItems.length === 0) return ''

    const currentIdx = currentGroupIdxRef.current

    // If secret mode is active:
    if (isSecretModeRef.current) {
      const isPriorityTarget = secretGroupIndicesRef.current.has(currentIdx)

      if (isPriorityTarget) {
        // Priority group (must receive Nomor 1 or promoted member)
        const validPriority = priorityPoolRef.current.filter((name) =>
          currentItems.includes(name)
        )
        if (validPriority.length > 0) {
          const randIdx = Math.floor(Math.random() * validPriority.length)
          return validPriority[randIdx]
        }
      } else {
        // Non-priority group (must receive Nomor 2 or 3 member)
        const validRemaining = remainingPoolRef.current.filter((name) =>
          currentItems.includes(name)
        )
        if (validRemaining.length > 0) {
          const randIdx = Math.floor(Math.random() * validRemaining.length)
          return validRemaining[randIdx]
        }
      }
    }

    // Default mode or fallback: pick any remaining item on the wheel
    const randIdx = Math.floor(Math.random() * currentItems.length)
    return currentItems[randIdx]
  }, [])

  // Spin Start callback
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
  }, [])

  // Spin End callback
  const handleSpinEnd = useCallback(
    (winner: string) => {
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
          particleCount: 25,
          spread: 50,
          origin: { y: 0.65 },
        })
      } catch {
        // ignore
      }

      // 2. Remove winner from current wheel items
      wheelItemsRef.current = wheelItemsRef.current.filter((item) => item !== winner)

      // 3. Remove winner from pools if present
      if (isSecretModeRef.current) {
        priorityPoolRef.current = priorityPoolRef.current.filter((item) => item !== winner)
        remainingPoolRef.current = remainingPoolRef.current.filter((item) => item !== winner)
      }

      // 4. Check if active group has reached capacity
      const currentGroup = groupsRef.current[targetIdx]
      if (currentGroup && currentGroup.members.length >= currentGroup.capacity) {
        currentGroupIdxRef.current++
        setCurrentGroupIdx(currentGroupIdxRef.current)
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
            particleCount: 120,
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
            const nextWinner = getNextWinner(wheelItemsRef.current)
            wheelRef.current.spin(nextWinner)
          }
        }, 550)
      }
    },
    [getNextWinner]
  )

  // Single spin button
  const handleSingleSpin = () => {
    if (isSpinning || isAutoSpinning || wheelItems.length === 0) return
    const nextWinner = getNextWinner(wheelItemsRef.current)
    if (wheelRef.current) {
      wheelRef.current.spin(nextWinner)
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
        const nextWinner = getNextWinner(wheelItemsRef.current)
        wheelRef.current.spin(nextWinner)
      }
    }
  }

  // Reset / Ulang button: restores original names to wheel & clears groups
  const handleReset = () => {
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    if (autoSpinTimeoutRef.current) {
      clearTimeout(autoSpinTimeoutRef.current)
      autoSpinTimeoutRef.current = null
    }

    reinitializeEngine(rawText, groupCount)
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
  const parsedParticipantsCount = parseParticipants(rawText).length

  return (
    <div
      className={`h-screen max-h-screen w-full flex flex-col font-sans overflow-hidden transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* HEADER: Kelompokku, Refined Group Selector, Theme Toggle  */}
      {/* ========================================================= */}
      <header
        className={`flex-none h-14 sm:h-16 border-b px-4 sm:px-6 flex items-center justify-between transition-colors ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs select-none">
            K
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white select-none">
            Kelompokku
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <label
              htmlFor="group-select"
              className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 select-none whitespace-nowrap"
            >
              Jumlah Kelompok:
            </label>
            <select
              id="group-select"
              value={groupCount}
              disabled={isSpinning || isAutoSpinning}
              onChange={(e) => handleGroupCountChange(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-hidden"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} Kelompok
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
              darkMode
                ? 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
                : 'border-slate-300 bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Ubah tema"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN: 3 Kolom Full-Height (Kiri: Roda, Tengah: Kelompok, Kanan: Nama) */}
      {/* ========================================================= */}
      <main className="flex-1 min-h-0 w-full p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
        {/* ======================================================= */}
        {/* 1. LEFT COLUMN: Wheel & 4 Buttons (col-span-5)          */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between items-center h-full min-h-0 w-full">
          {/* Wheel card takes available height without blowing screen */}
          <div
            className={`flex-1 min-h-0 w-full rounded-2xl border p-2 sm:p-3 shadow-xs flex items-center justify-center overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}
          >
            <Wheel
              ref={wheelRef}
              items={wheelItems}
              colors={wheelColors}
              spinDuration={isAutoSpinning ? 1.2 : 2.5}
              isSpinning={isSpinning}
              darkMode={darkMode}
              emptyLabel={isCompleted ? 'Selesai' : 'Masukkan Nama'}
              onSelectWinner={getNextWinner}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />
          </div>

          {/* 4 Action Buttons: Putar, Otomatis, Salin, Ulang */}
          <div className="flex-none w-full grid grid-cols-4 gap-2 pt-2.5">
            {/* Putar */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || isCompleted || wheelItems.length === 0}
              className="min-h-[44px] px-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center"
            >
              Putar
            </button>

            {/* Otomatis / Berhenti */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={isCompleted || (wheelItems.length === 0 && !isAutoSpinning)}
              className={`min-h-[44px] px-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center ${
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
              disabled={groups.reduce((acc, g) => acc + g.members.length, 0) === 0}
              className={`min-h-[44px] px-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm border shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center ${
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
              disabled={
                isSpinning ||
                isAutoSpinning ||
                groups.reduce((acc, g) => acc + g.members.length, 0) === 0
              }
              className={`min-h-[44px] px-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm border shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-center ${
                darkMode
                  ? 'border-slate-800 hover:bg-rose-950/40 text-rose-400'
                  : 'border-slate-300 hover:bg-rose-50 text-rose-600'
              }`}
            >
              Ulang
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 2. CENTER COLUMN: Hasil Kelompok (col-span-4)           */}
        {/* ======================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 w-full">
          <div className="flex-none flex items-center justify-between pb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              Hasil Kelompok
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
              {groups.reduce((acc, g) => acc + g.members.length, 0)}/{totalCount || 0} Terisi
            </span>
          </div>

          {/* Group cards scroll INTERNALLY so the page never scrolls down */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
            {groups.map((group, idx) => {
              const isActive = idx === currentGroupIdx && !isCompleted && wheelItems.length > 0
              const isFull = group.capacity > 0 && group.members.length >= group.capacity

              return (
                <div
                  key={group.id}
                  className={`rounded-2xl border p-3.5 transition-all shadow-xs ${
                    isActive
                      ? darkMode
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20'
                        : 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40'
                      : darkMode
                      ? 'border-slate-800 bg-slate-900'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {/* Group Card Header */}
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {group.name}
                    </span>
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
                        isFull
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {group.members.length}/{group.capacity}
                    </span>
                  </div>

                  {/* Members List - Crisp, readable, zero cut-off */}
                  <div className="space-y-1 min-h-[50px]">
                    {group.members.map((member, mIdx) => (
                      <div
                        key={mIdx}
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 py-0.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
                        <span className="break-words leading-tight">{member}</span>
                      </div>
                    ))}

                    {/* Placeholder slots */}
                    {Array.from({ length: Math.max(0, group.capacity - group.members.length) }).map(
                      (_, eIdx) => (
                        <div
                          key={`empty-${eIdx}`}
                          className={`text-xs flex items-center gap-2 py-0.5 ${
                            isActive && eIdx === 0
                              ? 'text-blue-500 font-semibold animate-pulse'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 flex-shrink-0" />
                          <span>{isActive && eIdx === 0 ? 'Sedang diundi...' : '—'}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ======================================================= */}
        {/* 3. RIGHT COLUMN: Daftar Nama Sidebar Full (col-span-3)   */}
        {/* ======================================================= */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0 w-full">
          <div
            className={`h-full flex flex-col rounded-2xl border p-3.5 shadow-xs ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
            }`}
          >
            <div className="flex-none flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                Daftar Nama
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {parsedParticipantsCount} Orang
              </span>
            </div>

            {/* Textarea fills full sidebar height and scrolls internally */}
            <textarea
              value={rawText}
              disabled={isSpinning || isAutoSpinning}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Tempel daftar nama di sini, satu nama per baris..."
              className={`flex-1 min-h-0 w-full resize-none p-3 rounded-xl border text-xs sm:text-sm font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-500 overflow-y-auto leading-relaxed transition-colors ${
                darkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
              spellCheck={false}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
