const API_URL = 'http://localhost:5000/api';
let studentPieChart = null;
let studentTrendChart = null;
let refreshInterval = null;

// Check authentication and load dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // PROTECT DASHBOARD - Only students can access
    if (!isAuthenticated()) {
        window.location.href = 'student-login.html';
        return;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'student') {
        alert('Access Denied! This dashboard is for students only.');
        window.location.href = 'index.html';
        return;
    }
    
    // Show dashboard content
    const dashboardContent = document.getElementById('dashboard-content');
    const loginRequired = document.getElementById('login-required');
    
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (loginRequired) loginRequired.style.display = 'none';
    
    // Display student name
    const studentNameSpan = document.getElementById('student-name');
    if (studentNameSpan) studentNameSpan.textContent = user.name;
    
    // Initialize charts
    initializeStudentCharts();
    
    // Load student data
    await loadStudentData();
    
    // Start auto-refresh every 30 seconds
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadStudentData, 30000);
});

// Initialize student charts
function initializeStudentCharts() {
    // Pie Chart for disturbance breakdown
    const pieCtx = document.getElementById('student-pie-chart')?.getContext('2d');
    if (pieCtx) {
        studentPieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Interruptions', 'Speaking Duration', 'Volume Level'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#ff4444', '#ffaa00', '#00f3ff'],
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
    
    // Trend Chart
    const trendCtx = document.getElementById('student-trend-chart')?.getContext('2d');
    if (trendCtx) {
        studentTrendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Your Disturbance Score',
                    data: [0, 0, 0, 0],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: 'white',
                    pointRadius: 5
                }, {
                    label: 'Class Average',
                    data: [0, 0, 0, 0],
                    borderColor: '#ffaa00',
                    backgroundColor: 'rgba(255, 170, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ffaa00',
                    pointBorderColor: 'white',
                    pointRadius: 5
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
                        ticks: { color: 'white' }
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

// Load student data from backend
async function loadStudentData() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/students/my-performance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStudentStats(data);
            updateCharts(data);
            updateAIFeedback(data);
            updateSessionHistory(data);
            updateWeeklySummary(data);
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        // Use mock data for demo if backend not ready
        loadMockStudentData();
    }
}

// Update student statistics
function updateStudentStats(data) {
    const disturbanceScore = data.disturbanceScore || 0;
    const classRank = data.rank || 15;
    const totalInterruptions = data.interruptions || 0;
    const speakingTime = data.speakingDuration || 0;
    
    document.getElementById('disturbance-score').textContent = Math.floor(disturbanceScore);
    document.getElementById('class-rank').textContent = `${classRank}/30`;
    document.getElementById('total-interruptions').textContent = totalInterruptions;
    document.getElementById('speaking-time').textContent = `${speakingTime}s`;
    
    // Update progress bar
    const scoreProgress = document.getElementById('score-progress');
    if (scoreProgress) {
        let percentage = 100 - (disturbanceScore / 200) * 100;
        percentage = Math.min(100, Math.max(0, percentage));
        scoreProgress.style.width = `${percentage}%`;
        
        // Change color based on score
        if (disturbanceScore < 50) {
            scoreProgress.style.background = 'linear-gradient(90deg, #00ff88, #00ff88)';
        } else if (disturbanceScore < 100) {
            scoreProgress.style.background = 'linear-gradient(90deg, #ffaa00, #ffaa00)';
        } else {
            scoreProgress.style.background = 'linear-gradient(90deg, #ff4444, #ff4444)';
        }
    }
}

// Update charts
function updateCharts(data) {
    // Update pie chart
    if (studentPieChart) {
        const total = (data.interruptionsWeight || 40) + (data.durationWeight || 35) + (data.volumeWeight || 25);
        studentPieChart.data.datasets[0].data = [
            data.interruptionsWeight || 40,
            data.durationWeight || 35,
            data.volumeWeight || 25
        ];
        studentPieChart.update();
    }
    
    // Update trend chart
    if (studentTrendChart) {
        studentTrendChart.data.datasets[0].data = data.weeklyScores || [45, 52, 48, 42];
        studentTrendChart.data.datasets[1].data = data.classAverage || [50, 55, 53, 48];
        studentTrendChart.update();
    }
}

