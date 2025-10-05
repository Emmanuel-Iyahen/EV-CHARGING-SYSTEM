const API_BASE_URL = 'http://localhost:8000';

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get current user
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
        logout();
        return null;
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        if (!data.user.is_admin) {
            throw new Error('Access denied. Admin privileges required.');
        }

        localStorage.setItem('admin_token', data.access_token);
        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Logout function
function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
}

// Update user info in UI
function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
        userNameElement.textContent = user.full_name;
    }
}