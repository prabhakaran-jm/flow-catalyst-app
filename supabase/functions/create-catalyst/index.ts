// Supabase Edge Function: create-catalyst
// Creates a new catalyst for the authenticated user

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCatalystRequest {
  name: string;
  description?: string;
  inputs_json: any[]; // Array of input descriptors
  prompt_template: string;
}

serve(async (req) => {
  console.log('[create-catalyst] Request received:', req.method, req.url);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Log for debugging (remove in production)
    console.log('[create-catalyst] Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('[create-catalyst] Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
    console.log('[create-catalyst] Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase configuration',
          details: `URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Service Key: ${supabaseServiceKey ? 'OK' : 'MISSING'}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Authenticate user from JWT
    // NOTE: Local Supabase has issues with ES256 JWT verification - getUser can hang for 30+ seconds
    // Use a short timeout and fall through to JWT decode workaround quickly
    let user;
    let authError;
    
    const AUTH_TIMEOUT_MS = 3000; // Don't wait more than 3s for getUser (local Supabase often hangs)
    
    try {
      console.log('[create-catalyst] Calling getUser (timeout:', AUTH_TIMEOUT_MS, 'ms)...');
      const result = await Promise.race([
        supabaseClient.auth.getUser(token),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout - using JWT decode fallback')), AUTH_TIMEOUT_MS)
        ),
      ]);
      console.log('[create-catalyst] getUser result:', result.error ? 'error' : 'ok', result.data?.user?.id || 'no user');
      user = result.data.user;
      authError = result.error;
    } catch (err) {
      const allowDevBypass = Deno.env.get('ALLOW_DEV_AUTH_BYPASS') === 'true';
      if (!allowDevBypass) {
        return new Response(
          JSON.stringify({ error: 'Auth required.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Local Supabase ES256 JWT verification workaround (dev only)
      console.log('[create-catalyst] getUser failed (likely ES256 issue), trying JWT decode workaround...');
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
            )
          );
          const userId = payload.sub;
          const userEmail = payload.email;
          if (userId) {
            user = { id: userId, email: userEmail || undefined } as any;
            console.log('JWT decode workaround succeeded for user:', userId);
          } else {
            authError = { message: 'Invalid JWT payload: missing sub claim' };
          }
        } else {
          authError = { message: 'Invalid JWT format' };
        }
      } catch (decodeErr) {
        console.error('JWT decode workaround failed:', decodeErr);
        authError = { message: 'JWT verification failed' };
      }
    }

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Auth required.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    console.log('[create-catalyst] Parsing request body...');
    const body: CreateCatalystRequest = await req.json();
    console.log('[create-catalyst] Body parsed, name:', body?.name);
    const { name, description, inputs_json, prompt_template } = body;

    // Validate required fields
    if (!name || !prompt_template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name and prompt_template are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!Array.isArray(inputs_json)) {
      return new Response(
        JSON.stringify({ error: 'inputs_json must be an array' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new catalyst with owner_id = user.id and visibility = 'private'
    const { data: catalyst, error: insertError } = await supabaseClient
      .from('catalysts')
      .insert({
        owner_id: user.id,
        name,
        description: description || null,
        inputs_json,
        prompt_template,
        visibility: 'private',
      })
      .select()
      .single();

    if (insertError || !catalyst) {
      console.error('[create-catalyst] Insert failed:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create catalyst',
          details: insertError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return the created catalyst
    return new Response(JSON.stringify(catalyst), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[create-catalyst] Unhandled error:', error);
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
