// ==========================================
// CineVerso AI - LocalStorage Utilities
// ==========================================

import { CONFIG } from '../config.js';

const KEYS = CONFIG.STORAGE_KEYS;

/**
 * Get data from localStorage
 */
export function get(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Storage get error:', e);
        return null;
    }
}

/**
 * Set data in localStorage
 */
export function set(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Storage set error:', e);
        return false;
    }
}

/**
 * Remove data from localStorage
 */
export function remove(key) {
    localStorage.removeItem(key);
}

// === Favorites ===
export function getFavorites() {
    return get(KEYS.FAVORITES) || [];
}

export function addFavorite(item) {
    const favorites = getFavorites();
    if (!favorites.find(f => f.id === item.id && f.type === item.type)) {
        favorites.push({ ...item, addedAt: Date.now() });
        set(KEYS.FAVORITES, favorites);
    }
    return favorites;
}

export function removeFavorite(id, type) {
    const favorites = getFavorites().filter(f => !(f.id === id && f.type === type));
    set(KEYS.FAVORITES, favorites);
    return favorites;
}

export function isFavorite(id, type) {
    return getFavorites().some(f => f.id === id && f.type === type);
}

// === Watchlist ===
export function getWatchlist() {
    return get(KEYS.WATCHLIST) || [];
}

export function addToWatchlist(item) {
    const watchlist = getWatchlist();
    if (!watchlist.find(w => w.id === item.id && w.type === item.type)) {
        watchlist.push({ ...item, addedAt: Date.now() });
        set(KEYS.WATCHLIST, watchlist);
    }
    return watchlist;
}

export function removeFromWatchlist(id, type) {
    const watchlist = getWatchlist().filter(w => !(w.id === id && w.type === type));
    set(KEYS.WATCHLIST, watchlist);
    return watchlist;
}

export function isInWatchlist(id, type) {
    return getWatchlist().some(w => w.id === id && w.type === type);
}

// === History ===
export function getHistory() {
    return get(KEYS.HISTORY) || [];
}

export function addToHistory(item) {
    let history = getHistory();
    history = history.filter(h => !(h.id === item.id && h.type === item.type));
    history.unshift({ ...item, viewedAt: Date.now() });
    if (history.length > 100) history = history.slice(0, 100);
    set(KEYS.HISTORY, history);
    return history;
}

// === User Profile ===
export function getUser() {
    return get(KEYS.USER) || {
        name: 'Cinéfilo',
        avatar: null,
        preferences: { genres: [], theme: 'dark' },
        stats: { moviesWatched: 0, seriesWatched: 0, totalHours: 0 }
    };
}

export function updateUser(data) {
    const user = { ...getUser(), ...data };
    set(KEYS.USER, user);
    return user;
}

// === Games ===
export function getGameScores() {
    return get(KEYS.GAMES) || {
        guessMovie: { highScore: 0, gamesPlayed: 0 },
        emoji: { highScore: 0, gamesPlayed: 0 },
        trivia: { highScore: 0, gamesPlayed: 0 },
        director: { pitchesCreated: 0 },
        achievements: [],
        streak: 0,
        lastPlayed: null
    };
}

export function updateGameScore(game, score) {
    const scores = getGameScores();
    if (!scores[game]) scores[game] = { highScore: 0, gamesPlayed: 0 };
    scores[game].gamesPlayed++;
    if (score > scores[game].highScore) scores[game].highScore = score;
    scores.lastPlayed = Date.now();
    set(KEYS.GAMES, scores);
    return scores;
}

export function addAchievement(achievement) {
    const scores = getGameScores();
    if (!scores.achievements.includes(achievement)) {
        scores.achievements.push(achievement);
        set(KEYS.GAMES, scores);
    }
}

// === Chat History ===
export function getChatHistory() {
    return get(KEYS.CHAT) || [];
}

export function addChatMessage(message) {
    let history = getChatHistory();
    history.push(message);
    if (history.length > 50) history = history.slice(-50);
    set(KEYS.CHAT, history);
    return history;
}

export function clearChatHistory() {
    set(KEYS.CHAT, []);
}

export default {
    get, set, remove,
    getFavorites, addFavorite, removeFavorite, isFavorite,
    getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
    getHistory, addToHistory,
    getUser, updateUser,
    getGameScores, updateGameScore, addAchievement,
    getChatHistory, addChatMessage, clearChatHistory
};
