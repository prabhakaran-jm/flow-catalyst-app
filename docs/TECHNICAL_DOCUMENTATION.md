# Flow Catalyst – Technical Documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Expo SDK 54, React Native 0.81, TypeScript |
| **Navigation** | Expo Router (file-based) |
| **State** | Zustand, React Query |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI** | OpenRouter, Gemini, OpenAI, Anthropic (via Edge Functions) |
| **Payments** | RevenueCat (subscriptions) |

## Architecture

```
Mobile App (Expo/RN)
    ├── Supabase Auth (OTP)
    ├── Supabase Edge Functions (run-catalyst, create-catalyst, refine, refine-coach)
    ├── Supabase DB (profiles, catalysts, catalyst_runs)
    └── RevenueCat SDK (offerings, purchase, restore)
```

- **Edge Functions:** Run catalyst (AI execution), create-catalyst (custom coaches), refine (Magic Wand), refine-coach (built-in coach refinement).
- **RevenueCat:** Entitlement `pro` gates unlimited runs, Create Coach, and Pro-only coaches. Offerings (`$rc_monthly`, `$rc_annual`) linked to App Store and Google Play products.
- **Custom paywall:** Single in-app paywall fetches offerings via RevenueCat SDK; purchase and restore use native store flows.

## RevenueCat Implementation

- **Entitlement:** `pro` – gates Pro features
- **Offerings:** Current offering with `$rc_monthly` and `$rc_annual` packages
- **Products:** `flow_catalyst_monthly`, `flow_catalyst_annual` (App Store Connect / Play Console)
- **Flow:** Paywall calls `Purchases.getOfferings()`; user selects package; `Purchases.purchasePackage()` completes purchase. Restore via `Purchases.restorePurchases()`.
- **License testers (Android):** Added for Internal Testing so judges can test without real charges.

## Repo

- **README:** [github.com/prabhakaran-jm/flow-catalyst-app](https://github.com/prabhakaran-jm/flow-catalyst-app)
- **Quick Start:** [docs/QUICK_START.md](https://github.com/prabhakaran-jm/flow-catalyst-app/blob/master/docs/QUICK_START.md)
