// ============================================
// CineVerso AI - Auth Modal Component
// ============================================

import { registerUser, loginUser, validateUsername, validateEmail, validatePassword, updateProfile } from '../auth.js';

let currentTab = 'login';
let onboardingStep = 0;
let newUserId = null;

// Show auth modal
export function showAuthModal(defaultTab = 'login', message = '') {
    currentTab = defaultTab;

    const modal = document.createElement('div');
    modal.className = 'auth-modal-overlay';
    modal.id = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal">
            <button class="auth-modal-close" onclick="document.getElementById('auth-modal').remove()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            
            <div class="auth-modal-header">
                <div class="auth-logo">🎬 CINEVERSO AI</div>
                ${message ? `<p class="auth-message">${message}</p>` : ''}
            </div>
            
            <div class="auth-tabs">
                <button class="auth-tab ${currentTab === 'login' ? 'active' : ''}" data-tab="login">
                    Iniciar Sesión
                </button>
                <button class="auth-tab ${currentTab === 'register' ? 'active' : ''}" data-tab="register">
                    Registrarse
                </button>
            </div>
            
            <div class="auth-content" id="auth-content">
                ${currentTab === 'login' ? renderLoginForm() : renderRegisterForm()}
            </div>
            
            <div class="auth-footer">
                <div class="auth-divider">
                    <span>o continúa con</span>
                </div>
                <div class="auth-social-buttons">
                    <button class="auth-social-btn google" disabled title="Próximamente">
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google
                    </button>
                </div>
                <p class="auth-terms">
                    Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y <a href="#">Política de Privacidad</a>
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Switch between login and register tabs
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    const content = document.getElementById('auth-content');
    content.innerHTML = tab === 'login' ? renderLoginForm() : renderRegisterForm();

    // Setup form handlers
    setupFormHandlers();
}

// Render login form
function renderLoginForm() {
    return `
        <form id="login-form" class="auth-form">
            <div class="form-group">
                <label for="login-identifier">
                    <span class="form-icon">📧</span>
                    Email o nombre de usuario
                </label>
                <input type="text" id="login-identifier" name="identifier" required
                    placeholder="tu@email.com o @usuario">
            </div>
            
            <div class="form-group">
                <label for="login-password">
                    <span class="form-icon">🔒</span>
                    Contraseña
                </label>
                <div class="password-input">
                    <input type="password" id="login-password" name="password" required
                        placeholder="Tu contraseña">
                    <button type="button" class="toggle-password" data-target="login-password">
                        👁️
                    </button>
                </div>
            </div>
            
            <div class="form-row">
                <label class="checkbox-label">
                    <input type="checkbox" id="remember-me" name="rememberMe">
                    <span>Recordarme</span>
                </label>
                <a href="#" class="forgot-password">¿Olvidaste tu contraseña?</a>
            </div>
            
            <div id="login-error" class="form-error hidden"></div>
            
            <button type="submit" class="auth-submit-btn">
                INICIAR SESIÓN
            </button>
        </form>
    `;
}

// Render register form
function renderRegisterForm() {
    return `
        <form id="register-form" class="auth-form">
            <div class="form-group">
                <label for="register-username">
                    <span class="form-icon">👤</span>
                    Nombre de usuario
                </label>
                <input type="text" id="register-username" name="username" required
                    placeholder="tu_usuario" maxlength="20">
                <p class="form-hint">3-20 caracteres, solo letras, números y guiones bajos</p>
                <div id="username-validation" class="validation-feedback"></div>
            </div>
            
            <div class="form-group">
                <label for="register-email">
                    <span class="form-icon">📧</span>
                    Email
                </label>
                <input type="email" id="register-email" name="email" required
                    placeholder="tu@email.com">
                <div id="email-validation" class="validation-feedback"></div>
            </div>
            
            <div class="form-group">
                <label for="register-password">
                    <span class="form-icon">🔒</span>
                    Contraseña
                </label>
                <div class="password-input">
                    <input type="password" id="register-password" name="password" required
                        placeholder="Mínimo 8 caracteres" minlength="8">
                    <button type="button" class="toggle-password" data-target="register-password">
                        👁️
                    </button>
                </div>
                <div class="password-strength" id="password-strength">
                    <div class="strength-bar"><div class="strength-fill"></div></div>
                    <span class="strength-text">Seguridad: </span>
                </div>
                <div class="password-checks" id="password-checks"></div>
            </div>
            
            <div class="form-group">
                <label for="register-confirm">
                    <span class="form-icon">🔒</span>
                    Confirmar contraseña
                </label>
                <div class="password-input">
                    <input type="password" id="register-confirm" name="confirmPassword" required
                        placeholder="Repite tu contraseña">
                    <button type="button" class="toggle-password" data-target="register-confirm">
                        👁️
                    </button>
                </div>
                <div id="confirm-validation" class="validation-feedback"></div>
            </div>
            
            <div class="form-checkboxes">
                <label class="checkbox-label">
                    <input type="checkbox" id="accept-terms" name="acceptTerms" required>
                    <span>Acepto los <a href="#">Términos de Servicio</a> y <a href="#">Política de Privacidad</a></span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="accept-emails" name="acceptEmails">
                    <span>Quiero recibir recomendaciones personalizadas por email</span>
                </label>
            </div>
            
            <div id="register-error" class="form-error hidden"></div>
            
            <button type="submit" class="auth-submit-btn">
                CREAR CUENTA
            </button>
        </form>
    `;
}

