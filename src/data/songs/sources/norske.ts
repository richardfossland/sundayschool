import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Norske/nordiske salmer (verk-kilder) ─────────────────────────────────────
// Hver kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — nivåene i
// `levels` styrer hvilke (1 enkel / 2 firstemmig / 3 gospel). Bruk `line`/`ch`
// fra ../_helpers.ts, og husk .ts-endelser i relative imports (seed-scriptet
// kjører via Node type-stripping). Melodi: kun h:'R', monofon, C3–C6.
// Gehør-transkriberte melodier tagges 'kontroller-melodi' (eier-QA ved piano).

// Delte MIDI-tonehøyder (C4 = 60). Én modul-blokk så hvert verk kan referere
// samme navn uten redeklarasjon.
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67, A4 = 69, Bb4 = 70, B4 = 71
const C5 = 72, Cs5 = 73, D5 = 74, Eb5 = 75

// Nå takker alle Gud (NUN DANKET ALLE GOTT, Crüger 1647 / Rinkart).
// Bb-dur, 4/4, 16 takter i barform (AAB). Melodi nedtegnet etter gehør —
// flagget for kontroll mot koralbok før promotering.
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

// Alltid freidig når du går. F-dur, 4/4. Melodi C. E. F. Weyse (d. 1842);
// tekst Christian Richardt (1867, d. 1892). Melodi etter minne — flagget.
const alltidFreidig: SongSource = {
  slug: 'alltid-freidig-naar-du-gaar',
  title: 'Alltid freidig når du går',
  subtitle: 'C. E. F. Weyse',
  tradition: 'salme',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Alltid freidig når du går»
    [C5, 1], [C5, 1], [A4, 1], [F4, 1], [G4, 1], [A4, 1], [G4, 2],
    // «veier Gud tør kjenne»
    [A4, 1], [Bb4, 1], [C5, 1], [A4, 1], [G4, 2], [F4, 2],
    // «selv om du til målet når»
    [C5, 1], [C5, 1], [D5, 1], [Bb4, 1], [A4, 1], [G4, 1], [A4, 2],
    // «først ved verdens ende»
    [Bb4, 1], [A4, 1], [G4, 1], [F4, 1], [G4, 1], [F4, 3],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 10), ch(6, 2, 0, '7'),
    ch(8, 4, 5), ch(12, 2, 0, '7'), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 1, 5), ch(21, 1, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 10), ch(26, 2, 0, '7'), ch(28, 1, 0, '7'), ch(29, 3, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'C. E. F. Weyse', role: 'komponist', deathYear: 1842 },
      { name: 'Christian Richardt', role: 'tekstforfatter', deathYear: 1892 },
    ],
    sources: ['Weyse-melodien (1838)', 'Richardt (1867), dansk/norsk salmetradisjon'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['norsk', 'klassiker', 'kontroller-melodi'],
  levels: [1, 3],
}

// Fager kveldssol smiler. F-dur, 4/4. Melodi C. E. F. Weyse (d. 1842); tysk
// tekst Hoffmann von Fallersleben (d. 1874), norsk 1800-tallstradisjon.
const fagerKveldssol: SongSource = {
  slug: 'fager-kveldssol-smiler',
  title: 'Fager kveldssol smiler',
  subtitle: null,
  tradition: 'salme',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 80,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Fager kveldssol smiler»
    [C5, 1], [A4, 1], [Bb4, 1], [G4, 1], [A4, 2], [F4, 2],
    // «over heimen ned»
    [G4, 1], [A4, 1], [Bb4, 1], [G4, 1], [C5, 4],
    // «jord og himmel kviler»
    [C5, 1], [D5, 1], [C5, 1], [A4, 1], [Bb4, 2], [G4, 2],
    // «stilt i heilag fred»
    [A4, 1], [G4, 1], [F4, 1], [G4, 1], [F4, 4],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 7, 'm'), ch(4, 4, 5),
    ch(8, 4, 0, '7'), ch(12, 4, 5),
    ch(16, 4, 5), ch(20, 2, 10), ch(22, 2, 0, '7'),
    ch(24, 1, 5), ch(25, 1, 0, '7'), ch(26, 1, 5), ch(27, 1, 0, '7'), ch(28, 4, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'C. E. F. Weyse', role: 'komponist', deathYear: 1842 },
      { name: 'A. H. Hoffmann von Fallersleben', role: 'tekstforfatter', deathYear: 1874 },
    ],
    sources: ['Weyse-melodien (1838)', 'Norsk/nynorsk salmetradisjon (1800-tallet)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok. Norsk gjendiktning fra 1800-tallstradisjonen (PD).',
  },
  tags: ['norsk', 'kveld', 'kontroller-melodi'],
  levels: [1, 3],
}

