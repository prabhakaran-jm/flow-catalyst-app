// Supabase Edge Function: run-catalyst
// Executes a catalyst with provided inputs and returns output

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunCatalystRequest {
  catalyst_id?: string;
  /** For built-in coaches: allows anonymous run without auth */
  built_in?: {
    id: string;
    prompt_template: string;
  };
  inputs: Record<string, any>;
}

interface RunCatalystResponse {
  output: string;
  promptDebug: string;
}

/**
 * Call AI API to generate output from prompt
 * Supports OpenAI, Anthropic, OpenRouter, and Gemini (Google AI Studio)
 */
async function callAI(prompt: string): Promise<string> {
  const aiProvider = Deno.env.get('AI_PROVIDER') || 'openrouter';
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  console.log(`[run-catalyst] Using AI provider: ${aiProvider}`);

  try {
    if (aiProvider === 'openrouter') {
      return await callOpenRouter(prompt, openrouterApiKey);
    } else if (aiProvider === 'openai') {
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      return await callOpenAI(prompt, openaiApiKey);
    } else if (aiProvider === 'anthropic') {
      if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      return await callAnthropic(prompt, anthropicApiKey);
    } else if (aiProvider === 'gemini') {
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not configured. Get a free key at https://aistudio.google.com/apikey');
      }
      return await callGemini(prompt, geminiApiKey);
    } else {
      throw new Error(`Unsupported AI provider: ${aiProvider}. Supported: openrouter, openai, anthropic, gemini`);
    }
  } catch (error) {
    console.error('[run-catalyst] AI API error:', error);
    throw error;
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
  // Default 500 to avoid Kong upstream timeout (~60s) on local dev
  const maxTokens = parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '500');
  const temperature = parseFloat(Deno.env.get('OPENAI_TEMPERATURE') || '0.7');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[run-catalyst] OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  return content.trim();
}

/**
 * Call OpenRouter API (supports free models)
 * Uses OpenAI-compatible API format
 */
async function callOpenRouter(prompt: string, apiKey?: string): Promise<string> {
  // Default to free model router if no API key provided
  const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free';
  const maxTokens = parseInt(Deno.env.get('OPENROUTER_MAX_TOKENS') || '1000');
  const temperature = parseFloat(Deno.env.get('OPENROUTER_TEMPERATURE') || '0.7');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // API key is optional for free models, but recommended
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Optional: Set app attribution headers
  const httpReferer = Deno.env.get('OPENROUTER_HTTP_REFERER');
  const xTitle = Deno.env.get('OPENROUTER_X_TITLE');
  if (httpReferer) headers['HTTP-Referer'] = httpReferer;
  if (xTitle) headers['X-Title'] = xTitle;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[run-catalyst] OpenRouter API error:', errorText);
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  return content.trim();
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022';
  // Default 500 to avoid Kong upstream timeout (~60s) on local dev
  const maxTokens = parseInt(Deno.env.get('ANTHROPIC_MAX_TOKENS') || '500');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[run-catalyst] Anthropic API error:', errorText);
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('No content in Anthropic response');
  }

  return content.trim();
}

/**
 * Call Google Gemini API (Google AI Studio)
 * Get a free API key at https://aistudio.google.com/apikey
 */
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  // Default 500 to avoid Kong upstream timeout (~60s) on local dev; increase in .env if needed
  const maxTokens = parseInt(Deno.env.get('GEMINI_MAX_TOKENS') || '500');
  const temperature = parseFloat(Deno.env.get('GEMINI_TEMPERATURE') || '0.7');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  });

  if (!response.ok) {
    let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;
    
    // Try to parse error details from response
    try {
      const errorData = await response.json();
      const errorDetails = errorData.error;
      
      if (response.status === 429) {
        // Rate limit exceeded
        const quotaInfo = errorDetails?.message || 'Rate limit exceeded';
        errorMessage = `Gemini API rate limit exceeded (429). ${quotaInfo}. Free tier limits: ~15 requests/minute. Wait a minute and try again, or upgrade your API key at https://aistudio.google.com/apikey`;
      } else if (errorDetails?.message) {
        errorMessage = `Gemini API error: ${errorDetails.message}`;
      }
      
      console.error('[run-catalyst] Gemini API error details:', JSON.stringify(errorData, null, 2));
    } catch (parseError) {
      // If JSON parsing fails, use text response
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[run-catalyst] Gemini API error (text):', errorText);
      if (response.status === 429) {
        errorMessage = `Gemini API rate limit exceeded (429). Free tier limits: ~15 requests/minute. Wait a minute and try again.`;
      }
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in Gemini response');
  }

  return content.trim();
}

