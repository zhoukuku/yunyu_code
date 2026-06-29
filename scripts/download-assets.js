/**
 * 资源文件下载脚本
 * 从已抓取的HTML中提取资源URL并下载
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../scraped-data/assets');
const HTML_DIR = path.join(__dirname, '../scraped-data');

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    // 跳过 data: URI
    if (url.startsWith('data:')) {
      resolve();
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, response => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        file.close();
        fs.unlink(filepath, () => {});
        resolve(downloadFile(redirectUrl, filepath));
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        resolve(); // 跳过非200响应
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    req.on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      fs.unlink(filepath, () => {});
      reject(new Error('Timeout'));
    });
  });
}

function extractUrlsFromHtml(html) {
  const urls = {
    js: [],
    css: [],
    images: [],
    fonts: []
  };

  // 提取JS
  const jsMatches = html.matchAll(/src=["']([^"']+\.js[^"']*)["']/g);
  for (const match of jsMatches) {
    urls.js.push(match[1]);
  }

  // 提取CSS
  const cssMatches = html.matchAll(/href=["']([^"']+\.css[^"']*)["']/g);
  for (const match of cssMatches) {
    urls.css.push(match[1]);
  }

  // 提取图片
  const imgMatches = html.matchAll(/(?:src|background)=["']([^"']+\.(png|jpg|jpeg|gif|svg|webp|ico)[^"']*)["']/g);
  for (const match of imgMatches) {
    urls.images.push(match[1]);
  }

  // 提取字体
  const fontMatches = html.matchAll(/url\(["']?([^"')]+\.(woff2?|ttf|eot|otf)[^"')]*)["']?\)/g);
  for (const match of fontMatches) {
    urls.fonts.push(match[1]);
  }

  // 从CSS中提取资源
  const cssUrlMatches = html.matchAll(/href=["']([^"']+\.css[^"']*)["']/g);
  for (const match of cssUrlMatches) {
    urls.css.push(match[1]);
  }

  return urls;
}

async function downloadAssets() {
  console.log('📦 开始下载资源文件...\n');

  // 确保目录存在
  const subdirs = ['js', 'css', 'images', 'fonts'];
  for (const dir of subdirs) {
    const dirPath = path.join(OUTPUT_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // 获取所有HTML文件
  const htmlFiles = [
    path.join(HTML_DIR, 'home.html'),
    ...fs.readdirSync(path.join(HTML_DIR, 'projects'))
      .filter(f => f.endsWith('.html'))
      .map(f => path.join(HTML_DIR, 'projects', f)),
    ...fs.readdirSync(path.join(HTML_DIR, 'users'))
      .filter(f => f.endsWith('.html'))
      .map(f => path.join(HTML_DIR, 'users', f))
  ];

  console.log(`找到 ${htmlFiles.length} 个HTML文件`);

  // 统计
  const stats = { js: 0, css: 0, images: 0, fonts: 0 };
  const errors = [];

  // 收集所有URL
  const allUrls = { js: new Set(), css: new Set(), images: new Set(), fonts: new Set() };

  for (const file of htmlFiles) {
    try {
      const html = fs.readFileSync(file, 'utf-8');
      const urls = extractUrlsFromHtml(html);

      for (const url of urls.js) allUrls.js.add(url);
      for (const url of urls.css) allUrls.css.add(url);
      for (const url of urls.images) allUrls.images.add(url);
      for (const url of urls.fonts) allUrls.fonts.add(url);
    } catch (e) {
      console.log(`✗ 读取失败: ${file}`);
    }
  }

  console.log(`\n发现资源:`);
  console.log(`  JS: ${allUrls.js.size} 个`);
  console.log(`  CSS: ${allUrls.css.size} 个`);
  console.log(`  图片: ${allUrls.images.size} 个`);
  console.log(`  字体: ${allUrls.fonts.size} 个`);

  // 下载函数
  async function downloadType(type, urls) {
    let success = 0;
    let failed = 0;

    for (const url of urls) {
      try {
        const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
        const subdir = type;
        const filepath = path.join(OUTPUT_DIR, subdir, filename);

        // 跳过已存在的文件
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
          success++;
          continue;
        }

        await downloadFile(url, filepath);
        success++;
        if (success % 20 === 0) {
          console.log(`  ${type}: ${success}/${urls.size}`);
        }
      } catch (e) {
        failed++;
        // 只记录前5个错误
        if (errors.length < 5) {
          errors.push({ url, error: e.message });
        }
      }
    }

    console.log(`  ✓ ${type} 完成: ${success} 成功, ${failed} 失败`);
    return { success, failed };
  }

  // 下载各类资源
  console.log('\n开始下载...');

  const jsResult = await downloadType('js', allUrls.js);
  stats.js = jsResult.success;

  const cssResult = await downloadType('css', allUrls.css);
  stats.css = cssResult.success;

  const imgResult = await downloadType('images', allUrls.images);
  stats.images = imgResult.success;

  const fontResult = await downloadType('fonts', allUrls.fonts);
  stats.fonts = fontResult.success;

  // 保存下载报告
  const report = {
    timestamp: '2026-06-15',
    stats,
    errors: errors.slice(0, 20)
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'download-report.json'), JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log('📥 资源下载完成!');
  console.log('========================================');
  console.log(`JS: ${stats.js}`);
  console.log(`CSS: ${stats.css}`);
  console.log(`图片: ${stats.images}`);
  console.log(`字体: ${stats.fonts}`);
  console.log(`报告: assets/download-report.json`);
  console.log('========================================');
}

downloadAssets().catch(console.error);