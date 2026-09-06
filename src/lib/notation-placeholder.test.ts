import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ── The lazy score placeholder must reserve the REAL system height ────────────
//
// NotationSongLazy holds VexFlow out of the initial bundle and draws a plain box
// until it arrives. That box only prevents a layout jump if it is exactly as tall
// as what replaces it — and the two staff shapes differ by 80 px, so the numbers
// have to be per shape.
//
// The heights live in two files that cannot import each other cheaply (the
// placeholder must not pull the VexFlow module in just to read a constant), so
// this test is the seam: it reads both sources and fails the moment a layout
// change in NotationSong leaves the placeholder behind. A source-text check is
// deliberate — these tests run in node, and neither file can be imported here
// (JSX, next/dynamic, VexFlow's DOM).

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const notation = read('../components/NotationSong.tsx')
const lazy = read('../components/NotationSongLazy.tsx')

/** `const NAME: Layout = { systemHeight: 196, … }` → 196 */
function layoutSystemHeight(name: string): number {
  const m = notation.match(new RegExp(`const ${name}\\s*:\\s*Layout\\s*=\\s*\\{[^}]*?systemHeight:\\s*(\\d+)`))
  expect(m, `NotationSong.tsx no longer declares a ${name} layout with a systemHeight`).toBeTruthy()
  return Number(m![1])
}

/** `SYSTEM_HEIGHT = { grand: 196, treble: 116 }` → the named number */
function placeholderHeight(key: 'grand' | 'treble'): number {
  const m = lazy.match(new RegExp(`SYSTEM_HEIGHT\\s*=\\s*\\{[^}]*?${key}:\\s*(\\d+)`))
  expect(m, `NotationSongLazy.tsx no longer declares a ${key} placeholder height`).toBeTruthy()
  return Number(m![1])
}

describe('NotationSongLazy placeholder height', () => {
  it('reserves exactly one grand-staff system', () => {
    expect(placeholderHeight('grand')).toBe(layoutSystemHeight('GRAND'))
  })

  it('reserves exactly one treble-only system — the rhythm snippets', () => {
    expect(placeholderHeight('treble')).toBe(layoutSystemHeight('TREBLE_ONLY'))
  })

  it('keeps the two shapes apart — one height for both is the bug', () => {
    expect(placeholderHeight('grand')).not.toBe(placeholderHeight('treble'))
  })
})
