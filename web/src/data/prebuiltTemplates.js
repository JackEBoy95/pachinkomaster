import { FLAGS } from '../flagData/flagData.js'

const COLORS = [
  '#FF4FA3','#F5C842','#00E5FF','#39FF14','#BF5FFF','#FF6B00',
  '#FF3860','#23D160','#3273DC','#FF7043','#AB47BC','#26C6DA',
  '#EC407A','#66BB6A','#42A5F5','#FFA726','#7E57C2','#26A69A',
]

function colorFor(i) { return COLORS[i % COLORS.length] }

// Build players from flag entries (name + cflag skin)
function buildFlagPlayers(flags) {
  return flags.map((f, i) => ({
    id: 1000 + i, name: f.name, color: colorFor(i), score: 0,
    ballSkin: `cflag:${f.code}`,
  }))
}

// Build players from plain name list (solid colour balls)
function buildNamePlayers(names, startId = 2000) {
  return names.map((name, i) => ({
    id: startId + i, name, color: colorFor(i), score: 0, ballSkin: '',
  }))
}

// Build players from { name, flagCode } list
function buildFlaggedNamePlayers(entries, startId = 3000) {
  return entries.map(({ name, flagCode }, i) => ({
    id: startId + i, name, color: colorFor(i), score: 0,
    ballSkin: flagCode ? `cflag:${flagCode}` : '',
  }))
}

// ── Sovereign nations (~195) ──────────────────────────────────────────────────
const SOVEREIGN_CODES = new Set([
  'af','al','dz','ad','ao','ag','ar','am','au','at','az',
  'bs','bh','bd','bb','by','be','bz','bj','bt','bo','ba','bw','br','bn','bg','bf','bi',
  'cv','kh','cm','ca','cf','td','cl','cn','co','km','cd','cg','cr','ci','hr','cu','cy','cz',
  'dk','dj','dm','do',
  'ec','eg','sv','gq','er','ee','sz','et',
  'fj','fi','fr',
  'ga','gm','ge','de','gh','gr','gd','gt','gn','gw','gy',
  'ht','hn','hu',
  'is','in','id','ir','iq','ie','il','it',
  'jm','jp','jo',
  'kz','ke','ki','kp','kr','kw','kg',
  'la','lv','lb','ls','lr','ly','li','lt','lu',
  'mg','mw','my','mv','ml','mt','mh','mr','mu','mx','fm','md','mc','mn','me','ma','mz','mm',
  'na','nr','np','nl','nz','ni','ne','ng','mk','no',
  'om',
  'pk','pw','pa','pg','py','pe','ph','pl','pt',
  'qa',
  'ro','ru','rw',
  'kn','lc','vc','ws','sm','st','sa','sn','rs','sc','sl','sg','sk','si','sb','so','za','ss',
  'es','lk','sd','sr','se','ch','sy',
  'tj','tz','th','tl','tg','to','tt','tn','tr','tm','tv',
  'ug','ua','ae','gb','us','uy','uz',
  'vu','ve','vn',
  'ye','zm','zw',
  'va','ps','xk',
])

const DEFAULT_PRIZES = [
  { id: 1, label: '🥇 1st Place', points: 100, color: '#F5C842' },
  { id: 2, label: '🥈 2nd Place', points: 75,  color: '#C0C0C0' },
  { id: 3, label: '🥉 3rd Place', points: 50,  color: '#CD7F32' },
  { id: 4, label: '4th Place',    points: 25,  color: '#00E5FF' },
  { id: 5, label: '5th Place',    points: 10,  color: '#BF5FFF' },
]

const DEFAULT_SETTINGS = { ballSize: 12, pegDensity: 8, bounciness: 0.5, ballCount: 1 }

// ── World Countries ───────────────────────────────────────────────────────────
export const WORLD_COUNTRIES_TEMPLATE = {
  id: 'prebuilt_world_countries', name: '🌍 World Countries', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildFlagPlayers(FLAGS.filter(f => SOVEREIGN_CODES.has(f.code))),
  settings: DEFAULT_SETTINGS,
}