// Update AI feedback
function updateAIFeedback(data) {
    const disturbanceScore = data.disturbanceScore || 0;
    const behaviorMessage = document.getElementById('behavior-message');
    const adviceList = document.getElementById('advice-list');
    
    // Behavior score (0-100, lower disturbance = higher behavior score)
    const behaviorScore = Math.max(0, Math.min(100, 100 - (disturbanceScore / 2)));
    const behaviorProgress = document.getElementById('behavior-score');
    if (behaviorProgress) behaviorProgress.style.width = `${behaviorScore}%`;
    
    // Generate message based on score
    let message = '';
    let messageClass = '';
    
    if (disturbanceScore < 30) {
        message = '🌟 Excellent! You\'re maintaining a great classroom environment!';
        messageClass = 'status-good';
    } else if (disturbanceScore < 70) {
        message = '📈 Good! You can improve by being more mindful during lectures.';
        messageClass = 'status-warning';
    } else {
        message = '⚠️ Needs improvement. Please reduce interruptions and speak respectfully.';
        messageClass = 'status-bad';
    }
    
    if (behaviorMessage) {
        behaviorMessage.textContent = message;
        behaviorMessage.className = `status-badge ${messageClass}`;
        behaviorMessage.style.display = 'inline-block';
        behaviorMessage.style.marginTop = '10px';
    }
    
    // Generate advice
    if (adviceList) {
        const advice = [];
        if (data.interruptions > 5) {
            advice.push('📢 Raise your hand instead of interrupting the lecture');
        }
        if (data.speakingDuration > 120) {
            advice.push('🎤 Limit side conversations during class time');
        }
        if (data.volumeLevel > 70) {
            advice.push('🔇 Maintain a lower voice volume when speaking');
        }
        if (advice.length === 0) {
            advice.push('✅ Keep up the great behavior! You\'re doing well!');
            advice.push('💡 Continue participating actively and respectfully');
        }
        
        adviceList.innerHTML = advice.map(a => `
            <div class="advice-item">
                <i class="fas fa-lightbulb" style="color: var(--neon-cyan);"></i>
                <span>${a}</span>
            </div>
        `).join('');
    }
}

// Update session history
function updateSessionHistory(data) {
    const historyContainer = document.getElementById('session-history');
    if (!historyContainer) return;
    
    const sessions = data.recentSessions || [
        { date: '2024-01-15', score: 45, className: 'CS101 - Lecture' },
        { date: '2024-01-14', score: 52, className: 'CS101 - Lab' },
        { date: '2024-01-13', score: 38, className: 'CS101 - Tutorial' },
        { date: '2024-01-12', score: 61, className: 'CS101 - Lecture' }
    ];
    
    historyContainer.innerHTML = sessions.map(session => `
        <div class="session-history-item">
            <div>
                <strong>${escapeHtml(session.className)}</strong>
                <br>
                <small style="color: var(--text-secondary);">${session.date}</small>
            </div>
            <div>
                <span class="status-badge ${session.score < 50 ? 'status-good' : session.score < 80 ? 'status-warning' : 'status-bad'}">
                    Score: ${session.score}
                </span>
            </div>
        </div>
    `).join('');
}

// Update weekly summary
function updateWeeklySummary(data) {
    const weeklyTrend = document.getElementById('weekly-trend');
    const improvementRate = document.getElementById('improvement-rate');
    const classStanding = document.getElementById('class-standing');
    
    if (weeklyTrend) {
        const trend = data.weeklyTrend || -8;
        weeklyTrend.innerHTML = trend < 0 ? 
            `<span style="color: var(--neon-green);">↓ ${Math.abs(trend)}% improving</span>` :
            `<span style="color: #ffaa00;">↑ ${trend}% needs work</span>`;
    }
    
    if (improvementRate) {
        improvementRate.innerHTML = data.improvementRate || '12% this week';
    }
    
    if (classStanding) {
        const rank = data.rank || 15;
        const total = data.totalStudents || 30;
        classStanding.innerHTML = `${rank}/${total} in class`;
    }
}

// Load mock student data for demo (when backend not ready)
function loadMockStudentData() {
    const mockData = {
        disturbanceScore: 42,
        rank: 8,
        interruptions: 3,
        speakingDuration: 85,
        interruptionsWeight: 35,
        durationWeight: 40,
        volumeWeight: 25,
        weeklyScores: [55, 48, 45, 42],
        classAverage: [52, 50, 48, 47],
        volumeLevel: 45,
        weeklyTrend: -13,
        improvementRate: '13% improvement',
        totalStudents: 30,
        recentSessions: [
            { date: '2024-01-15', score: 42, className: 'CS101 - Lecture' },
            { date: '2024-01-14', score: 45, className: 'CS101 - Lab' },
            { date: '2024-01-13', score: 48, className: 'CS101 - Tutorial' },
            { date: '2024-01-12', score: 55, className: 'CS101 - Lecture' }
        ]
    };
    
    updateStudentStats(mockData);
    updateCharts(mockData);
    updateAIFeedback(mockData);
    updateSessionHistory(mockData);
    updateWeeklySummary(mockData);
}

// Escape HTML helper
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}