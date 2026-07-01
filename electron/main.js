// ============== Core Node.js modules ==============
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const net = require('net');
const http = require('http');

// ============== Load package.json for app metadata ==============
const pkgPath = path.join(__dirname, 'package.json');
let pkg = { name: 'yunyu-learning-platform', version: '1.0.0', main: 'main.js' };
try {
  pkg = require(pkgPath);
} catch (e) {
  logWarn('Could not read package.json, using defaults:', e.message);
}

// ============== Load Electron API ==============
const { app, BrowserWindow, ipcMain, shell, session } = require('electron');

// ============== Local modules with graceful fallbacks ==============

// -- update.js (auto-updater) --
let initAutoUpdater = () => {};
let setupUpdateIPC = () => {};
try {
  const update = require('./update');
  initAutoUpdater = update.initAutoUpdater;
  setupUpdateIPC = update.setupUpdateIPC;
} catch (e) {
  logWarn('Update module not available:', e.message);
}

// -- offlineSupport.js (offline caching + network monitoring) --
let setupOfflineSupportIPC = (channelsSet) => {};
let startNetworkMonitoring = () => {};
let stopNetworkMonitoring = () => {};
try {
  const offline = require('./offlineSupport');
  setupOfflineSupportIPC = offline.setupOfflineSupportIPC;
  startNetworkMonitoring = offline.startNetworkMonitoring;
  stopNetworkMonitoring = offline.stopNetworkMonitoring;
} catch (e) {
  logWarn('Offline support module not available:', e.message);
}

// -- windowManagement.js (window state + notifications) --
let WindowStateManager, NotificationManager;
try {
  const wm = require('./windowManagement');
  WindowStateManager = wm.WindowStateManager;
  NotificationManager = wm.NotificationManager;
} catch (e) {
  logWarn('Window management module not available:', e.message);
}

// -- trayMenu.js (system tray) --
let TrayMenuManager;
try {
  const tm = require('./trayMenu');
  TrayMenuManager = tm.TrayMenuManager;
} catch (e) {
  logWarn('Tray menu module not available:', e.message);
}

// ============== Electron startup flags ==============
// 仅在必要时启用，避免无效开关导致的问题
try {
  if (app && app.commandLine) {
    // 仅在检测到 GPU 兼容性问题时禁用 GPU 加速
    // app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('enable-logging');
    app.commandLine.appendSwitch('v=1');
    // no-sandbox 仅在 Linux 环境下可能必要，Windows 下禁用
    if (process.platform === 'linux') {
      app.commandLine.appendSwitch('no-sandbox');
    }
  }
} catch (e) {
  logError('commandLine error:', e.message);
}

// ============== Configuration ==============
const PORT = 3000;
const FRONTEND_PORT = 5174;
const VITE_DEV_URL = `http://localhost:${FRONTEND_PORT}`;
const SERVE_PORT = 5175; // frontend static server port (production)

const APP_TITLE = '云屿学习平台';

// ============== Global state ==============
let mainWindow = null;
let trayManager = null;
let windowStateManager = null;
let notificationManager = null;
let backendProcess = null;
let isQuitting = false;
let cleanupDone = false;
// Track all spawned code-execution subprocesses so they can be killed on quit
const runningProcesses = new Set();
// Track registered IPC handler channels so they can be removed on quit
const ipcChannels = new Set();
// Track active connections on the static server so they can be destroyed on quit
const activeConnections = new Set();

// ============== Logging ==============
function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

function logError(...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, ...args);
}

function logWarn(...args) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] WARN:`, ...args);
}

// ============== Dev mode detection ==============
function getIsDev() {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

// ============== Port probing ==============
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
        reject(new Error(`Port ${port} not ready within ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    }

    check();
  });
}

// ============== Static file server (production mode) ==============
let serveServer = null;

