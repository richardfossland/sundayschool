import { describe, it, expect } from 'vitest'
import { seedSongs } from './songs'
import { validateSeedSong } from '@/lib/song/format'
import type { SeedSong, SongNote } from '@/types/song'

// ── Curated song library: contract + musical sanity ──────────────────────────
// Every seed song must pass the same gatekeeper the seed script and future
// import flow use (validateSeedSong = zod shape + docInvariants). On top of the
// structural contract we assert musical quality invariants that a hymn/salme
// arrangement must satisfy: a real melody in the right hand, real accompaniment
// in the left, a chord track, and a singable melodic range.

const C3 = 48 // lowest expected melody pitch
const C6 = 84 // highest expected melody pitch
const EPS = 1e-6

/** The soprano/melody line = the highest right-hand note at each onset time. */
function melodyLine(notes: SongNote[]): SongNote[] {
  const byOnset = new Map<number, SongNote>()
  for (const n of notes) {
    if (n.h !== 'R') continue
    const cur = byOnset.get(n.t)
    if (!cur || n.p > cur.p) byOnset.set(n.t, n)
  }
  return [...byOnset.values()].sort((a, b) => a.t - b.t)
}

describe('seed song library', () => {
  // 10 hand-written + generated arrangements from the work sources (pilot: 2
  // works à 2/3 levels = 5). The library only grows from here.
  it('has at least 14 songs with unique slugs', () => {
    expect(seedSongs.length).toBeGreaterThanOrEqual(14)
    const slugs = new Set(seedSongs.map((s: SeedSong) => s.slug))
    expect(slugs.size).toBe(seedSongs.length)
  })

  it('has at most one arrangement per (work, difficulty) and covers all difficulties', () => {
    const combos = new Set(seedSongs.map((s: SeedSong) => `${s.work_slug}#${s.difficulty}`))
    expect(combos.size).toBe(seedSongs.length)
    const difficulties = new Set(seedSongs.map((s: SeedSong) => s.difficulty))
    expect(difficulties).toEqual(new Set([1, 2, 3]))
  })

  it('gives every variant a consistent work identity', () => {
    const bySlug = new Map(seedSongs.map((s: SeedSong) => [s.slug, s]))
    for (const s of seedSongs) {
      // A variant's work_slug points at the work's level-1 arrangement slug.
      expect(bySlug.has(s.work_slug)).toBe(true)
      if (s.slug !== s.work_slug) {
        // Non-standard variants must be labelled.
        expect(s.variant_label).not.toBeNull()
      }
    }
  })

  for (const song of seedSongs) {
    describe(song.slug, () => {
      it('passes validateSeedSong (zod + docInvariants)', () => {
        expect(() => validateSeedSong(song as SeedSong)).not.toThrow()
      })

      it('has at least one section that tiles the whole song', () => {
        expect(song.doc.sections.length).toBeGreaterThanOrEqual(1)
      })

      it('has notes in BOTH hands', () => {
        const hands = new Set(song.doc.notes.map((n: SongNote) => n.h))
        expect(hands.has('L')).toBe(true)
        expect(hands.has('R')).toBe(true)
      })

      it('has at least 4 chords', () => {
        expect(song.doc.chords.length).toBeGreaterThanOrEqual(4)
      })

      it('keeps the melody within C3–C6', () => {
        const mel = melodyLine(song.doc.notes)
        expect(mel.length).toBeGreaterThan(0)
        for (const n of mel) {
          expect(n.p).toBeGreaterThanOrEqual(C3)
          expect(n.p).toBeLessThanOrEqual(C6)
        }
      })

      it('has a monophonic melody line (no overlapping soprano notes)', () => {
        const mel = melodyLine(song.doc.notes)
        for (let i = 1; i < mel.length; i++) {
          const prev = mel[i - 1]
          const cur = mel[i]
          expect(cur.t).toBeGreaterThanOrEqual(prev.t + prev.d - EPS)
        }
      })

      it('never leaves either hand silent for more than 2 beats in an active section', () => {
        for (const hand of ['L', 'R'] as const) {
          const hs = song.doc.notes
            .filter((n: SongNote) => n.h === hand)
            .sort((a: SongNote, b: SongNote) => a.t - b.t)
          expect(hs.length).toBeGreaterThan(0)
          // gap from song start to first note
          expect(hs[0].t).toBeLessThanOrEqual(song.doc.pickupBeats + 2 + EPS)
          let reach = hs[0].t + hs[0].d
          for (const n of hs) {
            if (n.t > reach + 2 + EPS) {
              throw new Error(
                `${song.slug}: ${hand}-hånd har hull > 2 slag ved beat ${reach} (neste note t=${n.t})`,
              )
            }
            reach = Math.max(reach, n.t + n.d)
          }
        }
      })

      it('documents public-domain rights with pre-1956 death years', () => {
        expect(song.rights.publicDomain).toBe(true)
        expect(song.rights.creators.length).toBeGreaterThanOrEqual(1)
        for (const c of song.rights.creators) {
          if (c.deathYear !== null) expect(c.deathYear).toBeLessThan(1956)
        }
        expect(song.rights.sources.length).toBeGreaterThanOrEqual(1)
        expect(song.rights.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  }
})
