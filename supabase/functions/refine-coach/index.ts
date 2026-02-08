// Supabase Edge Function: refine-coach
// Coaching-focused refinement for built-in coaches. Returns refined inputs and optional clarifying questions.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefineCoachRequest {
  builtInId: string;
  inputs: Record<string, string>;
}

export interface RefineCoachQuestion {
  id: string;
  text: string;
  field: string;
}

interface RefineCoachResponse {
  refinedInputs: Record<string, string>;
  questions?: RefineCoachQuestion[];
}

const COACH_CONTEXT: Record<string, string> = {
  hook: 'Writing coach for compelling hooks. Fields: topic, context.',
  outline: 'Content coach for outlines. Fields: topic, goal.',
  'block-breaker': 'Productivity coach for creative blocks. Fields: block, tried.',
  clarity: 'Clarity coach for messy ideas. Fields: idea, constraint.',
  decision: 'Decision coach. Fields: decision, options.',
};

async function callAI(prompt: string): Promise<string> {
  const aiProvider = Deno.env.get('AI_PROVIDER') || 'openrouter';
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (aiProvider === 'openrouter') {
    const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/free';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (openrouterApiKey) headers['Authorization'] = `Bearer ${openrouterApiKey}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5,
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
        generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini response');
    return content.trim();
  }

  throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}`);
}

function parseResponse(raw: string): RefineCoachResponse {
  // Strip markdown code blocks if present
  let text = raw.trim();
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) text = jsonMatch[1].trim();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed.refinedInputs !== 'object') {
    return { refinedInputs: {} };
  }
  const refinedInputs: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.refinedInputs)) {
    if (typeof v === 'string') refinedInputs[k] = v;
  }
  const questions: RefineCoachQuestion[] = [];
  if (Array.isArray(parsed.questions)) {
    for (const q of parsed.questions) {
      if (q?.id && q?.text && q?.field) {
        questions.push({ id: String(q.id), text: String(q.text), field: String(q.field) });
      }
    }
  }
  return { refinedInputs, questions: questions.length > 0 ? questions : undefined };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: RefineCoachRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { builtInId, inputs } = body;
  if (!builtInId || !inputs || typeof inputs !== 'object') {
    return new Response(
      JSON.stringify({ error: 'builtInId and inputs required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const coachContext = COACH_CONTEXT[builtInId] || ' Coaching context.';
  const inputsStr = Object.entries(inputs)
    .map(([k, v]) => `${k}: ${String(v || '(empty)')}`)
    .join('\n');

  const prompt = `You are a ${coachContext}

Current inputs:
${inputsStr}

TASK:
1. Refine each non-empty input to be more actionable and coaching-ready. Keep the user's voice. Output each field.
2. If any input is sparse, vague, or unclear, generate 1-3 short clarifying questions. Each question maps to ONE field.

RESPOND WITH ONLY VALID JSON, no other text:
{
  "refinedInputs": { "field1": "refined value", "field2": "..." },
  "questions": [{"id": "q1", "text": "Short question?", "field": "fieldName"}]
}

Rules:
- refinedInputs: Include every field from inputs. For empty fields, use "" or a brief placeholder.
- questions: Optional. Max 3. Each must have id, text, field. Only add if input needs clarification.
- Keep questions 1 short sentence each.`;

  try {
    const raw = await callAI(prompt);
    const result = parseResponse(raw);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[refine-coach] Error:', error);
    return new Response(
      JSON.stringify({ refinedInputs: inputs, questions: undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
