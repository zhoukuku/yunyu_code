const { BrowserWindow } = require('electron');

class WindowStateManager {
  constructor(windowName, defaultState) {
    this.windowName = windowName;
    this.state = defaultState || { x: undefined, y: undefined, width: 1200, height: 800 };
  }

  manage(window) {
    if (this.state.x !== undefined && this.state.y !== undefined) {
      window.setPosition(this.state.x, this.state.y);
    }
    if (this.state.width && this.state.height) {
      window.setSize(this.state.width, this.state.height);
    }

    window.on('resize', () => {
      const [width, height] = window.getSize();
      this.state.width = width;
      this.state.height = height;
    });

    window.on('move', () => {
      const [x, y] = window.getPosition();
      this.state.x = x;
      this.state.y = y;
    });

    if (this.state.maximized) {
      window.maximize();
    }
  }

  saveState(window) {
    if (window.isMaximized()) {
      this.state.maximized = true;
    } else {
      this.state.maximized = false;
      const [width, height] = window.getSize();
      const [x, y] = window.getPosition();
      this.state.width = width;
      this.state.height = height;
      this.state.x = x;
      this.state.y = y;
    }
  }
}

class NotificationManager {
  constructor() {
    this.notifications = [];
  }

  show(title, body) {
    const { Notification } = require('electron');
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  }
}

module.exports = { WindowStateManager, NotificationManager };
