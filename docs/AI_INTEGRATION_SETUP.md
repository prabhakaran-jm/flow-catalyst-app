# AI Integration Setup Guide

This guide explains how to configure AI/LLM integration for the Flow Catalyst app.

## Supported Providers

- **OpenRouter** (default) - Free and paid models from multiple providers
- **OpenAI** - GPT-4, GPT-3.5, GPT-4o-mini
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, etc.

## Quick Start with Free Models (OpenRouter)

OpenRouter is the **easiest way to get started** - it offers free models that work without an API key!

### Option 1: Use Free Models (No API Key Required)

1. Set environment variable:
   ```bash
   AI_PROVIDER=openrouter
   ```

2. That's it! The function will use `openrouter/free` which automatically selects from available free models.

### Option 2: Get OpenRouter API Key (Recommended)

1. Sign up at https://openrouter.ai/
2. Get your API key from https://openrouter.ai/keys
3. Set environment variables:
   ```bash
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

**Benefits of using an API key:**
- Higher rate limits
- Access to more models
- Better reliability
- Usage tracking

## Configuration

### Step 1: Choose Your AI Provider

Set the `AI_PROVIDER` environment variable in your Supabase project:
- `openrouter` (default) - Free models available, no API key required
- `openai` - Requires OpenAI API key
- `anthropic` - Requires Anthropic API key

### Step 2: Get API Keys (Optional for OpenRouter Free)

#### OpenRouter (Recommended - Free Models Available)
1. **Free Option**: No API key needed! Just set `AI_PROVIDER=openrouter`
2. **With API Key** (recommended for production):
   - Sign up at https://openrouter.ai/
   - Go to API Keys: https://openrouter.ai/keys
   - Create a new API key
   - Copy the key (starts with `sk-or-v1-`)

#### OpenAI
1. Sign up at https://platform.openai.com/
2. Go to API Keys: https://platform.openai.com/api-keys
3. Create a new API key
4. Copy the key (starts with `sk-`)

#### Anthropic
1. Sign up at https://console.anthropic.com/
2. Go to API Keys: https://console.anthropic.com/settings/keys
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### Step 3: Set Environment Variables in Supabase

#### For Local Development

Create a `.env` file in your project root or set environment variables:

```bash
# Required: Choose one provider
AI_PROVIDER=openrouter  # Default - free models available!

# Optional: OpenRouter (works without API key for free models)
OPENROUTER_API_KEY=sk-or-v1-your-key-here  # Optional but recommended
OPENROUTER_MODEL=openrouter/free  # Default: auto-selects free models
OPENROUTER_MAX_TOKENS=1000
OPENROUTER_TEMPERATURE=0.7

# OR use OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-your-openai-key-here

# OR use Anthropic
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: OpenAI-specific settings
OPENAI_MODEL=gpt-4o-mini  # Default: gpt-4o-mini
OPENAI_MAX_TOKENS=1000    # Default: 1000
OPENAI_TEMPERATURE=0.7    # Default: 0.7

# Optional: Anthropic-specific settings
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Default: claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=1000                   # Default: 1000
```

#### For Production (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Edge Functions** > **Secrets**
3. Add the following secrets:
   - `AI_PROVIDER` (optional, defaults to `openrouter`)
   - `OPENROUTER_API_KEY` (optional - free models work without it)
   - `OPENROUTER_MODEL` (optional, defaults to `openrouter/free`)
   - `OPENROUTER_MAX_TOKENS` (optional)
   - `OPENROUTER_TEMPERATURE` (optional)
   - OR `OPENAI_API_KEY` (if using OpenAI)
   - OR `ANTHROPIC_API_KEY` (if using Anthropic)
   - Plus provider-specific optional settings

### Step 4: Test the Integration

1. Start your Supabase functions locally:
   ```bash
   npx supabase functions serve run-catalyst --no-verify-jwt
   ```

2. Create a test catalyst with a simple prompt template:
   ```json
   {
     "name": "Test Catalyst",
     "inputs_json": [{"name": "task", "type": "string"}],
     "prompt_template": "Help me break down this task into steps: {task}"
   }
   ```

3. Run the catalyst with test inputs and verify the AI response

## Prompt Template Syntax

Catalysts use prompt templates that support input placeholders:

### Basic Syntax
- `{inputName}` - Single curly braces
- `{{inputName}}` - Double curly braces (also supported)

### Example Template
```
You are a productivity coach. Help me create an action plan for: {goal}

Context:
- Current situation: {situation}
- Timeline: {timeline}
- Resources available: {resources}
```

When running with inputs:
```json
{
  "goal": "Launch a new product",
  "situation": "I have a team of 5 people",
  "timeline": "3 months",
  "resources": "$50k budget"
}
```

The template will be replaced with actual values before sending to the AI.

## User Profile Context

If a user has a profile with `domain`, `work_style`, or `values`, this context is automatically appended to the prompt:

```
[Your prompt here]

