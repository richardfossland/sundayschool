#!/usr/bin/env node
// ── Sample fetcher ───────────────────────────────────────────────────────────
// Downloads (and, for drums, renames) every audio sample SundaySchool needs into
// public/samples/<instrument>/ so the app self-hosts them (no external CDN at
// runtime) and writes public/samples/CREDITS.md with the exact source + licence
// of each file. Idempotent: re-running skips files that already exist.
//
// Run:  node scripts/fetch-samples.mjs   (needs network access)
//
// The instrument specs in src/lib/instruments.ts MUST stay in sync with the
// filenames produced here (there is an instruments.test.ts guard on the shape).

import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'samples')

// ── Source manifests ─────────────────────────────────────────────────────────

// Piano: the historical Salamander Grand subset (every minor third A0–C8),
// moved off the Tone.js CDN and self-hosted. Same filenames as before.
function pianoFiles() {
  const roots = ['A', 'C', 'Ds', 'Fs']
  const files = []
  for (let o = 0; o <= 7; o++) {
    for (const r of roots) {
      if (o === 0 && r !== 'A') continue
      files.push(`${r}${o}.mp3`)
    }
  }
  files.push('C8.mp3')
  return files
}
const PIANO_BASE = 'https://tonejs.github.io/audio/salamander/'

// Guitar (acoustic) — minor-third subset A2–C5 of nbrosowsky/tonejs-instruments.
const GUITAR_FILES = [
  'A2.mp3', 'C3.mp3', 'Ds3.mp3', 'Fs3.mp3', 'A3.mp3',
  'C4.mp3', 'Ds4.mp3', 'Fs4.mp3', 'A4.mp3', 'C5.mp3',
]
const GUITAR_BASE =
  'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-acoustic/'

// Bass (electric) — E1–G3 subset of nbrosowsky/tonejs-instruments.
const BASS_FILES = [
  'E1.mp3', 'G1.mp3', 'As1.mp3', 'Cs2.mp3', 'E2.mp3',
  'G2.mp3', 'As2.mp3', 'Cs3.mp3', 'E3.mp3', 'G3.mp3',
]
const BASS_BASE =
  'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/bass-electric/'

// Drums — CC0 one-shots from Sonic Pi, RENAMED to their GM percussion pitch so
// the Tone.Players key IS the GM number. Kept as .flac (decodes natively in all
// modern browsers incl. iOS 11+); no lossy re-encode without ffmpeg.
const DRUM_BASE = 'https://raw.githubusercontent.com/sonic-pi-net/sonic-pi/dev/etc/samples/'
const DRUM_MAP = [
  { gm: 36, src: 'drum_heavy_kick.flac', label: 'Kick (acoustic bass drum)' },
  { gm: 38, src: 'drum_snare_hard.flac', label: 'Snare (acoustic)' },
  { gm: 42, src: 'drum_cymbal_closed.flac', label: 'Closed hi-hat' },
  { gm: 46, src: 'drum_cymbal_open.flac', label: 'Open hi-hat' },
  { gm: 41, src: 'drum_tom_lo_hard.flac', label: 'Low floor tom' },
  { gm: 45, src: 'drum_tom_mid_hard.flac', label: 'Mid tom' },
  { gm: 48, src: 'drum_tom_hi_hard.flac', label: 'High tom' },
  { gm: 49, src: 'drum_cymbal_hard.flac', label: 'Crash cymbal' },
  { gm: 51, src: 'drum_cymbal_soft.flac', label: 'Ride cymbal (softer cymbal one-shot)' },
]

// ── Download helpers ─────────────────────────────────────────────────────────

const MIN_BYTES = 5 * 1024 // reject truncated/HTML-error responses

async function exists(p) {
  try {
    const s = await stat(p)
    return s.isFile() && s.size >= MIN_BYTES
  } catch {
    return false
  }
}

async function download(url, dest) {
  if (await exists(dest)) {
    return { url, dest, bytes: (await stat(dest)).size, skipped: true }
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < MIN_BYTES) throw new Error(`Suspiciously small (${buf.length} B): ${url}`)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  return { url, dest, bytes: buf.length, skipped: false }
}

async function fetchGroup(name, base, entries) {
  // entries: [{ src, out }]
  const results = []
  let done = 0
  for (const { src, out } of entries) {
    const r = await download(base + src, join(OUT, name, out))
    results.push(r)
    done++
    process.stdout.write(
      `  ${name}: ${out.padEnd(10)} ${(r.bytes / 1024).toFixed(1)} kB` +
        `${r.skipped ? ' (cached)' : ''}  [${done}/${entries.length}]\n`,
    )
  }
  const bytes = results.reduce((a, r) => a + r.bytes, 0)
  return { name, count: results.length, bytes }
}

