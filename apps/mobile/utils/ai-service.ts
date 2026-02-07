import { supabaseConfig } from '@/src/lib/supabaseConfig';
import { supabaseClient } from '@/src/lib/supabaseClient';

export class AISuggestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AISuggestionError';
  }
}

export const getRealAISuggestion = async (
  fieldType: 'advice' | 'context',
  currentText: string
): Promise<string> => {
  const baseUrl = supabaseConfig.edgeFunctionBaseUrl;
  if (!baseUrl) {
    console.warn('EDGE_FUNCTION_BASE_URL not configured');
    throw new AISuggestionError('AI service not configured');
  }

  const anonKey = supabaseConfig.anonKey;
  if (!anonKey) {
    console.warn('SUPABASE_ANON_KEY not configured');
    throw new AISuggestionError('AI service not configured');
  }

  // Build headers: always send apikey, only send Authorization when user is signed in
  const { data: { session } } = await supabaseClient.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
  };
  // Only add Authorization header when we have a valid JWT (signed in user)
  // Sending anon key as bearer token causes 401 from Kong even with verify_jwt=false
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${baseUrl}/refine`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: currentText,
      type: fieldType,
      instruct:
        fieldType === 'advice'
          ? 'Refine this coaching advice to be more actionable. Use line breaks between points. Use bullet points (-) for lists.'
          : 'Add specific target audience context to this description. Use line breaks between points. Use bullet points (-) for lists.',
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.warn('Refine API error:', response.status, data);
    throw new AISuggestionError(
      response.status === 401 || response.status === 403
        ? 'Authentication failed'
        : 'AI service temporarily unavailable'
    );
  }

  const data = await response.json();
  if (typeof data.suggestion !== 'string' || !data.suggestion.trim()) {
    throw new AISuggestionError('No suggestion returned');
  }
  return data.suggestion;
};
