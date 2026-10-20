import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Trash2, X, RotateCw, Sparkles } from 'lucide-react'

interface WinnerModalProps {
  winner: string | null
  round: number
  remainingCount: number
  winningMessage: string
  confettiEnabled: boolean
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
  onClose,
  onRemoveWinner,
  onSpinAgain,
}) => {
  useEffect(() => {
    if (!winner || !confettiEnabled) return

    // Multi-stage confetti celebration
    const duration = 2.5 * 1000
    const end = Date.now() + duration

    // 1. Initial big blast
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    })

    // 2. Continuous side cannons
    const interval: number = window.setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval)
      }
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      })
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [winner, confettiEnabled])

  if (!winner) return null

  const displayMessage = winningMessage
    ? winningMessage.replace('{name}', winner)
    : `Selamat kepada ${winner}!`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-center transform transition-all scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Icon with Glowing Rings */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full text-slate-950 shadow-lg shadow-amber-500/30">
          <Trophy className="w-10 h-10 animate-bounce" />
          <div className="absolute inset-0 rounded-full border-2 border-yellow-200/50 animate-ping opacity-40" />
        </div>

        {/* Round Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Putaran #{round}
        </div>

        {/* Custom Winning Message */}
        <p className="text-sm text-slate-300 mb-1">{displayMessage}</p>

        {/* Big Winning Name Display */}
        <div className="my-5 p-4 sm:p-6 bg-slate-800/70 border border-slate-700 rounded-2xl shadow-inner">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 break-words drop-shadow">
            {winner}
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Tersisa {remainingCount} nama di dalam roda putar
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onRemoveWinner(winner)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/90 hover:bg-rose-500 active:bg-rose-700 text-white font-medium text-sm rounded-xl border border-rose-500/30 shadow-lg shadow-rose-900/30 transition-all hover:scale-[1.02]"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Pemenang
          </button>

          <button
            onClick={onSpinAgain}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl border border-blue-400/30 shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.02]"
          >
            <RotateCw className="w-4 h-4" />
            Putar Lagi
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
        >
          Biarkan & Tutup Jendela
        </button>
      </div>
    </div>
  )
}
