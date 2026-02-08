# RevenueCat Setup Guide

This guide configures RevenueCat so the paywall shows real offerings and judges can test purchases. Without this, the app shows "No offerings available".

## Prerequisites

- [RevenueCat account](https://app.revenuecat.com)
- API keys from Project Settings > API Keys
- App Store Connect (iOS) and/or Google Play Console (Android) apps created

## 1. Add API Keys to the App

In `apps/mobile/src/env.ts`:

```typescript
REVENUECAT_API_KEY_IOS: 'appl_xxxxxxxx',      // iOS public key
REVENUECAT_API_KEY_ANDROID: 'goog_xxxxxxxx',  // Android public key
```

For EAS builds, also add these to `eas.json` under `build.env` or as secrets.

## 2. Create Entitlement

1. RevenueCat Dashboard → **Entitlements**
2. Create entitlement with identifier: **`pro`** (must match the code)
3. Pro unlocks: unlimited runs, Create Coach, all built-in coaches, Magic Wand

## 3. Create Offering and Packages

1. RevenueCat Dashboard → **Offerings**
2. Create/select **Current** offering
3. Add packages:

| Identifier   | Type    | Product (App Store / Play Console) |
|-------------|---------|------------------------------------|
| `$rc_monthly` | Monthly | e.g. `flow_catalyst_monthly`        |
| `$rc_annual`  | Annual  | e.g. `flow_catalyst_annual`         |

4. Link each package to the corresponding product in App Store Connect / Google Play Console.

## 4. Store Products

### App Store Connect (iOS)

1. My Apps → Your App → Subscriptions
2. Create subscription group (e.g. "Pro")
3. Create products: monthly and annual
4. Use the same product IDs as in RevenueCat

### Google Play Console (Android)

1. Monetize → Products → Subscriptions
2. Create monthly and annual subscriptions
3. Use the same product IDs as in RevenueCat

## 5. Verify Setup

- Paywall should show pricing instead of "No offerings available"
- Use Test Navigation **Set Pro** for quick testing without store setup
- See `docs/REVENUECAT_TESTING.md` for sandbox testing

## 6. Server-Side Pro Bypass (Optional)

The `profiles.plan` column controls server-side rate limiting. Pro users skip the 3/day limit.

**To set Pro for testing:** In Supabase SQL editor or Studio:
```sql
UPDATE profiles SET plan = 'pro' WHERE id = 'user-uuid-here';
```

**Production:** Use a RevenueCat webhook to update `profiles.plan` when a user subscribes/cancels.

## Quick Test Without Store Setup

Use a **preview** EAS build (`eas build --profile preview`):

- Test Navigation shows **Set Pro** / **Set Free**
- Tap **Set Pro** to unlock all features
- No RevenueCat products required

**Set Pro + Custom Coach:** When using preview builds with **Set Pro**, the app sends `X-Test-Pro: true`. Set `ALLOW_TEST_PLAN_OVERRIDE=true` in Supabase Edge Function secrets so the server bypasses the rate limit. (Without this, you must manually set `profiles.plan = 'pro'` in the database.)
