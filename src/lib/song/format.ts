import { z } from 'zod'
import type { SeedSong, SongDoc } from '@/types/song'
import type { SongSource } from '@/types/song-source'

// ── SongDoc validation ──────────────────────────────────────────────────────
// The zod schema is the single gatekeeper for song content: the seed script
// validates every curated song against it before upsert, and the local MIDI
// importer (fase 2) validates its generated docs the same way. Structural
// invariants that zod can't express declaratively live in `docInvariants`.

const handSchema = z.enum(['L', 'R'])

export const songNoteSchema = z.object({
  p: z.number().int().min(21).max(108), // piano range A0–C8
  t: z.number().min(0),
  d: z.number().positive(),
  h: handSchema,
  v: z.number().min(0).max(1).optional(),
  tie: z.boolean().optional(),
  finger: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
})

export const songChordSchema = z.object({
  t: z.number().min(0),
  d: z.number().positive(),
  r: z.number().int().min(0).max(11),
  q: z.string().max(8),
  b: z.number().int().min(0).max(11).optional(),
})

export const songSectionSchema = z.object({
  id: z.string().min(1).max(16),
  kind: z.enum(['intro', 'verse', 'refrain', 'chorus', 'bridge', 'ending']),
  label: z.string().min(1).max(40),
  startBeat: z.number().min(0),
  endBeat: z.number().positive(),
})

export const songDocSchema = z.object({
  formatVersion: z.literal(1),
  timeSignature: z.string().regex(/^\d{1,2}\/(1|2|4|8|16)$/),
  beatsPerBar: z.number().positive(),
  pickupBeats: z.number().min(0),
  totalBeats: z.number().positive(),
  keySignature: z.string().regex(/^[A-Ga-g][#b]?$/),
  sections: z.array(songSectionSchema).min(1),
  notes: z.array(songNoteSchema).min(1),
  chords: z.array(songChordSchema),
})

/** Structural invariants beyond per-field validation. Returns a list of
 * human-readable problems; empty list = valid. */
export function docInvariants(doc: SongDoc): string[] {
  const problems: string[] = []

  // Sections must tile [0, totalBeats] in order, without gaps or overlap.
  const sections = [...doc.sections].sort((a, b) => a.startBeat - b.startBeat)
  let cursor = 0
  for (const s of sections) {
    if (s.endBeat <= s.startBeat) problems.push(`seksjon ${s.id}: endBeat <= startBeat`)
    if (Math.abs(s.startBeat - cursor) > 1e-6)
      problems.push(`seksjon ${s.id}: starter på ${s.startBeat}, forventet ${cursor} (hull/overlapp)`)
    cursor = s.endBeat
  }
  if (Math.abs(cursor - doc.totalBeats) > 1e-6)
    problems.push(`seksjoner slutter på ${cursor}, totalBeats er ${doc.totalBeats}`)
  const ids = new Set(doc.sections.map((s) => s.id))
  if (ids.size !== doc.sections.length) problems.push('duplikate seksjons-id-er')

  // Notes and chords must lie within the song.
  for (const n of doc.notes) {
    if (n.t + n.d > doc.totalBeats + 1e-6)
      problems.push(`note p=${n.p} t=${n.t}: går forbi totalBeats`)
  }
  for (const c of doc.chords) {
    if (c.t + c.d > doc.totalBeats + 1e-6) problems.push(`akkord t=${c.t}: går forbi totalBeats`)
  }

  // Chords must be sorted and non-overlapping (the chord strip and
  // besifringsmodus both assume a monotone timeline).
  for (let i = 1; i < doc.chords.length; i++) {
    if (doc.chords[i].t < doc.chords[i - 1].t + doc.chords[i - 1].d - 1e-6)
      problems.push(`akkord ${i}: overlapper/usortert (t=${doc.chords[i].t})`)
  }

  // A tie must have a following note of the same pitch+hand to bind to.
  for (const n of doc.notes) {
    if (!n.tie) continue
    const target = doc.notes.find(
      (m) => m.p === n.p && m.h === n.h && Math.abs(m.t - (n.t + n.d)) < 1e-6,
    )
    if (!target) problems.push(`tie på p=${n.p} t=${n.t}: ingen påfølgende note å binde til`)
  }

  return problems
}

const slugSchema = z.string().regex(/^[a-z0-9-]{3,64}$/)

const rightsSchema = z.object({
  publicDomain: z.literal(true),
  creators: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.enum(['komponist', 'tekstforfatter', 'oversetter', 'kilde-arrangør']),
        deathYear: z.number().int().max(1955).nullable(), // double-PD rule: died before 1956
      }),
    )
    .min(1),
  sources: z.array(z.string().min(1)).min(1),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
})

export const seedSongSchema = z.object({
  slug: slugSchema,
  work_slug: slugSchema,
  variant_label: z.string().min(1).max(24).nullable(),
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120).nullable(),
  tradition: z.enum(['salme', 'hymne', 'spiritual', 'gospel', 'lovsang']),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  original_key: z.number().int().min(0).max(11),
  mode: z.enum(['major', 'minor']),
  default_bpm: z.number().int().min(20).max(300),
  arrangement_style: z.string().min(1).max(24),
  doc: songDocSchema,
  rights: rightsSchema,
  tags: z.array(z.string().min(1).max(24)),
})

