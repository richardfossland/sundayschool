import { describe, it, expect } from 'vitest'
import { songDocSchema, songNoteSchema, validateSeedSong } from './format'
import { seedSongs } from '@/data/songs'
import { churchSeasonSchema } from '@/lib/teologi/content'

// Pins zod behaviour the content pipeline depends on, so a major bump cannot
// silently change it (strict objects, issue paths, key stripping, regexes).
const note = { p: 60, t: 0, d: 1, h: 'R' as const }

describe('zod schema semantics (format.ts)', () => {
  it('strictObject rejects unknown keys instead of stripping them', () => {
    const r = songNoteSchema.safeParse({ ...note, extra: 1 })
    expect(r.success).toBe(false)
    expect(r.error!.issues[0].code).toBe('unrecognized_keys')
  })

  it('issues carry a path usable for "a.b.0.c" problem lists (midi-import)', () => {
    const r = songDocSchema.safeParse({
      formatVersion: 1,
      timeSignature: '4/4',
      beatsPerBar: 4,
      pickupBeats: 0,
      totalBeats: 4,
      keySignature: 'C',
      sections: [{ id: 'a', kind: 'verse', label: 'V', startBeat: 0, endBeat: 4 }],
      notes: [{ ...note, p: 10 }],
      chords: [],
    })
    expect(r.success).toBe(false)
    expect(r.error!.issues.map((i) => i.path.join('.'))).toContain('notes.0.p')
  })

  it('optional note fields stay optional and are not added', () => {
    const r = songNoteSchema.parse(note)
    expect(Object.keys(r).sort()).toEqual(['d', 'h', 'p', 't'])
  })

  it('regex-validated fields still reject bad input', () => {
    expect(
      churchSeasonSchema.safeParse({
        id: 'a', label: 'a', color: 'Rød', period: 'p', description: 'd', themes: ['t'], songSlugs: [],
      }).success,
    ).toBe(false)
  })

  it('every bundled seed song still validates', () => {
    for (const s of seedSongs) expect(() => validateSeedSong(s)).not.toThrow()
  })
})
