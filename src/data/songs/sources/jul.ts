import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Julesanger (verk-kilder) ─────────────────────────────────────────────────
// Hver kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — nivåene i
// `levels` styrer hvilke (1 enkel / 2 firstemmig / 3 gospel). Bruk `line`/`ch`
// fra ../_helpers.ts, og husk .ts-endelser i relative imports (seed-scriptet
// kjører via Node type-stripping). Melodi: kun h:'R', monofon, C3–C6.
// Gehør-/minne-nedtegnede melodier tagges 'kontroller-melodi' (eier-QA ved piano).

// Delte MIDI-tonehøyder (C4 = 60). Én modul-blokk så hvert verk kan referere
// samme navn uten redeklarasjon.
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, Fs4 = 66, G4 = 67, A4 = 69, Bb4 = 70, B4 = 71
const C5 = 72, Cs5 = 73, D5 = 74, E5 = 76, Fs5 = 78

// Joy to the World (ANTIOCH). D-dur, 4/4, 9 takter. Lowell Mason (1839) etter
// Händel-motiver; tekst Isaac Watts. Åpningen er en ren fallende D-dur-skala
// D5→D4. Nivå 2 utelates: melodien går ned til D4 — under alt-gulvet C4 + ters.
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

// O Come, All Ye Faithful (ADESTE FIDELES). G-dur, 4/4, 1 slag opptakt («O»).
// John Francis Wade (mel. ca. 1751, d. 1786). Koral-idiom → nivå 1–3.
const oComeAllYeFaithful: SongSource = {
  slug: 'o-come-all-ye-faithful',
  title: 'O Come, All Ye Faithful',
  subtitle: 'ADESTE FIDELES',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 1,
  totalBeats: 33,
  keySignature: 'G',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 9 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 9, endBeat: 17 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 17, endBeat: 25 },
    { id: 'f4', kind: 'refrain', label: 'Adorem', startBeat: 25, endBeat: 33 },
  ],
  melody: line('R', 0, [
    [D4, 1], // «O» (opptakt)
    // «Come, all ye faithful, joyful and triumphant»
    [G4, 1], [G4, 1], [D4, 1], [G4, 1], [A4, 1], [B4, 1], [A4, 2],
    // «O come ye, O come ye to Bethlehem»
    [B4, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 1], [A4, 1], [G4, 2],
    // «Come and behold Him, born the King of angels»
    [G4, 1], [A4, 1], [B4, 1], [G4, 1], [D5, 1], [C5, 1], [B4, 2],
    // «O come let us adore Him …»
    [C5, 1], [B4, 1], [A4, 1], [B4, 1], [A4, 1], [G4, 1], [G4, 2],
  ]),
  chords: [
    ch(0, 1, 7), ch(1, 2, 7), ch(3, 2, 2), ch(5, 2, 7), ch(7, 2, 2, '7'),
    ch(9, 2, 7), ch(11, 2, 0), ch(13, 2, 7), ch(15, 2, 2, '7'),
    ch(17, 2, 7), ch(19, 2, 0), ch(21, 2, 7), ch(23, 2, 2, '7'),
    ch(25, 2, 0), ch(27, 2, 7), ch(29, 2, 2, '7'), ch(31, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'John Francis Wade (ADESTE FIDELES)', role: 'komponist', deathYear: 1786 },
      { name: 'Frederick Oakeley (eng. overs.)', role: 'oversetter', deathYear: 1880 },
    ],
    sources: ['Cantus Diversi (Wade, ca. 1751)', 'Murray’s Hymnal (1852)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard hymnal-form — anbefalt lett kontroll.',
  },
  tags: ['jul', 'klassiker', 'latin'],
  levels: [1, 2, 3],
}

