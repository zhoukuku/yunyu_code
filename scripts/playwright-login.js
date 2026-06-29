/**
 * Scratch网站 - Playwright登录并获取数据
 * 使用Playwright登录后获取cookies，然后用cookies访问API
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const TARGET_URL = 'https://scratch.5aqima.com';
const USERNAME = '13713316871';
const PASSWORD = '316871';
const OUTPUT_DIR = path.join(__dirname, '../scraped-data');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndGetCookies() {
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

  try {
    // 1. 访问首页
    console.log('📄 访问首页...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await sleep(3000);

    // 2. 填写登录表单
    console.log('🔐 填写登录信息...');
    const accountInput = await page.$('#normal_login_account');
    const passwordInput = await page.$('#normal_login_password');
    const loginButton = await page.$('.login-form-button');

    if (!accountInput || !passwordInput || !loginButton) {
      console.log('❌ 未找到登录表单');
      return null;
    }

    await accountInput.fill(USERNAME);
    await sleep(500);
    await passwordInput.fill(PASSWORD);
    await sleep(500);
    await loginButton.click();

    console.log('⏳ 等待登录完成...');
    await sleep(10000);

    // 3. 检查登录结果
    const currentUrl = page.url();
    console.log('登录后URL: ' + currentUrl);

    // 4. 获取cookies
    const cookies = await context.cookies();
    console.log('\n获取到 ' + cookies.length + ' 个cookies:');
    cookies.forEach(c => {
      console.log('  ' + c.name + '=' + c.value.substring(0, 30) + '...');
    });

    // 保存cookies
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'cookies.json'),
      JSON.stringify(cookies, null, 2)
    );

    // 5. 等待应用加载
    console.log('\n⏳ 等待应用加载...');
    await sleep(5000);
    await page.waitForLoadState('networkidle');

    // 6. 保存页面
    const html = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'logged-in-page.html'), html);
    console.log('✓ 页面已保存');

    // 7. 获取所有链接
    const links = await page.evaluate(() => {
      return [...document.querySelectorAll('a[href]')]
        .map(a => a.href)
        .filter(h => h && !h.startsWith('javascript:'));
    });

    console.log('\n🔍 发现 ' + links.length + ' 个链接');
    links.slice(0, 10).forEach(l => console.log('  ' + l));

    return { browser, context, page, cookies, links };

  } catch (error) {
    console.error('❌ 失败:', error.message);
    return null;
  }
}

function apiRequest(endpoint, method = 'GET', data = null, cookies) {
  return new Promise((resolve, reject) => {
    const cookieStr = cookies.map(c => c.name + '=' + c.value).join('; ');

    const options = {
      hostname: 'scratch.5aqima.com',
      port: 443,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookieStr,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log('Scratch网站 - Playwright登录获取数据');
  console.log('========================================\n');

  // 1. 登录获取cookies
  const result = await loginAndGetCookies();

  if (!result) {
    console.log('❌ 登录失败');
    return;
  }

  const { browser, cookies, page, links } = result;

  // 2. 用cookies访问API
  console.log('\n📊 尝试API请求...');

  const apiEndpoints = [
    '/api/auth/me',
    '/api/projects/list',
    '/api/courses',
    '/api/explore/projects',
    '/api/stats'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const res = await apiRequest(endpoint, 'GET', null, cookies);
      console.log(endpoint + ' -> ' + res.status);
      if (res.status === 200) {
        console.log('  数据: ' + JSON.stringify(res.data).substring(0, 200));
      }
    } catch (e) {
      console.log(endpoint + ' -> 失败: ' + e.message);
    }
  }

  // 3. 保存最终报告
  const report = {
    timestamp: '2026-06-15',
    cookiesCount: cookies.length,
    linksCount: links.length,
    sampleLinks: links.slice(0, 20)
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'session-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n========================================');
  console.log('✅ 完成!');
  console.log('Cookies: cookies.json');
  console.log('页面: logged-in-page.html');
  console.log('报告: session-report.json');
  console.log('========================================');

  await browser.close();
}

main().catch(console.error);