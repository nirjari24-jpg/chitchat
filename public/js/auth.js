// Utility function to show errors
const showError = (message) => {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
};

// Marvel Avatars
const avatars = [
    'Iron Man',
    'Thor',
    'Spider-Man',
    'Loki',
    'Spider-Gwen',
    'Lady Thor',
    'Black Widow',
    'Doctor Strange',
    'Scarlet Witch',
    'Groot'
];

// Populate Avatar Grid
let selectedAvatar = null;
const avatarGrid = document.getElementById('avatarGrid');
if (avatarGrid) {
    avatars.forEach(name => {
        const filename = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '.png';
        const card = document.createElement('div');
        card.className = 'avatar-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Select ${name} avatar`);
        const avatarId = filename.replace('.png', '');
        card.innerHTML = `
            <div class="avatar-img-wrapper">
                <img src="/images/avatars/${filename}" alt="${name}" title="${name}" loading="lazy" class="avatar-img avatar-${avatarId}">
            </div>
        `;
        
        const selectAvatar = () => {
            // Remove selection and badges from others
            document.querySelectorAll('.avatar-card').forEach(c => {
                c.classList.remove('selected');
                const badge = c.querySelector('.check-badge');
                if (badge) badge.remove();
            });
            // Add selection to current
            card.classList.add('selected');
            
            // Add check badge
            const badge = document.createElement('div');
            badge.className = 'check-badge';
            badge.innerHTML = '✓';
            card.appendChild(badge);
            
            selectedAvatar = filename;
            
            // Auto-generate username
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.value = name.replace(/[^a-zA-Z0-9]/g, '');
            }
        };

        card.addEventListener('click', selectAvatar);
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectAvatar();
            }
        });
        
        avatarGrid.appendChild(card);
    });
}


// Handle Signup Form Submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form refresh

        // Get values from form
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const username = document.getElementById('username').value;

        if (!selectedAvatar || !username) {
            return showError('Please choose a Marvel Avatar!');
        }

        // Simple validation
        if (password !== confirmPassword) {
            return showError('Passwords do not match!');
        }

        try {
            // Call API to register
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, username, avatar: selectedAvatar })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to login page on success
                window.location.href = '/login';
            } else {
                showError(data.message || 'Registration failed');
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}

// Handle Login Form Submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Call API to login
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save user info in localStorage for easy access in frontend
                localStorage.setItem('user', JSON.stringify(data));
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                showError(data.message || 'Login failed');
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}
