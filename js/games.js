import { CONFIG } from './config.js';
import { askGroq } from './api.js';
import { $, showToast } from './ui.js';

// ==================== GAMES ====================
const GAMES = [
    { id: 'trivia', name: 'Trivia Cinéfila', icon: 'fa-question-circle', desc: 'Pon a prueba tu conocimiento' },
    { id: 'emoji', name: 'Emoji Challenge', icon: 'fa-icons', desc: 'Adivina la película con emojis' },
    { id: 'whoami', name: '¿Qué Película Soy?', icon: 'fa-mask', desc: 'La IA describe, tú adivinas' },
    { id: 'director', name: 'Director Mode', icon: 'fa-film', desc: 'Toma decisiones creativas' },
    { id: 'roulette', name: 'Ruleta del Cine', icon: 'fa-random', desc: 'Deja que el azar decida' },
    { id: 'debate', name: 'Debate con IA', icon: 'fa-comments', desc: 'Discute opiniones polémicas' }
];

export function loadGames() {
    const grid = $('#gamesGrid');
    if (!grid) return;

    grid.innerHTML = GAMES.map(game => `
        <div class="game-card" data-action="game" data-game="${game.id}">
            <i class="fas ${game.icon} game-icon"></i>
            <h3 class="game-title">${game.name}</h3>
            <p class="game-desc">${game.desc}</p>
        </div>
    `).join('');
}

export async function startGame(gameId) {
    const modal = $('#gameModal');
    const content = $('#gameContent');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.innerHTML = '<div class="loader" style="margin: 50px auto;"></div><p style="text-align: center; color: var(--text-muted);">Generando pregunta...</p>';

    let gameData;

    switch (gameId) {
        case 'trivia':
            gameData = await askGroq(
                'Genera una pregunta de trivia sobre cine. Responde en JSON: {"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}',
                'Eres un experto en cine. Solo responde JSON válido.'
            );
            break;

        case 'emoji':
            gameData = await askGroq(
                'Representa una película famosa con 3-5 emojis. JSON: {"emojis": "🦁👑", "options": ["El Rey León", "Madagascar", "La Sirenita", "Tarzan"], "correct": 0}',
                'Eres un experto en cine. Solo responde JSON válido.'
            );
            break;

        case 'whoami':
            gameData = await askGroq(
                'Describe una película famosa en primera persona desde la perspectiva del protagonista sin decir nombres. JSON: {"description": "Soy un...", "options": ["Película A", "Película B", "Película C", "Película D"], "correct": 0}',
                'Eres un experto en cine. Solo responde JSON válido.'
            );
            break;

        default:
            content.innerHTML = `
                <h2 style="margin-bottom: var(--spacing-md);">Próximamente</h2>
                <p style="color: var(--text-muted); margin-bottom: var(--spacing-lg);">Este juego estará disponible pronto.</p>
                <button class="btn btn-secondary" data-action="close-game">Cerrar</button>
            `;
            return;
    }

    if (!gameData) {
        content.innerHTML = `
            <p style="margin-bottom: var(--spacing-lg);">Error al generar pregunta. Intenta de nuevo.</p>
            <button class="btn btn-secondary" data-action="close-game">Cerrar</button>
        `;
        return;
    }

    renderGameQuestion(gameId, gameData);
}

function renderGameQuestion(gameId, data) {
    const content = $('#gameContent');

    let questionHtml = '';
    if (gameId === 'trivia') {
        questionHtml = `<p class="game-question">${data.question}</p>`;
    } else if (gameId === 'emoji') {
        questionHtml = `<div class="game-emoji">${data.emojis}</div>`;
    } else if (gameId === 'whoami') {
        questionHtml = `<p class="game-question" style="font-style: italic;">"${data.description}"</p>`;
    }

    content.innerHTML = `
        <button class="icon-btn" style="position: absolute; top: var(--spacing-md); right: var(--spacing-md);" data-action="close-game">
            <i class="fas fa-times"></i>
        </button>
        ${questionHtml}
        <div class="game-options">
            ${data.options.map((opt, i) => `
                <button class="game-option" data-action="answer" data-index="${i}" data-correct="${data.correct}">
                    <strong>${['A', 'B', 'C', 'D'][i]}.</strong> ${opt}
                </button>
            `).join('')}
        </div>
    `;
}

export function checkAnswer(button) {
    const index = parseInt(button.dataset.index);
    const correct = parseInt(button.dataset.correct);
    const options = button.parentElement.querySelectorAll('.game-option');

    // Disable all options
    options.forEach(opt => opt.disabled = true);

    if (index === correct) {
        button.classList.add('correct');
        showToast('¡Correcto! +100 puntos', 'success');
        fireConfetti();
    } else {
        button.classList.add('wrong');
        options[correct].classList.add('correct');
        showToast('Incorrecto', 'error');
    }

    // Auto-close after 2 seconds
    setTimeout(() => closeGame(), 2000);
}

export function closeGame() {
    $('#gameModal').classList.remove('active');
    document.body.style.overflow = '';
}

function fireConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 50%);
            left: ${Math.random() * 100}vw;
            top: -10px;
            z-index: 10000;
            border-radius: 2px;
            animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Add confetti animation if not exists
if (!document.querySelector('#confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
        @keyframes confetti-fall {
            to { transform: translateY(100vh) rotate(720deg); }
        }
    `;
    document.head.appendChild(style);
}
