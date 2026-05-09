const API_URL = 'http://localhost:5000/api';
let currentSessionId = null;
let disturbanceChart = null;
let barChart = null;
let lineChart = null;
let monitoringInterval = null;
let sessionTimerInterval = null;
let sessionStartTime = null;

// Check authentication immediately when dashboard loads
document.addEventListener('DOMContentLoaded', async () => {
    // PROTECT DASHBOARD - Only lecturers can access
    if (!isAuthenticated()) {
        window.location.href = 'lecturer-login.html';
        return;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'lecturer') {
        alert('Access Denied! This dashboard is for lecturers only.');
        window.location.href = 'index.html';
        return;
    }
    
    // If authenticated, show dashboard content
    const dashboardContent = document.getElementById('dashboard-content');
    const loginRequired = document.getElementById('login-required');
    
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (loginRequired) loginRequired.style.display = 'none';
    
    // Display user info
    const lecturerNameSpan = document.getElementById('lecturer-name');
    if (lecturerNameSpan) lecturerNameSpan.textContent = user.name;
    
    // Initialize charts
    initializeCharts();
    
    // Check for active session
    await checkActiveSession();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    const startBtn = document.getElementById('start-session');
    const stopBtn = document.getElementById('stop-session');
    const uploadBtn = document.getElementById('upload-audio');
    const generateReportBtn = document.getElementById('generate-report');
    const audioUploadInput = document.getElementById('audio-upload');
    
    if (startBtn) startBtn.addEventListener('click', startSession);
    if (stopBtn) stopBtn.addEventListener('click', endSession);
    if (uploadBtn) uploadBtn.addEventListener('click', () => {
        if (audioUploadInput) audioUploadInput.click();
    });
    if (audioUploadInput) audioUploadInput.addEventListener('change', uploadAudio);
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);
}

// Initialize all charts
function initializeCharts() {
    // Pie Chart
    const pieCtx = document.getElementById('pie-chart')?.getContext('2d');
    if (pieCtx) {
        disturbanceChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['High Disturbance', 'Medium Disturbance', 'Low Disturbance'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#ff4444', '#ffaa00', '#00ff88'],
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'white', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bar Chart
    const barCtx = document.getElementById('bar-chart')?.getContext('2d');
    if (barCtx) {
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Disturbance Score',
                    data: [],
                    backgroundColor: 'rgba(0, 243, 255, 0.6)',
                    borderColor: '#00f3ff',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white', stepSize: 20 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'white', rotation: 45, maxRotation: 45 }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Score: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Line Chart
    const lineCtx = document.getElementById('line-chart')?.getContext('2d');
    if (lineCtx) {
        lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Overall Disturbance Level',
                    data: [],
                    borderColor: '#bf00ff',
                    backgroundColor: 'rgba(191, 0, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#bf00ff',
                    pointBorderColor: 'white',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'white', maxRotation: 45 }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }
}

// Check for active session
async function checkActiveSession() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/sessions/active/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.session && data.session.isActive) {
            currentSessionId = data.session._id;
            updateSessionUI(true, data.session);
            startMonitoring();
            startSessionTimer(data.session.startTime);
            await fetchSessionData();
        } else {
            updateSessionUI(false);
        }
    } catch (error) {
        console.error('Error checking active session:', error);
        updateSessionUI(false);
    }
}

