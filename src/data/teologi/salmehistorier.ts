import type { HymnStory } from '@/types/teologi'

// ── Salmehistorier ─────────────────────────────────────────────────────────────
// One editorial article per WORK (see src/data/songs). Norwegian bokmål,
// 300–600 words each, markdown-lite (blank-line paragraphs, '### ' subheadings).
// Facts are held to what is well established in standard hymnody literature
// (Julian's Dictionary of Hymnology 1892; Skaar's Norsk Salmehistorie 1879–80,
// and the songs' own rights sources); uncertain details are left out or flagged.
//
// Variants (enkel/firstemmig/gospel of the same work) share the work's article:
// HymnStoryLink falls back from the song's slug to its work_slug, so generated
// arrangements never need their own story here.
//
// DECISION — «Amazing Grace (firstemmig)» (slug amazing-grace-firstemmig)
// predates the work/variant model and keeps its own entry: the SAME body
// (AMAZING_GRACE_BODY) with a short arrangement note appended.

const AMAZING_GRACE_BODY = `John Newton visste hva han skrev om da han satte ord på nåde. Han ble født i London i 1725, gikk tidlig til sjøs, og havnet etter hvert i slavehandelen — først som mannskap, siden som kaptein på skip som fraktet slavebundne mennesker over Atlanteren. Det var ikke en from ungdom som skrev «Amazing Grace»; det var en mann som langsomt måtte se tilbake på sitt eget liv med gru.

### Stormen som snudde

Vendepunktet kom natten til 10. mars 1748. Skipet Greyhound ble fanget i en voldsom storm på vei hjem, og Newton, som hadde spottet all tro, ropte for første gang til Gud om nåde. Skipet holdt, og Newton regnet siden den natten som begynnelsen på sin omvendelse. Forandringen kom likevel ikke over natten — han fortsatte en tid i slavehandelen — men gradvis vokste en overbevisning som til slutt gjorde ham til prest i Den engelske kirke og til en åpen motstander av slaveriet han selv hadde levd av.

### En preken som ble en salme

Teksten ble skrevet til nyttårsdag 1773, da Newton var prest i den lille byen Olney. Den fulgte en preken over 1. Krønikebok 17, der kong David undrer seg over at Gud har ført ham så langt. «Amazing grace, how sweet the sound, that saved a wretch like me» — ordet «wretch», en elendig stakkar, er ikke poetisk overdrivelse hos Newton. Det er en selvbeskrivelse.

Salmen ble trykt i Olney Hymns (1779), samlingen Newton ga ut sammen med dikteren William Cowper. Melodien vi synger i dag, NEW BRITAIN, er derimot amerikansk og dukket først opp i notesamlingen Southern Harmony (1835). Tekst og tone fant altså ikke hverandre før lenge etter Newtons død i 1807.

### Hvorfor den lever videre

Få salmer har reist så langt utenfor kirkens vegger som denne. Den handler ikke om den frommes fortjeneste, men om nåden som møter mennesket akkurat der det er — «I once was lost, but now am found, was blind, but now I see». For en menighet er «Amazing Grace» en påminnelse om at ingen fortid er for mørk til å nås av nåden. Newtons gravskrift, som han skrev selv, sier det kort: en gang en vantro og utsvevende mann, en tjener i slavehandelen, ble ved Guds rike nåde bevart, gjenopprettet og benådet.`

const AMAZING_GRACE: HymnStory = {
  songSlug: 'amazing-grace',
  title: 'Amazing Grace — nåden som fant en slavehandler',
  bodyMd: AMAZING_GRACE_BODY,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'John Newton, Olney Hymns (1779)',
    'Southern Harmony (1835)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Newton, Olney Hymns (1779)',
  },
}

const AMAZING_GRACE_FIRSTEMMIG: HymnStory = {
  songSlug: 'amazing-grace-firstemmig',
  title: 'Amazing Grace — nåden som fant en slavehandler',
  bodyMd: `${AMAZING_GRACE_BODY}

### Om denne satsen

Dette er samme salme som «Amazing Grace», men i en fyldigere firstemmig sats. Historien bak teksten og melodien er den samme — se den fullstendige artikkelen over.`,
  sources: AMAZING_GRACE.sources,
  rights: AMAZING_GRACE.rights,
}

