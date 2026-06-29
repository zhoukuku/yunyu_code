const electron = require('electron');
const app = electron.app || electron;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const shell = electron.shell;
const session = electron.session;
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const http = require('http');
const { initAutoUpdater, setupUpdateIPC } = require('./update');
const { setupOfflineSupportIPC, startNetworkMonitoring, stopNetworkMonitoring } = require('./offlineSupport');
const { WindowStateManager, NotificationManager } = require('./windowManagement');
const { TrayMenuManager } = require('./trayMenu');

// ============== Electron 启动参数 ==============
try {
  if (app && app.commandLine) {
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-software-rasterizer');
    app.commandLine.appendSwitch('disable-gpu-compositing');
    app.commandLine.appendSwitch('enable-logging');
    app.commandLine.appendSwitch('v=1');
    app.commandLine.appendSwitch('no-sandbox');
  }
} catch(e) {
  console.error('commandLine error:', e.message);
}

// ============== 配置 ==============
const PORT = 3000;
const FRONTEND_PORT = 5174;
const VITE_DEV_URL = `http://localhost:${FRONTEND_PORT}`;
const SERVE_PORT = 5175; // 前端静态服务器端口（生产模式）

// ============== 全局变量 ==============
let mainWindow = null;
let trayManager = null;
let windowStateManager = null;
let notificationManager = null;
let backendProcess = null;
let isQuitting = false;

// ============== 日志函数 ==============
function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

function logError(...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, ...args);
}

// ============== 开发模式判断 ==============
function getIsDev() {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

// ============== 端口检测函数 ==============
function waitForPort(port, host = 'localhost', timeout = 60000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = 200;

    function check() {
      const client = new net.Socket();
      client.setTimeout(500);

      client.on('connect', () => {
        client.destroy();
        resolve();
      });

      client.on('timeout', () => {
        client.destroy();
        scheduleNext();
      });

      client.on('error', () => {
        client.destroy();
        scheduleNext();
      });

      client.connect(port, host);
    }

    function scheduleNext() {
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`端口 ${port} 在 ${timeout}ms 内未就绪`));
      } else {
        setTimeout(check, interval);
      }
    }

    check();
  });
}

// ============== 静态文件服务器（生产模式） ==============
let serveServer = null;

function startStaticServer(distPath) {
  return new Promise((resolve, reject) => {
    serveServer = http.createServer((req, res) => {
      // 规范化路径为正斜杠，避免 Windows 路径问题
      let urlPath = req.url.split('?')[0].split('#')[0];
      if (urlPath === '/') urlPath = '/index.html';

      // 直接使用 path.join 处理 URL 路径
      let filePath = path.join(distPath, urlPath);

      // 安全检查：确保文件在 distPath 内
      if (!path.normalize(filePath).startsWith(path.normalize(distPath))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // 如果文件不存在，返回 index.html（SPA 路由支持）
          if (err.code === 'ENOENT') {
            fs.readFile(path.join(distPath, 'index.html'), (err2, data2) => {
              if (err2) {
                res.writeHead(404);
                res.end('Not Found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data2);
              }
            });
          } else {
            res.writeHead(500);
            res.end('Server Error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
          res.end(data);
        }
      });
    });

    serveServer.listen(SERVE_PORT, 'localhost', () => {
      log(`静态文件服务器已启动: http://localhost:${SERVE_PORT}`);
      resolve();
    });

    serveServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        log(`端口 ${SERVE_PORT} 已被占用，尝试关闭后重试...`);
        serveServer.close(() => {
          startStaticServer(distPath).then(resolve).catch(reject);
        });
      } else {
        reject(err);
      }
    });
  });
}

function stopStaticServer() {
  if (serveServer) {
    serveServer.close();
    serveServer = null;
    log('静态文件服务器已关闭');
  }
}

// ============== 后端服务管理 ==============
function startBackendProcess() {
  const backendPath = getIsDev()
    ? path.join(__dirname, '..', '..', 'backend')
    : path.join(process.resourcesPath, 'app', 'backend');

  log('启动后端服务:', backendPath);

  // 检查后端路径
  if (!fs.existsSync(backendPath)) {
    logError('后端路径不存在:', backendPath);
    return false;
  }

  try {
    backendProcess = spawn('node', ['dist/src/main.js'], {
      cwd: backendPath,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log('[后端]', output);
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) logError('[后端错误]', output);
    });

    backendProcess.on('error', (err) => {
      logError('后端启动失败:', err.message);
    });

    backendProcess.on('close', (code) => {
      log('后端进程退出，代码:', code);
      backendProcess = null;
    });

    return true;
  } catch (err) {
    logError('启动后端异常:', err);
    return false;
  }
}

async function waitForBackend() {
  return new Promise((resolve) => {
    if (getIsDev()) {
      // 开发模式：等待端口或超时后继续
      waitForPort(PORT, 'localhost', 60000)
        .then(() => {
          log('后端服务已就绪，端口:', PORT);
          resolve(true);
        })
        .catch((err) => {
          logError('等待后端端口超时，继续启动:', err.message);
          resolve(false);
        });
    } else {
      // 生产模式：必须等待后端就绪
      waitForPort(PORT, 'localhost', 60000)
        .then(() => {
          log('后端服务已就绪，端口:', PORT);
          resolve(true);
        })
        .catch((err) => {
          logError('等待后端端口超时:', err.message);
          resolve(false);
        });
    }
  });
}

