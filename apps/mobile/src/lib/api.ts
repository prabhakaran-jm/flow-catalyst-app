/**
 * API Helper Functions
 * 
 * Functions to interact with Supabase Edge Functions
 */

import { supabaseClient } from './supabaseClient';

// Get edge function base URL from environment or config
// For now, construct from Supabase URL
const getEdgeFunctionBaseUrl = (): string => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  // Construct edge function URL from Supabase URL
  return `${supabaseUrl}/functions/v1`;
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to run catalyst: ${response.statusText}`
    );
  }

  return response.json();
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

  const response = await fetch(`${baseUrl}/create-catalyst`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to create catalyst: ${response.statusText}`
    );
  }

  return response.json();
}
