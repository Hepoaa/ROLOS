// ==========================================
// CineVerso AI - Configuration
// ==========================================

export const CONFIG = {
    // API Keys
    TMDB_API_KEY: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2NjllNmM4Y2U2NmI4ZTA2YWZiNTk3YzQ1YjBjY2Q2MCIsIm5iZiI6MTc2OTEyNzc4Ny45MTYsInN1YiI6IjY5NzJiZjZiNmQxZjUyZDU5ZWFlZGNhNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.AumAr5B8wYn2yWHfMXHjLLakn3Sqa_iFMQdIZX5zF5w',
    GROQ_API_KEY: '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',

    // TMDB Configuration
    TMDB: {
        BASE_URL: 'https://api.themoviedb.org/3',
        IMAGE_BASE: 'https://image.tmdb.org/t/p/',
        SIZES: {
            poster: 'w342',
            posterLarge: 'w500',
            backdrop: 'w1280',
            profile: 'w185'
        }
    },

    // Groq Configuration
    GROQ: {
        API_URL: 'https://api.groq.com/openai/v1/chat/completions',
        MODEL: 'llama-3.3-70b-versatile',
        TEMPERATURE: 0.7,
        MAX_TOKENS: 1024
    },

    // App Settings
    APP: {
        NAME: 'CineVerso AI',
        LANGUAGE: 'es-MX',
        HERO_ROTATION_INTERVAL: 8000,
        CARD_HOVER_DELAY: 300,
        DEBOUNCE_DELAY: 300,
        CACHE_DURATION: 3600000
    },

    // LocalStorage Keys
    STORAGE_KEYS: {
        USER: 'cineverso_user',
        FAVORITES: 'cineverso_favorites',
        WATCHLIST: 'cineverso_watchlist',
        HISTORY: 'cineverso_history',
        GAMES: 'cineverso_games',
        CHAT: 'cineverso_chat',
        CACHE: 'cineverso_cache'
    },

    // Genres
    GENRES: {
        28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
        80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
        14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
        9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
        53: 'Suspenso', 10752: 'Bélica', 37: 'Western'
    }
};

// State management
export const State = {
    genres: {},
    heroItems: [],
    heroIndex: 0,
    heroInterval: null,
    currentPage: 'home'
};

export default CONFIG;
