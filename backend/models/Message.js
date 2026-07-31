const mongoose = require('mongoose');
const { encryptMessage, decryptMessage } = require('../utils/encryption');

// Define Message Schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        // Mongoose Setters and Getters:
        // 'set' runs right before the document is saved to MongoDB (encrypts plain text)
        // 'get' runs right after the document is fetched from MongoDB (decrypts cipher text)
        set: encryptMessage,
        get: decryptMessage
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Ensure getters run when document is converted to JSON/Object
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Export the Message model
module.exports = mongoose.model('Message', messageSchema);
