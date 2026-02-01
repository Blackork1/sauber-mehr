function applyTheme(mode) {
  // mode: 'system' | 'light' | 'dark'
  localStorage.setItem('theme', mode);

  const root = document.documentElement;
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  root.setAttribute('data-theme', effective);

  // theme-color meta updaten (optional)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', effective === 'dark' ? '#0b0f17' : '#ffffff');
}

function applyAccentPreset(preset) {
  // preset: 'gold' | 'red' | ...
  localStorage.setItem('accentPreset', preset);
  localStorage.removeItem('accentHex');

  const root = document.documentElement;
  root.setAttribute('data-accent', preset);
  root.style.removeProperty('--accent'); // falls vorher custom gesetzt war
}

function applyAccentHex(hex) {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;

  localStorage.setItem('accentHex', hex);
  localStorage.removeItem('accentPreset');

  const root = document.documentElement;
  root.removeAttribute('data-accent');
  root.style.setProperty('--accent', hex);
}

// Wenn Theme = system, auf OS-Wechsel reagieren
const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
if (mq && mq.addEventListener) {
  mq.addEventListener('change', () => {
    const stored = localStorage.getItem('theme') || 'system';
    if (stored === 'system') applyTheme('system');
  });
}
// Anwendungsstart: gespeicherte Einstellungen anwenden
const storedTheme = localStorage.getItem('theme') || 'system';
applyTheme(storedTheme);

function initThemeControls() {
  const themeSelect = document.getElementById('themeSelect');
  const accentSelect = document.getElementById('accentSelect');
  const accentPicker = document.getElementById('accentPicker');

  // Wenn die Controls auf einer Seite nicht existieren (z.B. Landing ohne Navbar): einfach raus.
  if (!themeSelect && !accentSelect && !accentPicker) return;

  // UI-Values initial aus LocalStorage setzen
  const storedTheme = localStorage.getItem('theme') || 'system';
  if (themeSelect) themeSelect.value = storedTheme;

  const preset = localStorage.getItem('accentPreset');
  const hex = localStorage.getItem('accentHex');

  if (accentSelect && preset) accentSelect.value = preset;

  if (accentPicker && hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    accentPicker.value = hex;
  }

  // Listener
  themeSelect?.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  accentSelect?.addEventListener('change', (e) => {
    applyAccentPreset(e.target.value);
  });

  accentPicker?.addEventListener('input', (e) => {
    applyAccentHex(e.target.value);
  });
}

// Direkt initialisieren (defer => DOM ist schon da)
initThemeControls();

function initNavbarScrollState() {
  const nav = document.querySelector('.festival-nav');
  if (!nav) return;

  const updateNavState = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 250);
  };

  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });
}

initNavbarScrollState();

function initSocialRailScrollState() {
  const rail = document.querySelector('.social-rail');
  if (!rail) return;

  let lastScrollY = window.scrollY;

  const updateRailState = () => {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 40;

    if (currentScrollY === 0) {
      rail.classList.remove('is-dimmed');
    } else {
      rail.classList.toggle('is-dimmed', isScrollingDown);
    }

    lastScrollY = currentScrollY;
  };

  updateRailState();
  window.addEventListener('scroll', updateRailState, { passive: true });
}

initSocialRailScrollState();

