// ==========================================
// CineVerso AI - Enhanced Anime Page
// ==========================================

import { getAnime, discoverTV } from '../api/tmdb.js';
import { createCard } from '../components/card.js';

let currentPage = 1;
let loading = false;
let currentGenre = 'all';
let currentSort = 'popularity.desc';

// Anime-specific genres from TMDB
const ANIME_GENRES = [
    { id: 'all', name: 'Todos', icon: '🎌' },
    { id: '16', name: 'Animación', icon: '🎨' },
    { id: '10759', name: 'Acción & Aventura', icon: '⚔️' },
    { id: '35', name: 'Comedia', icon: '😂' },
    { id: '18', name: 'Drama', icon: '🎭' },
    { id: '10765', name: 'Sci-Fi & Fantasy', icon: '🚀' },
    { id: '9648', name: 'Misterio', icon: '🔍' },
    { id: '10749', name: 'Romance', icon: '💕' },
    { id: '80', name: 'Crimen', icon: '🔫' },
    { id: '10768', name: 'Guerra & Política', icon: '🎖️' }
];

const SORT_OPTIONS = [
    { id: 'popularity.desc', name: 'Más Populares' },
    { id: 'vote_average.desc', name: 'Mejor Valorados' },
    { id: 'first_air_date.desc', name: 'Más Recientes' },
    { id: 'vote_count.desc', name: 'Más Votados' }
];

