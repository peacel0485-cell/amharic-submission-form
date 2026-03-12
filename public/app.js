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
            info_type: document.getElementById('infoType').value,
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
                ${sub.info_type ? `<p><strong>የመረጃ አይነት:</strong> ${sub.info_type}</p>` : ''}
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
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <h4>መረጃ #${sub.id.slice(0, 8)}</h4>
                    <button class="btn-icon delete" onclick="deleteUserSubmission('${sub.id}')" title="ሰርዝ" style="color: var(--danger);">🗑️</button>
                </div>
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

// Delete user's own submission
async function deleteUserSubmission(submissionId) {
    const currentLang = localStorage.getItem('preferredLanguage') || 'am';
    const confirmMsg = translations[currentLang]['delete-confirm'];
    const successMsg = translations[currentLang]['delete-success'];
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/submissions/${submissionId}/user/${currentUser.username}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(successMsg);
            await loadUserSubmissions();
        } else {
            showError('ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ।');
        }
    } catch (error) {
        showError('ግንኙነት ስህተት። እባክዎ እንደገና ይሞክሩ።');
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
    } else if (tab === 'analytics') {
        document.getElementById('analyticsTab').classList.add('active');
        loadAnalytics();
    } else if (tab === 'users') {
        document.getElementById('usersTab').classList.add('active');
        loadUsers();
    }
}

