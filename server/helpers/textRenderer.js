import escapeHtml from 'escape-html';

const anchorPattern = /<a\s+[^>]*href=("|')(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

export function renderTextWithLinks(value = '') {
  const raw = String(value || '');
  if (!raw) return '';

  let result = '';
  let lastIndex = 0;

  raw.replace(anchorPattern, (match, _quote, href, text, offset) => {
    result += escapeHtml(raw.slice(lastIndex, offset));
    const safeHref = escapeHtml(href);
    const safeText = escapeHtml(text);
    result += `<a href="${safeHref}">${safeText}</a>`;
    lastIndex = offset + match.length;
    return match;
  });

  result += escapeHtml(raw.slice(lastIndex));
  return result;
}