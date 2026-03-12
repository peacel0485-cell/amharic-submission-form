// API Base URL - change this for production
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM Elements
const loginCard = document.getElementById('loginCard');
const formCard = document.getElementById('formCard');
const adminCard = document.getElementById('adminCard');
const userSubmissionsCard = document.getElementById('userSubmissionsCard');
const loginForm = document.getElementById('loginForm');
const submissionForm = document.getElementById('submissionForm');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('.btn-submit');
    
    submitBtn.innerHTML = 'በመግባት ላይ... <span class="loading-spinner"></span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        } else {
            showError('የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    } finally {
        submitBtn.innerHTML = 'ግባ';
        submitBtn.disabled = false;
    }
});

// Show appropriate dashboard
async function showDashboard() {
    loginCard.style.display = 'none';
    logoutBtn.style.display = 'block';
    userInfo.textContent = `እንኳን ደህና መጡ ${currentUser.name}`;

    if (currentUser.role === 'admin') {
        adminCard.style.display = 'block';
        formCard.style.display = 'none';
        userSubmissionsCard.style.display = 'none';
        switchTab('submissions'); // Load submissions by default
    } else {
        formCard.style.display = 'block';
        adminCard.style.display = 'none';
        userSubmissionsCard.style.display = 'block';
        await loadUserSubmissions();
    }
}