function initMediaShowcases() {
  const sections = document.querySelectorAll('[data-component="media-showcase"]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const dataScript = section.querySelector('[data-media-data]');
    if (!dataScript) return;

    let payload = null;
    try {
      payload = JSON.parse(dataScript.textContent || '{}');
    } catch (error) {
      payload = null;
    }

    if (!payload) return;

    const videos = Array.isArray(payload.videos) ? payload.videos.slice() : [];
    const videoDetailBase = typeof payload.videoDetailBase === 'string' ? payload.videoDetailBase : '';
    const carousel = section.querySelector('[data-carousel]');
    const dots = section.querySelector('[data-dots]');
    const leftHint = section.querySelector('[data-scroll="left"]');
    const rightHint = section.querySelector('[data-scroll="right"]');
    const filterButtons = Array.from(section.querySelectorAll('[data-filter]'));
    const emptyState = section.querySelector('[data-empty]') || document.createElement('div');
    const labels = payload.labels || {};
    const allKey = labels.allKey || 'all';
    const emptyLabel = labels.emptyState || 'Bislang liegen keine Videos zu dieser Kategorie vor';
    const expandLabel = labels.expand || 'erweitern';
    const categoryLabels = payload.categoryLabels || {};
    const maxCards = Number.isFinite(payload.maxCards) && payload.maxCards > 0 ? payload.maxCards : 3;

    if (!emptyState.dataset.empty) {
      emptyState.dataset.empty = 'true';
      emptyState.className = 'media-showcase__empty';
      emptyState.textContent = emptyLabel;
    }

    const sortedVideos = videos.sort((a, b) => {
      const dateA = new Date(a.published_at || 0).getTime();
      const dateB = new Date(b.published_at || 0).getTime();
      return dateB - dateA;
    });

    let activeCategory = payload.defaultCategory || (filterButtons[0]?.dataset.filter || allKey);

    const getFilteredVideos = (category) => {
      if (category === allKey) return sortedVideos;
      return sortedVideos.filter((video) => video.category === category);
    };

    const setActiveFilter = (category) => {
      filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === category;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    };

    const updateDots = (count) => {
      if (!dots) return;
      dots.innerHTML = '';
      if (count <= 1) {
        dots.setAttribute('hidden', 'true');
        return;
      }
      dots.removeAttribute('hidden');
      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'media-showcase__dot';
        if (index === 0) dot.classList.add('is-active');
        dots.appendChild(dot);
      }
    };

    const updateActiveDot = (index) => {
      if (!dots) return;
      const dotItems = dots.querySelectorAll('.media-showcase__dot');
      dotItems.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
    };
    const getCardGap = () => {
      const cards = carousel?.querySelectorAll('.media-showcase__card') || [];
      if (cards.length < 2) return 0;
      const first = cards[0];
      const second = cards[1];
      return second.offsetLeft - first.offsetLeft - first.offsetWidth;
    };

    const updateHints = () => {
      if (!leftHint || !rightHint || !carousel) return;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 1) {
        leftHint.setAttribute('hidden', 'true');
        rightHint.setAttribute('hidden', 'true');
        return;
      }
      if (carousel.scrollLeft <= 4) {
        leftHint.setAttribute('hidden', 'true');
      } else {
        leftHint.removeAttribute('hidden');
      }
      if (carousel.scrollLeft >= maxScroll - 4) {
        rightHint.setAttribute('hidden', 'true');
      } else {
        rightHint.removeAttribute('hidden');
      }
    };

    const scrollToIndex = (index) => {
      const cards = carousel?.querySelectorAll('.media-showcase__card') || [];
      if (!cards.length || !carousel) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      carousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    const isEmbedCode = (value) => typeof value === 'string' && /<\s*(iframe|video|embed|object)/i.test(value);

    const buildCard = (video) => {
      const card = document.createElement('a');
      card.className = 'media-showcase__card';
      const detailHref = videoDetailBase && video.id
        ? `${videoDetailBase}/${video.id}`
        : (video.video_url && !isEmbedCode(video.video_url) ? video.video_url : '#');
      card.href = detailHref;

      const thumb = document.createElement('div');
      thumb.className = 'media-showcase__thumb';
      if (video.thumbnail_url) {
        thumb.style.backgroundImage = `url('${video.thumbnail_url}'), var(--media-thumb-fallback)`;
      }

      const badge = document.createElement('span');
      badge.className = 'media-showcase__badge';
      const badgeLabel = categoryLabels[video.category] || video.category || '';
      badge.textContent = String(badgeLabel).toUpperCase();
      thumb.appendChild(badge);

      const play = document.createElement('span');
      play.className = 'media-showcase__play';
      play.textContent = '▶';
      thumb.appendChild(play);

      const body = document.createElement('div');
      body.className = 'media-showcase__body';

      const title = document.createElement('h4');
      title.className = 'media-showcase__card-title';
      title.textContent = video.title || '';

      const text = document.createElement('p');
      text.className = 'media-showcase__card-text';
      text.textContent = video.description_short || video.description || '';

      const meta = document.createElement('div');
      meta.className = 'media-showcase__meta';

      const duration = document.createElement('span');
      duration.textContent = video.duration ? `${video.duration} min` : '';
      meta.appendChild(duration);

      // Optionaler Link zur Videotrailer
      // if (video.video_url && !isEmbedCode(video.video_url)) {
      //   const link = document.createElement('a');
      //   link.className = 'media-showcase__link';
      //   link.href = video.video_url;
      //           link.innerHTML = `${expandLabel} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4 9.3-9.3H14V3z"></path><path d="M5 5h6v2H7v10h10v-4h2v6H5V5z"></path></svg>`;
      //   meta.appendChild(link);
      // }

      body.appendChild(title);
      body.appendChild(text);
      body.appendChild(meta);

      card.appendChild(thumb);
      card.appendChild(body);

      return card;
    };

    const renderCards = (category) => {
      if (!carousel) return;
      carousel.innerHTML = '';
      const filtered = getFilteredVideos(category).slice(0, maxCards);

      if (!filtered.length) {
        carousel.appendChild(emptyState);
        updateDots(0);
        updateHints();
        return;
      }

      filtered.forEach((video) => {
        carousel.appendChild(buildCard(video));
      });

      updateDots(filtered.length);
      updateActiveDot(0);
      carousel.scrollTo({ left: 0, behavior: 'auto' });
      updateHints();
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.filter;
        setActiveFilter(activeCategory);
        renderCards(activeCategory);
      });
    });

    if (carousel && dots) {
      carousel.addEventListener('scroll', () => {
        const cards = carousel.querySelectorAll('.media-showcase__card');
        if (!cards.length) return;
        const gap = getCardGap();
        const cardWidth = cards[0].offsetWidth + gap;
        const index = Math.round(carousel.scrollLeft / cardWidth);
        updateActiveDot(Math.min(index, cards.length - 1));
        updateHints();
      });
    }
    rightHint?.addEventListener('click', () => {
      const cards = carousel?.querySelectorAll('.media-showcase__card') || [];
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) + 1;
      scrollToIndex(Math.min(index, cards.length - 1));
    });

    leftHint?.addEventListener('click', () => {
      const cards = carousel?.querySelectorAll('.media-showcase__card') || [];
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) - 1;
      scrollToIndex(Math.max(index, 0));
    });

    setActiveFilter(activeCategory);
    renderCards(activeCategory);
  });
}

