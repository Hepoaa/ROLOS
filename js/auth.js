// ============================================
// CineVerso AI - Authentication System
// ============================================

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Simple hash function (for demo - in production use bcrypt)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
}

// ============================================
// User Management
// ============================================

// Get all users from storage
export function getUsers() {
    const data = localStorage.getItem('cineverso_users');
    return data ? JSON.parse(data) : { users: {}, usernames: {}, emails: {} };
}

// Save users to storage
function saveUsers(usersData) {
    localStorage.setItem('cineverso_users', JSON.stringify(usersData));
}

// Get user by ID
export function getUserById(userId) {
    const data = getUsers();
    return data.users[userId] || null;
}

// Get user by username
export function getUserByUsername(username) {
    const data = getUsers();
    const userId = data.usernames[username.toLowerCase()];
    return userId ? data.users[userId] : null;
}

// Get user by email
export function getUserByEmail(email) {
    const data = getUsers();
    const userId = data.emails[email.toLowerCase()];
    return userId ? data.users[userId] : null;
}

// ============================================
// Registration
// ============================================

// Validate username
export function validateUsername(username) {
    const errors = [];
    if (!username) {
        errors.push('El nombre de usuario es requerido');
    } else {
        if (username.length < 3) errors.push('Mínimo 3 caracteres');
        if (username.length > 20) errors.push('Máximo 20 caracteres');
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Solo letras, números y guiones bajos');
        }
        if (getUserByUsername(username)) {
            errors.push('Este nombre de usuario ya está en uso');
        }
    }
    return { valid: errors.length === 0, errors };
}

// Validate email
export function validateEmail(email) {
    const errors = [];
    if (!email) {
        errors.push('El email es requerido');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Email inválido');
        } else if (getUserByEmail(email)) {
            errors.push('Este email ya está registrado');
        }
    }
    return { valid: errors.length === 0, errors };
}

// Validate password
export function validatePassword(password) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;
    const errors = [];

    if (!checks.length) errors.push('Mínimo 8 caracteres');
    if (!checks.uppercase) errors.push('Al menos una mayúscula');
    if (!checks.lowercase) errors.push('Al menos una minúscula');
    if (!checks.number) errors.push('Al menos un número');

    return {
        valid: strength >= 3,
        strength: strength,
        checks,
        errors
    };
}

// Register new user
export function registerUser({ username, email, password, displayName = '' }) {
    // Validate all fields
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!usernameValidation.valid || !emailValidation.valid || !passwordValidation.valid) {
        return {
            success: false,
            errors: [
                ...usernameValidation.errors,
                ...emailValidation.errors,
                ...passwordValidation.errors
            ]
        };
    }

    // Create user
    const userId = generateUUID();
    const now = new Date().toISOString();

    const user = {
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: simpleHash(password),
        displayName: displayName || username,
        avatar: null,
        avatarColor: getRandomColor(),
        bio: '',
        location: '',
        website: '',
        isVerified: false,
        createdAt: now,
        lastLoginAt: now,
        stats: {
            posts: 0,
            followers: 0,
            following: 0,
            likes: 0
        },
        preferences: {
            favoriteGenres: [],
            notifications: {
                likes: true,
                comments: true,
                follows: true,
                mentions: true
            }
        }
    };

    // Save to storage
    const data = getUsers();
    data.users[userId] = user;
    data.usernames[username.toLowerCase()] = userId;
    data.emails[email.toLowerCase()] = userId;
    saveUsers(data);

    // Initialize follows
    initializeFollows(userId);

    // Create session
    createSession(userId, true);

    return { success: true, user };
}

// Get random avatar color
function getRandomColor() {
    const colors = ['#E50914', '#46D369', '#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6', '#10B981'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================
// Login / Logout
// ============================================

// Login user
export function loginUser(identifier, password, rememberMe = false) {
    // Try to find user by email or username
    let user = getUserByEmail(identifier) || getUserByUsername(identifier);

    if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // Check password
    if (user.password !== simpleHash(password)) {
        return { success: false, error: 'Contraseña incorrecta' };
    }

    // Update last login
    const data = getUsers();
    data.users[user.id].lastLoginAt = new Date().toISOString();
    saveUsers(data);

    // Create session
    createSession(user.id, rememberMe);

    return { success: true, user };
}

// Logout user
export function logoutUser() {
    localStorage.removeItem('cineverso_session');
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
}

// ============================================
// Session Management
// ============================================

// Create session
function createSession(userId, rememberMe) {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));

    const session = {
        token: generateUUID(),
        userId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        rememberMe
    };

    localStorage.setItem('cineverso_session', JSON.stringify(session));

    const user = getUserById(userId);
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
}

