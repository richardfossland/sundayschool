import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Julesanger (verk-kilder) ─────────────────────────────────────────────────
// Hver kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — nivåene i
// `levels` styrer hvilke (1 enkel / 2 firstemmig / 3 gospel). Bruk `line`/`ch`
// fra ../_helpers.ts, og husk .ts-endelser i relative imports (seed-scriptet
// kjører via Node type-stripping). Melodi: kun h:'R', monofon, C3–C6.

// Joy to the World (ANTIOCH). D-dur, 4/4, 9 takter. Lowell Mason (1839) etter
// Händel-motiver; tekst Isaac Watts. Åpningen er en ren fallende D-dur-skala
// D5→D4. Nivå 2 utelates: melodien går ned til D4 — under alt-gulvet C4 + ters.
const D4 = 62, E4 = 64, Fs4 = 66, G4 = 67, A4 = 69, B4 = 71, Cs5 = 73, D5 = 74

const joyToTheWorld: SongSource = {
  slug: 'joy-to-the-world',
  title: 'Joy to the World',
  subtitle: 'ANTIOCH — «Å, kom nå med lovsang»',
  tradition: 'hymne',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 36,
  keySignature: 'D',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'refrain', label: 'Frase 4', startBeat: 24, endBeat: 36 },
  ],
  melody: line('R', 0, [
    // «Joy to the world, the Lord is come» — fallende durskala D5→D4.
    [D5, 1], [Cs5, 0.75], [B4, 0.25], [A4, 1.5], [G4, 0.5],
    [Fs4, 1], [E4, 1], [D4, 1.5], [A4, 0.5],
    // «Let earth receive her King»
    [B4, 1.5], [B4, 0.5], [Cs5, 1.5], [Cs5, 0.5], [D5, 2],
    // «Let ev'ry heart …»
    [D5, 0.5], [D5, 0.5], [D5, 0.5], [D5, 0.5],
    // «… prepare Him room»
    [Cs5, 1], [B4, 1], [A4, 1], [A4, 1],
    // «And heaven and nature sing» (ekko ×2)
    [Fs4, 0.5], [Fs4, 0.5], [Fs4, 0.5], [Fs4, 0.5], [Fs4, 1], [E4, 1],
    [A4, 0.5], [A4, 0.5], [A4, 0.5], [A4, 0.5], [G4, 1], [Fs4, 1],
    // «And heaven and nature sing» — avsluttende fallende linje til tonika.
    [D5, 1], [B4, 1], [A4, 1], [G4, 1], [Fs4, 1], [E4, 1], [D4, 2],
  ]),
  chords: [
    ch(0, 5, 2), ch(5, 1, 9, '7'), ch(6, 2, 2),
    ch(8, 2, 7), ch(10, 2, 9, '7'), ch(12, 4, 2),
    ch(16, 2, 9, '7'), ch(18, 5, 2), ch(23, 1, 9, '7'),
    ch(24, 2, 2), ch(26, 1, 7), ch(27, 2, 2), ch(29, 1, 7),
    ch(30, 1, 2), ch(31, 1, 7), ch(32, 1, 2), ch(33, 1, 9, '7'), ch(34, 2, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Lowell Mason (ANTIOCH)', role: 'komponist', deathYear: 1872 },
      { name: 'G. F. Händel (motiv-kilde)', role: 'kilde-arrangør', deathYear: 1759 },
      { name: 'Isaac Watts', role: 'tekstforfatter', deathYear: 1748 },
    ],
    sources: ['The Modern Psalmist (1839)', 'Watts: The Psalms of David Imitated (1719)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk.',
  },
  tags: ['jul', 'klassiker', 'glad'],
  levels: [1, 3],
}

export const julSources: SongSource[] = [joyToTheWorld]