function initNewsSections() {
  const sections = document.querySelectorAll('[data-component="news-section"]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const carousel = section.querySelector('[data-carousel]');
    const dots = section.querySelector('[data-dots]');
    const leftHint = section.querySelector('[data-scroll="left"]');
    const rightHint = section.querySelector('[data-scroll="right"]');

    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll('.news-card'));
    const emptyState = carousel.querySelector('[data-empty]');
    const cardCount = emptyState ? 0 : cards.length;

    const updateDots = (count) => {
      if (!dots) return;
      dots.innerHTML = '';
      if (count <= 1) {
        dots.setAttribute('hidden', 'true');
        return;
      }
      dots.removeAttribute('hidden');
      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'news-section__dot';
        if (index === 0) dot.classList.add('is-active');
        dots.appendChild(dot);
      }
    };

    const getCardGap = () => {
      if (cards.length < 2) return 0;
      const first = cards[0];
      const second = cards[1];
      return second.offsetLeft - first.offsetLeft - first.offsetWidth;
    };

    const updateActiveDot = (index) => {
      if (!dots) return;
      const dotItems = dots.querySelectorAll('.news-section__dot');
      dotItems.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
    };

    const updateHints = () => {
      if (!leftHint || !rightHint) return;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 1) {
        leftHint.setAttribute('hidden', 'true');
        rightHint.setAttribute('hidden', 'true');
        return;
      }
      if (carousel.scrollLeft <= 4) {
        leftHint.setAttribute('hidden', 'true');
      } else {
        leftHint.removeAttribute('hidden');
      }
      if (carousel.scrollLeft >= maxScroll - 4) {
        rightHint.setAttribute('hidden', 'true');
      } else {
        rightHint.removeAttribute('hidden');
      }
    };

    const scrollToIndex = (index) => {
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      carousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    updateDots(cardCount);
    updateHints();

    if (cardCount <= 1) return;

    carousel.addEventListener('scroll', () => {
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth);
      updateActiveDot(Math.min(index, cards.length - 1));
      updateHints();
    });

    rightHint?.addEventListener('click', () => {
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) + 1;
      scrollToIndex(Math.min(index, cards.length - 1));
    });

    leftHint?.addEventListener('click', () => {
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) - 1;
      scrollToIndex(Math.max(index, 0));
    });
  });
}

function initNewsHero() {
  const hero = document.querySelector('[data-component="news-hero"]');
  if (!hero) return;

  const carousel = hero.querySelector('[data-carousel]');
  const dots = hero.querySelector('[data-dots]');
  const leftHint = hero.querySelector('[data-scroll="left"]');
  const rightHint = hero.querySelector('[data-scroll="right"]');

  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.news-hero__slide'));
  const slideCount = slides.length;

  const updateDots = (count) => {
    if (!dots) return;
    dots.innerHTML = '';
    if (count <= 1) {
      dots.setAttribute('hidden', 'true');
      return;
    }
    dots.removeAttribute('hidden');
    for (let index = 0; index < count; index += 1) {
      const dot = document.createElement('span');
      dot.className = 'news-hero__dot';
      if (index === 0) dot.classList.add('is-active');
      dots.appendChild(dot);
    }
  };

  const updateActiveDot = (index) => {
    if (!dots) return;
    const dotItems = dots.querySelectorAll('.news-hero__dot');
    dotItems.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === index);
    });
  };

  const updateHints = () => {
    if (!leftHint || !rightHint) return;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (maxScroll <= 1) {
      leftHint.setAttribute('hidden', 'true');
      rightHint.setAttribute('hidden', 'true');
      return;
    }
    if (carousel.scrollLeft <= 4) {
      leftHint.setAttribute('hidden', 'true');
    } else {
      leftHint.removeAttribute('hidden');
    }
    if (carousel.scrollLeft >= maxScroll - 4) {
      rightHint.setAttribute('hidden', 'true');
    } else {
      rightHint.removeAttribute('hidden');
    }
  };

  const scrollToIndex = (index) => {
    if (!slides.length) return;
    const slideWidth = slides[0].offsetWidth;
    carousel.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
  };

  updateDots(slideCount);
  updateHints();

  if (slideCount <= 1) return;

  carousel.addEventListener('scroll', () => {
    if (!slides.length) return;
    const slideWidth = slides[0].offsetWidth;
    const index = Math.round(carousel.scrollLeft / slideWidth);
    updateActiveDot(Math.min(index, slides.length - 1));
    updateHints();
  });

  rightHint?.addEventListener('click', () => {
    const slideWidth = slides[0].offsetWidth;
    const index = Math.round(carousel.scrollLeft / slideWidth) + 1;
    scrollToIndex(Math.min(index, slides.length - 1));
  });

  leftHint?.addEventListener('click', () => {
    const slideWidth = slides[0].offsetWidth;
    const index = Math.round(carousel.scrollLeft / slideWidth) - 1;
    scrollToIndex(Math.max(index, 0));
  });
}

function initNewsLoadMore() {
  const list = document.querySelector('[data-news-list]');
  const button = document.querySelector('[data-news-load]');
  if (!list || !button) return;

  const items = Array.from(list.querySelectorAll('[data-news-item]'));
  if (!items.length) {
    button.setAttribute('hidden', 'true');
    return;
  }

  let visibleCount = Math.min(6, items.length);

  const updateVisibility = () => {
    items.forEach((item, index) => {
      item.hidden = index >= visibleCount;
    });
    if (visibleCount >= items.length) {
      button.setAttribute('hidden', 'true');
    } else {
      button.removeAttribute('hidden');
    }
  };

  updateVisibility();

  button.addEventListener('click', () => {
    visibleCount = Math.min(visibleCount + 6, items.length);
    updateVisibility();
  });
}

function initNewsCardLinks() {
  const cards = document.querySelectorAll('.news-card[data-link]');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      const target = event.target;
      if (target.closest('a')) return;
      const href = card.getAttribute('data-link');
      if (href && href !== '#') {
        window.location.href = href;
      }
    });
  });
}