const GLADE_JUL: HymnStory = {
  songSlug: 'glade-jul',
  title: 'Glade jul — julenatten i Oberndorf',
  bodyMd: `Ingen salme sier «jul» tydeligere over hele verden enn «Stille Nacht» — hos oss «Glade jul». At den er blitt selve julens melodi, er desto merkeligere når man vet hvor beskjedent den begynte.

### En kveld i Oberndorf, 1818

Scenen er den lille alpelandsbyen Oberndorf ved Salzburg i Østerrike, julaften 1818. Den unge hjelpepresten Joseph Mohr hadde alt året før skrevet en diktstrofe med tittelen «Stille Nacht, heilige Nacht». På selve julaften ba han organisten og læreren Franz Gruber sette tone til ordene, slik at de kunne synges under midnattsmessen. Gruber skrev en enkel, vuggende melodi for to stemmer og gitar, og samme kveld ble salmen fremført for første gang i kirken St. Nikolaus.

At den ble tenkt for gitar og ikke orgel, hører til de gode historiene rundt salmen. Uansett detaljene ble resultatet en sang med en mildhet som passet natten den ble skrevet til.

### Fra dal til verden

Melodien spredte seg langsomt ut av dalen, ført videre av omreisende sangere og orgelbyggere. I løpet av 1800-tallet ble den oversatt til det ene språket etter det andre, og i dag synges den på over hundre språk. Den norske teksten «Glade jul, hellige jul» er en gjendiktning ved presten og salmedikteren Wilhelm Andreas Wexels fra 1800-tallet — ikke en direkte oversettelse, men en fri norsk form som har fått sitt eget liv i våre kirker og hjem.

### Hvorfor den varer

Der mange julesanger fylles av glans og bevegelse, dveler «Glade jul» ved stillheten. Den maner ikke frem juletravelheten, men bildet av barnet i krybben og natten som holder pusten. Nettopp roen har gjort den til en salme som samler — den synges like naturlig i katedralen som ved sengekanten. Historien om at den ble til på en enkelt kveld, med bare en gitar til hjelp, har fulgt salmen som en del av dens sjarm: det største kan begynne i det minste.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Stille Nacht Gesellschaft, Oberndorf',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); Skaar, Norsk Salmehistorie (1879–80)',
  },
}

const JOYFUL_JOYFUL: HymnStory = {
  songSlug: 'joyful-joyful',
  title: 'Joyful, Joyful — Beethovens glede blir salme',
  bodyMd: `«Joyful, Joyful, We Adore Thee» er et av de klareste eksemplene på at kirken og konsertsalen kan låne av hverandre. Melodien er kjent av langt flere enn dem som noen gang har sunget salmen: det er «Hymn to Joy», hentet fra finalen i Ludvig van Beethovens niende symfoni.

### Ode til glede

Beethoven fullførte sin niende symfoni i 1824. I den siste satsen gjorde han noe uhørt for sin tid: han lot et kor synge, over ord fra Friedrich Schillers dikt «An die Freude» — «Ode til gleden». Selv var Beethoven da nesten fullstendig døv. Den brede, oppadstigende melodien som bærer Schillers ord om menneskehetens brorskap, ble en av de mest gjenkjennelige i vestlig musikk.

### Teksten kommer til

Salmeteksten er langt yngre enn melodien. Den ble skrevet av den amerikanske presten og forfatteren Henry van Dyke tidlig på 1900-tallet. Van Dyke skal ha diktet ordene mens han var gjest i fjellene i Massachusetts, med utsikten for øyne, og ønsket seg uttrykkelig at de skulle synges til Beethovens melodi. Slik ble Schillers verdslige lovsang til gleden løftet inn i en kristen ramme: gleden retter seg nå mot Gud som skaper, «Herre over alt som er».

### En lovsang i vid forstand

Teksten er full av naturens vitnesbyrd — blomstene, stjernene, den syngende fuglen — og lar hele skaperverket stemme i med mennesket i tilbedelse. Det gir salmen en romslig, nesten jublende tone som passer melodien den ble skrevet for. I gudstjenesten fungerer den godt som åpningssalme eller ved store fester, der en menighet trenger noe å løfte stemmen med. At tonene opprinnelig sprang ut av en døv komponists tro på gleden som samler menneskene, gir salmen et ekstra lag av mening.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Henry van Dyke, Poems (samlede utgaver)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); alminnelig salmehistorisk litteratur',
  },
}

