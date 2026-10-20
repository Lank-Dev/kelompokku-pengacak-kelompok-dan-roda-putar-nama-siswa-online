/**
 * Bulletproof pointer slice calculation.
 * Mathematically guaranteed to return a valid slice index in [0, total - 1].
 * Zero NaN, zero undefined, zero division-by-zero crashes.
 */
export function getSliceUnderPointer(rot: number, total: number): number {
  if (!total || total <= 0 || !Number.isFinite(total)) return 0
  if (!Number.isFinite(rot)) return 0

  const twoPi = 2 * Math.PI
  const sliceAngle = twoPi / total
  const normalizedAngle = ((-rot % twoPi) + twoPi) % twoPi
  const index = Math.floor(normalizedAngle / sliceAngle)

  if (!Number.isFinite(index) || isNaN(index)) return 0
  return ((index % total) + total) % total
}
