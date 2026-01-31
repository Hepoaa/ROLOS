// ==========================================
// CineVerso AI - Detail Page
// ==========================================

import { getMovieDetails, getTVDetails, getImageUrl } from '../api/tmdb.js';
import { formatRating, formatRuntime, getYear, formatCurrency, truncate } from '../utils/helpers.js';
import { isFavorite, isInWatchlist, addFavorite, removeFavorite, addToWatchlist, removeFromWatchlist, addToHistory } from '../utils/storage.js';
import { createCarousel, initCarousels } from '../components/carousel.js';
import { openVideoModal } from '../components/modal.js';
import { renderEpisodeGrid } from '../components/episodeGrid.js';
import { CONFIG } from '../config.js';

export async function renderDetailPage(type, id) {
    const main = document.getElementById('main');
    const isMovie = type === 'movie' || type === 'pelicula';

    main.innerHTML = `
        <div class="page">
            <div class="detail-hero skeleton" style="height: 70vh;"></div>
            <div class="detail-section">
                <div class="skeleton" style="height: 200px;"></div>
            </div>
        </div>
    `;

    try {
        const data = isMovie ? await getMovieDetails(id) : await getTVDetails(id);

        // Add to history
        addToHistory({
            id: data.id,
            type: isMovie ? 'movie' : 'tv',
            title: data.title || data.name,
            poster_path: data.poster_path
        });

        // Set page context for chat
        window.currentPageContext = `El usuario está viendo "${data.title || data.name}" (${isMovie ? 'película' : 'serie'})`;

        const backdrop = getImageUrl(data.backdrop_path, 'backdrop');
        const poster = getImageUrl(data.poster_path, 'posterLarge');
        const title = data.title || data.name;
        const originalTitle = data.original_title || data.original_name;
        const year = getYear(data.release_date || data.first_air_date);
        const rating = formatRating(data.vote_average);
        const runtime = isMovie ? formatRuntime(data.runtime) : `${data.number_of_seasons} temporada${data.number_of_seasons > 1 ? 's' : ''}`;
        const genres = data.genres?.map(g => g.name).join(', ') || '';
        const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const cast = data.credits?.cast?.slice(0, 10) || [];
        const crew = data.credits?.crew || [];
        const director = crew.find(c => c.job === 'Director');
        const similar = data.similar?.results || [];
        const recommendations = data.recommendations?.results || [];
        const isFav = isFavorite(data.id, isMovie ? 'movie' : 'tv');
        const inList = isInWatchlist(data.id, isMovie ? 'movie' : 'tv');
        const itemType = isMovie ? 'movie' : 'tv';

        main.innerHTML = `
            <div class="page" id="detail-page">
                <section class="detail-hero">
                    <img class="detail-backdrop" src="${backdrop}" alt="${title}">
                    <div class="detail-gradient"></div>
                    <div class="detail-content">
                        <img class="detail-poster animate-fadeInUp" src="${poster}" alt="${title}">
                        <div class="detail-info animate-fadeInUp stagger-2">
                            <h1 class="detail-title">${title}</h1>
                            ${originalTitle !== title ? `<p class="detail-original-title">${originalTitle}</p>` : ''}
                            <div class="detail-meta">
                                <span class="badge badge-rating">⭐ ${rating}</span>
                                <span>${year}</span>
                                <span>${runtime}</span>
                                <span>${genres}</span>
                            </div>
                            <div class="detail-genres">
                                ${data.genres?.map(g => `<span class="tag">${g.name}</span>`).join('') || ''}
                            </div>
                            <p class="detail-synopsis">${data.overview || 'Sin sinopsis disponible.'}</p>
                            <div class="detail-actions">
                                ${trailer ? `<button class="btn btn-primary btn-lg" id="play-trailer">▶ Ver Trailer</button>` : ''}
                                <button class="btn ${isFav ? 'btn-accent' : 'btn-secondary'}" id="fav-btn" data-id="${data.id}" data-type="${itemType}">
                                    ${isFav ? '❤️ En Favoritos' : '🤍 Favorito'}
                                </button>
                                <button class="btn ${inList ? 'btn-accent' : 'btn-secondary'}" id="list-btn" data-id="${data.id}" data-type="${itemType}">
                                    ${inList ? '✓ En Mi Lista' : '+ Mi Lista'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                ${cast.length ? `
                <section class="detail-section">
                    <h2 class="detail-section-title">Reparto</h2>
                    <div class="cast-grid">
                        ${cast.map(person => `
                            <div class="cast-card">
                                <img class="cast-photo" 
                                     src="${person.profile_path ? getImageUrl(person.profile_path, 'profile') : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23333%22 width=%221%22 height=%221%22/><text x=%220.5%22 y=%220.6%22 font-size=%220.4%22 fill=%22%23666%22 text-anchor=%22middle%22>👤</text></svg>'}" 
                                     alt="${person.name}"
                                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23333%22 width=%221%22 height=%221%22/></svg>'">
                                <p class="cast-name">${person.name}</p>
                                <p class="cast-character">${person.character}</p>
                            </div>
                        `).join('')}
                    </div>
                </section>
                ` : ''}

                ${director ? `
                <section class="detail-section">
                    <h2 class="detail-section-title">Equipo Técnico</h2>
                    <p><strong>Director:</strong> ${director.name}</p>
                    ${isMovie && data.budget ? `<p><strong>Presupuesto:</strong> ${formatCurrency(data.budget)}</p>` : ''}
                    ${isMovie && data.revenue ? `<p><strong>Recaudación:</strong> ${formatCurrency(data.revenue)}</p>` : ''}
                </section>
                ` : ''}

                ${!isMovie && data.number_of_seasons ? `
                <div id="episode-grid-container"></div>
                ` : ''}

                ${similar.length ? `
                <div id="similar-carousel"></div>
                ` : ''}

                ${recommendations.length ? `
                <div id="recommendations-carousel"></div>
                ` : ''}
            </div>
        `;

        // Event handlers
        document.getElementById('play-trailer')?.addEventListener('click', () => {
            if (trailer) openVideoModal(trailer.key, `${title} - Trailer`);
        });

        document.getElementById('fav-btn')?.addEventListener('click', function () {
            const id = parseInt(this.dataset.id);
            const type = this.dataset.type;
            if (isFavorite(id, type)) {
                removeFavorite(id, type);
                this.className = 'btn btn-secondary';
                this.innerHTML = '🤍 Favorito';
            } else {
                addFavorite({ id, type, title: data.title || data.name, poster_path: data.poster_path });
                this.className = 'btn btn-accent';
                this.innerHTML = '❤️ En Favoritos';
            }
        });

        document.getElementById('list-btn')?.addEventListener('click', function () {
            const id = parseInt(this.dataset.id);
            const type = this.dataset.type;
            if (isInWatchlist(id, type)) {
                removeFromWatchlist(id, type);
                this.className = 'btn btn-secondary';
                this.innerHTML = '+ Mi Lista';
            } else {
                addToWatchlist({ id, type, title: data.title || data.name, poster_path: data.poster_path });
                this.className = 'btn btn-accent';
                this.innerHTML = '✓ En Mi Lista';
            }
        });

        // Render carousels
        if (similar.length) {
            document.getElementById('similar-carousel').innerHTML = createCarousel('Títulos Similares', similar.map(s => ({ ...s, media_type: itemType })), { id: 'similar' });
        }
        if (recommendations.length) {
            document.getElementById('recommendations-carousel').innerHTML = createCarousel('Te Puede Gustar', recommendations.map(r => ({ ...r, media_type: itemType })), { id: 'recs' });
        }
        initCarousels();

        // Render episode rating grid for TV shows
        if (!isMovie && data.number_of_seasons) {
            renderEpisodeGrid(data.id, data.number_of_seasons, 'episode-grid-container');
        }

    } catch (error) {
        console.error('Detail page error:', error);
        main.innerHTML = `
            <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;text-align:center;padding:var(--space-8);">
                <p style="font-size:var(--text-xl);margin-bottom:var(--space-4);">😕 No se encontró el contenido</p>
                <button class="btn btn-accent" onclick="history.back()">Volver</button>
            </div>
        `;
    }
}

export default { renderDetailPage };