function initNewsGallery() {
  const galleries = document.querySelectorAll('[data-component="news-gallery"]');
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const items = Array.from(gallery.querySelectorAll('.news-detail__gallery-item'));
    const nextButton = gallery.querySelector('[data-gallery-next]');
    if (!items.length) {
      nextButton?.setAttribute('hidden', 'true');
      return;
    }

    let activeIndex = 0;

    const normalizeIndex = (index) => {
      const count = items.length;
      if (!count) return 0;
      return (index + count) % count;
    };

    const updateItems = () => {
      const count = items.length;
      const nextIndex = normalizeIndex(activeIndex + 1);

      items.forEach((item, index) => {
        const isActive = index === activeIndex;
        const isNext = count > 1 && index === nextIndex;

        item.classList.toggle('is-active', isActive);
        item.classList.toggle('is-next', isNext);

        const video = item.querySelector('video');
        if (video) {
          if (isActive) {
            video.controls = true;
            video.muted = false;
          } else {
            video.controls = false;
            video.muted = true;
            video.pause();
          }
        }
      });

      if (count <= 1) {
        nextButton?.setAttribute('hidden', 'true');
      } else {
        nextButton?.removeAttribute('hidden');
      }
    };

    const setActive = (index) => {
      activeIndex = normalizeIndex(index);
      updateItems();
    };

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        setActive(index);
      });
    });

    nextButton?.addEventListener('click', () => {
      setActive(activeIndex + 1);
    });

    updateItems();
  });
}

function initTicketShowcases() {
  const sections = document.querySelectorAll('[data-component="ticket-showcase"]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const carousel = section.querySelector('[data-carousel]');
    const dots = section.querySelector('[data-dots]');
    const leftHint = section.querySelector('[data-scroll="left"]');
    const rightHint = section.querySelector('[data-scroll="right"]');

    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll('.ticket-card'));
    const emptyState = carousel.querySelector('.ticket-showcase__empty');
    const cardCount = emptyState ? 0 : cards.length;
    const minCards = Number(section.dataset.minCards || 2);
    const minCardsForSlider = Number.isNaN(minCards) ? 2 : minCards;

    const updateDots = (count) => {
      if (!dots) return;
      dots.innerHTML = '';
      if (count < minCardsForSlider) {
        dots.setAttribute('hidden', 'true');
        return;
      }
      dots.removeAttribute('hidden');
      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'ticket-showcase__dot';
        if (index === 0) dot.classList.add('is-active');
        dots.appendChild(dot);
      }
    };

    const getCardGap = () => {
      if (cards.length < 2) return 0;
      const first = cards[0];
      const second = cards[1];
      return second.offsetLeft - first.offsetLeft - first.offsetWidth;
    };

    const updateActiveDot = (index) => {
      if (!dots) return;
      const dotItems = dots.querySelectorAll('.ticket-showcase__dot');
      dotItems.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
    };

    const updateHints = () => {
      if (!leftHint || !rightHint) return;
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 1 || cardCount < minCardsForSlider) {
        leftHint.setAttribute('hidden', 'true');
        rightHint.setAttribute('hidden', 'true');
        return;
      }
      if (carousel.scrollLeft <= 4) {
        leftHint.setAttribute('hidden', 'true');
      } else {
        leftHint.removeAttribute('hidden');
      }
      if (carousel.scrollLeft >= maxScroll - 4) {
        rightHint.setAttribute('hidden', 'true');
      } else {
        rightHint.removeAttribute('hidden');
      }
    };

    const scrollToIndex = (index) => {
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      carousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    updateDots(cardCount);
    updateHints();

    if (cardCount < minCardsForSlider) return;

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let dragged = false;
    const dragThreshold = 6;

    const stopDragging = () => {
      isDown = false;
      carousel.classList.remove('is-dragging');
    };

    carousel.addEventListener('pointerdown', (event) => {
      isDown = true;
      startX = event.pageX;
      scrollStart = carousel.scrollLeft;
      dragged = false;
    });

    carousel.addEventListener('pointermove', (event) => {
      if (!isDown) return;
      const walk = startX - event.pageX;
      if (!dragged && Math.abs(walk) > dragThreshold) {
        dragged = true;
        carousel.classList.add('is-dragging');
        carousel.setPointerCapture(event.pointerId);
      }
      if (!dragged) return;
      event.preventDefault();
      carousel.scrollLeft = scrollStart + walk;
    });

    carousel.addEventListener('pointerup', stopDragging);
    carousel.addEventListener('pointercancel', stopDragging);
    carousel.addEventListener('pointerleave', stopDragging);
    carousel.addEventListener('click', (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    });

    carousel.addEventListener('scroll', () => {
      if (!cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth);
      updateActiveDot(Math.min(index, cards.length - 1));
      updateHints();
    });

    rightHint?.addEventListener('click', () => {
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) + 1;
      scrollToIndex(Math.min(index, cards.length - 1));
    });

    leftHint?.addEventListener('click', () => {
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth) - 1;
      scrollToIndex(Math.max(index, 0));
    });
  });
}
function initVideoCarousels() {
  const carousels = document.querySelectorAll('[data-video-carousel]');
  if (!carousels.length) return;

  carousels.forEach((carousel) => {
    carousel.querySelectorAll('a, img').forEach((el) => {
      el.setAttribute('draggable', 'false');
    });
    carousel.addEventListener('dragstart', (event) => {
      event.preventDefault();
    });
    const cards = Array.from(carousel.querySelectorAll('.video-card'));
    const getCardGap = () => {
      const styles = window.getComputedStyle(carousel);
      const gapValue = styles.columnGap || styles.gap || '0px';
      const parsed = parseFloat(gapValue);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let dragged = false;
    const dragThreshold = 1;

    const stopDragging = () => {
      isDown = false;
      carousel.classList.remove('is-dragging');
      if (!dragged || !cards.length) return;
      const gap = getCardGap();
      const cardWidth = cards[0].offsetWidth + gap;
      const index = Math.round(carousel.scrollLeft / cardWidth);
      carousel.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    };

    const isTouchPointer = (event) => event.pointerType === 'touch' || event.pointerType === 'pen';

    carousel.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || isTouchPointer(event)) return;
      isDown = true;
      startX = event.pageX;
      scrollStart = carousel.scrollLeft;
      dragged = false;
    });

    carousel.addEventListener('pointermove', (event) => {
      if (!isDown || isTouchPointer(event)) return;
      const walk = startX - event.pageX;
      if (!dragged && Math.abs(walk) > dragThreshold) {
        dragged = true;
        carousel.classList.add('is-dragging');
        carousel.setPointerCapture(event.pointerId);
      }
      if (!dragged) return;
      event.preventDefault();
      carousel.scrollLeft = scrollStart + walk;
    });

    carousel.addEventListener('pointerup', stopDragging);
    carousel.addEventListener('pointercancel', stopDragging);
    carousel.addEventListener('pointerleave', stopDragging);
    carousel.addEventListener('click', (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    });
  });
}

