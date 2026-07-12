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

  it('every seed song resolves to a hymn story (own slug or its work)', () => {
    // Stories are written once per WORK; variants (enkel/firstemmig/gospel)
    // fall back to the work's article — same lookup as HymnStoryLink.
    for (const song of seedSongs) {
      expect(
        hymnStoryFor(song.slug) ?? hymnStoryFor(song.work_slug),
        `song '${song.slug}' has no hymn story (nor its work '${song.work_slug}')`,
      ).not.toBeNull()
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
