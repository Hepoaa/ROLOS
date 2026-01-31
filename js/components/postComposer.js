// ============================================
// CineVerso AI - Post Composer Component
// ============================================

import { getCurrentUser } from '../auth.js';
import { createPost } from '../social.js';
import { showAuthModal } from './authModal.js';

// Post types
const POST_TYPES = [
    { id: 'recommendation', label: 'Recomendación', icon: '🎬' },
    { id: 'review', label: 'Reseña', icon: '📝' },
    { id: 'question', label: 'Pregunta', icon: '❓' },
    { id: 'list', label: 'Lista', icon: '📋' }
];

let selectedPostType = 'recommendation';
let selectedRating = 0;
let linkedContent = null;
let uploadedMedia = [];
let isSpoiler = false;

// Render post composer
export function renderPostComposer(container, options = {}) {
    const user = getCurrentUser();

    if (!user) {
        container.innerHTML = `
            <div class="post-composer-login" onclick="window.CineVersoAuth.showAuthModal('login', 'Inicia sesión para compartir')">
                <div class="composer-avatar placeholder">👤</div>
                <div class="composer-prompt">
                    <span>¿Qué estás viendo? 🎬</span>
                    <span class="login-hint">Inicia sesión para publicar</span>
                </div>
            </div>
        `;
        return;
    }

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    container.innerHTML = `
        <div class="post-composer" id="post-composer">
            <div class="composer-collapsed" id="composer-collapsed">
                <div class="composer-avatar">${avatar}</div>
                <div class="composer-prompt" id="expand-composer">
                    ¿Qué estás viendo? 🎬
                </div>
            </div>
            
            <div class="composer-expanded hidden" id="composer-expanded">
                <div class="composer-header">
                    <div class="composer-avatar">${avatar}</div>
                    <div class="composer-user">
                        <span class="display-name">${user.displayName}</span>
                        <span class="username">@${user.username}</span>
                    </div>
                </div>
                
                <textarea 
                    class="composer-textarea" 
                    id="composer-text"
                    placeholder="¿Qué quieres compartir?"
                    maxlength="500"
                ></textarea>
                
                <div class="composer-linked hidden" id="linked-content-preview"></div>
                
                <div class="composer-media-preview hidden" id="media-preview"></div>
                
                <div class="composer-type-selector">
                    <span class="type-label">Tipo:</span>
                    ${POST_TYPES.map(type => `
                        <button type="button" 
                            class="type-btn ${type.id === selectedPostType ? 'active' : ''}"
                            data-type="${type.id}">
                            ${type.icon} ${type.label}
                        </button>
                    `).join('')}
                </div>
                
                <div class="composer-rating hidden" id="rating-selector">
                    <span class="rating-label">Tu calificación:</span>
                    <div class="rating-stars">
                        ${[1, 2, 3, 4, 5].map(n => `
                            <button type="button" class="star-btn" data-rating="${n}">★</button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="composer-divider"></div>
                
                <div class="composer-actions">
                    <div class="action-buttons">
                        <button type="button" class="action-btn" id="btn-add-image" title="Añadir imagen">
                            📷 Foto
                        </button>
                        <button type="button" class="action-btn" id="btn-link-content" title="Vincular película">
                            🎥 Vincular
                        </button>
                        <button type="button" class="action-btn" id="btn-add-gif" title="Añadir GIF" disabled>
                            😊 GIF
                        </button>
                    </div>
                    
                    <div class="composer-footer">
                        <label class="spoiler-checkbox">
                            <input type="checkbox" id="spoiler-check">
                            <span>Contiene spoilers</span>
                        </label>
                        <span class="char-counter" id="char-counter">0/500</span>
                        <button type="button" class="publish-btn" id="publish-btn" disabled>
                            Publicar 🚀
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <input type="file" id="image-upload" accept="image/*" multiple hidden>
    `;

    setupComposerHandlers(container, options.onPost);
}

// Setup event handlers
function setupComposerHandlers(container, onPostCallback) {
    const expandBtn = container.querySelector('#expand-composer');
    const collapsed = container.querySelector('#composer-collapsed');
    const expanded = container.querySelector('#composer-expanded');
    const textarea = container.querySelector('#composer-text');
    const charCounter = container.querySelector('#char-counter');
    const publishBtn = container.querySelector('#publish-btn');
    const spoilerCheck = container.querySelector('#spoiler-check');
    const imageUpload = container.querySelector('#image-upload');

    // Expand composer
    if (expandBtn && collapsed && expanded) {
        expandBtn.addEventListener('click', () => {
            collapsed.classList.add('hidden');
            expanded.classList.remove('hidden');
            textarea?.focus();
        });
    }

    // Text input
    if (textarea) {
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            charCounter.textContent = `${length}/500`;
            charCounter.classList.toggle('warning', length > 450);
            charCounter.classList.toggle('error', length >= 500);
            publishBtn.disabled = length === 0;
        });

        // Collapse on escape
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                collapseComposer(container);
            }
        });
    }

    // Type buttons
    container.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedPostType = btn.dataset.type;

            container.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide rating for reviews
            const ratingSelector = container.querySelector('#rating-selector');
            if (ratingSelector) {
                ratingSelector.classList.toggle('hidden', selectedPostType !== 'review');
            }
        });
    });

    // Rating stars
    container.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            updateRatingDisplay(container);
        });

        btn.addEventListener('mouseenter', () => {
            highlightStars(container, parseInt(btn.dataset.rating));
        });

        btn.addEventListener('mouseleave', () => {
            updateRatingDisplay(container);
        });
    });

    // Spoiler checkbox
    if (spoilerCheck) {
        spoilerCheck.addEventListener('change', () => {
            isSpoiler = spoilerCheck.checked;
        });
    }

    // Add image button
    const addImageBtn = container.querySelector('#btn-add-image');
    if (addImageBtn && imageUpload) {
        addImageBtn.addEventListener('click', () => imageUpload.click());

        imageUpload.addEventListener('change', (e) => {
            handleImageUpload(e.target.files, container);
        });
    }

    // Link content button
    const linkContentBtn = container.querySelector('#btn-link-content');
    if (linkContentBtn) {
        linkContentBtn.addEventListener('click', () => {
            showLinkContentModal(container);
        });
    }

    // Publish button
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            handlePublish(container, onPostCallback);
        });
    }
}

// Collapse composer
function collapseComposer(container) {
    const collapsed = container.querySelector('#composer-collapsed');
    const expanded = container.querySelector('#composer-expanded');

    if (collapsed && expanded) {
        expanded.classList.add('hidden');
        collapsed.classList.remove('hidden');
    }
}

// Update rating display
function updateRatingDisplay(container) {
    container.querySelectorAll('.star-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index < selectedRating);
    });
}

// Highlight stars on hover
function highlightStars(container, rating) {
    container.querySelectorAll('.star-btn').forEach((btn, index) => {
        btn.classList.toggle('hover', index < rating);
    });
}

// Handle image upload
function handleImageUpload(files, container) {
    const mediaPreview = container.querySelector('#media-preview');
    if (!mediaPreview) return;

    const maxImages = 4;
    const remainingSlots = maxImages - uploadedMedia.length;

    Array.from(files).slice(0, remainingSlots).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedMedia.push({
                type: 'image',
                url: e.target.result,
                alt: file.name
            });
            renderMediaPreview(container);
        };
        reader.readAsDataURL(file);
    });
}

// Render media preview
function renderMediaPreview(container) {
    const preview = container.querySelector('#media-preview');
    if (!preview) return;

    if (uploadedMedia.length === 0) {
        preview.classList.add('hidden');
        preview.innerHTML = '';
        return;
    }

    preview.classList.remove('hidden');
    preview.innerHTML = uploadedMedia.map((media, index) => `
        <div class="media-item">
            <img src="${media.url}" alt="${media.alt}">
            <button type="button" class="remove-media" data-index="${index}">✕</button>
        </div>
    `).join('');

    // Remove button handlers
    preview.querySelectorAll('.remove-media').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            uploadedMedia.splice(index, 1);
            renderMediaPreview(container);
        });
    });
}

// Show link content modal
function showLinkContentModal(container) {
    const modal = document.createElement('div');
    modal.className = 'link-content-modal-overlay';
    modal.id = 'link-content-modal';

    modal.innerHTML = `
        <div class="link-content-modal">
            <div class="modal-header">
                <h3>🎬 Vincular película o serie</h3>
                <button class="modal-close" onclick="document.getElementById('link-content-modal').remove()">✕</button>
            </div>
            
            <div class="search-input-container">
                <input type="text" id="content-search" placeholder="Buscar por título..." autofocus>
            </div>
            
            <div class="search-results" id="content-results">
                <p class="search-hint">Escribe para buscar películas o series</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Search handler
    const searchInput = modal.querySelector('#content-search');
    const resultsContainer = modal.querySelector('#content-results');

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();

        if (query.length < 2) {
            resultsContainer.innerHTML = '<p class="search-hint">Escribe para buscar películas o series</p>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando...</div>';

        searchTimeout = setTimeout(async () => {
            try {
                const results = await searchTMDB(query);
                renderSearchResults(results, resultsContainer, container, modal);
            } catch (error) {
                resultsContainer.innerHTML = '<p class="search-error">Error al buscar. Intenta de nuevo.</p>';
            }
        }, 300);
    });
}