// Hark! the Herald Angels Sing. G-dur, 4/4. Felix Mendelssohn (mel. 1840,
// d. 1847) / William H. Cummings (tilpasning 1855, d. 1915); tekst Wesley.
const harkTheHerald: SongSource = {
  slug: 'hark-the-herald-angels-sing',
  title: 'Hark! the Herald Angels Sing',
  subtitle: 'MENDELSSOHN',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 100,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 48,
  keySignature: 'G',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 24, endBeat: 32 },
    { id: 'f5', kind: 'refrain', label: 'Refreng 1', startBeat: 32, endBeat: 40 },
    { id: 'f6', kind: 'refrain', label: 'Refreng 2', startBeat: 40, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // «Hark! the herald angels sing»
    [G4, 1], [C5, 1], [C5, 1], [B4, 1], [C5, 1], [E5, 1], [D5, 2],
    // «Glory to the newborn King»
    [D5, 1], [C5, 1], [B4, 1], [C5, 1], [D5, 1], [B4, 1], [G4, 2],
    // «Peace on earth and mercy mild»
    [C5, 1], [B4, 1], [A4, 1], [G4, 1], [D5, 1], [C5, 1], [B4, 2],
    // «God and sinners reconciled»
    [D5, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 1], [A4, 1], [B4, 2],
    // «Joyful all ye nations rise»
    [G4, 1], [A4, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 2],
    // «With th’angelic host proclaim»
    [C5, 1], [D5, 1], [E5, 1], [D5, 1], [C5, 1], [B4, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 2, 7), ch(2, 2, 7), ch(4, 2, 0), ch(6, 2, 7),
    ch(8, 2, 0), ch(10, 2, 7), ch(12, 2, 2, '7'), ch(14, 2, 7),
    ch(16, 2, 0), ch(18, 2, 7), ch(20, 2, 2), ch(22, 2, 7),
    ch(24, 2, 2), ch(26, 2, 7), ch(28, 2, 0), ch(30, 2, 2, '7'),
    ch(32, 2, 7), ch(34, 2, 0), ch(36, 2, 7), ch(38, 2, 2, '7'),
    ch(40, 2, 0), ch(42, 2, 7), ch(44, 2, 2, '7'), ch(46, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Felix Mendelssohn', role: 'komponist', deathYear: 1847 },
      { name: 'William H. Cummings (tilpasning)', role: 'kilde-arrangør', deathYear: 1915 },
      { name: 'Charles Wesley', role: 'tekstforfatter', deathYear: 1788 },
    ],
    sources: ['Mendelssohn: Festgesang (1840)', 'Cummings-tilpasning (1855)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard hymnal-form — anbefalt lett kontroll.',
  },
  tags: ['jul', 'klassiker'],
  levels: [1, 3],
}

// Et barn er født i Betlehem. F-dur, 4/4. Ludvig M. Lindeman (d. 1887);
// tekst middelaldersk / Grundtvig. Melodi nedtegnet etter minne — kontroll.
const etBarnErFodt: SongSource = {
  slug: 'et-barn-er-fodt-i-betlehem',
  title: 'Et barn er født i Betlehem',
  subtitle: null,
  tradition: 'salme',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'refrain', label: 'Halleluja', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Et barn er født i Betlehem»
    [C5, 1], [C5, 1], [A4, 1], [F4, 1], [G4, 1], [A4, 1], [Bb4, 1], [A4, 1],
    // «Betlehem»
    [A4, 1], [G4, 1], [F4, 1], [G4, 1], [A4, 1], [C5, 1], [F4, 2],
    // «derfor gleder seg Jerusalem»
    [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [A4, 2],
    // «Halleluja, halleluja»
    [F4, 1], [A4, 1], [C5, 1], [A4, 1], [G4, 1], [F4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 2, 'm'), ch(6, 2, 5),
    ch(8, 2, 7, 'm'), ch(10, 2, 0, '7'), ch(12, 2, 5), ch(14, 2, 0),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 2, 7, 'm'), ch(22, 2, 0, '7'),
    ch(24, 2, 5), ch(26, 2, 2, 'm'), ch(28, 2, 0, '7'), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Ludvig M. Lindeman', role: 'komponist', deathYear: 1887 },
      { name: 'N. F. S. Grundtvig', role: 'tekstforfatter', deathYear: 1872 },
    ],
    sources: ['Lindeman: Koralbog (1877)', 'Norsk salmeboktradisjon'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['jul', 'norsk', 'kontroller-melodi'],
  levels: [1, 3],
}

