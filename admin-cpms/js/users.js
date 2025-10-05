let users = [];

// Initialize users page
async function initUsers() {
    if (!checkAuth()) return;

    try {
        users = await getUsers();
        displayUsers(users);
        setupUserFilters();
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Display users in table
function displayUsers(usersToShow) {
    const tbody = document.getElementById('users-table-body');
    
    tbody.innerHTML = usersToShow.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 2rem; height: 2rem; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div style="font-weight: 500;">${user.full_name}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="status-badge ${user.is_admin ? 'available' : 'unavailable'}">
                    ${user.is_admin ? 'Administrator' : 'User'}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.is_active ? 'available' : 'unavailable'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deactivateUser(${user.id})">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Setup user filters
function setupUserFilters() {
    const searchInput = document.getElementById('user-search');
    const filterSelect = document.getElementById('user-filter');

    searchInput.addEventListener('input', filterUsers);
    filterSelect.addEventListener('change', filterUsers);
}

// Filter users based on search and filter criteria
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filterValue = document.getElementById('user-filter').value;

    let filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm) ||
                            user.full_name.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterValue === 'all' ||
                            (filterValue === 'admin' && user.is_admin) ||
                            (filterValue === 'user' && !user.is_admin);
        
        return matchesSearch && matchesFilter;
    });

    displayUsers(filteredUsers);
}

// Edit user (placeholder)
function editUser(userId) {
    alert(`Edit user ${userId} - This feature would open an edit modal`);
}

// Deactivate user (placeholder)
function deactivateUser(userId) {
    if (confirm('Are you sure you want to deactivate this user?')) {
        alert(`Deactivate user ${userId} - This would call the deactivate API`);
        // In real implementation, call deactivate API and reload users
    }
}