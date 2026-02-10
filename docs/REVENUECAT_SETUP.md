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

## How the paywall works (after the fix)

### Two ways the paywall can show

1. **RevenueCat UI (modal)** — Used in **production** when RevenueCat is configured (`skipRevenueCat` is false). The app calls `presentPaywall()` from `RevenueCatProvider`, which uses `RevenueCatUI.presentPaywall()` and shows RevenueCat’s hosted paywall as a **modal** (pricing, purchase, restore handled by the SDK).
2. **Custom paywall screen (route `/paywall`)** — Used when:
   - **skipRevenueCat** is true (preview/dev builds): testers see “Set Pro” / “Free for demo” and no real store.
   - **RevenueCat UI fails** (e.g. Error 23): after the user dismisses the error popup, the app opens the custom paywall so they can use **Restore** or **Retry** and still reach pricing if the config is fixed.

### What happens when the user taps “Upgrade” (or similar)

- **If skipRevenueCat:** The app navigates to `/paywall` (custom screen). User can tap “Set Pro” (testing) or see “Free for demo” options.
- **If RevenueCat is enabled:** The app calls `await presentPaywall()`. That:
  1. Calls `RevenueCatUI.presentPaywall()` and shows the **RevenueCat modal** (current offering, Monthly/Annual, Subscribe, Restore).
  2. Returns `{ unlocked: boolean; showCustomPaywall: boolean }`:
     - **unlocked = true** → User purchased or restored in the modal; entitlements were refreshed and the user has Pro. The caller (e.g. index or catalyst screen) may then navigate (e.g. to Create Coach or the coach run).
     - **unlocked = false, showCustomPaywall = true** → RevenueCat UI failed (e.g. Error 23) or threw. The caller **navigates to `/paywall`** so the user sees the **custom paywall** (Restore, Retry, “Pricing not available” if offerings still fail).
     - **unlocked = false, showCustomPaywall = false** → User cancelled or paywall was not presented. No navigation; user stays on the same screen.

So in the success path: **tap Upgrade → RevenueCat modal → purchase or restore → Pro unlocked**. In the error path: **tap Upgrade → RevenueCat modal shows error popup → user dismisses → app opens custom paywall** so they can Retry or Restore.

### Custom paywall screen (`/paywall`)

- **Data:** Uses `Purchases.getOfferings()` (via `fetchOfferings()` in the provider). Packages are derived from the current offering (e.g. monthly, annual).
- **Loading:** Shows “Loading pricing…” while `loadingOfferings` is true. A **client-side timeout (12 s)** sets `offeringsTimedOut`; after that the screen shows **“Pricing not available yet.”** and a **Retry** button instead of spinning forever.
- **Retry:** Tapping Retry calls `fetchOfferings()` again and clears the timeout so loading can run again.
- **Restore:** “Restore purchase” calls `restorePurchases()` and refreshes entitlements; if the user has an active subscription they get Pro.
- **Unlock Pro:** Enabled only when there are packages (or in demo mode). Tapping it runs `purchasePackage(selectedPackage)` (or in demo, `setPlanForTesting('pro')`).

### Summary

| Build / situation        | What the user sees                          |
|--------------------------|---------------------------------------------|
| Production, config OK    | RevenueCat modal → purchase/restore → Pro   |
| Production, Error 23     | Error popup → dismiss → custom paywall      |
| Preview / dev            | Custom paywall (Set Pro / Free for demo)    |

**Paywall linked to offering:** On the offering detail page (Product catalog → Offerings → **default**), the **Paywall** tab may show "No paywall is linked to this offering". That's OK: RevenueCat still shows a **default paywall** (lists all packages). To use a custom design and copy, click **Add Paywall** (or the Paywall tab), create a paywall in the Paywalls editor, and link it to the **default** offering.

## Paywall troubleshooting (pricing not loading / Unlock Pro disabled)

Goal: **Pricing shows → user taps Monthly or Yearly → store sheet opens → after purchase, Pro unlocks** (same as a working submission).

### Checklist

1. **RevenueCat Dashboard**
   - **Apps:** iOS app with bundle ID `com.flowcatalyst.app` (and Android if you ship Android). Shared Secret (iOS) set.
   - **Products:** Product IDs match the store exactly: e.g. `flow_catalyst_monthly`, `flow_catalyst_annual`.
   - **Offerings:** The **Current** offering (e.g. **default**) has at least two packages (e.g. `$rc_monthly`, `$rc_annual`), each linked to the correct product. If the offering’s **Paywall** tab says "No paywall is linked", the SDK still shows a default paywall; use **Add Paywall** only if you want a custom design.
   - **Entitlements:** Entitlement identifier is **`pro`** (matches the app code).

2. **App Store Connect (iOS)**
   - **Monetization → Subscriptions:** Subscription group exists; subscriptions with IDs `flow_catalyst_monthly` and `flow_catalyst_annual` exist and have a price.
   - **App version (e.g. 1.0):** In-App Purchases section shows both subscriptions attached.
   - **Agreements:** Paid apps agreement and bank/tax forms completed if required.

3. **Google Play (Android, if used)**
   - **Monetize → Subscriptions:** Monthly and annual products created with the same IDs as in RevenueCat.
   - App at least in **internal testing** so Play Billing can resolve products.

4. **API keys in the build**
   - **Production EAS build:** EAS Dashboard → your project → Environment variables → **production** → `REVENUECAT_API_KEY_IOS` (and `REVENUECAT_API_KEY_ANDROID` for Android) set to the **public** app-specific key (e.g. `appl_...` for iOS). Rebuild after changing env vars.
   - **Local/dev:** `apps/mobile/src/env.ts` (or env.example) has the same keys so the paywall can load offerings in dev.

