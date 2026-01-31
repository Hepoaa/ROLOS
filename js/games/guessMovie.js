// ==========================================
// CineVerso AI - Guess Movie Game
// ==========================================

import { getRandomMovie } from '../api/tmdb.js';
import { generateMovieDescription } from '../api/groq.js';
import { updateGameScore, addAchievement } from '../utils/storage.js';

let currentMovie = null;
let score = 0;
let round = 0;
let hintsUsed = 0;
const MAX_ROUNDS = 10;
const TIME_LIMIT = 45;

export async function renderGuessMovieGame() {
    const main = document.getElementById('main');
    score = 0;
    round = 0;

    main.innerHTML = `
        <div class="page games-hub" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-ghost" onclick="window.router.navigate('/minijuegos')" style="margin-bottom: var(--space-6);">
                ← Volver a Minijuegos
            </button>
            <div style="text-align: center;">
                <h1 class="games-title">🎬 ¿Qué Película Soy?</h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-8);">
                    La IA describe películas de forma críptica. ¡Adivina cuál es!
                </p>
            </div>
            <div id="game-container" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-8);">
                <div id="game-content" style="text-align: center;">
                    <button class="btn btn-ai btn-lg" id="start-game">Comenzar Juego</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('start-game')?.addEventListener('click', startRound);
}

async function startRound() {
    if (round >= MAX_ROUNDS) {
        endGame();
        return;
    }

    round++;
    hintsUsed = 0;
    const container = document.getElementById('game-content');

    container.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
            <span>Ronda ${round}/${MAX_ROUNDS}</span>
            <span style="margin-left: var(--space-4);">Puntuación: ${score}</span>
        </div>
        <div class="spinner" style="margin: var(--space-8) auto;"></div>
        <p>Generando descripción...</p>
    `;

    try {
        currentMovie = await getRandomMovie();
        const description = await generateMovieDescription(currentMovie.title, 'normal');

        container.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <span>Ronda ${round}/${MAX_ROUNDS}</span>
                <span style="margin-left: var(--space-4);">Puntuación: ${score}</span>
            </div>
            <div id="timer" style="font-size: var(--text-3xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-4);">${TIME_LIMIT}</div>
            <div style="background: var(--bg-secondary); padding: var(--space-6); border-radius: var(--radius-md); margin-bottom: var(--space-6);">
                <p style="font-size: var(--text-lg); font-style: italic; line-height: 1.8;">"${description}"</p>
            </div>
            <div style="margin-bottom: var(--space-4);">
                <input type="text" class="input" id="guess-input" placeholder="Escribe el nombre de la película..." style="text-align: center; font-size: var(--text-lg);">
            </div>
            <div style="display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-accent" id="submit-guess">Adivinar</button>
                <button class="btn btn-secondary" id="hint-btn">💡 Pista (-5 pts)</button>
                <button class="btn btn-ghost" id="skip-btn">Saltar</button>
            </div>
            <div id="hint-area" style="margin-top: var(--space-4); color: var(--text-secondary);"></div>
        `;

        startTimer();

        document.getElementById('submit-guess')?.addEventListener('click', checkGuess);
        document.getElementById('guess-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkGuess();
        });
        document.getElementById('hint-btn')?.addEventListener('click', showHint);
        document.getElementById('skip-btn')?.addEventListener('click', () => {
            clearInterval(window.gameTimer);
            showAnswer(false);
        });

    } catch (e) {
        container.innerHTML = `
            <p>Error al generar la pregunta. Intenta de nuevo.</p>
            <button class="btn btn-accent" onclick="window.router.navigate('/minijuegos/adivina')">Reintentar</button>
        `;
    }
}

function startTimer() {
    let timeLeft = TIME_LIMIT;
    const timerEl = document.getElementById('timer');

    window.gameTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = timeLeft;
        if (timeLeft <= 10 && timerEl) timerEl.style.color = '#ff4444';
        if (timeLeft <= 0) {
            clearInterval(window.gameTimer);
            showAnswer(false);
        }
    }, 1000);
}

function checkGuess() {
    clearInterval(window.gameTimer);
    const input = document.getElementById('guess-input');
    const guess = input?.value.trim().toLowerCase() || '';
    const answer = currentMovie.title.toLowerCase();

    const isCorrect = guess === answer ||
        answer.includes(guess) ||
        guess.includes(answer) ||
        levenshtein(guess, answer) <= 3;

    if (isCorrect) {
        const points = Math.max(10 - hintsUsed * 5, 5);
        score += points;
        showAnswer(true, points);
    } else {
        showAnswer(false);
    }
}

function showHint() {
    hintsUsed++;
    const hintArea = document.getElementById('hint-area');
    const hints = [
        `Año: ${currentMovie.release_date?.split('-')[0]}`,
        `Primera letra: ${currentMovie.title[0]}`,
        `Longitud del título: ${currentMovie.title.length} caracteres`
    ];

    if (hintsUsed <= hints.length && hintArea) {
        hintArea.innerHTML += `<p>💡 ${hints[hintsUsed - 1]}</p>`;
    }
}

function showAnswer(correct, points = 0) {
    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">${correct ? '🎉' : '😢'}</div>
        <h2 style="color: ${correct ? 'var(--accent-success)' : 'var(--accent-primary)'}; margin-bottom: var(--space-4);">
            ${correct ? `¡Correcto! +${points} puntos` : 'Incorrecto'}
        </h2>
        <p style="font-size: var(--text-xl); margin-bottom: var(--space-6);">La película era: <strong>${currentMovie.title}</strong></p>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">Puntuación actual: ${score}</p>
        <button class="btn btn-ai" id="next-round">${round >= MAX_ROUNDS ? 'Ver Resultados' : 'Siguiente Ronda'}</button>
    `;

    document.getElementById('next-round')?.addEventListener('click', () => {
        if (round >= MAX_ROUNDS) endGame();
        else startRound();
    });
}

function endGame() {
    updateGameScore('guessMovie', score);
    if (score >= 80) addAchievement('cinefilo_experto');

    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">🏆</div>
        <h2 style="margin-bottom: var(--space-4);">¡Juego Terminado!</h2>
        <p style="font-size: var(--text-3xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-6);">
            Puntuación Final: ${score}
        </p>
        <div style="display: flex; gap: var(--space-4); justify-content: center;">
            <button class="btn btn-ai" onclick="window.router.navigate('/minijuegos/adivina')">Jugar de Nuevo</button>
            <button class="btn btn-secondary" onclick="window.router.navigate('/minijuegos')">Volver</button>
        </div>
    `;
}

function levenshtein(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const ind = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + ind);
        }
    }
    return matrix[b.length][a.length];
}

export default { renderGuessMovieGame };
