// ==========================================
// CineVerso AI - Games Hub Page
// ==========================================

import { getGameScores } from '../utils/storage.js';

export async function renderGamesPage() {
    const main = document.getElementById('main');
    const scores = getGameScores();

    main.innerHTML = `
        <div class="page games-hub">
            <div class="games-header">
                <h1 class="games-title">🎮 Minijuegos</h1>
                <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
                    Pon a prueba tus conocimientos cinematográficos con juegos impulsados por IA
                </p>
            </div>

            <div class="games-grid">
                <div class="game-card hover-lift" onclick="window.router.navigate('/minijuegos/adivina')">
                    <div class="game-icon">🎬</div>
                    <h3 class="game-title">¿Qué Película Soy?</h3>
                    <p class="game-description">La IA describe películas de forma críptica. ¿Podrás adivinar cuál es?</p>
                    <div style="margin-top: var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm);">
                        Récord: ${scores.guessMovie?.highScore || 0} pts
                    </div>
                </div>

                <div class="game-card hover-lift" onclick="window.router.navigate('/minijuegos/emoji')">
                    <div class="game-icon">😎</div>
                    <h3 class="game-title">Emoji Challenge</h3>
                    <p class="game-description">Películas representadas con emojis. ¿Puedes descifrarlas?</p>
                    <div style="margin-top: var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm);">
                        Récord: ${scores.emoji?.highScore || 0} pts
                    </div>
                </div>

                <div class="game-card hover-lift" onclick="window.router.navigate('/minijuegos/trivia')">
                    <div class="game-icon">🧠</div>
                    <h3 class="game-title">Trivia Cinematográfica</h3>
                    <p class="game-description">Preguntas sobre cine generadas por IA. ¡Demuestra lo que sabes!</p>
                    <div style="margin-top: var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm);">
                        Récord: ${scores.trivia?.highScore || 0} pts
                    </div>
                </div>

                <div class="game-card hover-lift" onclick="window.router.navigate('/minijuegos/director')">
                    <div class="game-icon">🎥</div>
                    <h3 class="game-title">Director por un Día</h3>
                    <p class="game-description">Describe tu idea de película y la IA creará un pitch profesional completo</p>
                    <div style="margin-top: var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm);">
                        Pitches creados: ${scores.director?.pitchesCreated || 0}
                    </div>
                </div>
            </div>

            <div style="margin-top: var(--space-12); text-align: center; padding: var(--space-8); background: var(--bg-card); border-radius: var(--radius-lg); max-width: 600px; margin-left: auto; margin-right: auto;">
                <h3 style="margin-bottom: var(--space-4);">🏆 Tus Estadísticas</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
                    <div>
                        <div style="font-size: var(--text-2xl); font-weight: bold; color: var(--accent-primary);">
                            ${(scores.guessMovie?.gamesPlayed || 0) + (scores.emoji?.gamesPlayed || 0) + (scores.trivia?.gamesPlayed || 0)}
                        </div>
                        <div style="font-size: var(--text-sm); color: var(--text-tertiary);">Partidas jugadas</div>
                    </div>
                    <div>
                        <div style="font-size: var(--text-2xl); font-weight: bold; color: var(--accent-warning);">
                            ${scores.achievements?.length || 0}
                        </div>
                        <div style="font-size: var(--text-sm); color: var(--text-tertiary);">Logros</div>
                    </div>
                    <div>
                        <div style="font-size: var(--text-2xl); font-weight: bold; color: var(--accent-success);">
                            ${Math.max(scores.guessMovie?.highScore || 0, scores.emoji?.highScore || 0, scores.trivia?.highScore || 0)}
                        </div>
                        <div style="font-size: var(--text-sm); color: var(--text-tertiary);">Mejor puntuación</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export default { renderGamesPage };
