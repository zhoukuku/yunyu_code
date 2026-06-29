/**
 * Scratch网站全站爬虫 - 修正版
 * 目标域名: s.5aqima.com (登录后跳转的真实应用)
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://scratch.5aqima.com';
const APP_URL = 'https://s.5aqima.com';  // 真实应用域名
const USERNAME = '13713316871';
const PASSWORD = '316871';
const OUTPUT_DIR = path.join(__dirname, '../scraped-data');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
  console.log('🔐 开始登录...');

  try {
    // 1. 先访问主站
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await sleep(3000);

    const accountInput = await page.$('#normal_login_account');
    const passwordInput = await page.$('#normal_login_password');
    const loginButton = await page.$('.login-form-button');

    if (!accountInput || !passwordInput || !loginButton) {
      console.log('⚠️ 未找到登录表单');
      return false;
    }

    await accountInput.fill(USERNAME);
    await sleep(500);
    await passwordInput.fill(PASSWORD);
    await sleep(500);
    await loginButton.click();
    console.log('⏳ 等待登录结果...');
    await sleep(8000);

    // 2. 检查当前URL
    const currentUrl = page.url();
    console.log('登录后URL: ' + currentUrl);

    // 3. 如果跳转到s.5aqima.com，记录cookie并继续
    if (currentUrl.includes('s.5aqima.com')) {
      console.log('✓ 成功跳转到应用域名!');
      return true;
    }

    // 4. 检查页面状态
    const loginForm = await page.$('#normal_login');
    if (!loginForm) {
      console.log('✓ 登录成功（未发现登录表单）');
      return true;
    }

    console.log('⚠️ 登录表单仍存在');
    return false;

  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    return false;
  }
}

async function scrollAndWait(page) {
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
  }
}

async function getAllLinks(page) {
  return await page.evaluate(() => {
    const anchors = document.querySelectorAll('a[href]');
    const links = [];
    anchors.forEach(a => {
      if (a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('mailto:')) {
        links.push(a.href);
      }
    });
    return [...new Set(links)];
  });
}

async function crawl() {
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
    // 1. 登录
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('❌ 登录失败，终止');
      return;
    }

    // 2. 等待应用完全加载
    console.log('\n⏳ 等待应用加载...');
    await sleep(5000);
    await scrollAndWait(page);

    // 保存当前页面
    const homeHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'app-home.html'), homeHtml);
    console.log('✓ 应用首页已保存: app-home.html');

    // 3. 获取链接
    console.log('\n🔍 扫描所有链接...');
    await page.waitForLoadState('networkidle');
    await sleep(2000);

    const allLinks = await getAllLinks(page);
    console.log('发现 ' + allLinks.length + ' 个链接');

    if (allLinks.length > 0) {
      console.log('\n所有链接:');
      allLinks.forEach(l => console.log('  ' + l));
    }

    // 分类
    const projectLinks = allLinks.filter(l => l.includes('/projects/'));
    const userLinks = allLinks.filter(l => l.includes('/users/'));
    const appLinks = allLinks.filter(l => l.includes('5aqima.com'));
    const otherLinks = allLinks.filter(l => {
      return !l.includes('/projects/') && !l.includes('/users/') && l.includes('5aqima.com');
    });

    console.log('\n项目页: ' + projectLinks.length + ' 个');
    console.log('用户页: ' + userLinks.length + ' 个');
    console.log('应用内链接: ' + appLinks.length + ' 个');

    // 4. 创建目录
    const subdirs = ['projects', 'users'];
    for (const dir of subdirs) {
      const dirPath = path.join(OUTPUT_DIR, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // 5. 如果没有足够链接，探测更多路径
    if (projectLinks.length < 5) {
      console.log('\n⚠️ 链接较少，探测更多路径...');

      const pathsToProbe = [
        '/projects',
        '/explore',
        '/community',
        '/class',
        '/users',
        '/classList',
        '/project',
        '/work',
        '/my',
        '/home'
      ];

      for (const pathStr of pathsToProbe) {
        try {
          const fullUrl = APP_URL + pathStr;
          console.log('探测: ' + pathStr);
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
          await sleep(3000);
          await scrollAndWait(page);

          const newLinks = await getAllLinks(page);
          console.log('  -> 发现 ' + newLinks.length + ' 个链接');

          if (newLinks.length > 0) {
            const html = await page.content();
            const safeName = pathStr.replace(/\//g, '_') || 'index';
            fs.writeFileSync(path.join(OUTPUT_DIR, safeName + '.html'), html);
          }
        } catch (e) {
          console.log('  -> 失败');
        }
      }
    }

    // 6. 获取最终链接列表
    const finalLinks = await getAllLinks(page);
    const appFinalLinks = finalLinks.filter(l => l.includes('5aqima.com'));
    console.log('\n📁 应用内链接总数: ' + appFinalLinks.length + ' 个');

    // 7. 抓取所有页面
    let success = 0;
    let failed = 0;

    for (const link of appFinalLinks) {
      try {
        await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
        await sleep(2000);

        const html = await page.content();
        const urlObj = new URL(link);
        const pathname = urlObj.pathname.replace(/\//g, '_') || 'index';
        fs.writeFileSync(path.join(OUTPUT_DIR, pathname + '.html'), html);

        success++;
        console.log('✓ [' + success + '] ' + link);
      } catch (e) {
        failed++;
        console.log('✗ ' + link.substring(0, 60));
      }
    }

    // 8. 保存报告
    const linkReport = {
      timestamp: '2026-06-15',
      appUrl: APP_URL,
      totalLinks: appFinalLinks.length,
      success: success,
      failed: failed,
      projectLinks: appFinalLinks.filter(l => l.includes('/projects/')),
      userLinks: appFinalLinks.filter(l => l.includes('/users/'))
    };
    fs.writeFileSync(path.join(OUTPUT_DIR, 'links-report.json'), JSON.stringify(linkReport, null, 2));

    console.log('\n========================================');
    console.log('🎉 抓取完成!');
    console.log('========================================');
    console.log('成功: ' + success + ' 个');
    console.log('失败: ' + failed + ' 个');
    console.log('报告: links-report.json');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);
  } finally {
    await browser.close();
  }
}

crawl().catch(console.error);