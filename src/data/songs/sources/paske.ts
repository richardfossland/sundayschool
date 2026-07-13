import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Påske/pasjon (verk-kilder) ───────────────────────────────────────────────
// Hver kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — nivåene i
// `levels` styrer hvilke (1 enkel / 2 firstemmig / 3 gospel). Bruk `line`/`ch`
// fra ../_helpers.ts, og husk .ts-endelser i relative imports. Melodi: kun
// h:'R', monofon, C3–C6. Gehør-/minne-nedtegnede melodier tagges
// 'kontroller-melodi' (eier-QA ved piano før publisering).

// Delte MIDI-tonehøyder (C4 = 60).
const D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, B4 = 71
const C5 = 72, D5 = 74, E5 = 76, F5 = 77

// Deg være ære (MACCABAEUS). G-dur, 4/4. Melodi fra Händels «See, the Conqu'ring
// Hero Comes» (Judas Maccabaeus, 1747); Händel d. 1759. Refreng + vers.
// Melodi nedtegnet etter minne av standard hymnal-form → kontroll anbefalt.
const degVaereAere: SongSource = {
  slug: 'deg-vaere-aere',
  title: 'Deg være ære',
  subtitle: 'MACCABAEUS — «Thine Be the Glory»',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 48,
  keySignature: 'G',
  sections: [
    { id: 'ref', kind: 'refrain', label: 'Refreng', startBeat: 0, endBeat: 16 },
    { id: 'v1', kind: 'verse', label: 'Vers frase 1', startBeat: 16, endBeat: 32 },
    { id: 'v2', kind: 'verse', label: 'Vers frase 2', startBeat: 32, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // Refreng «Deg være ære, oppstandne Herre»
    [D5, 1], [D5, 1], [C5, 1], [B4, 1], [A4, 1], [B4, 1], [C5, 1], [D5, 1],
    [B4, 1], [B4, 1], [A4, 1], [G4, 1], [A4, 2], [G4, 2],
    // Vers frase 1 «Engelen veltet stenen bort fra graven»
    [D5, 1], [B4, 1], [B4, 1], [C5, 1], [D5, 1], [B4, 1], [G4, 2],
    [C5, 1], [A4, 1], [A4, 1], [B4, 1], [C5, 2], [A4, 2],
    // Vers frase 2 «Herren er oppstanden, halleluja»
    [B4, 1], [C5, 1], [D5, 1], [B4, 1], [C5, 1], [A4, 1], [B4, 1], [G4, 1],
    [D5, 1], [D5, 1], [C5, 1], [B4, 1], [A4, 1], [B4, 1], [G4, 2],
  ]),
  chords: [
    ch(0, 2, 7), ch(2, 2, 7), ch(4, 2, 0), ch(6, 2, 2, '7'),
    ch(8, 2, 7), ch(10, 2, 0), ch(12, 2, 2, '7'), ch(14, 2, 7),
    ch(16, 2, 7), ch(18, 2, 7), ch(20, 2, 0), ch(22, 2, 7),
    ch(24, 2, 0), ch(26, 2, 9, 'm'), ch(28, 2, 2, '7'), ch(30, 2, 7),
    ch(32, 2, 7), ch(34, 2, 0), ch(36, 2, 2, '7'), ch(38, 2, 7),
    ch(40, 2, 7), ch(42, 2, 0), ch(44, 2, 2, '7'), ch(46, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'G. F. Händel (MACCABAEUS)', role: 'komponist', deathYear: 1759 },
      { name: 'Edmond Budry (fr. originaltekst)', role: 'tekstforfatter', deathYear: 1932 },
    ],
    sources: ['Händel: Judas Maccabaeus (1747)', 'Budry: «À toi la gloire» (1884)'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard hymnal-form — anbefalt kontroll. NB: melodi (Händel, d. 1759) + fransk originaltekst (Budry, d. 1932) er PD; nyere norske oversettelser er IKKE nødvendigvis PD — bruk kun melodi/besifring, ikke en spesifikk moderne tekst.',
  },
  tags: ['påske', 'klassiker', 'kontroller-melodi'],
  levels: [1, 3],
}

