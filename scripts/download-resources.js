/**
 * 下载所有前端资源文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_DIR = path.join(__dirname, '../scraped-data/assets');

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      resolve();
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://scratch.5aqima.com/'
      }
    }, response => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(filepath, () => {});
        resolve(downloadFile(response.headers.location, filepath));
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        resolve();
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

async function download(url, subdir) {
  try {
    const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
    const filepath = path.join(OUTPUT_DIR, subdir, filename);

    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      return { skipped: true, filename };
    }

    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    await downloadFile(url, filepath);

    const size = fs.existsSync(filepath) ? fs.statSync(filepath).size : 0;
    return { downloaded: true, filename, size };
  } catch (e) {
    return { failed: true, url, error: e.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('下载前端资源文件');
  console.log('========================================\n');

  // 确保目录存在
  const subdirs = ['js', 'css', 'images', 'fonts'];
  for (const dir of subdirs) {
    fs.mkdirSync(path.join(OUTPUT_DIR, dir), { recursive: true });
  }

  // 主要的JS文件列表
  const jsFiles = [
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/umi.js',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/umi.js',
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/vendors~layouts__index.js',
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/layouts__index.js',
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/p__login__index.js',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/vendors~layouts__index~p__class__course~p__class__index~p__class__lesson__interact__index~p__class__~8f2384c4.js',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/vendors~layouts__index.js',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/layouts__index.js',
  ];

  // 主要的CSS文件
  const cssFiles = [
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/umi.css',
    'https://frontend.5aqima.com/prod/qima-scratch-pc/20260125163000/layouts__index.chunk.css',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/umi.css',
  ];

  // 资源图片
  const imageFiles = [
    'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png',
    'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg',
    'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg',
    'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.jpg',
    'https://assets.5aqima.com/image/dfg9jhh021606j12.png',
    'https://assets.5aqima.com/qima_favicon.ico',
    'https://frontend.5aqima.com/prod/qima-c/20260304180000/static/login_bg.ed5108b4.jpg',
  ];

  // 下载JS
  console.log('📦 下载JS文件...');
  let jsCount = 0;
  for (const url of jsFiles) {
    const result = await download(url, 'js');
    if (result.downloaded) {
      jsCount++;
      console.log('  ✓ ' + result.filename);
    }
  }
  console.log('  完成: ' + jsCount + ' 个JS文件');

  // 下载CSS
  console.log('\n🎨 下载CSS文件...');
  let cssCount = 0;
  for (const url of cssFiles) {
    const result = await download(url, 'css');
    if (result.downloaded) {
      cssCount++;
      console.log('  ✓ ' + result.filename);
    }
  }
  console.log('  完成: ' + cssCount + ' 个CSS文件');

  // 下载图片
  console.log('\n🖼️ 下载图片文件...');
  let imgCount = 0;
  for (const url of imageFiles) {
    const result = await download(url, 'images');
    if (result.downloaded) {
      imgCount++;
      console.log('  ✓ ' + result.filename);
    }
  }
  console.log('  完成: ' + imgCount + ' 个图片文件');

  // 统计
  const stats = {
    js: fs.readdirSync(path.join(OUTPUT_DIR, 'js')).length,
    css: fs.readdirSync(path.join(OUTPUT_DIR, 'css')).length,
    images: fs.readdirSync(path.join(OUTPUT_DIR, 'images')).length,
    fonts: fs.readdirSync(path.join(OUTPUT_DIR, 'fonts')).length
  };

  console.log('\n========================================');
  console.log('✅ 资源下载完成!');
  console.log('========================================');
  console.log('JS: ' + stats.js + ' 个文件');
  console.log('CSS: ' + stats.css + ' 个文件');
  console.log('Images: ' + stats.images + ' 个文件');
  console.log('Fonts: ' + stats.fonts + ' 个文件');
  console.log('========================================');
}

main().catch(console.error);