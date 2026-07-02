const { ipcMain, BrowserWindow, app } = require('electron');

// ============== 日志函数 ==============
function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [更新]`, ...args);
}

function logError(...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [更新错误]`, ...args);
}

// ============== 延迟加载 autoUpdater ==============
let autoUpdater = null;

function getAutoUpdater() {
  if (!autoUpdater) {
    try {
      const { autoUpdater: updater } = require('electron-updater');
      autoUpdater = updater;
    } catch (err) {
      logError('加载 autoUpdater 失败:', err.message);
      return null;
    }
  }
  return autoUpdater;
}

// ============== 更新状态 ==============
let updateStatus = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: 0,
  version: null,
  releaseNotes: null
};

// ============== 发送状态到渲染进程 ==============
function sendStatusToWindow(status) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('update-status', status);
    }
  });
}

// ============== 初始化 autoUpdater ==============
function initAutoUpdater() {
  const updater = getAutoUpdater();
  if (!updater) {
    log('autoUpdater 不可用，跳过更新功能初始化');
    return;
  }

  // 配置日志输出
  updater.logger = {
    info: (...args) => log(...args),
    warn: (...args) => log('警告:', ...args),
    error: (...args) => logError(...args),
    debug: (...args) => log('调试:', ...args)
  };

  // 自动下载禁用，需要用户确认
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;

  // ============== 事件处理 ==============

  // 检查更新中
  updater.on('checking-for-update', () => {
    log('正在检查更新...');
    updateStatus.checking = true;
    updateStatus.error = null;
    sendStatusToWindow(updateStatus);
  });

  // 有可用更新
  updater.on('update-available', (info) => {
    log('发现新版本:', info.version);
    updateStatus.checking = false;
    updateStatus.available = true;
    updateStatus.version = info.version;
    updateStatus.releaseNotes = info.releaseNotes;
    sendStatusToWindow(updateStatus);
  });

  // 没有可用更新
  updater.on('update-not-available', (info) => {
    log('当前已是最新版本');
    updateStatus.checking = false;
    updateStatus.available = false;
    updateStatus.version = info.version;
    sendStatusToWindow(updateStatus);
  });

  // 下载进度
  updater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    log(`下载进度: ${percent}%`);
    updateStatus.downloading = true;
    updateStatus.progress = percent;
    sendStatusToWindow(updateStatus);
  });

  // 更新下载完成
  updater.on('update-downloaded', (info) => {
    log('更新下载完成:', info.version);
    updateStatus.downloading = false;
    updateStatus.downloaded = true;
    updateStatus.version = info.version;
    updateStatus.releaseNotes = info.releaseNotes;
    sendStatusToWindow(updateStatus);
  });

  // 更新错误
  updater.on('error', (err) => {
    logError('更新错误:', err.message);
    updateStatus.checking = false;
    updateStatus.downloading = false;
    updateStatus.error = err.message;
    sendStatusToWindow(updateStatus);
  });
}

// ============== IPC 处理器 ==============
function setupUpdateIPC() {
  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    log('IPC: 检查更新请求');
    const updater = getAutoUpdater();
    if (!updater) {
      return { success: false, message: '更新功能不可用' };
    }
    try {
      if (updateStatus.checking || updateStatus.downloading) {
        return { success: false, message: '更新已在进行中' };
      }
      const result = await updater.checkForUpdates();
      if (result) {
        return { success: true, message: '开始检查更新' };
      }
      return { success: true, message: '无可用更新' };
    } catch (err) {
      logError('检查更新失败:', err.message);
      return { success: false, message: err.message };
    }
  });

  // 下载更新
  ipcMain.handle('download-update', async () => {
    log('IPC: 下载更新请求');
    const updater = getAutoUpdater();
    if (!updater) {
      return { success: false, message: '更新功能不可用' };
    }
    try {
      if (!updateStatus.available) {
        return { success: false, message: '没有可用更新' };
      }
      if (updateStatus.downloading || updateStatus.downloaded) {
        return { success: false, message: '更新已下载或正在下载' };
      }
      await updater.downloadUpdate();
      return { success: true, message: '开始下载更新' };
    } catch (err) {
      logError('下载更新失败:', err.message);
      return { success: false, message: err.message };
    }
  });

  // 安装更新
  ipcMain.handle('install-update', () => {
    log('IPC: 安装更新请求');
    const updater = getAutoUpdater();
    if (!updater) {
      return { success: false, message: '更新功能不可用' };
    }
    if (!updateStatus.downloaded) {
      return { success: false, message: '更新尚未下载' };
    }
    updater.quitAndInstall(false, true);
    return { success: true, message: '正在安装更新' };
  });

  // 获取更新状态
  ipcMain.handle('get-update-status', () => {
    return updateStatus;
  });
}

// ============== 导出模块 ==============
module.exports = {
  initAutoUpdater,
  setupUpdateIPC
};
