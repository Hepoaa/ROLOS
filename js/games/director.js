// ==========================================
// CineVerso AI - Director Game
// ==========================================

import { generateMoviePitch } from '../api/groq.js';
import { getGameScores, updateGameScore } from '../utils/storage.js';

export async function renderDirectorGame() {
    const main = document.getElementById('main');
    const scores = getGameScores();

    main.innerHTML = `
        <div class="page games-hub" style="max-width: 900px; margin: 0 auto;">
            <button class="btn btn-ghost" onclick="window.router.navigate('/minijuegos')" style="margin-bottom: var(--space-6);">
                ← Volver a Minijuegos
            </button>
            <div style="text-align: center;">
                <h1 class="games-title">🎥 Director por un Día</h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-8);">
                    Describe tu idea de película y la IA creará un pitch profesional completo
                </p>
            </div>
            <div id="game-container" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-8);">
                <div id="input-section">
                    <label style="display: block; margin-bottom: var(--space-3); font-weight: var(--font-semibold);">
                        Tu idea de película:
                    </label>
                    <textarea 
                        id="movie-idea" 
                        class="input" 
                        rows="4" 
                        placeholder="Ejemplo: Una comedia romántica donde un chef y una crítica gastronómica se enamoran sin saber sus verdaderas identidades..."
                        style="resize: vertical; margin-bottom: var(--space-6);"
                    ></textarea>
                    <div style="display: flex; gap: var(--space-4); justify-content: center;">
                        <button class="btn btn-ai btn-lg" id="generate-pitch">✨ Generar Pitch</button>
                    </div>
                    <p style="color: var(--text-tertiary); font-size: var(--text-sm); margin-top: var(--space-4); text-align: center;">
                        Pitches creados: ${scores.director?.pitchesCreated || 0}
                    </p>
                </div>
                <div id="pitch-result" style="display: none;"></div>
            </div>
        </div>
    `;

    document.getElementById('generate-pitch')?.addEventListener('click', generatePitch);
}

async function generatePitch() {
    const idea = document.getElementById('movie-idea')?.value.trim();
    if (!idea) {
        alert('Por favor escribe tu idea de película');
        return;
    }

    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('pitch-result');

    inputSection.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner" style="margin: var(--space-8) auto;"></div>
            <p>Generando tu pitch de Hollywood...</p>
            <p style="color: var(--text-tertiary); font-size: var(--text-sm);">Esto puede tomar unos segundos</p>
        </div>
    `;

    try {
        const pitch = await generateMoviePitch(idea);

        // Update score
        const scores = getGameScores();
        scores.director = scores.director || { pitchesCreated: 0 };
        scores.director.pitchesCreated++;
        updateGameScore('director', 0);

        resultSection.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="color: var(--accent-primary); margin-bottom: var(--space-2);">🎬 Tu Pitch de Hollywood</h2>
                <p style="color: var(--text-tertiary); font-size: var(--text-sm);">Basado en: "${idea.substring(0, 50)}..."</p>
            </div>
            <div style="background: var(--bg-secondary); padding: var(--space-6); border-radius: var(--radius-md); white-space: pre-wrap; line-height: 1.8; font-size: var(--text-base); max-height: 500px; overflow-y: auto;">
                ${formatPitch(pitch)}
            </div>
            <div style="display: flex; gap: var(--space-4); justify-content: center; margin-top: var(--space-6);">
                <button class="btn btn-ai" id="new-pitch">Nueva Idea</button>
                <button class="btn btn-secondary" id="copy-pitch">📋 Copiar</button>
            </div>
        `;

        document.getElementById('new-pitch')?.addEventListener('click', () => {
            inputSection.style.display = 'block';
            resultSection.style.display = 'none';
            document.getElementById('movie-idea').value = '';
        });

        document.getElementById('copy-pitch')?.addEventListener('click', () => {
            navigator.clipboard.writeText(pitch);
            alert('Pitch copiado al portapapeles! 📋');
        });

    } catch (e) {
        resultSection.innerHTML = `
            <div style="text-align: center;">
                <p style="font-size: var(--text-xl); margin-bottom: var(--space-4);">😕 Error al generar el pitch</p>
                <button class="btn btn-accent" id="retry-pitch">Reintentar</button>
            </div>
        `;
        document.getElementById('retry-pitch')?.addEventListener('click', generatePitch);
    }
}

function formatPitch(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^(#{1,3})\s*(.*)$/gm, (_, hashes, title) => {
            const size = hashes.length === 1 ? 'var(--text-xl)' : 'var(--text-lg)';
            return `<h3 style="font-size: ${size}; margin: var(--space-4) 0; color: var(--text-primary);">${title}</h3>`;
        })
        .replace(/\n/g, '<br>');
}

export default { renderDirectorGame };
