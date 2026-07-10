// ── Local MIDI import (browser-only, no network) ─────────────────────────────
//
// Turns a user-supplied `.mid`/`.midi` File into a best-effort SongDoc/Song so a
// learner can practise their own music. Everything runs in the browser via
// @tonejs/midi — the file's contents NEVER leave the device (no fetch/upload).
//
// Heuristics (best-effort, deliberately conservative):
//   • L/R hand split at the C4-ish pitch median (melody up, accompaniment down);
//   • onsets/durations quantised to the nearest 1/4 beat, with a triplet snap
//     when a note sits closer to a 1/3 subdivision;
//   • sections auto-cut every 8 bars;
//   • key signature from the MIDI meta, else 'C'.
//
// The generated doc is validated with the same songDocSchema the seed library
// uses, so a malformed import surfaces readable problems instead of a broken
// player. The pure helpers are unit-tested; the File entry point is exercised in
// the browser.

import { Midi } from '@tonejs/midi'
import type { Hand, Song, SongDoc, SongNote, SongSection } from '@/types/song'
import { pitchClass } from './music'
import { parseKeySignature } from './spelling'
import { songDocSchema, docInvariants } from './song/format'

const QUARTER = 0.25 // finest straight grid (a 1/4 of a beat = a 16th note)
const TRIPLET = 1 / 3 // eighth-note triplet subdivision of a beat

/**
 * Quantise a beat position to the nearest 1/4-beat grid, but snap to the nearest
 * triplet subdivision instead when the raw value lands meaningfully closer to it
 * (so swung/triplet feels aren't flattened onto the straight grid).
 */
export function quantizeBeat(raw: number): number {
  const straight = Math.round(raw / QUARTER) * QUARTER
  const triplet = Math.round(raw / TRIPLET) * TRIPLET
  const dStraight = Math.abs(raw - straight)
  const dTriplet = Math.abs(raw - triplet)
  // Prefer the straight grid unless the triplet is clearly closer.
  return dTriplet + 1e-9 < dStraight ? triplet : straight
}

/** Which hand a pitch belongs to, given a split point near C4. */
export function splitHand(pitch: number, splitPoint: number): Hand {
  return pitch >= splitPoint ? 'R' : 'L'
}

/** Median of a numeric list (0 for an empty list). */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

/** The C4-ish split point: the pitch median, clamped to a sane vocal-ish band. */
export function splitPointFor(pitches: number[]): number {
  if (pitches.length === 0) return 60
  const m = Math.round(median(pitches))
  return Math.min(67, Math.max(52, m)) // G3..G4 around middle C
}

/** Auto sections tiling [0, totalBeats] every `barsPerSection` bars, exactly. */
export function autoSections(totalBeats: number, beatsPerBar: number, barsPerSection = 8): SongSection[] {
  const span = Math.max(1, beatsPerBar) * barsPerSection
  const sections: SongSection[] = []
  let start = 0
  let n = 1
  while (start < totalBeats - 1e-6) {
    const end = Math.min(start + span, totalBeats)
    sections.push({ id: `s${n}`, kind: 'verse', label: `Del ${n}`, startBeat: start, endBeat: end })
    start = end
    n++
  }
  // A song shorter than one section still needs one covering [0, totalBeats].
  if (sections.length === 0) {
    sections.push({ id: 's1', kind: 'verse', label: 'Del 1', startBeat: 0, endBeat: totalBeats })
  }
  return sections
}

