let stations = [];

// Initialize stations page
async function initStations() {
    if (!checkAuth()) return;

    try {
        stations = await getStations();
        displayStations(stations);
        setupStationFilters();
    } catch (error) {
        console.error('Error loading stations:', error);
        showError('Failed to load stations');
    }
}

// Display stations in grid
function displayStations(stationsToShow) {
    const grid = document.getElementById('stations-grid');
    
    grid.innerHTML = stationsToShow.map(station => `
        <div class="station-card">
            <div class="station-header">
                <div>
                    <h3 class="station-name">${station.name}</h3>
                    <p class="station-location">${station.location}</p>
                </div>
                <span class="status-badge ${station.available_connectors > 0 ? 'available' : 'unavailable'}">
                    ${station.available_connectors > 0 ? 'Available' : 'Full'}
                </span>
            </div>
            <div class="station-info">
                <div class="station-detail">
                    <i class="fas fa-bolt"></i>
                    <span>${station.available_connectors}/${station.total_connectors} connectors available</span>
                </div>
                <div class="station-detail">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>${station.power_output_kw} kW max power</span>
                </div>
                <div class="station-detail">
                    <i class="fas fa-calendar"></i>
                    <span>Added ${new Date(station.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="station-actions">
                <button class="btn btn-secondary" onclick="editStation(${station.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteStation(${station.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Setup station filters
function setupStationFilters() {
    const searchInput = document.getElementById('station-search');
    const filterSelect = document.getElementById('station-filter');

    searchInput.addEventListener('input', filterStations);
    filterSelect.addEventListener('change', filterStations);
}

// Filter stations based on search and filter criteria
function filterStations() {
    const searchTerm = document.getElementById('station-search').value.toLowerCase();
    const filterValue = document.getElementById('station-filter').value;

    let filteredStations = stations.filter(station => {
        const matchesSearch = station.name.toLowerCase().includes(searchTerm) ||
                            station.location.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterValue === 'all' ||
                            (filterValue === 'available' && station.available_connectors > 0) ||
                            (filterValue === 'unavailable' && station.available_connectors === 0);
        
        return matchesSearch && matchesFilter;
    });

    displayStations(filteredStations);
}

// Show add station modal
function showAddStationModal() {
    document.getElementById('add-station-modal').classList.add('active');
}

// Close add station modal
function closeAddStationModal() {
    document.getElementById('add-station-modal').classList.remove('active');
    document.getElementById('add-station-form').reset();
}

// Handle add station form submission
document.getElementById('add-station-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const stationData = {
        name: formData.get('name'),
        location: formData.get('location'),
        total_connectors: parseInt(formData.get('total_connectors')),
        power_output_kw: parseFloat(formData.get('power_output_kw'))
    };

    try {
        await createStation(stationData);
        closeAddStationModal();
        initStations(); // Reload stations
        showSuccess('Station added successfully');
    } catch (error) {
        showError('Failed to add station: ' + error.message);
    }
});

// Edit station (placeholder)
function editStation(stationId) {
    alert(`Edit station ${stationId} - This feature would open an edit modal`);
}

// Delete station (placeholder)
function deleteStation(stationId) {
    if (confirm('Are you sure you want to delete this station?')) {
        alert(`Delete station ${stationId} - This would call the delete API`);
        // In real implementation, call delete API and reload stations
    }
}

// Show success message
function showSuccess(message) {
    alert(`Success: ${message}`);
}