// ── Piano arrangement generator (pure, deterministic) ────────────────────────
//
// Turns a hand-written work source (melody + chords, see types/song-source.ts)
// into a complete playable SeedSong at three levels — same philosophy as the
// bassline generator: everything is a pure number transform, same output for
// the same input, no randomness.
//
//   1 Enkel      — melody untouched + LH root/fifth blocks, one per chord,
//                  held for the chord's duration (today's hand-written style).
//   2 Firstemmig — + an alto voice under the melody (nearest chord tone a
//                  third–sixth below the soprano, floor C4, max fourth leap)
//                  and a LH root-on-heavy / fifth-on-light beat pattern.
//   3 Gospel     — LH plays the gospel voicing (voicingHint level 4) folded
//                  into F2–E4, one voicing held per chord; RH adds a fill tone
//                  (third or ninth) under long melody notes at chord changes.
//
// Guarantees BY CONSTRUCTION (given a validated source): the soprano line is
// the source melody, untouched; both hands are active with no gap > 2 beats;
// every arrangement passes validateSeedSong. src/data/songs.test.ts runs all
// generated arrangements through the full musical-quality invariants — that
// suite is the acceptance filter for this generator.
//
// NB: this module is in the seed script's import graph, so every relative
// VALUE import needs an explicit .ts extension (Node type-stripping).

import type { SeedSong, SongChord, SongNote } from '@/types/song'
import type { SongSource } from '@/types/song-source'
import { chordPitchClasses, pitchClass } from '../music.ts'
import { voicingHint } from '../voicing-hints.ts'
import { isHeavyBeat } from '../bass/bassline.ts'
import { validateSongSource } from '../song/format.ts'

export type ArrangementLevel = 1 | 2 | 3

export const ARRANGEMENT_STYLES: Record<ArrangementLevel, string> = {
  1: 'enkel',
  2: 'firstemmig',
  3: 'gospel',
}

export const ARRANGEMENT_LABELS: Record<ArrangementLevel, string> = {
  1: 'Enkel',
  2: 'Firstemmig',
  3: 'Gospel',
}

// Registers (MIDI). LH blocks/patterns live in F2–C4 like the hand-written
// arrangements; gospel voicings get up to E4 (they carry colour tones).
const LH_LOW = 41 // F2
const LH_HIGH = 60 // C4
const GOSPEL_HIGH = 64 // E4
// Roots are capped so root + fifth stays ≤ C4.
const LH_ROOT_HIGH = 53 // F3
// Register anchor for LH roots — reproduces the hand-written voicings
// (F→F2+C3, Bb→Bb2+F3, C→C3+G3, G→G2+D3).
const LH_ANCHOR = 46 // Bb2

const ALTO_FLOOR = 60 // C4
const FILL_FLOOR = 62 // D4
const MAX_ALTO_LEAP = 5 // a fourth
const EPS = 1e-6

/** Semitone interval of the chord's third above the root (minor for m/dim). */
function thirdInterval(q: string): number {
  return (q.startsWith('m') && !q.startsWith('maj')) || q.startsWith('dim') ? 3 : 4
}

/** Semitone interval of the chord's fifth above the root (dim ♭5, aug ♯5). */
function fifthInterval(q: string): number {
  if (q.startsWith('dim') || q === 'm7b5') return 6
  if (q === 'aug') return 8
  return 7
}

/** The pitch of pitch-class `pc` in the octave nearest `anchor`, inside
 * [low, high]. Deterministic: on an exact tie the LOWER octave wins. */