// Load analytics and reports
async function loadAnalytics() {
    const analyticsContent = document.getElementById('analyticsContent');
    
    try {
        const response = await fetch(`${API_URL}/submissions`);
        const data = await response.json();
        
        if (!data.success || data.submissions.length === 0) {
            analyticsContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📊</div>
                    <p style="font-size: 1.2rem;">ምንም መረጃ የለም።</p>
                </div>
            `;
            return;
        }

        const submissions = data.submissions;
        
        // Count by info type
        const infoTypeCounts = {};
        submissions.forEach(sub => {
            if (sub.info_type) {
                infoTypeCounts[sub.info_type] = (infoTypeCounts[sub.info_type] || 0) + 1;
            }
        });
        
        // Sort by count descending
        const sortedTypes = Object.entries(infoTypeCounts)
            .sort((a, b) => b[1] - a[1]);
        
        // Calculate percentages
        const total = submissions.length;
        
        // Get date range
        const dates = submissions.map(s => new Date(s.created_at));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        // Count by date (last 7 days)
        const last7Days = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days[dateStr] = 0;
        }
        
        submissions.forEach(sub => {
            const dateStr = sub.created_at.split('T')[0];
            if (last7Days.hasOwnProperty(dateStr)) {
                last7Days[dateStr]++;
            }
        });

        analyticsContent.innerHTML = `
            <div class="analytics-summary">
                <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);">
                    <h3>${total}</h3>
                    <p>ጠቅላላ ሪፖርቶች</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <h3>${submissions.filter(s => s.attachment_url).length}</h3>
                    <p>ከማስረጃ ጋር</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <h3>${new Set(submissions.map(s => s.username)).size}</h3>
                    <p>ተጠቃሚዎች</p>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
                    <h3>${sortedTypes.length}</h3>
                    <p>የመረጃ አይነቶች</p>
                </div>
            </div>
            
            <div class="analytics-section">
                <h3>📈 የመረጃ አይነት ስታቲስቲክስ</h3>
                <div class="info-type-stats">
                    ${sortedTypes.map(([type, count], index) => {
                        const percentage = ((count / total) * 100).toFixed(1);
                        const colors = [
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                            'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                            'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        ];
                        const color = colors[index % colors.length];
                        
                        return `
                            <div class="info-type-item">
                                <div class="info-type-header">
                                    <span class="info-type-name">${index + 1}. ${type || 'ያልተገለጸ'}</span>
                                    <span class="info-type-count">${count} ሪፖርቶች (${percentage}%)</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%; background: ${color};"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="analytics-section">
                <h3>📅 የመጨረሻዎቹ 7 ቀናት አዝማሚያ</h3>
                <div class="timeline-chart">
                    ${Object.entries(last7Days).map(([date, count]) => {
                        const maxCount = Math.max(...Object.values(last7Days));
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('am-ET', { weekday: 'short' });
                        
                        return `
                            <div class="timeline-bar">
                                <div class="bar-container">
                                    <div class="bar-fill" style="height: ${height}%;" title="${count} ሪፖርቶች"></div>
                                </div>
                                <div class="bar-label">${dayName}</div>
                                <div class="bar-count">${count}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="analytics-section">
                <h3>📍 የመረጃ ጊዜ ክልል</h3>
                <p style="color: var(--gray); margin-top: 10px;">
                    <strong>ከ:</strong> ${minDate.toLocaleDateString('am-ET')} 
                    <strong>እስከ:</strong> ${maxDate.toLocaleDateString('am-ET')}
                </p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading analytics:', error);
        analyticsContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--danger);">
                <p>ስታቲስቲክስ መጫን አልተቻለም።</p>
            </div>
        `;
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


// Language translations
const translations = {
    am: {
        'main-title': '🛡️ የፀጥታ መረጃ ማስገቢያ ስርዓት',
        'subtitle': 'Security Information Submission System',
        'login-title': 'የፀጥታ መግቢያ',
        'username-label': 'የተጠቃሚ ስም',
        'username-placeholder': 'የተጠቃሚ ስም ያስገቡ',
        'password-label': 'የይለፍ ቃል',
        'password-placeholder': 'የይለፍ ቃል ያስገቡ',
        'login-btn': 'ግባ',
        'my-reports': 'የእኔ የፀጥታ ሪፖርቶች',
        'form-title': 'የፀጥታ መረጃ ማስገቢያ',
        'date-label': 'ቀን *',
        'info-type-label': 'የመረጃ አይነት *',
        'select-option': '-- ይምረጡ --',
        'info-type-theft': 'ስርቆት (ንጥቂያ)',
        'info-type-antipeace': 'ፀረ ሰላም ሀይል',
        'info-type-shene': '   • ሸኔ',
        'info-type-fano': '   • ፋኖ',
        'info-type-foreign': '   • የውጪ ዜጋ',
        'info-type-disaster': 'የተፈጥሮ ወይም ሰው ሰራሽ አደጋ',
        'info-type-violence': 'ውንብድና ወንጀል',
        'info-type-murder': '   • ግድያ',
        'info-type-kidnap': '   • እገታ',
        'info-type-organized': '   • የተደራጀ ስርቆት',
        'info-type-economic': 'የኢኮኖሚ አሻጥር',
        'info-type-inflation': '   • ዋጋ ንረት (ጭማሪ)',
        'info-type-contraband': '   • ኮንትሮባንድ',
        'fullname-label': 'ሙሉ ስም',
        'fullname-placeholder': 'ሙሉ ስምዎን ያስገቡ',
        'address-title': 'አድራሻ',
        'subcity-label': 'ክ/ከተማ',
        'subcity-placeholder': 'ክፍለ ከተማ',
        'woreda-label': 'ወረዳ',
        'woreda-placeholder': 'ወረዳ',
        'ketena-label': 'ቀጠና',
        'ketena-placeholder': 'ቀጠና',
        'block-label': 'ብሎክ',
        'block-placeholder': 'ብሎክ',
        'house-label': 'የቤት ቁጥር',
        'house-placeholder': 'የቤት ቁጥር',
        'phone-label': 'ስልክ ቁጥር',
        'message-label': 'መላክ የፈለጉትን መረጃ በግልጽ ይጻፉልን *',
        'message-placeholder': 'መረጃዎን እዚህ ይጻፉ...',
        'attachment-label': 'ተያያዥ ማስረጃ',
        'attachment-hint': '📎 ምስል፣ ቪዲዮ ወይም PDF ፋይል ያያይዙ',
        'submit-btn': 'ላክ',
        'admin-reports': '🛡️ የፀጥታ ሪፖርቶች',
        'admin-analytics': '📊 ሪፖርት እና ትንተና',
        'admin-users': '👥 የተጠቃሚዎች አስተዳደር',
        'add-user-btn': '➕ አዲስ ተጠቃሚ ጨምር',
        'add-user-title': 'አዲስ ተጠቃሚ ጨምር',
        'role-label': 'ሚና *',
        'role-user': 'ተጠቃሚ',
        'role-admin': 'አስተዳዳሪ',
        'cancel-btn': 'ሰርዝ',
        'save-btn': 'አስቀምጥ',
        'logout-btn': 'ውጣ',
        'delete-confirm': 'ይህን መረጃ መሰረዝ ይፈልጋሉ? ይህ ድርጊት መልሰው ማግኘት አይችሉም።',
        'delete-success': 'መረጃው በተሳካ ሁኔታ ተሰርዟል!'
    },
    om: {
        'main-title': '🛡️ Sirna Odeeffannoo Nageenyaa',
        'subtitle': 'Security Information Submission System',
        'login-title': 'Seensa Nageenyaa',
        'username-label': 'Maqaa Fayyadamaa',
        'username-placeholder': 'Maqaa fayyadamaa galchi',
        'password-label': 'Jecha Icciitii',
        'password-placeholder': 'Jecha icciitii galchi',
        'login-btn': 'Seeni',
        'my-reports': 'Gabaasota Nageenyaa Koo',
        'form-title': 'Odeeffannoo Nageenyaa Galchuu',
        'date-label': 'Guyyaa *',
        'info-type-label': 'Gosa Odeeffannoo *',
        'select-option': '-- Filadhu --',
        'info-type-theft': 'Hanna (Hatuu)',
        'info-type-antipeace': 'Humna Nagaa Mormuu',
        'info-type-shene': '   • Shanee',
        'info-type-fano': '   • Faanoo',
        'info-type-foreign': '   • Lammii Alaa',
        'info-type-disaster': 'Balaa Uumamaa ykn Namtolchee',
        'info-type-violence': 'Yakka Goolii',
        'info-type-murder': '   • Ajjeechaa',
        'info-type-kidnap': '   • Boojiuu',
        'info-type-organized': '   • Hanna Gurmaa\'e',
        'info-type-economic': 'Goolii Dinagdee',
        'info-type-inflation': '   • Gatii Ol Ka\'uu',
        'info-type-contraband': '   • Kontrabaandii',
        'fullname-label': 'Maqaa Guutuu',
        'fullname-placeholder': 'Maqaa guutuu kee galchi',
        'address-title': 'Teessoo',
        'subcity-label': 'Magaalaa Xiqqaa',
        'subcity-placeholder': 'Magaalaa xiqqaa',
        'woreda-label': 'Aanaa',
        'woreda-placeholder': 'Aanaa',
        'ketena-label': 'Gandaa',
        'ketena-placeholder': 'Gandaa',
        'block-label': 'Bulooka',
        'block-placeholder': 'Bulooka',
        'house-label': 'Lakkoofsa Manaa',
        'house-placeholder': 'Lakkoofsa manaa',
        'phone-label': 'Lakkoofsa Bilbilaa',
        'message-label': 'Odeeffannoo erguu barbaaddu ifatti barreessi *',
        'message-placeholder': 'Odeeffannoo kee asitti barreessi...',
        'attachment-label': 'Ragaa Maxxanfamaa',
        'attachment-hint': '📎 Suuraa, viidiyoo ykn faayilii PDF maxxansi',
        'submit-btn': 'Ergi',
        'admin-reports': '🛡️ Gabaasota Nageenyaa',
        'admin-analytics': '📊 Gabaasa fi Xiinxala',
        'admin-users': '👥 Bulchiinsa Fayyadamtoota',
        'add-user-btn': '➕ Fayyadamaa Haaraa Dabali',
        'add-user-title': 'Fayyadamaa Haaraa Dabali',
        'role-label': 'Gahee *',
        'role-user': 'Fayyadamaa',
        'role-admin': 'Bulchaa',
        'cancel-btn': 'Haqii',
        'save-btn': 'Olkaa\'i',
        'logout-btn': 'Ba\'i',
        'delete-confirm': 'Odeeffannoo kana haquu barbaaddaa? Tarkaanfiin kun deebi\'amee hin argamu.',
        'delete-success': 'Odeeffannoon milkaa\'inaan haqame!'
    },
    en: {
        'main-title': '🛡️ Security Information Submission System',
        'subtitle': 'Security Information Submission System',
        'login-title': 'Security Login',
        'username-label': 'Username',
        'username-placeholder': 'Enter username',
        'password-label': 'Password',
        'password-placeholder': 'Enter password',
        'login-btn': 'Login',
        'my-reports': 'My Security Reports',
        'form-title': 'Security Information Submission',
        'date-label': 'Date *',
        'info-type-label': 'Information Type *',
        'select-option': '-- Select --',
        'info-type-theft': 'Theft (Robbery)',
        'info-type-antipeace': 'Anti-Peace Forces',
        'info-type-shene': '   • Shene',
        'info-type-fano': '   • Fano',
        'info-type-foreign': '   • Foreign National',
        'info-type-disaster': 'Natural or Man-made Disaster',
        'info-type-violence': 'Violent Crime',
        'info-type-murder': '   • Murder',
        'info-type-kidnap': '   • Kidnapping',
        'info-type-organized': '   • Organized Theft',
        'info-type-economic': 'Economic Crime',
        'info-type-inflation': '   • Price Inflation',
        'info-type-contraband': '   • Contraband',
        'fullname-label': 'Full Name',
        'fullname-placeholder': 'Enter your full name',
        'address-title': 'Address',
        'subcity-label': 'Sub-City',
        'subcity-placeholder': 'Sub-city',
        'woreda-label': 'Woreda',
        'woreda-placeholder': 'Woreda',
        'ketena-label': 'Ketena',
        'ketena-placeholder': 'Ketena',
        'block-label': 'Block',
        'block-placeholder': 'Block',
        'house-label': 'House Number',
        'house-placeholder': 'House number',
        'phone-label': 'Phone Number',
        'message-label': 'Write your information clearly *',
        'message-placeholder': 'Write your information here...',
        'attachment-label': 'Attachment Evidence',
        'attachment-hint': '📎 Attach image, video or PDF file',
        'submit-btn': 'Submit',
        'admin-reports': '🛡️ Security Reports',
        'admin-analytics': '📊 Reports & Analytics',
        'admin-users': '👥 User Management',
        'add-user-btn': '➕ Add New User',
        'add-user-title': 'Add New User',
        'role-label': 'Role *',
        'role-user': 'User',
        'role-admin': 'Admin',
        'cancel-btn': 'Cancel',
        'save-btn': 'Save',
        'logout-btn': 'Logout',
        'delete-confirm': 'Do you want to delete this information? This action cannot be undone.',
        'delete-success': 'Information deleted successfully!'
    }
};

// Change language function
function changeLanguage(lang) {
    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// Initialize language on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'am';
    changeLanguage(savedLang);
});
