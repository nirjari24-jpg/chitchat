const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    // Check if we are already connected using mongoose connection state
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!process.env.MONGO_URI) {
        console.error("MongoDB Connection Error: MONGO_URI environment variable is not defined!");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
    }
};

module.exports = connectDB;
