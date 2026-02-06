import escapeHtml from 'escape-html';

const inlinePattern = /<(a|strong|em|h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const attributePattern = (name) => new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i');
const classTokenPattern = /^[A-Za-z0-9_-]+$/;

function readAttribute(attributes = '', name = '') {
  const match = String(attributes || '').match(attributePattern(name));
  if (!match) return '';
  return match[2] || match[3] || '';
}

function sanitizeClassNames(value = '') {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => classTokenPattern.test(token))
    .join(' ');
}

function renderAllowedTag(tagName = '', attributes = '', text = '') {
  const normalizedTag = String(tagName || '').toLowerCase();
  const safeText = escapeHtml(text);

  if (normalizedTag === 'a') {
    const hrefValue = readAttribute(attributes, 'href');
    return `<a href="${escapeHtml(hrefValue)}">${safeText}</a>`;
  }

  const classNames = sanitizeClassNames(readAttribute(attributes, 'class'));
  const classAttribute = classNames ? ` class="${escapeHtml(classNames)}"` : '';
  return `<${normalizedTag}${classAttribute}>${safeText}</${normalizedTag}>`;
}

export function renderTextWithLinks(value = '') {
  const raw = String(value || '');
  if (!raw) return '';

  let result = '';
  let lastIndex = 0;
  let match = inlinePattern.exec(raw);

  while (match) {
    const [fullMatch, tagName, attributes, text] = match;
    result += escapeHtml(raw.slice(lastIndex, match.index));
    result += renderAllowedTag(tagName, attributes, text);
    lastIndex = match.index + fullMatch.length;
    match = inlinePattern.exec(raw);
  }

  inlinePattern.lastIndex = 0;
  result += escapeHtml(raw.slice(lastIndex));
  return result;
}