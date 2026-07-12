import type { SongSource } from '@/types/song-source'
import { julSources } from './jul.ts'
import { paskeSources } from './paske.ts'
import { hymneSources } from './hymner.ts'
import { spiritualSources } from './spirituals.ts'
import { norskeSources } from './norske.ts'
import { gospelSources } from './gospel.ts'

// ── Verk-kilder, samlet ──────────────────────────────────────────────────────
// Én fil per sjanger så innholdsarbeidere aldri rører delte filer. Hver kilde
// blir til `levels.length` spillbare arrangementer i data/songs/index.ts via
// generatePianoArrangement — alt generert valideres av songs.test.ts-
// invariantene (akseptansefilteret) og seedes som vanlige rader.
export const songSources: SongSource[] = [
  ...julSources,
  ...paskeSources,
  ...hymneSources,
  ...spiritualSources,
  ...norskeSources,
  ...gospelSources,
]
