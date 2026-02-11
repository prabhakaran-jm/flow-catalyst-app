/**
 * API Helper Functions
 * 
 * Functions to interact with Supabase Edge Functions and Database
 */

import { supabaseClient } from './supabaseClient';
import { supabaseConfig } from './supabaseConfig';

/**
 * Catalyst type matching database schema
 */
export interface Catalyst {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  inputs_json: any[];
  prompt_template: string;
  visibility: string;
  created_at: string;
}

// Get edge function base URL (platform-aware for Android emulator)
const getEdgeFunctionBaseUrl = (): string => {
  const url = supabaseConfig.edgeFunctionBaseUrl;
  if (!url) {
    throw new Error('EDGE_FUNCTION_BASE_URL is not configured');
  }
  return url;
};

/**
 * Get the current session's access token
 */
async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

/**
 * Run a catalyst with provided inputs
 * 
 * @param catalystId - UUID of the catalyst to run
 * @param inputs - Input values as a record
 * @returns Promise with output and promptDebug
 */
export async function runCatalyst({
  catalystId,
  inputs,
  /** When true (Set Pro + skipRevenueCat), server bypasses rate limit for testing */
  xTestPro,
}: {
  catalystId: string;
  inputs: Record<string, any>;
  xTestPro?: boolean;
}): Promise<{ output: string; promptDebug: string }> {
  const accessToken = await getAccessToken();
  const baseUrl = getEdgeFunctionBaseUrl();

  console.log('Running catalyst at:', `${baseUrl}/run-catalyst`);
  console.log('Catalyst ID:', catalystId);
  console.log('Inputs:', inputs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  if (xTestPro) {
    headers['X-Test-Pro'] = 'true';
  }

  const response = await fetch(`${baseUrl}/run-catalyst`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      catalyst_id: catalystId,
      inputs,
    }),
  });

  console.log('Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorData = await response.json().catch(async () => {
      // If JSON parsing fails, try to get text
      const text = await response.text().catch(() => 'Unknown error');
      console.error('Failed to parse error response:', text);
      return { error: `HTTP ${response.status}: ${text || response.statusText}` };
    });
    const details = errorData.details ? ` (${errorData.details})` : '';
    const hint = errorData.hint ? ` - ${errorData.hint}` : '';
    const badGatewayHint =
      response.status === 502
        ? ' Ensure both "supabase start" and "supabase functions serve" are running (see README or docs/QUICK_START.md).'
        : '';
    console.error('Run catalyst error:', errorData);
    throw new Error(
      (errorData.error || `Failed to run catalyst: ${response.statusText}`) +
        details +
        hint +
        badGatewayHint
    );
  }

  const result = await response.json();
  console.log('Catalyst run successfully:', { output: result.output?.substring(0, 100) + '...' });
  return result;
}

/**
 * Refine built-in coach inputs with coaching-focused AI. Returns refined inputs and optional clarifying questions.
 */
export interface RefineCoachQuestion {
  id: string;
  text: string;
  field: string;
}

export interface RefineCoachResult {
  refinedInputs: Record<string, string>;
  questions?: RefineCoachQuestion[];
}

