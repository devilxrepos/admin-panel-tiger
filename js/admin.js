/**
 * Tiger Admin Panel - Main JavaScript
 * Simple Login System
 */

// Global variables
let currentUser = null;
const PACKAGE_NAME = "com.Tiger349x.hack.demo";

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Tiger Admin Panel Initializing...');
    initApp();
});

// Initialize the app
function initApp() {
    // Check if Firebase Auth is initialized
    checkAuthState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup sidebar navigation
    setupNavigation();
}

// Check Firebase Auth State
function checkAuthState() {
    try {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                console.log('✅ User authenticated:', user.email);
                
                // Hide login, show dashboard
                hideLoginModal();
                showDashboard();
                
                // Update UI
                document.getElementById('userEmail').textContent = user.email;
                
                // Load data
                loadStats();
                loadKeys();
                
                // Start session timer
                startSessionTimer();
                
            } else {
                // No user signed in
                currentUser = null;
                console.log('ℹ️ No user authenticated');
                
                // Show login, hide dashboard
                showLoginModal();
                hideDashboard();
                
                // Clear session timer
                clearSessionTimer();
            }
        });
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showLoginModal();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Password toggle
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Generate key form
    const generateForm = document.getElementById('generateKeyForm');
    if (generateForm) {
        generateForm.addEventListener('submit', handleGenerateKeys);
    }
    
    // Search and filters
    const searchKey = document.getElementById('searchKey');
    if (searchKey) {
        searchKey.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') loadKeys();
        });
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadKeys);
    }
    
    const filterType = document.getElementById('filterType');
    if (filterType) {
        filterType.addEventListener('change', loadKeys);
    }
}

// Setup Navigation
function setupNavigation() {
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email) {
        showLoginError('Please enter your email address');
        return;
    }
    
    if (!password) {
        showLoginError('Please enter your password');
        return;
    }
    
    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    showLoginLoading(true);
    
    // Attempt Firebase login
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ Login successful');
            
            // Clear form
            document.getElementById('loginForm').reset();
            
            // Hide error
            hideLoginError();
            
            // User state change will handle UI update
            
        })
        .catch((error) => {
            console.error('❌ Login failed:', error.code);
            
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Invalid password. Please try again';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showLoginError(errorMessage);
        })
        .finally(() => {
            showLoginLoading(false);
        });
}

// Show login loading state
function showLoginLoading(isLoading) {
    const loginButton = document.getElementById('loginButton');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (!loginButton || !loginSpinner) return;
    
    if (isLoading) {
        loginButton.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginButton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Signing in...
        `;
    } else {
        loginButton.disabled = false;
        loginSpinner.style.display = 'none';
        loginButton.innerHTML = `
            <i class="bi bi-box-arrow-in-right me-2"></i>Login
        `;
    }
}

// Show login error
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (!errorDiv) return;
    
    errorDiv.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${message}`;
    errorDiv.style.display = 'block';
    errorDiv.className = 'alert alert-danger';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Hide login error
function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Show login modal
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;
    
    try {
        const modal = new bootstrap.Modal(loginModal, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    } catch (error) {
        // Fallback
        loginModal.style.display = 'block';
        loginModal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

// Hide login modal
function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;
    
    try {
        const modal = bootstrap.Modal.getInstance(loginModal);
        if (modal) modal.hide();
    } catch (error) {
        // Fallback
        loginModal.style.display = 'none';
        loginModal.classList.remove('show');
    }
    
    // Remove backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    document.body.classList.remove('modal-open');
}

// Show dashboard
function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
}

// Hide dashboard
function hideDashboard() {
    document.getElementById('dashboard').style.display = 'none';
}

// Logout
function logout() {
    console.log('🚪 Logging out...');
    
    auth.signOut()
        .then(() => {
            console.log('✅ Logged out successfully');
            currentUser = null;
            clearSessionTimer();
        })
        .catch((error) => {
            console.error('❌ Logout error:', error);
            // Force logout
            currentUser = null;
            hideDashboard();
            showLoginModal();
        });
}

// Session Timer
let sessionTimerInterval;

function startSessionTimer() {
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    let remainingTime = sessionTimeout;
    
    updateTimerDisplay(remainingTime);
    
    clearInterval(sessionTimerInterval);
    
    sessionTimerInterval = setInterval(() => {
        remainingTime -= 1000;
        updateTimerDisplay(remainingTime);
        
        if (remainingTime <= 0) {
            handleSessionExpiry();
        }
    }, 1000);
}

function updateTimerDisplay(remainingTime) {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;
    
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update badge color
    const sessionBadge = document.getElementById('sessionTimer');
    if (sessionBadge) {
        if (remainingTime <= 5 * 60 * 1000) {
            sessionBadge.className = 'badge bg-danger';
        } else if (remainingTime <= 10 * 60 * 1000) {
            sessionBadge.className = 'badge bg-warning';
        } else {
            sessionBadge.className = 'badge bg-success';
        }
    }
}

function clearSessionTimer() {
    clearInterval(sessionTimerInterval);
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }
}

function handleSessionExpiry() {
    clearSessionTimer();
    alert('Your session has expired. Please login again.');
    logout();
}

// Navigation
function showSection(section) {
    console.log('📑 Switching to:', section);
    
    // Update sidebar
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    const sectionMap = {
        'keys': 'keysSection',
        'generate': 'generateSection',
        'stats': 'statsSection'
    };
    
    const sectionId = sectionMap[section];
    if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'block';
        }
    }
    
    // Load section data
    if (section === 'keys') loadKeys();
    if (section === 'stats') loadStats();
}

