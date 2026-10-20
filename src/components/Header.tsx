import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Users,
  Compass,
} from 'lucide-react'

interface HeaderProps {
  darkMode: boolean
  activeMode: 'group-divider' | 'custom-wheel'
  onSelectMode: (mode: 'group-divider' | 'custom-wheel') => void
  onToggleDarkMode: () => void
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  activeMode,
  onSelectMode,
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
      className={`w-full border-b sticky top-0 z-30 px-3 py-2 sm:px-6 transition-colors shadow-2xs ${
        darkMode
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-xs border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-conic from-blue-600 via-red-600 via-yellow-500 via-green-600 to-blue-600" />
            <div className="relative w-2.5 h-2.5 bg-white dark:bg-slate-950 rounded-full shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white">
                KocokNama
              </h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                PRO
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-600 dark:text-slate-300 font-medium -mt-0.5">
              Roda Pengacak & Pembagi Kelompok Online
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div
          className={`flex items-center p-1 rounded-xl border text-xs font-bold transition-all ${
            darkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-slate-100 border-slate-300'
          }`}
        >
          <button
            onClick={() => onSelectMode('group-divider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'group-divider'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>6 Kelompok (35 Peserta)</span>
          </button>

          <button
            onClick={() => onSelectMode('custom-wheel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'custom-wheel'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : darkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roda Bebas</span>
            <span className="sm:hidden">Bebas</span>
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Customize / Settings Button (Only in custom-wheel mode) */}
          {activeMode === 'custom-wheel' && (
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors shadow-xs cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
              }`}
              title="Kustomisasi Roda"
            >
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Kustomisasi</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg border transition-colors shadow-xs cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-colors shadow-xs cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
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
