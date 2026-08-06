const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'views', 'login.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, 'public', 'js', 'auth.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

try {
    window.eval(script);
    console.log("Script executed successfully");
    
    document.getElementById('email').value = 'test2@test.com';
    document.getElementById('password').value = 'password';
    
    let fetchCalled = false;
    window.fetch = async (url, options) => {
        fetchCalled = true;
        console.log("Fetch called with:", url, options);
        return {
            ok: true,
            json: async () => ({ message: 'Logged in successfully' })
        };
    };
    
    document.getElementById('loginForm').dispatchEvent(new window.Event('submit', { cancelable: true }));
    
    setTimeout(() => {
        console.log("Fetch was called:", fetchCalled);
        console.log("Location:", window.location.href);
    }, 100);
} catch (e) {
    console.error("Error executing script:", e);
}
