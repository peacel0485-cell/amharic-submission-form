// Load data from localStorage or initialize empty
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let submissions = JSON.parse(localStorage.getItem('submissions')) || [];
let replies = JSON.parse(localStorage.getItem('replies')) || {};

// Demo users
const users = {
    'admin': { password: 'admin123', role: 'admin', name: 'አስተዳዳሪ' },
    'user1': { password: 'user123', role: 'user', name: 'ተጠቃሚ 1' }
};

// Save to localStorage
function saveData() {
    localStorage.setItem('submissions', JSON.stringify(submissions));
    localStorage.setItem('replies', JSON.stringify(replies));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

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
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('.btn-submit');
    
    // Add loading state
    submitBtn.innerHTML = 'በመግባት ላይ... <span class="loading-spinner"></span>';
    submitBtn.disabled = true;

    setTimeout(() => {
        if (users[username] && users[username].password === password) {
            currentUser = { username, ...users[username] };
            // Only save currentUser, don't overwrite submissions/replies yet
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            submitBtn.innerHTML = 'ግባ';
            submitBtn.disabled = false;
            showDashboard();
        } else {
            showError('የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል');
            submitBtn.innerHTML = 'ግባ';
            submitBtn.disabled = false;
        }
    }, 800);
});

// Show appropriate dashboard
function showDashboard() {
    // Reload data from localStorage to ensure it's fresh
    const storedSubmissions = localStorage.getItem('submissions');
    const storedReplies = localStorage.getItem('replies');
    
    console.log('Raw localStorage submissions:', storedSubmissions); // Debug
    console.log('Raw localStorage replies:', storedReplies); // Debug
    
    submissions = JSON.parse(storedSubmissions) || [];
    replies = JSON.parse(storedReplies) || {};
    
    loginCard.style.display = 'none';
    logoutBtn.style.display = 'block';
    userInfo.textContent = `እንኳን ደህና መጡ ${currentUser.name}`;

    console.log('Current submissions:', submissions); // Debug log
    console.log('Submissions length:', submissions.length); // Debug log

    if (currentUser.role === 'admin') {
        adminCard.style.display = 'block';
        formCard.style.display = 'none';
        userSubmissionsCard.style.display = 'none';
        loadSubmissions();
    } else {
        formCard.style.display = 'block';
        adminCard.style.display = 'none';
        userSubmissionsCard.style.display = 'block';
        loadUserSubmissions();
    }
}

// Submission Form Handler
submissionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.btn-submit');
    
    // Add loading state
    submitBtn.innerHTML = 'በመላክ ላይ... <span class="loading-spinner"></span>';
    submitBtn.disabled = true;

    setTimeout(() => {
        const formData = {
            id: Date.now(),
            username: currentUser.username,
            date: document.getElementById('date').value,
            fullName: document.getElementById('fullName').value,
            address: {
                subCity: document.getElementById('subCity').value,
                woreda: document.getElementById('woreda').value,
                ketena: document.getElementById('ketena').value,
                block: document.getElementById('block').value,
                houseNumber: document.getElementById('houseNumber').value
            },
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value,
            attachment: null,
            submittedAt: new Date().toLocaleString('am-ET')
        };

        // Handle file upload
        const fileInput = document.getElementById('attachment');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            formData.attachment = {
                name: file.name,
                type: file.type,
                size: file.size
            };
        }

        submissions.push(formData);
        saveData(); // Save to localStorage
        console.log('Submission added. Total submissions:', submissions.length); // Debug log
        console.log('Submissions array:', submissions); // Debug log
        
        showSuccess('መረጃው በተሳካ ሁኔታ ተልኳል!');
        submissionForm.reset();
        submitBtn.innerHTML = 'ላክ';
        submitBtn.disabled = false;
        
        // Refresh user submissions list
        loadUserSubmissions();
    }, 1000);
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    // Only save currentUser, don't overwrite submissions and replies
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    loginCard.style.display = 'block';
    formCard.style.display = 'none';
    adminCard.style.display = 'none';
    userSubmissionsCard.style.display = 'none';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
    loginForm.reset();
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Reload data from localStorage on page load
    submissions = JSON.parse(localStorage.getItem('submissions')) || [];
    replies = JSON.parse(localStorage.getItem('replies')) || {};
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    console.log('Page loaded. Submissions from localStorage:', submissions.length);
    
    // If user is already logged in, show their dashboard
    if (currentUser) {
        showDashboard();
    }
});

