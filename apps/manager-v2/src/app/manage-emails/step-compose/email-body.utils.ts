// Same inline styles as the transactional templates in stashify_utils (title: <h1>, body: <p>).
const TITLE_STYLE = 'margin: 0 0 32px; font-size: 28px; line-height: 32px; color: #000000; font-weight: 600;';
const PARAGRAPH_STYLE = 'margin: 0 0 16px;text-align: justify';

// Only &, < and > are escaped: quotes must stay untouched or `default("x")` in template expressions would break.
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Splits the text into paragraphs (blank-line separated), each one being its list of lines. */
export function splitParagraphs(text: string): string[][] {
  const trimmed = text.replace(/\r\n?/g, '\n').trim();
  return trimmed ? trimmed.split(/\n{2,}/).map((paragraph) => paragraph.split('\n')) : [];
}

export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim();
}

export function textToHtml(text: string): string {
  return splitParagraphs(text)
    .map((lines) => `<p style="${PARAGRAPH_STYLE}">${lines.map(escapeHtml).join('<br>')}</p>`)
    .join('');
}

/** Builds the email body: an optional title followed by the paragraphs. */
export function buildEmailBody(title: string, text: string): string {
  const trimmedTitle = normalizeTitle(title);
  const heading = trimmedTitle ? `<h1 style="${TITLE_STYLE}">${escapeHtml(trimmedTitle)}</h1>` : '';
  return `${heading}${textToHtml(text)}`;
}
