// ============================================
// CineVerso AI - Post Card Component
// ============================================

import { getUserById, getCurrentUser, isFollowing, followUser, unfollowUser } from '../auth.js';
import { toggleLike, hasLiked, savePost, hasSaved, deletePost, getComments } from '../social.js';
import { showAuthModal } from './authModal.js';

// Time ago helper
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

// Format number
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Render post card
export function renderPostCard(post, options = {}) {
    const author = getUserById(post.authorId);
    if (!author) return '';

    const currentUser = getCurrentUser();
    const isOwner = currentUser?.id === post.authorId;
    const liked = hasLiked(post.id);
    const saved = hasSaved(post.id);

    const avatar = author.avatar
        ? `<img src="${author.avatar}" alt="${author.displayName}">`
        : `<span style="background: ${author.avatarColor}">${author.displayName.charAt(0).toUpperCase()}</span>`;

    const typeLabels = {
        recommendation: '',
        review: '📝 RESEÑA',
        question: '❓ PREGUNTA',
        list: '📋 LISTA'
    };

    // Format text with hashtags and mentions
    const formattedText = formatPostText(post.content.text);

    // Spoiler overlay
    const spoilerOverlay = post.content.spoilerWarning ? `
        <div class="spoiler-overlay" id="spoiler-${post.id}">
            <div class="spoiler-warning">
                <span class="spoiler-icon">⚠️</span>
                <span class="spoiler-text">ESTE POST CONTIENE SPOILERS</span>
                <button type="button" class="reveal-spoiler" data-post="${post.id}">Mostrar contenido</button>
            </div>
        </div>
    ` : '';

    // Rating stars for reviews
    const ratingStars = post.type === 'review' && post.content.rating ? `
        <div class="post-rating">
            ${'★'.repeat(post.content.rating)}${'☆'.repeat(5 - post.content.rating)}
        </div>
    ` : '';

    // Linked content card
    const linkedContentCard = post.content.linkedContent ? `
        <div class="linked-content" onclick="window.router.navigate('/${post.content.linkedContent.type === 'movie' ? 'pelicula' : 'serie'}/${post.content.linkedContent.id}')" style="cursor: pointer;">
            <div class="linked-poster">
                ${post.content.linkedContent.posterPath
            ? `<img src="https://image.tmdb.org/t/p/w92${post.content.linkedContent.posterPath}" alt="${post.content.linkedContent.title}">`
            : `<span>${post.content.linkedContent.type === 'movie' ? '🎬' : '📺'}</span>`
        }
            </div>
            <div class="linked-info">
                <span class="linked-title">${post.content.linkedContent.title}</span>
                <span class="linked-meta">${post.content.linkedContent.year || ''} ${post.content.linkedContent.rating ? '⭐ ' + post.content.linkedContent.rating : ''}</span>
            </div>
        </div>
    ` : '';

    // Media gallery
    const mediaGallery = post.content.media && post.content.media.length > 0 ? `
        <div class="post-media media-count-${post.content.media.length}">
            ${post.content.media.map((media, i) => `
                <div class="media-item" onclick="showMediaModal('${media.url}')">
                    <img src="${media.url}" alt="${media.alt || 'Imagen'}">
                </div>
            `).join('')}
        </div>
    ` : '';

    return `
        <article class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <a href="#/perfil/${author.username}" class="post-author">
                    <div class="post-avatar">${avatar}</div>
                    <div class="post-author-info">
                        <span class="author-name">
                            ${author.displayName}
                            ${author.isVerified ? '<span class="verified-badge" title="Verificado">✓</span>' : ''}
                        </span>
                        <span class="author-username">@${author.username} · ${timeAgo(post.createdAt)}</span>
                    </div>
                </a>
                
                <div class="post-menu">
                    <button type="button" class="post-menu-btn" data-post="${post.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="6" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="18" r="2"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            ${typeLabels[post.type] ? `<div class="post-type-badge">${typeLabels[post.type]}</div>` : ''}
            ${ratingStars}
            
            <div class="post-content ${post.content.spoilerWarning ? 'has-spoiler' : ''}">
                ${spoilerOverlay}
                <p class="post-text">${formattedText}</p>
                ${linkedContentCard}
                ${mediaGallery}
            </div>
            
            <div class="post-actions">
                <button type="button" class="action-btn comment-btn" data-action="comment" data-post="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>${formatNumber(post.stats.comments)}</span>
                </button>
                
                <button type="button" class="action-btn repost-btn" data-action="repost" data-post="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="17 1 21 5 17 9"/>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                    <span>${formatNumber(post.stats.reposts)}</span>
                </button>
                
                <button type="button" class="action-btn like-btn ${liked ? 'liked' : ''}" data-action="like" data-post="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>${formatNumber(post.stats.likes)}</span>
                </button>
                
                <button type="button" class="action-btn save-btn ${saved ? 'saved' : ''}" data-action="save" data-post="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
                
                <button type="button" class="action-btn share-btn" data-action="share" data-post="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                </button>
            </div>
        </article>
    `;
}

// Format post text with links
function formatPostText(text) {
    // Escape HTML
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert hashtags to links
    formatted = formatted.replace(/#(\w+)/g, '<a href="#/hashtag/$1" class="hashtag">#$1</a>');

    // Convert mentions to links
    formatted = formatted.replace(/@(\w+)/g, '<a href="#/perfil/$1" class="mention">@$1</a>');

    // Convert URLs to links
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="link">$1</a>'
    );

    // Convert newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// Setup post card handlers
export function setupPostCardHandlers(container) {
    // Action buttons
    container.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const postId = btn.dataset.post;

            handlePostAction(action, postId, btn);
        });
    });

    // Reveal spoiler buttons
    container.querySelectorAll('.reveal-spoiler').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = btn.dataset.post;
            const overlay = document.getElementById(`spoiler-${postId}`);
            overlay?.remove();
        });
    });

    // Post menu buttons
    container.querySelectorAll('.post-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPostMenu(btn, btn.dataset.post);
        });
    });
}