function nearestPitchInRange(pc: number, low: number, high: number, anchor: number): number {
  const cls = pitchClass(pc)
  let best = -1
  let bestDist = Infinity
  for (let p = cls; p <= 127; p += 12) {
    if (p < low || p > high) continue
    const d = Math.abs(p - anchor)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

/** Fold a pitch into [low, high] by octave shifts (needs high − low ≥ 11). */
function foldInto(p: number, low: number, high: number): number {
  let x = p
  while (x > high) x -= 12
  while (x < low) x += 12
  return x
}

/** The chord governing beat `t` (last chord whose span contains it). */
function chordAt(chords: SongChord[], t: number): SongChord | null {
  let found: SongChord | null = null
  for (const c of chords) {
    if (c.t <= t + EPS) found = c
    else break
  }
  return found
}

/** LH root pitch for a chord: the written slash bass when present, else the
 * root, voiced in the octave nearest the hand-written-arrangement anchor. */
function lhRoot(c: SongChord): number {
  return nearestPitchInRange(c.b ?? c.r, LH_LOW, LH_ROOT_HIGH, LH_ANCHOR)
}

/** Whole-beat grid inside a chord's span (chords start on whole beats; a
 * fractional tail extends the last note) — mirrors the bassline generator. */
function beatGrid(c: SongChord): number[] {
  const out: number[] = []
  for (let b = 0; b < c.d - EPS; b += 1) out.push(c.t + b)
  return out.length > 0 ? out : [c.t]
}

const note = (p: number, t: number, d: number, h: 'L' | 'R'): SongNote => ({ p, t, d, h })

// ── Level 1: LH root/fifth blocks ────────────────────────────────────────────

function blockLeftHand(chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    const root = lhRoot(c)
    const fifth = foldInto(root + fifthInterval(c.q), LH_LOW, LH_HIGH)
    out.push(note(root, c.t, c.d, 'L'))
    if (fifth !== root) out.push(note(fifth, c.t, c.d, 'L'))
  }
  return out
}

// ── Level 2: LH root (heavy beats) / fifth (light beats) ────────────────────

function walkingLeftHand(
  chords: SongChord[],
  beatsPerBar: number,
  pickupBeats: number,
): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    const root = lhRoot(c)
    const fifth = foldInto(root + fifthInterval(c.q), LH_LOW, LH_HIGH)
    const grid = beatGrid(c)
    const chordEnd = c.t + c.d
    for (let j = 0; j < grid.length; j++) {
      const dur = j < grid.length - 1 ? grid[j + 1] - grid[j] : chordEnd - grid[j]
      const heavy = isHeavyBeat(grid[j], beatsPerBar, pickupBeats)
      out.push(note(heavy ? root : fifth, grid[j], dur, 'L'))
    }
  }
  return out
}

// ── Level 2: alto voice ──────────────────────────────────────────────────────
// For each melody note (skipping values shorter than half a beat — the alto
// holds through those), pick the chord tone nearest below the soprano within
// a third–sixth, never ≥ the soprano, floor C4, and never leaping more than a
// fourth from the previous alto tone (otherwise the next-nearest candidate).

function altoVoice(melody: SongNote[], chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  let prevPitch: number | null = null

  const extendThrough = (m: SongNote) => {
    const last = out[out.length - 1]
    if (last && Math.abs(last.t + last.d - m.t) < EPS) last.d += m.d
  }

  for (const m of melody) {
    if (m.d < 0.5 - EPS) {
      extendThrough(m) // too short for a new alto tone — hold the previous one
      continue
    }
    const chord = chordAt(chords, m.t)
    if (!chord) {
      extendThrough(m)
      continue
    }
    const pcs = new Set(chordPitchClasses(chord.r, chord.q))

    // Candidates ordered nearest-to-the-soprano first (highest first).
    const hi = m.p - 3 // at least a third below
    const lo = Math.max(ALTO_FLOOR, m.p - 9) // at most a sixth below, floor C4
    const candidates: number[] = []
    for (let p = hi; p >= lo; p--) if (pcs.has(pitchClass(p))) candidates.push(p)
    if (candidates.length === 0) {
      // No chord tone in the window (melody close to the C4 floor): take the
      // nearest chord tone below the soprano that still respects the floor.
      for (let p = m.p - 1; p >= ALTO_FLOOR; p--) {
        if (pcs.has(pitchClass(p))) {
          candidates.push(p)
          break
        }
      }
    }
    if (candidates.length === 0) {
      extendThrough(m) // soprano sits on/near the floor — hold instead
      continue
    }

    const prev = prevPitch // break the pick → prevPitch inference cycle
    const within: number | undefined =
      prev === null ? candidates[0] : candidates.find((p) => Math.abs(p - prev) <= MAX_ALTO_LEAP)
    const pick: number =
      within ??
      candidates.reduce((a, b) => (Math.abs(b - prev!) < Math.abs(a - prev!) ? b : a))

    out.push(note(pick, m.t, m.d, 'R'))
    prevPitch = pick
  }
  return out
}

