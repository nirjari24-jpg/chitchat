const Message = require('../models/Message');
const User = require('../models/User');

// Get all users (except current user) for the friends list
const getUsers = async (req, res) => {
    try {
        // Find all users except the one currently logged in
        // Exclude the password field for security
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get messages between current user and a selected user
const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Find messages where the sender is currentUser and receiver is userId
        // OR sender is userId and receiver is currentUser
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 }); // Sort by time (oldest first)

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Send a new message
const sendMessage = async (req, res) => {
    try {
        const { receiverId, messageText } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !messageText) {
            return res.status(400).json({ message: 'Receiver and message text are required' });
        }

        // Create the new message
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            message: messageText
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getUsers,
    getMessages,
    sendMessage
};
