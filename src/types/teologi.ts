// ── Teologi domain types ──────────────────────────────────────────────────────
// The theology subject ("søndagsskole" for adults/youth) is bundled TS content —
// no audio, no DB in the MVP (see PLAN Arkitektur-beslutning 3). Every content
// piece carries a mandatory `rights` block, mirroring the songs' Rights audit
// trail so the whole library stays legally safe. All prose is Norwegian bokmål;
// code and comments are English.

/** Source/edition provenance carried by every theology content item. This is the
 * theology equivalent of the songs' `Rights` — the audit trail behind
 * /om-rettigheter. `source` is mandatory; the rest document editing/modernising. */
export interface TheologyRights {
  /** Where the content comes from, e.g. a translation, edition or the sources it
   * was written from. Always present. */
  source: string
  /** Specific edition/printing when relevant, e.g. 'Alterbok 1920'. */
  edition?: string
  /** True when historical orthography/wording was gently modernised by us. */
  modernized?: boolean
  /** Free-form provenance notes (uncertainties, editorial choices). */
  notes?: string
}

/** The story behind a hymn — an editorial article tied to one seed song by slug.
 * `bodyMd` is a markdown-lite string: blank-line-separated paragraphs, optional
 * `### ` subheadings (rendered by a tiny in-repo parser, not a full MD engine). */
export interface HymnStory {
  /** Must match a `seedSongs` slug — validated in content.ts / its test. */
  songSlug: string
  title: string
  /** Markdown-lite body: paragraphs split on blank lines; lines starting with
   * '### ' are subheadings. No other markdown is interpreted. */
  bodyMd: string
  /** Human-readable source citations shown at the foot of the article. */
  sources: string[]
  rights: TheologyRights
}

/** A single Bible verse to memorise. */
export interface MemoryVerse {
  /** Stable id used by SR state and collections, e.g. 'joh-3-16'. */
  id: string
  /** Scripture reference, e.g. 'Joh 3, 16'. */
  ref: string
  /** The verse text (Bibelen 1930 — public domain). */
  text: string
  /** Theme tags, matching VerseCollection groupings, e.g. ['frelse']. */
  theme: string[]
  rights: TheologyRights
}

/** A themed grouping of memory verses (the practice "decks"). */
export interface VerseCollection {
  id: string
  label: string
  description: string
  /** MemoryVerse ids — validated to exist in content.ts / its test. */
  verseIds: string[]
}

/** One part of Luther's Small Catechism (Q/A structure gives read- AND
 * quiz-mode for free). `part` 1–5: Ten Commandments, Creed, Lord's Prayer,
 * Baptism, Lord's Supper. */
export interface CatechismSection {
  id: string
  part: 1 | 2 | 3 | 4 | 5
  title: string
  intro?: string
  items: { q: string; a: string }[]
  rights: TheologyRights
}

/** A creed (apostolic / Nicene), stored as ordered paragraphs. */
export interface Creed {
  id: string
  title: string
  /** Paragraph-split text (each string is one paragraph/article). */
  text: string[]
  rights: TheologyRights
}

/** A season/period of the church year with its liturgical colour and links to
 * fitting seed songs. */
export interface ChurchSeason {
  id: string
  label: string
  /** Norwegian liturgical colour name + hex, e.g. 'Fiolett (#6B4E9E)'. */
  color: string
  /** When in the year, e.g. 'Fire søndager før jul'. */
  period: string
  description: string
  themes: string[]
  /** seedSongs slugs that fit the season — validated in content.ts / its test. */
  songSlugs: string[]
}
