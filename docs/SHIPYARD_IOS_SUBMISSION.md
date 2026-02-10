# Shipyard: iOS submission checklist (Apple only)

Use this to get your app on TestFlight with a working RevenueCat paywall for Shipyard judging.

---

## Reconfiguring for a new Expo account

If you switched to a new Expo account:

1. **Unlink old project (already done in this repo)**  
   The old EAS `projectId` has been removed from `apps/mobile/app.json`. The updates URL in `app.config.js` uses whatever `projectId` is in `expo.extra.eas` (or a placeholder until you run `eas init`).

2. **Log in and create a new project**  
   From repo root or `apps/mobile`:
   ```bash
   eas login
   ```
   Log in with your **new** Expo account. Then, from **`apps/mobile`** (the directory that contains the mobile app’s `app.json`):
   ```bash
   cd apps/mobile
   eas init
   ```
   When prompted, choose **Create a new project**. EAS will create a project for the new account and write the new `projectId` into `apps/mobile/app.json` under `expo.extra.eas`.

3. **Re-add EAS environment variables**  
   In [Expo Dashboard](https://expo.dev) → **your new project** → Environment variables → **Production**, set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `EDGE_FUNCTION_BASE_URL`
   - `REVENUECAT_API_KEY_IOS`
   - `AUTH_REDIRECT_WEB_URL` (if using magic link)

   Then run your production build from `apps/mobile`:  
   `eas build --profile production --platform ios`.

---

## 0. Pre-build checklist (avoid wasting credits)

Before running `eas build --profile production --platform ios`:

- [ ] **EAS production env vars** set: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `EDGE_FUNCTION_BASE_URL`, `REVENUECAT_API_KEY_IOS` (and `AUTH_REDIRECT_WEB_URL` if using magic link). Check: Expo dashboard → project → Environment variables → Production.
- [ ] **App Store Connect**: Version 1.0 has both subscriptions attached (Flow Catalyst Monthly, Flow Catalyst Annual). Version submitted or at least “Prepare for Submission” so a build can be linked.
- [ ] **RevenueCat**: Default offering has packages with “monthly” and “annual” in the identifier; products linked to App Store (flow_catalyst_monthly, flow_catalyst_annual).
- [ ] **Local sanity**: `pnpm install` in repo root and `apps/mobile`; no uncommitted changes that would affect the build if you need to reproduce.

---

## 1. EAS environment variables (production)

In [EAS Dashboard](https://expo.dev) → your project → **Secrets** (or **Environment variables**) → **Production**, set:

| Variable | Required | Notes |
|----------|----------|--------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `EDGE_FUNCTION_BASE_URL` | Yes | `https://<project>.supabase.co/functions/v1` |
| `REVENUECAT_API_KEY_IOS` | Yes | RevenueCat → Project Settings → API Keys (iOS) |
| `AUTH_REDIRECT_WEB_URL` | If using magic link | e.g. your Vercel app URL |

Or via CLI:  
`eas env:create --name REVENUECAT_API_KEY_IOS --value "appl_xxx" --environment production`  
(Repeat for each variable.)

---

## 2. App Store Connect (subscriptions + version)

1. **App Store Connect** → [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → your app **Flow Catalyst**.
2. **Subscriptions**: Ensure **Flow Catalyst Monthly** and **Flow Catalyst Annual** are **Ready to Submit** (screenshots/metadata done).
3. **App Store** tab → open the version you will submit (e.g. **1.0**) or create it.
4. In that version, find **In-App Purchases and Subscriptions** → **+** → add both subscriptions (Flow Catalyst Monthly, Flow Catalyst Annual). Save.
5. **Submit for Review** (the app version with the subscriptions).  
   First subscription must be submitted with an app version. Once the version is “Waiting for Review”, sandbox can usually return products; after approval they are fully available.

---

## 3. Build and upload (EAS)

From project root:

```bash
# Install EAS CLI if needed: npm i -g eas-cli
eas build --profile production --platform ios
```

When the build finishes, either:

- **Automatic submit**:  
  `eas submit --latest --platform ios --profile production`
- **Manual**: In EAS build page, use “Submit to App Store Connect”.  
  Ensure the build is linked to the **same app and version** in App Store Connect (bundle ID `com.flowcatalyst.app`).

---

## 4. TestFlight (public link for Shipyard)

1. **App Store Connect** → your app → **TestFlight** tab.
2. Wait for the build to finish processing (can take 10–30 min).
3. **External Testing**:
   - Create an **External** group if you don’t have one.
   - Add the build to that group.
   - Submit the group for **Beta App Review** (required for external testing). Once approved, you get a **public link**.
4. Copy the **public TestFlight link** (e.g. “https://testflight.apple.com/join/XXXXXX”).  
   This is the link you paste into **Devpost** for “App Access”.

Judges (and you) can install via that link. They will use **Sandbox**: no real payment; they can complete a subscription in sandbox to verify RevenueCat.

---

## 5. Before you submit on Devpost

- [ ] TestFlight build installs and launches.
- [ ] You can open the paywall and see **pricing** (Monthly / Annual).
- [ ] You can tap **Unlock Pro** and complete a **sandbox** purchase (use a Sandbox Apple ID in Settings → App Store → Sandbox Account if needed).
- [ ] Demo video (2–3 min) shows onboarding → core features → paywall and subscription flow.
- [ ] Written proposal, technical docs (RevenueCat + architecture), and developer bio are ready.

---

## 6. Subscribe without real payment (Sandbox)

When you install the app from **TestFlight** (or run from Xcode), in-app purchases use **Sandbox** — **no real charge**.

1. **Create a Sandbox tester**: App Store Connect → **Users and Access** → **Sandbox** → **Testers** → add an Apple ID (use a separate email; it’s for testing only).
2. On your **iPhone**: **Settings → App Store → Sandbox Account** → sign in with that Sandbox account (not your real Apple ID).
3. Install the app from the TestFlight link and open it. Go to the paywall and tap **Unlock Pro**. The purchase sheet will show **[Environment: Sandbox]** and complete with no real payment. You can subscribe and test Pro features; the “subscription” is for testing only and will renew on a shortened sandbox schedule.

Judges (and you) can test the full subscribe flow this way without being charged.

---

## Quick reference

| Item | Value |
|------|--------|
| Bundle ID | `com.flowcatalyst.app` |
| EAS submit (production iOS) | `ascAppId`: 6758994240 (from your eas.json) |
| Build profile for Shipyard | `production` (uses real RevenueCat; no stub) |