// O jul med din glede. G-dur, 3/4 (vals). Tradisjonell norsk (1800-tallet).
// Melodi nedtegnet etter minne — kontroll.
const oJulMedDinGlede: SongSource = {
  slug: 'o-jul-med-din-glede',
  title: 'O jul med din glede',
  subtitle: null,
  tradition: 'salme',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 132,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 24,
  keySignature: 'G',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 6 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 6, endBeat: 12 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 12, endBeat: 18 },
    { id: 'f4', kind: 'refrain', label: 'Frase 4', startBeat: 18, endBeat: 24 },
  ],
  melody: line('R', 0, [
    // «O jul med din glede»
    [G4, 1], [B4, 1], [D5, 1], [D5, 1], [C5, 1], [B4, 1],
    // «og barnlige lyst»
    [A4, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 1], [G4, 1],
    // «vi ønsker deg alle»
    [D5, 1], [D5, 1], [B4, 1], [C5, 1], [C5, 1], [A4, 1],
    // «en velsignet fest»
    [B4, 1], [C5, 1], [D5, 1], [B4, 1], [A4, 1], [G4, 1],
  ]),
  chords: [
    ch(0, 3, 7), ch(3, 3, 0), ch(6, 3, 7), ch(9, 3, 2),
    ch(12, 3, 0), ch(15, 3, 7), ch(18, 3, 2, '7'), ch(21, 3, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (norsk, 1800-tallet)', role: 'komponist', deathYear: null }],
    sources: ['Norsk folketone-/julesangtradisjon (1800-tallet)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['jul', 'norsk', 'kontroller-melodi'],
  levels: [1, 3],
}

// Deilig er jorden. F-dur, 4/4. Schlesisk folketone; tekst B. S. Ingemann
// (d. 1862). Koral-idiom → nivå 1–3. Ydmyk nedtegnelse — kontroll.
const deiligErJorden: SongSource = {
  slug: 'deilig-er-jorden',
  title: 'Deilig er jorden',
  subtitle: 'Schlesisk folketone',
  tradition: 'salme',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 84,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 40,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 24, endBeat: 32 },
    { id: 'f5', kind: 'ending', label: 'Frase 5', startBeat: 32, endBeat: 40 },
  ],
  melody: line('R', 0, [
    // «Deilig er jorden»
    [F4, 1], [G4, 1], [A4, 2], [A4, 1], [Bb4, 1], [C5, 2],
    // «prektig er Guds himmel»
    [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [F4, 2],
    // «skjønn er sjelenes pilgrimsgang»
    [C5, 1], [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 2],
    // «gjennom de fagre riker på jord»
    [A4, 1], [G4, 1], [F4, 1], [G4, 1], [A4, 1], [C5, 1], [F4, 2],
    // «går vi til paradis med sang»
    [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 10), ch(6, 2, 5),
    ch(8, 2, 7, 'm'), ch(10, 2, 0, '7'), ch(12, 2, 5), ch(14, 2, 0),
    ch(16, 2, 5), ch(18, 2, 2, 'm'), ch(20, 2, 10), ch(22, 2, 0, '7'),
    ch(24, 2, 5), ch(26, 2, 10), ch(28, 2, 7, 'm'), ch(30, 2, 0, '7'),
    ch(32, 2, 5), ch(34, 2, 10), ch(36, 2, 0, '7'), ch(38, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Schlesisk folketone', role: 'komponist', deathYear: null },
      { name: 'B. S. Ingemann', role: 'tekstforfatter', deathYear: 1862 },
    ],
    sources: ['Schlesisk folketone (utg. før 1850)', 'Ingemann (1850)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok (ydmyk nedtegnelse).',
  },
  tags: ['jul', 'norsk', 'kontroller-melodi'],
  levels: [1, 2, 3],
}

// The First Noel. D-dur, 4/4, 1 slag opptakt («The»). Tradisjonell engelsk,
// først trykt hos William Sandys (1833). Melodi etter minne — kontroll.
const theFirstNoel: SongSource = {
  slug: 'the-first-noel',
  title: 'The First Noel',
  subtitle: null,
  tradition: 'hymne',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 1,
  totalBeats: 33,
  keySignature: 'D',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 9 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 9, endBeat: 17 },
    { id: 'f3', kind: 'refrain', label: 'Noel 1', startBeat: 17, endBeat: 25 },
    { id: 'f4', kind: 'refrain', label: 'Noel 2', startBeat: 25, endBeat: 33 },
  ],
  melody: line('R', 0, [
    [A4, 1], // «The» (opptakt)
    // «first Noel the angel did say»
    [Fs5, 1], [E5, 1], [D5, 1], [Cs5, 1], [B4, 1], [A4, 1], [A4, 2],
    // «was to certain poor shepherds»
    [B4, 1], [Cs5, 1], [D5, 1], [Cs5, 1], [B4, 1], [A4, 1], [G4, 2],
    // «Noel, Noel, Noel, Noel»
    [A4, 1], [B4, 1], [Cs5, 1], [D5, 1], [E5, 1], [Fs5, 1], [E5, 2],
    // «born is the King of Israel»
    [Fs5, 1], [E5, 1], [D5, 1], [Cs5, 1], [B4, 1], [A4, 1], [D5, 2],
  ]),
  chords: [
    ch(0, 1, 2), ch(1, 2, 2), ch(3, 2, 7), ch(5, 2, 2), ch(7, 2, 9, '7'),
    ch(9, 2, 2), ch(11, 2, 7), ch(13, 2, 9, '7'), ch(15, 2, 2),
    ch(17, 2, 2), ch(19, 2, 7), ch(21, 2, 9, '7'), ch(23, 2, 2),
    ch(25, 2, 7), ch(27, 2, 2), ch(29, 2, 9, '7'), ch(31, 2, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Tradisjonell (engelsk)', role: 'komponist', deathYear: null },
      { name: 'William Sandys (kilde-utg.)', role: 'kilde-arrangør', deathYear: 1874 },
    ],
    sources: ['Sandys: Christmas Carols Ancient and Modern (1833)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard form — anbefalt lett kontroll.',
  },
  tags: ['jul', 'klassiker'],
  levels: [1, 3],
}

// Away in a Manger («Cradle Song»). F-dur, 3/4, 1 slag opptakt. Melodi
// William J. Kirkpatrick (1895, d. 1921) — IKKE Murray/MULBERRY-varianten.
const awayInAManger: SongSource = {
  slug: 'away-in-a-manger',
  title: 'Away in a Manger',
  subtitle: 'Cradle Song',
  tradition: 'hymne',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 108,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 1,
  totalBeats: 25,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 7 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 7, endBeat: 13 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 13, endBeat: 19 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 19, endBeat: 25 },
  ],
  melody: line('R', 0, [
    [C4, 1], // «A-» (opptakt)
    // «-way in a manger, no crib for a bed»
    [F4, 1], [F4, 1], [G4, 1], [A4, 1], [A4, 1], [F4, 1],
    [A4, 1], [Bb4, 1], [C5, 1], [A4, 2], [F4, 1],
    // «the little Lord Jesus laid down His sweet head»
    [D5, 1], [C5, 1], [A4, 1], [A4, 1], [G4, 1], [F4, 1],
    [G4, 1], [G4, 1], [A4, 1], [F4, 3],
  ]),
  chords: [
    ch(0, 1, 5), ch(1, 3, 5), ch(4, 3, 10), ch(7, 3, 5),
    ch(10, 3, 0, '7'), ch(13, 3, 10), ch(16, 3, 5), ch(19, 3, 0, '7'), ch(22, 3, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'William J. Kirkpatrick (Cradle Song)', role: 'komponist', deathYear: 1921 },
      { name: 'Ukjent (tradisjonell tekst)', role: 'tekstforfatter', deathYear: null },
    ],
    sources: ['Kirkpatrick: Around the World with Christmas (1895)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Bruker Kirkpatricks «Cradle Song»-melodi (d. 1921), ikke Murrays MULBERRY/«Mueller». Tekst tradisjonell/anonym.',
  },
  tags: ['jul', 'klassiker', 'barn'],
  levels: [1, 3],
}

