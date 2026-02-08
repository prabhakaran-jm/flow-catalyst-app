# Flow Catalyst - End-to-End Testing & Deployment Guide

This guide will help you test the complete application flow and deploy to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Testing](#local-testing)
3. [Supabase Production Setup](#supabase-production-setup)
4. [RevenueCat Production Setup](#revenuecat-production-setup)
5. [Expo Deployment](#expo-deployment)
6. [End-to-End Testing](#end-to-end-testing)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Supabase account and project created
- [ ] RevenueCat account and project created
- [ ] Expo account (for EAS Build)
- [ ] OpenAI/OpenRouter API key (for AI features)
- [ ] All environment variables documented
- [ ] Database migrations tested locally
- [ ] Edge Functions tested locally
- [ ] Store assets ready (screenshots, feature graphic, descriptions, privacy policy) — see [store-assets/README.md](store-assets/README.md)
- [ ] Privacy policy and terms of service ready — see [legal/README.md](legal/README.md)

---

## Local Testing

### Step 1: Test Database & Migrations

```bash
# Start local Supabase
supabase start

# Check status
supabase status

# Apply migrations
supabase db reset

# Verify tables exist
# Open Supabase Studio: http://127.0.0.1:54323
# Check that 'profiles' and 'catalysts' tables exist
```

### Step 2: Test Edge Functions Locally

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Serve Edge Functions
npx supabase functions serve create-catalyst run-catalyst --no-verify-jwt

# Terminal 3: Test with curl (replace with your anon key from supabase status)
curl -X POST http://127.0.0.1:54321/functions/v1/create-catalyst \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Catalyst",
    "inputs_json": [{"name": "task", "type": "string"}],
    "prompt_template": "Help me with: {task}"
  }'
```

### Step 3: Test Mobile App Locally

```bash
cd apps/mobile

# Start Expo
pnpm start

# Test on:
# - iOS Simulator (press 'i')
# - Android Emulator (press 'a')
# - Web (press 'w')
```

### Step 4: Test Complete Flow

1. **Sign In**: Use magic link authentication
2. **Create Profile**: Navigate to Profile, fill in domain/work_style/values
3. **Create Catalyst**: Create a new catalyst with inputs and prompt template
4. **Run Catalyst**: Run the catalyst with test inputs
5. **Verify AI Output**: Check that AI generates a response (if API key configured)

---

## Supabase Production Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `flow-catalyst`
   - Database password: (save this!)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

### Step 2: Link Local Project to Remote

```bash
# From project root
supabase link --project-ref your-project-ref

# You'll be prompted for database password
```

### Step 3: Push Database Schema

```bash
# Push migrations to production
supabase db push

# Verify in Supabase Dashboard > Database > Tables
# Should see: profiles, catalysts
```

### Step 4: Deploy Edge Functions

```bash
# Deploy both functions
supabase functions deploy create-catalyst
supabase functions deploy run-catalyst

# Verify in Supabase Dashboard > Edge Functions
# Both functions should be listed and active
```

### Step 5: Configure Edge Function Secrets

In Supabase Dashboard > Project Settings > Edge Functions > Secrets:

Add these secrets:
- `SUPABASE_URL` - Your project URL (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` - From Project Settings > API
- `SUPABASE_ANON_KEY` - From Project Settings > API
- `AI_PROVIDER` - `openrouter` (or `openai`, `anthropic`)
- `OPENROUTER_API_KEY` - (optional, for free models)
- OR `OPENAI_API_KEY` - (if using OpenAI)
- OR `ANTHROPIC_API_KEY` - (if using Anthropic)

### Step 6: Update Auth Settings

In Supabase Dashboard > Authentication > URL Configuration:

1. **Site URL**: Your app's production URL (or Expo deep link)
2. **Redirect URLs**: Add:
   - `flowcatalyst://auth/callback` (for mobile)
   - `https://your-expo-app.web.app/auth/callback` (for web, if using Expo web)

### Step 7: Get Production Credentials

From Supabase Dashboard > Project Settings > API:

- **Project URL**: `https://your-project.supabase.co`
- **anon/public key**: `eyJhbGc...` (starts with `eyJ`)
- **service_role key**: `eyJhbGc...` (keep secret!)

---

## RevenueCat Production Setup

### Step 1: Create RevenueCat Project

1. Go to https://app.revenuecat.com/
2. Click "New Project"
3. Name: `Flow Catalyst`
4. Platform: Select iOS and Android

### Step 2: Configure App Store Connect (iOS)

1. In App Store Connect:
   - Create your app (if not exists)
   - Go to Features > In-App Purchases
   - Create subscription products:
     - Monthly Pro: `monthly_pro` ($9.99/month)
     - Yearly Pro: `yearly_pro` ($79.99/year)
   - Create subscription group
   - Add both products to group

2. In RevenueCat Dashboard:
   - Go to Products
   - Add products matching App Store Connect:
     - Product ID: `monthly_pro`
     - Product ID: `yearly_pro`
   - Link to App Store Connect products

### Step 3: Configure Google Play Console (Android)

1. In Google Play Console:
   - Create your app (if not exists)
   - Go to Monetize > Subscriptions
   - Create subscription products:
     - Monthly Pro: `monthly_pro` ($9.99/month)
     - Yearly Pro: `yearly_pro` ($79.99/year)

2. In RevenueCat Dashboard:
   - Add Android products matching Google Play:
     - Product ID: `monthly_pro`
     - Product ID: `yearly_pro`
   - Link to Google Play products

### Step 4: Create Entitlement

1. In RevenueCat Dashboard > Entitlements:
2. Create entitlement: `pro`
3. Attach both `monthly_pro` and `yearly_pro` products to this entitlement

### Step 5: Create Offerings

1. In RevenueCat Dashboard > Offerings:
2. Create default offering: `default`
3. Add both products (`monthly_pro`, `yearly_pro`) to the offering

### Step 6: Get API Keys

From RevenueCat Dashboard > Project Settings > API Keys:

- **iOS API Key**: `appl_...`
- **Android API Key**: `goog_...`

---

## Expo Deployment

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli

# Login to Expo
eas login
```

### Step 2: Configure EAS

```bash
cd apps/mobile

# Initialize EAS (if not already done)
eas build:configure
```

This creates/updates `eas.json`. Review and adjust as needed.

### Step 3: Update app.json

Ensure `app.json` has:
- Correct `name`, `slug`, `version`
- Bundle identifier (iOS): `com.yourcompany.flowcatalyst`
- Package name (Android): `com.yourcompany.flowcatalyst`

### Step 4: Update Environment Variables

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

### Step 5: Build for Production

#### iOS Build

```bash
eas build --platform ios --profile production
```

Options:
- **App Store**: For App Store submission
- **Ad Hoc**: For TestFlight/internal testing
- **Development**: For development builds

#### Android Build

```bash
eas build --platform android --profile production
```

Options:
- **Play Store**: For Google Play submission
- **Internal**: For internal testing

#### Both Platforms

```bash
eas build --platform all --profile production
```

### Step 6: Submit to Stores

#### iOS (App Store)

```bash
eas submit --platform ios
```

#### Android (Google Play)

```bash
eas submit --platform android
```

---

## End-to-End Testing

### Test Checklist

#### Authentication Flow
- [ ] Sign in with email (magic link)
- [ ] Receive email with magic link
- [ ] Click link redirects to app
- [ ] User is authenticated
- [ ] Sign out works

#### Profile Management
- [ ] Navigate to Profile screen
- [ ] Edit domain, work style, values
- [ ] Save profile successfully
- [ ] Profile data persists after app restart

#### Catalyst Management
- [ ] View catalysts list (empty initially)
- [ ] Create new catalyst:
  - [ ] Name and description
  - [ ] Inputs JSON array
  - [ ] Prompt template
- [ ] Catalyst appears in list
- [ ] Click catalyst to view details
- [ ] Catalyst details load correctly

#### Catalyst Execution
- [ ] Open catalyst detail page
- [ ] Add inputs (key-value pairs)
- [ ] Run catalyst
- [ ] AI generates response (if API configured)
- [ ] Output displays correctly
- [ ] Prompt debug info shows

#### Subscription Flow (Pro Users)
- [ ] Free user sees paywall when trying to create
- [ ] Navigate to paywall
- [ ] View subscription options
- [ ] Purchase subscription (test mode)
- [ ] Plan upgrades to 'pro'
- [ ] Can now create catalysts

#### Free User Limits
- [ ] Free user can run catalysts (up to 3/day)
- [ ] Run count displays correctly
- [ ] After 3 runs, limit warning shows
- [ ] Upgrade button redirects to paywall

### Testing Commands

```bash
# Test database queries
supabase db diff --linked

# Test Edge Functions
curl -X POST https://your-project.supabase.co/functions/v1/create-catalyst \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","inputs_json":[],"prompt_template":"Test"}'

# Test AI integration
# Check Edge Function logs in Supabase Dashboard
```

---

## Environment Variables Summary

### Mobile App (`apps/mobile/src/env.ts`)

```typescript
SUPABASE_URL: 'https://your-project.supabase.co'
SUPABASE_ANON_KEY: 'eyJhbGc...' // From Supabase Dashboard
EDGE_FUNCTION_BASE_URL: 'https://your-project.supabase.co/functions/v1'
REVENUECAT_API_KEY_IOS: 'appl_...' // From RevenueCat Dashboard
REVENUECAT_API_KEY_ANDROID: 'goog_...' // From RevenueCat Dashboard
```

### Edge Functions (Supabase Secrets)

```
SUPABASE_URL: (auto-set)
SUPABASE_SERVICE_ROLE_KEY: (from Supabase Dashboard)
SUPABASE_ANON_KEY: (from Supabase Dashboard)
AI_PROVIDER: 'openrouter' (or 'openai', 'anthropic')
OPENROUTER_API_KEY: (optional, for free models)
OPENAI_API_KEY: (if using OpenAI)
ANTHROPIC_API_KEY: (if using Anthropic)
```

---

## Troubleshooting

### Edge Functions Not Working

**Issue**: 502 Bad Gateway
- Check Edge Functions are deployed: `supabase functions list`
- Check function logs in Supabase Dashboard
- Verify secrets are set correctly
- Test locally first: `supabase functions serve`

**Issue**: Authentication errors
- Verify JWT token is valid
- Check auth settings in Supabase Dashboard
- Ensure redirect URLs are configured

### RevenueCat Not Working

**Issue**: Purchases not completing
- Verify API keys are correct in `env.ts`
- Check RevenueCat Dashboard for errors
- Ensure products are configured in App Store/Play Console
- Test with sandbox accounts

**Issue**: Plan not updating
- Check RevenueCat logs
- Verify entitlement name matches (`pro`)
- Ensure `refreshEntitlements()` is called after purchase

### AI Not Generating Responses

**Issue**: "AI API error"
- Check API key is set in Supabase secrets
- Verify `AI_PROVIDER` is set correctly
- Check API key has credits/quota
- Review Edge Function logs for detailed errors

**Issue**: Slow responses
- Use faster models (gpt-4o-mini, claude-3-haiku)
- Reduce `max_tokens` setting
- Check network latency

### Database Issues

**Issue**: RLS policies blocking queries
- Verify RLS policies are correct
- Check user is authenticated
- Test policies in Supabase Dashboard > SQL Editor

**Issue**: Profile not saving
- Check RLS policies allow INSERT/UPDATE
- Verify user ID matches profile ID
- Check database logs for errors

---

## Production Checklist

Before going live:

- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] Edge Functions deployed and tested
- [ ] RevenueCat products configured and tested
- [ ] App builds successfully for iOS and Android
- [ ] Test accounts created for both platforms
- [ ] Magic link emails working
- [ ] AI API keys have sufficient quota
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Analytics configured (if desired)
- [ ] Privacy policy and terms of service added
- [ ] App Store/Play Store listings prepared

---

## Next Steps After Deployment

1. **Monitor Usage**: Check Supabase Dashboard for API usage
2. **Monitor Errors**: Set up error tracking (Sentry, LogRocket)
3. **Monitor Revenue**: Track subscriptions in RevenueCat Dashboard
4. **Gather Feedback**: Set up user feedback mechanism
5. **Iterate**: Plan feature updates based on usage data

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **RevenueCat Docs**: https://docs.revenuecat.com
- **OpenRouter Docs**: https://openrouter.ai/docs

---

## Quick Reference Commands

```bash
# Supabase
supabase start                    # Start local Supabase
supabase status                   # Check status
supabase db push                  # Push migrations to production
supabase functions deploy <name>  # Deploy function
supabase link --project-ref <ref> # Link to remote project

# Expo
eas build --platform ios          # Build iOS
eas build --platform android      # Build Android
eas submit --platform ios         # Submit to App Store
eas update                        # OTA update

# Testing
pnpm start                        # Start Expo dev server
supabase functions serve          # Serve functions locally
```
