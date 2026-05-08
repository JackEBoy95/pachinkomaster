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

// Build players from { name, emoji } list — emoji is a Twemoji codepoint string
function buildEmojiPlayers(entries, startId = 4000) {
  return entries.map(({ name, emoji }, i) => ({
    id: startId + i, name, color: colorFor(i), score: 0,
    ballSkin: emoji ? `emoji:${emoji}` : '',
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
// Six baby skin-tone variants cycle across all names
const BABY_EMOJIS = ['1F476','1F476-1F3FB','1F476-1F3FC','1F476-1F3FD','1F476-1F3FE','1F476-1F3FF']
const BABY_NAME_LIST = [
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
]
export const BABY_NAMES_TEMPLATE = {
  id: 'prebuilt_baby_names', name: '👶 Baby Names', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildEmojiPlayers(
    BABY_NAME_LIST.map((name, i) => ({ name, emoji: BABY_EMOJIS[i % BABY_EMOJIS.length] })),
    5000
  ),
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

// ── Animals ───────────────────────────────────────────────────────────────────
export const ANIMALS_TEMPLATE = {
  id: 'prebuilt_animals', name: '🐾 Animals', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildEmojiPlayers([
    { name: 'Dog',        emoji: '1F436' },
    { name: 'Cat',        emoji: '1F431' },
    { name: 'Rabbit',     emoji: '1F430' },
    { name: 'Hamster',    emoji: '1F439' },
    { name: 'Fox',        emoji: '1F98A' },
    { name: 'Bear',       emoji: '1F43B' },
    { name: 'Panda',      emoji: '1F43C' },
    { name: 'Koala',      emoji: '1F428' },
    { name: 'Tiger',      emoji: '1F42F' },
    { name: 'Lion',       emoji: '1F981' },
    { name: 'Cow',        emoji: '1F42E' },
    { name: 'Pig',        emoji: '1F437' },
    { name: 'Frog',       emoji: '1F438' },
    { name: 'Monkey',     emoji: '1F435' },
    { name: 'Penguin',    emoji: '1F427' },
    { name: 'Owl',        emoji: '1F989' },
    { name: 'Eagle',      emoji: '1F985' },
    { name: 'Duck',       emoji: '1F986' },
    { name: 'Wolf',       emoji: '1F43A' },
    { name: 'Horse',      emoji: '1F434' },
    { name: 'Unicorn',    emoji: '1F984' },
    { name: 'Elephant',   emoji: '1F418' },
    { name: 'Gorilla',    emoji: '1F98D' },
    { name: 'Giraffe',    emoji: '1F992' },
    { name: 'Zebra',      emoji: '1F993' },
    { name: 'Crocodile',  emoji: '1F40A' },
    { name: 'Snake',      emoji: '1F40D' },
    { name: 'Turtle',     emoji: '1F422' },
    { name: 'Shark',      emoji: '1F988' },
    { name: 'Dolphin',    emoji: '1F42C' },
    { name: 'Whale',      emoji: '1F40B' },
    { name: 'Octopus',    emoji: '1F419' },
    { name: 'Butterfly',  emoji: '1F98B' },
    { name: 'Bee',        emoji: '1F41D' },
    { name: 'T-Rex',      emoji: '1F996' },
    { name: 'Dinosaur',   emoji: '1F995' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Sports Balls ─────────────────────────────────────────────────────────────
export const BALLS_TEMPLATE = {
  id: 'prebuilt_balls', name: '🏀 Sports Balls', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildEmojiPlayers([
    { name: 'Soccer',      emoji: '26BD' },
    { name: 'Basketball',  emoji: '1F3C0' },
    { name: 'American Football', emoji: '1F3C8' },
    { name: 'Baseball',    emoji: '26BE' },
    { name: 'Softball',    emoji: '1F94E' },
    { name: 'Tennis',      emoji: '1F3BE' },
    { name: 'Volleyball',  emoji: '1F3D0' },
    { name: 'Rugby',       emoji: '1F3C9' },
    { name: '8 Ball',      emoji: '1F3B1' },
    { name: 'Ping Pong',   emoji: '1F3D3' },
    { name: 'Badminton',   emoji: '1F3F8' },
    { name: 'Cricket',     emoji: '1F3CF' },
    { name: 'Hockey',      emoji: '1F3D1' },
    { name: 'Ice Hockey',  emoji: '1F3D2' },
    { name: 'Lacrosse',    emoji: '1F94D' },
    { name: 'Bowling',     emoji: '1F3B3' },
    { name: 'Bullseye',    emoji: '1F3AF' },
    { name: 'Golf',        emoji: '26F3' },
    { name: 'Frisbee',     emoji: '1F94F' },
    { name: 'Yo-Yo',       emoji: '1FA80' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Smileys ───────────────────────────────────────────────────────────────────
export const SMILEYS_TEMPLATE = {
  id: 'prebuilt_smileys', name: '😀 Smileys', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildEmojiPlayers([
    { name: 'Grinning',          emoji: '1F600' },
    { name: 'Big Smile',         emoji: '1F601' },
    { name: 'Tears of Joy',      emoji: '1F602' },
    { name: 'ROFL',              emoji: '1F923' },
    { name: 'Smiling Eyes',      emoji: '1F60A' },
    { name: 'Heart Eyes',        emoji: '1F60D' },
    { name: 'Smiling Hearts',    emoji: '1F970' },
    { name: 'Sunglasses',        emoji: '1F60E' },
    { name: 'Star Struck',       emoji: '1F929' },
    { name: 'Party',             emoji: '1F973' },
    { name: 'Wink',              emoji: '1F609' },
    { name: 'Smirk',             emoji: '1F60F' },
    { name: 'Thinking',          emoji: '1F914' },
    { name: 'Shushing',          emoji: '1F92B' },
    { name: 'Hand Over Mouth',   emoji: '1F92D' },
    { name: 'Flushed',           emoji: '1F633' },
    { name: 'Screaming',         emoji: '1F631' },
    { name: 'Mind Blown',        emoji: '1F92F' },
    { name: 'Pleading',          emoji: '1F97A' },
    { name: 'Crying',            emoji: '1F62D' },
    { name: 'Angry',             emoji: '1F621' },
    { name: 'Steaming',          emoji: '1F624' },
    { name: 'Dizzy',             emoji: '1F635' },
    { name: 'Woozy',             emoji: '1F974' },
    { name: 'Sleeping',          emoji: '1F634' },
    { name: 'Devil',             emoji: '1F608' },
    { name: 'Skull',             emoji: '1F480' },
    { name: 'Ghost',             emoji: '1F47B' },
    { name: 'Alien',             emoji: '1F47D' },
    { name: 'Robot',             emoji: '1F916' },
    { name: 'Clown',             emoji: '1F921' },
    { name: 'Jack-O-Lantern',    emoji: '1F383' },
    { name: 'Poop',              emoji: '1F4A9' },
    { name: 'Nauseated',         emoji: '1F922' },
    { name: 'Sneezing',          emoji: '1F927' },
    { name: 'Cowboy',            emoji: '1F920' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── Food ─────────────────────────────────────────────────────────────────────
export const FOOD_TEMPLATE = {
  id: 'prebuilt_food', name: '🍕 Food', createdAt: 0,
  prizes: DEFAULT_PRIZES,
  players: buildEmojiPlayers([
    { name: 'Pizza',           emoji: '1F355' },
    { name: 'Burger',          emoji: '1F354' },
    { name: 'Fries',           emoji: '1F35F' },
    { name: 'Hot Dog',         emoji: '1F32D' },
    { name: 'Taco',            emoji: '1F32E' },
    { name: 'Burrito',         emoji: '1F32F' },
    { name: 'Sushi',           emoji: '1F363' },
    { name: 'Ramen',           emoji: '1F35C' },
    { name: 'Spaghetti',       emoji: '1F35D' },
    { name: 'Curry',           emoji: '1F35B' },
    { name: 'Sandwich',        emoji: '1F96A' },
    { name: 'Salad',           emoji: '1F957' },
    { name: 'Popcorn',         emoji: '1F37F' },
    { name: 'Pancakes',        emoji: '1F95E' },
    { name: 'Waffle',          emoji: '1F9C7' },
    { name: 'Bacon',           emoji: '1F953' },
    { name: 'Egg',             emoji: '1F95A' },
    { name: 'Poultry Leg',     emoji: '1F357' },
    { name: 'Birthday Cake',   emoji: '1F382' },
    { name: 'Shortcake',       emoji: '1F370' },
    { name: 'Doughnut',        emoji: '1F369' },
    { name: 'Ice Cream',       emoji: '1F366' },
    { name: 'Lollipop',        emoji: '1F36D' },
    { name: 'Chocolate',       emoji: '1F36B' },
    { name: 'Candy',           emoji: '1F36C' },
    { name: 'Bento Box',       emoji: '1F371' },
    { name: 'Pot of Food',     emoji: '1F372' },
    { name: 'Cheese',          emoji: '1F9C0' },
    { name: 'Bread',           emoji: '1F35E' },
    { name: 'Croissant',       emoji: '1F950' },
    { name: 'Avocado',         emoji: '1F951' },
    { name: 'Strawberry',      emoji: '1F353' },
    { name: 'Watermelon',      emoji: '1F349' },
    { name: 'Grapes',          emoji: '1F347' },
    { name: 'Peach',           emoji: '1F351' },
    { name: 'Bubble Tea',      emoji: '1F9CB' },
  ]),
  settings: DEFAULT_SETTINGS,
}

// ── All prebuilt templates (order = display order in modal) ───────────────────
export const PREBUILT_TEMPLATES = [
  WORLD_COUNTRIES_TEMPLATE,
  PREMIER_LEAGUE_TEMPLATE,
  NFL_TEMPLATE,
  F1_TEMPLATE,
  ANIMALS_TEMPLATE,
  BALLS_TEMPLATE,
  SMILEYS_TEMPLATE,
  FOOD_TEMPLATE,
  MARVEL_DISNEY_TEMPLATE,
  FAST_FOOD_TEMPLATE,
  BABY_NAMES_TEMPLATE,
  HOLIDAYS_TEMPLATE,
  PERIODIC_TABLE_TEMPLATE,
]
