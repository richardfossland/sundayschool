import type { MemoryVerse, VerseCollection } from '@/types/teologi'

// ── Memoreringsvers ────────────────────────────────────────────────────────────
// 40 verses from Bibelen, Det Norske Bibelselskaps oversettelse 1930 (public
// domain), grouped in 5 themed collections of 8. The 1930 wording (mig/dig/
// eder/efter/op-…) is kept verbatim — this IS the translation, not a typo.
// Verses were chosen for being core memory verses whose 1930 wording is well
// established; where the exact 1930 phrasing of a candidate verse was
// uncertain, a different verse was chosen instead (see module report).

const RIGHTS = {
  source: 'Bibelen, Det Norske Bibelselskaps oversettelse 1930 (falt i det fri)',
} as const

/** Shorthand builder — keeps the 40 entries readable. */
function v(id: string, ref: string, text: string, theme: string[]): MemoryVerse {
  return { id, ref, text, theme, rights: RIGHTS }
}

export const memoryVerses: MemoryVerse[] = [
  // ── Trøst ──
  v(
    'sal-23-1-2',
    'Salme 23,1–2',
    'Herren er min hyrde, mig fattes intet. Han lar mig ligge i grønne enger, han leder mig til hvilens vann.',
    ['trost'],
  ),
  v(
    'sal-23-4',
    'Salme 23,4',
    'Om jeg enn skulde vandre i dødsskyggens dal, frykter jeg ikke for ondt; for du er med mig, din kjepp og din stav de trøster mig.',
    ['trost'],
  ),
  v(
    'matt-11-28',
    'Matt 11,28',
    'Kom til mig, alle I som strever og har tungt å bære, og jeg vil gi eder hvile!',
    ['trost'],
  ),
  v(
    'jes-41-10',
    'Jes 41,10',
    'Frykt ikke, for jeg er med dig! Se dig ikke engstelig om, for jeg er din Gud! Jeg styrker dig og hjelper dig og holder dig oppe med min rettferds høire hånd.',
    ['trost'],
  ),
  v(
    'fil-4-6-7',
    'Fil 4,6–7',
    'Vær ikke bekymret for noget, men la i alle ting eders begjæringer komme frem for Gud i påkallelse og bønn med takksigelse; og Guds fred, som overgår all forstand, skal bevare eders hjerter og eders tanker i Kristus Jesus.',
    ['trost'],
  ),
  v(
    'sal-121-1-2',
    'Salme 121,1–2',
    'Jeg løfter mine øine op til fjellene; hvorfra kommer min hjelp? Min hjelp kommer fra Herren, himmelens og jordens skaper.',
    ['trost'],
  ),
  v(
    'joh-14-27',
    'Joh 14,27',
    'Fred efterlater jeg eder, min fred gir jeg eder; ikke som verden gir, gir jeg eder. Eders hjerte forferdes ikke og reddes ikke!',
    ['trost'],
  ),
  v(
    'sal-46-2',
    'Salme 46,2',
    'Gud er vår tilflukt og vår styrke, en hjelp i trengsler, funnet såre stor.',
    ['trost'],
  ),

  // ── Lovsang ──
  v(
    'sal-103-1-2',
    'Salme 103,1–2',
    'Min sjel, lov Herren, og alt som i mig er, love hans hellige navn! Min sjel, lov Herren og glem ikke alle hans velgjerninger!',
    ['lovsang'],
  ),
  v(
    'sal-100-1-2',
    'Salme 100,1–2',
    'Rop med fryd for Herren, all jorden! Tjen Herren med glede, kom frem for hans åsyn med jubel!',
    ['lovsang'],
  ),
  v(
    'sal-118-24',
    'Salme 118,24',
    'Dette er dagen som Herren har gjort; la oss fryde oss og glede oss på den!',
    ['lovsang'],
  ),
  v('sal-150-6', 'Salme 150,6', 'Alt som har ånde, love Herren! Halleluja!', ['lovsang']),
  v(
    'sal-8-2',
    'Salme 8,2',
    'Herre, vår Herre, hvor herlig ditt navn er over all jorden, du som har utbredt din prakt over himmelen!',
    ['lovsang'],
  ),
  v(
    'sal-96-1',
    'Salme 96,1',
    'Syng for Herren en ny sang, syng for Herren, all jorden!',
    ['lovsang'],
  ),
  v(
    'fil-4-4',
    'Fil 4,4',
    'Gled eder i Herren alltid! atter vil jeg si: Gled eder!',
    ['lovsang'],
  ),
  v(
    'sal-95-1',
    'Salme 95,1',
    'Kom, la oss juble for Herren, la oss rope med fryd for vår frelses klippe!',
    ['lovsang'],
  ),

  // ── Frelse ──
  v(
    'joh-3-16',
    'Joh 3,16',
    'For så har Gud elsket verden at han gav sin Sønn, den enbårne, forat hver den som tror på ham, ikke skal fortapes, men ha evig liv.',
    ['frelse'],
  ),
  v(
    'rom-6-23',
    'Rom 6,23',
    'For den lønn som synden gir, er døden, men Guds nådegave er evig liv i Kristus Jesus, vår Herre.',
    ['frelse'],
  ),
  v(
    'ef-2-8',
    'Ef 2,8',
    'For av nåde er I frelst, ved tro, og det ikke av eder selv, det er Guds gave.',
    ['frelse'],
  ),
  v(
    'rom-10-9',
    'Rom 10,9',
    'For dersom du med din munn bekjenner at Jesus er Herre, og i ditt hjerte tror at Gud opvakte ham fra de døde, da skal du bli frelst.',
    ['frelse'],
  ),
  v(
    'joh-14-6',
    'Joh 14,6',
    'Jesus sier til ham: Jeg er veien og sannheten og livet; ingen kommer til Faderen uten ved mig.',
    ['frelse'],
  ),
  v(
    'joh-1-12',
    'Joh 1,12',
    'Men alle dem som tok imot ham, dem gav han rett til å bli Guds barn, dem som tror på hans navn.',
    ['frelse'],
  ),
  v(
    '1joh-1-9',
    '1 Joh 1,9',
    'Dersom vi bekjenner våre synder, er han trofast og rettferdig, så han forlater oss syndene og renser oss fra all urettferdighet.',
    ['frelse'],
  ),
  v(
    'apg-4-12',
    'Apg 4,12',
    'Og det er ikke frelse i nogen annen; for det er heller ikke noget annet navn under himmelen, gitt blandt mennesker, ved hvilket vi skal bli frelst.',
    ['frelse'],
  ),

  // ── Tjeneste ──
  v(
    'matt-5-16',
    'Matt 5,16',
    'La således eders lys skinne for menneskene, forat de kan se eders gode gjerninger og prise eders Fader i himmelen!',
    ['tjeneste'],
  ),
  v(
    'mika-6-8',
    'Mika 6,8',
    'Han har åpenbaret dig, menneske, hvad godt er; og hvad krever Herren av dig uten at du skal gjøre rett og gjerne vise kjærlighet og vandre ydmykt med din Gud?',
    ['tjeneste'],
  ),
  v(
    'mark-10-45',
    'Mark 10,45',
    'For Menneskesønnen er heller ikke kommet for å la sig tjene, men for selv å tjene og gi sitt liv til en løsepenge for mange.',
    ['tjeneste'],
  ),
  v(
    'gal-6-2',
    'Gal 6,2',
    'Bær hverandres byrder, og opfyll på den måte Kristi lov!',
    ['tjeneste'],
  ),
  v(
    'joh-13-34',
    'Joh 13,34',
    'Et nytt bud gir jeg eder, at I skal elske hverandre; likesom jeg har elsket eder, skal også I elske hverandre.',
    ['tjeneste'],
  ),
  v(
    'matt-25-40',
    'Matt 25,40',
    'Og kongen skal svare og si til dem: Sannelig sier jeg eder: Hvad I har gjort imot en av disse mine minste brødre, det har I gjort imot mig.',
    ['tjeneste'],
  ),
  v(
    'kol-3-23',
    'Kol 3,23',
    'Det I gjør, gjør det av hjertet, som for Herren og ikke for mennesker.',
    ['tjeneste'],
  ),
  v(
    '1pet-4-10',
    '1 Pet 4,10',
    'Efter som enhver har fått en nådegave, så tjen hverandre med den som gode husholdere over Guds mangehånde nåde.',
    ['tjeneste'],
  ),

  // ── Påske / Høytid ──
  v(
    'luk-2-10-11',
    'Luk 2,10–11',
    'Og engelen sa til dem: Frykt ikke! for se, jeg forkynner eder en stor glede, som skal vederfares alt folket! Eder er idag en frelser født, som er Kristus, Herren, i Davids stad.',
    ['hoytid', 'jul'],
  ),
  v(
    'jes-9-6',
    'Jes 9,6',
    'For et barn er oss født, en sønn er oss gitt, og herredømmet er på hans skulder, og han kalles under, rådgiver, veldig Gud, evig fader, fredsfyrste.',
    ['hoytid', 'jul'],
  ),
  v(
    'matt-21-9',
    'Matt 21,9',
    'Og folket som gikk foran og fulgte efter, ropte: Hosianna Davids sønn! Velsignet være han som kommer i Herrens navn! Hosianna i det høieste!',
    ['hoytid', 'paske'],
  ),
  v(
    'matt-28-5-6',
    'Matt 28,5–6',
    'Men engelen tok til orde og sa til kvinnene: Frykt ikke! jeg vet at I søker efter Jesus, den korsfestede; han er ikke her; han er opstanden, som han sa; kom og se stedet hvor han lå!',
    ['hoytid', 'paske'],
  ),
  v(
    'joh-11-25',
    'Joh 11,25',
    'Jesus sa til henne: Jeg er opstandelsen og livet; den som tror på mig, om han enn dør, skal han dog leve.',
    ['hoytid', 'paske'],
  ),
  v(
    '1kor-15-20',
    '1 Kor 15,20',
    'Men nu er Kristus opstanden fra de døde og er blitt førstegrøden av de hensovede.',
    ['hoytid', 'paske'],
  ),
  v(
    'apg-2-4',
    'Apg 2,4',
    'Da blev de alle fylt med den Hellige Ånd, og de begynte å tale med andre tunger, alt efter som Ånden gav dem å tale.',
    ['hoytid', 'pinse'],
  ),
  v(
    'matt-28-19-20',
    'Matt 28,19–20',
    'Gå derfor ut og gjør alle folkeslag til disipler, idet I døper dem til Faderens og Sønnens og den Hellige Ånds navn, og lærer dem å holde alt det jeg har befalt eder. Og se, jeg er med eder alle dager inntil verdens ende!',
    ['hoytid', 'tjeneste'],
  ),
]

