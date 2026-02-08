/**
 * Shared formatting for AI output (refine, run output).
 * Ensures bullets, headings, bold, and line breaks display correctly.
 */
export function normalizeRefineOutput(text: string): string {
  let out = text;

  // Prevent indented content from rendering as code block (4+ spaces at line start)
  out = out.replace(/^[ \t]{4,}/gm, '');

  // Fix numbered list: "1.\n" or "2.\n" followed by text on next line → "1. Text"
  out = out.replace(/^(\d+)\.\s*\n\s*([^\n#-][^\n]*)/gm, '$1. $2');

  // Fix split bold for lettered sub-sections: "**A.\nPortion Control:**" → "**A. Portion Control:**"
  out = out.replace(/\*\*([A-Z])\.\s*\n\s*([^*\n]+?)\*\*/g, '**$1. $2**');

  // Fix malformed bold: **Text ** or ** Text** (spaces)
  out = out.replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');

  // Fix **Text\n** (newline between content and closing **)
  out = out.replace(/\*\*([^*\n]+?)\s*\n\s*\*\*/g, '**$1**');

  // Fix orphan closing ** at end of line - strip when line has non-* before it
  out = out.replace(/^([^\*]+)\*\*(\s*[\n\r])/gm, '$1$2');
  out = out.replace(/^([^\*]+)\*\*(\s*)$/gm, '$1$2');

  // Fix orphan ":**" at end of line (e.g. "Carbohydrate Management:**" → "Carbohydrate Management:")
  out = out.replace(/:\*\*(\s*[\n\r])/g, ':$1');
  out = out.replace(/:\*\*(\s*)$/gm, ':');

  // Fix corrupted _**_ (e.g. _**C. → **C.)
  out = out.replace(/_\*\*/g, '**');

  // Fix Roman numerals at start of line: **I.\n or **II. \n (standalone, not **I. Introduction**)
  out = out.replace(/\*\*([IVXLC]+)\.(\s*[\n\r])/g, '**$1.**$2');
  out = out.replace(/\*\*([A-Z])\.(\s*[\n\r])/g, '**$1.**$2');

  // Fix "1.Define" → "1. Define" (missing space after number)
  out = out.replace(/(\d+)\.([A-Za-z])/g, '$1. $2');

  // Headings and structure
  out = out.replace(/([^\n\r])##/g, '$1\n\n##');
  out = out.replace(/##([^\s#\n])/g, '## $1');
  out = out.replace(/([^\n\r])-\s/g, '$1\n- ');
  out = out.replace(/([^\n\r])(\d+\.\s)/g, '$1\n$2');
  out = out.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
  out = out.replace(/([.!?])([A-Z])/g, '$1\n\n$2');

  // Collapse excessive newlines
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}
