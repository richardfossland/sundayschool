import type { SongNote } from '@/types/song'
import type { SongSource } from '@/types/song-source'
import { R, line, ch } from '../_helpers.ts'

// ── Hymner (verk-kilder) ─────────────────────────────────────────────────────
// 12 engelske hymner, håndskrevet ÉN gang (melodi + akkorder + rettigheter) og
// materialisert til spillbare arrangementer via lib/arranger/piano-arrangement.
// Melodiene er kontrollert mot skriftlige kilder (Open Hymnal-ABC-korpuset =
// Hymns Ancient & Modern m.fl., Timeless Truths-MusicXML og hymnal.net-satser)
// — ikke gehør alene. Kun verk med reell kildeusikkerhet tagges
// 'kontroller-melodi'. Husk .ts-endelser i relative imports (seed-scriptet
// kjører via Node type-stripping). Melodi: kun h:'R', monofon, C3–C6.

// Delte tonehøyde-konstanter (MIDI). Gs4/Ab4 er samme tangent — begge navn
// brukes der notebildet ville skrevet dem ulikt.
const Bb3 = 58, C4 = 60, Cs4 = 61, D4 = 62, Eb4 = 63, E4 = 64, F4 = 65
const Fs4 = 66, G4 = 67, Gs4 = 68, Ab4 = 68, A4 = 69, Bb4 = 70, B4 = 71
const C5 = 72, Cs5 = 73, D5 = 74, Eb5 = 75, E5 = 76

// 9/8-notasjon i 3/4 (Blessed Assurance): melodien føres i HELE åttedels-
// enheter (1 åttedel = 1/3 slag) og deles på 3 først per note — akkumulering
// av 1/3-flyttall ville ellers driftet onsetene bort fra de eksakte
// helslags-akkordstartene (og knekt monofoni-/fill-matchingen i arrangøren).
function tripletLine(steps: [number, number][]): SongNote[] {
  const out: SongNote[] = []
  let u = 0 // tid i åttedels-enheter (heltall/halve → eksakt aritmetikk)
  for (const [p, du] of steps) {
    if (p !== R) out.push({ p, t: u / 3, d: du / 3, h: 'R' })
    u += du
  }
  return out
}

// ── Holy, Holy, Holy! (NICAEA) ───────────────────────────────────────────────
// Dykes 1861; sats Hymns A&M 1869 (verifisert mot Open Hymnal-ABC, transponert
// D→Eb). 11.12.12.10: merk «Lord» holdt 2 slag i frase 1 og oppgangen til Eb5
// på «morning» i frase 2. Koral → levels [1,2,3].
const holyHolyHoly: SongSource = {
  slug: 'holy-holy-holy',
  title: 'Holy, Holy, Holy!',
  subtitle: 'NICAEA',
  tradition: 'hymne',
  original_key: 3, // Eb
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'Eb',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 32, endBeat: 48 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 48, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // «Holy, holy, holy! Lord God Almighty!»
    [Eb4, 1], [Eb4, 1], [G4, 1], [G4, 1],
    [Bb4, 2], [Bb4, 2],
    [C5, 2], [C5, 1], [C5, 1],
    [Bb4, 2], [G4, 2],
    // «Early in the morning our song shall rise to Thee»
    [Bb4, 1.5], [Bb4, 0.5], [Bb4, 1], [Bb4, 1],
    [Eb5, 2], [D5, 1], [Bb4, 1],
    [F4, 1], [Bb4, 1], [C5, 1.5], [Bb4, 0.5],
    [Bb4, 4],
    // «Holy, holy, holy! merciful and mighty!»
    [Eb4, 1], [Eb4, 1], [G4, 1], [G4, 1],
    [Bb4, 2], [Bb4, 2],
    [C5, 1.5], [C5, 0.5], [C5, 1], [C5, 1],
    [Bb4, 2], [Bb4, 2],
    // «God in three Persons, blessed Trinity!»
    [Eb5, 2], [Bb4, 1], [Bb4, 1],
    [C5, 2], [G4, 2],
    [Ab4, 1], [F4, 1], [F4, 1.5], [Eb4, 0.5],
    [Eb4, 4],
  ]),
  chords: [
    ch(0, 2, 3), ch(2, 2, 0, 'm'), ch(4, 2, 10), ch(6, 2, 3),
    ch(8, 4, 8), ch(12, 4, 3),
    ch(16, 4, 10), ch(20, 1, 0, 'm'), ch(21, 1, 5, '7'), ch(22, 1, 10, '', 2), ch(23, 1, 3),
    ch(24, 2, 10, '', 5), ch(26, 2, 5, '7'), ch(28, 4, 10),
    ch(32, 2, 3), ch(34, 2, 0, 'm'), ch(36, 2, 10), ch(38, 2, 3),
    ch(40, 4, 8), ch(44, 4, 3),
    ch(48, 2, 0, 'm'), ch(50, 2, 3, '', 7), ch(52, 2, 8), ch(54, 2, 3, '7'),
    ch(56, 1, 8), ch(57, 1, 5, 'm'), ch(58, 2, 10, '7'), ch(60, 4, 3),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'John Bacchus Dykes (NICAEA)', role: 'komponist', deathYear: 1876 },
      { name: 'Reginald Heber', role: 'tekstforfatter', deathYear: 1826 },
    ],
    sources: ['Hymns Ancient and Modern (1861)', 'Hymns Ancient and Modern (1869), nr. 135'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk; melodi kontrollert mot H A&M-satsen.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 2, 3],
}

