import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporarily log the values to debug
console.log("Supabase URL from .env:", supabaseUrl);
console.log("Supabase Anon Key from .env:", supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);