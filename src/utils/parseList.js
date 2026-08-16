/**
 * Normalises the comma-separated strings that multipart forms send for the
 * `sports` / `onlineGames` fields into a trimmed array. Already-parsed arrays
 * pass through, and empty entries are dropped.
 */
const parseList = (value) => {
  if (value == null) return undefined;

  const items = Array.isArray(value) ? value : String(value).split(',');

  return items
    .map((item) => String(item).trim())
    .filter(Boolean);
};

export default parseList;