// No livnar det i lundar. G-dur, 4/4. Melodiform etter Ludvig M. Lindeman
// (d. 1887); tekst Elias Blix (d. 1902). Melodi etter minne — flagget.
const noLivnar: SongSource = {
  slug: 'no-livnar-det-i-lundar',
  title: 'No livnar det i lundar',
  subtitle: null,
  tradition: 'salme',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'G',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «No livnar det i lundar»
    [G4, 1], [A4, 1], [B4, 1], [G4, 1], [D5, 1], [B4, 1], [A4, 2],
    // «no lauvast det i li»
    [B4, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 1], [Fs4, 1], [G4, 2],
    // «den heile skapning stundar»
    [D5, 1], [D5, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 1], [B4, 2],
    // «no fram til sumars tid»
    [A4, 1], [B4, 1], [A4, 1], [G4, 1], [Fs4, 1], [A4, 1], [G4, 2],
  ]),
  chords: [
    ch(0, 4, 7), ch(4, 2, 7), ch(6, 2, 2),
    ch(8, 1, 7), ch(9, 1, 0), ch(10, 2, 7), ch(12, 1, 7), ch(13, 1, 2), ch(14, 2, 7),
    ch(16, 2, 7), ch(18, 1, 7), ch(19, 1, 0), ch(20, 1, 7), ch(21, 1, 2), ch(22, 2, 7),
    ch(24, 2, 2), ch(26, 1, 2), ch(27, 1, 7), ch(28, 2, 2, '7'), ch(30, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Ludvig M. Lindeman (melodiform)', role: 'komponist', deathYear: 1887 },
      { name: 'Elias Blix', role: 'tekstforfatter', deathYear: 1902 },
    ],
    sources: ['Blix: Nokre Salmar (1875)', 'Lindeman-koralboktradisjonen'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['norsk', 'vaar', 'kontroller-melodi'],
  levels: [1, 3],
}

// Vår Gud han er så fast en borg (EIN FESTE BURG). C-dur, 4/4, den utjevnede
// (isometriske) formen i barform AAB. Luther (d. 1546). Koral-idiom → 1–3.
// Stollen er trygg; Abgesang etter minne — flagget for kontroll.
const vaarGudBorg: SongSource = {
  slug: 'vaar-gud-han-er-saa-fast-en-borg',
  title: 'Vår Gud han er så fast en borg',
  subtitle: 'EIN FESTE BURG — utjevnet form',
  tradition: 'salme',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 84,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 56,
  keySignature: 'C',
  sections: [
    { id: 'a1', kind: 'verse', label: 'Stollen 1', startBeat: 0, endBeat: 16 },
    { id: 'a2', kind: 'verse', label: 'Stollen 2', startBeat: 16, endBeat: 32 },
    { id: 'b1', kind: 'bridge', label: 'Abgesang 1', startBeat: 32, endBeat: 40 },
    { id: 'b2', kind: 'bridge', label: 'Abgesang 2', startBeat: 40, endBeat: 48 },
    { id: 'b3', kind: 'ending', label: 'Abgesang 3', startBeat: 48, endBeat: 56 },
  ],
  melody: line('R', 0, [
    // A: «Vår Gud han er så fast en borg / han er vårt skjold og verge»
    [C5, 1], [C5, 1], [C5, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
    [E4, 1], [F4, 1], [G4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
    // A (gjentak): «han hjelper oss av nød og sorg / og vet oss vel å berge»
    [C5, 1], [C5, 1], [C5, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
    [E4, 1], [F4, 1], [G4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
    // B: «Vår gamle fiende hård / til strid imot oss står»
    [C5, 1], [B4, 1], [A4, 1], [G4, 1], [A4, 1], [B4, 1], [G4, 2],
    // «stor makt og arge list / han mot oss nytter»
    [G4, 1], [A4, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 1], [B4, 2],
    // «på jord er ei hans like» — fallende avslutning til tonika.
    [C5, 1], [B4, 1], [A4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 1], [C4, 1],
  ]),
  chords: [
    ch(0, 4, 0), ch(4, 2, 5), ch(6, 2, 7), ch(8, 4, 0), ch(12, 2, 7), ch(14, 2, 0),
    ch(16, 4, 0), ch(20, 2, 5), ch(22, 2, 7), ch(24, 4, 0), ch(28, 2, 7), ch(30, 2, 0),
    ch(32, 1, 0), ch(33, 1, 7), ch(34, 1, 5), ch(35, 1, 0), ch(36, 1, 5), ch(37, 3, 7),
    ch(40, 2, 7), ch(42, 1, 7), ch(43, 1, 0), ch(44, 2, 4, 'm'), ch(46, 2, 7),
    ch(48, 1, 0), ch(49, 1, 7), ch(50, 1, 5), ch(51, 1, 0), ch(52, 1, 5), ch(53, 1, 0),
    ch(54, 1, 7), ch(55, 1, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Martin Luther', role: 'komponist', deathYear: 1546 },
      { name: 'Martin Luther', role: 'tekstforfatter', deathYear: 1546 },
    ],
    sources: ['Klug: Geistliche Lieder (1533)', 'Utjevnet koralform, salmeboktradisjonen'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Den utjevnede (isometriske) formen, ikke Luthers rytmiske original. Abgesang etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['norsk', 'klassiker', 'kontroller-melodi'],
  levels: [1, 2, 3],
}

// Herre Gud, ditt dyre navn og ære. D-dur, 3/4. Norsk folketone (Romsdal);
// tekst Petter Dass (d. 1707). Melodi etter minne — flagget.
const herreGudDittDyreNavn: SongSource = {
  slug: 'herre-gud-ditt-dyre-navn',
  title: 'Herre Gud, ditt dyre navn og ære',
  subtitle: 'Norsk folketone',
  tradition: 'salme',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 84,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 54,
  keySignature: 'D',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 24, endBeat: 36 },
    { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 36, endBeat: 48 },
    { id: 'f5', kind: 'ending', label: 'Din ære', startBeat: 48, endBeat: 54 },
  ],
  melody: line('R', 0, [
    // «Herre Gud, ditt dyre navn og ære»
    [D4, 1], [Fs4, 1], [A4, 1], [B4, 1], [A4, 2], [D5, 1], [Cs5, 1], [B4, 1], [A4, 3],
    // «over verden høyt i akt skal være»
    [B4, 1], [Cs5, 1], [D5, 1], [Cs5, 1], [B4, 2], [A4, 1], [B4, 1], [Cs5, 1], [D5, 3],
    // «og alle sjele, de trette træle»
    [D5, 1], [B4, 1], [Cs5, 1], [A4, 1], [B4, 2], [G4, 1], [A4, 1], [B4, 1], [A4, 3],
    // «alt som har mæle, de skal fortelle»
    [Fs4, 1], [G4, 1], [A4, 1], [Fs4, 1], [G4, 2], [E4, 1], [Fs4, 1], [G4, 1], [Fs4, 3],
    // «din ære»
    [E4, 1], [Fs4, 1], [E4, 1], [D4, 3],
  ]),
  chords: [
    ch(0, 3, 2), ch(3, 1, 7), ch(4, 2, 2), ch(6, 1, 2), ch(7, 2, 9), ch(9, 3, 9),
    ch(12, 1, 7), ch(13, 1, 9), ch(14, 1, 2), ch(15, 1, 9), ch(16, 2, 7),
    ch(18, 1, 2), ch(19, 1, 7), ch(20, 1, 9), ch(21, 3, 2),
    ch(24, 1, 7), ch(25, 1, 7), ch(26, 1, 9), ch(27, 1, 2), ch(28, 2, 7),
    ch(30, 1, 4, 'm'), ch(31, 1, 2), ch(32, 1, 7), ch(33, 3, 9),
    ch(36, 3, 2), ch(39, 1, 2), ch(40, 2, 7), ch(42, 1, 9), ch(43, 1, 2), ch(44, 1, 7),
    ch(45, 3, 2), ch(48, 1, 9), ch(49, 1, 2), ch(50, 1, 9), ch(51, 3, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Norsk folketone (Romsdal)', role: 'komponist', deathYear: null },
      { name: 'Petter Dass', role: 'tekstforfatter', deathYear: 1707 },
    ],
    sources: [
      'Petter Dass: Katekismesanger (1715)',
      'Norsk folketonetradisjon (nedtegnet 1800-tallet)',
    ],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['norsk', 'folketone', 'kontroller-melodi'],
  levels: [1, 3],
}

// Navnet Jesus. D-dur, 4/4. Melodi og tekst David Welander (1923, d. 1942 —
// PD etter dødsårsregelen; utgitt 1923 < 1930). Melodi etter minne — flagget.
const navnetJesus: SongSource = {
  slug: 'navnet-jesus',
  title: 'Navnet Jesus',
  subtitle: 'Navnet Jesus blekner aldri',
  tradition: 'salme',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'D',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 8, endBeat: 16 },
    { id: 'v3', kind: 'verse', label: 'Vers 3', startBeat: 16, endBeat: 24 },
    { id: 'v4', kind: 'verse', label: 'Vers 4', startBeat: 24, endBeat: 32 },
    { id: 'r1', kind: 'chorus', label: 'Refreng 1', startBeat: 32, endBeat: 40 },
    { id: 'r2', kind: 'chorus', label: 'Refreng 2', startBeat: 40, endBeat: 48 },
    { id: 'r3', kind: 'chorus', label: 'Refreng 3', startBeat: 48, endBeat: 56 },
    { id: 'r4', kind: 'chorus', label: 'Refreng 4', startBeat: 56, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // «Navnet Jesus blekner aldri»
    [Fs4, 1], [A4, 1], [A4, 1], [B4, 1], [A4, 1], [Fs4, 1], [E4, 2],
    // «tæres ei av tidens tann»
    [D4, 1], [E4, 1], [Fs4, 1], [E4, 1], [G4, 1], [Fs4, 1], [E4, 2],
    // «Navnet Jesus, det er evig»
    [B4, 1], [Cs5, 1], [D5, 1], [B4, 1], [A4, 1], [Fs4, 1], [A4, 2],
    // «ingen det utslette kan»
    [G4, 1], [Fs4, 1], [E4, 1], [Fs4, 1], [E4, 1], [E4, 1], [D4, 2],
    // Refreng: «Navnet Jesus må jeg elske»
    [A4, 1], [D5, 1], [D5, 1], [Cs5, 1], [B4, 1], [Cs5, 1], [D5, 2],
    // «det har satt min sjel i brann»
    [B4, 1], [Cs5, 1], [D5, 1], [B4, 1], [A4, 1], [Fs4, 1], [A4, 2],
    // «Ved det navnet fant jeg frelse»
    [D5, 1], [Cs5, 1], [B4, 1], [A4, 1], [B4, 1], [Cs5, 1], [B4, 2],
    // «intet annet frelse kan»
    [A4, 1], [Fs4, 1], [E4, 1], [Fs4, 1], [G4, 1], [E4, 1], [D4, 2],
  ]),
  chords: [
    ch(0, 4, 2), ch(4, 2, 2), ch(6, 2, 9),
    ch(8, 2, 2), ch(10, 1, 2), ch(11, 1, 9), ch(12, 1, 7), ch(13, 1, 2), ch(14, 2, 9),
    ch(16, 1, 7), ch(17, 1, 9), ch(18, 2, 2), ch(20, 2, 2), ch(22, 2, 9),
    ch(24, 2, 7), ch(26, 4, 9), ch(30, 2, 2),
    ch(32, 2, 2), ch(34, 1, 2), ch(35, 1, 9), ch(36, 1, 7), ch(37, 1, 9), ch(38, 2, 2),
    ch(40, 1, 7), ch(41, 1, 9), ch(42, 2, 2), ch(44, 2, 2), ch(46, 2, 9),
    ch(48, 1, 2), ch(49, 1, 9), ch(50, 1, 7), ch(51, 1, 2), ch(52, 1, 7), ch(53, 1, 9),
    ch(54, 2, 7),
    ch(56, 2, 2), ch(58, 2, 9), ch(60, 1, 7), ch(61, 1, 9), ch(62, 2, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'David Welander', role: 'komponist', deathYear: 1942 },
      { name: 'David Welander', role: 'tekstforfatter', deathYear: 1942 },
    ],
    sources: ['Welander: Navnet Jesus (1923)', 'Norsk bedehus-/sangboktradisjon'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. PD etter dødsårsregelen (Welander d. 1942 < 1956); førsteutgivelse 1923 (< 1930). Melodi rekonstruert etter minne — MÅ kontrolleres mot sangbok.',
  },
  tags: ['norsk', 'kontroller-melodi'],
  levels: [1, 3],
}

export const norskeSources: SongSource[] = [
  naaTakkerAlleGud,
  alltidFreidig,
  fagerKveldssol,
  noLivnar,
  vaarGudBorg,
  herreGudDittDyreNavn,
  navnetJesus,
]
