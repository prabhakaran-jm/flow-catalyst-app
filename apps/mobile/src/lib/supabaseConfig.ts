/**
 * Supabase Configuration
 *
 * For local Supabase: Android emulator cannot reach 127.0.0.1 (it refers to the emulator itself).
 * Use 10.0.2.2 to reach the host machine's localhost from Android emulator.
 */
import { Platform } from 'react-native';
import { env } from '../env';

function getSupabaseUrl(): string {
  const url = env.SUPABASE_URL;
  // Android emulator needs 10.0.2.2 to reach host's localhost
  if (Platform.OS === 'android' && url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

function getEdgeFunctionBaseUrl(): string {
  const url = env.EDGE_FUNCTION_BASE_URL;
  if (Platform.OS === 'android' && url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export const supabaseConfig = {
  get url() {
    return getSupabaseUrl();
  },
  anonKey: env.SUPABASE_ANON_KEY,
  get edgeFunctionBaseUrl() {
    return getEdgeFunctionBaseUrl();
  },
};
