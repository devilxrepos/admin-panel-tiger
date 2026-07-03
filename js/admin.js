/**
 * Tiger Admin Panel - Main JavaScript
 * License Key Management System
 * Saves to "users" node to match Android app
 */

// Global variables
let currentUser = null;
const PACKAGE_NAME = "com.Tiger349x.hack.demo";
const DB_NODE = "users"; // Changed from "license_keys" to "users" to match app

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
            
            // Save to Firebase "users" node (matching Android app)
            saveKeysToDatabase(keys)
                .then(() => {
                    displayGeneratedKeys(keys);
                    loadStats();
                    showToast('Success', `Generated and saved ${keys.length} keys!`, 'success');
                })
                .catch(error => {
                    console.error('Save error:', error);
                    showToast('Error', 'Failed to save: ' + error.message, 'danger');
                    // Still display keys even if save failed
                    displayGeneratedKeys(keys);
                });
            
        } catch (error) {
            console.error('Generation error:', error);
            showToast('Error', 'Key generation failed', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
    }, 500);
}

// Save keys to Firebase Database
function saveKeysToDatabase(keys) {
    console.log(`💾 Saving ${keys.length} keys to Firebase "${DB_NODE}" node...`);
    
    const user = firebase.auth().currentUser;
    if (!user) {
        return Promise.reject(new Error('Not authenticated'));
    }
    
    console.log('✅ User authenticated:', user.email);
    
    const promises = keys.map((keyData, index) => {
        // Clean key for Firebase path
        const safeKey = keyData.key.replace(/[.#$/[\]]/g, '_');
        
        // Create data structure matching Android app expectations
        const appData = {
            // Standard fields
            key: keyData.key,
            type: keyData.type,
            status: keyData.status,
            created: keyData.created,
            expires: keyData.expires,
            device: keyData.device || '',
            packageName: keyData.packageName,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            
            // Fields matching Android app (from smali code)
            uid: keyData.key,           // GotUid
            exp: keyData.expires,       // GotExp
            kenb: keyData.key,          // GotKenb
            keyNumber: keyData.key,     // GotKenb alternative
            deviceId: keyData.device || '',  // DEVICE
            isRes: 'false',             // IsRes
            uid2: ''                    // GotUid2
        };
        
        console.log(`📝 Saving key ${index + 1}/${keys.length}: ${keyData.key}`);
        
        // Save to users node (where your app looks)
        return database.ref(DB_NODE + '/' + safeKey).set(appData)
            .then(() => {
                console.log(`✅ Key ${index + 1} saved successfully`);
                return true;
            })
            .catch((error) => {
                console.error(`❌ Failed to save key ${index + 1}:`, error);
                
                if (error.code === 'PERMISSION_DENIED') {
                    throw new Error('Permission denied. Update Firebase Database Rules to allow write access.');
                }
                throw error;
            });
    });
    
    return Promise.all(promises);
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
        default: expirationDays = 7;
    }
    
    const expirationDate = type === 'lifetime' ? 'never' : 
        new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)).toISOString();
    
    // Generate unique keys
    const generatedKeySet = new Set();
    
    for (let i = 0; i < count; i++) {
        let key;
        let attempts = 0;
        
        // Try to generate unique key
        do {
            key = generateLicenseKey(prefix);
            attempts++;
        } while (generatedKeySet.has(key) && attempts < 100);
        
        generatedKeySet.add(key);
        
        keys.push({
            key: key,
            type: type,
            status: 'active',
            created: now,
            expires: expirationDate,
            device: null,
            packageName: PACKAGE_NAME
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
    
    // Use crypto for better randomness if available
    const getRandomChar = () => {
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return chars[array[0] % chars.length];
        } else {
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }
    };
    
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            segment += getRandomChar();
        }
        keyParts.push(segment);
    }
    
    return `${prefix}-${keyParts.join('-')}`;
}

