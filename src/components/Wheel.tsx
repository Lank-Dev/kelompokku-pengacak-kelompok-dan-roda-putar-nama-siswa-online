import React, { useEffect, useRef, useState, useCallback } from 'react'
import { soundManager } from '../utils/audio'
import { getContrastTextColor, truncateText } from '../utils/color'

interface WheelProps {
  items: string[]
  colors: string[]
  spinDuration: number // seconds
  soundEnabled: boolean
  isSpinning: boolean
  darkMode: boolean
  onSpinStart: () => void
  onSpinEnd: (winner: string) => void
}

export const Wheel: React.FC<WheelProps> = ({
  items,
  colors,
  spinDuration,
  soundEnabled,
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

  // Update sound manager mute status
  useEffect(() => {
    soundManager.setMuted(!soundEnabled)
  }, [soundEnabled])

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

  // Draw wheel function
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

    // 1. Draw outer shadow / decorative rim (Wheel of Names style)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#0f172a' : '#ffffff'
    ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.15)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 6
    ctx.fill()
    ctx.restore()

    // Outer rim border
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI)
    ctx.lineWidth = 8
    ctx.strokeStyle = darkMode ? '#334155' : '#e2e8f0'
    ctx.stroke()
    ctx.restore()

    // 2. Draw Wedges
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

      // Clean white slice dividers
      ctx.lineWidth = total > 60 ? 1 : 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.stroke()
      ctx.restore()

      // 3. Draw text in slice (Radial, aligned from rim inward)
      const text = items[i]
      const midAngle = startAngle + sliceAngle / 2

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)

      const contrastColor = getContrastTextColor(color)
      ctx.fillStyle = contrastColor
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'right'

      // Dynamic font size based on slice count and wheel size
      const maxTextWidth = radius - 75
      let fontSize = Math.min(
        22,
        Math.max(9, Math.floor(radius * 0.85 * Math.sin(sliceAngle / 2) * 1.35))
      )
      if (total <= 6) fontSize = 24
      if (total > 50) fontSize = 11
      if (total > 90) fontSize = 9

      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
      const fittedText = truncateText(ctx, text, maxTextWidth)

      // Radial text position with text shadow for crisp legibility
      if (contrastColor === '#ffffff') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = 3
      }
      ctx.fillText(fittedText, radius - 18, 0)
      ctx.restore()
    }

    // 4. Perimeter Pegs / Rivets
    const pegCount = Math.min(Math.max(total, 12), 48)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 2)
      const py = cy + Math.sin(pAngle) * (radius + 2)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, 2 * Math.PI)
      ctx.fillStyle = darkMode ? '#e2e8f0' : '#475569'
      ctx.fill()
      ctx.restore()
    }

    // 5. Center Hub (Wheel of Names Crisp White Center with click indicator)
    ctx.save()
    const hubRadius = Math.max(46, radius * 0.22)

    // Hub drop shadow
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode ? '#1e293b' : '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 3
    ctx.fill()

    // Hub border ring
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = hoverCenter && !isSpinning ? '#3b82f6' : (darkMode ? '#334155' : '#cbd5e1')
    ctx.lineWidth = 4
    ctx.stroke()

    // Hub inner circle face
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 4, 0, 2 * Math.PI)
    ctx.fillStyle = darkMode
      ? (hoverCenter && !isSpinning ? '#1e3a8a' : '#0f172a')
      : (hoverCenter && !isSpinning ? '#eff6ff' : '#ffffff')
    ctx.fill()

    // Center button text or spinner icon
    ctx.fillStyle = hoverCenter && !isSpinning ? '#2563eb' : (darkMode ? '#f8fafc' : '#1e293b')
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (isSpinning) {
      ctx.font = `900 ${Math.max(12, Math.floor(hubRadius * 0.28))}px system-ui, sans-serif`
      ctx.fillText('PUTAR...', cx, cy)
    } else {
      ctx.font = `900 ${Math.max(13, Math.floor(hubRadius * 0.32))}px system-ui, sans-serif`
      ctx.fillText('PUTAR', cx, cy - (hubRadius > 50 ? 6 : 0))
      if (hubRadius > 50) {
        ctx.font = `600 10px system-ui, sans-serif`
        ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b'
        ctx.fillText('KLIK SAYA', cx, cy + 12)
      }
    }
    ctx.restore()

    // 6. Right-side Pointer / Ticker Flapper (at 3 o'clock: cx + radius, cy)
    const pointerX = cx + radius + 10
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    // Pointer shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = 2

    // Pointer triangular shape pointing left into wheel
    ctx.beginPath()
    ctx.moveTo(-30, 0) // Tip inside the wheel
    ctx.lineTo(8, -13)
    ctx.lineTo(14, 0)
    ctx.lineTo(8, 13)
    ctx.closePath()

    // Wheel of Names uses a sleek dark flapper with a pin
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
        // A peg passed!
        const velocityMultiplier = Math.min(angularVelocity / 0.05, 3.0)
        soundManager.playTick(velocityMultiplier)

        // Deflect ticker flapper angle (in radians)
        flapperDeflectionRef.current = -0.32 * Math.min(velocityMultiplier, 1.2)
      }
      lastSliceIndexRef.current = currentSlice

      // Spring-back damping of flapper deflection
      flapperDeflectionRef.current *= 0.82
      if (Math.abs(flapperDeflectionRef.current) < 0.01) {
        flapperDeflectionRef.current = 0
      }
    },
    [items.length, getSliceUnderPointer]
  )

  // Spin trigger
  const spin = useCallback(() => {
    if (isSpinning || items.length === 0) return

    onSpinStart()
    soundManager.playSpinStart()

    // Decide winning index uniformly at random
    const total = items.length
    const winningIndex = Math.floor(Math.random() * total)
    const sliceAngle = (2 * Math.PI) / total

    // In our coordinate system, pointer is at 0 rad.
    // Winning slice index k covers normalized angle: [k * sliceAngle, (k + 1) * sliceAngle).
    // Target normalized angle lands safely inside the slice (with safe 15% margins from borders).
    const randomOffsetInSlice = (0.15 + Math.random() * 0.7) * sliceAngle
    const targetNormalizedAngle = winningIndex * sliceAngle + randomOffsetInSlice

    // Target rotation R satisfies: ((-R % 2PI) + 2PI) % 2PI = targetNormalizedAngle
    const fullSpins = 6 + Math.floor(Math.random() * 4)
    const currentRot = rotationRef.current
    const targetRot =
      currentRot + fullSpins * (2 * Math.PI) + ((2 * Math.PI - (targetNormalizedAngle % (2 * Math.PI))) % (2 * Math.PI))

    const startRot = currentRot
    const totalDelta = targetRot - startRot
    const startTime = performance.now()
    const durationMs = spinDuration * 1000

    let previousRot = startRot

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Quintic ease out for a dramatic, suspenseful crawl at the end
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
        soundManager.playWinnerFanfare()
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

  // Handle click on canvas: if clicked on wheel or center, spin!
  const handleCanvasClick = () => {
    if (isSpinning || items.length === 0) return
    spin()
  }

  // Handle mouse move to toggle cursor pointer on center button
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dist = Math.hypot(x - cx, y - cy)
    const hubRadius = Math.max(46, (rect.width / 2 - 24) * 0.22)

    setHoverCenter(dist <= hubRadius)
  }

  // Cleanup anim frame on unmount
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
      className="relative flex items-center justify-center w-full h-full min-h-[360px] p-2"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCenter(false)}
        className="cursor-pointer transition-transform duration-200 active:scale-[0.99] touch-manipulation select-none"
        title="Klik untuk memutar roda! (Atau tekan Spasi)"
      />
    </div>
  )
}
