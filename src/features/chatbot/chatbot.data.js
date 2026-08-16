/**
 * Keyword dictionaries used to recognise what a user is asking for.
 * Each canonical name maps to the aliases and abbreviations people actually
 * type or say. Add new entries here rather than in the matching logic.
 */

export const SPORTS = {
  cricket: ['cricket', 'ipl', 't20', 'test cricket', 'odi'],
  football: ['football', 'fifa', 'premier league', 'champions league', 'soccer'],
  basketball: ['basketball', 'nba', 'hoops'],
  volleyball: ['volleyball', 'volley'],
  tennis: ['tennis', 'wimbledon'],
  badminton: ['badminton', 'shuttle', 'shuttlecock'],
  hockey: ['hockey', 'field hockey', 'ice hockey'],
  baseball: ['baseball', 'mlb'],
  rugby: ['rugby'],
  golf: ['golf', 'pga'],
  swimming: ['swimming', 'freestyle', 'backstroke'],
  athletics: ['athletics', 'track', 'running', 'marathon'],
  boxing: ['boxing'],
  wrestling: ['wrestling', 'wwe', 'mma'],
  cycling: ['cycling', 'bike', 'bicycle'],
  'table tennis': ['table tennis', 'ping pong'],
  chess: ['chess'],
};

export const GAMES = {
  bgmi: ['bgmi', 'battlegrounds mobile india', 'battle grounds mobile india'],
  pubg: ['pubg', 'pubg mobile', 'playerunknown', 'player unknown'],
  fortnite: ['fortnite', 'fort nite'],
  'apex legends': ['apex legends', 'apexlegends', 'apex'],
  'free fire': ['free fire', 'freefire', 'free-fire', 'garena free fire'],
  'cod mobile': ['cod mobile', 'call of duty mobile', 'codm', 'cod-mobile'],
  'mobile legends': ['mobile legends', 'mlbb', 'mobilelegends', 'mobile-legends'],
  'league of legends': ['league of legends', 'leagueoflegends', 'wild rift', 'wildrift', 'lol'],
  dota: ['dota 2', 'dota2', 'dota', 'defense of the ancients'],
  'arena of valor': ['arena of valor', 'arenaofvalor', 'aov'],
  valorant: ['valorant', 'riot valorant'],
  'counter strike': ['counter strike', 'counterstrike', 'counter-strike', 'csgo', 'cs2'],
  'call of duty': ['call of duty', 'callofduty', 'call-of-duty', 'warzone'],
  overwatch: ['overwatch', 'over watch'],
  'rainbow six': ['rainbow six', 'rainbowsix', 'rainbow-six', 'siege'],
  minecraft: ['minecraft', 'mine craft'],
  roblox: ['roblox'],
  'among us': ['among us', 'amongus', 'among-us', 'impostor'],
  'clash of clans': ['clash of clans', 'clashofclans', 'clash-of-clans', 'coc'],
  'clash royale': ['clash royale', 'clashroyale', 'clash-royale'],
  'pokemon go': ['pokemon go', 'pokemongo', 'pokemon-go', 'pogo'],
  'genshin impact': ['genshin impact', 'genshinimpact', 'genshin-impact', 'genshin'],
  'rocket league': ['rocket league', 'rocketleague', 'rocket-league'],
  fifa: ['fifa', 'ea sports fc'],
  'nba 2k': ['nba 2k', 'nba2k'],
  'fall guys': ['fall guys', 'fallguys', 'fall-guys'],
  'stumble guys': ['stumble guys', 'stumbleguys', 'stumble-guys'],
  'brawl stars': ['brawl stars', 'brawlstars', 'brawl-stars'],
};

/** Phrasings that mean "show me some players/teams". */
export const FIND_PATTERNS = [
  /\b(find|search|looking for|look for|get|show|display|want|need)\b.*\b(players?|teams?|people|gamers?|squads?)\b/i,
  /\b(players?|teams?|people|gamers?|squads?)\b\s+(in|from|at|near|around)\b/i,
  /\b(where|who)\s+(are|can i find)\b.*\b(players?|teams?|people|gamers?)\b/i,
  /\bconnect me (with|to)\b/i,
];

/** Extracts a place name from the trailing part of a sentence. */
export const LOCATION_PATTERNS = [
  /\b(?:from|in|at|near|around)\s+([a-z][a-z\s]{1,30}?)(?:\s*(?:[,.!?]|$))/i,
  /\b(?:based in|located in|living in)\s+([a-z][a-z\s]{1,30})/i,
];

/** Words a location regex can capture that are never actually places. */
export const LOCATION_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'to', 'of', 'my', 'your',
  'me', 'us', 'them', 'here', 'there', 'this', 'that', 'any', 'some', 'my area',
]);

export const TEAM_WORDS = ['team', 'teams', 'squad', 'squads', 'crew', 'guild', 'clan', 'group'];
