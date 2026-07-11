// ── Drum domain types (Trommer, Skolen v2) ───────────────────────────────────
// Drums are stored the same way as everything else in SundaySchool: semantic
// events in BEATS, never audio. A hit's `p` is a GM percussion pitch (an
// IDENTITY, never a frequency — see instruments.ts) so it is never transposed
// or pitch-shifted. A groove is a short, tileable rhythm pattern; a full drum
// track is generated from a song's SongDoc by tiling a groove (see drum-track).

/** One drum hit, in beats. `p` is a GM percussion pitch (36 = kick …). */
export interface DrumHit {
  t: number // start, in quarter-note beats from beat 0
  p: number // GM percussion pitch (identity, never transposed)
  v?: number // velocity 0–1, default 0.8
}

/**
 * A short, tileable rhythm pattern. `lengthBeats` is how long one repetition is
 * (usually one or two bars); `beatsPerBar` is quarter-note beats per bar so the
 * generator can match a groove to a song's time signature (6/8 → 3, 12/8 → 6).
 */
export interface Groove {
  id: string
  label: string // Norwegian UI label
  style: string // free tag used as an explicit override key ('gospel', 'vals' …)
  timeSignature: string // '4/4' | '3/4' | '6/8' | '12/8'
  beatsPerBar: number // quarter-note beats per bar
  lengthBeats: number // length of one repetition, in beats
  bpmDefault: number
  difficulty: 1 | 2 | 3
  hits: DrumHit[]
}

/** How a played hit lined up with its target — the trainer's per-hit verdict. */
export type HitResult = 'perfect' | 'early' | 'late' | 'miss'
