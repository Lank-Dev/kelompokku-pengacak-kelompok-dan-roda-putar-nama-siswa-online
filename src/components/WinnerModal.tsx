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
      particleCount: 110,
      spread: 90,
      origin: { y: 0.6 },
    })

    const interval: number = window.setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval)
      }
      confetti({
        particleCount: 35,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
      })
      confetti({
        particleCount: 35,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl border transform transition-all scale-100 animate-in zoom-in-95 duration-150 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white shadow-black/80'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
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

        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 mb-3 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-2xl text-slate-950 shadow-md shadow-amber-500/30">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        {/* Round Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-bold tracking-wide uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Putaran #{round}
        </div>

        {/* Winning Headline with High Contrast */}
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {displayMessage}
        </h3>

        {/* Big Winning Name Display */}
        <div
          className={`my-4 p-5 rounded-2xl border-2 shadow-inner ${
            darkMode
              ? 'bg-slate-950 border-slate-700'
              : 'bg-slate-50 border-slate-300'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-blue-700 dark:text-yellow-400 break-words drop-shadow-xs">
            {winner}
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-5">
          Tersisa {remainingCount} nama di roda putar
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {showRemoveButton && (
            <button
              onClick={() => onRemoveWinner(winner)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
              title="Hapus nama pemenang dari roda"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          )}

          <button
            onClick={onClose}
            className={`flex items-center justify-center gap-2 px-4 py-3 font-extrabold text-xs rounded-xl border transition-all hover:scale-[1.02] shadow-xs ${
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
          className="mt-3.5 inline-flex items-center justify-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 hover:underline font-bold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Putar Lagi Sekarang
        </button>
      </div>
    </div>
  )
}
