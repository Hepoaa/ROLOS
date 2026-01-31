// ==========================================
// CineVerso AI - Series Page
// ==========================================

import { getPopularTV, discoverTV } from '../api/tmdb.js';
import { createCard } from '../components/card.js';

let currentPage = 1;
let currentGenre = null;
let loading = false;

const TV_GENRES = {
    10759: 'Acción', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familia', 9648: 'Misterio',
    10765: 'Sci-Fi y Fantasía'
};

export async function renderSeriesPage() {
    const main = document.getElementById('main');
    currentPage = 1;
    currentGenre = null;

    main.innerHTML = `
        <div class="page" style="padding: var(--space-8) var(--space-12); padding-top: calc(var(--header-height) + var(--space-8));">
            <h1 style="font-size: var(--text-4xl); margin-bottom: var(--space-6);">📺 Series</h1>
            <div class="search-filters" id="genre-filters" style="margin-bottom: var(--space-8);">
                <button class="tag active" data-genre="">Todas</button>
                ${Object.entries(TV_GENRES).map(([id, name]) =>
        `<button class="tag" data-genre="${id}">${name}</button>`
    ).join('')}
            </div>
            <div id="series-grid" class="grid grid-auto-fill" style="gap: var(--space-6);"></div>
            <div id="load-more" style="text-align: center; padding: var(--space-8);">
                <button class="btn btn-secondary" id="load-more-btn">Cargar más</button>
            </div>
        </div>
    `;

    await loadSeries();

    document.getElementById('genre-filters')?.addEventListener('click', async (e) => {
        const tag = e.target.closest('.tag');
        if (!tag) return;
        document.querySelectorAll('#genre-filters .tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        currentGenre = tag.dataset.genre || null;
        currentPage = 1;
        document.getElementById('series-grid').innerHTML = '';
        await loadSeries();
    });

    document.getElementById('load-more-btn')?.addEventListener('click', async () => {
        currentPage++;
        await loadSeries();
    });
}

async function loadSeries() {
    if (loading) return;
    loading = true;

    const grid = document.getElementById('series-grid');
    const loadBtn = document.getElementById('load-more-btn');
    loadBtn.textContent = 'Cargando...';

    try {
        const data = currentGenre
            ? await discoverTV({ genres: currentGenre, page: currentPage })
            : await getPopularTV(currentPage);

        const cards = data.results.map(s => createCard({ ...s, media_type: 'tv' })).join('');
        grid.insertAdjacentHTML('beforeend', cards);
        loadBtn.textContent = 'Cargar más';
    } catch (e) {
        loadBtn.textContent = 'Error - Reintentar';
    }

    loading = false;
}

export default { renderSeriesPage };
