window.cookieConsentState = window.cookieConsentState || {
  necessary: true,
  analytics: false,
  marketing: false,
  youtubeVideos: false
};

window.requestYoutubeConsent = window.requestYoutubeConsent || function () {
  return Promise.reject(new Error('Consent manager not ready yet.'));
};

document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('cookie-banner');
  const ANALYTICS_COOKIE_NAMES = ['_ga', '_gid', '_gat', '_gcl_au', '_ga_', '_gac_', '_clck', '_clsk'];
  let firstPageviewSent = false;
  const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
    youtubeVideos: false
  };
  let currentConsent = { ...DEFAULT_CONSENT };

  function emitConsentEvent() {
    window.cookieConsentState = { ...currentConsent };
    let event;
    try {
      event = new CustomEvent('cookieConsentUpdate', { detail: window.cookieConsentState });
    } catch (err) {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('cookieConsentUpdate', true, true, window.cookieConsentState);
    }
    document.dispatchEvent(event);
  }

  function setConsentState(partial) {
    currentConsent = {
      ...DEFAULT_CONSENT,
      ...partial,
      necessary: true
    };
    emitConsentEvent();
  }

  const showBanner = () => {
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.style.display = 'block';
  };
  const hideBanner = () => {
    if (!banner) return;
    banner.classList.add('hidden');
    banner.style.display = 'none';
  };

  function deleteCookie(name, path = '/') {
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const host = location.hostname;
    const bare = host.replace(/^www\./, '');
    [
      `${name}=; expires=${expires}; path=${path}`,
      `${name}=; expires=${expires}; path=${path}; domain=${host}`,
      `${name}=; expires=${expires}; path=${path}; domain=.${bare}`
    ].forEach(s => { document.cookie = s; });
  }

  function deleteCookiesByNameOrPrefix(list) {
    const all = document.cookie.split(';').map(c => c.split('=')[0].trim());
    list.forEach(item => {
      all.forEach(name => {
        if (name === item || name.startsWith(item)) deleteCookie(name);
      });
    });
  }

  function ensureGtagShim() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  }

  function applyConsent(prefs) {
    ensureGtagShim();
    window.gtag('consent', 'update', {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      ad_user_data: prefs.marketing ? 'granted' : 'denied',
      ad_personalization: prefs.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consent_updated' });
  }

  function disableClarityIfLoaded() {
    if (typeof window.clarity === 'function') {
      try { window.clarity('consent', false); } catch (e) { }
    }
  }

  function blockAll() {
    ensureGtagShim();
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    const id = window.env?.GA_MEASUREMENT_ID || '';
    if (id) window['ga-disable-' + id] = true;
    disableClarityIfLoaded();
    firstPageviewSent = false;
    setConsentState(DEFAULT_CONSENT);
  }

  function syncGaDisableFlag(analytics) {
    const id = window.env?.GA_MEASUREMENT_ID;
    if (!id) return;
    window['ga-disable-' + id] = !analytics;
  }

  function sendInitialPageviewIfNeeded(analytics, marketing) {
    const id = window.env?.GA_MEASUREMENT_ID;
    if (!id) return;

    window.gtag('config', id, { allow_google_signals: !!marketing });

    if (analytics && !firstPageviewSent) {
      window.gtag('event', 'page_view');
      firstPageviewSent = true;
    } else if (!analytics) {
      deleteCookiesByNameOrPrefix(ANALYTICS_COOKIE_NAMES);
    }
  }

  function createRevokeButton() {
    const wrap = document.createElement('div');
    wrap.id = 'cookie-revoke';
    Object.assign(wrap.style, { position: 'fixed', bottom: '0', left: '0', zIndex: 1000 });

    const btn = document.createElement('button');
    btn.id = 'revoke-cookies';
    btn.textContent = 'Cookies widerrufen';
    Object.assign(btn.style, {
      background: '#e94b1b65',
      color: '#fff',
      border: 'none',
      padding: '.2rem .2rem',
      borderRadius: '0 0.25rem 0.25rem 0',
      cursor: 'pointer',
      fontSize: '10px'
    });

    wrap.appendChild(btn);
    attachRevokeHandler(btn);
    return wrap;
  }

  function showRevokeButton() {
    if (!document.getElementById('cookie-revoke')) {
      document.body.appendChild(createRevokeButton());
    }
  }

  function attachRevokeHandler(btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Widerrufe…';

      fetch('/api/consent', { method: 'DELETE', cache: 'no-store' })
        .then(r => r.json())
        .then(json => {
          if (!json.success) throw new Error('Consent withdrawal failed');
          blockAll();
          deleteCookiesByNameOrPrefix(ANALYTICS_COOKIE_NAMES);
          document.getElementById('cookie-revoke')?.remove();
          showBanner();
        })
        .catch(err => {
          console.error(err);
          btn.disabled = false;
          btn.textContent = 'Cookies widerrufen';
        });
    });
  }

  function loadClarityInline(id) {
    if (!id || window.clarity) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + id;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);

    (function tryConsent() {
      if (typeof window.clarity === 'function') { try { window.clarity('consent', true); } catch (e) { } }
      else setTimeout(tryConsent, 200);
    })();
  }

  function saveConsent(nextPrefs, options = {}) {
    const payload = {
      analytics: !!nextPrefs.analytics,
      marketing: !!nextPrefs.marketing,
      youtubeVideos: !!nextPrefs.youtubeVideos
    };
    const hideAfterSave = options.hideBanner !== false;

    return fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error('Consent save failed');
        setConsentState(payload);
        syncGaDisableFlag(payload.analytics);

        if (typeof window.updateAnalyticsConsent === 'function') {
          window.updateAnalyticsConsent(payload.analytics);
        }
        if (payload.analytics && typeof window.loadClarity === 'function') {
          window.loadClarity();
        }

        applyConsent(payload);
        sendInitialPageviewIfNeeded(payload.analytics, payload.marketing);

        if (hideAfterSave) hideBanner();
        showRevokeButton();
        return payload;
      })
      .catch(err => {
        console.error(err);
        throw err;
      });
  }

  window.requestYoutubeConsent = function () {
    if (currentConsent.youtubeVideos) {
      return Promise.resolve({ ...currentConsent });
    }
    return saveConsent({ ...currentConsent, youtubeVideos: true }, { hideBanner: false });
  };

  if (banner) {
    const acceptAllBtn = document.getElementById('accept-all');
    const acceptNecBtn = document.getElementById('accept-necessary');

    if (acceptAllBtn) acceptAllBtn.onclick = () => {
      saveConsent({ analytics: true, marketing: true, youtubeVideos: true }).catch(() => { });
    };
    if (acceptNecBtn) acceptNecBtn.onclick = () => {
      saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => { });
    };
  }

  fetch('/api/consent', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(({ cookieConsent }) => {
      const consent = cookieConsent;

      if (consent) {
        setConsentState(consent);
        syncGaDisableFlag(!!consent.analytics);

        if (typeof window.updateAnalyticsConsent === 'function') {
          window.updateAnalyticsConsent(!!consent.analytics);
        }
        if (consent.analytics && typeof window.loadClarity === 'function') {
          window.loadClarity();
        }

        hideBanner();
        showRevokeButton();
        applyConsent({
          analytics: !!consent.analytics,
          marketing: !!consent.marketing
        });
        sendInitialPageviewIfNeeded(!!consent.analytics, !!consent.marketing);

      } else {
        blockAll();
        showBanner();
      }
    })
    .catch(err => {
      console.warn('[Consent] GET /api/consent failed:', err);
      blockAll();
      showBanner();
    });
});

const DEBUG = location.search.includes('debug-consent');

if (DEBUG) (function consentDebug() {
  function report(label) {
    const id = window.env?.GA_MEASUREMENT_ID;
    const gaDisabled = id ? !!window['ga-disable-' + id] : null;
    const clarityLoaded = typeof window.clarity === 'function';
    const clarityScript = !!document.querySelector('script[src*="clarity.ms/tag"]');
    const clarityCookies = document.cookie.includes('_clck') || document.cookie.includes('_clsk');
    const ytIframe = !!document.querySelector('iframe[src*="youtube-nocookie.com"]');

    console.log(
      `%c[CONSENT DEBUG] ${label}`,
      'font-weight:bold;',
      {
        consentState: window.cookieConsentState,
        gaMeasurementId: id,
        gaDisabled,
        clarityLoaded,
        clarityScript,
        clarityCookies,
        youtubeIframeLoaded: ytIframe
      }
    );
  }

  report('initial');

  document.addEventListener('cookieConsentUpdate', () => {
    report('cookieConsentUpdate');
  });

  setTimeout(() => report('after 3s'), 3000);
})();