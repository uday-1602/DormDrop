
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sendTestMessage() {
    console.log('Fetching users and listings...');

    // Get two distinct users
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(2);
    if (userError || !users || users.length < 2) {
        console.error('Need at least 2 users to test chat.', userError || 'Only found ' + (users?.length || 0));
        return;
    }

    // Get a listing
    const { data: listings, error: listingError } = await supabase.from('listings').select('id').limit(1);
    if (listingError || !listings || listings.length === 0) {
        console.error('No listings found.', listingError);
        return;
    }

    const listingId = listings[0].id;
    const senderId = users[1].id;
    const receiverId = users[0].id; // We'll assume the first user is the one we want to notify

    console.log(`Sending message from ${senderId} to ${receiverId} for listing ${listingId}`);

    const { data, error } = await supabase.from('messages').insert([
        {
            listing_id: listingId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: '🔋 Real-time check at ' + new Date().toLocaleTimeString(),
            read: false
        }
    ]).select();

    if (error) {
        console.error('Error inserting message:', error);
    } else {
        console.log('✅ Message inserted successfully:', data[0].id);
    }
}

sendTestMessage();
