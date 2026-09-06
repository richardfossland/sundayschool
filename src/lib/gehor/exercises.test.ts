import { describe, expect, it } from 'vitest'
import { pitchClass } from '../music'
import { scalePitches } from '../theory/diatonic'
import {
  chordQualityExercise,
  createRng,
  intervalExercise,
  melodyExercise,
  seededShuffle,
  type Level,
} from './exercises'

const SAMPLES = 200

function forLevels(fn: (level: Level) => void) {
  for (const level of [1, 2, 3] as const) fn(level)
}

describe('createRng — determinism', () => {
  it('same seed → same sequence', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 50; i++) expect(a()).toBe(b())
  })

  it('different seeds → different sequences', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('string seeds work and are stable', () => {
    expect(createRng('gehor')()).toBe(createRng('gehor')())
  })

  it('returns floats in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seededShuffle', () => {
  it('is deterministic and a permutation', () => {
    const arr = [1, 2, 3, 4, 5, 6]
    const a = seededShuffle(arr, createRng(9))
    const b = seededShuffle(arr, createRng(9))
    expect(a).toEqual(b)
    expect([...a].sort()).toEqual(arr)
    expect(arr).toEqual([1, 2, 3, 4, 5, 6]) // input untouched
  })
})

describe('intervalExercise', () => {
  it('is deterministic for a fixed seed', () => {
    forLevels((level) => {
      expect(intervalExercise(level, createRng(123))).toEqual(intervalExercise(level, createRng(123)))
    })
  })

  it('level 1: ascending only, sekund–oktav', () => {
    const rng = createRng(1)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = intervalExercise(1, rng)
      expect(ex.notes[1]).toBeGreaterThan(ex.notes[0])
      expect(ex.answer).toBeGreaterThanOrEqual(1)
      expect(ex.answer).toBeLessThanOrEqual(12)
      expect(ex.notes[1] - ex.notes[0]).toBe(ex.answer)
    }
  })

  it('level 2: allows descending, still within the octave', () => {
    const rng = createRng(2)
    let sawDescending = false
    for (let i = 0; i < SAMPLES; i++) {
      const ex = intervalExercise(2, rng)
      expect(ex.answer).toBeLessThanOrEqual(12)
      expect(Math.abs(ex.notes[1] - ex.notes[0])).toBe(ex.answer)
      if (ex.notes[1] < ex.notes[0]) sawDescending = true
    }
    expect(sawDescending).toBe(true)
  })

  it('level 3: reaches beyond the octave (up to 16)', () => {
    const rng = createRng(3)
    let sawCompound = false
    for (let i = 0; i < SAMPLES; i++) {
      const ex = intervalExercise(3, rng)
      expect(ex.answer).toBeLessThanOrEqual(16)
      if (ex.answer > 12) sawCompound = true
    }
    expect(sawCompound).toBe(true)
  })

  it('options are unique, contain the answer, and fit the level range', () => {
    forLevels((level) => {
      const rng = createRng(level * 10)
      for (let i = 0; i < 50; i++) {
        const ex = intervalExercise(level, rng)
        expect(ex.options).toContain(ex.answer)
        expect(new Set(ex.options).size).toBe(ex.options.length)
        expect(ex.options.length).toBe(4)
        const max = level === 3 ? 16 : 12
        for (const o of ex.options) {
          expect(o).toBeGreaterThanOrEqual(1)
          expect(o).toBeLessThanOrEqual(max)
        }
      }
    })
  })

  it('keeps both notes on the keyboard (C3–C6)', () => {
    forLevels((level) => {
      const rng = createRng(level)
      for (let i = 0; i < SAMPLES; i++) {
        const ex = intervalExercise(level, rng)
        for (const n of ex.notes) {
          expect(n).toBeGreaterThanOrEqual(48)
          expect(n).toBeLessThanOrEqual(84)
        }
      }
    })
  })
})

describe('chordQualityExercise', () => {
  it('is deterministic for a fixed seed', () => {
    forLevels((level) => {
      expect(chordQualityExercise(level, createRng(55))).toEqual(
        chordQualityExercise(level, createRng(55)),
      )
    })
  })

  it('level 1 quizzes only dur/moll', () => {
    const rng = createRng(11)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = chordQualityExercise(1, rng)
      expect(['', 'm']).toContain(ex.answer)
      expect(ex.options).toEqual(['', 'm'])
    }
  })

  it('level 2 adds 7/maj7/m7; level 3 adds dim/sus4/add9', () => {
    const l2 = new Set<string>()
    const l3 = new Set<string>()
    const rng = createRng(12)
    for (let i = 0; i < SAMPLES; i++) {
      l2.add(chordQualityExercise(2, rng).answer)
      l3.add(chordQualityExercise(3, rng).answer)
    }
    for (const q of ['', 'm', '7', 'maj7', 'm7']) expect(l2.has(q)).toBe(true)
    for (const q of ['dim', 'sus4', 'add9']) {
      expect(l2.has(q)).toBe(false)
      expect(l3.has(q)).toBe(true)
    }
  })

  it('answer is always among the options; pitches match the quality', () => {
    forLevels((level) => {
      const rng = createRng(level + 100)
      for (let i = 0; i < 50; i++) {
        const ex = chordQualityExercise(level, rng)
        expect(ex.options).toContain(ex.answer)
        expect(ex.pitches.length).toBeGreaterThanOrEqual(2)
        // Root-position voicing: intervals ascend from the root.
        for (let j = 1; j < ex.pitches.length; j++) {
          expect(ex.pitches[j]).toBeGreaterThan(ex.pitches[j - 1])
        }
      }
    })
  })
})

