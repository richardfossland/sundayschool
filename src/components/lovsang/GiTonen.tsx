'use client'

import { useEffect, useRef, useState } from 'react'
import { Music2 } from 'lucide-react'
import type { Song } from '@/types/song'
import { getEngine } from '@/lib/engine'
import { nearestOffset, transposeDoc } from '@/lib/transpose'
import { keyNameForTonic, spellPitch } from '@/lib/spelling'

// ── GiTonen ───────────────────────────────────────────────────────────────────
// «Gi tonen» for ett innslag: spiller tonika-treklangen arpeggiert (så koret
// hører grunntonen og akkordfargen) etterfulgt av melodiens FØRSTE tone i
// måltonearten. Alt er pitch-rene transformasjoner — sangen transponeres med
// nearestOffset/transposeDoc, samme som SongPlayer, så navn og lyd aldri spriker.

/** Melodiens første tone: tidligste høyrehåndsnote, ellers tidligste note. */
function firstMelodyPitch(song: Song, offset: number): number | null {
  const notes = song.doc.notes
  if (notes.length === 0) return null
  const right = notes.filter((n) => n.h === 'R')
  const pool = right.length > 0 ? right : notes
  const first = pool.reduce((a, b) => (b.t < a.t ? b : a))
  return first.p + offset
}

/** Vis-navn for en MIDI-tone, stavet i den transponerte tonearten (C♯4 / A♭3). */
function noteLabel(midi: number, keySignature: string): string {
  const sp = spellPitch(midi, keySignature)
  const acc = sp.accidental === '#' ? '♯' : sp.accidental === 'b' ? '♭' : ''
  return `${sp.letter}${acc}${sp.octave}`
}

/** The song is loaded ONCE by the parent (a setlist mounts several of these per
 * entry) and handed down; null = still loading, or unknown work. */
export function GiTonen({ song, targetKey }: { song: Song | null; targetKey: number }) {
  // The arpeggio is a chain of timeouts. They must be cancellable: a second
  // press used to overlay a whole new chord on the running one, and leaving the
  // page mid-sequence left notes to fire into a torn-down view.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const [running, setRunning] = useState(false)

  const cancel = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => cancel, [])

  const offset = song ? nearestOffset(song.original_key, targetKey) : 0
  const doc = song ? transposeDoc(song.doc, offset) : null
  const startPitch = song ? firstMelodyPitch(song, offset) : null
  const mode = song?.mode ?? 'major'
  const keyName = keyNameForTonic(targetKey, mode)

  // Tonika-treklang i en behagelig oktav (C4-registeret), dur/moll etter sangen.
  const tonicMidi = 60 + targetKey
  const third = mode === 'minor' ? 3 : 4
  const triad = [tonicMidi, tonicMidi + third, tonicMidi + 7]

  const giTonen = () => {
    const engine = getEngine()
    cancel() // aldri to sekvenser oppå hverandre
    const at = (delayMs: number, run: () => void) => {
      const t = setTimeout(() => {
        const i = timers.current.indexOf(t)
        if (i >= 0) timers.current.splice(i, 1)
        run()
      }, delayMs)
      timers.current.push(t)
    }
    // Arpeggiér treklangen, så la melodiens starttone runde av.
    setRunning(true)
    triad.forEach((m, i) => at(i * 200, () => void engine.playNote(m, 0.75, 0.9)))
    const lastAt = triad.length * 200 + 250
    if (startPitch !== null) at(lastAt, () => void engine.playNote(startPitch, 0.9, 1.2))
    at(lastAt + 400, () => setRunning(false))
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Gi tonen
          </p>
          <p className="mt-1 text-sm text-[var(--color-ivory)]">
            Toneart <span className="font-display text-[var(--fag)]">{keyName}</span>
            {doc && startPitch !== null && (
              <>
                {' · '}Start på{' '}
                <span className="font-display text-[var(--color-ivory)]">
                  {noteLabel(startPitch, doc.keySignature)}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={giTonen}
          disabled={!song || running}
          aria-label="Gi tonen"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--fag)', color: 'var(--color-scene)' }}
        >
          <Music2 className="h-4 w-4" />
          Gi tonen
        </button>
      </div>
    </div>
  )
}
