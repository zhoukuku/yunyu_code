const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Login to main site first
  console.log('=== LOGGING IN TO MAIN SITE ===');
  await page.goto('https://s.5aqima.com/login?redirect=https%3A%2F%2Fscratch.5aqima.com%2F', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.fill('#normal_login_account', '13713316871');
  await page.fill('#normal_login_password', '316871');
  await page.click('button.login-form-button');
  await page.waitForURL('**/scratch.5aqima.com/**', { timeout: 15000 });
  await page.waitForTimeout(5000);

  // Access admin site with same credentials
  console.log('\n=== ACCESSING ADMIN SITE ===');
  await page.goto('https://b.5aqima.com/user/login?redirect=https://b.5aqima.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Check if there's a login form
  const adminLoginForm = await page.$('form, .login-form, #login');
  if (adminLoginForm) {
    console.log('Found admin login form, logging in...');
    await page.fill('input[type="text"], input[name="username"], input[name="account"]', '13713316871');
    await page.fill('input[type="password"], input[name="password"]', '316871');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
  }

  console.log('Admin URL after login:', page.url());

  const adminAnalysis = await page.evaluate(() => {
    return {
      title: document.title,
      text: document.body.innerText.substring(0, 3000),
      links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.innerText.trim(),
        href: a.href.replace('https://b.5aqima.com', '')
      })).filter(l => l.text),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t),
      menus: Array.from(document.querySelectorAll('[class*="menu"], [class*="nav"], aside')).map(m => ({
        text: m.innerText?.trim().substring(0, 200),
        children: Array.from(m.querySelectorAll('a, div')).slice(0, 5).map(c => c.innerText.trim())
      }))
    };
  });

  console.log('Admin title:', adminAnalysis.title);
  console.log('Admin text:', adminAnalysis.text.substring(0, 1500));
  console.log('Admin links:', adminAnalysis.links);
  console.log('Admin buttons:', adminAnalysis.buttons);
  console.log('Admin menus:', adminAnalysis.menus);

  await page.screenshot({ path: 'e:/k/meee/code/project01/admin_full.png', fullPage: true });

  // Try to access admin dashboard directly
  console.log('\n=== TRYING ADMIN DASHBOARD ===');
  await page.goto('https://b.5aqima.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('Dashboard URL:', page.url());

  const dashboardAnalysis = await page.evaluate(() => {
    return {
      text: document.body.innerText.substring(0, 3000),
      cards: Array.from(document.querySelectorAll('[class*="card"], [class*="stat"], [class*="count"]')).map(c => c.innerText.trim().substring(0, 100)).filter(t => t),
      links: Array.from(document.querySelectorAll('a[href]')).map(a => a.innerText.trim()).filter(t => t)
    };
  });
  console.log('Dashboard text:', dashboardAnalysis.text.substring(0, 1000));
  console.log('Dashboard cards:', dashboardAnalysis.cards);
  console.log('Dashboard links:', dashboardAnalysis.links);

  await page.screenshot({ path: 'e:/k/meee/code/project01/admin_dashboard.png', fullPage: true });

  await browser.close();
})();