
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

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

async function categorizeListing(title, description) {
    const textToMatch = `${title || ''} ${description || ''}`.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => textToMatch.includes(keyword))) {
            return category;
        }
    }
    return 'accessories'; // Default if no keywords match
}

async function backfill() {
    console.log("Fetching all listings...");
    const { data: listings } = await supabase
        .from('listings')
        .select('id, title, description');

    if (!listings || listings.length === 0) {
        console.log("No listings found.");
        return;
    }

    console.log(`Categorizing ${listings.length} listings using keyword logic...`);

    for (const listing of listings) {
        const category = await categorizeListing(listing.title, listing.description);
        console.log(`- ${listing.title} -> [${category}]`);
        await supabase
            .from('listings')
            .update({ category })
            .eq('id', listing.id);
    }

    console.log("✅ Backfill complete!");
}

backfill();
