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
  const modal = document.getElementById('cookie-settings-modal');
  const analyticsToggle = document.getElementById('consent-analytics');
  const youtubeToggle = document.getElementById('consent-youtubeVideos');
  const feedback = document.getElementById('cookie-settings-feedback');

  const ANALYTICS_COOKIE_NAMES = ['_ga', '_gid', '_gat', '_gcl_au', '_ga_', '_gac_', '_clck', '_clsk'];
  const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
    youtubeVideos: false
  };

  let firstPageviewSent = false;
  let currentConsent = { ...DEFAULT_CONSENT };
  const LOCAL_CONSENT_KEY = 'sm_cookie_consent_v1';
  let userChoiceCommitted = false;

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
    if (analyticsToggle) analyticsToggle.checked = !!currentConsent.analytics;
    if (youtubeToggle) youtubeToggle.checked = !!currentConsent.youtubeVideos;
    emitConsentEvent();
  }

  function showBanner() {
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.style.display = 'block';
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.add('hidden');
    banner.style.display = 'none';
  }

  function openSettings() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function showFeedback() {
    if (!feedback) return;
    feedback.textContent = feedback.dataset.savedMessage || 'Deine Auswahl wurde gespeichert.';
    setTimeout(() => {
      if (feedback) feedback.textContent = '';
    }, 3200);
  }

  function saveConsentLocal(prefs) {
    try {
      localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify({
        ...prefs,
        necessary: true,
        savedAt: Date.now()
      }));
    } catch (_) {
    }
  }

  function readConsentLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
        youtubeVideos: !!parsed.youtubeVideos
      };
    } catch (_) {
      return null;
    }
  }

  function deleteCookie(name, path = '/') {
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const host = location.hostname;
    const bare = host.replace(/^www\./, '');
    [
      `${name}=; expires=${expires}; path=${path}`,
      `${name}=; expires=${expires}; path=${path}; domain=${host}`,
      `${name}=; expires=${expires}; path=${path}; domain=.${bare}`
    ].forEach((entry) => { document.cookie = entry; });
  }

  function deleteCookiesByNameOrPrefix(list) {
    const all = document.cookie.split(';').map((entry) => entry.split('=')[0].trim());
    list.forEach((item) => {
      all.forEach((name) => {
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
      try {
        window.clarity('consent', false);
      } catch (_) {
      }
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
      background: '#d15023',
      color: '#fff',
      border: 'none',
      padding: '.28rem .45rem',
      borderRadius: '0 0.35rem 0.35rem 0',
      cursor: 'pointer',
      fontSize: '11px'
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

  function attachOpenSettingsHandlers() {
    document.querySelectorAll('.js-cookie-settings').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        openSettings();
      });
    });

    document.getElementById('open-cookie-settings')?.addEventListener('click', (event) => {
      event.preventDefault();
      hideBanner();
      openSettings();
    });

    document.getElementById('cookie-settings-close')?.addEventListener('click', () => {
      saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => {});
    });

    document.getElementById('cookie-banner-close')?.addEventListener('click', () => {
      saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => {});
    });

    modal?.addEventListener('click', (event) => {
      if (event.target === modal) {
        saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => {});
      }
    });
  }

  function attachRevokeHandler(btn) {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Widerrufe…';

      fetch('/api/consent', { method: 'DELETE', cache: 'no-store' })
        .then((response) => response.json())
        .then((json) => {
          if (!json.success) throw new Error('Consent withdrawal failed');
          blockAll();
          deleteCookiesByNameOrPrefix(ANALYTICS_COOKIE_NAMES);
          document.getElementById('cookie-revoke')?.remove();
          showBanner();
          openSettings();
        })
        .catch((err) => {
          console.error(err);
          btn.disabled = false;
          btn.textContent = 'Cookies widerrufen';
        });
    });
  }

  function saveConsent(nextPrefs, options = {}) {
    userChoiceCommitted = true;
    const payload = {
      analytics: !!nextPrefs.analytics,
      marketing: !!nextPrefs.marketing,
      youtubeVideos: !!nextPrefs.youtubeVideos
    };
    const hideAfterSave = options.hideBanner !== false;

    // Optimistisch anwenden, damit der Banner sofort schließt.
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
    saveConsentLocal(payload);
    if (hideAfterSave) hideBanner();
    showRevokeButton();
    showFeedback();
    if (options.closeSettings !== false) closeSettings();

    return fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload)
    })
      .then((response) => response.json())
      .then((json) => {
        if (!json.success) throw new Error('Consent save failed');
        return payload;
      })
      .catch((err) => {
        console.warn('[Consent] POST /api/consent failed, local fallback active:', err);
        return payload;
      });
  }

  function bindModalButtons() {
    document.getElementById('cookie-save-selection')?.addEventListener('click', () => {
      saveConsent({
        ...currentConsent,
        analytics: !!analyticsToggle?.checked,
        youtubeVideos: !!youtubeToggle?.checked
      }).catch(() => {});
    });

    document.getElementById('cookie-reject-all')?.addEventListener('click', () => {
      saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => {});
    });

    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      saveConsent({ analytics: true, marketing: true, youtubeVideos: true }).catch(() => {});
    });
  }

  window.requestYoutubeConsent = function () {
    if (currentConsent.youtubeVideos) {
      return Promise.resolve({ ...currentConsent });
    }

    if (modal) openSettings();

    return saveConsent(
      { ...currentConsent, youtubeVideos: true },
      { hideBanner: false }
    );
  };

  if (banner) {
    attachOpenSettingsHandlers();
    bindModalButtons();

    const acceptAllBtn = document.getElementById('accept-all');
    const acceptNecessaryBtn = document.getElementById('accept-necessary');

    if (acceptAllBtn) {
      acceptAllBtn.onclick = () => {
        saveConsent({ analytics: true, marketing: true, youtubeVideos: true }).catch(() => {});
      };
    }

    if (acceptNecessaryBtn) {
      acceptNecessaryBtn.onclick = () => {
        saveConsent({ analytics: false, marketing: false, youtubeVideos: false }).catch(() => {});
      };
    }
  }

  fetch('/api/consent', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .then(({ cookieConsent }) => {
      if (userChoiceCommitted) return;
      if (cookieConsent) {
        setConsentState(cookieConsent);
        syncGaDisableFlag(!!cookieConsent.analytics);

        if (typeof window.updateAnalyticsConsent === 'function') {
          window.updateAnalyticsConsent(!!cookieConsent.analytics);
        }
        if (cookieConsent.analytics && typeof window.loadClarity === 'function') {
          window.loadClarity();
        }

        hideBanner();
        showRevokeButton();
        applyConsent({
          analytics: !!cookieConsent.analytics,
          marketing: !!cookieConsent.marketing
        });
        sendInitialPageviewIfNeeded(!!cookieConsent.analytics, !!cookieConsent.marketing);
      } else {
        blockAll();
        showBanner();
      }
    })
    .catch((err) => {
      if (userChoiceCommitted) return;
      console.warn('[Consent] GET /api/consent failed:', err);
      const localConsent = readConsentLocal();
      if (localConsent) {
        setConsentState(localConsent);
        syncGaDisableFlag(!!localConsent.analytics);
        if (typeof window.updateAnalyticsConsent === 'function') {
          window.updateAnalyticsConsent(!!localConsent.analytics);
        }
        if (localConsent.analytics && typeof window.loadClarity === 'function') {
          window.loadClarity();
        }
        hideBanner();
        showRevokeButton();
        applyConsent({
          analytics: !!localConsent.analytics,
          marketing: !!localConsent.marketing
        });
        sendInitialPageviewIfNeeded(!!localConsent.analytics, !!localConsent.marketing);
      } else {
        blockAll();
        showBanner();
      }
    });
});
