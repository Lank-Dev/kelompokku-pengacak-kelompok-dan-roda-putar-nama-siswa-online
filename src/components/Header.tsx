import React, { useState, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  Users,
  Compass,
} from 'lucide-react'

interface HeaderProps {
  darkMode?: boolean
  activeMode: 'group-divider' | 'custom-wheel'
  onSelectMode: (mode: 'group-divider' | 'custom-wheel') => void
  onToggleDarkMode?: () => void
  onOpenSettings?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
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
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-2.5 sm:px-6 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm tracking-tighter">KN</span>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              KocokNama
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Random Wheel & Group Divider
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold shadow-inner">
          <button
            onClick={() => onSelectMode('group-divider')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'group-divider'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Groups</span>
          </button>

          <button
            onClick={() => onSelectMode('custom-wheel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'custom-wheel'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Free Wheel</span>
          </button>
        </div>

        {/* Right Toolbar */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
