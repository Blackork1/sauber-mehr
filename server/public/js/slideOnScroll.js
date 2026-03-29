document.addEventListener('DOMContentLoaded', () => {
  const showThreshold = window.innerWidth < 1200 ? 0.1 : 0.7;

  const setupOneTimeReveal = (selector, options = {}) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    const alwaysVisibleMatcher = options.alwaysVisibleMatcher || '';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (entry.intersectionRatio < showThreshold) return;

        // Nur einmal einblenden, danach nie wieder ausblenden.
        el.classList.add('visible');
        el.classList.remove('out');
        observer.unobserve(el);
      });
    }, {
      threshold: [0, showThreshold, 1]
    });

    elements.forEach((el) => {
      // Slider-Thumbnails liegen teils außerhalb des Viewports.
      // Diese sollen direkt sichtbar sein.
      if (alwaysVisibleMatcher && el.matches(alwaysVisibleMatcher)) {
        el.classList.add('visible');
        el.classList.remove('out');
        return;
      }
      observer.observe(el);
    });
  };

  setupOneTimeReveal('.animate-on-scroll', {
    alwaysVisibleMatcher:
      '.image-slider--bereiche [data-image-thumbnails], .image-slider--start-fullscreen [data-image-thumbnails]'
  });
  setupOneTimeReveal('.animate-on-scroll-left');
  setupOneTimeReveal('.animate-on-scroll-right');
});
