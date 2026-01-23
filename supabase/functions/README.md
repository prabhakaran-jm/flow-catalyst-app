# Supabase Edge Functions

This directory contains Supabase Edge Functions written in TypeScript/Deno.

## Functions

### run-catalyst
Executes a catalyst with provided inputs and returns output.

**Endpoint**: `POST /functions/v1/run-catalyst`

**Request Body**:
```json
{
  "catalyst_id": "uuid",
  "inputs": {
    "key": "value"
  }
}
```

**Response**:
```json
{
  "output": "Mock output for now - AI integration pending",
  "promptDebug": "Template: ...\nInputs: ...\nUser Profile: ..."
}
```

### create-catalyst
Creates a new catalyst for the authenticated user.

**Endpoint**: `POST /functions/v1/create-catalyst`

**Request Body**:
```json
{
  "name": "Catalyst Name",
  "description": "Optional description",
  "inputs_json": [],
  "prompt_template": "Template string"
}
```

**Response**: Returns the created catalyst object.

## Environment Variables

Set these in your Supabase project settings:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)

## Authentication

Both functions require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Deployment

Deploy functions using the Supabase CLI:
```bash
supabase functions deploy run-catalyst
supabase functions deploy create-catalyst
```
