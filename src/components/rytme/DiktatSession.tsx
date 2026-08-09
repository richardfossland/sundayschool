'use client'

import { useEffect, useRef, useState } from 'react'
import type { SongDoc } from '@/types/song'
import { createRng, rhythmDictation, type Level, type RhythmDictation } from '@/lib/rytme/exercises'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { hitsToEngineEvents } from '@/lib/drums/drum-track'
import { ExerciseCard } from '@/components/gehor/ExerciseCard'
import { NotationSong } from '@/components/NotationSongLazy'
import { cn } from '@/lib/cn'

// ── DiktatSession — rytmisk diktat ───────────────────────────────────────────
// The app plays a rhythm (snare hits over a count-in + metronome pulse, via the
// engine transport) and the learner picks which of three notated rhythms they
// heard. Two distractors are the correct rhythm with one figure swapped. The
// session runs 8 tasks with the shared gehør ExerciseCard flow (progress, level
// switch, feedback, «Neste»). We reuse that card as-is and just remap its accent
// token to the Rytme colour on a wrapper, so the chrome reads olive, not gehør.

const SESSION_LENGTH = 8
const BPM_BY_LEVEL = [76, 84, 92]

interface Props {
  level: Level
  onLevelChange: (level: Level) => void
  /** Fired when a session finishes, with the number correct (0–8). */
  onComplete: (correct: number) => void
}

interface Session {
  level: Level
  tasks: RhythmDictation[]
  index: number
  correct: number
  selected: number | null // chosen option index for the current task
}

function buildSession(level: Level, seed: number): Session {
  const rng = createRng(seed)
  return {
    level,
    tasks: Array.from({ length: SESSION_LENGTH }, () => rhythmDictation(level, rng)),
    index: 0,
    correct: 0,
    selected: null,
  }
}

/** A note-less doc of the right length to drive the transport clock; the rhythm
 * itself is added as a drum track. */
function transportDoc(ts: string, bpb: number, lengthBeats: number): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: ts,
    beatsPerBar: bpb,
    pickupBeats: 0,
    totalBeats: lengthBeats,
    keySignature: 'C',
    sections: [{ id: 'r', kind: 'verse', label: 'Rytme', startBeat: 0, endBeat: lengthBeats }],
    notes: [],
    chords: [],
  }
}

const OPTION_LABELS = ['A', 'B', 'C']

export function DiktatSession({ level, onLevelChange, onComplete }: Props) {
  const [session, setSession] = useState<Session>(() => buildSession(level, Date.now()))

  // Rebuild when the level changes (parent-driven).
  useEffect(() => {
    setSession((s) => (s.level === level ? s : buildSession(level, Date.now())))
  }, [level])

  // Tear the engine down on leave.
  useEffect(() => () => getEngine().dispose(), [])

  const task = session.tasks[session.index]
  const bpmRef = useRef(BPM_BY_LEVEL[level - 1])
  bpmRef.current = BPM_BY_LEVEL[level - 1]

  // Play the CORRECT rhythm as a snare track over a count-in + metronome pulse.
  const play = () => {
    const correct = task.options[task.correctIndex]
    const engine = getEngine()
    engine.stop()
    usePlayer.getState().set({
      bpm: bpmRef.current,
      currentBeat: 0,
      countIn: true,
      metronome: true,
      loop: null,
      activeSectionId: null,
      waitMode: false,
    })
    engine.build(transportDoc(correct.doc.timeSignature, correct.doc.beatsPerBar, correct.lengthBeats), {
      hand: 'both',
      bpm: bpmRef.current,
      loop: false,
      extraTracks: [{ instrument: 'drums', events: hitsToEngineEvents(correct.hits) }],
    })
    engine.setLoopRange(null, null)
    void engine.play()
  }

  const choose = (i: number) => {
    if (session.selected !== null) return
    getEngine().stop()
    setSession((s) => ({
      ...s,
      selected: i,
      correct: s.correct + (i === task.correctIndex ? 1 : 0),
    }))
  }

  const onNext = () => {
    getEngine().stop()
    setSession((s) => {
      if (s.index + 1 >= s.tasks.length) {
        onComplete(s.correct)
        return s
      }
      return { ...s, index: s.index + 1, selected: null }
    })
  }

  const answered = session.selected !== null
  const isCorrect = session.selected === task.correctIndex

  return (
    // Remap the gehør accent token to Rytme so the reused card reads olive.
    <div style={{ ['--fag-gehor' as string]: 'var(--fag-rytme)' }}>
      <ExerciseCard
        key={`${session.level}-${session.index}`}
        progress={{ current: session.index + 1, total: session.tasks.length }}
        level={session.level}
        onLevelChange={onLevelChange}
        onPlay={play}
        playLabel="Spill rytmen"
        answeredMessage={
          answered ? (isCorrect ? 'Riktig!' : `Feil — riktig er ${OPTION_LABELS[task.correctIndex]}.`) : null
        }
        onNext={onNext}
        isLast={session.index + 1 >= session.tasks.length}
      >
        <div className="grid gap-3">
          <p className="text-sm text-[var(--color-muted)]">Hvilken rytme hørte du?</p>
          {task.options.map((opt, i) => {
            const chosen = session.selected === i
            const showCorrect = answered && i === task.correctIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                aria-label={`Alternativ ${OPTION_LABELS[i]}`}
                className={cn(
                  'flex items-stretch gap-3 rounded-2xl border-2 p-2 text-left transition-colors',
                  showCorrect
                    ? 'border-[#6BD08A]'
                    : chosen
                      ? 'border-[var(--color-danger)]'
                      : answered
                        ? 'border-[var(--color-border)] opacity-60'
                        : 'border-[var(--color-border)] hover:border-[var(--fag-rytme)]',
                )}
              >
                <span
                  className="grid w-8 shrink-0 place-items-center rounded-lg font-display text-lg"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--fag-rytme) 14%, transparent)',
                    color: 'var(--fag-rytme)',
                  }}
                >
                  {OPTION_LABELS[i]}
                </span>
                <div className="min-w-0 flex-1 pointer-events-none">
                  {/* A one-line rhythm on a static option card: no bass staff to
                      leave empty, and no playback cursor to sit on the wrong
                      alternative while the answer plays. */}
                  <NotationSong doc={opt.doc} showMarker={false} staves="treble" />
                </div>
              </button>
            )
          })}
        </div>
      </ExerciseCard>
    </div>
  )
}