function initVideoCardPreview() {
  const categories = document.querySelectorAll('[data-video-category]');
  if (!categories.length) return;

  categories.forEach((category) => {
    const preview = category.querySelector('[data-video-preview]');
    const carousel = category.querySelector('[data-video-carousel]');
    if (!preview || !carousel) return;

    const previewLink = preview.querySelector('[data-preview-link]');
    const previewImage = preview.querySelector('[data-preview-image]');
    const previewTitle = preview.querySelector('[data-preview-title]');
    const previewDescription = preview.querySelector('[data-preview-description]');
    const previewMeta = preview.querySelector('[data-preview-meta]');
    const previewScenes = preview.querySelector('[data-preview-scenes]');
    const previewScenesGrid = preview.querySelector('[data-preview-scenes-grid]');
    const cards = Array.from(category.querySelectorAll('[data-video-card]'));
    let hideTimeout;

    if (!cards.length) return;

    const hidePreview = () => {
      preview.setAttribute('hidden', 'true');
      preview.classList.remove('is-visible');
    };

    const clearHideTimeout = () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    };

    const scheduleHide = () => {
      clearHideTimeout();
      hideTimeout = window.setTimeout(() => {
        hidePreview();
      }, 120);
    };

    const updatePreview = (card) => {
      const data = card.dataset;
      previewTitle.textContent = data.videoTitle || '';
      previewDescription.textContent = data.videoDescription || '';
      if (previewImage) {
        previewImage.style.backgroundImage = data.videoThumbnail
          ? `url('${data.videoThumbnail}')`
          : '';
      }
      if (previewLink) {
        previewLink.href = card.getAttribute('href') || '#';
      }
      if (previewMeta) {
        previewMeta.innerHTML = '';
        const entries = [
          ['Erscheinungsjahr', data.videoYear],
          ['Verfügbare Sprachen', data.videoLanguages],
          ['Regie', data.videoRegie],
          ['Produktion', data.videoProduction],
          ['Laufzeit', data.videoDuration]
        ];
        entries.forEach(([label, value]) => {
          if (!value) return;
          const wrapper = document.createElement('div');
          const dt = document.createElement('dt');
          const dd = document.createElement('dd');
          dt.textContent = label;
          dd.textContent = value;
          wrapper.appendChild(dt);
          wrapper.appendChild(dd);
          previewMeta.appendChild(wrapper);
        });
      }
      if (previewScenes && previewScenesGrid) {
        previewScenesGrid.innerHTML = '';
        let scenes = [];
        if (data.videoScenes) {
          try {
            scenes = JSON.parse(decodeURIComponent(data.videoScenes));
          } catch (error) {
            scenes = [];
          }
        }
        const visibleScenes = Array.isArray(scenes) ? scenes.filter(Boolean) : [];
        if (visibleScenes.length) {
          visibleScenes.forEach((scene, index) => {
            const img = document.createElement('img');
            img.src = scene;
            img.alt = data.videoTitle ? `Szene ${data.videoTitle} ${index + 1}` : `Szene ${index + 1}`;
            previewScenesGrid.appendChild(img);
          });
          previewScenes.removeAttribute('hidden');
        } else {
          previewScenes.setAttribute('hidden', 'true');
        }
      }
    };

    const positionPreview = (card) => {
      const cardRect = card.getBoundingClientRect();
      const categoryRect = category.getBoundingClientRect();
      const top = cardRect.bottom - categoryRect.top + 16;
      const left = cardRect.left - categoryRect.left;

      preview.style.top = `${top}px`;
      preview.style.left = `${left}px`;

      requestAnimationFrame(() => {
        const maxLeft = category.clientWidth - preview.offsetWidth - 8;
        const boundedLeft = Math.min(Math.max(left, 8), Math.max(maxLeft, 8));
        preview.style.left = `${boundedLeft}px`;
      });
    };

    const showPreview = (card) => {
      clearHideTimeout();
      updatePreview(card);
      preview.removeAttribute('hidden');
      preview.classList.add('is-visible');
      positionPreview(card);
    };

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => showPreview(card));
      card.addEventListener('focus', () => showPreview(card));
      card.addEventListener('mouseleave', (event) => {
        if (preview.contains(event.relatedTarget)) return;
        scheduleHide();
      });
    });

    preview.addEventListener('mouseenter', clearHideTimeout);
    preview.addEventListener('mouseleave', (event) => {
      if (category.contains(event.relatedTarget)) return;
      hidePreview();
    });

    category.addEventListener('mouseleave', (event) => {
      if (preview.contains(event.relatedTarget)) return;
      hidePreview();
    });
    document.addEventListener('click', (event) => {
      if (!category.contains(event.target)) hidePreview();
    });
  });
}

