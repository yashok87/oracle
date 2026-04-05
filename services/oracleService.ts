import { OracleResponse, OracleSource, Perspective, LearningProfile } from "../types";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import OpenAI from "openai";

const PERSPECTIVE_KEYS = ["psychoanalysis", "gestalt", "russian_philosophy", "german_philosophy", "existential", "theological", "buddhist", "post_modern", "ancient_greeks", "ancient_romans"];

// Initialize OpenAI client for Pollinations
// Note: We use a direct call if possible, or we can use the proxy.
// Given the environment, we'll try to use the proxy to avoid CORS issues if they arise,
// but the user's example was direct. We'll implement a robust fetch-based approach 
// that mimics the OpenAI client behavior but works through our proxy.

function ensureString(val: any): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return "";
  return String(val);
}

function cleanJsonResponse(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "");
  }
  return cleaned.trim();
}

const COUNCIL_REGISTRY: Record<string, Record<string, { ideological: string[], material: string[] }>> = {
  psychoanalysis: {
    "Jacques Lacan": {
      ideological: ["Mirror Stage", "Symbolic Order", "Object Petit A", "The Real", "Desire", "Signifier", "Gaze", "Psychotic Structure"],
      material: ["Deceptive Gloss", "Surface Seduction", "Fragmented Objects", "Hollow Core", "Mirrored Finishes", "Signifier Labels", "Synthetic Textures", "Hollow Vessel", "Lustrous Packaging", "Incomplete Set"]
    },
    "Sigmund Freud": {
      ideological: ["Unconscious", "Oedipal", "Eros/Thanatos", "Dream Displacement", "Id Domination", "The Uncanny", "Fetishism", "Repression"],
      material: ["Oral Satisfaction", "Sublimated Tools", "Repressed Flavors", "Phallic Ergonomics", "Anal Retention/Clutter", "Fabric Texture", "Taboo Ingredients", "Primitive Wood", "Heavy Weight", "Comforting Density"]
    }
  },
  gestalt: {
    "Fritz Perls": {
      ideological: ["Here and Now", "Contact Boundaries", "Holistic Awareness", "Unfinished Business", "Environmental Support"],
      material: ["Tactile Contact", "Boundary Textures", "Holistic Plating", "Raw Feedback", "Unfinished Finish", "Environmental Integration", "Immediate Utility", "Freshness", "Organic Wholeness", "Sensory Foreground"]
    }
  },
  russian_philosophy: {
    "Nikolai Berdyaev": {
      ideological: ["Existential Freedom", "Creative Transformation", "Personalism", "Eschatology"],
      material: ["Hand-Carved Texture", "Artisan Freedom", "Spiritual Nutrition", "Anti-Industrial Form", "Living Wood", "Rough Finish", "Natural Grain", "Fire-Forged Steel", "Primitive Craft", "Unique Imperfection"]
    }
  },
  german_philosophy: {
    "Friedrich Nietzsche": {
      ideological: ["Will to Power", "Eternal Recurrence", "The Overman", "Amor Fati"],
      material: ["Hammered Metal", "Sharp Precision", "Dangerous Flavors", "Dancing Light", "Vibrant Energy", "Mountain Freshness", "Hard Surfaces", "Lightning Speed", "Bold Contrast", "Masterful Craft"]
    }
  },
  existential: {
    "Jean-Paul Sartre": {
      ideological: ["Existence Precedes Essence", "Radical Freedom", "Bad Faith", "Facticity"],
      material: ["Cold Marble", "Cigarette Smoke", "Viscous Textures", "Hard Utility", "Strict Functionality", "Choice-driven Design", "Raw Stone", "Concrete Density", "Brutalist Lines", "Uncompromising Steel"]
    }
  },
  theological: {
    "Søren Kierkegaard": {
      ideological: ["Leap of Faith", "Subjectivity", "The Ethical vs Aesthetic", "Dread"],
      material: ["Individual Sizing", "Secret Compartments", "Quiet Pews", "Worn Leather", "Atmospheric Lighting", "Deep Shadows", "Personalized Settings", "Fervent Spices", "Internal Strength", "Hidden Gems"]
    }
  },
  buddhist: {
    "D.T. Suzuki": {
      ideological: ["Satori", "Sunyata/Emptiness", "Non-Duality", "No-Mind"],
      material: ["Empty Bowls", "Bamboo Lines", "River Stones", "Ink Washes", "Mindful Plating", "Negative Space", "Natural Decay", "Wabi-Sabi Texture", "Unprocessed Wood", "Simple Geometry"]
    }
  },
  post_modern: {
    "Jean Baudrillard": {
      ideological: ["Simulacra", "Hyperreality", "Symbolic Exchange", "Fatal Strategies"],
      material: ["Neon Glow", "Plastic Surfaces", "Digital Glitches", "Simulated Grain", "Video Loops", "Hyperreal Color", "Reflective Chrome", "Screen-like Smoothness", "Holographic Depth", "Artificial Taste"]
    }
  },
  ancient_greeks: {
    "Plato": {
      ideological: ["Theory of Forms", "Allegory of the Cave", "The Republic", "Philosopher King", "Eudaimonia"],
      material: ["Ideal Geometry", "Pure White Marble", "Solid Foundation", "Golden Ratio", "Unblemished Surfaces", "Symmetrical Plating", "Translucent Glass", "Structured Light"]
    },
    "Aristotle": {
      ideological: ["Virtue Ethics", "The Golden Mean", "Teleology", "Hylomorphism", "Practical Wisdom"],
      material: ["Balanced Proportions", "Natural Biology", "Organic Symmetry", "Wrought Iron", "Terracotta", "Polished Bronze", "Functional Beauty", "Sustained Order"]
    }
  },
  ancient_romans: {
    "Marcus Aurelius": {
      ideological: ["Stoic Discipline", "The Inner Citadel", "Amor Fati", "Cosmic Reason", "Brevity of Life"],
      material: ["Worn Stone", "Austere Bronze", "Orderly Layout", "Weathered Wood", "Minimalist Utility", "Hard Earth", "Strict Grid", "Neutral Tones"]
    }
  }
};

