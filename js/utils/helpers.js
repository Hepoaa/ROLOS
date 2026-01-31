// ==========================================
// CineVerso AI - Helper Utilities
// ==========================================

/**
 * Debounce function execution
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle function execution
 */
export function throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Format runtime to hours and minutes
 */
export function formatRuntime(minutes) {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format year from date
 */
export function getYear(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
}

/**
 * Format rating to one decimal
 */
export function formatRating(rating) {
    if (!rating) return 'N/A';
    return rating.toFixed(1);
}

/**
 * Format large numbers (budget, revenue)
 */
export function formatCurrency(num) {
    if (!num) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
}

/**
 * Generate random ID
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Create element with attributes
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'innerHTML') el.innerHTML = value;
        else if (key === 'textContent') el.textContent = value;
        else if (key.startsWith('on')) el[key.toLowerCase()] = value;
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else el.setAttribute(key, value);
    });
    children.forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child) el.appendChild(child);
    });
    return el;
}

/**
 * Query selector shorthand
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/**
 * Add event listener shorthand
 */
export function on(el, event, handler, options) {
    if (typeof el === 'string') el = $(el);
    if (el) el.addEventListener(event, handler, options);
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
    let container = $('#toast-container');
    if (!container) {
        container = createElement('div', { id: 'toast-container', className: 'toast-container' });
        document.body.appendChild(container);
    }

    const toast = createElement('div', {
        className: `toast toast-${type}`,
        textContent: message
    });

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Simple router helper
 */
export function getRouteParams(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            params[patternParts[i].slice(1)] = pathParts[i];
        }
    }

    return params;
}

/**
 * Check if route matches pattern
 */
export function matchRoute(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    return patternParts.every((part, i) =>
        part.startsWith(':') || part === pathParts[i]
    );
}

/**
 * Scroll to top smoothly
 */
export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Get random item from array
 */
export function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle array
 */
export function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export default {
    debounce, throttle, truncate, formatRuntime, formatDate, getYear,
    formatRating, formatCurrency, generateId, createElement,
    $, $$, on, showToast, getRouteParams, matchRoute, scrollToTop,
    randomItem, shuffle
};
