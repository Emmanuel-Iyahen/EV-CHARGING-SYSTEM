// ===== EV Charging Admin CPMS - Combined App =====
console.log('🚀 EV Charging Admin CPMS loaded');

const API_BASE_URL = 'http://localhost:8000';

// ===== AUTHENTICATION FUNCTIONS =====
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

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

function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
}

function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
        userNameElement.textContent = user.full_name;
    }
}

// ===== API FUNCTIONS =====
async function getDashboardData() {
    console.log('📊 Fetching dashboard data...');
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Dashboard data received:', data);
        return data;
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Return mock data for development
        return {
            statistics: {
                total_stations: 3,
                total_charge_points: 8,
                total_users: 15,
                active_sessions: 2
            },
            station_status: [
                { station_id: 1, station_name: 'Downtown Charging Hub', available: 3, charging: 1, unavailable: 0, total: 4 },
                { station_id: 2, station_name: 'Shopping Mall Chargers', available: 2, charging: 0, unavailable: 0, total: 2 },
                { station_id: 3, station_name: 'Airport Terminal', available: 1, charging: 1, unavailable: 1, total: 3 }
            ]
        };
    }
}

async function getStations() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/stations/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching stations:', error);
        // Mock stations data
        return [
            {
                id: 1,
                name: 'Downtown Charging Hub',
                location: '123 Main Street, Downtown',
                total_connectors: 4,
                available_connectors: 3,
                unavailable_connectors: 1,
                power_output_kw: 22.0,
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                name: 'Shopping Mall Chargers',
                location: '456 Oak Avenue, Shopping District',
                total_connectors: 2,
                available_connectors: 2,
                unavailable_connectors: 0,
                power_output_kw: 7.4,
                created_at: '2024-01-20T14:30:00Z'
            },
            {
                id: 3,
                name: 'Airport Terminal',
                location: '789 Airport Road',
                total_connectors: 3,
                available_connectors: 1,
                unavailable_connectors: 1,
                power_output_kw: 11.0,
                created_at: '2024-02-01T09:15:00Z'
            }
        ];
    }
}

// ===== CHARGE POINTS API FUNCTIONS =====
async function getChargePoints(stationId) {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/stations/${stationId}/charge-points/detailed`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching charge points:', error);
        // Mock data for development
        return getMockChargePoints(stationId);
    }
}

function getMockChargePoints(stationId) {
    // Different mock data based on station ID
    const mockData = {
        1: [ // Downtown Hub
            { id: 1, connector_id: 1, status: 'charging', current_power_kw: 7.4, max_power_kw: 22.0, is_operational: true, active_session: {
                session_id: 101, user_name: 'John Doe', user_id: 2, start_time: '2024-01-20T14:30:00Z', 
                energy_consumed_kwh: 12.5, current_power_kw: 7.4, duration_minutes: 45
            }},
            { id: 2, connector_id: 2, status: 'available', current_power_kw: 0, max_power_kw: 22.0, is_operational: true, active_session: null },
            { id: 3, connector_id: 3, status: 'available', current_power_kw: 0, max_power_kw: 22.0, is_operational: true, active_session: null },
            { id: 4, connector_id: 4, status: 'unavailable', current_power_kw: 0, max_power_kw: 22.0, is_operational: false, active_session: null }
        ],
        2: [ // Shopping Mall
            { id: 5, connector_id: 1, status: 'available', current_power_kw: 0, max_power_kw: 7.4, is_operational: true, active_session: null },
            { id: 6, connector_id: 2, status: 'available', current_power_kw: 0, max_power_kw: 7.4, is_operational: true, active_session: null }
        ],
        3: [ // Airport Terminal
            { id: 7, connector_id: 1, status: 'charging', current_power_kw: 11.0, max_power_kw: 11.0, is_operational: true, active_session: {
                session_id: 102, user_name: 'Jane Smith', user_id: 3, start_time: '2024-01-20T15:15:00Z', 
                energy_consumed_kwh: 8.2, current_power_kw: 11.0, duration_minutes: 25
            }},
            { id: 8, connector_id: 2, status: 'available', current_power_kw: 0, max_power_kw: 11.0, is_operational: true, active_session: null },
            { id: 9, connector_id: 3, status: 'faulted', current_power_kw: 0, max_power_kw: 11.0, is_operational: false, active_session: null }
        ]
    };
    
    return mockData[stationId] || [];
}

async function getUsers() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        // Mock users data
        return [
            {
                id: 1,
                email: 'admin@evcharging.com',
                full_name: 'System Administrator',
                is_admin: true,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z'
            },
            {
                id: 2,
                email: 'john.doe@example.com',
                full_name: 'John Doe',
                is_admin: false,
                is_active: true,
                created_at: '2024-01-10T14:20:00Z'
            }
        ];
    }
}

async function getSessions() {
    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/charging-sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching sessions:', error);
        // Mock sessions data
        return [
            {
                id: 1,
                user_id: 2,
                charge_point_id: 1,
                station_id: 1,
                start_time: '2024-01-20T10:30:00Z',
                end_time: null,
                energy_consumed_kwh: 5.2,
                current_power_kw: 7.4,
                is_active: true
            }
        ];
    }
}

// ===== DASHBOARD FUNCTIONS =====
let stationChart, distributionChart;

async function initDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    if (!checkAuth()) {
        console.log('User not authenticated');
        return;
    }

    try {
        const user = await getCurrentUser();
        updateUserInfo(user);

        const dashboardData = await getDashboardData();
        updateDashboardStats(dashboardData);
        updateCharts(dashboardData);
        updateRecentActivity(dashboardData);
        
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showError('Failed to load dashboard data: ' + error.message);
    }
}

function updateDashboardStats(data) {
    console.log('Updating dashboard stats...');
    const stats = data.statistics;

    // Safely update each element
    const elements = {
        'total-stations': stats.total_stations || 0,
        'total-charge-points': stats.total_charge_points || 0,
        'total-users': stats.total_users || 0,
        'active-sessions': stats.active_sessions || 0
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element #${id} not found`);
        }
    }
}

