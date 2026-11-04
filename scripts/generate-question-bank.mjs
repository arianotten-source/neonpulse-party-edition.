/**
 * Generates question-bank.js for Pim Pam Pet (150 unique questions per category).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../question-bank.js");
const QUESTIONS_PER_CATEGORY = 150;

/** Extra context phrases shared across categories to reach 150 unique prompts. */
const EXTRA_TAIL = [
  "voor een quiz",
  "voor een spelletje avond",
  "die je snel bedenkt",
  "die je moeilijk vindt",
  "die je makkelijk vindt",
  "voor in de auto",
  "voor op een feest",
  "die je online zou opzoeken",
  "die je zonder hulp weet",
  "die je met vrienden deelt",
  "die je op school leert",
  "die je thuis tegenkomt",
  "die je op reis zou noemen",
  "die je in een spel gebruikt",
  "die je nog niet noemde vandaag",
];

const CATEGORIES = [
  { id: "dieren", label: "DIEREN" },
  { id: "eten", label: "ETEN & DRINKEN" },
  { id: "beroepen", label: "BEROEPEN" },
  { id: "plaatsen", label: "LANDEN & PLAATSEN" },
  { id: "film", label: "FILM, SERIES & MUZIEK" },
  { id: "gek", label: "GEKKE OPDRACHTEN" },
  { id: "sport", label: "SPORT" },
  { id: "voorwerpen", label: "VOORWERPEN & MERKEN" },
  { id: "gezondheid", label: "GEZONDHEID & APOTHEEK" },
  { id: "natuur", label: "NATUUR & MILIEU" },
  { id: "kleding", label: "KLEDING & ACCESSOIRES" },
  { id: "transport", label: "VERVOER & VOERTUIGEN" },
  { id: "talen", label: "TALEN & WOORDEN" },
  { id: "bekend", label: "BEKENDE PERSONEN" },
  { id: "gaming", label: "GAMES & GAMING" },
  { id: "social", label: "APPS & SOCIALE MEDIA" },
  { id: "tech", label: "TECHNOLOGIE & AI" },
  { id: "merken", label: "MERKEN & WINKELS" },
  { id: "trends", label: "TRENDS & DAGELIJKS LEVEN" },
  { id: "thuis", label: "THUIS & HUISHOUDEN" },
  { id: "school", label: "SCHOOL & LEREN" },
  { id: "horeca", label: "HORECA & ETEN KOPEN" },
];

const VALID_IDS = new Set(CATEGORIES.map((c) => c.id));

function letterTemplates(categoryId, specs) {
  const out = [];
  let n = 0;
  for (const spec of specs) {
    const variants = spec.variants || [spec.base];
    for (const v of variants) {
      for (const extra of [...(spec.extras || [""]), ...EXTRA_TAIL]) {
        const q = extra ? `${v} ${extra}`.replace(/\s+/g, " ").trim() : v;
        if (!q.includes("{L}") && categoryId !== "gek") continue;
        n++;
        out.push({
          id: `${categoryId}_${String(n).padStart(3, "0")}`,
          categoryId,
          question: q.endsWith(".") ? q : q + ".",
          usesLetter: q.includes("{L}"),
          active: true,
        });
        if (out.length >= QUESTIONS_PER_CATEGORY) return out;
      }
    }
  }
  return out;
}