// Fetch session data and update UI
async function fetchSessionData() {
    if (!currentSessionId) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/sessions/${currentSessionId}/report`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.report) {
            updateStats(data.report);
            updateCharts(data.report);
            updateStudentsList(data.report);
        }
    } catch (error) {
        console.error('Error fetching session data:', error);
    }
}

// Update statistics cards
function updateStats(report) {
    const totalDisturbances = document.getElementById('total-disturbances');
    const activeStudents = document.getElementById('active-students');
    const avgDisturbance = document.getElementById('avg-disturbance');
    
    if (totalDisturbances) {
        totalDisturbances.textContent = report.totalInterruptions || 0;
    }
    if (activeStudents) {
        activeStudents.textContent = report.allStudents?.length || 0;
    }
    if (avgDisturbance) {
        avgDisturbance.textContent = Math.floor(report.averageDisturbanceScore) || 0;
    }
}

// Update charts with new data
function updateCharts(report) {
    if (!report.allStudents) return;
    
    // Update Bar Chart
    if (barChart) {
        const sortedStudents = [...report.allStudents].sort((a, b) => b.disturbanceScore - a.disturbanceScore);
        const topStudents = sortedStudents.slice(0, 8);
        
        barChart.data.labels = topStudents.map(s => s.name.split(' ')[0]);
        barChart.data.datasets[0].data = topStudents.map(s => Math.floor(s.disturbanceScore));
        barChart.update();
    }
    
    // Update Pie Chart
    if (disturbanceChart) {
        const high = report.allStudents.filter(s => s.disturbanceScore > 100).length;
        const medium = report.allStudents.filter(s => s.disturbanceScore >= 50 && s.disturbanceScore <= 100).length;
        const low = report.allStudents.filter(s => s.disturbanceScore < 50).length;
        const total = high + medium + low;
        
        if (total > 0) {
            disturbanceChart.data.datasets[0].data = [
                (high / total) * 100,
                (medium / total) * 100,
                (low / total) * 100
            ];
        } else {
            disturbanceChart.data.datasets[0].data = [0, 0, 100];
        }
        disturbanceChart.update();
    }
}

// Update students list in live monitoring
function updateStudentsList(report) {
    const studentsList = document.getElementById('students-list');
    if (!studentsList) return;
    
    if (!report.allStudents || report.allStudents.length === 0) {
        studentsList.innerHTML = `
            <div class="student-item">
                <div class="student-info">
                    <h4>No disturbances detected</h4>
                    <p>Classroom is calm</p>
                </div>
            </div>
        `;
        return;
    }
    
    const sortedStudents = [...report.allStudents].sort((a, b) => b.disturbanceScore - a.disturbanceScore);
    
    studentsList.innerHTML = sortedStudents.map(student => `
        <div class="student-item">
            <div class="student-info">
                <h4>${escapeHtml(student.name)}</h4>
                <p>Roll: ${student.rollNumber} | Duration: ${student.talkingDuration}s | Interruptions: ${student.interruptions}</p>
            </div>
            <div class="disturbance-score ${student.disturbanceScore > 100 ? 'high' : ''}">
                ${Math.floor(student.disturbanceScore)}
            </div>
        </div>
    `).join('');
}

// Start a new session
async function startSession() {
    const token = localStorage.getItem('token');
    const className = prompt('Enter class name:', 'CS101 - Lecture');
    
    if (!className) return;
    
    const startBtn = document.getElementById('start-session');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="spinner"></span> Starting...';
    }
    
    try {
        const response = await fetch(`${API_URL}/sessions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ className })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentSessionId = data.session._id;
            sessionStartTime = new Date(data.session.startTime);
            updateSessionUI(true, data.session);
            startMonitoring();
            startSessionTimer(sessionStartTime);
            showToast('Session started successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to start session', 'error');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Start Session';
            }
        }
    } catch (error) {
        console.error('Error starting session:', error);
        showToast('Network error. Please try again.', 'error');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start Session';
        }
    }
}

// End current session
async function endSession() {
    if (!currentSessionId) return;
    
    const token = localStorage.getItem('token');
    const stopBtn = document.getElementById('stop-session');
    
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.innerHTML = '<span class="spinner"></span> Ending...';
    }
    
    try {
        const response = await fetch(`${API_URL}/sessions/${currentSessionId}/end`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (monitoringInterval) clearInterval(monitoringInterval);
            if (sessionTimerInterval) clearInterval(sessionTimerInterval);
            updateSessionUI(false);
            showToast('Session ended successfully!', 'success');
            await generateReport();
            currentSessionId = null;
            sessionStartTime = null;
        } else {
            showToast(data.message || 'Failed to end session', 'error');
        }
    } catch (error) {
        console.error('Error ending session:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Session';
        }
    }
}

// Start real-time monitoring simulation
function startMonitoring() {
    if (monitoringInterval) clearInterval(monitoringInterval);
    
    // Simulate real-time monitoring data every 5 seconds
    monitoringInterval = setInterval(() => {
        if (currentSessionId) {
            simulateDisturbanceData();
        }
    }, 5000);
}

