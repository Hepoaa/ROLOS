// ==========================================
// CineVerso AI - Header Component
// ==========================================

import { $, $$ } from '../utils/helpers.js';
import { State } from '../config.js';
import { getCurrentUser, getUnreadNotificationCount } from '../auth.js';

export function createHeader() {
    const user = getCurrentUser();
    const unreadCount = user ? getUnreadNotificationCount(user.id) : 0;

    // User avatar HTML
    const userSection = user ? `
        <a href="/notificaciones" class="header-notif-btn ${unreadCount > 0 ? 'has-notif' : ''}" data-link title="Notificaciones">
            🔔
            ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
        </a>
        <a href="/perfil" class="header-profile" data-link>
            <div class="avatar">
                ${user.avatar
            ? `<img src="${user.avatar}" alt="${user.displayName}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="width:100%;height:100%;background:${user.avatarColor || 'var(--accent-ai-gradient)'};display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:bold;">${user.displayName.charAt(0).toUpperCase()}</div>`
        }
            </div>
        </a>
    ` : `
        <button class="header-login-btn" id="login-btn">
            Iniciar Sesión
        </button>
    `;

    return `
        <header class="header" id="header">
            <div class="header-left">
                <a href="/" class="header-logo" data-link>
                    <span>🎬</span>
                    <span>CineVerso</span>
                    <span class="text-gradient">AI</span>
                </a>
                <nav class="header-nav">
                    <a href="/" class="header-nav-link" data-link data-page="home">Inicio</a>
                    <a href="/peliculas" class="header-nav-link" data-link data-page="movies">Películas</a>
                    <a href="/series" class="header-nav-link" data-link data-page="series">Series</a>
                    <a href="/anime" class="header-nav-link" data-link data-page="anime">Anime</a>
                    <a href="/comunidad" class="header-nav-link" data-link data-page="feed">Comunidad</a>
                    <a href="/minijuegos" class="header-nav-link" data-link data-page="games">Minijuegos</a>
                </nav>
            </div>
            <div class="header-right">
                <button class="header-search-btn" id="search-trigger" aria-label="Buscar">
                    🔍
                </button>
                ${userSection}
                <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menú">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
        <nav class="mobile-nav" id="mobile-nav">
            <a href="/" class="mobile-nav-link" data-link>Inicio</a>
            <a href="/peliculas" class="mobile-nav-link" data-link>Películas</a>
            <a href="/series" class="mobile-nav-link" data-link>Series</a>
            <a href="/anime" class="mobile-nav-link" data-link>Anime</a>
            <a href="/comunidad" class="mobile-nav-link" data-link>Comunidad</a>
            <a href="/minijuegos" class="mobile-nav-link" data-link>Minijuegos</a>
            ${user ? `<a href="/perfil" class="mobile-nav-link" data-link>Perfil</a>` : `<a href="#" class="mobile-nav-link" id="mobile-login-btn">Iniciar Sesión</a>`}
        </nav>
        <nav class="bottom-nav" id="bottom-nav">
            <div class="bottom-nav-items">
                <a href="/" class="bottom-nav-item" data-link data-page="home">
                    <span class="bottom-nav-icon">🏠</span>
                    <span>Inicio</span>
                </a>
                <a href="/buscar" class="bottom-nav-item" data-link data-page="search">
                    <span class="bottom-nav-icon">🔍</span>
                    <span>Buscar</span>
                </a>
                <a href="/comunidad" class="bottom-nav-item" data-link data-page="feed">
                    <span class="bottom-nav-icon">💬</span>
                    <span>Comunidad</span>
                </a>
                <a href="${user ? '/perfil' : '#'}" class="bottom-nav-item ${user ? '' : 'login-trigger'}" ${user ? 'data-link' : ''} data-page="profile">
                    <span class="bottom-nav-icon">${user ? '👤' : '🔐'}</span>
                    <span>${user ? 'Perfil' : 'Entrar'}</span>
                </a>
            </div>
        </nav>
    `;
}

export function initHeader() {
    const header = $('#header');
    const mobileMenuBtn = $('#mobile-menu-btn');
    const mobileNav = $('#mobile-nav');
    const searchTrigger = $('#search-trigger');
    const loginBtn = $('#login-btn');
    const mobileLoginBtn = $('#mobile-login-btn');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('open');
    });

    // Search trigger
    searchTrigger?.addEventListener('click', () => {
        window.router?.navigate('/buscar');
    });

    // Login button handlers
    const openAuthModal = () => {
        import('./authModal.js').then(module => {
            module.showAuthModal();
        });
    };

    loginBtn?.addEventListener('click', openAuthModal);
    mobileLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        mobileNav?.classList.remove('open');
        mobileMenuBtn?.classList.remove('active');
        openAuthModal();
    });

    // Login trigger for bottom nav
    $$('.login-trigger').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal();
        });
    });

    // Update active nav link
    updateActiveNav();
}

export function updateActiveNav() {
    const currentPath = window.location.pathname;
    $$('.header-nav-link, .bottom-nav-item').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

export default { createHeader, initHeader, updateActiveNav };
