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

  // Track all API calls
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('m2.5aqima.com') || url.includes('/api/')) {
      apiCalls.push({ method: req.method(), endpoint: url.replace('https://m2.5aqima.com', '') });
    }
  });

  // Login
  console.log('=== LOGGING IN ===');
  await page.goto('https://s.5aqima.com/login?redirect=https%3A%2F%2Fscratch.5aqima.com%2F', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.fill('#normal_login_account', '13713316871');
  await page.fill('#normal_login_password', '316871');
  await page.click('button.login-form-button');
  await page.waitForURL('**/scratch.5aqima.com/**', { timeout: 15000 });
  await page.waitForTimeout(5000);

  console.log('Logged in, URL:', page.url());

  // Capture all navigation items from sidebar
  const navItems = await page.evaluate(() => {
    // Find all sidebar/menu elements
    const menus = document.querySelectorAll('[class*="sidebar"], [class*="menu"], aside, nav');
    const items = [];
    menus.forEach(menu => {
      const links = menu.querySelectorAll('a, [class*="item"], [class*="menu-item"]');
      links.forEach(link => {
        const text = link.innerText?.trim();
        const href = link.href || '';
        if (text && text.length < 50) {
          items.push({ text, href });
        }
      });
    });
    return items;
  });

  // Also check the top menu
  const topMenuItems = await page.evaluate(() => {
    const header = document.querySelector('header') || document.querySelector('[class*="header"]');
    if (header) {
      return Array.from(header.querySelectorAll('a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(a => a.text);
    }
    return [];
  });

  results.navigation = [...topMenuItems, ...navItems];
  console.log('\nNavigation items:', JSON.stringify(results.navigation, null, 2));

  // Full page content
  const fullContent = await page.evaluate(() => document.body.innerText);
  console.log('\n=== FULL PAGE CONTENT ===\n', fullContent.substring(0, 5000));

  // Screenshot
  await page.screenshot({ path: 'e:/k/meee/code/project01/dashboard_01.png', fullPage: true });

  // Get all data-* attributes and class names for understanding structure
  const pageStructure = await page.evaluate(() => {
    // Get all sections/panels
    const sections = Array.from(document.querySelectorAll('[class*="section"], [class*="panel"], [class*="card"]')).slice(0, 20);
    return sections.map(s => ({
      class: s.className.substring(0, 80),
      text: s.innerText?.trim().substring(0, 100) || '',
      children: s.children.length
    }));
  });
  console.log('\nPage sections:', JSON.stringify(pageStructure, null, 2));

  // Now let's discover routes by checking all links on the page
  const allPageLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(h => h.includes('scratch.5aqima.com'))
      .map(h => h.replace('https://scratch.5aqima.com', ''));
  });
  results.allRoutes = [...new Set(allPageLinks)];
  console.log('\n=== ALL ROUTES ON PAGE ===');
  results.allRoutes.forEach(r => console.log(r));

  // Get API endpoints
  const uniqueApis = [...new Set(apiCalls.map(c => c.endpoint.split('?')[0]))];
  results.apiEndpoints = uniqueApis;
  console.log('\n=== API ENDPOINTS ===');
  uniqueApis.forEach(api => console.log(api));

  // Navigate to each major page and get detailed info
  const pagesToAnalyze = [
    { name: 'Home', path: '/' },
    { name: 'Course_Center', path: '/course' },
    { name: 'Teaching_Center', path: '/teaching' },
    { name: 'Creative_Center', path: '/community' },
    { name: 'Competition', path: '/match' },
    { name: 'Create', path: '/create' },
    { name: 'Admin_Center', path: '/admin' },
    { name: 'Help_Center', path: '/help' },
    { name: 'Feedback', path: '/feedback' },
    { name: 'User_Page', path: '/user' }
  ];

  console.log('\n=== ANALYZING EACH PAGE ===');
  for (const p of pagesToAnalyze) {
    try {
      console.log(`\n--- ${p.name} (${p.path}) ---`);
      await page.goto('https://scratch.5aqima.com' + p.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);

      const pageData = {
        name: p.name,
        path: p.path,
        url: page.url(),
        features: [],
        uiComponents: [],
        apiCalls: []
      };

      // Get text content
      const text = await page.evaluate(() => document.body.innerText);
      pageData.features = text.substring(0, 500).split('\n').filter(t => t.trim());

      // Get buttons
      const buttons = await page.$$eval('button', btns => btns.map(b => b.innerText.trim().substring(0, 30)).filter(t => t));
      pageData.uiComponents = buttons;

      // Check for forms
      const inputs = await page.$$eval('input, select, textarea', els => els.map(e => ({
        type: e.type || e.tagName,
        placeholder: e.placeholder || '',
        name: e.name || ''
      })));
      if (inputs.length > 0) {
        pageData.forms = inputs;
      }

      results.pages.push(pageData);
      console.log('Text preview:', text.substring(0, 200));
      console.log('Buttons:', buttons);

      // Screenshot
      await page.screenshot({ path: `e:/k/meee/code/project01/${p.name}.png`, fullPage: true });

    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  // Output final results
  console.log('\n\n=== FINAL COMPREHENSIVE RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();