export const verseCollections: VerseCollection[] = [
  {
    id: 'trost',
    label: 'Trøst',
    description: 'Vers å holde fast i når livet er tungt — Guds nærvær, fred og hvile.',
    verseIds: [
      'sal-23-1-2',
      'sal-23-4',
      'matt-11-28',
      'jes-41-10',
      'fil-4-6-7',
      'sal-121-1-2',
      'joh-14-27',
      'sal-46-2',
    ],
  },
  {
    id: 'lovsang',
    label: 'Lovsang',
    description: 'Salmenes jubel — vers som lærer oss å prise Gud med hele oss.',
    verseIds: [
      'sal-103-1-2',
      'sal-100-1-2',
      'sal-118-24',
      'sal-150-6',
      'sal-8-2',
      'sal-96-1',
      'fil-4-4',
      'sal-95-1',
    ],
  },
  {
    id: 'frelse',
    label: 'Frelse',
    description: 'Evangeliets kjerne — nåden, troen og veien til Gud.',
    verseIds: [
      'joh-3-16',
      'rom-6-23',
      'ef-2-8',
      'rom-10-9',
      'joh-14-6',
      'joh-1-12',
      '1joh-1-9',
      'apg-4-12',
    ],
  },
  {
    id: 'tjeneste',
    label: 'Tjeneste',
    description: 'Å leve troen ut — kjærlighet til nesten og tjeneste for Gud.',
    verseIds: [
      'matt-5-16',
      'mika-6-8',
      'mark-10-45',
      'gal-6-2',
      'joh-13-34',
      'matt-25-40',
      'kol-3-23',
      '1pet-4-10',
    ],
  },
  {
    id: 'hoytid',
    label: 'Påske og høytid',
    description: 'Kirkeårets store dager — jul, palmesøndag, påske og pinse.',
    verseIds: [
      'luk-2-10-11',
      'jes-9-6',
      'matt-21-9',
      'matt-28-5-6',
      'joh-11-25',
      '1kor-15-20',
      'apg-2-4',
      'matt-28-19-20',
    ],
  },
]
