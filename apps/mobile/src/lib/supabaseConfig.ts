/**
 * Supabase Configuration
 * 
 * This is a placeholder file. In production, you should:
 * 1. Use environment variables (via expo-constants or react-native-config)
 * 2. Or use Expo's Constants.expoConfig.extra for build-time config
 * 
 * For now, you can:
 * - Copy src/env.example.ts to src/env.ts and import from there
 * - Or update this file directly with your Supabase credentials
 * - Or use EXPO_PUBLIC_ environment variables
 */

// Option 1: Use environment variables (recommended for Expo)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Option 2: Import from env.ts if you create it from env.example.ts
// import { env } from '../env';

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  // Or use: url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY,
};
