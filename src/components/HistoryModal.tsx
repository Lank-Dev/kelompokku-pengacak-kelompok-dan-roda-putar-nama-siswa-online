import React, { useState } from 'react'
import { X, Trophy, Trash2, Copy, Check } from 'lucide-react'
import type { WinnerRecord } from '../types'

interface HistoryModalProps {
  isOpen: boolean
  history: WinnerRecord[]
  onClose: () => void
  onClearHistory: () => void
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyHistory = () => {
    if (history.length === 0) return
    const text = history
      .map((rec) => `Putaran #${rec.round}: ${rec.name} (${rec.timestamp})`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Riwayat Pemenang</h3>
              <p className="text-xs text-slate-400">Total {history.length} putaran selesai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center">
              <Trophy className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Belum ada pemenang yang tercatat.</p>
              <p className="text-xs text-slate-600 mt-1">
                Putar roda untuk mendapatkan pemenang pertama!
              </p>
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                    #{record.round}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{record.name}</div>
                    <div className="text-[11px] text-slate-400">{record.timestamp}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
          <button
            onClick={handleCopyHistory}
            disabled={history.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 disabled:opacity-40 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Salin Semua</span>
              </>
            )}
          </button>

          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 active:bg-rose-950/80 disabled:opacity-40 rounded-xl text-xs font-semibold border border-rose-800/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
