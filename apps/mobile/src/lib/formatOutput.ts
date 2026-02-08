/**
 * Shared formatting for AI output (refine, run output).
 * Ensures bullets, headings, and line breaks display correctly.
 */
export function normalizeRefineOutput(text: string): string {
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
