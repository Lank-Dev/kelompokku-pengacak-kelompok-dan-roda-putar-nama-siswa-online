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
    <header className="w-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#1e3a8a] border-b-2 border-[#172554] text-white sticky top-0 z-30 px-3 py-2 sm:px-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(0,0,0,0.15)] font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand / Logo (Classic Web 2.0 Badge) */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xs overflow-hidden shadow-xs border-2 border-white/80 bg-white flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-conic from-blue-600 via-red-600 via-yellow-500 via-green-600 to-blue-600" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white drop-shadow-xs">
                KocokNama
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-xs bg-[#fef08a] text-[#713f12] border border-[#facc15] shadow-2xs">
                v2005
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-blue-100 font-medium -mt-0.5">
              Sistem Spinner & Pembagian 35 Peserta Kelompok
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs (Classic Beveled Tabs) */}
        <div className="flex items-center p-0.5 rounded-xs border border-blue-900/60 bg-blue-950/40 text-xs font-bold shadow-inner">
          <button
            onClick={() => onSelectMode('group-divider')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xs transition-all cursor-pointer ${
              activeMode === 'group-divider'
                ? 'bg-white text-blue-900 font-black shadow-xs'
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">6 Kelompok (35 Peserta)</span>
            <span className="sm:hidden">Kelompok</span>
          </button>

          <button
            onClick={() => onSelectMode('custom-wheel')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xs transition-all cursor-pointer ${
              activeMode === 'custom-wheel'
                ? 'bg-white text-blue-900 font-black shadow-xs'
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roda Bebas</span>
            <span className="sm:hidden">Bebas</span>
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Customize / Settings Button (Only in custom-wheel mode) */}
          {activeMode === 'custom-wheel' && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-white/10 hover:bg-white/20 active:translate-y-0.5 border border-white/30 text-white font-bold text-xs shadow-xs cursor-pointer"
              title="Kustomisasi Roda"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Opsi</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 active:translate-y-0.5 border border-white/30 text-white shadow-xs cursor-pointer"
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-100" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xs bg-white/10 hover:bg-white/20 active:translate-y-0.5 border border-white/30 text-white shadow-xs cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  )
}
