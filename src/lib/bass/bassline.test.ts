import { describe, it, expect } from 'vitest'
import {
  BASS_HIGH,
  BASS_LOW,
  chordBassPitch,
  generateBassline,
  isHeavyBeat,
  nearestPitch,
} from './bassline'
import type { SongChord } from '@/types/song'
import { chordPitchClasses, pitchClass } from '../music'

// Meter stubs — generateBassline only reads beatsPerBar/pickupBeats.
const M44 = { beatsPerBar: 4, pickupBeats: 0 }
const M34 = { beatsPerBar: 3, pickupBeats: 0 }

const chord = (t: number, d: number, r: number, q = '', b?: number): SongChord => ({ t, d, r, q, b })

describe('nearestPitch / chordBassPitch', () => {
  it('voices roots in the octave nearest A1, inside E1–G3', () => {
    expect(nearestPitch(9)).toBe(33) // A → A1 itself
    expect(nearestPitch(0)).toBe(36) // C → C2 (33+3), nearer than C3
    expect(nearestPitch(4)).toBe(28) // E → E1 (28), nearer than E2 (40)
    for (let pc = 0; pc < 12; pc++) {
      const p = nearestPitch(pc)
      expect(p).toBeGreaterThanOrEqual(BASS_LOW)
      expect(p).toBeLessThanOrEqual(BASS_HIGH)
      expect(pitchClass(p)).toBe(pc)
    }
  })

  it('slash chords use the written bass note, not the root', () => {
    // C/E → bass tone is E, not C.
    expect(pitchClass(chordBassPitch(chord(0, 4, 0, '', 4)))).toBe(4)
    expect(pitchClass(chordBassPitch(chord(0, 4, 0)))).toBe(0)
  })
})

describe('isHeavyBeat', () => {
  it('4/4: beats 1 and 3 are heavy', () => {
    expect(isHeavyBeat(0, 4, 0)).toBe(true)
    expect(isHeavyBeat(1, 4, 0)).toBe(false)
    expect(isHeavyBeat(2, 4, 0)).toBe(true)
    expect(isHeavyBeat(3, 4, 0)).toBe(false)
  })

  it('3/4 (and 6/8, beatsPerBar 3): only beat 1 is heavy', () => {
    expect(isHeavyBeat(0, 3, 0)).toBe(true)
    expect(isHeavyBeat(1, 3, 0)).toBe(false)
    expect(isHeavyBeat(2, 3, 0)).toBe(false)
    expect(isHeavyBeat(3, 3, 0)).toBe(true) // next bar's downbeat
  })

  it('respects the pickup (opptakt) — downbeats shift by pickupBeats', () => {
    expect(isHeavyBeat(1, 4, 1)).toBe(true) // first full bar starts at beat 1
    expect(isHeavyBeat(0, 4, 1)).toBe(false) // the pickup beat is not a downbeat
  })
})

describe('generateBassline — level 1 (grunntoner)', () => {
  it('one event per chord, root pitch class, held the whole chord', () => {
    const chords = [chord(0, 4, 0), chord(4, 4, 5), chord(8, 4, 7, '7')] // C F G7
    const evs = generateBassline(chords, M44, 1)
    expect(evs).toHaveLength(3)
    expect(evs.map((e) => pitchClass(e.pitch))).toEqual([0, 5, 7])
    expect(evs.map((e) => e.beat)).toEqual([0, 4, 8])
    expect(evs.map((e) => e.durBeats)).toEqual([4, 4, 4])
  })

  it('is deterministic (same input → same output)', () => {
    const chords = [chord(0, 4, 2, 'm'), chord(4, 4, 9, 'm7')]
    expect(generateBassline(chords, M44, 3)).toEqual(generateBassline(chords, M44, 3))
  })
})

describe('generateBassline — level 2 (rot og kvint)', () => {
  it('4/4: root on beats 1+3, fifth on beats 2+4', () => {
    const evs = generateBassline([chord(0, 4, 0)], M44, 2) // C major, one bar
    expect(evs).toHaveLength(4)
    expect(pitchClass(evs[0].pitch)).toBe(0) // root
    expect(pitchClass(evs[1].pitch)).toBe(7) // fifth
    expect(pitchClass(evs[2].pitch)).toBe(0)
    expect(pitchClass(evs[3].pitch)).toBe(7)
  })

  it('3/4: root only on beat 1, fifths on beats 2+3', () => {
    const evs = generateBassline([chord(0, 3, 7)], M34, 2) // G major, one 3/4 bar
    expect(evs).toHaveLength(3)
    expect(pitchClass(evs[0].pitch)).toBe(7)
    expect(pitchClass(evs[1].pitch)).toBe(2) // D, the fifth
    expect(pitchClass(evs[2].pitch)).toBe(2)
  })
})