const KIRKEN_DEN_ER: HymnStory = {
  songSlug: 'kirken-den-er-et-gammelt-hus',
  title: 'Kirken den er et gammelt hus — Grundtvig og Lindeman',
  bodyMd: `«Kirken den er et gammelt hus» er en av de mest folkekjære salmene i den nordiske kirken, og et mønstereksempel på det tette samarbeidet mellom dansk tekst og norsk tone som preget 1800-tallets salmesang.

### Grundtvig og kirkebildet

Teksten er skrevet av dansken Nikolai Frederik Severin Grundtvig, prest, dikter og en av Nordens mest innflytelsesrike kirkelige skikkelser på 1800-tallet. Grundtvig var opptatt av at kirken ikke først og fremst er bygningen av stein, men det levende fellesskapet av troende. Nettopp den tanken bærer salmen: «Kirken den er et gammelt hus, står om enn tårnene falle» — selv om murene forfaller, står kirken, for den er noe mer enn mur og tårn.

Bilde etter bilde fører teksten oss fra det synlige huset til det usynlige: Gud bygger seg ikke bolig i hus av stein, men i menneskenes hjerter. For Grundtvig var dette selve kjernen — kirken er der Ordet lyder og menigheten samles, enten det skjer i en katedral eller i en fattig stue.

### Lindemans tone

Melodien vi synger, er komponert av Ludvig Mathias Lindeman, den store norske organisten og koralsamleren. Lindeman viet livet til å samle inn og bevare norske folketoner og til å skape et solid koralrepertoar for Den norske kirke. Hans melodi til Grundtvigs tekst er enkel og trygg å synge, med en ro som passer ordenes innhold. I Norge er teksten kjent i Magnus Brostrup Landstads form, gjennom Landstads salmebok.

### En salme for hverdag og fest

Salmen brukes gjerne ved kirkevigsler og jubileer, men den hører like godt hjemme i den vanlige gudstjenesten. Den minner menigheten om at det varige ikke er byggverket, men fellesskapet og troen som samles der. For barn har den dessuten et vennlig, konkret bilde å holde fast ved: kirken som et gammelt, trygt hus der man alltid hører hjemme.`,
  sources: [
    'Hans Skaar, Norsk Salmehistorie (1879–80)',
    'Landstads salmebok',
    'Lindemans koralbok (1877)',
  ],
  rights: {
    source: 'Egen tekst; kilder: Skaar, Norsk Salmehistorie (1879–80); Landstads salmebok',
  },
}

const PASKEMORGEN: HymnStory = {
  songSlug: 'paskemorgen',
  title: 'Påskemorgen slukker sorgen — Grundtvigs oppstandelsessalme',
  bodyMd: `«Påskemorgen slukker sorgen» er blant de sterkeste påskesalmene i den nordiske tradisjonen. Den fører oss rett inn i det som er påskens innerste: budskapet om at døden er overvunnet.

### Sorgen som slukkes

Teksten er skrevet av Nikolai Frederik Severin Grundtvig, den danske presten og dikteren som satte et så dypt preg på salmesangen i hele Norden. Allerede første linje slår an hele salmens bevegelse: «Påskemorgen slukker sorgen, slukker sorgen til evig tid.» Det er en salme som ikke stanser ved gravens mørke, men ved lyset som bryter frem på oppstandelsesmorgenen.

Grundtvig lar salmen følge de sørgende kvinnene til graven i påskehagen. De kommer med gråt og salve, men møter en åpen grav og et budskap som snur alt: han er ikke her, han er oppstanden. Sorgen er ikke fornektet — den er tatt på alvor — men den får ikke siste ord. Oppstandelsen slukker den.

### Lindemans melodi

Tonen er komponert av Ludvig Mathias Lindeman, organisten og koralsamleren som formet så mye av den norske kirkesangen på 1800-tallet. Melodien har en lys, oppadstrebende karakter som svarer til tekstens innhold: den løfter menigheten fra klage til jubel. Sammen utgjør Grundtvigs ord og Lindemans tone en salme som mange norske menigheter opplever som selve lyden av påskemorgen.

### Påskens midtpunkt

I gudstjenesten hører salmen naturlig hjemme på påskedag, gjerne som inngang til høymessen når mørket fra langfredag skal vike for oppstandelsens glede. Den lærer noe grunnleggende om kristen tro: håpet står ikke og faller med at alt er lyst her og nå, men hviler på at graven ble funnet tom. For den som bærer på sorg, sier salmen at sorgen ikke er det siste — påskemorgenen har slukket den til evig tid.`,
  sources: ['Hans Skaar, Norsk Salmehistorie (1879–80)', 'Lindemans koralbok (1877)'],
  rights: {
    source: 'Egen tekst; kilder: Skaar, Norsk Salmehistorie (1879–80); Lindemans koralbok (1877)',
  },
}