function updateCharts(data) {
    if (!data.station_status) {
        console.warn('No station status data for charts');
        return;
    }
    updateStationChart(data.station_status);
    updateDistributionChart(data.station_status);
}

function updateStationChart(stationStatus) {
    const canvas = document.getElementById('stationChart');
    if (!canvas) {
        console.warn('Station chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (stationChart) {
        stationChart.destroy();
    }

    const labels = stationStatus.map(station => station.station_name);
    const availableData = stationStatus.map(station => station.available);
    const chargingData = stationStatus.map(station => station.charging);
    const unavailableData = stationStatus.map(station => station.unavailable);

    stationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Available',
                    data: availableData,
                    backgroundColor: '#10B981'
                },
                {
                    label: 'Charging',
                    data: chargingData,
                    backgroundColor: '#F59E0B'
                },
                {
                    label: 'Unavailable',
                    data: unavailableData,
                    backgroundColor: '#EF4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateDistributionChart(stationStatus) {
    const canvas = document.getElementById('distributionChart');
    if (!canvas) {
        console.warn('Distribution chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (distributionChart) {
        distributionChart.destroy();
    }

    const totalAvailable = stationStatus.reduce((sum, station) => sum + station.available, 0);
    const totalCharging = stationStatus.reduce((sum, station) => sum + station.charging, 0);
    const totalUnavailable = stationStatus.reduce((sum, station) => sum + station.unavailable, 0);
    const totalFaulted = stationStatus.reduce((sum, station) => 
        sum + (station.total - station.available - station.charging - station.unavailable), 0);

    distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Available', 'Charging', 'Unavailable', 'Faulted'],
            datasets: [{
                data: [totalAvailable, totalCharging, totalUnavailable, totalFaulted],
                backgroundColor: [
                    '#10B981',
                    '#F59E0B',
                    '#EF4444',
                    '#6B7280'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// function updateRecentActivity(data) {
//     const activityList = document.getElementById('activity-list');
//     if (!activityList) {
//         console.warn('Activity list not found');
//         return;
//     }
    
//     const activities = [
//         { type: 'charging_start', user: 'John Doe', station: 'Downtown Hub', time: '2 minutes ago' },
//         { type: 'charging_stop', user: 'Jane Smith', station: 'Shopping Mall', time: '5 minutes ago' },
//         { type: 'station_added', station: 'Airport Terminal', time: '1 hour ago' }
//     ];

//     activityList.innerHTML = activities.map(activity => `
//         <div class="activity-item">
//             <div class="activity-icon">
//                 <i class="fas fa-${getActivityIcon(activity.type)}"></i>
//             </div>
//             <div class="activity-details">
//                 <p>${getActivityText(activity)}</p>
//                 <small style="color: #64748b;">${activity.time}</small>
//             </div>
//         </div>
//     `).join('');
// }




// ===== ENHANCED RECENT ACTIVITY =====
async function updateRecentActivity(data) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) {
        console.warn('Activity list not found');
        return;
    }
    
    try {
        // Get recent sessions for activity feed
        const sessions = await getSessions();
        const recentSessions = sessions
            .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
            .slice(0, 5); // Show last 5 sessions
        
        if (recentSessions.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-details">
                        <p>No recent activity</p>
                        <small style="color: #64748b;">Activity will appear here</small>
                    </div>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = recentSessions.map(session => {
            const activityType = session.is_active ? 'charging_start' : 'charging_stop';
            const icon = session.is_active ? 'bolt' : 'battery-full';
            const action = session.is_active ? 'started charging' : 'completed charging';
            const timeAgo = formatTimeAgo(session.start_time);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${activityType}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <p><strong>${getUserName(session.user_id)}</strong> ${action} at Station ${session.station_id}</p>
                        <small style="color: #64748b;">${timeAgo}</small>
                        ${session.energy_consumed_kwh ? `<small style="color: #10B981;">${session.energy_consumed_kwh} kWh consumed</small>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        // Fallback to mock data
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-details">
                    <p>Loading recent activity...</p>
                    <small style="color: #64748b;">Please wait</small>
                </div>
            </div>
        `;
    }
}

function getActivityIcon(type) {
    const icons = {
        'charging_start': 'bolt',
        'charging_stop': 'battery-full',
        'station_added': 'map-marker-alt'
    };
    return icons[type] || 'info-circle';
}

function getActivityText(activity) {
    switch (activity.type) {
        case 'charging_start':
            return `${activity.user} started charging at ${activity.station}`;
        case 'charging_stop':
            return `${activity.user} stopped charging at ${activity.station}`;
        case 'station_added':
            return `New station added: ${activity.station}`;
        default:
            return 'Activity occurred';
    }
}

// ===== STATIONS PAGE FUNCTIONS =====
let currentStationId = null;
let refreshInterval = null;

async function initStations() {
    console.log('🚀 Initializing stations page...');
    
    if (!checkAuth()) return;

    try {
        const stations = await getStations();
        displayStationsList(stations);
        setupStationFilters();
    } catch (error) {
        console.error('Error loading stations:', error);
        showError('Failed to load stations');
    }
}

function displayStationsList(stations) {
    const list = document.getElementById('stations-list');
    if (!list) return;

    list.innerHTML = stations.map(station => {
        const available = station.available_connectors || 0;
        const charging = (station.total_connectors || 0) - available - (station.unavailable_connectors || 0);
        const unavailable = station.unavailable_connectors || 0;
        const total = station.total_connectors || 0;

        return `
            <div class="station-item" onclick="showChargePoints(${station.id}, '${station.name}')">
                <div class="station-header">
                    <div>
                        <h3 class="station-name">${station.name}</h3>
                        <p class="station-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${station.location}
                        </p>
                    </div>
                    <span class="status-badge ${available > 0 ? 'available' : 'unavailable'}">
                        ${available > 0 ? 'Available' : 'Full'}
                    </span>
                </div>
                
                <div class="station-stats">
                    <div class="stat-badge">
                        <span class="stat-count count-available">${available}</span>
                        <span class="stat-label">Available</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-count count-charging">${charging}</span>
                        <span class="stat-label">Charging</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-count count-unavailable">${unavailable}</span>
                        <span class="stat-label">Unavailable</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-count count-total">${total}</span>
                        <span class="stat-label">Total</span>
                    </div>
                </div>
                
                <div class="station-detail">
                    <i class="fas fa-bolt"></i>
                    <span>Max Power: ${station.power_output_kw} kW</span>
                </div>
            </div>
        `;
    }).join('');
}

async function showChargePoints(stationId, stationName) {
    currentStationId = stationId;
    
    // Update modal title
    document.getElementById('modal-station-name').textContent = `${stationName} - Charge Points`;
    
    // Load charge points
    await loadChargePoints(stationId);
    
    // Show modal
    document.getElementById('charge-points-modal').classList.add('active');
    
    // Start real-time updates
    startRealTimeUpdates(stationId);
}

async function loadChargePoints(stationId) {
    try {
        const chargePoints = await getChargePoints(stationId);
        displayChargePoints(chargePoints);
    } catch (error) {
        console.error('Error loading charge points:', error);
        showError('Failed to load charge points');
    }
}


function displayChargePoints(chargePoints) {
    const grid = document.getElementById('charge-points-grid');
    if (!grid) return;

    grid.innerHTML = chargePoints.map(cp => {
        const hasSession = cp.active_session !== null;
        const powerPercentage = cp.current_power_kw > 0 ? (cp.current_power_kw / cp.max_power_kw) * 100 : 0;
        
        return `
            <div class="charge-point-card ${cp.status} ${hasSession ? 'realtime-update' : ''}" 
                 data-session-id="${hasSession ? cp.active_session.session_id : ''}">
                <div class="charge-point-header">
                    <div class="charge-point-icon ${cp.status}">
                        <i class="fas fa-plug"></i>
                        ${cp.status === 'charging' ? '<div class="charging-pulse"></div>' : ''}
                    </div>
                    <span class="charge-point-status status-${cp.status}">
                        ${cp.status.toUpperCase()}
                    </span>
                </div>
                
                <div class="charge-point-info">
                    <h4>Connector ${cp.connector_id}</h4>
                    <div class="charge-point-details">
                        <div class="detail-item">
                            <span class="detail-label">Power Output</span>
                            <div class="power-indicator">
                                <div class="power-bar">
                                    <div class="power-fill ${cp.status === 'charging' ? 'charging' : ''}" 
                                         style="width: ${powerPercentage}%"></div>
                                </div>
                                <span class="detail-value">${cp.current_power_kw} / ${cp.max_power_kw} kW</span>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value">${getStatusText(cp.status)}</span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">Operational</span>
                            <span class="detail-value ${cp.is_operational ? 'available' : 'unavailable'}">
                                ${cp.is_operational ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                    
                    ${hasSession ? renderSessionInfo(cp.active_session) : ''}
                </div>
            </div>
        `;
    }).join('');
}



// function displayChargePoints(chargePoints) {
//     const grid = document.getElementById('charge-points-grid');
//     if (!grid) return;

//     grid.innerHTML = chargePoints.map(cp => {
//         const hasSession = cp.active_session !== null;
//         const powerPercentage = cp.current_power_kw > 0 ? (cp.current_power_kw / cp.max_power_kw) * 100 : 0;
        
//         return `
//             <div class="charge-point-card ${cp.status} ${hasSession ? 'realtime-update' : ''}">
//                 <div class="charge-point-header">
//                     <div class="charge-point-icon ${cp.status}">
//                         <i class="fas fa-plug"></i>
//                         ${cp.status === 'charging' ? '<div class="charging-pulse"></div>' : ''}
//                     </div>
//                     <span class="charge-point-status status-${cp.status}">
//                         ${cp.status.toUpperCase()}
//                     </span>
//                 </div>
                
//                 <div class="charge-point-info">
//                     <h4>Connector ${cp.connector_id}</h4>
//                     <div class="charge-point-details">
//                         <div class="detail-item">
//                             <span class="detail-label">Power Output</span>
//                             <div class="power-indicator">
//                                 <div class="power-bar">
//                                     <div class="power-fill ${cp.status === 'charging' ? 'charging' : ''}" 
//                                          style="width: ${powerPercentage}%"></div>
//                                 </div>
//                                 <span class="detail-value">${cp.current_power_kw} / ${cp.max_power_kw} kW</span>
//                             </div>
//                         </div>
                        
//                         <div class="detail-item">
//                             <span class="detail-label">Status</span>
//                             <span class="detail-value">${getStatusText(cp.status)}</span>
//                         </div>
                        
//                         <div class="detail-item">
//                             <span class="detail-label">Operational</span>
//                             <span class="detail-value ${cp.is_operational ? 'available' : 'unavailable'}">
//                                 ${cp.is_operational ? 'Yes' : 'No'}
//                             </span>
//                         </div>
//                     </div>
                    
//                     ${hasSession ? renderSessionInfo(cp.active_session) : ''}
//                 </div>
//             </div>
//         `;
//     }).join('');
// }

function getStatusText(status) {
    const statusMap = {
        'available': 'Ready for Charging',
        'charging': 'Currently Charging',
        'unavailable': 'Maintenance',
        'faulted': 'Fault Detected'
    };
    return statusMap[status] || status;
}

function renderSessionInfo(session) {
    return `
        <div class="session-info">
            <div class="session-user">
                <i class="fas fa-user"></i>
                <strong>${session.user_name}</strong>
            </div>
            <div class="session-stats">
                <div class="session-stat">
                    <div class="session-stat-value">${session.duration_minutes}m</div>
                    <div class="session-stat-label">Duration</div>
                </div>
                <div class="session-stat">
                    <div class="session-stat-value">${session.energy_consumed_kwh.toFixed(1)}</div>
                    <div class="session-stat-label">kWh Used</div>
                </div>
                <div class="session-stat">
                    <div class="session-stat-value">${session.current_power_kw}</div>
                    <div class="session-stat-label">Current kW</div>
                </div>
                <div class="session-stat">
                    <button class="btn btn-danger btn-sm" onclick="stopSession(${session.session_id})">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                </div>
            </div>
        </div>
    `;
}

function startRealTimeUpdates(stationId) {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 10 seconds
    refreshInterval = setInterval(async () => {
        console.log('🔄 Refreshing charge points data...');
        await loadChargePoints(stationId);
    }, 10000);
}

function stopRealTimeUpdates() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

function closeChargePointsModal() {
    document.getElementById('charge-points-modal').classList.remove('active');
    stopRealTimeUpdates();
    currentStationId = null;
}

async function stopSession(sessionId) {
    if (!confirm('Are you sure you want to stop this charging session?')) {
        return;
    }

    try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/charging/stop`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
            throw new Error('Failed to stop session');
        }

        showSuccess('Charging session stopped successfully');
        
        // Refresh the charge points view
        if (currentStationId) {
            await loadChargePoints(currentStationId);
        }
    } catch (error) {
        console.error('Error stopping session:', error);
        showError('Failed to stop session: ' + error.message);
    }
}

function showSuccess(message) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function setupStationFilters() {
    const searchInput = document.getElementById('station-search');
    const filterSelect = document.getElementById('station-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterStations);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterStations);
    }
}

function filterStations() {
    // This would filter stations based on search/filter criteria
    console.log('Filtering stations...');
}

function showAddStationModal() {
    document.getElementById('add-station-modal').classList.add('active');
}

function closeAddStationModal() {
    document.getElementById('add-station-modal').classList.remove('active');
    document.getElementById('add-station-form').reset();
}

function editStation(stationId) {
    alert(`Edit station ${stationId} - Feature coming soon!`);
}

function deleteStation(stationId) {
    if (confirm('Are you sure you want to delete this station?')) {
        alert(`Delete station ${stationId} - Feature coming soon!`);
    }
}


// Update your initializeApp function
function initializeApp() {
    console.log('🚀 Initializing application...');
    setupNavigation();
    loadCurrentPage();
    setupNotificationBell();
    
    setTimeout(() => {
        connectWebSocket();
    }, 2000);
}


// function initializeApp() {
//     console.log('🚀 Initializing application...');
//     setupNavigation();
//     loadCurrentPage();
    
//     // Start WebSocket connection - ONLY ONCE
//     setTimeout(() => {
//         console.log('🔌 Initializing WebSocket connection...');
//         connectWebSocket();
//     }, 2000); // 2 second delay to let page load completely
// }


// Remove the reconnect from loadCurrentPage - connect only once
function loadCurrentPage() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    showPage(hash);
}

// Clean up when the page is unloaded
window.addEventListener('beforeunload', function() {
    disconnectWebSocket();
});

// Reconnect when the page becomes visible again
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && !isSocketConnected) {
        console.log('👀 Page became visible, reconnecting WebSocket...');
        connectWebSocket();
    }
});



function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showPage(target);
        });
    });

    // Sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
    }
}

function showPage(pageId) {
    console.log(`Showing page: ${pageId}`);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const activeNav = document.querySelector(`[href="#${pageId}"]`).parentElement;
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = getPageTitle(pageId);
    }

    // Initialize page-specific functionality
    initializePage(pageId);
}

function getPageTitle(pageId) {
    const titles = {
        'dashboard': 'Dashboard',
        'stations': 'Charging Stations',
        'users': 'User Management',
        'sessions': 'Charging Sessions',
        'settings': 'System Settings'
    };
    return titles[pageId] || 'Dashboard';
}

function initializePage(pageId) {
    console.log(`Initializing page: ${pageId}`);
    switch (pageId) {
        case 'dashboard':
            initDashboard();
            break;
        case 'stations':
            initStations();
            break;
        case 'users':
            initUsers(); 
            break;
        case 'sessions':
            initSessions(); 
            break;
        case 'settings':
            // Settings page doesn't need special initialization
            break;
    }
}



function showError(message) {
    console.error('Error:', message);
    alert(`Error: ${message}`);
}

// ===== START THE APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, checking auth...');
    if (checkAuth()) {
        console.log('✅ User authenticated, initializing app...');
        initializeApp();
    } else {
        console.log('❌ User not authenticated');
    }
});


// ===== USERS PAGE FUNCTIONS =====
async function initUsers() {
    console.log('🚀 Initializing users page...');
    
    if (!checkAuth()) return;

    try {
        const users = await getUsers();
        displayUsersTable(users);
        setupUserFilters();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function displayUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) {
        console.warn('Users table body not found');
        return;
    }

    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                    <i class="fas fa-users" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map(user => {
        const role = user.is_admin ? 'Administrator' : 'User';
        const roleClass = user.is_admin ? 'admin' : 'user';
        const status = user.is_active ? 'Active' : 'Inactive';
        const statusClass = user.is_active ? 'active' : 'inactive';
        const joinDate = user.created_at ? formatDate(user.created_at) : 'Unknown';
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar-small">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div class="user-name">${user.full_name || 'Unknown User'}</div>
                            <div class="user-id">ID: ${user.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="email-info">
                        <i class="fas fa-envelope"></i>
                        <span>${user.email || 'No email'}</span>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${roleClass}">${role}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${status}</span>
                </td>
                <td>
                    <div class="date-info">
                        <div class="date-value">${joinDate}</div>
                        <div class="date-ago">${user.created_at ? formatTimeAgo(user.created_at) : ''}</div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editUser(${user.id})" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!user.is_admin ? `
                            <button class="btn btn-${user.is_active ? 'warning' : 'success'} btn-sm" onclick="toggleUserStatus(${user.id}, ${user.is_active})" title="${user.is_active ? 'Deactivate' : 'Activate'} User">
                                <i class="fas fa-${user.is_active ? 'pause' : 'play'}"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-sm" disabled title="Admin users cannot be modified">
                                <i class="fas fa-lock"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setupUserFilters() {
    const searchInput = document.getElementById('user-search');
    const filterSelect = document.getElementById('user-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterUsers);
    }
}

function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filterValue = document.getElementById('user-filter').value;
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const userName = row.cells[0].textContent.toLowerCase();
        const userEmail = row.cells[1].textContent.toLowerCase();
        const userRole = row.cells[2].textContent.toLowerCase();
        
        const matchesSearch = userName.includes(searchTerm) || userEmail.includes(searchTerm);
        const matchesFilter = filterValue === 'all' || 
                             (filterValue === 'admin' && userRole === 'administrator') ||
                             (filterValue === 'user' && userRole === 'user');
        
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// User management functions
function editUser(userId) {
    console.log(`Editing user ${userId}`);
    showNotification(`Edit user ${userId} - Feature coming soon!`, 'info');
    // You can implement user editing modal here
}

function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMessage = `Are you sure you want to ${action} this user?`;
    
    if (confirm(confirmMessage)) {
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)}ing user ${userId}`);
        showNotification(`User ${action}d successfully`, 'success');
        
        // Refresh the users table
        setTimeout(() => {
            initUsers();
        }, 1000);
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        console.log(`Deleting user ${userId}`);
        showNotification('User deleted successfully', 'success');
        
        // Refresh the users table
        setTimeout(() => {
            initUsers();
        }, 1000);
    }
}

// User creation function (for future use)
function showAddUserModal() {
    showNotification('Add user feature coming soon!', 'info');
    // You can implement user creation modal here
}




// ===== WEBSOCKET REAL-TIME UPDATES =====


let chargingSocket = null;
let isSocketConnected = false;
let reconnectTimeout = null;
let heartbeatInterval = null;

function connectWebSocket() {
    // Prevent multiple connection attempts
    if (chargingSocket && (chargingSocket.readyState === WebSocket.OPEN || chargingSocket.readyState === WebSocket.CONNECTING)) {
        console.log('⚠️ WebSocket already connecting/connected, skipping...');
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    if (!token) {
        console.log('❌ No token available for WebSocket connection');
        return;
    }
    
    try {
        // Close existing connection properly
        if (chargingSocket) {
            chargingSocket.close(1000, 'Reconnecting');
            chargingSocket = null;
        }
        
        // Clear any pending reconnection
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        
        // Use the correct WebSocket URL
        const wsUrl = `ws://localhost:8000/charging/ws/charging-updates`;
        console.log('🔄 Connecting to WebSocket...');
        
        chargingSocket = new WebSocket(wsUrl);
        
        chargingSocket.onopen = function(event) {
            console.log('✅ WebSocket connected successfully');
            isSocketConnected = true;
            updateConnectionStatus(true);
            
            // Start heartbeat to keep connection alive
            startHeartbeat();
            
            console.log('📤 WebSocket ready for messages');
        };
        



        chargingSocket.onmessage = function(event) {
    console.log('📩 RAW WebSocket message received:', event.data);
    
    try {
        const data = JSON.parse(event.data);
        console.log('📊 PARSED WebSocket data type:', data.type, 'Full data:', data);
        
        // Handle connection messages separately
        if (data.type === 'welcome' || data.type === 'connection_established') {
            console.log('🎉 WebSocket connection confirmed');
            if (typeof showNotification === 'function') {
                showNotification('Connected to real-time updates', 'success');
            } else {
                console.log('ℹ️ showNotification function not available');
            }
        } else if (data.type === 'heartbeat_ack') {
            console.log('💓 Heartbeat acknowledged');
        } else if (data.type === 'echo') {
            console.log('🔁 Echo received');
        } else {
            // This is where real application messages should go
            console.log('🚨 APPLICATION MESSAGE DETECTED - Calling handler for type:', data.type);
            
            // Safely call the handler
            if (typeof handleWebSocketMessage === 'function') {
                handleWebSocketMessage(event.data);
            } else {
                console.error('❌ handleWebSocketMessage function not found');
            }
        }
    } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data);
    }
};
        
        chargingSocket.onclose = function(event) {
            console.log('❌ WebSocket disconnected. Code:', event.code, 'Reason:', event.reason || 'No reason provided');
            isSocketConnected = false;
            updateConnectionStatus(false);
            clearInterval(heartbeatInterval);
            
            // Only reconnect if it wasn't a normal closure and we're not already reconnecting
            if (event.code !== 1000 && !reconnectTimeout) {
                console.log('🔄 Will attempt to reconnect in 5 seconds...');
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
            }
        };
        
        chargingSocket.onerror = function(error) {
            console.error('💥 WebSocket error:', error);
            isSocketConnected = false;
            updateConnectionStatus(false);
        };
        
    } catch (error) {
        console.error('💥 Failed to create WebSocket connection:', error);
        isSocketConnected = false;
        updateConnectionStatus(false);
    }
}

function startHeartbeat() {
    // Clear existing heartbeat
    clearInterval(heartbeatInterval);
    
    // Send heartbeat every 30 seconds to keep connection alive
    heartbeatInterval = setInterval(() => {
        if (chargingSocket && chargingSocket.readyState === WebSocket.OPEN) {
            chargingSocket.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            }));
            console.log('💓 Heartbeat sent');
        }
    }, 30000);
}




// ===== ULTRA SIMPLE WEBSOCKET HANDLER - FULL PAGE RELOAD =====
let notificationCount = 0;

function handleWebSocketMessage(messageData) {
    try {
        const data = JSON.parse(messageData);
        console.log('📊 Processing WebSocket update:', data.type);
        
        // Increment notification count for any session activity
        if (data.type.includes('session_')) {
            notificationCount++;
            updateNotificationBadge();
            
            // Show notification
            if (data.type === 'session_started') {
                showNotification(`🔌 ${data.user_name} started charging - Refreshing page...`, 'success');
            } else if (data.type === 'session_stopped') {
                showNotification(`🛑 ${data.user_name} stopped charging - Refreshing page...`, 'info');
            }
            
            // Full page reload after delay
            console.log('🔄 Full page reload in 3 seconds...');
            setTimeout(() => {
                console.log('🔄 Reloading page now...');
                location.reload();
            }, 3000);
        }
        
    } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
    }
}

