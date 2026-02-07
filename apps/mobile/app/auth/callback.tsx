import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text, Linking } from 'react-native';
import { supabaseClient } from '@/src/lib/supabaseClient';
import { theme } from '@/theme';

/**
 * Parses tokens from URL (Supabase uses hash: flowcatalyst://auth/callback#access_token=...&refresh_token=...)
 */
function parseTokensFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');
  const fragment = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';
  const query = queryIdx >= 0 ? url.slice(queryIdx + 1).split('#')[0] : '';

  const parse = (s: string) => {
    const params: Record<string, string> = {};
    s.split('&').forEach((p) => {
      const eq = p.indexOf('=');
      if (eq < 0) return;
      const k = decodeURIComponent(p.slice(0, eq));
      const v = decodeURIComponent(p.slice(eq + 1).replace(/\+/g, ' '));
      if (k && v) params[k] = v;
    });
    return params;
  };

  const fromFragment = fragment ? parse(fragment) : {};
  const fromQuery = query ? parse(query) : {};
  const merged = { ...fromQuery, ...fromFragment };
  return {
    access_token: merged.access_token,
    refresh_token: merged.refresh_token,
  };
}

async function createSessionFromUrl(url: string): Promise<boolean> {
  try {
    const { access_token, refresh_token } = parseTokensFromUrl(url);
    if (!access_token) return false;

    const { error } = await supabaseClient.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('createSessionFromUrl error:', err);
    return false;
  }
}

/**
 * Auth Callback Handler
 *
 * Handles magic link redirects from Supabase.
 * When user clicks the magic link, the app opens with flowcatalyst://auth/callback#...
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error parameters in URL (e.g., expired link)
        const errorParam = params.error as string | undefined;
        const errorDescription = params.error_description as string | undefined;

        if (errorParam) {
          let errorMessage = 'Authentication failed';
          if (errorParam === 'access_denied' || errorParam === 'otp_expired') {
            errorMessage = 'expired';
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription).replace(/\+/g, ' ');
          }
          router.replace(`/signin?error=${encodeURIComponent(errorMessage)}`);
          return;
        }

        // Get URL that opened the app (magic link) - tokens are in hash
        const url = await Linking.getInitialURL();
        if (url && (url.includes('access_token') || url.includes('#access_token'))) {
          const ok = await createSessionFromUrl(url);
          if (ok) {
            router.replace('/');
            return;
          }
        }

        // Fallback: check existing session (e.g. tokens already processed)
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
          if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
            router.replace('/signin?error=expired');
          } else {
            router.replace('/signin');
          }
          return;
        }

        if (session) {
          router.replace('/');
        } else {
          router.replace('/signin');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/signin');
      }
    };

    handleAuthCallback();
  }, [router, params]);

  // Handle URL when app is already open (warm start)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (url && (url.includes('access_token') || url.includes('#access_token'))) {
        const ok = await createSessionFromUrl(url);
        if (ok) router.replace('/');
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
        Signing you in...
      </Text>
    </View>
  );
}
