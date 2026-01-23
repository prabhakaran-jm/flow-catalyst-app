/**
 * Environment Variables Example
 * 
 * Copy this file to env.ts and fill in your actual Supabase credentials.
 * 
 * IMPORTANT: Never commit env.ts to version control!
 * Add env.ts to .gitignore
 * 
 * For Expo, use EXPO_PUBLIC_ prefix for variables that should be available
 * in the client-side code.
 */

export const env = {
  /**
   * Your Supabase project URL
   * Example: https://your-project-id.supabase.co
   */
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',

  /**
   * Your Supabase anonymous/public key
   * This is safe to expose in client-side code
   * Find it in your Supabase project settings > API
   */
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
} as const;

/**
 * Type-safe environment variables
 * Update this type when adding new environment variables
 */
export type Env = typeof env;