function initVideoHeroPlayer() {
  const hero = document.querySelector('[data-component=\"video-hero\"]');
  if (!hero) return;
  const playButton = hero.querySelector('[data-video-play]');
  const media = hero.querySelector('[data-video-hero]');
  if (!playButton || !media) return;

  playButton.addEventListener('click', () => {
    const videoEl = media.querySelector('video');
    if (media.requestFullscreen) {
      media.requestFullscreen().catch(() => { });
    }
    if (videoEl?.play) {
      videoEl.play().catch(() => { });
    }
  });
}

function initVideoScenesGallery() {
  const scenesSection = document.querySelector('[data-video-scenes]');
  if (!scenesSection) return;

  const sceneItems = Array.from(scenesSection.querySelectorAll('[data-scene-index]'));
  const scenesGrid = scenesSection.querySelector('[data-video-scenes-grid]');
  const lightbox = scenesSection.querySelector('[data-video-scenes-lightbox]');
  if (!sceneItems.length || !lightbox || !scenesGrid) return;

  const overlay = lightbox.querySelector('[data-video-scenes-overlay]');
  const mediaFrame = lightbox.querySelector('[data-video-scenes-media]');
  const prevButton = lightbox.querySelector('[data-video-scenes-prev]');
  const nextButton = lightbox.querySelector('[data-video-scenes-next]');
  const closeButtons = Array.from(lightbox.querySelectorAll('[data-video-scenes-close]'));

  sceneItems.forEach((item) => {
    item.querySelectorAll('img, video').forEach((media) => {
      media.setAttribute('draggable', 'false');
    });
  });

  const scenes = sceneItems.map((item) => ({
    src: item.dataset.sceneSrc || '',
    type: item.dataset.sceneType || 'image',
    alt: item.querySelector('img')?.alt || 'Szene'
  }));

  let activeIndex = 0;
  let dragStartX = 0;
  let dragging = false;
  let dragReleaseAt = 0;

  const setScene = (index, direction) => {
    if (!scenes.length || !mediaFrame) return;
    activeIndex = (index + scenes.length) % scenes.length;
    const scene = scenes[activeIndex];
    mediaFrame.innerHTML = '';

    let mediaEl;
    if (scene.type === 'video') {
      mediaEl = document.createElement('video');
      mediaEl.src = scene.src;
      mediaEl.controls = true;
      mediaEl.playsInline = true;
      mediaEl.preload = 'metadata';
    } else {
      mediaEl = document.createElement('img');
      mediaEl.src = scene.src;
      mediaEl.alt = scene.alt;
    }
    mediaFrame.appendChild(mediaEl);

    if (direction) {
      const offset = direction === 'next' ? 24 : -24;
      mediaFrame.animate(
        [
          { opacity: 0, transform: `translateX(${offset}px)` },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        { duration: 260, easing: 'ease-out' }
      );
    }
  };

  const openLightbox = (index) => {
    activeIndex = index;
    lightbox.removeAttribute('hidden');
    window.requestAnimationFrame(() => {
      lightbox.classList.add('is-active');
    });
    document.body.classList.add('is-video-scenes-open');
    setScene(index);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-active');
    document.body.classList.remove('is-video-scenes-open');
    window.setTimeout(() => {
      if (!lightbox.classList.contains('is-active')) {
        lightbox.setAttribute('hidden', 'true');
      }
    }, 250);
  };

  sceneItems.forEach((item, index) => {
    item.addEventListener('click', (event) => {
      if (Date.now() - dragReleaseAt < 250) {
        event.preventDefault();
        return;
      }
      openLightbox(index);
    });
  });

  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeLightbox);
  });

  prevButton?.addEventListener('click', () => setScene(activeIndex - 1, 'prev'));
  nextButton?.addEventListener('click', () => setScene(activeIndex + 1, 'next'));

  mediaFrame?.addEventListener('pointerdown', (event) => {
    dragStartX = event.clientX;
    dragging = true;
    mediaFrame.setPointerCapture(event.pointerId);
  });

  mediaFrame?.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) > 50) {
      if (delta < 0) {
        setScene(activeIndex + 1, 'next');
      } else {
        setScene(activeIndex - 1, 'prev');
      }
    }
    if (mediaFrame.hasPointerCapture(event.pointerId)) {
      mediaFrame.releasePointerCapture(event.pointerId);
    }
    dragging = false;
  });

  mediaFrame?.addEventListener('pointercancel', () => {
    dragging = false;
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-active')) return;
    if (event.key === 'Escape') {
      closeLightbox();
    }
    if (event.key === 'ArrowRight') {
      setScene(activeIndex + 1, 'next');
    }
    if (event.key === 'ArrowLeft') {
      setScene(activeIndex - 1, 'prev');
    }
  });

  let carouselDown = false;
  let carouselStartX = 0;
  let carouselScrollStart = 0;
  let carouselDragged = false;

  scenesGrid.addEventListener('dragstart', (event) => {
    event.preventDefault();
  });

  scenesGrid.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    carouselDown = true;
    carouselStartX = event.pageX;
    carouselScrollStart = scenesGrid.scrollLeft;
    carouselDragged = false;
    scenesGrid.classList.add('is-dragging');
  });

  scenesGrid.addEventListener('pointermove', (event) => {
    if (!carouselDown) return;
    const walk = carouselStartX - event.pageX;
    if (!carouselDragged && Math.abs(walk) > 6) {
      carouselDragged = true;
      scenesGrid.setPointerCapture(event.pointerId);
    }
    if (!carouselDragged) return;
    event.preventDefault();
    scenesGrid.scrollLeft = carouselScrollStart + walk;
  });

  scenesGrid.addEventListener('pointerup', (event) => {
    if (carouselDragged) {
      dragReleaseAt = Date.now();
    }
    if (scenesGrid.hasPointerCapture(event.pointerId)) {
      scenesGrid.releasePointerCapture(event.pointerId);
    }
    carouselDown = false;
    carouselDragged = false;
    scenesGrid.classList.remove('is-dragging');
  });

  scenesGrid.addEventListener('pointercancel', (event) => {
    if (scenesGrid.hasPointerCapture(event.pointerId)) {
      scenesGrid.releasePointerCapture(event.pointerId);
    }
    carouselDown = false;
    carouselDragged = false;
    scenesGrid.classList.remove('is-dragging');
  });
}

