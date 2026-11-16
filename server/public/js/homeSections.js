/**
 * Interaktionen & Animationen für die Startseiten-Sektionen
 * (Über uns, Werte, Bewertungen, Referenzen).
 * Läuft nur, wenn eine der Sektionen auf der Seite ist.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  const sections = document.querySelectorAll('.home-about, .home-values, .home-reviews, .home-refs');
  if (!sections.length) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('home-js');

  /* ---------- Scroll-Reveal ---------- */
  const revealEls = document.querySelectorAll('.home-reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Zähler ---------- */
  const formatNumber = (value, decimals) => value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    if (!Number.isFinite(target)) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(target * eased, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => {
      el.textContent = formatNumber(0, Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
      counterObserver.observe(el);
    });
  }

  /* ---------- Parallax & Timeline (scrollgetrieben) ---------- */
  const parallaxEls = reduceMotion ? [] : Array.from(document.querySelectorAll('[data-parallax]'));
  const timelines = Array.from(document.querySelectorAll('[data-timeline]'));
  let ticking = false;

  const onScroll = () => {
    const vh = window.innerHeight || 1;
    parallaxEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const factor = Number(el.dataset.parallax) || 0.05;
      const offset = (rect.top + rect.height / 2 - vh / 2) * factor * -1;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.12)`;
    });
    timelines.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.65 - rect.top) / Math.max(1, rect.height)));
      el.style.setProperty('--progress', progress.toFixed(3));
    });
    ticking = false;
  };

  if (parallaxEls.length || timelines.length) {
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- Swipe-Helfer ---------- */
  const addSwipe = (el, onLeft, onRight) => {
    let startX = null;
    let startY = null;
    el.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      startX = event.clientX;
      startY = event.clientY;
    });
    el.addEventListener('pointerup', (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      startX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onLeft(); else onRight();
    });
  };

  /* ---------- Bewertungen: Spotlight-Karussell ---------- */
  document.querySelectorAll('[data-review-spotlight]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-dot]'));
    const progress = carousel.querySelector('[data-progress]');
    const delay = Number(carousel.dataset.autoplay) || 0;
    if (slides.length < 2) return;
    let current = 0;
    let timer = null;
    let paused = false;

    const show = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;
      const direction = next > current ? 'forward' : 'back';
      carousel.dataset.direction = direction;
      slides[current].classList.remove('is-active');
      slides[current].hidden = true;
      slides[next].hidden = false;
      // Reflow, damit die Einblend-Animation neu startet
      void slides[next].offsetWidth;
      slides[next].classList.add('is-active');
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === next);
        dot.setAttribute('aria-selected', i === next ? 'true' : 'false');
      });
      current = next;
      restart();
    };

    const restart = () => {
      if (!delay || reduceMotion) return;
      clearTimeout(timer);
      if (progress) {
        progress.style.transition = 'none';
        progress.style.transform = 'scaleX(0)';
        void progress.offsetWidth;
      }
      if (paused) return;
      if (progress) {
        progress.style.transition = `transform ${delay}ms linear`;
        progress.style.transform = 'scaleX(1)';
      }
      timer = setTimeout(() => show(current + 1), delay);
    };

    const pause = () => {
      paused = true;
      clearTimeout(timer);
      if (progress) {
        progress.style.transition = 'none';
        progress.style.transform = 'scaleX(0)';
      }
    };
    const resume = () => {
      paused = false;
      restart();
    };

    carousel.querySelector('[data-prev]')?.addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-next]')?.addEventListener('click', () => show(current + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.dot))));
    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', resume);
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', resume);
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
    addSwipe(carousel, () => show(current + 1), () => show(current - 1));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? resume() : pause()));
      }, { threshold: 0.3 }).observe(carousel);
    } else {
      restart();
    }
  });

  /* ---------- Bewertungen: horizontale Leiste ---------- */
  document.querySelectorAll('[data-review-track]').forEach((track) => {
    const list = track.querySelector('[data-track-list]');
    const progress = track.querySelector('[data-track-progress]');
    const section = track.closest('section');
    if (!list) return;

    const step = () => {
      const card = list.querySelector('li');
      return card ? card.getBoundingClientRect().width + 24 : list.clientWidth * 0.8;
    };
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      const ratio = max > 0 ? list.scrollLeft / max : 1;
      const visible = list.scrollWidth > 0 ? list.clientWidth / list.scrollWidth : 1;
      if (progress) {
        progress.style.width = `${Math.max(12, visible * 100)}%`;
        progress.style.transform = `translateX(${(ratio * (100 / Math.max(visible, 0.01) - 100)).toFixed(2)}%)`;
      }
      section?.querySelector('[data-track-prev]')?.toggleAttribute('disabled', list.scrollLeft <= 2);
      section?.querySelector('[data-track-next]')?.toggleAttribute('disabled', list.scrollLeft >= max - 2);
    };

    section?.querySelector('[data-track-prev]')?.addEventListener('click', () => list.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    section?.querySelector('[data-track-next]')?.addEventListener('click', () => list.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    list.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);

    // Ziehen mit der Maus
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let moved = false;
    list.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (event.target.closest('button, a')) return;
      dragging = true;
      moved = false;
      dragStartX = event.clientX;
      dragStartScroll = list.scrollLeft;
      list.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - dragStartX;
      if (Math.abs(dx) > 4) moved = true;
      list.scrollLeft = dragStartScroll - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      list.classList.remove('is-dragging');
    });
    list.addEventListener('click', (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    }, true);

    update();
  });

  /* ---------- „Weiterlesen“ bei langen Bewertungen ---------- */
  document.querySelectorAll('[data-readmore]').forEach((text) => {
    const toggle = text.parentElement.querySelector('[data-readmore-toggle]');
    const clamped = text.querySelector('p') || text;
    if (!toggle) return;
    const check = () => {
      if (text.classList.contains('is-expanded')) return;
      toggle.hidden = clamped.scrollHeight <= clamped.clientHeight + 4;
    };
    toggle.addEventListener('click', () => {
      const expanded = text.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      toggle.textContent = expanded ? 'Weniger anzeigen' : 'Weiterlesen';
    });
    check();
    window.addEventListener('resize', check);
  });

  /* ---------- Bewertungen: Kartenstapel ---------- */
  document.querySelectorAll('[data-review-deck]').forEach((deck) => {
    const cards = Array.from(deck.querySelectorAll('[data-deck-card]'));
    const counter = deck.querySelector('[data-deck-current]');
    if (cards.length < 2) return;
    let order = cards.map((_, index) => index);

    const render = () => {
      order.forEach((cardIndex, position) => {
        const card = cards[cardIndex];
        card.style.setProperty('--pos', String(position));
        card.classList.toggle('is-top', position === 0);
        if (position === 0) card.removeAttribute('aria-hidden');
        else card.setAttribute('aria-hidden', 'true');
      });
      if (counter) counter.textContent = String(order[0] + 1);
    };

    const next = () => {
      const top = cards[order[0]];
      if (!reduceMotion) {
        top.classList.add('is-leaving');
        setTimeout(() => top.classList.remove('is-leaving'), 450);
      }
      order = [...order.slice(1), order[0]];
      render();
    };
    const prev = () => {
      order = [order[order.length - 1], ...order.slice(0, -1)];
      render();
    };

    deck.querySelector('[data-next]')?.addEventListener('click', next);
    deck.querySelector('[data-prev]')?.addEventListener('click', prev);
    deck.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    });
    addSwipe(deck, next, prev);
    render();
  });

  /* ---------- Referenzen: Tabs ---------- */
  document.querySelectorAll('[data-ref-tabs]').forEach((wrapper) => {
    const tabs = Array.from(wrapper.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !active;
          panels[i].classList.toggle('is-active', active);
        }
      });
      if (focus) tabs[index].focus();
      if (window.innerWidth < 900) {
        tabs[index].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index, false));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        if (event.key in keys) {
          event.preventDefault();
          select((index + keys[event.key] + tabs.length) % tabs.length, true);
        }
        if (event.key === 'Home') { event.preventDefault(); select(0, true); }
        if (event.key === 'End') { event.preventDefault(); select(tabs.length - 1, true); }
      });
    });
  });

  /* ---------- Referenzen: weitere einblenden ---------- */
  document.querySelectorAll('[data-ref-more]').forEach((wrapper) => {
    const toggle = wrapper.querySelector('[data-more-toggle]');
    const extra = Array.from(wrapper.querySelectorAll('[data-more-item]'));
    if (!toggle || !extra.length) return;
    toggle.addEventListener('click', () => {
      const expand = toggle.getAttribute('aria-expanded') !== 'true';
      extra.forEach((item) => {
        item.hidden = !expand;
        if (expand) {
          item.querySelectorAll('.home-reveal').forEach((el) => {
            el.classList.remove('is-visible');
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
          });
        }
      });
      toggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
      toggle.textContent = expand ? toggle.dataset.labelLess : toggle.dataset.labelMore;
      if (!expand) wrapper.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      onScroll();
    });
  });
})();