function updateNotificationBadge() {
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        notificationBadge.textContent = notificationCount;
        notificationBadge.style.transform = 'scale(1.2)';
        setTimeout(() => {
            notificationBadge.style.transform = 'scale(1)';
        }, 300);
    }
}

// Reset notifications when bell is clicked
function setupNotificationBell() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            notificationCount = 0;
            updateNotificationBadge();
            showNotification('Notifications cleared', 'info');
        });
    }
}






function handleSessionStarted(data) {
    console.log('🔌 Session started:', data);
    showNotification(`🔌 ${data.user_name} started charging at Station ${data.station_id}`, 'success');
    
    // If we're viewing the station where this happened, refresh the charge points
    if (currentStationId === data.station_id) {
        loadChargePoints(currentStationId);
    }
    
    // Update active sessions count
    updateActiveSessionsCount(1);
}

function handleSessionUpdated(data) {
    console.log('⚡ Session updated:', data);
    
    // If we're viewing the station where this happened, refresh the charge points
    if (currentStationId === data.station_id) {
        loadChargePoints(currentStationId);
    }
}

function handleSessionStopped(data) {
    console.log('🛑 Session stopped:', data);
    showNotification(`🛑 ${data.user_name} stopped charging at Station ${data.station_id}`, 'info');
    
    // If we're viewing the station where this happened, refresh the charge points
    if (currentStationId === data.station_id) {
        loadChargePoints(currentStationId);
    }
    
    // Update active sessions count
    updateActiveSessionsCount(-1);
}