serve(async (req) => {
  console.log('[run-catalyst] Request received:', req.method, req.url);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    // Parse request body early to check for built-in (anonymous) path
    const body: RunCatalystRequest = await req.json();
    const { catalyst_id, built_in, inputs } = body;

    // Built-in coaches: allow anonymous run (no auth required)
    if (built_in?.id && built_in?.prompt_template) {
      if (!inputs || typeof inputs !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid inputs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      let prompt = built_in.prompt_template;
      for (const [key, value] of Object.entries(inputs)) {
        const placeholder1 = `{${key}}`;
        const placeholder2 = `{{${key}}}`;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        prompt = prompt.replace(new RegExp(placeholder1.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
        prompt = prompt.replace(new RegExp(placeholder2.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
      }
      prompt += `\n\n[Format for mobile: Use short paragraphs (2-3 sentences max), bullet points, clear headings on their own lines (## Heading Text), and concise language. Keep total length under 500 words. Use markdown: **bold** for emphasis, - for bullets. Ensure headings start with ## on a new line with a space after ##. Be scannable.]`;
      const promptDebug = `Built-in: ${built_in.id}\nInputs: ${JSON.stringify(inputs, null, 2)}\n\nFinal Prompt:\n${prompt}`;
      try {
        const aiOutput = await callAI(prompt);
        return new Response(JSON.stringify({ output: aiOutput, promptDebug }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('[run-catalyst] AI API call failed:', error);
        const aiOutput = `Error generating AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI API configuration.`;
        return new Response(JSON.stringify({ output: aiOutput, promptDebug: `Error: ${error}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Standard path: requires auth
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let user;
    let authError;
    try {
      const result = await supabaseClient.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } catch (err) {
      // Local Supabase ES256 JWT verification workaround
      // Decode JWT payload without verification (for local dev only)
      console.log('[run-catalyst] getUser failed (likely ES256 issue), trying JWT decode workaround...');
      
      try {
        // Decode JWT payload (base64 decode, no verification)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
            )
          );
          
          // Extract user ID from payload
          const userId = payload.sub;
          const userEmail = payload.email;
          
          if (userId) {
            // For local dev: Create user object from JWT payload
            // In production, this should use proper JWT verification
            user = {
              id: userId,
              email: userEmail || undefined,
              // Add other fields from payload if needed
            } as any;
            console.log('[run-catalyst] JWT decode workaround succeeded for user:', userId);
          } else {
            authError = { message: 'Invalid JWT payload: missing sub claim' };
          }
        } else {
          authError = { message: 'Invalid JWT format' };
        }
      } catch (decodeErr) {
        console.error('JWT decode workaround failed:', decodeErr);
        authError = { 
          message: `JWT verification failed: ${err?.message || String(err)}. Decode workaround also failed: ${decodeErr?.message || String(decodeErr)}` 
        };
      }
    }

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: authError?.message || 'Failed to verify authentication token',
          hint: 'This is a known issue with local Supabase ES256 JWT verification. Try using production Supabase or sign in again.'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!catalyst_id) {
      return new Response(
        JSON.stringify({ error: 'Missing catalyst_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Load the catalyst (system or owner-owned)
    console.log('[run-catalyst] Loading catalyst:', catalyst_id);
    const { data: catalyst, error: catalystError } = await supabaseClient
      .from('catalysts')
      .select('*')
      .eq('id', catalyst_id)
      .or(`visibility.eq.system,owner_id.eq.${user.id}`)
      .single();

    if (catalystError || !catalyst) {
      return new Response(
        JSON.stringify({
          error: 'Catalyst not found',
          details: catalystError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Load user's profile (needed for rate limit bypass and prompt context)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Profile is optional, continue even if not found
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error loading profile:', profileError);
    }

    // Server-side rate limit: 3 runs/day for free tier; Pro users bypass
    const isPro = profile?.plan === 'pro';
    if (!isPro) {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const { count, error: countError } = await supabaseClient
        .from('catalyst_runs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${tomorrow}T00:00:00Z`);
      const dailyLimit = parseInt(Deno.env.get('DAILY_RUN_LIMIT') || '3', 10);
      if (!countError && (count ?? 0) >= dailyLimit) {
        return new Response(
          JSON.stringify({
            error: 'Daily limit reached',
            details: `You've used ${dailyLimit} runs today. Upgrade to Pro for unlimited runs.`,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build the prompt from template and inputs
    let prompt = catalyst.prompt_template;

    // Replace input placeholders in the template
    // Supports {inputName} or {{inputName}} syntax
    for (const [key, value] of Object.entries(inputs)) {
      const placeholder1 = `{${key}}`;
      const placeholder2 = `{{${key}}}`;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      prompt = prompt.replace(new RegExp(placeholder1.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
      prompt = prompt.replace(new RegExp(placeholder2.replace(/[{}]/g, '\\$&'), 'g'), stringValue);
    }

    // Add user profile context if available
    if (profile) {
      const profileContext: string[] = [];
      if (profile.domain) profileContext.push(`Domain: ${profile.domain}`);
      if (profile.work_style) profileContext.push(`Work Style: ${profile.work_style}`);
      if (profile.values && profile.values.length > 0) {
        profileContext.push(`Values: ${profile.values.join(', ')}`);
      }
      
      if (profileContext.length > 0) {
        prompt = `${prompt}\n\nUser Context:\n${profileContext.join('\n')}`;
      }
    }

    // Mobile-friendly output instructions
    prompt += `\n\n[Format for mobile: Use short paragraphs (2-3 sentences max), bullet points, clear headings on their own lines (## Heading Text), and concise language. Keep total length under 500 words. Use markdown: **bold** for emphasis, - for bullets. Ensure headings start with ## on a new line with a space after ##. Be scannable.]`;

    // Build debug string for troubleshooting
    const promptDebug = [
      `Template: ${catalyst.prompt_template}`,
      `\nInputs: ${JSON.stringify(inputs, null, 2)}`,
      profile ? `\nUser Profile: ${JSON.stringify(profile, null, 2)}` : '',
      `\n\nFinal Prompt:\n${prompt}`,
    ].join('');

    console.log('[run-catalyst] Calling AI API...');

    // Call AI API
    let aiOutput: string;
    try {
      aiOutput = await callAI(prompt);
    } catch (error) {
      console.error('[run-catalyst] AI API call failed:', error);
      // Return error message but don't fail the entire request
      aiOutput = `Error generating AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your AI API configuration.`;
    }

    // Store run in catalyst_runs for history
    try {
      await supabaseClient.from('catalyst_runs').insert({
        catalyst_id: catalyst_id,
        user_id: user.id,
        inputs,
        output: aiOutput,
      });
    } catch (storeError) {
      console.warn('[run-catalyst] Failed to store run (non-fatal):', storeError);
    }

    const response: RunCatalystResponse = {
      output: aiOutput,
      promptDebug,
    };

    console.log('[run-catalyst] Success, returning response');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[run-catalyst] Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