describe('melodyExercise', () => {
  it('is deterministic for a fixed seed', () => {
    forLevels((level) => {
      expect(melodyExercise(level, createRng(77))).toEqual(melodyExercise(level, createRng(77)))
    })
  })

  it('level 1: 3 notes, C major, starts on the tonic, stepwise', () => {
    const rng = createRng(21)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = melodyExercise(1, rng)
      expect(ex.pitches).toHaveLength(3)
      expect(ex.tonic).toBe(60)
      expect(ex.pitches[0]).toBe(60)
      const cMajor = new Set(scalePitches(0, 'major'))
      for (const p of ex.pitches) expect(cMajor.has(pitchClass(p))).toBe(true)
      for (let j = 1; j < ex.pitches.length; j++) {
        const step = Math.abs(ex.pitches[j] - ex.pitches[j - 1])
        expect(step).toBeGreaterThanOrEqual(1)
        expect(step).toBeLessThanOrEqual(2) // a scale step is 1–2 semitones
      }
    }
  })

  it('level 2: 5 notes in C major, with leaps', () => {
    const rng = createRng(22)
    let sawLeap = false
    for (let i = 0; i < SAMPLES; i++) {
      const ex = melodyExercise(2, rng)
      expect(ex.pitches).toHaveLength(5)
      expect(ex.tonic).toBe(60)
      const cMajor = new Set(scalePitches(0, 'major'))
      for (const p of ex.pitches) expect(cMajor.has(pitchClass(p))).toBe(true)
      for (let j = 1; j < ex.pitches.length; j++) {
        if (Math.abs(ex.pitches[j] - ex.pitches[j - 1]) > 2) sawLeap = true
      }
    }
    expect(sawLeap).toBe(true)
  })

  it('level 3: 7 notes, diatonic to a (possibly non-C) major key', () => {
    const rng = createRng(23)
    const tonics = new Set<number>()
    for (let i = 0; i < SAMPLES; i++) {
      const ex = melodyExercise(3, rng)
      expect(ex.pitches).toHaveLength(7)
      tonics.add(pitchClass(ex.tonic))
      const scale = new Set(scalePitches(pitchClass(ex.tonic), 'major'))
      for (const p of ex.pitches) expect(scale.has(pitchClass(p))).toBe(true)
    }
    expect(tonics.size).toBeGreaterThan(1) // actually varies the key
  })

  it('never repeats a note — a 2000-seed sweep at every level', { timeout: 30_000 }, () => {
    // Clamping the degree walk at the window edges used to hand out the same
    // note twice (19,5 % of melodies, worst chain six identical tones), which
    // is not a dictation interval at all.
    for (let seed = 0; seed < 2000; seed++) {
      forLevels((level) => {
        const ex = melodyExercise(level, createRng(seed * 10 + level))
        expect(ex.pitches).toHaveLength(level === 1 ? 3 : level === 2 ? 5 : 7)
        for (let i = 1; i < ex.pitches.length; i++) {
          expect(ex.pitches[i]).not.toBe(ex.pitches[i - 1])
        }
      })
    }
  })

  it('level 2 never leaps further than a perfect fourth (no tritones) — 2000 seeds', { timeout: 30_000 }, () => {
    for (let seed = 0; seed < 2000; seed++) {
      const ex = melodyExercise(2, createRng(seed))
      for (let i = 1; i < ex.pitches.length; i++) {
        expect(Math.abs(ex.pitches[i] - ex.pitches[i - 1])).toBeLessThanOrEqual(5)
      }
    }
    // Level 1 stays stepwise, level 3 keeps its wider reach.
    for (let seed = 0; seed < 200; seed++) {
      const l1 = melodyExercise(1, createRng(seed))
      for (let i = 1; i < l1.pitches.length; i++) {
        expect(Math.abs(l1.pitches[i] - l1.pitches[i - 1])).toBeLessThanOrEqual(2)
      }
    }
  })

  it('keeps the melody in a singable range around the tonic', () => {
    forLevels((level) => {
      const rng = createRng(level + 30)
      for (let i = 0; i < SAMPLES; i++) {
        const ex = melodyExercise(level, rng)
        for (const p of ex.pitches) {
          expect(p).toBeGreaterThanOrEqual(ex.tonic - 12)
          expect(p).toBeLessThanOrEqual(ex.tonic + 24)
        }
      }
    })
  })
})
