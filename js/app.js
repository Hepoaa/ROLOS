// ==========================================
// CineVerso AI - Main Application
// ==========================================

import { createHeader, initHeader, updateActiveNav } from './components/header.js';
import { createChat, initChat } from './components/chat.js';
import { stopHeroRotation } from './components/hero.js';
import { renderHomePage } from './pages/home.js';
import { renderMoviesPage } from './pages/movies.js';
import { renderSeriesPage } from './pages/series.js';
import { renderAnimePage } from './pages/anime.js';
import { renderDetailPage } from './pages/detail.js';
import { renderSearchPage, cleanupSearchPage } from './pages/search.js';
import { renderGamesPage } from './pages/games.js';
import { renderProfilePage, renderPublicProfilePage } from './pages/profile.js';
import { renderGuessMovieGame } from './games/guessMovie.js';
import { renderEmojiGame } from './games/emojiChallenge.js';
import { renderTriviaGame } from './games/trivia.js';
import { renderDirectorGame } from './games/director.js';
import { scrollToTop } from './utils/helpers.js';
// Social features
import { renderFeedPage, renderHashtagPage, renderSavedPage } from './pages/feed.js';
import { renderNotificationsPage } from './pages/notifications.js';
import { createDemoUsers } from './auth.js';

// Initialize demo users on startup
createDemoUsers();

// Route definitions
const routes = [
    { path: '/', handler: renderHomePage },
    { path: '/peliculas', handler: renderMoviesPage },
    { path: '/series', handler: renderSeriesPage },
    { path: '/anime', handler: renderAnimePage },
    { path: '/buscar', handler: renderSearchPage },
    { path: '/minijuegos', handler: renderGamesPage },
    { path: '/perfil', handler: renderProfilePage },
    { path: '/pelicula/:id', handler: (params) => renderDetailPage('movie', params.id) },
    { path: '/serie/:id', handler: (params) => renderDetailPage('tv', params.id) },
    { path: '/minijuegos/adivina', handler: renderGuessMovieGame },
    { path: '/minijuegos/emoji', handler: renderEmojiGame },
    { path: '/minijuegos/trivia', handler: renderTriviaGame },
    { path: '/minijuegos/director', handler: renderDirectorGame },
    // Social routes - pass the main container
    { path: '/comunidad', handler: () => renderFeedPage(document.getElementById('main')) },
    { path: '/notificaciones', handler: () => renderNotificationsPage(document.getElementById('main')) },
    { path: '/guardados', handler: () => renderSavedPage(document.getElementById('main')) },
    { path: '/hashtag/:tag', handler: (params) => renderHashtagPage(document.getElementById('main'), params.tag) },
    { path: '/perfil/:username', handler: (params) => renderPublicProfilePage(document.getElementById('main'), params.username) }
];

// Router class
class Router {
    constructor(routes) {
        this.routes = routes;
        window.addEventListener('popstate', () => this.handleRoute());
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    async handleRoute() {
        const path = window.location.pathname;

        // Cleanup
        stopHeroRotation();
        cleanupSearchPage();
        window.currentPageContext = null;
        scrollToTop();

        // Find matching route
        for (const route of this.routes) {
            const match = this.matchPath(route.path, path);
            if (match) {
                try {
                    await route.handler(match.params);
                } catch (e) {
                    console.error('Route error:', e);
                    this.renderError();
                }
                updateActiveNav();
                return;
            }
        }

        // 404
        this.render404();
    }

    matchPath(pattern, path) {
        // Handle root path
        if (pattern === '/' && (path === '/' || path === '')) {
            return { params: {} };
        }

        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return { params };
    }

    render404() {
        document.getElementById('main').innerHTML = `
            <div class="page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
                <h1 style="font-size: 6rem; margin-bottom: var(--space-4);">404</h1>
                <p style="font-size: var(--text-xl); margin-bottom: var(--space-6);">Página no encontrada</p>
                <button class="btn btn-accent" onclick="window.router.navigate('/')">Volver al Inicio</button>
            </div>
        `;
    }

    renderError() {
        document.getElementById('main').innerHTML = `
            <div class="page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
                <p style="font-size: var(--text-xl); margin-bottom: var(--space-6);">😕 Algo salió mal</p>
                <button class="btn btn-accent" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}

// Initialize application
async function init() {
    try {
        const app = document.getElementById('app');

        // Render shell
        app.innerHTML = `
            ${createHeader()}
            <main class="main" id="main">
                <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh;">
                    <div class="spinner spinner-lg"></div>
                </div>
            </main>
            ${createChat()}
        `;

        // Initialize components
        initHeader();
        initChat();

        // Set up router
        const router = new Router(routes);
        window.router = router;

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) router.navigate(href);
            }
        });

        // Konami code easter egg
        let konamiSequence = [];
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

        document.addEventListener('keydown', (e) => {
            konamiSequence.push(e.key);
            konamiSequence = konamiSequence.slice(-10);
            if (konamiSequence.join(',') === konamiCode.join(',')) {
                document.body.style.animation = 'rainbow 2s linear infinite';
                createConfetti();
                setTimeout(() => document.body.style.animation = '', 5000);
            }
        });

        // Initial route
        await router.handleRoute();
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('app').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem; color: white; background: #141414;">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">😕 Error al cargar</p>
                <p style="color: #b3b3b3; margin-bottom: 1rem;">${error.message}</p>
                <button onclick="location.reload()" style="background: #E50914; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer;">Reintentar</button>
            </div>
        `;
    }
}

// Confetti effect
function createConfetti() {
    const colors = ['#E50914', '#8B5CF6', '#EC4899', '#46D369', '#F5C518'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            top: -10px;
            left: ${Math.random() * 100}%;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 2px;
            z-index: 9999;
            animation: confetti ${2 + Math.random() * 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Add rainbow animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);
