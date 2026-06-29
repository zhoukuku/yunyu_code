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

  // Track API calls
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
  await page.waitForTimeout(8000);
  console.log('Logged in, URL:', page.url());

  // Analyze home page
  console.log('\n=== HOME PAGE ===');
  const homeData = await page.evaluate(() => {
    const getText = (sel) => Array.from(document.querySelectorAll(sel)).map(e => e.innerText.trim()).filter(t => t);

    return {
      title: document.title,
      navMain: getText('.qima-layouts-components-navigation-menu-index-item'),
      navSub: getText('.qima-layouts-components-navigation-menu-item-name'),
      classTitles: getText('.qima-components-class-moduls-title'),
      classValues: getText('.qima-components-class-moduls-value'),
      headerLinks: Array.from(document.querySelectorAll('.qima-layouts-header-header a')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })),
      allLinks: Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.innerText.trim().substring(0, 50),
        href: a.href.replace('https://scratch.5aqima.com', '')
      })).filter(l => l.text)
    };
  });

  console.log('Title:', homeData.title);
  console.log('Main nav:', homeData.navMain);
  console.log('Sub nav items:', [...new Set(homeData.navSub)]);
  console.log('Class titles:', homeData.classTitles);
  console.log('Class values:', homeData.classValues);
  console.log('Header links:', homeData.headerLinks);
  console.log('All page links:', homeData.allLinks);

  await page.screenshot({ path: 'e:/k/meee/code/project01/home.png', fullPage: true });

  // Extract navigation structure from HTML
  console.log('\n=== NAVIGATION STRUCTURE ===');
  const navStructure = await page.evaluate(() => {
    // Get the full navigation HTML
    const navHTML = document.querySelector('.qima-layouts-components-navigation-menu-index')?.outerHTML || '';

    // Find all links in navigation
    const navLinks = Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-index a, .qima-layouts-components-navigation-menu-item a'))
      .map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        class: a.className
      }));

    return { navHTML: navHTML.substring(0, 2000), navLinks };
  });
  console.log('Nav links:', JSON.stringify(navStructure.navLinks, null, 2));

  // Find the actual routes by looking at data href or onclick
  const routesFound = await page.evaluate(() => {
    const routes = [];

    // Look for route patterns in data
    document.querySelectorAll('[data-href], [href*="/"], [onclick*="router"], [onclick*="push"]').forEach(el => {
      const href = el.getAttribute('data-href') || el.getAttribute('href') || '';
      const match = href.match(/\/[a-z\-]+/gi);
      if (match) {
        routes.push(...match);
      }
    });

    return [...new Set(routes)];
  });
  console.log('Routes found:', routesFound);

  // Try navigating to common routes based on the menu
  const routesToTry = [
    '/course/scratch',
    '/course/python',
    '/course/c++',
    '/teaching',
    '/teaching/class',
    '/community/works',
    '/community/national',
    '/match/info',
    '/match/practice',
    '/match/oj',
    '/create/scratch',
    '/create/python',
    '/scratch',
    '/scratch/ide',
    '/class/detail',
    '/class/lesson'
  ];

  console.log('\n=== TRYING ROUTES ===');
  for (const route of routesToTry) {
    try {
      await page.goto('https://scratch.5aqima.com' + route, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);

      const content = await page.evaluate(() => {
        const text = document.body.innerText.substring(0, 500);
        const is404 = document.body.innerHTML.includes('404');
        return { text, is404 };
      });

      if (!content.is404) {
        console.log(`FOUND: ${route} - ${content.text.substring(0, 100)}`);
        await page.screenshot({ path: `e:/k/meee/code/project01${route.replace(/\//g, '_')}.png`, fullPage: true });
      }
    } catch (e) {}
  }

  // Try class detail by clicking
  console.log('\n=== CLICKING CLASS ENTRY ===');
  await page.goto('https://scratch.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Look for class links
  const classLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="class"], a[href*="lesson"]')).map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }));
  });
  console.log('Class links:', classLinks);

  // Admin site
  console.log('\n=== ADMIN SITE ===');
  await page.goto('https://b.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('Admin URL:', page.url());

  const adminData = await page.evaluate(() => {
    return {
      text: document.body.innerText.substring(0, 3000),
      links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(l => l.text)
    };
  });
  console.log('Admin content:', adminData.text.substring(0, 1000));
  console.log('Admin links:', adminData.links);

  await page.screenshot({ path: 'e:/k/meee/code/project01/admin.png', fullPage: true });

  // API endpoints
  const uniqueApis = [...new Set(apiCalls.map(c => c.endpoint.split('?')[0]))];
  results.apiEndpoints = uniqueApis;
  console.log('\n=== API ENDPOINTS ===');
  uniqueApis.forEach(api => console.log(api));

  await browser.close();
})();