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

  // Fix trailing "**" on lines that are not starting bold: "Logistical Considerations**" → "Logistical Considerations"
  out = out.replace(/^(?!\*\*)([^\n]*?)\*\*\s*$/gm, '$1');

  // Fix ".**IV." style markers inside sentences: "Budget.**IV." → "Budget. **IV.**"
  out = out.replace(/\.\s*\*\*([IVXLC]+)\.(\s|$)/gm, '. **$1.**$2');

  // Fix unclosed **Roman. at start of line: "**I." or "**II." → "**I.**" (so markdown renders)
  out = out.replace(/^\*\*([IVXLC]+)\.(\s*[\n\r])/gm, '**$1.**$2');
  out = out.replace(/^\*\*([IVXLC]+)\.(\s+)(?=[A-Z])/gm, '**$1.**$2');

  // Fix orphan **Roman. at end of line: "statement.**V." → "statement.**V.**"
  out = out.replace(/([.!?])\s*\*\*([IVXLC]+)\.(\s*)$/gm, '$1 **$2.**$3');
  out = out.replace(/([^\s*])\*\*([IVXLC]+)\.(\s*[\n\r])/gm, '$1 **$2.**$3');
  // Catch-all: **Roman. before newline/end with no closing ** → add closing
  out = out.replace(/\*\*([IVXLC]+)\.(\s*)([\n\r]|$)/gm, '**$1.**$2$3');

  // Fix lettered sections: **A.\n or **B. (standalone)
  out = out.replace(/^\*\*([A-Z])\.(\s*[\n\r])/gm, '**$1.**$2');
  out = out.replace(/\*\*([A-Z])\.(\s*[\n\r])/g, '**$1.**$2');

  // Fix "1.Define" or "1.Brainstorm" → "1. Define" (missing space after number)
  out = out.replace(/(\d+)\.([A-Za-z])/g, '$1. $2');
  // Fix "1.**Brainstorm" → "1. **Brainstorm" (number directly before bold)
  out = out.replace(/(\d+)\.\*\*([A-Za-z])/g, '$1. **$2');

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
