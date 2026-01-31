// ============================================
// CineVerso AI - Notifications Page
// ============================================

import { getCurrentUser, getUserById, getNotifications, markNotificationRead, markAllNotificationsRead } from '../auth.js';
import { showAuthModal } from '../components/authModal.js';

// Time ago helper
function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'ahora';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} días`;

    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

// Render notifications page
export function renderNotificationsPage(container) {
    const user = getCurrentUser();

    if (!user) {
        container.innerHTML = `
            <div class="page-empty">
                <span class="empty-icon">🔔</span>
                <h2>Inicia sesión para ver tus notificaciones</h2>
                <button class="btn-primary" onclick="window.CineVersoAuth.showAuthModal()">
                    Iniciar Sesión
                </button>
            </div>
        `;
        return;
    }

    const notifications = getNotifications(user.id);
    const unreadCount = notifications.filter(n => !n.read).length;

    container.innerHTML = `
        <div class="notifications-page">
            <div class="notifications-header">
                <h1>🔔 Notificaciones</h1>
                ${unreadCount > 0 ? `
                    <button class="mark-all-read-btn" id="mark-all-read">
                        Marcar todas como leídas
                    </button>
                ` : ''}
            </div>
            
            <div class="notifications-tabs">
                <button class="notif-tab active" data-filter="all">Todas</button>
                <button class="notif-tab" data-filter="mention">Menciones</button>
                <button class="notif-tab" data-filter="like">Likes</button>
                <button class="notif-tab" data-filter="comment">Comentarios</button>
                <button class="notif-tab" data-filter="follow">Seguidores</button>
            </div>
            
            <div class="notifications-list" id="notifications-list">
                ${notifications.length > 0
            ? renderNotificationsList(notifications)
            : `
                        <div class="notifications-empty">
                            <span class="empty-icon">🔔</span>
                            <h3>No tienes notificaciones</h3>
                            <p>Cuando alguien interactúe contigo, lo verás aquí</p>
                        </div>
                    `
        }
            </div>
        </div>
    `;

    setupNotificationHandlers(container, user.id);
}

// Group notifications by date
function groupNotificationsByDate(notifications) {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    notifications.forEach(notif => {
        const date = new Date(notif.createdAt);
        let group;

        if (date >= today) {
            group = 'Hoy';
        } else if (date >= yesterday) {
            group = 'Ayer';
        } else if (date >= thisWeek) {
            group = 'Esta semana';
        } else {
            group = 'Anteriores';
        }

        if (!groups[group]) groups[group] = [];
        groups[group].push(notif);
    });

    return groups;
}

// Render notifications list
function renderNotificationsList(notifications, filter = 'all') {
    let filtered = notifications;

    if (filter !== 'all') {
        filtered = notifications.filter(n => n.type === filter);
    }

    if (filtered.length === 0) {
        return `
            <div class="notifications-empty">
                <p>No hay notificaciones de este tipo</p>
            </div>
        `;
    }

    const grouped = groupNotificationsByDate(filtered);

    return Object.entries(grouped).map(([group, notifs]) => `
        <div class="notification-group">
            <h3 class="group-title">${group}</h3>
            ${notifs.map(notif => renderNotification(notif)).join('')}
        </div>
    `).join('');
}

// Render single notification
function renderNotification(notification) {
    const actor = getUserById(notification.actorId);
    if (!actor) return '';

    const avatar = actor.avatar
        ? `<img src="${actor.avatar}" alt="${actor.displayName}">`
        : `<span style="background: ${actor.avatarColor}">${actor.displayName.charAt(0).toUpperCase()}</span>`;

    let icon = '';
    let message = '';
    let link = '#';

    switch (notification.type) {
        case 'like':
            icon = '❤️';
            message = 'le gustó tu post';
            link = `#/post/${notification.targetId}`;
            break;
        case 'comment':
            icon = '💬';
            message = 'comentó en tu post';
            link = `#/post/${notification.targetId}`;
            break;
        case 'reply':
            icon = '↩️';
            message = 'respondió a tu comentario';
            link = `#/post/${notification.targetId}`;
            break;
        case 'follow':
            icon = '👤';
            message = 'te empezó a seguir';
            link = `#/perfil/${actor.username}`;
            break;
        case 'mention':
            icon = '@';
            message = 'te mencionó en un post';
            link = `#/post/${notification.targetId}`;
            break;
        case 'repost':
            icon = '🔄';
            message = 'compartió tu post';
            link = `#/post/${notification.targetId}`;
            break;
    }

    const preview = notification.content?.preview
        ? `<p class="notification-preview">"${notification.content.preview}..."</p>`
        : '';

    return `
        <a href="${link}" class="notification-item ${notification.read ? '' : 'unread'}" 
           data-notification="${notification.id}">
            <div class="notification-indicator ${notification.read ? '' : 'active'}"></div>
            <div class="notification-avatar">${avatar}</div>
            <div class="notification-content">
                <p class="notification-text">
                    <span class="notification-icon">${icon}</span>
                    <strong>@${actor.username}</strong> ${message}
                </p>
                ${preview}
                <span class="notification-time">${timeAgo(notification.createdAt)}</span>
            </div>
            ${notification.type === 'follow' ? `
                <button class="notification-action follow-back-btn" data-user="${actor.id}">
                    Seguir
                </button>
            ` : ''}
        </a>
    `;
}

// Setup notification handlers
function setupNotificationHandlers(container, userId) {
    // Tab filters
    container.querySelectorAll('.notif-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const notifications = getNotifications(userId);
            const list = container.querySelector('#notifications-list');
            list.innerHTML = renderNotificationsList(notifications, tab.dataset.filter);

            setupNotificationItemHandlers(container, userId);
        });
    });

    // Mark all read
    const markAllBtn = container.querySelector('#mark-all-read');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            markAllNotificationsRead(userId);

            container.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            container.querySelectorAll('.notification-indicator.active').forEach(ind => {
                ind.classList.remove('active');
            });

            markAllBtn.remove();
        });
    }

    setupNotificationItemHandlers(container, userId);
}

// Setup individual notification handlers
function setupNotificationItemHandlers(container, userId) {
    // Click to mark as read
    container.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('unread')) {
                markNotificationRead(userId, item.dataset.notification);
                item.classList.remove('unread');
                item.querySelector('.notification-indicator')?.classList.remove('active');
            }
        });
    });

    // Follow back buttons
    container.querySelectorAll('.follow-back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            import('../auth.js').then(module => {
                const currentUser = module.getCurrentUser();
                if (!currentUser) return;

                module.followUser(currentUser.id, btn.dataset.user);
                btn.textContent = 'Siguiendo';
                btn.disabled = true;
            });
        });
    });
}
