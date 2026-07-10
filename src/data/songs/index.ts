import type { SeedSong } from '@/types/song'
import { amazingGrace } from './amazing-grace'
import { amazingGraceFirstemmig } from './amazing-grace-firstemmig'
import { gladeJul } from './glade-jul'
import { joyfulJoyful } from './joyful-joyful'
import { kirkenDenEr } from './kirken-den-er'
import { kumbaya } from './kumbaya'
import { paskemorgen } from './paskemorgen'
import { swingLow } from './swing-low'
import { whatAFriend } from './what-a-friend'
import { whenTheSaints } from './when-the-saints'

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
