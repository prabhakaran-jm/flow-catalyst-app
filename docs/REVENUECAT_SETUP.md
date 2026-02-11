# RevenueCat Setup Guide

This guide configures RevenueCat so the paywall shows real offerings and judges can test purchases. Without this, the app shows "No offerings available".

## Demo / judging without real purchases

For **demos and judging**, use the **same build** you ship (internal or production). You do **not** need to switch to RevenueCat’s “Test configuration” API key for the build you give to judges.

- **Android (Google Play):** Add judges’ **Gmail addresses** as **License testers**: Play Console → **Settings** → **License testing** → add addresses. When they install from Internal testing and tap “Subscribe”, they see the real paywall but **are not charged**; the subscription is in test mode. **If you get a real bank/payment approval** during Internal Testing, the **Google account signed in on the device** is not in the License testers list—add that Gmail in Play Console → **Settings** → **License testing** (no app update needed).
- **iOS:** Add judges as **Sandbox testers** in App Store Connect (Users and Access → Sandbox → Testers). They sign in with that Sandbox Apple ID on the device; TestFlight purchases use sandbox and are not charged.

RevenueCat’s **Test configuration** (test API key, sandbox mode) is for builds that **never talk to the store** (e.g. automated tests). For live demos and judging, use license testers / sandbox testers so the app still talks to the store and shows real pricing, without real money.

### Downgrade after a test purchase

To test the free tier again (or run the purchase flow again) after a test subscription:

- **Android (Google Play):** On the device: **Play Store** → **Menu** (☰) → **Subscriptions** (or **Account** → **Payments and subscriptions** → **Subscriptions**). Find **Flow Catalyst** and tap **Cancel subscription**. Access continues until the current period ends; then the app will show the free plan. You can also **Clear app data** for the app (Settings → Apps → Flow Catalyst → Storage → Clear data) so the next launch re-checks entitlements—useful if the subscription has already expired in test mode.
- **iOS (Sandbox):** On the device: **Settings** → **Apple ID** (top) → **Subscriptions** → select the app → **Cancel Subscription**. Sandbox subscriptions use shortened renewal times (e.g. monthly renews in 5 minutes), so they expire quickly. To get a "fresh" user with no subscription, sign out of the Sandbox account: **Settings** → **App Store** → **Sandbox Account** → Sign out; then sign in with a different Sandbox tester or the same one after the subscription has lapsed.

After cancelling, open the app again; use **Restore purchase** on the paywall if you expect an active subscription, or wait for the period to end so the app shows the free tier.

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

## Android / Play Store integration (step-by-step)

Use the same product IDs and entitlement as iOS so one offering works on both platforms.

### 1. Google Play Console: create app and subscriptions