const WHAT_A_FRIEND: HymnStory = {
  songSlug: 'what-a-friend',
  title: 'What a Friend We Have in Jesus — trøst født av sorg',
  bodyMd: `Bak den milde, fortrøstningsfulle salmen «What a Friend We Have in Jesus» — «Hvilken venn vi har i Jesus» — ligger et liv preget av tap. Den som skrev ordene, Joseph Scriven, kjente selv til sorgen han skrev inn i trøst.

### Et liv merket av tap

Joseph Scriven ble født i Irland i 1819. Ifølge den mest utbredte fortellingen skulle han gifte seg, men kvelden før bryllupet druknet hans forlovede. Knust av sorg forlot han Irland og emigrerte til Canada. Også der ble han rammet: en ny forlovede ble syk og døde før de rakk å gifte seg. Scriven levde resten av livet enkelt og tilbaketrukket i Canada, kjent for å hjelpe fattige og syke uten å be om noe igjen.

### En trøst sendt over havet

Salmens ord ble ikke skrevet for å synges av en menighet. Rundt 1855 skal Scriven ha satt dem på papiret som en trøst til sin egen mor, som var syk i Irland mens han selv var langt borte i Canada. Det var et personlig brev i versform, ikke en salme tenkt for kirken. At en fremmed senere kom over diktet og gjenkjente hvem som hadde skrevet det, skal ha overrasket Scriven selv — han sa gjerne at «Herren og jeg gjorde det sammen».

Nettopp fordi ordene sprang ut av virkelig nød, treffer de. «Alle våre sorger bære, alt til Jesus tar vi frem» — det er ikke en teori om lidelse, men erfaringen til en mann som selv hadde måttet bære tungt.

### Melodien og bruken

Melodien vi synger, ble skrevet av den amerikanske komponisten Charles Crozat Converse noen år senere, og det var i denne formen salmen for alvor bredte seg utover i verden. I dag hører den hjemme både i store gudstjenester og i stille stunder ved sykesengen. Budskapet er enkelt og bærende: vi har en venn i Jesus som vi kan komme til med alt, i bønn. For mange er nettopp denne salmen blitt en følgesvenn i livets tyngste dager — slik den en gang var det for Scrivens syke mor.`,
  sources: [
    'John Julian, A Dictionary of Hymnology (1892)',
    'Alminnelig salmehistorisk overlevering om Joseph Scriven',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Julian, Dictionary of Hymnology (1892); salmehistorisk overlevering',
  },
}