// Krist stod opp av døde. Middelaldersk påske-leise; norsk koralform (Lindeman
// d. 1887). C-dur, 4/4. Kort tre-frase leise. Melodi nedtegnet etter minne
// → MÅ kontrolleres mot koralbok.
const kristStodOpp: SongSource = {
  slug: 'krist-stod-opp-av-dode',
  title: 'Krist stod opp av døde',
  subtitle: null,
  tradition: 'salme',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 24,
  keySignature: 'C',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'ending', label: 'Kyrie eleison', startBeat: 16, endBeat: 24 },
  ],
  melody: line('R', 0, [
    // «Krist stod opp av døde»
    [G4, 1], [C5, 1], [C5, 1], [D5, 1], [E5, 2], [D5, 2],
    // «i påskemorgenrøde»
    [E5, 1], [F5, 1], [E5, 1], [D5, 1], [C5, 2], [G4, 2],
    // «Kyrie eleison»
    [C5, 1], [D5, 1], [E5, 1], [C5, 1], [D5, 1], [B4, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 2, 0), ch(2, 2, 7), ch(4, 2, 0), ch(6, 2, 7),
    ch(8, 2, 0), ch(10, 2, 5), ch(12, 2, 7), ch(14, 2, 0),
    ch(16, 2, 0), ch(18, 2, 5), ch(20, 2, 7, '7'), ch(22, 2, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Middelaldersk / L. M. Lindeman (koralform)', role: 'komponist', deathYear: 1887 },
      { name: 'Middelaldersk leise (no. tekst)', role: 'tekstforfatter', deathYear: null },
    ],
    sources: ['Lindeman: Koralbog (1877)', 'Norsk salmeboktradisjon'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Kort middelaldersk påske-leise; melodi rekonstruert etter minne — MÅ kontrolleres mot koralbok.',
  },
  tags: ['påske', 'norsk', 'kontroller-melodi'],
  levels: [1, 3],
}

// O hode, høyt forhånet (HERZLICH TUT MICH VERLANGEN / Passion Chorale).
// Hans Leo Hassler (1601, d. 1612); harmonisert av J. S. Bach. Mollmodus,
// keySignature 'd'. Barform (2 stollen + avgesang). Koral-idiom → nivå 1–3.
// Melodi nedtegnet etter minne → kontroll ved tvil.
const oHodeHoytForhaanet: SongSource = {
  slug: 'o-hode-hoyt-forhaanet',
  title: 'O hode, høyt forhånet',
  subtitle: 'HERZLICH TUT MICH VERLANGEN — Passion Chorale',
  tradition: 'salme',
  original_key: 2, // D (moll)
  mode: 'minor',
  default_bpm: 76,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'd',
  sections: [
    { id: 's1', kind: 'verse', label: 'Stollen 1', startBeat: 0, endBeat: 8 },
    { id: 's2', kind: 'verse', label: 'Stollen 2', startBeat: 8, endBeat: 16 },
    { id: 'a1', kind: 'verse', label: 'Avgesang 1', startBeat: 16, endBeat: 24 },
    { id: 'a2', kind: 'ending', label: 'Avgesang 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // Stollen 1 «O hode, høyt forhånet»
    [A4, 1], [A4, 1], [A4, 1], [G4, 1], [F4, 1], [E4, 1], [D4, 2],
    // Stollen 2 «med sår og hån og spott»
    [A4, 1], [Bb4, 1], [A4, 1], [G4, 1], [A4, 1], [G4, 1], [F4, 2],
    // Avgesang 1 «du hode, kronet, tornet»
    [C5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [A4, 1], [F4, 2],
    // Avgesang 2 «å, se hvor du er blek»
    [F4, 1], [G4, 1], [A4, 1], [Bb4, 1], [A4, 1], [G4, 1], [D4, 2],
  ]),
  chords: [
    ch(0, 2, 2, 'm'), ch(2, 2, 5), ch(4, 2, 9, '7'), ch(6, 2, 2, 'm'),
    ch(8, 2, 2, 'm'), ch(10, 2, 7, 'm'), ch(12, 2, 0), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 2, 9, '7'), ch(22, 2, 2, 'm'),
    ch(24, 2, 10), ch(26, 2, 7, 'm'), ch(28, 2, 9, '7'), ch(30, 2, 2, 'm'),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Hans Leo Hassler (HERZLICH TUT MICH VERLANGEN)', role: 'komponist', deathYear: 1612 },
      { name: 'J. S. Bach (harmonisering)', role: 'kilde-arrangør', deathYear: 1750 },
      { name: 'Paul Gerhardt (tysk tekst)', role: 'tekstforfatter', deathYear: 1676 },
    ],
    sources: ['Hassler: Lustgarten neuer teutscher Gesäng (1601)', 'Bach: koralharmoniseringer'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Passjonskoralen; melodi etter minne av Bach-harmonisert form — anbefalt kontroll av frygisk/moll-spelling mot koralbok.',
  },
  tags: ['påske', 'pasjon', 'klassiker', 'kontroller-melodi'],
  levels: [1, 2, 3],
}

// When I Survey the Wondrous Cross (HAMBURG). Lowell Mason (1824, d. 1872),
// etter gregoriansk motiv; tekst Isaac Watts (d. 1748). F-dur, 4/4, Long Meter.
// Trinnvis, smal ambitus. Koral-idiom → nivå 1–3.
const whenISurvey: SongSource = {
  slug: 'when-i-survey-the-wondrous-cross',
  title: 'When I Survey the Wondrous Cross',
  subtitle: 'HAMBURG',
  tradition: 'hymne',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 72,
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
    // «When I survey the wondrous cross»
    [F4, 1], [F4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 1], [F4, 2],
    // «on which the Prince of glory died»
    [A4, 1], [A4, 1], [Bb4, 1], [C5, 1], [C5, 1], [Bb4, 1], [A4, 2],
    // «my richest gain I count but loss»
    [C5, 1], [C5, 1], [Bb4, 1], [A4, 1], [G4, 1], [A4, 1], [F4, 2],
    // «and pour contempt on all my pride»
    [F4, 1], [G4, 1], [A4, 1], [G4, 1], [F4, 1], [E4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 0), ch(4, 2, 10), ch(6, 2, 5),
    ch(8, 2, 5), ch(10, 2, 10), ch(12, 2, 0, '7'), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 2, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 5), ch(26, 2, 0), ch(28, 2, 0, '7'), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Lowell Mason (HAMBURG)', role: 'komponist', deathYear: 1872 },
      { name: 'Isaac Watts', role: 'tekstforfatter', deathYear: 1748 },
    ],
    sources: ['Mason: The Boston Handel and Haydn Society Collection (1824)', 'Watts: Hymns and Spiritual Songs (1707)'],
    verifiedAt: '2026-07-13',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Melodi etter minne av standard hymnal-form (trinnvis, smal ambitus) — anbefalt lett kontroll.',
  },
  tags: ['påske', 'pasjon', 'klassiker', 'kontroller-melodi'],
  levels: [1, 2, 3],
}

export const paskeSources: SongSource[] = [
  degVaereAere,
  kristStodOpp,
  oHodeHoytForhaanet,
  whenISurvey,
]