// Proxy /api/* requests to the backend server
function proxyApiToBackend(req, res) {
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: req.url,
    method: req.method,
    headers: {}
  };

  // Copy headers, filtering out problematic ones
  const skipHeaders = ['host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade'];
  for (const [key, value] of Object.entries(req.headers)) {
    if (!skipHeaders.includes(key.toLowerCase())) {
      options.headers[key] = value;
    }
  }

  const proxyReq = http.request(options, (proxyRes) => {
    // Filter response headers that conflict with the proxy piping
    const respHeaders = {};
    const respSkip = ['transfer-encoding', 'connection', 'keep-alive'];
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (!respSkip.includes(key.toLowerCase())) {
        respHeaders[key] = value;
      }
    }
    res.writeHead(proxyRes.statusCode, respHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    logError('Backend proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Backend service unavailable',
        message: err.message
      }));
    }
  });

  // Handle errors from the incoming request stream
  req.on('error', (err) => {
    logError('Proxy request stream error:', err.message);
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Bad request', message: err.message }));
    }
  });

  // Methods that typically have a body
  const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (methodsWithBody.includes(req.method)) {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

function startStaticServer(distPath, retryCount = 0) {
  const MAX_RETRIES = 5;
  return new Promise((resolve, reject) => {
    serveServer = http.createServer((req, res) => {
      // Proxy API requests to backend
      if (req.url.startsWith('/api/') || req.url.startsWith('/api?')) {
        proxyApiToBackend(req, res);
        return;
      }

      let urlPath = req.url.split('?')[0].split('#')[0];
      if (urlPath === '/') urlPath = '/index.html';

      let filePath = path.join(distPath, urlPath);

      // Security: ensure file stays inside distPath
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
          // SPA fallback: serve index.html for missing files
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

    // Track connections so they can be destroyed on forced shutdown
    serveServer.on('connection', (socket) => {
      activeConnections.add(socket);
      socket.on('close', () => {
        activeConnections.delete(socket);
      });
    });

    serveServer.listen(SERVE_PORT, 'localhost', () => {
      log(`Static file server running at http://localhost:${SERVE_PORT}`);
      log(`API proxy: /api/* -> http://localhost:${PORT}`);
      resolve();
    });

    serveServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (retryCount >= MAX_RETRIES) {
          logError(`Port ${SERVE_PORT} still in use after ${MAX_RETRIES} retries, giving up`);
          reject(new Error(`Port ${SERVE_PORT} is occupied after ${MAX_RETRIES} retry attempts`));
          return;
        }
        log(`Port ${SERVE_PORT} in use, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        serveServer.close(() => {
          startStaticServer(distPath, retryCount + 1).then(resolve).catch(reject);
        });
      } else {
        reject(err);
      }
    });
  });
}

function stopStaticServer() {
  if (serveServer) {
    // Destroy all active connections so the server can close cleanly
    for (const socket of activeConnections) {
      try { socket.destroy(); } catch (e) { logError('Error destroying socket:', e.message); }
    }
    activeConnections.clear();

    serveServer.close((err) => {
      if (err) {
        logError('Error stopping static server:', err.message);
      } else {
        log('Static file server stopped');
      }
    });
    serveServer = null;
  }
}

// ============== Backend process management ==============
function startBackendProcess() {
  const backendPath = getIsDev()
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'app', 'backend');

  log('Starting backend from:', backendPath);

  if (!fs.existsSync(backendPath)) {
    logWarn('Backend path does not exist:', backendPath);
    return false;
  }

  // -----------------------------------------------------------------------
  // Phase 1 — Compiled JavaScript (preferred, fast startup)
  // -----------------------------------------------------------------------
  const compiledCandidates = [
    'dist/src/main.js',
    'dist/main.js',
  ];

  let entryFile = null;
  let usingTsNode = false;

  for (const candidate of compiledCandidates) {
    const fullPath = path.join(backendPath, candidate);
    if (fs.existsSync(fullPath)) {
      entryFile = candidate;
      log('Backend compiled entry found:', candidate);
      break;
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2 — Compiled JS not found: print helpful error, then try ts-node
  // -----------------------------------------------------------------------
  if (!entryFile) {
    logWarn('='.repeat(60));
    logWarn('Backend build not found — dist/src/main.js is missing.');
    logWarn('The backend must be compiled before it can run.');
    logWarn('');
    logWarn('  cd backend');
    logWarn('  npm run build');
    logWarn('');
    logWarn('Attempting fallback with ts-node (slower, dev-only)...');
    logWarn('='.repeat(60));

    // Look for TypeScript source files as a fallback
    const tsCandidates = ['src/main.ts', 'src/main.js'];
    for (const candidate of tsCandidates) {
      const fullPath = path.join(backendPath, candidate);
      if (fs.existsSync(fullPath)) {
        entryFile = candidate;
        usingTsNode = true;
        log('Backend TS source found (ts-node fallback):', candidate);
        break;
      }
    }
  }

  if (!entryFile) {
    logError('No backend entry file found.');
    logError('Checked compiled JS:  ' + compiledCandidates.join(', '));
    logError('Checked TS sources:    src/main.ts, src/main.js');
    logError('');
    logError('Please ensure the backend is set up:');
    logError('  cd backend && npm install && npm run build');
    return false;
  }

  // Build the spawn command
  let command;
  let args;

  if (usingTsNode) {
    // Use ts-node via npx — it resolves the local installation automatically
    // and handles compiler options from tsconfig.json correctly.
    command = 'npx';
    args = ['ts-node', entryFile];
  } else {
    command = 'node';
    args = [entryFile];
  }

  try {
    backendProcess = spawn(command, args, {
      cwd: backendPath,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: process.env.NODE_ENV ?? 'development', JWT_SECRET: process.env.JWT_SECRET ?? 'yunyu-dev-secret' },
      stdio: ['pipe', 'pipe', 'pipe'],
      // shell on Windows: the command+args array passed to cmd.exe /c
      // is handled correctly by spawn()'s internal escaping.
      shell: process.platform === 'win32'
    });

    if (!backendProcess.pid) {
      logError('Backend process failed to spawn (no PID)');
      return false;
    }

    log('Backend process spawned, PID:', backendProcess.pid);

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log('[backend]', output);
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) logWarn('[backend]', output);
    });

    backendProcess.on('error', (err) => {
      logError('Backend failed to start:', err.message);
      backendProcess = null;
    });

    backendProcess.on('close', (code) => {
      log('Backend process exited, code:', code);
      backendProcess = null;
    });

    return true;
  } catch (err) {
    logError('Backend start exception:', err);
    return false;
  }
}

async function waitForBackend() {
  try {
    await waitForPort(PORT, 'localhost', 60000);
    log('Backend ready on port:', PORT);
    return true;
  } catch (err) {
    logError('Backend port timeout:', err.message);
    return false;
  }
}

function stopBackendProcess() {
  if (!backendProcess) return;
  const proc = backendProcess;
  backendProcess = null;

  // Remove all event listeners to prevent leaks and double-fire
  try { proc.stdout.removeAllListeners(); } catch (e) { logError('Error removing stdout listeners:', e.message); }
  try { proc.stderr.removeAllListeners(); } catch (e) { logError('Error removing stderr listeners:', e.message); }
  try { proc.removeAllListeners(); } catch (e) { logError('Error removing proc listeners:', e.message); }

  // Kill the process tree
  if (proc.pid) {
    killProcessTree(proc.pid);
  }
  log('Backend process stopped');
}

// ============== Vite dev server ==============
// Wait for the Vite dev server to become ready. Returns true if ready, false if timed out.
async function waitForViteDevServer() {
  const VITE_OVERALL_TIMEOUT = 60000; // 60 seconds hard deadline
  const maxRetries = 30;
  let viteReady = false;

  try {
    // Race the retry loop against an overall timeout promise
    await Promise.race([
      (async () => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            // Node.js v16 (Electron 18) has no global fetch() - use http.get
            await new Promise((resolve, reject) => {
              const req = http.get(VITE_DEV_URL, (res) => {
                res.resume();
                if (res.statusCode >= 200 && res.statusCode < 400) resolve(true);
                else reject(new Error('HTTP ' + res.statusCode));
              });
              req.on('error', reject);
              req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
            });
            log('Vite dev server ready');
            viteReady = true;
            return;
          } catch (e) {
            // still waiting
          }
          await new Promise(r => setTimeout(r, 1000));
          log(`Waiting for Vite dev server... (${i + 1}/${maxRetries})`);
        }
      })(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Vite dev server did not start within ${VITE_OVERALL_TIMEOUT / 1000}s`)), VITE_OVERALL_TIMEOUT);
      })
    ]);
  } catch (timeoutErr) {
    logWarn(timeoutErr.message);
    viteReady = false;
  }

  return viteReady;
}

