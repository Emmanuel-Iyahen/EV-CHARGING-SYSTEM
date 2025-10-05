// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    setupNavigation();
    setupEventListeners();
    loadCurrentPage();
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showPage(target);
        });
    });

    // Sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
    }
}

// Setup global event listeners
function setupEventListeners() {
    // Global escape key handler for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Click outside modal to close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Show specific page
function showPage(pageId) {
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

// Get page title
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

// Initialize page-specific functionality
function initializePage(pageId) {
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

// Load current page from URL hash or default to dashboard
function loadCurrentPage() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    showPage(hash);
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
}

// Update last updated time
function updateLastUpdated() {
    const element = document.getElementById('last-updated');
    if (element) {
        element.textContent = new Date().toLocaleString();
    }
}

// Initialize when page loads
window.addEventListener('load', function() {
    if (checkAuth()) {
        initializeApp();
        updateLastUpdated();
        
        // Refresh data every 30 seconds
        setInterval(() => {
            const currentPage = window.location.hash.substring(1) || 'dashboard';
            initializePage(currentPage);
        }, 30000);
    }
});

// Handle page visibility change for data refresh
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && checkAuth()) {
        const currentPage = window.location.hash.substring(1) || 'dashboard';
        initializePage(currentPage);
    }
});