function isComparisonQuery(query: string): boolean {
  // Enhanced regex to catch "A or B", "A vs B", etc.
  return /\b(vs|or|versus|compare|сравнение|против|лучше|или|выбрать|чем|выбор между|что лучше|что выбрать)\b/i.test(query);
}

function isBinaryQuery(query: string): boolean {
  const binaryKeywords = /^(is|are|do|does|should|can|will|would|could|may|might|shall|must|am|was|were|has|have|had)\b/i;
  const lowercase = query.trim().toLowerCase();
  
  // If it starts with an auxiliary verb, it's likely binary
  if (binaryKeywords.test(lowercase)) return true;
  
  // If it ends with a question mark and doesn't start with a wh-word, it might be binary
  const whWords = /^(who|what|where|when|why|how|which)\b/i;
  if (lowercase.endsWith('?') && !whWords.test(lowercase)) return true;
  
  return false;
}

function isExplicitSelectionRequest(query: string): boolean {
  const lowercase = query.toLowerCase();
  const explicitKeywords = /\b(watch|buy|get|stream|recommend|suggest|what should i|choice for|to wear|to eat|wear|eat|play|view|look at)\b/i;
  return explicitKeywords.test(lowercase);
}

function isMaterialQuery(query: string): boolean {
  const materialKeywords = /\b(meal|dish|recipe|cook|eat|furniture|phone|gadget|electronics|laptop|computer|appliance|clothing|fashion|architecture|tools|lunch|dinner|breakfast|snack|chair|table|lamp|buy|purchase|shop|smartphone|monitor|tv|camera|car|vehicle|watch|pounds|gbp|usd|dollars|euros|price|cost|destination|travel|place|city|visit|song|track|album|artist|music|painting|art|paper|research|science|book|novel|movie|film|netflix|prime|game|steam|ps5|xbox|series|show|watch)\b/i;
  return materialKeywords.test(query.toLowerCase());
}

