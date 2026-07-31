const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
        // Use MONGO_URI from .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully!");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
