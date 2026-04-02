import { SITE } from '../config/siteConfig.js';

const EXCLUDED_EXACT_PATHS = new Set(['/login']);
const EXCLUDED_PREFIXES = ['/adminbackend'];

const STATIC_PUBLIC_PATHS = ['/contact'];

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}


function normalizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return parsed.pathname || '/';
    } catch {
      return null;
    }
  }

  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

function compactPath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function isExcludedPath(pathname) {
  const compacted = compactPath(pathname);
  if (EXCLUDED_EXACT_PATHS.has(compacted)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => compacted === prefix || compacted.startsWith(`${prefix}/`));
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(baseUrl, pathname) {
  return `${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function toLastMod(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function resolveBaseUrl(req) {
  const envBase = normalizeBaseUrl(process.env.SITE_BASE_URL || process.env.BASE_URL || SITE.baseUrl);
  if (envBase) return envBase;

  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = req.get('host');
  if (!host) return 'https://sauber-mehr.de';
  return normalizeBaseUrl(`${protocol}://${host}`);
}

export async function listSitemapEntries(pool) {
  const { rows } = await pool.query(
    `SELECT canonical_path, updated_at
     FROM pages
     WHERE display = true
     ORDER BY canonical_path ASC`
  );

  const seen = new Set();
  const entries = [];

  const pushEntry = (pathValue, updatedAt = null) => {
    const normalizedPath = normalizePath(pathValue);
    if (!normalizedPath) return;
    if (isExcludedPath(normalizedPath)) return;

    const dedupeKey = compactPath(normalizedPath);
    if (seen.has(dedupeKey)) return;

    seen.add(dedupeKey);
    entries.push({
      path: normalizedPath,
      lastmod: toLastMod(updatedAt)
    });
  };

  for (const row of rows) {
    pushEntry(row.canonical_path, row.updated_at);
  }

  for (const staticPath of STATIC_PUBLIC_PATHS) {
    pushEntry(staticPath, null);
  }

  return entries;
}

export function buildSitemapXml({ entries, baseUrl }) {
  const urls = entries
    .map((entry) => {
      const loc = escapeXml(toAbsoluteUrl(baseUrl, entry.path));
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>'
  ].join('');
}

export function buildRobotsTxt({ baseUrl }) {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /adminbackend',
    'Disallow: /login',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ];

  return `${lines.join('\n')}\n`;
}