1. Go to [Google Play Console](https://play.google.com/console).
2. **Create the app** (if not already): Add app → Fill in details → Create. Use **package name** exactly: **`com.flowcatalyst.app`** (must match `apps/mobile/app.json` → `expo.android.package`).
3. **Subscriptions:**
   - Left menu → **Monetize** → **Products** → **Subscriptions**.
   - If you only see “Your app doesn’t have any subscriptions yet” and **Upload a new APK** (no “Create subscription” button), upload an AAB first: **Test and release** → **Internal testing** → **Create new release** → upload your AAB (e.g. from `eas build --platform android --profile production`) → **Save** and **Start rollout**. Then return to **Monetize** → **Products** → **Subscriptions**; **Create subscription** should appear.
   - Click **Create subscription** and create two subscriptions with these **Product IDs** (must match RevenueCat and the code):

| Product ID                 | Type        | Notes                    |
|----------------------------|------------|--------------------------|
| `flow_catalyst_monthly`    | Subscription | Add at least one base plan (monthly). |
| `flow_catalyst_annual`    | Subscription | Add at least one base plan (yearly).  |

4. For each product: set **name**, **description**, and at least one **base plan** (price and billing period). Save and activate.
5. **Put the app on a testing track** (required for products to resolve):
   - **Testing** → **Internal testing** (or Closed testing) → **Create new release** → Upload an **AAB** (e.g. from `eas build --platform android --profile production`) → Save and start rollout.
6. **License testers** (so you can test purchases without being charged):
   - **Settings** (gear) → **License testing** → Add the **Gmail** addresses that will test purchases.

### 2. Google Cloud: service account for RevenueCat

RevenueCat needs a **service account** to verify Google Play purchases.

1. Open [Google Cloud Console](https://console.cloud.google.com) and select (or create) the project **linked to your Play Console** (Play Console → Settings → Developer account → API access uses this project).
2. **IAM & Admin** → **Service accounts** → **Create service account**.
   - Name: e.g. `RevenueCat` → Create → Done.
3. Create a **JSON key** for that service account:
   - Click the service account → **Keys** → **Add key** → **Create new key** → **JSON** → Create. Save the `.json` file securely.
4. **Grant the service account access in Play Console:**
   - Play Console → left menu → **Users and permissions** ([direct link](https://play.google.com/console/users-and-permissions)).
   - Click **Invite new users**.
   - In **Email address**, enter the **service account email** from your JSON key (the `client_email` value, e.g. `something@your-project.iam.gserviceaccount.com`).
   - Open the **Account permissions** tab and grant at least:
     - **View app information and download bulk reports (read-only)**
     - **View financial data, orders, and cancellation survey responses**
     - **Manage orders and subscriptions** (if available; otherwise “View financial data” is often enough for RevenueCat).
   - Under **App access**, ensure the service account has access to your **Flow Catalyst** app (e.g. “All apps” or select the app).
   - Click **Invite user** (or **Send invite**). The service account will appear in the users list; it does not need to “accept” the invite.
   - It can take **up to 24–36 hours** for Google to propagate permissions; RevenueCat may show “credentials need attention” until then.

5. **Enable Google Play APIs in the same Google Cloud project** (required for RevenueCat to validate):
   - [Google Cloud Console](https://console.cloud.google.com) → select the **same project** where you created the service account.
   - **APIs & Services** → **Library** → search and **Enable**:
     - **Google Play Android Developer API** ([direct link](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com))
     - **Google Play Developer Reporting API** ([direct link](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com))
   - Without these, RevenueCat will show “Could not validate subscriptions API”, “Permissions to call inappproducts API”, and “Permissions to call monetization API”.

### 3. RevenueCat: add Android app and credentials

1. [RevenueCat Dashboard](https://app.revenuecat.com) → your project.
2. **Apps** → **+ New** → **Google Play**.
   - **App name:** Flow Catalyst (or any label).
   - **Package name:** `com.flowcatalyst.app` (must match Play Console and `app.json`).
   - Save.
3. **Service account credentials:**
   - Open the new Android app in RevenueCat → **Service account** (or **Credentials**) section.
   - Upload the **JSON key file** you downloaded from Google Cloud (or paste its contents if the UI allows). Save.
4. **Products:** Under this Android app, add products:
   - **Google Play Product ID:** `flow_catalyst_monthly`.
   - **Google Play Product ID:** `flow_catalyst_annual`.
5. **Entitlement:** Use the same **`pro`** entitlement as iOS. In **Entitlements** → **pro** → **Attach** (or **Associated products**) → attach both Android products.
6. **Offerings:** Use the same **default** offering. In **Offerings** → **default** → **Packages**:
   - Ensure **$rc_monthly** has the **Android** product `flow_catalyst_monthly` linked (in addition to iOS if already set).
   - Ensure **$rc_annual** has the **Android** product `flow_catalyst_annual` linked.
7. **API Keys:** Copy the **Public app-specific API key** for this Android app (starts with `goog_`). You’ll use it in the app and EAS.

### 4. Put the Android API key in the app

- **EAS builds (production):**  
  EAS Dashboard → your project → **Environment variables** → **production** → add:
  - **REVENUECAT_API_KEY_ANDROID** = `goog_xxxxxxxx` (your Android public key).

- **Local / env:**  
  In `apps/mobile/src/env.ts` (or env.example):
  - `REVENUECAT_API_KEY_ANDROID: 'goog_xxxxxxxx'`

Production builds read from `Constants.expoConfig.extra.REVENUECAT_API_KEY_ANDROID`, which EAS injects from the environment variable.

### 5. Build and test on Android

1. Build an Android AAB with the key set:  
   `eas build --platform android --profile production`
2. Upload the AAB to **Internal testing** (or Closed testing) in Play Console if you haven’t already.
3. Install the app from the **Internal testing** link (or download from Play Console).
4. On the device, ensure you’re signed in with a **license tester** Gmail. Open the app → paywall → confirm offerings load and test purchase/restore.

**If products don’t load (Error 23 on Android):** Confirm the app is on at least **Internal testing** and the release is rolled out; confirm product IDs match exactly; wait up to 24–36 hours after adding the service account for RevenueCat to validate credentials.

#### “Credentials need attention” (subscriptions / inappproducts / monetization API)

If RevenueCat shows **Credentials need attention** with red Xs for **subscriptions API**, **inappproducts API**, or **monetization API**:

1. **Google Cloud:** In the **same project** as the service account, enable:
   - [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
   - [Google Play Developer Reporting API](https://console.cloud.google.com/apis/library/playdeveloperreporting.googleapis.com)
2. **Play Console → Users and permissions:** Open the invited service account and ensure **Account permissions** include:
   - **View app information and download bulk reports (read-only)** (for inappproducts)
   - **View financial data, orders, and cancellation survey responses** (for subscriptions + monetization)
   - **Manage orders and subscriptions** (for subscriptions)
3. **App access:** Under **App permissions** for that user, ensure your **Flow Catalyst** app is included (or “All apps”).
4. **Re-upload** the same JSON in RevenueCat and click the refresh icon to re-validate. Changes can take **up to 24–36 hours** to propagate; a workaround that sometimes speeds validation: in Play Console → **Monetize** → **Products** → **Subscriptions**, edit one product’s description, save, then revert if you like.

#### “Illegal parameters pub_sub_topic_id” (Google developer notifications)

If you get this error when saving after connecting Pub/Sub:

- **Invalid topic name:** The Topic ID must be a full resource name like `projects/PROJECT_ID/topics/TOPIC_NAME`. The **topic name** (the part after `topics/`) must not end with a hyphen and must exist in Google Cloud Pub/Sub. If you see something like `.../topics/Play-Store-` (trailing hyphen or truncated), it can cause this error.
- **Fix:** In RevenueCat, click **Disconnect from Google** (you must disconnect before changing the Topic ID). Then click **Connect to Google** again so RevenueCat generates a **new** topic ID. Do not manually edit the topic to end with a hyphen or leave it incomplete. Copy the new topic ID into Play Console → **Monetize** → **Monetization setup** → **Real-time developer notifications** → Topic name, then **Save** in Play Console. Back in RevenueCat, click **Save changes**.
- **Pub/Sub API:** Ensure [Pub/Sub API](https://console.cloud.google.com/flows/enableapi?apiid=pubsub) is enabled in the **same** Google Cloud project as your service account.

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

See **Android / Play Store integration (step-by-step)** above for the full flow. Summary: create subscriptions `flow_catalyst_monthly` and `flow_catalyst_annual`, put the app on Internal testing, add license testers, create a Google Cloud service account and grant it access in Play Console, then add the Android app and upload the JSON key in RevenueCat and link the same products to the **default** offering and **pro** entitlement.

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