// ── Nearer, My God, to Thee (BETHANY) ────────────────────────────────────────
// Lowell Mason 1856/1859 (verifisert mot Open Hymnal-ABC = Masons egen sats i
// The Sabbath Hymn and Tune Book 1859). 6/4, G-dur. Form AABA.
const nearerMyGod: SongSource = {
  slug: 'nearer-my-god-to-thee',
  title: 'Nearer, My God, to Thee',
  subtitle: 'BETHANY',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 108,
  timeSignature: '6/4',
  beatsPerBar: 6,
  pickupBeats: 0,
  totalBeats: 96,
  keySignature: 'G',
  sections: [
    { id: 'a1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 24 },
    { id: 'a2', kind: 'verse', label: 'Frase 2', startBeat: 24, endBeat: 48 },
    { id: 'b', kind: 'bridge', label: 'Midtdel', startBeat: 48, endBeat: 72 },
    { id: 'a3', kind: 'ending', label: 'Slutt', startBeat: 72, endBeat: 96 },
  ],
  melody: line('R', 0, [
    // «Nearer, my God, to Thee, nearer to Thee!»
    [B4, 3], [A4, 2], [G4, 1],
    [G4, 2], [E4, 1], [E4, 3],
    [D4, 3], [G4, 2], [B4, 1],
    [A4, 5], [R, 1],
    // «E'en though it be a cross that raiseth me»
    [B4, 3], [A4, 2], [G4, 1],
    [G4, 2], [E4, 1], [E4, 3],
    [D4, 2], [G4, 1], [Fs4, 2], [A4, 1],
    [G4, 5], [R, 1],
    // «Still all my song shall be, nearer, my God, to Thee»
    [D5, 3], [E5, 2], [D5, 1],
    [D5, 2], [B4, 1], [D5, 3],
    [D5, 3], [E5, 2], [D5, 1],
    [D5, 2], [B4, 1], [A4, 3],
    // «Nearer, my God, to Thee, nearer to Thee!»
    [B4, 3], [A4, 2], [G4, 1],
    [G4, 2], [E4, 1], [E4, 3],
    [D4, 2], [G4, 1], [Fs4, 2], [A4, 1],
    [G4, 5], [R, 1],
  ]),
  chords: [
    ch(0, 3, 7), ch(3, 2, 2, '7'), ch(5, 1, 4, 'm'), ch(6, 6, 0),
    ch(12, 6, 7), ch(18, 6, 2),
    ch(24, 3, 7), ch(27, 2, 2, '7'), ch(29, 1, 4, 'm'), ch(30, 6, 0),
    ch(36, 3, 7, '', 2), ch(39, 2, 2), ch(41, 1, 2, '7'), ch(42, 6, 7),
    ch(48, 3, 7), ch(51, 2, 0, '', 7), ch(53, 1, 7), ch(54, 6, 7),
    ch(60, 3, 7), ch(63, 2, 0), ch(65, 1, 7), ch(66, 2, 2, '', 6), ch(68, 1, 7), ch(69, 3, 2),
    ch(72, 3, 7), ch(75, 2, 2, '7'), ch(77, 1, 4, 'm'), ch(78, 6, 0),
    ch(84, 3, 7, '', 2), ch(87, 2, 2), ch(89, 1, 2, '7'), ch(90, 6, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Lowell Mason (BETHANY)', role: 'komponist', deathYear: 1872 },
      { name: 'Sarah Flower Adams', role: 'tekstforfatter', deathYear: 1848 },
    ],
    sources: ['The Sabbath Hymn and Tune Book (1859)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk; melodi kontrollert mot Masons 1859-sats.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── Abide With Me (EVENTIDE) ─────────────────────────────────────────────────
// W. H. Monk 1861; sats H A&M 1869 (verifisert mot Open Hymnal-ABC, original
// Eb). Merk A-naturell (kromatisk ledetone) i takt 7. Koral → levels [1,2,3].
const abideWithMe: SongSource = {
  slug: 'abide-with-me',
  title: 'Abide With Me',
  subtitle: 'EVENTIDE',
  tradition: 'hymne',
  original_key: 3, // Eb
  mode: 'major',
  default_bpm: 84,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'Eb',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 32, endBeat: 48 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 48, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // «Abide with me; fast falls the eventide»
    [G4, 2], [G4, 1], [F4, 1],
    [Eb4, 2], [Bb4, 2],
    [C5, 1], [Bb4, 1], [Bb4, 1], [Ab4, 1],
    [G4, 4],
    // «The darkness deepens; Lord, with me abide»
    [G4, 2], [Ab4, 1], [Bb4, 1],
    [C5, 2], [Bb4, 2],
    [Ab4, 1], [F4, 1], [G4, 1], [A4, 1],
    [Bb4, 4],
    // «When other helpers fail and comforts flee»
    [G4, 2], [G4, 1], [F4, 1],
    [Eb4, 2], [Bb4, 2],
    [Bb4, 1], [Ab4, 1], [Ab4, 1], [G4, 1],
    [F4, 4],
    // «Help of the helpless, O abide with me»
    [F4, 2], [G4, 1], [Ab4, 1],
    [G4, 1], [F4, 1], [Eb4, 1], [Ab4, 1],
    [G4, 2], [F4, 2],
    [Eb4, 4],
  ]),
  chords: [
    ch(0, 2, 3), ch(2, 2, 10, '7'), ch(4, 2, 0, 'm'), ch(6, 2, 3, '', 7),
    ch(8, 2, 8), ch(10, 2, 10, '7'), ch(12, 4, 3),
    ch(16, 2, 3), ch(18, 1, 8, '', 0), ch(19, 1, 3, '', 10), ch(20, 2, 8), ch(22, 2, 3),
    ch(24, 1, 5, 'm'), ch(25, 1, 10), ch(26, 1, 3), ch(27, 1, 5, '7'), ch(28, 4, 10),
    ch(32, 2, 3), ch(34, 2, 10, '7'), ch(36, 2, 0, 'm'), ch(38, 2, 3, '', 7),
    ch(40, 2, 8), ch(42, 1, 0, 'aug'), ch(43, 1, 0, '7'), ch(44, 4, 5, 'm'),
    ch(48, 2, 10, '7'), ch(50, 2, 3, '', 7),
    ch(52, 1, 3), ch(53, 1, 10, '7'), ch(54, 1, 0, 'm'), ch(55, 1, 5, 'm', 8),
    ch(56, 2, 3, '', 10), ch(58, 2, 10, '7'), ch(60, 4, 3),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'William Henry Monk (EVENTIDE)', role: 'komponist', deathYear: 1889 },
      { name: 'Henry Francis Lyte', role: 'tekstforfatter', deathYear: 1847 },
    ],
    sources: ['Hymns Ancient and Modern (1861)', 'Hymns Ancient and Modern (1869), nr. 14'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk; melodi kontrollert mot Monks egen sats.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 2, 3],
}

// ── Be Thou My Vision (SLANE) ────────────────────────────────────────────────
// Trad. irsk folketone (publ. Joyce 1909, koblet til teksten fra 1919);
// kontrollert mot Open Hymnal-satsen i Eb. SLANE finnes i flere hymnal-
// varianter (særlig frase 2/4) → 'kontroller-melodi'.
const beThouMyVision: SongSource = {
  slug: 'be-thou-my-vision',
  title: 'Be Thou My Vision',
  subtitle: 'SLANE — trad. irsk',
  tradition: 'hymne',
  original_key: 3, // Eb
  mode: 'major',
  default_bpm: 92,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 48,
  keySignature: 'Eb',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 24, endBeat: 36 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 36, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // «Be Thou my Vision, O Lord of my heart»
    [Eb4, 1], [Eb4, 1], [F4, 0.5], [Eb4, 0.5],
    [C4, 1], [Bb3, 1], [Bb3, 0.5], [C4, 0.5],
    [Eb4, 1], [Eb4, 1], [F4, 1],
    [G4, 3],
    // «Naught be all else to me, save that Thou art»
    [F4, 1], [F4, 1], [F4, 1],
    [F4, 1], [G4, 1], [Bb4, 1],
    [C5, 1], [Bb4, 1], [G4, 1],
    [Bb4, 3],
    // «Thou my best Thought, by day or by night»
    [C5, 1], [C5, 0.5], [D5, 0.5], [Eb5, 0.5], [D5, 0.5],
    [C5, 1], [Bb4, 1], [G4, 1],
    [Bb4, 1], [Eb4, 1], [D4, 1],
    [C4, 2], [Bb3, 1],
    // «Waking or sleeping, Thy presence my light»
    [Eb4, 1], [G4, 1], [Bb4, 1],
    [C5, 0.5], [Bb4, 0.5], [G4, 1], [Eb4, 0.5], [G4, 0.5],
    [F4, 1], [Eb4, 1], [Eb4, 1],
    [Eb4, 3],
  ]),
  chords: [
    ch(0, 3, 3),
    ch(3, 1, 8), ch(4, 1, 10), ch(5, 1, 0, 'm'),
    ch(6, 2, 3), ch(8, 1, 10),
    ch(9, 3, 3),
    ch(12, 3, 10),
    ch(15, 1, 10), ch(16, 1, 7, 'm'), ch(17, 1, 3),
    ch(18, 1, 8), ch(19, 1, 10), ch(20, 1, 0, 'm'),
    ch(21, 3, 3),
    ch(24, 2, 8), ch(26, 1, 10),
    ch(27, 1, 8), ch(28, 1, 10), ch(29, 1, 3),
    ch(30, 2, 3), ch(32, 1, 10),
    ch(33, 2, 8), ch(35, 1, 3, '', 7),
    ch(36, 3, 3),
    ch(39, 1, 8), ch(40, 2, 3),
    ch(42, 1, 10, '7'), ch(43, 5, 3),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Trad. irsk (SLANE)', role: 'komponist', deathYear: null },
      { name: 'Dallán Forgaill (attr., 700-tallet)', role: 'tekstforfatter', deathYear: null },
      { name: 'Mary E. Byrne', role: 'oversetter', deathYear: 1931 },
      { name: 'Eleanor Hull', role: 'oversetter', deathYear: 1935 },
    ],
    sources: ['Joyce: Old Irish Folk Music and Songs (1909)', 'Church Hymnal (Irland, 1919)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Folketone med hymnal-varianter — kontroller mot koralbok.',
  },
  tags: ['klassiker', 'engelsk', 'kontroller-melodi'],
  levels: [1, 3],
}

