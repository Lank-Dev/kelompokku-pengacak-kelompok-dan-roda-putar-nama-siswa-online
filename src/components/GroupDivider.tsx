import React, { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Trophy,
  Sparkles,
  Pause,
  AlertCircle,
  Award,
} from 'lucide-react'
import { Wheel, type WheelHandle } from './Wheel'
import { WHEEL_THEMES } from '../utils/themes'
import {
  POOL_1,
  POOL_2,
  POOL_3,
  PROMOTION_CANDIDATES,
  type GroupMember,
  type GroupData,
  INITIAL_GROUPS,
} from '../utils/participants'

export type DividerStage =
  | 'STAGE_1_PROMOTION' // Wheel: Dzaky vs Ibra
  | 'STAGE_2_GROUPS_AB' // Wheel: 11 Pool 1 + 1 Promoted -> Fills A (6) & B (6)
  | 'STAGE_3_GROUPS_CDEF' // Wheel: 23 Remaining Pool 2 & 3 -> Fills C (6), D (6), E (6), F (5)
  | 'COMPLETED'

interface GroupDividerProps {
  darkMode: boolean
}

export const GroupDivider: React.FC<GroupDividerProps> = ({ darkMode }) => {
  const wheelRef = useRef<WheelHandle | null>(null)

  // Divider State
  const [stage, setStage] = useState<DividerStage>('STAGE_1_PROMOTION')
  const [promotedStudent, setPromotedStudent] = useState<string | null>(null)
  const [groups, setGroups] = useState<GroupData[]>(INITIAL_GROUPS)
  const [wheelItems, setWheelItems] = useState<string[]>(PROMOTION_CANDIDATES)

  // Spinning & Automation state
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>(
    'Putaran Pertama: Menentukan 1 orang dari Nomor 2 yang naik ke Nomor 1 antara Dzaky Almer Rafif vs Ibra Muhammad.'
  )
  const [lastEvent, setLastEvent] = useState<{
    name: string
    note: string
    isPromotion?: boolean
  } | null>(null)

  // Keep ref in sync for timeouts
  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning
  }, [isAutoSpinning])

  // Determine current active target group
  const activeTargetGroupId = React.useMemo<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null>(() => {
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

  // Total allocated count
  const totalAllocated = groups.reduce((acc, g) => acc + g.members.length, 0)

  // Handle Spin Start
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
  }, [])

  // Handle Spin End
  const handleSpinEnd = useCallback(
    (winner: string) => {
      setIsSpinning(false)

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // STAGE 1: Promotion Pick
      if (stage === 'STAGE_1_PROMOTION') {
        setPromotedStudent(winner)
        setLastEvent({
          name: winner,
          note: 'Terpilih naik dari Nomor 2 ke Nomor 1!',
          isPromotion: true,
        })
        setStatusMessage(
          `⭐ ${winner} terpilih naik ke Nomor 1! Memasuki Tahap 2: Pembagian Kelompok A & B (12 orang).`
        )

        // Celebrate promotion
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })

        // Transition to Stage 2: 11 Pool 1 + Winner
        const stage2Pool = [...POOL_1, winner]
        setWheelItems(stage2Pool)
        setStage('STAGE_2_GROUPS_AB')

        // If auto spinning, schedule next spin
        if (isAutoSpinningRef.current) {
          setTimeout(() => {
            if (isAutoSpinningRef.current && wheelRef.current) {
              wheelRef.current.spin()
            }
          }, 800)
        }
        return
      }

      // STAGE 2: Groups A & B
      if (stage === 'STAGE_2_GROUPS_AB') {
        const isPromoted = winner === promotedStudent
        const newMember: GroupMember = {
          name: winner,
          originalPool: isPromoted ? 2 : 1,
          isPromoted,
          timestamp,
        }

        let nextTargetId: 'A' | 'B' = 'A'
        let updatedGroups = groups.map((grp) => {
          if (grp.id === 'A') {
            if (grp.members.length < grp.capacity) {
              nextTargetId = 'A'
              return { ...grp, members: [...grp.members, newMember] }
            }
          }
          return grp
        })

        // If A was already full, add to B
        const aFull = updatedGroups.find((g) => g.id === 'A')!.members.length >= 6
        if (aFull && nextTargetId !== 'A') {
          nextTargetId = 'B'
          updatedGroups = updatedGroups.map((grp) => {
            if (grp.id === 'B' && grp.members.length < grp.capacity) {
              return { ...grp, members: [...grp.members, newMember] }
            }
            return grp
          })
        } else if (aFull) {
          // If this insert filled A, next target will be B
          // Checked below
        }

        setGroups(updatedGroups)
        const updatedRemainingWheel = wheelItems.filter((item) => item !== winner)
        setWheelItems(updatedRemainingWheel)

        const targetGroupObj = updatedGroups.find((g) =>
          g.members.some((m) => m.name === winner)
        )
        const targetId = targetGroupObj ? targetGroupObj.id : nextTargetId
        const countInGroup = targetGroupObj ? targetGroupObj.members.length : 1

        setLastEvent({
          name: winner,
          note: `Masuk ke ${targetGroupObj?.name || 'Kelompok ' + targetId} (${countInGroup}/6)`,
          isPromotion: isPromoted,
        })

        const totalInAB =
          (updatedGroups.find((g) => g.id === 'A')?.members.length || 0) +
          (updatedGroups.find((g) => g.id === 'B')?.members.length || 0)

        // Check if Stage 2 is complete (12 members placed)
        if (totalInAB >= 12) {
          // Stage 2 Finished -> Setup Stage 3!
          // Remaining Pool 2 (excluding promoted winner) + Pool 3
          const remainingPool2 = POOL_2.filter((name) => name !== promotedStudent)
          const stage3Pool = [...remainingPool2, ...POOL_3] // 11 + 12 = 23

          setStage('STAGE_3_GROUPS_CDEF')
          setWheelItems(stage3Pool)
          setStatusMessage(
            'Kelompok A & B sudah penuh! Memasuki Tahap 3: Pembagian 23 peserta sisa ke Kelompok C, D, E, dan F.'
          )

          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 800)
          }
        } else {
          const currentTarget =
            (updatedGroups.find((g) => g.id === 'A')?.members.length || 0) < 6 ? 'A' : 'B'
          setStatusMessage(
            `Tahap 2: Mengisi Kelompok ${currentTarget}. (${totalInAB}/12 peserta Nomor 1 terbagi).`
          )

          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 700)
          }
        }
        return
      }

      // STAGE 3: Groups C, D, E, F
      if (stage === 'STAGE_3_GROUPS_CDEF') {
        const isFromPool2 = POOL_2.includes(winner)
        const newMember: GroupMember = {
          name: winner,
          originalPool: isFromPool2 ? 2 : 3,
          timestamp,
        }

        // Find first group with space
        let placedGroupId: 'C' | 'D' | 'E' | 'F' = 'C'
        let updatedGroups = groups.map((grp) => {
          if (
            ['C', 'D', 'E', 'F'].includes(grp.id) &&
            grp.members.length < grp.capacity &&
            placedGroupId === 'C'
          ) {
            placedGroupId = grp.id as 'C' | 'D' | 'E' | 'F'
            return { ...grp, members: [...grp.members, newMember] }
          }
          return grp
        })

        // If C was full, insert in first eligible
        const wasPlaced = updatedGroups.some((g) => g.members.some((m) => m.name === winner))
        if (!wasPlaced) {
          for (const gid of ['C', 'D', 'E', 'F'] as const) {
            const grp = updatedGroups.find((g) => g.id === gid)
            if (grp && grp.members.length < grp.capacity) {
              placedGroupId = gid
              updatedGroups = updatedGroups.map((g) =>
                g.id === gid ? { ...g, members: [...g.members, newMember] } : g
              )
              break
            }
          }
        }

        setGroups(updatedGroups)
        const updatedRemainingWheel = wheelItems.filter((item) => item !== winner)
        setWheelItems(updatedRemainingWheel)

        const targetGroupObj = updatedGroups.find((g) => g.id === placedGroupId)
        setLastEvent({
          name: winner,
          note: `Masuk ke ${targetGroupObj?.name} (${targetGroupObj?.members.length}/${targetGroupObj?.capacity})`,
          isPromotion: false,
        })

        const totalPlaced = updatedGroups.reduce((acc, g) => acc + g.members.length, 0)

        // Check if all 35 members are placed
        if (totalPlaced >= 35) {
          setStage('COMPLETED')
          setIsAutoSpinning(false)
          setStatusMessage(
            '🎉 Selesai! Semua 35 peserta telah berhasil dibagikan secara adil ke 6 kelompok (A - F).'
          )

          // Grand celebration confetti
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } })
          setTimeout(() => {
            confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } })
            confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } })
          }, 400)
        } else {
          // Find next target
          let nextTarget = 'C'
          for (const gid of ['C', 'D', 'E', 'F'] as const) {
            const g = updatedGroups.find((grp) => grp.id === gid)
            if (g && g.members.length < g.capacity) {
              nextTarget = gid
              break
            }
          }

          setStatusMessage(
            `Tahap 3: Mengisi Kelompok ${nextTarget}. (${totalPlaced}/35 peserta telah ditempatkan, sisa ${updatedRemainingWheel.length} di roda).`
          )

          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 650)
          }
        }
      }
    },
    [stage, promotedStudent, groups, wheelItems]
  )

  // Trigger Single Spin
  const handleSingleSpin = () => {
    if (isSpinning || stage === 'COMPLETED' || wheelItems.length === 0) return
    wheelRef.current?.spin()
  }

  // Toggle Auto Spin
  const handleToggleAutoSpin = () => {
    if (isAutoSpinning) {
      setIsAutoSpinning(false)
      isAutoSpinningRef.current = false
    } else {
      if (stage === 'COMPLETED' || wheelItems.length === 0) return
      setIsAutoSpinning(true)
      isAutoSpinningRef.current = true
      if (!isSpinning) {
        wheelRef.current?.spin()
      }
    }
  }

  // Reset Everything to Beginning
  const handleReset = () => {
    if (
      totalAllocated > 0 &&
      !confirm('Apakah Anda yakin ingin mengulang pembagian kelompok dari awal?')
    ) {
      return
    }
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    setStage('STAGE_1_PROMOTION')
    setPromotedStudent(null)
    setGroups(INITIAL_GROUPS)
    setWheelItems(PROMOTION_CANDIDATES)
    setLastEvent(null)
    setStatusMessage(
      'Putaran Pertama: Menentukan 1 orang dari Nomor 2 yang naik ke Nomor 1 antara Dzaky Almer Rafif vs Ibra Muhammad.'
    )
  }

  // Copy Formatted Results to Clipboard
  const handleCopyResults = () => {
    const lines: string[] = []
    lines.push('📋 HASIL PEMBAGIAN 6 KELOMPOK (35 PESERTA)')
    lines.push(`Waktu: ${new Date().toLocaleString('id-ID')}`)
    lines.push('----------------------------------------')

    groups.forEach((grp) => {
      lines.push(`\n${grp.name.toUpperCase()} (${grp.members.length}/${grp.capacity} Orang):`)
      if (grp.members.length === 0) {
        lines.push('  (Belum ada anggota)')
      } else {
        grp.members.forEach((m, idx) => {
          const promoTag = m.isPromoted ? ' ⭐ [Naik dari No. 2]' : ` [No. ${m.originalPool}]`
          lines.push(`  ${idx + 1}. ${m.name}${promoTag}`)
        })
      }
    })

    lines.push('\n----------------------------------------')
    lines.push('Aturan Terpenuhi:')
    lines.push('- Kelompok A & B (masing-masing 6): 11 orang Nomor 1 + 1 orang naik dari Nomor 2.')
    lines.push('- Kelompok C, D, E (masing-masing 6) & F (5): 23 peserta sisa dari Nomor 2 & 3.')

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Theme colors for current wheel
  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-3 sm:p-5">
      {/* Top Banner Status & Instructions */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                stage === 'STAGE_1_PROMOTION'
                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                  : stage === 'STAGE_2_GROUPS_AB'
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                  : stage === 'STAGE_3_GROUPS_CDEF'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {stage === 'STAGE_1_PROMOTION' && 'Tahap 1 / 3: Penentuan Promosi No. 2'}
              {stage === 'STAGE_2_GROUPS_AB' && 'Tahap 2 / 3: Pengisian Kelompok A & B'}
              {stage === 'STAGE_3_GROUPS_CDEF' && 'Tahap 3 / 3: Pengisian Kelompok C, D, E & F'}
              {stage === 'COMPLETED' && '✓ Selesai: Semua Kelompok Terpenuhi'}
            </span>

            {promotedStudent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Naik ke No. 1: <strong>{promotedStudent}</strong>
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
            {statusMessage}
          </p>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Total Progres: <strong className="text-blue-600 dark:text-blue-400">{totalAllocated}</strong> / 35 peserta terbagi
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Single Spin Button */}
          <button
            onClick={handleSingleSpin}
            disabled={isSpinning || isAutoSpinning || stage === 'COMPLETED'}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            title="Putar roda satu kali"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Putar</span>
          </button>

          {/* Auto Spin Button */}
          <button
            onClick={handleToggleAutoSpin}
            disabled={stage === 'COMPLETED'}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer ${
              isAutoSpinning
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
            } disabled:opacity-40 disabled:pointer-events-none`}
            title={isAutoSpinning ? 'Hentikan putaran otomatis' : 'Putar otomatis berturut-turut sampai selesai'}
          >
            {isAutoSpinning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Hentikan</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Putar Otomatis</span>
              </>
            )}
          </button>

          {/* Copy Results Button */}
          <button
            onClick={handleCopyResults}
            disabled={totalAllocated === 0}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
            } disabled:opacity-40 disabled:pointer-events-none`}
            title="Salin hasil pembagian kelompok ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Salin Hasil</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isSpinning || isAutoSpinning}
            className={`p-2.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
              darkMode
                ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
            } disabled:opacity-40 disabled:pointer-events-none`}
            title="Ulangi pembagian dari awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Wheel Stage + 6 Group Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Stage: Spinner Wheel Canvas */}
        <div
          className={`lg:col-span-5 flex flex-col items-center justify-center rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden transition-colors min-h-[460px] ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
          }`}
        >
          {/* Wheel Component */}
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

          {/* Recent Event Notification Badge */}
          {lastEvent && (
            <div className="mt-3.5 w-full p-3 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-500 shadow-sm flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-xs">
                  {lastEvent.isPromotion ? <Award className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Terpilih Terakhir:
                  </div>
                  <div className="text-sm font-black text-slate-950 dark:text-white truncate">
                    {lastEvent.name}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 shrink-0">
                {lastEvent.note}
              </span>
            </div>
          )}

          {/* Current Pool Status Helper */}
          <div className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400 font-semibold">
            {stage === 'STAGE_1_PROMOTION' && (
              <span>Roda berisi 2 calon promosi dari Nomor 2</span>
            )}
            {stage === 'STAGE_2_GROUPS_AB' && (
              <span>Sisa {wheelItems.length} peserta di roda (Nomor 1 & Promosi)</span>
            )}
            {stage === 'STAGE_3_GROUPS_CDEF' && (
              <span>Sisa {wheelItems.length} peserta di roda (Nomor 2 & 3)</span>
            )}
            {stage === 'COMPLETED' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                ✓ Roda selesai membagi semua kelompok
              </span>
            )}
          </div>
        </div>

        {/* Right Stage: 6 Group Panels Grid (A - F) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {groups.map((group) => {
            const isFull = group.members.length >= group.capacity
            const isCurrentlyActive = activeTargetGroupId === group.id && !isFull

            return (
              <div
                key={group.id}
                className={`flex flex-col rounded-2xl border-2 transition-all p-3.5 shadow-sm relative overflow-hidden ${
                  isCurrentlyActive
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-md ring-2 ring-amber-400/50'
                    : isFull
                    ? darkMode
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-white border-slate-300'
                    : darkMode
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Header of Group Card */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="font-black text-sm text-slate-950 dark:text-white">
                      {group.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isCurrentlyActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                        Sedang Diisi
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                        isFull
                          ? 'bg-emerald-600 text-white'
                          : isCurrentlyActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {group.members.length}/{group.capacity}
                    </span>
                  </div>
                </div>

                {/* Group Pool Composition Notice */}
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {['A', 'B'].includes(group.id)
                    ? 'Komposisi: Khusus Nomor 1 + 1 Orang Naik'
                    : 'Komposisi: Campuran Nomor 2 & 3'}
                </div>

                {/* Member Slots List */}
                <div className="flex-1 space-y-1.5 min-h-[170px]">
                  {Array.from({ length: group.capacity }).map((_, index) => {
                    const member = group.members[index]
                    const isNextSlot = isCurrentlyActive && index === group.members.length

                    if (member) {
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                            member.isPromoted
                              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 text-slate-950 dark:text-white font-extrabold'
                              : darkMode
                              ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                              : 'bg-slate-100/90 border-slate-300 text-slate-900 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="truncate">{member.name}</span>
                          </div>

                          {member.isPromoted ? (
                            <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 bg-amber-400/50 px-1.5 py-0.5 rounded shadow-2xs shrink-0 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Naik No. 2
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shrink-0">
                              No. {member.originalPool}
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs border border-dashed transition-all ${
                          isNextSlot
                            ? 'border-amber-400 bg-amber-100/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold'
                            : 'border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-800 font-mono text-[10px] flex items-center justify-center shrink-0 opacity-60">
                          {index + 1}
                        </span>
                        <span className="text-[11px] italic">
                          {isNextSlot ? 'Slot berikutnya...' : 'Kosong'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completed Modal Announcement */}
      {stage === 'COMPLETED' && (
        <div className="p-5 rounded-3xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-center shadow-lg animate-in zoom-in-95">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-3 shadow-md">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mb-1">
            Pembagian 35 Peserta ke 6 Kelompok Selesai!
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium max-w-xl mx-auto mb-4">
            Semua aturan telah diterapkan: 12 peserta (Nomor 1 + 1 promosi) berada di Kelompok A & B, serta 23 peserta sisa berada di Kelompok C, D, E, dan F.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleCopyResults}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Hasil Berhasil Disalin!' : 'Salin Susunan Lengkap'}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi dari Awal</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules Explanatory Footer Card */}
      <div
        className={`p-4 rounded-xl border text-xs transition-colors ${
          darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
        }`}
      >
        <div className="font-black text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Aturan Sistem Pengacakan Adil:</span>
        </div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>35 Peserta</strong> dibagi ke <strong>6 Kelompok</strong>: Kelompok A–E (6 orang) & Kelompok F (5 orang).
          </li>
          <li>
            <strong>Tahap 1</strong>: Menentukan 1 orang yang naik dari Nomor 2 ke Nomor 1 antara Dzaky Almer Rafif vs Ibra Muhammad. Yang tidak terpilih kembali ke pool Nomor 2.
          </li>
          <li>
            <strong>Tahap 2</strong>: 12 orang (11 Nomor 1 + 1 Promosi) mengisi penuh Kelompok A (6 orang) dan Kelompok B (6 orang). Mereka tidak bertemu Nomor 2 atau 3.
          </li>
          <li>
            <strong>Tahap 3</strong>: 23 orang sisa (11 Nomor 2 + 12 Nomor 3) diacak bebas ke Kelompok C (6), D (6), E (6), dan F (5).
          </li>
        </ul>
      </div>
    </div>
  )
}
