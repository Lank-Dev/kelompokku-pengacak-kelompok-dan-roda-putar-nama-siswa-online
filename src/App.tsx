import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { Header } from './components/Header'
import { Wheel } from './components/Wheel'
import { SidebarTabs } from './components/SidebarTabs'
import { WinnerModal } from './components/WinnerModal'
import { SettingsModal } from './components/SettingsModal'
import type { WheelSettings, WinnerRecord } from './types'
import { WHEEL_THEMES } from './utils/themes'
import { PRESET_LISTS } from './utils/presets'

const DEFAULT_ITEMS = PRESET_LISTS[0].items

const DEFAULT_SETTINGS: WheelSettings = {
  spinDuration: 3, // Fast & snappy 3-second spin
  confettiEnabled: true,
  winningMessage: 'Kami punya pemenang!',
  themeId: 'classic-wheelofnames',
  allowDuplicates: true,
  showRemoveButton: true,
  darkMode: false, // Default Wheel of Names clean light theme
}

export function App() {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [sidebarTab, setSidebarTab] = useState<'entries' | 'results'>('entries')

  // Toggle dark class on root document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

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
    setSidebarTab('results')
  }, [history.length])

  // Remove winner from list action
  const handleRemoveWinner = useCallback((winnerToRemove: string) => {
    setItems((prev) => {
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
    setTimeout(() => {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }, 150)
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

  const handleClearItems = useCallback(() => {
    if (isSpinning) return
    if (confirm('Yakin ingin mengosongkan semua daftar nama?')) {
      setItems([])
    }
  }, [isSpinning])

  const handleClearHistory = useCallback(() => {
    if (confirm('Hapus semua riwayat pemenang?')) {
      setHistory([])
    }
  }, [])

  const handleRemoveHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  // Global Keyboard shortcuts: Spacebar / Enter to spin, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (targetTag === 'textarea' || targetTag === 'input') return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!isSpinning && items.length > 0 && !currentWinner && !isSettingsOpen) {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          }
        }
      }

      if (e.key === 'Escape') {
        if (currentWinner) setCurrentWinner(null)
        if (isSettingsOpen) setIsSettingsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSpinning, items.length, currentWinner, isSettingsOpen])

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors ${
        settings.darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#edf0f5] text-slate-900'
      }`}
    >
      {/* Top Header Navigation */}
      <Header
        darkMode={settings.darkMode}
        onToggleDarkMode={() =>
          setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Stage: Wheel Area */}
        <section
          className={`lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center rounded-2xl p-4 sm:p-6 border shadow-sm relative overflow-hidden transition-colors min-h-[460px] lg:min-h-[600px] ${
            settings.darkMode
              ? 'bg-slate-900 border-slate-700'
              : 'bg-white border-slate-300'
          }`}
        >
          {/* Canvas Wheel Component */}
          <Wheel
            items={items}
            colors={currentTheme.colors}
            spinDuration={settings.spinDuration}
            isSpinning={isSpinning}
            darkMode={settings.darkMode}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
          />

          {/* Quick Instruction with High-Contrast Text */}
          <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-md border border-slate-400 dark:border-slate-600 font-mono text-[11px] font-extrabold shadow-2xs">
              SPASI
            </span>
            <span className="hidden sm:inline">atau klik roda untuk memutar</span>
            <span className="sm:hidden font-extrabold">Ketuk roda untuk memutar</span>
          </div>

          {/* Persistent Winner Banner Card (Ultra High Contrast in White Mode) */}
          {history.length > 0 && !isSpinning && (
            <div className="mt-4 w-full max-w-lg p-3.5 sm:p-4 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/60 dark:border-amber-500 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy className="w-5 h-5 font-black" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                      Putaran #{history[0].round} • Pemenang Terakhir
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                      {history[0].timestamp}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white truncate mt-0.5">
                    {history[0].name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCurrentWinner(history[0].name)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors cursor-pointer shadow-xs"
                  title="Lihat modal perayaan pemenang"
                >
                  Lihat
                </button>
                {settings.showRemoveButton && (
                  <button
                    onClick={() => handleRemoveWinner(history[0].name)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors cursor-pointer shadow-xs"
                    title="Hapus pemenang ini dari daftar roda"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Stage: Sidebar Tabs (Entri & Hasil) */}
        <section className="lg:col-span-5 xl:col-span-4 h-full min-h-[460px] lg:min-h-[600px] flex flex-col">
          <SidebarTabs
            items={items}
            history={history}
            activeTab={sidebarTab}
            disabled={isSpinning}
            darkMode={settings.darkMode}
            onTabChange={setSidebarTab}
            onChangeItems={setItems}
            onShuffle={handleShuffle}
            onSort={handleSort}
            onClearItems={handleClearItems}
            onClearHistory={handleClearHistory}
            onRemoveHistoryItem={handleRemoveHistoryItem}
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
        showRemoveButton={settings.showRemoveButton}
        darkMode={settings.darkMode}
        onClose={() => setCurrentWinner(null)}
        onRemoveWinner={handleRemoveWinner}
        onSpinAgain={handleSpinAgain}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        darkMode={settings.darkMode}
        onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default App
