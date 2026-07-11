# Sample credits

All audio in `public/samples/` is self-hosted so SundaySchool has no external
audio CDN at runtime. Every file is public-domain or permissively licensed;
sources and licences are listed below. Regenerate with `node scripts/fetch-samples.mjs`.

## Piano — `piano/` (30 files, 1.92 MB)

- **Source:** Salamander Grand Piano V3, subset served from the Tone.js audio
  repo (`tonejs.github.io/audio/salamander/`). One sample every minor third,
  A0–C8; Tone.Sampler pitch-shifts between them.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0) — Alexander Holm.
- Filenames are unchanged from the source.

## Guitar — `guitar/` (10 files, 1.64 MB)

- **Source:** `guitar-acoustic` set from **nbrosowsky/tonejs-instruments**
  (originally the University of Iowa Electronic Music Studios recordings).
  Minor-third subset A2–C5.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0).
- Filenames are unchanged from the source.

## Bass — `bass/` (10 files, 3.25 MB)

- **Source:** `bass-electric` set from **nbrosowsky/tonejs-instruments**.
  Subset E1–G3.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0).
- **Deviation from the plan:** the plan named FreePats "Clean Electric Bass"
  (CC0). FreePats ships as an SF2 soundfont / FLAC tarball, which is impractical
  to slice into per-note web files here. tonejs-instruments `bass-electric` is
  MP3-ready and range-appropriate, so it was chosen for practicality; the
  trade-off is CC-BY attribution (satisfied on this page) instead of CC0.

## Drums — `drums/` (9 files, 0.43 MB)

- **Source:** drum one-shots from **Sonic Pi** (`sonic-pi-net/sonic-pi`,
  `etc/samples/`), themselves sourced from freesound.org.
- **Licence:** Creative Commons Zero (CC0 1.0, public domain).
- Files are **renamed to their General MIDI percussion pitch** so the filename
  is the drum's identity (drums are never pitch-shifted). Kept as `.flac`
  (native browser decode, incl. iOS 11+) since no lossy re-encoder is bundled.
- **Deviation from the plan:** the plan named FreePats GM percussion (CC0).
  FreePats percussion is an SF2 soundfont (no per-drum web files); Sonic Pi's
  drum samples are also CC0, ship as ready individual files, and include the
  open hi-hat / crash / ride the drum lanes need — so they were chosen.

| GM pitch | File | Sonic Pi source | Piece |
| --- | --- | --- | --- |
| 36 | `36.flac` | `drum_heavy_kick.flac` | Kick (acoustic bass drum) |
| 38 | `38.flac` | `drum_snare_hard.flac` | Snare (acoustic) |
| 42 | `42.flac` | `drum_cymbal_closed.flac` | Closed hi-hat |
| 46 | `46.flac` | `drum_cymbal_open.flac` | Open hi-hat |
| 41 | `41.flac` | `drum_tom_lo_hard.flac` | Low floor tom |
| 45 | `45.flac` | `drum_tom_mid_hard.flac` | Mid tom |
| 48 | `48.flac` | `drum_tom_hi_hard.flac` | High tom |
| 49 | `49.flac` | `drum_cymbal_hard.flac` | Crash cymbal |
| 51 | `51.flac` | `drum_cymbal_soft.flac` | Ride cymbal (softer cymbal one-shot) |

---

Total: 59 files, 7.24 MB.
Last generated: 2026-07-10.
