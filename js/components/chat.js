// ==========================================
// CineVerso AI - Chat Component (CineBot)
// ==========================================

import { chat, chatStream } from '../api/groq.js';
import { getChatHistory, addChatMessage, clearChatHistory } from '../utils/storage.js';
import { $ } from '../utils/helpers.js';

let isOpen = false;
let chatHistory = [];

export function createChat() {
    return `
        <div class="chat-container" id="chat-container">
            <button class="chat-btn" id="chat-btn" aria-label="Abrir CineBot">
                🤖
            </button>
            <div class="chat-panel" id="chat-panel">
                <div class="chat-header">
                    <div class="flex items-center gap-4">
                        <div class="search-ai-icon">🤖</div>
                        <div>
                            <strong>CineBot</strong>
                            <div style="font-size: var(--text-xs); color: var(--text-tertiary);">Tu asistente de cine</div>
                        </div>
                    </div>
                    <button id="chat-close" aria-label="Cerrar">✕</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-message chat-message-bot">
                        <div class="chat-message-bubble">
                            ¡Hola! 👋 Soy CineBot, tu asistente personal de cine. Pregúntame sobre películas, series, recomendaciones o cualquier curiosidad cinematográfica.
                        </div>
                    </div>
                </div>
                <div class="chat-suggestions" id="chat-suggestions" style="padding: 0 var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-2);">
                    <button class="tag" data-suggestion="Recomiéndame algo para hoy">🎬 Recomiéndame algo</button>
                    <button class="tag" data-suggestion="¿Qué películas hay de estreno?">🍿 Estrenos</button>
                    <button class="tag" data-suggestion="Explícame el final de Inception">🤔 Explica un final</button>
                </div>
                <div class="chat-input-area">
                    <div class="input-group">
                        <input type="text" class="input" id="chat-input" placeholder="Escribe tu mensaje...">
                        <button class="btn btn-ai" id="chat-send" style="margin-left: var(--space-2); padding: var(--space-3);">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initChat() {
    const btn = $('#chat-btn');
    const panel = $('#chat-panel');
    const closeBtn = $('#chat-close');
    const input = $('#chat-input');
    const sendBtn = $('#chat-send');
    const messages = $('#chat-messages');
    const suggestions = $('#chat-suggestions');

    if (!btn) return;

    // Load history
    chatHistory = getChatHistory();

    // Toggle panel
    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        if (isOpen) input?.focus();
    });

    closeBtn?.addEventListener('click', () => {
        isOpen = false;
        panel.classList.remove('open');
    });

    // Send message
    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        suggestions.style.display = 'none';

        // Add user message
        appendMessage(text, 'user');
        addChatMessage({ role: 'user', content: text });

        // Show typing indicator
        const typingId = showTyping();

        try {
            // Get context (current page info if available)
            const context = window.currentPageContext || null;

            // Stream response
            let botMessage = '';
            const botBubble = appendMessage('', 'bot');

            await chatStream(
                text,
                chatHistory.slice(-10),
                context,
                (chunk, full) => {
                    botMessage = full;
                    botBubble.textContent = full;
                    messages.scrollTop = messages.scrollHeight;
                }
            );

            removeTyping(typingId);
            addChatMessage({ role: 'assistant', content: botMessage });
            chatHistory.push(
                { role: 'user', content: text },
                { role: 'assistant', content: botMessage }
            );

        } catch (e) {
            removeTyping(typingId);
            appendMessage('Lo siento, hubo un error. ¿Puedes intentar de nuevo? 😅', 'bot');
        }
    };

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Suggestions
    suggestions?.addEventListener('click', (e) => {
        const suggestion = e.target.closest('[data-suggestion]');
        if (suggestion) {
            input.value = suggestion.dataset.suggestion;
            sendMessage();
        }
    });
}

function appendMessage(text, type) {
    const messages = $('#chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${type}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-message-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;

    return bubble;
}

function showTyping() {
    const messages = $('#chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message chat-message-bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
    return 'typing-indicator';
}

function removeTyping(id) {
    document.getElementById(id)?.remove();
}

export default { createChat, initChat };