// Simulate AI disturbance detection
function simulateDisturbanceData() {
    const students = [
        { id: '1', name: 'Rahul Sharma', rollNumber: 'CS2024001' },
        { id: '2', name: 'Aman Verma', rollNumber: 'CS2024002' },
        { id: '3', name: 'Sneha Reddy', rollNumber: 'CS2024003' },
        { id: '4', name: 'Vivek Patel', rollNumber: 'CS2024004' },
        { id: '5', name: 'Neha Gupta', rollNumber: 'CS2024005' },
        { id: '6', name: 'Arjun Singh', rollNumber: 'CS2024006' },
        { id: '7', name: 'Priya Sharma', rollNumber: 'CS2024007' },
        { id: '8', name: 'Kunal Mehta', rollNumber: 'CS2024008' }
    ];
    
    // Randomly select a student
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const talkingDuration = Math.floor(Math.random() * 15) + 1;
    const interruptions = Math.floor(Math.random() * 5);
    const volumeLevel = Math.random() * 80 + 20;
    
    // Calculate disturbance score
    const disturbanceScore = (interruptions * 5) + (talkingDuration * 2) + (volumeLevel * 3);
    
    // Only add if disturbance is significant
    if (disturbanceScore > 30) {
        sendDisturbanceData(
            randomStudent.id,
            randomStudent.name,
            randomStudent.rollNumber,
            talkingDuration,
            interruptions,
            volumeLevel
        );
    }
}

// Send disturbance data to backend
async function sendDisturbanceData(studentId, studentName, rollNumber, talkingDuration, interruptions, volumeLevel) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/sessions/${currentSessionId}/disturbance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId,
                talkingDuration,
                interruptions,
                volumeLevel
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update UI with new data
            await fetchSessionData();
            
            // Update line chart with new data point
            updateLineChart();
            
            // Show notification for high disturbance
            const score = (interruptions * 5) + (talkingDuration * 2) + (volumeLevel * 3);
            if (score > 100) {
                showToast(`⚠️ High disturbance detected from ${studentName}!`, 'warning');
            }
        }
    } catch (error) {
        console.error('Error sending disturbance data:', error);
    }
}

// Update line chart with new data point
function updateLineChart() {
    if (!lineChart) return;
    
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Add new time label
    lineChart.data.labels.push(timeLabel);
    
    // Keep only last 20 data points
    if (lineChart.data.labels.length > 20) {
        lineChart.data.labels.shift();
        lineChart.data.datasets[0].data.shift();
    }
    
    // Generate random disturbance value for demo
    const newValue = Math.floor(Math.random() * 100) + 20;
    lineChart.data.datasets[0].data.push(newValue);
    lineChart.update();
}

