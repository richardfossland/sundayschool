'use client'

import { useState } from 'react'
import { Users, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/lib/store'
import type { InstrumentId } from '@/lib/instruments'
import { getEngine } from '@/lib/engine'
import { BAND_INSTRUMENTS, DEFAULT_BAND_GAIN, gainToDb } from '@/lib/band'
import { cn } from '@/lib/cn'

// ── BandPanel — the band-modus toggle + ensemble mixer ───────────────────────
// Compact, scene-styled control shared by all four instrument fag. Turning band
// on makes the player rebuild with the accompaniment (see each player's build
// effect); this panel then rides the engine's LIVE mixer — moving a slider or
// hitting mute takes effect instantly with no rebuild. The learner's own
// instrument (`own`) is never in the band (they play it), so it is shown marked
// «deg» rather than as a fader.

const LABEL: Record<InstrumentId, string> = {
  piano: 'Piano',
  bass: 'Bass',
  drums: 'Trommer',
  guitar: 'Gitar',
}
const FAG_VAR: Record<InstrumentId, string> = {
  piano: 'var(--fag-piano)',
  bass: 'var(--fag-bass)',
  drums: 'var(--fag-trommer)',
  guitar: 'var(--fag-gitar)',
}

interface Props {
  /** The instrument this fag's learner plays — excluded from the band mix. */
  own: InstrumentId
}

export function BandPanel({ own }: Props) {
  const bandMode = usePlayer((s) => s.bandMode)
  const bandMix = usePlayer((s) => s.bandMix)
  const [muted, setMuted] = useState<Partial<Record<InstrumentId, boolean>>>({})

  // The app plays the rhythm section minus whatever the learner plays. Guitar is
  // never in the default band (see band.ts), so the faders are piano/bass/drums.
  const played = (['piano', 'bass', 'drums'] as InstrumentId[]).filter((i) => i !== own)

  const gainOf = (inst: InstrumentId) => bandMix[inst] ?? DEFAULT_BAND_GAIN[inst]

  const onToggleBand = () => {
    const next = !usePlayer.getState().bandMode
    if (!next) {
      // Leaving band-modus: clear any mute/level the mixer left on the shared
      // Volume nodes so a muted band track can't silence this fag's own audio.
      const engine = getEngine()
      for (const inst of BAND_INSTRUMENTS) {
        engine.muteTrack(inst, false)
        engine.setTrackVolume(inst, 0)
      }
      setMuted({})
    }
    usePlayer.getState().setBandMode(next)
  }

  const onGain = (inst: InstrumentId, gain: number) => {
    usePlayer.getState().setBandMix({ ...usePlayer.getState().bandMix, [inst]: gain })
    if (!muted[inst]) getEngine().setTrackVolume(inst, gainToDb(gain))
  }

  const onMute = (inst: InstrumentId) => {
    const next = !muted[inst]
    setMuted((m) => ({ ...m, [inst]: next }))
    getEngine().muteTrack(inst, next)
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--color-muted)]" />
          <span className="text-sm font-medium text-[var(--color-ivory)]">Band</span>
          <span className="hidden text-xs text-[var(--color-muted)] sm:inline">
            spill med — appen tar resten av bandet
          </span>
        </div>
        <button
          onClick={onToggleBand}
          role="switch"
          aria-checked={bandMode}
          aria-label="Band-modus"
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
            bandMode
              ? 'border-[var(--color-amber)] bg-[var(--color-amber)]'
              : 'border-[var(--color-border)] bg-[var(--color-raised)]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full transition-transform',
              bandMode
                ? 'translate-x-[22px] bg-[var(--color-ink-on-amber)]'
                : 'translate-x-0.5 bg-[var(--color-muted)]',
            )}
          />
        </button>
      </div>

      {bandMode && (
        <div className="mt-4 flex flex-col gap-3">
          {played.map((inst) => {
            const gain = gainOf(inst)
            const isMuted = !!muted[inst]
            return (
              <div key={inst} className="flex items-center gap-3">
                <button
                  onClick={() => onMute(inst)}
                  aria-pressed={isMuted}
                  aria-label={isMuted ? `Slå på ${LABEL[inst]}` : `Demp ${LABEL[inst]}`}
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors',
                    isMuted
                      ? 'border-[var(--color-danger)] text-[var(--color-danger)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                  )}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <span
                  className="w-16 shrink-0 text-sm font-medium"
                  style={{ color: FAG_VAR[inst], opacity: isMuted ? 0.5 : 1 }}
                >
                  {LABEL[inst]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={gain}
                  onChange={(e) => onGain(inst, Number(e.target.value))}
                  aria-label={`${LABEL[inst]} volum`}
                  className="h-1.5 flex-1 cursor-pointer accent-[var(--color-amber)]"
                  style={{ opacity: isMuted ? 0.5 : 1 }}
                />
                <span className="w-9 shrink-0 text-right text-xs tabular-nums text-[var(--color-muted)]">
                  {Math.round(gain * 100)}
                </span>
              </div>
            )
          })}

          <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
              style={{ borderColor: FAG_VAR[own], color: FAG_VAR[own] }}
            >
              {LABEL[own]} · deg
            </span>
            <span>Du spiller {LABEL[own].toLowerCase()} — resten er bandet.</span>
          </div>
        </div>
      )}
    </div>
  )
}
