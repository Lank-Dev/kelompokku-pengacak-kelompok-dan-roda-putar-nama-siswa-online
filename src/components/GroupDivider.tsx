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
  Users,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Shuffle,
  ArrowDownAZ,
  Search,
  FileText,
  List,
} from 'lucide-react'
import { Wheel, type WheelHandle } from './Wheel'
import { WHEEL_THEMES } from '../utils/themes'
import {
  POOL_1,
  POOL_2,
  POOL_3,
  PROMOTION_CANDIDATES,
  ALL_35_STUDENTS,
  detectSmartRules,
  buildInitialGroups,
  normalizeName,
  type GroupData,
} from '../utils/participants'

export type DividerStage =
  | 'STAGE_1_PROMOTION' // Wheel: Dzaky vs Ibra (1 winner promoted to Groups A & B pool)
  | 'STAGE_2_GROUPS_AB' // Wheel: 11 Pool 1 + 1 Promoted (12 people) -> Fills A (6) then B (6)
  | 'STAGE_3_GROUPS_CDEF' // Wheel: 23+ Remaining -> Fills C (6), D (6), E (6), F (5+)
  | 'CUSTOM_RANDOM' // Regular random division into 6 groups
  | 'COMPLETED'

export type DividerMode = 'rule_35' | 'custom'

interface GroupDividerProps {
  darkMode?: boolean
}

