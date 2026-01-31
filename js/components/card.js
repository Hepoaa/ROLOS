// ==========================================
// CineVerso AI - Card Component
// ==========================================

import { getImageUrl } from '../api/tmdb.js';
import { formatRating, getYear, truncate } from '../utils/helpers.js';
import { isFavorite, isInWatchlist, addFavorite, removeFavorite, addToWatchlist, removeFromWatchlist } from '../utils/storage.js';

export function createCard(item, options = {}) {
    if (!item) return '';

    const { showRank, rank, expanded = false } = options;
    const poster = getImageUrl(item.poster_path, 'poster');
    const title = item.title || item.name;
    const year = getYear(item.release_date || item.first_air_date);
    const rating = formatRating(item.vote_average);
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const route = type === 'tv' ? 'serie' : 'pelicula';
    const isFav = isFavorite(item.id, type);
    const inWatchlist = isInWatchlist(item.id, type);

    if (showRank) {
        return `
            <div class="card card-ranked" data-id="${item.id}" data-type="${type}">
                <span class="badge-top10">${rank}</span>
                <img class="card-poster" src="${poster}" alt="${title}" loading="lazy" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 2 3%22><rect fill=%22%23181818%22 width=%222%22 height=%223%22/><text x=%221%22 y=%221.8%22 font-size=%220.4%22 fill=%22%23666%22 text-anchor=%22middle%22>🎬</text></svg>'">
                <div class="card-overlay"></div>
                <div class="card-content">
                    <h3 class="card-title">${title}</h3>
                    <div class="card-meta">
                        <span>⭐ ${rating}</span>
                        <span>${year}</span>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="card" data-id="${item.id}" data-type="${type}" onclick="window.router.navigate('/${route}/${item.id}')">
            <img class="card-poster" src="${poster}" alt="${title}" loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 2 3%22><rect fill=%22%23181818%22 width=%222%22 height=%223%22/><text x=%221%22 y=%221.8%22 font-size=%220.4%22 fill=%22%23666%22 text-anchor=%22middle%22>🎬</text></svg>'">
            <div class="card-overlay"></div>
            <div class="card-content">
                <h3 class="card-title text-truncate">${title}</h3>
                <div class="card-meta">
                    <span>⭐ ${rating}</span>
                    <span>${year}</span>
                </div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="card-action-btn ${isFav ? 'active' : ''}" 
                            onclick="window.toggleFavorite(${item.id}, '${type}', this)" 
                            title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                    <button class="card-action-btn ${inWatchlist ? 'active' : ''}" 
                            onclick="window.toggleWatchlist(${item.id}, '${type}', this)" 
                            title="${inWatchlist ? 'Quitar de mi lista' : 'Agregar a mi lista'}">
                        ${inWatchlist ? '✓' : '+'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function createCardSkeleton() {
    return `
        <div class="card">
            <div class="card-poster skeleton" style="aspect-ratio: 2/3;"></div>
        </div>
    `;
}

// Global functions for card actions
window.toggleFavorite = (id, type, btn) => {
    const card = btn.closest('.card');
    const title = card?.querySelector('.card-title')?.textContent || 'Sin título';
    const posterImg = card?.querySelector('.card-poster');

    // Extract poster_path from TMDB URL: https://image.tmdb.org/t/p/w500/abc123.jpg -> /abc123.jpg
    let poster_path = null;
    if (posterImg?.src && posterImg.src.includes('image.tmdb.org')) {
        const match = posterImg.src.match(/\/t\/p\/w\d+(\/.+\.\w+)$/);
        if (match) poster_path = match[1];
    }

    if (isFavorite(id, type)) {
        removeFavorite(id, type);
        btn.classList.remove('active');
        btn.innerHTML = '🤍';
    } else {
        addFavorite({ id, type, title, poster_path });
        btn.classList.add('active');
        btn.innerHTML = '❤️';
    }
};

window.toggleWatchlist = (id, type, btn) => {
    const card = btn.closest('.card');
    const title = card?.querySelector('.card-title')?.textContent || 'Sin título';
    const posterImg = card?.querySelector('.card-poster');

    // Extract poster_path from TMDB URL
    let poster_path = null;
    if (posterImg?.src && posterImg.src.includes('image.tmdb.org')) {
        const match = posterImg.src.match(/\/t\/p\/w\d+(\/.+\.\w+)$/);
        if (match) poster_path = match[1];
    }

    if (isInWatchlist(id, type)) {
        removeFromWatchlist(id, type);
        btn.classList.remove('active');
        btn.innerHTML = '+';
    } else {
        addToWatchlist({ id, type, title, poster_path });
        btn.classList.add('active');
        btn.innerHTML = '✓';
    }
};

export default { createCard, createCardSkeleton };

