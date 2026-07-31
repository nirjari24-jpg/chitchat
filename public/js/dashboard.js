// Check if user is logged in locally
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = '/login';
}

// Global variables for dashboard state
let selectedUserId = null;
let allUsers = [];

// Load users when dashboard opens
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsers();
});

// Fetch all other users from API
const fetchUsers = async () => {
    try {
        const response = await fetch('/api/messages/users');
        
        if (response.status === 401) {
            // Unauthorized, token expired or missing
            handleLogout();
            return;
        }

        allUsers = await response.json();
        renderUserList(allUsers);
        
        // Restore selected user if it exists in local storage
        const savedUserId = localStorage.getItem('selectedUserId');
        if (savedUserId && typeof selectUser === 'function') {
            const userToSelect = allUsers.find(u => u._id === savedUserId);
            if (userToSelect) {
                selectUser(userToSelect);
            }
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// Render users in the left sidebar
const renderUserList = (users) => {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = ''; // Clear current list

    if (users.length === 0) {
        userListElement.innerHTML = '<p style="padding: 20px; color: #6B7280; text-align: center;">No users found</p>';
        return;
    }

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        // Add active class if this user is currently selected
        if (user._id === selectedUserId) {
            userDiv.classList.add('active');
        }
        
        userDiv.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; margin-right: 15px; border: 2px solid var(--primary-blue); background-color: var(--card-white);">
                <img src="/images/avatars/${user.avatar || 'default.png'}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div>
                <p class="fancy-name" style="margin-bottom: 2px; font-size: 16px;">${user.username || user.name}</p>
                <p style="font-size: 12px; opacity: 0.8; text-transform: capitalize;">${user.name}</p>
            </div>
        `;

        // Add click event to select user for chatting
        userDiv.addEventListener('click', () => {
            // selectUser is defined in chat.js
            if (typeof selectUser === 'function') {
                selectUser(user);
                
                // Close sidebar on mobile
                const sidebar = document.querySelector('.sidebar');
                if (window.innerWidth <= 768 && sidebar) {
                    sidebar.classList.remove('open');
                }
            }
        });

        userListElement.appendChild(userDiv);
    });
};

// Search users functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Filter the globally stored users
        const filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );
        renderUserList(filteredUsers);
    });
}

// Handle Logout
const handleLogout = async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('user');
        localStorage.removeItem('selectedUserId');
        window.location.href = '/login';
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

// Attach logout event
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking outside on mobile
    document.querySelector('.chat-area').addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}
