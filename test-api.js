const http = require('http');

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(loginOptions, (res) => {
    let data = '';
    let cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Login Response:', res.statusCode, data);
        
        const updateOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/profile',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            }
        };

        const updateReq = http.request(updateOptions, (updateRes) => {
            let updateData = '';
            updateRes.on('data', (chunk) => updateData += chunk);
            updateRes.on('end', () => {
                console.log('Update Response:', updateRes.statusCode, updateData);
                process.exit(0);
            });
        });
        
        updateReq.write(JSON.stringify({
            name: "Test Update",
            username: "TestUpdated",
            avatar: "spidergwen.png"
        }));
        updateReq.end();
    });
});

req.write(JSON.stringify({
    email: "test2@test.com",
    password: "password"
}));
req.end();
