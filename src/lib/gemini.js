import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converts any image File to JPEG via canvas, then wraps it as a Gemini part.
 * Uses FileReader (reliable, works for all formats including HEIC previews)
 * then draws on canvas to normalize to JPEG before sending to Gemini.
 * @param {File} file 
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>}
 */
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Always export as JPEG — universally supported by Gemini
                const base64Data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    },
                });
            };

            img.onerror = () => {
                // Last resort: send raw data as-is and let Gemini try
                const base64Data = reader.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    },
                });
            };

            // Use the dataURL from FileReader (same path that works for previews)
            img.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Analyzes listing content for prohibited items.
 * @param {File} imageFile - The image file to analyze.
 * @param {string} title - The title of the listing.
 * @param {string} description - The description of the listing.
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export async function analyzeContent(imageFile, title, description) {
    if (!API_KEY) {
        return {
            allowed: false,
            reason: "Configuration Error: AI API Key is missing. Please restart your development server to load the .env file."
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `
    You are a moderation AI for a student marketplace in India. 
    Analyze the following image and text (Title: "${title}", Description: "${description}") to see if it violates our safety policy.
    
    The following items are STRICTLY PROHIBITED:
    1. Regulated Substances: Alcohol, Tobacco, Vapes, E-cigarettes, Drugs/Narcotics, Medicines (Prescription/OTC without license).
    2. Adult Content: Sexual wellness products (Condoms, Contraceptives, Sex toys), Pornography, Nudity.
    3. Hygiene Risks: Used undergarments, used cosmetics/makeup.
    4. Weapons: Guns, Knives, Explosives.
    5. Government/Counterfeit: Police uniforms, IDs, Fake documents.

    Look for visual cues in the image AND keywords in the text.
    Context matters: "Boxers" (dog) is okay, "Used Boxers" (underwear) is NOT. "Chemistry Textbook" is okay, "Chemistry Lab Chemicals" is NOT.

    Return ONLY a JSON object with this structure:
    {
      "allowed": boolean,
      "reason": "string (short explanation for user if blocked, else null)"
    }
    `;

        const imagePart = await fileToGenerativePart(imageFile);

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if Gemini returns them
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);

    } catch (error) {
        // Re-throw rate limit errors so caller can fallback to OpenAI
        if (error.message?.includes('429') || error.message?.includes('quota')) {
            throw error;
        }
        // Other errors (network, parsing, etc.) — fail open with a warning
        console.warn("AI Moderation unavailable, failing open:", error.message);
        return { allowed: true };
    }
}

const CATEGORY_KEYWORDS = {
    clothes: ['hoodie', 'shirt', 'pant', 'shoe', 'dress', 'clothing', 'top', 'jeans', 'tshirt', 'jacket'],
    mobiles_laptops: ['macbook', 'laptop', 'iphone', 'samsung', 'phone', 'desktop', 'computer', 'ipad', 'tablet'],
    electronics: ['headphones', 'charger', 'buds', 'airpods', 'keyboard', 'mouse', 'monitor', 'speaker', 'earphone', 'cable'],
    furniture: ['table', 'chair', 'bed', 'mattress', 'lamp', 'desk', 'sofa', 'furnish'],
    books: ['book', 'novel', 'textbook', 'notebook', 'study'],
    sports: ['bat', 'ball', 'gym', 'weight', 'football', 'cricket', 'sports', 'racket'],
    vehicles: ['cycle', 'bicycle', 'scooter', 'bike', 'scooty'],
    stationery: ['pen', 'pencil', 'calculator', 'file', 'folder', 'scale'],
    instruments: ['guitar', 'piano', 'violin', 'drum', 'flute', 'musical']
};

export async function categorizeListing(title, description) {
    const textToMatch = `${title} ${description}`.toLowerCase();

    // First Pass: Keywords (Instant and Precise for common items)
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => textToMatch.includes(keyword))) {
            return category;
        }
    }

    if (!API_KEY) return 'accessories';

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const prompt = `Classify into ONE: "clothes", "mobiles_laptops", "electronics", "furniture", "books", "sports", "vehicles", "accessories", "stationery", "instruments". Title: "${title}", Description: "${description}". Return only the slug.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().toLowerCase();

        const validCategories = ["clothes", "mobiles_laptops", "electronics", "furniture", "books", "sports", "vehicles", "accessories", "stationery", "instruments"];
        const found = validCategories.find(c => text.includes(c));
        return found || 'accessories';

    } catch (error) {
        console.error("AI Categorization Error:", error);
        return 'accessories';
    }
}
