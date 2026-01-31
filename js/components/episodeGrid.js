// ==========================================
// CineVerso AI - Episode Rating Grid Component
// ==========================================

import { getAllSeasonsWithEpisodes, getImageUrl } from '../api/tmdb.js';

/**
 * Get color class based on rating
 */
function getRatingColor(rating) {
    if (rating >= 8.5) return 'awesome';    // Verde brillante
    if (rating >= 7.5) return 'great';      // Verde claro
    if (rating >= 6.5) return 'good';       // Amarillo
    if (rating >= 5.5) return 'regular';    // Naranja
    if (rating >= 4.5) return 'bad';        // Rojo
    return 'garbage';                        // Rojo oscuro
}

/**
 * Get color hex for inline styling
 */
function getRatingColorHex(rating) {
    if (rating >= 8.5) return '#22c55e';    // Verde brillante
    if (rating >= 7.5) return '#84cc16';    // Verde lima
    if (rating >= 6.5) return '#eab308';    // Amarillo
    if (rating >= 5.5) return '#f97316';    // Naranja
    if (rating >= 4.5) return '#ef4444';    // Rojo
    return '#991b1b';                        // Rojo oscuro
}

/**
 * Create skeleton loading state
 */
function createGridSkeleton() {
    return `
        <div class="episode-grid-container">
            <div class="episode-grid-header">
                <h2 class="episode-grid-title">📊 Calificaciones por Episodio</h2>
            </div>
            <div class="episode-grid-loading">
                <div class="loading-spinner"></div>
                <p>Cargando datos de temporadas...</p>
            </div>
        </div>
    `;
}

/**
 * Create the legend for rating colors
 */
function createLegend() {
    return `
        <div class="episode-grid-legend">
            <span class="legend-item">
                <span class="legend-color awesome"></span>
                Excelente (8.5+)
            </span>
            <span class="legend-item">
                <span class="legend-color great"></span>
                Genial (7.5-8.4)
            </span>
            <span class="legend-item">
                <span class="legend-color good"></span>
                Bueno (6.5-7.4)
            </span>
            <span class="legend-item">
                <span class="legend-color regular"></span>
                Regular (5.5-6.4)
            </span>
            <span class="legend-item">
                <span class="legend-color bad"></span>
                Malo (4.5-5.4)
            </span>
            <span class="legend-item">
                <span class="legend-color garbage"></span>
                Pésimo (<4.5)
            </span>
        </div>
    `;
}

/**
 * Render the episode rating grid
 */
