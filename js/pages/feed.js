// ============================================
// CineVerso AI - Feed Page
// ============================================

import { getCurrentUser, getUserById, getFollowing, followUser, unfollowUser, isFollowing as checkFollowing, getUsers, getNotifications, getUnreadNotificationCount } from '../auth.js';
import { getForYouFeed, getFollowingFeed, getRecentFeed, getTrending, getSavedPosts } from '../social.js';
import { renderPostComposer } from '../components/postComposer.js';
import { renderPostCard, setupPostCardHandlers } from '../components/postCard.js';
import { showAuthModal } from '../components/authModal.js';

let currentTab = 'foryou';
let currentOffset = 0;
const POSTS_PER_PAGE = 10;

// Render feed page
export function renderFeedPage(container) {
    const user = getCurrentUser();

    container.innerHTML = `
        <div class="feed-page">
            <aside class="feed-sidebar-left">
                ${renderLeftSidebar(user)}
            </aside>
            
            <main class="feed-main">
                <div class="feed-header">
                    <h1>🎬 Comunidad</h1>
                </div>
                
                <div class="composer-container" id="feed-composer">
                    <!-- Post composer will be rendered here -->
                </div>
                
                <div class="feed-tabs">
                    <button class="feed-tab active" data-tab="foryou">Para Ti</button>
                    <button class="feed-tab" data-tab="following">Siguiendo</button>
                    <button class="feed-tab" data-tab="recent">Recientes</button>
                </div>
                
                <div class="feed-content" id="feed-posts">
                    <div class="loading"><div class="spinner"></div> Cargando...</div>
                </div>
                
                <div class="load-more-container hidden" id="load-more-container">
                    <button class="load-more-btn" id="load-more-btn">Cargar más</button>
                </div>
            </main>
            
            <aside class="feed-sidebar-right">
                ${renderRightSidebar()}
            </aside>
        </div>
    `;

    // Render composer
    const composerContainer = container.querySelector('#feed-composer');
    if (composerContainer) {
        renderPostComposer(composerContainer, {
            onPost: (post) => {
                loadFeedPosts(container, true);
            }
        });
    }

    // Setup tab handlers
    container.querySelectorAll('.feed-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentTab = tab.dataset.tab;
            currentOffset = 0;

            container.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            loadFeedPosts(container, true);
        });
    });

    // Load initial posts
    loadFeedPosts(container, true);

    // Setup load more button
    const loadMoreBtn = container.querySelector('#load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentOffset += POSTS_PER_PAGE;
            loadFeedPosts(container, false);
        });
    }

    // Setup sidebar handlers
    setupSidebarHandlers(container);
}

