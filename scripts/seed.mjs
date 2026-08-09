// Seed / upsert the curated songs into `school.songs`.
//
//   npm run seed                (loads .env.local; needs SUPABASE_SERVICE_ROLE_KEY)
//   npm run seed -- --dry-run   (validates + prints the plan, writes NOTHING)
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
//
// Two editorial rules this script must respect:
//
//   1. `status` is NOT part of the upsert payload. The column defaults to
//      'published' on INSERT, and PostgREST's ON CONFLICT DO UPDATE only
//      touches the columns present in the payload — so a row an editor has
//      taken down ("sett til draft", e.g. a kontroller-melodi awaiting hymnal
//      QA) stays down across re-seeds instead of being silently republished.
//   2. Songs REMOVED from src/data/songs are withdrawn, not orphaned: any DB
//      row whose slug is no longer in the seed set is set to status='draft'.
//      Rows are never deleted — practice progress and links keep their target,
//      and an editor can republish by hand.

import { createClient } from '@supabase/supabase-js'
import { seedSongs } from '../src/data/songs/index.ts'
import { validateSeedSong } from '../src/lib/song/format.ts'

const dryRun = process.argv.includes('--dry-run')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  const msg = '✗ Mangler NEXT_PUBLIC_SUPABASE_URL og/eller SUPABASE_SERVICE_ROLE_KEY i .env.local'
  if (!dryRun) {
    console.error(msg)
    process.exit(1)
  }
  console.warn(`${msg} — tørrkjøringen validerer bare lokalt (ingen DB-oppslag).`)
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
    work_slug: valid.work_slug,
    variant_label: valid.variant_label,
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
    // NB: no `status` — see rule 1 in the header.
  })
}

const seedSlugs = new Set(rows.map((r) => r.slug))
if (seedSlugs.size !== rows.length) {
  console.error('✗ Duplikate slugs i seed-settet — avbryter før DB-skriving.')
  process.exit(1)
}

if (!url || !serviceKey) {
  // Dry run without credentials: report what we validated and stop.
  printPlan(rows, null)
  process.exit(0)
}

const supabase = createClient(url, serviceKey, {
  db: { schema: 'school' },
  auth: { persistSession: false },
})

/** All (slug, status) pairs in the table. Paged explicitly: PostgREST silently
 * caps an unfiltered SELECT at `max_rows`, so a single unbounded read would
 * quietly under-report the table once the library outgrows the cap — and a
 * missing slug here reads as "nothing to withdraw". */
async function fetchAllRows() {
  const PAGE = 500
  const out = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('songs')
      .select('slug,status')
      .order('slug', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...data)
    if (data.length < PAGE) return out
  }
}

let existing
try {
  existing = await fetchAllRows()
} catch (err) {
  console.error('✗ Klarte ikke lese eksisterende slugs:', err instanceof Error ? err.message : err)
  process.exit(1)
}

// Rows in the DB that the seed set no longer knows about, and that are still
// published → these get withdrawn (status='draft'), never deleted.
const toWithdraw = existing
  .filter((r) => !seedSlugs.has(r.slug) && r.status !== 'draft')
  .map((r) => r.slug)

if (dryRun) {
  printPlan(rows, { existing, toWithdraw })
  process.exit(0)
}

const { error } = await supabase.from('songs').upsert(rows, { onConflict: 'slug' })
if (error) {
  console.error('✗ Upsert feilet:', error.message)
  process.exit(1)
}

console.log(`✓ Seedet ${rows.length} sanger til school.songs`)

if (toWithdraw.length > 0) {
  // Chunked: `.in()` becomes a query-string filter, so one giant list would
  // blow the URL length limit rather than fail loudly.
  for (let i = 0; i < toWithdraw.length; i += 100) {
    const { error: wErr } = await supabase
      .from('songs')
      .update({ status: 'draft' })
      .in('slug', toWithdraw.slice(i, i + 100))
    if (wErr) {
      console.error('✗ Tilbaketrekking feilet:', wErr.message)
      process.exit(1)
    }
  }
  console.log(`↓ Trakk tilbake ${toWithdraw.length} sang(er) som ikke lenger finnes i seed-settet:`)
  for (const slug of toWithdraw) console.log(`   - ${slug} → status='draft'`)
} else {
  console.log('↓ Ingen sanger å trekke tilbake')
}

/** Print what a real run would do. `db` is null when no credentials were
 * available (local-only validation). */
function printPlan(rowsToWrite, db) {
  console.log(`TØRRKJØRING — ingenting skrives.\n`)
  console.log(`Validerte ${rowsToWrite.length} sanger (zod + docInvariants).`)
  console.log(`Kolonner per rad: ${Object.keys(rowsToWrite[0] ?? {}).join(', ')}`)
  console.log(`  (status utelatt med vilje → INSERT bruker default 'published',`)
  console.log(`   UPDATE lar en manuelt satt 'draft' stå.)\n`)

  if (!db) {
    console.log('Ingen DB-tilkobling → kan ikke vise upsert-/tilbaketrekkings-plan.')
    return
  }

  const known = new Set(db.existing.map((r) => r.slug))
  const inserts = rowsToWrite.filter((r) => !known.has(r.slug)).map((r) => r.slug)
  const updates = rowsToWrite.filter((r) => known.has(r.slug)).map((r) => r.slug)
  const draftsKept = db.existing
    .filter((r) => r.status === 'draft' && seedSlugs.has(r.slug))
    .map((r) => r.slug)

  console.log(`DB har ${db.existing.length} rader.`)
  console.log(`INSERT (nye): ${inserts.length}`)
  for (const s of inserts) console.log(`   + ${s}`)
  console.log(`UPDATE (finnes fra før): ${updates.length}`)
  console.log(`Beholder 'draft' (redaktør har tatt dem ned): ${draftsKept.length}`)
  for (const s of draftsKept) console.log(`   = ${s} (blir IKKE republisert)`)
  console.log(`Tilbaketrekking (i DB, ikke i seed-settet): ${db.toWithdraw.length}`)
  for (const s of db.toWithdraw) console.log(`   - ${s} → status='draft'`)
}