// Submission Form Handler
submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.btn-submit');
    
    submitBtn.innerHTML = 'በመላክ ላይ... <span class="loading-spinner"></span>';
    submitBtn.disabled = true;

    try {
        const fileInput = document.getElementById('attachment');
        let attachmentUrl = null;
        let attachmentName = null;
        let attachmentType = null;
        let attachmentSize = null;

        // Upload file directly to Supabase Storage if exists
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showError('ፋይሉ በጣም ትልቅ ነው። እባክዎ ከ10MB በታች ያለ ፋይል ይምረጡ።');
                submitBtn.innerHTML = 'ላክ';
                submitBtn.disabled = false;
                return;
            }
            
            attachmentName = file.name;
            attachmentType = file.type;
            attachmentSize = file.size;

            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', fileName);

            // Upload to server
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
                attachmentUrl = uploadData.url;
            } else {
                showError('ፋይል መስቀል አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
                submitBtn.innerHTML = 'ላክ';
                submitBtn.disabled = false;
                return;
            }
        }

        const submissionData = {
            username: currentUser.username,
            date: document.getElementById('date').value,
            full_name: document.getElementById('fullName').value,
            sub_city: document.getElementById('subCity').value,
            woreda: document.getElementById('woreda').value,
            ketena: document.getElementById('ketena').value,
            block: document.getElementById('block').value,
            house_number: document.getElementById('houseNumber').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value,
            attachment_name: attachmentName,
            attachment_type: attachmentType,
            attachment_size: attachmentSize,
            attachment_url: attachmentUrl
        };

        const response = await fetch(`${API_URL}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('መረጃው በተሳካ ሁኔታ ተልኳል!');
            submissionForm.reset();
            await loadUserSubmissions();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    } finally {
        submitBtn.innerHTML = 'ላክ';
        submitBtn.disabled = false;
    }
});

// Load all submissions (admin)
async function loadAllSubmissions() {
    const submissionsList = document.getElementById('submissionsList');
    
    try {
        const response = await fetch(`${API_URL}/submissions`);
        const data = await response.json();
        
        if (!data.success || data.submissions.length === 0) {
            submissionsList.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                    <p style="font-size: 1.2rem;">ምንም መረጃ አልተላከም።</p>
                </div>
            `;
            return;
        }

        const submissions = data.submissions;
        const statsHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${submissions.length}</h3>
                    <p>ጠቅላላ መረጃዎች</p>
                </div>
                <div class="stat-card">
                    <h3>${submissions.filter(s => s.attachment_name).length}</h3>
                    <p>ከማስረጃ ጋር</p>
                </div>
                <div class="stat-card">
                    <h3>${new Set(submissions.map(s => s.username)).size}</h3>
                    <p>ተጠቃሚዎች</p>
                </div>
            </div>
        `;

        submissionsList.innerHTML = statsHTML + submissions.map(sub => {
            const reply = sub.replies && sub.replies.length > 0 ? sub.replies[0] : null;
            return `
            <div class="submission-item">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <h4>መረጃ #${sub.id.slice(0, 8)}</h4>
                    <button class="btn-icon delete" onclick="deleteSubmission('${sub.id}')" title="ሰርዝ" style="color: var(--danger);">🗑️</button>
                </div>
                <p><strong>ተጠቃሚ:</strong> ${sub.username}</p>
                <p><strong>ቀን:</strong> ${sub.date}</p>
                <p><strong>የተላከበት ጊዜ:</strong> ${new Date(sub.created_at).toLocaleString('am-ET')}</p>
                
                <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                    <strong>የግል መረጃ:</strong>
                    <button class="btn-icon" onclick="toggleContent('personal-${sub.id}')" title="የግል መረጃ ይመልከቱ" style="font-size: 1.2rem;">👁️</button>
                </div>
                <div id="personal-${sub.id}" style="display: none; padding: 12px; background: var(--light-bg); border-radius: 8px; margin: 8px 0;">
                    ${sub.full_name ? `<p><strong>ሙሉ ስም:</strong> ${sub.full_name}</p>` : ''}
                    ${sub.phone ? `<p><strong>ስልክ:</strong> ${sub.phone}</p>` : ''}
                    ${sub.sub_city ? `<p><strong>አድራሻ:</strong> ${sub.sub_city}, ${sub.woreda}, ${sub.ketena}</p>` : ''}
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                    <strong>መረጃ:</strong>
                    <button class="btn-icon" onclick="toggleContent('content-${sub.id}')" title="መረጃ ይመልከቱ" style="font-size: 1.2rem;">👁️</button>
                </div>
                <div id="content-${sub.id}" style="display: none; padding: 12px; background: var(--light-bg); border-radius: 8px; margin: 8px 0;">
                    <p>${sub.message}</p>
                </div>
                ${sub.attachment_url ? `<a href="${sub.attachment_url}" target="_blank" class="attachment-link">📎 ${sub.attachment_name} (${(sub.attachment_size / 1024).toFixed(2)} KB)</a>` : ''}
                
                ${reply ? `
                    <div class="reply-section">
                        <div class="reply-header">✅ መልስ ተልኳል</div>
                        <p>${reply.message}</p>
                        <small>የተላከበት: ${new Date(reply.created_at).toLocaleString('am-ET')}</small>
                    </div>
                ` : `
                    <div class="reply-form">
                        <textarea id="reply-${sub.id}" placeholder="መልስዎን እዚህ ይጻፉ..." rows="3"></textarea>
                        <button onclick="sendReply('${sub.id}')" class="btn-reply">📤 መልስ ላክ</button>
                    </div>
                `}
            </div>
        `}).join('');
    } catch (error) {
        showError('መረጃዎችን መጫን አልተቻለም።');
    }
}

// Send reply
async function sendReply(submissionId) {
    const replyText = document.getElementById(`reply-${submissionId}`).value.trim();
    
    if (!replyText) {
        showError('እባክዎ መልስ ያስገቡ');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submission_id: submissionId,
                message: replyText,
                sent_by: currentUser.name
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('መልስ በተሳካ ሁኔታ ተልኳል!');
            await loadAllSubmissions();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    }
}

// Load user's own submissions
async function loadUserSubmissions() {
    const userSubmissionsList = document.getElementById('userSubmissionsList');
    
    try {
        const response = await fetch(`${API_URL}/submissions/${currentUser.username}`);
        const data = await response.json();
        
        if (!data.success || data.submissions.length === 0) {
            userSubmissionsList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--gray);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
                    <p>እስካሁን ምንም መረጃ አልላኩም።</p>
                </div>
            `;
            return;
        }

        userSubmissionsList.innerHTML = data.submissions.map(sub => {
            const reply = sub.replies && sub.replies.length > 0 ? sub.replies[0] : null;
            return `
            <div class="submission-item">
                <h4>መረጃ #${sub.id.slice(0, 8)}</h4>
                <p><strong>ቀን:</strong> ${sub.date}</p>
                <p><strong>የተላከበት ጊዜ:</strong> ${new Date(sub.created_at).toLocaleString('am-ET')}</p>
                ${sub.full_name ? `<p><strong>ሙሉ ስም:</strong> ${sub.full_name}</p>` : ''}
                <p><strong>መረጃ:</strong> ${sub.message}</p>
                ${sub.attachment_url ? `<a href="${sub.attachment_url}" target="_blank" class="attachment-link">📎 ${sub.attachment_name} (${(sub.attachment_size / 1024).toFixed(2)} KB)</a>` : ''}
                
                ${reply ? `
                    <div class="reply-section admin-reply">
                        <div class="reply-header">💬 መልስ ከአስተዳዳሪ</div>
                        <p>${reply.message}</p>
                        <small>የተላከበት: ${new Date(reply.created_at).toLocaleString('am-ET')}</small>
                    </div>
                ` : `
                    <div class="status-badge pending">⏳ መልስ በመጠበቅ ላይ</div>
                `}
            </div>
        `}).join('');
    } catch (error) {
        showError('መረጃዎችን መጫን አልተቻለም።');
    }
}

// Logout Handler
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    loginCard.style.display = 'block';
    formCard.style.display = 'none';
    adminCard.style.display = 'none';
    userSubmissionsCard.style.display = 'none';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
    loginForm.reset();
});

// Success/Error messages
function showSuccess(message) {
    const existingMsg = document.querySelector('.success-message');
    if (existingMsg) existingMsg.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    if (currentUser && currentUser.role === 'admin') {
        adminCard.insertBefore(successDiv, adminCard.firstChild);
    } else {
        formCard.insertBefore(successDiv, formCard.firstChild);
    }
    
    setTimeout(() => successDiv.remove(), 4000);
}