function updateDashboardFromWebSocket() {
    // Refresh dashboard stats if we're on the dashboard
    const currentPage = document.querySelector('.page.active');
    if (currentPage && currentPage.id === 'dashboard-page') {
        console.log('🔄 Refreshing dashboard from WebSocket update');
        initDashboard();
    }
    
    // Refresh stations list if we're on the stations page
    if (currentPage && currentPage.id === 'stations-page') {
        console.log('🔄 Refreshing stations list from WebSocket update');
        initStations();
    }
}

function updateActiveSessionsCount(change) {
    const activeSessionsElement = document.getElementById('active-sessions');
    if (activeSessionsElement) {
        const currentCount = parseInt(activeSessionsElement.textContent) || 0;
        const newCount = Math.max(0, currentCount + change);
        activeSessionsElement.textContent = newCount;
        console.log(`📊 Updated active sessions count: ${currentCount} → ${newCount}`);
    }
}

function updateConnectionStatus(connected) {
    let statusElement = document.getElementById('websocket-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'websocket-status';
        statusElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            padding: 4px 8px;
            border-radius: 4px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            margin-right: 15px;
        `;
        
        const topbarRight = document.querySelector('.topbar-right');
        if (topbarRight) {
            topbarRight.insertBefore(statusElement, topbarRight.firstChild);
        }
    }
    
    if (connected) {
        statusElement.innerHTML = `
            <i class="fas fa-circle" style="color: #10B981; font-size: 8px;"></i>
            <span>Live Updates</span>
        `;
        statusElement.style.background = '#f0fdf4';
        statusElement.style.borderColor = '#bbf7d0';
    } else {
        statusElement.innerHTML = `
            <i class="fas fa-circle" style="color: #EF4444; font-size: 8px;"></i>
            <span>Connecting...</span>
        `;
        statusElement.style.background = '#fef2f2';
        statusElement.style.borderColor = '#fecaca';
    }
}



// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    console.log(`📢 Notification [${type}]: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    
    // Add icon based on type
    const icons = {
        'success': '✅',
        'error': '❌', 
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Add CSS animations for notifications
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}


// Disconnect WebSocket when needed
function disconnectWebSocket() {
    console.log('🔌 Manually disconnecting WebSocket...');
    
    // Clear all intervals and timeouts
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    // Close WebSocket connection
    if (chargingSocket) {
        chargingSocket.close(1000, 'Manual disconnect');
        chargingSocket = null;
    }
    
    isSocketConnected = false;
    updateConnectionStatus(false);
}






// Clean up when the page is unloaded
window.addEventListener('beforeunload', function() {
    disconnectWebSocket();
});

// Reconnect when the page becomes visible again
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && !isSocketConnected) {
        connectWebSocket();
    }
});


