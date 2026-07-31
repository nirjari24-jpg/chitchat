const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getUsers,
    getMessages,
    sendMessage
} = require('../controllers/messageController');

// All message routes require authentication
router.use(protect);

// Route to get all users to chat with
router.get('/users', getUsers);

// Route to get chat history with a specific user
router.get('/:userId', getMessages);

// Route to send a new message
router.post('/', sendMessage);

module.exports = router;
