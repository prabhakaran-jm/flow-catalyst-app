# Shipyard: Creator Contest - Judge Verification Guide

This guide helps judges verify the core functionality and technical implementation of Flow Catalyst, specifically focusing on the RevenueCat integration and audience fit.

## 1. Quick Verification (Judge Mode)

To verify the app quickly without a real subscription:

1.  **Onboarding:** Complete the initial slides.
2.  **Profile:** Navigate to the **Profile** screen.
3.  **Debug Info:** Scroll to the bottom to find the **Judge / Debug Info** section.
    *   Verify **SDK Type** is "Native (RevenueCat)" in production builds.
    *   Verify **Offerings** shows the available package count.
4.  **Instant Pro:** If using a Preview/Dev build, use the **Set Pro** button on the paywall to instantly unlock all features for testing.

## 2. RevenueCat Integration

### The Paywall Flow
1.  Navigate to **Choose Your Coach**.
2.  Tap a **Pro** coach (e.g., Clarity or Decision).
3.  The **RevenueCat-hosted paywall** should appear.
4.  If store configuration is still propagating (Error 23), the app will fall back to a **Custom Paywall** that still uses the RevenueCat SDK to fetch real-time pricing and packages.

### Verification Points
*   **Entitlement Gating:** Verify that Pro coaches and the Magic Wand feature are locked for free users.
*   **Real-time Pricing:** Verify that the custom paywall fallback shows local currency and pricing fetched via the SDK.
*   **Restore:** Verify the **Restore Purchases** button in the Profile screen correctly interacts with the RevenueCat SDK.

## 3. Audience Fit & UX

### Minimalist Design
*   Observe the typography, spacing, and brand-aligned coach icons.
*   Note the lack of "chat fatigue"—the app provides direct guidance, not a generic chatbot.

### Low Friction
*   **Anonymous Runs:** New users can get value immediately with one free run before being asked to sign in.
*   **Daily Nudges:** The home screen provides a context-aware starting point for creators.

## 4. Technical Quality

*   **Offline Support:** Daily run counts are tracked locally via `AsyncStorage`.
*   **Server-Side Security:** The Supabase Edge Function `run-catalyst` performs server-side plan validation for rate limiting, syncing with the RevenueCat entitlement status.
*   **Magic Wand Refinement:** Uses a specialized prompting strategy to help creators refine their inputs before generating the final guide.
