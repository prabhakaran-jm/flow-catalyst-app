import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { SupabaseProvider } from '@/src/providers/SupabaseProvider';
import { RevenueCatProvider } from '@/src/providers/RevenueCatProvider';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SupabaseProvider>
      <RevenueCatProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#1A1A1A',
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          >
            <Stack.Screen name="signin" options={{ title: 'Sign In', headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ title: 'Signing In', headerShown: false }} />
            <Stack.Screen name="index" options={{ title: 'Catalysts' }} />
            <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
            <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="catalyst/[id]" options={{ title: 'Run Catalyst' }} />
            <Stack.Screen name="catalyst/[id]/edit" options={{ title: 'Edit Catalyst' }} />
            <Stack.Screen name="catalyst/create" options={{ title: 'Create Catalyst' }} />
            <Stack.Screen name="paywall" options={{ title: 'Upgrade' }} />
          </Stack>
        </QueryClientProvider>
      </RevenueCatProvider>
    </SupabaseProvider>
  );
}