// Display generated keys
function displayGeneratedKeys(keys) {
    const keysListDiv = document.getElementById('generatedKeysList');
    
    if (!keys || keys.length === 0) {
        keysListDiv.innerHTML = '<p class="text-center text-muted">No keys generated</p>';
        document.getElementById('generatedKeys').style.display = 'block';
        return;
    }
    
    keysListDiv.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm table-bordered mb-0">
                <thead class="table-light">
                    <tr>
                        <th>#</th>
                        <th>License Key</th>
                        <th>Type</th>
                        <th>Expiration</th>
                        <th>Status</th>
                        <th>Copy</th>
                    </tr>
                </thead>
                <tbody>
                    ${keys.map((key, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>
                                <code class="key-display">${key.key}</code>
                            </td>
                            <td><span class="badge bg-info">${key.type}</span></td>
                            <td>${key.expires === 'never' ? '<span class="badge bg-warning">Never</span>' : new Date(key.expires).toLocaleDateString()}</td>
                            <td><span class="badge bg-success">${key.status}</span></td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="copySingleKey('${key.key.replace(/'/g, "\\'")}')" 
                                        title="Copy key">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-muted small">
            <i class="bi bi-info-circle"></i> 
            Total: <strong>${keys.length}</strong> keys | 
            Saved to: <strong>${DB_NODE}</strong> node
        </div>
    `;
    
    document.getElementById('generatedKeys').style.display = 'block';
    
    // Scroll to generated keys
    document.getElementById('generatedKeys').scrollIntoView({ behavior: 'smooth' });
}

// Copy single key
function copySingleKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => showToast('Copied!', 'Key copied to clipboard', 'success'))
        .catch(() => showToast('Error', 'Failed to copy key', 'danger'));
}

// Copy all generated keys
function copyAllKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    if (keyElements.length === 0) {
        showToast('Error', 'No keys to copy', 'danger');
        return;
    }
    
    const keysText = Array.from(keyElements)
        .map((el, i) => `${i + 1}. ${el.textContent}`)
        .join('\n');
    
    navigator.clipboard.writeText(keysText)
        .then(() => showToast('Copied!', `${keyElements.length} keys copied to clipboard`, 'success'))
        .catch(() => showToast('Error', 'Failed to copy keys', 'danger'));
}

// Export keys as CSV
function exportKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    if (keyElements.length === 0) {
        showToast('Error', 'No keys to export', 'danger');
        return;
    }
    
    const keys = Array.from(keyElements).map(el => {
        const row = el.closest('tr');
        return {
            key: el.textContent,
            type: row.querySelector('.badge')?.textContent?.trim() || '',
            expires: row.querySelector('td:nth-child(4)')?.textContent?.trim() || ''
        };
    });
    
    let csv = 'License Key,Type,Expiration\n';
    keys.forEach(k => {
        csv += `"${k.key}","${k.type}","${k.expires}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiger-license-keys-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Exported', `Keys exported as CSV`, 'success');
}

// Load keys from Firebase
function loadKeys() {
    if (!currentUser) {
        console.log('⚠️ Cannot load keys: Not authenticated');
        return;
    }
    
    console.log(`📥 Loading keys from "${DB_NODE}" node...`);
    
    const searchTerm = document.getElementById('searchKey')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const typeFilter = document.getElementById('filterType')?.value || 'all';
    
    // Show loading in table
    const tbody = document.getElementById('keysTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading keys from database...
                </td>
            </tr>
        `;
    }
    
    database.ref(DB_NODE).once('value')
        .then(snapshot => {
            const keys = [];
            
            snapshot.forEach(child => {
                const keyData = child.val();
                
                // Skip non-key entries (like metadata)
                if (!keyData.key && !keyData.kenb) return;
                
                keyData.keyId = child.key;
                
                // Map fields to match expected structure
                if (!keyData.key && keyData.kenb) {
                    keyData.key = keyData.kenb;
                }
                if (!keyData.expires && keyData.exp) {
                    keyData.expires = keyData.exp;
                }
                if (!keyData.status) {
                    keyData.status = 'active';
                }
                if (!keyData.type) {
                    keyData.type = 'unknown';
                }
                
                // Apply filters
                if (searchTerm && !keyData.key?.toLowerCase().includes(searchTerm)) return;
                if (statusFilter !== 'all' && keyData.status !== statusFilter) return;
                if (typeFilter !== 'all' && keyData.type !== typeFilter) return;
                
                keys.push(keyData);
            });
            
            // Sort by creation date (newest first)
            keys.sort((a, b) => {
                const dateA = a.createdAt || a.created || 0;
                const dateB = b.createdAt || b.created || 0;
                return dateB - dateA;
            });
            
            console.log(`✅ Loaded ${keys.length} keys`);
            displayKeys(keys);
        })
        .catch(error => {
            console.error('❌ Error loading keys:', error);
            
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Error loading keys: ${error.message}
                            <br>
                            <small>Check Firebase Database Rules and connection</small>
                        </td>
                    </tr>
                `;
            }
            
            showToast('Error', 'Failed to load keys: ' + error.message, 'danger');
        });
}

