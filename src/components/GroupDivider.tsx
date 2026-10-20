import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import confetti from 'canvas-confetti'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Pause,
  Trophy,
  Users,
  UserPlus,
  Trash2,
  Sparkles,
  Shuffle,
  ShieldCheck,
  Dice5,
  ListFilter,
  FileText,
} from 'lucide-react'
import { Wheel, type WheelHandle } from './Wheel'
import { WHEEL_THEMES } from '../utils/themes'
import {
  ALL_35_STUDENTS,
  PROMOTION_CANDIDATES,
  detectSmartRules,
  buildInitialGroups,
  type GroupData,
} from '../utils/participants'

export type DividerStage =
  | 'STAGE_1_PROMOTION' // Wheel: Dzaky vs Ibra (1 winner promoted to Groups A & B pool)
  | 'STAGE_2_GROUPS_AB' // Wheel: Pool 1 + 1 Promoted (12 people) -> Fills A (6) then B (6)
  | 'STAGE_3_GROUPS_CDEF' // Wheel: Remaining -> Fills C (6), D (6), E (6), F (5)
  | 'REGULAR_DRAW' // Standard fair draw for custom names without master rules
  | 'COMPLETED'

interface GroupDividerProps {
  darkMode?: boolean
}

export const GroupDivider: React.FC<GroupDividerProps> = ({ darkMode = false }) => {
  const wheelRef = useRef<WheelHandle | null>(null)
  const autoSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Transparent Roster State (Visible directly to audience to guarantee fairness)
  const [roster, setRoster] = useState<string[]>(() => [...ALL_35_STUDENTS])
  const [rosterViewTab, setRosterViewTab] = useState<'cards' | 'text'>('cards')
  const [newParticipantInput, setNewParticipantInput] = useState<string>('')

  // Smart Rules Detection analysis based on the live roster
  const smartAnalysis = useMemo(() => detectSmartRules(roster), [roster])

  // 2. Division & Stage State
  const [stage, setStage] = useState<DividerStage>(() =>
    smartAnalysis.isSmart ? 'STAGE_1_PROMOTION' : 'REGULAR_DRAW'
  )
  const [promotedStudent, setPromotedStudent] = useState<string | null>(null)
  const [groups, setGroups] = useState<GroupData[]>(() => buildInitialGroups(roster.length, 6))

  // Wheel Items (What is currently loaded on the spinner wheel)
  const [wheelItems, setWheelItems] = useState<string[]>(() => {
    if (smartAnalysis.isSmart) {
      return smartAnalysis.promoCandidates.length > 0
        ? [...smartAnalysis.promoCandidates]
        : [...smartAnalysis.pool1Members]
    }
    return [...roster]
  })

  // 3. Animation & Control State
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)

  // Announcement of latest winner
  const [recentWinner, setRecentWinner] = useState<{
    name: string
    note: string
    isPromotion?: boolean
    groupColor?: string
  } | null>(null)

  // Keep auto-spinning ref synchronized
  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning
  }, [isAutoSpinning])

  // Clear pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSpinTimeoutRef.current) {
        clearTimeout(autoSpinTimeoutRef.current)
      }
    }
  }, [])

  // Total allocated count across all groups
  const totalAllocated = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.members.length, 0)
  }, [groups])

  // Set of all already assigned participant names (lowercased for lookup)
  const assignedNamesMap = useMemo(() => {
    const map = new Map<string, string>() // lower -> groupId
    groups.forEach((g) => {
      g.members.forEach((m) => {
        map.set(m.name.trim().toLowerCase(), g.id)
      })
    })
    return map
  }, [groups])

  // Active target group currently being filled
  const activeTargetGroup = useMemo<string | null>(() => {
    if (stage === 'STAGE_1_PROMOTION') return null

    if (stage === 'STAGE_2_GROUPS_AB') {
      const groupA = groups.find((g) => g.id === 'A')
      if (groupA && groupA.members.length < groupA.capacity) return 'A'
      const groupB = groups.find((g) => g.id === 'B')
      if (groupB && groupB.members.length < groupB.capacity) return 'B'
      return 'B'
    }

    if (stage === 'STAGE_3_GROUPS_CDEF' || stage === 'REGULAR_DRAW') {
      for (const g of groups) {
        if (g.members.length < g.capacity) {
          return g.id
        }
      }
    }
    return null
  }, [stage, groups])

  // Human-readable status message for the banner
  const statusMessage = useMemo(() => {
    if (stage === 'STAGE_1_PROMOTION') {
      return 'Putaran Pertama: Mengundi Dzaky Almer Rafif vs Ibra Muhammad untuk menentukan 1 orang yang naik ke Kelompok A & B.'
    }
    if (stage === 'STAGE_2_GROUPS_AB') {
      const current = groups.find((g) => g.id === activeTargetGroup)
      return `Tahap Kedua: Mengundi 12 peserta (Nomor 1 + 1 Promosi) mengisi ${current?.name || 'Kelompok A'} (${current?.members.length || 0}/${current?.capacity || 6}).`
    }
    if (stage === 'STAGE_3_GROUPS_CDEF') {
      const current = groups.find((g) => g.id === activeTargetGroup)
      return `Tahap Ketiga: Mengundi peserta sisa mengisi ${current?.name || 'Kelompok C'} (${current?.members.length || 0}/${current?.capacity || 6}).`
    }
    if (stage === 'REGULAR_DRAW') {
      const current = groups.find((g) => g.id === activeTargetGroup)
      return `Pembagian Adil: Mengundi peserta mengisi ${current?.name || 'Kelompok'} (${current?.members.length || 0}/${current?.capacity || 6}).`
    }
    return 'Semua peserta telah berhasil dibagikan secara adil ke dalam kelompok!'
  }, [stage, activeTargetGroup, groups])

  // Spin lifecycle: Start
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
    setRecentWinner(null)
  }, [])

  // Spin lifecycle: Finish
  const handleSpinEnd = useCallback(
    (winner: string) => {
      setIsSpinning(false)

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // =========================================================================
      // CASE 1: STAGE 1 PROMOTION DRAW (Dzaky vs Ibra)
      // =========================================================================
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
            particleCount: 70,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#2563EB', '#10B981'],
          })
        } catch {
          // ignore
        }

        // Prepare Stage 2 items: All Pool 1 members + the 1 promoted winner
        const stage2Participants = [...smartAnalysis.pool1Members, winner]
        setWheelItems(stage2Participants)
        setStage('STAGE_2_GROUPS_AB')

        if (isAutoSpinningRef.current) {
          autoSpinTimeoutRef.current = setTimeout(() => {
            if (isAutoSpinningRef.current && wheelRef.current) {
              wheelRef.current.spin()
            }
          }, 1100)
        }
        return
      }

      // =========================================================================
      // CASE 2: STAGE 2 GROUPS A & B (Pool 1 + Promoted Winner)
      // =========================================================================
      if (stage === 'STAGE_2_GROUPS_AB') {
        const targetGid = activeTargetGroup || 'A'
        const isPromo = winner === promotedStudent
        const currentTarget = groups.find((g) => g.id === targetGid)
        const targetColor = currentTarget?.color || '#2563EB'

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

        const nextWheelItems = wheelItems.filter((item) => item !== winner)

        // Check if Groups A & B have reached capacity (12 members or wheelItems empty)
        const totalAB = updatedGroups
          .filter((g) => g.id === 'A' || g.id === 'B')
          .reduce((sum, g) => sum + g.members.length, 0)

        const stage2TargetCount = smartAnalysis.pool1Members.length + 1

        if (totalAB >= stage2TargetCount || nextWheelItems.length === 0) {
          // Advance to Stage 3: Remaining Pool 2 + Pool 3 + any custom names added
          const unchosenPromo = smartAnalysis.promoCandidates.find((c) => c !== promotedStudent)
          const remainingPool2 = smartAnalysis.pool2Members.filter(
            (p) => p !== promotedStudent && p !== unchosenPromo
          )

          const stage3Participants = [
            ...(unchosenPromo ? [unchosenPromo] : []),
            ...remainingPool2,
            ...smartAnalysis.pool3Members,
            ...smartAnalysis.customMembers,
          ]

          setWheelItems(stage3Participants)
          setStage('STAGE_3_GROUPS_CDEF')

          if (isAutoSpinningRef.current) {
            autoSpinTimeoutRef.current = setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 1100)
          }
        } else {
          setWheelItems(nextWheelItems)
          if (isAutoSpinningRef.current) {
            autoSpinTimeoutRef.current = setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 850)
          }
        }
        return
      }

      // =========================================================================
      // CASE 3: STAGE 3 GROUPS C, D, E, F OR REGULAR FAIR DRAW
      // =========================================================================
      if (stage === 'STAGE_3_GROUPS_CDEF' || stage === 'REGULAR_DRAW') {
        const targetGid = activeTargetGroup || groups[0].id
        const currentTarget = groups.find((g) => g.id === targetGid)
        const targetColor = currentTarget?.color || '#059669'

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
        const newTotalAssigned = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)
        const totalToAssign = roster.length

        if (newTotalAssigned >= totalToAssign || nextWheelItems.length === 0) {
          setStage('COMPLETED')
          setIsAutoSpinning(false)
          isAutoSpinningRef.current = false
          setWheelItems([])

          try {
            confetti({
              particleCount: 160,
              spread: 100,
              origin: { y: 0.5 },
            })
          } catch {
            // ignore
          }
        } else {
          setWheelItems(nextWheelItems)
          if (isAutoSpinningRef.current) {
            autoSpinTimeoutRef.current = setTimeout(() => {
              if (isAutoSpinningRef.current && wheelRef.current) {
                wheelRef.current.spin()
              }
            }, 850)
          }
        }
      }
    },
    [stage, groups, activeTargetGroup, promotedStudent, wheelItems, smartAnalysis, roster.length]
  )

  // Single spin trigger
  const handleSingleSpin = () => {
    if (isSpinning || isAutoSpinning || stage === 'COMPLETED' || wheelItems.length === 0) return
    if (wheelRef.current) {
      wheelRef.current.spin()
    }
  }

  // Toggle Auto Spin with clean cancellation
  const handleToggleAutoSpin = () => {
    if (stage === 'COMPLETED' || wheelItems.length === 0) return

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

  // Reset all assignments cleanly
  const handleReset = () => {
    setIsAutoSpinning(false)
    isAutoSpinningRef.current = false
    setIsSpinning(false)
    if (autoSpinTimeoutRef.current) {
      clearTimeout(autoSpinTimeoutRef.current)
      autoSpinTimeoutRef.current = null
    }
    wheelRef.current?.reset?.()

    const currentSmart = detectSmartRules(roster)
    if (currentSmart.isSmart) {
      setStage('STAGE_1_PROMOTION')
      setPromotedStudent(null)
      setRecentWinner(null)
      setWheelItems(
        currentSmart.promoCandidates.length > 0
          ? [...currentSmart.promoCandidates]
          : [...currentSmart.pool1Members]
      )
    } else {
      setStage('REGULAR_DRAW')
      setPromotedStudent(null)
      setRecentWinner(null)
      setWheelItems([...roster])
    }

    setGroups(buildInitialGroups(roster.length, 6))
  }

  // Reload default master 35 students
  const handleLoadDefault35 = () => {
    if (isSpinning || isAutoSpinning) return
    wheelRef.current?.reset?.()
    setRoster([...ALL_35_STUDENTS])
    setStage('STAGE_1_PROMOTION')
    setPromotedStudent(null)
    setRecentWinner(null)
    setWheelItems([...PROMOTION_CANDIDATES])
    setGroups(buildInitialGroups(35, 6))
  }

  // Add individual participant
  const handleAddParticipant = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newParticipantInput.trim()
    if (!trimmed || isSpinning || isAutoSpinning) return

    const updated = [...roster, trimmed]
    setRoster(updated)
    setNewParticipantInput('')

    // If still before draw starts, sync wheel and groups
    if (totalAllocated === 0) {
      const smart = detectSmartRules(updated)
      if (smart.isSmart) {
        setStage('STAGE_1_PROMOTION')
        setWheelItems(
          smart.promoCandidates.length > 0
            ? [...smart.promoCandidates]
            : [...smart.pool1Members]
        )
      } else {
        setStage('REGULAR_DRAW')
        setWheelItems([...updated])
      }
      setGroups(buildInitialGroups(updated.length, 6))
    }
  }

  // Remove participant from roster
  const handleRemoveParticipant = (index: number) => {
    if (isSpinning || isAutoSpinning) return
    const updated = roster.filter((_, i) => i !== index)
    setRoster(updated)

    if (totalAllocated === 0) {
      const smart = detectSmartRules(updated)
      if (smart.isSmart) {
        setStage('STAGE_1_PROMOTION')
        setWheelItems(
          smart.promoCandidates.length > 0
            ? [...smart.promoCandidates]
            : [...smart.pool1Members]
        )
      } else {
        setStage('REGULAR_DRAW')
        setWheelItems([...updated])
      }
      setGroups(buildInitialGroups(updated.length, 6))
    }
  }

  // Bulk edit via textarea
  const handleRosterTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSpinning || isAutoSpinning) return
    const lines = e.target.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    setRoster(lines)
    if (totalAllocated === 0) {
      const smart = detectSmartRules(lines)
      if (smart.isSmart) {
        setStage('STAGE_1_PROMOTION')
        setWheelItems(
          smart.promoCandidates.length > 0
            ? [...smart.promoCandidates]
            : [...smart.pool1Members]
        )
      } else {
        setStage('REGULAR_DRAW')
        setWheelItems([...lines])
      }
      setGroups(buildInitialGroups(lines.length, 6))
    }
  }

  // Shuffle roster order
  const handleShuffleRoster = () => {
    if (isSpinning || isAutoSpinning) return
    const copy = [...roster]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setRoster(copy)
    if (totalAllocated === 0 && !smartAnalysis.isSmart) {
      setWheelItems([...copy])
    }
  }

  // Copy formatted results to clipboard
  const handleCopyResults = () => {
    const lines: string[] = []
    lines.push(`=== HASIL PEMBAGIAN KELOMPOK (${totalAllocated}/${roster.length} PESERTA) ===`)
    lines.push(`Tanggal: ${new Date().toLocaleDateString('id-ID')} | Pukul: ${new Date().toLocaleTimeString('id-ID')}`)
    lines.push(`Mode: ${smartAnalysis.isSmart ? 'Aturan Prioritas Nomor 1-3' : 'Pembagian Acak Bebas'}`)
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
    if (smartAnalysis.isSmart) {
      lines.push('Aturan Pembagian yang Dijalankan:')
      lines.push(`- Kelompok A & B: Peserta Nomor 1 + 1 Promosi dari Nomor 2 (${promotedStudent || '-'})`)
      lines.push('- Kelompok C, D, E & F: Sisa Nomor 2, Nomor 3, dan nama tambahan')
    } else {
      lines.push('Dijalankan secara acak murni dan adil tanpa aturan khusus.')
    }

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4 p-3 sm:p-5 font-sans">
      {/* Top Controls Bar */}
      <section className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Status & Stage Pill */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">Kontrol</span>

              {/* Stage Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  stage === 'STAGE_1_PROMOTION'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : stage === 'STAGE_2_GROUPS_AB'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : stage === 'STAGE_3_GROUPS_CDEF'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : stage === 'REGULAR_DRAW'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {stage === 'STAGE_1_PROMOTION' && 'Tahap 1: Promosi'}
                {stage === 'STAGE_2_GROUPS_AB' && 'Tahap 2: Kelompok A & B'}
                {stage === 'STAGE_3_GROUPS_CDEF' && 'Tahap 3: Kelompok C - F'}
                {stage === 'REGULAR_DRAW' && 'Pembagian Acak Bebas'}
                {stage === 'COMPLETED' && 'Selesai'}
              </span>

              {/* Mode indicator pill */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                  smartAnalysis.isSmart
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title={
                  smartAnalysis.isSmart
                    ? 'Aturan 35 siswa terdeteksi dan diutamakan'
                    : 'Mode standar adil aktif'
                }
              >
                {smartAnalysis.isSmart ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>Prioritas Nomor 1-3</span>
                  </>
                ) : (
                  <>
                    <Dice5 className="w-3 h-3 text-slate-500" />
                    <span>Acak Standar</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {statusMessage}
            </p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
            {/* Single Spin Button */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || stage === 'COMPLETED' || wheelItems.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Putar</span>
            </button>

            {/* Auto Spin / Stop Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={stage === 'COMPLETED' || wheelItems.length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer border ${
                isAutoSpinning
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
              }`}
            >
              {isAutoSpinning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Hentikan</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Putar Otomatis</span>
                </>
              )}
            </button>

            {/* Copy Results Button */}
            <button
              onClick={handleCopyResults}
              disabled={totalAllocated === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Hasil</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isSpinning || isAutoSpinning || (totalAllocated === 0 && stage !== 'COMPLETED')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Ulangi dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =================================================================== */}
        {/* COLUMN 1: OPEN TRANSPARENT ROSTER PANEL (4 cols)                    */}
        {/* "Kolom buat naro nama orangnya biar ga kelihatan di curangi"        */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col gap-3">
            {/* Header with Title and Mode Switch */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Peserta
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                  {roster.length}
                </span>
              </div>

              {/* View switch: Cards vs Text */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 text-[11px] font-semibold">
                <button
                  onClick={() => setRosterViewTab('cards')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    rosterViewTab === 'cards'
                      ? 'bg-white text-blue-600 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Lihat status peserta"
                >
                  <ListFilter className="w-3 h-3" />
                  <span>Daftar</span>
                </button>
                <button
                  onClick={() => setRosterViewTab('text')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                    rosterViewTab === 'text'
                      ? 'bg-white text-blue-600 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Edit teks / paste banyak nama"
                >
                  <FileText className="w-3 h-3" />
                  <span>Teks</span>
                </button>
              </div>
            </div>

            {/* Quick Add Name Input Bar */}
            <form onSubmit={handleAddParticipant} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newParticipantInput}
                onChange={(e) => setNewParticipantInput(e.target.value)}
                disabled={isSpinning || isAutoSpinning}
                placeholder="Ketik nama peserta baru..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newParticipantInput.trim() || isSpinning || isAutoSpinning}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <button
                onClick={handleLoadDefault35}
                disabled={isSpinning || isAutoSpinning}
                className="px-2.5 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors cursor-pointer disabled:opacity-40"
                title="Muat ulang 35 nama siswa asli dengan aturan nomor 1-3"
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                35 Siswa Asli
              </button>
              <button
                onClick={handleShuffleRoster}
                disabled={isSpinning || isAutoSpinning || roster.length < 2}
                className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                <Shuffle className="w-3 h-3 inline mr-1 text-amber-600" />
                Acak Urutan
              </button>
              <button
                onClick={() => {
                  if (confirm('Kosongkan semua nama peserta?')) {
                    setRoster([])
                    setWheelItems([])
                    setGroups(buildInitialGroups(0, 6))
                    setStage('REGULAR_DRAW')
                  }
                }}
                disabled={isSpinning || isAutoSpinning || roster.length === 0}
                className="px-2.5 py-1 rounded border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold transition-colors cursor-pointer disabled:opacity-40 ml-auto"
              >
                <Trash2 className="w-3 h-3 inline mr-1" />
                Kosongkan
              </button>
            </div>

            {/* Roster View Tab Content */}
            {rosterViewTab === 'cards' ? (
              <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {roster.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic">
                    Belum ada peserta. Masukkan nama di atas atau klik "35 Siswa Asli".
                  </div>
                ) : (
                  roster.map((name, idx) => {
                    const normName = name.trim().toLowerCase()
                    const assignedGroupId = assignedNamesMap.get(normName)
                    const isInWheel = wheelItems.some(
                      (item) => item.trim().toLowerCase() === normName
                    )

                    return (
                      <div
                        key={`${name}-${idx}`}
                        className={`pt-1.5 flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                          assignedGroupId
                            ? 'bg-slate-50/80 text-slate-600'
                            : isInWheel
                            ? 'bg-blue-50/60 border border-blue-200 text-blue-900 font-medium'
                            : 'bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-[10px] text-slate-400 w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="truncate">{name}</span>
                        </div>

                        {/* Status Chip */}
                        <div className="flex items-center gap-1 shrink-0">
                          {assignedGroupId ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ {groups.find((g) => g.id === assignedGroupId)?.name || `Kel. ${assignedGroupId}`}
                            </span>
                          ) : isInWheel ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              🎯 Di Roda
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              ⏳ Menunggu
                            </span>
                          )}

                          {/* Delete participant button (when not spinning & not allocated) */}
                          {!isSpinning && !isAutoSpinning && totalAllocated === 0 && (
                            <button
                              onClick={() => handleRemoveParticipant(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title={`Hapus ${name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={roster.join('\n')}
                  onChange={handleRosterTextChange}
                  disabled={isSpinning || isAutoSpinning}
                  rows={16}
                  placeholder="Satu nama per baris..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none disabled:opacity-50"
                  spellCheck={false}
                />
                <span className="text-[11px] text-slate-500 italic">
                  1 baris = 1 peserta. Tempel (paste) daftar nama langsung di sini.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 2: SPINNER WHEEL STAGE (4 cols on lg)                        */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
            {/* Wheel Active Count Header */}
            <div className="w-full flex items-center justify-between mb-2 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Roda ({wheelItems.length} Nama Aktif)
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {isSpinning ? 'Sedang Berputar...' : 'Siap Diputar'}
              </span>
            </div>

            {/* Spinner Wheel Canvas */}
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

            {/* Recent Winner Live Banner */}
            {recentWinner && (
              <div
                className="mt-3 w-full py-2 px-3 rounded-lg border flex items-center justify-between text-xs font-bold transition-all shadow-xs"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: recentWinner.groupColor || '#2563EB',
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: recentWinner.groupColor || '#2563EB' }}
                  />
                  <span className="text-slate-900 truncate">
                    {recentWinner.name}
                  </span>
                </div>
                <span
                  className="text-[11px] font-extrabold shrink-0"
                  style={{ color: recentWinner.groupColor || '#2563EB' }}
                >
                  {recentWinner.note}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 3: GROUPS PANEL (4 cols on lg)                               */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Hasil Kelompok</span>
              <span className="font-mono text-slate-500">
                ({totalAllocated}/{roster.length})
              </span>
            </h2>

            {promotedStudent && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                ★ Promosi: {promotedStudent}
              </span>
            )}
          </div>

          {/* Groups Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {groups.map((group) => {
              const isTarget = activeTargetGroup === group.id && stage !== 'COMPLETED'
              const isFull = group.members.length >= group.capacity

              return (
                <div
                  key={group.id}
                  className={`rounded-xl border p-3 transition-all shadow-2xs relative ${
                    isTarget
                      ? 'border-blue-500 ring-2 ring-blue-400/30 bg-blue-50/20'
                      : isFull
                      ? 'border-slate-200 bg-white opacity-95'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-bold text-xs text-slate-900">
                        {group.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTarget && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                          Diisi
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {group.members.length}/{group.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Member Slots */}
                  <div className="space-y-1">
                    {Array.from({ length: group.capacity }).map((_, index) => {
                      const member = group.members[index]
                      const isNext = isTarget && index === group.members.length

                      if (member) {
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-50 border border-slate-100 text-slate-900 font-medium"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {index + 1}.
                              </span>
                              <span className="truncate">{member.name}</span>
                            </div>

                            {member.isPromoted && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ★ Naik
                              </span>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-dashed transition-colors ${
                            isNext
                              ? 'border-blue-400 bg-blue-50/50 text-blue-700 font-bold'
                              : 'border-slate-200 text-slate-400'
                          }`}
                        >
                          <span className="font-mono text-[10px] opacity-70 shrink-0">
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
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Semua Kelompok Selesai Terisi!
              </h3>
              <p className="text-xs text-emerald-800">
                Total {roster.length} peserta telah terbagi secara adil sesuai aturan.
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