async function generateOracleText(prompt: string, systemInstruction: string, useJson: boolean = false): Promise<string> {
  // User requested to use ONLY Pollinations and NOT Gemini.
  return await generatePollinationsText(prompt, systemInstruction, useJson);
}

async function generatePollinationsText(prompt: string, systemInstruction: string, useJson: boolean = false): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000);
  const apiKey = (import.meta.env.VITE_POLL_KEY || "").trim();
  
  try {
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        seed,
        response_format: useJson ? { type: "json_object" } : undefined,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error(`Pollinations failed: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error("[Oracle] Direct text generation failed:", err);
    throw err;
  }
}

async function callOracleVision(divinePrompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_BIGMODEL_API_KEY;
  if (!apiKey) throw new Error("VITE_BIGMODEL_API_KEY is missing.");

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        "model": "cogview-3-flash", 
        "prompt": divinePrompt, 
        "size": "1024x1024" 
      })
    });

    if (!response.ok) throw new Error(`Vision API failed: ${response.status}`);
    const result = await response.json();
    return result.data[0].url;
  } catch (err) {
    console.error("[Oracle] Direct vision call failed:", err);
    throw err;
  }
}

export async function consultOracle(query: string, chaosScore: number, theme: 'SUPREMATIST' | 'IMPRESSIONIST', language: 'EN' | 'RU', learningProfile: LearningProfile | null = null): Promise<OracleResponse> {
  const isMaterial = isMaterialQuery(query);
  const isComp = isComparisonQuery(query);
  const isExplicit = isExplicitSelectionRequest(query);
  
  const selectedPerspectives: any = {};
  for (const key of PERSPECTIVE_KEYS) {
    const registry = COUNCIL_REGISTRY[key] || COUNCIL_REGISTRY['psychoanalysis'];
    const names = Object.keys(registry);
    const name = names[Math.floor(Math.random() * names.length)];
    const pool = isMaterial ? registry[name].material : registry[name].ideological;
    const selectedThemes = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    selectedPerspectives[key] = { philosopherName: name, philosopherThemes: selectedThemes };
  }

  let personaInstruction = "";
  if (learningProfile) {
    const { energy, information, decision, lifestyle } = learningProfile.traits;
    personaInstruction = `
## USER PERSONALITY TUNING (Targeting ${learningProfile.type}):
- Information Axis (${information}): ${information === 'S' ? 'Prefer concrete facts, practical details, and sequential logic. Avoid overly abstract metaphors.' : 'Prefer theories, abstract concepts, big-picture themes, and metaphorical revelations.'}
- Decision Axis (${decision}): ${decision === 'T' ? 'Use objective logic and critical analysis.' : 'Use values-based resonance and empathetic connection.'}
- Lifestyle Axis (${lifestyle}): ${lifestyle === 'J' ? 'Provide structured, organized, and definitive answers.' : 'Keep responses open-ended, exploratory, and flexible.'}
Adapt your tone to resonate with this specific cognitive profile.`;
  }

  const sysInstruction = `# OPERATIONAL MODES: ROUTING PROTOCOL
Analyze User Input. Target Language: ${language}. Chaos Influence: ${chaosScore}%.
${personaInstruction}

1. COMPARISON: 
   - ROLE: Judge between two distinct choices (Option A vs Option B).
   - TRIGGER: Activated when user asks to compare two things, or uses "or", "vs", etc. (e.g., "tea or coffee").
   - VOTE: Convene a 10-way vote among the council. Each of the 10 members MUST vote for either A or B.
   - OUTPUT: Must include a 'comparison' object with: 'optionA', 'optionB'. 
   - PERCENTAGES: The 'percentageA' and 'percentageB' MUST reflect the exact count of the 10 votes (e.g., 6 votes for A = 60%, 4 votes for B = 40%).
   - VERDICT: Declare the winner clearly based on the majority vote. Do NOT use [[YES]], [[NO]], or [[MAYBE]].

2. RECOMMENDATION (DIRECT SELECTION ENGINE):
   - ROLE: You are a Direct Selection Engine.
   - TRIGGER: ONLY activated when user explicitly asks "what should I [watch/buy/get/wear/eat]", or uses intent verbs like "recommend", "suggest", "watch [item]", "choice for".
   - SELECTION LOGIC:
     * IF Chaos Influence <= 20% (Logic >= 80%): Clichés/Mainstream items are PERMITTED.
     * IF Chaos Influence > 20%: Strictly forbid clichés. Identify 1 specific niche/obscure title.
   - OUTPUT FORMAT:
     [[Actual Name of Item]] (Actual Year) - Actual Genre
     Price/Access: [e.g., "Included with Prime", "Digital Purchase", or "$3.99 Rental"]
     Rationale: 1 concise sentence on why it fits.
   - LINK: Provide a direct link if possible (Amazon, IMDb, etc.) in 'recommendationLink' field.
   - VERDICT: Provide the recommendation. Do NOT use [[YES]], [[NO]], or [[MAYBE]].

3. DECISION (DECREE):
   - ROLE: Binary engine for life choices (e.g., "Should I quit my job?").
   - OUTPUT: IF the question is binary (implies a Yes/No/Maybe answer), start the 'verdict' with [[YES]], [[NO]], or [[MAYBE]]. Otherwise, provide a definitive decree without these markers.

4. KNOWLEDGE (SYMPOSIUM):
   - ROLE: Explain the ontological essence and significance of a subject.
   - TRIGGER: Default mode for concepts, terms, historical events, or general inquiries.
   - OUTPUT: IF the question is binary (e.g., "Is a frog green?"), start the 'verdict' with [[YES]], [[NO]], or [[MAYBE]]. Otherwise, explain the subject without these markers.
   - NO RECOMMENDATIONS: Do NOT provide film, book, or product recommendations here. Just provide the "gist" of the subject's essence.
   - ARTISTIC REVELATION: If the query is just the name of a work of art/media without explicit recommendation request, explain its cultural significance and philosophical themes.

5. AMBIGUITY PROTOCOL (STRICT):
   - Default to KNOWLEDGE mode (Symposium) to explain the concept/work.
   - ONLY use RECOMMENDATION mode if the user explicitly asks for a recommendation.

6. SUBJECT FIDELITY: Focus EXCLUSIVELY on the User Input. 

## COUNCIL OF PHILOSOPHERS (10 MEMBERS):
You MUST provide a 'perspectives' object with EXACTLY these 10 keys, each representing a council member:
- psychoanalysis
- gestalt
- russian_philosophy
- german_philosophy
- existential
- theological
- buddhist
- post_modern
- ancient_greeks
- ancient_romans

For each member, provide:
- "verdict": A short analysis (1-2 sentences) from their specific ideological lens.
- "vote": In COMPARISON mode, this MUST be "A" or "B". In other modes, it should be "RESONANCE".

## OUTPUT JSON SCHEMA:
{
  "title": "Poetic Title of the revelation",
  "type": "COMPARISON | RECOMMENDATION | DECISION | KNOWLEDGE | PREDICTION | PERSONAL",
  "category": "String category name",
  "verdict": "REPLACEMENT FOR PLACEHOLDERS: [[Item Name]] (Year) etc. or RED summary",
  "detailedAnalysis": "2 long paragraphs of revelation.",
  "reasoning": "1-sentence logic",
  "recommendationLink": "Optional URL for recommendations",
  "perspectives": {
    "psychoanalysis": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "gestalt": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "russian_philosophy": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "german_philosophy": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "existential": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "theological": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "buddhist": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "post_modern": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "ancient_greeks": { "verdict": "...", "vote": "A|B|RESONANCE" },
    "ancient_romans": { "verdict": "...", "vote": "A|B|RESONANCE" }
  },
  "comparison": {
    "optionA": "Name of first option",
    "optionB": "Name of second option",
    "percentageA": number,
    "percentageB": number
  }
}

Respond ONLY with JSON. No meta-commentary.`;

  try {
    const rawContent = await generateOracleText(`Analyze and Decree with Chaos Influence ${chaosScore}%: "${query}". Respond ONLY with JSON.`, sysInstruction, true);
    let data;
    try {
      const cleaned = cleanJsonResponse(rawContent);
      if (!cleaned || !cleaned.startsWith('{')) {
        throw new Error("Backend Proxy returned non-JSON content");
      }
      data = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error("[Oracle] JSON parse failed on raw content:", parseErr.message, rawContent.substring(0, 100));
      throw new Error(`Failed to parse Oracle revelation: ${parseErr.message}`);
    }
    
    // Safety check for routing
    let finalizedType = data.type;
    if (finalizedType === 'RECOMMENDATION' && !isExplicit) {
        finalizedType = 'KNOWLEDGE';
    }
    
    // Force COMPARISON if it's a comparison query (e.g., "tea or coffee")
    if (isComp) {
        finalizedType = 'COMPARISON';
    }

    const oracleResponse: OracleResponse = {
      ...data,
      type: finalizedType || (isComp ? 'COMPARISON' : isExplicit ? 'RECOMMENDATION' : 'KNOWLEDGE'),
      perspectives: data.perspectives || {},
      sources: [],
      textModelUsed: 'Pollinations-OpenAI',
      detailedAnalysis: ensureString(data.detailedAnalysis || data.analysis || data.revelation || "The void remains silent on the specifics, yet the essence is clear."),
      verdict: ensureString(data.verdict || data.decree || data.winner || "The choice is made."),
      title: ensureString(data.title || data.header || "A Whispered Decree"),
      category: ensureString(data.category || "ONTOLOGY")
    };

    // Clean up binary markers (YES/NO/MAYBE) if the query is not binary, or if it's a comparison/recommendation
    const isBinary = isBinaryQuery(query);
    if (!isBinary || isComp || isExplicit) {
        oracleResponse.verdict = oracleResponse.verdict.replace(/\[\[(YES|NO|MAYBE)\]\]\s*/gi, '');
    }

    // Synchronize votes and calculate percentages if it's a comparison
    if (isComp && oracleResponse.comparison) {
      let votesA = 0;
      let votesB = 0;
      
      for (const key of PERSPECTIVE_KEYS) {
        const pKey = key as keyof OracleResponse['perspectives'];
        const p = oracleResponse.perspectives[pKey];
        
        if (!p) {
          // If AI missed a key, fill it with a random vote to maintain 10 votes
          const randomVote = Math.random() > 0.5 ? "A" : "B";
          oracleResponse.perspectives[pKey] = {
            philosopherName: selectedPerspectives[key].philosopherName,
            philosopherThemes: selectedPerspectives[key].philosopherThemes,
            vote: randomVote,
            verdict: "The philosopher remains silent, yet their presence is felt."
          };
          if (randomVote === "A") votesA++; else votesB++;
        } else {
          // Ensure philosopher details are attached
          p.philosopherName = selectedPerspectives[key].philosopherName;
          p.philosopherThemes = selectedPerspectives[key].philosopherThemes;
          
          // Force vote to A or B if it's invalid
          if (p.vote !== "A" && p.vote !== "B") {
            p.vote = Math.random() > 0.5 ? "A" : "B";
          }
          
          if (p.vote === "A") votesA++; else votesB++;
        }
      }
      
      // Override percentages based on actual votes
      oracleResponse.comparison.percentageA = (votesA / 10) * 100;
      oracleResponse.comparison.percentageB = (votesB / 10) * 100;
      
      // Clean up any extra keys the AI might have added
      const cleanedPerspectives: any = {};
      for (const key of PERSPECTIVE_KEYS) {
        cleanedPerspectives[key] = oracleResponse.perspectives[key as keyof OracleResponse['perspectives']];
      }
      oracleResponse.perspectives = cleanedPerspectives;

    } else {
      for (const key of PERSPECTIVE_KEYS) {
        const pKey = key as keyof OracleResponse['perspectives'];
        if (!oracleResponse.perspectives[pKey]) {
          oracleResponse.perspectives[pKey] = {
            philosopherName: selectedPerspectives[key].philosopherName,
            philosopherThemes: selectedPerspectives[key].philosopherThemes,
            vote: "RESONANCE",
            verdict: "Awaiting deeper synchronization."
          };
        } else {
          const p = oracleResponse.perspectives[pKey];
          p.philosopherName = selectedPerspectives[key].philosopherName;
          p.philosopherThemes = selectedPerspectives[key].philosopherThemes;
          if (p.vote !== 'A' && p.vote !== 'B') {
            p.vote = "RESONANCE";
          }
        }
      }
      
      // Clean up extra keys even in non-comparison mode
      const cleanedPerspectives: any = {};
      for (const key of PERSPECTIVE_KEYS) {
        cleanedPerspectives[key] = oracleResponse.perspectives[key as keyof OracleResponse['perspectives']];
      }
      oracleResponse.perspectives = cleanedPerspectives;
    }

    const searchTopic = oracleResponse.verdict.replace(/\[\[|\]\]/g, '');
    oracleResponse.sources = [
      { title: "Universal Query: " + oracleResponse.title, uri: `https://www.google.com/search?q=${encodeURIComponent(oracleResponse.title)}` },
      { title: "Sourcing Deep Metadata", uri: `https://www.google.com/search?q=${encodeURIComponent(searchTopic + ' official source reviews')}` }
    ];

    const img = await regenerateOracleImage(oracleResponse, theme, chaosScore, query);
    oracleResponse.imageUrl = img.url;
    oracleResponse.imageStyleLabel = img.label;
    oracleResponse.isFallback = img.isFallback;
    
    return oracleResponse;
  } catch (err) {
    console.error("Council deliberation failed", err);
    return {
      type: 'KNOWLEDGE',
      isDecision: false,
      title: 'Echo from the Void',
      verdict: 'Logic Fractured.',
      category: 'ONTOLOGY',
      reasoning: 'API Error.',
      detailedAnalysis: 'The council has retreated into the static.',
      perspectives: {} as any,
      imageUrl: `https://image.pollinations.ai/prompt/abstract-void-chaos?model=cogview-3&nologo=true`
    } as OracleResponse;
  }
}

