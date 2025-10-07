// State management
let currentUser = null;
let activeSession = null;
let allStations = [];

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const pageTitle = document.getElementById('pageTitle');

// Initialize the app
async function initApp() {
    // Check authentication
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!token || !savedUser) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        currentUser = JSON.parse(savedUser);
        updateUserInfo();
        
        // Load initial data
        await loadDashboardData();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        logout();
    }
}

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });

    // Search and filter
    const stationSearch = document.getElementById('stationSearch');
    const stationFilter = document.getElementById('stationFilter');
    
    if (stationSearch) {
        stationSearch.addEventListener('input', filterStations);
    }
    if (stationFilter) {
        stationFilter.addEventListener('change', filterStations);
    }
}

// Auth functions
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.full_name.split(' ')[0]}!`;
        document.getElementById('userAvatar').textContent = 
            currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        // Update profile form
        document.getElementById('profileName').value = currentUser.full_name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePhone').value = currentUser.phone_number || '';
    }
}


// Function to format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}


//////////////here for count down timer ////////////////

// Simple countdown timer for active sessions
let sessionTimer = null;

function startSessionTimer(startTime) {
    // Clear any existing timer
    if (sessionTimer) {
        clearInterval(sessionTimer);
    }
    
    const timerElement = document.getElementById('sessionTimer');
    if (!timerElement) return;
    
    function updateTimer() {
        const now = new Date();
        const start = new Date(startTime);
        const diffMs = now - start;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        const formattedTime = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');
        
        timerElement.textContent = formattedTime;
    }
    
    // Update immediately and then every second
    updateTimer();
    sessionTimer = setInterval(updateTimer, 1000);
}

function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
}





// Function to format duration
// function formatDuration(startTime, endTime) {
//     if (!endTime) return 'In progress';
    
//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     const durationMs = end - start;
    
//     const hours = Math.floor(durationMs / (1000 * 60 * 60));
//     const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (hours > 0) {
//         return `${hours}h ${minutes}m`;
//     }
//     return `${minutes}m`;
// }


// Function to format duration
function formatDuration(startTime, endTime) {
    if (!startTime) return 'In progress';

    console.log(startTime, endTime)
    
    try {
        // Parse dates and use absolute value to handle timezone issues
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 'Invalid time';
        }
        
        // Use absolute value to handle any timezone discrepancies
        const durationMs = Math.abs(end - start);
        
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
        
        return `${minutes}m`;
        
    } catch (error) {
        console.error('Error calculating duration:', error);
        return 'Error';
    }
}

// Function to populate session history
async function populateSessionHistory() {
    try {
        const historyContainer = document.getElementById('sessionHistory');
        const sessions = await chargingService.getSessionHistory();
        
        if (!sessions || sessions.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-history text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Session History</h3>
                    <p class="text-gray-600">Your past charging sessions will appear here.</p>
                </div>
            `;
            return;
        }

        let historyHTML = `
            <div class="session-history-header">
                <div class="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-t-lg border-b">
                    <div class="font-medium text-gray-700">Station</div>
                    <div class="font-medium text-gray-700">Start Time</div>
                    <div class="font-medium text-gray-700">Duration</div>
                    <div class="font-medium text-gray-700">Energy</div>
                    <div class="font-medium text-gray-700">Status</div>
                </div>
            </div>
            <div class="session-history-list">
        `;

        sessions.forEach(session => {
            const isActive = session.is_active;
            const status = isActive ? 'Active' : 'Completed';
            const statusClass = isActive ? 'status-active' : 'status-completed';
            const duration = formatDuration(session.start_time, session.end_time);

            console.log(session.start_time, session.end_time)
            
            const energy = session.energy_consumed_kwh 
                ? `${session.energy_consumed_kwh.toFixed(2)} kWh`
                : '-';

            historyHTML += `
                <div class="grid grid-cols-5 gap-4 p-4 border-b hover:bg-gray-50 session-item">
                    <div class="station-info">
                        <div class="font-medium">Station ${session.station_id}</div>
                        <div class="text-sm text-gray-500">Charger ${session.charge_point_id}</div>
                    </div>
                    <div class="start-time">
                        ${formatDate(session.start_time)}
                    </div>
                    <div class="duration">
                        ${duration}
                    </div>
                    <div class="energy">
                        ${energy}
                    </div>
                    <div class="status">
                        <span class="status-badge ${statusClass}">${status}</span>
                    </div>
                </div>
            `;
        });

        historyHTML += '</div>';
        historyContainer.innerHTML = historyHTML;

    } catch (error) {
        console.error('Error populating session history:', error);
        const historyContainer = document.getElementById('sessionHistory');
        historyContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
                <p class="text-gray-600">Unable to load session history. Please try again.</p>
            </div>
        `;
    }
}




function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    const activePage = document.getElementById(`${pageName}Page`);
    if (activePage) {
        activePage.classList.add('active');
    }
    
    // Set active nav item
    const activeNavItem = document.querySelector(`[data-page="${pageName}"]`).parentElement;
    activeNavItem.classList.add('active');
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.textContent = getPageTitle(pageName);
    
    // Load specific data based on page
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'stations':
            loadStationsPage();
            break;
        case 'charging':
            populateSessionHistory();

            //updateActiveSessionDisplay();
            break;
        case 'profile':
            loadProfileData();
            break;
    }
}




function getPageTitle(pageName) {
    const titles = {
        dashboard: 'Dashboard',
        stations: 'Charging Stations',
        charging: 'Charging Sessions',
        profile: 'Profile Settings'
    };
    return titles[pageName] || 'Dashboard';
}

// Data loading functions
async function loadDashboardData() {
    try {
        const [stations, activeSessions] = await Promise.all([
            stationService.getStations(),
            chargingService.getActiveSessions()
        ]);

        allStations = stations;
        
        // Update stats
        updateStats(stations, activeSessions);
        
        // Load user's active session
        const userActiveSession = activeSessions.find(session => 
            session.user_id === currentUser.id && session.is_active
        );
        
        if (userActiveSession) {
            activeSession = userActiveSession;
            updateActiveSessionDisplay(userActiveSession);
        }
        
        // Load nearby stations (first 3 available stations)
        const availableStations = stations.filter(s => s.available_connectors > 0).slice(0, 3);
        displayStations(availableStations, 'nearbyStations');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

async function loadStationsPage() {
    try {
        const stations = await stationService.getStations();
        allStations = stations;
        displayStations(stations, 'stationsGrid');
    } catch (error) {
        console.error('Error loading stations:', error);
        showError('Failed to load stations');
    }
}

async function loadChargingPage() {
    try {
        const activeSessions = await chargingService.getActiveSessions();
        const userActiveSession = activeSessions.find(session => 
            session.user_id === currentUser.id && session.is_active
        );

        if (userActiveSession) {
            activeSession = userActiveSession;
            updateChargingSessionDisplay(userActiveSession);
        } else {
            document.getElementById('chargingActiveSession').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-battery-quarter text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
                    <p class="text-gray-600 mb-4">You don't have any active charging sessions.</p>
                    <a href="#" class="btn btn-primary" onclick="showPage('stations')">
                        <i class="fas fa-bolt mr-2"></i>
                        Find a Station
                    </a>
                </div>
            `;
        }

        // Load session history (in a real app, you'd have a separate endpoint for history)
        const pastSessions = activeSessions.filter(session => 
            session.user_id === currentUser.id && !session.is_active
        );
        displaySessionHistory(pastSessions);
        
    } catch (error) {
        console.error('Error loading charging data:', error);
        showError('Failed to load charging data');
    }
}