User Context:
Domain: Software Development
Work Style: Agile, Remote-first
Values: Innovation, Collaboration, Work-life balance
```

## Model Selection

### OpenRouter Models (Recommended)

**Free Models:**
- `openrouter/free` (default) - Automatically selects from available free models
- `meta-llama/llama-3.2-3b-instruct:free` - Llama 3.2 3B (fast, free)
- `google/gemini-flash-1.5:free` - Google Gemini Flash (free tier)
- `qwen/qwen-2.5-7b-instruct:free` - Qwen 2.5 7B (free)

**Popular Free Models:**
- `mistralai/mistral-7b-instruct:free`
- `huggingface/zephyr-7b-beta:free`
- `openchat/openchat-7b:free`

**Paid Models (with API key):**
- `openai/gpt-4o-mini` - OpenAI GPT-4o Mini
- `openai/gpt-4o` - OpenAI GPT-4o
- `anthropic/claude-3.5-sonnet` - Anthropic Claude 3.5 Sonnet
- `google/gemini-pro-1.5` - Google Gemini Pro

Browse all models at: https://openrouter.ai/models

### OpenAI Models (Direct)
- `gpt-4o-mini` (default) - Fast, cost-effective
- `gpt-4o` - More capable, higher cost
- `gpt-4-turbo` - Latest GPT-4
- `gpt-3.5-turbo` - Legacy, cheaper option

### Anthropic Models (Direct)
- `claude-3-5-sonnet-20241022` (default) - Best balance
- `claude-3-opus-20240229` - Most capable
- `claude-3-haiku-20240307` - Fastest, cheapest

## Error Handling

If the AI API call fails:
- The function will return an error message instead of crashing
- Check the function logs for detailed error information
- Common issues:
  - Invalid API key
  - Rate limit exceeded
  - Model not available
  - Network issues

## Cost Considerations

### OpenRouter Pricing
- **Free Models**: Completely free! No credit card required
- **Paid Models**: Pay-as-you-go, often cheaper than direct API access
- Browse pricing at: https://openrouter.ai/models

**Free Model Recommendations:**
- `openrouter/free` - Auto-selects best free model for your request
- `meta-llama/llama-3.2-3b-instruct:free` - Fast and capable
- `google/gemini-flash-1.5:free` - Good quality, free tier

### OpenAI Pricing (Direct - as of 2024)
- GPT-4o-mini: ~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens
- GPT-4o: ~$2.50 / 1M input tokens, ~$10 / 1M output tokens

### Anthropic Pricing (Direct - as of 2024)
- Claude 3.5 Sonnet: ~$3 / 1M input tokens, ~$15 / 1M output tokens
- Claude 3 Haiku: ~$0.25 / 1M input tokens, ~$1.25 / 1M output tokens

**Recommendations:**
- **Start with OpenRouter free models** - No cost, great for development
- Use `openrouter/free` for automatic model selection
- Upgrade to paid models only when needed for production
- Set appropriate `max_tokens` limits to control costs
- Monitor usage in your provider's dashboard

## Troubleshooting

### "AI API error: 401 Unauthorized"
- Check that your API key is correct
- Verify the key hasn't expired
- Ensure the key has the necessary permissions

### "No content in [Provider] response"
- The API returned a response but without content
- Check API logs for details
- Try a simpler prompt to test

### "Rate limit exceeded"
- You've hit the API rate limit
- Wait before retrying
- Consider upgrading your API plan
- Implement retry logic with exponential backoff

### Slow Responses
- Use faster models (gpt-4o-mini, claude-3-haiku)
- Reduce `max_tokens` if responses are too long
- Check network latency

## Advanced Configuration

### Custom System Prompts

You can add a system prompt by modifying the `callAI` function in `run-catalyst/index.ts`:

```typescript
messages: [
  {
    role: 'system',
    content: 'You are a helpful productivity coach...',
  },
  {
    role: 'user',
    content: prompt,
  },
],
```

### Streaming Responses

For real-time streaming (not currently implemented), you would:
1. Set `stream: true` in the API request
2. Handle Server-Sent Events (SSE) responses
3. Update the client to handle streaming

## Security Best Practices

1. **Never commit API keys** - Use environment variables/secrets
2. **Use service role keys** - Edge Functions use service role, not anon keys
3. **Monitor usage** - Set up alerts for unusual API usage
4. **Rate limiting** - Consider implementing rate limits per user
5. **Input validation** - Validate and sanitize user inputs before sending to AI

## Next Steps

### Quick Start (Free)
- [ ] Set `AI_PROVIDER=openrouter` (or leave default)
- [ ] Test with a simple catalyst - it will use free models automatically!
- [ ] No API key needed to get started

### Production Setup
- [ ] Get OpenRouter API key (optional but recommended)
- [ ] Add API key to Supabase secrets
- [ ] Test with a simple catalyst
- [ ] Monitor costs and usage
- [ ] Adjust model/temperature settings based on results
- [ ] Consider adding caching for common prompts

## Why OpenRouter?

✅ **Free models available** - No credit card required  
✅ **Unified API** - Same interface for all providers  
✅ **Better pricing** - Often cheaper than direct API access  
✅ **Model selection** - Easy to switch between models  
✅ **No vendor lock-in** - Switch providers anytime
