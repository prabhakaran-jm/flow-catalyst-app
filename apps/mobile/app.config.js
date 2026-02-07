/**
 * Expo app config with EAS environment variable injection.
 *
 * EAS Build injects env vars (SUPABASE_URL, etc.) at build time.
 * This config merges them into expo.extra so the app can read them
 * via Constants.expoConfig.extra.
 *
 * Set variables in EAS Dashboard or: eas env:create --name SUPABASE_URL --value "..." --environment production
 */
const base = require('./app.json');

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    // Ensure flowcatalyst:// deep links open in app (magic link auth)
    android: {
      ...base.expo.android,
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            { scheme: 'flowcatalyst', host: '*', pathPrefix: '/' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      ...(base.expo.plugins || []),
      'expo-asset',
      'expo-font',
    ],
    updates: {
      url: 'https://u.expo.dev/1ab86178-046a-4e57-9bd7-94505216d86c',
      checkAutomatically: 'NEVER', // Avoid launch crashes; use manual update checks
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      ...base.expo.extra,
      // Skip RevenueCat on preview/internal builds - SDK can crash when app is sideloaded (not from Play Store)
      skipRevenueCat: process.env.EAS_BUILD_PROFILE === 'preview' || process.env.EAS_BUILD_PROFILE === 'development',
      // Inject EAS env vars at build time (fallback to placeholders for local dev)
      supabaseUrl: process.env.SUPABASE_URL || base.expo.extra.supabaseUrl,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || base.expo.extra.supabaseAnonKey,
      edgeFunctionBaseUrl: process.env.EDGE_FUNCTION_BASE_URL || base.expo.extra.edgeFunctionBaseUrl,
      REVENUECAT_API_KEY_IOS: process.env.REVENUECAT_API_KEY_IOS || base.expo.extra.REVENUECAT_API_KEY_IOS,
      REVENUECAT_API_KEY_ANDROID: process.env.REVENUECAT_API_KEY_ANDROID || base.expo.extra.REVENUECAT_API_KEY_ANDROID,
    },
  },
};