// Debug info
console.log('✅ All functions loaded successfully');
console.log('✅ getDashboardData:', typeof getDashboardData);
console.log('✅ initDashboard:', typeof initDashboard);
console.log('✅ checkAuth:', typeof checkAuth);






// ===== SESSIONS PAGE FUNCTIONS =====
async function initSessions() {
    console.log('🚀 Initializing sessions page...');
    
    if (!checkAuth()) return;

    try {
        const sessions = await getSessions();
        displaySessionsTable(sessions);
        setupSessionFilters();
    } catch (error) {
        console.error('Error loading sessions:', error);
        showError('Failed to load sessions');
    }
}

function displaySessionsTable(sessions) {
    const tableBody = document.getElementById('sessions-table-body');
    if (!tableBody) {
        console.warn('Sessions table body not found');
        return;
    }

    if (!sessions || sessions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">
                    <i class="fas fa-battery-empty" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No charging sessions found
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = sessions.map(session => {
        const duration = calculateSessionDuration(session);
        const status = session.is_active ? 'Active' : 'Completed';
        const statusClass = session.is_active ? 'active' : 'completed';
        
        return `
            <tr>
                <td>
                    <strong>#${session.id}</strong>
                    ${session.is_active ? '<span class="live-indicator"></span>' : ''}
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar-small">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div class="user-name">${getUserName(session.user_id) || 'Unknown User'}</div>
                            <div class="user-id">ID: ${session.user_id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="charge-point-info">
                        <i class="fas fa-plug"></i>
                        <span>Point ${session.charge_point_id}</span>
                    </div>
                </td>
                <td>
                    <div class="duration-info">
                        <div class="duration-value">${duration}</div>
                        <div class="duration-label">${session.start_time ? formatTimeAgo(session.start_time) : 'Not started'}</div>
                    </div>
                </td>
                <td>
                    <div class="energy-info">
                        <div class="energy-value">${session.energy_consumed_kwh || 0} kWh</div>
                        <div class="power-value">${session.current_power_kw || 0} kW</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${status}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${session.is_active ? `
                            <button class="btn btn-danger btn-sm" onclick="stopSession(${session.id})" title="Stop Session">
                                <i class="fas fa-stop"></i>
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-sm" onclick="viewSessionDetails(${session.id})" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function calculateSessionDuration(session) {
    if (!session.start_time) return '0m';
    
    const startTime = new Date(session.start_time);
    const endTime = session.end_time ? new Date(session.end_time) : new Date();
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins}m`;
    } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    }
}

function formatTimeAgo(timestamp) {
    const time = new Date(timestamp);
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
}

function getUserName(userId) {
    // You can implement user name lookup here
    // For now, return a placeholder
    return `User ${userId}`;
}

function setupSessionFilters() {
    const searchInput = document.getElementById('session-search');
    const filterSelect = document.getElementById('session-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterSessions);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterSessions);
    }
}

function filterSessions() {
    const searchTerm = document.getElementById('session-search').value.toLowerCase();
    const filterValue = document.getElementById('session-filter').value;
    const rows = document.querySelectorAll('#sessions-table-body tr');
    
    rows.forEach(row => {
        const sessionId = row.cells[0].textContent.toLowerCase();
        const userName = row.cells[1].textContent.toLowerCase();
        const status = row.cells[5].textContent.toLowerCase();
        
        const matchesSearch = sessionId.includes(searchTerm) || userName.includes(searchTerm);
        const matchesFilter = filterValue === 'all' || 
                             (filterValue === 'active' && status === 'active') ||
                             (filterValue === 'completed' && status === 'completed');
        
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

function viewSessionDetails(sessionId) {
    console.log(`Viewing details for session ${sessionId}`);
    showNotification(`Viewing session ${sessionId} details`, 'info');
    // You can implement a modal or detail view here
}