'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, Volume2, RefreshCw } from 'lucide-react'
import type { SongDoc } from '@/types/song'
import type { RhythmExercise } from '@/lib/rytme/exercises'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { useDrumTrainer } from '@/lib/drums/use-drum-trainer'
import { TimingSummary } from '@/components/drums/TimingSummary'
import { DrumTransport } from '@/components/drums/DrumTransport'
import { NotationSong } from '@/components/NotationSongLazy'

// ── TapSession — les og tapp ─────────────────────────────────────────────────
// Read-and-tap. The rhythm is shown as sheet music (NotationSong); the learner
// plays it back on ONE big tap surface (or the space bar) while the transport
// runs with a metronome pulse and count-in. Every tap is judged against the
// rhythm's hits by the shared drum trainer (snare lane) exactly as in the
// Trommer fag — same ±ms windows, same TimingSummary. Nothing sounds on its own
// while playing (the learner IS the rhythm); "Hør fasiten" plays the answer.

const SNARE_LANE = 1 // lib/drums/drum-lanes — snare = lane 1, pad pitch 38
const BPM_BY_LEVEL = [76, 84, 92]

interface Props {
  exercise: RhythmExercise
  level: 1 | 2 | 3
  /** Fired after each pass with the pass's weighted hit percentage. */
  onScore: (pct: number) => void
  /** Request a fresh rhythm from the parent. */
  onNewRhythm: () => void
}

/** The engine needs a doc for its clock; the rhythm itself must NOT sound while
 * the learner taps, so we hand it an empty, note-less doc of the right length. */
function transportDoc(ex: RhythmExercise): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: ex.doc.timeSignature,
    beatsPerBar: ex.doc.beatsPerBar,
    pickupBeats: 0,
    totalBeats: ex.lengthBeats,
    keySignature: 'C',
    sections: [{ id: 'r', kind: 'verse', label: 'Rytme', startBeat: 0, endBeat: ex.lengthBeats }],
    notes: [],
    chords: [],
  }
}

export function TapSession({ exercise, level, onScore, onNewRhythm }: Props) {
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const bpm = usePlayer((s) => s.bpm)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)

  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  const [flash, setFlash] = useState(false)
  const cancelPreviewRef = useRef<(() => void) | null>(null)
  const flashTimerRef = useRef<number | null>(null)

  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore

  const trainer = useDrumTrainer(exercise.hits, {
    onPassComplete: (score) => onScoreRef.current(score.pct),
  })

  // Transport defaults: a rhythm reader needs the pulse + a "klar-ferdig-gå".
  useEffect(() => {
    usePlayer.getState().set({
      bpm: BPM_BY_LEVEL[level - 1],
      loop: null,
      currentBeat: 0,
      countIn: true,
      metronome: true,
      activeSectionId: null,
      waitMode: false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  // iOS unlock once; tear the engine down on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => {
      cancelPreviewRef.current?.()
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current)
      getEngine().release()
    }
  }, [])

  // Build the silent looping clock for this rhythm (no audible notes).
  useEffect(() => {
    const engine = getEngine()
    engine.stop()
    engine.build(transportDoc(exercise), { hand: 'both', bpm: bpmRef.current, loop: true })
    engine.setLoopRange(null, null)
  }, [exercise])

  // A tap: sound the snare so the learner hears their own hit + judge the timing.
  const tap = useCallback(() => {
    void getEngine().playNote(38, 0.9, 0.3, 'drums')
    trainer.strike(SNARE_LANE)
    setFlash(true)
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null
      setFlash(false)
    }, 90)
  }, [trainer])

  // Space bar also taps (accessibility + a natural drumming feel).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      const el = document.activeElement
      // Don't hijack space on real controls (buttons/inputs) other than the pad.
      if (el instanceof HTMLElement && el.dataset.tappad !== 'true' && (el.tagName === 'BUTTON' || el.tagName === 'INPUT')) return
      e.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tap])

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) engine.stop()
    else {
      cancelPreviewRef.current?.()
      trainer.reset()
      void engine.play()
    }
  }

  const onBpm = (v: number) => {
    usePlayer.getState().setBpm(v)
    getEngine().setTempo(v)
  }

  // "Hør fasiten": play the rhythm back as a snare sequence (no transport — this
  // never disturbs the silent tap clock). Blocked while the transport runs.
  const playAnswer = () => {
    if (usePlayer.getState().isPlaying) return
    cancelPreviewRef.current?.()
    const engine = getEngine()
    const spb = 60000 / bpmRef.current
    const ids = exercise.hits.map((h) =>
      window.setTimeout(() => void engine.playNote(38, h.v ?? 0.85, 0.3, 'drums'), h.t * spb),
    )
    cancelPreviewRef.current = () => ids.forEach((id) => clearTimeout(id))
  }

  // "Ny rytme": the answer preview is a bare chain of setTimeouts, so it would
  // keep tapping out the OLD rhythm over the new one. Kill it here rather than
  // relying on a remount — the parent's key can repeat for short level-1 rhythms.
  const newRhythm = () => {
    cancelPreviewRef.current?.()
    cancelPreviewRef.current = null
    getEngine().stop()
    onNewRhythm()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Read: the rhythm as sheet music (one pitch — treble staff only). */}
      <NotationSong doc={exercise.doc} follow staves="treble" />

      {/* Tap surface */}
      <button
        type="button"
        data-tappad="true"
        onPointerDown={(e) => {
          e.preventDefault()
          tap()
        }}
        aria-label="Tapp rytmen"
        className={`flex min-h-32 w-full select-none touch-none flex-col items-center justify-center gap-2 rounded-2xl border-2 text-center transition-colors ${
          flash
            ? 'border-[var(--fag-rytme)] bg-[var(--fag-rytme)]/25'
            : 'border-[var(--color-border)] bg-[var(--color-raised)] active:bg-[var(--fag-rytme)]/15'
        }`}
      >
        <Hand className="h-7 w-7 text-[var(--fag-rytme)]" />
        <span className="text-sm font-medium text-[var(--color-ivory)]">Tapp her</span>
        <span className="text-xs text-[var(--color-muted)]">Klikk flaten eller trykk mellomrom i takt med notene</span>
      </button>

      <TimingSummary score={trainer.score} onReset={trainer.reset} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={playAnswer}
          disabled={isPlaying}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)] disabled:opacity-50"
        >
          <Volume2 className="h-4 w-4" /> Hør fasiten
        </button>
        <button
          type="button"
          onClick={newRhythm}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
        >
          <RefreshCw className="h-4 w-4" /> Ny rytme
        </button>
      </div>

      <DrumTransport
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayToggle={onPlayToggle}
        bpm={bpm}
        onBpm={onBpm}
        loop
        metronome={metronome}
        onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
        countIn={countIn}
        onCountInToggle={() => usePlayer.getState().toggleCountIn()}
      />

      <p className="text-sm text-[var(--color-muted)]">
        Trykk spill, tell deg inn, og tapp rytmen du ser. Grønt er perfekt, gult er litt tidlig
        eller sent, rødt er bom. Rytmen looper til du stopper.
      </p>
    </div>
  )
}
