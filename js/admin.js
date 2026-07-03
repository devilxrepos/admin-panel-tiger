/**
 * Tiger Admin Panel - Main JavaScript
 * Version: 2.0 - Fixed to save in "users" node
 * Package: com.Tiger349x.hack.demo
 */

// Global variables
let currentUser = null;
const PACKAGE_NAME = "com.Tiger349x.hack.demo";

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Tiger Admin Panel Initializing...');
    console.log('📦 Saving keys to: users/');
    initApp();
});

function initApp() {
    checkAuthState();
    setupEventListeners();
    setupNavigation();
}

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthState() {
    try {
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                console.log('✅ User authenticated:', user.email);
                hideLoginModal();
                showDashboard();
                document.getElementById('userEmail').textContent = user.email;
                loadStats();
                loadKeys();
                startSessionTimer();
            } else {
                currentUser = null;
                console.log('ℹ️ No user authenticated');
                showLoginModal();
                hideDashboard();
                clearSessionTimer();
            }
        });
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showLoginModal();
    }
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Password toggle
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'bi bi-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'bi bi-eye';
            }
        });
    }
    
    // Generate key form
    const generateForm = document.getElementById('generateKeyForm');
    if (generateForm) {
        generateForm.addEventListener('submit', handleGenerateKeys);
    }
    
    // Search
    const searchKey = document.getElementById('searchKey');
    if (searchKey) {
        searchKey.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') loadKeys();
        });
    }
    
    // Filters
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadKeys);
    }
    
    const filterType = document.getElementById('filterType');
    if (filterType) {
        filterType.addEventListener('change', loadKeys);
    }
}

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

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
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
    
    showLoginLoading(true);
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log('✅ Login successful');
            document.getElementById('loginForm').reset();
            hideLoginError();
        })
        .catch((error) => {
            console.error('❌ Login failed:', error.code);
            let message = 'Login failed. Please try again.';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email address';
                    break;
                case 'auth/wrong-password':
                    message = 'Invalid password. Please try again';
                    break;
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later';
                    break;
                case 'auth/user-disabled':
                    message = 'This account has been disabled';
                    break;
                default:
                    message = error.message;
            }
            showLoginError(message);
        })
        .finally(() => {
            showLoginLoading(false);
        });
}

function showLoginLoading(isLoading) {
    const loginButton = document.getElementById('loginButton');
    const loginSpinner = document.getElementById('loginSpinner');
    if (!loginButton || !loginSpinner) return;
    
    if (isLoading) {
        loginButton.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
    } else {
        loginButton.disabled = false;
        loginSpinner.style.display = 'none';
        loginButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (!errorDiv) return;
    errorDiv.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>' + message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'alert alert-danger';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
}

function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) errorDiv.style.display = 'none';
}

function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;
    try {
        const modal = new bootstrap.Modal(loginModal, { backdrop: 'static', keyboard: false });
        modal.show();
    } catch (error) {
        loginModal.style.display = 'block';
        loginModal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;
    try {
        const modal = bootstrap.Modal.getInstance(loginModal);
        if (modal) modal.hide();
    } catch (error) {
        loginModal.style.display = 'none';
        loginModal.classList.remove('show');
    }
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    document.body.classList.remove('modal-open');
}

function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
}

function hideDashboard() {
    document.getElementById('dashboard').style.display = 'none';
}

function logout() {
    console.log('🚪 Logging out...');
    auth.signOut().then(() => {
        console.log('✅ Logged out');
        currentUser = null;
        clearSessionTimer();
    }).catch((error) => {
        console.error('❌ Logout error:', error);
        currentUser = null;
        hideDashboard();
        showLoginModal();
    });
}

// ============================================
// SESSION TIMER
// ============================================

let sessionTimerInterval;

function startSessionTimer() {
    const sessionTimeout = 30 * 60 * 1000;
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
    timerDisplay.textContent = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    
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
    if (timerDisplay) timerDisplay.textContent = '00:00';
}

