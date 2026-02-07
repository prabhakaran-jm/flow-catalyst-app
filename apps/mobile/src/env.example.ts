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

  /**
   * Base URL for Supabase Edge Functions
   * Example: https://your-project-id.supabase.co/functions/v1
   */
  EDGE_FUNCTION_BASE_URL: 'YOUR_EDGE_FUNCTION_BASE_URL_HERE',

  /**
   * Web URL for magic link redirect (required for Android).
   * Android strips hash fragments from deep links, so tokens in #access_token=... are lost.
   * Set this to your deployed web app URL (e.g. https://yourapp.vercel.app).
   * The magic link will open this URL first; the page redirects to the app with query params.
   */
  AUTH_REDIRECT_WEB_URL: 'YOUR_WEB_APP_URL_HERE',

  /**
   * RevenueCat API Key
   * Get this from RevenueCat Dashboard > Project Settings > API Keys
   * Use different keys for iOS and Android
   * 
   * For Expo, you can use Platform.select() or set via environment variables
   */
  REVENUECAT_API_KEY_IOS: 'YOUR_REVENUECAT_IOS_API_KEY_HERE',
  REVENUECAT_API_KEY_ANDROID: 'YOUR_REVENUECAT_ANDROID_API_KEY_HERE',
} as const;

/**
 * Type-safe environment variables
 * Update this type when adding new environment variables
 */
export type Env = typeof env;
