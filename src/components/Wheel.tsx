import React, { useEffect, useRef, useState, useCallback } from 'react'
import { soundManager } from '../utils/audio'
import { getContrastTextColor, truncateText } from '../utils/color'

interface WheelProps {
  items: string[]
  colors: string[]
  spinDuration: number // seconds
  soundEnabled: boolean
  isSpinning: boolean
  onSpinStart: () => void
  onSpinEnd: (winner: string) => void
}

export const Wheel: React.FC<WheelProps> = ({
  items,
  colors,
  spinDuration,
  soundEnabled,
  isSpinning,
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
    const radius = Math.min(cx, cy) - 28

    ctx.clearRect(0, 0, width, height)

    if (items.length === 0) {
      // Empty state
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.fillStyle = '#1e293b'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = '#475569'
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '600 18px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Tambahkan nama terlebih dahulu', cx, cy)
      return
    }

    const total = items.length
    const sliceAngle = (2 * Math.PI) / total
    const rot = rotationRef.current

    // 1. Draw outer shadow / decorative rim
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 10, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f172a'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8
    ctx.fill()
    ctx.restore()

    // Outer metallic bezel
    ctx.save()
    const bezelGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
    bezelGrad.addColorStop(0, '#f8fafc')
    bezelGrad.addColorStop(0.5, '#64748b')
    bezelGrad.addColorStop(1, '#1e293b')
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI)
    ctx.strokeStyle = bezelGrad
    ctx.lineWidth = 10
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

      // Divider line
      ctx.lineWidth = total > 50 ? 1 : 2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.stroke()
      ctx.restore()

      // 3. Draw text in slice
      const text = items[i]
      const midAngle = startAngle + sliceAngle / 2

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(midAngle)

      const contrastColor = getContrastTextColor(color)
      ctx.fillStyle = contrastColor
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'right'

      // Dynamic font size based on slice count and radius
      const maxTextWidth = radius - 80
      let fontSize = Math.min(
        22,
        Math.max(10, Math.floor((radius * 0.9 * Math.sin(sliceAngle / 2)) * 1.3))
      )
      if (total <= 6) fontSize = 24
      if (total > 60) fontSize = 10
      if (total > 100) fontSize = 8

      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
      const fittedText = truncateText(ctx, text, maxTextWidth)

      // Radial text position
      ctx.fillText(fittedText, radius - 20, 0)
      ctx.restore()
    }

    // 4. Perimeter Pegs (Rivets for tactile mechanical feel)
    const pegCount = Math.min(Math.max(total, 12), 48)
    const pegAngleStep = (2 * Math.PI) / pegCount
    for (let p = 0; p < pegCount; p++) {
      const pAngle = rot + p * pegAngleStep
      const px = cx + Math.cos(pAngle) * (radius + 2)
      const py = cy + Math.sin(pAngle) * (radius + 2)

      ctx.save()
      ctx.beginPath()
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI)
      ctx.fillStyle = '#f8fafc'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 3
      ctx.fill()
      ctx.restore()
    }

    // 5. Center Hub (Putar Button)
    ctx.save()
    const hubRadius = Math.max(48, radius * 0.22)

    // Hub drop shadow
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f172a'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 4
    ctx.fill()

    // Hub rim
    const hubGrad = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius)
    hubGrad.addColorStop(0, '#ffffff')
    hubGrad.addColorStop(0.5, '#cbd5e1')
    hubGrad.addColorStop(1, '#475569')
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = hubGrad
    ctx.lineWidth = 5
    ctx.stroke()

    // Center button face
    const innerGrad = ctx.createRadialGradient(cx, cy - 8, 2, cx, cy, hubRadius - 4)
    if (hoverCenter && !isSpinning) {
      innerGrad.addColorStop(0, '#6366f1')
      innerGrad.addColorStop(1, '#4338ca')
    } else {
      innerGrad.addColorStop(0, '#3b82f6')
      innerGrad.addColorStop(0.8, '#1d4ed8')
      innerGrad.addColorStop(1, '#1e40af')
    }
    ctx.beginPath()
    ctx.arc(cx, cy, hubRadius - 4, 0, 2 * Math.PI)
    ctx.fillStyle = innerGrad
    ctx.fill()

    // Button label
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 4
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.max(13, Math.floor(hubRadius * 0.34))}px system-ui, sans-serif`
    ctx.fillText(isSpinning ? 'MEMUTAR' : 'PUTAR', cx, cy - 1)
    ctx.restore()

    // 6. Right-side Pointer / Ticker Flapper
    // Located at 3 o'clock: (cx + radius, cy)
    const pointerX = cx + radius + 12
    const pointerY = cy
    const flapperDeflection = flapperDeflectionRef.current

    ctx.save()
    ctx.translate(pointerX, pointerY)
    ctx.rotate(flapperDeflection)

    // Pointer shadow
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = 2

    // Pointer triangular shape pointing left into wheel
    ctx.beginPath()
    ctx.moveTo(-32, 0) // Tip inside the wheel
    ctx.lineTo(8, -14)
    ctx.lineTo(16, 0)
    ctx.lineTo(8, 14)
    ctx.closePath()

    const ptrGrad = ctx.createLinearGradient(-32, 0, 16, 0)
    ptrGrad.addColorStop(0, '#ef4444') // Bright red tip
    ptrGrad.addColorStop(0.5, '#dc2626')
    ptrGrad.addColorStop(1, '#991b1b')
    ctx.fillStyle = ptrGrad
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    // Pivot pin
    ctx.beginPath()
    ctx.arc(8, 0, 4, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()
    ctx.restore()
  }, [items, colors, isSpinning, hoverCenter])

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
        flapperDeflectionRef.current = -0.35 * Math.min(velocityMultiplier, 1.2)
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
    // Target normalized angle should land randomly inside the slice (with safe 15% margins from borders).
    const randomOffsetInSlice = (0.15 + Math.random() * 0.7) * sliceAngle
    const targetNormalizedAngle = winningIndex * sliceAngle + randomOffsetInSlice

    // Target rotation R satisfies: ((-R % 2PI) + 2PI) % 2PI = targetNormalizedAngle
    // So -R = targetNormalizedAngle + 2 * PI * k
    // Let's add 6 to 10 full spins
    const fullSpins = 6 + Math.floor(Math.random() * 4)
    const currentRot = rotationRef.current
    const targetRot = currentRot + fullSpins * (2 * Math.PI) + (2 * Math.PI - (targetNormalizedAngle % (2 * Math.PI)))

    const startRot = currentRot
    const totalDelta = targetRot - startRot
    const startTime = performance.now()
    const durationMs = spinDuration * 1000

    let previousRot = startRot

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Quintic ease out for a dramatic, suspenseful crawl at the end
      // 1 - (1 - progress)^5
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

  // Handle click on canvas: if clicked on center button or anywhere on wheel, spin!
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
    const hubRadius = Math.max(48, (rect.width / 2 - 28) * 0.22)

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
      className="relative flex items-center justify-center w-full h-full min-h-[380px] p-2"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCenter(false)}
        className="cursor-pointer transition-transform duration-200 active:scale-[0.99] touch-manipulation drop-shadow-2xl"
        title="Klik untuk memutar roda! (Atau tekan Spasi)"
      />
    </div>
  )
}
