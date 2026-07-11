import { z } from 'zod'
import type {
  CatechismSection,
  ChurchSeason,
  Creed,
  HymnStory,
  MemoryVerse,
  VerseCollection,
} from '@/types/teologi'
import { hymnStories } from '@/data/teologi/salmehistorier'
import { memoryVerses, verseCollections } from '@/data/teologi/vers'
import { catechismSections } from '@/data/teologi/katekisme'
import { creeds } from '@/data/teologi/trosbekjennelser'
import { churchSeasons } from '@/data/teologi/kirkearet'

// ── Teologi content aggregator ────────────────────────────────────────────────
// Single import point for all theology content, plus zod schemas that keep the
// bundled data honest: rights is MANDATORY everywhere, ids are non-empty, and
// cross-references (verse ids in collections, song slugs against seedSongs) are
// checked in content.test.ts. Validation runs eagerly at module load in dev/test
// (cheap — the data is small and static).

// Rights is the legal audit trail — never optional, source never empty.
export const theologyRightsSchema = z.object({
  source: z.string().min(1),
  edition: z.string().min(1).optional(),
  modernized: z.boolean().optional(),
  notes: z.string().min(1).optional(),
})

export const hymnStorySchema = z.object({
  songSlug: z.string().min(1),
  title: z.string().min(1),
  bodyMd: z.string().min(100), // articles are real prose, not stubs
  sources: z.array(z.string().min(1)).min(1),
  rights: theologyRightsSchema,
})

export const memoryVerseSchema = z.object({
  id: z.string().min(1),
  ref: z.string().min(1),
  text: z.string().min(10),
  theme: z.array(z.string().min(1)).min(1),
  rights: theologyRightsSchema,
})

export const verseCollectionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  verseIds: z.array(z.string().min(1)).min(1),
})

export const catechismSectionSchema = z.object({
  id: z.string().min(1),
  part: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  title: z.string().min(1),
  intro: z.string().min(1).optional(),
  items: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(1),
  rights: theologyRightsSchema,
})

export const creedSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.array(z.string().min(1)).min(1),
  rights: theologyRightsSchema,
})

export const churchSeasonSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // 'Fargenavn (#RRGGBB)' — the hex is parsed out by SeasonCard.
  color: z.string().regex(/^.+\(#[0-9A-Fa-f]{6}\)$/),
  period: z.string().min(1),
  description: z.string().min(1),
  themes: z.array(z.string().min(1)).min(1),
  songSlugs: z.array(z.string().min(1)),
})

/** Validate all bundled content; throws (with zod details) on the first bad
 * item. Called eagerly below so a content typo fails tests/builds, not users. */
export function validateContent(): void {
  for (const s of hymnStories) hymnStorySchema.parse(s)
  for (const v of memoryVerses) memoryVerseSchema.parse(v)
  for (const c of verseCollections) verseCollectionSchema.parse(c)
  for (const k of catechismSections) catechismSectionSchema.parse(k)
  for (const c of creeds) creedSchema.parse(c)
  for (const s of churchSeasons) churchSeasonSchema.parse(s)

  // Collections may only reference verses that exist.
  const verseIds = new Set(memoryVerses.map((v) => v.id))
  for (const c of verseCollections) {
    for (const id of c.verseIds) {
      if (!verseIds.has(id)) {
        throw new Error(`VerseCollection '${c.id}' references unknown verse '${id}'`)
      }
    }
  }
  // NOTE: songSlug validity (stories + seasons vs seedSongs) is asserted in
  // content.test.ts, which imports seedSongs — kept out of the runtime path so
  // this module never pulls the heavy song docs into theology pages.
}

validateContent()

// ── Re-exports (single import point for the UI) ──────────────────────────────
export {
  hymnStories,
  memoryVerses,
  verseCollections,
  catechismSections,
  creeds,
  churchSeasons,
}

const STORY_BY_SLUG = new Map<string, HymnStory>(hymnStories.map((s) => [s.songSlug, s]))
const VERSE_BY_ID = new Map<string, MemoryVerse>(memoryVerses.map((v) => [v.id, v]))
const COLLECTION_BY_ID = new Map<string, VerseCollection>(verseCollections.map((c) => [c.id, c]))

/** The hymn story for a song slug, or null when the song has none. */
export function hymnStoryFor(slug: string): HymnStory | null {
  return STORY_BY_SLUG.get(slug) ?? null
}

/** One memory verse by id, or null. */
export function verseById(id: string): MemoryVerse | null {
  return VERSE_BY_ID.get(id) ?? null
}

/** The verses of a collection, in the collection's own order. Unknown
 * collection id → empty array. */
export function versesByCollection(id: string): MemoryVerse[] {
  const c = COLLECTION_BY_ID.get(id)
  if (!c) return []
  return c.verseIds.map((vid) => VERSE_BY_ID.get(vid)).filter((v): v is MemoryVerse => !!v)
}

/** All church-year seasons in calendar order (the authored order IS the
 * calendar order — advent first, domssøndag last). */
export function seasonsInOrder(): ChurchSeason[] {
  return churchSeasons
}

/** Parse a season colour string 'Navn (#RRGGBB)' into its parts. */
export function seasonColorParts(color: string): { name: string; hex: string } {
  const m = color.match(/^(.+)\s*\((#[0-9A-Fa-f]{6})\)$/)
  if (!m) return { name: color, hex: '#888888' }
  return { name: m[1].trim(), hex: m[2] }
}

// Convenience type re-exports so pages can import everything from one place.
export type {
  CatechismSection,
  ChurchSeason,
  Creed,
  HymnStory,
  MemoryVerse,
  VerseCollection,
}