// Setup form handlers
function setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);

        // Toggle password visibility
        loginForm.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => togglePassword(btn.dataset.target));
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        // Real-time validation
        const usernameInput = document.getElementById('register-username');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const confirmInput = document.getElementById('register-confirm');

        if (usernameInput) {
            usernameInput.addEventListener('input', debounce(() => {
                const result = validateUsername(usernameInput.value);
                showValidation('username', result);
            }, 300));
        }

        if (emailInput) {
            emailInput.addEventListener('input', debounce(() => {
                const result = validateEmail(emailInput.value);
                showValidation('email', result);
            }, 300));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const result = validatePassword(passwordInput.value);
                showPasswordStrength(result);

                // Also check confirm match
                if (confirmInput.value) {
                    showConfirmValidation(passwordInput.value, confirmInput.value);
                }
            });
        }

        if (confirmInput) {
            confirmInput.addEventListener('input', () => {
                showConfirmValidation(passwordInput.value, confirmInput.value);
            });
        }

        // Toggle password visibility
        registerForm.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => togglePassword(btn.dataset.target));
        });
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const identifier = form.identifier.value.trim();
    const password = form.password.value;
    const rememberMe = form.rememberMe?.checked || false;

    const errorDiv = document.getElementById('login-error');
    const submitBtn = form.querySelector('.auth-submit-btn');

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    // Attempt login
    const result = loginUser(identifier, password, rememberMe);

    if (result.success) {
        // Close modal and reload
        document.getElementById('auth-modal')?.remove();
        window.location.reload();
    } else {
        errorDiv.textContent = result.error;
        errorDiv.classList.remove('hidden');

        submitBtn.disabled = false;
        submitBtn.textContent = 'INICIAR SESIÓN';
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    const errorDiv = document.getElementById('register-error');
    const submitBtn = form.querySelector('.auth-submit-btn');

    // Validate
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (!form.acceptTerms.checked) {
        errorDiv.textContent = 'Debes aceptar los términos de servicio';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';

    // Attempt registration
    const result = registerUser({ username, email, password });

    if (result.success) {
        newUserId = result.user.id;
        showOnboarding();
    } else {
        errorDiv.textContent = result.errors.join('. ');
        errorDiv.classList.remove('hidden');

        submitBtn.disabled = false;
        submitBtn.textContent = 'CREAR CUENTA';
    }
}

// Show validation feedback
function showValidation(field, result) {
    const div = document.getElementById(`${field}-validation`);
    if (!div) return;

    if (result.valid) {
        div.innerHTML = '<span class="valid">✓ Disponible</span>';
    } else if (result.errors.length > 0) {
        div.innerHTML = `<span class="invalid">${result.errors[0]}</span>`;
    } else {
        div.innerHTML = '';
    }
}

// Show password strength
function showPasswordStrength(result) {
    const container = document.getElementById('password-strength');
    const checksDiv = document.getElementById('password-checks');
    if (!container || !checksDiv) return;

    const fill = container.querySelector('.strength-fill');
    const text = container.querySelector('.strength-text');

    const strengthLabels = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte'];
    const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#22c55e'];

    fill.style.width = `${(result.strength / 4) * 100}%`;
    fill.style.backgroundColor = strengthColors[result.strength] || '#333';
    text.textContent = `Seguridad: ${strengthLabels[result.strength] || ''}`;

    checksDiv.innerHTML = `
        <span class="${result.checks.length ? 'valid' : 'invalid'}">
            ${result.checks.length ? '✓' : '✗'} Mínimo 8 caracteres
        </span>
        <span class="${result.checks.uppercase ? 'valid' : 'invalid'}">
            ${result.checks.uppercase ? '✓' : '✗'} Una mayúscula
        </span>
        <span class="${result.checks.number ? 'valid' : 'invalid'}">
            ${result.checks.number ? '✓' : '✗'} Un número
        </span>
    `;
}

// Show confirm validation
function showConfirmValidation(password, confirm) {
    const div = document.getElementById('confirm-validation');
    if (!div) return;

    if (confirm.length === 0) {
        div.innerHTML = '';
    } else if (password === confirm) {
        div.innerHTML = '<span class="valid">✓ Las contraseñas coinciden</span>';
    } else {
        div.innerHTML = '<span class="invalid">✗ Las contraseñas no coinciden</span>';
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.type = input.type === 'password' ? 'text' : 'password';
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ============================================
// Onboarding
// ============================================

function showOnboarding() {
    onboardingStep = 1;

    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    const content = modal.querySelector('.auth-modal');
    content.innerHTML = `
        <button class="auth-modal-close" onclick="document.getElementById('auth-modal').remove(); window.location.reload();">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        
        <div class="onboarding-container" id="onboarding-content">
            ${renderOnboardingStep()}
        </div>
    `;
}

function renderOnboardingStep() {
    switch (onboardingStep) {
        case 1:
            return `
                <div class="onboarding-step">
                    <div class="onboarding-progress">
                        <span class="step active">1</span>
                        <span class="step-line"></span>
                        <span class="step">2</span>
                        <span class="step-line"></span>
                        <span class="step">3</span>
                    </div>
                    
                    <h2>Configura tu perfil</h2>
                    <p>Personaliza cómo te verán los demás</p>
                    
                    <div class="avatar-upload">
                        <div class="avatar-preview" id="avatar-preview">
                            <span>📷</span>
                        </div>
                        <input type="file" id="avatar-input" accept="image/*" hidden>
                        <button type="button" class="avatar-upload-btn" onclick="document.getElementById('avatar-input').click()">
                            Subir foto
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label>Nombre para mostrar</label>
                        <input type="text" id="display-name" placeholder="Tu nombre o apodo" maxlength="30">
                    </div>
                    
                    <div class="form-group">
                        <label>Bio (opcional)</label>
                        <textarea id="bio" placeholder="Cuéntanos sobre ti y tu amor por el cine..." maxlength="160"></textarea>
                        <span class="char-count"><span id="bio-count">0</span>/160</span>
                    </div>
                    
                    <div class="onboarding-buttons">
                        <button type="button" class="btn-skip" onclick="window.CineVersoAuth.skipOnboarding()">
                            Omitir
                        </button>
                        <button type="button" class="btn-next" onclick="window.CineVersoAuth.nextOnboardingStep()">
                            Siguiente →
                        </button>
                    </div>
                </div>
            `;

        case 2:
            const genres = [
                { id: 28, name: 'Acción' },
                { id: 12, name: 'Aventura' },
                { id: 16, name: 'Animación' },
                { id: 35, name: 'Comedia' },
                { id: 80, name: 'Crimen' },
                { id: 99, name: 'Documental' },
                { id: 18, name: 'Drama' },
                { id: 10751, name: 'Familia' },
                { id: 14, name: 'Fantasía' },
                { id: 36, name: 'Historia' },
                { id: 27, name: 'Terror' },
                { id: 10402, name: 'Música' },
                { id: 9648, name: 'Misterio' },
                { id: 10749, name: 'Romance' },
                { id: 878, name: 'Ciencia Ficción' },
                { id: 53, name: 'Thriller' },
                { id: 10752, name: 'Guerra' },
                { id: 37, name: 'Western' }
            ];

            return `
                <div class="onboarding-step">
                    <div class="onboarding-progress">
                        <span class="step completed">✓</span>
                        <span class="step-line active"></span>
                        <span class="step active">2</span>
                        <span class="step-line"></span>
                        <span class="step">3</span>
                    </div>
                    
                    <h2>Tus géneros favoritos</h2>
                    <p>Selecciona al menos 3 géneros para personalizar tu experiencia</p>
                    
                    <div class="genre-grid" id="genre-grid">
                        ${genres.map(g => `
                            <button type="button" class="genre-chip" data-id="${g.id}">
                                ${g.name}
                            </button>
                        `).join('')}
                    </div>
                    
                    <p class="genre-count" id="genre-count">0 seleccionados</p>
                    
                    <div class="onboarding-buttons">
                        <button type="button" class="btn-back" onclick="window.CineVersoAuth.prevOnboardingStep()">
                            ← Atrás
                        </button>
                        <button type="button" class="btn-next" id="next-btn" disabled onclick="window.CineVersoAuth.nextOnboardingStep()">
                            Siguiente →
                        </button>
                    </div>
                </div>
            `;

        case 3:
            return `
                <div class="onboarding-step onboarding-complete">
                    <div class="onboarding-confetti">🎉</div>
                    
                    <h2>¡Bienvenido a CineVerso AI!</h2>
                    <p>Tu perfil está configurado. Ahora puedes:</p>
                    
                    <ul class="welcome-features">
                        <li>🎬 Explorar películas y series</li>
                        <li>📝 Compartir tus recomendaciones</li>
                        <li>👥 Conectar con otros cinéfilos</li>
                        <li>🎮 Jugar y ganar logros</li>
                    </ul>
                    
                    <div class="onboarding-buttons final">
                        <button type="button" class="btn-primary" onclick="window.CineVersoAuth.goToFeed()">
                            Explorar Feed
                        </button>
                        <button type="button" class="btn-secondary" onclick="window.CineVersoAuth.goToHome()">
                            Ir a Inicio
                        </button>
                    </div>
                </div>
            `;

        default:
            return '';
    }
}

// Onboarding navigation
function nextOnboardingStep() {
    // Save current step data
    if (onboardingStep === 1) {
        const displayName = document.getElementById('display-name')?.value;
        const bio = document.getElementById('bio')?.value;

        if (displayName || bio) {
            updateProfile(newUserId, { displayName, bio });
        }
    } else if (onboardingStep === 2) {
        const selectedGenres = Array.from(document.querySelectorAll('.genre-chip.selected'))
            .map(btn => parseInt(btn.dataset.id));

        if (selectedGenres.length >= 3) {
            updateProfile(newUserId, {
                preferences: { favoriteGenres: selectedGenres }
            });
        }
    }

    onboardingStep++;

    const content = document.getElementById('onboarding-content');
    if (content) {
        content.innerHTML = renderOnboardingStep();
        setupOnboardingHandlers();
    }
}

function prevOnboardingStep() {
    onboardingStep--;

    const content = document.getElementById('onboarding-content');
    if (content) {
        content.innerHTML = renderOnboardingStep();
        setupOnboardingHandlers();
    }
}

function skipOnboarding() {
    document.getElementById('auth-modal')?.remove();
    window.location.reload();
}

function goToFeed() {
    document.getElementById('auth-modal')?.remove();
    window.location.hash = '#/comunidad';
    window.location.reload();
}

function goToHome() {
    document.getElementById('auth-modal')?.remove();
    window.location.hash = '#/';
    window.location.reload();
}

function setupOnboardingHandlers() {
    // Avatar upload
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }

    // Bio counter
    const bioInput = document.getElementById('bio');
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            document.getElementById('bio-count').textContent = bioInput.value.length;
        });
    }

    // Genre selection
    const genreGrid = document.getElementById('genre-grid');
    if (genreGrid) {
        genreGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('genre-chip')) {
                e.target.classList.toggle('selected');
                updateGenreCount();
            }
        });
    }
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('avatar-preview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;

        // Save avatar
        updateProfile(newUserId, { avatar: event.target.result });
    };
    reader.readAsDataURL(file);
}

function updateGenreCount() {
    const count = document.querySelectorAll('.genre-chip.selected').length;
    const countText = document.getElementById('genre-count');
    const nextBtn = document.getElementById('next-btn');

    if (countText) {
        countText.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
    }

    if (nextBtn) {
        nextBtn.disabled = count < 3;
    }
}

// Export to window for onclick handlers
if (typeof window !== 'undefined') {
    window.CineVersoAuth = {
        showAuthModal,
        nextOnboardingStep,
        prevOnboardingStep,
        skipOnboarding,
        goToFeed,
        goToHome
    };
}
