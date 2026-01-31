// ==========================================
// CineVerso AI - Carousel Component
// ==========================================

import { createCard, createCardSkeleton } from './card.js';

export function createCarousel(title, items = [], options = {}) {
    const { id, showSeeAll = true, seeAllLink = '#', isTop10 = false } = options;
    const carouselId = id || `carousel-${Math.random().toString(36).substr(2, 9)}`;

    if (!items.length) {
        return `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">${title}</h2>
                </div>
                <div class="carousel">
                    <div class="carousel-track">
                        ${Array(6).fill(0).map(() => createCardSkeleton()).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    const cards = items.map((item, i) =>
        createCard(item, { showRank: isTop10, rank: i + 1 })
    ).join('');

    return `
        <section class="section" id="${carouselId}">
            <div class="section-header">
                <h2 class="section-title">${title}</h2>
                ${showSeeAll ? `<a href="${seeAllLink}" class="section-link" data-link>Ver Todo →</a>` : ''}
            </div>
            <div class="carousel">
                <button class="carousel-btn prev" aria-label="Anterior" data-carousel="${carouselId}">◀</button>
                <div class="carousel-track" id="${carouselId}-track">
                    ${cards}
                </div>
                <button class="carousel-btn next" aria-label="Siguiente" data-carousel="${carouselId}">▶</button>
            </div>
        </section>
    `;
}

export function initCarousels() {
    document.querySelectorAll('.carousel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carouselId = btn.dataset.carousel;
            const track = document.getElementById(`${carouselId}-track`);
            if (!track) return;

            const scrollAmount = track.clientWidth * 0.8;
            const direction = btn.classList.contains('next') ? 1 : -1;
            track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
        });
    });

    // Touch swipe support
    document.querySelectorAll('.carousel-track').forEach(track => {
        let startX, scrollLeft;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        track.addEventListener('touchmove', (e) => {
            if (!startX) return;
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = (x - startX) * 2;
            track.scrollLeft = scrollLeft - walk;
        });

        track.addEventListener('touchend', () => {
            startX = null;
        });
    });
}

export default { createCarousel, initCarousels };
