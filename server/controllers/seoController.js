import {
  buildRobotsTxt,
  buildSitemapXml,
  listSitemapEntries,
  resolveBaseUrl
} from '../services/sitemapService.js';

export async function getSitemapXml(req, res, next) {
  try {
    const pool = req.app.get('db');
    const entries = await listSitemapEntries(pool);
    const baseUrl = resolveBaseUrl(req);
    const xml = buildSitemapXml({ entries, baseUrl });

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    return res.status(200).send(xml);
  } catch (err) {
    return next(err);
  }
}

export function getRobotsTxt(req, res) {
  const baseUrl = resolveBaseUrl(req);
  const robots = buildRobotsTxt({ baseUrl });

  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=900');
  return res.status(200).send(robots);
}