// ============== Window creation ==============
async function createWindow() {
  log('Creating main window...');

  // Create window state manager (if module loaded successfully)
  if (WindowStateManager) {
    windowStateManager = new WindowStateManager({
      defaultWidth: 1400,
      defaultHeight: 900,
      minWidth: 1024,
      minHeight: 768,
      windowOptions: {
        title: APP_TITLE,
        icon: path.join(__dirname, 'build', 'icon.png'),
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      }
    });
  }

  // Create the window
  if (windowStateManager) {
    try {
      mainWindow = windowStateManager.createWindow();
    } catch (e) {
      logError('windowStateManager.createWindow() failed:', e.message);
      mainWindow = null;
    }
  }
  if (!mainWindow) {
    // Fallback: create a plain BrowserWindow
    log('WindowStateManager unavailable, creating plain BrowserWindow');
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 768,
      title: APP_TITLE,
      show: false,
      icon: path.join(__dirname, 'build', 'icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    mainWindow.once('ready-to-show', () => mainWindow.show());
  }

  // Load content (skip if window creation failed)
  if (!mainWindow) {
    logError('mainWindow is null, cannot load content');
    return;
  }

  if (getIsDev()) {
    log('Dev mode: waiting for Vite dev server...');
    const viteReady = await waitForViteDevServer();

    if (viteReady) {
      await mainWindow.loadURL(VITE_DEV_URL).catch(err => {
        logError('Failed to load Vite dev URL:', err.message);
      });
      mainWindow.webContents.openDevTools();
    } else {
      logError('Vite dev server not ready, falling back to dist');
      await mainWindow.loadURL(`file://${path.join(__dirname, 'dist', 'index.html')}`).catch(err => {
        logError('Failed to load dist fallback URL:', err.message);
      });
    }
  } else {
    // Production: serve via static file server
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      logWarn('='.repeat(60));
      logWarn('dist/index.html not found at:', distPath);
      logWarn('The frontend must be built before running in production mode.');
      logWarn('  cd frontend-vite && npm run build');
      logWarn('='.repeat(60));
    }
    log('Production mode: starting static file server...');
    try {
      await startStaticServer(distPath);
    } catch (err) {
      logError('Static file server failed to start:', err.message);
      // Show error in window and continue — user sees a blank/error page
      await mainWindow.loadURL(`data:text/html,<h1>Server Error</h1><p>${encodeURIComponent(err.message)}</p>`).catch(e2 => {
        logError('Failed to show error page:', e2.message);
      });
      return;
    }
    await mainWindow.loadURL(`http://localhost:${SERVE_PORT}`).catch(err => {
      logError('Failed to load production URL:', err.message);
    });
    log('Production mode: frontend loaded via HTTP');

    // Register Service Worker (production only)
    registerServiceWorker(mainWindow).catch(err =>
      logError('Service Worker registration exception:', err.message)
    );
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      if (windowStateManager) {
        windowStateManager.minimizeToTray();
      } else {
        mainWindow.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    // Remove all listeners on the window to break reference chains
    try { mainWindow.removeAllListeners(); } catch (e) { logError('Error removing mainWindow listeners:', e.message); }
    // Break the windowStateManager's reference to the destroyed window
    if (windowStateManager && windowStateManager.window === mainWindow) {
      windowStateManager.window = null;
    }
    mainWindow = null;
  });

  log('Main window created');
}

