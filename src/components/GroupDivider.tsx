import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import confetti from 'canvas-confetti'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Pause,
  Edit3,
  Shuffle,
  CheckCircle2,
  Trophy,
} from 'lucide-react'
import { Wheel, type WheelHandle } from './Wheel'
import { WHEEL_THEMES } from '../utils/themes'
import {
  DEFAULT_STUDENTS,
  createBalancedGroups,
  type GroupData,
  GROUP_PALETTE,
} from '../utils/participants'

interface GroupDividerProps {
  darkMode: boolean
}

export const GroupDivider: React.FC<GroupDividerProps> = ({ darkMode }) => {
  const wheelRef = useRef<WheelHandle | null>(null)

  // Configuration
  const [groupCount, setGroupCount] = useState<number>(6)
  const [rawText, setRawText] = useState<string>(DEFAULT_STUDENTS.join('\n'))
  const [allStudents, setAllStudents] = useState<string[]>([...DEFAULT_STUDENTS])
  const [remainingStudents, setRemainingStudents] = useState<string[]>([...DEFAULT_STUDENTS])
  const [groups, setGroups] = useState<GroupData[]>(() =>
    createBalancedGroups(6, DEFAULT_STUDENTS.length)
  )

  // State
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Winner announcement state
  const [recentWinner, setRecentWinner] = useState<{
    name: string
    groupName: string
    groupColor: string
  } | null>(null)

  // Keep auto-spinning ref updated for asynchronous loops
  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning
  }, [isAutoSpinning])

  // Total allocated count
  const totalAllocated = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.members.length, 0)
  }, [groups])

  // Current active target group (first group with space remaining)
  const activeTargetGroup = useMemo(() => {
    return groups.find((g) => g.members.length < g.capacity) || null
  }, [groups])

  const isCompleted = totalAllocated >= allStudents.length && allStudents.length > 0

  // Instant group count change (1-10) with immediate balanced reassignment
  const handleGroupCountChange = (newCount: number) => {
    if (isSpinning || isAutoSpinning) return
    setGroupCount(newCount)
    setGroups(createBalancedGroups(newCount, allStudents.length))
    setRemainingStudents([...allStudents])
    setRecentWinner(null)
  }

  // Handle manual spin start
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
    setRecentWinner(null)
  }, [])

  // Handle spin finish
  const handleSpinEnd = useCallback(
    (winner: string) => {
      setIsSpinning(false)

      const targetGroup = groups.find((g) => g.members.length < g.capacity)
      if (!targetGroup) return

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // Add to group
      setGroups((prev) =>
        prev.map((g) =>
          g.id === targetGroup.id
            ? {
                ...g,
                members: [...g.members, { name: winner, timestamp }],
              }
            : g
        )
      )

      // Remove from active wheel items
      setRemainingStudents((prev) => {
        const next = [...prev]
        const idx = next.indexOf(winner)
        if (idx !== -1) {
          next.splice(idx, 1)
        }
        return next
      })

      // Show recent winner
      setRecentWinner({
        name: winner,
        groupName: targetGroup.name,
        groupColor: targetGroup.color,
      })

      // Trigger Confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: [targetGroup.color, '#2563EB', '#059669', '#D97706'],
        })
      } catch {
        // ignore
      }

      // Check for completion or auto-advance
      const newTotalAllocated = totalAllocated + 1
      if (newTotalAllocated >= allStudents.length) {
        setIsAutoSpinning(false)
        isAutoSpinningRef.current = false
        try {
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.5 },
          })
        } catch {
          // ignore
        }
      } else if (isAutoSpinningRef.current) {
        setTimeout(() => {
          if (isAutoSpinningRef.current && wheelRef.current) {
            wheelRef.current.spin()
          }
        }, 900)
      }
    },
    [groups, totalAllocated, allStudents.length]
  )

  // Single spin trigger
  const handleSingleSpin = () => {
    if (isSpinning || isAutoSpinning || isCompleted || remainingStudents.length === 0) return
    if (wheelRef.current) {
      wheelRef.current.spin()
    }
  }

  // Auto spin toggle
  const handleToggleAutoSpin = () => {
    if (isCompleted || remainingStudents.length === 0) return

    if (isAutoSpinning) {
      setIsAutoSpinning(false)
      isAutoSpinningRef.current = false
    } else {
      setIsAutoSpinning(true)
      isAutoSpinningRef.current = true
      if (!isSpinning && wheelRef.current) {
        wheelRef.current.spin()
      }
    }
  }

  // Reset all assignments
  const handleReset = () => {
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    setRecentWinner(null)
    setRemainingStudents([...allStudents])
    setGroups(createBalancedGroups(groupCount, allStudents.length))
  }

  // Update students from raw text
  const handleApplyStudents = () => {
    const parsed = rawText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (parsed.length === 0) {
      alert('Masukkan minimal satu nama peserta.')
      return
    }

    setAllStudents(parsed)
    setRemainingStudents(parsed)
    setGroups(createBalancedGroups(groupCount, parsed.length))
    setIsEditorOpen(false)
    setRecentWinner(null)
  }

  // Shuffle students
  const handleShuffleStudents = () => {
    setRemainingStudents((prev) => {
      const copy = [...prev]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    })
  }

  // Copy results to clipboard
  const handleCopyResults = () => {
    const lines: string[] = []
    lines.push(`=== HASIL PEMBAGIAN KELOMPOK (${groups.length} KELOMPOK) ===`)
    lines.push(`Waktu: ${new Date().toLocaleString('id-ID')}`)
    lines.push(`Total Peserta: ${totalAllocated} / ${allStudents.length}`)
    lines.push('--------------------------------------------------')

    groups.forEach((grp) => {
      lines.push(`\n[ ${grp.name.toUpperCase()} ] (${grp.members.length}/${grp.capacity}):`)
      if (grp.members.length === 0) {
        lines.push('  - (Belum ada anggota)')
      } else {
        grp.members.forEach((m, idx) => {
          lines.push(`  ${idx + 1}. ${m.name}`)
        })
      }
    })

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wheelColors = WHEEL_THEMES[0].colors

  // Clean responsive grid layout based on group count
  const gridLayoutClass =
    groupCount === 1
      ? 'grid-cols-1 max-w-xl mx-auto'
      : groupCount <= 4
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-3 sm:p-5 font-sans">
      {/* Streamlined Controls Bar */}
      <section
        className={`rounded-2xl border p-3.5 sm:p-4.5 shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Instant Group Selector & Status */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Group Count Selector (1 to 10) */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="group-select"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap"
              >
                Kelompok:
              </label>
              <select
                id="group-select"
                value={groupCount}
                disabled={isSpinning || isAutoSpinning}
                onChange={(e) => handleGroupCountChange(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} Kelompok
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                {totalAllocated} / {allStudents.length}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Terbagi
              </span>
            </div>

            {/* Active Target Indicator */}
            {activeTargetGroup && !isCompleted && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs">
                <span
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: activeTargetGroup.color }}
                />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Target: {activeTargetGroup.name}
                </span>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  ({activeTargetGroup.members.length}/{activeTargetGroup.capacity})
                </span>
              </div>
            )}

            {isCompleted && (
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Semua Kelompok Lengkap
              </span>
            )}

            {/* Edit Participants Button */}
            <button
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              disabled={isSpinning || isAutoSpinning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Kelola daftar nama peserta"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Siswa ({allStudents.length})</span>
            </button>
          </div>

          {/* Right: Familiar Action Buttons (Spin, Auto Spin, Copy, Reset) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Spin Button */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || isCompleted || remainingStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs hover:shadow active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Spin</span>
            </button>

            {/* Auto Spin Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={isCompleted || remainingStudents.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer ${
                isAutoSpinning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              {isAutoSpinning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Auto Spin</span>
                </>
              )}
            </button>

            {/* Copy Results Button */}
            <button
              onClick={handleCopyResults}
              disabled={totalAllocated === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isSpinning || isAutoSpinning || totalAllocated === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Reset seluruh kelompok dan muat ulang 35 nama"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Collapsible Student Names Editor Panel */}
        {isEditorOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Daftar Nama Peserta (Satu nama per baris)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffleStudents}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Acak Urutan</span>
                </button>
                <button
                  onClick={() => setRawText(DEFAULT_STUDENTS.join('\n'))}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Kembalikan 35 Siswa
                </button>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-xl border font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="Ketik atau tempel nama peserta di sini..."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApplyStudents}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Terapkan & Atur Ulang
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Spinner Wheel (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            className={`w-full rounded-2xl border p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <Wheel
              ref={wheelRef}
              items={remainingStudents}
              colors={wheelColors}
              spinDuration={isAutoSpinning ? 1.4 : 2.8}
              isSpinning={isSpinning}
              darkMode={darkMode}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />

            {/* Quick Helper */}
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium text-center">
              Sisa di roda: <span className="font-bold text-slate-800 dark:text-slate-200">{remainingStudents.length}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{allStudents.length}</span> siswa
            </div>

            {/* Recent Winner Announcement Banner */}
            {recentWinner && (
              <div
                className="mt-3 w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-xs"
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  borderColor: recentWinner.groupColor,
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: recentWinner.groupColor }}
                  />
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] shrink-0">
                    Terpilih:
                  </span>
                  <span className="text-slate-900 dark:text-white truncate font-bold">
                    {recentWinner.name}
                  </span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: recentWinner.groupColor }}
                >
                  {recentWinner.groupName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Groups Grid (7 cols on lg) */}
        <div className="lg:col-span-7">
          <div className={`grid ${gridLayoutClass} gap-3.5`}>
            {groups.map((group) => {
              const isFull = group.members.length >= group.capacity
              const isCurrent = activeTargetGroup?.id === group.id && !isFull
              const palette = GROUP_PALETTE.find((p) => p.color === group.color) || GROUP_PALETTE[0]

              return (
                <div
                  key={group.id}
                  style={{ borderLeft: `4px solid ${group.color}` }}
                  className={`rounded-2xl border transition-all flex flex-col overflow-hidden shadow-xs ${
                    isCurrent ? 'ring-2 ring-blue-500/80 shadow-md' : ''
                  } ${
                    darkMode
                      ? isFull
                        ? 'bg-slate-900/90 border-slate-800 opacity-95'
                        : 'bg-slate-900 border-slate-800'
                      : isFull
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Group Header */}
                  <div
                    className="px-3.5 py-2.5 flex items-center justify-between border-b"
                    style={{
                      borderBottomColor: darkMode ? '#334155' : '#e2e8f0',
                      backgroundColor: darkMode ? palette.darkBg : palette.bg,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {group.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                          Mengisi
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          isFull
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {group.members.length} / {group.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Member Slots */}
                  <div className="p-2.5 flex-1 flex flex-col gap-1.5 min-h-[160px]">
                    {Array.from({ length: group.capacity }).map((_, index) => {
                      const member = group.members[index]
                      const isNext = isCurrent && index === group.members.length

                      if (member) {
                        return (
                          <div
                            key={index}
                            className="py-1.5 px-2.5 flex items-center justify-between text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                {String(index + 1).padStart(2, '0')}.
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {member.name}
                              </span>
                            </div>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </div>
                        )
                      }

                      if (isNext) {
                        return (
                          <div
                            key={index}
                            className="py-1.5 px-2.5 flex items-center justify-between text-xs rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/80 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300/40"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="font-mono text-[11px] font-bold text-blue-500 dark:text-blue-400 shrink-0">
                                {String(index + 1).padStart(2, '0')}.
                              </span>
                              <span className="text-[11px] font-medium italic">
                                Siap diisi (Putaran Berikutnya)
                              </span>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                          </div>
                        )
                      }

                      return (
                        <div
                          key={index}
                          className="py-1.5 px-2.5 flex items-center gap-2.5 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400"
                        >
                          <span className="font-mono text-[11px] font-medium shrink-0">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <span className="text-[11px] italic">
                            Slot kosong
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Completion Celebration Card */}
          {isCompleted && (
            <div
              className={`mt-4 p-5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2.5 shadow-sm ${
                darkMode
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Seluruh Kelompok Berhasil Terbentuk Sempurna!
              </h3>
              <p className="text-xs opacity-90 max-w-md">
                Total {totalAllocated} siswa telah terdistribusi merata ke dalam {groups.length} kelompok.
              </p>
              <button
                onClick={handleCopyResults}
                className="mt-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                {copied ? 'Hasil Berhasil Disalin!' : 'Salin Hasil Pembagian Kelompok'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
