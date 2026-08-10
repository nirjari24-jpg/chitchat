const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getUsers,
    getMessages,
    sendMessage,
    pingUser,
    getOnlineUsers,
    markAsSeen,
    markAsDelivered
} = require('../controllers/messageController');

// All message routes require authentication
router.use(protect);

// Route to ping user's lastActive status
router.post('/ping', pingUser);

// Route to get online users
router.get('/online', getOnlineUsers);

// Route to set typing status to a receiver
router.post('/typing/:receiverId', setTypingStatus);

// Route to get typing status of a sender
router.get('/typing-status/:senderId', getTypingStatus);

// Route to mark messages from a sender as seen
router.post('/seen/:senderId', markAsSeen);

// Route to mark unread messages as delivered
router.post('/delivered', markAsDelivered);

// Route to get all users to chat with
router.get('/users', getUsers);

// Route to get chat history with a specific user
router.get('/:userId', getMessages);

// Route to send a new message
router.post('/', sendMessage);

module.exports = router;
