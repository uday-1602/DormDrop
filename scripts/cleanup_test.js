
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanupTestMessages() {
    console.log('Cleaning up test messages...');

    // Delete messages containing "Real-time check"
    const { data, error } = await supabase
        .from('messages')
        .delete()
        .like('content', '%Real-time check%');

    if (error) {
        console.error('Error during cleanup:', error);
    } else {
        console.log('✅ Cleanup complete. All test messages removed.');
    }
}

cleanupTestMessages();