// Load submissions for admin
function loadSubmissions() {
    const submissionsList = document.getElementById('submissionsList');
    
    console.log('Loading submissions for admin. Total:', submissions.length); // Debug log
    
    if (submissions.length === 0) {
        submissionsList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
                <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                <p style="font-size: 1.2rem;">ምንም መረጃ አልተላከም።</p>
            </div>
        `;
        return;
    }

    // Add stats
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${submissions.length}</h3>
                <p>ጠቅላላ መረጃዎች</p>
            </div>
            <div class="stat-card">
                <h3>${submissions.filter(s => s.attachment).length}</h3>
                <p>ከማስረጃ ጋር</p>
            </div>
            <div class="stat-card">
                <h3>${new Set(submissions.map(s => s.username)).size}</h3>
                <p>ተጠቃሚዎች</p>
            </div>
        </div>
    `;

    submissionsList.innerHTML = statsHTML + submissions.map(sub => {
        const reply = replies[sub.id];
        return `
        <div class="submission-item">
            <h4>መረጃ #${sub.id}</h4>
            <p><strong>ተጠቃሚ:</strong> ${sub.username}</p>
            <p><strong>ቀን:</strong> ${sub.date}</p>
            <p><strong>የተላከበት ጊዜ:</strong> ${sub.submittedAt}</p>
            ${sub.fullName ? `<p><strong>ሙሉ ስም:</strong> ${sub.fullName}</p>` : ''}
            ${sub.phone ? `<p><strong>ስልክ:</strong> ${sub.phone}</p>` : ''}
            ${sub.address.subCity ? `<p><strong>አድራሻ:</strong> ${sub.address.subCity}, ${sub.address.woreda}, ${sub.address.ketena}</p>` : ''}
            <p><strong>መረጃ:</strong> ${sub.message}</p>
            ${sub.attachment ? `<a href="#" class="attachment-link">📎 ${sub.attachment.name} (${(sub.attachment.size / 1024).toFixed(2)} KB)</a>` : ''}
            
            ${reply ? `
                <div class="reply-section">
                    <div class="reply-header">✅ መልስ ተልኳል</div>
                    <p>${reply.message}</p>
                    <small>የተላከበት: ${reply.sentAt}</small>
                </div>
            ` : `
                <div class="reply-form">
                    <textarea id="reply-${sub.id}" placeholder="መልስዎን እዚህ ይጻፉ..." rows="3"></textarea>
                    <button onclick="sendReply(${sub.id})" class="btn-reply">📤 መልስ ላክ</button>
                </div>
            `}
        </div>
    `}).join('');
    
    console.log('Admin dashboard updated with', submissions.length, 'submissions'); // Debug log
}

// Send reply from admin
function sendReply(submissionId) {
    const replyText = document.getElementById(`reply-${submissionId}`).value.trim();
    
    if (!replyText) {
        showError('እባክዎ መልስ ያስገቡ');
        return;
    }
    
    replies[submissionId] = {
        message: replyText,
        sentAt: new Date().toLocaleString('am-ET'),
        sentBy: currentUser.name
    };
    
    saveData(); // Save to localStorage
    showSuccess('መልስ በተሳካ ሁኔታ ተልኳል!');
    loadSubmissions();
}

// Load user's own submissions
function loadUserSubmissions() {
    const userSubmissionsList = document.getElementById('userSubmissionsList');
    const userSubs = submissions.filter(s => s.username === currentUser.username);
    
    if (userSubs.length === 0) {
        userSubmissionsList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gray);">
                <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
                <p>እስካሁን ምንም መረጃ አልላኩም።</p>
            </div>
        `;
        return;
    }
    
    userSubmissionsList.innerHTML = userSubs.map(sub => {
        const reply = replies[sub.id];
        return `
        <div class="submission-item">
            <h4>መረጃ #${sub.id}</h4>
            <p><strong>ቀን:</strong> ${sub.date}</p>
            <p><strong>የተላከበት ጊዜ:</strong> ${sub.submittedAt}</p>
            ${sub.fullName ? `<p><strong>ሙሉ ስም:</strong> ${sub.fullName}</p>` : ''}
            <p><strong>መረጃ:</strong> ${sub.message}</p>
            ${sub.attachment ? `<div class="attachment-badge">📎 ${sub.attachment.name}</div>` : ''}
            
            ${reply ? `
                <div class="reply-section admin-reply">
                    <div class="reply-header">💬 መልስ ከአስተዳዳሪ</div>
                    <p>${reply.message}</p>
                    <small>የተላከበት: ${reply.sentAt}</small>
                </div>
            ` : `
                <div class="status-badge pending">⏳ መልስ በመጠበቅ ላይ</div>
            `}
        </div>
    `}).join('');
}

// Success message
function showSuccess(message) {
    const existingMsg = document.querySelector('.success-message');
    if (existingMsg) existingMsg.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert in the appropriate card
    if (currentUser.role === 'admin') {
        adminCard.insertBefore(successDiv, adminCard.firstChild);
    } else {
        formCard.insertBefore(successDiv, formCard.firstChild);
    }
    
    setTimeout(() => successDiv.remove(), 4000);
}

// Error message
function showError(message) {
    const existingMsg = document.querySelector('.error-message');
    if (existingMsg) existingMsg.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert in the appropriate card
    if (currentUser && currentUser.role === 'admin') {
        adminCard.insertBefore(errorDiv, adminCard.firstChild);
    } else {
        loginCard.insertBefore(errorDiv, loginForm);
    }
    
    setTimeout(() => errorDiv.remove(), 4000);
}