// ============== Service Worker registration ==============
async function registerServiceWorker(win) {
  try {
    const swPath = path.join(__dirname, 'dist', 'sw.js');

    if (!fs.existsSync(swPath)) {
      log('Service Worker file not found, skipping registration');
      return;
    }

    const swURL = `http://localhost:${SERVE_PORT}/sw.js`;

    session.defaultSession.serviceWorkers.register(swURL)
      .then(registration => {
        log('Service Worker registered:', registration.scope);
      })
      .catch(err => {
        logError('Service Worker registration failed:', err.message);
      });
  } catch (e) {
    logError('Service Worker registration exception:', e);
  }
}

// ============== System tray ==============
function createTray() {
  if (!TrayMenuManager) {
    log('TrayMenuManager not available, skipping tray');
    return;
  }

  // Create notification manager
  try {
    if (NotificationManager) {
      notificationManager = new NotificationManager();
    }
  } catch (e) {
    logError('NotificationManager creation failed:', e.message);
  }

  // Create tray menu manager
  trayManager = new TrayMenuManager({
    appName: APP_TITLE,
    iconPath: path.join(__dirname, 'build', 'tray-icon.png'),
    windowManagement: windowStateManager,
    notificationManager: notificationManager
  });

  trayManager.createTray();
  log('System tray created');
}

// ============== Code execution helpers ==============

// Maximum allowed source code size (1 MB) to prevent memory exhaustion
const MAX_CODE_LENGTH = 1_000_000;

// Whitelist of allowed URL protocols for shell.openExternal
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// Validate and sanitize code input. Returns { valid: true, code } or { valid: false, error: 'message' }
function validateCodeInput(code, language) {
  if (typeof code !== 'string') {
    return {
      valid: false,
      error: 'Invalid input: ' + language + ' code must be a string, received ' + (code === null ? 'null' : typeof code)
    };
  }
  if (code.trim().length === 0) {
    return {
      valid: false,
      error: 'No ' + language + ' code provided. Please write some code before executing.'
    };
  }
  if (code.length > MAX_CODE_LENGTH) {
    return {
      valid: false,
      error: 'Code is too long (' + code.length + ' characters). Maximum allowed is ' + MAX_CODE_LENGTH + ' characters.'
    };
  }
  return { valid: true, code };
}

// Validate stdin input size. Returns { valid: true, stdin: string } or { valid: false, error: 'message' }
function validateStdinInput(stdin) {
  if (stdin == null || stdin === '') {
    return { valid: true, stdin: '' };
  }
  const str = String(stdin);
  if (str.length > MAX_CODE_LENGTH) {
    return {
      valid: false,
      error: 'Input data is too long (' + str.length + ' characters). Maximum allowed is ' + MAX_CODE_LENGTH + ' characters.'
    };
  }
  return { valid: true, stdin: str };
}

// ============== IPC handlers ==============
// All handlers return a uniform { success: boolean, data?: any, error?: string } format.

function toExecuteResult(result) {
  if (result.success) {
    const data = { stdout: result.stdout || '', stderr: result.stderr || '' };
    if (result.exitCode !== undefined) data.exitCode = result.exitCode;
    if (result.phase !== undefined) data.phase = result.phase;
    return { success: true, data };
  }
  return { success: false, error: result.stderr || result.stdout || 'Execution failed' };
}