export const GroupDivider: React.FC<GroupDividerProps> = ({ darkMode = false }) => {
  const wheelRef = useRef<WheelHandle | null>(null)
  const autoSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Transparent Participants State (Default 35 Students)
  const [participants, setParticipants] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kocoker_divider_participants')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return [...ALL_35_STUDENTS]
  })

  // Persist participants to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kocoker_divider_participants', JSON.stringify(participants))
    } catch {
      // ignore
    }
  }, [participants])

  // 2. Smart Rules Analysis (Dynamic auto-detection)
  const smartRulesAnalysis = useMemo(() => {
    return detectSmartRules(participants)
  }, [participants])

  const isSmartRules = smartRulesAnalysis.isSmart

  // 3. Divider Stages & Group Allocations
  const [stage, setStage] = useState<DividerStage>(() =>
    isSmartRules ? 'STAGE_1_PROMOTION' : 'CUSTOM_RANDOM'
  )
  const [promotedStudent, setPromotedStudent] = useState<string | null>(null)
  const [groups, setGroups] = useState<GroupData[]>(() =>
    buildInitialGroups(participants.length, isSmartRules)
  )

  // Initial wheel items depending on mode
  const [wheelItems, setWheelItems] = useState<string[]>(() => {
    if (isSmartRules) {
      return [...PROMOTION_CANDIDATES]
    }
    return [...participants]
  })

  // 4. Spinning & Automation state
  const [isSpinning, setIsSpinning] = useState(false)
  const [isAutoSpinning, setIsAutoSpinning] = useState(false)
  const isAutoSpinningRef = useRef(false)
  const [copied, setCopied] = useState(false)

  // 5. Recent winner announcement
  const [recentWinner, setRecentWinner] = useState<{
    name: string
    note: string
    isPromotion?: boolean
    groupColor?: string
  } | null>(null)

  // 6. UI Panel controls (View mode, quick add, search)
  const [panelView, setPanelView] = useState<'live' | 'text'>('live')
  const [quickAddName, setQuickAddName] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  // Sync auto-spinning ref
  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning
  }, [isAutoSpinning])

  // Clear any pending auto-spin timer on unmount
  useEffect(() => {
    return () => {
      if (autoSpinTimerRef.current) {
        clearTimeout(autoSpinTimerRef.current)
        autoSpinTimerRef.current = null
      }
    }
  }, [])

  // Centralized auto-spin scheduler to guarantee clean timer lifecycles
  const scheduleNextAutoSpin = useCallback((delayMs: number) => {
    if (autoSpinTimerRef.current) {
      clearTimeout(autoSpinTimerRef.current)
      autoSpinTimerRef.current = null
    }
    if (!isAutoSpinningRef.current) return

    autoSpinTimerRef.current = setTimeout(() => {
      autoSpinTimerRef.current = null
      if (isAutoSpinningRef.current && wheelRef.current) {
        wheelRef.current.spin()
      }
    }, delayMs)
  }, [])

  // Total allocated count across all groups
  const totalAllocated = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.members.length, 0)
  }, [groups])

  // Current active target group being filled
  const activeTargetGroup = useMemo<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null>(() => {
    if (stage === 'STAGE_1_PROMOTION' || stage === 'COMPLETED') return null

    if (stage === 'STAGE_2_GROUPS_AB') {
      const groupA = groups.find((g) => g.id === 'A')
      if (groupA && groupA.members.length < groupA.capacity) return 'A'
      const groupB = groups.find((g) => g.id === 'B')
      if (groupB && groupB.members.length < groupB.capacity) return 'B'
      return null
    }

    if (stage === 'STAGE_3_GROUPS_CDEF') {
      for (const gid of ['C', 'D', 'E', 'F'] as const) {
        const g = groups.find((grp) => grp.id === gid)
        if (g && g.members.length < g.capacity) return gid
      }
      return null
    }

    if (stage === 'CUSTOM_RANDOM') {
      const available = groups.find((g) => g.members.length < g.capacity)
      return (available ? available.id : null) as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null
    }

    return null
  }, [stage, groups])

  // Human-readable narrative status message
  const statusMessage = useMemo(() => {
    if (stage === 'STAGE_1_PROMOTION') {
      return 'Putaran Pertama: Mengundi antara Dzaky Almer Rafif vs Ibra Muhammad untuk menentukan 1 orang yang naik ke Kelompok A & B.'
    }
    if (stage === 'STAGE_2_GROUPS_AB') {
      if (activeTargetGroup === 'A') {
        const grp = groups.find((g) => g.id === 'A')
        return `Tahap Kedua: Mengundi 12 peserta No. 1 + 1 pemenang promosi untuk mengisi Kelompok A (${grp?.members.length || 0}/6).`
      }
      const grp = groups.find((g) => g.id === 'B')
      return `Tahap Kedua: Kelompok A penuh! Mengundi untuk mengisi Kelompok B (${grp?.members.length || 0}/6).`
    }
    if (stage === 'STAGE_3_GROUPS_CDEF') {
      const grp = groups.find((g) => g.id === activeTargetGroup)
      return `Tahap Ketiga: Mengundi peserta sisa No. 2 & 3 untuk mengisi ${grp?.name} (${grp?.members.length || 0}/${grp?.capacity}).`
    }
    if (stage === 'CUSTOM_RANDOM') {
      const grp = groups.find((g) => g.id === activeTargetGroup)
      return `Mode Acak Bebas: Mengundi nama peserta untuk mengisi ${grp?.name || 'Kelompok'} (${grp?.members.length || 0}/${grp?.capacity || 0}).`
    }
    return `Semua ${participants.length} peserta telah berhasil dibagikan secara adil dan transparan!`
  }, [stage, activeTargetGroup, groups, participants.length])

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

        // Prepare Stage 2: 11 Pool 1 members found in participants + 1 Promoted winner = 12 people
        const pool1Found = participants.filter((p) =>
          POOL_1.some((p1) => normalizeName(p1) === normalizeName(p))
        )
        const stage2Students = [...pool1Found, winner]

        setWheelItems(stage2Students)
        setStage('STAGE_2_GROUPS_AB')

        if (isAutoSpinningRef.current) {
          scheduleNextAutoSpin(1100)
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

        // Check if Groups A & B are now both completely full (12 members allocated)
        const totalAB = updatedGroups
          .filter((g) => g.id === 'A' || g.id === 'B')
          .reduce((sum, g) => sum + g.members.length, 0)

        if (totalAB >= 12) {
          // Transition to Stage 3: Remaining Participants
          const unchosenCandidate = PROMOTION_CANDIDATES.find(
            (c) => normalizeName(c) !== normalizeName(promotedStudent || '')
          )
          const remainingPool2 = POOL_2.filter(
            (p) =>
              normalizeName(p) !== normalizeName(promotedStudent || '') &&
              normalizeName(p) !== normalizeName(unchosenCandidate || '')
          )
          // Also include any extra custom members added by user
          const extraCustom = participants.filter(
            (p) => !ALL_35_STUDENTS.some((s) => normalizeName(s) === normalizeName(p))
          )

          const stage3Students = [
            ...(unchosenCandidate ? [unchosenCandidate] : []),
            ...remainingPool2,
            ...POOL_3,
            ...extraCustom,
          ]

          setWheelItems(stage3Students)
          setStage('STAGE_3_GROUPS_CDEF')

          if (isAutoSpinningRef.current) {
            scheduleNextAutoSpin(1100)
          }
        } else {
          setWheelItems(nextWheelItems)
          if (isAutoSpinningRef.current) {
            scheduleNextAutoSpin(850)
          }
        }
        return
      }

      // STAGE 3: GROUPS C, D, E & F (23+ People)
      if (stage === 'STAGE_3_GROUPS_CDEF') {
        const targetGid = activeTargetGroup
        if (!targetGid) return

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
        const newTotal = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)

        if (newTotal >= participants.length || nextWheelItems.length === 0) {
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
            scheduleNextAutoSpin(850)
          }
        }
        return
      }

      // CUSTOM RANDOM MODE: Balanced Division
      if (stage === 'CUSTOM_RANDOM') {
        const targetGid = activeTargetGroup
        if (!targetGid) return

        const currentTarget = groups.find((g) => g.id === targetGid)
        const targetColor = currentTarget?.color || '#2563EB'

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
            colors: [targetColor, '#2563EB', '#10B981'],
          })
        } catch {
          // ignore
        }

        const nextWheelItems = wheelItems.filter((item) => item !== winner)
        const newTotal = updatedGroups.reduce((sum, g) => sum + g.members.length, 0)

        if (newTotal >= participants.length || nextWheelItems.length === 0) {
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
            scheduleNextAutoSpin(850)
          }
        }
      }
    },
    [stage, groups, activeTargetGroup, promotedStudent, wheelItems, participants, scheduleNextAutoSpin]
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
      if (autoSpinTimerRef.current) {
        clearTimeout(autoSpinTimerRef.current)
        autoSpinTimerRef.current = null
      }
    } else {
      setIsAutoSpinning(true)
      isAutoSpinningRef.current = true
      if (!isSpinning && wheelRef.current) {
        wheelRef.current.spin()
      }
    }
  }

  // Reset engine cleanly based on current participants & smart detection
  const handleReset = useCallback(
    (customList?: string[]) => {
      if (autoSpinTimerRef.current) {
        clearTimeout(autoSpinTimerRef.current)
        autoSpinTimerRef.current = null
      }
      setIsAutoSpinning(false)
      isAutoSpinningRef.current = false
      setIsSpinning(false)
      wheelRef.current?.reset?.()

      const activeList = customList ?? participants
      const analysis = detectSmartRules(activeList)

      setPromotedStudent(null)
      setRecentWinner(null)
      setGroups(buildInitialGroups(activeList.length, analysis.isSmart))

      if (analysis.isSmart) {
        setStage('STAGE_1_PROMOTION')
        setWheelItems([...PROMOTION_CANDIDATES])
      } else {
        setStage('CUSTOM_RANDOM')
        setWheelItems([...activeList])
      }
    },
    [participants]
  )

  // Quick Add new participant
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickAddName.trim()
    if (!trimmed) return

    const updated = [...participants, trimmed]
    setParticipants(updated)
    setQuickAddName('')
    handleReset(updated)
  }

  // Remove participant
  const handleRemoveParticipant = (indexToRemove: number) => {
    if (isSpinning) return
    const updated = participants.filter((_, idx) => idx !== indexToRemove)
    setParticipants(updated)
    handleReset(updated)
  }

  // Textarea edit changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    setParticipants(lines)
    handleReset(lines)
  }

  // Restore preset 35 students
  const handleRestorePreset35 = () => {
    if (isSpinning) return
    const defaultList = [...ALL_35_STUDENTS]
    setParticipants(defaultList)
    handleReset(defaultList)
  }

  // Shuffle participant list
  const handleShuffleList = () => {
    if (isSpinning) return
    const copy = [...participants]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setParticipants(copy)
    handleReset(copy)
  }

  // Sort participant list
  const handleSortList = () => {
    if (isSpinning) return
    const copy = [...participants].sort((a, b) => a.localeCompare(b, 'id'))
    setParticipants(copy)
    handleReset(copy)
  }

  // Clear all participants
  const handleClearList = () => {
    if (isSpinning) return
    if (confirm('Yakin ingin mengosongkan semua daftar nama peserta?')) {
      setParticipants([])
      handleReset([])
    }
  }

  // Copy formatted results to clipboard
  const handleCopyResults = () => {
    const lines: string[] = []
    lines.push('=== HASIL PEMBAGIAN 6 KELOMPOK ===')
    lines.push(`Tanggal: ${new Date().toLocaleDateString('id-ID')} | Pukul: ${new Date().toLocaleTimeString('id-ID')}`)
    lines.push(`Mode: ${isSmartRules ? 'Aturan Prioritas Cerdas (3 Tahap)' : 'Acak Bebas Reguler'}`)
    lines.push(`Total Peserta: ${participants.length} Orang`)
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
    if (isSmartRules) {
      lines.push('Catatan Aturan Pembagian:')
      lines.push(`- Kelompok A & B (masing-masing 6 orang): 12 peserta tahap pertama (termasuk promosi: ${promotedStudent || '-'})`)
      lines.push('- Kelompok C, D, E & F: Peserta sisa nomor 2 & 3 serta peserta tambahan')
    } else {
      lines.push('Catatan: Seluruh nama diundi secara acak berkeadilan mengisi Kelompok A hingga F.')
    }

    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtered participants for transparent list
  const filteredParticipants = useMemo(() => {
    if (!searchFilter.trim()) return participants
    const q = searchFilter.toLowerCase()
    return participants.filter((p) => p.toLowerCase().includes(q))
  }, [participants, searchFilter])

  // Map to find which group each participant is assigned to
  const participantGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string; color: string; isPromoted?: boolean }>()
    groups.forEach((grp) => {
      grp.members.forEach((m) => {
        map.set(normalizeName(m.name), {
          groupId: grp.id,
          groupName: grp.name,
          color: grp.color,
          isPromoted: m.isPromoted,
        })
      })
    })
    return map
  }, [groups])

  const wheelColors = WHEEL_THEMES[0].colors

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 p-3 sm:p-5 font-sans">
      {/* Top Controls Bar */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 transition-colors shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Stage Title & Progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Pembagian Kelompok
              </span>

              {/* Mode Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  isSmartRules
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                }`}
                title={smartRulesAnalysis.reason}
              >
                {isSmartRules ? (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Smart Priority Rules</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>Mode Acak Bebas</span>
                  </>
                )}
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
                    : stage === 'CUSTOM_RANDOM'
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {stage === 'STAGE_1_PROMOTION' && 'Tahap 1: Undian Promosi (1 Orang)'}
                {stage === 'STAGE_2_GROUPS_AB' && 'Tahap 2: Kelompok A & B (12 Peserta)'}
                {stage === 'STAGE_3_GROUPS_CDEF' && 'Tahap 3: Kelompok C, D, E & F (23+ Peserta)'}
                {stage === 'CUSTOM_RANDOM' && 'Pengundian Acak Berjalan'}
                {stage === 'COMPLETED' && '✓ Pembagian Selesai'}
              </span>

              {/* Progress Count */}
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {totalAllocated} / {participants.length} Terbagi
              </span>

              {promotedStudent && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Putar</span>
            </button>

            {/* Auto Spin Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={stage === 'COMPLETED' || wheelItems.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
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
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
              onClick={() => handleReset()}
              disabled={isSpinning || isAutoSpinning}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Ulangi pembagian dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main 3-Section Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* COLUMN 1: PANEL DAFTAR NAMA PESERTA (TRANSPARAN) (3 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div
            className={`rounded-2xl border flex flex-col shadow-xs overflow-hidden transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Daftar Nama Peserta
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Transparan & Terbuka
                  </p>
                </div>
              </div>

              {/* View Switcher: Live vs Text */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setPanelView('live')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    panelView === 'live'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Lihat status live tiap peserta"
                >
                  <List className="w-3 h-3" />
                  <span>Live</span>
                </button>
                <button
                  onClick={() => setPanelView('text')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    panelView === 'text'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Edit massal daftar nama"
                >
                  <FileText className="w-3 h-3" />
                  <span>Teks</span>
                </button>
              </div>
            </div>

            {/* Quick Add Bar */}
            <form
              onSubmit={handleQuickAdd}
              className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex gap-1.5"
            >
              <input
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                disabled={isSpinning || isAutoSpinning}
                placeholder="Tambah nama peserta..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <button
                type="submit"
                disabled={isSpinning || isAutoSpinning || !quickAddName.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Tambah nama ke daftar peserta"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            {/* Action Toolbar */}
            <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleShuffleList}
                  disabled={isSpinning || isAutoSpinning || participants.length < 2}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  title="Acak urutan daftar peserta"
                >
                  <Shuffle className="w-3 h-3 text-amber-500" />
                  <span>Acak</span>
                </button>
                <button
                  onClick={handleSortList}
                  disabled={isSpinning || isAutoSpinning || participants.length < 2}
                  className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  title="Urutkan A-Z"
                >
                  <ArrowDownAZ className="w-3 h-3 text-emerald-500" />
                  <span>A-Z</span>
                </button>
                <button
                  onClick={handleRestorePreset35}
                  disabled={isSpinning || isAutoSpinning}
                  className="px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold transition-colors cursor-pointer"
                  title="Kembalikan daftar ke 35 siswa standar"
                >
                  Preset 35
                </button>
              </div>

              <button
                onClick={handleClearList}
                disabled={isSpinning || isAutoSpinning || participants.length === 0}
                className="px-2 py-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer"
                title="Kosongkan daftar nama"
              >
                Kosongkan
              </button>
            </div>

            {/* Panel Body: View Mode */}
            {panelView === 'live' ? (
              <div className="flex flex-col flex-1 p-2.5">
                {/* Search Filter Box */}
                {participants.length > 8 && (
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Cari nama peserta..."
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* List Container */}
                <div className="max-h-[460px] overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredParticipants.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Tidak ada nama ditemukan.
                    </div>
                  ) : (
                    filteredParticipants.map((name, idx) => {
                      const assignment = participantGroupMap.get(normalizeName(name))
                      const isOnWheel = wheelItems.some((w) => normalizeName(w) === normalizeName(name))

                      return (
                        <div
                          key={`${name}-${idx}`}
                          className={`pt-1 pb-1 px-1.5 flex items-center justify-between text-xs rounded-lg transition-colors ${
                            assignment
                              ? 'bg-slate-50 dark:bg-slate-800/50'
                              : isOnWheel
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[10px] text-slate-400 w-4 shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="truncate text-slate-900 dark:text-slate-100 font-medium">
                              {name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {/* Status Badges */}
                            {assignment ? (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded text-white flex items-center gap-1"
                                style={{ backgroundColor: assignment.color }}
                              >
                                {assignment.isPromoted && '★'}
                                {assignment.groupName}
                              </span>
                            ) : isOnWheel ? (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                Di Roda
                              </span>
                            ) : isSmartRules && PROMOTION_CANDIDATES.some((c) => normalizeName(c) === normalizeName(name)) ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                                Kandidat
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                Antrean
                              </span>
                            )}

                            {/* Delete Participant Button */}
                            {!isSpinning && (
                              <button
                                onClick={() => handleRemoveParticipant(idx)}
                                className="opacity-40 hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition-opacity cursor-pointer"
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

                {/* Footer Count */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Total: {participants.length} peserta</span>
                  <span>{wheelItems.length} di roda</span>
                </div>
              </div>
            ) : (
              /* Textarea Edit View */
              <div className="flex flex-col p-3 gap-2">
                <textarea
                  value={participants.join('\n')}
                  onChange={handleTextareaChange}
                  disabled={isSpinning || isAutoSpinning}
                  rows={14}
                  placeholder="Ketik atau paste nama di sini... (satu nama per baris)"
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  spellCheck={false}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Satu nama per baris. Mengubah daftar akan otomatis memperbarui roda dan mendeteksi mode cerdas.
                </p>
              </div>
            )}

            {/* Transparency Trust Callout */}
            <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900/50 flex items-center gap-2 text-[11px] text-blue-900 dark:text-blue-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Transparansi Penuh: Semua nama tampil terbuka di layar tanpa manipulasi tersembunyi.</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: RODA PENGACAK (WHEEL AREA) (4 COLS)            */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div
            className={`w-full rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Wheel Active Count Header */}
            <div className="w-full flex items-center justify-between mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Roda ({wheelItems.length} Nama Aktif)
              </span>
              <span>
                {isSpinning
                  ? 'Sedang berputar...'
                  : stage === 'COMPLETED'
                  ? 'Pengundian selesai'
                  : 'Klik roda / Tekan Putar'}
              </span>
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
                className="mt-3 w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-xs"
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
                  <span className="text-slate-900 dark:text-white truncate font-bold text-sm">
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

            {/* Active Target Group Info Card */}
            {activeTargetGroup && (
              <div className="mt-2 w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Target Pengisian:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Kelompok {activeTargetGroup} (
                  {groups.find((g) => g.id === activeTargetGroup)?.members.length || 0}/
                  {groups.find((g) => g.id === activeTargetGroup)?.capacity || 6})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: HASIL PEMBAGIAN (6 KELOMPOK) (5 COLS)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {group.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          Diisi
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
                  <div className="p-2 flex-1 flex flex-col gap-1 min-h-[145px] divide-y divide-slate-100 dark:divide-slate-800/60">
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
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
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
                          className={`py-1 px-2 flex items-center gap-1.5 text-xs rounded ${
                            isNext
                              ? 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-slate-300 dark:text-slate-600'
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
            <div
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 shadow-xs ${
                darkMode
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">
                Semua 6 Kelompok Telah Terisi Lengkap!
              </h3>
              <p className="text-xs opacity-90 max-w-md">
                Total {participants.length} peserta telah berhasil dibagikan secara adil dan transparan sesuai seluruh aturan.
              </p>
              <button
                onClick={handleCopyResults}
                className="mt-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
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

export default GroupDivider
