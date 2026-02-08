# Store Assets Checklist

Use this guide to prepare and upload assets for **Google Play** and **App Store**.

---

## 1. Screenshots (1–2 per screen)

| Screen | Path | Screenshots | Notes |
|--------|------|-------------|-------|
| **Home** | `/` (Choose Your Coach) | 1–2 | Coach Library, Your Coaches, Saved preview |
| **Coach run** | `/catalyst/[id]` | 1–2 | Input screen + guidance output |
| **Saved** | `/saved` | 1–2 | List view + empty state or detail |
| **Paywall** | `/paywall` | 1–2 | Subscription options, features list |

**Requirements:**
- **Format:** JPEG or 24-bit PNG (no alpha)
- **Resolution:** Min 1080×1920 px (portrait) for Play Store recommendations
- **Count:** Min 2, max 8 per device type
- **Production build:** Use `eas build --profile production` so Test Navigation is hidden

**Suggested capture order:** Home → Coach run (input) → Coach run (output) → Saved → Paywall

---

## 2. Feature Graphic (Play Store)

| Spec | Value |
|------|-------|
| **Dimensions** | 1024 × 500 px |
| **Format** | JPEG or 24-bit PNG (no alpha) |
| **Content** | App branding, value proposition, avoid cutoff zones (edges) |

**Design tips:**
- Center key elements; avoid placing logo/text in outer 10% (cutoff zones)
- Use app colors: `#6366F1` (accent), `#FFFFFF` (background)
- Tagline: "Transform Advice into Action" or "Minimalist AI coaching in your pocket"

---

## 3. App Icon

| Store | Size | Format |
|-------|------|--------|
| **Google Play** | 512 × 512 px | 32-bit PNG with alpha |
| **iOS App Store** | 1024 × 1024 px | PNG with alpha |

**Source:** Use `apps/mobile/assets/icon.png` at 1024×1024. Export 512×512 for Play Console.

**Location:** `apps/mobile/assets/icon.png`, `adaptive-icon.png`

---

## 4. Short Description (≤80 characters)

```
AI coaching in your pocket. Get guidance at the right moment—not endless chat.
```

**Character count:** 68 ✓

**Alternatives:**
- `Transform advice into action. Focused AI coaches for writers and creators.` (71)
- `Minimalist AI coaching. Hook, Outline, Block Breaker & more.` (53)

---

## 5. Full Description

See [descriptions.md](./descriptions.md) for the full store listing copy.

---

## 6. Required URLs & Contact

| Field | Status | Value |
|-------|--------|-------|
| **Privacy Policy URL** | Required | `https://your-domain.com/privacy` |
| **Support Email** | Required | `support@your-domain.com` |

**Action:** Create a privacy policy page and set these in Play Console / App Store Connect.

---

## 7. Quick Checklist

- [ ] Screenshots: Home (1–2), Coach run (1–2), Saved (1–2), Paywall (1–2)
- [ ] Feature graphic: 1024×500 px
- [ ] App icon: 512×512 (Play), 1024×1024 (iOS)
- [ ] Short description: ≤80 chars
- [ ] Full description: Features, benefits, who it's for
- [ ] Privacy policy URL
- [ ] Support email
