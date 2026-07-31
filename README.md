# ChitChat - Modern Web Chat App

## Project Overview
ChitChat is a simple, modern, and clean chat web application built for an internship viva. It provides a beginner-friendly codebase with essential features like user registration, login, searching for friends, and sending one-to-one messages. The project focuses on clean architecture and readable code over complex frameworks, making it easy to explain and understand.

## Technologies Used
**Frontend:**
- HTML5
- CSS3 (Vanilla, Flexbox, Custom Variables)
- Vanilla JavaScript (ES6, Fetch API)

**Backend:**
- Node.js
- Express.js
- JSON Web Tokens (JWT) for Authentication
- bcrypt for Password Hashing
- cookie-parser for handling secure cookies

**Database:**
- MongoDB
- Mongoose

## Folder Structure
```
ChitChat-Viva/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Connection
│   ├── controllers/
│   │   ├── authController.js     # Login/Register/Profile logic
│   │   └── messageController.js  # Chat and User logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT Verification
│   ├── models/
│   │   ├── Message.js            # Mongoose Schema for messages
│   │   └── User.js               # Mongoose Schema for users
│   └── routes/
│       ├── authRoutes.js         # API routes for authentication
│       └── messageRoutes.js      # API routes for messaging
├── public/
│   ├── css/
│   │   ├── dashboard.css         # Styles specific to dashboard
│   │   └── style.css             # Global styles, variables, auth pages
│   ├── images/                   # Static images
│   └── js/
│       ├── auth.js               # Logic for login/signup
│       ├── chat.js               # Logic for sending/receiving messages
│       ├── dashboard.js          # Logic for sidebar and user list
│       └── profile.js            # Logic for updating user profile
├── views/
│   ├── dashboard.html            # Main chat interface
│   ├── index.html                # Landing page
│   ├── login.html                # Login page
│   ├── profile.html              # Profile page
│   └── signup.html               # Registration page
├── .env                          # Environment variables
├── package.json                  # Dependencies
├── server.js                     # Main application entry point
└── README.md                     # Project documentation
```

## Installation
1. Make sure you have Node.js and MongoDB installed on your computer.
2. Open a terminal and navigate to the project directory:
   ```bash
   cd ChitChat-Viva
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Make sure your local MongoDB server is running (usually on `mongodb://127.0.0.1:27017`).

## How to Run
1. Start the server:
   ```bash
   node server.js
   ```
2. Open your web browser and go to:
   ```
   http://localhost:3000
   ```
3. Create an account, log in, and start chatting! 
   *(Note: Messages update on page refresh or when clicking the "Refresh Messages" button, as per the simple design pattern requirements.)*

## API List
### Authentication APIs (`/api/auth`)
- `POST /register`: Create a new user.
- `POST /login`: Authenticate user and return a JWT cookie.
- `POST /logout`: Clear the JWT cookie.
- `GET /profile`: Get the logged-in user's details.
- `PUT /profile`: Update the logged-in user's name.

### Messaging APIs (`/api/messages`)
- `GET /users`: Get a list of all registered users (except the current one).
- `GET /:userId`: Get the chat history between the current user and the specified user.
- `POST /`: Send a new message to a specific user.

## Future Improvements
- Implement WebSockets (Socket.io) for real-time messaging without refreshing.
- Add image/file sharing capabilities.
- Add user online/offline status indicators.
- Implement "Typing..." indicators.
- Add dark mode support.
