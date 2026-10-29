// Same inline styles as the transactional templates in stashify_utils (title: <h1>, body: <p>).
const TITLE_STYLE = 'margin: 0 0 32px; font-size: 28px; line-height: 32px; color: #000000; font-weight: 600;';
const PARAGRAPH_STYLE = 'margin: 0 0 16px;text-align: justify';

// Only &, < and > are escaped: quotes must stay untouched or `default("x")` in template expressions would break.
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="${PARAGRAPH_STYLE}">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Builds the email body: an optional title followed by the paragraphs. */
export function buildEmailBody(title: string, text: string): string {
  const trimmedTitle = title.replace(/\s+/g, ' ').trim();
  const heading = trimmedTitle ? `<h1 style="${TITLE_STYLE}">${escapeHtml(trimmedTitle)}</h1>` : '';
  return `${heading}${textToHtml(text)}`;
}
