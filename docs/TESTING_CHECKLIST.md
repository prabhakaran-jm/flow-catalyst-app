# Flow Catalyst - End-to-End Testing Checklist

Use this checklist to systematically test all features before deployment.

## Prerequisites

- [ ] Local Supabase running (`supabase start`)
- [ ] Edge Functions running (`supabase functions serve`)
- [ ] Expo dev server running (`pnpm start`)
- [ ] Test device/emulator ready

---

## 1. Authentication Flow

### Sign In
- [ ] Navigate to sign-in screen
- [ ] Enter test email address
- [ ] Click "Send Magic Link"
- [ ] Check email (Inbucket for local: http://127.0.0.1:54324)
- [ ] Click magic link from email
- [ ] App redirects and signs in successfully
- [ ] User email displays on home screen

### Sign Out
- [ ] Click "Sign Out" button
- [ ] App redirects to sign-in screen
- [ ] User is logged out

---

## 2. Profile Management

### View Profile
- [ ] Click "Profile" button on home screen
- [ ] Profile screen loads
- [ ] Form fields are empty (if no profile exists)

### Create/Edit Profile
- [ ] Enter domain: "Software Development"
- [ ] Enter work style: "Agile, Remote-first"
- [ ] Enter values: "Innovation, Collaboration, Work-life balance"
- [ ] Click "Save"
- [ ] Success alert appears
- [ ] Navigate back to home
- [ ] Re-open profile screen
- [ ] Previously saved data loads correctly

### Profile Validation
- [ ] Save with empty fields (should work - nulls allowed)
- [ ] Save with only domain (should work)
- [ ] Values field accepts comma-separated list

---

## 3. Catalyst Management

### View Catalyst List
- [ ] Home screen shows "Your Catalysts" section
- [ ] Empty state shows "No catalysts yet" message
- [ ] "Create Catalyst" button is visible

### Create Catalyst (Free User)
- [ ] As free user, click "Create Catalyst"
- [ ] Redirects to paywall (expected)
- [ ] Paywall shows subscription options

### Create Catalyst (Pro User)
- [ ] Set plan to 'pro' (using test navigation)
- [ ] Click "Create Catalyst"
- [ ] Create screen loads
- [ ] Fill in:
  - Name: "Test Catalyst"
  - Description: "A test catalyst"
  - Inputs JSON: `[{"name": "task", "type": "string"}]`
  - Prompt Template: "Help me with: {task}"
- [ ] Click "Create"
- [ ] Success alert appears
- [ ] Navigate back to home
- [ ] New catalyst appears in list

### View Catalyst Details
- [ ] Click on a catalyst from the list
- [ ] Catalyst detail screen loads
- [ ] Shows catalyst name and description
- [ ] Shows input fields for adding inputs

---

## 4. Catalyst Execution

### Run Catalyst (Without AI)
- [ ] Open a catalyst
- [ ] Add input: Key="task", Value="Write a blog post"
- [ ] Click "Add"
- [ ] Input appears in list
- [ ] Click "Run Catalyst"
- [ ] Loading indicator shows
- [ ] If AI not configured: Error message shows
- [ ] If AI configured: Response appears

### Run Catalyst (With AI - OpenRouter Free)
- [ ] Ensure `AI_PROVIDER=openrouter` is set (or default)
- [ ] Run catalyst with inputs
- [ ] AI generates response
- [ ] Output displays in "Output" section
- [ ] Prompt debug shows full prompt sent to AI

### Input Management
- [ ] Add multiple inputs
- [ ] Remove an input (click ×)
- [ ] Run with empty inputs (should be disabled)
- [ ] Run with valid inputs (should work)

---

## 5. Free User Limits

### Daily Run Limit
- [ ] Set plan to 'free' (using test navigation)
- [ ] Open a catalyst
- [ ] Check "Runs today: X/3" displays
- [ ] Run catalyst 3 times
- [ ] After 3rd run, limit warning appears
- [ ] "Run Catalyst" button is disabled
- [ ] "Upgrade to Pro" button appears

### Create Limit
- [ ] As free user, try to create catalyst
- [ ] Redirects to paywall (expected)

---

## 6. Subscription Flow

### View Paywall
- [ ] Navigate to paywall
- [ ] Monthly and Yearly plans display
- [ ] Features list shows
- [ ] "Subscribe" buttons are visible

### Purchase Flow (Test Mode)
- [ ] Click "Subscribe" on a plan
- [ ] Loading indicator shows
- [ ] If RevenueCat configured: Purchase flow initiates
- [ ] If not configured: Error message shows
- [ ] After purchase: Plan updates to 'pro'
- [ ] Can now create catalysts

---

## 7. Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to create catalyst
- [ ] Error message displays
- [ ] Try to run catalyst
- [ ] Error message displays

### Invalid Data
- [ ] Try to create catalyst with empty name
- [ ] Error validation shows
- [ ] Try to create with invalid JSON in inputs
- [ ] Error validation shows

### Edge Function Errors
- [ ] Check Edge Function logs in terminal
- [ ] Verify errors are logged with `[run-catalyst]` prefix
- [ ] Check that error messages are user-friendly

---

## 8. Data Persistence

### Profile Persistence
- [ ] Save profile
- [ ] Close app completely
- [ ] Reopen app
- [ ] Profile data still exists

### Catalyst Persistence
- [ ] Create catalyst
- [ ] Close app completely
- [ ] Reopen app
- [ ] Catalyst still in list

### Session Persistence
- [ ] Sign in
- [ ] Close app completely
- [ ] Reopen app
- [ ] Still signed in (session persisted)

---

## 9. UI/UX Testing

### Navigation
- [ ] All screens are accessible
- [ ] Back buttons work correctly
- [ ] Deep linking works (auth callback)

### Loading States
- [ ] Loading indicators show during API calls
- [ ] Buttons disabled during operations
- [ ] No double-submissions possible

### Error States
- [ ] Error messages are clear and actionable
- [ ] Errors don't crash the app
- [ ] User can recover from errors

### Responsiveness
- [ ] Test on different screen sizes
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Forms are usable

---

## 10. Production Readiness

### Environment Variables
- [ ] Production Supabase URL configured
- [ ] Production Supabase anon key configured
- [ ] RevenueCat API keys configured (if using)
- [ ] AI API keys configured (if using)

### Security
- [ ] No API keys in code (all in env.ts)
- [ ] Service role key not exposed to client
- [ ] RLS policies are correct
- [ ] Auth redirect URLs configured

### Performance
- [ ] App loads quickly
- [ ] API calls complete in reasonable time
- [ ] No memory leaks (check with dev tools)
- [ ] Images/assets optimized

---

## Test Results Summary

Date: _______________
Tester: _______________

**Passed**: ___ / 50 tests
**Failed**: ___ / 50 tests
**Notes**: 

---

## Common Issues & Solutions

### Issue: Magic link not working
- Check Inbucket (local): http://127.0.0.1:54324
- Verify redirect URLs in Supabase config
- Check deep link scheme matches app.json

### Issue: Catalyst not appearing in list
- Check browser console for errors
- Verify RLS policies allow SELECT
- Check Edge Function logs

### Issue: AI not generating responses
- Verify AI_PROVIDER env var is set
- Check API key is valid
- Review Edge Function logs for API errors

### Issue: Profile not saving
- Check RLS policies allow INSERT/UPDATE
- Verify user is authenticated
- Check database logs

---

## Next Steps After Testing

1. Fix any issues found
2. Re-test fixed features
3. Proceed to deployment (see PRODUCTION_DEPLOY.md)
4. Set up production monitoring
5. Prepare for App Store/Play Store submission
