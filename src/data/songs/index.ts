import type { SeedSong } from '@/types/song'
import { generatePianoArrangement } from '../../lib/arranger/piano-arrangement.ts'
import { songSources } from './sources/index.ts'
import { amazingGrace } from './amazing-grace.ts'
import { amazingGraceFirstemmig } from './amazing-grace-firstemmig.ts'
import { gladeJul } from './glade-jul.ts'
import { joyfulJoyful } from './joyful-joyful.ts'
import { kirkenDenEr } from './kirken-den-er.ts'
import { kumbaya } from './kumbaya.ts'
import { paskemorgen } from './paskemorgen.ts'
import { swingLow } from './swing-low.ts'
import { whatAFriend } from './what-a-friend.ts'
import { whenTheSaints } from './when-the-saints.ts'

// Curated seed library. Every entry is a self-authored arrangement of a
// double-public-domain work (all creators dead before 1956; published before
// 1930) — see each song's `rights` and /om-rettigheter. Songs tagged
// 'kontroller-melodi' have ear-transcribed melodies awaiting hymnal QA.
//
// Two kinds of entries:
//   1) hand-written arrangements (the original 10 files in this directory)
//   2) generated arrangements — each work source in ./sources/ is materialised
//      at module evaluation into one SeedSong per level (enkel/firstemmig/
//      gospel). Deterministic, so seeding stays idempotent; everything runs
//      through the same songs.test.ts quality invariants.
export const seedSongs: SeedSong[] = [
  amazingGrace,
  amazingGraceFirstemmig,
  gladeJul,
  joyfulJoyful,
  kirkenDenEr,
  kumbaya,
  paskemorgen,
  swingLow,
  whatAFriend,
  whenTheSaints,
  ...songSources.flatMap((source) => source.levels.map((l) => generatePianoArrangement(source, l))),
]