const SWING_LOW: HymnStory = {
  songSlug: 'swing-low',
  title: 'Swing Low, Sweet Chariot — vognen som skal hente hjem',
  bodyMd: `«Swing Low, Sweet Chariot» er en av de mest kjente afroamerikanske spirituals — sangene som ble til blant slavebundne mennesker i det amerikanske Sør. Bak den vuggende, trøstefulle melodien ligger et rikt lag av bibelbilder og en lengsel etter frihet.

### En sang fra slaveriets tid

Spirituals oppsto blant slavebundne afroamerikanere på 1800-tallet, ofte i grenselandet mellom det religiøse og det høyst konkrete. «Swing Low» knyttes tradisjonelt til Wallis Willis, en mann av choctaw-tilknytning som levde i det som i dag er Oklahoma, en tid før borgerkrigen. Bildet i sangen — en vogn som svinger ned fra himmelen for å bære den troende hjem — er hentet rett fra Bibelen: profeten Elia som blir tatt opp til himmelen i en ildvogn (2. Kongebok 2).

For dem som først sang den, hadde «hjem» flere betydninger på én gang: himmelen og hvilen hos Gud, men også, for mange, håpet om frihet nordover, bort fra slaveriet. Slik bærer sangen både en åndelig og en jordisk lengsel i samme bilde.

### Fisk Jubilee Singers

Sangen ble kjent langt utover Sørstatene gjennom Fisk Jubilee Singers, et kor av unge afroamerikanske sangere fra Fisk University i Tennessee. Fra 1870-tallet reiste de rundt og fremførte spirituals for et bredt publikum, og gjennom dem ble sanger som «Swing Low» bevart, skrevet ned og båret ut i verden. Uten dette arbeidet ville mye av denne musikkarven vært tapt.

### En trøstesang som varer

Melodien er rolig og bærende, lett å synge og lett å bli med på. Den taler til alle som lengter etter hvile og hjemkomst, og har derfor beholdt sin plass både i kirkens repertoar og langt utenfor det. Å synge den er også å minnes menneskene den kom fra: en tro som holdt oppe midt i undertrykkelse, og et håp som pekte forbi lidelsen mot en frihet som ikke kunne tas fra dem.`,
  sources: [
    'Jubilee Songs / Fisk Jubilee Singers (1872)',
    'Alminnelig litteratur om afroamerikanske spirituals',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Fisk Jubilee Singers-tradisjonen (1872); alminnelig litteratur om spirituals',
    notes:
      'Opphavet til enkeltdetaljer i spirituals er ofte usikkert; artikkelen holder seg til den mest utbredte overleveringen.',
  },
}

const WHEN_THE_SAINTS: HymnStory = {
  songSlug: 'when-the-saints',
  title: 'When the Saints Go Marching In — fra gravferd til jubel',
  bodyMd: `Få sanger reiser seg fra så alvorlig et opphav til så stor livsglede som «When the Saints Go Marching In». I dag kjenner mange den som en munter jazzmelodi, men røttene ligger i den afroamerikanske kirkesangen og i New Orleans' særegne begravelsestradisjon.

### Et bilde fra Åpenbaringen

Teksten bygger på synet av de hellige som samles hos Gud ved tidens ende — bilder hentet fra Johannes' åpenbaring, der de frelste marsjerer inn i den himmelske staden. «Oh, when the saints go marching in, Lord, how I want to be in that number» — sangeren ber om selv å få være blant dem som går inn. Det er altså en oppstandelses- og håpssang, en bønn om å høre til blant Guds folk når alt en gang skal fullendes.

### Gjennom New Orleans

Sangen vokste frem i det afroamerikanske kirkelivet på slutten av 1800-tallet og begynnelsen av 1900-tallet. I New Orleans fikk den en helt egen plass i byens «jazz funerals»: et gravfølge kunne gå til graven med langsom, sørgmodig musikk, for så — når den døde var lagt til hvile — å vende tilbake med oppløftende, dansende toner. «When the Saints» ble en av de sangene som markerte nettopp dette vendepunktet, fra sorg til feiring av at den døde nå var hos Gud.

Gjennom jazzmusikere i New Orleans, ikke minst Louis Armstrongs berømte innspilling, ble melodien kjent over hele verden og et symbol på byen selv.

### Sorg og glede i samme sang

Nettopp denne dobbeltheten gjør sangen så sterk. Den er født i møtet med døden, men peker forbi den mot oppstandelsens glede. Å synge den er å holde fast ved håpet om at de som er gått bort, ikke er borte for alltid, men er «i that number» — blant de hellige som marsjerer inn til Gud. Derfor kan den både trøste ved en gravferd og løfte taket i en jublende gudstjeneste.`,
  sources: [
    'Alminnelig litteratur om gospel og New Orleans-tradisjonen',
    'Johannes’ åpenbaring (bibelsk bakgrunn)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: alminnelig litteratur om gospel- og New Orleans-tradisjonen',
    notes:
      'Sangens tidligste opphav er ikke sikkert dokumentert; artikkelen bygger på den bredt aksepterte tradisjonen.',
  },
}

