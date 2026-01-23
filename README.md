# Flow Catalyst

Flow Catalyst is a minimalist, mobile-first AI coaching app for productivity-focused creators. It uses focused "Action Catalysts" and AI to turn abstract advice into instant, repeatable actions, with subscriptions powered by RevenueCat.

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: LLM API integration (via Edge Functions)
- **Payments**: RevenueCat for subscription management
- **State Management**: Zustand, React Query
- **Navigation**: Expo Router (file-based routing)

## Project Structure

```
flow-catalyst-app/
├── apps/
│   └── mobile/          # Expo React Native app
├── supabase/
│   ├── migrations/      # SQL migrations
│   └── functions/       # Edge Functions (Deno/TypeScript)
└── package.json         # Root package.json (pnpm workspaces)
```

## Local Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Supabase CLI (for local development)
- Expo CLI (or use `pnpm start`)

### 1. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install mobile app dependencies
cd apps/mobile
pnpm install
```

### 2. Configure Environment Variables

Create `apps/mobile/src/env.ts` from `apps/mobile/src/env.example.ts`:

```typescript
export const env = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
  EDGE_FUNCTION_BASE_URL: 'YOUR_EDGE_FUNCTION_BASE_URL_HERE',
} as const;
```

Or set environment variables:
```bash
export EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Start Supabase Local Development

```bash
# From project root
supabase start

# This will start:
# - PostgreSQL database (port 54322)
# - Supabase Studio (port 54323)
# - Edge Functions runtime
# - Auth service
```

### 4. Apply Database Migrations

```bash
# Apply migrations to local database
supabase db reset

# Or apply specific migration
supabase migration up
```

### 5. Deploy Edge Functions (Local)

```bash
# Deploy all functions
supabase functions serve

# Or deploy specific function
supabase functions serve run-catalyst
supabase functions serve create-catalyst
```

### 6. Run Expo Mobile App

```bash
# From project root
pnpm dev

# Or from apps/mobile
cd apps/mobile
pnpm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web
```

## Edge Functions

Edge Functions are located in `supabase/functions/`:

- **run-catalyst**: Executes a catalyst with user inputs and returns AI-generated output
- **create-catalyst**: Creates a new catalyst for authenticated users

### Testing Edge Functions Locally

```bash
# Start functions server
supabase functions serve

# Test with curl (replace with your JWT token)
curl -X POST http://localhost:54321/functions/v1/run-catalyst \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalyst_id": "uuid", "inputs": {}}'
```

## Database Schema

Key tables:
- **profiles**: User profile information (domain, work_style, values)
- **catalysts**: Action Catalysts with prompts and input definitions

Apply migrations with:
```bash
supabase db reset
```

## Production Deployment

### Supabase

1. Link your project: `supabase link --project-ref your-project-ref`
2. Push migrations: `supabase db push`
3. Deploy functions: `supabase functions deploy run-catalyst`
4. Deploy functions: `supabase functions deploy create-catalyst`

### Expo

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## Environment Variables Reference

### Mobile App (`apps/mobile/src/env.ts`)

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `EDGE_FUNCTION_BASE_URL`: Base URL for Edge Functions (usually `{SUPABASE_URL}/functions/v1`)

### Edge Functions (set in Supabase dashboard)

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

## License

MIT
