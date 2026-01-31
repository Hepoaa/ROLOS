// ==========================================
// CineVerso AI - Hero Component
// ==========================================

import { getImageUrl } from '../api/tmdb.js';
import { truncate, formatRating, getYear } from '../utils/helpers.js';
import { CONFIG, State } from '../config.js';

export function createHero(items = []) {
    if (!items.length) return '<div class="hero skeleton"></div>';

    const item = items[0];
    const backdrop = getImageUrl(item.backdrop_path, 'backdrop');
    const title = item.title || item.name;
    const year = getYear(item.release_date || item.first_air_date);
    const rating = formatRating(item.vote_average);
    const type = item.media_type === 'tv' ? 'serie' : 'pelicula';

    return `
        <section class="hero" id="hero">
            <img class="hero-backdrop" src="${backdrop}" alt="${title}" loading="eager">
            <div class="hero-gradient"></div>
            <div class="hero-content animate-fadeInUp">
                <div class="hero-badge">
                    <span>✨</span>
                    <span>Match IA ${Math.floor(70 + Math.random() * 28)}%</span>
                </div>
                <h1 class="hero-title">${title}</h1>
                <div class="hero-meta">
                    <span class="hero-meta-item">
                        <span class="badge badge-rating">⭐ ${rating}</span>
                    </span>
                    <span class="hero-meta-item">${year}</span>
                    <span class="hero-meta-item">${item.media_type === 'tv' ? 'Serie' : 'Película'}</span>
                </div>
                <p class="hero-synopsis text-clamp-3">${truncate(item.overview, 200)}</p>
                <div class="hero-actions">
                    <button class="btn btn-primary btn-lg" onclick="window.router.navigate('/${type}/${item.id}')">
                        ▶ Reproducir
                    </button>
                    <button class="btn btn-secondary btn-lg" onclick="window.router.navigate('/${type}/${item.id}')">
                        ℹ Más Info
                    </button>
                </div>
            </div>
            <div class="hero-nav">
                <button class="hero-nav-btn" id="hero-prev" aria-label="Anterior">◀</button>
                <button class="hero-nav-btn" id="hero-next" aria-label="Siguiente">▶</button>
            </div>
            <div class="hero-dots" id="hero-dots">
                ${items.slice(0, 8).map((_, i) => `
                    <button class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ir a ${i + 1}"></button>
                `).join('')}
            </div>
        </section>
    `;
}

export function initHero(items) {
    if (!items?.length) return;

    State.heroItems = items.slice(0, 8);
    State.heroIndex = 0;

    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');
    const dots = document.getElementById('hero-dots');

    prevBtn?.addEventListener('click', () => navigateHero(-1));
    nextBtn?.addEventListener('click', () => navigateHero(1));

    dots?.addEventListener('click', (e) => {
        const dot = e.target.closest('.hero-dot');
        if (dot) {
            State.heroIndex = parseInt(dot.dataset.index);
            updateHero();
        }
    });

    startHeroRotation();
}

function navigateHero(direction) {
    State.heroIndex = (State.heroIndex + direction + State.heroItems.length) % State.heroItems.length;
    updateHero();
    resetHeroRotation();
}

function updateHero() {
    const item = State.heroItems[State.heroIndex];
    if (!item) return;

    const hero = document.getElementById('hero');
    const backdrop = hero?.querySelector('.hero-backdrop');
    const title = hero?.querySelector('.hero-title');
    const synopsis = hero?.querySelector('.hero-synopsis');
    const meta = hero?.querySelector('.hero-meta');
    const badge = hero?.querySelector('.hero-badge span:last-child');
    const dots = document.querySelectorAll('.hero-dot');

    const newBackdrop = getImageUrl(item.backdrop_path, 'backdrop');
    const itemTitle = item.title || item.name;
    const year = getYear(item.release_date || item.first_air_date);
    const rating = formatRating(item.vote_average);
    const type = item.media_type === 'tv' ? 'serie' : 'pelicula';

    if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => {
            backdrop.src = newBackdrop;
            backdrop.style.opacity = '1';
        }, 300);
    }

    if (title) title.textContent = itemTitle;
    if (synopsis) synopsis.textContent = truncate(item.overview, 200);
    if (badge) badge.textContent = `Match IA ${Math.floor(70 + Math.random() * 28)}%`;

    if (meta) {
        meta.innerHTML = `
            <span class="hero-meta-item"><span class="badge badge-rating">⭐ ${rating}</span></span>
            <span class="hero-meta-item">${year}</span>
            <span class="hero-meta-item">${item.media_type === 'tv' ? 'Serie' : 'Película'}</span>
        `;
    }

    dots.forEach((dot, i) => dot.classList.toggle('active', i === State.heroIndex));

    // Update action buttons
    const actions = hero?.querySelector('.hero-actions');
    if (actions) {
        actions.innerHTML = `
            <button class="btn btn-primary btn-lg" onclick="window.router.navigate('/${type}/${item.id}')">
                ▶ Reproducir
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.router.navigate('/${type}/${item.id}')">
                ℹ Más Info
            </button>
        `;
    }
}

function startHeroRotation() {
    State.heroInterval = setInterval(() => {
        navigateHero(1);
    }, CONFIG.APP.HERO_ROTATION_INTERVAL);
}

function resetHeroRotation() {
    clearInterval(State.heroInterval);
    startHeroRotation();
}

export function stopHeroRotation() {
    clearInterval(State.heroInterval);
}

export default { createHero, initHero, stopHeroRotation };
