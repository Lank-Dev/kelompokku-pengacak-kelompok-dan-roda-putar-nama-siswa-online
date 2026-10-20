import React, { useState } from 'react'
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  Palette,
  MessageSquare,
  Clock,
  Trash2,
} from 'lucide-react'
import type { WheelSettings } from '../types'
import { WHEEL_THEMES } from '../utils/themes'

interface SettingsModalProps {
  isOpen: boolean
  settings: WheelSettings
  darkMode: boolean
  onUpdateSettings: (newSettings: Partial<WheelSettings>) => void
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  darkMode,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'during' | 'after' | 'appearance'>('during')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border animate-in zoom-in-95 duration-150 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Kustomisasi Roda</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengaturan suara, durasi, dan tema visual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Wheel of Names Style) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('during')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'during'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Saat Memutar
          </button>
          <button
            onClick={() => setActiveTab('after')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'after'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Setelah Memutar
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tampilan & Tema
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Tab 1: During Spin */}
          {activeTab === 'during' && (
            <div className="space-y-4">
              {/* Spin Duration */}
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Durasi Putaran
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
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
                  className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Cepat (3s)</span>
                  <span>Standar (6s)</span>
                  <span>Dramatis (20s)</span>
                </div>
              </div>

              {/* Sound toggle */}
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  settings.soundEnabled
                    ? 'border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/40'
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      settings.soundEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">Suara Detak Roda (Ticking Sound)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Efek klik realistis saat roda berputar melewati jarum
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    settings.soundEnabled ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {settings.soundEnabled ? 'Aktif' : 'Mati'}
                </span>
              </button>
            </div>
          )}

          {/* Tab 2: After Spin */}
          {activeTab === 'after' && (
            <div className="space-y-4">
              {/* Confetti toggle */}
              <button
                onClick={() => onUpdateSettings({ confettiEnabled: !settings.confettiEnabled })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  settings.confettiEnabled
                    ? 'border-purple-500/60 bg-purple-50/50 dark:bg-purple-950/40'
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      settings.confettiEnabled
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Animasi Konfeti</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pesta konfeti meriah saat nama pemenang terpilih
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    settings.confettiEnabled ? 'text-purple-600' : 'text-slate-400'
                  }`}
                >
                  {settings.confettiEnabled ? 'Aktif' : 'Mati'}
                </span>
              </button>

              {/* Show Remove button toggle (Wheel of Names) */}
              <button
                onClick={() => onUpdateSettings({ showRemoveButton: !settings.showRemoveButton })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  settings.showRemoveButton
                    ? 'border-rose-500/60 bg-rose-50/50 dark:bg-rose-950/40'
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      settings.showRemoveButton
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Tampilkan Tombol Hapus Pemenang</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Memungkinkan menghapus pemenang agar tidak terpilih lagi
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    settings.showRemoveButton ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  {settings.showRemoveButton ? 'Aktif' : 'Mati'}
                </span>
              </button>

              {/* Winning message input */}
              <div
                className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <label className="flex items-center gap-1.5 text-xs font-bold mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Pesan Ucapan Pemenang
                </label>
                <input
                  type="text"
                  value={settings.winningMessage}
                  onChange={(e) => onUpdateSettings({ winningMessage: e.target.value })}
                  placeholder="Kami punya pemenang!"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600'
                      : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ketik pesan ucapan. Gunakan <code className="font-mono text-blue-500">{"{name}"}</code> untuk posisi nama pemenang.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Appearance & Themes */}
          {activeTab === 'appearance' && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold mb-3">
                <Palette className="w-4 h-4 text-pink-500" />
                Pilihan Tema Warna Roda
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WHEEL_THEMES.map((theme) => {
                  const isSelected = settings.themeId === theme.id
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onUpdateSettings({ themeId: theme.id })}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/30 dark:bg-blue-950/30'
                          : darkMode
                          ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold mb-2">{theme.name}</span>
                      <div className="flex h-4 w-full rounded-md overflow-hidden border border-slate-300 dark:border-slate-700">
                        {theme.colors.slice(0, 8).map((c, cIdx) => (
                          <div key={cIdx} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  )
}
