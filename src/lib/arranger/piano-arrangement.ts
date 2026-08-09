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
// The LEFT HAND rests through the pickup (opptakt) at every level — a band
// does not play an accompaniment block under an anacrusis, and the melody alone
// carries the lead-in.
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
// Fills sit ABOVE the gospel LH register, so a fill can never double or
// undercut the top of the voicing it is meant to colour.
const FILL_FLOOR = GOSPEL_HIGH + 1 // F4
const MAX_ALTO_LEAP = 5 // a fourth (a soft target — see altoVoice)
/** Minimum distance between the alto/fill and the soprano, in semitones. */
const MIN_UNDER_MELODY = 3
/** Minimum distance between two simultaneous voices of a gospel LH voicing. */
const MIN_VOICE_GAP = 3
const EPS = 1e-6

// NB: this module never computes a "third" by interval any more. A hard-coded
// major/minor third told sus4/sus2/5 chords they had a third they do not have,
// so the chord's own spelling (chordPitchClasses) is the single source of truth
// for chord tones here — see gospelFills.

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

/** The chord governing beat `t` (last chord whose span contains it). */
function chordAt(chords: SongChord[], t: number): SongChord | null {
  let found: SongChord | null = null
  for (const c of chords) {
    if (c.t <= t + EPS) found = c
    else break
  }
  return found
}

/** LH bass pitch for a chord: the written slash bass when present, else the
 * root, voiced in the octave nearest the hand-written-arrangement anchor. The
 * bass note is the BOTTOM of the left hand — the chord's own tones are voiced
 * above it (see lhUpper). */
function lhBass(c: SongChord): number {
  return nearestPitchInRange(c.b ?? c.r, LH_LOW, LH_ROOT_HIGH, LH_ANCHOR)
}

/** The upper LH tone over a bass note: the chord's fifth, or — when the bass IS
 * the fifth (C/G) or the fifth will not fit the register — the chord's root.
 * Both are ALWAYS measured from the chord root, never from a slash bass: C/E is
 * still C–E–G, so its fifth is G, not the B a fifth above the E. */
function lhUpper(c: SongChord, bass: number): number | null {
  for (const pc of [pitchClass(c.r + fifthInterval(c.q)), pitchClass(c.r)]) {
    const p = bass + pitchClass(pc - bass) // nearest instance at/above the bass
    if (p !== bass && p <= LH_HIGH) return p
  }
  return null
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
    const bass = lhBass(c)
    const upper = lhUpper(c, bass)
    out.push(note(bass, c.t, c.d, 'L'))
    if (upper !== null) out.push(note(upper, c.t, c.d, 'L'))
  }
  return out
}

// ── Level 2: LH bass (heavy beats) / fifth (light beats) ────────────────────

function walkingLeftHand(
  chords: SongChord[],
  beatsPerBar: number,
  pickupBeats: number,
): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    const bass = lhBass(c)
    const upper = lhUpper(c, bass)
    const grid = beatGrid(c)
    const chordEnd = c.t + c.d
    for (let j = 0; j < grid.length; j++) {
      const dur = j < grid.length - 1 ? grid[j + 1] - grid[j] : chordEnd - grid[j]
      const heavy = isHeavyBeat(grid[j], beatsPerBar, pickupBeats)
      out.push(note(heavy || upper === null ? bass : upper, grid[j], dur, 'L'))
    }
  }
  return out
}

// ── Level 2: alto voice ──────────────────────────────────────────────────────
// For each melody note (skipping values shorter than half a beat — the alto
// holds through those), pick the chord tone nearest below the soprano within a
// third–sixth, floor C4. HARD rules: the alto is a chord tone, it never comes
// closer than a minor third under the soprano (MIN_UNDER_MELODY) — including
// while it is held through later melody notes — and it never sits above it.
// The max-fourth leap is a SOFT target: when no candidate is within reach we
// hold the previous tone (if it is still legal) or leave the alto silent for
// that note rather than break a hard rule.

