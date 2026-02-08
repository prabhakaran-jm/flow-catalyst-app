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
  "output": "AI-generated output based on the prompt template and inputs",
  "promptDebug": "Template: ...\nInputs: ...\nUser Profile: ...\n\nFinal Prompt: ..."
}
```

**AI Integration**: Uses OpenAI (default) or Anthropic to generate responses. See `AI_INTEGRATION_SETUP.md` for configuration.

### refine-coach
Coaching-focused refinement for built-in coaches. Returns refined inputs and optional clarifying questions.

**Endpoint**: `POST /functions/v1/refine-coach`

**Request Body**:
```json
{
  "builtInId": "hook",
  "inputs": { "topic": "...", "context": "..." }
}
```

**Response**:
```json
{
  "refinedInputs": { "topic": "...", "context": "..." },
  "questions": [{"id": "q1", "text": "Short question?", "field": "topic"}]
}
```

No auth required (anonymous calls allowed).

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

### Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)

### AI Integration (Required for run-catalyst)
- `AI_PROVIDER` - `openrouter` (default, free models), `openai`, or `anthropic`
- `OPENROUTER_API_KEY` - Optional OpenRouter API key (free models work without it)
- OR `OPENAI_API_KEY` - Your OpenAI API key (if using OpenAI)
- OR `ANTHROPIC_API_KEY` - Your Anthropic API key (if using Anthropic)

### Optional AI Configuration
- `OPENROUTER_MODEL` - Model name (default: `openrouter/free` - auto-selects free models)
- `OPENROUTER_MAX_TOKENS` - Max tokens (default: `1000`)
- `OPENROUTER_TEMPERATURE` - Temperature (default: `0.7`)
- `OPENROUTER_HTTP_REFERER` - Optional app URL for attribution
- `OPENROUTER_X_TITLE` - Optional app name for attribution
- `OPENAI_MODEL` - Model name (default: `gpt-4o-mini`)
- `OPENAI_MAX_TOKENS` - Max tokens (default: `1000`)
- `OPENAI_TEMPERATURE` - Temperature (default: `0.7`)
- `ANTHROPIC_MODEL` - Model name (default: `claude-3-5-sonnet-20241022`)
- `ANTHROPIC_MAX_TOKENS` - Max tokens (default: `1000`)

See `AI_INTEGRATION_SETUP.md` for detailed setup instructions.

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