// Start session timer
function startSessionTimer(startTime) {
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    
    sessionTimerInterval = setInterval(() => {
        if (!sessionStartTime) return;
        
        const now = new Date();
        const diff = Math.floor((now - sessionStartTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        const sessionDurationSpan = document.getElementById('session-duration');
        if (sessionDurationSpan) {
            sessionDurationSpan.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Update session UI based on active state
function updateSessionUI(isActive, session = null) {
    const statusIndicator = document.getElementById('session-status');
    const statusText = document.getElementById('session-status-text');
    const sessionInfo = document.getElementById('session-info');
    const startBtn = document.getElementById('start-session');
    const stopBtn = document.getElementById('stop-session');
    
    if (isActive && session) {
        if (statusIndicator) {
            statusIndicator.classList.add('active');
        }
        if (statusText) statusText.textContent = 'Active';
        if (sessionInfo) {
            sessionInfo.innerHTML = `<i class="fas fa-chalkboard"></i> ${escapeHtml(session.className)} | Started: ${new Date(session.startTime).toLocaleTimeString()}`;
        }
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
    } else {
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
        }
        if (statusText) statusText.textContent = 'Inactive';
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (sessionInfo) sessionInfo.innerHTML = '<i class="fas fa-info-circle"></i> No active session';
        
        // Reset session duration display
        const sessionDurationSpan = document.getElementById('session-duration');
        if (sessionDurationSpan) sessionDurationSpan.textContent = '00:00:00';
    }
}

// Upload audio file for analysis
async function uploadAudio(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!currentSessionId) {
        showToast('Please start a session first', 'error');
        return;
    }
    
    if (!file.type.includes('audio')) {
        showToast('Please select an audio file', 'error');
        return;
    }
    
    showToast('Processing audio for disturbance detection...', 'info');
    
    // Simulate audio processing
    setTimeout(() => {
        // Generate multiple disturbances based on audio
        const numDisturbances = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < numDisturbances; i++) {
            setTimeout(() => {
                simulateDisturbanceData();
            }, i * 1000);
        }
        showToast(`Audio processed! ${numDisturbances} disturbances detected.`, 'success');
    }, 2000);
}

// Generate and display report
async function generateReport() {
    if (!currentSessionId) {
        showToast('No active session to generate report', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    const generateBtn = document.getElementById('generate-report');
    
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner"></span> Generating...';
    }
    
    try {
        const response = await fetch(`${API_URL}/sessions/${currentSessionId}/report`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.report) {
            displayReport(data.report);
            showToast('Report generated successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-file-alt"></i> Generate Report';
        }
    }
}

// Display report in UI
function displayReport(report) {
    const reportContainer = document.getElementById('report-content');
    if (!reportContainer) return;
    
    reportContainer.innerHTML = `
        <div class="report-cards">
            <div class="report-card">
                <h4><i class="fas fa-exclamation-triangle" style="color: #ff4444;"></i> Most Disturbing Student</h4>
                ${report.mostDisturbingStudent ? `
                    <p><strong>${escapeHtml(report.mostDisturbingStudent.name)}</strong></p>
                    <p>Roll: ${escapeHtml(report.mostDisturbingStudent.rollNumber)}</p>
                    <p class="score-high">Score: ${Math.floor(report.mostDisturbingStudent.score)}</p>
                ` : '<p>No data available</p>'}
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-star" style="color: #00ff88;"></i> Least Disturbing Student</h4>
                ${report.leastDisturbingStudent ? `
                    <p><strong>${escapeHtml(report.leastDisturbingStudent.name)}</strong></p>
                    <p>Roll: ${escapeHtml(report.leastDisturbingStudent.rollNumber)}</p>
                    <p class="score-low">Score: ${Math.floor(report.leastDisturbingStudent.score)}</p>
                ` : '<p>No data available</p>'}
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-silence" style="color: #00f3ff;"></i> Silent Students</h4>
                ${report.silentStudents && report.silentStudents.length > 0 ? 
                    report.silentStudents.map(s => `<p>• ${escapeHtml(s.name)} (${escapeHtml(s.rollNumber)})</p>`).join('') : 
                    '<p>No silent students recorded</p>'}
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-bell" style="color: #ffaa00;"></i> Total Interruptions</h4>
                <p class="stat-large">${report.totalInterruptions || 0}</p>
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-chart-line"></i> Average Disturbance Score</h4>
                <p class="stat-large">${Math.floor(report.averageDisturbanceScore) || 0}</p>
            </div>
            
            <div class="report-card">
                <h4><i class="fas fa-users"></i> Total Students Tracked</h4>
                <p class="stat-large">${report.allStudents?.length || 0}</p>
            </div>
        </div>
        
        <div class="report-actions">
            <button class="btn-glow" onclick="downloadReport()">
                <i class="fas fa-download"></i> Download Report (PDF)
            </button>
            <button class="btn-glass" onclick="shareReport()">
                <i class="fas fa-share-alt"></i> Share Report
            </button>
        </div>
    `;
}

// Download report as PDF (simulated)
function downloadReport() {
    showToast('Report downloaded successfully!', 'success');
}

// Share report (simulated)
function shareReport() {
    showToast('Report shared with admin!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add toast animation styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    }
    
    .toast-success {
        border-left: 4px solid var(--neon-green);
        color: var(--neon-green);
    }
    
    .toast-error {
        border-left: 4px solid #ff4444;
        color: #ff4444;
    }
    
    .toast-warning {
        border-left: 4px solid #ffaa00;
        color: #ffaa00;
    }
    
    .toast-info {
        border-left: 4px solid var(--neon-cyan);
        color: var(--neon-cyan);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .report-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
    }
    
    .report-card {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.3s ease;
    }
    
    .report-card:hover {
        border-color: var(--neon-cyan);
        transform: translateY(-3px);
    }
    
    .report-card h4 {
        color: var(--neon-cyan);
        margin-bottom: 0.75rem;
        font-size: 1rem;
    }
    
    .report-card p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .score-high {
        color: #ff6666;
        font-weight: bold;
        font-size: 1.1rem;
    }
    
    .score-low {
        color: var(--neon-green);
        font-weight: bold;
    }
    
    .stat-large {
        font-family: 'Orbitron', monospace;
        font-size: 2rem;
        font-weight: 700;
        color: var(--neon-yellow);
        margin-top: 0.5rem;
    }
    
    .report-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
        flex-wrap: wrap;
    }
    
    .report-actions button {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(toastStyles);