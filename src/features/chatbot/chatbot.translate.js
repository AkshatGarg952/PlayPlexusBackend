import axios from 'axios';
import { franc } from 'franc';
import config from '../../config/env.js';

/**
 * Public LibreTranslate mirrors, tried in order. They are best-effort: every
 * caller must be able to carry on in English when translation fails.
 */
const ENDPOINTS = config.translateUrls;

const REQUEST_TIMEOUT_MS = 8000;

/** ISO 639-3 (what franc returns) to ISO 639-1 (what LibreTranslate expects). */
const ISO3_TO_ISO1 = {
  eng: 'en', fra: 'fr', deu: 'de', spa: 'es', por: 'pt', ita: 'it', nld: 'nl',
  pol: 'pl', rus: 'ru', jpn: 'ja', cmn: 'zh', zho: 'zh', arb: 'ar', ara: 'ar',
  hin: 'hi', kor: 'ko', tur: 'tr', ukr: 'uk', vie: 'vi', tha: 'th', swe: 'sv',
  nor: 'no', dan: 'da', fin: 'fi', ces: 'cs', hun: 'hu', ron: 'ro', bul: 'bg',
  hrv: 'hr', slk: 'sk', slv: 'sl', est: 'et', lav: 'lv', lit: 'lt', ell: 'el',
  heb: 'he', pes: 'fa', fas: 'fa', ben: 'bn', tam: 'ta', tel: 'te', mar: 'mr',
  guj: 'gu', urd: 'ur', pan: 'pa', kan: 'kn', mal: 'ml',
};

/** Best-guess ISO 639-1 code for a message; falls back to English. */
export const detectLanguage = (text) => {
  const detected = franc(text, { minLength: 10 });
  return detected === 'und' ? 'en' : ISO3_TO_ISO1[detected] || 'en';
};

/**
 * Translates text between two languages.
 * @throws when every mirror fails — callers are expected to fall back to English.
 */
export const translate = async (text, from, to) => {
  if (from === to) return text;

  let lastError;
  for (const endpoint of ENDPOINTS) {
    try {
      const { data } = await axios.post(
        `${endpoint}/translate`,
        { q: text, source: from, target: to, format: 'text' },
        { headers: { 'Content-Type': 'application/json' }, timeout: REQUEST_TIMEOUT_MS }
      );
      if (data?.translatedText) return data.translatedText;
      lastError = new Error('Response contained no translation');
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Translation failed: ${lastError?.message ?? 'no endpoints configured'}`);
};

/** Translates if possible, otherwise returns the original text unchanged. */
export const translateOrKeep = async (text, from, to) => {
  try {
    return await translate(text, from, to);
  } catch (error) {
    console.warn('[chatbot]', error.message);
    return text;
  }
};