// ── Old Hundredth ────────────────────────────────────────────────────────────
// Genève-psalteret 1551 (attr. Louis Bourgeois); tonene verifisert mot Open
// Hymnal (Sternhold & Hopkins 1561). Rytmen er den isometriske hymnal-formen:
// frasesluttene holdes 2 slag (den genevanske originalen har 3) slik at hver
// frase blir nøyaktig 3 takter i 4/4. Koral → levels [1,2,3]. Ingen opptakt.
const oldHundredth: SongSource = {
  slug: 'old-hundredth',
  title: 'Old Hundredth',
  subtitle: 'Genève-psalteret — «Praise God, from Whom All Blessings Flow»',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 48,
  keySignature: 'G',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 24, endBeat: 36 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 36, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // «Praise God, from Whom all blessings flow»
    [G4, 2], [G4, 1], [Fs4, 1], [E4, 1], [D4, 1], [G4, 2], [A4, 2], [B4, 2],
    // «Praise Him, all creatures here below»
    [B4, 2], [B4, 1], [B4, 1], [A4, 1], [G4, 1], [C5, 2], [B4, 2], [A4, 2],
    // «Praise Him above, ye heavenly host»
    [G4, 2], [A4, 1], [B4, 1], [A4, 1], [G4, 1], [E4, 2], [Fs4, 2], [G4, 2],
    // «Praise Father, Son, and Holy Ghost»
    [D5, 2], [B4, 1], [G4, 1], [A4, 1], [C5, 1], [B4, 2], [A4, 2], [G4, 2],
  ]),
  chords: [
    ch(0, 3, 7), ch(3, 1, 2), ch(4, 1, 4, 'm'), ch(5, 1, 11, 'm'),
    ch(6, 2, 4, 'm'), ch(8, 2, 2), ch(10, 2, 7),
    ch(12, 4, 7), ch(16, 1, 2, '7'), ch(17, 1, 4, 'm'),
    ch(18, 2, 0), ch(20, 2, 7), ch(22, 2, 2),
    ch(24, 2, 4, 'm'), ch(26, 1, 2), ch(27, 1, 7), ch(28, 1, 2), ch(29, 1, 7, '', 11),
    ch(30, 2, 0), ch(32, 2, 2), ch(34, 2, 7),
    ch(36, 2, 7), ch(38, 1, 7), ch(39, 1, 4, 'm'), ch(40, 1, 2), ch(41, 1, 9, 'm'),
    ch(42, 2, 4, 'm'), ch(44, 1, 2), ch(45, 1, 2, '7'), ch(46, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Louis Bourgeois (attr., Genève-psalteret)', role: 'komponist', deathYear: 1561 },
      { name: 'Thomas Ken (doksologien)', role: 'tekstforfatter', deathYear: 1711 },
    ],
    sources: ['Genève-psalteret (1551)', 'Sternhold & Hopkins: Psalter (1561)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. Isometrisk hymnal-rytme (fraseslutt 2 slag); tonene følger 1561-satsen.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 2, 3],
}

// ── It Is Well with My Soul (VILLE DU HAVRE) ─────────────────────────────────
// Bliss 1876 (verifisert mot Open Hymnal-ABC, The Evangelical Hymnal 1921,
// transponert Db→C). 1 slags opptakt («When»). Vers + refreng — refrengets
// lange «It is well … with my soul» er holdt i sopranen (ekkostemmene ligger i
// satsen, ikke i melodien).
const itIsWellMelody = line('R', 0, [
  [G4, 1], // opptakt: «When»
  [G4, 2], [F4, 1], [E4, 1],
  [E4, 2], [D4, 1], [E4, 1],
  [F4, 1], [A4, 1], [G4, 1], [F4, 1],
  [E4, 3], [G4, 1],
  [C5, 2], [B4, 1], [A4, 1],
  [A4, 2], [G4, 1], [Fs4, 1],
  [G4, 3], [G4, 1],
  [C5, 2], [C5, 1], [B4, 1],
  [A4, 2], [A4, 1], [A4, 1],
  [D5, 2], [D5, 1], [C5, 1],
  [B4, 2], [A4, 1], [G4, 1],
  [C5, 2], [C5, 1], [C5, 1],
  [C5, 2], [B4, 1.5], [C5, 0.5],
  [C5, 2], [G4, 1], [G4, 1],
  // Refreng: «It is well (with my soul), with my soul (with my soul) …»
  [G4, 4], [G4, 2], [G4, 1], [G4, 1],
  [G4, 4], [G4, 2], [E4, 1], [G4, 1],
  [A4, 2], [A4, 1], [C5, 1],
  [C5, 2], [B4, 1.5], [C5, 0.5],
  [C5, 3],
])
// De holdte refreng-tonene bindes over taktstreken (t57→61 og t65→69).
for (const n of itIsWellMelody) if ((n.t === 57 || n.t === 65) && n.p === G4) n.tie = true

const itIsWell: SongSource = {
  slug: 'it-is-well-with-my-soul',
  title: 'It Is Well with My Soul',
  subtitle: 'VILLE DU HAVRE',
  tradition: 'hymne',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 88,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 1,
  totalBeats: 84,
  keySignature: 'C',
  sections: [
    { id: 'vers', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 55 },
    { id: 'refr', kind: 'refrain', label: 'Refreng', startBeat: 55, endBeat: 84 },
  ],
  melody: itIsWellMelody,
  chords: [
    ch(0, 5, 0), ch(5, 2, 0, '', 7), ch(7, 1, 7, '7'), ch(8, 1, 0, '', 4),
    ch(9, 2, 7, '7', 2), ch(11, 2, 7, '7'), ch(13, 4, 0),
    ch(17, 2, 9, 'm'), ch(19, 1, 8, 'dim'), ch(20, 1, 9, 'm'),
    ch(21, 2, 9, 'm', 0), ch(23, 1, 7, '', 2), ch(24, 1, 2, '7'),
    ch(25, 3, 7), ch(28, 1, 7, '7'), ch(29, 4, 0),
    ch(33, 3, 5), ch(36, 1, 9, '7', 4), ch(37, 2, 2), ch(39, 2, 2, '7'),
    ch(41, 2, 7), ch(43, 2, 7, '7'),
    ch(45, 3, 0, '', 4), ch(48, 1, 5), ch(49, 2, 0, '', 7), ch(51, 2, 7, '7'), ch(53, 4, 0),
    ch(57, 4, 0), ch(61, 4, 7), ch(65, 4, 7, '7'), ch(69, 4, 0),
    ch(73, 4, 5), ch(77, 2, 0, '', 7), ch(79, 2, 7, '7'), ch(81, 3, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Philip P. Bliss (VILLE DU HAVRE)', role: 'komponist', deathYear: 1876 },
      { name: 'Horatio G. Spafford', role: 'tekstforfatter', deathYear: 1888 },
    ],
    sources: ['Gospel Hymns No. 2 (1876)', 'The Evangelical Hymnal (1921), nr. 208'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk; refrengets ekkostemmer er utelatt (kun sopranmelodien).',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── Blessed Assurance (ASSURANCE) ────────────────────────────────────────────
// Phoebe Knapp 1873 (verifisert mot Open Hymnal-ABC, The Lesser Hymnal 1875).
// Originalen står i 9/8; her notert i 3/4 der ett slag = punktert firedel og
// åttedelsgruppene blir trioler (T = 1/3) — ellers ville notasjonen krøllet
// seg. Tonene og den relative rytmen er uendret. 1 slags opptakt.
const blessedAssurance: SongSource = {
  slug: 'blessed-assurance',
  title: 'Blessed Assurance',
  subtitle: 'ASSURANCE — Knapp (9/8 notert i 3/4 med trioler)',
  tradition: 'hymne',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 56,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 1,
  totalBeats: 48,
  keySignature: 'D',
  sections: [
    { id: 'vers', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 24 },
    { id: 'refr', kind: 'refrain', label: 'Refreng', startBeat: 24, endBeat: 48 },
  ],
  // Varigheter i åttedels-enheter (3 = punktert firedel = ett 3/4-slag).
  melody: tripletLine([
    // «Blessed assurance, Jesus is mine!»
    [Fs4, 1], [E4, 1], [D4, 1],
    [A4, 3], [A4, 3], [G4, 1], [A4, 1], [B4, 1],
    [A4, 6], [A4, 1], [Fs4, 1], [A4, 1],
    // «O what a foretaste of glory divine!»
    [D5, 3], [Cs5, 2], [Cs5, 1], [B4, 1], [A4, 1], [Gs4, 1],
    [A4, 6], [Fs4, 1], [E4, 1], [D4, 1],
    // «Heir of salvation, purchase of God»
    [A4, 3], [A4, 3], [G4, 1], [A4, 1], [B4, 1],
    [A4, 6], [D4, 1], [E4, 1], [Fs4, 1],
    // «born of His Spirit, washed in His blood»
    [G4, 3], [E4, 3], [D4, 1], [E4, 1], [Cs4, 1],
    [D4, 6], [A4, 1], [A4, 1], [A4, 1],
    // Refreng: «This is my story, this is my song»
    [D5, 3], [A4, 3], [B4, 1], [B4, 1], [B4, 1],
    [A4, 6], [A4, 1], [A4, 1], [A4, 1],
    // «praising my Savior all the day long»
    [B4, 3], [D5, 3], [Cs5, 1], [Cs5, 1], [B4, 1],
    [Cs5, 6], [Cs5, 1], [D5, 1], [E5, 1],
    // «this is my story, this is my song»
    [D5, 3], [A4, 3], [B4, 1], [A4, 1], [B4, 1],
    [A4, 6], [D4, 1], [E4, 1], [Fs4, 1],
    // «praising my Savior all the day long»
    [G4, 3], [E4, 3], [D4, 1.5], [E4, 0.5], [Cs4, 1],
    [D4, 6],
  ]),
  chords: [
    ch(0, 4, 2), ch(4, 3, 2),
    ch(7, 1, 2), ch(8, 1, 9, '', 4), ch(9, 1, 4, '7'),
    ch(10, 2, 9), ch(12, 1, 2),
    ch(13, 3, 2), ch(16, 3, 2),
    ch(19, 2, 7), ch(21, 1, 9, '7'), ch(22, 3, 2),
    ch(25, 2, 2), ch(27, 1, 7), ch(28, 3, 2),
    ch(31, 1, 7), ch(32, 1, 2, '', 6), ch(33, 1, 9, '', 4), ch(34, 3, 9),
    ch(37, 3, 2), ch(40, 3, 2),
    ch(43, 2, 7), ch(45, 1, 9, '7'), ch(46, 2, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Phoebe Palmer Knapp (ASSURANCE)', role: 'komponist', deathYear: 1908 },
      { name: 'Fanny Crosby', role: 'tekstforfatter', deathYear: 1915 },
    ],
    sources: ["Palmer's Guide to Holiness and Revival Miscellany (1873)", 'The Lesser Hymnal (1875)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. 9/8-originalen er notert i 3/4 med triol-underdeling; toner/relativ rytme uendret.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── Come, Thou Fount of Every Blessing (NETTLETON) ───────────────────────────
// Trad. amerikansk (Wyeth's Repository, Part Second, 1813); verifisert mot
// Open Hymnal-ABC (Evangelical Hymnal 1921), transponert Eb→D. 3/4, 1 slags
// opptakt (to åttedeler). Form AABA med løftet midtdel.
const comeThouFount: SongSource = {
  slug: 'come-thou-fount',
  title: 'Come, Thou Fount of Every Blessing',
  subtitle: 'NETTLETON',
  tradition: 'hymne',
  original_key: 2, // D
  mode: 'major',
  default_bpm: 90,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 1,
  totalBeats: 48,
  keySignature: 'D',
  sections: [
    { id: 'a1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
    { id: 'a2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
    { id: 'b', kind: 'bridge', label: 'Midtdel', startBeat: 24, endBeat: 36 },
    { id: 'a3', kind: 'ending', label: 'Slutt', startBeat: 36, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // «Come, Thou Fount of every blessing»
    [Fs4, 0.5], [E4, 0.5],
    [D4, 1], [D4, 1], [Fs4, 0.5], [A4, 0.5],
    [E4, 1], [E4, 1], [Fs4, 0.5], [A4, 0.5],
    // «tune my heart to sing Thy grace»
    [B4, 1], [A4, 1], [Fs4, 0.5], [E4, 0.5],
    [D4, 2], [Fs4, 0.5], [E4, 0.5],
    // «Streams of mercy, never ceasing»
    [D4, 1], [D4, 1], [Fs4, 0.5], [A4, 0.5],
    [E4, 1], [E4, 1], [Fs4, 0.5], [A4, 0.5],
    // «call for songs of loudest praise»
    [B4, 1], [A4, 1], [Fs4, 0.5], [E4, 0.5],
    [D4, 2], [A4, 0.5], [B4, 0.25], [Cs5, 0.25],
    // «Teach me some melodious sonnet»
    [D5, 1], [Cs5, 1], [B4, 0.5], [A4, 0.5],
    [B4, 0.5], [A4, 0.5], [Fs4, 1], [A4, 0.5], [B4, 0.25], [Cs5, 0.25],
    // «sung by flaming tongues above»
    [D5, 1], [Cs5, 1], [B4, 0.5], [A4, 0.5],
    [D5, 2], [Fs4, 0.5], [E4, 0.5],
    // «Praise the mount! I'm fixed upon it»
    [D4, 1], [D4, 1], [Fs4, 0.5], [A4, 0.5],
    [E4, 1], [E4, 1], [Fs4, 0.5], [A4, 0.5],
    // «mount of Thy redeeming love»
    [B4, 1], [A4, 1], [Fs4, 0.5], [E4, 0.5],
    [D4, 2],
  ]),
  chords: [
    ch(0, 4, 2), ch(4, 2, 9), ch(6, 1, 2),
    ch(7, 1, 7), ch(8, 1, 2), ch(9, 1, 9, '7'),
    ch(10, 3, 2), ch(13, 3, 2),
    ch(16, 2, 9), ch(18, 1, 2),
    ch(19, 1, 7), ch(20, 1, 2), ch(21, 1, 9, '7'),
    ch(22, 6, 2),
    ch(28, 1, 7), ch(29, 2, 2),
    ch(31, 1, 11, 'm'), ch(32, 1, 6, 'm'), ch(33, 1, 9),
    ch(34, 3, 2), ch(37, 3, 2),
    ch(40, 2, 9), ch(42, 1, 2),
    ch(43, 1, 7), ch(44, 1, 2), ch(45, 1, 9, '7'),
    ch(46, 2, 2),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: "Trad. amerikansk (NETTLETON, Wyeth's Repository 1813)", role: 'komponist', deathYear: null },
      { name: 'Robert Robinson', role: 'tekstforfatter', deathYear: 1790 },
    ],
    sources: ["Wyeth's Repository of Sacred Music, Part Second (1813)", 'The Evangelical Hymnal (1921)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk; melodi kontrollert mot 1921-satsen.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── I Surrender All (SURRENDER) ──────────────────────────────────────────────
// Weeden 1896 (verifisert mot Timeless Truths-MusicXML, transponert D→C).
// Vers + refreng; refrengets «all …» hviler ett slag mellom fraselinjene.
const iSurrenderAll: SongSource = {
  slug: 'i-surrender-all',
  title: 'I Surrender All',
  subtitle: 'SURRENDER — Weeden',
  tradition: 'hymne',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 76,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'C',
  sections: [
    { id: 'vers', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 32 },
    { id: 'refr', kind: 'refrain', label: 'Refreng', startBeat: 32, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // «All to Jesus I surrender»
    [E4, 1.5], [E4, 0.5], [F4, 1], [E4, 1],
    [D4, 1.5], [D4, 0.5], [E4, 1], [D4, 1],
    // «all to Him I freely give»
    [C4, 1.5], [C4, 0.5], [F4, 1], [E4, 1],
    [D4, 1], [E4, 1], [C4, 2],
    // «I will ever love and trust Him»
    [E4, 1.5], [E4, 0.5], [F4, 1], [E4, 1],
    [D4, 1.5], [D4, 0.5], [E4, 1], [D4, 1],
    // «in His presence daily live»
    [C4, 1.5], [C4, 0.5], [F4, 1], [E4, 1],
    [D4, 1], [E4, 1], [C4, 2],
    // Refreng: «I surrender all, I surrender all»
    [C5, 1.5], [B4, 0.5], [A4, 1], [G4, 1],
    [F4, 3], [R, 1],
    [B4, 1.5], [A4, 0.5], [G4, 1], [F4, 1],
    [E4, 3], [R, 1],
    // «all to Thee, my blessed Savior, I surrender all»
    [E4, 1.5], [F4, 0.5], [A4, 1], [G4, 1],
    [C5, 1.5], [B4, 0.5], [B4, 1], [A4, 1],
    [G4, 1.5], [F4, 0.5], [E4, 1], [D4, 1],
    [C4, 3],
  ]),
  chords: [
    ch(0, 2, 0), ch(2, 1, 5, '', 0), ch(3, 1, 0), ch(4, 4, 7),
    ch(8, 2, 0), ch(10, 1, 5, '', 0), ch(11, 1, 0),
    ch(12, 1, 7), ch(13, 1, 7, '7'), ch(14, 2, 0),
    ch(16, 2, 0), ch(18, 1, 5, '', 0), ch(19, 1, 0), ch(20, 4, 7),
    ch(24, 2, 0), ch(26, 1, 5, '', 0), ch(27, 1, 0),
    ch(28, 1, 7), ch(29, 1, 7, '7'), ch(30, 2, 0),
    ch(32, 4, 0), ch(36, 8, 7, '7'), ch(44, 4, 0),
    ch(48, 2, 0), ch(50, 1, 5, '', 0), ch(51, 1, 0),
    ch(52, 2, 0), ch(54, 2, 7), ch(56, 2, 7), ch(58, 2, 7, '7'),
    ch(60, 4, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Winfield S. Weeden (SURRENDER)', role: 'komponist', deathYear: 1908 },
      { name: 'Judson W. Van DeVenter', role: 'tekstforfatter', deathYear: 1939 },
    ],
    sources: ['Gospel Songs of Grace and Glory (1896)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── Leaning on the Everlasting Arms (SHOWALTER) ──────────────────────────────
// Showalter 1887 (verifisert mot Timeless Truths-MusicXML, transponert Ab→G).
// Vers + refreng («Leaning, leaning …»).
const leaningOnTheArms: SongSource = {
  slug: 'leaning-on-the-everlasting-arms',
  title: 'Leaning on the Everlasting Arms',
  subtitle: 'SHOWALTER',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 100,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 64,
  keySignature: 'G',
  sections: [
    { id: 'vers', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 32 },
    { id: 'refr', kind: 'refrain', label: 'Refreng', startBeat: 32, endBeat: 64 },
  ],
  melody: line('R', 0, [
    // «What a fellowship, what a joy divine»
    [B4, 1], [B4, 1], [B4, 0.75], [A4, 0.25], [G4, 1],
    [A4, 1], [A4, 1], [A4, 0.75], [G4, 0.25], [E4, 1],
    // «leaning on the everlasting arms»
    [D4, 1], [D4, 1], [G4, 0.75], [Fs4, 0.25], [G4, 0.75], [A4, 0.25],
    [B4, 1], [B4, 1], [A4, 2],
    // «what a blessedness, what a peace is mine»
    [B4, 1], [B4, 1], [B4, 0.75], [A4, 0.25], [G4, 1],
    [A4, 1], [A4, 1], [A4, 0.75], [G4, 0.25], [E4, 1],
    // «leaning on the everlasting arms»
    [D4, 1], [D4, 1], [G4, 0.75], [Fs4, 0.25], [G4, 0.75], [A4, 0.25],
    [B4, 1], [A4, 1], [G4, 2],
    // Refreng: «Leaning, leaning, safe and secure from all alarms»
    [B4, 2], [G4, 2],
    [G4, 2], [E4, 2],
    [D4, 1], [G4, 0.75], [Fs4, 0.25], [G4, 1], [A4, 1],
    [B4, 1], [B4, 1], [A4, 2],
    // «leaning, leaning, leaning on the everlasting arms»
    [B4, 2], [G4, 2],
    [G4, 2], [E4, 2],
    [D4, 1], [D4, 1], [G4, 0.75], [Fs4, 0.25], [G4, 0.75], [A4, 0.25],
    [B4, 1], [A4, 1], [G4, 2],
  ]),
  chords: [
    ch(0, 4, 7), ch(4, 4, 0), ch(8, 4, 7), ch(12, 2, 7), ch(14, 2, 2, '', 6),
    ch(16, 4, 7), ch(20, 4, 0), ch(24, 4, 7),
    ch(28, 1, 7, '', 2), ch(29, 1, 2), ch(30, 2, 7),
    ch(32, 4, 7), ch(36, 4, 0),
    ch(40, 2, 7), ch(42, 1, 7, '', 11), ch(43, 1, 2),
    ch(44, 2, 7), ch(46, 2, 2),
    ch(48, 4, 7), ch(52, 4, 0),
    ch(56, 2, 7, '', 2), ch(58, 2, 2, '7'),
    ch(60, 1, 7, '', 2), ch(61, 1, 2, '7'), ch(62, 2, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Anthony J. Showalter', role: 'komponist', deathYear: 1924 },
      { name: 'Elisha A. Hoffman', role: 'tekstforfatter', deathYear: 1929 },
    ],
    sources: ['The Glad Evangel for Revival, Camp and Evangelistic Meetings (1887)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 3],
}

// ── Softly and Tenderly (THOMPSON) ───────────────────────────────────────────
// Will L. Thompson 1880 (verifisert mot Timeless Truths-MusicXML, transponert
// Ab→G). Originalen står i 6/8; her notert i 3/4 der 6/8-åttedelen = 0,5 slag
// («3/4-dotted-form») — alle verdier blir da rene halvslag. Refrengets
// «Come home»-ekkostemmer er utelatt (kun sopranen); den kromatiske
// D5–C#5–C5-nedgangen i «come ho-o-me» er beholdt. Ekko-normaliseringen gjør
// at refrenget bør kontrolleres mot koralbok → 'kontroller-melodi'.
const softlyAndTenderly: SongSource = {
  slug: 'softly-and-tenderly',
  title: 'Softly and Tenderly',
  subtitle: 'THOMPSON — «Jesus Is Calling» (6/8 notert i 3/4)',
  tradition: 'hymne',
  original_key: 7, // G
  mode: 'major',
  default_bpm: 76,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 0,
  totalBeats: 48,
  keySignature: 'G',
  sections: [
    { id: 'vers', kind: 'verse', label: 'Vers', startBeat: 0, endBeat: 23.5 },
    { id: 'refr', kind: 'refrain', label: 'Refreng', startBeat: 23.5, endBeat: 48 },
  ],
  melody: line('R', 0, [
    // «Softly and tenderly Jesus is calling»
    [B4, 0.75], [A4, 0.25], [G4, 0.5], [G4, 0.5], [Fs4, 0.5], [G4, 0.5],
    [A4, 0.5], [G4, 0.5], [E4, 0.5], [E4, 0.5], [D4, 0.5], [R, 0.5],
    // «calling for you and for me»
    [G4, 0.5], [G4, 0.5], [G4, 0.5], [B4, 0.75], [A4, 0.25], [G4, 0.5],
    [A4, 2.5], [R, 0.5],
    // «See, on the portals He's waiting and watching»
    [B4, 0.75], [A4, 0.25], [G4, 0.5], [G4, 0.5], [Fs4, 0.5], [G4, 0.5],
    [A4, 0.5], [G4, 0.5], [E4, 0.5], [E4, 0.5], [D4, 0.5], [R, 0.5],
    // «watching for you and for me»
    [G4, 0.5], [G4, 0.5], [C5, 0.5], [B4, 0.75], [G4, 0.25], [A4, 0.5],
    [G4, 2.5],
    // Refreng: «Come home, come home»
    [D4, 0.5], // opptakt «Come» inn i refrenget
    [A4, 2.5], [B4, 0.5],
    [G4, 2.5], [R, 0.5],
    // «ye who are weary, come home»
    [A4, 0.5], [A4, 0.5], [A4, 0.5], [B4, 0.5], [B4, 0.5], [Cs5, 0.5],
    [D5, 1], [Cs5, 0.5], [C5, 1], [R, 0.5],
    // «Earnestly, tenderly, Jesus is calling»
    [B4, 0.75], [A4, 0.25], [G4, 0.5], [G4, 0.5], [Fs4, 0.5], [G4, 0.5],
    [A4, 0.5], [G4, 0.5], [E4, 0.5], [E4, 0.5], [D4, 0.5], [R, 0.5],
    // «calling, O sinner, come home!»
    [G4, 0.5], [G4, 0.5], [C5, 0.5], [B4, 0.5], [G4, 0.5], [A4, 0.5],
    [G4, 2.5],
  ]),
  chords: [
    ch(0, 3, 7), ch(3, 1, 0, '', 4), ch(4, 1, 0), ch(5, 1, 7),
    ch(6, 1, 7), ch(7, 2, 4, 'm'), ch(9, 3, 2),
    ch(12, 3, 7), ch(15, 1, 0, '', 4), ch(16, 1, 0), ch(17, 1, 7),
    ch(18, 1, 7, '', 11), ch(19, 1, 0), ch(20, 1, 2), ch(21, 3, 7),
    ch(24, 3, 2, '7'), ch(27, 3, 7),
    ch(30, 2, 2), ch(32, 1, 9), ch(33, 1, 2), ch(34, 2, 2, '7'),
    ch(36, 3, 7), ch(39, 1, 0, '', 4), ch(40, 1, 0), ch(41, 1, 7),
    ch(42, 1, 7, '', 11), ch(43, 1, 0), ch(44, 1, 2, '7sus4'), ch(45, 3, 7),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Will L. Thompson', role: 'komponist', deathYear: 1909 },
      { name: 'Will L. Thompson', role: 'tekstforfatter', deathYear: 1909 },
    ],
    sources: ['Sparkling Gems Nos. 1 and 2 (1880)'],
    verifiedAt: '2026-07-12',
    notes:
      'Egen kilde-nedtegnelse av public domain-verk. 6/8 notert i 3/4 (åttedel = halvslag); refrengets ekkostemmer utelatt — kontroller mot koralbok.',
  },
  tags: ['klassiker', 'engelsk', 'kontroller-melodi'],
  levels: [1, 3],
}

// ── Just As I Am (WOODWORTH) ─────────────────────────────────────────────────
// Bradbury 1849. Melodien er dobbelt-verifisert (Timeless Truths-MusicXML og
// hymnal.net-LilyPond stemmer overens tone for tone, og matcher Hymnarys
// kanoniske incipit 12335 43234 35523) — inkludert mi-slutten «I come, I
// come» (2̂–5̂–3̂; alten synger ti–ti–do under). 3/4, 1 slags opptakt.
// Koral → levels [1,2,3].
const justAsIAmMelody = line('R', 0, [
  [C4, 0.5], [D4, 0.5], // opptakt: «Just as»
  [E4, 2], [E4, 1],
  [G4, 1.5], [F4, 0.5], [E4, 1],
  [D4, 1.5], [E4, 0.5], [F4, 1],
  [E4, 2], [G4, 1],
  // «but that Thy blood was shed for me»
  [G4, 1], [D4, 1], [E4, 1],
  [F4, 2], [A4, 1],
  [A4, 2], [G4, 1],
  [E4, 2], [C4, 0.5], [D4, 0.5],
  // «and that Thou bidd'st me come to Thee»
  [E4, 2], [E4, 1],
  [G4, 1.5], [F4, 0.5], [E4, 1],
  [A4, 2], [A4, 1],
  [C5, 1.5], [B4, 0.5], [A4, 1],
  // «O Lamb of God, I come, I come!»
  [G4, 2], [G4, 1],
  [G4, 1.5], [F4, 0.5], [E4, 1],
  [D4, 3],
  [G4, 3],
  [E4, 3], [E4, 2],
])
// Sluttonen bindes over taktstreken (t49→52), som i kildesatsene.
for (const n of justAsIAmMelody) if (n.t === 49 && n.p === E4) n.tie = true

const justAsIAm: SongSource = {
  slug: 'just-as-i-am',
  title: 'Just As I Am',
  subtitle: 'WOODWORTH',
  tradition: 'hymne',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 100,
  timeSignature: '3/4',
  beatsPerBar: 3,
  pickupBeats: 1,
  totalBeats: 54,
  keySignature: 'C',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 24, endBeat: 37 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 37, endBeat: 54 },
  ],
  melody: justAsIAmMelody,
  chords: [
    ch(0, 1, 0), ch(1, 3, 0), ch(4, 3, 0), ch(7, 3, 7, '7'),
    ch(10, 3, 0), ch(13, 2, 7), ch(15, 1, 0, '', 7), ch(16, 3, 7, '7'),
    ch(19, 2, 5), ch(21, 1, 0, '', 7), ch(22, 3, 0),
    ch(25, 3, 0), ch(28, 3, 0), ch(31, 3, 5), ch(34, 3, 5),
    ch(37, 3, 0), ch(40, 2, 0), ch(42, 1, 0, '', 4),
    ch(43, 3, 7), ch(46, 3, 7, '7'), ch(49, 5, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [
      { name: 'William B. Bradbury (WOODWORTH)', role: 'komponist', deathYear: 1868 },
      { name: 'Charlotte Elliott', role: 'tekstforfatter', deathYear: 1871 },
    ],
    sources: ['Third Book of Psalmody (1849)', 'The Mendelssohn Collection (1849)'],
    verifiedAt: '2026-07-12',
    notes: 'Egen kilde-nedtegnelse av public domain-verk; melodi dobbelt-verifisert mot to satser.',
  },
  tags: ['klassiker', 'engelsk'],
  levels: [1, 2, 3],
}

export const hymneSources: SongSource[] = [
  holyHolyHoly,
  nearerMyGod,
  abideWithMe,
  beThouMyVision,
  oldHundredth,
  itIsWell,
  blessedAssurance,
  comeThouFount,
  iSurrenderAll,
  leaningOnTheArms,
  softlyAndTenderly,
  justAsIAm,
]
