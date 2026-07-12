import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Norske/nordiske salmer (verk-kilder) ─────────────────────────────────────
// Hver kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — nivåene i
// `levels` styrer hvilke (1 enkel / 2 firstemmig / 3 gospel). Bruk `line`/`ch`
// fra ../_helpers.ts, og husk .ts-endelser i relative imports (seed-scriptet
// kjører via Node type-stripping). Melodi: kun h:'R', monofon, C3–C6.
// Gehør-transkriberte melodier tagges 'kontroller-melodi' (eier-QA ved piano).

// Nå takker alle Gud (NUN DANKET ALLE GOTT, Crüger 1647 / Rinkart).
// Bb-dur, 4/4, 16 takter i barform (AAB). Melodi nedtegnet etter gehør —
// flagget for kontroll mot koralbok før promotering.
const F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, C5 = 72, D5 = 74, Eb5 = 75

const naaTakkerAlleGud: SongSource = {
  slug: 'naa-takker-alle-gud',
  title: 'Nå takker alle Gud',
  subtitle: 'NUN DANKET ALLE GOTT',
  tradition: 'salme',
  original_key: 10, // Bb
  mode: 'major',
  default_bpm: 88,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'Bb',
  sections: [
    { id: 'a1', kind: 'verse', label: 'Stollen 1', startBeat: 0, endBeat: 16 },
    { id: 'a2', kind: 'verse', label: 'Stollen 2', startBeat: 16, endBeat: 32 },
    { id: 'b1', kind: 'bridge', label: 'Abgesang 1', startBeat: 32, endBeat: 48 },
    { id: 'b2', kind: 'ending', label: 'Abgesang 2', startBeat: 48, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // A: «Nå takker alle Gud / med hjerte, munn og hender»
    [F4, 1], [F4, 1], [G4, 1], [A4, 1], [Bb4, 2], [A4, 2],
    [Bb4, 1], [Bb4, 1], [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 2],
    // A (gjentak)
    [F4, 1], [F4, 1], [G4, 1], [A4, 1], [Bb4, 2], [A4, 2],
    [Bb4, 1], [Bb4, 1], [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 2],
    // B: «som fra vår første stund …»
    [D5, 1], [D5, 1], [C5, 1], [Bb4, 1], [C5, 2], [D5, 2],
    [C5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 2], [F4, 2],
    // «… har vist oss all sin nåde»
    [F4, 1], [G4, 1], [A4, 1], [Bb4, 1], [C5, 2], [D5, 2],
    [Eb5, 1], [D5, 1], [C5, 1], [C5, 1], [Bb4, 4],
  ]),
  chords: [
    ch(0, 2, 10), ch(2, 1, 3), ch(3, 1, 5), ch(4, 2, 10), ch(6, 2, 5),
    ch(8, 2, 10), ch(10, 1, 5), ch(11, 1, 10), ch(12, 1, 5), ch(13, 1, 10), ch(14, 2, 5),
    ch(16, 2, 10), ch(18, 1, 3), ch(19, 1, 5), ch(20, 2, 10), ch(22, 2, 5),
    ch(24, 2, 10), ch(26, 1, 5), ch(27, 1, 10), ch(28, 1, 5), ch(29, 1, 10), ch(30, 2, 5),
    ch(32, 2, 10), ch(34, 1, 5), ch(35, 1, 10), ch(36, 2, 5), ch(38, 2, 10),
    ch(40, 2, 5), ch(42, 1, 10), ch(43, 1, 5), ch(44, 2, 3), ch(46, 2, 5),
    ch(48, 1, 5), ch(49, 1, 0, 'm'), ch(50, 1, 5), ch(51, 1, 10), ch(52, 2, 5), ch(54, 2, 10),
    ch(56, 1, 3), ch(57, 1, 10), ch(58, 2, 5), ch(60, 4, 10),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Johann Crüger', role: 'komponist', deathYear: 1662 },
      { name: 'Martin Rinkart', role: 'tekstforfatter', deathYear: 1649 },
    ],
    sources: ['Praxis pietatis melica (1647)', 'Norsk salmeboktradisjon (NUN DANKET)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter gehør — MÅ kontrolleres mot koralbok.',
  },
  tags: ['norsk', 'klassiker', 'kontroller-melodi'],
  levels: [1, 2, 3],
}

export const norskeSources: SongSource[] = [naaTakkerAlleGud]
