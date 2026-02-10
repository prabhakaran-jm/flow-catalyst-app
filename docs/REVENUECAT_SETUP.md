# RevenueCat Setup Guide

This guide configures RevenueCat so the paywall shows real offerings and judges can test purchases. Without this, the app shows "No offerings available".

## Prerequisites

- [RevenueCat account](https://app.revenuecat.com)
- API keys from Project Settings > API Keys
- App Store Connect (iOS) and/or Google Play Console (Android) apps created

---

## iOS integration (step-by-step)

### 1. App Store Connect: subscription group and products

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **Flow Catalyst**.
2. In the left sidebar, open **Monetization** → **Subscriptions**.
3. **Create a subscription group** (e.g. name: **Pro**, reference: `pro`).
4. **Create two subscriptions** in that group:

| Product ID (use exactly)   | Type   | Duration | Price |
|---------------------------|--------|----------|--------|
| `flow_catalyst_monthly`   | Auto-renewable | 1 month | Your choice |
| `flow_catalyst_annual`    | Auto-renewable | 1 year  | Your choice |

5. Fill in **Reference name**, **Subscription display name**, and **Description** for each. Add at least one **Subscription price** and save.
6. **App-Specific Shared Secret** (needed for RevenueCat):
   - Go to **Apps** → **Flow Catalyst** → **App Information** (under General).
   - Under **App-Specific Shared Secret**, click **Generate** (or use an existing one).
   - Copy the secret; you’ll add it in RevenueCat in the next section.

### 2. RevenueCat: add iOS app and products

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com) → your project.
2. **Apps** → **+ New** → **App Store**.
   - **App name:** Flow Catalyst (or any label).
   - **Bundle ID:** `com.flowcatalyst.app`.
   - **Shared Secret:** paste the App-Specific Shared Secret from App Store Connect.
   - Save.
3. **API Keys:** copy the **Public app-specific API key** for this iOS app (starts with `appl_`). You’ll use it in the app and EAS.
4. **Entitlements** → create entitlement with identifier **`pro`** (must match the code).
5. **Products** (under the iOS app):
   - Add product with **App Store Connect Product ID**: `flow_catalyst_monthly`.
   - Add product with **App Store Connect Product ID**: `flow_catalyst_annual`.
6. **Offerings** → select **Current** (or create it):
   - Add package **`$rc_monthly`** → attach product `flow_catalyst_monthly`.
   - Add package **`$rc_annual`** → attach product `flow_catalyst_annual`.

### 3. Put the iOS API key in the app

- **EAS builds (TestFlight/App Store):**  
  EAS Dashboard → your project → **Environment variables** → **production** → add:
  - **REVENUECAT_API_KEY_IOS** = `appl_xxxxxxxx` (your iOS public key).

- **Local / env:**  
  If you use `apps/mobile/src/env.ts` (or env.example), set:
  - `REVENUECAT_API_KEY_IOS: 'appl_xxxxxxxx'`

Production builds already read from `Constants.expoConfig.extra.REVENUECAT_API_KEY_IOS`, which EAS injects from the environment variable above.

### 4. Test on iOS

- Install the app via TestFlight (or a production build).
- Use a **Sandbox** Apple ID (App Store Connect → Users and Access → Sandbox → Testers) to make test purchases.
- Open the paywall and confirm offerings load and purchase/restore work.

---

## 1. Add API Keys to the App (all platforms)

In `apps/mobile/src/env.ts` (if used locally):

```typescript
REVENUECAT_API_KEY_IOS: 'appl_xxxxxxxx',      // iOS public key
REVENUECAT_API_KEY_ANDROID: 'goog_xxxxxxxx',  // Android public key
```

For EAS builds, set **REVENUECAT_API_KEY_IOS** and **REVENUECAT_API_KEY_ANDROID** in EAS Dashboard → Project → Environment variables (production).

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

4. Link each package to the corresponding product in App Store Connect (iOS) or Google Play Console (Android).

## 4. Store Products

### App Store Connect (iOS)

See **iOS integration (step-by-step)** above. Summary: create a subscription group, add subscriptions with the same product IDs as in RevenueCat, and set the App-Specific Shared Secret in RevenueCat.

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
