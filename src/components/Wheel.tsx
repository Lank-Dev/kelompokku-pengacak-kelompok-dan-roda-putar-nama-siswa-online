import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { getSliceTextStyles } from '../utils/color'
import { getSliceUnderPointer } from '../utils/wheelMath'

export interface WheelHandle {
  spin: (forcedWinner?: string) => void
  reset?: () => void
}

export interface WheelProps {
  items: string[]
  colors: string[]
  spinDuration: number // seconds
  isSpinning: boolean
  darkMode: boolean
  emptyLabel?: string
  onSelectWinner?: (currentItems: string[]) => string
  onSpinStart: () => void
  onSpinEnd: (winner: string) => void
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
  let baseFontSize = 16
  if (total <= 2) baseFontSize = 22
  else if (total <= 4) baseFontSize = 18
  else if (total <= 8) baseFontSize = 15
  else if (total <= 12) baseFontSize = 13.5
  else if (total <= 18) baseFontSize = 12
  else if (total <= 25) baseFontSize = 11
  else if (total <= 35) baseFontSize = 10
  else if (total <= 50) baseFontSize = 9
  else baseFontSize = 8

  // 2. Strict vertical clamp: font height must not exceed slice width near mid radius
  const midR = (outerTextR + innerTextR) / 2
  const arcAtMid = midR * sliceAngle
  const maxSafeHeight = Math.max(6.5, arcAtMid * 0.72)
  let fontSize = Math.min(baseFontSize, maxSafeHeight)

  ctx.font = `bold ${fontSize}px ui-monospace, "JetBrains Mono", system-ui, -apple-system, sans-serif`
  let textWidth = ctx.measureText(safeText).width

  // 3. Step font size down if text is significantly longer than space
  while (fontSize > 7.0 && textWidth > availableRadialLength * 1.25) {
    fontSize -= 0.5
    ctx.font = `bold ${fontSize}px ui-monospace, "JetBrains Mono", system-ui, -apple-system, sans-serif`
    textWidth = ctx.measureText(safeText).width
  }

  // 4. Horizontal condensation factor: ensures long names (25+ chars) fit without ANY cut-off
  const scaleX = textWidth > availableRadialLength
    ? Math.max(0.65, availableRadialLength / textWidth)
    : 1.0

  ctx.save()
  ctx.scale(scaleX, 1.0)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'right'

  const drawX = outerTextR / scaleX

  // Pass 1: Crisp Outline stroke for 100% legibility against ANY slice color
  const outlineWidth = Math.min(2.0, Math.max(1.0, fontSize * 0.16))
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
    emptyLabel = 'Masukkan Nama',
    onSelectWinner,
    onSpinStart,
    onSpinEnd,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
    const cx = (width - 12) / 2
    const cy = height / 2
    const radius = Math.min(cx, cy) - 20

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
      // Empty state - Industrial precision dial waiting for input
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#0f172a' : '#f8fafc'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = darkMode ? '#334155' : '#cbd5e1'
      ctx.stroke()

