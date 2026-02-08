# Flow Catalyst: Technical Documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Expo (React Native 0.81), TypeScript 5.9 |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI** | OpenRouter / Gemini / OpenAI / Anthropic via Edge Functions |
| **Payments** | RevenueCat |
| **State** | Zustand, React Query (TanStack) |
| **Navigation** | Expo Router (file-based) |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Flow Catalyst │────▶│    Supabase      │────▶│  AI Provider    │
│   Mobile App    │     │  (Auth + DB)     │     │ (Gemini/OpenAI/ │
└────────┬────────┘     └────────┬────────┘     │  OpenRouter)    │
         │                        │              └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   RevenueCat    │     │  catalyst_runs   │
│ (Subscriptions) │     │  saved_runs      │
└─────────────────┘     └──────────────────┘
```

- **Mobile:** Expo app with React Native. Auth via Supabase (email OTP). Edge Functions for AI and catalyst execution.
- **Database:** profiles, catalysts, catalyst_runs, saved_runs. Row Level Security (RLS) for access control.
- **Edge Functions:** run-catalyst (AI + rate limit), create-catalyst (custom coaches), refine (Magic Wand).

## RevenueCat Implementation

### Entitlement
- **Identifier:** `pro`
- **Unlocks:** Unlimited runs, Create Coach, all 5 built-in coaches, Magic Wand, save to library

### Integration
- **SDK:** `react-native-purchases` (RevenueCat)
- **Initialization:** On app load; `Purchases.logIn(user.id)` links Supabase user to RevenueCat
- **Paywall:** Custom UI; fetches offerings via `Purchases.getOfferings()`; purchases via `Purchases.purchasePackage()`
- **Restore:** `Purchases.restorePurchases()` for existing subscribers
- **Stub mode:** Preview/dev builds use `RevenueCatProvider.stub` when not from Play Store (no SDK crash)

### Products
- `$rc_monthly` — Monthly subscription
- `$rc_annual` — Annual subscription

### Testing
- **Set Pro / Set Free:** Test Navigation (visible in preview builds) toggles plan without store
- **Sandbox:** Use App Store / Play Store sandbox accounts for real purchase testing

See `docs/REVENUECAT_SETUP.md` for full setup.

## Key Files

| Purpose | Path |
|---------|------|
| RevenueCat provider | `apps/mobile/src/providers/RevenueCatProvider.tsx` |
| Paywall screen | `apps/mobile/app/paywall.tsx` |
| Run catalyst (AI) | `supabase/functions/run-catalyst/index.ts` |
| Database schema | `supabase/migrations/` |
