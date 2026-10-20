import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Trash2, X, RotateCw, Sparkles } from 'lucide-react'

interface WinnerModalProps {
  winner: string | null
  round: number
  remainingCount: number
  winningMessage: string
  confettiEnabled: boolean
  showRemoveButton: boolean
  darkMode: boolean
  onClose: () => void
  onRemoveWinner: (name: string) => void
  onSpinAgain: () => void
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  round,
  remainingCount,
  winningMessage,
  confettiEnabled,
  showRemoveButton,
  darkMode,
  onClose,
  onRemoveWinner,
  onSpinAgain,
}) => {
  useEffect(() => {
    if (!winner || !confettiEnabled) return

    const duration = 2.5 * 1000
    const end = Date.now() + duration

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    })

    const interval: number = window.setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval)
      }
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
      })
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [winner, confettiEnabled])

  if (!winner) return null

  const displayMessage = winningMessage
    ? winningMessage.replace('{name}', winner)
    : 'Kami punya pemenang!'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-10 text-center shadow-2xl border-2 transform transition-all scale-100 animate-in zoom-in-95 duration-150 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white shadow-black/90'
            : 'bg-white border-slate-300 text-slate-950 shadow-2xl'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl text-slate-950 shadow-lg shadow-amber-500/40">
          <Trophy className="w-10 h-10 animate-bounce" />
          <div className="absolute inset-0 rounded-3xl border-2 border-yellow-200/60 animate-ping opacity-30 pointer-events-none" />
        </div>

        {/* Round Badge */}
        <div className="flex justify-center mb-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-black tracking-wider uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Putaran #{round}
          </span>
        </div>

        {/* Celebratory Message Header */}
        <h3 className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 mb-2">
          {displayMessage}
        </h3>

        {/* GIGANTIC Winning Name Display (100% High-Contrast in White Mode) */}
        <div
          className={`my-5 p-6 sm:p-8 rounded-2xl border-2 text-center transition-all ${
            darkMode
              ? 'bg-slate-950 border-amber-400/80 shadow-lg shadow-black/60'
              : 'bg-amber-50/90 border-amber-400 shadow-md ring-4 ring-amber-100/80'
          }`}
        >
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pemenang Terpilih</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-amber-300 break-words leading-tight drop-shadow-xs">
            {winner}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold mb-6">
          Tersisa <span className="text-blue-600 dark:text-blue-400">{remainingCount}</span> nama di dalam roda putar
        </p>

        {/* Action Buttons (Wheel of Names: Hapus & Tutup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showRemoveButton && (
            <button
              onClick={() => onRemoveWinner(winner)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              title="Hapus nama pemenang dari roda agar tidak terpilih lagi"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Pemenang
            </button>
          )}

          <button
            onClick={onClose}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 font-black text-sm rounded-xl border-2 transition-all hover:scale-[1.02] shadow-xs cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            Tutup
          </button>
        </div>

        <button
          onClick={onSpinAgain}
          className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-400 hover:underline font-extrabold cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          Putar Lagi Sekarang
        </button>
      </div>
    </div>
  )
}
