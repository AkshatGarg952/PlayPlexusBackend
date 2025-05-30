import axios from "axios";
import { franc } from "franc";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LIBRETRANSLATE_API_URLS = [
  "https://libretranslate.de",
  "https://translate.argosopentech.com",
];

// Enhanced language detection using franc
function detectLanguageWithFranc(text) {
  const francResult = franc(text, { minLength: 3 });
  return francResult === "und" ? "en" : getLibreLang(francResult);
}

// Extended language mapping for better coverage
const francToLibreMap = {
  eng: "en", fra: "fr", deu: "de", spa: "es", por: "pt", ita: "it", nld: "nl",
  pol: "pl", rus: "ru", jpn: "ja", zho: "zh", ara: "ar", hin: "hi", kor: "ko",
  tur: "tr", ukr: "uk", vie: "vi", tha: "th", swe: "sv", nor: "no", dan: "da",
  fin: "fi", ces: "cs", hun: "hu", ron: "ro", bul: "bg", hrv: "hr", slk: "sk",
  slv: "sl", est: "et", lav: "lv", lit: "lt", ell: "el", heb: "he", fas: "fa"
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
            timeout: 8000, // Increased timeout
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

// Enhanced intent recognition with comprehensive sports and games
function analyzeIntent(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Enhanced find patterns - more flexible matching
  const findPatterns = [
    /(find|search|looking for|get|show|display|want|need)\s+(players?|teams?|people|gamers?)/i,
    /(players?|teams?|people|gamers?)\s+(in|from|at|near)/i,
    /(where are|who are)\s+(players?|teams?|people|gamers?)/i,
    /connect me (with|to)\s+(players?|teams?|people|gamers?)/i
  ];
  
  const isFindIntent = findPatterns.some(pattern => pattern.test(normalizedText));
  
  if (!isFindIntent) {
    return { intent: null };
  }
  
  // Comprehensive sports list
  const sportsKeywords = {
    // Traditional Sports
    "cricket": ["cricket", "ipl", "t20", "test cricket", "odi"],
    "football": ["football", "fifa", "premier league", "champions league", "soccer"],
    "basketball": ["basketball", "nba", "ball", "hoops"],
    "volleyball": ["volleyball", "volley"],
    "tennis": ["tennis", "wimbledon", "open tennis"],
    "badminton": ["badminton", "shuttle", "shuttlecock"],
    "hockey": ["hockey", "field hockey", "ice hockey"],
    "baseball": ["baseball", "mlb"],
    "rugby": ["rugby", "union", "league"],
    "golf": ["golf", "pga"],
    "swimming": ["swimming", "pool", "freestyle", "backstroke"],
    "athletics": ["athletics", "track", "field", "running", "marathon"],
    "boxing": ["boxing", "fight", "punch"],
    "wrestling": ["wrestling", "wwe", "mma"],
    "cycling": ["cycling", "bike", "bicycle"],
    "table tennis": ["table tennis", "ping pong", "tt"]
  };
  
  // Comprehensive games list including BGMI and popular mobile games
  const gamesKeywords = {
    // Battle Royale Games
    "bgmi": ["bgmi", "battlegrounds mobile india", "battle grounds mobile india", "bg mobile india"],
    "pubg": ["pubg", "pubg mobile", "player unknown", "playerunknown", "pub g"],
    "fortnite": ["fortnite", "battle royale", "fort nite"],
    "apex legends": ["apex", "apex legends", "apexlegends"],
    "free fire": ["free fire", "ff", "garena free fire", "freefire", "free-fire"],
    "cod mobile": ["cod mobile", "call of duty mobile", "codm", "cod-mobile", "callofduty mobile"],
    
    // MOBA Games
    "mobile legends": ["mobile legends", "ml", "mlbb", "mobilelegends", "mobile-legends"],
    "league of legends": ["league of legends", "lol", "wild rift", "leagueoflegends", "wildrift"],
    "dota": ["dota", "dota 2", "defense of the ancients", "dota2"],
    "arena of valor": ["arena of valor", "aov", "arenaofvalor"],
    
    // FPS Games
    "valorant": ["valorant", "riot valorant", "val"],
    "counter strike": ["counter strike", "cs", "csgo", "cs2", "counterstrike", "counter-strike"],
    "call of duty": ["call of duty", "cod", "warzone", "callofduty", "call-of-duty"],
    "overwatch": ["overwatch", "ow", "over watch"],
    "rainbow six": ["rainbow six", "r6", "siege", "rainbowsix", "rainbow-six"],
    
    // Other Popular Games
    "minecraft": ["minecraft", "mc", "block game", "mine craft"],
    "roblox": ["roblox", "robux", "rob lox"],
    "among us": ["among us", "impostor", "amongus", "among-us"],
    "clash of clans": ["clash of clans", "coc", "clash", "clashofclans", "clash-of-clans"],
    "clash royale": ["clash royale", "cr", "clashroyale", "clash-royale"],
    "pokemon go": ["pokemon go", "pogo", "pokemongo", "pokemon-go"],
    "genshin impact": ["genshin", "genshin impact", "genshinimpact", "genshin-impact"],
    "rocket league": ["rocket league", "rl", "rocketleague", "rocket-league"],
    "fifa": ["fifa", "ea sports fc", "easports", "ea-sports"],
    "2k": ["2k", "nba 2k", "nba2k"],
    "fall guys": ["fall guys", "fall guy", "fallguys", "fall-guys"],
    "stumble guys": ["stumble guys", "stumble", "stumbleguys", "stumble-guys"],
    "brawl stars": ["brawl stars", "supercell", "brawlstars", "brawl-stars"]
  };
  
  // Determine if looking for teams or players
  const teamKeywords = ["team", "teams", "squad", "crew", "guild", "clan", "group"];
  const playerKeywords = ["player", "players", "gamer", "gamers", "people", "person"];
  
  let type = "player"; // default
  if (teamKeywords.some(keyword => normalizedText.includes(keyword))) {
    type = "team";
  }
  
  // Find sport match - case insensitive
  let sport = null;
  let category = null;
  
  for (const [sportName, keywords] of Object.entries(sportsKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
      sport = sportName;
      category = "sport";
      break;
    }
  }
  
  // Find game match if no sport found - case insensitive
  let game = null;
  if (!sport) {
    for (const [gameName, keywords] of Object.entries(gamesKeywords)) {
      if (keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        game = gameName;
        category = "onlineGame";
        break;
      }
    }
  }
  
  // Enhanced location detection
  const locationPatterns = [
    /(?:from|in|at|near|around)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/i,
    /([a-zA-Z\s]+?)\s+(?:city|town|area|region|state|country)/i,
    /(?:based in|located in|living in)\s+([a-zA-Z\s]+)/i
  ];
  
  let city = null;
  for (const pattern of locationPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      city = match[1].trim().toLowerCase();
      // Filter out common words that aren't locations
      const commonWords = ["the", "a", "an", "and", "or", "but", "with", "for", "to", "of", "my", "your"];
      if (!commonWords.includes(city) && city.length > 2) {
        break;
      }
      city = null;
    }
  }
  
  // Check if we have enough information for a redirect
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
  
  // Partial matches - could be expanded to ask for missing info
  if (sport || game) {
    return {
      category,
      sport,
      gameName: game,
      type,
      intent: "partialMatch",
      missing: city ? [] : ["location"]
    };
  }
  
  return { intent: null };
}

