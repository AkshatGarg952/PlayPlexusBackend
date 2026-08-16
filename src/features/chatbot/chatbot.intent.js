import {
  SPORTS,
  GAMES,
  FIND_PATTERNS,
  LOCATION_PATTERNS,
  LOCATION_STOPWORDS,
  TEAM_WORDS,
} from './chatbot.data.js';

/**
 * Longest alias first, so "counter strike" wins over a bare "cs" and
 * "mobile legends" is not swallowed by "legends".
 */
const buildMatchers = (dictionary, category) =>
  Object.entries(dictionary)
    .flatMap(([canonical, aliases]) => aliases.map((alias) => ({ canonical, alias, category })))
    .sort((a, b) => b.alias.length - a.alias.length);

const ACTIVITY_MATCHERS = [...buildMatchers(SPORTS, 'sport'), ...buildMatchers(GAMES, 'onlineGame')];

/** Matches an alias only on word boundaries, so "val" doesn't match "value". */
const containsAlias = (text, alias) => {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
};

const findActivity = (text) => ACTIVITY_MATCHERS.find(({ alias }) => containsAlias(text, alias)) ?? null;

const findLocation = (text) => {
  for (const pattern of LOCATION_PATTERNS) {
    const candidate = text.match(pattern)?.[1]?.trim().toLowerCase();
    if (candidate && candidate.length > 2 && !LOCATION_STOPWORDS.has(candidate)) {
      return candidate;
    }
  }
  return null;
};

/**
 * Classifies a message into one of three outcomes:
 *
 *  - `search`   — activity and location both known; the caller can build a link.
 *  - `needsLocation` — activity known, location missing; ask a follow-up.
 *  - `unknown`  — not a search request at all.
 *
 * @param {string} text An English-language message.
 */
export const analyzeIntent = (text) => {
  const normalised = String(text || '').toLowerCase().trim();

  if (!FIND_PATTERNS.some((pattern) => pattern.test(normalised))) {
    return { intent: 'unknown' };
  }

  const activity = findActivity(normalised);
  if (!activity) return { intent: 'unknown' };

  const target = TEAM_WORDS.some((word) => containsAlias(normalised, word)) ? 'team' : 'player';
  const location = findLocation(normalised);

  return {
    intent: location ? 'search' : 'needsLocation',
    activity: activity.canonical,
    category: activity.category,
    target,
    location,
  };
};

export default analyzeIntent;
