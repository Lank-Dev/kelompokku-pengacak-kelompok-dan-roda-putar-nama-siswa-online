import { useState, useEffect, useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { Wheel } from './components/Wheel'
import { EntriesPanel } from './components/EntriesPanel'
import { WinnerModal } from './components/WinnerModal'
import { HistoryModal } from './components/HistoryModal'
import { SettingsModal } from './components/SettingsModal'
import type { WheelSettings, WinnerRecord } from './types'
import { WHEEL_THEMES } from './utils/themes'
import { PRESET_LISTS } from './utils/presets'

const DEFAULT_ITEMS = PRESET_LISTS[0].items

const DEFAULT_SETTINGS: WheelSettings = {
  spinDuration: 6,
  soundEnabled: true,
  confettiEnabled: true,
  winningMessage: 'Selamat kepada {name}! 🎉',
  themeId: 'rainbow-classic',
  allowDuplicates: true,
}

export function App() {
  // Load initial states from localStorage if available
  const [items, setItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kocoknama_items')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return DEFAULT_ITEMS
  })

  const [settings, setSettings] = useState<WheelSettings>(() => {
    try {
      const saved = localStorage.getItem('kocoknama_settings')
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS
  })

  const [history, setHistory] = useState<WinnerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kocoknama_history')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return []
  })

  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [currentWinner, setCurrentWinner] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kocoknama_items', JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  useEffect(() => {
    try {
      localStorage.setItem('kocoknama_settings', JSON.stringify(settings))
    } catch {
      // ignore
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem('kocoknama_history', JSON.stringify(history))
    } catch {
      // ignore
    }
  }, [history])

  // Current theme colors
  const currentTheme = useMemo(() => {
    return (
      WHEEL_THEMES.find((t) => t.id === settings.themeId) || WHEEL_THEMES[0]
    )
  }, [settings.themeId])

  // Spin lifecycle handlers
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true)
    setCurrentWinner(null)
  }, [])

  const handleSpinEnd = useCallback((winner: string) => {
    setIsSpinning(false)
    setCurrentWinner(winner)

    // Add to history
    const record: WinnerRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: winner,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      round: history.length + 1,
    }
    setHistory((prev) => [record, ...prev])
  }, [history.length])

  // Remove winner from list action
  const handleRemoveWinner = useCallback((winnerToRemove: string) => {
    setItems((prev) => {
      // Remove first occurrence of this name
      const index = prev.indexOf(winnerToRemove)
      if (index !== -1) {
        const next = [...prev]
        next.splice(index, 1)
        return next
      }
      return prev
    })
    setCurrentWinner(null)
  }, [])

  // Spin again directly from modal
  const handleSpinAgain = useCallback(() => {
    setCurrentWinner(null)
    // Small timeout to allow modal animation to exit cleanly
    setTimeout(() => {
      // Trigger canvas click programmatically or wait for user
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }, 200)
  }, [])

  // Entries toolbar handlers
  const handleShuffle = useCallback(() => {
    if (isSpinning) return
    setItems((prev) => {
      const copy = [...prev]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    })
  }, [isSpinning])

  const handleSort = useCallback(() => {
    if (isSpinning) return
    setItems((prev) => [...prev].sort((a, b) => a.localeCompare(b)))
  }, [isSpinning])

  const handleClear = useCallback(() => {
    if (isSpinning) return
    if (confirm('Yakin ingin mengosongkan semua daftar nama?')) {
      setItems([])
    }
  }, [isSpinning])

  const handleClearHistory = useCallback(() => {
    if (confirm('Bersihkan semua riwayat pemenang?')) {
      setHistory([])
    }
  }, [])

  // Keyboard shortcut: Spacebar or Enter to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea or input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (targetTag === 'textarea' || targetTag === 'input') return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!isSpinning && items.length > 0 && !currentWinner && !isSettingsOpen && !isHistoryOpen) {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          }
        }
      }

      if (e.key === 'Escape') {
        if (currentWinner) setCurrentWinner(null)
        if (isSettingsOpen) setIsSettingsOpen(false)
        if (isHistoryOpen) setIsHistoryOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSpinning, items.length, currentWinner, isSettingsOpen, isHistoryOpen])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        soundEnabled={settings.soundEnabled}
        historyCount={history.length}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Wheel Stage (8 cols on desktop) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-800/80 rounded-3xl p-4 sm:p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl min-h-[460px] lg:min-h-[640px]">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Canvas Wheel Component */}
          <Wheel
            items={items}
            colors={currentTheme.colors}
            spinDuration={settings.spinDuration}
            soundEnabled={settings.soundEnabled}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
          />

          {/* Quick Instruction / Hotkey Tip */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[11px] text-slate-300">
              SPACE
            </span>
            <span className="hidden sm:inline">atau klik tengah roda untuk memutar</span>
            <span className="sm:hidden">Ketuk roda untuk memutar</span>
          </div>
        </section>

        {/* Right: Entries Panel (5 cols on desktop) */}
        <section className="lg:col-span-5 xl:col-span-4 h-full min-h-[460px] lg:min-h-[640px] flex flex-col">
          <EntriesPanel
            items={items}
            onChangeItems={setItems}
            onShuffle={handleShuffle}
            onSort={handleSort}
            onClear={handleClear}
            disabled={isSpinning}
          />
        </section>
      </main>

      {/* Modals */}
      <WinnerModal
        winner={currentWinner}
        round={history.length}
        remainingCount={items.length}
        winningMessage={settings.winningMessage}
        confettiEnabled={settings.confettiEnabled}
        onClose={() => setCurrentWinner(null)}
        onRemoveWinner={handleRemoveWinner}
        onSpinAgain={handleSpinAgain}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default App
