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
  ListOrdered,
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
  | 'STAGE_3_GROUPS_CDEF' // Wheel: 23 Remaining -> Fills C (6), D (6), E (6), F (5)
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
  const [wheelItems, setWheelItems] = useState<string[]>([...PROMOTION_CANDIDATES])

  // Spinning & Automation state
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>(
    'Putaran Pertama: Mengundi antara Dzaky Almer Rafif vs Ibra Muhammad untuk memilih 1 orang naik bergabung ke Kelompok A & B.'
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
          note: 'Terpilih promosi!',
          isPromotion: true,
        })
        setStatusMessage(
          `★ ${winner} terpilih! Memasuki Tahap 2: Pembagian 12 peserta ke Kelompok A & B.`
        )

        // Celebrate promotion
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } })

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
          }, 850)
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
            }, 850)
          }
        } else {
          const currentTarget =
            (updatedGroups.find((g) => g.id === 'A')?.members.length || 0) < 6 ? 'A' : 'B'
          setStatusMessage(
            `Tahap 2: Mengisi Kelompok ${currentTarget}. (${totalInAB}/12 peserta terbagi, sisa ${updatedRemainingWheel.length} di roda).`
          )

          if (isAutoSpinningRef.current) {
            setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 750)
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
            '★ Selesai! Semua 35 peserta telah berhasil dibagikan secara adil ke 6 kelompok (A - F).'
          )

          // Grand celebration confetti
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } })
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
            }, 750)
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
    setWheelItems([...PROMOTION_CANDIDATES])
    setLastEvent(null)
    setStatusMessage(
      'Putaran Pertama: Mengundi antara Dzaky Almer Rafif vs Ibra Muhammad untuk memilih 1 orang naik bergabung ke Kelompok A & B.'
    )
  }

  // Copy Formatted Results to Clipboard
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
    lines.push('Keterangan:')
    lines.push('- Kelompok A & B (masing-masing 6 orang): 12 peserta tahap pertama.')
    lines.push('- Kelompok C, D, E (masing-masing 6 orang) & F (5 orang): 23 peserta sisa.')

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Theme colors for current wheel
  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 p-2 sm:p-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Year 2005 Web 2.0 Classic Control Panel Window */}
      <div
        className={`border-2 rounded-md shadow-xs overflow-hidden transition-colors ${
          darkMode
            ? 'bg-[#1a2332] border-[#2e3e55]'
            : 'bg-[#f4f7fb] border-[#8da4be]'
        }`}
      >
        {/* Classic Window Title Bar */}
        <div className="bg-gradient-to-r from-[#204a77] via-[#2d5f94] to-[#204a77] px-3.5 py-1.5 text-white flex items-center justify-between border-b border-[#143152] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#fbbf24] inline-block shadow-2xs" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-100 font-sans">
              Panel Kontrol Pembagi Kelompok (35 Peserta ke 6 Kelompok)
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-sky-200">
            Progres: {totalAllocated} / 35 Selesai
          </span>
        </div>

        {/* Action Toolbar & Controls */}
        <div className="p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Readout Box */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-xs text-[11px] font-bold uppercase tracking-wide border ${
                  stage === 'STAGE_1_PROMOTION'
                    ? 'bg-[#ede9fe] text-[#5b21b6] border-[#c4b5fd]'
                    : stage === 'STAGE_2_GROUPS_AB'
                    ? 'bg-[#e0f2fe] text-[#0369a1] border-[#7dd3fc]'
                    : stage === 'STAGE_3_GROUPS_CDEF'
                    ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                    : 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                }`}
              >
                {stage === 'STAGE_1_PROMOTION' && 'Tahap 1: Undian Promosi'}
                {stage === 'STAGE_2_GROUPS_AB' && 'Tahap 2: Pengisian Kelompok A & B'}
                {stage === 'STAGE_3_GROUPS_CDEF' && 'Tahap 3: Pengisian Kelompok C, D, E & F'}
                {stage === 'COMPLETED' && '✓ Selesai'}
              </span>

              {promotedStudent && (
                <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                  ★ Peserta Terpilih Naik: <strong>{promotedStudent}</strong>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {statusMessage}
            </p>
          </div>

          {/* Classic Web 2.0 Tactile Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Putar Button */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || stage === 'COMPLETED'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xs bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] border border-[#1e40af] text-white font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Putar roda satu kali"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>PUTAR</span>
            </button>

            {/* Putar Otomatis Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={stage === 'COMPLETED'}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xs font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 cursor-pointer ${
                isAutoSpinning
                  ? 'bg-gradient-to-b from-[#ef4444] to-[#b91c1c] border border-[#991b1b] text-white'
                  : 'bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] border border-[#166534] text-white'
              } disabled:opacity-40 disabled:pointer-events-none`}
              title={isAutoSpinning ? 'Hentikan putaran otomatis' : 'Putar otomatis berturut-turut sampai selesai'}
            >
              {isAutoSpinning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>HENTIKAN</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PUTAR OTOMATIS</span>
                </>
              )}
            </button>

            {/* Salin Hasil Button */}
            <button
              onClick={handleCopyResults}
              disabled={totalAllocated === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold text-xs border shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-0.5 cursor-pointer ${
                darkMode
                  ? 'bg-gradient-to-b from-[#334155] to-[#1e293b] border-[#475569] text-slate-200'
                  : 'bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0] border-[#cbd5e1] text-slate-800'
              } disabled:opacity-40 disabled:pointer-events-none`}
              title="Salin hasil pembagian kelompok ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Salin Hasil</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isSpinning || isAutoSpinning}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xs font-bold text-xs border shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-0.5 cursor-pointer ${
                darkMode
                  ? 'bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-[#991b1b] text-rose-200'
                  : 'bg-gradient-to-b from-[#fee2e2] to-[#fecaca] border-[#f87171] text-rose-900'
              } disabled:opacity-40 disabled:pointer-events-none`}
              title="Ulangi pembagian dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stage (Wheel & Active Names Roster) + Right Stage (6 Groups) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Spinner Wheel Window (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Wheel Frame Window */}
          <div
            className={`border-2 rounded-md shadow-xs overflow-hidden transition-colors ${
              darkMode ? 'bg-[#151c27] border-[#2e3e55]' : 'bg-white border-[#8da4be]'
            }`}
          >
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#204a77] to-[#2d5f94] px-3 py-1.5 text-white flex items-center justify-between border-b border-[#143152]">
              <span className="font-bold text-xs uppercase tracking-wide">
                Roda Spinner ({wheelItems.length} Nama Aktif)
              </span>
              <span className="text-[11px] font-mono text-slate-200">
                {isSpinning ? 'Berputar...' : 'Siap Diputar'}
              </span>
            </div>

            {/* Wheel Canvas Container (Unclipped, Centered, Aspect Square) */}
            <div className="p-3 flex flex-col items-center justify-center">
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

            {/* Last Event Status Banner */}
            {lastEvent && (
              <div className="px-3 py-2 bg-[#fef9c3] dark:bg-[#422006]/70 border-t border-[#fde047] dark:border-[#a16207] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-5 h-5 rounded-xs bg-[#ca8a04] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {lastEvent.isPromotion ? <Award className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-amber-100 truncate">
                    {lastEvent.name}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-[#854d0e] dark:text-amber-300 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-xs border border-[#ca8a04]/40 shrink-0">
                  {lastEvent.note}
                </span>
              </div>
            )}
          </div>

          {/* Active Names in Wheel Roster (Transparency: Nothing Hidden!) */}
          <div
            className={`border-2 rounded-md shadow-xs overflow-hidden transition-colors ${
              darkMode ? 'bg-[#151c27] border-[#2e3e55]' : 'bg-white border-[#8da4be]'
            }`}
          >
            <div className="bg-[#e2e8f0] dark:bg-[#1e293b] px-3 py-1.5 text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-[#cbd5e1] dark:border-[#334155]">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <ListOrdered className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Daftar Nama di Roda Saat Ini ({wheelItems.length})</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                Berkurang saat terpilih
              </span>
            </div>

            <div className="p-2 max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {wheelItems.length === 0 ? (
                <div className="text-center py-4 text-slate-500 font-medium italic">
                  Semua nama sudah keluar dan masuk ke kelompok.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {wheelItems.map((name, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded-xs flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 truncate"
                    >
                      <span className="truncate text-slate-900 dark:text-slate-100 font-medium">
                        {idx + 1}. {name}
                      </span>
                      {name === promotedStudent && (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 shrink-0 ml-1">
                          ★
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 6 Group Panels Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {groups.map((group) => {
            const isFull = group.members.length >= group.capacity
            const isCurrentlyActive = activeTargetGroupId === group.id && !isFull

            // Group header colors (Year 2005 classic solid table themes)
            const headerTheme = {
              A: 'bg-gradient-to-r from-[#b91c1c] to-[#991b1b] border-[#7f1d1d]',
              B: 'bg-gradient-to-r from-[#b45309] to-[#92400e] border-[#78350f]',
              C: 'bg-gradient-to-r from-[#15803d] to-[#166534] border-[#14532d]',
              D: 'bg-gradient-to-r from-[#0e7490] to-[#155e75] border-[#164e63]',
              E: 'bg-gradient-to-r from-[#1d4ed8] to-[#1e40af] border-[#1e3a8a]',
              F: 'bg-gradient-to-r from-[#7e22ce] to-[#6b21a8] border-[#581c87]',
            }[group.id]

            return (
              <div
                key={group.id}
                className={`border-2 rounded-md shadow-xs overflow-hidden transition-all flex flex-col ${
                  isCurrentlyActive
                    ? 'border-[#d97706] ring-2 ring-[#f59e0b] bg-[#fffbeb] dark:bg-[#451a03]/40'
                    : isFull
                    ? darkMode
                      ? 'bg-[#151c27] border-[#2e3e55]'
                      : 'bg-white border-[#8da4be]'
                    : darkMode
                    ? 'bg-[#121822] border-[#243346]'
                    : 'bg-[#f8fafc] border-[#cbd5e1]'
                }`}
              >
                {/* Group Window Title Bar */}
                <div
                  className={`${headerTheme} text-white px-2.5 py-1.5 flex items-center justify-between border-b shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {group.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isCurrentlyActive && (
                      <span className="px-1.5 py-0.2 rounded-xs bg-[#fef08a] text-[#713f12] font-black text-[9px] uppercase tracking-wider animate-pulse">
                        Sedang Diisi
                      </span>
                    )}

                    <span
                      className={`font-mono text-xs font-black px-1.5 py-0.2 rounded-xs ${
                        isFull
                          ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                          : 'bg-black/30 text-white'
                      }`}
                    >
                      {group.members.length} / {group.capacity}
                    </span>
                  </div>
                </div>

                {/* Table Rows of Members */}
                <div className="flex-1 p-2 divide-y divide-slate-200 dark:divide-slate-800 min-h-[175px]">
                  {Array.from({ length: group.capacity }).map((_, index) => {
                    const member = group.members[index]
                    const isNextSlot = isCurrentlyActive && index === group.members.length
                    const isEven = index % 2 === 1

                    if (member) {
                      return (
                        <div
                          key={index}
                          className={`py-1.5 px-2 flex items-center justify-between text-xs font-medium transition-colors ${
                            member.isPromoted
                              ? 'bg-[#fef9c3] dark:bg-[#713f12]/50 text-slate-900 dark:text-amber-100 font-bold'
                              : isEven
                              ? 'bg-slate-100/70 dark:bg-slate-800/40'
                              : 'bg-white dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 text-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {index + 1}.
                            </span>
                            <span className="truncate text-slate-900 dark:text-slate-100">
                              {member.name}
                            </span>
                          </div>

                          {member.isPromoted && (
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/80 px-1.5 py-0.5 rounded-xs shrink-0">
                              ★ Promosi
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={index}
                        className={`py-1.5 px-2 flex items-center gap-2 text-xs border-b border-dotted border-slate-200 dark:border-slate-800 ${
                          isNextSlot
                            ? 'bg-[#fef3c7] dark:bg-[#78350f]/30 text-[#92400e] dark:text-amber-300 font-bold'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        <span className="w-5 text-center font-mono text-[11px] shrink-0 opacity-60">
                          {index + 1}.
                        </span>
                        <span className="italic text-[11px]">
                          {isNextSlot ? '→ [Slot Aktif Berikutnya]' : '(Kosong)'}
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

      {/* Completion Box */}
      {stage === 'COMPLETED' && (
        <div
          className={`border-2 rounded-md p-4 shadow-sm text-center transition-colors ${
            darkMode
              ? 'bg-[#064e3b]/40 border-[#059669] text-emerald-100'
              : 'bg-[#ecfdf5] border-[#10b981] text-emerald-950'
          }`}
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xs bg-[#10b981] text-white mb-2 shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
            Pembagian 35 Peserta ke 6 Kelompok Selesai!
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl mx-auto mb-3 font-medium">
            Seluruh 35 peserta telah berhasil dialokasikan secara adil dan acak. Kelompok A & B (masing-masing 6 orang) dan Kelompok C, D, E (masing-masing 6 orang) serta Kelompok F (5 orang).
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handleCopyResults}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xs bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border border-[#1e40af] text-white font-bold text-xs shadow-xs cursor-pointer active:translate-y-0.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Susunan Lengkap'}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer active:translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi dari Awal</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules Explanatory Footer Box (Classic 2005 Web Style) */}
      <div
        className={`border-2 rounded-md p-3 text-xs transition-colors ${
          darkMode
            ? 'bg-[#151c27] border-[#2e3e55] text-slate-300'
            : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-700'
        }`}
      >
        <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Aturan Sistem Pembagian Kelompok:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 font-sans">
          <li>
            <strong>Total 35 Peserta</strong> dibagi ke <strong>6 Kelompok</strong>: Kelompok A sampai E (masing-masing 6 orang) dan Kelompok F (5 orang).
          </li>
          <li>
            <strong>Putaran Pertama</strong>: Mengundi antara Dzaky Almer Rafif vs Ibra Muhammad untuk memilih 1 orang naik bergabung ke kelompok tahap pertama. Peserta yang tidak terpilih kembali ke pool peserta sisa.
          </li>
          <li>
            <strong>Tahap Kedua</strong>: 12 peserta tahap pertama mengisi penuh Kelompok A (6 orang) dan Kelompok B (6 orang).
          </li>
          <li>
            <strong>Tahap Ketiga</strong>: 23 peserta sisa diundi mengisi Kelompok C (6 orang), Kelompok D (6 orang), Kelompok E (6 orang), dan Kelompok F (5 orang).
          </li>
        </ol>
      </div>
    </div>
  )
}