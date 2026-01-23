// Supabase Edge Function: run-catalyst
// Executes a catalyst with provided inputs and returns output

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunCatalystRequest {
  catalyst_id: string;
  inputs: Record<string, any>;
}

interface RunCatalystResponse {
  output: string;
  promptDebug: string;
}

serve(async (req) => {
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

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
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
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: RunCatalystRequest = await req.json();
    const { catalyst_id, inputs } = body;

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

    // Load user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Profile is optional, continue even if not found
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error loading profile:', profileError);
    }

    // Build placeholder prompt string
    const promptParts = [
      `Template: ${catalyst.prompt_template}`,
      `\nInputs: ${JSON.stringify(inputs, null, 2)}`,
    ];

    if (profile) {
      promptParts.push(`\nUser Profile:`);
      if (profile.domain) promptParts.push(`Domain: ${profile.domain}`);
      if (profile.work_style) promptParts.push(`Work Style: ${profile.work_style}`);
      if (profile.values && profile.values.length > 0) {
        promptParts.push(`Values: ${profile.values.join(', ')}`);
      }
    }

    const promptDebug = promptParts.join('\n');

    // Return mock output for now
    const response: RunCatalystResponse = {
      output: 'Mock output for now - AI integration pending',
      promptDebug,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
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