export async function renderEpisodeGrid(tvId, numberOfSeasons, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading state
    container.innerHTML = createGridSkeleton();

    try {
        // Fetch all seasons data
        const seasons = await getAllSeasonsWithEpisodes(tvId, numberOfSeasons);

        if (!seasons || seasons.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Find max episodes across all seasons
        const maxEpisodes = Math.max(...seasons.map(s => s.episodes?.length || 0));

        if (maxEpisodes === 0) {
            container.innerHTML = '';
            return;
        }

        // Build the grid HTML
        const gridColumns = seasons.length + 1; // +1 for row headers
        let gridHTML = `
            <div class="episode-grid-container">
                <div class="episode-grid-header">
                    <h2 class="episode-grid-title">📊 Calificaciones por Episodio</h2>
                    <div class="episode-grid-controls">
                        <label class="grid-toggle">
                            <input type="checkbox" id="grid-inverted-${tvId}">
                            <span>Invertir</span>
                        </label>
                    </div>
                </div>
                ${createLegend()}
                <div class="episode-grid-wrapper">
                    <div class="episode-grid" id="episode-grid-${tvId}" style="grid-template-columns: 50px repeat(${seasons.length}, minmax(40px, 60px));">
                        <!-- Header row with season numbers -->
                        <div class="grid-header-cell"></div>
                        ${seasons.map((s, i) => `
                            <div class="grid-header-cell season-header">T${i + 1}</div>
                        `).join('')}
        `;

        // Create rows for each episode number
        for (let ep = 0; ep < maxEpisodes; ep++) {
            gridHTML += `<div class="grid-row-header">E${ep + 1}</div>`;

            for (let seasonIdx = 0; seasonIdx < seasons.length; seasonIdx++) {
                const season = seasons[seasonIdx];
                const episode = season.episodes?.[ep];

                if (episode) {
                    const rating = episode.vote_average?.toFixed(1) || '—';
                    const ratingNum = episode.vote_average || 0;
                    const colorClass = getRatingColor(ratingNum);
                    const colorHex = getRatingColorHex(ratingNum);
                    const episodeName = episode.name || `Episodio ${ep + 1}`;

                    gridHTML += `
                        <div class="episode-cell ${colorClass}" 
                             data-tv-id="${tvId}"
                             data-season="${seasonIdx + 1}"
                             data-episode="${ep + 1}"
                             data-episode-name="${episodeName.replace(/"/g, '&quot;')}"
                             data-rating="${rating}"
                             data-overview="${(episode.overview || '').replace(/"/g, '&quot;').substring(0, 200)}"
                             data-still="${episode.still_path || ''}"
                             title="${episodeName} - ⭐ ${rating}"
                             style="background-color: ${colorHex}">
                            <span class="cell-rating">${rating !== '—' ? rating : '?'}</span>
                        </div>
                    `;
                } else {
                    gridHTML += `<div class="episode-cell empty"></div>`;
                }
            }
        }

        gridHTML += `
                    </div>
                </div>
                <p class="episode-grid-hint">💡 Haz clic en cualquier episodio para ver más detalles</p>
            </div>
        `;

        container.innerHTML = gridHTML;

        // Add event listeners
        initGridEvents(tvId);

    } catch (error) {
        console.error('Error loading episode grid:', error);
        container.innerHTML = `
            <div class="episode-grid-container">
                <div class="episode-grid-error">
                    <p>⚠️ No se pudieron cargar los datos de episodios</p>
                </div>
            </div>
        `;
    }
}

/**
 * Initialize grid event listeners
 */
function initGridEvents(tvId) {
    // Cell click handlers
    const cells = document.querySelectorAll(`#episode-grid-${tvId} .episode-cell:not(.empty)`);
    cells.forEach(cell => {
        cell.addEventListener('click', function () {
            const data = this.dataset;
            showEpisodeDetails({
                tvId: data.tvId,
                season: data.season,
                episode: data.episode,
                name: data.episodeName,
                rating: data.rating,
                overview: data.overview,
                stillPath: data.still
            });
        });
    });

    // Invert toggle
    const toggleInvert = document.getElementById(`grid-inverted-${tvId}`);
    if (toggleInvert) {
        toggleInvert.addEventListener('change', function () {
            const grid = document.getElementById(`episode-grid-${tvId}`);
            if (grid) {
                grid.classList.toggle('inverted', this.checked);
            }
        });
    }
}

/**
 * Show episode details in a modal/popup
 */
function showEpisodeDetails(data) {
    const { tvId, season, episode, name, rating, overview, stillPath } = data;

    // Create a mini-modal for episode details
    const existingModal = document.getElementById('episode-detail-modal');
    if (existingModal) existingModal.remove();

    const stillUrl = stillPath ? getImageUrl(stillPath, 'backdrop') : '';

    const modal = document.createElement('div');
    modal.id = 'episode-detail-modal';
    modal.className = 'episode-modal';
    modal.innerHTML = `
        <div class="episode-modal-backdrop"></div>
        <div class="episode-modal-content animate-scaleIn">
            ${stillUrl ? `<img class="episode-modal-still" src="${stillUrl}" alt="${name}">` : ''}
            <div class="episode-modal-info">
                <span class="episode-modal-badge">Temporada ${season} · Episodio ${episode}</span>
                <h3 class="episode-modal-title">${name}</h3>
                <div class="episode-modal-rating">
                    <span class="rating-star">⭐</span>
                    <span class="rating-value">${rating}</span>
                </div>
                ${overview ? `<p class="episode-modal-overview">${overview}</p>` : '<p class="episode-modal-overview">Sin descripción disponible.</p>'}
                <div class="episode-modal-actions">
                    <button class="btn btn-primary" onclick="window.location.hash='#/tv/${tvId}/season/${season}/episode/${episode}'">
                        Ver Detalles Completos
                    </button>
                    <button class="btn btn-secondary" id="close-episode-modal">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeBtn = document.getElementById('close-episode-modal');
    const backdrop = modal.querySelector('.episode-modal-backdrop');

    const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 200);
    };

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    // ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

export default { renderEpisodeGrid };
