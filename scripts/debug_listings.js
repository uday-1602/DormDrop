
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await s.from('listings').select('title, description, category');
if (error) {
    console.error(error);
} else {
    console.log(data);
}
process.exit(0);
