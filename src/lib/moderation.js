import OpenAI from 'openai';
import { analyzeContent as analyzeGemini, categorizeListing } from './gemini';

// --- Configuration ---
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// --- Layer 1: Client-Side Text Filters (Zero Cost, Instant) ---
const PROHIBITED_KEYWORDS = [
    /vodka|whiskey|beer|wine|alcohol/i,
    /weed|marijuana|cannabis|cocaine|heroin|drugs/i,
    /vape|juul|e-cigarette|cigarette|tobacco/i,
    /condom|contraceptive|viagra|cialis/i,
    /porn|sex toy|vibrator/i,
    /gun|pistol|rifle|knife|weapon|explosive/i,
    /used pant|used underwear|used boxer|used bra/i
];

async function checkLocalText(text) {
    for (const regex of PROHIBITED_KEYWORDS) {
        if (regex.test(text.toLowerCase())) {
            return { allowed: false, reason: "Text contains prohibited keywords." };
        }
    }
    return { allowed: true };
}

// --- Layer 2: OpenAI omni-moderation (fallback when Gemini quota exhausted) ---
async function checkOpenAI(imageFile, title, description) {
    if (!OPENAI_KEY) return { allowed: true, skipped: true };

    try {
        const openai = new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true });

        // Convert image file to base64 data URL for OpenAI
        const base64DataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });

        const response = await openai.moderations.create({
            model: "omni-moderation-latest",
            input: [
                {
                    type: "image_url",
                    image_url: { url: base64DataUrl }
                },
                {
                    type: "text",
                    text: `${title} ${description}`
                }
            ]
        });

        const result = response.results[0];
        if (result.flagged) {
            // Find which category was flagged
            const flaggedCategory = Object.entries(result.categories)
                .find(([, flagged]) => flagged)?.[0] || 'policy violation';
            return {
                allowed: false,
                reason: `Content flagged by AI: ${flaggedCategory.replace(/_/g, ' ')}.`
            };
        }

        return { allowed: true };
    } catch (error) {
        console.warn("OpenAI moderation failed, skipping:", error.message);
        return { allowed: true }; // Fail open if OpenAI also unavailable
    }
}

// --- Main Safety Check ---
export async function checkSafety(imageFile, title, description) {
    const text = `${title} ${description}`;

    // 1. Instant local text check (no network, free)
    const textResult = await checkLocalText(text);
    if (!textResult.allowed) return textResult;

    // 2. Gemini AI (primary — free, 1500 req/day)
    //    Falls back to OpenAI if quota exceeded, then fails open if both unavailable.
    try {
        return await analyzeGemini(imageFile, title, description);
    } catch (error) {
        console.warn("Gemini unavailable, trying OpenAI fallback:", error.message);
        return await checkOpenAI(imageFile, title, description);
    }
}

export { categorizeListing };
