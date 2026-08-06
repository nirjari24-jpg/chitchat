const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
