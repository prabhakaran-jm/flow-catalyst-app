# Quick Start Guide - Testing & Deployment

## 🚀 Quick Local Testing

### 1. Start All Services

**Terminal 1 - Supabase:**
```powershell
supabase start
```

**Terminal 2 - Edge Functions:**
```powershell
npx supabase functions serve create-catalyst run-catalyst --no-verify-jwt
```

**Terminal 3 - Mobile App:**
```powershell
cd apps/mobile
pnpm start
```

### 2. Verify services

Confirm Terminal 1 shows Supabase running and Terminal 2 shows Edge Functions listening (e.g. on port 54321 and 9999). Then start the app in Terminal 3.

### 3. Test in App

1. Open Expo Go app on your phone, or
2. Press `i` for iOS simulator, `a` for Android emulator, or `w` for web
3. Follow the testing checklist in `TESTING_CHECKLIST.md`

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All features tested locally (see TESTING_CHECKLIST.md)
- [ ] Supabase project created and linked
- [ ] Database migrations pushed to production
- [ ] Edge Functions deployed
- [ ] Environment variables configured
- [ ] RevenueCat project set up
- [ ] App Store/Play Console apps created
- [ ] EAS CLI installed and logged in

---

## 🏗️ Production Deployment Steps

### Step 1: Supabase Production

```bash
# Link to remote project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push

# Deploy Edge Functions
supabase functions deploy create-catalyst
supabase functions deploy run-catalyst

# Set secrets in Supabase Dashboard:
# Project Settings > Edge Functions > Secrets
# - AI_PROVIDER=openrouter
# - OPENROUTER_API_KEY=your-key (optional for free models)
```

### Step 2: Update Mobile App Config

Update `apps/mobile/src/env.ts` with production values:

```typescript
export const env = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-production-anon-key',
  EDGE_FUNCTION_BASE_URL: 'https://your-project.supabase.co/functions/v1',
  REVENUECAT_API_KEY_IOS: 'appl_your-ios-key',
  REVENUECAT_API_KEY_ANDROID: 'goog_your-android-key',
} as const;
```

### Step 3: Build with EAS

```bash
cd apps/mobile

# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login
eas login

# Configure (if first time)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

### Step 4: Submit to Stores

```bash
# iOS (App Store)
eas submit --platform ios

# Android (Google Play)
eas submit --platform android
```

---

## 🔍 Testing Production

### Test Edge Functions

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-catalyst \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "inputs_json": [],
    "prompt_template": "Test {input}"
  }'
```

### Test Mobile App

1. Install production build on test device
2. Sign in with real email
3. Test all features
4. Verify AI responses work
5. Test subscription flow (sandbox)

---

## 📚 Detailed Guides

- **Full Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Testing Checklist**: See `TESTING_CHECKLIST.md`
- **AI Setup**: See `AI_INTEGRATION_SETUP.md`
- **RevenueCat Setup**: See `REVENUECAT_SETUP.md`
- **Local Supabase**: See `LOCAL_SUPABASE_SETUP.md`

---

## 🆘 Need Help?

1. Check the troubleshooting section in DEPLOYMENT_GUIDE.md
2. Review Supabase Dashboard logs
3. Check Edge Function logs
4. Review Expo build logs
5. Check RevenueCat Dashboard for subscription issues

---

## ✅ Success Criteria

Your app is ready for production when:

- ✅ All tests pass locally
- ✅ Production builds succeed
- ✅ Edge Functions work in production
- ✅ Authentication works end-to-end
- ✅ AI generates responses
- ✅ Subscriptions can be purchased (test mode)
- ✅ No critical errors in logs
- ✅ App Store/Play Store submissions ready
