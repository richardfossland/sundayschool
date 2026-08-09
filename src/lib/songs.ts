import type { Song, SongMeta, SeedSong } from '@/types/song'

// ── Song data loader ─────────────────────────────────────────────────────────
// Same shape as SundayLicks' lib/licks.ts, adapted to full songs. Reads the
// published rows from Supabase (`school.songs`) when the env is configured, and
// otherwise (or on any error / empty table) falls back to the bundled seed
// library so the app is always functional in dev and degrades gracefully in
// production. Listing never loads the heavy `doc` column — only the single-song
// fetch does.
//
// ── Why the seed import is DYNAMIC ───────────────────────────────────────────
// `@/data/songs` runs the arranger over the whole authored library: ~326 kB raw
// (79 kB gz) of note data, in the browser, at import time. A static import put
// all of it in the first load of every route that so much as listed song TITLES
// — the library pages, the setlist builder — even when Supabase answered and the
// seeds were never touched. It is now loaded ON THE FALLBACK PATH ONLY, so a
// configured production app never downloads it, and dev/degraded still work.
// The old synchronous `FALLBACK_META` / `FALLBACK_SONGS` exports are gone; on
// the server, import `seedSongs` from '@/data/songs' directly.

// Every library-metadata column EXCEPT the heavy `doc` jsonb. Kept in sync with
// the SongMeta type (= Omit<Song, 'doc'>).
const META_COLUMNS =
  'id, slug, work_slug, variant_label, title, subtitle, tradition, difficulty, original_key, mode, default_bpm, arrangement_style, rights, tags, status, created_at'

// The Supabase browser SDK is ~63 kB gz. Loaded on demand — and never at all
// when the env is not configured (the NEXT_PUBLIC_ reads are inlined at build
// time, so an unconfigured build never reaches the import).
async function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }
  const { createClient } = await import('./supabase/client')
  return createClient()
}

/** Synthesise a full Song from an authored SeedSong (DB supplies id/status in
 * production; here we mint stable stand-ins). */
function seedToSong(seed: SeedSong): Song {
  return { ...seed, id: `seed:${seed.slug}`, status: 'published' }
}

/** The listing view of a seed song — everything except `doc`. */
function toMeta(song: Song): SongMeta {
  // Structurally drop `doc` without keeping a reference to the big object.
  const { doc: _doc, ...meta } = song
  return meta
}

// The seed library, materialised at most once per session and only if some
// fallback path actually asks for it.
let seedPromise: Promise<Song[]> | null = null

function fallbackSongs(): Promise<Song[]> {
  if (!seedPromise) {
    seedPromise = import('@/data/songs').then((m) => m.seedSongs.map(seedToSong))
  }
  return seedPromise
}

async function fallbackMeta(): Promise<SongMeta[]> {
  return (await fallbackSongs()).map(toMeta)
}

// ── Session caches ───────────────────────────────────────────────────────────
// Both caches share one rule: a DEGRADED answer (network/API error, or an empty
// table where rows were expected) is served once but NEVER cached. Caching it
// would freeze the whole session on the seed library — a single dropped request
// on load and the learner sees the bundled songs until they reload the tab.
// A configured-but-genuinely-absent row, and the "no Supabase env at all" case,
// are stable facts and cache normally.

let metaCache: SongMeta[] | null = null
let metaInFlight: Promise<SongMeta[]> | null = null

async function loadMeta(): Promise<{ metas: SongMeta[]; degraded: boolean }> {
  const supabase = await getSupabase()
  if (!supabase) return { metas: await fallbackMeta(), degraded: false } // no env: stable
  try {
    const { data, error } = await supabase
      .from('songs')
      .select(META_COLUMNS)
      .eq('status', 'published')
      .order('difficulty', { ascending: true })
      .order('title', { ascending: true })
    if (error || !data || data.length === 0) return { metas: await fallbackMeta(), degraded: true }
    return { metas: data as unknown as SongMeta[], degraded: false }
  } catch {
    return { metas: await fallbackMeta(), degraded: true }
  }
}

/**
 * Load all published songs as lightweight metadata (no `doc`). Cached for the
 * session unless the answer was degraded. Reads from Supabase when configured,
 * otherwise the bundled seeds.
 */
export async function fetchSongs(): Promise<SongMeta[]> {
  if (metaCache) return metaCache
  if (metaInFlight) return metaInFlight

  const inFlight = loadMeta().then(({ metas, degraded }) => {
    if (!degraded) metaCache = metas
    return metas
  })
  metaInFlight = inFlight
  try {
    return await inFlight
  } finally {
    if (metaInFlight === inFlight) metaInFlight = null
  }
}

// slug → the in-flight/settled fetch. Lovsang mounts several widgets per entry,
// each of which needs the same full song; without this each one pulled its own
// copy of the heavy `doc` column.
const songCache = new Map<string, Promise<Song | null>>()

async function loadSong(slug: string): Promise<{ song: Song | null; degraded: boolean }> {
  // Resolved lazily so the happy path never pulls the seed library in.
  const fallback = async () => (await fallbackSongs()).find((s) => s.slug === slug) ?? null
  const supabase = await getSupabase()
  if (!supabase) return { song: await fallback(), degraded: false } // no env: stable
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error) return { song: await fallback(), degraded: true }
    if (!data) return { song: await fallback(), degraded: false } // genuinely not published
    return { song: data as unknown as Song, degraded: false }
  } catch {
    return { song: await fallback(), degraded: true }
  }
}

/** Load a single published song (incl. `doc`) by slug, with seed fallback.
 * De-duplicated per slug for the session (degraded answers are not kept). */
export function fetchSong(slug: string): Promise<Song | null> {
  const hit = songCache.get(slug)
  if (hit) return hit
  const p = loadSong(slug).then(({ song, degraded }) => {
    if (degraded) songCache.delete(slug)
    return song
  })
  songCache.set(slug, p)
  return p
}
