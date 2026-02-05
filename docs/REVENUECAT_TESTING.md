# Testing RevenueCat Integration Locally

This guide covers multiple approaches to test RevenueCat subscription functionality during local development.

## Prerequisites

1. **RevenueCat Account Setup** (if not done):
   - Create account at https://app.revenuecat.com
   - Create a project
   - Get API keys from Project Settings > API Keys
   - Add keys to `apps/mobile/src/env.ts`:
     ```typescript
     REVENUECAT_API_KEY_IOS: 'your_ios_key_here',
     REVENUECAT_API_KEY_ANDROID: 'your_android_key_here',
     ```

2. **Store Setup** (for real testing):
   - **iOS**: App Store Connect account + TestFlight setup
   - **Android**: Google Play Console + Internal Testing track

## Method 1: Using Built-in Test Function (Easiest)

The app includes a `setPlanForTesting` function that allows you to manually switch plans in development mode.

### Option A: Add Dev Menu Button (Recommended)

Add a temporary dev button to test plan switching:

**In `apps/mobile/app/index.tsx`**, add this near the header:

```typescript
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

// Inside your component:
const { plan, setPlanForTesting } = useRevenueCat();

// Add this button in your JSX (only in dev):
{__DEV__ && (
  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
    <TouchableOpacity 
      onPress={() => setPlanForTesting?.('free')}
      style={{ backgroundColor: 'red', padding: 8, borderRadius: 4 }}
    >
      <Text style={{ color: 'white' }}>Test: Free</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => setPlanForTesting?.('pro')}
      style={{ backgroundColor: 'green', padding: 8, borderRadius: 4 }}
    >
      <Text style={{ color: 'white' }}>Test: Pro</Text>
    </TouchableOpacity>
  </View>
)}
```

### Option B: Use React Native Debugger Console

In your React Native debugger console, you can access the function:

```javascript
// In React Native Debugger or Chrome DevTools
// Access the RevenueCat context and call setPlanForTesting
```

## Method 2: RevenueCat Sandbox Testing (iOS)

For iOS, you can test with real sandbox purchases:

### Setup Steps:

1. **Configure RevenueCat Dashboard**:
   - Go to RevenueCat Dashboard > Your Project
   - Set up an entitlement (e.g., "pro")
   - Create an offering with packages
   - Link products from App Store Connect

2. **Configure App Store Connect**:
   - Create your app in App Store Connect
   - Create subscription products (monthly/yearly)
   - Set up sandbox test accounts in Users and Access > Sandbox Testers

3. **Test on iOS Simulator/Device**:
   ```bash
   # Build and run on iOS
   cd apps/mobile
   pnpm ios
   ```

4. **Use Sandbox Test Account**:
   - When prompted, sign in with a sandbox test account (not your real Apple ID)
   - Complete the purchase flow
   - RevenueCat will recognize it as a sandbox purchase
   - The subscription will be active immediately (sandbox subscriptions don't expire)

### Sandbox Test Account Notes:
- Use email format: `test+something@example.com`
- Password can be anything (8+ characters)
- Sandbox purchases don't charge real money
- Subscriptions renew every 5 minutes (for testing)
- You can cancel immediately in App Store settings

## Method 3: RevenueCat Sandbox Testing (Android)

For Android, use Google Play Billing Library sandbox:

### Setup Steps:

1. **Configure RevenueCat Dashboard**:
   - Same as iOS: entitlements, offerings, packages
   - Link products from Google Play Console

2. **Configure Google Play Console**:
   - Create your app
   - Create subscription products
   - Upload an app bundle (even a draft is fine)
   - Add testers in Internal Testing track

3. **Test on Android Emulator/Device**:
   ```bash
   # Build and run on Android
   cd apps/mobile
   pnpm android
   ```

4. **Use Test Account**:
   - Sign in with a Google account added to Internal Testing
   - Complete purchase flow
   - Google Play will use test billing (no real charges)

### Android Test Account Notes:
- Must be added to Internal Testing track in Play Console
- Test purchases don't charge real money
- Subscriptions renew every 5 minutes
- Can be cancelled immediately

## Method 4: RevenueCat Debug Mode

Enable RevenueCat debug logging to see what's happening:

**In `apps/mobile/src/providers/RevenueCatProvider.tsx`**, add after `Purchases.configure`:

```typescript
// Enable debug logging (development only)
if (__DEV__) {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}
```

This will show detailed logs in your console about:
- API calls to RevenueCat
- Entitlement checks
- Purchase flow
- Error details

## Method 5: Mock RevenueCat Responses (Advanced)

For unit testing or when stores aren't set up, you can mock RevenueCat:

**Create `apps/mobile/src/providers/RevenueCatProvider.mock.tsx`**:

```typescript
// Mock implementation for testing
export function useRevenueCat() {
  return {
    plan: 'pro' as const, // or 'free'
    refreshEntitlements: async () => {},
    purchasePro: async () => {},
    setPlanForTesting: (plan: 'free' | 'pro') => {
      console.log('Mock: Setting plan to', plan);
    },
  };
}
```

Then conditionally import:
```typescript
const useRevenueCat = __DEV__ && USE_MOCK 
  ? require('./RevenueCatProvider.mock').useRevenueCat
  : require('./RevenueCatProvider').useRevenueCat;
```

## Testing Checklist

- [ ] Plan state updates correctly (`free` vs `pro`)
- [ ] Paywall screen displays correctly
- [ ] Purchase flow initiates
- [ ] Purchase completion updates plan
- [ ] Plan persists after app restart
- [ ] User ID syncs with RevenueCat (check RevenueCat Dashboard)
- [ ] Entitlements refresh correctly
- [ ] Error handling works (cancel, network errors)

## Common Issues

### "No offerings available"
- **Fix**: Ensure offerings are configured in RevenueCat Dashboard
- Check that packages are linked to products
- Verify products exist in App Store Connect / Play Console

### "Purchase cancelled" when testing
- **Fix**: This is normal - user cancellation is handled gracefully
- Check console logs for actual error details

### Plan not updating after purchase
- **Fix**: Call `refreshEntitlements()` after purchase
- Check RevenueCat Dashboard to verify purchase was recorded
- Ensure entitlement identifier matches (`'pro'` in code vs dashboard)

### API key errors
- **Fix**: Verify keys in `env.ts` match RevenueCat Dashboard
- Ensure you're using the correct platform key (iOS vs Android)
- Check that keys don't have extra spaces or quotes

## Quick Test Script

Add this to your app for quick testing:

```typescript
// In any screen, add this dev-only button:
{__DEV__ && (
  <TouchableOpacity
    onPress={async () => {
      const { plan, refreshEntitlements, setPlanForTesting } = useRevenueCat();
      console.log('Current plan:', plan);
      console.log('Refreshing entitlements...');
      await refreshEntitlements();
      console.log('Plan after refresh:', plan);
    }}
  >
    <Text>Debug: Refresh Plan</Text>
  </TouchableOpacity>
)}
```

## Next Steps

Once local testing works:
1. Test on TestFlight (iOS) or Internal Testing (Android)
2. Test subscription renewal flow
3. Test restore purchases functionality
4. Test subscription cancellation
5. Monitor RevenueCat Dashboard for analytics

## Resources

- [RevenueCat Docs](https://docs.revenuecat.com/)
- [iOS Sandbox Testing](https://docs.revenuecat.com/docs/ios-products)
- [Android Testing](https://docs.revenuecat.com/docs/android-products)
- [RevenueCat Dashboard](https://app.revenuecat.com)
