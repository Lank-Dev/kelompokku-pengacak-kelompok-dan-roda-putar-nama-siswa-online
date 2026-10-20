import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getContrastTextColor, truncateText } from '../utils/color'

interface WheelProps {
  items: string[]
  colors: string[]
  spinDuration: number // seconds
  isSpinning: boolean
  darkMode: boolean
  onSpinStart: () => void
  onSpinEnd: (winner: string) => void
}

export const Wheel: React.FC<WheelProps> = ({
  items,
  colors,
  spinDuration,
  isSpinning,
  darkMode,
  onSpinStart,
  onSpinEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Wheel state
  const rotationRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const lastSliceIndexRef = useRef<number>(-1)

  // Physical pointer / flapper deflection angle (in radians)
  const flapperDeflectionRef = useRef<number>(0)

  const [hoverCenter, setHoverCenter] = useState(false)
  const [highlightedName, setHighlightedName] = useState<string>('')

  // Calculate current slice under pointer
  const getSliceUnderPointer = useCallback(
    (rot: number, total: number): number => {
      if (total === 0) return 0
      const sliceAngle = (2 * Math.PI) / total
      const normalizedAngle = ((-rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      return Math.floor(normalizedAngle / sliceAngle) % total
    },
    []
  )

  // Update highlighted name initially or when items change
  useEffect(() => {
    if (items.length > 0) {
      const idx = getSliceUnderPointer(rotationRef.current, items.length)
      setHighlightedName(items[idx] || '')
    } else {
      setHighlightedName('')
    }
  }, [items, getSliceUnderPointer])

  // Draw wheel function (Optimized for 2 to 500+ names)
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(cx, cy) - 24

    ctx.clearRect(0, 0, width, height)

    if (items.length === 0) {
      // Empty state
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#1e293b' : '#f1f5f9'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = darkMode ? '#475569' : '#cbd5e1'
      ctx.stroke()

      ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
      ctx.font = '600 16px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Tambahkan nama terlebih dahulu', cx, cy)
      return
    }

    const total = items.length
    const sliceAngle = (2 * Math.PI) / total
    const rot = rotationRef.current
    const arcLengthAtRim = radius * sliceAngle

    // 1. Draw outer shadow & clean circular rim
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.12)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 5
    ctx.fill()
    ctx.restore()

    // Outer border ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI)
    ctx.lineWidth = 6
    ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0'
    ctx.stroke()
    ctx.restore()

    // 2. Divider stroke width configuration (Adapts safely for hundreds of names)
    let dividerWidth = 2
    let showDivider = true
    if (total > 200) {
      showDivider = false // No white lines when slices are razor thin
    } else if (total > 80) {
      dividerWidth = 0.5
    } else if (total > 40) {
      dividerWidth = 1
    }

    // 3. Draw Slices
    for (let i = 0; i < total; i++) {
      const startAngle = rot + i * sliceAngle
      const endAngle = startAngle + sliceAngle
      const color = colors[i % colors.length]

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      if (showDivider) {
        ctx.lineWidth = dividerWidth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.stroke()
      }
      ctx.restore()

      // 4. Draw Radial Text (Scale-Safe for Hundreds of Names)
      const shouldDrawText =
        total <= 120 ||
        (total <= 200 && arcLengthAtRim >= 7) ||
        (total > 200 && i % Math.ceil(total / 100) === 0)

      if (shouldDrawText && arcLengthAtRim >= 6) {
        const text = items[i]
        const midAngle = startAngle + sliceAngle / 2

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(midAngle)

        const contrastColor = getContrastTextColor(color)
        ctx.fillStyle = contrastColor
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'right'

        // Dynamic font size computation
        let fontSize = Math.min(
          22,
          Math.max(8, Math.floor(arcLengthAtRim * 0.7))
        )
        if (total <= 6) fontSize = 24
        else if (total <= 12) fontSize = 18
        else if (total <= 30) fontSize = 14
        else if (total <= 60) fontSize = 11
        else if (total <= 100) fontSize = 9
        else fontSize = 8

        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
        const maxTextWidth = radius - (radius * 0.22 + 20)
        const fittedText = truncateText(ctx, text, maxTextWidth)

        if (contrastColor === '#ffffff' && fontSize >= 11) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
          ctx.shadowBlur = 2
        }

        ctx.fillText(fittedText, radius - 16, 0)
        ctx.restore()
      }
    }

    // 5. Perimeter Pegs (Capped so it never becomes a black blob)
    const pegCount = Math.min(Math.max(total, 12), 36)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 2)
      const py = cy + Math.sin(pAngle) * (radius + 2)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#e2e8f0' : '#475569'
      ctx.fill()
      ctx.restore()
    }

    // 6. Center Hub (Crisp White Hub with Click Indicator)
    ctx.save()
    const hubRadius = Math.max(44, Math.min(62, radius * 0.22))

    // Hub drop shadow
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
    ctx.fill()

    // Hub rim border
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle =
      hoverCenter && !isSpinning ? '#3b82f6' : darkMode ? '#334155' : '#cbd5e1'
    ctx.lineWidth = 3.5
    ctx.stroke()

    // Hub inner circle face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? hoverCenter && !isSpinning
        ? '#1e3a8a'
        : '#0f172a'
      : hoverCenter && !isSpinning
      ? '#eff6ff'
      : '#ffffff'
    ctx.fill()

    // Center button text
    ctx.fillStyle = hoverCenter && !isSpinning ? '#2563eb' : darkMode ? '#f8fafc' : '#1e293b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isSpinning) {
      ctx.font = `900 ${Math.max(12, Math.floor(hubRadius * 0.28))}px system-ui, sans-serif`
      ctx.fillText('PUTAR...', cx, cy)
    } else {
      ctx.font = `900 ${Math.max(13, Math.floor(hubRadius * 0.32))}px system-ui, sans-serif`
      ctx.fillText('PUTAR', cx, cy - (hubRadius > 50 ? 6 : 0))
      if (hubRadius > 50) {
        ctx.font = '600 10px system-ui, sans-serif'
        ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
        ctx.fillText('KLIK SAYA', cx, cy + 12)
      }
    }
    ctx.restore()

    // 7. Right-side Pointer / Ticker Flapper (3 o'clock position)
    const pointerX = cx + radius + 10
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = 2

    // Triangular flapper pointing left
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(8, -12)
    ctx.lineTo(14, 0)
    ctx.lineTo(8, 12)
    ctx.closePath()

    ctx.fillStyle = '#1e293b'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Pivot pin
    ctx.beginPath()
    ctx.arc(7, 0, 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()
    ctx.restore()
  }, [items, colors, isSpinning, hoverCenter, darkMode])

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const size = Math.min(container.clientWidth, container.clientHeight, 720)
      const dpr = window.devicePixelRatio || 1

      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
      drawWheel()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawWheel])

  // Initial draw
  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  // Check pegs / tick sounds and flapper physics on each frame
  const checkTickAndFlapper = useCallback(
    (currentRot: number, angularVelocity: number) => {
      if (items.length === 0) return
      const currentSlice = getSliceUnderPointer(currentRot, items.length)

      if (lastSliceIndexRef.current !== -1 && currentSlice !== lastSliceIndexRef.current) {
        // Visual flapper bounce (silent, ultra-fast)
        const velocityMultiplier = Math.min(angularVelocity / 0.05, 3.0)
        flapperDeflectionRef.current = -0.32 * Math.min(velocityMultiplier, 1.2)
        setHighlightedName(items[currentSlice] || '')
      }
      lastSliceIndexRef.current = currentSlice

      // Spring-back damping of flapper deflection
      flapperDeflectionRef.current *= 0.82
      if (Math.abs(flapperDeflectionRef.current) < 0.01) {
        flapperDeflectionRef.current = 0
      }
    },
    [items, getSliceUnderPointer]
  )

  // Spin trigger (Ultra-snappy)
  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    onSpinStart()

    // Decide winning index uniformly at random
    const total = items.length
    const winningIndex = Math.floor(Math.random() * total)
    const sliceAngle = (2 * Math.PI) / total

    // Safe random margin within winning slice
    const randomOffsetInSlice = (0.15 + Math.random() * 0.7) * sliceAngle
    const targetNormalizedAngle = winningIndex * sliceAngle + randomOffsetInSlice

    const fullSpins = 6 + Math.floor(Math.random() * 4)
    const currentRot = rotationRef.current
    const targetRot =
      currentRot +
      fullSpins * (2 * Math.PI) +
      ((2 * Math.PI - (targetNormalizedAngle % (2 * Math.PI))) % (2 * Math.PI))

    const startRot = currentRot
    const totalDelta = targetRot - startRot
    const startTime = performance.now()
    const durationMs = spinDuration * 1000

    let previousRot = startRot

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Quintic ease out
      const eased = 1 - Math.pow(1 - progress, 5)
      const currentAngle = startRot + totalDelta * eased
      rotationRef.current = currentAngle

      const frameVelocity = currentAngle - previousRot
      previousRot = currentAngle

      checkTickAndFlapper(currentAngle, frameVelocity)
      drawWheel()

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Spin finished!
        rotationRef.current = targetRot
        drawWheel()

        const finalSliceIndex = getSliceUnderPointer(targetRot, items.length)
        const winner = items[finalSliceIndex]
        setHighlightedName(winner)
        onSpinEnd(winner)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [
    isSpinning,
    items,
    spinDuration,
    onSpinStart,
    onSpinEnd,
    checkTickAndFlapper,
    drawWheel,
    getSliceUnderPointer,
  ])

  const handleCanvasClick = () => {
    if (isSpinning || items.length === 0) return
    spin()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dist = Math.hypot(x - cx, y - cy)
    const hubRadius = Math.max(44, Math.min(62, (rect.width / 2 - 24) * 0.22))

    setHoverCenter(dist <= hubRadius)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full h-full min-h-[360px] p-2"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCenter(false)}
        className="cursor-pointer transition-transform duration-200 active:scale-[0.99] touch-manipulation select-none"
        title="Klik untuk memutar roda! (Atau tekan Spasi)"
      />

      {/* Live Pointer Indicator HUD (Sangat membantu saat ada puluhan/ratusan nama) */}
      {items.length > 0 && highlightedName && (
        <div
          className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all flex items-center gap-2 max-w-[85%] truncate ${
            darkMode
              ? 'bg-slate-800/90 border-slate-700 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-[11px] opacity-70 shrink-0">Menunjuk:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 truncate">
            {highlightedName}
          </span>
        </div>
      )}
    </div>
  )
}
