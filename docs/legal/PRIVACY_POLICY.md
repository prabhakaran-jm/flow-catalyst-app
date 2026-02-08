# Privacy Policy

**Flow Catalyst**  
Last updated: [DATE]

This Privacy Policy describes how Flow Catalyst ("we," "our," or "us") collects, uses, and shares information when you use our mobile application.

---

## 1. Information We Collect

### 1.1 Account & Profile Data
- **Email address** – Used for sign-in via one-time verification codes (no password stored)
- **Profile data** – Domain, work style, and values you optionally provide to personalize AI responses (stored in our database)

### 1.2 Usage Data
- **Coach runs** – When you run a coach (authenticated path), we store: catalyst ID, inputs, output, and timestamp for rate limiting and history
- **Saved outputs** – Saved coach outputs are stored **locally on your device** (AsyncStorage) unless you choose to sync (future feature)
- **Anonymous usage** – One free anonymous run is tracked locally; no server-side storage for anonymous users

### 1.3 Subscription Data
- **RevenueCat** – When you subscribe, RevenueCat (our subscription provider) processes: purchase history, app user ID, device identifiers. **We do not receive or store payment card details**; those are handled by Apple/Google.

### 1.4 Content You Provide
- **Coach inputs** – Topic, context, goals, etc. you enter when running a coach
- **Custom coaches** – Name, description, prompt template, and input definitions (Pro users)
- **Refined text** – When you use the Magic Wand, your text is sent to our AI refinement service

---

## 2. How We Use Your Data

| Purpose | Data Used |
|--------|-----------|
| **Authentication** | Email (via Supabase Auth) |
| **AI guidance** | Coach inputs, profile (domain/work style/values) → sent to AI provider (OpenRouter, Gemini, OpenAI, or Anthropic) |
| **Magic Wand** | Your text → sent to AI provider for refinement |
| **Rate limiting** | Catalyst run count per user per day |
| **Subscription status** | RevenueCat entitlement (pro/free) → synced to our database via webhook |
| **Local saved results** | Stored on device only; not sent to our servers |

---

## 3. Third-Party Services & Data Handling

### 3.1 Supabase
- **What:** Backend (database, authentication)
- **Data processed:** Email, profile (domain, work_style, values, plan), catalysts, catalyst_runs
- **Location:** Supabase project region (e.g., US, EU)
- **Policy:** [Supabase Privacy Policy](https://supabase.com/privacy)

### 3.2 RevenueCat
- **What:** Subscription management (Pro tier)
- **Data processed:** User ID, purchase history, device identifiers
- **Location:** RevenueCat servers (US)
- **Policy:** [RevenueCat Privacy Policy](https://revenuecat.com/privacy)

### 3.3 AI Providers (OpenRouter, Google Gemini, OpenAI, Anthropic)
- **What:** Generate coach output and Magic Wand refinements
- **Data processed:** Prompts (including your inputs and profile context), AI responses
- **Location:** Provider-specific (configurable; see provider policies)
- **Note:** We do not train AI models on your data; prompts are processed for the immediate request only.

### 3.4 Apple / Google
- **What:** App distribution, in-app purchases
- **Data processed:** Per Apple App Store and Google Play policies

---

## 4. Data Retention

- **Account data:** Retained until you delete your account
- **Catalyst runs:** Retained for rate limiting and history; may be purged for operational reasons
- **Local saved results:** Stored on your device; deleted when you uninstall or clear app data

---

## 5. Your Rights

- **Access** – Request a copy of your data
- **Correction** – Update profile via the app
- **Deletion** – Request account and data deletion
- **Opt-out** – Uninstall the app to stop data collection

To exercise these rights, contact us at: **[SUPPORT_EMAIL]**

---

## 6. Security

We use industry-standard practices: HTTPS, Row Level Security (RLS) in our database, and secure authentication. We do not store payment card information.

---

## 7. Children

Flow Catalyst is not intended for users under 13. We do not knowingly collect data from children.

---

## 8. Changes

We may update this policy. Material changes will be communicated via the app or email. Continued use after changes constitutes acceptance.

---

## 9. Contact

For privacy questions or requests: **[SUPPORT_EMAIL]**
