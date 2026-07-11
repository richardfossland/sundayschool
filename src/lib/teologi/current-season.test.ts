import { describe, expect, it } from 'vitest'
import { currentSeasonId } from './current-season'

// Fixed dates chosen inside each band. Easter-dependent bands are approximate
// (see current-season.ts) — these assert the helper's own logic, not liturgy.
describe('currentSeasonId', () => {
  const cases: [string, ReturnType<typeof currentSeasonId>][] = [
    ['2026-01-01', 'jul'], // new-year tail of juletiden
    ['2026-01-05', 'jul'], // last day of the early jul band
    ['2026-01-06', 'apenbaringstiden'], // Kristi åpenbaringsdag
    ['2026-02-10', 'apenbaringstiden'],
    ['2026-03-01', 'fastetiden'],
    ['2026-04-08', 'stille-uke'],
    ['2026-04-20', 'paske'],
    ['2026-05-14', 'paske'], // Kristi himmelfart falls inside påsketiden
    ['2026-06-03', 'pinse'],
    ['2026-08-15', 'treenighetstiden'],
    ['2026-10-05', 'treenighetstiden'], // høsttakkefest → broad season
    ['2026-11-01', 'treenighetstiden'], // allehelgen → broad season
    ['2026-11-26', 'domssondag'],
    ['2026-12-01', 'advent'],
    ['2026-12-24', 'advent'],
    ['2026-12-25', 'jul'],
    ['2026-12-31', 'jul'],
  ]

  it.each(cases)('%s → %s', (iso, expected) => {
    // Construct at local noon so no timezone can roll the day over.
    const [y, m, d] = iso.split('-').map(Number)
    expect(currentSeasonId(new Date(y, m - 1, d, 12))).toBe(expected)
  })

  it('covers every day of a leap year with a season', () => {
    const start = new Date(2028, 0, 1, 12)
    for (let i = 0; i < 366; i++) {
      const day = new Date(start.getTime() + i * 86400000)
      if (day.getFullYear() !== 2028) break
      expect(currentSeasonId(day)).toBeTruthy()
    }
  })
})
