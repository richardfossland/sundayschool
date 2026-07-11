import type { ChurchSeason } from '@/types/teologi'

// ── Kirkeåret ──────────────────────────────────────────────────────────────────
// Twelve periods of the church year, in calendar order, with Norwegian
// liturgical colours (name + hex tuned to the app's warm palette), a short
// description, themes and links to fitting seed songs (slugs are validated
// against seedSongs in content.ts's test). General-purpose hymns like
// Amazing Grace / What a Friend appear where they fit thematically.

// Liturgical colour tokens — one hex per colour so the timeline reads uniformly.
const FIOLETT = 'Fiolett (#6B4E9E)'
const HVIT = 'Hvit (#F3EAD9)'
const GRONN = 'Grønn (#3D8B66)'
const ROD = 'Rød (#C7534E)'

export const churchSeasons: ChurchSeason[] = [
  {
    id: 'advent',
    label: 'Advent',
    color: FIOLETT,
    period: 'De fire søndagene før jul',
    description:
      'Kirkeåret begynner med advent — ventetiden før jul. Fiolett er forventningens og forberedelsens farge: menigheten venter på Herren som kommer, både i julens krybbe og ved tidens ende. Adventstiden er preget av lystenning, lengsel og bønn.',
    themes: ['forventning', 'håp', 'forberedelse', 'lys i mørket'],
    songSlugs: ['kumbaya'],
  },
  {
    id: 'jul',
    label: 'Juletiden',
    color: HVIT,
    period: 'Julaften til Kristi åpenbaringsdag',
    description:
      'Julen feirer at Gud ble menneske: barnet i Betlehem er Frelseren. Hvitt er festens og gledens farge og brukes på kirkeårets store Kristus-høytider. Juletiden strekker seg fra julaften og gjennom romjulen.',
    themes: ['inkarnasjonen', 'glede', 'fred', 'Guds gave'],
    songSlugs: ['glade-jul'],
  },
  {
    id: 'apenbaringstiden',
    label: 'Åpenbaringstiden',
    color: GRONN,
    period: 'Fra Kristi åpenbaringsdag til fastetiden',
    description:
      'Åpenbaringstiden følger julen og handler om at Jesus trer frem for verden — vismennene, dåpen i Jordan og de første undrene. Grønt er vekstens farge: troen som har fått sin begynnelse i julen, skal vokse. Selve åpenbaringsdagen feires i hvitt.',
    themes: ['Jesus åpenbares', 'lyset for verden', 'vekst'],
    songSlugs: ['joyful-joyful'],
  },
  {
    id: 'fastetiden',
    label: 'Fastetiden',
    color: FIOLETT,
    period: 'Fra askeonsdag til palmesøndag — 40 dager',
    description:
      'Fastetiden er kirkens tid for ettertanke, bot og forenkling, formet etter Jesu 40 dager i ørkenen. Fiolett er botens farge. Menigheten følger Jesus på veien mot Jerusalem og korset, og øver seg i bønn og barmhjertighet.',
    themes: ['bot', 'ettertanke', 'bønn', 'etterfølgelse'],
    songSlugs: ['what-a-friend', 'amazing-grace'],
  },
  {
    id: 'stille-uke',
    label: 'Palmesøndag og stille uke',
    color: FIOLETT,
    period: 'Uken før påske',
    description:
      'Den stille uke er kirkeårets alvorligste dager: inntoget i Jerusalem på palmesøndag, nattverdens innstiftelse skjærtorsdag og korsfestelsen langfredag. Fargen er fiolett, og på langfredag kles kirken i svart eller strippes helt. Alt peker frem mot påskemorgen.',
    themes: ['Jesu lidelse', 'korset', 'nattverden', 'stillhet'],
    songSlugs: ['what-a-friend'],
  },
  {
    id: 'paske',
    label: 'Påsketiden',
    color: HVIT,
    period: 'Påskedag og de følgende 50 dagene',
    description:
      'Påsken er kirkeårets midtpunkt: Kristus er oppstanden, døden er overvunnet. Hvitt er seierens og gledens farge, og påsketiden varer helt frem til pinse. Hver søndag i kirkeåret er dypest sett en liten påskedag.',
    themes: ['oppstandelsen', 'seier over døden', 'nytt liv', 'glede'],
    songSlugs: ['paskemorgen'],
  },
  {
    id: 'kristi-himmelfart',
    label: 'Kristi himmelfartsdag',
    color: HVIT,
    period: 'Torsdag, 40 dager etter påskedag',
    description:
      'Kristi himmelfartsdag feirer at den oppstandne Kristus ble tatt opp til himmelen og nå sitter ved Faderens høyre hånd. Hvitt markerer Kristus-festen. Dagen peker fremover: disiplene sendes ut i verden, og menigheten venter på Åndens komme.',
    themes: ['Kristus som Herre', 'løftet om Ånden', 'utsendelse'],
    songSlugs: [],
  },
  {
    id: 'pinse',
    label: 'Pinse',
    color: ROD,
    period: 'Femti dager etter påske',
    description:
      'Pinsen feirer at Den Hellige Ånd ble utøst over disiplene, og regnes gjerne som kirkens fødselsdag. Rødt er Åndens og ildens farge. Fra pinse av bæres evangeliet ut til alle folkeslag.',
    themes: ['Den Hellige Ånd', 'kirkens fødsel', 'ild og frimodighet'],
    songSlugs: ['kumbaya'],
  },
  {
    id: 'treenighetstiden',
    label: 'Treenighetstiden',
    color: GRONN,
    period: 'Fra treenighetssøndag til kirkeårets slutt — omtrent halve året',
    description:
      'Treenighetstiden er kirkeårets lange vekstsesong, fra sommeren og gjennom høsten. Grønt er livets og vekstens farge: nå skal alt det kirkeåret har feiret, ned i hverdagen og bære frukt i tro og tjeneste.',
    themes: ['vekst i troen', 'hverdagskristendom', 'kirken', 'tjeneste'],
    songSlugs: ['kirken-den-er-et-gammelt-hus', 'amazing-grace-firstemmig', 'swing-low'],
  },
  {
    id: 'hosttakkefest',
    label: 'Høsttakkefest',
    color: GRONN,
    period: 'En søndag om høsten, ofte i september–oktober',
    description:
      'Høsttakkefesten er dagen for å takke Gud for skaperverket, grøden og alt vi får leve av. Den feires i treenighetstidens grønne farge, gjerne med kirken pyntet med korn, frukt og grønt. Takknemlighet og forvalteransvar hører sammen.',
    themes: ['takknemlighet', 'skaperverket', 'forvalteransvar'],
    songSlugs: ['joyful-joyful'],
  },
  {
    id: 'allehelgen',
    label: 'Allehelgensdag',
    color: HVIT,
    period: 'Første søndag i november',
    description:
      'Allehelgensdag minnes de som er gått foran oss i troen, og alle vi har mistet. Hvitt er håpets farge: sorgen rammes inn av oppstandelseshåpet og fellesskapet med de hellige. Mange søker til kirken denne dagen for å tenne lys.',
    themes: ['minne', 'sorg og håp', 'de helliges samfunn', 'evig liv'],
    songSlugs: ['when-the-saints', 'swing-low'],
  },
  {
    id: 'domssondag',
    label: 'Domssøndag / Kristi kongedag',
    color: GRONN,
    period: 'Siste søndag i kirkeåret, sist i november',
    description:
      'Kirkeåret slutter med domssøndagen, også kalt Kristi kongedag: Kristus skal komme igjen som konge og dommer, og alt skal gjøres nytt. Dagen står i treenighetstidens grønne farge og peker rett inn i adventens forventning — slik biter kirkeåret seg selv i halen.',
    themes: ['Kristi gjenkomst', 'dom og håp', 'fullendelsen'],
    songSlugs: ['when-the-saints'],
  },
]
