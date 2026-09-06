import { describe, expect, it } from 'vitest'
import { seedSongs } from '@/data/songs'
import {
  catechismSections,
  churchSeasons,
  creeds,
  hymnStories,
  hymnStoryFor,
  memoryVerses,
  seasonColorParts,
  seasonsInOrder,
  validateContent,
  verseCollections,
  versesByCollection,
} from './content'

const SEED_SLUGS = new Set(seedSongs.map((s) => s.slug))

describe('teologi content — validation', () => {
  it('passes the zod validation (rights mandatory everywhere)', () => {
    expect(() => validateContent()).not.toThrow()
  })

  it('every hymn story points at an existing seed song', () => {
    for (const story of hymnStories) {
      expect(SEED_SLUGS.has(story.songSlug), `unknown songSlug '${story.songSlug}'`).toBe(true)
    }
  })

  it('the original library works all resolve to a hymn story', () => {
    // Stories are written once per WORK; variants (enkel/firstemmig/gospel)
    // fall back to the work's article — same lookup as HymnStoryLink. Full
    // coverage is only required for the original v1/v2 works — the v3 bank
    // expansion added ~40 works whose stories arrive incrementally (the link
    // simply hides where no story exists yet).
    const COVERED_WORKS = [
      'amazing-grace', 'glade-jul', 'joyful-joyful', 'kirken-den-er-et-gammelt-hus',
      'kumbaya', 'paskemorgen', 'swing-low', 'what-a-friend', 'when-the-saints',
      'joy-to-the-world', 'naa-takker-alle-gud',
      // W-C round: the 14 works given their own article.
      'it-is-well-with-my-soul', 'holy-holy-holy', 'abide-with-me', 'blessed-assurance',
      'come-thou-fount', 'nearer-my-god-to-thee', 'just-as-i-am', 'o-come-all-ye-faithful',
      'deilig-er-jorden', 'go-down-moses', 'deep-river', 'deg-vaere-aere',
      'vaar-gud-han-er-saa-fast-en-borg',
    ]
    for (const work of COVERED_WORKS) {
      expect(hymnStoryFor(work), `work '${work}' has no hymn story`).not.toBeNull()
    }
    // Every song must still LOOK UP safely (returns story or null, never throws).
    for (const song of seedSongs) {
      expect(() => hymnStoryFor(song.slug) ?? hymnStoryFor(song.work_slug)).not.toThrow()
    }
  })

  it('every church-season songSlug exists in seedSongs', () => {
    for (const season of churchSeasons) {
      for (const slug of season.songSlugs) {
        expect(SEED_SLUGS.has(slug), `season '${season.id}' → unknown slug '${slug}'`).toBe(true)
      }
    }
  })

  it('verse ids are unique and collections tile all 40 verses', () => {
    const ids = memoryVerses.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(memoryVerses.length).toBe(40)
    expect(verseCollections.length).toBe(5)
    const inCollections = verseCollections.flatMap((c) => c.verseIds)
    expect(new Set(inCollections).size).toBe(inCollections.length) // no verse in two collections
    expect(inCollections.length).toBe(40)
  })

  it('has the expected content volumes', () => {
    // One story per work (the library grows with the song bank), and every
    // story slug is unique.
    expect(hymnStories.length).toBeGreaterThanOrEqual(12)
    expect(new Set(hymnStories.map((s) => s.songSlug)).size).toBe(hymnStories.length)
    expect(catechismSections.length).toBe(5)
    expect(catechismSections.map((s) => s.part)).toEqual([1, 2, 3, 4, 5])
    expect(creeds.length).toBe(2)
    expect(churchSeasons.length).toBe(12)
  })
})

describe('teologi content — lookups', () => {
  it('hymnStoryFor finds a story and returns null for unknown slugs', () => {
    const story = hymnStoryFor('amazing-grace')
    expect(story?.title).toContain('Amazing Grace')
    expect(hymnStoryFor('finnes-ikke')).toBeNull()
  })

  it('versesByCollection returns verses in collection order', () => {
    const c = verseCollections[0]
    const verses = versesByCollection(c.id)
    expect(verses.map((v) => v.id)).toEqual(c.verseIds)
    expect(versesByCollection('finnes-ikke')).toEqual([])
  })

  it('seasonsInOrder starts with advent and ends with domssøndag', () => {
    const seasons = seasonsInOrder()
    expect(seasons[0].id).toBe('advent')
    expect(seasons[seasons.length - 1].id).toBe('domssondag')
  })

  it('seasonColorParts splits name and hex', () => {
    expect(seasonColorParts('Fiolett (#6B4E9E)')).toEqual({ name: 'Fiolett', hex: '#6B4E9E' })
    for (const s of churchSeasons) {
      const { hex } = seasonColorParts(s.color)
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
