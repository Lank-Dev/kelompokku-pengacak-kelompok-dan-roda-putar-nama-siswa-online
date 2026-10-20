import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getSliceTextStyles } from '../utils/color'

export interface WheelHandle {
  spin: () => void
  reset?: () => void
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
 * Bulletproof pointer slice calculation.
 * Mathematically guaranteed to return a valid slice index in [0, total - 1].
 * Zero NaN, zero undefined, zero division-by-zero crashes.
 */
function getSliceUnderPointer(rot: number, total: number): number {
  if (!total || total <= 0 || !Number.isFinite(total)) return 0
  if (!Number.isFinite(rot)) return 0

  const twoPi = 2 * Math.PI
  const sliceAngle = twoPi / total
  const normalizedAngle = ((-rot % twoPi) + twoPi) % twoPi
  const index = Math.floor(normalizedAngle / sliceAngle)

  if (!Number.isFinite(index) || isNaN(index)) return 0
  return ((index % total) + total) % total
}

/**
 * Auto-fits slice text with zero truncation, zero overlapping, and pristine legibility.
 * Mathematically adapts to 35+ items cleanly.
 */
function renderSliceText(
  ctx: CanvasRenderingContext2D,
  text: string,
  total: number,
  availableRadialLength: number,
  outerTextR: number,
  innerTextR: number,
  sliceAngle: number,
  textColor: string,
  strokeColor: string
) {
  // Safe fallback for null or empty strings
  const safeText = text || ''

  // 1. Initial base font size suited for the number of items
  let initialFontSize = 16
  if (total <= 4) initialFontSize = 18
  else if (total <= 8) initialFontSize = 15
  else if (total <= 14) initialFontSize = 13
  else if (total <= 24) initialFontSize = 11
  else if (total <= 40) initialFontSize = 9.0
  else if (total <= 60) initialFontSize = 8.0
  else initialFontSize = 7.0

  // 2. Strict vertical clamp: font height must not exceed slice width near innerTextR
  const arcAtInnerSafe = (innerTextR + 6) * sliceAngle
  const maxSafeFontSize = Math.max(6.5, arcAtInnerSafe * 0.90)
  let fontSize = Math.min(initialFontSize, maxSafeFontSize)

  ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  let textWidth = ctx.measureText(safeText).width

  // 3. Step font size down if text is significantly longer than space
  while (fontSize > 7.0 && textWidth > availableRadialLength * 1.3) {
    fontSize -= 0.5
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    textWidth = ctx.measureText(safeText).width
  }

  // 4. Horizontal condensation factor: ensures long names (25+ chars) fit without ANY cut-off
  const scaleX = textWidth > availableRadialLength
    ? Math.max(0.68, availableRadialLength / textWidth)
    : 1.0

  ctx.save()
  ctx.scale(scaleX, 1.0)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'

  const drawX = outerTextR / scaleX

  // Pass 1: Crisp Outline stroke for 100% legibility against ANY slice color
  const outlineWidth = Math.min(2.0, Math.max(1.0, fontSize * 0.18))
  ctx.lineWidth = outlineWidth
  ctx.strokeStyle = strokeColor
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.strokeText(safeText, drawX, 0)

  // Pass 2: Foreground Text
  ctx.fillStyle = textColor
  ctx.fillText(safeText, drawX, 0)

  ctx.restore()
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
  const livePointerTextRef = useRef<HTMLSpanElement | null>(null)

  // Wheel animation & physics state
  const rotationRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const lastSliceIndexRef = useRef<number>(-1)
  const flapperDeflectionRef = useRef<number>(0)

  // Concurrency & snapshot locks: ensures bulletproof mid-spin stability
  const isSpinningInternalRef = useRef<boolean>(false)
  const spinningItemsRef = useRef<string[]>([])
  const spinningColorsRef = useRef<string[]>([])
  const targetWinnerRef = useRef<string>('')

  const [hoverCenter, setHoverCenter] = useState(false)
  const [highlightedName, setHighlightedName] = useState<string>('')

  // Sync highlighted slice name when items change or initially (only when wheel is idle)
  useEffect(() => {
    if (items.length > 0 && !isSpinningInternalRef.current) {
      const idx = getSliceUnderPointer(rotationRef.current, items.length)
      const name = items[idx] || ''
      setHighlightedName(name)
      if (livePointerTextRef.current) {
        livePointerTextRef.current.textContent = name
      }
    } else if (items.length === 0) {
      setHighlightedName('')
      if (livePointerTextRef.current) {
        livePointerTextRef.current.textContent = ''
      }
    }
  }, [items])

  // Draw wheel function with guaranteed high-contrast rendering and DPR transform stability
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    // Reset transform matrix to exact DPR scale to prevent scaling drift or accumulation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const width = canvas.width / dpr
    const height = canvas.height / dpr
    // Slightly offset center to balance the right-side pointer and achieve visual center symmetry
    const cx = (width - 10) / 2
    const cy = height / 2
    const radius = Math.min(cx, cy) - 28

    ctx.clearRect(0, 0, width, height)

    // Snapshot fallback if spinning, otherwise current props
    const isSpinningNow = isSpinningInternalRef.current || isSpinning
    const currentItems = isSpinningInternalRef.current && spinningItemsRef.current.length > 0
      ? spinningItemsRef.current
      : items
    const currentColors = isSpinningInternalRef.current && spinningColorsRef.current.length > 0
      ? spinningColorsRef.current
      : colors && colors.length > 0
      ? colors
      : ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

    if (currentItems.length === 0) {
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
      ctx.fillText('Tambahkan nama peserta', cx, cy)
      return
    }

    const total = currentItems.length
    const sliceAngle = (2 * Math.PI) / total
    const rot = rotationRef.current
    const hubRadius = Math.max(34, Math.min(48, radius * 0.20))

    // 1. Outer drop shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.12)'
    ctx.shadowBlur = 16
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
    if (total > 120) {
      showDivider = false
    } else if (total > 50) {
      dividerWidth = 0.5
    } else if (total > 25) {
      dividerWidth = 1.0
    }

    const innerTextR = hubRadius + 6
    const outerTextR = radius - 8
    const availableRadialLength = Math.max(40, outerTextR - innerTextR)

    // 4. Draw Slices & Radial Text
    for (let i = 0; i < total; i++) {
      const startAngle = rot + i * sliceAngle
      const endAngle = startAngle + sliceAngle
      const color = currentColors[i % currentColors.length]

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      if (showDivider) {
        ctx.lineWidth = dividerWidth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.stroke()
      }
      ctx.restore()

      // Radial Text Calculation
      const midAngle = startAngle + sliceAngle / 2
      const text = currentItems[i] || ''
      const { textColor, strokeColor } = getSliceTextStyles(color)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)

      renderSliceText(
        ctx,
        text,
        total,
        availableRadialLength,
        outerTextR,
        innerTextR,
        sliceAngle,
        textColor,
        strokeColor
      )

      ctx.restore()
    }

