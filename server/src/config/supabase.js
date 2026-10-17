import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isConnected = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    isConnected = true;
    console.log('[CivicShield] Connected to Supabase PostgreSQL at:', supabaseUrl);
  } catch (err) {
    console.warn('[CivicShield] Supabase client initialization warning:', err.message);
  }
} else {
  console.log('[CivicShield] Running in Dual/Demo Mode (In-Memory + Seed Storage) - configure SUPABASE_URL in .env to connect to live Supabase.');
}

export { supabase, isConnected };