function altoVoice(melody: SongNote[], chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  let prevPitch: number | null = null

  /** Is `p` a legal alto tone under melody note `m` for chord tones `pcs`? */
  const legal = (p: number, m: SongNote, pcs: Set<number>) =>
    p >= ALTO_FLOOR && p <= m.p - MIN_UNDER_MELODY && pcs.has(pitchClass(p))

  /** Hold the previous alto tone through `m` — only when it stays legal under
   * the NEW melody note (a held alto must never crowd or top the soprano). */
  const extendThrough = (m: SongNote) => {
    const last = out[out.length - 1]
    if (!last || Math.abs(last.t + last.d - m.t) >= EPS) return
    if (last.p > m.p - MIN_UNDER_MELODY) return
    last.d += m.d
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
    const hi = m.p - MIN_UNDER_MELODY // at least a third below
    const lo = Math.max(ALTO_FLOOR, m.p - 9) // at most a sixth below, floor C4
    const candidates: number[] = []
    for (let p = hi; p >= lo; p--) if (pcs.has(pitchClass(p))) candidates.push(p)
    if (candidates.length === 0) {
      // No chord tone in the window (melody close to the C4 floor): take the
      // nearest chord tone that still keeps a third to the soprano and the floor.
      for (let p = hi; p >= ALTO_FLOOR; p--) {
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

    const prev: number | null = prevPitch // break the pick → prevPitch inference cycle
    const pick: number | undefined =
      prev === null ? candidates[0] : candidates.find((p) => Math.abs(p - prev) <= MAX_ALTO_LEAP)

    if (pick === undefined) {
      // Every chord tone in reach would break the leap rule. Hold the previous
      // tone when it is still legal here, otherwise stay silent for this note —
      // never leap further than a fourth, never crowd the soprano.
      if (prev !== null && legal(prev, m, pcs)) {
        const last = out[out.length - 1]
        if (last && Math.abs(last.t + last.d - m.t) < EPS && last.p === prev) last.d += m.d
        else out.push(note(prev, m.t, m.d, 'R'))
      }
      continue
    }

    out.push(note(pick, m.t, m.d, 'R'))
    prevPitch = pick
  }
  return out
}

// ── Level 3: gospel LH voicings + RH fill tones ──────────────────────────────

/** Every octave placement of `p`'s pitch class inside [low, high], ordered by
 * distance from `p` (nearest first; on a tie the LOWER octave wins). */
function octaveOptions(p: number, low: number, high: number): number[] {
  const out: number[] = []
  for (let x = pitchClass(p); x <= high; x += 12) if (x >= low) out.push(x)
  return out.sort((a, b) => Math.abs(a - p) - Math.abs(b - p) || a - b)
}

function gospelLeftHand(chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    // Keep the voicing's pitch classes, but choose the OCTAVE per voice: the
    // nearest one that keeps a minor third to every voice already placed.
    // Blind folding (foldInto) squeezed spread gospel voicings into semitone
    // clusters; the 9th — pure colour — is dropped when it cannot fit.
    const hint = voicingHint(c, 4)
    const placed: number[] = []
    hint.forEach((p, i) => {
      const isNinth = i === hint.length - 1
      const options = octaveOptions(p, LH_LOW, GOSPEL_HIGH)
      if (options.length === 0) return
      const clear = options.find((x) =>
        placed.every((q) => Math.abs(x - q) >= MIN_VOICE_GAP),
      )
      if (clear !== undefined) {
        placed.push(clear)
        return
      }
      if (isNinth) return // colour tone: drop it rather than build a cluster
      // A structural tone that collides everywhere: keep the most open octave.
      const best = options.reduce((a, b) =>
        Math.min(...placed.map((q) => Math.abs(b - q))) >
        Math.min(...placed.map((q) => Math.abs(a - q)))
          ? b
          : a,
      )
      if (!placed.includes(best)) placed.push(best)
    })
    for (const p of [...placed].sort((a, b) => a - b)) out.push(note(p, c.t, c.d, 'L'))
  }
  return out
}

/** A fill tone (the chord's characteristic third/fourth, or its ninth) under
 * the melody at chord changes where the melody note lasts ≥ 2 beats. Held as
 * long as the melody note. It must clear the gospel LH register (FILL_FLOOR)
 * and keep a minor third to the melody — a fill a semitone under a held melody
 * note is a clash, not a colour. */
function gospelFills(melody: SongNote[], chords: SongChord[]): SongNote[] {
  const out: SongNote[] = []
  for (const c of chords) {
    const m = melody.find((n) => Math.abs(n.t - c.t) < EPS)
    if (!m || m.d < 2 - EPS) continue
    // chordPitchClasses spells the chord itself, so sus/power chords contribute
    // their own characteristic tone instead of a third they do not have.
    const chordPcs = chordPitchClasses(c.r, c.q)
    const fillPcs = [chordPcs[1] ?? chordPcs[0], pitchClass(c.r + 2)]
    const ceiling = m.p - MIN_UNDER_MELODY
    let best = -1
    for (const pc of fillPcs) {
      for (let p = ceiling; p >= FILL_FLOOR; p--) {
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

/** The chord track AS THE LEFT HAND sees it: the left hand rests through the
 * pickup (opptakt), exactly like the drum generator, so no accompaniment block
 * sounds under the anacrusis. A chord straddling the pickup is trimmed to start
 * on the first downbeat; chords that end inside the pickup are not played. */
function leftHandChords(chords: SongChord[], pickupBeats: number): SongChord[] {
  if (pickupBeats <= EPS) return chords
  const out: SongChord[] = []
  for (const c of chords) {
    const end = c.t + c.d
    if (end <= pickupBeats + EPS) continue
    out.push(c.t >= pickupBeats - EPS ? c : { ...c, t: pickupBeats, d: end - pickupBeats })
  }
  return out
}

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
  const lhChords = leftHandChords(chords, src.pickupBeats)

  let notes: SongNote[]
  switch (level) {
    case 1:
      notes = sortNotes([...melody, ...blockLeftHand(lhChords)])
      break
    case 2:
      notes = sortNotes([
        ...melody,
        ...altoVoice(melody, chords),
        ...walkingLeftHand(lhChords, src.beatsPerBar, src.pickupBeats),
      ])
      break
    case 3:
      notes = sortNotes([...melody, ...gospelFills(melody, chords), ...gospelLeftHand(lhChords)])
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