const KUMBAYA: HymnStory = {
  songSlug: 'kumbaya',
  title: 'Kum ba yah — «kom hit, Herre»',
  bodyMd: `«Kum ba yah» er blitt sunget rundt utallige leirbål og i utallige barnesamlinger, så mye at mange knapt tenker på den som en salme. Men bønnen som ligger i den, er så enkel og direkte som en bønn kan bli.

### «Come by here»

Selve tittelen regnes vanligvis som en sammentrekning av det engelske «Come by here» — «kom hit». Sangen antas å ha oppstått blant afroamerikanske kristne i det amerikanske Sør, muligens knyttet til gullah-samfunnene langs kysten av South Carolina og Georgia, der en kreolsk engelsk ble talt. Hvert vers er en bønn om Guds nærvær i en konkret situasjon: «Someone's crying, Lord» — «noen gråter, Herre, kom hit»; «someone's praying» — «noen ber». Bønnen er hele tiden den samme: kom hit, vær nær.

### Fra kysten til hele verden

Sangen ble skrevet ned og samlet inn tidlig på 1900-tallet, og bredte seg gjennom det brede folkemusikk- og vekkelsesmiljøet. Fra midten av århundret ble den enormt utbredt i speiderbevegelsen, i søndagsskoler og i kristne ungdomsleirer over hele verden. Nettopp fordi den er så lett å lære — få ord, en rolig melodi, og vers som lar seg fylle med det den enkelte bærer på — ble den en av de mest sungne sangene i sitt slag.

### En bønn alle kan be

At sangen er blitt så folkelig, har noen ganget gjort at den blir tatt lett på. Men innholdet er dypt alvorlig: den ber Gud komme nær nettopp der mennesker gråter, ber og trenger ham. Det gjør den til en fin sang å bruke i bønn med barn og unge, der hvert vers kan settes til ord for det man selv vil be om. Bak den enkle formen ligger troen på at Gud faktisk hører, og at han kommer — «kum ba yah, my Lord, kom hit».`,
  sources: [
    'Alminnelig litteratur om afroamerikansk og gullah-tradisjon',
    'Folkemusikksamlinger fra tidlig 1900-tall',
  ],
  rights: {
    source:
      'Egen tekst; kilder: alminnelig litteratur om afroamerikansk sang- og gullah-tradisjon',
    notes:
      'Sangens presise opphav er omdiskutert; artikkelen gjengir den mest utbredte forståelsen.',
  },
}

const JOY_TO_THE_WORLD: HymnStory = {
  songSlug: 'joy-to-the-world',
  title: 'Joy to the World — julesangen som ikke handler om julenatt',
  bodyMd: `«Joy to the World» er en av verdens mest sungne julesanger — og den nevner verken Betlehem, hyrder eller en krybbe. Teksten er nemlig ikke skrevet som julesang i det hele tatt. Isaac Watts ga den ut i 1719 i samlingen The Psalms of David Imitated, der han gjendiktet Davids salmer i lys av Kristus. «Joy to the World» er hans gjendiktning av siste del av Salme 98: «Rop med jubel for Herren, hele jorden! … for han kommer for å dømme jorden.»

### Dikteren som fornyet menighetssangen

Isaac Watts (1674–1748) regnes som den engelske hymnodiens far. Som ung klaget han over de tunge, ordrette salmeoversettelsene i sin fars menighet — og fikk til svar at han fikk skrive noe bedre selv. Det gjorde han: rundt 600 salmer, deriblant «When I Survey the Wondrous Cross». Watts ville at menigheten skulle synge Skriften med sitt eget språk og sitt eget hjerte, og i «Joy to the World» lot han Salme 98 peke framover mot Kongen som kommer — derfor passer den både til advent, jul og Kristi kongedag.

### Melodien med Händel-klang

Melodien ANTIOCH dukket opp i den amerikanske notesamlingen The Modern Psalmist (1839), redigert av Lowell Mason, med påskriften «from Handel». Åpningen — en ren fallende durskala — minner om vendinger i Händels Messias, og på 1800-tallet ble melodien gjerne tilskrevet ham. Forskningen regner i dag melodien i hovedsak som Masons eget arbeid på hendelsk grunn; nøyaktig hvor mye som er lån og hvor mye som er Mason, er fortsatt omdiskutert. Mason (1792–1872) var uansett rett mann: som kirkemusiker og musikkpedagog i Boston formet han amerikansk menighetssang mer enn noen annen i sin samtid.

### Hvorfor den lever videre

Sangen begynner på den høye tonika og faller trinn for trinn ned en hel oktav — hele skalaen på ett åndedrag, som om gleden ikke kan vente. Teksten svarer med samme bevegelse: himmelens konge kommer NED til jorden, og jorden svarer med sang. At en gjendiktet gammeltestamentlig salme fra 1719 og en amerikansk melodi fra 1839 skulle bli selve julejubelen, var det ingen som planla — men få sanger sier «gled dere!» tydeligere.`,
  sources: [
    'Isaac Watts, The Psalms of David Imitated (1719)',
    'The Modern Psalmist (Lowell Mason, 1839)',
    'John Julian, A Dictionary of Hymnology (1892)',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Watts, The Psalms of David Imitated (1719); The Modern Psalmist (1839); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Melodiens forhold til Händel er omdiskutert; artikkelen gjengir den vanlige forskningsvurderingen.',
  },
}

