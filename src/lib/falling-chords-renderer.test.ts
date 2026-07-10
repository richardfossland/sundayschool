import { describe, it, expect } from 'vitest'
import { chordBand, chordBlockY, CHORD_BAND_FRACTION } from './falling-chords-renderer'

// The falling-chords canvas needs a real 2D context; the geometry it stands on
// (the centred lane + block edges) is pure and carries the correctness that
// matters: a chord onset lands exactly on the hit line, blocks fall monotonically,
// and the lane is centred.

describe('chordBand', () => {
  it('centres a lane of the configured fraction in the view', () => {
    const { x, w } = chordBand(1000)
    expect(w).toBeCloseTo(1000 * CHORD_BAND_FRACTION)
    expect(x).toBeCloseTo((1000 - w) / 2)
    // Symmetric: left margin equals right margin.
    expect(x).toBeCloseTo(1000 - (x + w))
  })

  it('respects a custom fraction', () => {
    const { x, w } = chordBand(800, 0.5)
    expect(w).toBeCloseTo(400)
    expect(x).toBeCloseTo(200)
  })
})

describe('chordBlockY', () => {
  const currentBeat = 8
  const look = 8
  const height = 240

  it('puts the onset on the hit line when t == currentBeat', () => {
    const { bottom } = chordBlockY(currentBeat, 4, currentBeat, look, height)
    expect(bottom).toBe(height)
  })

  it('places the tail above the onset (top < bottom for a positive duration)', () => {
    const { top, bottom } = chordBlockY(currentBeat, 4, currentBeat, look, height)
    expect(top).toBeLessThan(bottom)
  })

  it('a chord one lookahead ahead has its onset at the very top', () => {
    const { bottom } = chordBlockY(currentBeat + look, 4, currentBeat, look, height)
    expect(bottom).toBe(0)
  })

  it('falls monotonically — earlier onsets sit lower as the beat advances', () => {
    const early = chordBlockY(10, 4, 6, look, height).bottom
    const later = chordBlockY(10, 4, 9, look, height).bottom
    expect(later).toBeGreaterThan(early)
  })

  it('an already-passed chord sits below the hit line', () => {
    const { bottom } = chordBlockY(2, 4, currentBeat, look, height)
    expect(bottom).toBeGreaterThan(height)
  })
})
