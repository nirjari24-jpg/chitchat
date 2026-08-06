const http = require('http');

const registerOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(registerOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Register Response:', res.statusCode, data);
        process.exit(0);
    });
});

req.write(JSON.stringify({
    name: "New Test User",
    email: "newtest@test.com",
    username: "newtestuser",
    password: "password123",
    avatar: "ironman.png"
}));
req.end();