// Get current session
export function getSession() {
    const data = localStorage.getItem('cineverso_session');
    if (!data) return null;

    const session = JSON.parse(data);

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem('cineverso_session');
        return null;
    }

    return session;
}

// Get current user
export function getCurrentUser() {
    const session = getSession();
    if (!session) return null;

    return getUserById(session.userId);
}

// Check if user is logged in
export function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ============================================
// Profile Management
// ============================================

// Update user profile
export function updateProfile(userId, updates) {
    const data = getUsers();
    const user = data.users[userId];

    if (!user) return { success: false, error: 'Usuario no encontrado' };

    // Allowed fields to update
    const allowedFields = ['displayName', 'bio', 'location', 'website', 'avatar', 'avatarColor', 'preferences'];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            if (field === 'preferences') {
                user.preferences = { ...user.preferences, ...updates.preferences };
            } else {
                user[field] = updates[field];
            }
        }
    }

    data.users[userId] = user;
    saveUsers(data);

    return { success: true, user };
}

// ============================================
// Follow System
// ============================================

// Initialize follows for user
function initializeFollows(userId) {
    const follows = getFollows();
    if (!follows[userId]) {
        follows[userId] = {
            following: [],
            followers: [],
            blocked: []
        };
        saveFollows(follows);
    }
}

// Get all follows
export function getFollows() {
    const data = localStorage.getItem('cineverso_follows');
    return data ? JSON.parse(data) : {};
}

// Save follows
function saveFollows(follows) {
    localStorage.setItem('cineverso_follows', JSON.stringify(follows));
}

// Follow a user
export function followUser(followerId, targetId) {
    if (followerId === targetId) return { success: false, error: 'No puedes seguirte a ti mismo' };

    const follows = getFollows();

    // Initialize if needed
    if (!follows[followerId]) {
        follows[followerId] = { following: [], followers: [], blocked: [] };
    }
    if (!follows[targetId]) {
        follows[targetId] = { following: [], followers: [], blocked: [] };
    }

    // Check if blocked
    if (follows[targetId].blocked.includes(followerId)) {
        return { success: false, error: 'No puedes seguir a este usuario' };
    }

    // Check if already following
    if (follows[followerId].following.some(f => f.userId === targetId)) {
        return { success: false, error: 'Ya sigues a este usuario' };
    }

    const now = new Date().toISOString();

    // Add to following
    follows[followerId].following.push({
        userId: targetId,
        followedAt: now
    });

    // Add to followers
    follows[targetId].followers.push({
        userId: followerId,
        followedAt: now
    });

    saveFollows(follows);

    // Update stats
    updateUserStats(followerId, 'following', 1);
    updateUserStats(targetId, 'followers', 1);

    // Create notification
    createNotification({
        userId: targetId,
        type: 'follow',
        actorId: followerId,
        targetType: 'user',
        targetId: followerId
    });

    return { success: true };
}

// Unfollow a user
export function unfollowUser(followerId, targetId) {
    const follows = getFollows();

    if (!follows[followerId] || !follows[targetId]) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // Remove from following
    follows[followerId].following = follows[followerId].following.filter(f => f.userId !== targetId);

    // Remove from followers
    follows[targetId].followers = follows[targetId].followers.filter(f => f.userId !== followerId);

    saveFollows(follows);

    // Update stats
    updateUserStats(followerId, 'following', -1);
    updateUserStats(targetId, 'followers', -1);

    return { success: true };
}

// Check if following
export function isFollowing(followerId, targetId) {
    const follows = getFollows();
    if (!follows[followerId]) return false;
    return follows[followerId].following.some(f => f.userId === targetId);
}

// Get followers of a user
export function getFollowers(userId) {
    const follows = getFollows();
    if (!follows[userId]) return [];
    return follows[userId].followers.map(f => ({
        ...getUserById(f.userId),
        followedAt: f.followedAt
    })).filter(Boolean);
}

// Get following of a user
export function getFollowing(userId) {
    const follows = getFollows();
    if (!follows[userId]) return [];
    return follows[userId].following.map(f => ({
        ...getUserById(f.userId),
        followedAt: f.followedAt
    })).filter(Boolean);
}

