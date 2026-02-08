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

## Before Publishing

1. **Replace placeholders** in PRIVACY_POLICY.md and TERMS_OF_SERVICE.md:
   - `[DATE]` → e.g., January 29, 2026
   - `[SUPPORT_EMAIL]` → your support email
   - `[JURISDICTION]` and `[COURTS]` in Terms → your governing law

2. **Publish** the Privacy Policy at a public URL (e.g., `https://your-domain.com/privacy`)

3. **Link** the Privacy Policy and Terms in:
   - App (e.g., sign-in screen, profile, or settings)
   - Play Console / App Store Connect

4. **Review** DATA_HANDLING.md to ensure it matches your production setup (Supabase region, AI provider, etc.)

---

## Enforcement

- **Privacy Policy:** Required for both app stores.
- **Terms of Service:** Optional but recommended if you want to enforce acceptable use, limit liability, or handle disputes. If you do not plan to enforce them, you can omit or simplify.
