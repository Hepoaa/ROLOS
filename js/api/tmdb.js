// ==========================================
// CineVerso AI - TMDB API Service
// ==========================================

import { CONFIG } from '../config.js';

const { TMDB, TMDB_API_KEY } = CONFIG;

// Headers for TMDB API
const headers = {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
};

// Cache for API responses
const cache = new Map();

/**
 * Fetch with caching
 */
async function fetchWithCache(url, cacheKey, duration = CONFIG.APP.CACHE_DURATION) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < duration) {
        return cached.data;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`TMDB Error: ${response.status}`);

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
}

/**
 * Build image URL
 */
export function getImageUrl(path, size = 'poster') {
    if (!path) return null;
    const sizeKey = TMDB.SIZES[size] || TMDB.SIZES.poster;
    return `${TMDB.IMAGE_BASE}${sizeKey}${path}`;
}

/**
 * Get trending content
 */
export async function getTrending(type = 'all', timeWindow = 'week') {
    const url = `${TMDB.BASE_URL}/trending/${type}/${timeWindow}?language=${CONFIG.APP.LANGUAGE}`;
    return fetchWithCache(url, `trending_${type}_${timeWindow}`);
}

/**
 * Get popular movies
 */
export async function getPopularMovies(page = 1) {
    const url = `${TMDB.BASE_URL}/movie/popular?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `popular_movies_${page}`);
}

/**
 * Get top rated movies
 */
export async function getTopRatedMovies(page = 1) {
    const url = `${TMDB.BASE_URL}/movie/top_rated?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `top_rated_movies_${page}`);
}

/**
 * Get upcoming movies
 */
export async function getUpcomingMovies(page = 1) {
    const url = `${TMDB.BASE_URL}/movie/upcoming?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `upcoming_movies_${page}`);
}

/**
 * Get now playing movies
 */
export async function getNowPlayingMovies(page = 1) {
    const url = `${TMDB.BASE_URL}/movie/now_playing?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `now_playing_${page}`);
}

/**
 * Get popular TV shows
 */
export async function getPopularTV(page = 1) {
    const url = `${TMDB.BASE_URL}/tv/popular?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `popular_tv_${page}`);
}

/**
 * Get top rated TV shows
 */
export async function getTopRatedTV(page = 1) {
    const url = `${TMDB.BASE_URL}/tv/top_rated?language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `top_rated_tv_${page}`);
}

/**
 * Get movie details
 */
export async function getMovieDetails(id) {
    const url = `${TMDB.BASE_URL}/movie/${id}?language=${CONFIG.APP.LANGUAGE}&append_to_response=videos,credits,similar,recommendations`;
    return fetchWithCache(url, `movie_${id}`);
}

/**
 * Get TV show details
 */
export async function getTVDetails(id) {
    const url = `${TMDB.BASE_URL}/tv/${id}?language=${CONFIG.APP.LANGUAGE}&append_to_response=videos,credits,similar,recommendations`;
    return fetchWithCache(url, `tv_${id}`);
}

/**
 * Search multi (movies, TV, people)
 */
export async function searchMulti(query, page = 1) {
    const url = `${TMDB.BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=${CONFIG.APP.LANGUAGE}&page=${page}`;
    return fetchWithCache(url, `search_${query}_${page}`, 300000);
}

/**
 * Discover movies with filters
 */
export async function discoverMovies(options = {}) {
    const params = new URLSearchParams({
        language: CONFIG.APP.LANGUAGE,
        sort_by: options.sortBy || 'popularity.desc',
        page: options.page || 1,
        ...(options.genres && { with_genres: options.genres }),
        ...(options.year && { primary_release_year: options.year }),
        ...(options.minRating && { 'vote_average.gte': options.minRating })
    });
    const url = `${TMDB.BASE_URL}/discover/movie?${params}`;
    return fetchWithCache(url, `discover_movie_${params.toString()}`, 300000);
}

/**
 * Discover TV shows with filters
 */