// ── Premier League 2024/25 ────────────────────────────────────────────────────
export const PREMIER_LEAGUE_TEMPLATE = {
  id: 'prebuilt_premier_league', name: '⚽ Premier League', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
    'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
    'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham Hotspur',
    'West Ham United', 'Wolverhampton Wanderers',
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── NFL Teams ─────────────────────────────────────────────────────────────────
export const NFL_TEMPLATE = {
  id: 'prebuilt_nfl', name: '🏈 NFL Teams', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders',
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── F1 Drivers 2025 ───────────────────────────────────────────────────────────
export const F1_TEMPLATE = {
  id: 'prebuilt_f1', name: '🏎️ F1 Drivers 2025', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildFlaggedNamePlayers([
    { name: 'Max Verstappen',        flagCode: 'nl' },
    { name: 'Liam Lawson',           flagCode: 'nz' },
    { name: 'Lewis Hamilton',        flagCode: 'gb' },
    { name: 'Charles Leclerc',       flagCode: 'mc' },
    { name: 'George Russell',        flagCode: 'gb' },
    { name: 'Kimi Antonelli',        flagCode: 'it' },
    { name: 'Lando Norris',          flagCode: 'gb' },
    { name: 'Oscar Piastri',         flagCode: 'au' },
    { name: 'Fernando Alonso',       flagCode: 'es' },
    { name: 'Lance Stroll',          flagCode: 'ca' },
    { name: 'Pierre Gasly',          flagCode: 'fr' },
    { name: 'Jack Doohan',           flagCode: 'au' },
    { name: 'Nico Hülkenberg',       flagCode: 'de' },
    { name: 'Gabriel Bortoleto',     flagCode: 'br' },
    { name: 'Isack Hadjar',          flagCode: 'fr' },
    { name: 'Yuki Tsunoda',          flagCode: 'jp' },
    { name: 'Oliver Bearman',        flagCode: 'gb' },
    { name: 'Esteban Ocon',          flagCode: 'fr' },
    { name: 'Carlos Sainz',          flagCode: 'es' },
    { name: 'Alexander Albon',       flagCode: 'th' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Marvel & Disney Films ─────────────────────────────────────────────────────
export const MARVEL_DISNEY_TEMPLATE = {
  id: 'prebuilt_marvel_disney', name: '🎬 Marvel & Disney Films', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    // Marvel
    'Iron Man', 'The Avengers', 'Guardians of the Galaxy', 'Captain America: Civil War',
    'Thor: Ragnarok', 'Black Panther', 'Avengers: Infinity War', 'Avengers: Endgame',
    'Spider-Man: No Way Home', 'Doctor Strange', 'Black Widow', 'Captain Marvel',
    'Ant-Man', 'Shang-Chi', 'Eternals', 'Thor: Love and Thunder',
    // Disney Animated
    'The Lion King', 'Frozen', 'Moana', 'Encanto', 'Ratatouille',
    'Up', 'Finding Nemo', 'The Incredibles', 'Coco', 'Toy Story',
    'Tangled', 'Brave', 'Zootopia', 'Big Hero 6', 'Luca',
    'Soul', 'Turning Red', 'Wreck-It Ralph', 'Aladdin', 'Beauty and the Beast',
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Fast Food Chains ──────────────────────────────────────────────────────────
export const FAST_FOOD_TEMPLATE = {
  id: 'prebuilt_fast_food', name: '🍔 Fast Food Chains', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    "McDonald's", 'Burger King', 'KFC', 'Subway', 'Pizza Hut',
    "Domino's", "Wendy's", 'Taco Bell', 'Chipotle', 'Five Guys',
    "Nando's", 'Shake Shack', 'In-N-Out Burger', 'Popeyes', 'Chick-fil-A',
    "Papa John's", 'Tim Hortons', 'Starbucks', "Dunkin'", 'Greggs',
    'Pret A Manger', 'Wagamama', 'Pizza Express', 'Leon', "Arby's",
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Baby Names ────────────────────────────────────────────────────────────────
export const BABY_NAMES_TEMPLATE = {
  id: 'prebuilt_baby_names', name: '👶 Baby Names', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    // Boys
    'Oliver', 'Noah', 'Liam', 'William', 'Elijah', 'James', 'Aiden', 'Lucas',
    'Mason', 'Ethan', 'Logan', 'Sebastian', 'Mateo', 'Henry', 'Owen',
    'Carter', 'Wyatt', 'Leo', 'Jack', 'Benjamin', 'Isaac', 'Alexander',
    'Michael', 'Dylan', 'Charlie', 'Daniel', 'Theodore', 'Finn', 'Archie', 'Freddie',
    // Girls
    'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Ava', 'Sophia', 'Isabella',
    'Mia', 'Evelyn', 'Harper', 'Luna', 'Camila', 'Ella', 'Elizabeth',
    'Eleanor', 'Sofia', 'Scarlett', 'Emily', 'Chloe', 'Penelope',
    'Riley', 'Zoey', 'Nora', 'Lily', 'Grace', 'Isla', 'Freya', 'Rosie', 'Poppy', 'Daisy',
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Holiday Destinations ──────────────────────────────────────────────────────
export const HOLIDAYS_TEMPLATE = {
  id: 'prebuilt_holidays', name: '✈️ Holiday Destinations', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildFlaggedNamePlayers([
    { name: 'Paris',            flagCode: 'fr' },
    { name: 'Tokyo',            flagCode: 'jp' },
    { name: 'New York',         flagCode: 'us' },
    { name: 'Bali',             flagCode: 'id' },
    { name: 'Sydney',           flagCode: 'au' },
    { name: 'Dubai',            flagCode: 'ae' },
    { name: 'London',           flagCode: 'gb' },
    { name: 'Rome',             flagCode: 'it' },
    { name: 'Barcelona',        flagCode: 'es' },
    { name: 'Maldives',         flagCode: 'mv' },
    { name: 'Santorini',        flagCode: 'gr' },
    { name: 'Bangkok',          flagCode: 'th' },
    { name: 'Cancún',           flagCode: 'mx' },
    { name: 'Rio de Janeiro',   flagCode: 'br' },
    { name: 'Amsterdam',        flagCode: 'nl' },
    { name: 'Prague',           flagCode: 'cz' },
    { name: 'Lisbon',           flagCode: 'pt' },
    { name: 'Istanbul',         flagCode: 'tr' },
    { name: 'Marrakech',        flagCode: 'ma' },
    { name: 'Costa Rica',       flagCode: 'cr' },
    { name: 'Iceland',          flagCode: 'is' },
    { name: 'Cape Town',        flagCode: 'za' },
    { name: 'New Zealand',      flagCode: 'nz' },
    { name: 'Hawaii',           flagCode: 'us-hi' },
    { name: 'Tuscany',          flagCode: 'it' },
    { name: 'Swiss Alps',       flagCode: 'ch' },
    { name: 'Kyoto',            flagCode: 'jp' },
    { name: 'Singapore',        flagCode: 'sg' },
    { name: 'Amalfi Coast',     flagCode: 'it' },
    { name: 'Machu Picchu',     flagCode: 'pe' },
    { name: 'Safari (Kenya)',   flagCode: 'ke' },
    { name: 'Phuket',           flagCode: 'th' },
    { name: 'Dubrovnik',        flagCode: 'hr' },
    { name: 'Reykjavik',        flagCode: 'is' },
    { name: 'Vietnam',          flagCode: 'vn' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Periodic Table ────────────────────────────────────────────────────────────
export const PERIODIC_TABLE_TEMPLATE = {
  id: 'prebuilt_periodic_table', name: '⚗️ Periodic Table', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildNamePlayers([
    'Hydrogen (H)', 'Helium (He)', 'Lithium (Li)', 'Beryllium (Be)', 'Boron (B)',
    'Carbon (C)', 'Nitrogen (N)', 'Oxygen (O)', 'Fluorine (F)', 'Neon (Ne)',
    'Sodium (Na)', 'Magnesium (Mg)', 'Aluminium (Al)', 'Silicon (Si)', 'Phosphorus (P)',
    'Sulfur (S)', 'Chlorine (Cl)', 'Argon (Ar)', 'Potassium (K)', 'Calcium (Ca)',
    'Scandium (Sc)', 'Titanium (Ti)', 'Vanadium (V)', 'Chromium (Cr)', 'Manganese (Mn)',
    'Iron (Fe)', 'Cobalt (Co)', 'Nickel (Ni)', 'Copper (Cu)', 'Zinc (Zn)',
    'Gallium (Ga)', 'Germanium (Ge)', 'Arsenic (As)', 'Selenium (Se)', 'Bromine (Br)',
    'Krypton (Kr)', 'Rubidium (Rb)', 'Strontium (Sr)', 'Yttrium (Y)', 'Zirconium (Zr)',
    'Niobium (Nb)', 'Molybdenum (Mo)', 'Technetium (Tc)', 'Ruthenium (Ru)', 'Rhodium (Rh)',
    'Palladium (Pd)', 'Silver (Ag)', 'Cadmium (Cd)', 'Indium (In)', 'Tin (Sn)',
    'Antimony (Sb)', 'Tellurium (Te)', 'Iodine (I)', 'Xenon (Xe)', 'Caesium (Cs)',
    'Barium (Ba)', 'Lanthanum (La)', 'Cerium (Ce)', 'Praseodymium (Pr)', 'Neodymium (Nd)',
    'Promethium (Pm)', 'Samarium (Sm)', 'Europium (Eu)', 'Gadolinium (Gd)', 'Terbium (Tb)',
    'Dysprosium (Dy)', 'Holmium (Ho)', 'Erbium (Er)', 'Thulium (Tm)', 'Ytterbium (Yb)',
    'Lutetium (Lu)', 'Hafnium (Hf)', 'Tantalum (Ta)', 'Tungsten (W)', 'Rhenium (Re)',
    'Osmium (Os)', 'Iridium (Ir)', 'Platinum (Pt)', 'Gold (Au)', 'Mercury (Hg)',
    'Thallium (Tl)', 'Lead (Pb)', 'Bismuth (Bi)', 'Polonium (Po)', 'Astatine (At)',
    'Radon (Rn)', 'Francium (Fr)', 'Radium (Ra)', 'Actinium (Ac)', 'Thorium (Th)',
    'Protactinium (Pa)', 'Uranium (U)', 'Neptunium (Np)', 'Plutonium (Pu)', 'Americium (Am)',
    'Curium (Cm)', 'Berkelium (Bk)', 'Californium (Cf)', 'Einsteinium (Es)', 'Fermium (Fm)',
    'Mendelevium (Md)', 'Nobelium (No)', 'Lawrencium (Lr)', 'Rutherfordium (Rf)', 'Dubnium (Db)',
    'Seaborgium (Sg)', 'Bohrium (Bh)', 'Hassium (Hs)', 'Meitnerium (Mt)', 'Darmstadtium (Ds)',
    'Roentgenium (Rg)', 'Copernicium (Cn)', 'Nihonium (Nh)', 'Flerovium (Fl)', 'Moscovium (Mc)',
    'Livermorium (Lv)', 'Tennessine (Ts)', 'Oganesson (Og)',
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── All prebuilt templates (order = display order in modal) ───────────────────
export const PREBUILT_TEMPLATES = [
  WORLD_COUNTRIES_TEMPLATE,
  PREMIER_LEAGUE_TEMPLATE,
  NFL_TEMPLATE,
  F1_TEMPLATE,
  MARVEL_DISNEY_TEMPLATE,
  FAST_FOOD_TEMPLATE,
  BABY_NAMES_TEMPLATE,
  HOLIDAYS_TEMPLATE,
  PERIODIC_TABLE_TEMPLATE,
]
