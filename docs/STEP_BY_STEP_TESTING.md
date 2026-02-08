# Step-by-Step Testing Guide

Follow these steps in order to test your app end-to-end.

## Phase 1: Local Setup Verification

### Step 1: Verify Supabase is Running

```powershell
supabase status
```

**Expected Output:**
- API URL: http://127.0.0.1:54321
- DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio URL: http://127.0.0.1:54323
- Anon key: eyJhbGc...

**If not running:**
```powershell
supabase start
```

**Action Items:**
- [ ] Copy the anon key from output
- [ ] Verify `apps/mobile/src/env.ts` has `SUPABASE_ANON_KEY` set to this value
- [ ] Open Studio: http://127.0.0.1:54323

### Step 2: Verify Database Schema

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **Table Editor**
3. Verify tables exist:
   - [ ] `profiles` table
   - [ ] `catalysts` table

**If tables missing:**
```powershell
supabase db reset
```

### Step 3: Start Edge Functions

**In a NEW terminal:**
```powershell
cd c:\Users\User\Projects\flow-catalyst-app
npx supabase functions serve create-catalyst run-catalyst --no-verify-jwt
```

**Expected Output:**
```
Serving functions on http://127.0.0.1:54321/functions/v1/<function-name>
  - http://127.0.0.1:54321/functions/v1/create-catalyst
  - http://127.0.0.1:54321/functions/v1/run-catalyst
```

**Keep this terminal open!**

### Step 4: Verify Environment Configuration

Check `apps/mobile/src/env.ts`:

```typescript
SUPABASE_URL: 'http://127.0.0.1:54321'
SUPABASE_ANON_KEY: 'your-local-anon-key' // From supabase status
EDGE_FUNCTION_BASE_URL: 'http://127.0.0.1:54321/functions/v1'
```

**Action Items:**
- [ ] All values match local Supabase
- [ ] No placeholder values remain

---

## Phase 2: Mobile App Testing

### Step 5: Start Expo Dev Server

**In a NEW terminal:**
```powershell
cd apps/mobile
pnpm start
```

**Expected Output:**
- Expo DevTools opens in browser
- QR code displays
- Options: `i` (iOS), `a` (Android), `w` (web)

### Step 6: Open App

**Option A - Physical Device:**
1. Install Expo Go app
2. Scan QR code
3. App loads

**Option B - Simulator/Emulator:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

**Action Items:**
- [ ] App loads without errors
- [ ] Sign-in screen appears

---

## Phase 3: Authentication Testing

### Step 7: Test Sign In

1. Enter your email address
2. Click "Send Magic Link"
3. Check Inbucket: http://127.0.0.1:54324
4. Click on your email address
5. Click the magic link in the email
6. App should redirect and sign you in

**Expected Result:**
- [ ] Email received in Inbucket
- [ ] Clicking link redirects to app
- [ ] User is signed in
- [ ] Home screen shows user email

**If issues:**
- Check `supabase/config.toml` redirect URLs
- Verify deep link scheme: `flowcatalyst://auth/callback`

### Step 8: Test Sign Out

1. Click "Sign Out" button
2. Should redirect to sign-in screen

**Expected Result:**
- [ ] Sign out works
- [ ] Redirects to sign-in

---

## Phase 4: Profile Testing

### Step 9: Create Profile

1. Click "Profile" button on home screen
2. Fill in:
   - Domain: "Software Development"
   - Work Style: "Agile, Remote-first"
   - Values: "Innovation, Collaboration"
3. Click "Save"

**Expected Result:**
- [ ] Success alert appears
- [ ] Profile saves successfully
- [ ] Can navigate back

### Step 10: Verify Profile Persists

1. Close app completely
2. Reopen app
3. Go to Profile screen
4. Verify data is still there

**Expected Result:**
- [ ] Profile data loads
- [ ] All fields show saved values

---

## Phase 5: Catalyst Testing

### Step 11: Set Plan to Pro (Testing)

1. On home screen, scroll to "Test Navigation" section
2. Click "Set Pro" button
3. Verify plan shows as "pro"

### Step 12: Create Catalyst

1. Click "+ Create Catalyst"
2. Fill in form:
   - Name: "Blog Post Planner"
   - Description: "Helps plan blog posts"
   - Inputs JSON: `[{"name": "topic", "type": "string"}]`
   - Prompt Template: `Create an outline for a blog post about {topic}`
3. Click "Create"

**Expected Result:**
- [ ] Success alert
- [ ] Redirects to home
- [ ] Catalyst appears in list

**Check Edge Function Logs:**
- Look at terminal where functions are running
- Should see `[create-catalyst]` logs
- Should see "Success, catalyst id: ..."