function showError(message) {
    const existingMsg = document.querySelector('.error-message');
    if (existingMsg) existingMsg.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    if (currentUser && currentUser.role === 'admin') {
        adminCard.insertBefore(errorDiv, adminCard.firstChild);
    } else {
        loginCard.insertBefore(errorDiv, loginForm);
    }
    
    setTimeout(() => errorDiv.remove(), 4000);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').valueAsDate = new Date();
    
    if (currentUser) {
        showDashboard();
    }
});


// Tab Switching
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tab === 'submissions') {
        document.getElementById('submissionsTab').classList.add('active');
        loadAllSubmissions();
    } else if (tab === 'users') {
        document.getElementById('usersTab').classList.add('active');
        loadUsers();
    }
}

// Load all users
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    
    try {
        console.log('Fetching users from:', `${API_URL}/users`); // Debug log
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        
        console.log('Users API response:', data); // Debug log
        
        if (!data.success) {
            console.error('API error:', data.error);
            showError('ተጠቃሚዎችን መጫን አልተቻለም: ' + (data.error || 'Unknown error'));
            return;
        }
        
        if (!data.users || data.users.length === 0) {
            usersList.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">👥</div>
                    <p style="font-size: 1.2rem;">ምንም ተጠቃሚ የለም።</p>
                </div>
            `;
            return;
        }

        const users = data.users;
        const adminCount = users.filter(u => u.role === 'admin').length;
        const userCount = users.filter(u => u.role === 'user').length;

        // Add stats
        const statsHTML = `
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <h3>${users.length}</h3>
                    <p>ጠቅላላ ተጠቃሚዎች</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <h3>${adminCount}</h3>
                    <p>አስተዳዳሪዎች</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <h3>${userCount}</h3>
                    <p>መደበኛ ተጠቃሚዎች</p>
                </div>
            </div>
        `;

        usersList.innerHTML = statsHTML + `
            <div class="users-grid">
                ${users.map(user => `
                    <div class="user-card">
                        <div class="user-card-header">
                            <div class="user-avatar">${user.name.charAt(0)}</div>
                            <div class="user-actions">
                                <button class="btn-icon edit" onclick='editUser(${JSON.stringify(user).replace(/'/g, "&#39;")})' title="አርትዕ">✏️</button>
                                <button class="btn-icon delete" onclick="deleteUser('${user.id}', '${user.username.replace(/'/g, "&#39;")}')" title="ሰርዝ">🗑️</button>
                            </div>
                        </div>
                        <div class="user-info">
                            <h3>${user.name}</h3>
                            <p>👤 ${user.username}</p>
                            <p>📅 ${new Date(user.created_at).toLocaleDateString('am-ET')}</p>
                            <span class="user-role-badge ${user.role}">${user.role === 'admin' ? '👨‍💼 አስተዳዳሪ' : '👤 ተጠቃሚ'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        showError('ተጠቃሚዎችን መጫን አልተቻለም: ' + error.message);
    }
}

// Show add user modal
function showAddUserModal() {
    document.getElementById('modalTitle').textContent = 'አዲስ ተጠቃሚ ጨምር';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').classList.add('show');
}

// Edit user
function editUser(user) {
    document.getElementById('modalTitle').textContent = 'ተጠቃሚ አርትዕ';
    document.getElementById('userId').value = user.id;
    document.getElementById('modalUsername').value = user.username;
    document.getElementById('modalName').value = user.name;
    document.getElementById('modalPassword').value = '';
    document.getElementById('modalPassword').placeholder = 'ባዶ ይተዉት ካልተቀየረ';
    document.getElementById('modalPassword').required = false;
    document.getElementById('modalRole').value = user.role;
    document.getElementById('userModal').classList.add('show');
}

// Close modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
    document.getElementById('userForm').reset();
}

// Handle user form submission
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('modalUsername').value,
        name: document.getElementById('modalName').value,
        role: document.getElementById('modalRole').value
    };
    
    const password = document.getElementById('modalPassword').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/users`;
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(userId ? 'ተጠቃሚ በተሳካ ሁኔታ ተዘምኗል!' : 'ተጠቃሚ በተሳካ ሁኔታ ተጨምሯል!');
            closeUserModal();
            loadUsers();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    }
});

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`"${username}" የተባለውን ተጠቃሚ መሰረዝ ይፈልጋሉ?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('ተጠቃሚ በተሳካ ሁኔታ ተሰርዟል!');
            loadUsers();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeUserModal();
    }
}


// Delete submission (admin only)
async function deleteSubmission(submissionId) {
    if (!confirm('ይህን መረጃ ከእርስዎ እይታ መደበቅ ይፈልጋሉ? (ተጠቃሚው አሁንም ማየት ይችላል)')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('መረጃው ከእይታ ተደብቋል!');
            await loadAllSubmissions();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
    }
}

// Toggle content visibility
function toggleContent(contentId) {
    const contentDiv = document.getElementById(contentId);
    if (contentDiv.style.display === 'none') {
        contentDiv.style.display = 'block';
    } else {
        contentDiv.style.display = 'none';
    }
}
