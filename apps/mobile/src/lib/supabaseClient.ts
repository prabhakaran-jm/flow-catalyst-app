import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabaseConfig';

/**
 * Supabase Client
 * 
 * Creates and exports a configured Supabase client instance.
 * Reads configuration from supabaseConfig.ts (which should use environment variables).
 * 
 * @throws Error if SUPABASE_URL or SUPABASE_ANON_KEY are not configured
 */
function createSupabaseClient(): SupabaseClient {
  const { url, anonKey } = supabaseConfig;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables, or update src/lib/supabaseConfig.ts'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabaseClient = createSupabaseClient();
