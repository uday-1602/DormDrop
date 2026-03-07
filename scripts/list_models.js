import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load env vars manually since we are running this script directly with node
dotenv.config({ path: './.env' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // For listing models, we don't need a specific model instance, 
        // but the SDK structure usually implies getting a model first or using the manager.
        // Actually, the JS SDK doesn't expose listModels directly on the main class easily in all versions.
        // Let's try to just fetch a definitive model like 'gemini-pro' to check connectivity first,
        // or use the rest API via fetch if SDK is limited.

        // Attempting via REST to be strictly sure about what the raw API sees.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("Error listing models:", data);
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();
