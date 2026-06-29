/**
 * Playwright - 监控网络请求找到真实API
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://scratch.5aqima.com';
const USERNAME = '13713316871';
const PASSWORD = '316871';
const OUTPUT_DIR = path.join(__dirname, '../scraped-data');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureNetwork() {
  console.log('🚀 启动浏览器...');

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  // 收集所有网络请求
  const networkRequests = [];

  page.on('request', request => {
    const url = request.url();
    // 只记录API或数据请求
    if (url.includes('api') || url.includes('5aqima') || url.includes('data') || url.includes('json')) {
      networkRequests.push({
        url,
        method: request.method(),
        headers: request.headers()
      });
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('api') || url.includes('5aqima')) {
      const req = networkRequests.find(r => r.url === url);
      if (req) {
        req.status = response.status();
      }
    }
  });

  try {
    // 1. 访问首页
    console.log('📄 访问首页...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await sleep(3000);

    // 2. 登录
    console.log('🔐 登录...');
    const accountInput = await page.$('#normal_login_account');
    const passwordInput = await page.$('#normal_login_password');
    const loginButton = await page.$('.login-form-button');

    if (accountInput && passwordInput && loginButton) {
      await accountInput.fill(USERNAME);
      await sleep(500);
      await passwordInput.fill(PASSWORD);
      await sleep(500);
      await loginButton.click();
      console.log('⏳ 等待登录...');
      await sleep(10000);
    }

    // 3. 等待应用加载
    console.log('⏳ 等待应用加载...');
    await page.waitForLoadState('networkidle');
    await sleep(5000);

    // 4. 点击一些按钮触发动态请求
    console.log('🔘 尝试点击导航...');

    // 点击课程或项目相关的元素
    const navItems = await page.$$('a, button');
    for (const item of navItems.slice(0, 10)) {
      try {
        await item.click();
        await sleep(1000);
      } catch (e) {}
    }

    await page.waitForLoadState('networkidle');
    await sleep(3000);

    // 5. 输出所有捕获的请求
    console.log('\n========================================');
    console.log('📡 捕获的网络请求:');
    console.log('========================================');

    // 按域名分组
    const byHost = {};
    for (const req of networkRequests) {
      try {
        const urlObj = new URL(req.url);
        const host = urlObj.host;
        const pathname = urlObj.pathname;

        if (!byHost[host]) byHost[host] = [];
        byHost[host].push({ ...req, pathname });
      } catch (e) {}
    }

    for (const [host, requests] of Object.entries(byHost)) {
      console.log('\n📦 ' + host + ' (' + requests.length + ' 请求)');
      for (const req of requests.slice(0, 20)) {
        console.log('  ' + req.method + ' ' + req.pathname + ' -> ' + (req.status || '?'));
      }
    }

    // 6. 保存报告
    const report = {
      timestamp: '2026-06-15',
      totalRequests: networkRequests.length,
      byHost: Object.keys(byHost).length,
      hosts: Object.keys(byHost),
      requests: networkRequests.slice(0, 100)
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'network-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n========================================');
    console.log('✅ 完成! 报告已保存');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 失败:', error.message);
  } finally {
    await browser.close();
  }
}

captureNetwork().catch(console.error);