const SPECS = {
  dieren: [
    {
      base: "Noem een dier met de letter {L}",
      variants: [
        "Noem een dier met de letter {L}",
        "Noem een huisdier met de letter {L}",
        "Noem een boerderijdier met de letter {L}",
        "Noem een zeedier met de letter {L}",
        "Noem een vogel met de letter {L}",
        "Noem een insect met de letter {L}",
        "Noem een reptiel met de letter {L}",
        "Noem een nachtdier met de letter {L}",
      ],
      extras: ["dat je in Nederland kunt zien", "uit een dierentuin", "uit een tekenfilm", "dat je als huisdier zou willen", "dat in het water leeft", "dat vliegt", "dat op de boerderij leeft", "uit Afrika", "uit Azië", "dat je op vakantie zag", "dat je in een boek las", "dat je nog nooit gegeten hebt", "dat je grappig vindt", "dat je bang voor bent", "dat je zacht vindt", ""],
    },
  ],
  eten: [
    {
      base: "Noem iets eetbaars met de letter {L}",
      variants: [
        "Noem iets eetbaars met de letter {L}",
        "Noem fruit met de letter {L}",
        "Noem een groente met de letter {L}",
        "Noem een snack met de letter {L}",
        "Noem een drankje met de letter {L}",
        "Noem een ontbijtgerecht met de letter {L}",
        "Noem een toetje met de letter {L}",
        "Noem een kruid of specerij met de letter {L}",
      ],
      extras: ["voor op brood", "voor bij de lunch", "voor bij het avondeten", "dat je koud eet", "dat je warm eet", "uit Italië", "uit Azië", "dat kinderen lekker vinden", "dat je op een feestje krijgt", "dat je zelf kunt bakken", "dat je in de supermarkt koopt", "dat je op vakantie proefde", "dat je niet lekker vindt", "dat gezond is", "dat zoet is", ""],
    },
  ],
  beroepen: [
    {
      variants: [
        "Noem een beroep met de letter {L}",
        "Noem een technisch beroep met de letter {L}",
        "Noem een creatief beroep met de letter {L}",
        "Noem een beroep in de zorg met de letter {L}",
        "Noem een beroep in de horeca met de letter {L}",
        "Noem een kantoorberoep met de letter {L}",
        "Noem een beroep buiten met de letter {L}",
        "Noem een beroep met computers met de letter {L}",
      ],
      extras: ["waarbij je met mensen werkt", "waarbij je veel reist", "waarbij je een uniform draagt", "dat je als kind wilde worden", "dat je op tv ziet", "dat goed verdient", "dat je met je handen doet", "in een ziekenhuis", "in een school", "in de bouw", "in de politiek", "in de sport", "in de kunst", "in de wetenschap", ""],
    },
  ],
  plaatsen: [
    {
      variants: [
        "Noem een land met de letter {L}",
        "Noem een stad met de letter {L}",
        "Noem een hoofdstad met de letter {L}",
        "Noem een eiland met de letter {L}",
        "Noem een rivier met de letter {L}",
        "Noem een berg met de letter {L}",
        "Noem een continent met de letter {L}",
        "Noem een vakantiebestemming met de letter {L}",
      ],
      extras: ["in Europa", "buiten Europa", "waar het warm is", "waar het koud is", "aan zee", "in de bergen", "die je wilt bezoeken", "waar je al geweest bent", "met veel inwoners", "met weinig inwoners", "in Nederland", "in België", "in Duitsland", "in Frankrijk", ""],
    },
  ],
  film: [
    {
      variants: [
        "Noem een film met de letter {L}",
        "Noem een tv-serie met de letter {L}",
        "Noem een zanger of zangeres met de letter {L}",
        "Noem een band met de letter {L}",
        "Noem een acteur met de letter {L}",
        "Noem een fictief personage met de letter {L}",
        "Noem een animatiefiguur met de letter {L}",
        "Noem een musical met de letter {L}",
      ],
      extras: ["die je op Netflix zag", "die je in de bioscoop zag", "voor kinderen", "die grappig is", "die eng is", "met superhelden", "uit de jaren 90", "uit Nederland", "die je recent zag", "die je nog eens wilt zien", "met muziek", "die je met vrienden keek", "die je op school besprak", "die een prijs won", ""],
    },
  ],
  sport: [
    {
      variants: [
        "Noem een sport met de letter {L}",
        "Noem een sporter met de letter {L}",
        "Noem een sportclub met de letter {L}",
        "Noem sportmateriaal met de letter {L}",
        "Noem een olympische sport met de letter {L}",
        "Noem een teamsport met de letter {L}",
        "Noem een watersport met de letter {L}",
        "Noem een wintersport met de letter {L}",
      ],
      extras: ["binnen", "buiten", "met een bal", "zonder bal", "die je op tv volgt", "die je zelf ooit deed", "op school", "in de gym", "professioneel", "recreatief", "in Nederland populair", "op de Spelen", "met racket", "met doel", ""],
    },
  ],
  voorwerpen: [
    {
      variants: [
        "Noem een voorwerp met de letter {L}",
        "Noem iets in huis met de letter {L}",
        "Noem een merk met de letter {L}",
        "Noem gereedschap met de letter {L}",
        "Noem een huishoudelijk apparaat met de letter {L}",
        "Noem iets in je tas met de letter {L}",
        "Noem iets op je bureau met de letter {L}",
        "Noem iets dat je dagelijks gebruikt met de letter {L}",
      ],
      extras: ["in de keuken", "in de slaapkamer", "in de garage", "dat elektrisch is", "dat handmatig is", "dat je cadeau kreeg", "dat je mist als het kapot is", "dat duur is", "dat goedkoop is", "van plastic", "van hout", "van metaal", "dat je op school gebruikt", "dat je op reis meeneemt", ""],
    },
  ],
  gezondheid: [
    {
      variants: [
        "Noem een lichaamsdeel met de letter {L}",
        "Noem iets uit de drogist met de letter {L}",
        "Noem een hulpmiddel voor gezondheid met de letter {L}",
        "Noem iets voor eerste hulp met de letter {L}",
        "Noem een gezond gewoonte met de letter {L}",
        "Noem een gezond ingrediënt met de letter {L}",
        "Noem iets voor ontspanning met de letter {L}",
        "Noem een sport voor conditie met de letter {L}",
      ],
      extras: ["voor je huid", "voor je tanden", "voor je ogen", "voor je spieren", "voor je slaap", "voor je hart", "dat je thuis gebruikt", "dat je meeneemt op reis", "dat je dagelijks doet", "dat je op school leert", "dat je arts zou aanraden", "dat je in de spiegel ziet", "dat je voelt", "dat je ruikt", ""],
    },
  ],
  natuur: [
    {
      variants: [
        "Noem een boom met de letter {L}",
        "Noem een bloem met de letter {L}",
        "Noem een plant met de letter {L}",
        "Noem een landschap met de letter {L}",
        "Noem een weersverschijnsel met de letter {L}",
        "Noem een dier in de natuur met de letter {L}",
        "Noem iets uit het bos met de letter {L}",
        "Noem iets aan de kust met de letter {L}",
      ],
      extras: ["in Nederland", "in de tuin", "in het park", "in de lente", "in de herfst", "dat je fotografeert", "dat je beschermen moet", "dat je mooi vindt", "dat gevaarlijk kan zijn", "dat je ruikt", "dat je hoort", "dat je op wandeling ziet", "dat groen is", "dat kleur heeft", ""],
    },
  ],
  kleding: [
    {
      variants: [
        "Noem een kledingstuk met de letter {L}",
        "Noem een soort schoen met de letter {L}",
        "Noem een hoofddeksel met de letter {L}",
        "Noem een accessoire met de letter {L}",
        "Noem een stof met de letter {L}",
        "Noem een kledingmerk met de letter {L}",
        "Noem iets voor de winter met de letter {L}",
        "Noem iets voor de zomer met de letter {L}",
      ],
      extras: ["voor sport", "voor feest", "voor school", "voor werk", "dat je nu draagt", "dat je op vakantie draagt", "dat warm is", "dat koel is", "van katoen", "van leer", "in je kast hangt", "dat je recent kocht", "dat je uit de mode vindt", "dat je cadeau kreeg", ""],
    },
  ],
  transport: [
    {
      variants: [
        "Noem een vervoermiddel met de letter {L}",
        "Noem een automerk met de letter {L}",
        "Noem een type auto met de letter {L}",
        "Noem een voertuig op het water met de letter {L}",
        "Noem een voertuig in de lucht met de letter {L}",
        "Noem een onderdeel van een fiets met de letter {L}",
        "Noem iets op het spoor met de letter {L}",
        "Noem een elektrisch voertuig met de letter {L}",
      ],
      extras: ["openbaar", "privé", "snel", "langzaam", "duur", "goedkoop", "voor vakantie", "voor woon-werk", "dat je zelf bestuurt", "dat je als kind mooi vond", "dat lawaai maakt", "dat stil is", "in de stad", "op het platteland", ""],
    },
  ],
  talen: [
    {
      variants: [
        "Noem een taal met de letter {L}",
        "Noem een woord met de letter {L}",
        "Noem een afkorting met de letter {L}",
        "Noem een internetwoord met de letter {L}",
        "Noem een spreekwoord met de letter {L}",
        "Noem een woord uit een andere taal met de letter {L}",
        "Noem iets uit een woordenboek met de letter {L}",
        "Noem een schoolwoord met de letter {L}",
      ],
      extras: ["dat je op school leert", "dat je online ziet", "dat je uitspreekt", "dat je moeilijk vindt", "dat je makkelijk vindt", "in het Engels", "in het Duits", "in het Frans", "dat je typt", "dat je zingt", "dat je in een boek las", "dat je op vakantie hoorde", "dat je tegen je ouders zegt", "dat je tegen vrienden zegt", ""],
    },
  ],
  bekend: [
    {
      variants: [
        "Noem een bekende persoon met de letter {L}",
        "Noem een historische figuur met de letter {L}",
        "Noem een Nederlandse bekende met de letter {L}",
        "Noem een schrijver met de letter {L}",
        "Noem een wetenschapper met de letter {L}",
        "Noem een politicus met de letter {L}",
        "Noem een presentator met de letter {L}",
        "Noem een atleet met de letter {L}",
      ],
      extras: ["uit muziek", "uit film", "uit sport", "uit politiek", "uit de geschiedenis", "die je op tv ziet", "die je online volgt", "die je bewondert", "die je grappig vindt", "die jong is", "die oud is", "uit België", "uit Nederland", "die je op school leerde", ""],
    },
  ],
  gaming: [
    {
      variants: [
        "Noem een videogame met de letter {L}",
        "Noem een gamepersonage met de letter {L}",
        "Noem een gameconsole met de letter {L}",
        "Noem een gamingterm met de letter {L}",
        "Noem een gamegenre met de letter {L}",
        "Noem een voorwerp uit een game met de letter {L}",
        "Noem een multiplayer-game met de letter {L}",
        "Noem een mobiele game met de letter {L}",
      ],
      extras: ["die je online speelt", "die je offline speelt", "met vrienden", "alleen", "eng", "grappig", "sport", "avontuur", "retro", "nieuw", "gratis", "betaald", "op console", "op pc", ""],
    },
  ],
  social: [
    {
      variants: [
        "Noem een app met de letter {L}",
        "Noem een sociaal medium met de letter {L}",
        "Noem iets dat je online post met de letter {L}",
        "Noem een internetterm met de letter {L}",
        "Noem iets dat je met je telefoon doet met de letter {L}",
        "Noem een soort online video met de letter {L}",
        "Noem een emoji-thema met de letter {L}",
        "Noem een online trend met de letter {L}",
      ],
      extras: ["voor foto's", "voor chat", "voor muziek", "voor games", "voor nieuws", "voor leren", "voor shoppen", "die je dagelijks opent", "die je soms gebruikt", "die je niet gebruikt", "voor vrienden", "voor familie", "voor werk", "voor school", ""],
    },
  ],
  tech: [
    {
      variants: [
        "Noem een technisch apparaat met de letter {L}",
        "Noem een computeronderdeel met de letter {L}",
        "Noem een AI-term met de letter {L}",
        "Noem iets dat draadloos werkt met de letter {L}",
        "Noem een programmeertaal met de letter {L}",
        "Noem iets uit een smart home met de letter {L}",
        "Noem een gadget met de letter {L}",
        "Noem iets met een scherm met de letter {L}",
      ],
      extras: ["in huis", "op kantoor", "op school", "voor gamen", "voor muziek", "voor foto's", "voor video", "dat je oplaadt", "dat nieuw is", "dat oud is", "dat duur is", "dat goedkoop is", "dat je wilt hebben", "dat je al hebt", ""],
    },
  ],
  merken: [
    {
      variants: [
        "Noem een winkel met de letter {L}",
        "Noem een kledingmerk met de letter {L}",
        "Noem een elektronicamerk met de letter {L}",
        "Noem een automerk met de letter {L}",
        "Noem een voedselmerk met de letter {L}",
        "Noem een bouwmarkt met de letter {L}",
        "Noem een supermarkt met de letter {L}",
        "Noem een online winkel met de letter {L}",
      ],
      extras: ["in Nederland", "internationaal", "duur", "betaalbaar", "voor jongeren", "voor gezinnen", "die je vaak ziet", "die je online kent", "in het winkelcentrum", "in de stad", "voor sport", "voor tech", "voor eten", "voor kleding", ""],
    },
  ],
  trends: [
    {
      variants: [
        "Noem iets populairs met de letter {L}",
        "Noem een hobby met de letter {L}",
        "Noem iets voor een festival met de letter {L}",
        "Noem iets voor vakantie met de letter {L}",
        "Noem iets voor op een date met de letter {L}",
        "Noem iets dat je cadeau krijgt met de letter {L}",
        "Noem iets uit social media met de letter {L}",
        "Noem iets uit je dagelijks leven met de letter {L}",
      ],
      extras: ["bij jongeren", "bij volwassenen", "in de zomer", "in de winter", "online", "offline", "duur", "goedkoop", "gezond", "grappig", "sportief", "creatief", "in Nederland", "wereldwijd", ""],
    },
  ],
  thuis: [
    {
      variants: [
        "Noem iets in de keuken met de letter {L}",
        "Noem een meubel met de letter {L}",
        "Noem een schoonmaakmiddel met de letter {L}",
        "Noem iets in de badkamer met de letter {L}",
        "Noem iets voor in de tuin met de letter {L}",
        "Noem iets in de woonkamer met de letter {L}",
        "Noem iets in de slaapkamer met de letter {L}",
        "Noem iets in de gang met de letter {L}",
      ],
      extras: ["dat je dagelijks gebruikt", "dat je af en toe gebruikt", "dat kapot kan", "dat nieuw is", "dat oud is", "dat je mist", "dat je cadeau kreeg", "dat je zelf kocht", "voor gasten", "voor jezelf", "voor kinderen", "voor huisdieren", "dat stof maakt", "dat schoon moet", ""],
    },
  ],
  school: [
    {
      variants: [
        "Noem een schoolvak met de letter {L}",
        "Noem iets in je etui met de letter {L}",
        "Noem een boekgenre met de letter {L}",
        "Noem iets in de bibliotheek met de letter {L}",
        "Noem een studie met de letter {L}",
        "Noem iets voor een toets met de letter {L}",
        "Noem iets op het bord met de letter {L}",
        "Noem iets in de gymzaal met de letter {L}",
      ],
      extras: ["op de basisschool", "op de middelbare school", "op de mbo", "op de hbo", "dat je leuk vindt", "dat je moeilijk vindt", "dat je nodig hebt", "dat je vergeet", "voor wiskunde", "voor taal", "voor kunst", "voor sport", "voor groepswerk", "voor huiswerk", ""],
    },
  ],
  horeca: [
    {
      variants: [
        "Noem iets van de bakker met de letter {L}",
        "Noem iets van de slager met de letter {L}",
        "Noem iets uit een restaurant met de letter {L}",
        "Noem een gerecht uit het buitenland met de letter {L}",
        "Noem een saus met de letter {L}",
        "Noem iets van de snackbar met de letter {L}",
        "Noem iets uit een café met de letter {L}",
        "Noem iets uit de supermarkt met de letter {L}",
      ],
      extras: ["zoet", "hartig", "warm", "koud", "voor lunch", "voor diner", "voor ontbijt", "voor onderweg", "vegetarisch", "vlees", "vis", "dat je deelt", "dat je alleen eet", "dat je op vakantie proefde", ""],
    },
  ],
};

