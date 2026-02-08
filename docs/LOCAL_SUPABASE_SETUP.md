# Supabase Local Development Setup

This guide will help you set up Supabase locally for testing, which bypasses rate limits and allows unlimited email testing.

## Step 1: Start Supabase Locally

From the project root:

```powershell
supabase start
```

This will start:
- **PostgreSQL database** on port `54322`
- **Supabase Studio** (admin UI) on port `54323`
- **API** on port `54321`
- **Inbucket** (email testing) on port `54324`
- **Edge Functions runtime**

After running `supabase start`, you'll see output like:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these values!** You'll need the API URL and anon key.

## Step 2: Apply Database Migrations

```powershell
supabase db reset
```

This applies all migrations from `supabase/migrations/` to your local database.

## Step 3: Start Edge Functions (REQUIRED for Create/Run Catalyst)

**Important:** The Create Catalyst and Run Catalyst features require Edge Functions to be running. You must have **both** `supabase start` (Step 1) and this command running.

**Note:** Use `--no-verify-jwt` flag to bypass Edge Runtime JWT verification (workaround for ES256 compatibility issues in local Supabase). Add `ALLOW_DEV_AUTH_BYPASS=true` to your `.env` so the functions can use the JWT decode fallback when `getUser` fails locally. **Never set this in production.**

In a **separate terminal**, from the **project root** (not apps/mobile), run:

```powershell
npx supabase functions serve create-catalyst run-catalyst refine --no-verify-jwt --env-file .env
```

Ensure your `.env` contains:
- `ALLOW_DEV_AUTH_BYPASS=true` for local testing
- `ALLOW_TEST_PLAN_OVERRIDE=true` so Set Pro bypasses the daily run limit when testing custom coaches

Or to serve all functions:

```powershell
npx supabase functions serve --no-verify-jwt
```

Keep this running while testing. The functions will be available at `http://127.0.0.1:54321/functions/v1/`.

**Why --no-verify-jwt?** Local Supabase has a known issue with ES256 JWT verification. This flag bypasses the Edge Runtime's built-in verification, and our functions handle auth manually by decoding the JWT payload.

## Step 4: Update Your App Configuration

Update `apps/mobile/src/env.ts` to use local Supabase:

```typescript
export const env = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'YOUR_LOCAL_ANON_KEY_HERE', // From supabase start output
  EDGE_FUNCTION_BASE_URL: 'http://127.0.0.1:54321/functions/v1',
} as const;
```

Replace `YOUR_LOCAL_ANON_KEY_HERE` with the `anon key` from the `supabase start` output.

## Step 5: Update Supabase Config for Local Redirects

Update `supabase/config.toml` to allow your Expo web port:

```toml
[auth]
site_url = "http://127.0.0.1:8081"  # Your Expo web port
additional_redirect_urls = [
  "http://127.0.0.1:8081/auth/callback",  # Your Expo web port
  "flowcatalyst://auth/callback"  # Mobile deep link
]
```

Then restart Supabase:
```powershell
supabase stop
supabase start
```

## Step 6: Access Email Testing (Inbucket)

**This is the key benefit!** Instead of real emails, all magic links go to Inbucket:

1. Open: http://127.0.0.1:54324
2. Click on any email address (e.g., `prabhakaran.jm@gmail.com`)
3. See all magic link emails sent to that address
4. Click the magic link directly from Inbucket - **no rate limits!**

## Step 7: Test Your App

1. Start your Expo app:
   ```powershell
   cd apps/mobile
   pnpm web
   ```

2. Request a magic link from the sign-in screen

3. Go to Inbucket (http://127.0.0.1:54324) to see the email

4. Click the magic link from Inbucket - it will sign you in!

## Benefits of Local Supabase

✅ **No rate limits** - Send unlimited magic links  
✅ **Instant emails** - No waiting for email delivery  
✅ **Easy testing** - View all emails in Inbucket web UI  
✅ **Fast development** - No network latency  
✅ **Free** - No usage limits  

## Switching Back to Production

When you want to use production Supabase again, just update `apps/mobile/src/env.ts` back to your production URLs.

## Useful Commands

```powershell
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# View status
supabase status

# Reset database (apply migrations)
supabase db reset

# View logs
supabase logs

# Access Studio (admin UI)
# Open: http://127.0.0.1:54323

# Access Inbucket (email testing)
# Open: http://127.0.0.1:54324
```

## Troubleshooting

**502 Bad Gateway when creating catalyst:**
- **Both services must run**: `supabase start` AND `supabase functions serve` (in separate terminals)
- Run `supabase functions serve` from the **project root** (not from `apps/mobile`)
- Restart both: `supabase stop` → `supabase start` → then `npx supabase functions serve create-catalyst run-catalyst --no-verify-jwt`
- Verify with curl: `curl -X POST http://127.0.0.1:54321/functions/v1/create-catalyst -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ANON_KEY" -d "{\"name\":\"test\",\"inputs_json\":[],\"prompt_template\":\"hi\"}"`

**Testing on physical device (Expo Go):**
- Use your machine's LAN IP instead of 127.0.0.1 (e.g. `http://192.168.1.100:54321`)
- Update both `SUPABASE_URL` and `EDGE_FUNCTION_BASE_URL` in env.ts

**Port already in use:**
- Stop existing Supabase: `supabase stop`
- Or change ports in `supabase/config.toml`

**Can't connect to local Supabase:**
- Make sure Docker Desktop is running
- Check `supabase status` to see what's running

**Migrations not applied:**
- Run `supabase db reset` to apply all migrations