// Display keys in table
function displayKeys(keys) {
    const tbody = document.getElementById('keysTableBody');
    
    if (!tbody) return;
    
    if (keys.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox display-4 d-block mb-2"></i>
                    No license keys found
                    <br>
                    <small>Generate new keys or adjust your filters</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = keys.map(key => {
        const created = key.created ? new Date(key.created).toLocaleDateString() : 'Unknown';
        const expires = !key.expires || key.expires === 'never' ? 
            '<span class="badge bg-warning">Never</span>' : 
            new Date(key.expires).toLocaleDateString();
        
        const statusClass = key.status === 'active' ? 'bg-success' : 
                           key.status === 'inactive' ? 'bg-warning text-dark' : 'bg-danger';
        
        const typeClass = key.type === 'trial' ? 'bg-info' :
                         key.type === 'premium' ? 'bg-primary' :
                         key.type === 'lifetime' ? 'bg-success' : 'bg-secondary';
        
        return `
            <tr>
                <td>
                    <code class="key-display" title="${key.key}">${key.key}</code>
                    <button class="btn btn-sm btn-outline-secondary ms-1" 
                            onclick="copySingleKey('${(key.key || '').replace(/'/g, "\\'")}')"
                            title="Copy">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </td>
                <td><span class="badge ${typeClass}">${key.type || 'unknown'}</span></td>
                <td><span class="badge ${statusClass}">${key.status || 'unknown'}</span></td>
                <td>${created}</td>
                <td>${expires}</td>
                <td>
                    <small class="text-muted" title="${key.device || key.deviceId || ''}">
                        ${key.device || key.deviceId ? 
                            (key.device || key.deviceId).substring(0, 8) + '...' : 
                            'Not assigned'}
                    </small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-warning" 
                                onclick="toggleKeyStatus('${key.keyId}', '${key.status || 'active'}')"
                                title="${key.status === 'active' ? 'Deactivate' : 'Activate'}">
                            <i class="bi bi-${key.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" 
                                onclick="deleteKey('${key.keyId}')"
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update key count
    const keysCount = document.getElementById('keysCount');
    if (keysCount) {
        keysCount.textContent = `Showing ${keys.length} key(s)`;
    }
}

// Toggle key status
function toggleKeyStatus(keyId, currentStatus) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this key?`)) {
        return;
    }
    
    database.ref(DB_NODE + '/' + keyId).update({
        status: newStatus
    })
    .then(() => {
        loadKeys();
        loadStats();
        showToast('Success', `Key ${action}d successfully`, 'success');
    })
    .catch(error => {
        console.error('Error toggling status:', error);
        showToast('Error', 'Failed to update key: ' + error.message, 'danger');
    });
}

// Delete key
function deleteKey(keyId) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
        return;
    }
    
    database.ref(DB_NODE + '/' + keyId).remove()
        .then(() => {
            loadKeys();
            loadStats();
            showToast('Deleted', 'Key deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting key:', error);
            showToast('Error', 'Failed to delete key: ' + error.message, 'danger');
        });
}

// Load statistics
function loadStats() {
    if (!currentUser) return;
    
    console.log('📊 Loading statistics...');
    
    database.ref(DB_NODE).once('value')
        .then(snapshot => {
            let total = 0, active = 0, inactive = 0, expired = 0;
            let trial = 0, premium = 0, lifetime = 0, unknown = 0;
            
            snapshot.forEach(child => {
                const key = child.val();
                
                // Skip non-key entries
                if (!key.key && !key.kenb) return;
                
                total++;
                
                // Count by status
                if (key.status === 'active') active++;
                else if (key.status === 'inactive') inactive++;
                else if (key.status === 'expired') expired++;
                
                // Count by type
                if (key.type === 'trial') trial++;
                else if (key.type === 'premium') premium++;
                else if (key.type === 'lifetime') lifetime++;
                else unknown++;
            });
            
            // Update UI
            document.getElementById('totalKeys').textContent = total;
            document.getElementById('activeKeys').textContent = active;
            document.getElementById('trialKeys').textContent = trial;
            document.getElementById('premiumKeys').textContent = premium + lifetime;
            
            console.log(`✅ Stats loaded: ${total} total, ${active} active`);
        })
        .catch(error => {
            console.error('Error loading stats:', error);
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
    
    const iconClass = type === 'success' ? 'bi-check-circle' :
                     type === 'danger' ? 'bi-x-circle' :
                     type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <i class="bi ${iconClass} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        delay: 3000,
        autohide: true 
    });
    toast.show();
    
    // Remove from DOM after hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Auto-refresh keys every 30 seconds
let autoRefreshInterval;

function startAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
        if (currentUser && document.getElementById('keysSection')?.style.display !== 'none') {
            loadKeys();
        }
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
}

// Initialize auto-refresh
startAutoRefresh();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
    clearSessionTimer();
});

console.log('✅ Admin Panel JS Loaded - Using "' + DB_NODE + '" database node');
