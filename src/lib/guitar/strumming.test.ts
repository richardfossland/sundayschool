import { describe, it, expect } from 'vitest'
import type { SongChord } from '@/types/song'
import { chordPitchClasses, pitchClass } from '@/lib/music'
import { shapesAtCapo } from './capo'
import {
  STRUM_PATTERNS,
  beatsPerBarOf,
  defaultPatternFor,
  patternById,
  strumEvents,
  voiceChord,
  type StrumPattern,
} from './strumming'

const ch = (t: number, d: number, r: number, q = ''): SongChord => ({ t, d, r, q })
const folk = patternById('folk')!
const helslag = patternById('helslag')!

// Events of one stroke = the events sharing the same integer-ish onset (strokes
// are ≥0.5 beats apart; string stagger is 0.015·i, well under that).
function strokeGroups(events: ReturnType<typeof strumEvents>): Map<string, typeof events> {
  const groups = new Map<string, typeof events>()
  for (const e of events) {
    const key = (Math.round(e.beat / 0.25) * 0.25).toFixed(2) // snap to the pattern grid
    const g = groups.get(key) ?? []
    g.push(e)
    groups.set(key, g)
  }
  return groups
}

describe('pattern registry', () => {
  it('has the six patterns', () => {
    expect(STRUM_PATTERNS.map((p) => p.id)).toEqual([
      'helslag', 'folk', 'ballade', 'vals', 'seks-atte', 'gospel-shuffle',
    ])
  })
  it('defaults by time signature', () => {
    expect(defaultPatternFor('3/4').id).toBe('vals')
    expect(defaultPatternFor('6/8').id).toBe('seks-atte')
    expect(defaultPatternFor('4/4').id).toBe('folk')
  })
  it('patternById returns null for unknown/none', () => {
    expect(patternById('nope')).toBeNull()
    expect(patternById(null)).toBeNull()
  })

  it('synthesises a full-bar pattern for meters with no written one', () => {
    // 6/4 used to fall back to the 4/4 folk pattern, leaving beats 5–6 unstrummed.
    const p = defaultPatternFor('6/4')
    expect(p.timeSignature).toBe('6/4')
    expect(p.strokes.map((s) => s.t)).toEqual([0, 1, 2, 3, 4, 5])
    expect(p.strokes.every((s) => s.dir === 'D')).toBe(true)
    expect(p.strokes[0].accent).toBe(true)
    expect(defaultPatternFor('5/4').strokes).toHaveLength(5)
    expect(beatsPerBarOf('6/8')).toBe(3) // compound meters keep the SongDoc convention
    expect(beatsPerBarOf('12/8')).toBe(6)
  })
})

