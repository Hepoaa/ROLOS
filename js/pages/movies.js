// ==========================================
// CineVerso AI - Movies Page
// ==========================================

import { getPopularMovies, discoverMovies } from '../api/tmdb.js';
import { createCard } from '../components/card.js';
import { CONFIG } from '../config.js';

let currentPage = 1;
let currentGenre = null;
let loading = false;

export async function renderMoviesPage() {
    const main = document.getElementById('main');
    currentPage = 1;
    currentGenre = null;

    main.innerHTML = `
        <div class="page" style="padding: var(--space-8) var(--space-12); padding-top: calc(var(--header-height) + var(--space-8));">
            <h1 style="font-size: var(--text-4xl); margin-bottom: var(--space-6);">🎬 Películas</h1>
            <div class="search-filters" id="genre-filters" style="margin-bottom: var(--space-8);">
                <button class="tag active" data-genre="">Todas</button>
                ${Object.entries(CONFIG.GENRES).map(([id, name]) =>
        `<button class="tag" data-genre="${id}">${name}</button>`
    ).join('')}
            </div>
            <div id="movies-grid" class="grid grid-auto-fill" style="gap: var(--space-6);"></div>
            <div id="load-more" style="text-align: center; padding: var(--space-8);">
                <button class="btn btn-secondary" id="load-more-btn">Cargar más</button>
            </div>
        </div>
    `;

    await loadMovies();

    // Genre filter
    document.getElementById('genre-filters')?.addEventListener('click', async (e) => {
        const tag = e.target.closest('.tag');
        if (!tag) return;

        document.querySelectorAll('#genre-filters .tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentGenre = tag.dataset.genre || null;
        currentPage = 1;
        document.getElementById('movies-grid').innerHTML = '';
        await loadMovies();
    });

    // Load more
    document.getElementById('load-more-btn')?.addEventListener('click', async () => {
        currentPage++;
        await loadMovies();
    });
}

async function loadMovies() {
    if (loading) return;
    loading = true;

    const grid = document.getElementById('movies-grid');
    const loadBtn = document.getElementById('load-more-btn');
    loadBtn.textContent = 'Cargando...';

    try {
        const data = currentGenre
            ? await discoverMovies({ genres: currentGenre, page: currentPage })
            : await getPopularMovies(currentPage);

        const cards = data.results.map(m => createCard({ ...m, media_type: 'movie' })).join('');
        grid.insertAdjacentHTML('beforeend', cards);
        loadBtn.textContent = 'Cargar más';
    } catch (e) {
        console.error(e);
        loadBtn.textContent = 'Error - Reintentar';
    }

    loading = false;
}

export default { renderMoviesPage };
