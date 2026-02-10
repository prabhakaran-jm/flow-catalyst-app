# Flow Catalyst

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?logo=react)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Edge%20Functions-3ECF8E.svg?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.0-orange.svg?logo=pnpm)](https://pnpm.io)

Flow Catalyst is a minimalist, mobile-first AI coaching app for productivity-focused creators. It uses focused "Action Catalysts" and AI to turn abstract advice into instant, repeatable actions, with subscriptions powered by RevenueCat.

## Features

- **Magic Wand** – AI refines your input in real-time before generating
- **Value Levers** – Tune tone (Casual↔Formal, etc.) without writing prompts
- **5 Built-in Coaches** – Hook, Outline, Block Breaker, Clarity, Decision
- **Save & Library** – Save runs to history, browse past guidance
- **OTP Auth** – Sign in with 8-digit code (no password)
- **Free Tier** – 1 anonymous run, 3/day signed-in; Pro for unlimited + custom coaches

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: LLM API integration (via Edge Functions)
- **Payments**: RevenueCat for subscription management
- **State Management**: Zustand, React Query
- **Navigation**: Expo Router (file-based routing)

## Project Structure

```
flow-catalyst-app/
├── apps/
│   └── mobile/          # Expo React Native app
├── supabase/
│   ├── migrations/      # SQL migrations
│   └── functions/       # Edge Functions (Deno/TypeScript)
└── package.json         # Root package.json (pnpm workspaces)
```

## Local Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Supabase CLI (for local development)
- Expo CLI (or use `pnpm start`)

### 1. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install mobile app dependencies
cd apps/mobile
pnpm install
```

### 2. Configure Environment Variables

Create `apps/mobile/src/env.ts` from `apps/mobile/src/env.example.ts`:

```typescript
export const env = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
  EDGE_FUNCTION_BASE_URL: 'YOUR_EDGE_FUNCTION_BASE_URL_HERE',
} as const;
```

Or set environment variables:
```bash
export EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Start Supabase Local Development

```bash
# From project root
supabase start

# This will start:
# - PostgreSQL database (port 54322)
# - Supabase Studio (port 54323)
# - Edge Functions runtime
# - Auth service
```

### 4. Apply Database Migrations

```bash
# Apply migrations to local database
supabase db reset

# Or apply specific migration
supabase migration up
```

### 5. Deploy Edge Functions (Local)

```bash
# Serve functions with env vars from .env (required for OpenRouter/AI)
supabase functions serve create-catalyst run-catalyst refine --no-verify-jwt --env-file .env
```

### 6. Run Expo Mobile App

```bash
# From project root
pnpm dev

# Or from apps/mobile
cd apps/mobile
pnpm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web
```

## Edge Functions

Edge Functions are located in `supabase/functions/`:

- **run-catalyst**: Executes a catalyst with user inputs and returns AI-generated output
- **create-catalyst**: Creates a new catalyst for authenticated users
- **refine**: Refines user text (advice/context) for the Magic Wand button; uses same AI provider as run-catalyst

### Testing Edge Functions Locally

```bash
# Start functions server (--env-file loads .env for AI/OpenRouter API keys)
supabase functions serve create-catalyst run-catalyst refine --no-verify-jwt --env-file .env

# Test with curl (replace with your JWT token)
curl -X POST http://localhost:54321/functions/v1/run-catalyst \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalyst_id": "uuid", "inputs": {}}'
```

**504 Timeout:** If Run Catalyst hangs and returns "upstream server is timing out", Kong's proxy times out before the AI responds. Add `GEMINI_MAX_TOKENS=500` (or lower) to `.env` to speed up responses.

**429 Rate Limit (Gemini):** Free tier Gemini API keys have rate limits (~15 requests/minute). If you see "rate limit exceeded", wait 1-2 minutes between requests or upgrade your API key at https://aistudio.google.com/apikey

**Server-side rate limiting:** Free users get 3 runs/day (configurable via `DAILY_RUN_LIMIT`). Pro users (`profiles.plan = 'pro'`) bypass the limit.

