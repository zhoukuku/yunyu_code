const { Tray, Menu, app } = require('electron');
const path = require('path');

class TrayMenuManager {
  /**
   * @param {Object} options
   * @param {string} options.appName - 应用名称
   * @param {string} options.iconPath - 托盘图标路径
   * @param {Object} options.windowManagement - WindowStateManager 实例
   * @param {Object} options.notificationManager - NotificationManager 实例
   */
  constructor(options) {
    this.options = options || {};

    // 从 WindowStateManager 获取 BrowserWindow 引用
    const wm = this.options.windowManagement;
    this.mainWindow = (wm && wm.window) ? wm.window : null;

    this.tray = null;
    this.notificationManager = this.options.notificationManager || null;
  }

  /**
   * 更新窗口引用（窗口重建时调用）
   */
  updateWindow(window) {
    this.mainWindow = window;
  }

  createTray() {
    try {
      const iconPath = this.options.iconPath || path.join(__dirname, 'build', 'icon.png');
      this.tray = new Tray(iconPath);

      const self = this;

      const contextMenu = Menu.buildFromTemplate([
        {
          label: '显示窗口',
          click: () => {
            const wm = self.options.windowManagement;
            if (wm && wm.window && !wm.window.isDestroyed()) {
              wm.window.show();
              wm.window.focus();
            } else if (self.mainWindow && !self.mainWindow.isDestroyed()) {
              self.mainWindow.show();
              self.mainWindow.focus();
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            app.quit();
          }
        }
      ]);

      this.tray.setToolTip(this.options.appName || '云屿学习平台');
      this.tray.setContextMenu(contextMenu);

      this.tray.on('click', () => {
        const wm = self.options.windowManagement;
        if (wm && wm.window && !wm.window.isDestroyed()) {
          wm.window.show();
          wm.window.focus();
        } else if (self.mainWindow && !self.mainWindow.isDestroyed()) {
          self.mainWindow.show();
          self.mainWindow.focus();
        }
      });

      this.tray.on('double-click', () => {
        const wm = self.options.windowManagement;
        if (wm && wm.window && !wm.window.isDestroyed()) {
          wm.window.show();
          wm.window.focus();
        }
      });

      console.log('[TrayMenuManager] 系统托盘已创建');
    } catch (e) {
      // Tray icon creation failed - not critical
      console.log('[TrayMenuManager] 托盘创建失败:', e.message);
    }
  }

  destroy() {
    if (this.tray) {
      try {
        this.tray.destroy();
      } catch (e) {
        console.log('[TrayMenuManager] 托盘销毁失败:', e.message);
      }
      this.tray = null;
    }
  }
}

module.exports = { TrayMenuManager };