function setupIPC() {
  // Execute Python code (stdin is optional input data)
  ipcMain.handle('execute-python', async (event, code, stdin) => {
    // Validate code
    const codeValidation = validateCodeInput(code, 'Python');
    if (!codeValidation.valid) {
      log('Python code rejected:', codeValidation.error);
      return { success: false, error: codeValidation.error };
    }
    // Validate stdin size
    const stdinValidation = validateStdinInput(stdin);
    if (!stdinValidation.valid) {
      log('Python stdin rejected:', stdinValidation.error);
      return { success: false, error: stdinValidation.error };
    }
    log('Execute Python code, length:', codeValidation.code.length);
    const result = await executePython(codeValidation.code, stdinValidation.stdin);
    if (notificationManager) {
      try {
        notificationManager.notifyCodeResult('Python', result.success, result.stderr || result.stdout);
      } catch (e) {
        logError('Notification error (Python):', e.message);
      }
    }
    return toExecuteResult(result);
  });
  ipcChannels.add('execute-python');

  // Execute C++ code (stdin is optional input data)
  ipcMain.handle('execute-cpp', async (event, code, stdin) => {
    // Validate code
    const codeValidation = validateCodeInput(code, 'C++');
    if (!codeValidation.valid) {
      log('C++ code rejected:', codeValidation.error);
      return { success: false, error: codeValidation.error };
    }
    // Validate stdin size
    const stdinValidation = validateStdinInput(stdin);
    if (!stdinValidation.valid) {
      log('C++ stdin rejected:', stdinValidation.error);
      return { success: false, error: stdinValidation.error };
    }
    log('Execute C++ code, length:', codeValidation.code.length);
    const result = await executeCpp(codeValidation.code, stdinValidation.stdin);
    if (notificationManager) {
      try {
        notificationManager.notifyCodeResult('C++', result.success, result.stderr || result.stdout);
      } catch (e) {
        logError('Notification error (C++):', e.message);
      }
    }
    return toExecuteResult(result);
  });
  ipcChannels.add('execute-cpp');

  // Get version info
  ipcMain.handle('get-version', () => {
    return {
      success: true,
      data: {
        app: app.getVersion(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
      }
    };
  });
  ipcChannels.add('get-version');

  // Open external links (only allow safe protocols)
  ipcMain.handle('open-external', async (event, url) => {
    if (typeof url !== 'string' || url.trim().length === 0) {
      log('open-external rejected: empty or non-string URL');
      return { success: false, error: 'URL must be a non-empty string' };
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      log('open-external rejected: invalid URL format —', e.message);
      return { success: false, error: 'Invalid URL format: ' + e.message };
    }
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      log('open-external rejected: disallowed protocol —', parsed.protocol);
      return { success: false, error: 'Disallowed protocol: ' + parsed.protocol + '. Allowed: ' + ALLOWED_PROTOCOLS.join(', ') };
    }
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (e) {
      logError('open-external: failed to open URL —', e.message, url);
      return { success: false, error: 'Failed to open URL: ' + e.message };
    }
  });
  ipcChannels.add('open-external');

  // Show system notification
  ipcMain.handle('show-notification', async (event, { title, body }) => {
    if (!title && !body) {
      return { success: false, error: 'Notification title and body are both empty' };
    }
    if (notificationManager) {
      try {
        const result = notificationManager.show(title, body);
        if (result) return { success: true, data: result };
      } catch (e) {
        logError('notificationManager.show failed:', e.message);
      }
    }
    // Fallback: try to use Electron Notification API directly
    // This also covers the case where notificationManager.show() returned null
    try {
      const { Notification: ENotification } = electron;
      if (ENotification && ENotification.isSupported && ENotification.isSupported()) {
        const n = new ENotification({ title: title || '', body: body || '' });
        n.show();
        return { success: true, data: n };
      }
    } catch (e) {
      log('Notification fallback failed:', e.message);
    }
    return { success: false, error: 'Notifications are not supported on this system' };
  });
  ipcChannels.add('show-notification');
}

function cleanupIPC() {
  for (const channel of ipcChannels) {
    try {
      ipcMain.removeHandler(channel);
    } catch (e) {
      // removeHandler may throw if the handler was already removed
    }
  }
  ipcChannels.clear();
  log('IPC handlers removed');
}

// ============== Process tree killer ==============
// On Windows, child_process.kill() only terminates the immediate process.
// When spawn uses shell:true or the user code spawns children, those survive.
// taskkill /T kills the whole tree; on Unix we kill the process group.
function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { windowsHide: true });
    } catch (e) {
      // If taskkill fails, try the direct kill as fallback
      try { process.kill(pid); } catch (e2) { logError('Error killing process:', e2.message); }
    }
  } else {
    // Negative pid signals the whole process group on Unix
    try { process.kill(-pid, 'SIGKILL'); } catch (e) {
      try { process.kill(pid, 'SIGKILL'); } catch (e2) { logError('Error killing process:', e2.message); }
    }
  }
}

// ============== Process stdin helper ==============
// Pipe stdin to a spawned process, then close it.
// Always closes stdin so the child process gets EOF instead of hanging.
function pipeStdinToProcess(proc, stdin, label) {
  if (stdin != null && String(stdin).length > 0) {
    const input = String(stdin);
    if (proc.stdin) {
      proc.stdin.on('error', (err) => {
        logWarn(`${label} stdin write error:`, err.message);
      });
      proc.stdin.write(input);
      proc.stdin.end();
    }
  } else {
    if (proc.stdin) proc.stdin.end();
  }
}

