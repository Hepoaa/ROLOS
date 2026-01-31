// ==========================================
// CineVerso AI - Modal Component
// ==========================================

import { $ } from '../utils/helpers.js';

let activeModal = null;

export function openModal(content, options = {}) {
    const { type = 'default', onClose, width = '800px' } = options;

    closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal';
    modal.style.maxWidth = width;
    modal.innerHTML = `
        <button class="modal-close" aria-label="Cerrar">✕</button>
        <div class="modal-content">${content}</div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Trigger animations
    requestAnimationFrame(() => {
        backdrop.classList.add('active');
        modal.classList.add('active');
    });

    // Close handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(onClose));
    backdrop.addEventListener('click', () => closeModal(onClose));

    // Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') closeModal(onClose);
    };
    document.addEventListener('keydown', escHandler);

    activeModal = { modal, backdrop, escHandler, onClose };
    return modal;
}

export function closeModal(callback) {
    if (!activeModal) return;

    const { modal, backdrop, escHandler } = activeModal;

    modal.classList.remove('active');
    backdrop.classList.remove('active');

    document.removeEventListener('keydown', escHandler);

    setTimeout(() => {
        modal.remove();
        backdrop.remove();
        document.body.style.overflow = '';
        if (callback) callback();
    }, 300);

    activeModal = null;
}

export function openVideoModal(videoKey, title = '') {
    const content = `
        <div style="padding: var(--space-4);">
            <h3 style="margin-bottom: var(--space-4);">${title}</h3>
            <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                <iframe 
                    src="https://www.youtube.com/embed/${videoKey}?autoplay=1" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: var(--radius-md);"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    `;
    return openModal(content, { width: '900px' });
}

export function openConfirmModal(message, onConfirm, onCancel) {
    const content = `
        <div style="padding: var(--space-8); text-align: center;">
            <p style="font-size: var(--text-lg); margin-bottom: var(--space-6);">${message}</p>
            <div style="display: flex; gap: var(--space-4); justify-content: center;">
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-accent" id="modal-confirm">Confirmar</button>
            </div>
        </div>
    `;

    const modal = openModal(content, { width: '400px' });

    modal.querySelector('#modal-cancel').addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    modal.querySelector('#modal-confirm').addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });
}

export default { openModal, closeModal, openVideoModal, openConfirmModal };
