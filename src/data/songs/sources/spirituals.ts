import type { SongSource } from '@/types/song-source'
import { line, ch } from '../_helpers.ts'

// ── Spirituals (verk-kilder) ─────────────────────────────────────────────────
// Afro-amerikanske åndelige sanger — tradisjonelle (komponist ukjent → deathYear
// null), først nedtegnet i samlinger utgitt før 1930 (alle utvilsomt PD). Hver
// kilde håndskrives ÉN gang (melodi + akkorder + rettigheter) og blir til
// spillbare arrangementer via lib/arranger/piano-arrangement.ts — `levels`
// styrer hvilke. Bruk `line`/`ch` fra ../_helpers.ts (.ts-endelser i imports).
// Melodi: kun h:'R', monofon, C3–C6. Modalt enkel besifring.

// Delte MIDI-tonehøyder (C4 = 60).
const D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, B4 = 71
const C5 = 72, D5 = 74, E5 = 76

// Go Down, Moses. A-moll, 4/4. Afro-amerikansk spiritual, først trykt i
// «Slave Songs of the United States» (1867). Kall-og-svar; modal moll.
const goDownMoses: SongSource = {
  slug: 'go-down-moses',
  title: 'Go Down, Moses',
  subtitle: null,
  tradition: 'spiritual',
  original_key: 9, // A (moll)
  mode: 'minor',
  default_bpm: 84,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'a',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 8, endBeat: 16 },
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 16, endBeat: 24 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «When Israel was in Egypt's land»
    [E4, 1], [A4, 1], [A4, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 2],
    // «Oppressed so hard they could not stand»
    [E4, 1], [A4, 1], [A4, 1], [B4, 1], [C5, 1], [D5, 1], [C5, 2],
    // «Go down, Moses, way down in Egypt's land»
    [E5, 1], [C5, 1], [A4, 1], [A4, 1], [B4, 1], [C5, 1], [B4, 2],
    // «Tell old Pharaoh: let my people go»
    [C5, 1], [B4, 1], [A4, 1], [B4, 1], [C5, 1], [B4, 1], [A4, 2],
  ]),
  chords: [
    ch(0, 2, 9, 'm'), ch(2, 2, 9, 'm'), ch(4, 2, 4, '7'), ch(6, 2, 9, 'm'),
    ch(8, 2, 9, 'm'), ch(10, 2, 2, 'm'), ch(12, 2, 4, '7'), ch(14, 2, 9, 'm'),
    ch(16, 2, 9, 'm'), ch(18, 2, 9, 'm'), ch(20, 2, 4, '7'), ch(22, 2, 9, 'm'),
    ch(24, 2, 9, 'm'), ch(26, 2, 2, 'm'), ch(28, 2, 4, '7'), ch(30, 2, 9, 'm'),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Slave Songs of the United States (1867)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter tradisjonell form — modal A-moll.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Deep River. C-dur, 4/4. Afro-amerikansk spiritual; nedtegnet i «Religious
// Folk-Songs of the Negro» (Hampton, 1918). Bred, flytende melodi.
const deepRiver: SongSource = {
  slug: 'deep-river',
  title: 'Deep River',
  subtitle: null,
  tradition: 'spiritual',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 66,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'C',
  sections: [
    { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 8 },
    { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 8, endBeat: 16 },
    { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 16, endBeat: 24 },
    { id: 'f4', kind: 'ending', label: 'Frase 4', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Deep river, my home is over Jordan»
    [G4, 2], [C5, 2], [C5, 1], [A4, 1], [G4, 1], [E4, 1],
    // «Deep river, Lord, I want to cross over»
    [G4, 2], [C5, 2], [D5, 1], [C5, 1], [A4, 1], [G4, 1],
    // «Oh, don't you want to go to that gospel feast»
    [E5, 1], [E5, 1], [D5, 1], [C5, 1], [D5, 2], [C5, 2],
    // «that promised land where all is peace»
    [A4, 1], [C5, 1], [A4, 1], [G4, 1], [E4, 1], [G4, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 2, 0), ch(2, 2, 0), ch(4, 2, 5), ch(6, 2, 0),
    ch(8, 2, 0), ch(10, 2, 0), ch(12, 2, 7, '7'), ch(14, 2, 0),
    ch(16, 2, 0), ch(18, 2, 9, 'm'), ch(20, 2, 7, '7'), ch(22, 2, 0),
    ch(24, 2, 5), ch(26, 2, 0), ch(28, 2, 7, '7'), ch(30, 2, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Religious Folk-Songs of the Negro (Hampton, 1918)', 'Jubilee Songs (1872)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Tradisjonell folketone — Burleighs 1917-arrangement er en egen (yngre) versjon vi IKKE bruker.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Nobody Knows the Trouble I've Seen. F-dur, 4/4. Afro-amerikansk spiritual,
// først trykt i «Slave Songs of the United States» (1867). Refreng + vers.
const nobodyKnows: SongSource = {
  slug: 'nobody-knows-the-trouble-ive-seen',
  title: "Nobody Knows the Trouble I've Seen",
  subtitle: null,
  tradition: 'spiritual',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 72,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 0, endBeat: 8 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 8, endBeat: 16 },
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 16, endBeat: 24 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Nobody knows the trouble I've seen»
    [F4, 1], [A4, 1], [A4, 1], [A4, 1], [C5, 1], [A4, 1], [F4, 2],
    // «Nobody knows but Jesus»
    [G4, 1], [A4, 1], [Bb4, 1], [A4, 1], [G4, 1], [F4, 1], [F4, 2],
    // «Sometimes I'm up, sometimes I'm down»
    [A4, 1], [C5, 1], [A4, 1], [F4, 1], [G4, 1], [A4, 1], [G4, 2],
    // «Oh yes, Lord»
    [C5, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 1], [G4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 0, '7'), ch(6, 2, 5),
    ch(8, 2, 10), ch(10, 2, 5), ch(12, 2, 0, '7'), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 10), ch(20, 2, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 5), ch(26, 2, 10), ch(28, 2, 0, '7'), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Slave Songs of the United States (1867)', 'Jubilee Songs (1872)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter tradisjonell form.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Down by the Riverside. C-dur, 4/4. Afro-amerikansk spiritual; trykt i
// «New Jubilee Songs» (1901) og senere samlinger. Vers + refreng.
const downByTheRiverside: SongSource = {
  slug: 'down-by-the-riverside',
  title: 'Down by the Riverside',
  subtitle: null,
  tradition: 'spiritual',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 100,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'C',
  sections: [
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 0, endBeat: 8 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 8, endBeat: 16 },
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 16, endBeat: 24 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Gonna lay down my burden»
    [G4, 1], [G4, 1], [C5, 1], [C5, 1], [E5, 1], [D5, 1], [C5, 2],
    // «down by the riverside»
    [C5, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 1], [G4, 1], [G4, 2],
    // «I ain't gonna study war no more»
    [C5, 1], [E5, 1], [E5, 1], [D5, 1], [C5, 1], [D5, 1], [E5, 2],
    // «I ain't gonna study war no more»
    [D5, 1], [C5, 1], [A4, 1], [G4, 1], [E4, 1], [G4, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 2, 0), ch(2, 2, 0), ch(4, 2, 7, '7'), ch(6, 2, 0),
    ch(8, 2, 0), ch(10, 2, 0), ch(12, 2, 7, '7'), ch(14, 2, 0),
    ch(16, 2, 0), ch(18, 2, 0), ch(20, 2, 7, '7'), ch(22, 2, 0),
    ch(24, 2, 7, '7'), ch(26, 2, 0), ch(28, 2, 7, '7'), ch(30, 2, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['New Jubilee Songs (1901)', 'Religious Folk-Songs of the Negro (1918)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter tradisjonell form.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Standing in the Need of Prayer. C-dur, 4/4. Afro-amerikansk spiritual;
// trykt i «Religious Folk-Songs of the Negro» (1918). Refreng + vers.
const standingInTheNeed: SongSource = {
  slug: 'standing-in-the-need-of-prayer',
  title: 'Standing in the Need of Prayer',
  subtitle: null,
  tradition: 'spiritual',
  original_key: 0, // C
  mode: 'major',
  default_bpm: 96,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'C',
  sections: [
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 0, endBeat: 8 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 8, endBeat: 16 },
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 16, endBeat: 24 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «It's me, it's me, it's me, O Lord»
    [G4, 1], [G4, 1], [G4, 1], [G4, 1], [E5, 1], [D5, 1], [C5, 2],
    // «standin' in the need of prayer»
    [C5, 1], [D5, 1], [E5, 1], [D5, 1], [C5, 1], [G4, 1], [C5, 2],
    // «Not my brother, not my sister, but it's me, O Lord»
    [E5, 1], [E5, 1], [D5, 1], [C5, 1], [D5, 1], [E5, 1], [G4, 2],
    // «standin' in the need of prayer»
    [C5, 1], [D5, 1], [E5, 1], [D5, 1], [C5, 1], [G4, 1], [C5, 2],
  ]),
  chords: [
    ch(0, 2, 0), ch(2, 2, 0), ch(4, 2, 7, '7'), ch(6, 2, 0),
    ch(8, 2, 0), ch(10, 2, 5), ch(12, 2, 7, '7'), ch(14, 2, 0),
    ch(16, 2, 0), ch(18, 2, 0), ch(20, 2, 7, '7'), ch(22, 2, 0),
    ch(24, 2, 0), ch(26, 2, 5), ch(28, 2, 7, '7'), ch(30, 2, 0),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Religious Folk-Songs of the Negro (1918)', 'Jubilee Songs (1872)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter tradisjonell form.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Wade in the Water. D-moll, 4/4. Afro-amerikansk spiritual; først trykt i
// «New Jubilee Songs» (1901). Refreng + vers; modal moll.
const wadeInTheWater: SongSource = {
  slug: 'wade-in-the-water',
  title: 'Wade in the Water',
  subtitle: null,
  tradition: 'spiritual',
  original_key: 2, // D (moll)
  mode: 'minor',
  default_bpm: 88,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'd',
  sections: [
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 0, endBeat: 8 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 8, endBeat: 16 },
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 16, endBeat: 24 },
    { id: 'r3', kind: 'refrain', label: 'Refreng 3', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Wade in the water»
    [D5, 1], [C5, 1], [A4, 1], [F4, 1], [A4, 1], [A4, 1], [A4, 2],
    // «wade in the water, children»
    [D5, 1], [C5, 1], [A4, 1], [F4, 1], [G4, 1], [F4, 1], [D4, 2],
    // «Who's that yonder dressed in red»
    [F4, 1], [A4, 1], [A4, 1], [A4, 1], [Bb4, 1], [A4, 1], [G4, 2],
    // «God's gonna trouble the water»
    [A4, 1], [A4, 1], [G4, 1], [F4, 1], [E4, 1], [F4, 1], [D4, 2],
  ]),
  chords: [
    ch(0, 2, 2, 'm'), ch(2, 2, 2, 'm'), ch(4, 2, 9, '7'), ch(6, 2, 2, 'm'),
    ch(8, 2, 2, 'm'), ch(10, 2, 7, 'm'), ch(12, 2, 9, '7'), ch(14, 2, 2, 'm'),
    ch(16, 2, 2, 'm'), ch(18, 2, 10), ch(20, 2, 7, 'm'), ch(22, 2, 2, 'm'),
    ch(24, 2, 2, 'm'), ch(26, 2, 7, 'm'), ch(28, 2, 9, '7'), ch(30, 2, 2, 'm'),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['New Jubilee Songs (1901)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi etter tradisjonell form — modal D-moll.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

// Ev'ry Time I Feel the Spirit. F-dur, 4/4. Afro-amerikansk spiritual; trykt i
// «New Jubilee Songs» (1901). Refreng + vers. Melodi etter minne → kontroll.
const evryTimeIFeelTheSpirit: SongSource = {
  slug: 'evry-time-i-feel-the-spirit',
  title: "Ev'ry Time I Feel the Spirit",
  subtitle: null,
  tradition: 'spiritual',
  original_key: 5, // F
  mode: 'major',
  default_bpm: 92,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 32,
  keySignature: 'F',
  sections: [
    { id: 'r1', kind: 'refrain', label: 'Refreng 1', startBeat: 0, endBeat: 8 },
    { id: 'r2', kind: 'refrain', label: 'Refreng 2', startBeat: 8, endBeat: 16 },
    { id: 'v1', kind: 'verse', label: 'Vers 1', startBeat: 16, endBeat: 24 },
    { id: 'v2', kind: 'verse', label: 'Vers 2', startBeat: 24, endBeat: 32 },
  ],
  melody: line('R', 0, [
    // «Ev'ry time I feel the Spirit»
    [C5, 1], [C5, 1], [A4, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 2],
    // «movin' in my heart, I will pray»
    [C5, 1], [A4, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 1], [F4, 2],
    // «Upon the mountain my Lord spoke»
    [F4, 1], [A4, 1], [C5, 1], [C5, 1], [D5, 1], [C5, 1], [A4, 2],
    // «out of His mouth came fire and smoke»
    [C5, 1], [A4, 1], [G4, 1], [A4, 1], [Bb4, 1], [A4, 1], [F4, 2],
  ]),
  chords: [
    ch(0, 2, 5), ch(2, 2, 5), ch(4, 2, 0, '7'), ch(6, 2, 5),
    ch(8, 2, 5), ch(10, 2, 10), ch(12, 2, 0, '7'), ch(14, 2, 5),
    ch(16, 2, 5), ch(18, 2, 5), ch(20, 2, 0, '7'), ch(22, 2, 5),
    ch(24, 2, 5), ch(26, 2, 10), ch(28, 2, 0, '7'), ch(30, 2, 5),
  ],
  rights: {
    publicDomain: true,
    creators: [{ name: 'Tradisjonell (afro-amerikansk spiritual)', role: 'komponist', deathYear: null }],
    sources: ['New Jubilee Songs (1901)', 'Religious Folk-Songs of the Negro (1918)'],
    verifiedAt: '2026-07-13',
    notes: 'Egen kilde-nedtegnelse av public domain-verk. Melodi rekonstruert etter minne — kontroll anbefalt.',
  },
  tags: ['spiritual', 'kontroller-melodi'],
  levels: [1, 3],
}

export const spiritualSources: SongSource[] = [
  goDownMoses,
  deepRiver,
  nobodyKnows,
  downByTheRiverside,
  standingInTheNeed,
  wadeInTheWater,
  evryTimeIFeelTheSpirit,
]
