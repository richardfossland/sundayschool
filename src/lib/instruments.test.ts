import { describe, it, expect } from 'vitest'
import { INSTRUMENTS, type InstrumentId } from './instruments'

// The instrument register is pure data — validate its shape so a bad edit can't
// silently break sample loading or (worse) let drums be pitch-shifted.

const IDS: InstrumentId[] = ['piano', 'guitar', 'bass', 'drums']

// The historical Salamander subset piano MUST keep sounding exactly as before —
// only the baseUrl moved to /samples/. This is the expected note→file map.
function expectedPianoMap(): Record<string, string> {
  const roots = ['A', 'C', 'D#', 'F#']
  const map: Record<string, string> = {}
  for (let octave = 0; octave <= 7; octave++) {
    for (const r of roots) {
      if (octave === 0 && (r === 'C' || r === 'D#' || r === 'F#')) continue
      map[`${r}${octave}`] = `${r.replace('#', 's')}${octave}.mp3`
    }
  }
  map['C8'] = 'C8.mp3'
  return map
}

describe('INSTRUMENTS register', () => {
  it('defines exactly the four instruments', () => {
    expect(Object.keys(INSTRUMENTS).sort()).toEqual([...IDS].sort())
  })

  for (const id of IDS) {
    describe(id, () => {
      const spec = INSTRUMENTS[id]

      it('is self-hosted under /samples/', () => {
        expect(spec.baseUrl).toMatch(/^\/samples\//)
        expect(spec.baseUrl.startsWith(`/samples/${id}/`)).toBe(true)
      })

      it('has a non-empty urls map', () => {
        expect(Object.keys(spec.urls).length).toBeGreaterThan(0)
      })

      it('every sample filename is a plain relative file', () => {
        for (const file of Object.values(spec.urls)) {
          expect(typeof file).toBe('string')
          expect(file.length).toBeGreaterThan(0)
          expect(file).not.toContain('/') // baseUrl carries the path
          expect(file).toMatch(/\.(mp3|flac|ogg|wav)$/)
        }
      })
    })
  }

  it('pitched instruments are samplers; drums are players and never a sampler', () => {
    expect(INSTRUMENTS.piano.kind).toBe('sampler')
    expect(INSTRUMENTS.guitar.kind).toBe('sampler')
    expect(INSTRUMENTS.bass.kind).toBe('sampler')
    expect(INSTRUMENTS.drums.kind).toBe('players')
    expect(INSTRUMENTS.drums.kind).not.toBe('sampler')
  })

  it('drums are keyed by numeric GM pitch (identity, not a note name)', () => {
    const drums = INSTRUMENTS.drums
    if (drums.kind !== 'players') throw new Error('drums must be a players spec')
    for (const key of Object.keys(drums.urls)) {
      // Object number keys stringify to integers with no note letters.
      expect(key).toMatch(/^\d+$/)
    }
    // The core GM pieces the drum lanes rely on must all be present.
    for (const gm of [36, 38, 42, 46, 41, 45, 48, 49, 51]) {
      expect(drums.urls[gm]).toBeDefined()
    }
  })

  it('piano covers the same notes and filenames as before (only baseUrl moved)', () => {
    const piano = INSTRUMENTS.piano
    expect(piano.kind).toBe('sampler')
    expect(piano.urls).toEqual(expectedPianoMap())
    expect(piano.baseUrl).toBe('/samples/piano/')
  })
})
