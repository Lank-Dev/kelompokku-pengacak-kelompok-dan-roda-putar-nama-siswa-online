import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import confetti from 'canvas-confetti'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Pause,
  CheckCircle2,
  Trophy,
} from 'lucide-react'
import { Wheel, type WheelHandle } from './Wheel'
import { WHEEL_THEMES } from '../utils/themes'
import {
  POOL_1,
  POOL_2,
  POOL_3,
  PROMOTION_CANDIDATES,
  INITIAL_RULE_GROUPS,
  type GroupData,
} from '../utils/participants'

export type DividerStage =
  | 'STAGE_1_PROMOTION' // Wheel: Dzaky vs Ibra (1 winner promoted to Groups A & B pool)
  | 'STAGE_2_GROUPS_AB' // Wheel: 11 Pool 1 + 1 Promoted (12 people) -> Fills A (6) then B (6)
  | 'STAGE_3_GROUPS_CDEF' // Wheel: 23 Remaining -> Fills C (6), D (6), E (6), F (5)
  | 'COMPLETED'

interface GroupDividerProps {
  darkMode: boolean
}

export const GroupDivider: React.FC<GroupDividerProps> = ({ darkMode }) => {
  const wheelRef = useRef<WheelHandle | null>(null)

  // Stage & Participant state strictly following the 35 students rules
  const [stage, setStage] = useState<DividerStage>('STAGE_1_PROMOTION')
  const [promotedStudent, setPromotedStudent] = useState<string | null>(null)
  const [groups, setGroups] = useState<GroupData[]>(INITIAL_RULE_GROUPS)
  const [wheelItems, setWheelItems] = useState<string[]>([...PROMOTION_CANDIDATES])

  // Spinning & Automation state
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)

  // Recent winner announcement
  const [recentWinner, setRecentWinner] = useState<{
    name: string
    note: string
    isPromotion?: boolean
    groupColor?: string
  } | null>(null)

  // Keep auto-spinning ref updated for async callbacks
  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning
  }, [isAutoSpinning])

  // Total allocated count across all groups
  const totalAllocated = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.members.length, 0)
  }, [groups])

  // Current active target group being filled
  const activeTargetGroup = useMemo<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null>(() => {
    if (stage === 'STAGE_1_PROMOTION') return null
    if (stage === 'STAGE_2_GROUPS_AB') {
      const groupA = groups.find((g) => g.id === 'A')
      if (groupA && groupA.members.length < groupA.capacity) return 'A'
      return 'B'
    }
    if (stage === 'STAGE_3_GROUPS_CDEF') {
      for (const gid of ['C', 'D', 'E', 'F'] as const) {
        const g = groups.find((grp) => grp.id === gid)
        if (g && g.members.length < g.capacity) return gid
      }
    }
    return null
  }, [stage, groups])

  // Human-readable status message
  const statusMessage = useMemo(() => {
    if (stage === 'STAGE_1_PROMOTION') {
      return 'Putaran Pertama: Mengundi antara Dzaky Almer Rafif vs Ibra Muhammad untuk menentukan 1 orang yang naik ke Kelompok A & B.'
    }
    if (stage === 'STAGE_2_GROUPS_AB') {
      if (activeTargetGroup === 'A') {
        const grp = groups.find((g) => g.id === 'A')
        return `Tahap Kedua: Mengundi 12 peserta untuk mengisi Kelompok A (${grp?.members.length || 0}/6).`
      }
      const grp = groups.find((g) => g.id === 'B')
      return `Tahap Kedua: Kelompok A penuh! Mengundi untuk mengisi Kelompok B (${grp?.members.length || 0}/6).`
    }
    if (stage === 'STAGE_3_GROUPS_CDEF') {
      const grp = groups.find((g) => g.id === activeTargetGroup)
      return `Tahap Ketiga: Mengundi 23 peserta sisa untuk mengisi ${grp?.name} (${grp?.members.length || 0}/${grp?.capacity}).`
    }
    return 'Semua 35 peserta telah berhasil dibagikan secara adil ke 6 kelompok!'
  }, [stage, activeTargetGroup, groups])

  // Handle spin start
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
    setRecentWinner(null)
  }, [])

  // Handle spin finish strictly according to business rules
  const handleSpinEnd = useCallback(
    (winner: string) => {
      setIsSpinning(false)

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // STAGE 1: PROMOTION DRAW (Dzaky vs Ibra)
      if (stage === 'STAGE_1_PROMOTION') {
        setPromotedStudent(winner)
        setRecentWinner({
          name: winner,
          note: 'Terpilih Naik ke Kelompok A & B!',
          isPromotion: true,
          groupColor: '#D97706',
        })

        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#2563EB', '#10B981'],
          })
        } catch {
          // ignore
        }

        // Prepare Stage 2: 11 from Pool 1 + 1 Promoted winner = 12 people
        const stage2Students = [...POOL_1, winner]
        setWheelItems(stage2Students)
        setStage('STAGE_2_GROUPS_AB')

        // If auto-spin is on, trigger next spin after slight delay
        if (isAutoSpinningRef.current) {
          setTimeout(() => {
            if (isAutoSpinningRef.current && wheelRef.current) {
              wheelRef.current.spin()
            }
          }, 1100)
        }
        return
      }

      // STAGE 2: GROUPS A & B (12 People)
      if (stage === 'STAGE_2_GROUPS_AB') {
        const targetGid = activeTargetGroup
        if (!targetGid) return

        const isPromo = winner === promotedStudent
        const currentTarget = groups.find((g) => g.id === targetGid)
        const targetColor = currentTarget?.color || '#2563EB'

        // Add to group
        const updatedGroups = groups.map((g) =>
          g.id === targetGid
            ? {
                ...g,
                members: [...g.members, { name: winner, timestamp, isPromoted: isPromo }],
              }
            : g
        )
        setGroups(updatedGroups)

        setRecentWinner({
          name: winner,
          note: `Masuk ke ${currentTarget?.name}`,
          isPromotion: isPromo,
          groupColor: targetColor,
        })

        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.65 },
            colors: [targetColor, '#2563EB', '#059669'],
          })
        } catch {
          // ignore
        }

        // Remove chosen name from wheel
        const nextWheelItems = wheelItems.filter((item) => item !== winner)

        // Check if Groups A & B are now both completely full (12 members allocated)
        const totalAB = updatedGroups
          .filter((g) => g.id === 'A' || g.id === 'B')
          .reduce((sum, g) => sum + g.members.length, 0)

        if (totalAB >= 12) {
          // Transition to Stage 3: 23 Remaining Participants
          // Remaining from Pool 2 (excluding the promoted winner) + all Pool 3
          const unchosenCandidate = PROMOTION_CANDIDATES.find((c) => c !== promotedStudent)
          const remainingPool2 = POOL_2.filter(
            (p) => p !== promotedStudent && p !== unchosenCandidate
          )
          const stage3Students = [
            ...(unchosenCandidate ? [unchosenCandidate] : []),
            ...remainingPool2,
            ...POOL_3,
          ]

          setWheelItems(stage3Students)
          setStage('STAGE_3_GROUPS_CDEF')

          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 1100)
          }
        } else {
          setWheelItems(nextWheelItems)
          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 850)
          }
        }
        return
      }

      // STAGE 3: GROUPS C, D, E & F (23 People)
      if (stage === 'STAGE_3_GROUPS_CDEF') {
        const targetGid = activeTargetGroup
        if (!targetGid) return

        const currentTarget = groups.find((g) => g.id === targetGid)
        const targetColor = currentTarget?.color || '#059669'

        // Add to group
        const updatedGroups = groups.map((g) =>
          g.id === targetGid
            ? {
                ...g,
                members: [...g.members, { name: winner, timestamp }],
              }
            : g
        )
        setGroups(updatedGroups)

        setRecentWinner({
          name: winner,
          note: `Masuk ke ${currentTarget?.name}`,
          groupColor: targetColor,
        })

        try {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.65 },
            colors: [targetColor, '#2563EB', '#D97706'],
          })
        } catch {
          // ignore
        }

        const nextWheelItems = wheelItems.filter((item) => item !== winner)

        // Check if all 35 students have been allocated
        const newTotal = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)
        if (newTotal >= 35) {
          setStage('COMPLETED')
          setIsAutoSpinning(false)
          isAutoSpinningRef.current = false
          setWheelItems([])

          try {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.5 },
            })
          } catch {
            // ignore
          }
        } else {
          setWheelItems(nextWheelItems)
          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 850)
          }
        }
      }
    },
    [stage, groups, activeTargetGroup, promotedStudent, wheelItems]
  )

  // Single spin trigger
  const handleSingleSpin = () => {
    if (isSpinning || isAutoSpinning || stage === 'COMPLETED' || wheelItems.length === 0) return
    if (wheelRef.current) {
      wheelRef.current.spin()
    }
  }

  // Toggle auto spin
  const handleToggleAutoSpin = () => {
    if (stage === 'COMPLETED' || wheelItems.length === 0) return

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

  // Reset all assignments strictly back to Stage 1
  const handleReset = () => {
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    setStage('STAGE_1_PROMOTION')
    setPromotedStudent(null)
    setRecentWinner(null)
    setWheelItems([...PROMOTION_CANDIDATES])
    setGroups(INITIAL_RULE_GROUPS)
  }

  // Copy formatted results to clipboard
  const handleCopyResults = () => {
    const lines: string[] = []
    lines.push('=== HASIL PEMBAGIAN 6 KELOMPOK (35 PESERTA) ===')
    lines.push(`Tanggal: ${new Date().toLocaleDateString('id-ID')} | Pukul: ${new Date().toLocaleTimeString('id-ID')}`)
    lines.push('--------------------------------------------------')

    groups.forEach((grp) => {
      lines.push(`\n[ ${grp.name.toUpperCase()} ] (${grp.members.length}/${grp.capacity} Orang):`)
      if (grp.members.length === 0) {
        lines.push('  - (Belum ada peserta)')
      } else {
        grp.members.forEach((m, idx) => {
          const promoTag = m.isPromoted ? ' [★ Terpilih Naik]' : ''
          lines.push(`  ${idx + 1}. ${m.name}${promoTag}`)
        })
      }
    })

    lines.push('\n--------------------------------------------------')
    lines.push('Catatan Aturan Pembagian:')
    lines.push(`- Kelompok A & B (masing-masing 6 orang): 12 peserta tahap pertama (termasuk promosi: ${promotedStudent || '-'})`)
    lines.push('- Kelompok C, D, E (masing-masing 6 orang) & F (5 orang): 23 peserta sisa')

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-3 sm:p-5 font-sans">
      {/* Controls Bar */}
      <section
        className={`rounded-xl border p-4 sm:p-5 transition-colors shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Stage Title & Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Controls
              </span>

              {/* Stage Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  stage === 'STAGE_1_PROMOTION'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : stage === 'STAGE_2_GROUPS_AB'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : stage === 'STAGE_3_GROUPS_CDEF'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {stage === 'STAGE_1_PROMOTION' && 'Tahap 1: Undian Promosi (1 Orang)'}
                {stage === 'STAGE_2_GROUPS_AB' && 'Tahap 2: Kelompok A & B (12 Peserta)'}
                {stage === 'STAGE_3_GROUPS_CDEF' && 'Tahap 3: Kelompok C, D, E & F (23 Peserta)'}
                {stage === 'COMPLETED' && '✓ Selesai'}
              </span>

              {/* Progress Count */}
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {totalAllocated} / 35 Terbagi
              </span>

              {promotedStudent && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  ★ Terpilih Naik: <strong>{promotedStudent}</strong>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {statusMessage}
            </p>
          </div>

          {/* Right: Modern Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Spin Button */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || stage === 'COMPLETED' || wheelItems.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Putar</span>
            </button>

            {/* Auto Spin Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={stage === 'COMPLETED' || wheelItems.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
                isAutoSpinning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              {isAutoSpinning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Hentikan</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Putar Otomatis</span>
                </>
              )}
            </button>

            {/* Copy Results Button */}
            <button
              onClick={handleCopyResults}
              disabled={totalAllocated === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Salin Hasil</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isSpinning || isAutoSpinning || (stage === 'STAGE_1_PROMOTION' && totalAllocated === 0)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Ulangi pembagian dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Spinner Wheel (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            className={`w-full rounded-xl border p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Wheel Active Count Header */}
            <div className="w-full flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Roda ({wheelItems.length} Nama Aktif)</span>
              <span>{isSpinning ? 'Sedang berputar...' : 'Siap diputar'}</span>
            </div>

            <Wheel
              ref={wheelRef}
              items={wheelItems}
              colors={wheelColors}
              spinDuration={isAutoSpinning ? 1.4 : 2.8}
              isSpinning={isSpinning}
              darkMode={darkMode}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
            />

            {/* Recent Winner Banner */}
            {recentWinner && (
              <div
                className="mt-3.5 w-full py-2.5 px-4 rounded-lg border flex items-center justify-between text-xs font-bold transition-all shadow-xs"
                style={{
                  backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                  borderColor: recentWinner.groupColor || '#2563EB',
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: recentWinner.groupColor || '#2563EB' }}
                  />
                  <span className="text-slate-900 dark:text-white truncate">
                    {recentWinner.name}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white shrink-0"
                  style={{ backgroundColor: recentWinner.groupColor || '#2563EB' }}
                >
                  {recentWinner.note}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 6 Groups Grid (7 cols on lg) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {groups.map((group) => {
              const isFull = group.members.length >= group.capacity
              const isCurrent = activeTargetGroup === group.id && !isFull

              return (
                <div
                  key={group.id}
                  style={{ borderLeft: `4px solid ${group.color}` }}
                  className={`rounded-xl border transition-all flex flex-col overflow-hidden shadow-xs ${
                    isCurrent ? 'ring-2 ring-blue-500/70 shadow-sm' : ''
                  } ${
                    darkMode
                      ? isFull
                        ? 'bg-slate-900 border-slate-800 opacity-90'
                        : 'bg-slate-900 border-slate-800'
                      : isFull
                      ? 'bg-white border-slate-200 opacity-95'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Group Header */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          Sedang Diisi
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          isFull
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {group.members.length} / {group.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Member Slots */}
                  <div className="p-2 flex-1 flex flex-col gap-1 min-h-[160px] divide-y divide-slate-100 dark:divide-slate-800/60">
                    {Array.from({ length: group.capacity }).map((_, index) => {
                      const member = group.members[index]
                      const isNext = isCurrent && index === group.members.length

                      if (member) {
                        return (
                          <div
                            key={index}
                            className={`py-1 px-2 flex items-center justify-between text-xs rounded transition-colors ${
                              member.isPromoted
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                                {index + 1}.
                              </span>
                              <span className="truncate font-medium">
                                {member.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {member.isPromoted && (
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1 py-0.2 rounded">
                                  ★ Promosi
                                </span>
                              )}
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={index}
                          className={`py-1 px-2 flex items-center gap-2 text-xs rounded ${
                            isNext
                              ? 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          <span className="font-mono text-[11px] opacity-70 shrink-0">
                            {index + 1}.
                          </span>
                          <span className="text-[11px] italic">
                            {isNext ? '→ [Slot Berikutnya]' : '(Kosong)'}
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
          {stage === 'COMPLETED' && (
            <div
              className={`mt-4 p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">
                Semua 6 Kelompok Telah Terisi Lengkap!
              </h3>
              <p className="text-xs opacity-90">
                Total 35 peserta telah berhasil dibagikan secara adil sesuai seluruh aturan.
              </p>
              <button
                onClick={handleCopyResults}
                className="mt-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {copied ? 'Tersalin ke Clipboard!' : 'Salin Hasil Lengkap'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
