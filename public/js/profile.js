// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = '/login';
}

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
let selectedAvatar = null;

// Load profile data when page opens
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/profile');
        
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const profileData = await response.json();
        
        // Populate form inputs and display elements
        document.getElementById('profileName').value = profileData.name;
        document.getElementById('profileEmail').value = profileData.email;
        document.getElementById('profileUsername').value = profileData.username;
        
        // Populate header display
        document.getElementById('profileUsernameDisplay').textContent = profileData.username;
        document.getElementById('profileCharacterDisplay').textContent = `Marvel Character: ${profileData.avatar.replace('.png', '')}`;
        document.getElementById('profileAvatarImg').src = `/images/avatars/${profileData.avatar || 'default.png'}`;
        
        selectedAvatar = profileData.avatar;
        
        // Render Avatar Grid
        const avatarGrid = document.getElementById('avatarGrid');
        if (avatarGrid) {
            avatarGrid.innerHTML = '';
            avatars.forEach(name => {
                const filename = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + '.png';
                const card = document.createElement('div');
                card.className = 'avatar-card';
                if (filename === selectedAvatar) {
                    card.classList.add('selected');
                    const badge = document.createElement('div');
                    badge.className = 'check-badge';
                    badge.innerHTML = '✓';
                    card.appendChild(badge);
                }
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                const avatarId = filename.replace('.png', '');
                card.innerHTML += `
                    <div class="avatar-img-wrapper">
                        <img src="/images/avatars/${filename}" alt="${name}" title="${name}" loading="lazy" class="avatar-img avatar-${avatarId}">
                    </div>
                `;
                
                const selectAvatar = () => {
                    document.querySelectorAll('#avatarGrid .avatar-card').forEach(c => {
                        c.classList.remove('selected');
                        const badge = c.querySelector('.check-badge');
                        if (badge) badge.remove();
                    });
                    card.classList.add('selected');
                    const badge = document.createElement('div');
                    badge.className = 'check-badge';
                    badge.innerHTML = '✓';
                    card.appendChild(badge);
                    
                    selectedAvatar = filename;
                    const usernameInput = document.getElementById('profileUsername');
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
        
        // Format Date
        if (profileData.createdAt) {
            const dateStr = new Date(profileData.createdAt).toLocaleDateString();
            document.getElementById('profileDateJoined').textContent = `Joined ${dateStr}`;
        }
        
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
});

// Handle Profile Update Form Submission
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('profileName').value;
        const username = document.getElementById('profileUsername').value;
        const successMsg = document.getElementById('successMsg');
        const errorMsg = document.getElementById('errorMsg');
        
        // Hide messages initially
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';

        try {
            // Send update request to API
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, avatar: selectedAvatar })
            });

            const data = await response.json();

            if (response.ok) {
                // Update user in local storage
                const updatedUser = { ...user, name: data.name, username: data.username, avatar: data.avatar };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                Object.assign(user, updatedUser);
                
                // Update header display
                document.getElementById('profileUsernameDisplay').textContent = data.username;
                document.getElementById('profileCharacterDisplay').textContent = `Marvel Character: ${data.avatar.replace('.png', '')}`;
                document.getElementById('profileAvatarImg').src = `/images/avatars/${data.avatar || 'default.png'}`;
                
                // Show success message
                successMsg.textContent = 'Profile updated successfully!';
                successMsg.style.display = 'block';
            } else {
                errorMsg.textContent = data.message || 'Failed to update profile';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            errorMsg.textContent = 'An error occurred. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
}

// Handle Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('user');
        window.location.href = '/login';
    });
}
