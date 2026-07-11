import type { Creed } from '@/types/teologi'

// ── Trosbekjennelser ───────────────────────────────────────────────────────────
// The Apostles' and Nicene creeds in the language of the 1920 Alterbok for Den
// norske kirke, gently modernised by us (hence `modernized: true`).
//
// DECISION — the Athanasian creed is omitted: it is very long (40+ clauses) and
// rarely used liturgically; including a shortened version would misrepresent a
// confessional text. Documented here rather than shipping a truncation.

const RIGHTS = {
  source: 'Alterbok for Den norske kirke (1920)',
  edition: 'Alterbok 1920',
  modernized: true,
} as const

export const creeds: Creed[] = [
  {
    id: 'apostolicum',
    title: 'Den apostoliske trosbekjennelse',
    text: [
      'Jeg tror på Gud Fader, den allmektige, himmelens og jordens skaper.',
      'Jeg tror på Jesus Kristus, hans enbårne Sønn, vår Herre, som ble unnfanget ved Den Hellige Ånd, født av jomfru Maria, pint under Pontius Pilatus, korsfestet, død og begravet, fór ned til dødsriket, sto opp fra de døde tredje dag, fór opp til himmelen, sitter ved Guds, den allmektige Faders høyre hånd, skal derfra komme igjen for å dømme levende og døde.',
      'Jeg tror på Den Hellige Ånd, en hellig, alminnelig kirke, de helliges samfunn, syndenes forlatelse, legemets oppstandelse og det evige liv. Amen.',
    ],
    rights: RIGHTS,
  },
  {
    id: 'nicaenum',
    title: 'Den nikenske trosbekjennelse',
    text: [
      'Jeg tror på én Gud, den allmektige Fader, som har skapt himmel og jord, alt synlig og usynlig.',
      'Jeg tror på én Herre, Jesus Kristus, Guds enbårne Sønn, født av Faderen før alle tider, Gud av Gud, lys av lys, sann Gud av sann Gud, født, ikke skapt, av samme vesen som Faderen. Ved ham er alt blitt skapt. For oss mennesker og til vår frelse steg han ned fra himmelen, og ved Den Hellige Ånd ble han menneske av jomfru Maria. Han ble korsfestet for oss under Pontius Pilatus, led og ble begravet, oppsto den tredje dag etter Skriftene og fór opp til himmelen, sitter ved Faderens høyre hånd, skal komme igjen i herlighet for å dømme levende og døde, og hans rike skal være uten ende.',
      'Jeg tror på Den Hellige Ånd, som er Herre og gjør levende, som utgår fra Faderen og Sønnen, som tilbes og æres sammen med Faderen og Sønnen, og som har talt ved profetene. Jeg tror på én hellig, alminnelig og apostolisk kirke. Jeg bekjenner én dåp til syndenes forlatelse og venter de dødes oppstandelse og et liv i den kommende verden. Amen.',
    ],
    rights: RIGHTS,
  },
]
