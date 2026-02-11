import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/lib/queryClient';
import { SupabaseProvider } from '@/src/providers/SupabaseProvider';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

// Use stub when sideloaded (preview build) - avoids RevenueCat native SDK crash
const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat;
const RevenueCatProvider = skipRevenueCat
  ? require('@/src/providers/RevenueCatProvider.stub').RevenueCatProvider
  : require('@/src/providers/RevenueCatProvider').RevenueCatProvider;
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
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
              <Stack.Screen name="index" options={{ title: 'Choose Your Coach' }} />
              <Stack.Screen name="history" options={{ title: 'My Library' }} />
              <Stack.Screen name="saved" options={{ title: 'Saved' }} />
              <Stack.Screen name="history/[id]" options={{ title: 'Saved Run' }} />
              <Stack.Screen name="saved/[id]" options={{ title: 'Saved' }} />
              <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
              <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
              <Stack.Screen name="catalyst/[id]" options={{ title: 'Coach' }} />
              <Stack.Screen name="catalyst/[id]/edit" options={{ title: 'Edit Coach' }} />
              <Stack.Screen name="coaches" options={{ title: 'Coaches' }} />
              <Stack.Screen name="catalyst/create" options={{ title: 'Create Coach' }} />
              <Stack.Screen name="paywall" options={{ title: 'Upgrade' }} />
            </Stack>
          </QueryClientProvider>
        </RevenueCatProvider>
        </SupabaseProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