// Handle Generate Keys
function handleGenerateKeys(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    const keyType = document.getElementById('keyType').value;
    const keyCount = parseInt(document.getElementById('keyCount').value);
    const customPrefix = document.getElementById('keyPrefix').value || 'TIGER';
    
    // Show loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generating...';
    
    // Generate keys
    setTimeout(() => {
        try {
            const keys = generateKeys(keyType, keyCount, customPrefix);
            
            // Save to Firebase
            const promises = keys.map(keyData => {
                const safeKey = keyData.key.replace(/[.#$/[\]]/g, '_');
                return database.ref('license_keys/' + safeKey).set(keyData);
            });
            
            Promise.all(promises)
                .then(() => {
                    displayGeneratedKeys(keys);
                    loadStats();
                    showToast('Success', `Generated ${keys.length} keys successfully!`, 'success');
                })
                .catch(error => {
                    showToast('Error', 'Failed to save keys: ' + error.message, 'danger');
                });
            
        } catch (error) {
            showToast('Error', 'Key generation failed', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
    }, 500);
}

// Generate license keys
function generateKeys(type, count, prefix) {
    const keys = [];
    const now = new Date().toISOString();
    
    // Calculate expiration
    let expirationDays = 0;
    switch(type) {
        case 'trial': expirationDays = 7; break;
        case 'premium': expirationDays = 30; break;
        case 'lifetime': expirationDays = 36500; break;
    }
    
    const expirationDate = type === 'lifetime' ? 'never' : 
        new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)).toISOString();
    
    for (let i = 0; i < count; i++) {
        const key = generateLicenseKey(prefix);
        keys.push({
            key: key,
            type: type,
            status: 'active',
            created: now,
            expires: expirationDate,
            device: null,
            packageName: PACKAGE_NAME,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    return keys;
}

// Generate single license key
function generateLicenseKey(prefix = 'TIGER') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    const keyParts = [];
    
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        keyParts.push(segment);
    }
    
    return `${prefix}-${keyParts.join('-')}`;
}

// Display generated keys
function displayGeneratedKeys(keys) {
    const keysListDiv = document.getElementById('generatedKeysList');
    
    keysListDiv.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>License Key</th>
                        <th>Type</th>
                        <th>Expiration</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${keys.map((key, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <code class="key-display">${key.key}</code>
                                <button class="btn btn-sm btn-outline-secondary ms-2" 
                                        onclick="copySingleKey('${key.key}')">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </td>
                            <td><span class="badge bg-info">${key.type}</span></td>
                            <td>${key.expires === 'never' ? 'Never' : new Date(key.expires).toLocaleDateString()}</td>
                            <td><span class="badge bg-success">${key.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('generatedKeys').style.display = 'block';
}

// Load keys from Firebase
function loadKeys() {
    if (!currentUser) return;
    
    const searchTerm = document.getElementById('searchKey')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const typeFilter = document.getElementById('filterType')?.value || 'all';
    
    database.ref('license_keys').once('value')
        .then(snapshot => {
            const keys = [];
            snapshot.forEach(child => {
                const keyData = child.val();
                keyData.keyId = child.key;
                
                // Apply filters
                if (searchTerm && !keyData.key.toLowerCase().includes(searchTerm)) return;
                if (statusFilter !== 'all' && keyData.status !== statusFilter) return;
                if (typeFilter !== 'all' && keyData.type !== typeFilter) return;
                
                keys.push(keyData);
            });
            
            displayKeys(keys);
        })
        .catch(error => {
            console.error('Error loading keys:', error);
            showToast('Error', 'Failed to load keys', 'danger');
        });
}

// Display keys in table
function displayKeys(keys) {
    const tbody = document.getElementById('keysTableBody');
    
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No keys found</td></tr>';
        return;
    }
    
    tbody.innerHTML = keys.map(key => {
        const created = new Date(key.created).toLocaleDateString();
        const expires = key.expires === 'never' ? 'Never' : new Date(key.expires).toLocaleDateString();
        const statusBadge = key.status === 'active' ? 'bg-success' : 
                           key.status === 'inactive' ? 'bg-warning' : 'bg-danger';
        
        return `
            <tr>
                <td><code class="key-display">${key.key}</code></td>
                <td><span class="badge bg-info">${key.type}</span></td>
                <td><span class="badge ${statusBadge}">${key.status}</span></td>
                <td>${created}</td>
                <td>${expires}</td>
                <td><small class="text-muted">${key.device || 'Not assigned'}</small></td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="toggleKeyStatus('${key.keyId}', '${key.status}')">
                        ${key.status === 'active' ? '<i class="bi bi-pause"></i>' : '<i class="bi bi-play"></i>'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKey('${key.keyId}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Toggle key status
function toggleKeyStatus(keyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    database.ref('license_keys/' + keyId).update({
        status: newStatus
    }).then(() => {
        loadKeys();
        loadStats();
        showToast('Success', `Key ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    });
}

// Delete key
function deleteKey(keyId) {
    if (confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
        database.ref('license_keys/' + keyId).remove()
            .then(() => {
                loadKeys();
                loadStats();
                showToast('Deleted', 'Key deleted successfully', 'success');
            })
            .catch(error => {
                showToast('Error', 'Failed to delete key', 'danger');
            });
    }
}

// Copy single key
function copySingleKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => showToast('Copied', 'Key copied to clipboard', 'success'))
        .catch(() => showToast('Error', 'Failed to copy', 'danger'));
}

// Copy all generated keys
function copyAllKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    const keysText = Array.from(keyElements).map(el => el.textContent).join('\n');
    
    navigator.clipboard.writeText(keysText)
        .then(() => showToast('Copied', 'All keys copied to clipboard', 'success'))
        .catch(() => showToast('Error', 'Failed to copy keys', 'danger'));
}

// Export keys as CSV
function exportKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    const keys = Array.from(keyElements).map(el => {
        const row = el.closest('tr');
        return {
            key: el.textContent,
            type: row.querySelector('.badge')?.textContent || '',
            expires: row.querySelector('td:nth-child(4)')?.textContent || ''
        };
    });
    
    let csv = 'License Key,Type,Expiration\n';
    keys.forEach(k => {
        csv += `"${k.key}","${k.type}","${k.expires}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiger-keys-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Exported', 'Keys exported successfully', 'success');
}

// Load statistics
function loadStats() {
    if (!currentUser) return;
    
    database.ref('license_keys').once('value')
        .then(snapshot => {
            let total = 0, active = 0, trial = 0, premium = 0;
            
            snapshot.forEach(child => {
                const key = child.val();
                total++;
                if (key.status === 'active') active++;
                if (key.type === 'trial') trial++;
                if (key.type === 'premium' || key.type === 'lifetime') premium++;
            });
            
            document.getElementById('totalKeys').textContent = total;
            document.getElementById('activeKeys').textContent = active;
            document.getElementById('trialKeys').textContent = trial;
            document.getElementById('premiumKeys').textContent = premium;
        });
}

// Toast notification
function showToast(title, message, type = 'info') {
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
                <strong class="me-auto">${title}</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}

// Auto-refresh keys every 30 seconds
setInterval(() => {
    if (currentUser && document.getElementById('keysSection')?.style.display !== 'none') {
        loadKeys();
    }
}, 30000);

console.log('✅ Admin Panel JS Loaded');
