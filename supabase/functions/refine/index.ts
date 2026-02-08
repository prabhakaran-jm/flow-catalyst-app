// Supabase Edge Function: refine
// Refines user text (advice/context) using AI. Used by Magic Wand button in the app.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefineRequest {
  prompt: string;
  type: 'advice' | 'context';
  instruct: string;
}

interface RefineResponse {
  suggestion: string;
}

async function callAI(prompt: string): Promise<string> {
  const aiProvider = Deno.env.get('AI_PROVIDER') || 'openrouter';
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (aiProvider === 'openrouter') {
    const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free';
    const maxTokens = parseInt(Deno.env.get('OPENROUTER_MAX_TOKENS') || '300');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (openrouterApiKey) headers['Authorization'] = `Bearer ${openrouterApiKey}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in OpenRouter response');
    return content.trim();
  }

  if (aiProvider === 'gemini') {
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini response');
    return content.trim();
  }

  throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}. Use openrouter or gemini.`);
}

/** Force line breaks so content doesn't return as one long line */
function forceLineBreaks(text: string): string {
  return text
    .replace(/([^\n\r])##/g, '$1\n\n##')
    .replace(/##([^\s#\n])/g, '## $1')
    .replace(/([^\n\r])-\s/g, '$1\n- ')
    .replace(/([^\n\r])(\d+\.\s)/g, '$1\n$2')
    .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2')
    .replace(/([.!?])([A-Z])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: RefineRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { prompt, instruct } = body;

  try {
    const userPrompt = prompt || '(empty)';
    const instruction = instruct || 'Refine the following text. Keep it concise.';
    const fullPrompt = `${instruction}

Current text:
---
${userPrompt}
---

Respond with ONLY the refined text. Do not include the instruction, labels, or any preamble. Output the refined text directly.

CRITICAL FORMATTING:
- Put each bullet point on its own line (start with - )
- Put each numbered item on its own line (1. 2. 3.)
- Put each paragraph on its own line (blank line between paragraphs)
- Use actual newlines - do NOT output everything on a single line`;

    let suggestion = (await callAI(fullPrompt)).trim();
    // Strip common AI artifacts: markdown code blocks, leading/trailing quotes
    if (suggestion.startsWith('```')) suggestion = suggestion.replace(/^```\w*\n?|\n?```$/g, '');
    if ((suggestion.startsWith('"') && suggestion.endsWith('"')) || (suggestion.startsWith("'") && suggestion.endsWith("'"))) {
      suggestion = suggestion.slice(1, -1);
    }
    suggestion = forceLineBreaks(suggestion.trim());

    return new Response(
      JSON.stringify({ suggestion } satisfies RefineResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[refine] Error:', error);
    return new Response(
      JSON.stringify({ suggestion: prompt ?? '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
