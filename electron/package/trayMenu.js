const { Tray, Menu, nativeImage, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ============== 托盘菜单管理器 ==============
class TrayMenuManager {
  constructor(options = {}) {
    this.appName = options.appName || '云屿学习平台';
    this.iconPath = options.iconPath || path.join(__dirname, 'tray-icon.png');
    this.windowManagement = options.windowManagement || null;
    this.notificationManager = options.notificationManager || null;
    this.tray = null;
    this.isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  }

  // 创建托盘图标
  createTray() {
    // 加载托盘图标
    let trayIcon;
    if (fs.existsSync(this.iconPath)) {
      trayIcon = nativeImage.createFromPath(this.iconPath);
    } else {
      // 如果没有图标，创建一个简单的默认图标
      trayIcon = nativeImage.createEmpty();
    }

    // 调整图标大小
    trayIcon = trayIcon.resize({ width: 16, height: 16 });

    this.tray = new Tray(trayIcon);
    this.tray.setToolTip(this.appName);

    // 设置右键菜单
    this.updateContextMenu();

    // 点击事件 - 切换窗口显示状态
    this.tray.on('click', () => {
      if (this.windowManagement) {
        this.windowManagement.toggleVisible();
      }
    });

    // 双击事件 - 显示并聚焦窗口
    this.tray.on('double-click', () => {
      if (this.windowManagement) {
        this.windowManagement.restoreFromTray();
      }
    });

    return this.tray;
  }

  // 构建上下文菜单
  buildMenuTemplate() {
    const template = [
      {
        label: '显示主窗口',
        click: () => {
          if (this.windowManagement) {
            this.windowManagement.restoreFromTray();
          }
        }
      },
      {
        label: '隐藏主窗口',
        click: () => {
          if (this.windowManagement) {
            this.windowManagement.minimizeToTray();
          }
        }
      },
      { type: 'separator' },
      {
        label: '关于应用',
        submenu: [
          {
            label: `${this.appName}`,
            enabled: false
          },
          {
            label: `版本 ${app.getVersion()}`,
            enabled: false
          },
          {
            label: `Electron ${process.versions.electron}`,
            enabled: false
          }
        ]
      },
      { type: 'separator' },
      {
        label: '检查更新',
        click: () => {
          // 触发更新检查
          if (this.notificationManager) {
            this.notificationManager.show(
              '检查更新',
              '正在检查更新...',
              { silent: true }
            );
          }
          // 发送事件让主进程处理
          const { ipcMain } = require('electron');
          ipcMain.emit('check-for-updates');
        }
      },
      { type: 'separator' },
      {
        label: '开发者选项',
        submenu: [
          {
            label: '打开开发者工具',
            click: () => {
              if (this.windowManagement) {
                const win = this.windowManagement.getWindow();
                if (win && !win.isDestroyed()) {
                  win.webContents.toggleDevTools();
                }
              }
            }
          },
          {
            label: '查看日志目录',
            click: () => {
              const logPath = app.getPath('logs');
              shell.openPath(logPath);
            }
          },
          {
            label: '清除缓存',
            click: () => {
              if (this.windowManagement) {
                const win = this.windowManagement.getWindow();
                if (win && !win.isDestroyed()) {
                  win.webContents.session.clearCache();
                  if (this.notificationManager) {
                    this.notificationManager.show(
                      '缓存已清除',
                      '浏览器缓存已成功清除',
                      { silent: true }
                    );
                  }
                }
              }
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: '帮助',
        submenu: [
          {
            label: '使用文档',
            click: () => {
              shell.openExternal('https://github.com/your-repo/docs');
            }
          },
          {
            label: '问题反馈',
            click: () => {
              shell.openExternal('https://github.com/your-repo/issues');
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: '退出应用',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ];

    return template;
  }

  // 更新上下文菜单
  updateContextMenu() {
    if (!this.tray) return;

    const template = this.buildMenuTemplate();
    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  // 更新托盘提示
  setTooltip(text) {
    if (this.tray) {
      this.tray.setToolTip(text);
    }
  }

  // 更新托盘图标
  setIcon(iconPath) {
    if (this.tray && fs.existsSync(iconPath)) {
      const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      this.tray.setImage(icon);
    }
  }

  // 显示通知
  showNotification(title, body, options = {}) {
    if (this.notificationManager) {
      return this.notificationManager.show(title, body, options);
    }
    return null;
  }

  // 销毁托盘
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  // 获取托盘实例
  getTray() {
    return this.tray;
  }
}

// ============== 创建托盘菜单（兼容旧API） ==============
function createTrayMenu(windowManagement = null, notificationManager = null) {
  const manager = new TrayMenuManager({
    windowManagement,
    notificationManager
  });
  return manager.createTray();
}

// ============== 旧版兼容函数 ==============
function createTray(iconPath, windowManagement) {
  const manager = new TrayMenuManager({
    iconPath: iconPath,
    windowManagement
  });
  return manager.createTray();
}

// 导出模块
module.exports = {
  TrayMenuManager,
  createTrayMenu,
  createTray
};