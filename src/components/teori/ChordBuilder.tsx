'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { chordLabel, KEY_NAMES, pitchClass } from '@/lib/music'
import { chordPitches, QUALITY_LABELS, VOICED_QUALITIES } from '@/lib/theory/diatonic'
import { Keyboard } from '@/components/Keyboard'
import { noteName } from '@/lib/music'
import { cn } from '@/lib/cn'

// ── ChordBuilder ──────────────────────────────────────────────────────────────
// Pick a root + quality → see the chord tones on the keyboard (root dotted via
// the overlay) and hear all tones together. The voicing comes from
// theory/diatonic.chordPitches so the demo and the ear-training exercises play
// the exact same chords.

const BASE_OCTAVE = 60 // roots are voiced from the C4 octave

export function ChordBuilder() {
  const [root, setRoot] = useState(0) // C
  const [quality, setQuality] = useState('')

  useEffect(() => {
    installAudioUnlock()
  }, [])

  const rootMidi = BASE_OCTAVE + root
  const pitches = chordPitches(rootMidi, quality)

  const play = () => {
    const engine = getEngine()
    for (const p of pitches) void engine.playNote(p, 0.8, 1.4)
  }

  const update = (nextRoot: number, nextQuality: string) => {
    setRoot(nextRoot)
    setQuality(nextQuality)
    const engine = getEngine()
    for (const p of chordPitches(BASE_OCTAVE + nextRoot, nextQuality)) {
      void engine.playNote(p, 0.8, 1.4)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {/* Root picker */}
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Grunntone</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {KEY_NAMES.map((name, pc) => (
          <button
            key={name}
            type="button"
            onClick={() => update(pc, quality)}
            aria-pressed={pc === root}
            className={cn(
              'min-w-9 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors',
              pc === root
                ? 'border-transparent bg-[var(--fag-teori)] text-[var(--color-scene)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Quality picker */}
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Kvalitet</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {VOICED_QUALITIES.map((q) => (
          <button
            key={q || 'dur'}
            type="button"
            onClick={() => update(root, q)}
            aria-pressed={q === quality}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              q === quality
                ? 'border-transparent bg-[var(--fag-teori)] text-[var(--color-scene)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
          >
            {QUALITY_LABELS[q]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={play}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--fag-teori)] px-4 py-2 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Spill akkord
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-ivory)]">{chordLabel(root, quality)}</span>
          {' — '}
          {pitches.map((p) => noteName(p)).join(' · ')}
        </p>
      </div>

      <div className="mt-4">
        <Keyboard
          notes={[]}
          currentBeat={-1}
          expected={new Set(pitches)}
          overlay={{ root: rootMidi, tones: new Set(pitches.map((p) => pitchClass(p))) }}
          onKeyPress={(midi) => void getEngine().playNote(midi, 0.85, 0.8)}
          lowMidi={60}
          highMidi={84}
          whiteKeyWidth={30}
        />
      </div>
    </div>
  )
}