/** Map a MIDI meta key signature (key + scale) to our keySignature string. */
export function midiKeyToSignature(key: string | undefined, scale: string | undefined): string {
  if (!key || !/^[A-Ga-g][#b]?$/.test(key)) return 'C'
  const letter = key[0].toUpperCase() + key.slice(1)
  return scale === 'minor' ? letter.toLowerCase() : letter
}

export type MidiImportResult =
  | { ok: true; song: Song }
  | { ok: false; error: string; problems?: string[] }

/**
 * Parse a MIDI File into an in-memory Song (slug 'egen-midi'). Pure client-side:
 * the ArrayBuffer is read locally and never sent anywhere.
 */
export async function importMidiFile(file: File): Promise<MidiImportResult> {
  let midi: Midi
  try {
    const buf = await file.arrayBuffer()
    midi = new Midi(buf)
  } catch {
    return { ok: false, error: 'Kunne ikke lese MIDI-filen. Er den en gyldig .mid/.midi-fil?' }
  }

  const ppq = midi.header.ppq || 480
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 100)

  // Time signature → string + quarter-note beats per bar (6/8 → 3 quarter beats).
  const ts = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4]
  const [tsNum, tsDen] = [ts[0] || 4, ts[1] || 4]
  const timeSignature = `${tsNum}/${tsDen}`
  const beatsPerBar = Math.max(1, tsNum * (4 / tsDen))

  const ks = midi.header.keySignatures[0]
  const keySignature = midiKeyToSignature(ks?.key, ks?.scale)

  // Gather every note across all tracks, in quarter-note beats.
  const raw: { p: number; t: number; d: number; v: number }[] = []
  for (const track of midi.tracks) {
    for (const n of track.notes) {
      raw.push({
        p: n.midi,
        t: n.ticks / ppq,
        d: Math.max(n.durationTicks / ppq, QUARTER),
        v: n.velocity,
      })
    }
  }

  if (raw.length === 0) {
    return { ok: false, error: 'Fant ingen toner i MIDI-filen.' }
  }

  const splitPoint = splitPointFor(raw.map((n) => n.p))

  const notes: SongNote[] = raw.map((n) => {
    const t = Math.max(0, quantizeBeat(n.t))
    const d = Math.max(QUARTER, quantizeBeat(n.d))
    return { p: n.p, t, d, h: splitHand(n.p, splitPoint), v: Math.min(1, Math.max(0.1, n.v || 0.8)) }
  })

  // Total length: round the last note-off up to a whole bar so sections tile.
  const lastEnd = notes.reduce((m, n) => Math.max(m, n.t + n.d), 0)
  const totalBeats = Math.max(beatsPerBar, Math.ceil(lastEnd / beatsPerBar) * beatsPerBar)

  const sections = autoSections(totalBeats, beatsPerBar)

  const doc: SongDoc = {
    formatVersion: 1,
    timeSignature,
    beatsPerBar,
    pickupBeats: 0,
    totalBeats,
    keySignature,
    sections,
    notes: notes.sort((a, b) => a.t - b.t || a.p - b.p),
    chords: [], // no chord detection in MVP import
  }

  const parsed = songDocSchema.safeParse(doc)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'MIDI-filen kunne ikke gjøres om til en gyldig sang.',
      problems: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    }
  }
  const problems = docInvariants(doc)
  if (problems.length > 0) {
    return { ok: false, error: 'MIDI-filen ga en sang med strukturfeil.', problems }
  }

  const { tonic, mode } = parseKeySignature(keySignature)
  const rawName = (midi.name || file.name.replace(/\.[^.]+$/, '') || 'Egen MIDI').trim()
  const title = rawName.slice(0, 80) || 'Egen MIDI'

  const song: Song = {
    id: 'egen-midi',
    slug: 'egen-midi',
    title,
    subtitle: 'Importert MIDI-fil',
    tradition: 'salme',
    difficulty: 1,
    original_key: pitchClass(tonic),
    mode,
    default_bpm: Math.min(300, Math.max(20, bpm)),
    arrangement_style: 'egen',
    doc,
    rights: {
      publicDomain: true,
      creators: [{ name: 'Ukjent', role: 'komponist', deathYear: null }],
      sources: ['Egen MIDI-fil (behandlet lokalt i nettleseren)'],
      verifiedAt: new Date().toISOString().slice(0, 10),
      notes: 'Importert lokalt — ikke publisert. Kontroller selv at innholdet er fritt å bruke.',
    },
    tags: ['egen-midi'],
    status: 'published',
  }

  return { ok: true, song }
}
