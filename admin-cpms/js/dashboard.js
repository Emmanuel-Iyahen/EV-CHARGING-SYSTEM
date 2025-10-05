let stationChart, distributionChart;

// Initialize dashboard
async function initDashboard() {
    if (!checkAuth()) return;

    try {
        const user = await getCurrentUser();
        updateUserInfo(user);

        const dashboardData = await getDashboardData();
        updateDashboardStats(dashboardData);
        updateCharts(dashboardData);
        updateRecentActivity(dashboardData);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Update dashboard statistics
function updateDashboardStats(data) {
    const stats = data.statistics;
    const stationStatus = data.station_status;

    document.getElementById('total-stations').textContent = stats.total_stations || 0;
    document.getElementById('total-charge-points').textContent = stats.total_charge_points || 0;
    document.getElementById('total-users').textContent = stats.total_users || 0;
    document.getElementById('active-sessions').textContent = stats.active_sessions || 0;
}

// Update charts
function updateCharts(data) {
    updateStationChart(data.station_status);
    updateDistributionChart(data.station_status);
}

function updateStationChart(stationStatus) {
    const ctx = document.getElementById('stationChart').getContext('2d');
    
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
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
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
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Update recent activity
function updateRecentActivity(data) {
    const activityList = document.getElementById('activity-list');
    
    // Mock activity data - in real app, this would come from the API
    const activities = [
        { type: 'charging_start', user: 'John Doe', station: 'Downtown Hub', time: '2 minutes ago' },
        { type: 'charging_stop', user: 'Jane Smith', station: 'Shopping Mall', time: '5 minutes ago' },
        { type: 'station_added', station: 'Airport Terminal', time: '1 hour ago' }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <p>${getActivityText(activity)}</p>
                <small class="text-muted">${activity.time}</small>
            </div>
        </div>
    `).join('');
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

// Show error message
function showError(message) {
    // Simple error display - you could use a toast notification library
    alert(`Error: ${message}`);
}