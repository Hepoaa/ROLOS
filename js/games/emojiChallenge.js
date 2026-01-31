// ==========================================
// CineVerso AI - Emoji Challenge Game
// ==========================================

import { updateGameScore, addAchievement } from '../utils/storage.js';
import { shuffle } from '../utils/helpers.js';

const EMOJI_MOVIES = [
    { emojis: '🦁👑🌍', answer: 'El Rey León', alt: ['the lion king', 'rey leon'] },
    { emojis: '🧙‍♂️💍🌋', answer: 'El Señor de los Anillos', alt: ['lord of the rings'] },
    { emojis: '🚢❄️💔', answer: 'Titanic', alt: ['titanic'] },
    { emojis: '🦇🃏🌃', answer: 'Batman', alt: ['the dark knight', 'caballero oscuro'] },
    { emojis: '👻👻👻🚫', answer: 'Cazafantasmas', alt: ['ghostbusters'] },
    { emojis: '🕷️🧑‍🦱🏙️', answer: 'Spider-Man', alt: ['spiderman', 'hombre araña'] },
    { emojis: '🧊👸❄️⛄', answer: 'Frozen', alt: ['frozen'] },
    { emojis: '🦖🏝️🧬', answer: 'Jurassic Park', alt: ['parque jurasico'] },
    { emojis: '👽🚲🌕', answer: 'E.T.', alt: ['et el extraterrestre'] },
    { emojis: '🤖❤️🌱', answer: 'Wall-E', alt: ['walle'] },
    { emojis: '🧛‍♂️🩸💀', answer: 'Drácula', alt: ['dracula'] },
    { emojis: '🏴‍☠️💀⚓', answer: 'Piratas del Caribe', alt: ['pirates of the caribbean'] },
    { emojis: '🐀👨‍🍳🇫🇷', answer: 'Ratatouille', alt: ['ratatouille'] },
    { emojis: '🤵💣🔫', answer: 'James Bond', alt: ['007', 'bond'] },
    { emojis: '👸🐸💋', answer: 'La Princesa y el Sapo', alt: ['princess and the frog'] },
    { emojis: '🧞‍♂️🪔✨', answer: 'Aladdin', alt: ['aladin'] },
    { emojis: '🦸‍♂️🔨⚡', answer: 'Thor', alt: ['thor'] },
    { emojis: '🏎️⚡🏆', answer: 'Cars', alt: ['cars'] },
    { emojis: '🐠🔍🌊', answer: 'Buscando a Nemo', alt: ['finding nemo'] },
    { emojis: '👨‍🚀🚀🪐', answer: 'Interstellar', alt: ['interestelar'] },
    { emojis: '🧠💭😴', answer: 'Inception', alt: ['origen'] },
    { emojis: '🦇👤🌃', answer: 'El Caballero Oscuro', alt: ['dark knight'] },
    { emojis: '🧪🦎🔬', answer: 'El Hombre Araña', alt: ['spiderman'] },
    { emojis: '🎃👻🎄', answer: 'El Extraño Mundo de Jack', alt: ['nightmare before christmas'] },
    { emojis: '🐢🥷⚔️', answer: 'Las Tortugas Ninja', alt: ['teenage mutant ninja turtles'] }
];

let gameMovies = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let timeLeft = 30;

