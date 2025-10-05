// API Base URL - Update this to match your backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            //window.location.href = 'auth.html';
        }
        return Promise.reject(error);
    }
);

// Auth Service
const authService = {
    login: (email, password) => 
        api.post('/auth/signin', { email, password }).then(res => res.data),
    
    signup: (userData) => 
        api.post('/auth/signup', userData).then(res => res.data),
    
    getCurrentUser: () => 
        api.get('/auth/me').then(res => res.data),
};

// Station Service
const stationService = {
    getStations: () => 
        api.get('/stations/').then(res => res.data),
    
    getNearbyStations: (lat, lng, radius = 10) => 
        api.get(`/stations/nearby?latitude=${lat}&longitude=${lng}&radius_km=${radius}`).then(res => res.data),
    
    getStation: (id) => 
        api.get(`/stations/${id}`).then(res => res.data),
    
    getStationChargePoints: (stationId) => 
        api.get(`/stations/${stationId}/charge-points`).then(res => res.data),
    
    updateChargePointStatus: (chargePointId, statusData) => 
        api.put(`/stations/charge-points/${chargePointId}/status`, statusData).then(res => res.data),
};

// Charging Service
const chargingService = {
    startCharging: (chargePointId) => 
        api.post('/charging/start', { charge_point_id: chargePointId }).then(res => res.data),
    
    stopCharging: (sessionId) => 
        api.post('/charging/stop', { session_id: sessionId }).then(res => res.data),
    
    updateChargingSession: (sessionId, updateData) => 
        api.put(`/charging/sessions/${sessionId}/update`, updateData).then(res => res.data),

        // Add session history endpoint
    getSessionHistory: () => 
        api.get('/charging/charging-sessions/history').then(res => res.data),
    
    getActiveSessions: () => 
        api.get('/charging/sessions/active').then(res => res.data),
};

// User Service
const userService = {
    updateProfile: (userId, userData) => 
        api.put(`/users/${userId}`, userData).then(res => res.data),
    
    getUser: (userId) => 
        api.get(`/users/${userId}`).then(res => res.data),
};


