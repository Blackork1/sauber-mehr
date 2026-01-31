// middleware/accessLog.js
import onFinished from 'on-finished';
import { UAParser } from 'ua-parser-js';
import ipaddr from 'ipaddr.js';

let mmCityReader = null; // optional MaxMind

export function accessLog(options) {
  const {
    pool,
    getConsent = defaultConsent,
    useMaxMind = false,
    maxmindCityPath,
    anonymizeFn = defaultAnonymizeIP,
    excludePrivate = true,
    respectDNT = false,
  } = options;

  if (!pool) throw new Error('accessLog: pool ist erforderlich');

  if (useMaxMind) {
    import('maxmind')
      .then(async (mm) => {
        mmCityReader = await mm.open(maxmindCityPath);
      })
      .catch((e) => {
        console.error('MaxMind konnte nicht geladen werden:', e.message);
      });
  }

  return function accessLogMiddleware(req, res, next) {
    const start = process.hrtime.bigint();

    const cfIP = req.headers['cf-connecting-ip'];
    const xff = req.headers['x-forwarded-for'];
    const realIpRaw =
      (cfIP ||
        (Array.isArray(xff) ? xff[0] : xff?.split(',')[0]?.trim()) ||
        req.ip ||
        ''
      ).replace('::ffff:', '');

    const cfCountry = req.headers['cf-ipcountry'] || null;
    const cfRay = req.headers['cf-ray'] || null;

    const method = req.method;
    const path = req.originalUrl || req.url;
    const ref = req.get('referer') || null;
    const uaRaw = req.get('user-agent') || '';
    const lang = req.get('accept-language') || null;
    const host = req.get('host') || null;
    const scheme =
      (req.headers['cf-visitor'] && safeParseJSON(req.headers['cf-visitor'])?.scheme) ||
      req.protocol ||
      null;

    const parsed = new UAParser(uaRaw).getResult();
    const ua_name = parsed.browser?.name || null;
    const ua_version = parsed.browser?.version || null;
    const os_name = parsed.os?.name || null;
    const deviceType = parsed.device?.type || (isProbablyMobile(parsed) ? 'mobile' : 'desktop');

    let consent = getConsent(req);
    if (respectDNT && req.get('DNT') === '1') {
      consent = { analytics: false };
    }

    const ipRawCandidate = realIpRaw || null;
    const ipAnonCandidate = ipRawCandidate ? anonymizeFn(ipRawCandidate) : null;

    const localOrPrivate =
      excludePrivate && ipRawCandidate ? isLoopbackOrPrivate(ipRawCandidate) : false;

    const ip_raw =
      consent.analytics &&
      ipRawCandidate &&
      isValidInet(ipRawCandidate) &&
      !localOrPrivate
        ? ipRawCandidate
        : null;

    const ip =
      ipAnonCandidate && isValidInet(ipAnonCandidate) && !localOrPrivate ? ipAnonCandidate : null;

    let city = null, region = null, lat = null, lon = null;
    if (useMaxMind && mmCityReader && ip_raw && consent.analytics) {
      try {
        const rec = mmCityReader.get(ip_raw);
        city = rec?.city?.names?.en || rec?.city?.names?.de || null;
        region = rec?.subdivisions?.[0]?.names?.en || null;
        lat = rec?.location?.latitude ?? null;
        lon = rec?.location?.longitude ?? null;
      } catch {}
    }

    onFinished(res, async () => {
      const end = process.hrtime.bigint();
      const rt_ms = Number((end - start) / 1_000_000n);
      const status = res.statusCode;
      const bytes = getBytesSent(res);

      try {
        await pool.query(
          `INSERT INTO access_logs
             (ip, ip_raw, cf_country, city, region, lat, lon,
              method, path, status, referrer, ua, ua_name, ua_version, os_name, device_type,
              lang, rt_ms, bytes_sent, cf_ray, scheme, host)
           VALUES
             ($1,  $2,     $3,         $4,   $5,    $6,  $7,
              $8,   $9,  $10,    $11,     $12, $13,     $14,       $15,    $16,
              $17,  $18,   $19,        $20,   $21,   $22)`,
          [
            ip,
            ip_raw,
            cfCountry,
            city,
            region,
            lat,
            lon,
            method,
            path,
            status,
            ref,
            uaRaw,
            ua_name,
            ua_version,
            os_name,
            deviceType,
            lang,
            rt_ms,
            bytes,
            cfRay,
            scheme,
            host,
          ]
        );
      } catch (e) {
        console.error('accessLog insert failed:', e.message);
      }
    });

    next();
  };
}

function defaultConsent(_req) {
  const c = _req.session?.cookieConsent || {};
  return { analytics: !!c.analytics };
}

function defaultAnonymizeIP(ipStr) {
  try {
    const addr = ipaddr.parse(ipStr);

    if (addr.kind() === 'ipv4') {
      const oct = addr.octets.slice();
      oct[3] = 0;
      return ipaddr.fromByteArray(oct).toString();
    }

    if (addr.kind() === 'ipv6') {
      const hextets = addr.toNormalizedString().split(':');
      const masked = hextets.slice(0, 4).join(':') + '::';
      return ipaddr.parse(masked).toString();
    }
  } catch {}
  return ipStr;
}

function isValidInet(ipStr) {
  try { ipaddr.parse(ipStr); return true; } catch { return false; }
}

function isLoopbackOrPrivate(ipStr) {
  try {
    const addr = ipaddr.parse(ipStr);
    if (!addr.range) return false;
    const r = addr.range();
    return r === 'loopback' || r === 'private' || r === 'linkLocal' || r === 'uniqueLocal';
  } catch {
    return false;
  }
}

function isProbablyMobile(parsedUA) {
  const d = parsedUA.device?.type;
  if (d) return d === 'mobile' || d === 'tablet';
  const os = (parsedUA.os?.name || '').toLowerCase();
  return os.includes('android') || os.includes('ios');
}

function getBytesSent(res) {
  const h = res.getHeader('content-length');
  if (Array.isArray(h)) return parseInt(h[0], 10) || null;
  return h ? parseInt(h, 10) || null : null;
}

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}