export async function renderEmojiGame() {
    const main = document.getElementById('main');
    score = 0;
    streak = 0;
    currentIndex = 0;
    gameMovies = shuffle([...EMOJI_MOVIES]).slice(0, 15);

    main.innerHTML = `
        <div class="page games-hub" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-ghost" onclick="window.router.navigate('/minijuegos')" style="margin-bottom: var(--space-6);">
                ← Volver a Minijuegos
            </button>
            <div style="text-align: center;">
                <h1 class="games-title">😎 Emoji Challenge</h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-8);">
                    Adivina la película a partir de los emojis
                </p>
            </div>
            <div id="game-container" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-8);">
                <div id="game-content" style="text-align: center;">
                    <button class="btn btn-ai btn-lg" id="start-game">Comenzar</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('start-game')?.addEventListener('click', showRound);
}

function showRound() {
    if (currentIndex >= gameMovies.length) {
        endGame();
        return;
    }

    const movie = gameMovies[currentIndex];
    timeLeft = 30;

    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
            <span>Ronda ${currentIndex + 1}/${gameMovies.length}</span>
            <span style="margin-left: var(--space-4);">Puntuación: ${score}</span>
            ${streak >= 3 ? `<span style="margin-left: var(--space-4); color: var(--accent-warning);">🔥 Racha x${streak}</span>` : ''}
        </div>
        <div id="timer" style="font-size: var(--text-2xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-4);">${timeLeft}s</div>
        <div style="font-size: 5rem; margin: var(--space-8) 0; letter-spacing: var(--space-2);">
            ${movie.emojis}
        </div>
        <div style="margin-bottom: var(--space-4);">
            <input type="text" class="input" id="emoji-guess" placeholder="¿Qué película es?" style="text-align: center; font-size: var(--text-lg);">
        </div>
        <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-accent" id="submit-emoji">Adivinar</button>
            <button class="btn btn-ghost" id="skip-emoji">Saltar</button>
        </div>
    `;

    startTimer();

    document.getElementById('submit-emoji')?.addEventListener('click', checkAnswer);
    document.getElementById('emoji-guess')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    document.getElementById('skip-emoji')?.addEventListener('click', () => {
        clearInterval(window.emojiTimer);
        streak = 0;
        showResult(false, gameMovies[currentIndex].answer);
    });

    document.getElementById('emoji-guess')?.focus();
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    window.emojiTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 10 && timerEl) timerEl.style.color = '#ff4444';
        if (timeLeft <= 0) {
            clearInterval(window.emojiTimer);
            streak = 0;
            showResult(false, gameMovies[currentIndex].answer);
        }
    }, 1000);
}

function checkAnswer() {
    clearInterval(window.emojiTimer);
    const input = document.getElementById('emoji-guess');
    const guess = input?.value.trim().toLowerCase() || '';
    const movie = gameMovies[currentIndex];
    const correctAnswers = [movie.answer.toLowerCase(), ...movie.alt.map(a => a.toLowerCase())];

    const isCorrect = correctAnswers.some(ans =>
        guess === ans || ans.includes(guess) || guess.includes(ans)
    );

    if (isCorrect) {
        streak++;
        const points = 10 + (streak >= 3 ? streak * 2 : 0);
        score += points;
        showResult(true, movie.answer, points);
    } else {
        streak = 0;
        showResult(false, movie.answer);
    }
}

function showResult(correct, answer, points = 0) {
    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">${correct ? '✅' : '❌'}</div>
        <h2 style="color: ${correct ? 'var(--accent-success)' : 'var(--accent-primary)'}; margin-bottom: var(--space-4);">
            ${correct ? `¡Correcto! +${points} pts` : 'Incorrecto'}
        </h2>
        <p style="font-size: var(--text-xl); margin-bottom: var(--space-6);">Era: <strong>${answer}</strong></p>
        <button class="btn btn-ai" id="next-emoji">Siguiente</button>
    `;

    document.getElementById('next-emoji')?.addEventListener('click', () => {
        currentIndex++;
        showRound();
    });
}

function endGame() {
    updateGameScore('emoji', score);
    if (score >= 100) addAchievement('emoji_master');

    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">🏆</div>
        <h2 style="margin-bottom: var(--space-4);">¡Juego Terminado!</h2>
        <p style="font-size: var(--text-3xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-6);">
            Puntuación: ${score}
        </p>
        <div style="display: flex; gap: var(--space-4); justify-content: center;">
            <button class="btn btn-ai" onclick="window.router.navigate('/minijuegos/emoji')">Jugar de Nuevo</button>
            <button class="btn btn-secondary" onclick="window.router.navigate('/minijuegos')">Volver</button>
        </div>
    `;
}

export default { renderEmojiGame };
