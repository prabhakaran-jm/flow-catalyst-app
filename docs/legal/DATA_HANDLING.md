# Data Handling Summary

This document explains how Flow Catalyst uses third-party services and what data flows where. Use it for compliance, security reviews, and privacy policy alignment.

---

## Data Flow Overview

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
│ (Subscriptions) │     │  saved_runs*     │
└─────────────────┘     └──────────────────┘
```

* saved_runs: Currently stored locally (AsyncStorage); Supabase `saveRun` API exists but is not used in-app yet.

---

## 1. Supabase

| Component | Purpose | Data |
|-----------|---------|------|
| **Auth** | Email OTP sign-in | Email, session tokens |
| **profiles** | User profile | id, domain, work_style, values, plan |
| **catalysts** | Custom coaches | id, owner_id, name, description, inputs_json, prompt_template |
| **catalyst_runs** | Run history (rate limit + analytics) | user_id, catalyst_id, inputs, output, created_at |
| **saved_runs** | User-saved outputs (API only*) | user_id, coach_name, coach_id, output, inputs |

*The app currently uses local AsyncStorage via `appStore.saveResult`; Supabase `saveRun` is available but not wired in the UI.

**Security:** Row Level Security (RLS) ensures users only access their own data.

---

## 2. RevenueCat

| Purpose | Data |
|---------|------|
| **Subscription status** | User ID (Supabase auth UUID), entitlements (pro/free) |
| **Purchase handling** | Purchase history, device identifiers (RevenueCat; we do not receive payment details) |

**Integration:** `Purchases.logIn(user.id)` links RevenueCat to our user. Webhook (optional) can sync `plan` to `profiles`.

**Privacy:** RevenueCat privacy policy: https://revenuecat.com/privacy

---

## 3. AI Providers (OpenRouter, Gemini, OpenAI, Anthropic)

| Flow | Data Sent | Retention |
|------|-----------|-----------|
| **run-catalyst** | Prompt (template + user inputs + profile context), model config | Per-request; no training on our data |
| **refine** (Magic Wand) | User text + instruction | Per-request; no training on our data |

**Config:** `AI_PROVIDER` env var selects provider. Keys are server-side only.

---

## 4. Local Storage (Device)

| Key | Purpose |
|-----|---------|
| `@flow_catalyst:anonymous_runs_used` | Count of anonymous runs (1 free) |
| `@flow_catalyst:profile_nudge_seen` | Onboarding flag |
| `saved_results` | Saved coach outputs (JSON array) |

**Note:** Local data is not synced to our servers. Clearing app data or uninstalling removes it.

---

## 5. What We Do NOT Collect

- Payment card details
- Precise location
- Health or fitness data
- Contacts or photos
- Browsing history outside the app

---

## 6. Compliance Checklist

- [ ] Privacy policy published and linked in app stores
- [ ] Support email configured for data requests
- [ ] Supabase region documented (GDPR: consider EU if servicing EU users)
- [ ] RevenueCat DPA if required for your jurisdiction
- [ ] AI provider terms reviewed (OpenRouter, Gemini, etc.)
