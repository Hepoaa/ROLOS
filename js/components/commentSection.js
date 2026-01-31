// ============================================
// CineVerso AI - Comment Section Component
// ============================================

import { getCurrentUser, getUserById, createNotification } from '../auth.js';
import { getComments, addComment, likeComment, deleteComment } from '../social.js';
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

// Show comments modal
export function showCommentsModal(postId) {
    const modal = document.createElement('div');
    modal.className = 'comments-modal-overlay';
    modal.id = 'comments-modal';

    modal.innerHTML = `
        <div class="comments-modal">
            <div class="comments-header">
                <h3>💬 Comentarios</h3>
                <button class="modal-close" onclick="document.getElementById('comments-modal').remove()">✕</button>
            </div>
            <div class="comments-body" id="comments-list">
                <div class="loading"><div class="spinner"></div> Cargando comentarios...</div>
            </div>
            <div class="comments-footer" id="comment-composer">
                ${renderCommentComposer(postId)}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Load comments
    loadComments(postId);

    // Setup composer
    setupCommentComposer(modal, postId);
}

// Render comment composer
function renderCommentComposer(postId, parentId = null) {
    const user = getCurrentUser();

    if (!user) {
        return `
            <div class="comment-login-prompt" onclick="window.CineVersoAuth.showAuthModal('login', 'Inicia sesión para comentar')">
                <span>Inicia sesión para comentar</span>
            </div>
        `;
    }

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    return `
        <div class="comment-composer">
            <div class="composer-avatar">${avatar}</div>
            <div class="composer-input-container">
                <textarea 
                    class="comment-input" 
                    id="comment-input${parentId ? `-${parentId}` : ''}"
                    placeholder="${parentId ? 'Escribe una respuesta...' : 'Escribe un comentario...'}"
                    maxlength="500"
                ></textarea>
                <button type="button" class="send-comment-btn" data-post="${postId}" data-parent="${parentId || ''}">
                    Enviar
                </button>
            </div>
        </div>
    `;
}

// Load comments
function loadComments(postId) {
    const container = document.getElementById('comments-list');
    if (!container) return;

    const comments = getComments(postId);

    if (comments.length === 0) {
        container.innerHTML = `
            <div class="no-comments">
                <span class="no-comments-icon">💬</span>
                <p>No hay comentarios aún</p>
                <p class="hint">¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = comments.map(comment => renderComment(comment, postId)).join('');

    setupCommentHandlers(container, postId);
}

// Render a single comment
function renderComment(comment, postId, isReply = false) {
    const author = getUserById(comment.authorId);
    if (!author) return '';

    const currentUser = getCurrentUser();
    const isOwner = currentUser?.id === comment.authorId;
    const isLiked = comment.likedBy?.includes(currentUser?.id);

    const avatar = author.avatar
        ? `<img src="${author.avatar}" alt="${author.displayName}">`
        : `<span style="background: ${author.avatarColor}">${author.displayName.charAt(0).toUpperCase()}</span>`;

    const replies = comment.replies || [];

    return `
        <div class="comment ${isReply ? 'reply' : ''}" data-comment-id="${comment.id}">
            <div class="comment-main">
                <a href="#/perfil/${author.username}" class="comment-avatar">${avatar}</a>
                <div class="comment-content">
                    <div class="comment-header">
                        <a href="#/perfil/${author.username}" class="comment-author">
                            ${author.displayName}
                            ${author.isVerified ? '<span class="verified-badge">✓</span>' : ''}
                        </a>
                        <span class="comment-time">@${author.username} · ${timeAgo(comment.createdAt)}</span>
                    </div>
                    <p class="comment-text">${formatCommentText(comment.content)}</p>
                    <div class="comment-actions">
                        <button type="button" class="comment-action like-comment ${isLiked ? 'liked' : ''}" data-comment="${comment.id}">
                            ❤️ ${comment.likes || 0}
                        </button>
                        <button type="button" class="comment-action reply-btn" data-comment="${comment.id}" data-post="${postId}">
                            Responder
                        </button>
                        ${isOwner ? `
                            <button type="button" class="comment-action delete-comment" data-comment="${comment.id}">
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            ${!isReply && replies.length > 0 ? `
                <div class="comment-replies">
                    ${replies.map(reply => renderComment(reply, postId, true)).join('')}
                </div>
            ` : ''}
            
            <div class="reply-composer-container hidden" id="reply-composer-${comment.id}"></div>
        </div>
    `;
}

// Format comment text
function formatCommentText(text) {
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert mentions to links
    formatted = formatted.replace(/@(\w+)/g, '<a href="#/perfil/$1" class="mention">@$1</a>');

    return formatted;
}

// Setup comment handlers
function setupCommentHandlers(container, postId) {
    // Like comment
    container.querySelectorAll('.like-comment').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) {
                showAuthModal('login', 'Inicia sesión para dar like');
                return;
            }

            const result = likeComment(btn.dataset.comment);
            if (result.success) {
                btn.classList.toggle('liked');
                btn.textContent = `❤️ ${result.likes}`;
            }
        });
    });

    // Reply button
    container.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) {
                showAuthModal('login', 'Inicia sesión para responder');
                return;
            }

            const commentId = btn.dataset.comment;
            const postId = btn.dataset.post;
            const replyContainer = document.getElementById(`reply-composer-${commentId}`);

            if (replyContainer) {
                replyContainer.classList.toggle('hidden');

                if (!replyContainer.innerHTML) {
                    replyContainer.innerHTML = renderCommentComposer(postId, commentId);
                    setupReplyComposer(replyContainer, postId, commentId);
                }

                replyContainer.querySelector('.comment-input')?.focus();
            }
        });
    });

    // Delete comment
    container.querySelectorAll('.delete-comment').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('¿Eliminar este comentario?')) {
                const result = deleteComment(btn.dataset.comment);
                if (result.success) {
                    btn.closest('.comment')?.remove();
                    showToast('Comentario eliminado');

                    // Reload comments
                    loadComments(postId);
                }
            }
        });
    });
}

// Setup comment composer
function setupCommentComposer(modal, postId) {
    const composer = modal.querySelector('.comment-composer');
    if (!composer) return;

    const input = composer.querySelector('.comment-input');
    const sendBtn = composer.querySelector('.send-comment-btn');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = input?.value.trim();
            if (!text) return;

            const result = addComment(postId, text);
            if (result.success) {
                input.value = '';
                loadComments(postId);
                showToast('Comentario añadido');
            } else {
                showToast(result.error || 'Error al comentar', 'error');
            }
        });
    }

    // Enter to send
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn?.click();
            }
        });
    }
}

// Setup reply composer
function setupReplyComposer(container, postId, parentId) {
    const input = container.querySelector('.comment-input');
    const sendBtn = container.querySelector('.send-comment-btn');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = input?.value.trim();
            if (!text) return;

            const result = addComment(postId, text, parentId);
            if (result.success) {
                container.classList.add('hidden');
                container.innerHTML = '';
                loadComments(postId);
                showToast('Respuesta añadida');
            } else {
                showToast(result.error || 'Error al responder', 'error');
            }
        });
    }

    // Enter to send
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn?.click();
            }
        });
    }
}

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
