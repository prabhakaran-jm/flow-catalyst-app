import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabaseClient } from '@/src/lib/supabaseClient';
import { theme } from '@/theme';

/**
 * Auth Callback Handler
 * 
 * Handles magic link redirects from Supabase.
 * This route is called when a user clicks the magic link in their email.
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
          // Handle specific error cases
          let errorMessage = 'Authentication failed';
          
          if (errorParam === 'access_denied' || errorParam === 'otp_expired') {
            errorMessage = 'expired';
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription).replace(/\+/g, ' ');
          }
          
          // Redirect to sign-in with error message
          router.replace(`/signin?error=${encodeURIComponent(errorMessage)}`);
          return;
        }

        // Wait a moment for Supabase to process the URL hash fragments
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Supabase will automatically parse the URL tokens if detectSessionInUrl is enabled
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          // Check if it's an expired link error
          if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
            router.replace('/signin?error=expired');
          } else {
            router.replace('/signin');
          }
          return;
        }

        if (session) {
          // Successfully authenticated, redirect to home
          router.replace('/');
        } else {
          // No session found, redirect to sign-in
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary }}>
        Signing you in...
      </Text>
    </View>
  );
}