// ============== Python execution ==============
function executePython(code, stdin) {
  return new Promise((resolve) => {
    const tempDir = path.join(os.tmpdir(), 'yunyu-learning-platform');

    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (e) {
        resolve({
          success: false,
          stdout: '',
          stderr: 'Could not create temporary directory: ' + e.message
        });
        return;
      }
    }

    const tempFile = path.join(tempDir, `python_${Date.now()}.py`);
    let resolved = false;

    // Ensure temp file is cleaned up exactly once regardless of exit path
    function finish(result) {
      if (resolved) return;
      resolved = true;
      try { fs.unlinkSync(tempFile); } catch (e) { logError('Failed to clean up temp Python file:', e.message); }
      resolve(result);
    }

    try {
      fs.writeFileSync(tempFile, code, 'utf8');
    } catch (e) {
      finish({
        success: false,
        stdout: '',
        stderr: 'Could not write temporary Python file. Disk may be full or write-protected.'
      });
      return;
    }

    // Detect Python using spawnSync — no orphaned processes left behind
    const pythonPaths = [
      'python', 'python3', 'py',
      'C:\\Python311\\python.exe',
      'C:\\Python312\\python.exe',
      'C:\\Python313\\python.exe',
      'C:\\Python310\\python.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'python.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'python3.exe')
    ];
    let pythonCmd = null;

    for (const p of pythonPaths) {
      const result = spawnSync(p, ['--version'], {
        timeout: 5000,
        windowsHide: true,
        stdio: 'pipe'
      });
      if (!result.error) {
        pythonCmd = p;
        break;
      }
    }

    if (!pythonCmd) {
      finish({
        success: false,
        stdout: '',
        stderr: 'Python is not installed on this computer. Please install Python 3.x from python.org'
      });
      return;
    }

    // Spawn without shell so the pid is the actual Python process.
    // Set PYTHONIOENCODING=utf-8 so non-ASCII output is handled correctly on all platforms.
    let proc;
    try {
      proc = spawn(pythonCmd, ['-u', tempFile], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
      });
    } catch (e) {
      finish({
        success: false,
        stdout: '',
        stderr: 'Python could not be started. Please verify your Python 3.x installation.'
      });
      return;
    }

    runningProcesses.add(proc);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    // Pipe stdin if provided (e.g. for input() calls in Python)
    pipeStdinToProcess(proc, stdin, 'Python');

    const timeoutMs = 30000;
    const timer = setTimeout(() => {
      killProcessTree(proc.pid);
      runningProcesses.delete(proc);
      finish({
        success: false,
        stdout: stdout.trim(),
        stderr: 'Execution timed out after ' + (timeoutMs / 1000) + ' seconds'
      });
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      runningProcesses.delete(proc);
      finish({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      runningProcesses.delete(proc);
      finish({
        success: false,
        stdout: '',
        stderr: 'Python could not be started. Please verify your Python 3.x installation.'
      });
    });
  });
}

// ============== C++ execution ==============
// Compile timeout: maximum seconds to wait for a single compiler invocation
const COMPILE_TIMEOUT_MS = 30000;
// Run timeout: maximum seconds to let the compiled program run
const CPP_RUN_TIMEOUT_MS = 30000;

