import { describe, it, expect } from 'vitest'
import { getSliceUnderPointer } from '../src/utils/wheelMath'

describe('Wheel Engine & Pointer Invariants', () => {
  it('handles safety edge cases without throwing or returning NaN', () => {
    expect(getSliceUnderPointer(0, 0)).toBe(0)
    expect(getSliceUnderPointer(NaN, 10)).toBe(0)
    expect(getSliceUnderPointer(Infinity, 10)).toBe(0)
    expect(getSliceUnderPointer(-Infinity, 10)).toBe(0)
    expect(getSliceUnderPointer(100, -5)).toBe(0)
    expect(getSliceUnderPointer(100, 0)).toBe(0)
  })

  it('correctly maps 0 rotation to index 0 for 4 items', () => {
    // 4 items: each slice is PI / 2 radians (90 deg)
    // Slices: [0, PI/2), [PI/2, PI), [PI, 3PI/2), [3PI/2, 2PI)
    // At rot = 0, normalized angle is 0, so slice index is 0
    expect(getSliceUnderPointer(0, 4)).toBe(0)
  })

  it('guarantees 100% mathematical landing accuracy across 10,000 randomized simulations', () => {
    for (let sim = 0; sim < 10000; sim++) {
      const total = Math.floor(2 + Math.random() * 50)
      const winningIndex = Math.floor(Math.random() * total)
      const currentRot = (Math.random() - 0.5) * 2000
      const sliceAngle = (2 * Math.PI) / total

      // Safe offset inside slice (15% to 85%)
      const randomOffsetInSlice = (0.15 + Math.random() * 0.70) * sliceAngle
      const targetNormalizedAngle = winningIndex * sliceAngle + randomOffsetInSlice

      const twoPi = 2 * Math.PI
      const desiredMod = ((twoPi - (targetNormalizedAngle % twoPi)) + twoPi) % twoPi
      const currentMod = ((currentRot % twoPi) + twoPi) % twoPi

      let forwardDelta = desiredMod - currentMod
      if (forwardDelta < 0) {
        forwardDelta += twoPi
      }

      const fullSpins = (5 + Math.floor(Math.random() * 4)) * twoPi
      const targetRot = currentRot + fullSpins + forwardDelta

      const landedSlice = getSliceUnderPointer(targetRot, total)
      expect(landedSlice).toBe(winningIndex)
    }
  })
})
