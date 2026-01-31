import { CONFIG, State } from './config.js';
import { fetchTMDB } from './api.js';

// ==================== DOM HELPERS ====================
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') toast.style.borderColor = 'var(--error)';
    if (type === 'success') toast.style.borderColor = 'var(--success)';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== HERO ====================
export async function loadHero() {
    const data = await fetchTMDB('/trending/all/day');
    if (!data?.results) {
        showToast('Error cargando contenido', 'error');
        return;
    }

    State.heroItems = data.results.filter(item => item.backdrop_path).slice(0, 5);
    renderHero();

    // Auto-rotate every 8 seconds
    State.heroInterval = setInterval(() => {
        State.heroIndex = (State.heroIndex + 1) % State.heroItems.length;
        renderHero();
    }, 8000);
}

function renderHero() {
    const item = State.heroItems[State.heroIndex];
    if (!item) return;

    const backdrop = $('#heroBackdrop');
    const content = $('#heroContent');

    // Update backdrop
    const img = document.createElement('img');
    img.src = `${CONFIG.IMG_BASE}original${item.backdrop_path}`;
    img.alt = item.title || item.name;

    img.onload = () => {
        // Remove old images
        backdrop.querySelectorAll('img').forEach(old => old.classList.remove('active'));
        backdrop.appendChild(img);
        requestAnimationFrame(() => img.classList.add('active'));

        // Cleanup old images after transition
        setTimeout(() => {
            backdrop.querySelectorAll('img:not(.active)').forEach(old => old.remove());
        }, 1500);
    };

    // Update content
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const type = item.media_type === 'tv' ? 'Serie' : 'Película';
    const match = Math.round(item.vote_average * 10);
    const genres = item.genre_ids?.slice(0, 3).map(id => State.genres[id]).filter(Boolean).join(' • ') || '';

    content.innerHTML = `
        <div class="hero-badge">
            <span>TOP 10</span>
            <span style="background: transparent;">${type}</span>
        </div>
        <h1 class="hero-title">${title}</h1>
        <div class="hero-meta">
            <span class="hero-match">${match}% Match</span>
            <span>${year}</span>
            <span>${genres}</span>
        </div>
        <p class="hero-description">${item.overview || 'Sin descripción disponible.'}</p>
        <div class="hero-actions">
            <button class="btn btn-primary">
                <i class="fas fa-play"></i> Reproducir
            </button>
            <button class="btn btn-secondary" data-action="detail" data-id="${item.id}" data-type="${item.media_type}">
                <i class="fas fa-info-circle"></i> Más Info
            </button>
        </div>
    `;
}

// ==================== CONTENT ROWS ====================
export function loadRows() {
    const categories = [
        { title: 'Tendencias', endpoint: '/trending/all/week' },
        { title: 'Películas Populares', endpoint: '/movie/popular' },
        { title: 'Series Top', endpoint: '/tv/top_rated' },
        { title: 'Acción', endpoint: '/discover/movie?with_genres=28' },
        { title: 'Ciencia Ficción', endpoint: '/discover/movie?with_genres=878' },
        { title: 'Anime', endpoint: '/discover/tv?with_genres=16&with_origin_country=JP' },
        { title: 'Terror', endpoint: '/discover/movie?with_genres=27' },
        { title: 'Comedia', endpoint: '/discover/movie?with_genres=35' }
    ];

    const container = $('#contentRows');
    container.innerHTML = '';

    categories.forEach(cat => {
        const section = document.createElement('section');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${cat.title}</h2>
            </div>
            <div class="row-scroll" data-endpoint="${cat.endpoint}">
                <div class="loader"></div>
            </div>
        `;
        container.appendChild(section);

        // Load row data
        loadRowContent(section.querySelector('.row-scroll'));
    });
}

async function loadRowContent(row) {
    const endpoint = row.dataset.endpoint;
    const data = await fetchTMDB(endpoint);

    if (!data?.results) {
        row.innerHTML = '<p style="color: var(--text-muted);">Error al cargar</p>';
        return;
    }

    row.innerHTML = data.results
        .filter(item => item.poster_path)
        .map(item => `
            <div class="card" data-action="detail" data-id="${item.id}" data-type="${item.media_type || (item.title ? 'movie' : 'tv')}">
                <img class="card-poster" src="${CONFIG.IMG_BASE}w342${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
            </div>
        `).join('');
}

// ==================== DETAIL MODAL ====================
export async function openDetail(id, type) {
    const modal = $('#detailModal');
    const content = $('#detailContent');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.innerHTML = '<div style="display: flex; justify-content: center; padding: 100px;"><div class="loader"></div></div>';

    const [details, credits, similar] = await Promise.all([
        fetchTMDB(`/${type}/${id}`),
        fetchTMDB(`/${type}/${id}/credits`),
        fetchTMDB(`/${type}/${id}/similar`)
    ]);

    if (!details) {
        content.innerHTML = '<p style="text-align: center; padding: 50px;">Error al cargar detalles</p>';
        return;
    }

    const backdrop = details.backdrop_path ? `${CONFIG.IMG_BASE}original${details.backdrop_path}` : '';
    const title = details.title || details.name;
    const year = (details.release_date || details.first_air_date || '').split('-')[0];
    const rating = Math.round(details.vote_average * 10);
    const cast = credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
    const genres = details.genres?.map(g => g.name).join(', ') || '';

    content.innerHTML = `
        <div class="detail-hero">
            ${backdrop ? `<img class="detail-backdrop" src="${backdrop}" alt="">` : ''}
            <div class="detail-gradient"></div>
            <button class="detail-close" data-action="close-detail">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            <div class="detail-meta">
                <span style="color: var(--success); font-weight: 600;">${rating}% Match</span>
                <span>${year}</span>
                <span>${details.runtime || details.episode_run_time?.[0] || '?'} min</span>
            </div>
            <p class="detail-description">${details.overview || 'Sin descripción.'}</p>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
                <strong>Géneros:</strong> ${genres}<br>
                <strong>Elenco:</strong> ${cast}
            </p>
            
            ${similar?.results?.length ? `
                <h3 style="margin-top: var(--spacing-xl); margin-bottom: var(--spacing-md);">Similares</h3>
                <div class="row-scroll">
                    ${similar.results.slice(0, 6).filter(i => i.poster_path).map(item => `
                        <div class="card" data-action="detail" data-id="${item.id}" data-type="${type}">
                            <img class="card-poster" src="${CONFIG.IMG_BASE}w342${item.poster_path}" alt="">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

export function closeDetail() {
    $('#detailModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== SEARCH ====================
export function openSearch() {
    $('#searchModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    $('#searchInput').focus();
}

export function closeSearch() {
    $('#searchModal').classList.remove('active');
    document.body.style.overflow = '';
    $('#searchInput').value = '';
    $('#searchResults').innerHTML = '';
}

export async function performSearch(query) {
    if (query.length < 2) {
        $('#searchResults').innerHTML = '';
        return;
    }

    const data = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}`);

    if (!data?.results) {
        $('#searchResults').innerHTML = '<p style="color: var(--text-muted);">No se encontraron resultados</p>';
        return;
    }

    $('#searchResults').innerHTML = data.results
        .filter(item => item.poster_path || item.profile_path)
        .slice(0, 12)
        .map(item => {
            const img = item.poster_path || item.profile_path;
            return `
                <div class="card" data-action="detail" data-id="${item.id}" data-type="${item.media_type}">
                    <img class="card-poster" src="${CONFIG.IMG_BASE}w342${img}" alt="${item.title || item.name}" loading="lazy">
                </div>
            `;
        }).join('');
}