describe('generateBassline — level 3 (vandrende)', () => {
  it('root on beat 1, chord tones mid-bar, approach into the next root', () => {
    const chords = [chord(0, 4, 0), chord(4, 4, 5)] // C → F
    const evs = generateBassline(chords, M44, 3)
    const bar1 = evs.filter((e) => e.beat < 4)
    expect(bar1).toHaveLength(4)
    expect(pitchClass(bar1[0].pitch)).toBe(0) // root C
    expect(pitchClass(bar1[1].pitch)).toBe(4) // third E
    expect(pitchClass(bar1[2].pitch)).toBe(7) // fifth G
    // Last beat: chromatic approach ±1/±2 semitones from the NEXT chord's root.
    const nextRoot = evs.find((e) => Math.abs(e.beat - 4) < 1e-6)!.pitch
    const dist = Math.abs(bar1[3].pitch - nextRoot)
    expect(dist).toBeGreaterThanOrEqual(1)
    expect(dist).toBeLessThanOrEqual(2)
  })

  it('minor chords walk through the minor third', () => {
    const evs = generateBassline([chord(0, 4, 9, 'm'), chord(4, 4, 2, 'm')], M44, 3) // Am → Dm
    expect(pitchClass(evs[1].pitch)).toBe(0) // C, the minor third of A
  })

  it('all pitches stay within the playable bass range 28–55', () => {
    // Push edge cases: low E chord, high-ish roots, slash chords, every level.
    const chords = [chord(0, 4, 4), chord(4, 4, 11, 'dim'), chord(8, 4, 0, '', 7), chord(12, 4, 6)]
    for (const level of [1, 2, 3] as const) {
      for (const e of generateBassline(chords, M44, level)) {
        expect(e.pitch).toBeGreaterThanOrEqual(BASS_LOW)
        expect(e.pitch).toBeLessThanOrEqual(BASS_HIGH)
      }
    }
  })

  it('slash chords: only the BASS note comes from the slash, chord tones from the root', () => {
    // C/E: the bass is E, but the walking tones are C's third and fifth (E, G).
    // Before the fix the fifth was measured from the E — a B, foreign to C major.
    const cOverE = chord(0, 4, 0, '', 4)
    const cPcs = new Set(chordPitchClasses(0, ''))
    for (const level of [1, 2, 3] as const) {
      const evs = generateBassline([cOverE], M44, level)
      expect(evs.length).toBeGreaterThan(0)
      for (const e of evs) expect(cPcs.has(pitchClass(e.pitch))).toBe(true)
      expect(pitchClass(evs[0].pitch)).toBe(4) // …and the chord still starts on its slash bass
    }
    // Level 2 alternates bass / fifth: the fifth of C/E is G, never B.
    const l2 = generateBassline([cOverE], M44, 2)
    expect(l2.map((e) => pitchClass(e.pitch))).toEqual([4, 7, 4, 7])
  })

  it('sus chords walk through their own tone, never a major third', () => {
    // C7sus4 = C F G Bb. The old generator walked through E.
    const evs = generateBassline([chord(0, 4, 0, '7sus4'), chord(4, 4, 5)], M44, 3)
    const susPcs = new Set(chordPitchClasses(0, '7sus4'))
    for (const e of evs.filter((x) => x.beat < 3)) {
      expect(susPcs.has(pitchClass(e.pitch))).toBe(true)
      expect(pitchClass(e.pitch)).not.toBe(4)
    }
    expect(pitchClass(evs[1].pitch)).toBe(5) // the sus 4th, F
    // A power chord has no third at all — it walks through the fifth.
    const power = generateBassline([chord(0, 4, 7, '5'), chord(4, 4, 0)], M44, 3)
    const powerPcs = new Set(chordPitchClasses(7, '5'))
    for (const e of power.filter((x) => x.beat < 3)) {
      expect(powerPcs.has(pitchClass(e.pitch))).toBe(true)
    }
  })

  it('walking notes tile each chord without gaps', () => {
    const evs = generateBassline([chord(0, 4, 0), chord(4, 2, 7)], M44, 3)
    for (let i = 1; i < evs.length; i++) {
      expect(evs[i - 1].beat + evs[i - 1].durBeats).toBeCloseTo(evs[i].beat)
    }
  })
})