    // 5. Perimeter Pegs (Rivets for tactile mechanical feel)
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
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
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
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
    ctx.fill()

    // Hub outer border
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = hoverCenter && !isSpinningNow ? '#2563eb' : darkMode ? '#60a5fa' : '#334155'
    ctx.lineWidth = 3.5
    ctx.stroke()

    // Hub face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? hoverCenter && !isSpinningNow
        ? '#1e3a8a'
        : '#1e293b'
      : hoverCenter && !isSpinningNow
      ? '#eff6ff'
      : '#ffffff'
    ctx.fill()

    // Center button text
    ctx.fillStyle = hoverCenter && !isSpinningNow ? '#2563eb' : darkMode ? '#ffffff' : '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isSpinningNow) {
      ctx.font = `800 ${Math.max(11, Math.floor(hubRadius * 0.28))}px system-ui, sans-serif`
      ctx.fillText('SPINNING', cx, cy)
    } else {
      ctx.font = `800 ${Math.max(12, Math.floor(hubRadius * 0.32))}px system-ui, sans-serif`
      ctx.fillText('SPIN', cx, cy - (hubRadius > 40 ? 5 : 0))
      if (hubRadius > 40) {
        ctx.font = 'bold 8.5px system-ui, sans-serif'
        ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
        ctx.fillText('CLICK TO SPIN', cx, cy + 9)
      }
    }
    ctx.restore()

    // 7. Right-side Pointer / Flapper (At 3 o'clock pointing into the wheel)
    const pointerX = cx + radius + 7
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
    ctx.moveTo(-26, 0)
    ctx.lineTo(7, -11)
    ctx.lineTo(11, 0)
    ctx.lineTo(7, 11)
    ctx.closePath()

    // Pointer gradient
    const ptrGrad = ctx.createLinearGradient(-26, 0, 11, 0)
    ptrGrad.addColorStop(0, '#ef4444')
    ptrGrad.addColorStop(1, '#b91c1c')
    ctx.fillStyle = ptrGrad
    ctx.fill()

    // Crisp white outline
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

  // Stable reference to drawWheel so resize listeners do not rebind or wipe canvas
  const drawWheelRef = useRef(drawWheel)
  useEffect(() => {
    drawWheelRef.current = drawWheel
  }, [drawWheel])

  // Canvas resize handler (decoupled from drawWheel recreating to prevent canvas wiping)
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const clientW = container.clientWidth || 360
      const clientH = container.clientHeight > 100 ? container.clientHeight : clientW
      const size = Math.max(280, Math.min(clientW, clientH, 540))
      const dpr = window.devicePixelRatio || 1

      const targetW = size * dpr
      const targetH = size * dpr

      // Only reassign canvas size if actual dimensions changed, preventing canvas clearing
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
      }
      drawWheelRef.current()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initial draw & redraw when items or appearance change
  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  // Check pegs & flapper physics on each frame (updates DOM ref directly with ZERO React re-renders)
  const checkTickAndFlapper = useCallback(
    (currentRot: number, angularVelocity: number, activeItems: string[]) => {
      const total = activeItems.length
      if (total === 0) return

      const currentSlice = getSliceUnderPointer(currentRot, total)

      if (lastSliceIndexRef.current !== -1 && currentSlice !== lastSliceIndexRef.current) {
        const velocityMultiplier = Math.min(Math.abs(angularVelocity) / 0.05, 3.0)
        flapperDeflectionRef.current = -0.28 * Math.min(velocityMultiplier, 1.2)
        const name = activeItems[currentSlice] || ''
        if (livePointerTextRef.current) {
          livePointerTextRef.current.textContent = name
        }
      }
      lastSliceIndexRef.current = currentSlice

      // Spring-back damping of flapper deflection
      flapperDeflectionRef.current *= 0.82
      if (Math.abs(flapperDeflectionRef.current) < 0.01) {
        flapperDeflectionRef.current = 0
      }
    },
    []
  )

  // Spin trigger with atomic internal lock and snapshot isolation
  const spin = useCallback(() => {
    // 1. Strict lock: Never allow duplicate or overlapping spins
    if (isSpinningInternalRef.current || isSpinning || items.length === 0) {
      return
    }

    isSpinningInternalRef.current = true

    // 2. Snapshot current items and colors so mid-spin prop changes never mutate the active spin
    const spinItems = [...items]
    const spinColors = colors && colors.length > 0 ? [...colors] : ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
    const total = spinItems.length
    if (total === 0) {
      isSpinningInternalRef.current = false
      return
    }

    spinningItemsRef.current = spinItems
    spinningColorsRef.current = spinColors

    // 3. Predetermine the winning index and winner name
    const winningIndex = Math.floor(Math.random() * total)
    const winner = spinItems[winningIndex] || spinItems[0] || 'Pemenang'
    targetWinnerRef.current = winner

    // 4. Exact target angle calculation
    const sliceAngle = (2 * Math.PI) / total
    // Safe random offset inside slice (15% to 85% range)
    const randomOffsetInSlice = (0.15 + Math.random() * 0.70) * sliceAngle
    const targetNormalizedAngle = winningIndex * sliceAngle + randomOffsetInSlice

    const twoPi = 2 * Math.PI
    const desiredMod = ((twoPi - (targetNormalizedAngle % twoPi)) + twoPi) % twoPi
    const currentMod = ((rotationRef.current % twoPi) + twoPi) % twoPi

    let forwardDelta = desiredMod - currentMod
    if (forwardDelta < 0) {
      forwardDelta += twoPi
    }

    const fullSpins = (5 + Math.floor(Math.random() * 4)) * twoPi
    const startRot = rotationRef.current
    const targetRot = startRot + fullSpins + forwardDelta
    const totalDelta = targetRot - startRot

    const durationMs = Math.max(800, (spinDuration || 3) * 1000)
    const startTime = performance.now()
    let previousRot = startRot

    // Cancel any previous animation frame before starting
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    onSpinStart()

    const animate = (now: number) => {
      // Abort if lock was cleared externally (e.g. unmount or reset)
      if (!isSpinningInternalRef.current) {
        animFrameRef.current = null
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(Math.max(elapsed / durationMs, 0), 1)

      // Quintic ease-out for super smooth realistic deceleration
      const eased = 1 - Math.pow(1 - progress, 5)
      const currentAngle = startRot + totalDelta * eased
      rotationRef.current = currentAngle

      const frameVelocity = currentAngle - previousRot
      previousRot = currentAngle

      checkTickAndFlapper(currentAngle, frameVelocity, spinItems)
      drawWheelRef.current()

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        rotationRef.current = targetRot
        isSpinningInternalRef.current = false
        animFrameRef.current = null

        drawWheelRef.current()

        const finalWinner = targetWinnerRef.current || winner
        if (livePointerTextRef.current) {
          livePointerTextRef.current.textContent = finalWinner
        }
        setHighlightedName(finalWinner)

        try {
          onSpinEnd(finalWinner)
        } catch (err) {
          console.error('Error in onSpinEnd:', err)
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [
    isSpinning,
    items,
    colors,
    spinDuration,
    onSpinStart,
    onSpinEnd,
    checkTickAndFlapper,
  ])

  // Reset helper
  const reset = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    isSpinningInternalRef.current = false
    flapperDeflectionRef.current = 0
    drawWheelRef.current()
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      spin,
      reset,
    }),
    [spin, reset]
  )

  const handleCanvasClick = () => {
    if (isSpinningInternalRef.current || isSpinning || items.length === 0) return
    spin()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = (rect.width - 10) / 2
    const cy = rect.height / 2
    const dist = Math.hypot(x - cx, y - cy)
    const hubRadius = Math.max(34, Math.min(48, (rect.width / 2 - 28) * 0.20))

    setHoverCenter(dist <= hubRadius)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      isSpinningInternalRef.current = false
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
      {items.length > 0 && (
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
          <span
            ref={livePointerTextRef}
            className="font-bold text-blue-600 dark:text-blue-400 truncate"
          >
            {highlightedName}
          </span>
        </div>
      )}
    </div>
  )
})
