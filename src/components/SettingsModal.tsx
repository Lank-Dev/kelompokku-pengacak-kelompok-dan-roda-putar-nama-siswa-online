import React from 'react'
import { X, Sliders, Volume2, VolumeX, Sparkles, Palette, MessageSquare } from 'lucide-react'
import type { WheelSettings } from '../types'
import { WHEEL_THEMES } from '../utils/themes'

interface SettingsModalProps {
  isOpen: boolean
  settings: WheelSettings
  onUpdateSettings: (newSettings: Partial<WheelSettings>) => void
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pengaturan Roda Putar</h3>
              <p className="text-xs text-slate-400">Kustomisasi suara, durasi, dan visual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Spin Duration */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-200">Durasi Putaran</label>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                {settings.spinDuration} detik
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={settings.spinDuration}
              onChange={(e) => onUpdateSettings({ spinDuration: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Cepat (3s)</span>
              <span>Standar (6s)</span>
              <span>Dramatis (20s)</span>
            </div>
          </div>

          {/* Sound & Confetti Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                settings.soundEnabled
                  ? 'bg-blue-950/40 border-blue-600/50 text-white'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  settings.soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold">Efek Suara</div>
                <div className="text-[10px] opacity-70">
                  {settings.soundEnabled ? 'Aktif (Tick & Fanfare)' : 'Senyap / Mute'}
                </div>
              </div>
            </button>

            <button
              onClick={() => onUpdateSettings({ confettiEnabled: !settings.confettiEnabled })}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                settings.confettiEnabled
                  ? 'bg-purple-950/40 border-purple-600/50 text-white'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  settings.confettiEnabled
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Animasi Confetti</div>
                <div className="text-[10px] opacity-70">
                  {settings.confettiEnabled ? 'Aktif' : 'Nonaktif'}
                </div>
              </div>
            </button>
          </div>

          {/* Winning Message Template */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Teks Ucapan Pemenang
            </label>
            <input
              type="text"
              value={settings.winningMessage}
              onChange={(e) => onUpdateSettings({ winningMessage: e.target.value })}
              placeholder="Selamat kepada {name}!"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gunakan kode <code className="text-blue-400 font-mono">{"{name}"}</code> untuk posisi nama pemenang.
            </p>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Tema Warna Roda
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHEEL_THEMES.map((theme) => {
                const isSelected = settings.themeId === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => onUpdateSettings({ themeId: theme.id })}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500'
                        : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold mb-2 text-slate-200">
                      {theme.name}
                    </span>
                    {/* Swatches preview */}
                    <div className="flex h-4 w-full rounded-md overflow-hidden border border-slate-700/60">
                      {theme.colors.slice(0, 8).map((color, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex-1 h-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/30 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
