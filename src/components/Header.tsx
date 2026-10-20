import React, { useState, useEffect } from 'react'
import {
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
} from 'lucide-react'

interface HeaderProps {
  soundEnabled: boolean
  darkMode: boolean
  onToggleSound: () => void
  onToggleDarkMode: () => void
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  darkMode,
  onToggleSound,
  onToggleDarkMode,
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
    <header
      className={`w-full border-b sticky top-0 z-30 px-4 py-2.5 sm:px-6 transition-colors ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo (Wheel of Names Style) */}
        <div className="flex items-center gap-2.5">
          {/* Multi-color circular wheel logo */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-slate-300 dark:border-slate-600 flex items-center justify-center">
            <div className="absolute inset-0 bg-conic from-blue-500 via-red-500 via-yellow-400 via-green-500 to-blue-500" />
            <div className="relative w-2.5 h-2.5 bg-white dark:bg-slate-900 rounded-full shadow-inner" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight">
                Wheel of Names
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                ID
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
              Roda Pengacak Nama & Undian Pemenang Online
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Customize / Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Kustomisasi Roda (Customize)"
          >
            <Sliders className="w-4 h-4 text-blue-500" />
            <span>Kustomisasi</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? darkMode
                  ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                : darkMode
                ? 'bg-slate-800/60 text-slate-500 border-slate-800 hover:bg-slate-800'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Matikan Suara (Mute)' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
