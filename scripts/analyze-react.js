const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = {
    pages: [],
    apiEndpoints: [],
    navigation: [],
    allRoutes: []
  };

  // Login
  console.log('=== LOGGING IN ===');
  await page.goto('https://s.5aqima.com/login?redirect=https%3A%2F%2Fscratch.5aqima.com%2F', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.fill('#normal_login_account', '13713316871');
  await page.fill('#normal_login_password', '316871');
  await page.click('button.login-form-button');
  await page.waitForTimeout(8000);
  console.log('Logged in, URL:', page.url());

  // Wait for page to be fully loaded with React
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Get HTML content
  const html = await page.content();
  console.log('HTML length:', html.length);

  // Get root app element
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root') || document.querySelector('#root');
    if (root) {
      return root.innerHTML.substring(0, 5000);
    }
    return 'No #root found';
  });
  console.log('\nRoot content preview:', rootContent);

  // Wait for any content to appear
  try {
    await page.waitForSelector('[class*="container"], [class*="content"], main, nav', { timeout: 10000 });
    console.log('Found main content elements');
  } catch (e) {
    console.log('Main content elements not found');
  }

  // Get all elements with text
  const allElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const withText = [];
    for (const el of all) {
      if (el.children.length === 0 && el.innerText && el.innerText.trim()) {
        withText.push({
          tag: el.tagName,
          class: el.className.substring(0, 50),
          text: el.innerText.trim().substring(0, 100)
        });
      }
    }
    return withText.slice(0, 50);
  });
  console.log('\nElements with text:', JSON.stringify(allElements, null, 2));

  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim().substring(0, 50),
      href: a.href
    })).filter(l => l.text);
  });
  console.log('\nLinks:', JSON.stringify(links, null, 2));

  // Screenshot
  await page.screenshot({ path: 'e:/k/meee/code/project01/react_app.png', fullPage: true });

  // Now navigate to key pages
  const routes = [
    '/course',
    '/teaching',
    '/community',
    '/match',
    '/class',
    '/admin'
  ];

  for (const route of routes) {
    console.log(`\n--- Navigating to ${route} ---`);
    try {
      await page.goto('https://scratch.5aqima.com' + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);

      await page.waitForSelector('[class*="container"], [class*="content"], main', { timeout: 10000 }).catch(() => {});

      const content = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML.substring(0, 3000) : 'No root';
      });
      console.log('Content:', content.substring(0, 1000));

      await page.screenshot({ path: `e:/k/meee/code/project01${route.replace(/\//g, '_')}.png`, fullPage: true });
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  await browser.close();
})();