function handleSessionExpiry() {
    clearSessionTimer();
    alert('Your session has expired. Please login again.');
    logout();
}

// ============================================
// NAVIGATION
// ============================================

function showSection(section) {
    console.log('📑 Switching to:', section);
    
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) item.classList.add('active');
    });
    
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    const sectionMap = {
        'keys': 'keysSection',
        'generate': 'generateSection',
        'stats': 'statsSection'
    };
    
    const sectionId = sectionMap[section];
    if (sectionId) {
        const element = document.getElementById(sectionId);
        if (element) element.style.display = 'block';
    }
    
    if (section === 'keys') loadKeys();
    if (section === 'stats') loadStats();
}

// ============================================
// KEY GENERATION - SAVES TO "users" NODE
// ============================================

function handleGenerateKeys(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    const keyType = document.getElementById('keyType').value;
    const keyCount = parseInt(document.getElementById('keyCount').value) || 1;
    const customPrefix = document.getElementById('keyPrefix').value || 'TIGER';
    
    const submitBtn = document.querySelector('#generateKeyForm button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generating...';
    
    setTimeout(() => {
        try {
            const keys = generateKeys(keyType, keyCount, customPrefix);
            
            // SAVE TO users NODE
            saveKeysToUsersNode(keys)
                .then(() => {
                    displayGeneratedKeys(keys);
                    loadStats();
                    showToast('Success', 'Generated ' + keys.length + ' keys! Saved to users node.', 'success');
                })
                .catch(error => {
                    console.error('Save error:', error);
                    showToast('Error', 'Failed to save: ' + error.message, 'danger');
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

function saveKeysToUsersNode(keys) {
    console.log('💾 SAVING ' + keys.length + ' KEYS TO "users" NODE');
    
    if (!firebase.auth().currentUser) {
        return Promise.reject(new Error('Not authenticated'));
    }
    
    const promises = keys.map((keyData, index) => {
        // Clean key for Firebase path
        const safeKey = keyData.key.replace(/[.#$/[\]]/g, '_');
        
        // Data structure matching Android app
        const appData = {
            key: keyData.key,
            type: keyData.type,
            status: 'active',
            created: keyData.created,
            expires: keyData.expires,
            device: '',
            packageName: PACKAGE_NAME,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            uid: keyData.key,
            exp: keyData.expires,
            kenb: keyData.key,
            keyNumber: keyData.key,
            deviceId: '',
            isRes: 'false',
            uid2: ''
        };
        
        console.log('📝 Saving to: users/' + safeKey);
        
        // THIS IS THE KEY LINE - SAVING TO "users" NODE
        return database.ref('users/' + safeKey).set(appData)
            .then(() => {
                console.log('✅ Saved key ' + (index + 1) + ': ' + keyData.key);
                return true;
            })
            .catch((error) => {
                console.error('❌ Failed to save key ' + (index + 1) + ':', error);
                if (error.code === 'PERMISSION_DENIED') {
                    throw new Error('Firebase permission denied. Set database rules to allow write.');
                }
                throw error;
            });
    });
    
    return Promise.all(promises);
}

function generateKeys(type, count, prefix) {
    const keys = [];
    const now = new Date().toISOString();
    
    let expirationDays;
    switch(type) {
        case 'trial': expirationDays = 7; break;
        case 'premium': expirationDays = 30; break;
        case 'lifetime': expirationDays = 36500; break;
        default: expirationDays = 7;
    }
    
    const expirationDate = type === 'lifetime' ? 'never' : 
        new Date(Date.now() + (expirationDays * 24 * 60 * 60 * 1000)).toISOString();
    
    const generatedKeySet = new Set();
    
    for (let i = 0; i < count; i++) {
        let key;
        let attempts = 0;
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

function generateLicenseKey(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    const keyParts = [];
    
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            if (window.crypto && window.crypto.getRandomValues) {
                const array = new Uint32Array(1);
                window.crypto.getRandomValues(array);
                segment += chars[array[0] % chars.length];
            } else {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        keyParts.push(segment);
    }
    
    return prefix + '-' + keyParts.join('-');
}

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
                            <td><code class="key-display">${key.key}</code></td>
                            <td><span class="badge bg-info">${key.type}</span></td>
                            <td>${key.expires === 'never' ? '<span class="badge bg-warning">Never</span>' : new Date(key.expires).toLocaleDateString()}</td>
                            <td><span class="badge bg-success">active</span></td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-secondary" onclick="copySingleKey('${key.key.replace(/'/g, "\\'")}')" title="Copy">
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
            Saved to: <strong class="text-success">users</strong> node
        </div>
    `;
    
    document.getElementById('generatedKeys').style.display = 'block';
    document.getElementById('generatedKeys').scrollIntoView({ behavior: 'smooth' });
}

function copySingleKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => showToast('Copied!', 'Key copied to clipboard', 'success'))
        .catch(() => showToast('Error', 'Failed to copy', 'danger'));
}

function copyAllKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    if (keyElements.length === 0) {
        showToast('Error', 'No keys to copy', 'danger');
        return;
    }
    
    const keysText = Array.from(keyElements)
        .map((el, i) => (i + 1) + '. ' + el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(keysText)
        .then(() => showToast('Copied!', keyElements.length + ' keys copied', 'success'))
        .catch(() => showToast('Error', 'Failed to copy', 'danger'));
}

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
        csv += '"' + k.key + '","' + k.type + '","' + k.expires + '"\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiger-keys-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Exported', 'Keys exported as CSV', 'success');
}

// ============================================
// LOAD KEYS FROM "users" NODE
// ============================================

function loadKeys() {
    if (!currentUser) {
        console.log('⚠️ Cannot load keys: Not authenticated');
        return;
    }
    
    console.log('📥 LOADING KEYS FROM "users" NODE');
    
    const tbody = document.getElementById('keysTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading keys from users node...</td></tr>';
    }
    
    // LOAD FROM "users" NODE
    database.ref('users').once('value')
        .then(snapshot => {
            const keys = [];
            const searchTerm = document.getElementById('searchKey')?.value?.toLowerCase() || '';
            const statusFilter = document.getElementById('filterStatus')?.value || 'all';
            const typeFilter = document.getElementById('filterType')?.value || 'all';
            
            snapshot.forEach(child => {
                const keyData = child.val();
                
                // Skip entries without key
                if (!keyData.key && !keyData.kenb) return;
                
                keyData.keyId = child.key;
                
                // Map fields
                if (!keyData.key && keyData.kenb) keyData.key = keyData.kenb;
                if (!keyData.expires && keyData.exp) keyData.expires = keyData.exp;
                if (!keyData.status) keyData.status = 'active';
                if (!keyData.type) keyData.type = 'unknown';
                
                // Apply filters
                if (searchTerm && !keyData.key?.toLowerCase().includes(searchTerm)) return;
                if (statusFilter !== 'all' && keyData.status !== statusFilter) return;
                if (typeFilter !== 'all' && keyData.type !== typeFilter) return;
                
                keys.push(keyData);
            });
            
            // Sort newest first
            keys.sort((a, b) => {
                const dateA = a.createdAt || a.created || 0;
                const dateB = b.createdAt || b.created || 0;
                return dateB - dateA;
            });
            
            console.log('✅ Loaded ' + keys.length + ' keys from users node');
            displayKeys(keys);
        })
        .catch(error => {
            console.error('❌ Error loading keys:', error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ' + error.message + '</td></tr>';
            }
            showToast('Error', 'Failed to load keys', 'danger');
        });
}

function displayKeys(keys) {
    const tbody = document.getElementById('keysTableBody');
    if (!tbody) return;
    
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-inbox display-4 d-block mb-2"></i>No keys found in users node<br><small>Generate new keys to see them here</small></td></tr>';
        return;
    }
    
    tbody.innerHTML = keys.map(key => {
        const created = key.created ? new Date(key.created).toLocaleDateString() : 'Unknown';
        const expires = !key.expires || key.expires === 'never' ? '<span class="badge bg-warning">Never</span>' : new Date(key.expires).toLocaleDateString();
        const statusClass = key.status === 'active' ? 'bg-success' : key.status === 'inactive' ? 'bg-warning text-dark' : 'bg-danger';
        const typeClass = key.type === 'trial' ? 'bg-info' : key.type === 'premium' ? 'bg-primary' : key.type === 'lifetime' ? 'bg-success' : 'bg-secondary';
        const device = key.device || key.deviceId || '';
        const deviceDisplay = device ? device.substring(0, 8) + '...' : 'Not assigned';
        
        return `
            <tr>
                <td>
                    <code class="key-display" title="${key.key}">${key.key}</code>
                    <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copySingleKey('${(key.key || '').replace(/'/g, "\\'")}')" title="Copy">
                        <i class="bi bi-clipboard"></i>
                    </button>
                </td>
                <td><span class="badge ${typeClass}">${key.type || 'unknown'}</span></td>
                <td><span class="badge ${statusClass}">${key.status || 'unknown'}</span></td>
                <td>${created}</td>
                <td>${expires}</td>
                <td><small class="text-muted" title="${device}">${deviceDisplay}</small></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-warning" onclick="toggleKeyStatus('${key.keyId}', '${key.status || 'active'}')" title="${key.status === 'active' ? 'Deactivate' : 'Activate'}">
                            <i class="bi bi-${key.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteKey('${key.keyId}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// KEY ACTIONS (users NODE)
// ============================================

function toggleKeyStatus(keyId, currentStatus) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm('Are you sure you want to ' + action + ' this key?')) return;
    
    database.ref('users/' + keyId).update({ status: newStatus })
        .then(() => {
            loadKeys();
            loadStats();
            showToast('Success', 'Key ' + action + 'd', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Failed to update key', 'danger');
        });
}

function deleteKey(keyId) {
    if (!currentUser) {
        showToast('Error', 'Please login first', 'danger');
        return;
    }
    
    if (!confirm('Delete this key? This cannot be undone.')) return;
    
    database.ref('users/' + keyId).remove()
        .then(() => {
            loadKeys();
            loadStats();
            showToast('Deleted', 'Key deleted from users node', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error', 'Failed to delete key', 'danger');
        });
}

// ============================================
// STATISTICS (users NODE)
// ============================================

function loadStats() {
    if (!currentUser) return;
    
    console.log('📊 Loading stats from users node...');
    
    database.ref('users').once('value')
        .then(snapshot => {
            let total = 0, active = 0, trial = 0, premium = 0;
            
            snapshot.forEach(child => {
                const key = child.val();
                if (!key.key && !key.kenb) return;
                
                total++;
                if (key.status === 'active') active++;
                if (key.type === 'trial') trial++;
                if (key.type === 'premium' || key.type === 'lifetime') premium++;
            });
            
            document.getElementById('totalKeys').textContent = total;
            document.getElementById('activeKeys').textContent = active;
            document.getElementById('trialKeys').textContent = trial;
            document.getElementById('premiumKeys').textContent = premium;
            
            console.log('✅ Stats: ' + total + ' total, ' + active + ' active');
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(title, message, type) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-info';
    const iconClass = type === 'success' ? 'bi-check-circle' : type === 'danger' ? 'bi-x-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert">
            <div class="toast-header ${bgClass} text-white">
                <i class="bi ${iconClass} me-2"></i>
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
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ============================================
// AUTO REFRESH
// ============================================

setInterval(() => {
    if (currentUser && document.getElementById('keysSection')?.style.display !== 'none') {
        loadKeys();
    }
}, 30000);

console.log('✅ Admin Panel JS Loaded Successfully');
console.log('📦 All operations use "users" node');
