import { describe, it, expect } from 'vitest'
import { noteScreenY } from './falling-renderer'

// The renderer itself needs a canvas; the geometry it stands on is `noteScreenY`,
// which is pure and carries the correctness that matters: monotonic fall, the hit
// line landing exactly at the current beat, and off-screen culling behaviour.

describe('noteScreenY', () => {
  const currentBeat = 4
  const lookahead = 4
  const height = 240

  it('places a note at the hit line (bottom) when t == currentBeat', () => {
    expect(noteScreenY(currentBeat, currentBeat, lookahead, height)).toBe(height)
  })

  it('places a note one lookahead ahead at the very top (y = 0)', () => {
    expect(noteScreenY(currentBeat + lookahead, currentBeat, lookahead, height)).toBe(0)
  })

  it('is strictly monotonic — later notes are always higher up (smaller y)', () => {
    let prev = Infinity
    for (let t = currentBeat; t <= currentBeat + lookahead; t += 0.25) {
      const y = noteScreenY(t, currentBeat, lookahead, height)
      expect(y).toBeLessThan(prev)
      prev = y
    }
  })

  it('culls future notes above the view (y < 0 beyond the lookahead window)', () => {
    const y = noteScreenY(currentBeat + 2 * lookahead, currentBeat, lookahead, height)
    expect(y).toBeLessThan(0)
  })

  it('culls already-played notes below the hit line (y > height for t < currentBeat)', () => {
    const y = noteScreenY(currentBeat - 1, currentBeat, lookahead, height)
    expect(y).toBeGreaterThan(height)
  })

  it('is linear in beats — halfway through the window sits at half height', () => {
    const y = noteScreenY(currentBeat + lookahead / 2, currentBeat, lookahead, height)
    expect(y).toBeCloseTo(height / 2)
  })
})