### Step 13: View Catalyst Details

1. Click on the catalyst you just created
2. Verify details load:
   - [ ] Name displays
   - [ ] Description displays (if provided)
   - [ ] Input fields are available

---

## Phase 6: AI Integration Testing

### Step 14: Configure AI (Optional for Testing)

**Option A - Use Free OpenRouter Models (No API Key):**

In Supabase Dashboard > Edge Functions > Secrets:
- Set `AI_PROVIDER=openrouter`
- Leave `OPENROUTER_API_KEY` empty (free models work without it)

**Option B - Use Your Own API Key:**

- Get OpenRouter key: https://openrouter.ai/keys
- Set `OPENROUTER_API_KEY` in Supabase secrets

### Step 15: Run Catalyst

1. Open a catalyst
2. Add input:
   - Key: "topic"
   - Value: "How to test mobile apps"
3. Click "Add"
4. Click "Run Catalyst"

**Expected Result:**
- [ ] Loading indicator shows
- [ ] AI generates response (if API configured)
- [ ] Output displays in "Output" section
- [ ] Prompt debug shows full prompt

**Check Edge Function Logs:**
- Should see `[run-catalyst] Calling AI API...`
- Should see `[run-catalyst] Success, returning response`

**If AI not configured:**
- Error message shows
- Prompt debug still shows (useful for debugging)

---

## Phase 7: Subscription Testing

### Step 16: Test Free User Limits

1. Set plan to "free" (Test Navigation section)
2. Try to create catalyst
3. Should redirect to paywall

**Expected Result:**
- [ ] Free users redirected to paywall
- [ ] Paywall shows subscription options

### Step 17: Test Paywall

1. Navigate to paywall
2. Verify:
   - [ ] Monthly plan shows ($9.99)
   - [ ] Yearly plan shows ($79.99)
   - [ ] Features list displays
3. Click "Subscribe" (will fail if RevenueCat not configured - expected)

**Expected Result:**
- [ ] Paywall displays correctly
- [ ] Purchase buttons work (or show error if not configured)

**If RevenueCat configured:**
- Purchase flow initiates
- Plan updates after purchase

---

## Phase 8: Production Preparation

### Step 18: Create Supabase Production Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details
4. Wait for creation (~2 minutes)
5. Copy project URL and API keys

### Step 19: Link and Deploy

```powershell
# Link to production
supabase link --project-ref your-project-ref

# Push database
supabase db push

# Deploy functions
supabase functions deploy create-catalyst
supabase functions deploy run-catalyst
```

### Step 20: Configure Production Secrets

In Supabase Dashboard > Edge Functions > Secrets, add:
- `AI_PROVIDER=openrouter`
- `OPENROUTER_API_KEY` (optional, for free models)

### Step 21: Update Mobile App Config

Update `apps/mobile/src/env.ts` with production values:
- `SUPABASE_URL`: Production URL
- `SUPABASE_ANON_KEY`: Production anon key
- `EDGE_FUNCTION_BASE_URL`: Production functions URL

### Step 22: Build Production App

```powershell
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform all --profile production
```

---

## Troubleshooting Common Issues

### Issue: "Failed to create catalyst: Bad Gateway"

**Solution:**
1. Verify Edge Functions are running: Check terminal
2. Verify both `supabase start` AND `supabase functions serve` are running
3. Check Edge Function logs for errors
4. Verify environment variables in `env.ts`

### Issue: Magic link not working

**Solution:**
1. Check Inbucket: http://127.0.0.1:54324
2. Verify redirect URL in `supabase/config.toml`
3. Check deep link scheme matches `app.json`

### Issue: AI not generating responses

**Solution:**
1. Check `AI_PROVIDER` is set in Supabase secrets
2. Verify API key (if using paid models)
3. Check Edge Function logs for API errors
4. Try with `openrouter/free` model (no API key needed)

### Issue: Profile not saving

**Solution:**
1. Check RLS policies in Supabase Studio
2. Verify user is authenticated
3. Check database logs
4. Verify profile table exists

---

## Success Criteria

You're ready to deploy when:

- ✅ All local tests pass
- ✅ Authentication works end-to-end
- ✅ Catalysts can be created and run
- ✅ AI generates responses (if configured)
- ✅ Profile management works
- ✅ Free user limits work correctly
- ✅ No critical errors in logs
- ✅ Production Supabase is set up
- ✅ Edge Functions deployed successfully

---

## Next Steps

1. Complete all test steps above
2. Fix any issues found
3. Follow DEPLOYMENT_GUIDE.md for production deployment
4. Submit to App Store/Play Store
