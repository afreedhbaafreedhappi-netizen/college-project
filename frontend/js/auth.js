const API_URL = 'http://localhost:5000/api';

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.role) {
        return false;
    }
    
    // Check if token is expired (optional)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return false;
        }
    } catch (e) {
        return false;
    }
    
    return true;
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}

// Protect lecturer dashboard
function protectLecturerDashboard() {
    if (!isAuthenticated()) {
        window.location.href = 'lecturer-login.html';
        return false;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'lecturer') {
        alert('Access denied. Lecturer privileges required.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Protect student dashboard
function protectStudentDashboard() {
    if (!isAuthenticated()) {
        window.location.href = 'student-login.html';
        return false;
    }
    
    const user = getCurrentUser();
    if (user.role !== 'student') {
        alert('Access denied. Student privileges required.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Show alert message
function showAlert(message, type = 'error') {
    const alertDiv = document.getElementById('alert');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 5000);
    }
}

// Show loading state
function setLoading(button, isLoading) {
    if (button) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
        }
    }
}

// Student Registration
if (document.getElementById('student-register-form')) {
    const form = document.getElementById('student-register-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('rollNumber', document.getElementById('rollNumber').value);
        formData.append('department', document.getElementById('department').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('password', document.getElementById('password').value);
        
        const voiceFile = document.getElementById('voiceSample').files[0];
        if (voiceFile) {
            formData.append('voiceSample', voiceFile);
        }
        
        setLoading(submitBtn, true);
        
        try {
            const response = await fetch(`${API_URL}/auth/register/student`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'student-login.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Registration failed');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

// Lecturer Registration
if (document.getElementById('lecturer-register-form')) {
    const form = document.getElementById('lecturer-register-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            employeeId: document.getElementById('employeeId').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        setLoading(submitBtn, true);
        
        try {
            const response = await fetch(`${API_URL}/auth/register/lecturer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'lecturer-login.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Registration failed');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

// Login Handler
if (document.getElementById('login-form')) {
    const form = document.getElementById('login-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
    
    // Determine role from page URL
    const isStudentPage = window.location.pathname.includes('student');
    const role = isStudentPage ? 'student' : 'lecturer';
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: role
        };
        
        setLoading(submitBtn, true);
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (role === 'lecturer') {
                        window.location.href = 'lecturer-dashboard.html';
                    } else {
                        window.location.href = 'student-dashboard.html';
                    }
                }, 1500);
            } else {
                showAlert(data.message || 'Invalid credentials');
            }
        } catch (error) {
            showAlert('Network error. Please try again.');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Auto-redirect if already logged in
function redirectIfLoggedIn() {
    if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user.role === 'lecturer' && window.location.pathname.includes('lecturer-login')) {
            window.location.href = 'lecturer-dashboard.html';
        } else if (user.role === 'student' && window.location.pathname.includes('student-login')) {
            window.location.href = 'student-dashboard.html';
        }
    }
}

// Call this on login pages
if (window.location.pathname.includes('login')) {
    redirectIfLoggedIn();
}