## Database Schema

Key tables:
- **profiles**: User profile (domain, work_style, values, plan). `plan` = `free` or `pro` for server-side rate limit bypass
- **catalysts**: Action Catalysts with prompts and input definitions
- **catalyst_runs**: Run history (for rate limiting and analytics)
- **saved_runs**: User-saved runs in Library

Apply migrations with:
```bash
supabase db reset
```

## Production Deployment

### Supabase

1. Link your project: `supabase link --project-ref your-project-ref`
2. Push migrations: `supabase db push`
3. Deploy functions (requires Docker Desktop running):
   ```bash
   # run-catalyst needs --no-verify-jwt for built-in coaches (anonymous Get Guidance)
   supabase functions deploy run-catalyst --no-verify-jwt
   supabase functions deploy create-catalyst
   supabase functions deploy refine
   ```
   
   **If Docker isn't available**, use the API method:
   ```bash
   supabase functions deploy run-catalyst --no-verify-jwt --use-api
   supabase functions deploy create-catalyst --use-api
   supabase functions deploy refine --use-api
   ```

### Expo

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## Environment Variables Reference

### Mobile App (`apps/mobile/src/env.ts`)

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `EDGE_FUNCTION_BASE_URL`: Base URL for Edge Functions (usually `{SUPABASE_URL}/functions/v1`)
- `REVENUECAT_API_KEY_IOS` / `REVENUECAT_API_KEY_ANDROID`: For production builds (set in EAS secrets)

### Edge Functions (set in Supabase dashboard)

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)
- `DAILY_RUN_LIMIT`: Free tier runs per day (default: 3)
- `ALLOW_DEV_AUTH_BYPASS`: Set to `true` only for local dev (ES256 JWT workaround). **Never set in production.**
- `ALLOW_TEST_PLAN_OVERRIDE`: Set to `true` for preview builds so Set Pro bypasses server-side rate limit. **Never set in production.**

## RevenueCat Setup (Required for Paywall)

For the paywall to show offerings (not "No offerings available"):

1. **Entitlement**: Create `pro` entitlement in RevenueCat Dashboard
2. **Offering**: Add Current offering with packages (`$rc_monthly`, `$rc_annual`)
3. **Products**: Link packages to subscriptions in App Store Connect / Play Console
4. **Keys**: Add `REVENUECAT_API_KEY_IOS` and `REVENUECAT_API_KEY_ANDROID` to env

See **`docs/REVENUECAT_SETUP.md`** for step-by-step instructions.

## Testing Pro Features Without RevenueCat

While waiting for Play Store / App Store developer activation:

1. **Use preview build** (`eas build --platform android --profile preview`):
   - Uses `RevenueCatProvider.stub` (no store SDK)
   - Test Navigation is visible with **Set Pro** / **Set Free** buttons
   - Tap **Set Pro** to unlock Create Coach, all coaches, and unlimited runs

   **Set Pro not visible?** Test Navigation appears when: running in dev (`expo start`), preview/development EAS builds, or when `EXPO_PUBLIC_SHOW_TEST_NAV=true` is set at build time.

2. **Redeploy run-catalyst** with `--no-verify-jwt` so built-in coaches work without auth:
   ```bash
   supabase functions deploy run-catalyst --no-verify-jwt
   ```

## Testing & Deployment

- **Quick Start**: See `docs/QUICK_START.md` for immediate testing and deployment steps
- **Testing Checklist**: See `docs/TESTING_CHECKLIST.md` for test cases
- **Production Deploy**: See `docs/PRODUCTION_DEPLOY.md` for Supabase and EAS commands
- **Shipyard iOS**: See `docs/SHIPYARD_IOS_SUBMISSION.md` for App Store submission

## Setup Guides

- **AI Integration**: See `docs/AI_INTEGRATION_SETUP.md` for OpenRouter/OpenAI/Anthropic
- **RevenueCat**: See `docs/REVENUECAT_SETUP.md` for entitlement, offerings, and product setup

## License

MIT
