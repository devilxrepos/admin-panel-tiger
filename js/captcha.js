/**
 * Tiger Admin Panel - reCAPTCHA Integration
 * Handles Google reCAPTCHA v2 verification and security
 */

class ReCaptchaManager {
    constructor() {
        // Configuration
        this.config = {
            // IMPORTANT: Replace with your actual reCAPTCHA site key
            // Get from: https://www.google.com/recaptcha/admin
            siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key (works on localhost)
            
            // Security settings
            maxLoginAttempts: 5,
            blockDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            captchaResetTimeout: 2 * 60 * 1000, // Reset captcha every 2 minutes
            
            // DOM element IDs
            elements: {
                recaptchaContainer: 'recaptcha-container',
                loginButton: 'loginButton',
                loginButtonText: 'loginButtonText',
                loginSpinner: 'loginSpinner',
                captchaError: 'captchaError',
                captchaPending: 'captchaPending',
                captchaVerified: 'captchaVerified',
                loginAttemptWarning: 'loginAttemptWarning',
                attemptMessage: 'attemptMessage',
                loginError: 'loginError',
                togglePassword: 'togglePassword',
                password: 'password',
                email: 'email',
                loginForm: 'loginForm'
            },
            
            // Local storage keys
            storage: {
                attempts: 'tiger_admin_login_attempts',
                timestamp: 'tiger_admin_block_timestamp',
                captchaVerified: 'tiger_admin_captcha_verified'
            }
        };
        
        // State
        this.state = {
            isVerified: false,
            attemptCount: 0,
            isBlocked: false,
            captchaWidgetId: null,
            sessionTimer: null,
            captchaTimer: null,
            remainingTime: this.config.sessionTimeout,
            verificationInProgress: false
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize reCAPTCHA manager
     */
    init() {
        console.log('🔐 Initializing reCAPTCHA Manager...');
        
        // Load stored attempts
        this.loadAttemptState();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if reCAPTCHA is loaded
        this.waitForReCaptcha();
        
        // Start auto-reset timer for captcha
        this.startCaptchaResetTimer();
        
        console.log('✅ reCAPTCHA Manager initialized');
    }
    
    /**
     * Wait for reCAPTCHA API to load
     */
    waitForReCaptcha() {
        if (typeof grecaptcha !== 'undefined') {
            this.renderReCaptcha();
        } else {
            // Check every 500ms until grecaptcha is available
            const checkInterval = setInterval(() => {
                if (typeof grecaptcha !== 'undefined') {
                    clearInterval(checkInterval);
                    this.renderReCaptcha();
                }
            }, 500);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!this.state.captchaWidgetId) {
                    console.error('❌ reCAPTCHA failed to load');
                    this.showError('Security verification failed to load. Please refresh the page.');
                }
            }, 10000);
        }
    }
    
    /**
     * Render reCAPTCHA widget
     */
    renderReCaptcha() {
        try {
            const container = document.getElementById(this.config.elements.recaptchaContainer);
            
            if (!container) {
                console.error('❌ reCAPTCHA container not found');
                return;
            }
            
            // Clear existing content
            container.innerHTML = '';
            
            // Create reCAPTCHA div
            const captchaDiv = document.createElement('div');
            captchaDiv.id = 'g-recaptcha';
            captchaDiv.className = 'g-recaptcha';
            container.appendChild(captchaDiv);
            
            // Render the widget
            this.state.captchaWidgetId = grecaptcha.render('g-recaptcha', {
                'sitekey': this.config.siteKey,
                'callback': this.onCaptchaSuccess.bind(this),
                'expired-callback': this.onCaptchaExpired.bind(this),
                'error-callback': this.onCaptchaError.bind(this),
                'theme': 'light',
                'size': 'normal'
            });
            
            console.log('✅ reCAPTCHA widget rendered');
            
            // Check if already verified in this session
            const wasVerified = sessionStorage.getItem(this.config.storage.captchaVerified);
            if (wasVerified === 'true') {
                this.state.isVerified = true;
                this.updateCaptchaUI(true);
            }
            
        } catch (error) {
            console.error('❌ Error rendering reCAPTCHA:', error);
            this.showError('Failed to load security verification');
        }
    }
    
    /**
     * Handle successful CAPTCHA verification
     */
    onCaptchaSuccess(response) {
        console.log('✅ reCAPTCHA verified successfully');
        
        this.state.isVerified = true;
        this.state.verificationInProgress = false;
        
        // Store verification state
        sessionStorage.setItem(this.config.storage.captchaVerified, 'true');
        
        // Update UI
        this.updateCaptchaUI(true);
        this.enableLoginButton();
        this.hideError();
        
        // Log verification
        this.logSecurityEvent('captcha_verified', 'reCAPTCHA verification successful');
        
        // Auto-reset captcha after timeout
        this.scheduleCaptchaReset();
    }
    
    /**
     * Handle CAPTCHA expiration
     */
    onCaptchaExpired() {
        console.log('⏰ reCAPTCHA expired');
        
        this.state.isVerified = false;
        this.state.verificationInProgress = false;
        
        // Clear session storage
        sessionStorage.removeItem(this.config.storage.captchaVerified);
        
        // Update UI
        this.updateCaptchaUI(false);
        this.disableLoginButton();
        
        // Show expiration message
        this.showCaptchaMessage('Verification expired. Please verify again.', 'warning');
        
        // Log expiration
        this.logSecurityEvent('captcha_expired', 'reCAPTCHA verification expired');
        
        // Clear reset timer
        if (this.state.captchaTimer) {
            clearTimeout(this.state.captchaTimer);
        }
    }
    
    /**
     * Handle CAPTCHA error
     */
    onCaptchaError(error) {
        console.error('❌ reCAPTCHA error:', error);
        
        this.state.isVerified = false;
        this.state.verificationInProgress = false;
        
        // Update UI
        this.updateCaptchaUI(false);
        this.disableLoginButton();
        
        // Show error
        this.showError('Security verification error. Please try again.');
        
        // Log error
        this.logSecurityEvent('captcha_error', 'reCAPTCHA error: ' + error);
        
        // Reset captcha
        setTimeout(() => {
            this.resetCaptcha();
        }, 2000);
    }
    
    /**
     * Update CAPTCHA UI based on verification state
     */
    updateCaptchaUI(verified) {
        const pendingDiv = document.getElementById(this.config.elements.captchaPending);
        const verifiedDiv = document.getElementById(this.config.elements.captchaVerified);
        const loginButton = document.getElementById(this.config.elements.loginButton);
        const loginButtonText = document.getElementById(this.config.elements.loginButtonText);
        
        if (!pendingDiv || !verifiedDiv || !loginButton || !loginButtonText) {
            return;
        }
        
        if (verified) {
            // Show verified state
            pendingDiv.style.display = 'none';
            verifiedDiv.style.display = 'block';
            verifiedDiv.className = 'alert alert-success small mb-0 animate__animated animate__fadeIn';
            
            // Update button
            loginButtonText.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
            loginButton.classList.remove('btn-secondary');
            loginButton.classList.add('btn-primary');
            
        } else {
            // Show pending state
            pendingDiv.style.display = 'block';
            verifiedDiv.style.display = 'none';
            pendingDiv.className = 'alert alert-info small mb-0 animate__animated animate__fadeIn';
            
            // Update button
            loginButtonText.innerHTML = '<i class="bi bi-shield-lock me-2"></i>Complete CAPTCHA to Login';
            loginButton.classList.add('btn-secondary');
            loginButton.classList.remove('btn-primary');
        }
    }
    
    /**
     * Enable login button
     */
    enableLoginButton() {
        const loginButton = document.getElementById(this.config.elements.loginButton);
        
        if (!loginButton) return;
        
        if (this.state.isVerified && !this.state.isBlocked) {
            loginButton.disabled = false;
            loginButton.title = 'Click to login';
        }
    }
    
    /**
     * Disable login button
     */
    disableLoginButton() {
        const loginButton = document.getElementById(this.config.elements.loginButton);
        
        if (!loginButton) return;
        
        loginButton.disabled = true;
        loginButton.title = 'Please complete CAPTCHA verification first';
    }
    
    /**
     * Reset CAPTCHA widget
     */
    resetCaptcha() {
        if (this.state.captchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
            try {
                grecaptcha.reset(this.state.captchaWidgetId);
                console.log('🔄 reCAPTCHA reset');
            } catch (error) {
                console.error('❌ Error resetting reCAPTCHA:', error);
            }
        }
        
        this.state.isVerified = false;
        this.state.verificationInProgress = false;
        sessionStorage.removeItem(this.config.storage.captchaVerified);
        this.updateCaptchaUI(false);
        this.disableLoginButton();
    }
    
    /**
     * Schedule automatic CAPTCHA reset
     */
    scheduleCaptchaReset() {
        // Clear existing timer
        if (this.state.captchaTimer) {
            clearTimeout(this.state.captchaTimer);
        }
        
        // Set new timer
        this.state.captchaTimer = setTimeout(() => {
            console.log('⏰ Auto-resetting CAPTCHA');
            this.resetCaptcha();
        }, this.config.captchaResetTimeout);
    }
    
    /**
     * Start periodic CAPTCHA reset timer
     */
    startCaptchaResetTimer() {
        // Reset captcha every 2 minutes for security
        setInterval(() => {
            if (this.state.isVerified) {
                console.log('🔄 Security reset of CAPTCHA');
                this.resetCaptcha();
            }
        }, this.config.captchaResetTimeout);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Password toggle
        const toggleBtn = document.getElementById(this.config.elements.togglePassword);
        const passwordInput = document.getElementById(this.config.elements.password);
        
        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
                }
                
                // Log password visibility toggle
                this.logSecurityEvent('password_toggle', 'Password visibility toggled');
            });
        }
        
        // Form submission
        const loginForm = document.getElementById(this.config.elements.loginForm);
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
        
        // Prevent multiple submissions
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement?.tagName === 'INPUT') {
                const loginButton = document.getElementById(this.config.elements.loginButton);
                if (loginButton?.disabled) {
                    e.preventDefault();
                }
            }
        });
    }
    
    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();
        
        // Prevent double submission
        if (this.state.verificationInProgress) {
            return;
        }
        
        // Validate CAPTCHA
        if (!this.state.isVerified) {
            this.showCaptchaError('Please complete the CAPTCHA verification');
            return;
        }
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Set verification flag
        this.state.verificationInProgress = true;
        
        // Show loading state
        this.showLoadingState();
        
        // Get form data
        const email = document.getElementById(this.config.elements.email).value.trim();
        const password = document.getElementById(this.config.elements.password).value;
        
        // Log attempt
        this.logSecurityEvent('login_attempt', `Login attempt for: ${email}`);
        
        // Dispatch custom event for admin.js to handle
        const loginEvent = new CustomEvent('tiger:login', {
            detail: {
                email: email,
                password: password,
                captchaResponse: grecaptcha.getResponse(this.state.captchaWidgetId)
            }
        });
        
        document.dispatchEvent(loginEvent);
        
        // Reset captcha after submission
        setTimeout(() => {
            this.resetCaptcha();
        }, 1000);
    }
    
    /**
     * Validate form fields
     */
    validateForm() {
        const email = document.getElementById(this.config.elements.email);
        const password = document.getElementById(this.config.elements.password);
        
        // Email validation
        if (!email || !email.value.trim()) {
            this.showError('Please enter your email address');
            email?.focus();
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            this.showError('Please enter a valid email address');
            email.focus();
            return false;
        }
        
        // Password validation
        if (!password || !password.value) {
            this.showError('Please enter your password');
            password?.focus();
            return false;
        }
        
        if (password.value.length < 6) {
            this.showError('Password must be at least 6 characters');
            password.focus();
            return false;
        }
        
        // Check for blocked state
        if (this.state.isBlocked) {
            this.showBlockMessage();
            return false;
        }
        
        return true;
    }
    
    /**
     * Load stored attempt state
     */
    loadAttemptState() {
        const storedAttempts = localStorage.getItem(this.config.storage.attempts);
        const storedTimestamp = localStorage.getItem(this.config.storage.timestamp);
        
        if (storedAttempts && storedTimestamp) {
            const timestamp = parseInt(storedTimestamp);
            const now = Date.now();
            
            // Check if block duration has expired
            if (now - timestamp > this.config.blockDuration) {
                // Reset if block is over
                this.resetAttempts();
            } else {
                this.state.attemptCount = parseInt(storedAttempts);
                
                // Check if blocked
                if (this.state.attemptCount >= this.config.maxLoginAttempts) {
                    this.state.isBlocked = true;
                    this.showBlockMessage();
                } else {
                    this.showAttemptWarning();
                }
            }
        }
    }
    
    /**
     * Increment failed login attempts
     */
    incrementAttempts() {
        this.state.attemptCount++;
        
        // Store in localStorage
        localStorage.setItem(this.config.storage.attempts, this.state.attemptCount.toString());
        localStorage.setItem(this.config.storage.timestamp, Date.now().toString());
        
        // Check if max attempts reached
        if (this.state.attemptCount >= this.config.maxLoginAttempts) {
            this.state.isBlocked = true;
            this.showBlockMessage();
            this.disableForm();
            
            // Auto-unblock after duration
            setTimeout(() => {
                this.unblock();
            }, this.config.blockDuration);
            
        } else {
            this.showAttemptWarning();
        }
    }
    
    /**
     * Show remaining attempts warning
     */
    showAttemptWarning() {
        const remaining = this.config.maxLoginAttempts - this.state.attemptCount;
        const warningDiv = document.getElementById(this.config.elements.loginAttemptWarning);
        const messageSpan = document.getElementById(this.config.elements.attemptMessage);
        
        if (!warningDiv || !messageSpan) return;
        
        warningDiv.style.display = 'block';
        
        if (remaining <= 2) {
            warningDiv.className = 'alert alert-danger animate__animated animate__shakeX';
            messageSpan.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>
                                     Only <strong>${remaining}</strong> attempt${remaining > 1 ? 's' : ''} remaining 
                                     before account lockout!`;
        } else {
            warningDiv.className = 'alert alert-warning';
            messageSpan.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>
                                     <strong>${remaining}</strong> login attempts remaining`;
        }
    }
    
    /**
     * Show block message
     */
    showBlockMessage() {
        const warningDiv = document.getElementById(this.config.elements.loginAttemptWarning);
        const messageSpan = document.getElementById(this.config.elements.attemptMessage);
        
        if (!warningDiv || !messageSpan) return;
        
        warningDiv.style.display = 'block';
        warningDiv.className = 'alert alert-danger animate__animated animate__shakeX';
        
        const minutes = Math.ceil(this.config.blockDuration / 60000);
        messageSpan.innerHTML = `<i class="bi bi-lock-fill me-2"></i>
                                 Account temporarily locked due to too many failed attempts. 
                                 Please try again in <strong>${minutes} minutes</strong>.`;
        
        // Log block event
        this.logSecurityEvent('account_blocked', 
            `Account blocked after ${this.state.attemptCount} failed attempts`);
    }
    
    /**
     * Unblock account
     */
    unblock() {
        this.state.isBlocked = false;
        this.resetAttempts();
        this.enableForm();
        
        // Hide warning
        const warningDiv = document.getElementById(this.config.elements.loginAttemptWarning);
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
        
        // Reset captcha
        this.resetCaptcha();
        
        console.log('🔓 Account unblocked');
        this.logSecurityEvent('account_unblocked', 'Account automatically unblocked');
    }
    
    /**
     * Reset login attempts
     */
    resetAttempts() {
        this.state.attemptCount = 0;
        this.state.isBlocked = false;
        
        localStorage.removeItem(this.config.storage.attempts);
        localStorage.removeItem(this.config.storage.timestamp);
    }
    
    /**
     * Disable form elements
     */
    disableForm() {
        const email = document.getElementById(this.config.elements.email);
        const password = document.getElementById(this.config.elements.password);
        const toggleBtn = document.getElementById(this.config.elements.togglePassword);
        
        if (email) email.disabled = true;
        if (password) password.disabled = true;
        if (toggleBtn) toggleBtn.disabled = true;
        
        this.disableLoginButton();
        
        // Reset captcha
        this.resetCaptcha();
    }
    
    /**
     * Enable form elements
     */
    enableForm() {
        const email = document.getElementById(this.config.elements.email);
        const password = document.getElementById(this.config.elements.password);
        const toggleBtn = document.getElementById(this.config.elements.togglePassword);
        
        if (email) email.disabled = false;
        if (password) password.disabled = false;
        if (toggleBtn) toggleBtn.disabled = false;
    }
    
    /**
     * Show loading state on login button
     */
    showLoadingState() {
        const loginButton = document.getElementById(this.config.elements.loginButton);
        const loginSpinner = document.getElementById(this.config.elements.loginSpinner);
        const loginButtonText = document.getElementById(this.config.elements.loginButtonText);
        
        if (!loginButton || !loginSpinner || !loginButtonText) return;
        
        loginButton.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginButtonText.textContent = 'Authenticating...';
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loginButton = document.getElementById(this.config.elements.loginButton);
        const loginSpinner = document.getElementById(this.config.elements.loginSpinner);
        const loginButtonText = document.getElementById(this.config.elements.loginButtonText);
        
        if (!loginButton || !loginSpinner || !loginButtonText) return;
        
        loginSpinner.style.display = 'none';
        loginButtonText.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
        
        if (this.state.isVerified && !this.state.isBlocked) {
            loginButton.disabled = false;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById(this.config.elements.loginError);
        
        if (!errorDiv) return;
        
        errorDiv.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${message}`;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-danger animate__animated animate__fadeIn';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Show CAPTCHA error
     */
    showCaptchaError(message) {
        const errorDiv = document.getElementById(this.config.elements.captchaError);
        
        if (!errorDiv) return;
        
        errorDiv.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i>${message}`;
        errorDiv.style.display = 'block';
        errorDiv.className = 'text-danger small mt-2 animate__animated animate__fadeIn';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
        
        // Highlight captcha
        const captchaContainer = document.getElementById(this.config.elements.recaptchaContainer);
        if (captchaContainer) {
            captchaContainer.style.border = '2px solid #dc3545';
            setTimeout(() => {
                captchaContainer.style.border = 'none';
            }, 3000);
        }
    }
    
    /**
     * Show CAPTCHA message
     */
    showCaptchaMessage(message, type = 'info') {
        // Implementation depends on UI requirements
        console.log(`CAPTCHA ${type}: ${message}`);
    }
    
    /**
     * Hide error messages
     */
    hideError() {
        const errorDiv = document.getElementById(this.config.elements.loginError);
        const captchaError = document.getElementById(this.config.elements.captchaError);
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (captchaError) captchaError.style.display = 'none';
    }
    
    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        this.state.remainingTime = this.config.sessionTimeout;
        this.updateTimerDisplay();
        
        // Clear existing timer
        if (this.state.sessionTimer) {
            clearInterval(this.state.sessionTimer);
        }
        
        // Update timer every second
        this.state.sessionTimer = setInterval(() => {
            this.state.remainingTime -= 1000;
            this.updateTimerDisplay();
            
            // Check if session expired
            if (this.state.remainingTime <= 0) {
                this.handleSessionExpiry();
            }
            
            // Warning at 5 minutes
            if (this.state.remainingTime === 5 * 60 * 1000) {
                this.showSessionWarning();
            }
        }, 1000);
        
        // Reset on user activity
        this.setupActivityMonitoring();
        
        console.log('⏰ Session monitoring started');
    }
    
    /**
     * Monitor user activity for session timeout
     */
    setupActivityMonitoring() {
        const resetTimer = () => {
            this.state.remainingTime = this.config.sessionTimeout;
            this.updateTimerDisplay();
        };
        
        // Events that indicate user activity
        const activityEvents = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (this.state.sessionTimer) {
                    resetTimer();
                }
            }, { passive: true });
        });
    }
    
    /**
     * Update session timer display
     */
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timerDisplay');
        
        if (!timerDisplay) return;
        
        const minutes = Math.floor(this.state.remainingTime / 60000);
        const seconds = Math.floor((this.state.remainingTime % 60000) / 1000);
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is low
        const sessionTimer = document.getElementById('sessionTimer');
        if (sessionTimer) {
            if (this.state.remainingTime <= 5 * 60 * 1000) {
                sessionTimer.className = 'badge bg-danger';
            } else if (this.state.remainingTime <= 10 * 60 * 1000) {
                sessionTimer.className = 'badge bg-warning';
            } else {
                sessionTimer.className = 'badge bg-success';
            }
        }
    }
    
    /**
     * Show session timeout warning
     */
    showSessionWarning() {
        // Create warning toast
        this.showToast('Session Expiring', 'Your session will expire in 5 minutes due to inactivity.', 'warning');
        
        this.logSecurityEvent('session_warning', 'Session expiry warning shown');
    }
    
    /**
     * Handle session expiry
     */
    handleSessionExpiry() {
        // Clear timer
        if (this.state.sessionTimer) {
            clearInterval(this.state.sessionTimer);
        }
        
        // Log expiry
        this.logSecurityEvent('session_expired', 'Session expired due to inactivity');
        
        // Show message
        alert('Your session has expired due to inactivity. Please login again.');
        
        // Trigger logout
        const logoutEvent = new CustomEvent('tiger:sessionExpired');
        document.dispatchEvent(logoutEvent);
    }
    
    /**
     * Clear session timer
     */
    clearSessionTimer() {
        if (this.state.sessionTimer) {
            clearInterval(this.state.sessionTimer);
            this.state.sessionTimer = null;
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(title, message, type = 'info') {
        // Create toast container if not exists
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : 
                       type === 'danger' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert">
                <div class="toast-header ${bgClass} text-white">
                    <strong class="me-auto"><i class="bi bi-bell me-2"></i>${title}</strong>
                    <small>${new Date().toLocaleTimeString()}</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            delay: 5000,
            autohide: true
        });
        
        toast.show();
        
        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    /**
     * Log security event
     */
    logSecurityEvent(eventType, details) {
        // Console logging
        console.log(`🔒 Security Event: ${eventType} - ${details}`);
        
        // If Firebase is available, log to database
        if (typeof firebase !== 'undefined' && firebase.database) {
            try {
                const securityLog = {
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    event: eventType,
                    details: details,
                    userAgent: navigator.userAgent,
                    timestamp_iso: new Date().toISOString()
                };
                
                const logRef = firebase.database().ref('security_logs/recaptcha');
                logRef.push(securityLog).catch(err => {
                    console.warn('Failed to log to Firebase:', err);
                });
            } catch (error) {
                console.warn('Firebase logging unavailable:', error);
            }
        }
    }
    
    /**
     * Get CAPTCHA response token
     */
    getCaptchaResponse() {
        if (this.state.captchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
            return grecaptcha.getResponse(this.state.captchaWidgetId);
        }
        return null;
    }
    
    /**
     * Check if CAPTCHA is verified
     */
    isCaptchaVerified() {
        return this.state.isVerified;
    }
    
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
}

// Initialize reCAPTCHA manager when DOM is ready
let recaptchaManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing reCAPTCHA system...');
    recaptchaManager = new ReCaptchaManager();
    
    // Make available globally
    window.recaptchaManager = recaptchaManager;
    
    console.log('✅ reCAPTCHA system ready');
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReCaptchaManager;
            }
