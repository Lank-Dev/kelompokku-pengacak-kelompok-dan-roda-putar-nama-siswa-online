import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getSliceTextStyles, truncateText } from '../utils/color'

export interface WheelHandle {
  spin: () => void
}

export interface WheelProps {
  items: string[]
  colors: string[]
  spinDuration: number // seconds
  isSpinning: boolean
  darkMode: boolean
  onSpinStart: () => void
  onSpinEnd: (winner: string) => void
}

export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel(
  {
    items,
    colors,
    spinDuration,
    isSpinning,
    darkMode,
    onSpinStart,
    onSpinEnd,
  },
  ref
) {
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

  // Draw wheel function with guaranteed high-contrast rendering
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
      ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'
      ctx.stroke()

      ctx.fillStyle = darkMode ? '#f1f5f9' : '#1e293b'
      ctx.font = 'bold 16px system-ui, sans-serif'
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
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.2)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 6
    ctx.fill()
    ctx.restore()

    // Outer border ring with high contrast
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI)
    ctx.lineWidth = 7
    ctx.strokeStyle = darkMode ? '#334155' : '#cbd5e1'
    ctx.stroke()
    ctx.restore()

    // 2. Divider stroke width configuration
    let dividerWidth = 2
    let showDivider = true
    if (total > 200) {
      showDivider = false
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.stroke()
      }
      ctx.restore()

      // 4. Draw Radial Text with Dual-Pass Outline Contrast
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

        const { textColor, strokeColor } = getSliceTextStyles(color)
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'right'

        // Dynamic font size computation
        let fontSize = Math.min(
          22,
          Math.max(8.5, Math.floor(arcLengthAtRim * 0.72))
        )
        if (total <= 6) fontSize = 24
        else if (total <= 12) fontSize = 18
        else if (total <= 30) fontSize = 14
        else if (total <= 60) fontSize = 11.5
        else if (total <= 100) fontSize = 9.5
        else fontSize = 8.5

        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
        const maxTextWidth = radius - (radius * 0.22 + 22)
        const fittedText = truncateText(ctx, text, maxTextWidth)

        // Pass 1: Crisp Outline stroke for 100% legibility against ANY background
        if (fontSize >= 9.5) {
          ctx.lineWidth = Math.min(3, Math.max(1.5, fontSize * 0.22))
          ctx.strokeStyle = strokeColor
          ctx.lineJoin = 'round'
          ctx.miterLimit = 2
          ctx.strokeText(fittedText, radius - 16, 0)
        }

        // Pass 2: Foreground Text
        ctx.fillStyle = textColor
        ctx.fillText(fittedText, radius - 16, 0)
        ctx.restore()
      }
    }

    // 5. Perimeter Pegs (Rivets for tactile mechanical feel)
    const pegCount = Math.min(Math.max(total, 12), 36)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 2)
      const py = cy + Math.sin(pAngle) * (radius + 2)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#f8fafc' : '#1e293b'
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 2
      ctx.fill()
      ctx.restore()
    }

    // 6. Center Hub with High-Contrast Finish
    ctx.save()
    const hubRadius = Math.max(46, Math.min(62, radius * 0.22))

    // Hub shadow
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 3
    ctx.fill()

    // Hub outer contrast border
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle =
      hoverCenter && !isSpinning ? '#2563eb' : darkMode ? '#60a5fa' : '#1e293b'
    ctx.lineWidth = 4
    ctx.stroke()

    // Hub inner circle face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 4, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? hoverCenter && !isSpinning
        ? '#1e3a8a'
        : '#0f172a'
      : hoverCenter && !isSpinning
      ? '#eff6ff'
      : '#ffffff'
    ctx.fill()

    // Center button text with maximum contrast
    ctx.fillStyle = hoverCenter && !isSpinning ? '#1d4ed8' : darkMode ? '#ffffff' : '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isSpinning) {
      ctx.font = `900 ${Math.max(12, Math.floor(hubRadius * 0.28))}px system-ui, sans-serif`
      ctx.fillText('PUTAR...', cx, cy)
    } else {
      ctx.font = `900 ${Math.max(13, Math.floor(hubRadius * 0.32))}px system-ui, sans-serif`
      ctx.fillText('PUTAR', cx, cy - (hubRadius > 50 ? 6 : 0))
      if (hubRadius > 50) {
        ctx.font = 'bold 10px system-ui, sans-serif'
        ctx.fillStyle = darkMode ? '#94a3b8' : '#475569'
        ctx.fillText('KLIK SAYA', cx, cy + 12)
      }
    }
    ctx.restore()

    // 7. Right-side Pointer / Flapper (High Contrast Crimson Red with White Rim)
    const pointerX = cx + radius + 10
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    // Deep shadow for pointer
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = 2

    // Triangular flapper pointing left
    ctx.beginPath()
    ctx.moveTo(-30, 0)
    ctx.lineTo(8, -13)
    ctx.lineTo(14, 0)
    ctx.lineTo(8, 13)
    ctx.closePath()

    // High contrast gradient
    const ptrGrad = ctx.createLinearGradient(-30, 0, 14, 0)
    ptrGrad.addColorStop(0, '#dc2626') // Vivid Red
    ptrGrad.addColorStop(1, '#991b1b') // Deep Crimson
    ctx.fillStyle = ptrGrad
    ctx.fill()

    // 2.5px pure white border for extreme contrast against any wedge
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Pivot pin (Gold/Metallic)
    ctx.beginPath()
    ctx.arc(7, 0, 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = '#fbbf24'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
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

  // Check pegs & flapper physics on each frame
  const checkTickAndFlapper = useCallback(
    (currentRot: number, angularVelocity: number) => {
      if (items.length === 0) return
      const currentSlice = getSliceUnderPointer(currentRot, items.length)

      if (lastSliceIndexRef.current !== -1 && currentSlice !== lastSliceIndexRef.current) {
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

  // Spin trigger
  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    onSpinStart()

    const total = items.length
    const winningIndex = Math.floor(Math.random() * total)
    const sliceAngle = (2 * Math.PI) / total

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

  useImperativeHandle(
    ref,
    () => ({
      spin,
    }),
    [spin]
  )

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
    const hubRadius = Math.max(46, Math.min(62, (rect.width / 2 - 24) * 0.22))

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

      {/* Live Pointer Indicator HUD with High-Contrast Styling */}
      {items.length > 0 && highlightedName && (
        <div
          className={`mt-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm transition-all flex items-center gap-2 max-w-[85%] truncate ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/40'
              : 'bg-white border-slate-300 text-slate-900 shadow-slate-200'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0 ring-2 ring-red-400/30" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">
            Menunjuk:
          </span>
          <span className="font-extrabold text-blue-700 dark:text-blue-400 truncate">
            {highlightedName}
          </span>
        </div>
      )}
    </div>
  )
})
