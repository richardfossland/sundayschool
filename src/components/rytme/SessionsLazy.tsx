'use client'

import dynamic from 'next/dynamic'
import { LazyPlaceholder } from '@/components/LazyPlaceholder'

// /rytme's two trainers, held out of the route's first load. Between them they
// pull the whole audio stack — the engine and Tone (~57 kB gz), the drum trainer
// and VexFlow through NotationSong — none of which the page needs to paint its
// header, the Tapp/Diktat tabs and the three level cards. Those are the pixels
// the learner reads first; the trainer below them mounts a moment later.
//
// ssr:false because everything under here touches the AudioContext and the DOM.

// MEASURED on the built page at 1280 px (736 px of content), not estimated:
// the tap trainer is score + tap surface + transport row + hints, the dictation
// is card chrome + three treble-staff options. Both are the LAST block on the
// route, so an imperfect number costs nothing measurable (CLS is 0 either way);
// they are here so the slot looks like the thing it is waiting for.
const TAP_HEIGHT = 612
const DIKTAT_HEIGHT = 632

export const TapSession = dynamic(
  () => import('./TapSession').then((m) => m.TapSession),
  { ssr: false, loading: () => <LazyPlaceholder height={TAP_HEIGHT} /> },
)

export const DiktatSession = dynamic(
  () => import('./DiktatSession').then((m) => m.DiktatSession),
  { ssr: false, loading: () => <LazyPlaceholder height={DIKTAT_HEIGHT} /> },
)
