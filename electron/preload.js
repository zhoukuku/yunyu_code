const { contextBridge, ipcRenderer } = require('electron');

// ============== localStorage 安全包装 ==============
// 防止在 Electron 沙箱环境中因 localStorage 不可用而导致崩溃
const safeLocalStorage = {
  _isAvailable: (function() {
    try {
      const key = '__electron_test__';
      localStorage.setItem(key, key);
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('[Preload] localStorage not available, using in-memory fallback');
      return false;
    }
  })(),

  _memoryStore: {},

  getItem(key) {
    try {
      if (this._isAvailable) {
        return localStorage.getItem(key);
      }
      return this._memoryStore[key] || null;
    } catch (e) {
      console.warn('[Preload] localStorage.getItem failed for', key, ':', e.message);
      return this._memoryStore[key] || null;
    }
  },

  setItem(key, value) {
    try {
      if (this._isAvailable) {
        localStorage.setItem(key, value);
      }
      this._memoryStore[key] = value;
    } catch (e) {
      console.warn('[Preload] localStorage.setItem failed for', key, ':', e.message);
      this._memoryStore[key] = value;
    }
  },

  removeItem(key) {
    try {
      if (this._isAvailable) {
        localStorage.removeItem(key);
      }
      delete this._memoryStore[key];
    } catch (e) {
      console.warn('[Preload] localStorage.removeItem failed for', key, ':', e.message);
      delete this._memoryStore[key];
    }
  },

  clear() {
    try {
      if (this._isAvailable) {
        localStorage.clear();
      }
      this._memoryStore = {};
    } catch (e) {
      console.warn('[Preload] localStorage.clear failed:', e.message);
      this._memoryStore = {};
    }
  },

  get length() {
    try {
      if (this._isAvailable) {
        return localStorage.length;
      }
      return Object.keys(this._memoryStore).length;
    } catch (e) {
      return Object.keys(this._memoryStore).length;
    }
  },

  key(index) {
    try {
      if (this._isAvailable) {
        return localStorage.key(index);
      }
      return Object.keys(this._memoryStore)[index] || null;
    } catch (e) {
      return Object.keys(this._memoryStore)[index] || null;
    }
  }
};

/**
 * @typedef {Object} ElectronAPI
 * @property {Object} safeStorage - localStorage wrapper with in-memory fallback
 * @property {(key: string) => string|null} safeStorage.getItem
 * @property {(key: string, value: string) => void} safeStorage.setItem
 * @property {(key: string) => void} safeStorage.removeItem
 * @property {() => void} safeStorage.clear
 * @property {number} safeStorage.length
 * @property {(index: number) => string|null} safeStorage.key
 * @property {(code: string, stdin?: string) => Promise<{success: boolean, data?: {stdout: string, stderr: string, exitCode?: number}, error?: string}>} executePython
 * @property {(code: string, stdin?: string) => Promise<{success: boolean, data?: {stdout: string, stderr: string, exitCode?: number, phase?: string}, error?: string}>} executeCpp
 * @property {() => Promise<{success: boolean, data?: {app: string, electron: string, chrome: string, node: string}}>} getVersion
 * @property {(url: string) => Promise<{success: boolean, error?: string}>} openExternal
 * @property {NodeJS.Platform} platform
 * @property {{node: string, chrome: string, electron: string}} versions
 * @property {(title: string, body: string) => Promise<{success: boolean, data?: any, error?: string}>} showNotification
 * @property {() => Promise<{isOnline: boolean, cacheSize: number, cacheCount: number, maxCacheSize: number}>} offlineInit
 * @property {(key: string) => Promise<{success: boolean, data: any, fromCache: boolean, expired?: boolean}>} offlineGet
 * @property {(key: string, data: any, ttlMs?: number) => Promise<{success: boolean, size?: number, error?: string}>} offlineSet
 * @property {(type?: string) => Promise<boolean>} offlineClear
 * @property {() => Promise<{isOnline: boolean, lastOnlineTime: number, stats: Object, cacheCount: number, maxCacheSize: number, usagePercent: number}>} offlineGetStatus
 * @property {() => Promise<boolean>} offlineCheckNetwork
 * @property {(callback: (isOnline: boolean) => void) => () => void} onNetworkStatusChange
 */

// ============== 暴露给前端的 API ==============
contextBridge.exposeInMainWorld('electronAPI', {
  // 安全的 localStorage 操作（带 fallback）
  safeStorage: {
    getItem: (key) => safeLocalStorage.getItem(key),
    setItem: (key, value) => safeLocalStorage.setItem(key, value),
    removeItem: (key) => safeLocalStorage.removeItem(key),
    clear: () => safeLocalStorage.clear(),
    get length() { return safeLocalStorage.length; },
    key: (index) => safeLocalStorage.key(index)
  },

  // 代码执行 (stdin 可选，用于提供用户输入)
  executePython: (code, stdin) => ipcRenderer.invoke('execute-python', code, stdin),
  executeCpp: (code, stdin) => ipcRenderer.invoke('execute-cpp', code, stdin),

  // 系统信息
  getVersion: () => ipcRenderer.invoke('get-version'),

  // 外部链接
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // 平台信息
  platform: process.platform,

  // 版本
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },

  // 系统通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // ========== 离线支持 API ==========
  // 初始化离线支持
  offlineInit: () => ipcRenderer.invoke('offline-init'),

  // 获取离线数据
  offlineGet: (key) => ipcRenderer.invoke('offline-get', key),

  // 设置离线数据
  offlineSet: (key, data, ttlMs) => ipcRenderer.invoke('offline-set', key, data, { ttl: ttlMs }),

  // 清除离线缓存
  offlineClear: (type) => ipcRenderer.invoke('offline-clear', { type }),

  // 获取离线状态
  offlineGetStatus: () => ipcRenderer.invoke('offline-get-status'),

  // 检测网络状态
  offlineCheckNetwork: () => ipcRenderer.invoke('offline-check-network'),

  // 监听网络状态变化（返回取消订阅函数以防止监听器泄漏）
  onNetworkStatusChange: (callback) => {
    if (typeof callback !== 'function') {
      console.warn('[Preload] onNetworkStatusChange requires a function callback');
      return () => {};
    }

    const handler = (_event, isOnline) => {
      callback(isOnline);
    };

    ipcRenderer.on('network-status-changed', handler);

    // 返回取消订阅函数
    return () => {
      ipcRenderer.removeListener('network-status-changed', handler);
    };
  }
});

console.log('[Preload] 脚本已加载 - 安全存储包装器已启用');
