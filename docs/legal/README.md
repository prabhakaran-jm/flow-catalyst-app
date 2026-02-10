# Legal & Compliance

This folder contains legal documents and data handling documentation for Flow Catalyst.

---

## Documents

| Document | Purpose |
|----------|---------|
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | Privacy policy for app stores and website |
| [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) | Terms of service (if you plan to enforce them) |
| [DATA_HANDLING.md](./DATA_HANDLING.md) | Technical summary of data flows and third-party services |

---

## Live pages (Terms & Privacy) without a custom domain

If you don’t have a domain like flowcatalyst.app yet, you can host the legal pages for free with **GitHub Pages**:

1. In this repo, the **live pages** are **`docs/terms.html`** and **`docs/privacy.html`** (standalone HTML; replace `[SUPPORT_EMAIL]` in both with your support email).
2. On GitHub: **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** (or **master**), folder: **/docs** → Save.
3. After a few minutes, your URLs will be:
   - **Terms:** `https://<YOUR-GITHUB-USERNAME>.github.io/flow-catalyst-app/terms.html`
   - **Privacy:** `https://<YOUR-GITHUB-USERNAME>.github.io/flow-catalyst-app/privacy.html`
4. In the app, set **`LEGAL_BASE_URL`** in `apps/mobile/app/paywall.tsx` to:
   - `https://<YOUR-GITHUB-USERNAME>.github.io/flow-catalyst-app`
   (so the app opens the correct Terms and Privacy links.)

When you get a real domain (e.g. flowcatalyst.app), upload the same `terms.html` and `privacy.html` there and change `LEGAL_BASE_URL` to `https://flowcatalyst.app` (and use paths like `/terms` and `/privacy` if your host supports it).

---

## Before Publishing

1. **Replace placeholders** in PRIVACY_POLICY.md, TERMS_OF_SERVICE.md, and in **docs/terms.html** and **docs/privacy.html**:
   - `[DATE]` → e.g., January 29, 2026
   - `[SUPPORT_EMAIL]` → your support email
   - `[JURISDICTION]` and `[COURTS]` in Terms → your governing law

2. **Publish** the Privacy Policy (and Terms) at a public URL (e.g. GitHub Pages above or `https://your-domain.com/privacy`).

3. **Link** the Privacy Policy and Terms in:
   - App (e.g., sign-in screen, profile, or settings)
   - Play Console / App Store Connect

4. **Review** DATA_HANDLING.md to ensure it matches your production setup (Supabase region, AI provider, etc.)

---

## Enforcement

- **Privacy Policy:** Required for both app stores.
- **Terms of Service:** Optional but recommended if you want to enforce acceptable use, limit liability, or handle disputes. If you do not plan to enforce them, you can omit or simplify.
