import { CONFIG, State } from './config.js';

// ==================== TMDB API ====================
export async function fetchTMDB(endpoint) {
    try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${CONFIG.TMDB_BASE}${endpoint}${separator}language=${CONFIG.LANG}`;

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.TMDB_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('fetchTMDB:', error);
        return null;
    }
}

export async function loadGenres() {
    const [movies, tv] = await Promise.all([
        fetchTMDB('/genre/movie/list'),
        fetchTMDB('/genre/tv/list')
    ]);

    if (movies?.genres) {
        movies.genres.forEach(g => State.genres[g.id] = g.name);
    }
    if (tv?.genres) {
        tv.genres.forEach(g => State.genres[g.id] = g.name);
    }
}

// ==================== GROQ API ====================
export async function askGroq(prompt, systemPrompt = '') {
    try {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const res = await fetch(CONFIG.GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                response_format: { type: 'json_object' }
            })
        });

        if (!res.ok) throw new Error(`Groq Error: ${res.status}`);

        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('askGroq:', error);
        return null;
    }
}
