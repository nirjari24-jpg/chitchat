const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./backend/config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users for real-time messaging
const userSockets = new Map();

io.on('connection', (socket) => {
    socket.on('register', (userId) => {
        if (userId) {
            userSockets.set(userId, socket.id);
        }
    });

    socket.on('sendMessage', (data) => {
        // data = { receiverId, message }
        const receiverSocketId = userSockets.get(data.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', data.message);
        }
    });

    // --- WebRTC Signaling Events ---
    socket.on('call-user', (data) => {
        const receiverSocketId = userSockets.get(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call-made', {
                offer: data.offer,
                callerId: data.callerId,
                callerName: data.callerName,
                isVideo: data.isVideo
            });
        }
    });

    socket.on('make-answer', (data) => {
        const callerSocketId = userSockets.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('answer-made', {
                answer: data.answer
            });
        }
    });

    socket.on('ice-candidate', (data) => {
        const receiverSocketId = userSockets.get(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('ice-candidate', data.candidate);
        }
    });

    socket.on('reject-call', (data) => {
        const callerSocketId = userSockets.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call-rejected');
        }
    });

    socket.on('end-call', (data) => {
        const otherSocketId = userSockets.get(data.to);
        if (otherSocketId) {
            io.to(otherSocketId).emit('call-ended');
        }
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

// Middleware to parse incoming JSON requests
app.use(express.json());
// Middleware to parse URL encoded data
app.use(express.urlencoded({ extended: true }));
// Middleware to parse cookies
app.use(cookieParser());

// Serve static files (CSS, JS, Images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Define API Routes
// Auth routes for register, login, profile
app.use('/api/auth', require('./backend/routes/authRoutes'));
// Message routes for chat functionality
app.use('/api/messages', require('./backend/routes/messageRoutes'));

// Define HTML Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Start the Server
// Railway (and most PaaS providers) inject the PORT env var at runtime -
// the app MUST listen on this port and bind to 0.0.0.0, not just the
// fallback of 3000, otherwise health checks fail and the platform will
// keep restarting the container.
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});

// --- Error Handling & Graceful Shutdown ---
// Without these handlers, unexpected errors or platform-issued SIGTERM
// signals (e.g. during redeploys or health check failures) can crash the
// process abruptly, causing repeated restart loops.

server.on('error', (error) => {
    console.error('Server error:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(() => {
        console.log('HTTP server closed.');

        mongoose.connection.close(false).then(() => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        }).catch((error) => {
            console.error('Error closing MongoDB connection:', error);
            process.exit(1);
        });
    });

    // Force shutdown if graceful close takes too long
    setTimeout(() => {
        console.error('Could not close connections in time, forcing shutdown.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