function initTicketsHero() {
  const heroes = document.querySelectorAll('[data-component="tickets-hero"]');
  if (!heroes.length) return;

  heroes.forEach((hero) => {
    const buttons = Array.from(hero.querySelectorAll('[data-ticket-choice]'));
    const heroCtas = Array.from(hero.querySelectorAll('[data-ticket-scroll]'));
    const panels = Array.from(hero.querySelectorAll('[data-ticket-panel]'));
    // const dots = Array.from(hero.querySelectorAll('[data-ticket-dot]'));
    const sectionPanels = Array.from(document.querySelectorAll('[data-ticket-section]'));
    if (!buttons.length || !panels.length) return;

    const defaultChoice = hero.dataset.defaultChoice || buttons[0].dataset.ticketChoice;

    const setActive = (choice) => {
      buttons.forEach((button) => {
        const isActive = button.dataset.ticketChoice === choice;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.ticketPanel === choice;
        panel.classList.toggle('is-active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', 'true');
        }
      });

      sectionPanels.forEach((panel) => {
        const isActive = panel.dataset.ticketSection === choice;
        panel.classList.toggle('is-active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', 'true');
        }
      });

      hero.dataset.activeChoice = choice;
    };

    setActive(defaultChoice);

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        setActive(button.dataset.ticketChoice);
      });
    });

    const resolveChoice = (cta) => {
      const explicitChoice = cta.dataset.ticketScroll;
      if (explicitChoice) return explicitChoice;
      const href = cta.getAttribute('href') || '';
      if (href.includes('kino')) return 'kino';
      if (href.includes('online')) return 'online';
      return null;
    };

    const resolveTarget = (choice) =>
      document.querySelector(`#tickets-${choice}`)
      || document.querySelector(`[data-ticket-section="${choice}"]`)
      || hero.querySelector(`[data-ticket-panel="${choice}"] .tickets-hero__content`)
      || hero.querySelector(`[data-ticket-panel="${choice}"]`);

    heroCtas.forEach((cta) => {
      cta.addEventListener('click', (event) => {
        const choice = resolveChoice(cta);
        if (!choice) return;
        const target = resolveTarget(choice);
        if (!target) return;
        event.preventDefault();
        setActive(choice);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
}

function initTeamSliders() {
  const sliders = document.querySelectorAll('[data-component="team-slider"]');
  if (!sliders.length) return;

  sliders.forEach((slider) => {
    const carousel = slider.querySelector('[data-team-carousel]');
    const dots = slider.querySelector('[data-team-dots]');
    const leftHint = slider.querySelector('[data-team-scroll="left"]');
    const rightHint = slider.querySelector('[data-team-scroll="right"]');

    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll('.team-card'));
    const emptyState = carousel.querySelector('[data-empty]');
    const cardCount = emptyState ? 0 : cards.length;
    let isDragging = false;

    const updateDots = (count) => {
      if (!dots) return;
      dots.innerHTML = '';
      if (count <= 1) {
        dots.setAttribute('hidden', 'true');
        return;
      }
      dots.removeAttribute('hidden');
      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'team-slider__dot';
        if (index === 0) dot.classList.add('is-active');
        dots.appendChild(dot);
      }
    };

    const getCardPositions = () => cards.map((card) => card.offsetLeft);

    const getClosestIndex = () => {
      if (!cards.length) return 0;
      const positions = getCardPositions();
      const current = carousel.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Math.abs(current - positions[0]);
      positions.forEach((position, index) => {
        const distance = Math.abs(current - position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      return closestIndex;
    };

    const updateActiveDot = (index) => {
      if (!dots) return;
      const dotItems = dots.querySelectorAll('.team-slider__dot');
      dotItems.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === index);
      });
    };

    const updateHints = () => {
      if (!leftHint || !rightHint) return;
      if (cards.length <= 1) {
        leftHint.setAttribute('hidden', 'true');
        rightHint.setAttribute('hidden', 'true');
        return;
      }
      const index = getClosestIndex();
      leftHint.toggleAttribute('hidden', index === 0);
      rightHint.toggleAttribute('hidden', index === cards.length - 1);
    };

    const scrollToIndex = (index) => {
      if (!cards.length) return;
      const positions = getCardPositions();
      const target = positions[Math.min(index, positions.length - 1)];
      carousel.scrollTo({ left: target, behavior: 'smooth' });
    };

    updateDots(cardCount);
    updateHints();

    if (cardCount > 1) {
      carousel.addEventListener('scroll', () => {
        if (!cards.length) return;
        const index = getClosestIndex();
        updateActiveDot(index);
        updateHints();
      });

      rightHint?.addEventListener('click', () => {
        const index = getClosestIndex() + 1;
        scrollToIndex(Math.min(index, cards.length - 1));
      });

      leftHint?.addEventListener('click', () => {
        const index = getClosestIndex() - 1;
        scrollToIndex(Math.max(index, 0));
      });
    }

    let startX = 0;
    let scrollStart = 0;

    const stopDragging = (event) => {
      if (event && carousel.hasPointerCapture(event.pointerId)) {
        carousel.releasePointerCapture(event.pointerId);
      }
      isDragging = false;
      carousel.classList.remove('is-dragging');
    };

    let wasDragging = false;
    let startFlipButton = null;
    let suppressClick = false;

    carousel.addEventListener('pointerdown', (event) => {
      isDragging = false;
      wasDragging = false;
      startFlipButton = event.target.closest('[data-team-flip]');
      startX = event.pageX;
      scrollStart = carousel.scrollLeft;
      carousel.classList.add('is-dragging');
      carousel.setPointerCapture(event.pointerId);
    });

    carousel.addEventListener('dragstart', (event) => {
      if (event.target && event.target.tagName === 'IMG') {
        event.preventDefault();
      }
    });

    carousel.addEventListener('pointermove', (event) => {
      if (!carousel.hasPointerCapture(event.pointerId)) return;
      const walk = startX - event.pageX;
      if (Math.abs(walk) > 6) {
        isDragging = true;
        wasDragging = true;
      }
      carousel.scrollLeft = scrollStart + walk;
    });

    carousel.addEventListener('pointerup', stopDragging);
    carousel.addEventListener('pointercancel', stopDragging);
    carousel.addEventListener('pointerleave', stopDragging);
    carousel.addEventListener('pointerup', (event) => {
      if (!startFlipButton || wasDragging) {
        startFlipButton = null;
        return;
      }
      const card = startFlipButton.closest('.team-card');
      if (!card) return;
      const isFlipped = card.classList.toggle('is-flipped');
      startFlipButton.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
      suppressClick = true;
      startFlipButton = null;
      stopDragging(event);
    });
    carousel.addEventListener('pointercancel', () => {
      startFlipButton = null;
    });
    carousel.addEventListener('pointerleave', () => {
      startFlipButton = null;
    });

    cards.forEach((card) => {
      const button = card.querySelector('[data-team-flip]');
      if (!button) return;
      button.addEventListener('click', () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        if (wasDragging) return;
        const isFlipped = card.classList.toggle('is-flipped');
        button.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
      });
    });
  });
}