// Display functions
function updateStats(stations, activeSessions) {
    document.getElementById('totalStations').textContent = stations.length;
    
    const totalAvailable = stations.reduce((sum, station) => 
        sum + station.available_connectors, 0
    );
    document.getElementById('availableChargers').textContent = totalAvailable;
    
    const userActiveCount = activeSessions.filter(session => 
        session.user_id === currentUser.id && session.is_active
    ).length;
    document.getElementById('activeSessions').textContent = userActiveCount;
}

function displayStations(stations, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = stations.map(station => `
        <div class="station-card">
            <div class="station-header">
                <div>
                    <div class="station-name">${station.name}</div>
                    <div class="station-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        ${station.location}
                    </div>
                </div>
                <span class="status-badge ${station.available_connectors > 0 ? 'available' : 'unavailable'}">
                    ${station.available_connectors > 0 ? 'Available' : 'Full'}
                </span>
            </div>
            <div class="station-info">
                <div class="station-detail">
                    <i class="fas fa-plug"></i>
                    ${station.available_connectors}/${station.total_connectors} connectors available
                </div>
                <div class="station-detail">
                    <i class="fas fa-bolt"></i>
                    ${station.power_output_kw} kW
                </div>
                <div class="station-detail">
                    <i class="fas fa-wrench"></i>
                    ${station.is_operational ? 'Operational' : 'Maintenance'}
                </div>
            </div>
            <div class="station-actions">
                <button class="btn btn-primary" 
                        ${station.available_connectors === 0 ? 'disabled' : ''}
                        onclick="startChargingFromStation(${station.id})">
                    <i class="fas fa-play"></i>
                    Start Charging
                </button>
                <button class="btn btn-secondary" onclick="viewStationDetails(${station.id})">
                    <i class="fas fa-info-circle"></i>
                    Details
                </button>
            </div>
        </div>
    `).join('');
}

function updateActiveSessionDisplay(session) {
    const duration = session.start_time ? 
        Math.floor((new Date() - new Date(session.start_time)) / 60000) : 0;
    
    document.getElementById('activeSession').innerHTML = `
        <div class="session-header">
            <h3>Active Charging Session</h3>
            <button class="btn btn-danger" onclick="stopCharging(${session.id})">
                <i class="fas fa-stop"></i>
                Stop Charging
            </button>
        </div>


        <div class="session-stats">
            <div class="session-stat">
                <span class="session-stat-value" id="sessionTimer">00:00:00</span>
                <span class="session-stat-label">Time Charging</span>
            </div>


        <div class="session-stats">
            <div class="session-stat">
                <span class="session-stat-value">${duration}</span>
                <span class="session-stat-label">Minutes</span>
            </div>
            <div class="session-stat">
                <span class="session-stat-value">${session.energy_consumed_kwh.toFixed(1)}</span>
                <span class="session-stat-label">kWh</span>
            </div>
            <div class="session-stat">
                <span class="session-stat-value">${session.current_power_kw.toFixed(1)}</span>
                <span class="session-stat-label">kW</span>
            </div>
            <div class="session-stat">
                <span class="session-stat-value">$${(session.energy_consumed_kwh * 0.15).toFixed(2)}</span>
                <span class="session-stat-label">Cost</span>
            </div>
        </div>
    `;
    startSessionTimer(session.start_time);
}

