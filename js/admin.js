// Global variables
let currentUser = null;
const PACKAGE_NAME = "com.Tiger349x.hack.demo";

// Initialize
window.onload = function() {
    checkAuthState();
};

// Authentication
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('userEmail').textContent = user.email;
            loadStats();
            loadKeys();
        } else {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        }
    });
}

// Login handler
// Add to admin.js - Enhanced key generation handler

document.getElementById('generateKeyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const keyType = document.getElementById('keyType').value;
    const keyCount = parseInt(document.getElementById('keyCount').value);
    const customPrefix = document.getElementById('keyPrefix').value || null;
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
    
    // Use the key generator
    setTimeout(() => {
        try {
            // Generate batch of keys
            const generatedKeys = keyGenerator.generateBatchKeys(keyType, keyCount, customPrefix);
            
            // Create key objects for Firebase
            const now = new Date().toISOString();
            const keys = generatedKeys.map(keyData => ({
                key: keyData.key,
                type: keyData.type,
                algorithm: keyData.algorithm,
                status: 'active',
                created: now,
                expires: keyData.expires,
                device: null,
                packageName: keyGenerator.PACKAGE_NAME,
                checksum: keyData.checksum,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }));
            
            // Save to Firebase
            const promises = keys.map(keyData => {
                // Replace Firebase-unsafe characters in key path
                const safeKey = keyData.key.replace(/[.#$/[\]]/g, '_');
                const keyRef = database.ref('license_keys/' + safeKey);
                return keyRef.set(keyData);
            });
            
            Promise.all(promises)
                .then(() => {
                    displayGeneratedKeys(keys);
                    loadStats();
                    
                    // Show success message
                    showToast('Success', `Generated ${keys.length} license keys successfully!`, 'success');
                    
                    // Log generation event
                    captchaManager.logSecurityEvent('keys_generated', 
                        `Generated ${keyCount} ${keyType} keys with ${keyData.algorithm} algorithm`);
                })
                .catch(error => {
                    showToast('Error', 'Failed to save keys: ' + error.message, 'danger');
                });
                
        } catch (error) {
            showToast('Error', 'Key generation failed: ' + error.message, 'danger');
        } finally {
            // Restore button
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }, 500); // Small delay for better UX
});

// Display generated keys with enhanced view
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
                        <th>Algorithm</th>
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
                                        onclick="copySingleKey('${key.key}')" 
                                        title="Copy key">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </td>
                            <td><span class="badge bg-info">${key.type}</span></td>
                            <td><span class="badge bg-secondary">${key.algorithm || 'standard'}</span></td>
                            <td>${key.expires === 'never' ? '<span class="badge bg-warning">Never</span>' : new Date(key.expires).toLocaleDateString()}</td>
                            <td><span class="badge bg-success">${key.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-2">
            <small class="text-muted">
                <i class="bi bi-info-circle"></i> 
                Total keys generated: <strong>${keys.length}</strong> | 
                Algorithm: <strong>${keys[0]?.algorithm || 'Standard'}</strong>
            </small>
        </div>
    `;
    
    document.getElementById('generatedKeys').style.display = 'block';
    
    // Scroll to generated keys
    document.getElementById('generatedKeys').scrollIntoView({ behavior: 'smooth' });
}

// Copy single key
function copySingleKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => {
            showToast('Copied!', 'Key copied to clipboard', 'success');
        })
        .catch(() => {
            showToast('Error', 'Failed to copy key', 'danger');
        });
}

// Toast notification system
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
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
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">${title}</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: 5000,
        autohide: true
    });
    toast.show();
    
    // Remove toast from DOM after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Enhanced copy all keys with options
function copyAllKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    const keys = Array.from(keyElements).map(el => el.textContent);
    
    // Create formatted output
    const formattedOutput = keys.map((key, index) => `${index + 1}. ${key}`).join('\n');
    
    navigator.clipboard.writeText(formattedOutput)
        .then(() => showToast('Success', `${keys.length} keys copied to clipboard!`, 'success'))
        .catch(() => showToast('Error', 'Failed to copy keys', 'danger'));
}

// Enhanced export function
function exportKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList code.key-display');
    const keyData = Array.from(keyElements).map(el => {
        const row = el.closest('tr');
        const type = row.querySelector('.badge.bg-info')?.textContent || '';
        const algorithm = row.querySelector('.badge.bg-secondary')?.textContent || '';
        const expires = row.querySelector('td:nth-child(5)')?.textContent?.trim() || '';
        
        return {
            key: el.textContent,
            type: type,
            algorithm: algorithm,
            expires: expires
        };
    });
    
    // Show export options
    const format = confirm('Click OK for CSV format, Cancel for Text format');
    
    let content, filename, mimeType;
    
    if (format) {
        content = keyGenerator.exportToCSV(keyData);
        filename = `tiger-keys-${Date.now()}.csv`;
        mimeType = 'text/csv';
    } else {
        content = keyGenerator.exportToText(keyData);
        filename = `tiger-keys-${Date.now()}.txt`;
        mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Exported', `Keys exported as ${filename}`, 'success');
}

// Logout
function logout() {
    auth.signOut();
}

// Navigation
function showSection(section) {
    document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('#keysSection, #generateSection, #statsSection').forEach(s => s.style.display = 'none');
    
    if (section === 'keys') {
        document.getElementById('keysSection').style.display = 'block';
        document.querySelector('.list-group-item:nth-child(1)').classList.add('active');
    } else if (section === 'generate') {
        document.getElementById('generateSection').style.display = 'block';
        document.querySelector('.list-group-item:nth-child(2)').classList.add('active');
    } else if (section === 'stats') {
        document.getElementById('statsSection').style.display = 'block';
        document.querySelector('.list-group-item:nth-child(3)').classList.add('active');
        loadStats();
    }
}

// Generate License Key
function generateLicenseKey(prefix = 'TIGER') {
    const segments = 4;
    const segmentLength = 4;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

// Handle key generation form
document.getElementById('generateKeyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const keyType = document.getElementById('keyType').value;
    const keyCount = parseInt(document.getElementById('keyCount').value);
    const customPrefix = document.getElementById('keyPrefix').value || 'TIGER';
    
    const keys = [];
    const now = Date.now();
    
    // Calculate expiration based on type
    let expirationDays = 0;
    if (keyType === 'trial') expirationDays = 7;
    else if (keyType === 'premium') expirationDays = 30;
    else if (keyType === 'lifetime') expirationDays = 36500; // ~100 years
    
    const expirationDate = keyType === 'lifetime' ? 'never' : new Date(now + (expirationDays * 24 * 60 * 60 * 1000));
    
    // Generate keys
    for (let i = 0; i < keyCount; i++) {
        const key = generateLicenseKey(customPrefix);
        keys.push({
            key: key,
            type: keyType,
            status: 'active',
            created: new Date().toISOString(),
            expires: expirationDate === 'never' ? 'never' : expirationDate.toISOString(),
            device: null,
            packageName: PACKAGE_NAME,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    // Save to Firebase
    const promises = keys.map(keyData => {
        const keyRef = database.ref('license_keys/' + keyData.key.replace(/[.#$/[\]]/g, '_'));
        return keyRef.set(keyData);
    });
    
    Promise.all(promises)
        .then(() => {
            displayGeneratedKeys(keys);
            loadStats();
        })
        .catch(error => {
            alert('Error generating keys: ' + error.message);
        });
});

// Display generated keys
function displayGeneratedKeys(keys) {
    const keysListDiv = document.getElementById('generatedKeysList');
    keysListDiv.innerHTML = keys.map(k => 
        `<div class="key-item bg-white p-2 mb-2 border rounded">
            <strong>${k.key}</strong> - ${k.type} (Expires: ${k.expires})
        </div>`
    ).join('');
    
    document.getElementById('generatedKeys').style.display = 'block';
}

// Copy all generated keys
function copyAllKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList .key-item strong');
    const keysText = Array.from(keyElements).map(el => el.textContent).join('\n');
    
    navigator.clipboard.writeText(keysText)
        .then(() => alert('Keys copied to clipboard!'))
        .catch(() => alert('Failed to copy keys'));
}

// Export keys as CSV
function exportKeys() {
    const keyElements = document.querySelectorAll('#generatedKeysList .key-item');
    let csv = 'License Key,Type,Expiration\n';
    
    keyElements.forEach(element => {
        const text = element.textContent;
        const match = text.match(/(.+) - (.+) \(Expires: (.+)\)/);
        if (match) {
            csv += `"${match[1]}","${match[2]}","${match[3]}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiger-license-keys-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Load keys with filters
function loadKeys() {
    const searchTerm = document.getElementById('searchKey').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterType').value;
    
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
        });
}

// Display keys in table
function displayKeys(keys) {
    const tbody = document.getElementById('keysTableBody');
    
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No keys found</td></tr>';
        return;
    }
    
    tbody.innerHTML = keys.map(key => {
        const created = new Date(key.created).toLocaleDateString();
        const expires = key.expires === 'never' ? 'Never' : new Date(key.expires).toLocaleDateString();
        const statusBadge = key.status === 'active' ? 'bg-success' : 
                           key.status === 'inactive' ? 'bg-warning' : 'bg-danger';
        
        return `
            <tr>
                <td><code>${key.key}</code></td>
                <td><span class="badge bg-info">${key.type}</span></td>
                <td><span class="badge ${statusBadge}">${key.status}</span></td>
                <td>${created}</td>
                <td>${expires}</td>
                <td>${key.device || 'Not assigned'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="toggleKeyStatus('${key.keyId}', '${key.status}')">
                        ${key.status === 'active' ? 'Deactivate' : 'Activate'}
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
    });
}

// Delete key
function deleteKey(keyId) {
    if (confirm('Are you sure you want to delete this key?')) {
        database.ref('license_keys/' + keyId).remove()
            .then(() => {
                loadKeys();
                loadStats();
            });
    }
}

// Load statistics
function loadStats() {
    database.ref('license_keys').once('value')
        .then(snapshot => {
            let total = 0;
            let active = 0;
            let trial = 0;
            let premium = 0;
            
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

// Auto refresh keys every 30 seconds
setInterval(() => {
    if (currentUser && document.getElementById('keysSection').style.display !== 'none') {
        loadKeys();
    }
}, 30000);