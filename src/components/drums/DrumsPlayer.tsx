'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Plug } from 'lucide-react'
import type { Song } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { generateDrumTrack, hitsToEngineEvents } from '@/lib/drums/drum-track'
import { LANES, laneOf } from '@/lib/drums/drum-lanes'
import { useDrumTrainer } from '@/lib/drums/use-drum-trainer'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { SectionNav } from '../SectionNav'
import { DrumLanes } from './DrumLanes'
import { ScreenPads } from './ScreenPads'
import { TimingSummary } from './TimingSummary'
import { DrumTransport } from './DrumTransport'

// ── DrumsPlayer — play drums TO a song ────────────────────────────────────────
// The piano score plays as the "band" while a generated drum track (groove tiled
// over the song, fills before section boundaries, crash on section downbeats)
// falls down the lanes. The learner drums along on screen pads or an e-drum and
// every strike is judged, exactly like GroovePlayer. Transposition does not
// exist here: drums carry GM-pitch identity, and the piano plays the song's
// original key. TransportBar's key grid/hand rows are therefore meaningless —
// the local DrumTransport wrapper renders only the relevant controls.

interface Props {
  song: Song
}

export function DrumsPlayer({ song }: Props) {
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const currentBeat = usePlayer((s) => s.currentBeat)
  const bpm = usePlayer((s) => s.bpm)
  const loop = usePlayer((s) => s.loop)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)

  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)

  const doc = song.doc
  const progressKey = `trommer:${song.slug}`

  // The generated accompaniment IS the practice target. Pure and deterministic,
  // so visuals (lanes) and audio (extra track) are the same hit list.
  const drumHits = useMemo(
    () => generateDrumTrack(doc, undefined, song.default_bpm),
    [doc, song.default_bpm],
  )

  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const loopRef = useRef(loop)
  loopRef.current = loop

  const trainer = useDrumTrainer(drumHits, {
    onPassComplete: () =>
      recordPractice(progressKey, bpmRef.current, usePlayer.getState().activeSectionId ?? undefined),
  })

  // Reset transport controls to the song's defaults when the song changes.
  useEffect(() => {
    usePlayer.getState().set({
      bpm: song.default_bpm,
      loop: null,
      currentBeat: 0,
      activeSectionId: null,
      waitMode: false,
    })
  }, [song.slug, song.default_bpm])

  // Install the iOS audio unlock once; tear the engine down on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().dispose()
  }, [])

  // Build piano (the band) + the generated drum track. The drum level sits a
  // touch under the piano so the learner's own strikes stay audible on top.
  useEffect(() => {
    const engine = getEngine()
    const wasPlaying = usePlayer.getState().isPlaying
    if (wasPlaying) engine.stop()
    engine.build(doc, {
      hand: 'both',
      bpm: bpmRef.current,
      loop: loopRef.current !== null,
      transpose: 0, // drums are identity; piano plays the original key
      extraTracks: [{ instrument: 'drums', events: hitsToEngineEvents(drumHits), volumeDb: -3 }],
    })
    const lp = loopRef.current
    engine.setLoopRange(lp ? lp[0] : null, lp ? lp[1] : null)
    if (wasPlaying) void engine.play()
  }, [doc, drumHits])

  // Keep the engine's loop range in sync with the UI (live, no rebuild).
  useEffect(() => {
    const engine = getEngine()
    engine.setLoop(loop !== null)
    engine.setLoopRange(loop ? loop[0] : null, loop ? loop[1] : null)
  }, [loop])

  // Strike helper shared by pads and MIDI (e-drums send GM pitches on channel
  // 10; connectMidi masks the channel nibble, so they arrive like any device).
  const strikeLane = (laneIndex: number) => {
    void getEngine().playNote(LANES[laneIndex].padPitch, 0.9, 0.3, 'drums')
    return trainer.strike(laneIndex)
  }
  const strikeRef = useRef(strikeLane)
  strikeRef.current = strikeLane

  useEffect(() => () => midi?.dispose(), [midi])

  const onConnectMidi = async () => {
    setMidiError(null)
    try {
      const conn = await connectMidi({
        onNoteOn: (pitch) => {
          const lane = laneOf(pitch)
          if (lane !== null) strikeRef.current(lane)
        },
        onNoteOff: () => {},
      })
      if (!conn) setMidiError('MIDI støttes ikke her — bruk Chrome/Edge, eller spill på skjermpadene.')
      else setMidi(conn)
    } catch (e) {
      setMidiError(e instanceof Error ? e.message : 'Kunne ikke koble til el-trommesettet.')
    }
  }

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) {
      engine.stop()
      recordPractice(progressKey, usePlayer.getState().bpm, usePlayer.getState().activeSectionId ?? undefined)
    } else {
      void engine.play()
    }
  }
  const onBpm = (v: number) => {
    usePlayer.getState().setBpm(v)
    getEngine().setTempo(v)
  }
  const onLoopToggle = () => {
    const cur = usePlayer.getState().loop
    usePlayer.getState().setLoop(cur ? null : [0, doc.totalBeats])
  }
  const onSelectSection = (s: { id: string; startBeat: number }) => {
    getEngine().seekTo(s.startBeat)
    usePlayer.getState().setActiveSection(s.id)
  }
  const onLoopSection = (s: { startBeat: number; endBeat: number }) => {
    const cur = usePlayer.getState().loop
    const same = cur && Math.abs(cur[0] - s.startBeat) < 1e-6 && Math.abs(cur[1] - s.endBeat) < 1e-6
    usePlayer.getState().setLoop(same ? null : [s.startBeat, s.endBeat])
  }

  return (
    <div className="flex flex-col gap-4">
      {/* MIDI status */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-muted)]">
          {midi ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-sea)]">
              <Plug className="h-4 w-4" /> {midi.deviceNames[0] ?? 'MIDI tilkoblet'}
            </span>
          ) : (
            'Spill på skjermpadene (tastene A–L) — eller koble til et el-trommesett'
          )}
        </span>
        {midiSupported() && !midi && (
          <button
            onClick={onConnectMidi}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
          >
            <Plug className="h-4 w-4" /> Koble til el-trommer
          </button>
        )}
      </div>
      {midiError && <p className="text-xs text-[var(--color-danger)]">{midiError}</p>}

      {/* Falling lanes + pads share the container width so lanes align with pads. */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
        <DrumLanes hits={drumHits} results={trainer.results} />
        <ScreenPads onPad={(lane) => strikeRef.current(lane)} />
      </div>

      <TimingSummary score={trainer.score} onReset={trainer.reset} />

      <SectionNav
        sections={doc.sections}
        currentBeat={currentBeat}
        loop={loop}
        onSelect={onSelectSection}
        onLoop={onLoopSection}
      />

      <DrumTransport
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayToggle={onPlayToggle}
        bpm={bpm}
        onBpm={onBpm}
        loop={loop !== null}
        onLoopToggle={onLoopToggle}
        metronome={metronome}
        onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
        countIn={countIn}
        onCountInToggle={() => usePlayer.getState().toggleCountIn()}
      />

      <p className="text-sm text-[var(--color-muted)]">
        Pianoet spiller sangen mens trommesporet faller nedover — komp med og treff markørene på
        linja. Trommene tier i opptakten og fyller inn før hvert delskifte.
      </p>
    </div>
  )
}