export async function refineBuiltInCoach({
  builtInId,
  inputs,
}: {
  builtInId: string;
  inputs: Record<string, string>;
}): Promise<RefineCoachResult> {
  const baseUrl = getEdgeFunctionBaseUrl();

  const response = await fetch(`${baseUrl}/refine-coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ builtInId, inputs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Refine failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Run a built-in coach (no auth required for anonymous users)
 */
export async function runBuiltInCoach({
  builtInId,
  promptTemplate,
  inputs,
}: {
  builtInId: string;
  promptTemplate: string;
  inputs: Record<string, any>;
}): Promise<{ output: string; promptDebug: string }> {
  const baseUrl = getEdgeFunctionBaseUrl();

  const response = await fetch(`${baseUrl}/run-catalyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      built_in: { id: builtInId, prompt_template: promptTemplate },
      inputs,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Failed to run coach: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all catalysts for the current user
 * Includes user's own catalysts and system catalysts
 * 
 * @returns Promise with array of catalysts
 */
export async function fetchCatalysts(): Promise<Catalyst[]> {
  const { data, error } = await supabaseClient
    .from('catalysts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching catalysts:', error);
    throw new Error(`Failed to fetch catalysts: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single catalyst by ID
 * 
 * @param catalystId - UUID of the catalyst
 * @returns Promise with the catalyst
 */
export async function fetchCatalyst(catalystId: string): Promise<Catalyst> {
  const { data, error } = await supabaseClient
    .from('catalysts')
    .select('*')
    .eq('id', catalystId)
    .single();

  if (error) {
    console.error('Error fetching catalyst:', error);
    throw new Error(`Failed to fetch catalyst: ${error.message}`);
  }

  if (!data) {
    throw new Error('Catalyst not found');
  }

  return data;
}

/**
 * Profile type matching database schema
 */
export interface Profile {
  id: string;
  created_at: string;
  domain: string | null;
  work_style: string | null;
  values: string[] | null;
  plan: 'free' | 'pro';
}

/**
 * Fetch the current user's profile
 * 
 * @returns Promise with the user's profile, or null if not found
 */
export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .single();

  if (error) {
    // Profile might not exist yet, which is okay
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

/**
 * Update the current user's profile
 * 
 * @param updates - Profile fields to update
 * @returns Promise with the updated profile
 */
export async function updateProfile(updates: {
  domain?: string | null;
  work_style?: string | null;
  values?: string[] | null;
  plan?: 'free' | 'pro';
}): Promise<Profile> {
  const {
    data: { user: authUser },
    error: sessionError,
  } = await supabaseClient.auth.getUser();

  if (sessionError || !authUser?.id) {
    throw new Error('Not authenticated');
  }

  // Include id for upsert - required for INSERT when profile doesn't exist yet (RLS)
  const payload = { id: authUser.id, ...updates };

  const { data, error } = await supabaseClient
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to update profile');
  }

  return data;
}

/**
 * Create a new catalyst
 * 
 * @param payload - Catalyst creation payload
 * @returns Promise with the created catalyst
 */
export async function createCatalyst(payload: {
  name: string;
  description?: string;
  inputs_json: any[];
  prompt_template: string;
}): Promise<{
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  inputs_json: any[];
  prompt_template: string;
  visibility: string;
  created_at: string;
}> {
  const accessToken = await getAccessToken();
  const baseUrl = getEdgeFunctionBaseUrl();

  console.log('Creating catalyst at:', `${baseUrl}/create-catalyst`);
  console.log('Payload:', payload);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${baseUrl}/create-catalyst`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(async () => {
        const text = await response.text().catch(() => 'Unknown error');
        console.error('Failed to parse error response:', text);
        return { error: `HTTP ${response.status}: ${text || response.statusText}` };
      });
      const details = errorData.details ? ` (${errorData.details})` : '';
      const hint = errorData.hint ? ` - ${errorData.hint}` : '';
      const badGatewayHint =
        response.status === 502
          ? ' Ensure both "supabase start" and "supabase functions serve" are running (see README or docs/QUICK_START.md).'
          : '';
      console.error('Create catalyst error:', errorData);
      throw new Error(
        (errorData.error || `Failed to create catalyst: ${response.statusText}`) +
          details +
          hint +
          badGatewayHint
      );
    }

    const result = await response.json();
    console.log('Catalyst created successfully:', result);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. The server may be slow - try again.');
    }
    throw err;
  }
}

/**
 * Update an existing catalyst
 * Only the owner can update their catalyst
 *
 * @param catalystId - UUID of the catalyst to update
 * @param updates - Fields to update
 * @returns Promise with the updated catalyst
 */
export async function updateCatalyst(
  catalystId: string,
  updates: {
    name?: string;
    description?: string;
    inputs_json?: any[];
    prompt_template?: string;
  }
): Promise<Catalyst> {
  const { data, error } = await supabaseClient
    .from('catalysts')
    .update(updates)
    .eq('id', catalystId)
    .select()
    .single();

  if (error) {
    console.error('Error updating catalyst:', error);
    throw new Error(`Failed to update catalyst: ${error.message}`);
  }

  if (!data) {
    throw new Error('Catalyst not found');
  }

  return data;
}

/**
 * Delete a catalyst
 * Only the owner can delete their catalyst
 *
 * @param catalystId - UUID of the catalyst to delete
 */
export async function deleteCatalyst(catalystId: string): Promise<void> {
  const { data, error } = await supabaseClient
    .from('catalysts')
    .delete()
    .eq('id', catalystId)
    .select('id');

  if (error) {
    console.error('Error deleting catalyst:', error);
    throw new Error(`Failed to delete catalyst: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Catalyst not found or you do not have permission to delete it');
  }
}

/**
 * Saved run type (Save to library)
 */
export interface SavedRun {
  id: string;
  user_id: string;
  coach_name: string;
  coach_id: string;
  output: string;
  inputs: Record<string, unknown>;
  created_at: string;
}

/**
 * Save a run to the user's library
 */
export async function saveRun(payload: {
  coachName: string;
  coachId: string;
  output: string;
  inputs: Record<string, unknown>;
}): Promise<SavedRun> {
  const {
    data: { user },
    error: sessionError,
  } = await supabaseClient.auth.getUser();

  if (sessionError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabaseClient
    .from('saved_runs')
    .insert({
      user_id: user.id,
      coach_name: payload.coachName,
      coach_id: payload.coachId,
      output: payload.output,
      inputs: payload.inputs || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving run:', error);
    throw new Error(`Failed to save: ${error.message}`);
  }

  return data;
}

/**
 * Fetch a single saved run by ID
 */
export async function fetchSavedRun(id: string): Promise<SavedRun> {
  const { data, error } = await supabaseClient.from('saved_runs').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching saved run:', error);
    throw new Error(`Failed to load: ${error.message}`);
  }

  if (!data) throw new Error('Saved run not found');
  return data;
}

/**
 * Fetch the current user's saved runs
 */
export async function fetchSavedRuns(): Promise<SavedRun[]> {
  const { data, error } = await supabaseClient
    .from('saved_runs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved runs:', error);
    throw new Error(`Failed to load saved runs: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a saved run
 */
export async function deleteSavedRun(id: string): Promise<void> {
  const { error } = await supabaseClient.from('saved_runs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting saved run:', error);
    throw new Error(`Failed to delete: ${error.message}`);
  }
}
