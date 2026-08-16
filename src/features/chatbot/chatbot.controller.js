import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { analyzeIntent } from './chatbot.intent.js';
import { detectLanguage, translateOrKeep } from './chatbot.translate.js';

const FALLBACK_REPLY =
  "I'm here to help you find players and teams. Try something like " +
  "\"Find BGMI players in Mumbai\" or \"Show me cricket teams in Delhi\".";

/** Front-end route that lists search results for an activity and place. */
const searchLink = (accountId, target, activity, location) => {
  const page = target === 'team' ? 'FTeamPage' : 'FUserPage';
  return `/${page}/${accountId}/${encodeURIComponent(activity)}/${encodeURIComponent(location)}`;
};

/**
 * Rule-based assistant: understands "find <sport/game> <players|teams> in
 * <place>" in any language LibreTranslate supports and answers with a link into
 * the app. Non-English input is translated in, and the reply is translated back.
 */
export const ask = asyncHandler(async (req, res) => {
  const { userSpeechText } = req.body;
  const { id } = req.params;

  if (typeof userSpeechText !== 'string' || !userSpeechText.trim()) {
    throw ApiError.badRequest('userSpeechText is required.');
  }
  if (req.user.id !== id) {
    throw ApiError.forbidden('You can only use the assistant as yourself.');
  }

  const language = detectLanguage(userSpeechText);
  const english = await translateOrKeep(userSpeechText, language, 'en');

  // Everything below composes the English reply; it is translated back once, at
  // the end, so the language handling lives in exactly one place.
  const reply = (text, extra = {}) =>
    translateOrKeep(text, 'en', language).then((translated) =>
      res.status(200).json({ text: translated, ...extra })
    );

  const result = analyzeIntent(english);

  if (result.intent === 'search') {
    const noun = result.target === 'team' ? 'teams' : 'players';
    return reply(`I found ${noun} for ${result.activity} in ${result.location}. Here's your link!`, {
      link: searchLink(id, result.target, result.activity, result.location),
    });
  }

  if (result.intent === 'needsLocation') {
    const noun = result.target === 'team' ? 'teams' : 'players';
    return reply(
      `I can help you find ${noun} for ${result.activity}. Which city should I look in?`,
      { requiresMoreInfo: true }
    );
  }

  return reply(FALLBACK_REPLY, { suggestion: true });
});

export default ask;
