import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabaseClient } from '@/src/lib/supabaseClient';
import { theme } from '@/theme';

/**
 * Auth Callback Handler
 *
 * Handles error redirects from Supabase auth.
 * With OTP-only auth, this page primarily handles error cases.
 * Users enter the code directly in the signin page.
 */
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error parameters (e.g., expired link clicked from old email)
        const errorParam = params.error as string | undefined;
        const errorDescription = params.error_description as string | undefined;

        if (errorParam) {
          let errorMessage = 'Authentication failed';
          if (errorParam === 'access_denied' || errorParam === 'otp_expired') {
            errorMessage = 'expired';
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(String(errorDescription)).replace(/\+/g, ' ');
          }
          router.replace(`/signin?error=${encodeURIComponent(errorMessage)}`);
          return;
        }

        // Check if user has an existing session
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
          // No session, redirect to signin
          router.replace('/signin');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/signin');
      }
    };

    handleAuthCallback();
  }, [router, params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.xl }}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
        Redirecting...
      </Text>
    </View>
  );
}
