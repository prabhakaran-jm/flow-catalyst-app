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

// Disable automatic update checks on launch - can cause crashes if channel/runtime mismatch
const updatesConfig = {
  ...(base.expo.updates || {}),
  checkAutomatically: 'NEVER',
};

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    updates: updatesConfig,
    extra: {
      ...base.expo.extra,
      // Inject EAS env vars at build time (fallback to placeholders for local dev)
      supabaseUrl: process.env.SUPABASE_URL || base.expo.extra.supabaseUrl,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || base.expo.extra.supabaseAnonKey,
      edgeFunctionBaseUrl: process.env.EDGE_FUNCTION_BASE_URL || base.expo.extra.edgeFunctionBaseUrl,
      REVENUECAT_API_KEY_IOS: process.env.REVENUECAT_API_KEY_IOS || base.expo.extra.REVENUECAT_API_KEY_IOS,
      REVENUECAT_API_KEY_ANDROID: process.env.REVENUECAT_API_KEY_ANDROID || base.expo.extra.REVENUECAT_API_KEY_ANDROID,
    },
  },
};
