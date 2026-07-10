import type { SeedSong } from '@/types/song'
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
]