// Block a user
export function blockUser(userId, targetId) {
    const follows = getFollows();

    if (!follows[userId]) {
        follows[userId] = { following: [], followers: [], blocked: [] };
    }

    // Remove any existing follow relationship
    unfollowUser(userId, targetId);
    unfollowUser(targetId, userId);

    // Add to blocked
    if (!follows[userId].blocked.includes(targetId)) {
        follows[userId].blocked.push(targetId);
    }

    saveFollows(follows);
    return { success: true };
}

// Unblock a user
export function unblockUser(userId, targetId) {
    const follows = getFollows();
    if (!follows[userId]) return { success: true };

    follows[userId].blocked = follows[userId].blocked.filter(id => id !== targetId);
    saveFollows(follows);
    return { success: true };
}

// ============================================
// Stats Management
// ============================================

function updateUserStats(userId, stat, delta) {
    const data = getUsers();
    if (!data.users[userId]) return;

    data.users[userId].stats[stat] = Math.max(0, (data.users[userId].stats[stat] || 0) + delta);
    saveUsers(data);
}

export function incrementUserStat(userId, stat) {
    updateUserStats(userId, stat, 1);
}

export function decrementUserStat(userId, stat) {
    updateUserStats(userId, stat, -1);
}

// ============================================
// Notifications
// ============================================

export function getNotifications(userId) {
    const data = localStorage.getItem('cineverso_notifications');
    const notifications = data ? JSON.parse(data) : {};
    return notifications[userId] || [];
}

function saveNotifications(notifications) {
    localStorage.setItem('cineverso_notifications', JSON.stringify(notifications));
}

export function createNotification({ userId, type, actorId, targetType, targetId, content = {} }) {
    const notifications = localStorage.getItem('cineverso_notifications');
    const data = notifications ? JSON.parse(notifications) : {};

    if (!data[userId]) data[userId] = [];

    // Don't notify yourself
    if (userId === actorId) return;

    const notification = {
        id: generateUUID(),
        type,
        actorId,
        targetType,
        targetId,
        content,
        read: false,
        createdAt: new Date().toISOString()
    };

    // Add at beginning
    data[userId].unshift(notification);

    // Keep only last 100
    data[userId] = data[userId].slice(0, 100);

    saveNotifications(data);

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
}

export function markNotificationRead(userId, notificationId) {
    const data = localStorage.getItem('cineverso_notifications');
    const notifications = data ? JSON.parse(data) : {};

    if (!notifications[userId]) return;

    const notif = notifications[userId].find(n => n.id === notificationId);
    if (notif) {
        notif.read = true;
        saveNotifications(notifications);
    }
}

export function markAllNotificationsRead(userId) {
    const data = localStorage.getItem('cineverso_notifications');
    const notifications = data ? JSON.parse(data) : {};

    if (!notifications[userId]) return;

    notifications[userId].forEach(n => n.read = true);
    saveNotifications(notifications);
}

export function getUnreadNotificationCount(userId) {
    const notifications = getNotifications(userId);
    return notifications.filter(n => !n.read).length;
}

// ============================================
// Demo Users (for testing)
// ============================================

export function createDemoUsers() {
    const existingUsers = getUsers();
    if (Object.keys(existingUsers.users).length > 0) return;

    const demoUsers = [
        {
            username: 'cineverso_oficial',
            email: 'oficial@cineverso.ai',
            password: 'Demo123!',
            displayName: 'CineVerso Oficial',
            bio: '🎬 La cuenta oficial de CineVerso AI. Noticias, estrenos y más.',
            isVerified: true
        },
        {
            username: 'critico_pro',
            email: 'critico@demo.com',
            password: 'Demo123!',
            displayName: 'El Crítico Pro',
            bio: 'Crítico de cine con 15 años de experiencia. Reseñas honestas y sin spoilers.',
            isVerified: true
        },
        {
            username: 'anime_master',
            email: 'anime@demo.com',
            password: 'Demo123!',
            displayName: 'Anime Master',
            bio: '🇯🇵 Todo sobre anime y manga. Recomendaciones semanales.',
            isVerified: false
        }
    ];

    for (const user of demoUsers) {
        const result = registerUser(user);
        if (result.success && user.isVerified) {
            const data = getUsers();
            data.users[result.user.id].isVerified = true;
            data.users[result.user.id].stats = {
                posts: Math.floor(Math.random() * 50) + 10,
                followers: Math.floor(Math.random() * 1000) + 100,
                following: Math.floor(Math.random() * 100) + 20,
                likes: Math.floor(Math.random() * 500) + 50
            };
            saveUsers(data);
        }
    }

    // Logout after creating demo users
    logoutUser();
}

// Initialize demo users on first load
if (typeof window !== 'undefined') {
    createDemoUsers();
}
