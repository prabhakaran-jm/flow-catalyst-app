# RevenueCat paywall review prompt (current status)

Copy the prompt below and paste it when asking a senior mobile engineer or AI to review/fix the Flow Catalyst paywall. It reflects the **current** codebase and fixes.

---

You are a senior mobile engineer who has shipped RevenueCat paywalls in production.

## Goal

Analyze my codebase and fix any remaining paywall issues. I need a precise diagnosis, concrete code changes, and a verification plan.

## Context (current status)

- **Platform:** React Native (Expo), iOS primary (Shipyard); Android later.
- **RevenueCat SDK:** `react-native-purchases` ^9.7.6, `react-native-purchases-ui` ^9.7.6.
- **Paywall approach:** **Hybrid**
  - **Primary:** RevenueCat UI — `RevenueCatUI.presentPaywall()` via `presentPaywall()` from `RevenueCatProvider`; returns `{ unlocked: boolean; showCustomPaywall: boolean }`. Callers open the custom `/paywall` route when `showCustomPaywall` is true (e.g. Error 23).
  - **Fallback:** Custom paywall screen at route `/paywall` — used when `skipRevenueCat` is true (preview/dev builds, “Set Pro” / “Free for demo”) or when RevenueCat UI fails; uses `getOfferings()` / `fetchOfferings()`, 12s client-side timeout, Retry, Restore, `purchasePackage` / `restorePurchases`.
- **Products:** Subscriptions only — `flow_catalyst_monthly`, `flow_catalyst_annual`. Entitlement ID: **`pro`**. Offering: **default** (current).
- **Environments:** TestFlight + Sandbox (Shipyard); EAS production build with env vars; preview build uses `skipRevenueCat` and stub provider.
- **Relevant files:**
  - `apps/mobile/src/providers/RevenueCatProvider.tsx` — init, configure, offerings, presentPaywall, purchasePackage, restorePurchases, refreshEntitlements, plan state.
  - `apps/mobile/app/_layout.tsx` — chooses RevenueCatProvider vs RevenueCatProvider.stub based on `skipRevenueCat`.
  - `apps/mobile/src/lib/presentRevenueCatPaywall.ts` — calls `RevenueCatUI.presentPaywall()`, returns purchased | restored | cancelled | error | not_presented.
  - `apps/mobile/app/paywall.tsx` — custom paywall UI, loading/timeout (12s), Retry, Restore, package selection.
  - `apps/mobile/app/index.tsx`, `app/catalyst/[id].tsx`, `app/catalyst/create.tsx`, `app/catalyst/[id]/edit.tsx` — call `presentPaywall()`, navigate to `/paywall` when `showCustomPaywall`.
- **API key:** From `apps/mobile/src/env.ts` (local) or `Constants.expoConfig.extra` (EAS build); EAS production env vars: `REVENUECAT_API_KEY_IOS` (required for Shipyard).

### Issue (current / past)

- **Expected:** User taps Upgrade → RevenueCat modal with pricing → purchase or restore → Pro unlocks; or if RevenueCat UI fails, user sees custom paywall (Restore, Retry) and no infinite loading.
- **Actual (add your current symptom):** e.g. “Error 23 popup then fallback works” / “pricing never loads on custom paywall” / “Unlock Pro stays disabled” / “restore doesn’t refresh plan”.
- **Frequency:** [always / intermittent / only on first launch / only after restore / only in TestFlight / etc.]
- **Recent changes:** Hybrid paywall (RevenueCat UI + custom fallback), `presentPaywall()` returns `{ unlocked, showCustomPaywall }`, 12s timeout and Retry on custom paywall, Error 23 doc in REVENUECAT_SETUP.md.

## What you will receive (if needed)

I can paste:

1. RevenueCat setup and initialization — `RevenueCatProvider.tsx` (configure, getRevenueCatApiKey, init effect, setLogLevel in __DEV__).
2. Paywall screen code — `paywall.tsx` (custom) and `presentRevenueCatPaywall.ts` (RevenueCat UI).
3. Purchase + restore logic — `purchasePackage`, `restorePurchases`, `refreshEntitlements` in provider; `handleStartPro`, `handleRestore` in paywall.
4. State — `plan` (free | pro), `offerings`, `loadingOfferings`, `offeringsTimedOut`; entitlement from `CustomerInfo.entitlements.active['pro']`; optional `setPlanForTesting` in stub/preview.
5. Logs/screenshots of the paywall flow (if I have them).
6. Store / RevenueCat dashboard notes — Offerings (default), Entitlements (pro), Products (flow_catalyst_monthly, flow_catalyst_annual), TestFlight/Sandbox.

## Your tasks

1. **Map the full paywall flow**
   - Where RevenueCat is configured (api key from env/Constants, log level in __DEV__, user id from Supabase `user.id` via `Purchases.logIn`).
   - How Offerings are fetched (init + `fetchOfferings()` with 12s timeout; custom paywall uses `offerings?.current`, `packageOptions` from monthly/annual packages).
   - How the paywall is shown (tap Upgrade → `presentPaywall()` → RevenueCat UI modal, or `router.push('/paywall')` when skipRevenueCat or showCustomPaywall).
   - Where entitlement state lives (provider `plan` from `refreshEntitlements()` / purchase / restore; stub `setPlanForTesting` for preview).

2. **Identify likely root cause(s)**
   - Anti-patterns (e.g. caching CustomerInfo, stale plan flag, missing refresh after restore).
   - Race conditions (offerings fetch vs UI, login vs configure, restore vs entitlement refresh).
   - Config mismatches (entitlement id `pro`, offering default, product ids vs App Store Connect, store products not approved, agreements not signed — see REVENUECAT_SETUP.md Error 23 section).

3. **Provide specific fixes with code**
   - Exact edits (before/after) for the smallest viable fix.
   - If multiple options, rank by reliability and speed to ship (Shipyard hackathon).
   - Keep architecture changes minimal; explain if necessary.

4. **Add instrumentation**
   - What to log: Offerings result, currentOffering, package identifiers, entitlement status, customerInfo after purchase/restore.
   - RevenueCat debug (already set in __DEV__); add key app logs so we can prove the issue is gone.

5. **Verification checklist**
   - Step-by-step test plan for Sandbox / TestFlight: install → open paywall → purchase → confirm Pro; restore; then Error 23 scenario → dismiss → custom paywall → Retry/Restore.
   - Edge cases: first install, returning user, restore, switch account, offline, cancelled subscription.

## Output format

- 5–10 bullet diagnosis summary.
- Root cause hypothesis (ranked).
- Fix plan with code blocks.
- Test plan checklist.
- “If still broken” next steps.

## Constraints

- Do not guess. If something is missing, list the exact snippet/file you need.
- Prefer minimal, shippable changes.
- Keep paywall UX simple and reliable for judges: users should hit paywall, purchase (or restore), and instantly unlock premium. Fallback to custom paywall on RevenueCat UI error must keep Restore and Retry usable.
