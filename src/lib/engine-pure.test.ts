import { describe, it, expect } from 'vitest'
import type { SongNote } from '@/types/song'
import { buildEvents, mergeTies, countInClicks, isDownbeat } from './engine-events'

// Pure engine helpers only — the Tone.js parts of engine.ts are not tested here.

const note = (p: number, t: number, d: number, h: 'L' | 'R', extra: Partial<SongNote> = {}): SongNote => ({
  p,
  t,
  d,
  h,
  ...extra,
})

describe('mergeTies', () => {
  it('merges a tied pair into one note of combined duration', () => {
    const notes = [note(60, 0, 1, 'R', { tie: true }), note(60, 1, 1, 'R')]
    const merged = mergeTies(notes)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ p: 60, t: 0, d: 2 })
    expect(merged[0].tie).toBeUndefined()
  })

  it('merges a chain of three tied notes', () => {
    const notes = [
      note(60, 0, 1, 'R', { tie: true }),
      note(60, 1, 1, 'R', { tie: true }),
      note(60, 2, 2, 'R'),
    ]
    const merged = mergeTies(notes)
    expect(merged).toHaveLength(1)
    expect(merged[0].d).toBe(4)
  })

  it('only ties to the same pitch and hand', () => {
    // A tie on 60/R whose "continuation" is a different pitch/hand must not bind.
    const notes = [note(60, 0, 1, 'R', { tie: true }), note(62, 1, 1, 'R'), note(60, 1, 1, 'L')]
    const merged = mergeTies(notes)
    // No valid continuation → the tied note stays its own length, tie cleared.
    expect(merged).toHaveLength(3)
    const head = merged.find((n) => n.p === 60 && n.h === 'R')!
    expect(head.d).toBe(1)
    expect(head.tie).toBeUndefined()
  })

  it('leaves untied notes untouched', () => {
    const notes = [note(60, 0, 1, 'R'), note(64, 1, 1, 'R')]
    expect(mergeTies(notes)).toEqual(notes)
  })
})

describe('buildEvents', () => {
  const notes = [note(60, 0, 1, 'R', { v: 0.9 }), note(48, 0, 2, 'L')]

  it('applies the default velocity when none is given', () => {
    const evs = buildEvents({ notes }, { hand: 'both' })
    const left = evs.find((e) => e.hand === 'L')!
    expect(left.vel).toBe(0.8)
  })

  it("hand='both' keeps every note", () => {
    expect(buildEvents({ notes }, { hand: 'both' })).toHaveLength(2)
  })

  it("hand='R' drops the muted hand entirely", () => {
    const evs = buildEvents({ notes }, { hand: 'R' })
    expect(evs).toHaveLength(1)
    expect(evs[0].hand).toBe('R')
  })

  it('transposes every pitch by the semitone offset', () => {
    const evs = buildEvents({ notes }, { hand: 'both', transpose: 3 })
    expect(evs.find((e) => e.hand === 'R')!.pitch).toBe(63)
    expect(evs.find((e) => e.hand === 'L')!.pitch).toBe(51)
  })

  it('merges ties before emitting events', () => {
    const tied = [note(60, 0, 1, 'R', { tie: true }), note(60, 1, 1, 'R')]
    const evs = buildEvents({ notes: tied }, { hand: 'both' })
    expect(evs).toHaveLength(1)
    expect(evs[0].durBeats).toBe(2)
  })
})

describe('countInClicks', () => {
  it('4/4 with no pickup: 4 clicks, accent on beat 1, start after a full bar', () => {
    const plan = countInClicks(4, 0)
    expect(plan.clicks).toHaveLength(4)
    expect(plan.clicks.map((c) => c.accent)).toEqual([true, false, false, false])
    expect(plan.startAfterBeats).toBe(4)
  })

  it('a 1-beat pickup starts the transport one beat earlier so bar 1 lands right', () => {
    const plan = countInClicks(4, 1)
    expect(plan.clicks).toHaveLength(4) // still a full bar of clicks
    expect(plan.startAfterBeats).toBe(3)
  })

  it('3/4 counts three clicks', () => {
    const plan = countInClicks(3, 0)
    expect(plan.clicks).toHaveLength(3)
    expect(plan.startAfterBeats).toBe(3)
  })
})

describe('isDownbeat', () => {
  it('no pickup: downbeats fall on multiples of beatsPerBar', () => {
    expect(isDownbeat(0, 4, 0)).toBe(true)
    expect(isDownbeat(4, 4, 0)).toBe(true)
    expect(isDownbeat(2, 4, 0)).toBe(false)
  })

  it('with a 1-beat pickup, downbeats are offset by the pickup', () => {
    expect(isDownbeat(1, 4, 1)).toBe(true) // first true downbeat after the opptakt
    expect(isDownbeat(5, 4, 1)).toBe(true)
    expect(isDownbeat(0, 4, 1)).toBe(false) // the pickup note itself is not a downbeat
  })
})