// Jeg er så glad hver julekveld. F-dur, 4/4. Melodi Peder Knudsen (d. 1863);
// tekst Marie Wexelsen (d. 1911). Melodi etter minne — kontroll.
const jegErSaaGlad: SongSource = {
  slug: 'jeg-er-saa-glad-hver-julekveld',
  title: 'Jeg er så glad hver julekveld',
  subtitle: null,
  tradition: 'salme',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 100,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'refrain', label: 'Frase 4', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Jeg er så glad hver julekveld»
    [F4, 1], [A4, 1], [C5, 1], [A4, 1], [Bb4, 1], [G4, 1], [A4, 2],
    // «for da ble Jesus født»
    [C5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [F4, 1], [F4, 2],
    // «da lyste stjernen som en sol»
    [A4, 1], [Bb4, 1], [C5, 1], [D5, 1], [C5, 1], [Bb4, 1], [A4, 2],
    // «og engler sang så søtt»
    [C5, 1], [A4, 1], [G4, 1], [A4, 1], [Bb4, 1], [G4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 0), ch(6, 2, 5),
    ch(8, 2, 5), ch(10, 2, 0, '7'), ch(12, 2, 2, 'm'), ch(14, 2, 0),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 2, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 5), ch(26, 2, 0, '7'), ch(28, 2, 10), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Peder Knudsen', role: 'komponist', deathYear: 1863 },
      { name: 'Marie Wexelsen', role: 'tekstforfatter', deathYear: 1911 },
    ],
    sources: ['Wexelsen: Ketil, en Julegave for de Smaa (1859)', 'Norsk julesangtradisjon'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['jul', 'norsk', 'barn', 'kontroller-melodi'],
  levels: [1, 3],
}

export const julSources: SongSource[] = [
  joyToTheWorld,
  oComeAllYeFaithful,
  harkTheHerald,
  etBarnErFodt,
  oJulMedDinGlede,
  deiligErJorden,
  theFirstNoel,
  awayInAManger,
  jegErSaaGlad,
]
