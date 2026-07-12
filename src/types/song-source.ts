import type { Mode, Rights, SongChord, SongNote, SongSection, Tradition } from './song'

// ── Song source (verk-kilde) ─────────────────────────────────────────────────
// The ONE hand-written description of a work: melody + chords + sections +
// rights. Playable arrangements (enkel/firstemmig/gospel) are generated from
// it deterministically by lib/arranger/piano-arrangement.ts at module
// evaluation — a source is never played directly. Authored with the same
// `_helpers` (line/ch) as the hand-written seed songs.
//
// Contract (enforced by songSourceSchema + validateSongSource in
// lib/song/format.ts):
//   - melody: right hand only (h:'R'), monophonic, C3–C6, gaps ≤ 2 beats
//   - chords: whole-beat starts, sorted, non-overlapping, gaps ≤ 2 beats
//   - sections tile [0, totalBeats]
export interface SongSource {
  /** Work slug — becomes `work_slug` on every generated variant, and the
   * `slug` of the level-1 arrangement. */
  slug: string
  title: string
  subtitle: string | null
  tradition: Tradition
  original_key: number // 0–11, 0 = C
  mode: Mode
  default_bpm: number
  timeSignature: string // '4/4' | '3/4' | '6/8' …
  beatsPerBar: number
  pickupBeats: number
  totalBeats: number
  keySignature: string
  sections: SongSection[]
  /** The melody line only — h:'R', monophonic. */
  melody: SongNote[]
  chords: SongChord[]
  rights: Rights
  tags: string[]
  /** Which arrangements to generate: 1 = enkel, 2 = firstemmig, 3 = gospel.
   * Level 2 only where the chorale idiom fits (salmer/hymner). */
  levels: (1 | 2 | 3)[]
}