describe('strumEvents — full-bar coverage', () => {
  it('6/4: every beat of the bar is strummed', () => {
    const events = strumEvents([ch(0, 6, 7)], defaultPatternFor('6/4'), 6, 6)
    for (let b = 0; b < 6; b++) {
      // A stroke starts on every beat (the string sweep staggers by ≤ 0.1).
      expect(events.some((e) => Math.abs(e.beat - b) < 0.1)).toBe(true)
    }
    for (const e of events) expect(e.beat).toBeLessThan(6)
  })

  it('every registered meter is covered beat by beat by its default pattern', () => {
    for (const [ts, bpb] of [['4/4', 4], ['3/4', 3], ['6/8', 3], ['6/4', 6]] as const) {
      const events = strumEvents([ch(0, bpb, 7)], defaultPatternFor(ts), bpb, bpb)
      for (let b = 0; b < bpb; b++) {
        const inBeat = events.filter((e) => e.beat >= b - 1e-6 && e.beat < b + 1)
        expect(inBeat.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('strumEvents — counts and structure', () => {
  it('one G-major bar of folk = 3 down-strokes × 6 strings + 3 up × 4', () => {
    const events = strumEvents([ch(0, 4, 7)], folk, 4, 4)
    expect(events.length).toBe(3 * 6 + 3 * 4) // G grip 320003 sounds all 6 strings
  })

  it('event count scales with bars', () => {
    const one = strumEvents([ch(0, 4, 7)], folk, 4, 4).length
    const two = strumEvents([ch(0, 8, 7)], folk, 4, 8).length
    expect(two).toBe(one * 2)
  })

  it('no events at or after totalBeats', () => {
    const events = strumEvents([ch(0, 4, 7)], folk, 4, 4)
    for (const e of events) expect(e.beat).toBeLessThan(4)
  })

  it('beats with no active chord are silent', () => {
    // Chord only covers beats 0–2; the strokes at 2.5/3/3.5 must not sound.
    const events = strumEvents([ch(0, 2, 7)], folk, 4, 4)
    for (const e of events) expect(e.beat).toBeLessThan(2 + 0.1)
  })
})

describe('strumEvents — stroke direction and feel', () => {
  it('down-strokes sweep low → high with rising micro-offsets', () => {
    const events = strumEvents([ch(0, 4, 7)], helslag, 4, 4)
    expect(events.length).toBe(6)
    for (let i = 1; i < events.length; i++) {
      expect(events[i].beat).toBeGreaterThan(events[i - 1].beat)
      expect(events[i].pitch).toBeGreaterThan(events[i - 1].pitch)
    }
    // Stagger is within the documented 0.01–0.02 beats per string.
    expect(events[1].beat - events[0].beat).toBeGreaterThanOrEqual(0.01)
    expect(events[1].beat - events[0].beat).toBeLessThanOrEqual(0.02)
  })

  it('up-strokes hit the top strings high → low at lower velocity', () => {
    const events = strumEvents([ch(0, 4, 7)], folk, 4, 4)
    const groups = strokeGroups(events)
    const up = groups.get('1.50')! // folk's first up-stroke
    const down = groups.get('1.00')! // preceding plain down-stroke
    expect(up.length).toBe(4)
    for (let i = 1; i < up.length; i++) expect(up[i].pitch).toBeLessThan(up[i - 1].pitch)
    expect(up[0].vel).toBeLessThan(down[0].vel)
  })

  it('accented strokes are louder', () => {
    const events = strumEvents([ch(0, 4, 7)], folk, 4, 4)
    const groups = strokeGroups(events)
    const accented = groups.get('0.00')!
    const plain = groups.get('1.00')!
    expect(accented[0].vel).toBeGreaterThan(plain[0].vel)
  })

  it('respects a chord change mid-bar, stroke by stroke', () => {
    // C for beats 0–2, G for 2–4: the up-stroke at 2.5 must sound G tones.
    const events = strumEvents([ch(0, 2, 0), ch(2, 2, 7)], folk, 4, 4)
    const groups = strokeGroups(events)
    const gPcs = new Set(chordPitchClasses(7, ''))
    const cPcs = new Set(chordPitchClasses(0, ''))
    for (const e of groups.get('2.50')!) expect(gPcs.has(pitchClass(e.pitch))).toBe(true)
    for (const e of groups.get('1.00')!) expect(cPcs.has(pitchClass(e.pitch))).toBe(true)
  })
})

describe('strumEvents — shapes, capo and fallback', () => {
  it('a shapesAtCapo map + transpose sounds the chord in the target key', () => {
    // F major played with capo 1 (E grip): sounding pcs must be F A C.
    const chords = [ch(0, 4, 5)]
    const shapes = shapesAtCapo(chords, 1)
    const events = strumEvents(chords, helslag, 4, 4, { shapes, transpose: 1 })
    const pcs = new Set(events.map((e) => pitchClass(e.pitch)))
    expect(pcs).toEqual(new Set([5, 9, 0]))
  })

  it('chords without any grip fall back to a pitch-class voicing', () => {
    const events = strumEvents([ch(0, 4, 0, 'dim')], helslag, 4, 4)
    expect(events.length).toBeGreaterThan(0)
    const dimPcs = new Set(chordPitchClasses(0, 'dim'))
    for (const e of events) expect(dimPcs.has(pitchClass(e.pitch))).toBe(true)
  })

  it('the bar grid respects a pickup (opptakt)', () => {
    // 1-beat pickup: full bars start at beat 1, so folk's downbeat accent
    // lands at beats 1, 5, … not at 0.
    const events = strumEvents([ch(0, 9, 7)], folk, 4, 9, { pickupBeats: 1 })
    const accents = events.filter((e) => e.vel > 0.9)
    expect(accents.some((e) => Math.abs(e.beat - 1) < 0.1)).toBe(true)
    expect(accents.some((e) => Math.abs(e.beat - 5) < 0.1)).toBe(true)
  })

  it('degenerate input yields no events', () => {
    expect(strumEvents([], folk, 4, 4)).toEqual([])
    expect(strumEvents([ch(0, 4, 7)], folk, 0, 4)).toEqual([])
    expect(strumEvents([ch(0, 4, 7)], folk, 4, 0)).toEqual([])
    const empty: StrumPattern = { id: 'e', label: 'e', timeSignature: '4/4', strokes: [] }
    expect(strumEvents([ch(0, 4, 7)], empty, 4, 4)).toEqual([])
  })
})

describe('voiceChord', () => {
  it('voices the chord compactly from the low register', () => {
    const v = voiceChord(0, '') // C: root at C3 = 48
    expect(v[0]).toBe(48)
    expect(new Set(v.map(pitchClass))).toEqual(new Set([0, 4, 7]))
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1])
  })
  it('never voices below E2', () => {
    for (let r = 0; r < 12; r++) expect(voiceChord(r, 'm')[0]).toBeGreaterThanOrEqual(40)
  })
})