// ── CREDITS.md ───────────────────────────────────────────────────────────────

function creditsMd(summary) {
  const fmt = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`
  return `# Sample credits

All audio in \`public/samples/\` is self-hosted so SundaySchool has no external
audio CDN at runtime. Every file is public-domain or permissively licensed;
sources and licences are listed below. Regenerate with \`node scripts/fetch-samples.mjs\`.

## Piano — \`piano/\` (${summary.piano.count} files, ${fmt(summary.piano.bytes)})

- **Source:** Salamander Grand Piano V3, subset served from the Tone.js audio
  repo (\`tonejs.github.io/audio/salamander/\`). One sample every minor third,
  A0–C8; Tone.Sampler pitch-shifts between them.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0) — Alexander Holm.
- Filenames are unchanged from the source.

## Guitar — \`guitar/\` (${summary.guitar.count} files, ${fmt(summary.guitar.bytes)})

- **Source:** \`guitar-acoustic\` set from **nbrosowsky/tonejs-instruments**
  (originally the University of Iowa Electronic Music Studios recordings).
  Minor-third subset A2–C5.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0).
- Filenames are unchanged from the source.

## Bass — \`bass/\` (${summary.bass.count} files, ${fmt(summary.bass.bytes)})

- **Source:** \`bass-electric\` set from **nbrosowsky/tonejs-instruments**.
  Subset E1–G3.
- **Licence:** Creative Commons Attribution 3.0 (CC-BY 3.0).
- **Deviation from the plan:** the plan named FreePats "Clean Electric Bass"
  (CC0). FreePats ships as an SF2 soundfont / FLAC tarball, which is impractical
  to slice into per-note web files here. tonejs-instruments \`bass-electric\` is
  MP3-ready and range-appropriate, so it was chosen for practicality; the
  trade-off is CC-BY attribution (satisfied on this page) instead of CC0.

## Drums — \`drums/\` (${summary.drums.count} files, ${fmt(summary.drums.bytes)})

- **Source:** drum one-shots from **Sonic Pi** (\`sonic-pi-net/sonic-pi\`,
  \`etc/samples/\`), themselves sourced from freesound.org.
- **Licence:** Creative Commons Zero (CC0 1.0, public domain).
- Files are **renamed to their General MIDI percussion pitch** so the filename
  is the drum's identity (drums are never pitch-shifted). Kept as \`.flac\`
  (native browser decode, incl. iOS 11+) since no lossy re-encoder is bundled.
- **Deviation from the plan:** the plan named FreePats GM percussion (CC0).
  FreePats percussion is an SF2 soundfont (no per-drum web files); Sonic Pi's
  drum samples are also CC0, ship as ready individual files, and include the
  open hi-hat / crash / ride the drum lanes need — so they were chosen.

| GM pitch | File | Sonic Pi source | Piece |
| --- | --- | --- | --- |
${DRUM_MAP.map((d) => `| ${d.gm} | \`${d.gm}.flac\` | \`${d.src}\` | ${d.label} |`).join('\n')}

---

Total: ${summary.total.count} files, ${fmt(summary.total.bytes)}.
Last generated: ${new Date().toISOString().slice(0, 10)}.
`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching samples into public/samples/ …\n')

  const piano = await fetchGroup(
    'piano',
    PIANO_BASE,
    pianoFiles().map((f) => ({ src: f, out: f })),
  )
  const guitar = await fetchGroup(
    'guitar',
    GUITAR_BASE,
    GUITAR_FILES.map((f) => ({ src: f, out: f })),
  )
  const bass = await fetchGroup(
    'bass',
    BASS_BASE,
    BASS_FILES.map((f) => ({ src: f, out: f })),
  )
  const drums = await fetchGroup(
    'drums',
    DRUM_BASE,
    DRUM_MAP.map((d) => ({ src: d.src, out: `${d.gm}.flac` })),
  )

  const total = {
    count: piano.count + guitar.count + bass.count + drums.count,
    bytes: piano.bytes + guitar.bytes + bass.bytes + drums.bytes,
  }
  const summary = { piano, guitar, bass, drums, total }

  await writeFile(join(OUT, 'CREDITS.md'), creditsMd(summary))

  console.log('\nDone.')
  for (const g of [piano, guitar, bass, drums]) {
    console.log(`  ${g.name.padEnd(7)} ${g.count} files, ${(g.bytes / 1024 / 1024).toFixed(2)} MB`)
  }
  console.log(`  TOTAL   ${total.count} files, ${(total.bytes / 1024 / 1024).toFixed(2)} MB`)
  console.log('  Wrote public/samples/CREDITS.md')
}

main().catch((err) => {
  console.error('\nfetch-samples failed:', err.message)
  process.exit(1)
})
