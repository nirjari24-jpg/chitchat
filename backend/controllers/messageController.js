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

const mongoose = require('mongoose');

// Get messages between current user and a selected user
const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        
        // Ensure valid ObjectIds are used
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
            return res.json([]);
        }

        const senderObjId = new mongoose.Types.ObjectId(currentUserId);
        const receiverObjId = new mongoose.Types.ObjectId(userId);

        // Find messages where the sender is currentUser and receiver is userId
        // OR sender is userId and receiver is currentUser
        const messages = await Message.find({
            $or: [
                { sender: senderObjId, receiver: receiverObjId },
                { sender: receiverObjId, receiver: senderObjId }
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
        const { receiverId, messageText, imageUrl } = req.body;
        const senderId = req.user.id;

        if (!receiverId || (!messageText && !imageUrl)) {
            return res.status(400).json({ message: 'Receiver and message text or image are required' });
        }

        // Check if receiver is online to set initial status
        const receiver = await User.findById(receiverId);
        let status = 'sent';
        if (receiver && receiver.lastActive) {
            const cutoffTime = new Date(Date.now() - 60000);
            if (receiver.lastActive >= cutoffTime) {
                status = 'delivered';
            }
        }

        // Create the new message
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            message: messageText || '[Image]', // Fallback for encryption logic if empty
            imageUrl: imageUrl || null,
            status: status
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Ping to update user's lastActive status
const pingUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { lastActive: new Date() });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Set typing status
const setTypingStatus = async (req, res) => {
    try {
        const { receiverId } = req.params;
        await User.findByIdAndUpdate(req.user.id, { 
            typingTo: receiverId,
            typingAt: new Date()
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get typing status of a specific user
const getTypingStatus = async (req, res) => {
    try {
        const { senderId } = req.params;
        const currentUserId = req.user.id;

        const sender = await User.findById(senderId);
        let isTyping = false;
        
        if (sender && sender.typingTo && sender.typingTo.toString() === currentUserId) {
            const cutoffTime = new Date(Date.now() - 5000); // 5 seconds
            if (sender.typingAt >= cutoffTime) {
                isTyping = true;
            }
        }

        res.status(200).json({ isTyping });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get online users from database
const getOnlineUsers = async (req, res) => {
    try {
        // Users active in the last 60 seconds (to account for background tab throttling)
        const cutoffTime = new Date(Date.now() - 60000);
        const onlineUsers = await User.find({ lastActive: { $gte: cutoffTime } }).select('_id');
        res.json(onlineUsers.map(u => u._id.toString()));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark messages from a specific sender as seen
const markAsSeen = async (req, res) => {
    try {
        const { senderId } = req.params;
        const currentUserId = req.user.id;
        
        await Message.updateMany(
            { sender: senderId, receiver: currentUserId, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );
        
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark unread messages as delivered when the current user is active
const markAsDelivered = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        await Message.updateMany(
            { receiver: currentUserId, status: 'sent' },
            { $set: { status: 'delivered' } }
        );
        
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getUsers,
    getMessages,
    sendMessage,
    pingUser,
    setTypingStatus,
    getTypingStatus,
    getOnlineUsers,
    markAsSeen,
    markAsDelivered
};
