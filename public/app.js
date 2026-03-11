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
        await loadAllSubmissions();
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
        const attachment = fileInput.files.length > 0 ? {
            name: fileInput.files[0].name,
            type: fileInput.files[0].type,
            size: fileInput.files[0].size
        } : null;

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
            attachment_name: attachment?.name,
            attachment_type: attachment?.type,
            attachment_size: attachment?.size
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
                <h4>መረጃ #${sub.id.slice(0, 8)}</h4>
                <p><strong>ተጠቃሚ:</strong> ${sub.username}</p>
                <p><strong>ቀን:</strong> ${sub.date}</p>
                <p><strong>የተላከበት ጊዜ:</strong> ${new Date(sub.created_at).toLocaleString('am-ET')}</p>
                ${sub.full_name ? `<p><strong>ሙሉ ስም:</strong> ${sub.full_name}</p>` : ''}
                ${sub.phone ? `<p><strong>ስልክ:</strong> ${sub.phone}</p>` : ''}
                ${sub.sub_city ? `<p><strong>አድራሻ:</strong> ${sub.sub_city}, ${sub.woreda}, ${sub.ketena}</p>` : ''}
                <p><strong>መረጃ:</strong> ${sub.message}</p>
                ${sub.attachment_name ? `<div class="attachment-badge">📎 ${sub.attachment_name}</div>` : ''}
                
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
                ${sub.attachment_name ? `<div class="attachment-badge">📎 ${sub.attachment_name}</div>` : ''}
                
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