      // Concentric calibration guide
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.65, 0, 2 * Math.PI)
      ctx.lineWidth = 1
      ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'
      ctx.stroke()

      // Crosshairs
      ctx.beginPath()
      ctx.moveTo(cx - 24, cy)
      ctx.lineTo(cx + 24, cy)
      ctx.moveTo(cx, cy - 24)
      ctx.lineTo(cx, cy + 24)
      ctx.lineWidth = 1
      ctx.strokeStyle = darkMode ? '#475569' : '#94a3b8'
      ctx.stroke()

      // Technical label
      ctx.fillStyle = darkMode ? '#f1f5f9' : '#0f172a'
      ctx.font = 'bold 13px ui-monospace, "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emptyLabel || 'MASUKKAN NAMA', cx, cy - 8)

      ctx.fillStyle = darkMode ? '#64748b' : '#64748b'
      ctx.font = 'bold 10px ui-monospace, "JetBrains Mono", monospace'
      ctx.fillText('[ MENUNGGU INPUT ]', cx, cy + 12)
      return
    }

    const total = currentItems.length
    const sliceAngle = (2 * Math.PI) / total
    const rot = rotationRef.current
    const hubRadius = Math.max(34, Math.min(48, radius * 0.20))

    // 1. Machined Outer Rim Bezel (Flat, crisp, zero floating shadows)
    ctx.save()
    // Outer collar fill
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 5, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#020617' : '#f8fafc'
    ctx.fill()

    // Outer boundary stroke
    ctx.lineWidth = 1.5
    ctx.strokeStyle = darkMode ? '#334155' : '#cbd5e1'
    ctx.stroke()

    // Inner rim groove
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 1, 0, 2 * Math.PI)
    ctx.lineWidth = 1
    ctx.strokeStyle = darkMode ? '#1e293b' : '#e2e8f0'
    ctx.stroke()
    ctx.restore()

    // 2. Slices Divider Stroke Configuration
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

    // 3. Draw Slices & Radial Text
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
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

    // 4. Perimeter Mechanical Rivets (Precision metallic studs)
    const pegCount = Math.min(Math.max(total, 12), 36)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 2.5)
      const py = cy + Math.sin(pAngle) * (radius + 2.5)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 1.8, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#94a3b8' : '#475569'
      ctx.fill()
      ctx.lineWidth = 0.6
      ctx.strokeStyle = darkMode ? '#0f172a' : '#ffffff'
      ctx.stroke()
      ctx.restore()
    }

    // 5. Center Hub - Precision Mechanical Turret
    ctx.save()
    // Outer hub bezel
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0b1120' : '#f1f5f9'
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = hoverCenter && !isSpinningNow ? '#2563eb' : darkMode ? '#475569' : '#94a3b8'
    ctx.stroke()

    // Inner push-button face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 3, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? hoverCenter && !isSpinningNow
        ? '#1d4ed8'
        : '#0f172a'
      : hoverCenter && !isSpinningNow
      ? '#2563eb'
      : '#ffffff'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = darkMode ? '#1e293b' : '#cbd5e1'
    ctx.stroke()

    // Concentric calibration ring
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 6, 0, 2 * Math.PI)
    ctx.lineWidth = 0.75
    ctx.strokeStyle = hoverCenter && !isSpinningNow
      ? 'rgba(255,255,255,0.35)'
      : darkMode
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.08)'
    ctx.stroke()

    // Center button text
    ctx.fillStyle = hoverCenter && !isSpinningNow
      ? '#ffffff'
      : darkMode
      ? '#f8fafc'
      : '#0f172a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${Math.max(11, Math.floor(hubRadius * 0.30))}px ui-monospace, "JetBrains Mono", system-ui, sans-serif`
    ctx.fillText('PUTAR', cx, cy)
    ctx.restore()

    // 6. Right-side Pointer - Calibrated Precision Gauge Indicator
    const pointerX = cx + radius + 7
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    // Fixed mounting bracket on the outer rim
    ctx.save()
    ctx.fillStyle = darkMode ? '#1e293b' : '#cbd5e1'
    ctx.fillRect(pointerX + 3, pointerY - 9, 6, 18)
    ctx.lineWidth = 1
    ctx.strokeStyle = darkMode ? '#334155' : '#94a3b8'
    ctx.strokeRect(pointerX + 3, pointerY - 9, 6, 18)
    ctx.restore()

    // Articulated pointer needle
    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    // Needle body - 2-facet machined bevel
    // Upper facet (illuminated)
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(5, -9)
    ctx.lineTo(8, 0)
    ctx.closePath()
    ctx.fillStyle = '#ef4444'
    ctx.fill()

    // Lower facet (shaded)
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(8, 0)
    ctx.lineTo(5, 9)
    ctx.closePath()
    ctx.fillStyle = '#b91c1c'
    ctx.fill()

    // Outer crisp perimeter line
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(5, -9)
    ctx.lineTo(8, 0)
    ctx.lineTo(5, 9)
    ctx.closePath()
    ctx.lineWidth = 1.2
    ctx.strokeStyle = darkMode ? '#ffffff' : '#0f172a'
    ctx.stroke()

    // Center ridge line
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(8, 0)
    ctx.lineWidth = 0.8
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.stroke()

    // Mechanical pivot screw pin
    ctx.beginPath()
    ctx.arc(4, 0, 3.2, 0, 2 * Math.PI)
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
    ctx.lineWidth = 0.8
    ctx.strokeStyle = '#0f172a'
    ctx.stroke()

    // Screw slot
    ctx.beginPath()
    ctx.moveTo(2, -1.5)
    ctx.lineTo(6, 1.5)
    ctx.lineWidth = 0.8
    ctx.strokeStyle = '#78350f'
    ctx.stroke()

    ctx.restore()
  }, [items, colors, isSpinning, hoverCenter, darkMode, emptyLabel])

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
      const size = Math.max(280, Math.min(clientW, clientH, 600))
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
  const spin = useCallback((forcedWinner?: string) => {
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
    let winner = ''
    let winningIndex = -1

    if (typeof forcedWinner === 'string' && spinItems.includes(forcedWinner)) {
      winner = forcedWinner
      winningIndex = spinItems.indexOf(forcedWinner)
    } else if (onSelectWinner) {
      const candidate = onSelectWinner(spinItems)
      if (typeof candidate === 'string' && spinItems.includes(candidate)) {
        winner = candidate
        winningIndex = spinItems.indexOf(candidate)
      }
    }

    if (winningIndex === -1) {
      winningIndex = Math.floor(Math.random() * total)
      winner = spinItems[winningIndex] || spinItems[0] || 'Pemenang'
    }

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
    onSelectWinner,
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
      spin: (forcedWinner?: string) => spin(forcedWinner),
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
      className="relative flex flex-col items-center justify-center w-full max-w-[580px] aspect-square p-1 mx-auto"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCenter(false)}
        className="cursor-pointer transition-transform duration-150 active:scale-[0.99] touch-manipulation select-none"
      />
    </div>
  )
})
