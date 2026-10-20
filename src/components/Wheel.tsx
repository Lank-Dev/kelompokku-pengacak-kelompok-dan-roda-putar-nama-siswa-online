import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getSliceTextStyles } from '../utils/color'

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

/**
 * Dynamically computes optimal font size and fit for a slice without clipping,
 * overlapping, or premature ellipses truncation.
 */
function fitSliceText(
  ctx: CanvasRenderingContext2D,
  text: string,
  initialFontSize: number,
  maxRadialWidth: number,
  maxArcHeight: number
): { text: string; fontSize: number } {
  let size = Math.min(initialFontSize, Math.max(7.5, maxArcHeight * 0.85))
  ctx.font = `bold ${size}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

  // Progressively step down font size until it fits comfortably in the radial length
  while (size > 7.5 && ctx.measureText(text).width > maxRadialWidth) {
    size -= 0.5
    ctx.font = `bold ${size}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  }

  // Only if text is excessively long even at 7.5px, gracefully truncate
  if (ctx.measureText(text).width > maxRadialWidth) {
    let str = text
    while (str.length > 3 && ctx.measureText(str + '…').width > maxRadialWidth) {
      str = str.slice(0, -1)
    }
    return { text: str + '…', fontSize: size }
  }

  return { text, fontSize: size }
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

  // Calculate current slice under pointer (at 3 o'clock / angle 0)
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
    // Generous padding so rim, shadow, and right flapper never get clipped
    const radius = Math.min(cx, cy) - 34

    ctx.clearRect(0, 0, width, height)

    if (items.length === 0) {
      // Empty state
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#1e293b' : '#f8fafc'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = darkMode ? '#475569' : '#cbd5e1'
      ctx.stroke()

      ctx.fillStyle = darkMode ? '#f1f5f9' : '#334155'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Please add names to spin', cx, cy)
      return
    }

    const total = items.length
    const sliceAngle = (2 * Math.PI) / total
    const rot = rotationRef.current
    const hubRadius = Math.max(42, Math.min(58, radius * 0.22))

    // 1. Outer drop shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.14)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 4
    ctx.fill()
    ctx.restore()

    // 2. Outer rim border
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI)
    ctx.lineWidth = 5
    ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0'
    ctx.stroke()
    ctx.restore()

    // 3. Slices Divider Stroke Configuration
    let dividerWidth = 1.5
    let showDivider = true
    if (total > 150) {
      showDivider = false
    } else if (total > 60) {
      dividerWidth = 0.5
    } else if (total > 30) {
      dividerWidth = 1
    }

    // Available radial length for text: from just outside hub to just inside rim
    const innerTextR = hubRadius + 10
    const outerTextR = radius - 14
    const availableRadialLength = Math.max(40, outerTextR - innerTextR)

    // Base initial font size depending on number of items
    let initialFontSize = 18
    if (total <= 2) initialFontSize = 20
    else if (total <= 6) initialFontSize = 16
    else if (total <= 12) initialFontSize = 14
    else if (total <= 24) initialFontSize = 12
    else if (total <= 40) initialFontSize = 10.5
    else if (total <= 70) initialFontSize = 9.5
    else initialFontSize = 8

    // 4. Draw Slices & Radial Text
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.stroke()
      }
      ctx.restore()

      // Radial Text Calculation
      const midAngle = startAngle + sliceAngle / 2
      // Arc height at the center of the text region
      const textCenterR = innerTextR + availableRadialLength * 0.5
      const arcHeightAtTextCenter = textCenterR * sliceAngle

      if (arcHeightAtTextCenter >= 6 || total <= 60) {
        const text = items[i]
        const { text: fittedText, fontSize } = fitSliceText(
          ctx,
          text,
          initialFontSize,
          availableRadialLength,
          arcHeightAtTextCenter
        )

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(midAngle)

        const { textColor, strokeColor } = getSliceTextStyles(color)
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'right'
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

        // Pass 1: Crisp Outline stroke for 100% legibility against ANY slice color
        if (fontSize >= 8.5) {
          ctx.lineWidth = Math.min(2.5, Math.max(1.2, fontSize * 0.2))
          ctx.strokeStyle = strokeColor
          ctx.lineJoin = 'round'
          ctx.miterLimit = 2
          ctx.strokeText(fittedText, outerTextR, 0)
        }

        // Pass 2: Foreground Text
        ctx.fillStyle = textColor
        ctx.fillText(fittedText, outerTextR, 0)
        ctx.restore()
      }
    }

    // 5. Perimeter Pegs (Rivets for mechanical tactile feel)
    const pegCount = Math.min(Math.max(total, 12), 36)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 1)
      const py = cy + Math.sin(pAngle) * (radius + 1)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#f8fafc' : '#1e293b'
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 2
      ctx.fill()
      ctx.restore()
    }

    // 6. Center Hub with High-Contrast Finish
    ctx.save()
    // Hub shadow
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 3
    ctx.fill()

    // Hub outer border
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = hoverCenter && !isSpinning ? '#2563eb' : darkMode ? '#60a5fa' : '#334155'
    ctx.lineWidth = 3.5
    ctx.stroke()

    // Hub face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? hoverCenter && !isSpinning
        ? '#1e3a8a'
        : '#1e293b'
      : hoverCenter && !isSpinning
      ? '#eff6ff'
      : '#ffffff'
    ctx.fill()

    // Center button text
    ctx.fillStyle = hoverCenter && !isSpinning ? '#2563eb' : darkMode ? '#ffffff' : '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isSpinning) {
      ctx.font = `800 ${Math.max(12, Math.floor(hubRadius * 0.28))}px system-ui, sans-serif`
      ctx.fillText('SPINNING', cx, cy)
    } else {
      ctx.font = `800 ${Math.max(13, Math.floor(hubRadius * 0.32))}px system-ui, sans-serif`
      ctx.fillText('SPIN', cx, cy - (hubRadius > 46 ? 6 : 0))
      if (hubRadius > 46) {
        ctx.font = 'bold 9px system-ui, sans-serif'
        ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
        ctx.fillText('CLICK TO SPIN', cx, cy + 11)
      }
    }
    ctx.restore()

    // 7. Right-side Pointer / Flapper (At 3 o'clock pointing left)
    const pointerX = cx + radius + 8
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = 2

    // Triangular flapper pointing into the wheel
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(8, -12)
    ctx.lineTo(12, 0)
    ctx.lineTo(8, 12)
    ctx.closePath()

    // Pointer gradient
    const ptrGrad = ctx.createLinearGradient(-28, 0, 12, 0)
    ptrGrad.addColorStop(0, '#ef4444')
    ptrGrad.addColorStop(1, '#b91c1c')
    ctx.fillStyle = ptrGrad
    ctx.fill()

    // White outline
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Pivot pin
    ctx.beginPath()
    ctx.arc(6, 0, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#f59e0b'
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

      const clientW = container.clientWidth || 360
      const clientH = container.clientHeight > 100 ? container.clientHeight : clientW
      const size = Math.max(280, Math.min(clientW, clientH, 540))
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
        flapperDeflectionRef.current = -0.28 * Math.min(velocityMultiplier, 1.2)
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

      // Quintic ease-out for super smooth realistic deceleration
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
    const hubRadius = Math.max(42, Math.min(58, (rect.width / 2 - 24) * 0.22))

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
      className="relative flex flex-col items-center justify-center w-full max-w-[500px] aspect-square p-2 mx-auto"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCenter(false)}
        className="cursor-pointer transition-transform duration-150 active:scale-[0.99] touch-manipulation select-none"
        title="Click to spin wheel (or press Spacebar)"
      />

      {/* Live Pointer Indicator HUD */}
      {items.length > 0 && highlightedName && (
        <div
          className={`mt-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border shadow-xs transition-all flex items-center gap-2 max-w-[85%] truncate ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 ring-2 ring-red-400/30" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            Pointing at:
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400 truncate">
            {highlightedName}
          </span>
        </div>
      )}
    </div>
  )
})