const GEK_NO_LETTER = [
  "Doe alsof je een pinguïn bent die te laat is voor school.",
  "Verzin een superheld die alleen pasta kan eten.",
  "Laat zien hoe een robot danst op een feestje.",
  "Vertel een smoes waarom je schoenen nat zijn.",
  "Doe alsof je een nieuwslezer bent over een UFO in de tuin.",
  "Verzin een regel voor een spel dat niemand snapt.",
  "Doe alsof je een kat bent die een vergadering leidt.",
  "Vertel wat je op een onbewoond eiland mist aan huis.",
  "Doe alsof je telefoon een persoon is die boos is.",
  "Verzin een grappige slogan voor water.",
  "Laat zien hoe je stiekem koekjes steelt.",
  "Doe alsof je een weerman bent die alleen zon voorspelt.",
  "Vertel waarom je broer of zus een dinosaur is.",
  "Verzin een handdruk met drie stappen.",
  "Doe alsof je een lift bent die praat.",
  "Vertel wat je in een koelkast nooit zou verwachten.",
  "Doe alsof je een docent bent die alleen rijm gebruikt.",
  "Verzin een reden waarom sokken altijd verdwijnen.",
  "Laat zien hoe een zombie ontbijt maakt.",
  "Doe alsof je een game-show presentator bent.",
  "Vertel een geheim dat iedereen al weet.",
  "Verzin een nieuw feest voor regenachtige dagen.",
  "Doe alsof je een kussen bent dat klachten heeft.",
  "Laat zien hoe je stiekem lacht in de bibliotheek.",
  "Vertel wat je zou doen als zwaartekracht wegvalt.",
];

