import type { Metadata } from 'next'
import { seedSongs } from '@/data/songs'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Om rettigheter — SundaySchool',
  description:
    'Slik holder vi repertoaret fritt og lovlig: tre rettighetslag, dobbelt-PD-regelen og dokumentert opphav for hver sang.',
}

const LAYERS = [
  {
    title: 'Verket',
    body:
      'Selve melodien og teksten. Vi publiserer kun verk der alle opphavere — komponist, tekstforfatter og eventuell oversetter — døde i god tid før 1956, og der verket ble utgitt før 1930.',
  },
  {
    title: 'Arrangementet',
    body:
      'Pianosatsen du øver på. Alle arrangementer i SundaySchool er laget av oss, spesielt for fallende-noter-formatet. Vi kopierer aldri en opphavsrettsbeskyttet sats.',
  },
  {
    title: 'Filen',
    body:
      'Sangene lagres som semantiske notedata — tonehøyder og rytme, aldri lyd og aldri en innspilling. Ingen fonogramrettigheter er involvert.',
  },
]

/** Self-hosted sample sets and their licences (see /samples/CREDITS.md). */
const AUDIO_SOURCES = [
  {
    instrument: 'Piano',
    body: 'Salamander Grand Piano (subset). Innspilt av Alexander Holm.',
    licence: 'CC-BY 3.0',
  },
  {
    instrument: 'Gitar og bass',
    body: 'Akustisk gitar og elbass fra tonejs-instruments (Iowa-innspillinger).',
    licence: 'CC-BY 3.0',
  },
  {
    instrument: 'Trommer',
    body: 'Enkelttreff fra Sonic Pi (opprinnelig freesound.org), navngitt etter GM-tromme-ID.',
    licence: 'CC0 (fritt tilgjengelig)',
  },
]

/** Role labels for the rights table. */
const ROLE_LABEL: Record<string, string> = {
  komponist: 'Komponist',
  tekstforfatter: 'Tekstforfatter',
  oversetter: 'Oversetter',
  'kilde-arrangør': 'Kilde-arrangør',
}

export default function OmRettigheterPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Om rettigheter
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            SundaySchool er bygget for å være trygt å bruke i menigheten. Her forklarer vi hvordan
            vi holder hele repertoaret fritt og lovlig.
          </p>
        </header>

        {/* Three rights layers */}
        <section className="mb-10">
          <h2 className="mb-4 font-display text-2xl text-[var(--color-ivory)]">Tre rettighetslag</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {LAYERS.map((l) => (
              <div
                key={l.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <h3 className="font-display text-lg text-[var(--color-amber)]">{l.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{l.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Double-PD rule */}
        <section className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Dobbelt-PD-regelen</h2>
          <p className="mt-3 text-[var(--color-muted)]">
            For at en sang skal komme inn i biblioteket, må den bestå to krav samtidig:
          </p>
          <ul className="mt-4 space-y-2 text-[var(--color-muted)]">
            <li className="flex gap-3">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-amber)]" />
              <span>
                <strong className="text-[var(--color-ivory)]">Alle opphavere døde før 1956.</strong>{' '}
                Da har vernetiden på 70 år etter dødsåret løpt ut med god margin.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-amber)]" />
              <span>
                <strong className="text-[var(--color-ivory)]">Publisert før 1930.</strong> En ekstra
                sikkerhetsmargin som luker ut senere bearbeidelser.
              </span>
            </li>
          </ul>
        </section>

        {/* Own arrangements + uploaded MIDI */}
        <section className="mb-12 space-y-4 text-[var(--color-muted)]">
          <p>
            <strong className="text-[var(--color-ivory)]">Egne arrangementer.</strong> Pianosatsene
            er skrevet av oss fra bunnen av. De bygger på fritt tilgjengelige melodier, men selve
            satsen er vår egen og deles som en del av SundaySchool.
          </p>
          <p>
            <strong className="text-[var(--color-ivory)]">Din egen MIDI.</strong> Hvis du laster opp
            en MIDI-fil for å øve på den, behandles den kun lokalt i nettleseren din. Den lastes
            aldri opp til noen server og lagres aldri hos oss.
          </p>
        </section>

        {/* Audio samples */}
        <section className="mb-12">
          <h2 className="mb-1 font-display text-2xl text-[var(--color-ivory)]">Lyd</h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Instrumentlydene er ekte innspilte toner (samples) som vi hoster selv — ingen ekstern
            lydtjeneste. Hvert sett er fritt lisensiert:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AUDIO_SOURCES.map((a) => (
              <div
                key={a.instrument}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <h3 className="font-display text-lg text-[var(--color-amber)]">{a.instrument}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{a.body}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {a.licence}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Full kilde- og lisensliste per lydfil finner du i{' '}
            <a
              href="/samples/CREDITS.md"
              className="text-[var(--color-amber)] underline underline-offset-2"
            >
              lyd-creditsfilen
            </a>
            .
          </p>
        </section>

        {/* Dynamic rights table */}
        <section>
          <h2 className="mb-1 font-display text-2xl text-[var(--color-ivory)]">
            Dokumentert opphav
          </h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Rettighetsdataen bak hver sang i biblioteket ({seedSongs.length} sanger).
          </p>

          <div className="scroll-x rounded-2xl border border-[var(--color-border)]">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  <th className="px-4 py-3 font-medium">Sang</th>
                  <th className="px-4 py-3 font-medium">Opphavere</th>
                  <th className="px-4 py-3 font-medium">Kilder</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Verifisert</th>
                </tr>
              </thead>
              <tbody>
                {seedSongs.map((song) => (
                  <tr
                    key={song.slug}
                    className="border-b border-[var(--color-border)] align-top last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--color-ivory)]">{song.title}</span>
                      {song.subtitle && (
                        <span className="block text-xs text-[var(--color-muted)]">
                          {song.subtitle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      <ul className="space-y-1">
                        {song.rights.creators.map((c, i) => (
                          <li key={i}>
                            {c.name}
                            <span className="text-[var(--color-muted)]/70">
                              {' '}
                              — {ROLE_LABEL[c.role] ?? c.role}
                              {c.deathYear !== null ? `, d. ${c.deathYear}` : ', tradisjonell'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {song.rights.sources.join('; ')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-muted)]">
                      {song.rights.verifiedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {seedSongs.length === 0 && (
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Rettighetstabellen fylles når de første sangene er lagt inn.
            </p>
          )}
        </section>
      </main>
    </AppShell>
  )
}
