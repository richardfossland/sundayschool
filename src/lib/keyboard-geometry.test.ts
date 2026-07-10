import { describe, it, expect } from 'vitest'
import { keyboardLayout, padToC } from './keyboard-geometry'

describe('keyboardLayout — C4..C5', () => {
  const { keys, totalWidth } = keyboardLayout(60, 72, 34)

  it('has 8 white keys and 5 black keys', () => {
    expect(keys.filter((k) => !k.isBlack)).toHaveLength(8)
    expect(keys.filter((k) => k.isBlack)).toHaveLength(5)
  })

  it('white keys span the full width', () => {
    expect(totalWidth).toBe(8 * 34)
  })

  it('x positions are strictly monotonic left→right', () => {
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i].x).toBeGreaterThan(keys[i - 1].x)
    }
  })

  it('black keys are ~60% of a white key and sit between whites', () => {
    const firstBlack = keys.find((k) => k.isBlack)!
    expect(firstBlack.midi).toBe(61)
    expect(firstBlack.w).toBeCloseTo(34 * 0.6)
    // centred on the boundary at x = 34
    expect(firstBlack.x + firstBlack.w / 2).toBeCloseTo(34)
  })

  it('does not emit a black key past the top of the range', () => {
    expect(keys.some((k) => k.midi === 73)).toBe(false)
  })
})

describe('padToC', () => {
  it('widens outward to whole C-to-C octaves', () => {
    expect(padToC(62, 67)).toEqual([60, 78])
  })
})