// Handle post actions
function handlePostAction(action, postId, btn) {
    const currentUser = getCurrentUser();

    if (!currentUser && ['like', 'comment', 'repost', 'save'].includes(action)) {
        showAuthModal('login', 'Inicia sesión para interactuar');
        return;
    }

    switch (action) {
        case 'like':
            const likeResult = toggleLike(postId);
            if (likeResult.success) {
                btn.classList.toggle('liked');
                const countSpan = btn.querySelector('span');
                countSpan.textContent = formatNumber(likeResult.likes);

                // Animate
                btn.classList.add('like-animate');
                setTimeout(() => btn.classList.remove('like-animate'), 300);
            }
            break;

        case 'save':
            const saveResult = savePost(postId);
            if (saveResult.success) {
                btn.classList.toggle('saved', saveResult.saved);
                showToast(saveResult.saved ? 'Guardado' : 'Eliminado de guardados');
            }
            break;

        case 'comment':
            showCommentsModal(postId);
            break;

        case 'repost':
            showRepostMenu(btn, postId);
            break;

        case 'share':
            sharePost(postId);
            break;
    }
}

// Show post menu
function showPostMenu(btn, postId) {
    const currentUser = getCurrentUser();
    const post = getPostById(postId);
    const isOwner = currentUser?.id === post?.authorId;

    // Remove any existing menu
    document.querySelectorAll('.post-dropdown-menu').forEach(m => m.remove());

    const menu = document.createElement('div');
    menu.className = 'post-dropdown-menu';
    menu.innerHTML = `
        <button class="menu-item" data-action="copy-link">
            <span>🔗</span> Copiar enlace
        </button>
        ${!isOwner ? `
            <button class="menu-item" data-action="not-interested">
                <span>😐</span> No me interesa
            </button>
            <button class="menu-item" data-action="mute">
                <span>🔇</span> Silenciar usuario
            </button>
            <button class="menu-item" data-action="block">
                <span>🚫</span> Bloquear usuario
            </button>
            <button class="menu-item danger" data-action="report">
                <span>⚠️</span> Reportar
            </button>
        ` : `
            <button class="menu-item" data-action="edit">
                <span>✏️</span> Editar
            </button>
            <button class="menu-item danger" data-action="delete">
                <span>🗑️</span> Eliminar
            </button>
        `}
    `;

    btn.parentElement.appendChild(menu);

    // Position menu
    const rect = btn.getBoundingClientRect();
    menu.style.top = `${btn.offsetHeight + 5}px`;
    menu.style.right = '0';

    // Handle clicks
    menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMenuAction(item.dataset.action, postId);
            menu.remove();
        });
    });

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Handle menu actions
function handleMenuAction(action, postId) {
    switch (action) {
        case 'copy-link':
            navigator.clipboard.writeText(`${window.location.origin}#/post/${postId}`);
            showToast('Enlace copiado');
            break;

        case 'delete':
            if (confirm('¿Eliminar este post?')) {
                const result = deletePost(postId);
                if (result.success) {
                    document.querySelector(`[data-post-id="${postId}"]`)?.remove();
                    showToast('Post eliminado');
                }
            }
            break;

        case 'report':
            showReportModal(postId);
            break;
    }
}

// Get post by ID helper
function getPostById(postId) {
    const data = localStorage.getItem('cineverso_posts');
    if (!data) return null;
    return JSON.parse(data).posts[postId];
}

// Show comments modal
function showCommentsModal(postId) {
    import('./commentSection.js').then(module => {
        module.showCommentsModal(postId);
    });
}

// Show repost menu
function showRepostMenu(btn, postId) {
    showToast('¡Compartido!');
}

// Share post
function sharePost(postId) {
    if (navigator.share) {
        navigator.share({
            title: 'Post de CineVerso AI',
            url: `${window.location.origin}#/post/${postId}`
        });
    } else {
        navigator.clipboard.writeText(`${window.location.origin}#/post/${postId}`);
        showToast('Enlace copiado');
    }
}

// Show report modal
function showReportModal(postId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'report-modal';

    modal.innerHTML = `
        <div class="modal report-modal">
            <div class="modal-header">
                <h3>⚠️ Reportar este post</h3>
                <button class="modal-close" onclick="document.getElementById('report-modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p>¿Por qué reportas este contenido?</p>
                <div class="report-options">
                    ${['Spam', 'Contenido ofensivo', 'Acoso', 'Información falsa', 'Spoilers sin advertencia', 'Otro'].map(reason => `
                        <label class="report-option">
                            <input type="radio" name="report-reason" value="${reason}">
                            <span>${reason}</span>
                        </label>
                    `).join('')}
                </div>
                <textarea id="report-details" placeholder="Detalles adicionales (opcional)"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="document.getElementById('report-modal').remove()">Cancelar</button>
                <button class="btn-primary" onclick="submitReport('${postId}')">Enviar reporte</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Submit report (dummy)
window.submitReport = function (postId) {
    showToast('Reporte enviado. Gracias por ayudarnos.');
    document.getElementById('report-modal')?.remove();
};

// Show media modal
window.showMediaModal = function (url) {
    const modal = document.createElement('div');
    modal.className = 'media-modal-overlay';
    modal.onclick = () => modal.remove();
    modal.innerHTML = `
        <div class="media-modal">
            <img src="${url}" alt="Imagen">
        </div>
    `;
    document.body.appendChild(modal);
};

// Toast helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