// Render left sidebar
function renderLeftSidebar(user) {
    if (!user) {
        return `
            <div class="sidebar-section">
                <div class="login-prompt">
                    <p>Inicia sesión para acceder a todas las funciones</p>
                    <button class="btn-primary" onclick="window.CineVersoAuth.showAuthModal()">
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        `;
    }

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    const unreadCount = getUnreadNotificationCount(user.id);

    return `
        <div class="sidebar-section user-card">
            <a href="/perfil/${user.username}" class="user-card-link" data-link>
                <div class="user-avatar">${avatar}</div>
                <div class="user-info">
                    <span class="user-name">${user.displayName}</span>
                    <span class="user-username">@${user.username}</span>
                </div>
            </a>
        <a href="/perfil/${user.username}" class="view-profile-link" data-link>Ver perfil</a>
        </div>
        
        <nav class="sidebar-nav">
            <a href="/" class="nav-item" data-link>
                <span class="nav-icon">🏠</span>
                <span>Inicio</span>
            </a>
            <a href="/buscar" class="nav-item" data-link>
                <span class="nav-icon">🔍</span>
                <span>Explorar</span>
            </a>
            <a href="/notificaciones" class="nav-item ${unreadCount > 0 ? 'has-badge' : ''}" data-link>
                <span class="nav-icon">🔔</span>
                <span>Notificaciones</span>
                ${unreadCount > 0 ? `<span class="nav-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
            </a>
            <a href="/guardados" class="nav-item" data-link>
                <span class="nav-icon">📌</span>
                <span>Guardados</span>
            </a>
            <a href="/perfil" class="nav-item" data-link>
                <span class="nav-icon">👤</span>
                <span>Perfil</span>
            </a>
        </nav>
        
        <div class="sidebar-section user-lists">
            <h4>Tus Listas</h4>
            <a href="/perfil" class="list-item" data-link onclick="setTimeout(() => document.querySelector('[data-tab=likes]')?.click(), 100)">
                <span>❤️</span>
                <span>Favoritas</span>
            </a>
            <a href="/perfil" class="list-item" data-link onclick="setTimeout(() => document.querySelector('[data-tab=saved]')?.click(), 100)">
                <span>📋</span>
                <span>Por ver</span>
            </a>
        </div>
        
        <div class="sidebar-section user-stats">
            <h4>Estadísticas</h4>
            <div class="stat-item">
                <span class="stat-icon">🎬</span>
                <span>${user.stats?.posts || 0} posts</span>
            </div>
            <div class="stat-item">
                <span class="stat-icon">❤️</span>
                <span>${user.stats?.likes || 0} likes</span>
            </div>
        </div>
    `;
}

// Render right sidebar
function renderRightSidebar() {
    const trending = getTrending(7);
    const suggestions = getSuggestedUsers(5);

    return `
        <div class="sidebar-section trending-section">
            <h3>🔥 Trending</h3>
            <div class="trending-list">
                ${trending.length > 0 ? trending.map((tag, i) => `
                    <a href="/hashtag/${tag.tag}" class="trending-item" data-link>
                        <span class="trending-rank">${i + 1}</span>
                        <div class="trending-info">
                            <span class="trending-tag">#${tag.tag}</span>
                            <span class="trending-count">${tag.count} posts</span>
                        </div>
                    </a>
                `).join('') : `
                    <p class="no-trending">No hay trending aún</p>
                `}
            </div>
        </div>
        
        <div class="sidebar-section suggestions-section">
            <h3>👥 A quién seguir</h3>
            <div class="suggestions-list" id="suggestions-list">
                ${suggestions.length > 0 ? suggestions.map(user => renderUserSuggestion(user)).join('') : `
                    <p class="no-suggestions">No hay sugerencias</p>
                `}
            </div>
            <a href="/buscar" class="show-more-link" data-link>Ver más</a>
        </div>
        
        <div class="sidebar-section top-movies-section">
            <h3>🎬 Top Películas</h3>
            <p class="coming-soon">Próximamente...</p>
        </div>
        
        <div class="sidebar-footer">
            <a href="#">Términos</a> · <a href="#">Privacidad</a>
            <p>© 2024 CineVerso AI</p>
        </div>
    `;
}

// Get suggested users
function getSuggestedUsers(limit = 5) {
    const currentUser = getCurrentUser();
    const usersData = getUsers();

    let users = Object.values(usersData.users);

    // Filter out current user and already following
    if (currentUser) {
        const following = getFollowing(currentUser.id).map(f => f.id);
        users = users.filter(u =>
            u.id !== currentUser.id &&
            !following.includes(u.id)
        );
    }

    // Sort by followers (popularity)
    users.sort((a, b) => (b.stats?.followers || 0) - (a.stats?.followers || 0));

    return users.slice(0, limit);
}

// Render user suggestion card
function renderUserSuggestion(user) {
    const currentUser = getCurrentUser();
    const isFollowingUser = currentUser ? checkFollowing(currentUser.id, user.id) : false;

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    return `
        <div class="suggestion-card" data-user="${user.id}">
            <a href="/perfil/${user.username}" class="suggestion-avatar" data-link>${avatar}</a>
            <div class="suggestion-info">
                <a href="/perfil/${user.username}" class="suggestion-name" data-link>
                    ${user.displayName}
                    ${user.isVerified ? '<span class="verified-badge">✓</span>' : ''}
                </a>
                <span class="suggestion-username">@${user.username}</span>
                <span class="suggestion-bio">${(user.bio || '').substring(0, 50)}${user.bio?.length > 50 ? '...' : ''}</span>
            </div>
            <button class="follow-btn ${isFollowingUser ? 'following' : ''}" data-user="${user.id}">
                ${isFollowingUser ? 'Siguiendo' : 'Seguir'}
            </button>
        </div>
    `;
}

// Load feed posts
function loadFeedPosts(container, reset = false) {
    const postsContainer = container.querySelector('#feed-posts');
    const loadMoreContainer = container.querySelector('#load-more-container');

    if (!postsContainer) return;

    if (reset) {
        currentOffset = 0;
        postsContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
    }

    let posts = [];

    switch (currentTab) {
        case 'foryou':
            posts = getForYouFeed(POSTS_PER_PAGE, currentOffset);
            break;
        case 'following':
            const user = getCurrentUser();
            if (!user) {
                postsContainer.innerHTML = `
                    <div class="feed-empty">
                        <span class="empty-icon">👤</span>
                        <h3>Inicia sesión para ver posts de quienes sigues</h3>
                        <button class="btn-primary" onclick="window.CineVersoAuth.showAuthModal()">
                            Iniciar Sesión
                        </button>
                    </div>
                `;
                loadMoreContainer?.classList.add('hidden');
                return;
            }
            posts = getFollowingFeed(POSTS_PER_PAGE, currentOffset);
            break;
        case 'recent':
            posts = getRecentFeed(POSTS_PER_PAGE, currentOffset);
            break;
    }

    if (posts.length === 0 && reset) {
        postsContainer.innerHTML = `
            <div class="feed-empty">
                <span class="empty-icon">📝</span>
                <h3>No hay posts aún</h3>
                <p>¡Sé el primero en compartir algo!</p>
            </div>
        `;
        loadMoreContainer?.classList.add('hidden');
        return;
    }

    const postsHTML = posts.map(post => renderPostCard(post)).join('');

    if (reset) {
        postsContainer.innerHTML = postsHTML;
    } else {
        postsContainer.insertAdjacentHTML('beforeend', postsHTML);
    }

    // Setup handlers
    setupPostCardHandlers(postsContainer);

    // Show/hide load more
    if (loadMoreContainer) {
        loadMoreContainer.classList.toggle('hidden', posts.length < POSTS_PER_PAGE);
    }
}

// Setup sidebar handlers
function setupSidebarHandlers(container) {
    // Follow buttons
    container.querySelectorAll('.follow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                showAuthModal('login', 'Inicia sesión para seguir usuarios');
                return;
            }

            const targetId = btn.dataset.user;
            const isFollowing = btn.classList.contains('following');

            if (isFollowing) {
                unfollowUser(currentUser.id, targetId);
                btn.classList.remove('following');
                btn.textContent = 'Seguir';
            } else {
                followUser(currentUser.id, targetId);
                btn.classList.add('following');
                btn.textContent = 'Siguiendo';
            }
        });

        // Hover effect for following button
        btn.addEventListener('mouseenter', () => {
            if (btn.classList.contains('following')) {
                btn.textContent = 'Dejar de seguir';
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (btn.classList.contains('following')) {
                btn.textContent = 'Siguiendo';
            }
        });
    });
}

// Render hashtag page
export function renderHashtagPage(container, hashtag) {
    import('../social.js').then(module => {
        const posts = module.getPostsByHashtag(hashtag);

        container.innerHTML = `
            <div class="hashtag-page">
                <div class="hashtag-header">
                    <h1>#${hashtag}</h1>
                    <p>${posts.length} posts</p>
                </div>
                
                <div class="hashtag-tabs">
                    <button class="tab active">Principales</button>
                    <button class="tab">Recientes</button>
                </div>
                
                <div class="hashtag-posts">
                    ${posts.length > 0
                ? posts.map(post => renderPostCard(post)).join('')
                : '<p class="no-posts">No hay posts con este hashtag</p>'
            }
                </div>
            </div>
        `;

        setupPostCardHandlers(container.querySelector('.hashtag-posts'));
    });
}

// Render saved posts page
export function renderSavedPage(container) {
    const user = getCurrentUser();

    if (!user) {
        container.innerHTML = `
            <div class="page-empty">
                <h2>Inicia sesión para ver tus posts guardados</h2>
                <button class="btn-primary" onclick="window.CineVersoAuth.showAuthModal()">
                    Iniciar Sesión
                </button>
            </div>
        `;
        return;
    }

    const posts = getSavedPosts(user.id);

    container.innerHTML = `
        <div class="saved-page">
            <div class="page-header">
                <h1>📌 Guardados</h1>
                <p>${posts.length} posts guardados</p>
            </div>
            
            <div class="saved-posts">
                ${posts.length > 0
            ? posts.map(post => renderPostCard(post)).join('')
            : `
                        <div class="page-empty">
                            <span class="empty-icon">📌</span>
                            <h3>No tienes posts guardados</h3>
                            <p>Guarda posts para verlos después</p>
                        </div>
                    `
        }
            </div>
        </div>
    `;

    setupPostCardHandlers(container.querySelector('.saved-posts'));
}