// Search TMDB
async function searchTMDB(query) {
    const { CONFIG } = await import('../config.js');

    const response = await fetch(
        `${CONFIG.TMDB.BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=${CONFIG.APP.LANGUAGE}`,
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.TMDB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    return data.results.filter(item =>
        item.media_type === 'movie' || item.media_type === 'tv'
    ).slice(0, 10);
}

// Render search results
function renderSearchResults(results, container, composerContainer, modal) {
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
        return;
    }

    container.innerHTML = results.map(item => {
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '').substring(0, 4);
        const type = item.media_type === 'movie' ? '🎬' : '📺';
        const poster = item.poster_path
            ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
            : '';

        return `
            <div class="search-result-item" data-item='${JSON.stringify({
            id: item.id,
            type: item.media_type,
            title: title,
            posterPath: item.poster_path,
            year: year,
            rating: item.vote_average?.toFixed(1) || 'N/A'
        })}'>
                <div class="result-poster">
                    ${poster ? `<img src="${poster}" alt="${title}">` : `<span class="no-poster">${type}</span>`}
                </div>
                <div class="result-info">
                    <span class="result-title">${title}</span>
                    <span class="result-meta">${type} ${year} ${item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : ''}</span>
                </div>
            </div>
        `;
    }).join('');

    // Click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            linkedContent = JSON.parse(item.dataset.item);
            renderLinkedContentPreview(composerContainer);
            modal.remove();
        });
    });
}

