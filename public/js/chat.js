// This file works together with dashboard.js to handle chat functionality

let socket = null;
try {
    if (typeof io === 'function') {
        socket = io({ transports: ['websocket', 'polling'] });
        
        socket.on('connect', () => {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                socket.emit('register', currentUser._id);
            }
        });

        socket.on('newMessage', (newMsg) => {
            if (selectedUserId && newMsg.sender === selectedUserId) {
                appendMessage(newMsg);
            }
        });
    }
} catch (err) {
    console.warn('Socket.io not connected (using HTTP polling fallback):', err);
}

// Function called when a user is clicked in the sidebar
const selectUser = (user) => {
    // selectedUserId is a global variable from dashboard.js
    selectedUserId = user._id;
    localStorage.setItem('selectedUserId', selectedUserId);
    
    // Update UI to highlight active user in sidebar
    renderUserList(allUsers); 
    
    // Hide empty state and show active chat interface
    document.getElementById('chatEmptyState').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';
    
    // Set chat header data
    document.getElementById('chatUserName').textContent = user.username || user.name;
    document.getElementById('chatUserRealName').textContent = user.name;
    
    const avatarImg = document.getElementById('chatUserAvatar');
    if (avatarImg) {
        avatarImg.src = `/images/avatars/${user.avatar || 'default.png'}`;
        avatarImg.style.display = 'block';
    }
    
    document.getElementById('chatOnlineStatus').style.display = 'flex';
    document.getElementById('callActionButtons').style.display = 'flex';
    
    // Fetch previous messages for this user
    fetchMessages();

    // Start auto-polling every 3 seconds for continuous updates on Vercel / serverless
    if (window.chatPollingInterval) clearInterval(window.chatPollingInterval);
    window.chatPollingInterval = setInterval(() => {
        if (selectedUserId) {
            fetchMessages(true);
        }
    }, 3000);
};

// Fetch messages for the selected user from API
const fetchMessages = async () => {
    if (!selectedUserId) return;
    
    try {
        const response = await fetch(`/api/messages/${selectedUserId}`);
        const messages = await response.json();
        
        renderMessages(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
};

// Render messages in the chat area
const renderMessages = (messages) => {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = ''; // Clear current messages
    
    // Get current logged-in user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<p style="text-align: center; color: #6B7280; margin-top: 20px;">No messages yet. Say hi!</p>';
        return;
    }
    
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-box';
        
        let msgUser = msg.sender === currentUser._id ? currentUser : allUsers.find(u => u._id === msg.sender);
        if (!msgUser) msgUser = { username: 'Unknown', name: 'Unknown', avatar: 'default.png' };
        
        // Determine if message was sent by current user or received
        const isSent = msg.sender === currentUser._id;
        
        if (isSent) {
            msgDiv.classList.add('message-sent');
        } else {
            msgDiv.classList.add('message-received');
        }
        
        const timeString = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            <div style="display: flex; gap: 10px; flex-direction: ${isSent ? 'row-reverse' : 'row'}; margin-bottom: 5px; align-items: flex-end;">
                <div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                    <img src="/images/avatars/${msgUser.avatar || 'default.png'}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="max-width: 80%;">
                    <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px; display: flex; justify-content: ${isSent ? 'flex-end' : 'flex-start'}; gap: 5px; color: var(--text-muted);">
                        <span style="font-weight: bold; color: var(--text-main);">${msgUser.username || msgUser.name}</span>
                        <span>(${msgUser.name})</span>
                    </div>
                    <div style="padding: 10px 14px; border-radius: 16px; background: ${isSent ? 'linear-gradient(135deg, var(--primary-red), var(--dark-red))' : 'var(--card-bg)'}; color: white; border: ${isSent ? 'none' : '1px solid var(--border-color)'}; border-bottom-${isSent ? 'right' : 'left'}-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${msg.message}
                    </div>
                    <div style="font-size: 9px; margin-top: 4px; text-align: ${isSent ? 'right' : 'left'}; color: var(--text-muted);">
                        ${timeString} ${isSent ? '<span style="color: var(--primary-red); margin-left: 3px;">✓</span>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(msgDiv);
    });
    
    // Scroll to the bottom of the chat to show newest messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Append a single message to the chat area
const appendMessage = (msg) => {
    const messagesContainer = document.getElementById('messagesContainer');
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Remove "No messages yet" if present
    if (messagesContainer.innerHTML.includes('No messages yet')) {
        messagesContainer.innerHTML = '';
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message-box';
    
    let msgUser = msg.sender === currentUser._id ? currentUser : allUsers.find(u => u._id === msg.sender);
    if (!msgUser) msgUser = { username: 'Unknown', name: 'Unknown', avatar: 'default.png' };
    
    const isSent = msg.sender === currentUser._id;
    
    if (isSent) {
        msgDiv.classList.add('message-sent');
    } else {
        msgDiv.classList.add('message-received');
    }
    
    const timeString = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    msgDiv.innerHTML = `
        <div style="display: flex; gap: 10px; flex-direction: ${isSent ? 'row-reverse' : 'row'}; margin-bottom: 5px; align-items: flex-end;">
            <div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                <img src="/images/avatars/${msgUser.avatar || 'default.png'}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="max-width: 80%;">
                <div style="font-size: 11px; opacity: 0.7; margin-bottom: 3px; display: flex; justify-content: ${isSent ? 'flex-end' : 'flex-start'}; gap: 5px; color: var(--text-muted);">
                    <span style="font-weight: bold; color: var(--text-main);">${msgUser.username || msgUser.name}</span>
                    <span>(${msgUser.name})</span>
                </div>
                <div style="padding: 10px 14px; border-radius: 16px; background: ${isSent ? 'linear-gradient(135deg, var(--primary-red), var(--dark-red))' : 'var(--card-bg)'}; color: white; border: ${isSent ? 'none' : '1px solid var(--border-color)'}; border-bottom-${isSent ? 'right' : 'left'}-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    ${msg.message}
                </div>
                <div style="font-size: 9px; margin-top: 4px; text-align: ${isSent ? 'right' : 'left'}; color: var(--text-muted);">
                    ${timeString} ${isSent ? '<span style="color: var(--primary-red); margin-left: 3px;">✓</span>' : ''}
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(msgDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Send a new message to the API
const sendMessage = async () => {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !selectedUserId) return;
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiverId: selectedUserId,
                messageText: messageText
            })
        });
        
        if (response.ok) {
            const savedMessage = await response.json();
            // Clear input box
            messageInput.value = '';
            
            // Emit to server if socket is active
            if (socket && typeof socket.emit === 'function') {
                socket.emit('sendMessage', {
                    receiverId: selectedUserId,
                    message: savedMessage
                });
            }
            
            // Append to our own chat UI immediately
            appendMessage(savedMessage);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Handle Send Button Click
const sendBtn = document.getElementById('sendBtn');
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

// Handle Enter Key in Message Input box
const messageInput = document.getElementById('messageInput');
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
