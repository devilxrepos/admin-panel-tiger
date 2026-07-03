// Tiger Admin Panel
console.log('Admin JS loaded');

let currentUser = null;

// =============================================
// AUTH STATE
// =============================================
auth.onAuthStateChanged(function(user) {
    if (user) {
        currentUser = user;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        loadKeys();
        loadStats();
    } else {
        currentUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboardPage').style.display = 'none';
    }
});

// =============================================
// LOGIN
// =============================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var btn = document.getElementById('loginButton');
    var errorDiv = document.getElementById('loginError');
    
    errorDiv.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function() {
            document.getElementById('loginForm').reset();
        })
        .catch(function(error) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Error: ' + error.message;
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
        });
});

// =============================================
// LOGOUT
// =============================================
function logout() {
    auth.signOut();
}

// =============================================
// NAVIGATION
// =============================================
document.querySelectorAll('.list-group-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state
        document.querySelectorAll('.list-group-item').forEach(function(el) {
            el.classList.remove('active');
        });
        this.classList.add('active');
        
        // Hide all pages
        document.getElementById('pageKeys').style.display = 'none';
        document.getElementById('pageGenerate').style.display = 'none';
        document.getElementById('pageStats').style.display = 'none';
        
        // Show selected page
        var page = this.getAttribute('data-page');
        if (page === 'keys') {
            document.getElementById('pageKeys').style.display = 'block';
            loadKeys();
        } else if (page === 'generate') {
            document.getElementById('pageGenerate').style.display = 'block';
        } else if (page === 'stats') {
            document.getElementById('pageStats').style.display = 'block';
            loadStats();
        }
    });
});

// =============================================
// GENERATE KEYS
// =============================================
document.getElementById('generateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    var keyType = document.getElementById('keyType').value;
    var keyCount = parseInt(document.getElementById('keyCount').value) || 1;
    var prefix = document.getElementById('keyPrefix').value || 'TIGER';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var now = new Date().toISOString();
    
    // Calculate expiration
    var expDays = 7;
    if (keyType === 'premium') expDays = 30;
    if (keyType === 'lifetime') expDays = 36500;
    
    var expires = keyType === 'lifetime' ? 'never' : 
        new Date(Date.now() + (expDays * 24 * 60 * 60 * 1000)).toISOString();
    
    // Generate and save keys
    var keys = [];
    var promises = [];
    
    for (var i = 0; i < keyCount; i++) {
        // Generate key
        var key = prefix;
        for (var s = 0; s < 4; s++) {
            key += '-';
            for (var c = 0; c < 4; c++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        }
        keys.push(key);
        
        // Save to Firebase users node
        var safeKey = key.replace(/[.#$/[\]]/g, '_');
        var promise = database.ref('users/' + safeKey).set({
            key: key,
            type: keyType,
            status: 'active',
            created: now,
            expires: expires,
            device: '',
            packageName: 'com.Tiger349x.hack.demo',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        promises.push(promise);
    }
    
    // Wait for all saves
    Promise.all(promises).then(function() {
        // Display keys
        var html = '';
        keys.forEach(function(k, idx) {
            html += '<div class="alert alert-success py-2 mb-1">';
            html += '<strong>' + (idx + 1) + '.</strong> ';
            html += '<code>' + k + '</code>';
            html += '<button class="btn btn-sm btn-outline-secondary float-end" onclick="copyText(\'' + k + '\')">Copy</button>';
            html += '</div>';
        });
        document.getElementById('generatedKeysList').innerHTML = html;
        document.getElementById('generatedKeysBox').style.display = 'block';
        loadStats();
        alert('Success! Generated ' + keys.length + ' keys. Saved to users node.');
    }).catch(function(error) {
        alert('Error saving keys: ' + error.message);
    });
});

// =============================================
// LOAD KEYS
// =============================================
function loadKeys() {
    var tbody = document.getElementById('keysTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading...</td></tr>';
    
    database.ref('users').once('value').then(function(snapshot) {
        var keys = [];
        var searchTerm = document.getElementById('searchKey')?.value?.toLowerCase() || '';
        var typeFilter = document.getElementById('filterType')?.value || 'all';
        
        snapshot.forEach(function(child) {
            var data = child.val();
            if (data.key || data.kenb) {
                data.keyId = child.key;
                if (!data.key) data.key = data.kenb || '';
                if (!data.status) data.status = 'active';
                if (!data.type) data.type = 'unknown';
                if (!data.created) data.created = '';
                if (!data.expires) data.expires = '';
                
                // Apply filters
                if (searchTerm && !data.key.toLowerCase().includes(searchTerm)) return;
                if (typeFilter !== 'all' && data.type !== typeFilter) return;
                
                keys.push(data);
            }
        });
        
        if (keys.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No keys found</td></tr>';
            return;
        }
        
        var html = '';
        keys.forEach(function(key) {
            var created = key.created ? new Date(key.created).toLocaleDateString() : 'N/A';
            var expires = !key.expires || key.expires === 'never' ? 'Never' : new Date(key.expires).toLocaleDateString();
            
            html += '<tr>';
            html += '<td><code>' + key.key + '</code></td>';
            html += '<td><span class="badge bg-info">' + key.type + '</span></td>';
            html += '<td><span class="badge bg-success">' + key.status + '</span></td>';
            html += '<td>' + created + '</td>';
            html += '<td>' + expires + '</td>';
            html += '<td>' + (key.device || 'None') + '</td>';
            html += '<td><button class="btn btn-sm btn-danger" onclick="deleteKey(\'' + key.keyId + '\')">Delete</button></td>';
            html += '</tr>';
        });
        
        tbody.innerHTML = html;
    }).catch(function(error) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error: ' + error.message + '</td></tr>';
    });
}

// =============================================
// DELETE KEY
// =============================================
function deleteKey(keyId) {
    if (!confirm('Delete this key permanently?')) return;
    
    database.ref('users/' + keyId).remove().then(function() {
        loadKeys();
        loadStats();
        alert('Key deleted');
    }).catch(function(error) {
        alert('Error: ' + error.message);
    });
}

// =============================================
// LOAD STATS
// =============================================
function loadStats() {
    database.ref('users').once('value').then(function(snapshot) {
        var total = 0, active = 0, trial = 0, premium = 0;
        
        snapshot.forEach(function(child) {
            var data = child.val();
            if (data.key || data.kenb) {
                total++;
                if (data.status === 'active') active++;
                if (data.type === 'trial') trial++;
                if (data.type === 'premium' || data.type === 'lifetime') premium++;
            }
        });
        
        document.getElementById('totalKeys').textContent = total;
        document.getElementById('activeKeys').textContent = active;
        document.getElementById('trialKeys').textContent = trial;
        document.getElementById('premiumKeys').textContent = premium;
    });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function copyText(text) {
    navigator.clipboard.writeText(text).then(function() {
        alert('Copied!');
    });
}

function copyAllKeys() {
    var codes = document.querySelectorAll('#generatedKeysList code');
    var text = '';
    codes.forEach(function(el, i) {
        text += (i + 1) + '. ' + el.textContent + '\n';
    });
    navigator.clipboard.writeText(text).then(function() {
        alert('Copied ' + codes.length + ' keys!');
    });
}

function exportKeys() {
    var codes = document.querySelectorAll('#generatedKeysList code');
    var csv = 'License Key\n';
    codes.forEach(function(el) {
        csv += '"' + el.textContent + '"\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'keys.csv';
    a.click();
}

function copySingleKey(key) {
    copyText(key);
}