/** Full validation for authored content: zod shape + structural invariants.
 * Throws with a readable message on the first failing song (seed-time). */
export function validateSeedSong(input: unknown): SeedSong {
  const song = seedSongSchema.parse(input) as SeedSong
  const problems = docInvariants(song.doc)
  if (problems.length > 0) {
    throw new Error(`SongDoc-invarianter feilet for "${song.slug}":\n- ${problems.join('\n- ')}`)
  }
  return song
}

// ── SongSource validation ───────────────────────────────────────────────────
// A source is the ONE hand-written description of a work (melody + chords +
// rights) that lib/arranger/piano-arrangement.ts turns into playable
// arrangements. The generator's output guarantees (melody untouched, both
// hands active, gaps ≤ 2 beats) only hold when the source itself is sound, so
// the source contract is validated here BEFORE any arranging happens.

const MELODY_LOW = 48 // C3 — matches songs.test.ts's singable-range invariant
const MELODY_HIGH = 84 // C6
const EPS = 1e-6

export const songSourceSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120).nullable(),
  tradition: z.enum(['salme', 'hymne', 'spiritual', 'gospel', 'lovsang']),
  original_key: z.number().int().min(0).max(11),
  mode: z.enum(['major', 'minor']),
  default_bpm: z.number().int().min(20).max(300),
  timeSignature: z.string().regex(/^\d{1,2}\/(1|2|4|8|16)$/),
  beatsPerBar: z.number().positive(),
  pickupBeats: z.number().min(0),
  totalBeats: z.number().positive(),
  keySignature: z.string().regex(/^[A-Ga-g][#b]?$/),
  sections: z.array(songSectionSchema).min(1),
  melody: z.array(songNoteSchema).min(1),
  chords: z.array(songChordSchema).min(1),
  rights: rightsSchema,
  tags: z.array(z.string().min(1).max(24)),
  levels: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).min(1),
})

/** Structural invariants for a work source. Empty list = valid. */
export function sourceInvariants(source: SongSource): string[] {
  // Sections/tie/overlap/range checks are shared with SongDoc — reuse them by
  // viewing the source as a doc whose notes are the melody.
  const problems = docInvariants({
    formatVersion: 1,
    timeSignature: source.timeSignature,
    beatsPerBar: source.beatsPerBar,
    pickupBeats: source.pickupBeats,
    totalBeats: source.totalBeats,
    keySignature: source.keySignature,
    sections: source.sections,
    notes: source.melody,
    chords: source.chords,
  })

  // Melody: right hand only, singable range, monophonic, no gap > 2 beats.
  const melody = [...source.melody].sort((a, b) => a.t - b.t)
  for (const n of melody) {
    if (n.h !== 'R') problems.push(`melodinote p=${n.p} t=${n.t}: h må være 'R'`)
    if (n.p < MELODY_LOW || n.p > MELODY_HIGH)
      problems.push(`melodinote p=${n.p} t=${n.t}: utenfor C3–C6`)
  }
  if (melody.length > 0 && melody[0].t > source.pickupBeats + 2 + EPS)
    problems.push(`melodien starter først på beat ${melody[0].t} (> pickup + 2)`)
  for (let i = 1; i < melody.length; i++) {
    const prev = melody[i - 1]
    if (melody[i].t < prev.t + prev.d - EPS)
      problems.push(`melodinote t=${melody[i].t}: overlapper forrige (ikke monofon)`)
    if (melody[i].t > prev.t + prev.d + 2 + EPS)
      problems.push(`melodihull > 2 slag ved beat ${prev.t + prev.d}`)
  }

  // Chords: whole-beat starts (the LH patterns walk a per-beat grid), first
  // chord early enough for the LH to enter, no gap > 2 beats.
  const chords = [...source.chords].sort((a, b) => a.t - b.t)
  for (const c of chords) {
    if (!Number.isInteger(c.t)) problems.push(`akkord t=${c.t}: må starte på helt slag`)
  }
  if (chords.length > 0 && chords[0].t > source.pickupBeats + 2 + EPS)
    problems.push(`første akkord først på beat ${chords[0].t} (> pickup + 2)`)
  for (let i = 1; i < chords.length; i++) {
    const prev = chords[i - 1]
    if (chords[i].t > prev.t + prev.d + 2 + EPS)
      problems.push(`akkordhull > 2 slag ved beat ${prev.t + prev.d}`)
  }

  // Levels must be unique (each generates one arrangement slug).
  if (new Set(source.levels).size !== source.levels.length)
    problems.push('duplikate nivåer i levels')

  return problems
}

/** Full validation for a work source: zod shape + structural invariants. */
export function validateSongSource(input: unknown): SongSource {
  const source = songSourceSchema.parse(input) as SongSource
  const problems = sourceInvariants(source)
  if (problems.length > 0) {
    throw new Error(
      `SongSource-invarianter feilet for "${source.slug}":\n- ${problems.join('\n- ')}`,
    )
  }
  return source
}