function buildGek() {
  const letterPart = letterTemplates("gek", SPECS.gek || [
    {
      variants: [
        "Noem iets grappigs met de letter {L}",
        "Verzin een gekke uitvinding met de letter {L}",
        "Noem een smoes met de letter {L}",
        "Noem iets op een feestje met de letter {L}",
        "Noem iets uit een tekenfilm met de letter {L}",
        "Noem een grappig geluid met de letter {L}",
        "Noem iets uit een mop met de letter {L}",
        "Noem een rare combinatie met de letter {L}",
      ],
      extras: ["voor kinderen", "voor volwassenen", "op school", "thuis", "op vakantie", "in de klas", "met vrienden", "met familie", "online", "offline", "in Nederland", "overal", "in de media", "in een boek", ""],
    },
  ]);
  const noLetter = GEK_NO_LETTER.map((question, i) => ({
    id: `gek_nl_${String(i + 1).padStart(3, "0")}`,
    categoryId: "gek",
    question: question.endsWith(".") ? question : question + ".",
    usesLetter: false,
    active: true,
  }));
  const combined = [...letterPart];
  for (const q of noLetter) {
    if (combined.length >= QUESTIONS_PER_CATEGORY) break;
    combined.push(q);
  }
  return combined.slice(0, QUESTIONS_PER_CATEGORY);
}

