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
  console.log('Logged in at:', page.url());

  // HOME PAGE
  console.log('\n========== HOME PAGE ==========');
  const homeAnalysis = await page.evaluate(() => {
    return {
      title: document.title,
      navItems: Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-index-item')).map(e => e.innerText.trim()),
      subNavItems: [...new Set(Array.from(document.querySelectorAll('.qima-layouts-components-navigation-menu-item-name')).map(e => e.innerText.trim()))],
      pageText: document.body.innerText.substring(0, 3000)
    };
  });
  console.log('Title:', homeAnalysis.title);
  console.log('Nav items:', homeAnalysis.navItems);
  console.log('Sub-nav:', homeAnalysis.subNavItems);
  console.log('Page text:\n', homeAnalysis.pageText);

  results.navigation = homeAnalysis.navItems;
  results.pages.push({
    name: 'Home Dashboard',
    path: '/',
    features: ['User info display', 'Class list', 'Platform tools', 'Navigation menu'],
    uiComponents: homeAnalysis.navItems.concat(homeAnalysis.subNavItems),
    content: homeAnalysis.pageText.substring(0, 1000)
  });

  await page.screenshot({ path: 'e:/k/meee/code/project01/01_home.png', fullPage: true });

  // COURSE PAGES
  const courseRoutes = [
    { name: 'Scratch Course', path: '/course/scratch' },
    { name: 'Python Course', path: '/course/python' },
    { name: 'C++ Course', path: '/course/c++' }
  ];

  for (const route of courseRoutes) {
    console.log(`\n========== ${route.name.toUpperCase()} ==========`);
    try {
      await page.goto('https://scratch.5aqima.com' + route.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);

      const courseData = await page.evaluate(() => {
        return {
          text: document.body.innerText.substring(0, 3000),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t),
          cards: Array.from(document.querySelectorAll('[class*="card"]')).map(c => c.innerText.trim().substring(0, 100)).filter(t => t)
        };
      });

      console.log('Content:', courseData.text.substring(0, 1000));
      console.log('Buttons:', courseData.buttons);

      results.pages.push({
        name: route.name,
        path: route.path,
        features: ['Course list', 'Course categories', 'Course cards'],
        uiComponents: courseData.buttons,
        content: courseData.text.substring(0, 1000)
      });

      await page.screenshot({ path: `e:/k/meee/code/project01/02_${route.name.replace(/[^a-z]/gi, '')}.png`, fullPage: true });
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }

  // TEACHING CENTER
  console.log('\n========== TEACHING CENTER ==========');
  try {
    await page.goto('https://scratch.5aqima.com/teaching/class', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const teachingData = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t),
        forms: Array.from(document.querySelectorAll('input, select')).map(e => ({
          type: e.type || e.tagName,
          placeholder: e.placeholder || ''
        }))
      };
    });

    console.log('Content:', teachingData.text.substring(0, 1000));
    console.log('Buttons:', teachingData.buttons);
    console.log('Forms:', teachingData.forms);

    results.pages.push({
      name: 'Teaching Center',
      path: '/teaching/class',
      features: ['Class management', 'Teaching tools', 'Student tracking'],
      uiComponents: teachingData.buttons,
      forms: teachingData.forms,
      content: teachingData.text.substring(0, 1000)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/03_teaching.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // COMMUNITY PAGES
  console.log('\n========== COMMUNITY ==========');
  try {
    await page.goto('https://scratch.5aqima.com/community/works', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const communityData = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('Content:', communityData.text.substring(0, 500));

    results.pages.push({
      name: 'Community Works',
      path: '/community/works',
      features: ['Works display', 'Student works', 'Like/comment'],
      uiComponents: communityData.buttons,
      content: communityData.text.substring(0, 500)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/04_community.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // MATCH PAGES
  console.log('\n========== COMPETITION ==========');
  try {
    await page.goto('https://scratch.5aqima.com/match/info', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const matchData = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('Content:', matchData.text.substring(0, 500));

    results.pages.push({
      name: 'Competition Info',
      path: '/match/info',
      features: ['Competition info', 'Training courses', 'Exam practice', 'OJ evaluation'],
      uiComponents: matchData.buttons,
      content: matchData.text.substring(0, 500)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/05_match.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // CREATE PAGE
  console.log('\n========== CREATE / SCRATCH IDE ==========');
  try {
    await page.goto('https://scratch.5aqima.com/create/scratch', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    const scratchData = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 2000),
        hasCanvas: !!document.querySelector('canvas'),
        blocks: Array.from(document.querySelectorAll('[class*="block"]')).map(e => e.className).slice(0, 20),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('Has canvas:', scratchData.hasCanvas);
    console.log('Block classes:', scratchData.blocks);
    console.log('Buttons:', scratchData.buttons);
    console.log('Text:', scratchData.text.substring(0, 500));

    results.pages.push({
      name: 'Scratch Create',
      path: '/create/scratch',
      features: ['Scratch IDE', 'Block coding', 'Canvas/Stage', 'Sprite management', 'Costume editor', 'Sound manager'],
      uiComponents: scratchData.buttons,
      hasCanvas: scratchData.hasCanvas,
      blocks: scratchData.blocks,
      content: scratchData.text.substring(0, 500)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/06_create_scratch.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // SCRATCH DIRECT IDE
  console.log('\n========== SCRATCH IDE DIRECT ==========');
  try {
    await page.goto('https://scratch.5aqima.com/scratch', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    const scratchDirect = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 2000),
        hasCanvas: !!document.querySelector('canvas'),
        elements: Array.from(document.querySelectorAll('[class*="sprite"], [class*="costume"], [class*="stage"], [class*="block"]')).map(e => e.className).slice(0, 30)
      };
    });

    console.log('Has canvas:', scratchDirect.hasCanvas);
    console.log('Elements:', scratchDirect.elements);

    await page.screenshot({ path: 'e:/k/meee/code/project01/07_scratch_ide.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // CLASS DETAIL
  console.log('\n========== CLASS DETAIL ==========');
  try {
    await page.goto('https://scratch.5aqima.com/class/detail', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const classDetail = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('Content:', classDetail.text.substring(0, 500));

    results.pages.push({
      name: 'Class Detail',
      path: '/class/detail',
      features: ['Class info', 'Student list', 'Course progress', 'Assignments'],
      uiComponents: classDetail.buttons,
      content: classDetail.text.substring(0, 500)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/08_class_detail.png', fullPage: true });
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // ADMIN SITE
  console.log('\n========== ADMIN SITE ==========');
  try {
    await page.goto('https://b.5aqima.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(8000);
    console.log('Admin URL:', page.url());

    const adminData = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 3000),
        links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.innerText.trim(),
          href: a.href
        })).filter(l => l.text),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('Admin content:', adminData.text.substring(0, 1000));
    console.log('Admin links:', adminData.links);
    console.log('Admin buttons:', adminData.buttons);

    results.pages.push({
      name: 'Admin Backend',
      path: '/ (admin at b.5aqima.com)',
      features: ['User management', 'Course management', 'Class management', 'Data statistics', 'System settings'],
      uiComponents: adminData.buttons,
      links: adminData.links,
      content: adminData.text.substring(0, 1000)
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/09_admin.png', fullPage: true });
  } catch (e) {
    console.log(`Admin error: ${e.message}`);
  }

  // USER MENU
  console.log('\n========== USER MENU ==========');
  await page.goto('https://scratch.5aqima.com/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Click on user name
  const userNameEl = await page.$('text=曾彩莹');
  if (userNameEl) {
    await userNameEl.click();
    await page.waitForTimeout(2000);

    const userMenu = await page.evaluate(() => {
      return {
        text: document.body.innerText.substring(0, 1000),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
      };
    });

    console.log('User menu:', userMenu.text.substring(0, 500));
    console.log('Buttons:', userMenu.buttons);

    await page.screenshot({ path: 'e:/k/meee/code/project01/10_user_menu.png', fullPage: true });
  }

  // NOTIFICATION
  console.log('\n========== NOTIFICATIONS ==========');
  const notifBadge = await page.$('[class*="badge"], .ant-scroll-number');
  if (notifBadge) {
    await notifBadge.click();
    await page.waitForTimeout(2000);

    const notifContent = await page.evaluate(() => {
      return document.body.innerText.substring(0, 1000);
    });

    console.log('Notification content:', notifContent);

    results.pages.push({
      name: 'Notifications',
      path: '/notifications',
      features: ['Notification list', 'Popup notifications', 'Badge count'],
      content: notifContent
    });

    await page.screenshot({ path: 'e:/k/meee/code/project01/11_notifications.png', fullPage: true });
  }

  // API ENDPOINTS
  const uniqueApis = [...new Set(apiCalls.map(c => c.endpoint.split('?')[0]))];
  results.apiEndpoints = uniqueApis;

  console.log('\n========== API ENDPOINTS ==========');
  uniqueApis.forEach(api => console.log(api));

  // FINAL OUTPUT
  console.log('\n\n========== FINAL COMPREHENSIVE RESULTS ==========');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();