function updateChargingSessionDisplay(session) {
    const duration = session.start_time ? 
        Math.floor((new Date() - new Date(session.start_time)) / 60000) : 0;
    
    document.getElementById('chargingActiveSession').innerHTML = `
        <div class="session-header">
            <h3>Active Charging Session</h3>
            <button class="btn btn-danger" onclick="stopCharging(${session.id})">
                <i class="fas fa-stop"></i>
                Stop Charging
            </button>
        </div>
        <div class="session-stats">
            <div class="session-stat">
                <span class="session-stat-value">${duration}</span>
                <span class="session-stat-label">Minutes</span>
            </div>
            <div class="session-stat">
                <span class="session-stat-value">${session.energy_consumed_kwh.toFixed(1)}</span>
                <span class="session-stat-label">kWh</span>
            </div>
            <div class="session-stat">
                <span class="session-stat-value">${session.current_power_kw.toFixed(1)}</span>
                <span class="session-stat-label">kW</span>
            </div>
        </div>
    `;
}

function displaySessionHistory(sessions) {
    const container = document.getElementById('sessionHistory');
    if (!container) return;

    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-history text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Session History</h3>
                <p class="text-gray-600">Your past charging sessions will appear here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="session-list">
            ${sessions.map(session => `
                <div class="session-item">
                    <div class="session-info">
                        <h4>Session #${session.id}</h4>
                        <p>Energy: ${session.energy_consumed_kwh.toFixed(2)} kWh</p>
                        <p>Duration: ${calculateDuration(session.start_time, session.end_time)}</p>
                        <p>Date: ${new Date(session.start_time).toLocaleDateString()}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Charging functions
async function startChargingFromStation(stationId) {
    try {
        // First, get available charge points for this station
        const chargePoints = await stationService.getStationChargePoints(stationId);
        const availableChargePoint = chargePoints.find(cp => cp.status === 'available');
        
        if (!availableChargePoint) {
            alert('No available charge points at this station');
            return;
        }

        const result = await chargingService.startCharging(availableChargePoint.id);
        activeSession = result;
        
        alert(`Charging started successfully! Session ID: ${result.id}`);
        showPage('dashboard');

       
        
    } catch (error) {
        console.error('Error starting charging:', error);
        alert('Failed to start charging: ' + (error.response?.data?.detail || 'Unknown error'));
    }
}

async function stopCharging(sessionId) {
    try {
        if (confirm('Are you sure you want to stop charging?')) {
            await chargingService.stopCharging(sessionId);
            activeSession = null;
            
            // Reload data
            await loadDashboardData();
            if (document.getElementById('chargingPage').classList.contains('active')) {
                await loadChargingPage();
            }
            
            alert('Charging stopped successfully');
            stopSessionTimer();
            window.location.reload();
        }
    } catch (error) {
        console.error('Error stopping charging:', error);
        alert('Failed to stop charging: ' + (error.response?.data?.detail || 'Unknown error'));
    }
}

// Utility functions
function filterStations() {
    const searchTerm = document.getElementById('stationSearch').value.toLowerCase();
    const filterStatus = document.getElementById('stationFilter').value;
    
    const filtered = allStations.filter(station => {
        const matchesSearch = station.name.toLowerCase().includes(searchTerm) || 
                            station.location.toLowerCase().includes(searchTerm);
        const matchesFilter = filterStatus === 'all' || 
                            (filterStatus === 'available' && station.available_connectors > 0) ||
                            (filterStatus === 'unavailable' && station.available_connectors === 0);
        return matchesSearch && matchesFilter;
    });
    
    displayStations(filtered, 'stationsGrid');
}

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    
    return `${minutes} min`;
}

function viewStationDetails(stationId) {
    const station = allStations.find(s => s.id === stationId);
    if (station) {
        alert(`Station Details:\n\nName: ${station.name}\nLocation: ${station.location}\nPower: ${station.power_output_kw} kW\nAvailable: ${station.available_connectors}/${station.total_connectors}\nStatus: ${station.is_operational ? 'Operational' : 'Under Maintenance'}`);
    }
}

function showError(message) {
    // You could implement a toast notification system here
    console.error('Error:', message);
    alert(message);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Make functions available globally
window.showPage = showPage;
window.logout = logout;
window.startChargingFromStation = startChargingFromStation;
window.stopCharging = stopCharging;
window.viewStationDetails = viewStationDetails;
window.togglePassword = togglePassword;

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initApp);