const NAA_TAKKER_ALLE_GUD: HymnStory = {
  songSlug: 'naa-takker-alle-gud',
  title: 'Nå takker alle Gud — takkesalmen fra pestens by',
  bodyMd: `Få salmer har en mørkere bakgrunn enn denne lyse takkesalmen. Martin Rinkart (1586–1649) var prest i den lille byen Eilenburg i Sachsen gjennom hele trettiårskrigen. Byen var omgitt av murer, og dit strømmet flyktninger — og med dem hungersnød og pest. I det verste året, 1637, var Rinkart til slutt den eneste presten igjen i byen. Han skal ha forrettet i tusenvis av begravelser det året, i perioder titalls om dagen. En av dem han begravde, var hans egen kone.

### En bordbønn til barna

Midt i dette skrev Rinkart «Nun danket alle Gott». Etter gammel tradisjon var den først ment som bordbønn for hans egne barn — en enkel takk før maten, bygd over ordene i Siraks bok 50: «Og nå, takk alle Gud, han som gjør store ting over hele jorden.» De to første strofene er ren takk; den tredje er en lovprisning av Faderen, Sønnen og Ånden. At en mann som sto midt i pest, krig og sorg, lærte barna sine å begynne med takk, er selve salmens preken.

### «Det tyske Te Deum»

Melodien kom fra vennen Johann Crüger (1598–1662), kantor i Berlin, som trykte salmen i sin store samling Praxis pietatis melica (1647). Sammen ble tekst og tone raskt hele det lutherske Tysklands takkesang — den kalles gjerne «det tyske Te Deum». Tradisjonen forteller at den ble sunget ved takkegudstjenestene etter Westfalerfreden i 1648, da krigen endelig var over; siden har den fulgt fredsslutninger, jubileer og høsttakkefester. Til Norden kom den tidlig via danske og norske salmebøker, og «Nå takker alle Gud» står fortsatt der menigheten trenger å samle takken i én sang.

### Hvorfor den lever videre

Salmen later ikke som om livet er lett — Rinkart visste bedre enn de fleste hva mennesker kan miste. Men den holder fast på at takken kommer først, «med hjerte, munn og hender»: hele mennesket, ikke bare ordene. Melodiens rolige, oppadgående åpning bærer nettopp det — en takk som reiser seg.`,
  sources: [
    'Praxis pietatis melica (Johann Crüger, 1647)',
    'John Julian, A Dictionary of Hymnology (1892)',
    'Sirak 50,22–24',
  ],
  rights: {
    source:
      'Egen tekst; kilder: Praxis pietatis melica (1647); Julian, Dictionary of Hymnology (1892)',
    notes:
      'Enkeltheter (bordbønn-tradisjonen, sang ved fredsslutningen 1648) er tradisjonsstoff og markert som det.',
  },
}

/** All hymn stories, keyed by song slug via content.ts lookups. Order is only
 * for listing; lookups go through hymnStoryFor(). */
export const hymnStories: HymnStory[] = [
  AMAZING_GRACE,
  AMAZING_GRACE_FIRSTEMMIG,
  GLADE_JUL,
  JOYFUL_JOYFUL,
  KIRKEN_DEN_ER,
  PASKEMORGEN,
  WHAT_A_FRIEND,
  SWING_LOW,
  WHEN_THE_SAINTS,
  KUMBAYA,
  JOY_TO_THE_WORLD,
  NAA_TAKKER_ALLE_GUD,
]
