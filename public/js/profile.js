// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = '/login';
}

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
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (response.ok) {
                // Update user in local storage
                const updatedUser = { ...user, name: data.name };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
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
