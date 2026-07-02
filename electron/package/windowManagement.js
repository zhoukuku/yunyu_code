const { BrowserWindow, app, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// ============== 窗口状态记忆 ==============
const CONFIG_DIR = app.getPath('userData');
const WINDOW_STATE_FILE = path.join(CONFIG_DIR, 'window-state.json');

// 默认窗口状态
const DEFAULT_WINDOW_STATE = {
  width: 1400,
  height: 900,
  x: undefined,
  y: undefined,
  isMaximized: false
};

// 读取窗口状态
function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_FILE)) {
      const data = fs.readFileSync(WINDOW_STATE_FILE, 'utf8');
      const state = JSON.parse(data);
      // 合并默认状态，确保所有字段都存在
      return { ...DEFAULT_WINDOW_STATE, ...state };
    }
  } catch (err) {
    console.error('读取窗口状态失败:', err);
  }
  return { ...DEFAULT_WINDOW_STATE };
}

// 保存窗口状态
function saveWindowState(win) {
  try {
    if (!win || win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    let bounds;

    if (isMaximized) {
      // 如果是最大化状态，保存之前的bounds
      bounds = win.getRestoreBounds();
    } else {
      bounds = win.getBounds();
    }

    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: isMaximized
    };

    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('保存窗口状态失败:', err);
  }
}

// ============== 窗口状态记忆管理器 ==============
class WindowStateManager {
  constructor(options = {}) {
    this.options = {
      defaultWidth: options.defaultWidth || 1400,
      defaultHeight: options.defaultHeight || 900,
      minWidth: options.minWidth || 1024,
      minHeight: options.minHeight || 768,
      ...options
    };
    this.state = loadWindowState();
    this.win = null;
    this.stateChangeTimer = null;
  }

  // 创建窗口
  createWindow() {
    const state = this.state;

    // 如果有保存的位置和大小，使用它们；否则使用默认值
    const windowOptions = {
      width: state.width || this.options.defaultWidth,
      height: state.height || this.options.defaultHeight,
      minWidth: this.options.minWidth,
      minHeight: this.options.minHeight,
      x: state.x,
      y: state.y,
      show: false,
      frame: true,
      resizable: true,
      ...this.options.windowOptions
    };

    // 如果没有指定位置，让系统居中
    if (state.x === undefined || state.y === undefined) {
      windowOptions.center = true;
    }

    this.win = new BrowserWindow(windowOptions);

    // 如果之前是最大化状态，恢复最大化
    if (state.isMaximized) {
      this.win.maximize();
    }

    // 监听窗口事件以保存状态
    this.setupEventListeners();

    return this.win;
  }

  // 设置事件监听
  setupEventListeners() {
    // 窗口大小或位置变化时保存状态（防抖）
    const debouncedSave = () => {
      if (this.stateChangeTimer) {
        clearTimeout(this.stateChangeTimer);
      }
      this.stateChangeTimer = setTimeout(() => {
        saveWindowState(this.win);
      }, 500);
    };

    this.win.on('resize', debouncedSave);
    this.win.on('move', debouncedSave);
    this.win.on('close', () => {
      if (this.stateChangeTimer) {
        clearTimeout(this.stateChangeTimer);
      }
      saveWindowState(this.win);
    });

    this.win.on('maximize', () => {
      saveWindowState(this.win);
    });

    this.win.on('unmaximize', () => {
      saveWindowState(this.win);
    });
  }

  // 获取窗口实例
  getWindow() {
    return this.win;
  }

  // 最小化到托盘
  minimizeToTray() {
    if (this.win && !this.win.isDestroyed()) {
      this.win.hide();
      return true;
    }
    return false;
  }

  // 从托盘恢复窗口
  restoreFromTray() {
    if (this.win && !this.win.isDestroyed()) {
      this.win.show();
      this.win.focus();
      return true;
    }
    return false;
  }

  // 切换窗口显示状态
  toggleVisible() {
    if (this.win && !this.win.isDestroyed()) {
      if (this.win.isVisible()) {
        this.win.hide();
      } else {
        this.win.show();
        this.win.focus();
      }
    }
  }
}

// ============== 系统通知 ==============
class NotificationManager {
  constructor(options = {}) {
    this.appName = options.appName || '云屿学习平台';
  }

  // 发送通知
  show(title, body, options = {}) {
    if (!Notification.isSupported()) {
      console.warn('系统通知不支持');
      return null;
    }

    const notification = new Notification({
      title: title,
      body: body,
      silent: options.silent || false,
      icon: options.icon || path.join(__dirname, 'icon.png'),
      ...options
    });

    notification.on('click', () => {
      if (options.onClick) {
        options.onClick();
      }
    });

    notification.show();
    return notification;
  }

  // 代码执行结果通知
  notifyCodeResult(language, success, message) {
    const title = success ? `${language} 执行成功` : `${language} 执行失败`;
    return this.show(title, message, {
      silent: true
    });
  }

  // 应用更新通知
  notifyUpdateAvailable(version) {
    return this.show(
      '发现新版本',
      `版本 ${version} 现已可用`,
      {
        silent: false
      }
    );
  }

  // 后端启动通知
  notifyBackendStarted() {
    return this.show(
      '后端服务已就绪',
      '后端服务已成功启动',
      { silent: true }
    );
  }

  // 后端启动失败通知
  notifyBackendFailed(message) {
    return this.show(
      '后端启动失败',
      message,
      { silent: false }
    );
  }
}

// 导出模块
module.exports = {
  WindowStateManager,
  NotificationManager,
  loadWindowState,
  saveWindowState
};