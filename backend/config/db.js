const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

// Connect to MongoDB
const connectDB = async () => {
    if (isConnected) {
        return;
    }
    
    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    if (!process.env.MONGO_URI) {
        console.error("MongoDB Connection Error: MONGO_URI environment variable is not defined!");
        return;
    }

    try {
        connectionPromise = mongoose.connect(process.env.MONGO_URI);
        const db = await connectionPromise;
        isConnected = db.connections[0].readyState === 1;
        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        connectionPromise = null;
    }
};

module.exports = connectDB;

