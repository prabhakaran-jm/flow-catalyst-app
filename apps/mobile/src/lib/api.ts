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
}: {
  catalystId: string;
  inputs: Record<string, any>;
}): Promise<{ output: string; promptDebug: string }> {
  const accessToken = await getAccessToken();
  const baseUrl = getEdgeFunctionBaseUrl();

  console.log('Running catalyst at:', `${baseUrl}/run-catalyst`);
  console.log('Catalyst ID:', catalystId);
  console.log('Inputs:', inputs);

  const response = await fetch(`${baseUrl}/run-catalyst`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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
    // 502 usually means Supabase/Kong couldn't reach the Edge Function
    const badGatewayHint =
      response.status === 502
        ? ' Ensure both "supabase start" and "supabase functions serve" are running (see LOCAL_SUPABASE_SETUP.md).'
        : '';
    console.error('Run catalyst error:', errorData);
    throw new Error(
      (errorData.error || `Failed to run catalyst: ${response.statusText}`) +
        details +
        hint +
        badGatewayHint +
        timeoutHint
    );
  }

  const result = await response.json();
  console.log('Catalyst run successfully:', { output: result.output?.substring(0, 100) + '...' });
  return result;
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
          ? ' Ensure both "supabase start" and "supabase functions serve" are running (see LOCAL_SUPABASE_SETUP.md).'
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
