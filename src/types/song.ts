// ── Core domain types ───────────────────────────────────────────────────────
// A song is stored as semantic MIDI-ish data (pitches + timing in beats plus
// sections, chords and rights metadata), never as audio and never as raw MIDI.
// Tempo and transposition are therefore pure number transforms — no
// time-stretching, no pitch-shifting, no artefacts. Same philosophy as
// SundayLicks, extended from short licks to full songs.

export type Hand = 'L' | 'R'

export type Tradition = 'salme' | 'hymne' | 'spiritual' | 'gospel' | 'lovsang'

export type Difficulty = 1 | 2 | 3 // 1 = enkel, 2 = middels, 3 = full sats

export type SongStatus = 'published' | 'draft'

export type Mode = 'major' | 'minor'

export type SectionKind = 'intro' | 'verse' | 'refrain' | 'chorus' | 'bridge' | 'ending'

/** A single note event. Times are in beats from song start (decimals allowed). */
export interface SongNote {
  p: number // MIDI pitch, 60 = C4
  t: number // start, in beats from beat 0 (never negative — pickup lives in pickupBeats)
  d: number // duration, in beats
  h: Hand
  v?: number // velocity 0–1, default 0.8
  /** Tied to the NEXT note of the same pitch+hand (notation only — playback
   * should merge tied pairs into one sounding note of combined duration). */
  tie?: boolean
  finger?: 1 | 2 | 3 | 4 | 5 // optional fingering hint (v1.1+)
}

/** A chord symbol shown in the chord strip and validated in besifringsmodus. */
export interface SongChord {
  t: number // start, in beats
  d: number // duration, in beats
  r: number // root as pitch class 0–11 (absolute, in the song's original key)
  q: string // quality: '' | 'm' | '7' | 'm7' | 'maj7' | 'dim' | 'sus4' | 'add9' ...
  b?: number // optional bass (slash chord), pitch class 0–11
}

/** A named span of the song (vers/refreng/bro …) used for navigation,
 * per-section looping and practice progress. */
export interface SongSection {
  id: string // stable within the song: 'v1', 'ref', 'bro' …
  kind: SectionKind
  label: string // 'Vers 1', 'Refreng' — shown in SectionNav
  startBeat: number
  endBeat: number // exclusive; sections tile [0, totalBeats] without gaps/overlap
}

/** Public-domain documentation. Mandatory on every song — this is the audit
 * trail that keeps the library legally safe (see /om-rettigheter). */
export interface Rights {
  publicDomain: true // MVP publishes PD-verified content only
  creators: {
    name: string
    role: 'komponist' | 'tekstforfatter' | 'oversetter' | 'kilde-arrangør'
    /** Year of death, or null for anonymous/traditional. Every non-null year
     * must satisfy the double-PD rule (died before 1956) at verification. */
    deathYear: number | null
  }[]
  /** Where the melody/setting was taken from, e.g. 'Lindemans koralbok (1877)'. */
  sources: string[]
  verifiedAt: string // 'YYYY-MM-DD' — when PD status was last checked
  notes?: string
}

/** The full semantic score, stored as one jsonb column (`school.songs.doc`). */
export interface SongDoc {
  formatVersion: 1
  timeSignature: string // '4/4' | '3/4' | '6/8' …
  beatsPerBar: number // quarter-note beats per bar (6/8 → 3)
  /** Pickup (opptakt) length in beats. Beat 0 is the first pickup note when
   * present; the first full bar starts at `pickupBeats`. Count-in and bar
   * numbering must respect this. 0 = no pickup. */
  pickupBeats: number
  totalBeats: number
  /** Key signature for notation spelling, e.g. 'Eb' (major) or 'g' (minor —
   * lowercase). Drives enharmonic spelling; see lib/spelling.ts. */
  keySignature: string
  sections: SongSection[]
  notes: SongNote[]
  chords: SongChord[]
}

/** A song row as stored in Supabase (`school.songs`) and used across the app.
 * Library metadata is denormalised to columns so listing never loads `doc`. */
export interface Song {
  id: string
  slug: string
  /** The underlying work this row is an arrangement of. Variants of the same
   * work (enkel/firstemmig/gospel) share `work_slug`; the library groups on
   * it. For a work's standard arrangement `work_slug === slug`. */
  work_slug: string
  /** Human variant name ('Enkel' | 'Firstemmig' | 'Gospel' …). Null when the
   * row is the work's only/standard arrangement. Max 24 chars. */
  variant_label: string | null
  title: string
  subtitle: string | null // e.g. original/English title
  tradition: Tradition
  difficulty: Difficulty
  original_key: number // 0–11, 0 = C
  mode: Mode
  default_bpm: number
  arrangement_style: string // 'enkel' | 'firstemmig' | 'gospel' …
  doc: SongDoc
  rights: Rights
  tags: string[]
  status: SongStatus
  created_at?: string
}

/** The subset an author writes (DB fills id/status/created_at). */
export type SeedSong = Omit<Song, 'id' | 'status' | 'created_at'>

/** Library listing shape — everything except the heavy `doc`. */
export type SongMeta = Omit<Song, 'doc'>

export type HandFilter = 'both' | 'L' | 'R'
