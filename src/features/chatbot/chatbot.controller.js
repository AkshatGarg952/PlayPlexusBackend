import axios from "axios";
import { franc } from "franc";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LIBRETRANSLATE_API_URLS = [
  "https://libretranslate.de",
  "https://translate.argosopentech.com",
];

// Simple language detection using franc
function detectLanguageWithFranc(text) {
  const francResult = franc(text, { minLength: 3 });
  return francResult === "und" ? "en" : getLibreLang(francResult);
}

// Map franc's ISO 639-3 codes to LibreTranslate's ISO 639-1 codes
const francToLibreMap = {
  eng: "en", fra: "fr", deu: "de", spa: "es", por: "pt", ita: "it", nld: "nl",
  pol: "pl", rus: "ru", jpn: "ja", zho: "zh", ara: "ar", hin: "hi", kor: "ko",
};

function getLibreLang(francLang) {
  return francToLibreMap[francLang] || "en";
}

// Function to translate text using LibreTranslate
async function translateText(text, sourceLang, targetLang, retries = 2, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    for (const url of LIBRETRANSLATE_API_URLS) {
      try {
        const response = await axios.post(
          `${url}/translate`,
          {
            q: text,
            source: sourceLang === "auto" ? "auto" : sourceLang,
            target: targetLang,
            format: "text",
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 5000,
          }
        );
        return {
          text: response.data.translatedText,
          detectedSourceLanguage: response.data.detectedLanguage?.language || sourceLang,
        };
      } catch (error) {
        console.warn(`Translation attempt ${i + 1} failed for ${url}: ${error.message}`);
      }
    }
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Translation failed");
}

// Basic keyword-based intent recognition
function analyzeIntent(text) {
  text = text.toLowerCase();
  
  const findPattern = /(find|search|looking for|get|show|display) (players|teams|player|team)/i;
  const isFindIntent = findPattern.test(text);
  
  if (!isFindIntent) {
    return { intent: null };
  }
  
  const sportsList = ["cricket", "football", "soccer", "basketball", "volleyball", "tennis", 
                     "badminton", "hockey", "baseball", "rugby"];
  const gamesList = ["fortnite", "pubg", "valorant", "dota", "league of legends", "apex legends", 
                    "counter strike", "call of duty", "minecraft", "roblox"];
  
  let sport = null;
  let game = null;
  let type = text.includes("team") ? "team" : "player";
  
  for (const s of sportsList) {
    if (text.includes(s)) {
      sport = s;
      break;
    }
  }
  
  if (!sport) {
    for (const g of gamesList) {
      if (text.includes(g)) {
        game = g;
        break;
      }
    }
  }
  
  const cityPattern = /(?:from|in) ([a-zA-Z]+)/i;
  const cityMatch = text.match(cityPattern);
  const city = cityMatch ? cityMatch[1].toLowerCase() : null;
  
  const category = sport ? "sport" : game ? "onlineGame" : null;
  
  if ((sport || game) && city) {
    return {
      category,
      sport,
      gameName: game,
      type,
      city,
      intent: "findPlayersAndRedirect"
    };
  }
  
  return { intent: null };
}

export default async function ask(req, res) {
  const { userSpeechText } = req.body;
  const { id } = req.params;

  if (!userSpeechText || typeof userSpeechText !== "string") {
    return res.status(400).json({
      error: "Missing or invalid userSpeechText",
    });
  }

  if (!id) {
    return res.status(400).json({
      error: "Missing id in request parameters",
    });
  }

  try {
    // First, detect language and translate if necessary
    let detectedLang = detectLanguageWithFranc(userSpeechText);
    console.log(`Detected language: ${detectedLang}`);
    
    let englishText;
    let translationFailed = false;
    
    try {
      if (detectedLang === "en") {
        englishText = userSpeechText;
      } else {
        const translated = await translateText(userSpeechText, detectedLang, "en");
        englishText = translated.text;
        console.log(`Translated text: ${englishText}`);
      }
    } catch (transErr) {
      translationFailed = true;
      englishText = userSpeechText;
      console.warn(`Translation failed, using original text: ${transErr.message}`);
    }
    
    // Now analyze intent using the English text (either original or translated)
    const quickAnalysis = analyzeIntent(englishText);
    
    if (quickAnalysis.intent === "findPlayersAndRedirect") {
      const play = quickAnalysis.category === "sport" ? quickAnalysis.sport : quickAnalysis.gameName;
      const userType = quickAnalysis.type;
      const location = quickAnalysis.city;
      
      let redirectUrl;
      if (userType === "team") {
        redirectUrl = `/FTeamPage/${id}/${encodeURIComponent(play)}/${encodeURIComponent(location)}`;
      } else {
        redirectUrl = `/FUserPage/${id}/${encodeURIComponent(play)}/${encodeURIComponent(location)}`;
      }
      
      // Translate the response back to the original language if needed
      let responseText = "Here is the link for your destination";
      if (detectedLang !== "en" && !translationFailed) {
        try {
          const translatedResponse = await translateText(responseText, "en", detectedLang);
          responseText = translatedResponse.text;
        } catch (e) {
          console.warn("Failed to translate response, using English:", e.message);
        }
      }
      
      return res.status(200).json({
        text: responseText,
        link: redirectUrl,
      });
    }
    
    // If no Gemini API key is available
    if (!GEMINI_API_KEY) {
      const errorMsg = "API key missing. Please contact support.";
      if (detectedLang !== "en" && !translationFailed) {
        try {
          const translated = await translateText(errorMsg, "en", detectedLang);
          return res.status(500).json({ error: translated.text });
        } catch (e) {
          // Fallback to English error
        }
      }
      return res.status(500).json({ error: errorMsg });
    }
    
    // If intent is not recognized, return the "not designed" error
    const errorMsg = "Sorry, currently the chatbot is not designed to answer advanced queries.";
    if (detectedLang !== "en" && !translationFailed) {
      try {
        const translated = await translateText(errorMsg, "en", detectedLang);
        return res.status(400).json({ error: translated.text });
      } catch (e) {
        console.error("Error translating error message:", e);
      }
    }
    return res.status(400).json({ error: errorMsg });
    
  } catch (err) {
    console.error("Chatbot Error:", err);
    return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
}