export async function discoverTV(options = {}) {
    const params = new URLSearchParams();
    params.set('language', CONFIG.APP.LANGUAGE);
    params.set('sort_by', options.sort_by || options.sortBy || 'popularity.desc');
    params.set('page', options.page || 1);

    // Optional filters
    if (options.with_genres) params.set('with_genres', options.with_genres);
    if (options.genres) params.set('with_genres', options.genres);
    if (options.year) params.set('first_air_date_year', options.year);
    if (options.with_origin_country) params.set('with_origin_country', options.with_origin_country);
    if (options.with_original_language) params.set('with_original_language', options.with_original_language);
    if (options.vote_average_gte) params.set('vote_average.gte', options.vote_average_gte);
    if (options.vote_count_gte) params.set('vote_count.gte', options.vote_count_gte);

    const url = `${TMDB.BASE_URL}/discover/tv?${params}`;
    return fetchWithCache(url, `discover_tv_${params.toString()}`, 300000);
}

/**
 * Get movies by genre
 */
export async function getMoviesByGenre(genreId, page = 1) {
    return discoverMovies({ genres: genreId, page });
}

/**
 * Get person details
 */
export async function getPersonDetails(id) {
    const url = `${TMDB.BASE_URL}/person/${id}?language=${CONFIG.APP.LANGUAGE}&append_to_response=combined_credits`;
    return fetchWithCache(url, `person_${id}`);
}

/**
 * Get genre list
 */
export async function getGenres(type = 'movie') {
    const url = `${TMDB.BASE_URL}/genre/${type}/list?language=${CONFIG.APP.LANGUAGE}`;
    return fetchWithCache(url, `genres_${type}`);
}

/**
 * Get TV season details (with all episodes)
 */
export async function getTVSeasonDetails(tvId, seasonNumber) {
    const url = `${TMDB.BASE_URL}/tv/${tvId}/season/${seasonNumber}?language=${CONFIG.APP.LANGUAGE}`;
    return fetchWithCache(url, `tv_${tvId}_season_${seasonNumber}`);
}

/**
 * Get all seasons with episodes for a TV show
 */
export async function getAllSeasonsWithEpisodes(tvId, numberOfSeasons) {
    const seasons = [];
    for (let i = 1; i <= numberOfSeasons; i++) {
        try {
            const season = await getTVSeasonDetails(tvId, i);
            seasons.push(season);
        } catch (e) {
            console.warn(`Could not fetch season ${i}`, e);
        }
    }
    return seasons;
}

/**
 * Get episode details
 */
export async function getEpisodeDetails(tvId, seasonNumber, episodeNumber) {
    const url = `${TMDB.BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?language=${CONFIG.APP.LANGUAGE}`;
    return fetchWithCache(url, `tv_${tvId}_s${seasonNumber}_e${episodeNumber}`);
}

/**
 * Get anime (animation genre + Japanese origin)
 */
export async function getAnime(page = 1) {
    const params = new URLSearchParams({
        language: CONFIG.APP.LANGUAGE,
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
        page
    });
    const url = `${TMDB.BASE_URL}/discover/tv?${params}`;
    return fetchWithCache(url, `anime_${page}`);
}

/**
 * Get random movie for games
 */
export async function getRandomMovie(options = {}) {
    const page = Math.floor(Math.random() * 10) + 1;
    const data = await getPopularMovies(page);
    const randomIndex = Math.floor(Math.random() * data.results.length);
    return data.results[randomIndex];
}

export default {
    getImageUrl,
    getTrending,
    getPopularMovies,
    getTopRatedMovies,
    getUpcomingMovies,
    getNowPlayingMovies,
    getPopularTV,
    getTopRatedTV,
    getMovieDetails,
    getTVDetails,
    getTVSeasonDetails,
    getAllSeasonsWithEpisodes,
    getEpisodeDetails,
    searchMulti,
    discoverMovies,
    discoverTV,
    getMoviesByGenre,
    getPersonDetails,
    getGenres,
    getAnime,
    getRandomMovie
};
