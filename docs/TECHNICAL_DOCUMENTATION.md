# Flow Catalyst – Technical Documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Expo SDK 54, React Native 0.81, TypeScript |
| Navigation | Expo Router |
| State | Zustand, React Query |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI | OpenRouter, Gemini, OpenAI, Anthropic (via Edge Functions) |
| Payments | RevenueCat |

## Architecture Overview

```
Mobile App (Expo / React Native)
├── Supabase Auth (OTP-based authentication)
├── Supabase Edge Functions
│   ├── run-catalyst (AI execution)
│   ├── create-catalyst (custom coach creation)
│   ├── refine (generic refinement)
│   └── refine-coach (built-in coach refinement)
├── Supabase Database
│   ├── profiles
│   ├── catalysts
│   └── catalyst_runs
└── RevenueCat SDK
    ├── Fetch offerings
    ├── Purchase package
    └── Restore purchases
```

## RevenueCat Implementation

| Item | Value |
|------|-------|
| **Entitlement** | `pro` |
| **Offerings** | `$rc_monthly`, `$rc_annual` |
| **Products** | `flow_catalyst_monthly`, `flow_catalyst_annual` |

### Flow

1. Paywall calls `Purchases.getOfferings()`
2. User selects a package
3. `Purchases.purchasePackage()` triggers native store purchase
4. Entitlement unlocks Pro features
5. Restore via `Purchases.restorePurchases()`

Android internal testing license testers added for safe subscription testing.

## Repository

- **GitHub:** [github.com/prabhakaran-jm/flow-catalyst-app](https://github.com/prabhakaran-jm/flow-catalyst-app)
- **Quick Start:** [docs/QUICK_START.md](https://github.com/prabhakaran-jm/flow-catalyst-app/blob/master/docs/QUICK_START.md)
