'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { NotationSong as NotationSongImpl } from './NotationSong'
import { LazyPlaceholder } from './LazyPlaceholder'

// VexFlow is by far the heaviest dependency in the app and is only needed to draw
// sheet music. A full-song grand staff is heavier still, so we keep it out of the
// initial bundle: it loads on demand the first time a score renders (ssr:false —
// VexFlow needs the DOM). The placeholder reserves the score box's height to
// avoid layout shift (CLS). Import this wherever the score is shown.
//
// The reserved height has to follow the SHAPE of the score. NotationSong lays
// bars out into fixed-height systems, and a treble-only system (the rhythm
// snippets: /rytme's tap score and each of the three dictation options) is 80 px
// shorter than a grand-staff one. One fixed height meant every treble snippet
// jumped ~85 px the moment VexFlow arrived — and the dictation shows three of
// them at once.
//
// next/dynamic gives the `loading` component NO props, so the height cannot be
// read from `staves` inside one wrapper. Rather than hand-rolling React.lazy +
// Suspense (which would drag the module into the SSR pass, and VexFlow must not
// run on the server), we declare one dynamic component PER SHAPE over the same
// loader: two placeholders, one chunk. The second shape resolves from the module
// cache, so nothing is downloaded twice.
const loadNotationSong = () => import('./NotationSong').then((m) => m.NotationSong)

/** Height of ONE system, mirroring NotationSong's GRAND / TREBLE_ONLY layouts.
 * Kept honest by notation-placeholder.test.ts, which reads both files.
 *
 * Measured on the built page: the real score box lands at systemHeight + 2 px
 * (its 1 px frame sits outside the content-driven height, while the
 * placeholder's is inside a fixed one). Left alone deliberately — 2 px is the
 * honest residual of naming the constant after the layout it mirrors, and the
 * jump this replaced was ~85 px. */
const SYSTEM_HEIGHT = { grand: 196, treble: 116 } as const

// rounded-xl, not the shared rounded-2xl: the score box's own corner radius.
const GrandStaff = dynamic(loadNotationSong, {
  ssr: false,
  loading: () => <LazyPlaceholder height={SYSTEM_HEIGHT.grand} className="rounded-xl" />,
})

const TrebleStaff = dynamic(loadNotationSong, {
  ssr: false,
  loading: () => <LazyPlaceholder height={SYSTEM_HEIGHT.treble} className="rounded-xl" />,
})

type Props = ComponentProps<typeof NotationSongImpl>

export function NotationSong(props: Props) {
  // `staves` is fixed per call site (a snippet never becomes a hymn), so picking
  // the component by shape never remounts a live score.
  return props.staves === 'treble' ? <TrebleStaff {...props} /> : <GrandStaff {...props} />
}
