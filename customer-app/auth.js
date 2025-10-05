// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
    }
}

// Show login form
function showLogin() {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    clearErrors();
}

// Show signup form
function showSignup() {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    clearErrors();
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    const submitButton = loginFormElement.querySelector('button[type="button"]');

    // Basic validation
    if (!email || !password) {
        showError(errorElement, 'Please fill in all fields');
        return;
    }

    try {
        clearErrors();
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        console.log('Attempting login with:', email);
        
        const result = await authService.login(email, password);
        
        console.log('Login successful - Response:', result);
        
        // Check if we got the expected response structure
        if (result && result.access_token && result.user) {
            localStorage.setItem('token', result.access_token);
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            console.log('Redirecting to index.html');
            window.location.href = 'index.html';
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.log('Login error details:', error);
        console.log('Error response:', error.response);
        
        let errorMessage = 'Login failed. Please check your credentials and try again.';
        
        if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorElement, errorMessage);
        
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Sign in';
    }
}


// Handle signup
async function handleSignup() {
    const fullName = document.getElementById('signupFullName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phoneNumber = document.getElementById('signupPhone').value;
    const errorElement = document.getElementById('signupError');
    const submitButton = signupFormElement.querySelector('button[type="button"]');

    // Basic validation
    if (!fullName || !email || !password) {
        showError(errorElement, 'Please fill in all required fields');
        return;
    }

    try {
        clearErrors();
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        const userData = {
            email,
            password,
            full_name: fullName,
            phone_number: phoneNumber
        };

        console.log('Attempting signup with:', userData);
        
        const result = await authService.signup(userData);
        
        console.log('Signup successful - Response:', result);
        
        // Check if we got a successful response (user object)
        if (result && result.id) {
            // Signup successful - show message and redirect to login
            alert("Signup successful! Please sign in with your new account.");
            showLogin(); // Switch to login form
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.log('Signup error details:', error);
        console.log('Error response:', error.response);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        } else if (error.response?.data) {
            const errors = error.response.data;
            if (typeof errors === 'object') {
                errorMessage = Object.values(errors).flat().join(', ');
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorElement, errorMessage);
        
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create account';
    }
}


// async function handleSignup() {
//     const fullName = document.getElementById('signupFullName').value;
//     const email = document.getElementById('signupEmail').value;
//     const password = document.getElementById('signupPassword').value;
//     const phoneNumber = document.getElementById('signupPhone').value;
//     const errorElement = document.getElementById('signupError');
//     const submitButton = signupFormElement.querySelector('button[type="button"]');

//     // Basic validation
//     if (!fullName || !email || !password) {
//         showError(errorElement, 'Please fill in all required fields');
//         return;
//     }

//     try {
//         clearErrors();
        
//         // Show loading state
//         submitButton.disabled = true;
//         submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

//         const userData = {
//             email,
//             password,
//             full_name: fullName,
//             phone_number: phoneNumber
//         };

//         console.log('Attempting signup with:', userData);
        
//         const result = await authService.signup(userData);
        
//         console.log('Signup successful - Response:', result);
        
//         // Check if we got the expected response structure
//         if (result && result.response === 200) {
//             //localStorage.setItem('token', result.access_token);
//             //localStorage.setItem('currentUser', JSON.stringify(result.user));
//             alert("Signup successful..Proceed to signin...")
            
//             console.log('Redirecting to index.html');
//             window.location.href = 'auth.html';
//         } else {
//             throw new Error('Invalid response from server');
//         }
        
//     } catch (error) {
//         console.log('Signup error details:', error);
//         console.log('Error response:', error.response);
        
//         let errorMessage = 'Signup failed. Please try again.';
        
//         if (error.response?.data?.detail) {
//             errorMessage = error.response.data.detail;
//         } else if (error.response?.data) {
//             const errors = error.response.data;
//             if (typeof errors === 'object') {
//                 errorMessage = Object.values(errors).flat().join(', ');
//             }
//         } else if (error.message) {
//             errorMessage = error.message;
//         }
        
//         showError(errorElement, errorMessage);
        
//     } finally {
//         // Reset button state
//         submitButton.disabled = false;
//         submitButton.innerHTML = 'Create account';
//     }
// }

// Utility functions
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

function showError(element, message) {
    console.log('Showing error:', message);
    element.textContent = message;
    element.classList.remove('hidden');
    
    // Add animation for error appearance
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.alert-error');
    errorElements.forEach(element => {
        element.classList.add('hidden');
        element.textContent = '';
    });
}

// Add Enter key support for forms
function setupEnterKeySupport() {
    const loginInputs = loginFormElement.querySelectorAll('input');
    const signupInputs = signupFormElement.querySelectorAll('input');
    
    // Login form Enter key support
    loginInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    });
    
    // Signup form Enter key support
    signupInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSignup();
            }
        });
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth page loaded');
    
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignup();
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    }

    // Setup Enter key support
    setupEnterKeySupport();

    checkAuthStatus();
});