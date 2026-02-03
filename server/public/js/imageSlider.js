function initImageSliders() {
    const sliders = document.querySelectorAll('[data-component="image-slider"]');
    if (!sliders.length) return;

    sliders.forEach((slider) => {
        const list = slider.querySelector('[data-image-list]');
        const thumbnails = slider.querySelector('[data-image-thumbnails]');
        const prevButton = slider.querySelector('[data-image-prev]');
        const nextButton = slider.querySelector('[data-image-next]');
        const cta = slider.querySelector('[data-image-cta]');

        if (!list || !nextButton) return;

        const timeRunning = 600;
        let runTimeout;

        const updateCta = () => {
            if (!cta) return;
            const firstSlide = list.querySelector('.image-slider__item');
            const href = firstSlide?.dataset?.link || '#';
            cta.setAttribute('href', href);
        };

        const updateThumbnails = () => {
            if (!thumbnails) return;
            const itemThumbs = thumbnails.querySelectorAll('.image-slider__thumb');
            itemThumbs.forEach((thumb, index) => {
                thumb.classList.toggle('is-hidden', index === 0);
            });
        };

        const showSlider = (direction) => {
            const itemSlider = list.querySelectorAll('.image-slider__item');
            const itemThumbs = thumbnails ? thumbnails.querySelectorAll('.image-slider__thumb') : [];
            if (!itemSlider.length) return;

            if (direction === 'next') {
                list.appendChild(itemSlider[0]);
                if (thumbnails && itemThumbs[0]) {
                    thumbnails.appendChild(itemThumbs[0]);
                }
                slider.classList.add('is-next');
            } else {
                const lastIndex = itemSlider.length - 1;
                list.prepend(itemSlider[lastIndex]);
                if (thumbnails && itemThumbs[lastIndex]) {
                    thumbnails.prepend(itemThumbs[lastIndex]);
                }
                slider.classList.add('is-prev');
            }

            clearTimeout(runTimeout);
            runTimeout = setTimeout(() => {
                slider.classList.remove('is-next');
                slider.classList.remove('is-prev');
            }, timeRunning);

            updateCta();
            updateThumbnails();
        };

        if (prevButton) {
            prevButton.addEventListener('click', () => showSlider('prev'));
        }
        nextButton.addEventListener('click', () => showSlider('next'));

        updateCta();
        updateThumbnails();
    });
}

initImageSliders();