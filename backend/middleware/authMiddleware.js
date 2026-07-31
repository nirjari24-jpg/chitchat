const jwt = require('jsonwebtoken');

// Middleware to protect routes
const protect = (req, res, next) => {
    let token;

    // Check if token exists in cookies
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    // If no token found
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request object
        req.user = decoded;
        
        // Move to the next middleware or controller
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
