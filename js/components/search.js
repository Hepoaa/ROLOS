// ==========================================
// CineVerso AI - Enhanced Search Component
// ==========================================

import { debounce } from '../utils/helpers.js';
import { searchMulti } from '../api/tmdb.js';
import { analyzeSearchIntent, getAIRecommendations } from '../api/groq.js';

const PLACEHOLDERS = [
    "Busca películas, series, actores...",
    "\"Películas como Inception\"",
    "\"Algo para ver en pareja\"",
    "\"Película donde viajan en el tiempo\"",
    "\"Mejores thrillers de los 90\"",
    "\"Quiero algo que me haga llorar\"",
    "\"Esa película con DiCaprio en un barco\"",
    "\"Series de ciencia ficción como Black Mirror\""
];

let placeholderIndex = 0;
let placeholderInterval = null;

export function createSearchBar(fullPage = false) {
    if (fullPage) {
        return `
            <div class="search-hero">
                <h1 class="search-hero-title">¿Qué quieres ver hoy? 🎬</h1>
                <p class="search-hero-subtitle">Describe lo que buscas con tus palabras - nuestra IA te entiende</p>
                <div class="search-container">
                    <div class="search-bar">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            class="search-input" 
                            id="search-input"
                            placeholder="${PLACEHOLDERS[0]}"
                            autocomplete="off"
                        >
                        <span class="search-ai-badge">✨ AI</span>
                    </div>
                    <div class="search-filters" id="search-filters">
                        <button class="tag active" data-filter="all">Todo</button>
                        <button class="tag" data-filter="movie">Películas</button>
                        <button class="tag" data-filter="tv">Series</button>
                        <button class="tag" data-filter="person">Personas</button>
                    </div>
                </div>
                <div id="search-ai-response" class="search-ai-response" style="display: none;">
                    <div class="search-ai-header">
                        <div class="search-ai-icon">🤖</div>
                        <strong>CineBot</strong>
                    </div>
                    <p id="ai-response-text"></p>
                    <div id="ai-suggestions" class="ai-suggestions"></div>
                </div>
                <div id="search-loading" class="search-loading" style="display: none;">
                    <div class="spinner"></div>
                    <span>Buscando con IA...</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="search-input" placeholder="${PLACEHOLDERS[0]}">
            <span class="search-ai-badge">✨ AI</span>
        </div>
    `;
}

export function initSearch(onResults) {
    const input = document.getElementById('search-input');
    const filters = document.getElementById('search-filters');
    const aiResponse = document.getElementById('search-ai-response');
    const aiText = document.getElementById('ai-response-text');
    const aiSuggestions = document.getElementById('ai-suggestions');
    const loadingIndicator = document.getElementById('search-loading');

    if (!input) return;

    let activeFilter = 'all';
    let lastQuery = '';

    // Rotate placeholders
    placeholderInterval = setInterval(() => {
        placeholderIndex = (placeholderIndex + 1) % PLACEHOLDERS.length;
        input.placeholder = PLACEHOLDERS[placeholderIndex];
    }, 4000);

    // Detect if query is natural language
    function isNaturalLanguageQuery(query) {
        const nlIndicators = [
            'como', 'parecido', 'similar', 'para', 'mejor', 'quiero',
            'recomienda', 'busco', 'dame', 'necesito', 'algo', 'esa',
            'película donde', 'serie donde', 'tipo', 'estilo', 'mood',
            'triste', 'feliz', 'acción', 'romance', 'terror', 'comedia',
            'que me haga', 'para ver con', 'clásico', 'nuevo', 'viejo'
        ];

        const lowerQuery = query.toLowerCase();
        return query.length > 15 || nlIndicators.some(indicator => lowerQuery.includes(indicator));
    }

    // Handle search with debounce
    const handleSearch = debounce(async (query) => {
        if (!query.trim()) {
            if (onResults) onResults([]);
            if (aiResponse) aiResponse.style.display = 'none';
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            return;
        }

        // Avoid duplicate searches
        if (query === lastQuery) return;
        lastQuery = query;

        try {
            const useAI = isNaturalLanguageQuery(query);

            if (useAI) {
                // Show loading
                if (loadingIndicator) loadingIndicator.style.display = 'flex';
                if (aiResponse) aiResponse.style.display = 'none';

                try {
                    // Get AI analysis
                    const intent = await analyzeSearchIntent(query);

                    // Hide loading, show AI response
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    if (aiResponse) aiResponse.style.display = 'block';

                    // Display AI explanation
                    if (aiText && intent.explanation) {
                        aiText.textContent = intent.explanation;
                    }

                    // Display AI suggestions as clickable tags
                    if (aiSuggestions && intent.suggestions && intent.suggestions.length > 0) {
                        aiSuggestions.innerHTML = `
                            <p class="ai-suggestions-label">💡 Sugerencias de CineBot:</p>
                            <div class="ai-suggestion-tags">
                                ${intent.suggestions.slice(0, 6).map(s => `
                                    <button class="ai-suggestion-tag" data-title="${s.title}" data-year="${s.year || ''}">
                                        ${s.title} ${s.year ? `(${s.year})` : ''}
                                    </button>
                                `).join('')}
                            </div>
                        `;

                        // Add click handlers to suggestion tags
                        aiSuggestions.querySelectorAll('.ai-suggestion-tag').forEach(tag => {
                            tag.addEventListener('click', async () => {
                                const title = tag.dataset.title;
                                input.value = title;
                                await performDirectSearch(title, activeFilter, onResults);
                            });
                        });
                    } else if (aiSuggestions) {
                        aiSuggestions.innerHTML = '';
                    }

                    // Perform searches with multiple terms
                    const allResults = [];
                    const searchedTitles = new Set();

                    // Search with AI-provided terms
                    for (const term of intent.searchTerms.slice(0, 2)) {
                        try {
                            const data = await searchMulti(term);
                            for (const result of data.results) {
                                const key = `${result.id}-${result.media_type}`;
                                if (!searchedTitles.has(key)) {
                                    searchedTitles.add(key);
                                    allResults.push(result);
                                }
                            }
                        } catch (e) {
                            console.error('Search term error:', e);
                        }
                    }

                    // Also search for each suggestion
                    for (const suggestion of (intent.suggestions || []).slice(0, 3)) {
                        try {
                            const data = await searchMulti(suggestion.title);
                            for (const result of data.results.slice(0, 2)) {
                                const key = `${result.id}-${result.media_type}`;
                                if (!searchedTitles.has(key)) {
                                    searchedTitles.add(key);
                                    // Mark as AI-recommended
                                    result.aiRecommended = true;
                                    result.aiReason = suggestion.reason;
                                    allResults.push(result);
                                }
                            }
                        } catch (e) {
                            // Ignore individual suggestion errors
                        }
                    }

                    // Sort: AI-recommended first, then by popularity
                    allResults.sort((a, b) => {
                        if (a.aiRecommended && !b.aiRecommended) return -1;
                        if (!a.aiRecommended && b.aiRecommended) return 1;
                        return (b.popularity || 0) - (a.popularity || 0);
                    });

                    if (onResults) onResults(filterResults(allResults, activeFilter));

                } catch (e) {
                    console.error('AI search error:', e);
                    // Fallback to direct search
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    await performDirectSearch(query, activeFilter, onResults);
                }
            } else {
                // Direct search for simple queries
                if (aiResponse) aiResponse.style.display = 'none';
                await performDirectSearch(query, activeFilter, onResults);
            }
        } catch (e) {
            console.error('Search error:', e);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }, 600);

    // Direct TMDB search
    async function performDirectSearch(query, filter, callback) {
        try {
            const data = await searchMulti(query);
            if (callback) callback(filterResults(data.results, filter));
        } catch (e) {
            console.error('Direct search error:', e);
            if (callback) callback([]);
        }
    }

    input.addEventListener('input', (e) => handleSearch(e.target.value));

    // Filter handling
    filters?.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag');
        if (!tag) return;

        filters.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        activeFilter = tag.dataset.filter;

        if (input.value.trim()) {
            lastQuery = ''; // Force re-search
            handleSearch(input.value);
        }
    });

    // Enter key handling
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            lastQuery = ''; // Force search
            handleSearch(input.value);
        }
    });
}

function filterResults(results, filter) {
    if (filter === 'all') return results;
    return results.filter(item => item.media_type === filter);
}

export function destroySearch() {
    if (placeholderInterval) {
        clearInterval(placeholderInterval);
        placeholderInterval = null;
    }
}

export default { createSearchBar, initSearch, destroySearch };
