import type { Song, SongMeta, SeedSong } from '@/types/song'
import { seedSongs } from '@/data/songs'
import { createClient } from './supabase/client'

// ── Song data loader ─────────────────────────────────────────────────────────
// Same shape as SundayLicks' lib/licks.ts, adapted to full songs. Reads the
// published rows from Supabase (`school.songs`) when the env is configured, and
// otherwise (or on any error / empty table) falls back to the bundled seed
// library so the app is always functional in dev and degrades gracefully in
// production. Listing never loads the heavy `doc` column — only the single-song
// fetch does.

// Every library-metadata column EXCEPT the heavy `doc` jsonb. Kept in sync with
// the SongMeta type (= Omit<Song, 'doc'>).
const META_COLUMNS =
  'id, slug, work_slug, variant_label, title, subtitle, tradition, difficulty, original_key, mode, default_bpm, arrangement_style, rights, tags, status, created_at'

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

export const FALLBACK_SONGS: Song[] = seedSongs.map(seedToSong)
export const FALLBACK_META: SongMeta[] = FALLBACK_SONGS.map(toMeta)

// Small client-side cache so navigating back to the library doesn't refetch.
let metaCache: SongMeta[] | null = null
let metaInFlight: Promise<SongMeta[]> | null = null

/**
 * Load all published songs as lightweight metadata (no `doc`). Cached for the
 * session. Reads from Supabase when configured, otherwise the bundled seeds.
 */
export async function fetchSongs(): Promise<SongMeta[]> {
  if (metaCache) return metaCache
  if (metaInFlight) return metaInFlight

  metaInFlight = (async () => {
    const supabase = createClient()
    if (!supabase) return FALLBACK_META
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(META_COLUMNS)
        .eq('status', 'published')
        .order('difficulty', { ascending: true })
        .order('title', { ascending: true })
      if (error || !data || data.length === 0) return FALLBACK_META
      return data as unknown as SongMeta[]
    } catch {
      return FALLBACK_META
    }
  })()

  try {
    metaCache = await metaInFlight
    return metaCache
  } finally {
    metaInFlight = null
  }
}

/** Load a single published song (incl. `doc`) by slug, with seed fallback. */
export async function fetchSong(slug: string): Promise<Song | null> {
  const fallback = FALLBACK_SONGS.find((s) => s.slug === slug) ?? null
  const supabase = createClient()
  if (!supabase) return fallback
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !data) return fallback
    return data as unknown as Song
  } catch {
    return fallback
  }
}