export async function renderAnimePage() {
    const main = document.getElementById('main');
    currentPage = 1;
    currentGenre = 'all';
    currentSort = 'popularity.desc';

    main.innerHTML = `
        <div class="page anime-page">
            <div class="anime-header">
                <div class="anime-title-section">
                    <h1 class="anime-title">🇯🇵 Anime</h1>
                    <p class="anime-subtitle">Descubre series de animación japonesa</p>
                </div>
                
                <div class="anime-controls">
                    <div class="anime-sort">
                        <label>Ordenar por:</label>
                        <select id="anime-sort" class="anime-select">
                            ${SORT_OPTIONS.map(opt => `
                                <option value="${opt.id}" ${opt.id === currentSort ? 'selected' : ''}>${opt.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="anime-filters" id="anime-filters">
                <div class="filter-scroll">
                    ${ANIME_GENRES.map(genre => `
                        <button class="anime-filter-btn ${genre.id === 'all' ? 'active' : ''}" data-genre="${genre.id}">
                            <span class="filter-icon">${genre.icon}</span>
                            <span class="filter-name">${genre.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="anime-search">
                <div class="anime-search-bar">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="anime-search-input" placeholder="Buscar anime por título..." autocomplete="off">
                </div>
            </div>
            
            <div id="anime-grid" class="anime-grid"></div>
            
            <div id="anime-loading" class="anime-loading" style="display: none;">
                <div class="loading-spinner"></div>
                <span>Cargando anime...</span>
            </div>
            
            <div id="load-more" class="load-more-container">
                <button class="btn btn-secondary btn-lg" id="load-more-btn">
                    Cargar más anime 📺
                </button>
            </div>
        </div>
    `;

    // Add CSS for anime page
    addAnimeStyles();

    // Setup event listeners
    setupAnimeFilters();
    setupAnimeSort();
    setupAnimeSearch();

    // Load initial anime
    await loadAnime(true);

    document.getElementById('load-more-btn')?.addEventListener('click', async () => {
        currentPage++;
        await loadAnime(false);
    });
}

function addAnimeStyles() {
    // Check if styles already exist
    if (document.getElementById('anime-page-styles')) return;

    const style = document.createElement('style');
    style.id = 'anime-page-styles';
    style.textContent = `
        .anime-page {
            padding: var(--space-8) var(--space-12);
            padding-top: calc(var(--header-height) + var(--space-8));
            min-height: 100vh;
        }
        
        .anime-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--space-6);
            flex-wrap: wrap;
            gap: var(--space-4);
        }
        
        .anime-title {
            font-size: var(--text-4xl);
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: var(--space-2);
        }
        
        .anime-subtitle {
            color: var(--text-secondary);
            font-size: var(--text-lg);
        }
        
        .anime-controls {
            display: flex;
            gap: var(--space-4);
            align-items: center;
        }
        
        .anime-sort label {
            color: var(--text-tertiary);
            font-size: var(--text-sm);
            margin-right: var(--space-2);
        }
        
        .anime-select {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--space-2) var(--space-4);
            color: var(--text-primary);
            font-size: var(--text-sm);
            cursor: pointer;
        }
        
        .anime-select:focus {
            outline: none;
            border-color: var(--accent-primary);
        }
        
        .anime-filters {
            margin-bottom: var(--space-6);
            overflow: hidden;
        }
        
        .filter-scroll {
            display: flex;
            gap: var(--space-3);
            overflow-x: auto;
            padding-bottom: var(--space-2);
            scrollbar-width: thin;
        }
        
        .filter-scroll::-webkit-scrollbar {
            height: 4px;
        }
        
        .filter-scroll::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 2px;
        }
        
        .anime-filter-btn {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            padding: var(--space-3) var(--space-5);
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-full);
            color: var(--text-secondary);
            font-size: var(--text-sm);
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .anime-filter-btn:hover {
            background: var(--bg-card-hover);
            color: var(--text-primary);
        }
        
        .anime-filter-btn.active {
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            border-color: transparent;
            color: white;
        }
        
        .filter-icon {
            font-size: 1.1em;
        }
        
        .anime-search {
            margin-bottom: var(--space-6);
        }
        
        .anime-search-bar {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: var(--space-3) var(--space-4);
            max-width: 400px;
            transition: border-color 0.2s;
        }
        
        .anime-search-bar:focus-within {
            border-color: #FF6B6B;
        }
        
        .anime-search-bar .search-icon {
            font-size: 1.2em;
        }
        
        .anime-search-bar input {
            flex: 1;
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: var(--text-base);
            outline: none;
        }
        
        .anime-search-bar input::placeholder {
            color: var(--text-tertiary);
        }
        
        .anime-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(var(--card-width), 1fr));
            gap: var(--space-6);
            margin-bottom: var(--space-8);
        }
        
        .anime-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-3);
            padding: var(--space-8);
            color: var(--text-secondary);
        }
        
        .loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--border-color);
            border-top-color: #FF6B6B;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .load-more-container {
            text-align: center;
            padding: var(--space-8);
        }
        
        .anime-empty {
            text-align: center;
            padding: var(--space-16);
            color: var(--text-secondary);
        }
        
        .anime-empty-icon {
            font-size: 4rem;
            margin-bottom: var(--space-4);
        }
        
        @media (max-width: 768px) {
            .anime-page {
                padding: var(--space-4);
                padding-top: calc(var(--header-height) + var(--space-4));
            }
            
            .anime-header {
                flex-direction: column;
            }
            
            .anime-title {
                font-size: var(--text-3xl);
            }
            
            .anime-search-bar {
                max-width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

function setupAnimeFilters() {
    const filtersContainer = document.getElementById('anime-filters');

    filtersContainer?.addEventListener('click', async (e) => {
        const btn = e.target.closest('.anime-filter-btn');
        if (!btn) return;

        const genre = btn.dataset.genre;
        if (genre === currentGenre) return;

        currentGenre = genre;
        currentPage = 1;

        // Update active state
        filtersContainer.querySelectorAll('.anime-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        await loadAnime(true);
    });
}

function setupAnimeSort() {
    const sortSelect = document.getElementById('anime-sort');

    sortSelect?.addEventListener('change', async () => {
        currentSort = sortSelect.value;
        currentPage = 1;
        await loadAnime(true);
    });
}

function setupAnimeSearch() {
    const searchInput = document.getElementById('anime-search-input');
    let searchTimeout;

    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();

        searchTimeout = setTimeout(async () => {
            if (query.length >= 2) {
                await searchAnime(query);
            } else if (query.length === 0) {
                currentPage = 1;
                await loadAnime(true);
            }
        }, 400);
    });
}

async function loadAnime(clear = false) {
    if (loading) return;
    loading = true;

    const grid = document.getElementById('anime-grid');
    const loadBtn = document.getElementById('load-more-btn');
    const loadingIndicator = document.getElementById('anime-loading');

    if (clear) {
        grid.innerHTML = '';
    }

    loadBtn.style.display = 'none';
    loadingIndicator.style.display = 'flex';

    try {
        let data;

        if (currentGenre === 'all') {
            // Use the existing getAnime function which filters for anime
            data = await getAnime(currentPage);
        } else {
            // Use discover with specific genre for anime
            data = await discoverTV({
                with_genres: currentGenre,
                with_origin_country: 'JP',
                with_original_language: 'ja',
                sort_by: currentSort,
                page: currentPage
            });
        }

        if (data.results.length === 0 && clear) {
            grid.innerHTML = `
                <div class="anime-empty" style="grid-column: 1 / -1;">
                    <div class="anime-empty-icon">🎌</div>
                    <h3>No se encontró anime</h3>
                    <p>Prueba con otro género o filtro</p>
                </div>
            `;
        } else {
            const cards = data.results.map(a => createCard({ ...a, media_type: 'tv' })).join('');
            grid.insertAdjacentHTML('beforeend', cards);
        }

        // Show/hide load more button
        if (data.page < data.total_pages && data.results.length > 0) {
            loadBtn.style.display = 'inline-flex';
        }

    } catch (e) {
        console.error('Error loading anime:', e);
        if (clear) {
            grid.innerHTML = `
                <div class="anime-empty" style="grid-column: 1 / -1;">
                    <div class="anime-empty-icon">😵</div>
                    <h3>Error al cargar</h3>
                    <p>Por favor intenta de nuevo</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    loadingIndicator.style.display = 'none';
    loading = false;
}

async function searchAnime(query) {
    const grid = document.getElementById('anime-grid');
    const loadBtn = document.getElementById('load-more-btn');
    const loadingIndicator = document.getElementById('anime-loading');

    grid.innerHTML = '';
    loadBtn.style.display = 'none';
    loadingIndicator.style.display = 'flex';

    try {
        // Import search function
        const { searchMulti } = await import('../api/tmdb.js');
        const data = await searchMulti(query);

        // Filter for anime (Japanese animation)
        const animeResults = data.results.filter(item =>
            item.media_type === 'tv' &&
            (item.origin_country?.includes('JP') || item.original_language === 'ja') &&
            item.genre_ids?.includes(16) // Animation genre
        );

        if (animeResults.length === 0) {
            // Also include any Japanese series that might be anime
            const japaneseResults = data.results.filter(item =>
                item.media_type === 'tv' &&
                (item.origin_country?.includes('JP') || item.original_language === 'ja')
            );

            if (japaneseResults.length > 0) {
                const cards = japaneseResults.map(a => createCard({ ...a, media_type: 'tv' })).join('');
                grid.innerHTML = cards;
            } else {
                grid.innerHTML = `
                    <div class="anime-empty" style="grid-column: 1 / -1;">
                        <div class="anime-empty-icon">🔍</div>
                        <h3>No se encontró "${query}"</h3>
                        <p>Prueba con otro término de búsqueda</p>
                    </div>
                `;
            }
        } else {
            const cards = animeResults.map(a => createCard({ ...a, media_type: 'tv' })).join('');
            grid.innerHTML = cards;
        }

    } catch (e) {
        console.error('Search error:', e);
        grid.innerHTML = `
            <div class="anime-empty" style="grid-column: 1 / -1;">
                <div class="anime-empty-icon">😵</div>
                <h3>Error en la búsqueda</h3>
                <p>Por favor intenta de nuevo</p>
            </div>
        `;
    }

    loadingIndicator.style.display = 'none';
}

export default { renderAnimePage };