SPECS.gek = [
  {
    variants: [
      "Noem iets grappigs met de letter {L}",
      "Verzin een gekke uitvinding met de letter {L}",
      "Noem een smoes met de letter {L}",
      "Noem iets op een feestje met de letter {L}",
      "Noem iets uit een tekenfilm met de letter {L}",
      "Noem een grappig geluid met de letter {L}",
      "Noem iets uit een mop met de letter {L}",
      "Noem een rare combinatie met de letter {L}",
    ],
    extras: ["voor kinderen", "voor volwassenen", "op school", "thuis", "op vakantie", "in de klas", "met vrienden", "met familie", "online", "offline", "in Nederland", "overal", "in de media", "in een boek", ""],
  },
];

const bank = [];
const seenText = new Set();
const seenId = new Set();

for (const cat of CATEGORIES) {
  let items =
    cat.id === "gek"
      ? buildGek()
      : letterTemplates(cat.id, SPECS[cat.id] || []);
  if (items.length < QUESTIONS_PER_CATEGORY) {
    throw new Error(`Category ${cat.id} only ${items.length} questions (need ${QUESTIONS_PER_CATEGORY})`);
  }
  for (const q of items) {
    if (!VALID_IDS.has(q.categoryId)) throw new Error("bad categoryId " + q.categoryId);
    if (seenId.has(q.id)) throw new Error("dup id " + q.id);
    const norm = q.categoryId + "\u001f" + q.question.toLowerCase().trim();
    if (seenText.has(norm)) throw new Error("dup text in bank: " + q.id);
    seenId.add(q.id);
    seenText.add(norm);
    bank.push(q);
  }
}

const counts = {};
for (const q of bank) counts[q.categoryId] = (counts[q.categoryId] || 0) + 1;

const body = `/* Auto-generated — run: node scripts/generate-question-bank.mjs */
var CATEGORY_CATALOG=${JSON.stringify(CATEGORIES)};
var QUESTION_BANK=${JSON.stringify(bank)};
`;

fs.writeFileSync(OUT, body);
console.log("Wrote", OUT, "total", bank.length);
for (const c of CATEGORIES) console.log(" ", c.id, counts[c.id]);