// Compile C++ source with multiple compiler fallbacks, then run the compiled program.
// Called by executeCpp(); manages its own process lifecycle via runningProcesses.
// Calls finish(result) exactly once with the outcome.
function compileAndRunCpp(cppFile, exeFile, stdin, finish) {
  const compilers = [
    { cmd: 'g++', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    { cmd: 'clang++', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    { cmd: 'C:\\MinGW\\bin\\g++.exe', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    { cmd: 'C:\\mingw64\\bin\\g++.exe', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    { cmd: 'C:\\msys64\\mingw64\\bin\\g++.exe', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    { cmd: 'C:\\msys64\\ucrt64\\bin\\g++.exe', args: ['-o', exeFile, cppFile, '-std=c++17'] },
    // MSVC (cl.exe) excluded: uses incompatible flags (/EHsc, /Fe:)
    // Add MSVC support by implementing separate argument handling if needed.
  ];

  let compileErrors = [];
  // Track compile timers so they can be cleaned up on early finish
  const compileTimers = [];
  // Prevent double-resolution from overlapping timeout/close/error events
  let settled = false;

  function settle(result) {
    if (settled) return;
    settled = true;
    // Clean up any still-pending compile timers from earlier attempts
    for (const t of compileTimers) {
      clearTimeout(t);
    }
    compileTimers.length = 0;
    finish(result);
  }

  function tryCompile(index) {
    if (settled) return;
    if (index >= compilers.length) {
      // All compilers exhausted
      const errorDetail = compileErrors.length > 0
        ? 'Could not compile your C++ code.\n\nCompiler messages:\n' + compileErrors.join('\n')
        : 'C++ compiler not found. Please install MinGW-w64 (https://winlibs.com) or MSVC Build Tools.';
      settle({
        success: false,
        stdout: '',
        stderr: errorDetail,
        phase: 'compile'
      });
      return;
    }

    const compiler = compilers[index];
    let compileProc;
    try {
      compileProc = spawn(compiler.cmd, compiler.args, { windowsHide: true });
      runningProcesses.add(compileProc);
    } catch (e) {
      compileErrors.push('[' + compiler.cmd + '] ' + formatCompilerError(e.message));
      tryCompile(index + 1);
      return;
    }

    let compileStdout = '';
    let compileStderr = '';

    compileProc.stdout.on('data', (data) => { compileStdout += data.toString(); });
    compileProc.stderr.on('data', (data) => { compileStderr += data.toString(); });

    // Guard against double-handling (error event may fire before/after close)
    let handled = false;

    // Compile timeout — prevent hanging if the compiler process is stuck
    const compileTimer = setTimeout(() => {
      if (handled) return;
      handled = true;
      killProcessTree(compileProc.pid);
      runningProcesses.delete(compileProc);
      compileErrors.push('[' + compiler.cmd + '] Compilation timed out after ' + (COMPILE_TIMEOUT_MS / 1000) + ' seconds');
      tryCompile(index + 1);
    }, COMPILE_TIMEOUT_MS);
    compileTimers.push(compileTimer);

    compileProc.on('error', (err) => {
      if (handled) return;
      handled = true;
      clearTimeout(compileTimer);
      runningProcesses.delete(compileProc);
      compileErrors.push('[' + compiler.cmd + '] ' + formatCompilerError(err.message));
      tryCompile(index + 1);
    });

    compileProc.on('close', (code) => {
      if (handled) return;
      handled = true;
      clearTimeout(compileTimer);

      if (code === 0 && fs.existsSync(exeFile)) {
        // Compilation succeeded — clear compile-timers, then run
        for (const t of compileTimers) {
          clearTimeout(t);
        }
        compileTimers.length = 0;
        runningProcesses.delete(compileProc);
        // Spawn without shell so the pid maps directly to the exe
        let runProc;
        try {
          runProc = spawn(exeFile, [], { windowsHide: true });
        } catch (e) {
          settle({
            success: false,
            stdout: '',
            stderr: 'Compilation succeeded but the compiled program could not be started. ' + formatCompilerError(e.message),
            phase: 'runtime'
          });
          return;
        }

        runningProcesses.add(runProc);

        let stdout = '';
        let runStderr = '';

        runProc.stdout.on('data', (data) => { stdout += data.toString(); });
        runProc.stderr.on('data', (data) => { runStderr += data.toString(); });

        // Pipe stdin if provided (e.g. for std::cin in C++)
        pipeStdinToProcess(runProc, stdin, 'C++');

        const runTimer = setTimeout(() => {
          killProcessTree(runProc.pid);
          runningProcesses.delete(runProc);
          settle({
            success: false,
            stdout: stdout.trim(),
            stderr: 'Execution timed out after ' + (CPP_RUN_TIMEOUT_MS / 1000) + ' seconds',
            phase: 'runtime'
          });
        }, CPP_RUN_TIMEOUT_MS);

        runProc.on('close', (runCode) => {
          clearTimeout(runTimer);
          runningProcesses.delete(runProc);
          settle({
            success: runCode === 0,
            stdout: stdout.trim(),
            stderr: runStderr.trim(),
            exitCode: runCode,
            phase: 'runtime'
          });
        });

        runProc.on('error', (err) => {
          clearTimeout(runTimer);
          runningProcesses.delete(runProc);
          settle({
            success: false,
            stdout: stdout.trim(),
            stderr: 'Could not run the compiled program. ' + formatCompilerError(err.message),
            phase: 'runtime'
          });
        });

      } else {
        // Compilation failed — collect error output from both stdout and stderr
        runningProcesses.delete(compileProc);
        const combined = (compileStdout + '\n' + compileStderr).trim();
        if (combined) {
          compileErrors.push('[' + compiler.cmd + '] ' + combined);
        } else if (code !== null) {
          compileErrors.push('[' + compiler.cmd + '] Compilation failed with exit code ' + code);
        }
        tryCompile(index + 1);
      }
    });
  }

  tryCompile(0);
}

function executeCpp(code, stdin) {
  return new Promise((resolve) => {
    const tempDir = path.join(os.tmpdir(), 'yunyu-learning-platform');

    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (e) {
        resolve({
          success: false,
          stdout: '',
          stderr: 'Could not create temporary directory: ' + e.message
        });
        return;
      }
    }

    const id = Date.now();
    const cppFile = path.join(tempDir, `cpp_${id}.cpp`);
    const exeExt = process.platform === 'win32' ? '.exe' : '';
    const exeFile = path.join(tempDir, `cpp_${id}${exeExt}`);

    // Single-call cleanup — compileAndRunCpp settles exactly once
    function finish(result) {
      try { fs.unlinkSync(cppFile); } catch (e) { logError('Failed to clean up temp C++ source file:', e.message); }
      try { fs.unlinkSync(exeFile); } catch (e) { logError('Failed to clean up temp C++ executable:', e.message); }
      resolve(result);
    }

    try {
      fs.writeFileSync(cppFile, code, 'utf8');
    } catch (e) {
      finish({
        success: false,
        stdout: '',
        stderr: 'Could not write temporary C++ file. Disk may be full or write-protected.'
      });
      return;
    }

    compileAndRunCpp(cppFile, exeFile, stdin, finish);
  });
}

// Translate system-level spawn errors into user-friendly messages
function formatCompilerError(errMsg) {
  const lower = errMsg.toLowerCase();
  if (lower.includes('enoent') || lower.includes('not found') || lower.includes('not recognized')) {
    return 'Compiler is not installed or not on the system PATH.';
  }
  if (lower.includes('eacces') || lower.includes('permission') || lower.includes('access denied')) {
    return 'Permission denied. Check security software or run as administrator.';
  }
  return errMsg;
}

// ============== App lifecycle ==============
app.whenReady().then(async () => {
  log(`Starting ${APP_TITLE} v${pkg.version || 'unknown'}`);

  // macOS: hide dock icon
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  setupIPC();
  setupOfflineSupportIPC(ipcChannels);
  initAutoUpdater();
  setupUpdateIPC();

  // Start backend process (non-blocking)
  const backendStarted = startBackendProcess();

  // Wait for backend before creating window
  if (backendStarted) {
    try {
      await waitForBackend();
    } catch (e) {
      logError('Backend wait error, continuing:', e.message);
    }
  } else {
    log('Backend not started — using remote backend or showing connection error');
  }

  await createWindow();
  createTray();

  // Start network monitoring
  startNetworkMonitoring(mainWindow);

  app.on('activate', () => {
    // On macOS, recreate the window when the dock icon is clicked
    // and no windows are open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(err => {
        logError('Failed to recreate window on activate:', err.message);
      });
    }
  });
}).catch(err => {
  logError('Fatal error during app startup:', err.message, err.stack);
  app.quit();
});

app.on('window-all-closed', () => {
  log('All windows closed');

  // If a tray is active, keep running in the background.
  if (trayManager && trayManager.tray) {
    return;
  }

  // On macOS, apps typically stay alive when all windows are closed;
  // the 'activate' event recreates the window when the dock icon is clicked.
  // Do NOT kill backend / server here — the app must remain functional.
  if (process.platform === 'darwin') {
    return;
  }

  // On other platforms without a tray, quit.
  // before-quit handles all cleanup (backend, tray, server, network monitoring).
  app.quit();
});

app.on('before-quit', () => {
  // Guard against double-invocation (before-quit can fire more than once)
  if (cleanupDone) return;
  cleanupDone = true;

  log('App shutting down');
  isQuitting = true;

  // Each cleanup step is isolated — a failure in one won't skip the others

  try { stopNetworkMonitoring(); } catch (e) { logError('Error stopping network monitoring:', e.message); }

  try {
    if (trayManager) {
      trayManager.destroy();
    }
  } catch (e) { logError('Error destroying tray:', e.message); }

  try { stopBackendProcess(); } catch (e) { logError('Error stopping backend:', e.message); }

  try {
    // Kill any still-running code-execution subprocesses (Python/C++ compile & run)
    for (const proc of runningProcesses) {
      try {
        killProcessTree(proc.pid);
      } catch (e) {
        // process may already be dead
      }
    }
    runningProcesses.clear();
  } catch (e) { logError('Error killing subprocesses:', e.message); }

  try { stopStaticServer(); } catch (e) { logError('Error stopping static server:', e.message); }
});

app.on('will-quit', () => {
  // Final cleanup just before the app exits the event loop
  try { cleanupIPC(); } catch (e) { logError('Error removing IPC handlers:', e.message); }

  // Remove app-level event listeners to prevent any late callbacks
  try { app.removeAllListeners('activate'); } catch (e) { logError('Error removing activate listener:', e.message); }
  try { app.removeAllListeners('window-all-closed'); } catch (e) { logError('Error removing window-all-closed listener:', e.message); }
  try { app.removeAllListeners('before-quit'); } catch (e) { logError('Error removing before-quit listener:', e.message); }
  try { app.removeAllListeners('will-quit'); } catch (e) { logError('Error removing will-quit listener:', e.message); }
  try { process.removeAllListeners('uncaughtException'); } catch (e) { logError('Error removing uncaughtException listener:', e.message); }
  try { process.removeAllListeners('unhandledRejection'); } catch (e) { logError('Error removing unhandledRejection listener:', e.message); }

  log('Final cleanup complete');
});

// Catch unhandled exceptions
process.on('uncaughtException', (err) => {
  logError('Uncaught exception:', err.message, err.stack);
  // Don't exit — try to keep the app alive
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection:', reason, reason?.stack);
  // Don't exit — try to keep the app alive
});
