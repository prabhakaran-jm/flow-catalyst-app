# Flow Catalyst – Production Deployment

Commands and steps to deploy **Supabase Edge Functions** and build the **Android app** for production with EAS.

---

## Part 1: Deploy Supabase Edge Functions

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- [Supabase project](https://supabase.com/dashboard) created
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF` (from project root)

### 1.1 Push database migrations

```bash
supabase db push
```

### 1.2 Set Edge Function secrets

In **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**, add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Project Settings → API |
| `AI_PROVIDER` | `openrouter` or `gemini` |
| `OPENROUTER_API_KEY` | Your OpenRouter key (if using openrouter) |
| `OPENROUTER_MODEL` | `openrouter/free` |
| `GEMINI_API_KEY` | Your Gemini key (if using gemini) |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `DAILY_RUN_LIMIT` | `3` (optional, default) |

**Never set** `ALLOW_DEV_AUTH_BYPASS` in production.

### 1.3 Deploy all Edge Functions

From the **project root**:

```bash
# Using Docker (recommended)
supabase functions deploy run-catalyst --no-verify-jwt
supabase functions deploy create-catalyst
supabase functions deploy refine
supabase functions deploy refine-coach --no-verify-jwt
```

**If Docker is unavailable**, use `--use-api`:

```bash
supabase functions deploy run-catalyst --no-verify-jwt --use-api
supabase functions deploy create-catalyst --use-api
supabase functions deploy refine --use-api
supabase functions deploy refine-coach --no-verify-jwt --use-api
```

**Note:** `--no-verify-jwt` is required for `run-catalyst` and `refine-coach` so built-in coaches work for anonymous users.

### 1.4 Verify functions

In **Supabase Dashboard** → **Edge Functions**, confirm all four functions are deployed and active.

---

## Part 2: Build Android app with EAS

### Prerequisites

- [Expo account](https://expo.dev/signup)
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- Logged in: `eas login`

### 2.1 Configure EAS secrets (production env)

Set environment variables for the production build:

```bash
cd apps/mobile

# Supabase
eas secret:create --name SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co" --scope project --type string
eas secret:create --name SUPABASE_ANON_KEY --value "YOUR_ANON_KEY" --scope project --type string
eas secret:create --name EDGE_FUNCTION_BASE_URL --value "https://YOUR_PROJECT.supabase.co/functions/v1" --scope project --type string

# Auth redirect (required for magic link on Android)
eas secret:create --name AUTH_REDIRECT_WEB_URL --value "https://your-web-app.vercel.app" --scope project --type string

# RevenueCat (for paywall)
eas secret:create --name REVENUECAT_API_KEY_IOS --value "appl_xxxx" --scope project --type string
eas secret:create --name REVENUECAT_API_KEY_ANDROID --value "goog_xxxx" --scope project --type string
```

Or set them in **Expo Dashboard** → **Project** → **Secrets**.

### 2.2 Link secrets to production profile

In `eas.json`, the production profile uses environment variables that EAS injects from secrets. Ensure your project has the correct `projectId` in `app.json` / `app.config.js`.

### 2.3 Build Android for production

```bash
cd apps/mobile

# Production AAB (for Play Store)
eas build --platform android --profile production
```

This produces an **app bundle (AAB)** for Google Play submission.

### 2.4 Build preview APK (optional, for testing)

To test without Play Store:

```bash
eas build --platform android --profile preview
```

This builds an APK with `skipRevenueCat: true` and Test Navigation (Set Pro/Set Free).

---

## Quick reference

| Task | Command |
|------|---------|
| Link Supabase | `supabase link --project-ref YOUR_REF` |
| Push migrations | `supabase db push` |
| Deploy functions | `supabase functions deploy run-catalyst --no-verify-jwt` (repeat for each) |
| Deploy all (no Docker) | Add `--use-api` to each deploy |
| EAS build Android | `cd apps/mobile && eas build --platform android --profile production` |
| EAS build preview | `cd apps/mobile && eas build --platform android --profile preview` |

---

## Post-deploy checklist

- [ ] Edge Functions respond at `https://YOUR_PROJECT.supabase.co/functions/v1/...`
- [ ] Auth redirect URLs include `flowcatalyst://auth/callback` (and web URL if used)
- [ ] RevenueCat entitlement `pro` and offerings are configured
- [ ] EAS build completes and download link is available
