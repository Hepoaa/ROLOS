// ==========================================
// CineVerso AI - Home Page
// ==========================================

import { getTrending, getPopularMovies, getTopRatedMovies, getUpcomingMovies, getPopularTV, getTopRatedTV, getAnime, discoverMovies } from '../api/tmdb.js';
import { createHero, initHero } from '../components/hero.js';
import { createCarousel, initCarousels } from '../components/carousel.js';

export async function renderHomePage() {
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="page" id="home-page">
            <div id="hero-container">
                <div class="hero skeleton" style="height: 80vh;"></div>
            </div>
            <div id="carousels-container">
                <div class="section"><div class="carousel"><div class="carousel-track">
                    ${Array(6).fill('<div class="card"><div class="card-poster skeleton" style="aspect-ratio:2/3;width:230px"></div></div>').join('')}
                </div></div></div>
            </div>
        </div>
    `;

    try {
        // Fetch data in parallel
        const [
            trending,
            popularMovies,
            topRatedMovies,
            upcomingMovies,
            popularTV,
            topRatedTV,
            anime,
            actionMovies,
            comedyMovies,
            horrorMovies,
            scifiMovies,
            dramaMovies
        ] = await Promise.all([
            getTrending('all', 'week'),
            getPopularMovies(),
            getTopRatedMovies(),
            getUpcomingMovies(),
            getPopularTV(),
            getTopRatedTV(),
            getAnime(),
            discoverMovies({ genres: '28' }),
            discoverMovies({ genres: '35' }),
            discoverMovies({ genres: '27' }),
            discoverMovies({ genres: '878' }),
            discoverMovies({ genres: '18' })
        ]);

        // Render hero
        const heroContainer = document.getElementById('hero-container');
        heroContainer.innerHTML = createHero(trending.results);
        initHero(trending.results);

        // Render carousels
        const carousels = [
            { title: '🔥 Tendencias de la Semana', items: trending.results, id: 'trending' },
            { title: '🏆 Top 10 en CineVerso', items: popularMovies.results.slice(0, 10), id: 'top10', isTop10: true },
            { title: '🎬 Películas Populares', items: popularMovies.results, id: 'popular-movies', seeAllLink: '/peliculas' },
            { title: '⭐ Mejor Valoradas', items: topRatedMovies.results, id: 'top-rated' },
            { title: '🆕 Próximos Estrenos', items: upcomingMovies.results, id: 'upcoming' },
            { title: '📺 Series del Momento', items: popularTV.results, id: 'popular-tv', seeAllLink: '/series' },
            { title: '🌟 Series Mejor Valoradas', items: topRatedTV.results, id: 'top-rated-tv' },
            { title: '🇯🇵 Anime', items: anime.results, id: 'anime', seeAllLink: '/anime' },
            { title: '💥 Acción', items: actionMovies.results, id: 'action' },
            { title: '😂 Comedia', items: comedyMovies.results, id: 'comedy' },
            { title: '👻 Terror', items: horrorMovies.results, id: 'horror' },
            { title: '🚀 Ciencia Ficción', items: scifiMovies.results, id: 'scifi' },
            { title: '🎭 Drama', items: dramaMovies.results, id: 'drama' }
        ];

        const carouselsContainer = document.getElementById('carousels-container');
        carouselsContainer.innerHTML = carousels.map(c =>
            createCarousel(c.title, c.items, { id: c.id, isTop10: c.isTop10, seeAllLink: c.seeAllLink })
        ).join('');

        initCarousels();

    } catch (error) {
        console.error('Error loading home page:', error);
        main.innerHTML = `
            <div class="page" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; text-align: center; padding: var(--space-8);">
                <p style="font-size: var(--text-xl); margin-bottom: var(--space-4);">😕 Error al cargar el contenido</p>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">Por favor verifica tu conexión e intenta de nuevo</p>
                <button class="btn btn-accent" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}

export default { renderHomePage };
