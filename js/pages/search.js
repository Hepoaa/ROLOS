// ==========================================
// CineVerso AI - Search Page
// ==========================================

import { searchMulti } from '../api/tmdb.js';
import { createSearchBar, initSearch, destroySearch } from '../components/search.js';
import { createCard } from '../components/card.js';

export async function renderSearchPage(initialQuery = '') {
    const main = document.getElementById('main');

    main.innerHTML = `
        <div class="page search-page">
            ${createSearchBar(true)}
            <div id="search-results" class="search-results"></div>
        </div>
    `;

    const resultsContainer = document.getElementById('search-results');

    initSearch((results) => {
        if (!results.length) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: var(--space-12); color: var(--text-secondary);">
                    <p style="font-size: 3rem; margin-bottom: var(--space-4);">🔍</p>
                    <p>Busca películas, series, actores o describe lo que quieres ver</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(item => createCard({
            ...item,
            media_type: item.media_type || 'movie'
        })).join('');
    });

    // If there's an initial query, trigger search
    if (initialQuery) {
        const input = document.getElementById('search-input');
        if (input) {
            input.value = initialQuery;
            input.dispatchEvent(new Event('input'));
        }
    }
}

export function cleanupSearchPage() {
    destroySearch();
}

export default { renderSearchPage, cleanupSearchPage };
