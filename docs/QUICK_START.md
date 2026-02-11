# Quick Start

## Local dev

```bash
# Terminal 1
supabase start

# Terminal 2 (--env-file loads AI keys from .env)
npx supabase functions serve create-catalyst run-catalyst refine refine-coach --no-verify-jwt --env-file .env

# Terminal 3
cd apps/mobile && pnpm start
```

Then: `i` (iOS), `a` (Android), or `w` (web).

## Production deploy

### 1. Supabase

```bash
supabase link --project-ref YOUR_REF
supabase db push
supabase functions deploy run-catalyst --no-verify-jwt
supabase functions deploy create-catalyst
supabase functions deploy refine
supabase functions deploy refine-coach --no-verify-jwt
```

Set secrets in Dashboard → Edge Functions: `AI_PROVIDER` (openrouter), `OPENROUTER_API_KEY`, etc.

### 2. Mobile

Set `apps/mobile/src/env.ts` with production values (or EAS secrets). Then:

```bash
cd apps/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Docs

| Doc | Purpose |
|-----|---------|
| [legal/](./legal/) | Terms, Privacy (app links to GitHub blob URLs) |