// ── Level 3: gospel LH voicings + RH fill tones ──────────────────────────────

function gospelLeftHand(chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    // Keep the voicing's pitch classes, move octaves into the LH register.
    const folded = [...new Set(voicingHint(c, 4).map((p) => foldInto(p, LH_LOW, GOSPEL_HIGH)))]
      .sort((a, b) => a - b)
    for (const p of folded) out.push(note(p, c.t, c.d, 'L'))
  }
  return out
}

/** A fill tone (third or ninth of the chord) under the melody at chord changes
 * where the melody note lasts ≥ 2 beats. Held as long as the melody note. */
function gospelFills(melody: SongNote[], chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    const m = melody.find((n) => Math.abs(n.t - c.t) < EPS)
    if (!m || m.d < 2 - EPS) continue
    const fillPcs = [pitchClass(c.r + thirdInterval(c.q)), pitchClass(c.r + 2)]
    let best = -1
    for (const pc of fillPcs) {
      for (let p = m.p - 1; p >= FILL_FLOOR; p--) {
        if (pitchClass(p) === pc) {
          if (p > best) best = p
          break
        }
      }
    }
    if (best > 0) out.push(note(best, c.t, m.d, 'R'))
  }
  return out
}

// ── Assembly ─────────────────────────────────────────────────────────────────

/** Stable note order — same convention as the hand-written seed files. */
function sortNotes(notes: SongNote[]): SongNote[] {
  return [...notes].sort(
    (a, b) => a.t - b.t || (a.h === b.h ? a.p - b.p : a.h === 'L' ? -1 : 1),
  )
}

/**
 * Generate the complete SeedSong for a work source at a level. Pure and
 * deterministic — validates the source first (throws with a readable message
 * on a bad source). Slugs: `{work}` (1), `{work}-firstemmig` (2),
 * `{work}-gospel` (3); every variant shares `work_slug`.
 */
export function generatePianoArrangement(source: SongSource, level: ArrangementLevel): SeedSong {
  const src = validateSongSource(source)
  const melody = sortNotes(src.melody)
  const chords = [...src.chords].sort((a, b) => a.t - b.t)

  let notes: SongNote[]
  switch (level) {
    case 1:
      notes = sortNotes([...melody, ...blockLeftHand(chords)])
      break
    case 2:
      notes = sortNotes([
        ...melody,
        ...altoVoice(melody, chords),
        ...walkingLeftHand(chords, src.beatsPerBar, src.pickupBeats),
      ])
      break
    case 3:
      notes = sortNotes([...melody, ...gospelFills(melody, chords), ...gospelLeftHand(chords)])
      break
  }

  const style = ARRANGEMENT_STYLES[level]
  const label = ARRANGEMENT_LABELS[level]
  return {
    slug: level === 1 ? src.slug : `${src.slug}-${style}`,
    work_slug: src.slug,
    // The label only carries information when the work has several variants.
    variant_label: level === 1 && src.levels.length === 1 ? null : label,
    title: src.title,
    subtitle: src.subtitle,
    tradition: src.tradition,
    difficulty: level,
    original_key: src.original_key,
    mode: src.mode,
    default_bpm: src.default_bpm,
    arrangement_style: style,
    doc: {
      formatVersion: 1,
      timeSignature: src.timeSignature,
      beatsPerBar: src.beatsPerBar,
      pickupBeats: src.pickupBeats,
      totalBeats: src.totalBeats,
      keySignature: src.keySignature,
      sections: src.sections,
      notes,
      chords,
    },
    rights: {
      ...src.rights,
      notes: [src.rights.notes, `Generert ${label}-sats.`].filter(Boolean).join(' '),
    },
    tags: src.tags,
  }
}
