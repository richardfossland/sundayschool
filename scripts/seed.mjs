// Seed / upsert the curated songs into `school.songs`.
//
//   npm run seed        (loads .env.local; needs SUPABASE_SERVICE_ROLE_KEY)
//
// The service role bypasses RLS, so this is the ONLY writer to the table. Data
// comes from src/data/songs/index.ts (the single source of truth) and is
// validated with the SAME zod schema + structural invariants the future
// submission/import flow uses (validateSeedSong). Requires Node ≥ 22 (built-in
// TypeScript type stripping to import the .ts modules directly).
//
// Denormalised columns (title/subtitle/tradition/difficulty/original_key/mode/
// default_bpm/arrangement_style/tags) live alongside the heavy `doc` (jsonb) and
// `rights` (jsonb) so library listing never loads the score.

import { createClient } from '@supabase/supabase-js'
import { seedSongs } from '../src/data/songs/index.ts'
import { validateSeedSong } from '../src/lib/song/format.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('✗ Mangler NEXT_PUBLIC_SUPABASE_URL og/eller SUPABASE_SERVICE_ROLE_KEY i .env.local')
  process.exit(1)
}

// Validate every song before touching the DB. validateSeedSong throws on the
// first failing song (zod shape or SongDoc invariants) with a readable message.
const rows = []
for (const song of seedSongs) {
  let valid
  try {
    valid = validateSeedSong(song)
  } catch (err) {
    console.error(`✗ Ugyldig sang "${song?.slug ?? '(ukjent)'}":`)
    console.error(`   ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
  rows.push({
    slug: valid.slug,
    title: valid.title,
    subtitle: valid.subtitle,
    tradition: valid.tradition,
    difficulty: valid.difficulty,
    original_key: valid.original_key,
    mode: valid.mode,
    default_bpm: valid.default_bpm,
    arrangement_style: valid.arrangement_style,
    doc: valid.doc,
    rights: valid.rights,
    tags: valid.tags,
    status: 'published',
  })
}

const supabase = createClient(url, serviceKey, {
  db: { schema: 'school' },
  auth: { persistSession: false },
})

const { error } = await supabase.from('songs').upsert(rows, { onConflict: 'slug' })
if (error) {
  console.error('✗ Upsert feilet:', error.message)
  process.exit(1)
}

console.log(`✓ Seedet ${rows.length} sanger til school.songs`)