// ============== 窗口创建 ==============
async function createWindow() {
  log('创建主窗口...');

  // 创建窗口状态管理器
  windowStateManager = new WindowStateManager({
    defaultWidth: 1400,
    defaultHeight: 900,
    minWidth: 1024,
    minHeight: 768,
    windowOptions: {
      title: '云屿学习平台',
      icon: path.join(__dirname, 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    }
  });

  mainWindow = windowStateManager.createWindow();

  // 加载URL
  if (getIsDev()) {
    log('开发模式: 等待 Vite dev server...');

    // 等待 Vite dev server 就绪
    const maxRetries = 30;
    let viteReady = false;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(VITE_DEV_URL);
        if (response.ok) {
          log('Vite dev server 已就绪');
          viteReady = true;
          break;
        }
      } catch (e) {
        // 等待中
      }
      await new Promise(r => setTimeout(r, 1000));
      log(`等待 Vite dev server... (${i + 1}/${maxRetries})`);
    }

    if (viteReady) {
      await mainWindow.loadURL(VITE_DEV_URL);
      mainWindow.webContents.openDevTools();
    } else {
      logError('Vite dev server 未就绪，使用备用方案');
      await mainWindow.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`);
    }
  } else {
    // 生产模式：启动静态文件服务器
    const distPath = path.join(__dirname, 'dist');
    log('生产模式: 启动静态文件服务器...');
    await startStaticServer(distPath);
    await mainWindow.loadURL(`http://localhost:${SERVE_PORT}`);
    log('生产模式: 前端已通过 HTTP 加载');

    // 注册 Service Worker（仅生产模式）
    registerServiceWorker(mainWindow);
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      windowStateManager.minimizeToTray();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log('主窗口已创建');
}

// ============== Service Worker 注册 ==============
async function registerServiceWorker(window) {
  try {
    // 设置 Service Worker 路径
    const swPath = getIsDev()
      ? path.join(__dirname, 'dist', 'sw.js')
      : path.join(__dirname, 'dist', 'sw.js');

    if (!fs.existsSync(swPath)) {
      log('Service Worker 文件不存在，跳过注册');
      return;
    }

    // 通过 session 注册 Service Worker
    const swURL = getIsDev()
      ? `http://localhost:${SERVE_PORT}/sw.js`
      : `http://localhost:${SERVE_PORT}/sw.js`;

    session.defaultSession.serviceWorkers.register(swURL)
      .then(registration => {
        log('Service Worker 注册成功:', registration.scope);
      })
      .catch(err => {
        logError('Service Worker 注册失败:', err.message);
      });
  } catch (e) {
    logError('Service Worker 注册异常:', e);
  }
}

// ============== 系统托盘 ==============
function createTray() {
  // 创建通知管理器
  notificationManager = new NotificationManager({
    appName: '云屿学习平台'
  });

  // 创建托盘菜单管理器
  trayManager = new TrayMenuManager({
    appName: '云屿学习平台',
    iconPath: path.join(__dirname, 'tray-icon.png'),
    windowManagement: windowStateManager,
    notificationManager: notificationManager
  });

  trayManager.createTray();
  log('系统托盘已创建');
}

// ============== IPC 处理器 ==============
function setupIPC() {
  // 执行 Python 代码
  ipcMain.handle('execute-python', async (event, code) => {
    log('执行 Python 代码，长度:', code.length);
    const result = await executePython(code);
    // 发送执行结果通知
    if (notificationManager) {
      notificationManager.notifyCodeResult('Python', result.success, result.stderr || result.stdout);
    }
    return result;
  });

  // 执行 C++ 代码
  ipcMain.handle('execute-cpp', async (event, code) => {
    log('执行 C++ 代码，长度:', code.length);
    const result = await executeCpp(code);
    // 发送执行结果通知
    if (notificationManager) {
      notificationManager.notifyCodeResult('C++', result.success, result.stderr || result.stdout);
    }
    return result;
  });

  // 获取版本信息
  ipcMain.handle('get-version', () => {
    return {
      app: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    };
  });

  // 打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
  });

  // 发送系统通知
  ipcMain.handle('show-notification', async (event, { title, body }) => {
    if (notificationManager) {
      return notificationManager.show(title, body);
    }
    return null;
  });
}

