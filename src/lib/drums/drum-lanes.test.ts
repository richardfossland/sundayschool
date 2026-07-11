import { describe, it, expect } from 'vitest'
import { LANES, laneOf, laneForPitch } from './drum-lanes'
import { INSTRUMENTS } from '../instruments'

// The lanes are the bridge between the instrument register (GM pitches) and the
// UI (pads + falling lanes). The invariants that matter: every drum the register
// can actually play maps to exactly one lane, kick is left / ride is right, and
// unknown pitches map to null (so stray MIDI input is ignored, not crashed).

describe('drum lanes', () => {
  it('lays out kick on the left and ride on the right', () => {
    expect(LANES[0].id).toBe('kick')
    expect(LANES[LANES.length - 1].id).toBe('ride')
  })

  it('every canonical padPitch exists in the drum instrument register', () => {
    const drums = INSTRUMENTS.drums
    if (drums.kind !== 'players') throw new Error('drums must be a players spec')
    for (const lane of LANES) {
      expect(drums.urls[lane.padPitch]).toBeDefined()
    }
  })

  it('every register drum pitch maps to a lane', () => {
    const drums = INSTRUMENTS.drums
    if (drums.kind !== 'players') throw new Error('drums must be a players spec')
    for (const key of Object.keys(drums.urls)) {
      expect(laneOf(Number(key))).not.toBeNull()
    }
  })

  it('folds GM aliases into the right lane', () => {
    expect(laneOf(35)).toBe(laneOf(36)) // acoustic bass drum → kick
    expect(laneOf(40)).toBe(laneOf(38)) // electric snare → snare
    expect(laneOf(44)).toBe(laneOf(42)) // pedal hi-hat → closed hi-hat
    expect(laneOf(57)).toBe(laneOf(49)) // crash 2 → crash
    expect(laneOf(59)).toBe(laneOf(51)) // ride 2 → ride
  })

  it('maps a canonical pitch to its own lane and returns the DrumLane', () => {
    const kick = laneForPitch(36)
    expect(kick?.id).toBe('kick')
    expect(laneOf(36)).toBe(0)
  })

  it('returns null for a pitch we do not render', () => {
    expect(laneOf(60)).toBeNull() // middle C — not percussion
    expect(laneOf(0)).toBeNull()
    expect(laneForPitch(99)).toBeNull()
  })

  it('assigns each GM pitch to at most one lane (no overlaps)', () => {
    const seen = new Set<number>()
    for (const lane of LANES) {
      for (const p of lane.gmPitches) {
        expect(seen.has(p)).toBe(false)
        seen.add(p)
      }
    }
  })
})