function initDonationForms() {
  const sections = document.querySelectorAll('[data-donation]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const form = section.querySelector('[data-donation-form]');
    const amountButtons = Array.from(section.querySelectorAll('[data-donation-amount]'));
    const customButton = section.querySelector('[data-donation-custom]');
    const customField = section.querySelector('[data-donation-custom-field]');
    const customInput = customField?.querySelector('input');
    const amountInput = section.querySelector('input[name="donation_amount"]');
    const errorField = section.querySelector('[data-donation-error]');

    if (!amountInput) return;

    const setActiveButton = (button) => {
      amountButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      if (customButton) {
        customButton.classList.toggle('is-active', button === customButton);
      }
    };

    const setAmountValue = (value) => {
      amountInput.value = value || '';
    };

    amountButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setActiveButton(button);
        setAmountValue(button.dataset.amountValue || '');
        if (customField) customField.hidden = true;
        if (customInput) customInput.value = '';
      });
    });

    customButton?.addEventListener('click', () => {
      setActiveButton(customButton);
      if (customField) customField.hidden = false;
      if (customInput) {
        customInput.focus();
        setAmountValue(customInput.value || '');
      }
    });

    customInput?.addEventListener('input', () => {
      setAmountValue(customInput.value || '');
    });

    if (amountButtons.length) {
      setActiveButton(amountButtons[0]);
      setAmountValue(amountButtons[0].dataset.amountValue || '');
    }

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (errorField) {
        errorField.hidden = true;
        errorField.textContent = '';
      }

      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Die Spende konnte nicht verarbeitet werden.');
        }
        if (data?.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        if (errorField) {
          errorField.textContent = err.message || 'Die Spende konnte nicht verarbeitet werden.';
          errorField.hidden = false;
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
}
function initImageSliders() {
  const sliders = document.querySelectorAll('[data-component="image-slider"]');
  if (!sliders.length) return;

  sliders.forEach((slider) => {
    const list = slider.querySelector('[data-image-list]');
    const thumbnails = slider.querySelector('[data-image-thumbnails]');
    const prevButton = slider.querySelector('[data-image-prev]');
    const nextButton = slider.querySelector('[data-image-next]');
    const cta = slider.querySelector('[data-image-cta]');

    if (!list || !thumbnails || !prevButton || !nextButton) return;

    const timeRunning = 600;
    let runTimeout;

    const updateCta = () => {
      if (!cta) return;
      const firstSlide = list.querySelector('.image-slider__item');
      const href = firstSlide?.dataset?.link || '#';
      cta.setAttribute('href', href);
    };

    const showSlider = (direction) => {
      const itemSlider = list.querySelectorAll('.image-slider__item');
      const itemThumbs = thumbnails.querySelectorAll('.image-slider__thumb');
      if (!itemSlider.length || !itemThumbs.length) return;

      if (direction === 'next') {
        list.appendChild(itemSlider[0]);
        thumbnails.appendChild(itemThumbs[0]);
        slider.classList.add('is-next');
      } else {
        const lastIndex = itemSlider.length - 1;
        list.prepend(itemSlider[lastIndex]);
        thumbnails.prepend(itemThumbs[lastIndex]);
        slider.classList.add('is-prev');
      }

      clearTimeout(runTimeout);
      runTimeout = setTimeout(() => {
        slider.classList.remove('is-next');
        slider.classList.remove('is-prev');
      }, timeRunning);

      updateCta();
    };

    prevButton.addEventListener('click', () => showSlider('prev'));
    nextButton.addEventListener('click', () => showSlider('next'));

    updateCta();
  });
}

initImageSliders();

initMediaShowcases();
initNewsSections();
initNewsHero();
initNewsLoadMore();
initNewsCardLinks();
initNewsGallery();
initTicketShowcases();
initVideoCardPreview();
initVideoCarousels();
initVideoHeroPlayer();
initVideoScenesGallery();
initTicketsHero();
initTeamSliders();
initDonationForms();
