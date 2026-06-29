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
  await page.waitForTimeout(8000);

  console.log('Logged in, URL:', page.url());

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Get initial page content
  console.log('\n=== HOME PAGE ANALYSIS ===');

  const homeAnalysis = await page.evaluate(() => {
    // Get navigation items
    const navItems = Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-index-item, .qima-layouts-components-navigation-menu-item-name'))
      .map(el => el.innerText.trim())
      .filter(t => t && t.length < 20);

    // Get class cards
    const classCards = Array.from(document.querySelectorAll('.qima-components-class-moduls-title, .qima-components-class-moduls-value'))
      .map(el => el.innerText.trim())
      .filter(t => t);

    // Get header text
    const headerText = document.querySelector('.qima-layouts-header-header')?.innerText || '';

    // Get buttons
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t);

    // Get all links
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({ text: a.innerText.trim(), href: a.href }))
      .filter(l => l.text);

    return { navItems, classCards, headerText, buttons, links };
  });

  console.log('Nav items:', homeAnalysis.navItems);
  console.log('Class cards:', homeAnalysis.classCards);
  console.log('Header:', homeAnalysis.headerText.substring(0, 200));
  console.log('Buttons:', homeAnalysis.buttons);

  // Screenshot
  await page.screenshot({ path: 'e:/k/meee/code/project01/01_home.png', fullPage: true });

  // Hover over 课程中心
  console.log('\n=== HOVER OVER 课程中心 ===');
  const courseCenterEl = await page.$('text=课程中心');
  if (courseCenterEl) {
    await courseCenterEl.hover();
    await page.waitForTimeout(1500);

    const courseSubs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-item-name'))
        .map(el => el.innerText.trim());
    });
    console.log('Course sub-items:', courseSubs);
  }

  // Hover over 创意中心
  console.log('\n=== HOVER OVER 创意中心 ===');
  const creativeEl = await page.$('text=创意中心');
  if (creativeEl) {
    await creativeEl.hover();
    await page.waitForTimeout(1500);

    const creativeSubs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-item-name'))
        .map(el => el.innerText.trim());
    });
    console.log('Creative sub-items:', creativeSubs);
  }

  // Hover over 考级赛事
  console.log('\n=== HOVER OVER 考级赛事 ===');
  const matchEl = await page.$('text=考级赛事');
  if (matchEl) {
    await matchEl.hover();
    await page.waitForTimeout(1500);

    const matchSubs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-item-name'))
        .map(el => el.innerText.trim());
    });
    console.log('Match sub-items:', matchSubs);
  }

  // Hover over 去创作
  console.log('\n=== HOVER OVER 去创作 ===');
  const createEl = await page.$('text=去创作');
  if (createEl) {
    await createEl.hover();
    await page.waitForTimeout(1500);

    const createSubs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-item-name'))
        .map(el => el.innerText.trim());
    });
    console.log('Create sub-items:', createSubs);
  }

  // Navigate to scratch course by clicking
  console.log('\n=== NAVIGATING TO GRAPHIC PROGRAMMING COURSE ===');
  await page.goto('https://scratch.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Click on 图形化编程 under 课程中心
  const scratchLink = await page.$('text=图形化编程');
  if (scratchLink) {
    await scratchLink.click();
    await page.waitForTimeout(5000);
    console.log('URL after clicking 图形化编程:', page.url());

    const scratchContent = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        url: window.location.href
      };
    });
    console.log('Scratch course page:', scratchContent.text);

    await page.screenshot({ path: 'e:/k/meee/code/project01/02_scratch_course.png', fullPage: true });
  }

  // Go to class page
  console.log('\n=== NAVIGATING TO CLASS PAGE ===');
  await page.goto('https://scratch.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Click 进入班级
  const enterClassBtn = await page.$('text=进入班级');
  if (enterClassBtn) {
    await enterClassBtn.click();
    await page.waitForTimeout(5000);
    console.log('URL after entering class:', page.url());

    const classContent = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        url: window.location.href
      };
    });
    console.log('Class page:', classContent.text);

    await page.screenshot({ path: 'e:/k/meee/code/project01/03_class.png', fullPage: true });
  }

  // Go to Scratch IDE directly
  console.log('\n=== NAVIGATING TO SCRATCH IDE ===');
  await page.goto('https://scratch.5aqima.com/scratch', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('Scratch IDE URL:', page.url());

  const scratchIDEContent = await page.evaluate(() => {
    return {
      text: document.body.innerText.substring(0, 2000),
      hasCanvas: !!document.querySelector('canvas'),
      blockCategories: Array.from(document.querySelectorAll('[class*="block"]')).map(el => el.className).slice(0, 10)
    };
  });
  console.log('Scratch IDE:', scratchIDEContent);

  await page.screenshot({ path: 'e:/k/meee/code/project01/04_scratch_ide.png', fullPage: true });

  // Check notification
  console.log('\n=== CHECKING NOTIFICATIONS ===');
  await page.goto('https://scratch.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Look for notification badge
  const notifBadge = await page.$('[class*="badge"], [class*="notification"]');
  if (notifBadge) {
    await notifBadge.click();
    await page.waitForTimeout(2000);
    console.log('Notification panel opened');

    const notifContent = await page.evaluate(() => {
      return document.body.innerText.substring(0, 1000);
    });
    console.log('Notification content:', notifContent);
  }

  // Check user profile
  console.log('\n=== CHECKING USER PROFILE ===');
  const userName = await page.$('text=曾彩莹');
  if (userName) {
    await userName.click();
    await page.waitForTimeout(2000);
    console.log('User menu opened');

    const userMenuContent = await page.evaluate(() => {
      return document.body.innerText.substring(0, 1000);
    });
    console.log('User menu:', userMenuContent);

    await page.screenshot({ path: 'e:/k/meee/code/project01/05_user_menu.png', fullPage: true });
  }

  // Admin site
  console.log('\n=== CHECKING ADMIN SITE ===');
  await page.goto('https://b.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('Admin URL:', page.url());

  const adminContent = await page.evaluate(() => {
    return {
      text: document.body.innerText.substring(0, 2000)
    };
  });
  console.log('Admin content:', adminContent.text);

  await page.screenshot({ path: 'e:/k/meee/code/project01/06_admin.png', fullPage: true });

  // API endpoints
  const uniqueApis = [...new Set(apiCalls.map(c => c.endpoint.split('?')[0]))];
  results.apiEndpoints = uniqueApis;
  console.log('\n=== API ENDPOINTS ===');
  uniqueApis.forEach(api => console.log(api));

  await browser.close();
})();