export default async function ask(req, res) {
  const { userSpeechText } = req.body;
  const { id } = req.params;

  if (!userSpeechText || typeof userSpeechText !== "string" || userSpeechText.trim().length === 0) {
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
    // Language detection and translation
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
    
    // Enhanced intent analysis
    const quickAnalysis = analyzeIntent(englishText);
    console.log('Intent analysis result:', quickAnalysis);
    
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
      
      // Translate response back if needed
      let responseText = `I found ${userType === "team" ? "teams" : "players"} for ${play} in ${location}. Here's your link!`;
      
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
    
    // Handle partial matches - could ask for missing information
    if (quickAnalysis.intent === "partialMatch") {
      let responseText;
      if (quickAnalysis.missing.includes("location")) {
        const gameOrSport = quickAnalysis.sport || quickAnalysis.gameName;
        responseText = `I can help you find ${quickAnalysis.type === "team" ? "teams" : "players"} for ${gameOrSport}. Could you please specify the location or city?`;
      } else {
        responseText = "I need more information to help you find what you're looking for.";
      }
      
      if (detectedLang !== "en" && !translationFailed) {
        try {
          const translated = await translateText(responseText, "en", detectedLang);
          responseText = translated.text;
        } catch (e) {
          console.warn("Failed to translate response, using English:", e.message);
        }
      }
      
      return res.status(200).json({
        text: responseText,
        requiresMoreInfo: true
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
    
    // Default response for unrecognized intents
    const errorMsg = "I'm designed to help you find players and teams for sports and games. Try asking something like 'Find BGMI players in Mumbai' or 'Show me cricket teams in Delhi'.";
    
    if (detectedLang !== "en" && !translationFailed) {
      try {
        const translated = await translateText(errorMsg, "en", detectedLang);
        return res.status(200).json({ 
          text: translated.text,
          suggestion: true 
        });
      } catch (e) {
        console.error("Error translating error message:", e);
      }
    }
    
    return res.status(200).json({ 
      text: errorMsg,
      suggestion: true 
    });
    
  } catch (err) {
    console.error("Chatbot Error:", err);
    
    // Try to translate error message if possible
    const errorMsg = "An unexpected error occurred. Please try again.";
    return res.status(500).json({ error: errorMsg });
  }
}
