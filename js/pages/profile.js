// ==========================================
// CineVerso AI - Profile Page
// ==========================================

import { getUser, updateUser, getFavorites, getWatchlist, getHistory, getGameScores } from '../utils/storage.js';
import { createCard } from '../components/card.js';
import { createCarousel, initCarousels } from '../components/carousel.js';
import { getCurrentUser, getUserByUsername, isFollowing, followUser, unfollowUser, getFollowing, getFollowers, logoutUser } from '../auth.js';
import { getPostsByUser } from '../social.js';
import { renderPostCard, setupPostCardHandlers } from '../components/postCard.js';
import { showAuthModal } from '../components/authModal.js';

export async function renderProfilePage() {
    const main = document.getElementById('main');
    const authUser = getCurrentUser();

    // If user is logged in, show full profile. Otherwise show legacy profile.
    if (authUser) {
        return renderAuthenticatedProfile(main, authUser);
    }

    // Legacy profile for non-authenticated users
    const user = getUser();
    const favorites = getFavorites();
    const watchlist = getWatchlist();
    const history = getHistory();
    const scores = getGameScores();

    const totalGames = (scores.guessMovie?.gamesPlayed || 0) + (scores.emoji?.gamesPlayed || 0) + (scores.trivia?.gamesPlayed || 0);

    main.innerHTML = `
        <div class="page profile-page">
            <div class="profile-header">
                <div class="profile-avatar" style="background: var(--accent-ai-gradient); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                    👤
                </div>
                <div>
                    <h1 class="profile-name">${user.name}</h1>
                    <p style="color: var(--text-secondary);">Miembro de CineVerso AI</p>
                    <button class="btn btn-accent" style="margin-top: var(--space-3);" id="login-prompt-btn">
                        Iniciar Sesión para más funciones
                    </button>
                </div>
            </div>

            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value">${favorites.length}</div>
                    <div class="profile-stat-label">Favoritos</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${watchlist.length}</div>
                    <div class="profile-stat-label">En Mi Lista</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${history.length}</div>
                    <div class="profile-stat-label">Vistos</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${totalGames}</div>
                    <div class="profile-stat-label">Juegos Jugados</div>
                </div>
            </div>

            ${favorites.length ? `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">❤️ Mis Favoritos</h2>
                </div>
                <div class="grid grid-auto-fill" style="gap: var(--space-4);">
                    ${favorites.slice(0, 10).map(f => createCard({
        id: f.id,
        title: f.title,
        poster_path: f.poster_path,
        media_type: f.type
    })).join('')}
                </div>
            </section>
            ` : ''}

            ${watchlist.length ? `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">📋 Mi Lista</h2>
                </div>
                <div class="grid grid-auto-fill" style="gap: var(--space-4);">
                    ${watchlist.slice(0, 10).map(w => createCard({
        id: w.id,
        title: w.title,
        poster_path: w.poster_path,
        media_type: w.type
    })).join('')}
                </div>
            </section>
            ` : ''}

            ${history.length ? `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">📺 Historial Reciente</h2>
                </div>
                <div class="grid grid-auto-fill" style="gap: var(--space-4);">
                    ${history.slice(0, 10).map(h => createCard({
        id: h.id,
        title: h.title,
        poster_path: h.poster_path,
        media_type: h.type
    })).join('')}
                </div>
            </section>
            ` : ''}

            <section class="section" style="max-width: 600px;">
                <h2 class="section-title" style="margin-bottom: var(--space-6);">⚙️ Configuración</h2>
                <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-6);">
                    <div style="margin-bottom: var(--space-6);">
                        <label style="display: block; margin-bottom: var(--space-2); font-weight: var(--font-semibold);">Nombre</label>
                        <input type="text" class="input" id="user-name" value="${user.name}" placeholder="Tu nombre">
                    </div>
                    <button class="btn btn-accent" id="save-profile">Guardar Cambios</button>
                </div>
            </section>
        </div>
    `;

    document.getElementById('save-profile')?.addEventListener('click', () => {
        const name = document.getElementById('user-name').value.trim();
        if (name) {
            updateUser({ name });
            document.querySelector('.profile-name').textContent = name;
            alert('Perfil actualizado! ✅');
        }
    });

    document.getElementById('login-prompt-btn')?.addEventListener('click', () => {
        showAuthModal('login', 'Inicia sesión para acceder a todas las funciones sociales');
    });
}

