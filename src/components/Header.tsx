import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Volume2,
  VolumeX,
  History,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface HeaderProps {
  soundEnabled: boolean
  historyCount: number
  onToggleSound: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  historyCount,
  onToggleSound,
  onOpenHistory,
  onOpenSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                KocokNama
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400">
              Roda Pengacak Nama & Undian Doorprize Online
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-800/80 text-blue-400 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Matikan Suara (Mute)' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Lihat Riwayat Pemenang"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Pemenang</span>
            {historyCount > 0 && (
              <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Pengaturan Roda"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
