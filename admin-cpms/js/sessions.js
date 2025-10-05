let sessions = [];

// Initialize sessions page
async function initSessions() {
    if (!checkAuth()) return;

    try {
        sessions = await getSessions();
        displaySessions(sessions);
        setupSessionFilters();
    } catch (error) {
        console.error('Error loading sessions:', error);
        showError('Failed to load sessions');
    }
}

// Display sessions in table
function displaySessions(sessionsToShow) {
    const tbody = document.getElementById('sessions-table-body');
    
    tbody.innerHTML = sessionsToShow.map(session => `
        <tr>
            <td>#${session.id}</td>
            <td>User #${session.user_id}</td>
            <td>CP #${session.charge_point_id} (Station #${session.station_id})</td>
            <td>${calculateDuration(session)}</td>
            <td>
                <div>${session.energy_consumed_kwh.toFixed(2)} kWh</div>
                <div style="font-size: 0.875rem; color: #64748b;">${session.current_power_kw} kW</div>
            </td>
            <td>
                <span class="status-badge ${session.is_active ? 'available' : 'unavailable'}">
                    ${session.is_active ? 'Active' : 'Completed'}
                </span>
            </td>
            <td>
                ${session.is_active ? `
                    <button class="btn btn-danger" onclick="stopSession(${session.id})">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

// Calculate session duration
function calculateDuration(session) {
    if (session.is_active) {
        const start = new Date(session.start_time);
        const now = new Date();
        const diffMs = now - start;
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins} min`;
    } else if (session.end_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        return `${diffMins} min`;
    }
    return 'N/A';
}

// Setup session filters
function setupSessionFilters() {
    const searchInput = document.getElementById('session-search');
    const filterSelect = document.getElementById('session-filter');

    searchInput.addEventListener('input', filterSessions);
    filterSelect.addEventListener('change', filterSessions);
}

// Filter sessions based on search and filter criteria
function filterSessions() {
    const searchTerm = document.getElementById('session-search').value.toLowerCase();
    const filterValue = document.getElementById('session-filter').value;

    let filteredSessions = sessions.filter(session => {
        const matchesSearch = session.id.toString().includes(searchTerm) ||
                            session.user_id.toString().includes(searchTerm) ||
                            session.charge_point_id.toString().includes(searchTerm);
        
        const matchesFilter = filterValue === 'all' ||
                            (filterValue === 'active' && session.is_active) ||
                            (filterValue === 'completed' && !session.is_active);
        
        return matchesSearch && matchesFilter;
    });

    displaySessions(filteredSessions);
}

// Stop charging session
async function stopSession(sessionId) {
    if (!confirm('Are you sure you want to stop this charging session?')) {
        return;
    }

    try {
        await stopChargingSession(sessionId);
        showSuccess('Charging session stopped');
        initSessions(); // Reload sessions
    } catch (error) {
        showError('Failed to stop session: ' + error.message);
    }
}