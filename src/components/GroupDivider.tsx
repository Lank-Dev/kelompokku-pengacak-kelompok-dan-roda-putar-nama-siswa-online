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

  // Re-generate groups when group count or total students changes
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

      const timestamp = new Date().toLocaleTimeString('en-US', {
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
          particleCount: 45,
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
            particleCount: 120,
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
      alert('Please enter at least one participant name.')
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
    lines.push(`=== GROUP DIVISION RESULTS (${groups.length} GROUPS) ===`)
    lines.push(`Generated: ${new Date().toLocaleString('en-US')}`)
    lines.push(`Total Participants: ${totalAllocated} / ${allStudents.length}`)
    lines.push('--------------------------------------------------')

    groups.forEach((grp) => {
      lines.push(`\n[ ${grp.name.toUpperCase()} ] (${grp.members.length}/${grp.capacity}):`)
      if (grp.members.length === 0) {
        lines.push('  - (No members yet)')
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

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 p-3 sm:p-5 font-sans">
      {/* Controls Bar */}
      <section
        className={`rounded-xl border p-4 sm:p-5 transition-colors shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Title & Group Selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Controls</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {totalAllocated} of {allStudents.length} Assigned
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isCompleted
                  ? 'All groups completed'
                  : activeTargetGroup
                  ? `Filling ${activeTargetGroup.name} (${activeTargetGroup.members.length}/${activeTargetGroup.capacity})`
                  : 'Ready'}
              </p>
            </div>

            {/* Group Count Selector (1 to 10) */}
            <div className="flex items-center gap-2 pl-0 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800">
              <label
                htmlFor="group-select"
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap"
              >
                Groups:
              </label>
              <select
                id="group-select"
                value={groupCount}
                disabled={isSpinning || isAutoSpinning || totalAllocated > 0}
                onChange={(e) => handleGroupCountChange(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Group' : 'Groups'}
                  </option>
                ))}
              </select>

              {/* Edit Participants Button */}
              <button
                onClick={() => setIsEditorOpen(!isEditorOpen)}
                disabled={isSpinning || isAutoSpinning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Edit participant names"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Names ({allStudents.length})</span>
              </button>
            </div>
          </div>

          {/* Right: Modern Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Spin Button */}
            <button
              onClick={handleSingleSpin}
              disabled={isSpinning || isAutoSpinning || isCompleted || remainingStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Spin</span>
            </button>

            {/* Auto Spin Button */}
            <button
              onClick={handleToggleAutoSpin}
              disabled={isCompleted || remainingStudents.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer ${
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy Results</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isSpinning || isAutoSpinning || totalAllocated === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Reset all groups"
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
                Participant Names (One per line)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffleStudents}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>
                <button
                  onClick={() => setRawText(DEFAULT_STUDENTS.join('\n'))}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Restore 35 Students
                </button>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-lg border font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="Paste or enter student names here..."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStudents}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Names & Reset Groups
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
            className={`w-full rounded-xl border p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center relative overflow-hidden transition-colors ${
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

            {/* Recent Winner Banner */}
            {recentWinner && (
              <div className="mt-3 w-full py-2 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs font-bold transition-all shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: recentWinner.groupColor }}
                  />
                  <span className="text-slate-900 dark:text-white truncate">
                    {recentWinner.name}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white shrink-0"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {groups.map((group) => {
              const isFull = group.members.length >= group.capacity
              const isCurrent = activeTargetGroup?.id === group.id && !isFull

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
                          Filling
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
                            className="py-1 px-2 flex items-center justify-between text-xs rounded bg-slate-50 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                                {index + 1}.
                              </span>
                              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {member.name}
                              </span>
                            </div>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                            {isNext ? 'Next slot' : 'Empty'}
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
                All Groups Successfully Filled!
              </h3>
              <p className="text-xs opacity-90">
                Total {totalAllocated} participants distributed across {groups.length} groups.
              </p>
              <button
                onClick={handleCopyResults}
                className="mt-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Complete Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
