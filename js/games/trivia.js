// ==========================================
// CineVerso AI - Trivia Game
// ==========================================

import { generateTrivia } from '../api/groq.js';
import { updateGameScore, addAchievement } from '../utils/storage.js';

let score = 0;
let questionNum = 0;
let currentQuestion = null;
const TOTAL_QUESTIONS = 10;
const TIME_LIMIT = 20;

const CATEGORIES = ['Oscar', 'Taquilla', 'Actores', 'Directores', 'Historia del Cine', 'Datos Curiosos'];

export async function renderTriviaGame() {
    const main = document.getElementById('main');
    score = 0;
    questionNum = 0;

    main.innerHTML = `
        <div class="page games-hub" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-ghost" onclick="window.router.navigate('/minijuegos')" style="margin-bottom: var(--space-6);">
                ← Volver a Minijuegos
            </button>
            <div style="text-align: center;">
                <h1 class="games-title">🧠 Trivia Cinematográfica</h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-8);">
                    Preguntas de cine generadas por IA
                </p>
            </div>
            <div id="game-container" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-8);">
                <div id="game-content" style="text-align: center;">
                    <button class="btn btn-ai btn-lg" id="start-trivia">Comenzar</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('start-trivia')?.addEventListener('click', loadQuestion);
}

async function loadQuestion() {
    if (questionNum >= TOTAL_QUESTIONS) {
        endGame();
        return;
    }

    questionNum++;
    const container = document.getElementById('game-content');

    container.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
            <span>Pregunta ${questionNum}/${TOTAL_QUESTIONS}</span>
            <span style="margin-left: var(--space-4);">Puntuación: ${score}</span>
        </div>
        <div class="spinner" style="margin: var(--space-8) auto;"></div>
        <p>Generando pregunta...</p>
    `;

    try {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        currentQuestion = await generateTrivia(category, 'normal');

        if (!currentQuestion || !currentQuestion.question) {
            throw new Error('Invalid question');
        }

        showQuestion();
    } catch (e) {
        container.innerHTML = `
            <p style="margin-bottom: var(--space-4);">Error al generar pregunta</p>
            <button class="btn btn-accent" id="retry-question">Reintentar</button>
            <button class="btn btn-ghost" id="skip-question" style="margin-left: var(--space-4);">Saltar</button>
        `;
        document.getElementById('retry-question')?.addEventListener('click', loadQuestion);
        document.getElementById('skip-question')?.addEventListener('click', loadQuestion);
    }
}

function showQuestion() {
    let timeLeft = TIME_LIMIT;
    const container = document.getElementById('game-content');

    container.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
            <span>Pregunta ${questionNum}/${TOTAL_QUESTIONS}</span>
            <span style="margin-left: var(--space-4);">Puntuación: ${score}</span>
        </div>
        <div id="timer" style="font-size: var(--text-2xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-6);">${timeLeft}s</div>
        <p style="font-size: var(--text-xl); margin-bottom: var(--space-8); line-height: 1.6;">${currentQuestion.question}</p>
        <div id="options" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
            ${currentQuestion.options.map((opt, i) => `
                <button class="btn btn-secondary" data-option="${i}" style="padding: var(--space-4); text-align: left;">
                    ${String.fromCharCode(65 + i)}. ${opt}
                </button>
            `).join('')}
        </div>
    `;

    const timerEl = document.getElementById('timer');
    window.triviaTimer = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 5 && timerEl) timerEl.style.color = '#ff4444';
        if (timeLeft <= 0) {
            clearInterval(window.triviaTimer);
            showAnswer(-1);
        }
    }, 1000);

    document.getElementById('options')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-option]');
        if (!btn) return;
        clearInterval(window.triviaTimer);
        showAnswer(parseInt(btn.dataset.option));
    });
}

function showAnswer(selected) {
    const correct = currentQuestion.correct;
    const isCorrect = selected === correct;

    if (isCorrect) score += 10;

    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">${isCorrect ? '✅' : '❌'}</div>
        <h2 style="color: ${isCorrect ? 'var(--accent-success)' : 'var(--accent-primary)'}; margin-bottom: var(--space-4);">
            ${selected === -1 ? '⏰ Tiempo agotado' : (isCorrect ? '¡Correcto! +10 pts' : 'Incorrecto')}
        </h2>
        <p style="margin-bottom: var(--space-4);">
            Respuesta correcta: <strong>${String.fromCharCode(65 + correct)}. ${currentQuestion.options[correct]}</strong>
        </p>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">${currentQuestion.explanation || ''}</p>
        <button class="btn btn-ai" id="next-question">${questionNum >= TOTAL_QUESTIONS ? 'Ver Resultados' : 'Siguiente'}</button>
    `;

    document.getElementById('next-question')?.addEventListener('click', loadQuestion);
}

function endGame() {
    updateGameScore('trivia', score);
    if (score === 100) addAchievement('trivia_perfecto');

    const container = document.getElementById('game-content');
    container.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">🏆</div>
        <h2 style="margin-bottom: var(--space-4);">¡Juego Terminado!</h2>
        <p style="font-size: var(--text-3xl); font-weight: bold; color: var(--accent-primary); margin-bottom: var(--space-6);">
            Puntuación: ${score}/100
        </p>
        <div style="display: flex; gap: var(--space-4); justify-content: center;">
            <button class="btn btn-ai" onclick="window.router.navigate('/minijuegos/trivia')">Jugar de Nuevo</button>
            <button class="btn btn-secondary" onclick="window.router.navigate('/minijuegos')">Volver</button>
        </div>
    `;
}

export default { renderTriviaGame };
