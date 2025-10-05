const API_BASE_URL = 'http://localhost:8000';

// Generic API call function
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                throw new Error('Authentication failed');
            }
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Dashboard API calls
async function getDashboardData() {
    return await apiCall('/admin/dashboard');
}

// Stations API calls
async function getStations() {
    return await apiCall('/stations/');
}

async function createStation(stationData) {
    return await apiCall('/admin/stations', {
        method: 'POST',
        body: JSON.stringify(stationData)
    });
}

// Users API calls
async function getUsers() {
    return await apiCall('/admin/users');
}

// Sessions API calls
async function getSessions() {
    return await apiCall('/admin/charging-sessions');
}

async function stopChargingSession(sessionId) {
    return await apiCall('/charging/stop', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
    });
}