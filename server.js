const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./backend/config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store connected users for real-time messaging (mapping userId to a Set of socket IDs)
const userSockets = new Map();

const broadcastOnlineUsers = () => {
    const onlineUserIds = Array.from(userSockets.keys());
    io.emit('getOnlineUsers', onlineUserIds);
};

io.on('connection', (socket) => {
    socket.on('register', (userId) => {
        if (userId) {
            const uid = userId.toString();
            if (!userSockets.has(uid)) {
                userSockets.set(uid, new Set());
            }
            userSockets.get(uid).add(socket.id);
            socket.userId = uid;
            broadcastOnlineUsers();
        }
    });

    socket.on('sendMessage', (data) => {
        // data = { receiverId, message }
        const receiverSockets = userSockets.get(data.receiverId);
        if (receiverSockets) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('newMessage', data.message);
            });
        }
    });

    // WebRTC Signaling Events
    socket.on('callUser', (data) => {
        const receiverSockets = userSockets.get(data.userToCall);
        if (receiverSockets) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('callUser', { signal: data.signalData, from: data.from, name: data.name, isVideo: data.isVideo });
            });
        }
    });

    socket.on('answerCall', (data) => {
        const callerSockets = userSockets.get(data.to);
        if (callerSockets) {
            callerSockets.forEach(socketId => {
                io.to(socketId).emit('callAccepted', data.signal);
            });
        }
    });

    socket.on('rejectCall', (data) => {
        const callerSockets = userSockets.get(data.to);
        if (callerSockets) {
            callerSockets.forEach(socketId => {
                io.to(socketId).emit('callRejected');
            });
        }
    });

    socket.on('endCall', (data) => {
        const peerSockets = userSockets.get(data.to);
        if (peerSockets) {
            peerSockets.forEach(socketId => {
                io.to(socketId).emit('callEnded');
            });
        }
    });

    socket.on('webrtc_offer', (data) => {
        const receiverSockets = userSockets.get(data.to);
        if (receiverSockets) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('webrtc_offer', { sdp: data.sdp, from: data.from, isVideo: data.isVideo });
            });
        }
    });

    socket.on('webrtc_answer', (data) => {
        const callerSockets = userSockets.get(data.to);
        if (callerSockets) {
            callerSockets.forEach(socketId => {
                io.to(socketId).emit('webrtc_answer', { sdp: data.sdp });
            });
        }
    });

    socket.on('webrtc_ice_candidate', (data) => {
        const peerSockets = userSockets.get(data.to);
        if (peerSockets) {
            peerSockets.forEach(socketId => {
                io.to(socketId).emit('webrtc_ice_candidate', { candidate: data.candidate });
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            const sockets = userSockets.get(socket.userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(socket.userId);
                }
            }
        } else {
            for (const [userId, sockets] of userSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                    break;
                }
            }
        }
        broadcastOnlineUsers();
    });
});

// Middleware to parse incoming JSON requests
app.use(express.json());
// Middleware to parse URL encoded data
app.use(express.urlencoded({ extended: true }));
// Middleware to parse cookies
app.use(cookieParser());

// Enable CORS for frontend deployments (like Vercel)
app.use(cors({
    origin: true,
    credentials: true
}));

// Serve static files (CSS, JS, Images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to connect to DB on request if needed
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

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


// Start the Server (only when not running in Vercel serverless environment)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the Express API for Vercel
module.exports = app;

