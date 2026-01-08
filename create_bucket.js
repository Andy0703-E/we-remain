
import { createClient } from '@supabase/supabase-js';
import { supabase } from './src/supabase.js';

async function createBucket() {
    console.log("Attempting to create 'chat-images' bucket...");

    // Attempt 1: Using the existing exported client (might lack admin rights depending on key)
    try {
        const { data, error } = await supabase
            .storage
            .createBucket('chat-images', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

        if (error) {
            console.error("Error creating bucket:", error);
        } else {
            console.log("Bucket 'chat-images' created successfully:", data);
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

createBucket();