// Authenticated user profile
async function renderAuthenticatedProfile(main, user) {
    const { getSavedPosts } = await import('../social.js');
    const { getFavorites, getWatchlist } = await import('../utils/storage.js');

    const posts = getPostsByUser(user.id);
    const following = getFollowing(user.id);
    const followers = getFollowers(user.id);
    const savedPosts = getSavedPosts(user.id);
    const favorites = getFavorites();
    const watchlist = getWatchlist();

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    main.innerHTML = `
        <div class="page social-profile-page">
            <div class="profile-banner" style="background: linear-gradient(135deg, rgba(229, 9, 20, 0.3), rgba(147, 51, 234, 0.3));"></div>
            
            <div class="profile-main">
                <div class="profile-info-section">
                    <div class="profile-avatar-large">${avatar}</div>
                    <div class="profile-details">
                        <h1 class="profile-display-name">
                            ${user.displayName}
                            ${user.isVerified ? '<span class="verified-badge">✓</span>' : ''}
                        </h1>
                        <p class="profile-username">@${user.username}</p>
                        ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
                        <p class="profile-joined">📅 Se unió ${new Date(user.createdAt).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    
                    <div class="profile-actions-row">
                        <button class="btn btn-secondary" id="edit-profile-btn">Editar perfil</button>
                        <button class="btn btn-ghost" id="logout-btn">Cerrar sesión</button>
                    </div>
                </div>
                
                <div class="profile-stats-social">
                    <div class="stat-item">
                        <span class="stat-value">${user.stats?.posts || posts.length}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <a href="/perfil/seguidores" class="stat-item" data-link>
                        <span class="stat-value">${followers.length}</span>
                        <span class="stat-label">Seguidores</span>
                    </a>
                    <a href="/perfil/siguiendo" class="stat-item" data-link>
                        <span class="stat-value">${following.length}</span>
                        <span class="stat-label">Siguiendo</span>
                    </a>
                    <div class="stat-item">
                        <span class="stat-value">${user.stats?.likes || 0}</span>
                        <span class="stat-label">Likes</span>
                    </div>
                </div>
                
                <div class="profile-tabs" id="profile-tabs">
                    <button class="profile-tab active" data-tab="posts">📝 Posts</button>
                    <button class="profile-tab" data-tab="likes">❤️ Favoritos</button>
                    <button class="profile-tab" data-tab="saved">📌 Mi Lista</button>
                </div>
                
                <div class="profile-content" id="profile-content">
                    <!-- Content loaded dynamically -->
                </div>
            </div>
        </div>
    `;

    const profileContent = main.querySelector('#profile-content');
    const tabsContainer = main.querySelector('#profile-tabs');

    // Function to render posts
    function renderPostsContent() {
        if (posts.length > 0) {
            profileContent.innerHTML = posts.map(post => renderPostCard(post)).join('');
            setupPostCardHandlers(profileContent);
        } else {
            profileContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>Aún no has publicado nada</p>
                    <a href="/comunidad" class="btn btn-accent" data-link>Ir a Comunidad</a>
                </div>
            `;
        }
    }

    // Function to render favorites/likes (movies)
    function renderLikesContent() {
        if (favorites.length > 0) {
            profileContent.innerHTML = `
                <h3 style="margin-bottom: var(--space-4);">❤️ Mis Películas y Series Favoritas</h3>
                <div class="grid grid-auto-fill" style="gap: var(--space-4);">
                    ${favorites.map(f => createCard({
                id: f.id,
                title: f.title,
                poster_path: f.poster_path,
                media_type: f.type
            })).join('')}
                </div>
            `;
        } else {
            profileContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">❤️</span>
                    <p>No tienes películas favoritas aún</p>
                    <a href="/" class="btn btn-accent" data-link>Explorar contenido</a>
                </div>
            `;
        }
    }

    // Function to render saved/watchlist
    function renderSavedContent() {
        const allSaved = [...watchlist, ...savedPosts.slice(0, 10)];

        if (allSaved.length > 0 || watchlist.length > 0) {
            profileContent.innerHTML = `
                ${watchlist.length > 0 ? `
                    <h3 style="margin-bottom: var(--space-4);">📋 Mi Lista de Películas/Series</h3>
                    <div class="grid grid-auto-fill" style="gap: var(--space-4); margin-bottom: var(--space-8);">
                        ${watchlist.map(w => createCard({
                id: w.id,
                title: w.title,
                poster_path: w.poster_path,
                media_type: w.type
            })).join('')}
                    </div>
                ` : ''}
                
                ${savedPosts.length > 0 ? `
                    <h3 style="margin-bottom: var(--space-4);">📌 Posts Guardados</h3>
                    ${savedPosts.map(post => renderPostCard(post)).join('')}
                ` : ''}
                
                ${allSaved.length === 0 ? `
                    <div class="empty-state">
                        <span class="empty-icon">📌</span>
                        <p>Tu lista está vacía</p>
                        <a href="/" class="btn btn-accent" data-link>Explorar contenido</a>
                    </div>
                ` : ''}
            `;
            setupPostCardHandlers(profileContent);
        } else {
            profileContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📌</span>
                    <p>Tu lista está vacía</p>
                    <a href="/" class="btn btn-accent" data-link>Explorar contenido</a>
                </div>
            `;
        }
    }

    // Initial content
    renderPostsContent();

    // Tab handlers
    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.profile-tab');
        if (!tab) return;

        // Update active state
        tabsContainer.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Render content based on tab
        const tabType = tab.dataset.tab;
        switch (tabType) {
            case 'posts':
                renderPostsContent();
                break;
            case 'likes':
                renderLikesContent();
                break;
            case 'saved':
                renderSavedContent();
                break;
        }
    });

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) {
            logoutUser();
            window.location.reload();
        }
    });

    // Edit profile handler
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        alert('Función de editar perfil próximamente');
    });
}

// Public profile page (for viewing other users)
export async function renderPublicProfilePage(container, username) {
    const user = getUserByUsername(username);
    const currentUser = getCurrentUser();

    if (!user) {
        container.innerHTML = `
            <div class="page-empty">
                <span class="empty-icon">👤</span>
                <h2>Usuario no encontrado</h2>
                <p>El usuario @${username} no existe</p>
                <a href="#/" class="btn btn-accent">Ir a Inicio</a>
            </div>
        `;
        return;
    }

    // If viewing own profile, redirect to profile page
    if (currentUser?.id === user.id) {
        window.location.hash = '#/perfil';
        return;
    }

    const posts = getPostsByUser(user.id);
    const following = getFollowing(user.id);
    const followers = getFollowers(user.id);
    const isFollowingUser = currentUser ? isFollowing(currentUser.id, user.id) : false;

    const avatar = user.avatar
        ? `<img src="${user.avatar}" alt="${user.displayName}">`
        : `<span style="background: ${user.avatarColor}">${user.displayName.charAt(0).toUpperCase()}</span>`;

    container.innerHTML = `
        <div class="page social-profile-page">
            <div class="profile-banner" style="background: linear-gradient(135deg, rgba(229, 9, 20, 0.3), rgba(147, 51, 234, 0.3));"></div>
            
            <div class="profile-main">
                <div class="profile-info-section">
                    <div class="profile-avatar-large">${avatar}</div>
                    <div class="profile-details">
                        <h1 class="profile-display-name">
                            ${user.displayName}
                            ${user.isVerified ? '<span class="verified-badge">✓</span>' : ''}
                        </h1>
                        <p class="profile-username">@${user.username}</p>
                        ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
                        <p class="profile-joined">📅 Se unió ${new Date(user.createdAt).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    
                    <div class="profile-actions-row">
                        <button class="btn ${isFollowingUser ? 'btn-secondary following' : 'btn-accent'}" id="follow-btn" data-user="${user.id}">
                            ${isFollowingUser ? 'Siguiendo' : 'Seguir'}
                        </button>
                    </div>
                </div>
                
                <div class="profile-stats-social">
                    <div class="stat-item">
                        <span class="stat-value">${user.stats?.posts || 0}</span>
                        <span class="stat-label">Posts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${followers.length}</span>
                        <span class="stat-label">Seguidores</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${following.length}</span>
                        <span class="stat-label">Siguiendo</span>
                    </div>
                </div>
                
                <div class="profile-content" id="profile-content">
                    <h3 style="margin-bottom: var(--space-4);">Publicaciones</h3>
                    ${posts.length > 0
            ? posts.map(post => renderPostCard(post)).join('')
            : `<div class="empty-state">
                            <p>Este usuario aún no ha publicado nada</p>
                        </div>`
        }
                </div>
            </div>
        </div>
    `;

    setupPostCardHandlers(container.querySelector('#profile-content'));

    // Follow button handler
    const followBtn = container.querySelector('#follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', () => {
            if (!currentUser) {
                showAuthModal('login', 'Inicia sesión para seguir usuarios');
                return;
            }

            const targetId = followBtn.dataset.user;
            const wasFollowing = followBtn.classList.contains('following');

            if (wasFollowing) {
                unfollowUser(currentUser.id, targetId);
                followBtn.classList.remove('following', 'btn-secondary');
                followBtn.classList.add('btn-accent');
                followBtn.textContent = 'Seguir';
            } else {
                followUser(currentUser.id, targetId);
                followBtn.classList.add('following', 'btn-secondary');
                followBtn.classList.remove('btn-accent');
                followBtn.textContent = 'Siguiendo';
            }
        });

        // Hover effect
        followBtn.addEventListener('mouseenter', () => {
            if (followBtn.classList.contains('following')) {
                followBtn.textContent = 'Dejar de seguir';
            }
        });

        followBtn.addEventListener('mouseleave', () => {
            if (followBtn.classList.contains('following')) {
                followBtn.textContent = 'Siguiendo';
            }
        });
    }
}
