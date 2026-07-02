const { BrowserWindow } = require('electron');

class WindowStateManager {
  constructor(options) {
    this.options = options || {};
    this.defaultWidth = this.options.defaultWidth || 1400;
    this.defaultHeight = this.options.defaultHeight || 900;
    this.minWidth = this.options.minWidth || 1024;
    this.minHeight = this.options.minHeight || 768;
    this.windowOptions = this.options.windowOptions || {};
    this.window = null;
    this.state = { x: undefined, y: undefined, width: this.defaultWidth, height: this.defaultHeight };
  }

  createWindow() {
    const mergedOptions = {
      width: this.state.width,
      height: this.state.height,
      minWidth: this.minWidth,
      minHeight: this.minHeight,
      show: false,
      ...this.windowOptions,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        ...(this.windowOptions.webPreferences || {})
      }
    };

    this.window = new BrowserWindow(mergedOptions);

    // Restore position if saved
    if (this.state.x !== undefined && this.state.y !== undefined) {
      this.window.setPosition(this.state.x, this.state.y);
    }

    // Track window state changes
    this.window.on('resize', () => {
      if (!this.window.isMaximized()) {
        const [w, h] = this.window.getSize();
        this.state.width = w;
        this.state.height = h;
      }
    });

    this.window.on('move', () => {
      if (!this.window.isMaximized()) {
        const [x, y] = this.window.getPosition();
        this.state.x = x;
        this.state.y = y;
      }
    });

    this.window.on('close', (e) => {
      this.saveState();
    });

    this.window.once('ready-to-show', () => {
      this.window.show();
    });

    return this.window;
  }

  saveState() {
    if (!this.window) return;
    if (this.window.isMaximized()) {
      this.state.maximized = true;
    } else {
      this.state.maximized = false;
      const [w, h] = this.window.getSize();
      const [x, y] = this.window.getPosition();
      this.state.width = w;
      this.state.height = h;
      this.state.x = x;
      this.state.y = y;
    }
  }

  minimizeToTray() {
    if (this.window) {
      this.window.hide();
    }
  }
}

class NotificationManager {
  constructor() {
    this.notifications = [];
  }

  show(title, body) {
    try {
      const { Notification } = require('electron');
      if (Notification && Notification.isSupported && Notification.isSupported()) {
        const notification = new Notification({ title: title || '', body: body || '' });
        notification.show();
        this.notifications.push(notification);
        return notification;
      }
      return null;
    } catch (e) {
      console.warn('[NotificationManager] 通知显示失败:', e.message);
      return null;
    }
  }

  /**
   * 代码执行结果通知
   */
  notifyCodeResult(language, success, details) {
    const prefix = success ? '[成功]' : '[失败]';
    const title = `${prefix} ${language} 代码执行`;
    const body = details
      ? (details.length > 100 ? details.substring(0, 100) + '...' : details)
      : (success ? '代码执行成功' : '代码执行失败');
    return this.show(title, body);
  }
}

module.exports = { WindowStateManager, NotificationManager };