// ============== Python 执行 ==============
function executePython(code) {
  return new Promise((resolve) => {
    const tempDir = getIsDev()
      ? path.join(__dirname, '..', '..', 'backend', 'temp')
      : path.join(process.resourcesPath, 'temp');

    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `python_${Date.now()}.py`);
    fs.writeFileSync(tempFile, code, 'utf8');

    // 尝试多个 Python 路径
    const pythonPaths = ['python', 'python3', 'py', 'C:\\Python311\\python.exe'];
    let pythonCmd = 'python';

    for (const p of pythonPaths) {
      try {
        const result = spawn(p, ['--version']);
        if (result.pid) {
          pythonCmd = p;
          break;
        }
      } catch (e) {}
    }

    const proc = spawn(pythonCmd, ['-u', tempFile], {
      shell: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      // 清理临时文件
      try { fs.unlinkSync(tempFile); } catch (e) {}

      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code
      });
    });

    proc.on('error', (err) => {
      try { fs.unlinkSync(tempFile); } catch (e) {}
      resolve({
        success: false,
        stdout: '',
        stderr: 'Python 执行环境未安装。请下载安装 Python 3.x'
      });
    });

    setTimeout(() => {
      proc.kill();
      try { fs.unlinkSync(tempFile); } catch (e) {}
      resolve({
        success: false,
        stdout: stdout.trim(),
        stderr: '执行超时 (30秒)'
      });
    }, 30000);
  });
}

// ============== C++ 执行 ==============
function executeCpp(code) {
  return new Promise((resolve) => {
    const tempDir = getIsDev()
      ? path.join(__dirname, '..', '..', 'backend', 'temp')
      : path.join(process.resourcesPath, 'temp');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const id = Date.now();
    const cppFile = path.join(tempDir, `cpp_${id}.cpp`);
    const exeFile = path.join(tempDir, `cpp_${id}.exe`);

    fs.writeFileSync(cppFile, code, 'utf8');

    // 尝试多个编译器路径
    const compilers = [
      { cmd: 'g++', args: ['-o', exeFile, cppFile, '-std=c++17'] },
      { cmd: 'clang++', args: ['-o', exeFile, cppFile, '-std=c++17'] },
      { cmd: 'C:\\MinGW\\bin\\g++.exe', args: ['-o', exeFile, cppFile, '-std=c++17'] }
    ];

    let compileProc = null;

    function tryCompile(index) {
      if (index >= compilers.length) {
        try { fs.unlinkSync(cppFile); } catch (e) {}
        resolve({
          success: false,
          stdout: '',
          stderr: '未找到 C++ 编译器。请安装 MinGW-w64'
        });
        return;
      }

      const compiler = compilers[index];
      compileProc = spawn(compiler.cmd, compiler.args);

      let stderr = '';
      compileProc.stderr.on('data', (data) => { stderr += data.toString(); });

      compileProc.on('close', (code) => {
        if (code === 0 && fs.existsSync(exeFile)) {
          // 编译成功，执行
          const runProc = spawn(exeFile, [], { shell: true });
          let stdout = '';
          let runStderr = '';

          runProc.stdout.on('data', (data) => { stdout += data.toString(); });
          runProc.stderr.on('data', (data) => { runStderr += data.toString(); });

          runProc.on('close', (runCode) => {
            // 清理
            try { fs.unlinkSync(cppFile); } catch (e) {}
            try { fs.unlinkSync(exeFile); } catch (e) {}

            resolve({
              success: runCode === 0,
              stdout: stdout.trim(),
              stderr: runStderr.trim(),
              exitCode: runCode
            });
          });

          runProc.on('error', (err) => {
            try { fs.unlinkSync(cppFile); } catch (e) {}
            try { fs.unlinkSync(exeFile); } catch (e) {}
            resolve({
              success: false,
              stdout: stdout.trim(),
              stderr: '程序执行错误: ' + err.message
            });
          });

          setTimeout(() => {
            runProc.kill();
            try { fs.unlinkSync(cppFile); } catch (e) {}
            try { fs.unlinkSync(exeFile); } catch (e) {}
            resolve({ success: false, stdout: stdout.trim(), stderr: '执行超时 (30秒)' });
          }, 30000);

        } else {
          // 尝试下一个编译器
          tryCompile(index + 1);
        }
      });
    }

    tryCompile(0);
  });
}

// ============== 应用生命周期 ==============
app.whenReady().then(async () => {
  log('应用启动');

  // macOS: 隐藏 dock 图标
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  setupIPC();
  setupOfflineSupportIPC();
  initAutoUpdater();
  setupUpdateIPC();

  // 启动后端进程（不阻塞）
  const backendStarted = startBackendProcess();

  // 等待后端就绪后再创建窗口
  if (backendStarted) {
    try {
      await waitForBackend();
    } catch (e) {
      logError('等待后端超时但继续启动:', e.message);
    }
  } else {
    log('后端未启动，窗口将使用远程后端或显示连接错误');
  }

  await createWindow();
  createTray();

  // 启动网络状态监控
  startNetworkMonitoring(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('所有窗口已关闭');

  // 如果没有托盘，关闭后端进程并退出
  if (!trayManager || !trayManager.getTray()) {
    if (backendProcess) {
      backendProcess.kill();
    }
    stopStaticServer();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

app.on('before-quit', () => {
  log('应用即将退出');
  isQuitting = true;
  stopNetworkMonitoring();
  if (trayManager) {
    trayManager.destroy();
  }
  if (backendProcess) {
    backendProcess.kill();
  }
  stopStaticServer();
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  logError('未捕获异常:', err);
});
