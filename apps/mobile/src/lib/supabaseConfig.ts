/**
 * Supabase Configuration
 *
 * For local Supabase: Android emulator cannot reach 127.0.0.1 (it refers to the emulator itself).
 * Use 10.0.2.2 to reach the host machine's localhost from Android emulator.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get env values from env.ts (local) or Expo Constants (EAS build)
function getEnvValue(key: string): string {
  try {
    // Try to import env.ts (works locally)
    const { env } = require('../env');
    return env[key as keyof typeof env] || '';
  } catch {
    // Fallback to Expo Constants (works in EAS builds)
    const extra = Constants.expoConfig?.extra || {};
    // Map env keys to app.json extra keys
    const keyMap: Record<string, string> = {
      SUPABASE_URL: 'supabaseUrl',
      SUPABASE_ANON_KEY: 'supabaseAnonKey',
      EDGE_FUNCTION_BASE_URL: 'edgeFunctionBaseUrl',
      AUTH_REDIRECT_WEB_URL: 'authRedirectWebUrl',
    };
    return extra[keyMap[key] || key] || '';
  }
}

function getSupabaseUrl(): string {
  const url = getEnvValue('SUPABASE_URL');
  // Android emulator needs 10.0.2.2 to reach host's localhost
  if (Platform.OS === 'android' && url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

function getEdgeFunctionBaseUrl(): string {
  const url = getEnvValue('EDGE_FUNCTION_BASE_URL');
  if (Platform.OS === 'android' && url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export const supabaseConfig = {
  get url() {
    return getSupabaseUrl();
  },
  get anonKey() {
    return getEnvValue('SUPABASE_ANON_KEY');
  },
  get edgeFunctionBaseUrl() {
    return getEdgeFunctionBaseUrl();
  },
  get authRedirectWebUrl() {
    return getEnvValue('AUTH_REDIRECT_WEB_URL');
  },
};
