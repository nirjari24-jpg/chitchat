const mongoose = require('mongoose');

let isConnected = false;

// Connect to MongoDB
const connectDB = async () => {
    if (isConnected) {
        return;
    }

    if (!process.env.MONGO_URI) {
        console.error("MongoDB Connection Error: MONGO_URI environment variable is not defined!");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI);
        isConnected = db.connections[0].readyState === 1;
        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
    }
};

module.exports = connectDB;

