const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  
  console.log("Typing credentials...");
  await page.type('#email', 'test2@test.com');
  await page.type('#password', 'password');
  
  console.log("Clicking submit...");
  await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('No navigation:', e.message))
  ]);
  
  console.log("Current URL after login:", page.url());
  
  await browser.close();
})();