5. **Testing**
   - **iOS:** Use a **Sandbox** Apple ID (App Store Connect → Users and Access → Sandbox → Testers). On device: Settings → App Store → Sandbox Account → sign in. Then open the app, go to paywall, tap a subscription; the sandbox purchase sheet should appear and no real charge.
   - **Android:** Add license testers in Play Console; use a test card in the purchase flow.

### Debug logs

In development, the app enables RevenueCat **debug** logging and prints hints when offerings fail:

- Run the app from the repo (e.g. `npx expo start` or a dev build) and open the paywall.
- Watch Metro (or device logs) for `[RevenueCat]` messages: they indicate whether offerings loaded or why they might have failed.
- Fix any misconfig (product IDs, offering packages, API key) then try again; use **Retry** on the paywall to refetch offerings.

### Error 23: "There is an issue with your configuration"

When RevenueCat UI shows **"Error 23: There is an issue with your configuration"**, it means RevenueCat got the offerings from its API (steps 1–2), but when the SDK asked Apple/Google for the actual product details, the **store rejected the request** (steps 3–4). RevenueCat has no visibility into that store error—it’s almost always a **platform configuration** issue.

**Behavior:** User sees the error popup → app falls back to the custom paywall (`/paywall`) → custom paywall may show "Pricing not available" and **Retry**.

**Identifiers this app expects:**

| Layer | Identifier | Where to check |
|--------|-------------|-----------------|
| Store product IDs | `flow_catalyst_monthly`, `flow_catalyst_annual` | App Store Connect / Google Play Console |
| RevenueCat entitlement | `pro` | RevenueCat Dashboard → Entitlements |
| RevenueCat packages | `$rc_monthly`, `$rc_annual` | RevenueCat Dashboard → Offerings → default |
| Bundle ID | `com.flowcatalyst.app` | App Store Connect + RevenueCat app config |

---

#### App Store Connect (iOS)

1. **Paid Applications Agreement signed?**
   - App Store Connect → **Agreements, Tax, and Banking** → "Paid Apps" must be **active (green)**.  
   - This is the **#1 cause of Error 23**—without it, Apple blocks all product lookups.

2. **Products exist and are in the right state?**
   - App Store Connect → Your App → **Monetization** → **Subscriptions**.
   - Two products with exactly: `flow_catalyst_monthly`, `flow_catalyst_annual`.
   - Status must be **"Ready to Submit"** or **"Approved"**—not "Missing Metadata" or "Developer Action Needed".
   - Each needs: display name, description, price, review screenshot, review notes.

3. **Subscription group configured?**
   - Both products in the **same subscription group**; group must have a localization (display name).

4. **Bundle ID matches?**
   - App Store Connect app bundle ID must be exactly **`com.flowcatalyst.app`**, and match RevenueCat Dashboard → Apps → iOS app configuration.

5. **Sandbox tester configured?**
   - App Store Connect → **Users and Access** → **Sandbox** → **Sandbox Testers** (at least one).
   - On device: **Settings → App Store → Sandbox Account** (iOS 16+) must be signed in with that account.

---

#### Google Play Console (Android)

1. **Products created?**  
   Monetize → Products → Subscriptions: `flow_catalyst_monthly`, `flow_catalyst_annual`, each with at least one base plan.

2. **App on a testing track?**  
   App must be published to at least **internal testing** before products resolve. Testing → Internal testing → upload an AAB.

3. **License testers added?**  
   Settings → License testing → add your Google account email.

---

#### RevenueCat Dashboard

1. **Products linked correctly?**  
   Products → both store product IDs listed with **green checkmark** (validated by the store). Yellow/red = store hasn’t accepted that ID.

2. **Offerings configured?**  
   Offerings → **"default"** exists and is **Current**; contains `$rc_monthly` → `flow_catalyst_monthly`, `$rc_annual` → `flow_catalyst_annual`.

3. **Entitlement wired?**  
   Entitlements → **`pro`** exists; both products attached to `pro`.

4. **API key correct?**  
   Project Settings → API Keys: iOS `appl_...`, Android `goog_...`, matching EAS environment variables.

---

#### Quick diagnostic

With RevenueCat debug logging (e.g. `Purchases.setLogLevel(DEBUG)` in dev), look for:

- `[Purchases] - INFO: Offerings fetched successfully` ← RevenueCat step OK  
- `[Purchases] - ERROR: Error fetching products` ← store step failed  

If you see "Offerings fetched" but "Error fetching products", confirm: product IDs match character-for-character in the store; products are not stuck in "Missing Metadata"; Paid Apps agreement is signed (iOS) or app is on a testing track (Android).

### Pricing not loading (Infinite Spinner)

If the custom paywall spins on "Loading pricing…" forever:

- **Timeout:** The app has a 12-second client-side timeout. If offerings don't load by then, it shows **"Pricing not available"** and a **Retry** button.
- **Cause:** Usually a missing API key or network issue.
- **Fix:** Check `REVENUECAT_API_KEY_IOS` in your `env.ts` (local) or EAS Secrets (production). Ensure you are connected to the internet.

### If it still fails

- Confirm you are testing on a **production** (or at least store-signed) build with the correct EAS production env vars. Preview/dev builds use `skipRevenueCat` and will not load real offerings.
- Ensure the build’s bundle ID / package name matches the app in RevenueCat and in App Store Connect / Play Console.

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
