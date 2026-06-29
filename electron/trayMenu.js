const { Tray, Menu, app } = require('electron');
const path = require('path');

class TrayMenuManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
  }

  createTray() {
    try {
      // Use a simple 16x16 icon
      const iconPath = path.join(__dirname, 'icon.png');
      this.tray = new Tray(iconPath);

      const contextMenu = Menu.buildFromTemplate([
        { label: '显示窗口', click: () => this.mainWindow?.show() },
        { type: 'separator' },
        { label: '退出', click: () => { app.isQuitting = true; app.quit(); } }
      ]);

      this.tray.setToolTip('云屿学习平台');
      this.tray.setContextMenu(contextMenu);
      this.tray.on('click', () => this.mainWindow?.show());
    } catch (e) {
      // Tray icon creation failed - not critical
      console.log('Tray creation skipped:', e.message);
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = { TrayMenuManager };