export async function regenerateOracleImage(response: OracleResponse, theme: 'SUPREMATIST' | 'IMPRESSIONIST', chaosScore: number, originalQuery?: string, force = false) {
  const isSuprematist = theme === 'SUPREMATIST';
  
  // Defensive access to title to prevent "undefined (reading title)"
  const titleVal = response?.title || "Decree";
  const cleanTitle = ensureString(titleVal).replace(/\[\[|\]\]/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const cleanQuery = originalQuery ? originalQuery.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 150) : "";
  
  let style = '';
  if (isSuprematist) {
    style = 'Suprematism art, geometric painting in the style of Kazimir Malevich, bold primary colors, stark geometric shapes, abstract composition on white background, museum quality';
  } else {
    const impressionistKeywords = [
      'dappled sunlight through trees', 'vibrant color palette', 'visible textured brushstrokes', 
      'fleeting moment captured in light', 'atmospheric perspective', 'soft edges', 
      'shimmering reflections on water', 'garden scene with flowers', 'bustling Parisian street',
      'ethereal morning mist', 'golden hour lighting', 'loose painterly style',
      'impasto texture', 'broken color technique', 'en plein air', 'luminous shadows',
      'swirling brushwork', 'delicate color transitions', 'capturing the ephemeral'
    ];
    const masters = [
      'Pierre-Auguste Renoir', 'Claude Monet', 'Edgar Degas', 'Camille Pissarro', 
      'Berthe Morisot', 'Alfred Sisley', 'Mary Cassatt', 'Gustave Caillebotte'
    ];
    
    const randomKeywords = [...impressionistKeywords].sort(() => 0.5 - Math.random()).slice(0, 5).join(', ');
    const randomMaster = masters[Math.floor(Math.random() * masters.length)];
    const randomMaster2 = masters[Math.floor(Math.random() * masters.length)];
    
    style = `High-detail Impressionist oil painting, fine art masterpiece, ${randomKeywords}, in the style of ${randomMaster} and ${randomMaster2}, rich impasto textures, expressive light and shadow, museum lighting`;
  }
  
  const divinePrompt = `${style}, an evocative and detailed visualization of "${cleanTitle}" related to "${cleanQuery}", high resolution, artistic masterpiece, 8k resolution`;

  // Pollinations is main API
  const seed = Math.floor(Math.random() * 1000000);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(divinePrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
  
  // If force is true, we skip Pollinations and go straight to CogView (silent fallback)
  if (force) {
    try {
      const cogViewUrl = await callOracleVision(divinePrompt);
      return { url: cogViewUrl, label: 'CogView-3-Flash', isFallback: true };
    } catch (e) {
      return { url: pollinationsUrl, label: 'Pollinations-Vision', isFallback: false };
    }
  }
  
  return { url: pollinationsUrl, label: 'Pollinations-Vision', isFallback: false };
}

export async function translateOracleResponse(response: OracleResponse, targetLanguage: 'EN' | 'RU'): Promise<OracleResponse> {
  const sys = "Translate the Oracle JSON perfectly. Respond ONLY with JSON.";
  const prompt = `Translate to ${targetLanguage}: ${JSON.stringify(response)}`;
  try {
    const raw = await generateOracleText(prompt, sys, true);
    const translated = JSON.parse(cleanJsonResponse(raw));
    return { ...response, ...translated, language: targetLanguage };
  } catch (e) {
    return { ...response, language: targetLanguage };
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function stopSpeaking() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource = null;
  }
}

export async function speakText(text: string, language: 'EN' | 'RU'): Promise<{ source: any } | null> {
  const cleanText = text.replace(/\[\[|\]\]|\(\(|\)\)/g, '').trim();
  if (!cleanText) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const voiceName = language === 'RU' ? 'Puck' : 'Kore';
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak as a high-oracle: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;
    if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    stopSpeaking();
    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    currentSource = source;
    const shimSource = { onstart: null as null | (() => void), onend: null as null | (() => void), onerror: null as null | (() => void) };
    source.addEventListener('ended', () => { if (shimSource.onend) shimSource.onend(); });
    setTimeout(() => { if (shimSource.onstart) shimSource.onstart(); }, 0);
    return { source: shimSource };
  } catch (err) {
    console.error("TTS failure", err);
    return null;
  }
}

export async function fetchPerspectiveAnalysis(key: string, phil: string, query: string, verdict: string, themes: string[], lang: 'EN' | 'RU', chaos: number, isFallback: boolean) {
  // STRICT EXCLUSION logic for "Awaiting deeper synchronization."
  const isUnsynchronized = verdict && verdict.toLowerCase().includes("awaiting deeper synchronization");
  const verdictContext = isUnsynchronized ? "" : ` and the primary revelation: "${verdict}"`;
  
  const sys = `You are the philosopher ${phil}. 
Provide your specialized perspective on the seeker's query: "${query}"${verdictContext}. 

CRITICAL: 
1. Speak exclusively in your unique historical or academic style. 
2. Use exactly 2 paragraphs. No JSON. No markdown headers. 
3. Incorporate your themes: ${themes.join(', ')}. 
4. Language: ${lang}.
${isUnsynchronized ? "Note: The primary council consensus is still being calculated. Formulate your independent wisdom based on the seeker's query alone." : ""}`;

  return await generateOracleText(`Deliver your symposium report.`, sys, false);
}