// Render linked content preview
function renderLinkedContentPreview(container) {
    const preview = container.querySelector('#linked-content-preview');
    if (!preview || !linkedContent) return;

    const poster = linkedContent.posterPath
        ? `https://image.tmdb.org/t/p/w92${linkedContent.posterPath}`
        : '';

    const typeIcon = linkedContent.type === 'movie' ? '🎬' : '📺';

    preview.classList.remove('hidden');
    preview.innerHTML = `
        <div class="linked-content-card">
            <div class="linked-poster">
                ${poster ? `<img src="${poster}" alt="${linkedContent.title}">` : `<span>${typeIcon}</span>`}
            </div>
            <div class="linked-info">
                <span class="linked-title">${linkedContent.title}</span>
                <span class="linked-meta">${linkedContent.year} ⭐ ${linkedContent.rating}</span>
            </div>
            <button type="button" class="remove-linked" id="remove-linked">✕</button>
        </div>
    `;

    // Remove handler
    preview.querySelector('#remove-linked').addEventListener('click', () => {
        linkedContent = null;
        preview.classList.add('hidden');
        preview.innerHTML = '';
    });
}

// Handle publish
async function handlePublish(container, callback) {
    const textarea = container.querySelector('#composer-text');
    const text = textarea?.value.trim();

    if (!text) return;

    const publishBtn = container.querySelector('#publish-btn');
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publicando...';

    const result = createPost({
        type: selectedPostType,
        text: text,
        media: uploadedMedia,
        linkedContent: linkedContent,
        rating: selectedPostType === 'review' ? selectedRating : null,
        spoilerWarning: isSpoiler
    });

    if (result.success) {
        // Reset composer
        textarea.value = '';
        uploadedMedia = [];
        linkedContent = null;
        selectedRating = 0;
        isSpoiler = false;

        const mediaPreview = container.querySelector('#media-preview');
        const linkedPreview = container.querySelector('#linked-content-preview');
        if (mediaPreview) mediaPreview.innerHTML = '';
        if (linkedPreview) linkedPreview.innerHTML = '';

        collapseComposer(container);

        // Show success toast
        showToast('¡Post publicado! 🎉');

        // Callback
        if (callback) callback(result.post);
    } else {
        showToast(result.error || 'Error al publicar', 'error');
    }

    publishBtn.disabled = false;
    publishBtn.textContent = 'Publicar 🚀';
}

// Toast helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}
