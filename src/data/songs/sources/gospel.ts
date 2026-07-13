import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Gospel (verk-kilder) ─────────────────────────────────────────────────────
// Tidlig amerikansk gospel (alle opphavspersoner d. før 1956 → dobbel-PD). Hver
// kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — `levels`
// styrer hvilke. Bruk `line`/`ch` fra ../_helpers.ts (.ts-endelser i imports).
// Melodi: kun h:'R', monofon, C3–C6. Melodier etter minne → 'kontroller-melodi'.

// Delte MIDI-tonehøyder (C4 = 60).
const E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71
const C5 = 72, D5 = 74, E5 = 76, F5 = 77

// His Eye Is on the Sparrow. C-dur, 3/4. Melodi Charles H. Gabriel (1905,
// d. 1932); tekst Civilla D. Martin (d. 1948). Vers + refreng. Refreng
// nedtegnet etter minne → flagg refrengdetaljer for kontroll.
const hisEyeIsOnTheSparrow: SongSource = {
  slug: 'his-eye-is-on-the-sparrow',
  title: 'His Eye Is on the Sparrow',
  subtitle: null,
  tradition: 'gospel',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 108,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 24,
  keySignature: 'C',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 6 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 6, endBeat: 12 },
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 12, endBeat: 18 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 18, endBeat: 24 },
  ],
  melody: line('R', 0, [
    // «Why should I feel discouraged»
    [E4, 1], [G4, 1], [C5, 1], [C5, 1], [B4, 1], [G4, 1],
    // «why should the shadows come»
    [A4, 1], [C5, 1], [A4, 1], [G4, 1], [E4, 2],
    // «I sing because I'm happy»
    [G4, 1], [C5, 1], [C5, 1], [D5, 1], [E5, 1], [C5, 1],
    // «His eye is on the sparrow»
    [E5, 1], [D5, 1], [C5, 1], [D5, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 3, 0), ch(3, 3, 7, '7'),
    ch(6, 3, 5), ch(9, 3, 0),
    ch(12, 3, 0), ch(15, 3, 7, '7'),
    ch(18, 3, 7, '7'), ch(21, 3, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Charles H. Gabriel', role: 'komponist', deathYear: 1932 },
      { name: 'Civilla D. Martin', role: 'tekstforfatter', deathYear: 1948 },
    ],
    sources: ['Alexander’s Gospel Songs (1905)'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi (spes. refrenget) rekonstruert etter minne — FLAGG: kontroller refreng-detaljer mot original før publisering.',
  },
  tags: ['gospel', 'kontroller-melodi'],
  levels: [1, 3],
}

// Love Lifted Me. C-dur. Melodi Howard E. Smith (1912, d. 1935); tekst James
// Rowe (d. 1933). Originalt 6/8 — her nedtegnet i 3/4 med punktert lilt
// (dokumentert i notes; besifring på hele slag krever 3/4). Vers + refreng.
const loveLiftedMe: SongSource = {
  slug: 'love-lifted-me',
  title: 'Love Lifted Me',
  subtitle: null,
  tradition: 'gospel',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 100,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 24,
  keySignature: 'C',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 6 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 6, endBeat: 12 },
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 12, endBeat: 18 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 18, endBeat: 24 },
  ],
  melody: line('R', 0, [
    // «I was sinking deep in sin»
    [G4, 1], [C5, 1], [C5, 1], [C5, 1], [E5, 1], [D5, 1],
    // «far from the peaceful shore»
    [C5, 1], [C5, 1], [A4, 1], [G4, 1], [E4, 1], [G4, 1],
    // «Love lifted me»
    [G4, 1], [C5, 1], [E5, 1], [D5, 1], [C5, 1], [G4, 1],
    // «when nothing else could help, love lifted me»
    [D5, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 1], [C5, 1],
  ]),
  chords: [
    ch(0, 3, 0), ch(3, 3, 7, '7'),
    ch(6, 3, 5), ch(9, 3, 0),
    ch(12, 3, 0), ch(15, 3, 7, '7'),
    ch(18, 3, 7, '7'), ch(21, 3, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Howard E. Smith', role: 'komponist', deathYear: 1935 },
      { name: 'James Rowe', role: 'tekstforfatter', deathYear: 1933 },
    ],
    sources: ['Rowe & Smith (1912)'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Originalen står i 6/8; her nedtegnet som 3/4 med punktert (compound) lilt slik at besifring lander på hele slag. Melodi etter minne — kontroll anbefalt.',
  },
  tags: ['gospel', 'kontroller-melodi'],
  levels: [1, 3],
}

// Down at the Cross («Glory to His Name»). F-dur, 4/4. Melodi/tekst John H.
// Stockton (1874, d. 1877). Vers + refreng. Melodi etter minne → kontroll.
const downAtTheCross: SongSource = {
  slug: 'down-at-the-cross',
  title: 'Down at the Cross',
  subtitle: 'Glory to His Name',
  tradition: 'gospel',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 8, endBeat: 16 },
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 16, endBeat: 24 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Down at the cross where my Savior died»
    [C5, 1], [C5, 1], [C5, 1], [A4, 1], [F4, 1], [A4, 1], [C5, 2],
    // «down where the cleansing from sin I cried»
    [C5, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 1], [G4, 1], [F4, 2],
    // «Glory to His name»
    [A4, 1], [C5, 1], [C5, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 2],
    // «there to my heart was the blood applied, glory to His name»
    [F5, 1], [E5, 1], [D5, 1], [C5, 1], [A4, 1], [G4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 0, '7'), ch(6, 2, 5),
    ch(8, 2, 5), ch(10, 2, 10), ch(12, 2, 0, '7'), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 5), ch(20, 2, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 10), ch(26, 2, 5), ch(28, 2, 0, '7'), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'John H. Stockton', role: 'komponist', deathYear: 1877 }],
    sources: ['Stockton: Salvation Melodies (1874)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard form — kontroll anbefalt.',
  },
  tags: ['gospel', 'kontroller-melodi'],
  levels: [1, 3],
}

export const gospelSources: SongSource[] = [
  hisEyeIsOnTheSparrow,
  loveLiftedMe,
  downAtTheCross,
]
