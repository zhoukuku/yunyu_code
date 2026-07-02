/**
 * electron-bridge.js
 *
 * Safe facade over window.electronAPI (exposed by preload.js).
 * Every method provides an automatic browser-mode fallback so that the
 * frontend works unchanged whether it runs inside Electron or a plain browser.
 *
 * Usage:
 *   import electron from '../utils/electron-bridge';
 *
 *   // Always safe — no need to check "if (window.electronAPI)" first.
 *   const result = await electron.executePython('print("hello")');
 *   electron.openExternal('https://example.com');
 *   electron.onNetworkStatusChange((online) => { ... });
 *
 * All async methods return { success, data?, error? } uniform shape.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasElectron() {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

function getElectron() {
  return (typeof window !== 'undefined' && window.electronAPI) || null;
}

/**
 * Fallback openExternal: try window.open with noopener; in strict browsers
 * this may be blocked by popup-blockers, but it is the best we can do.
 */
function browserOpenExternal(url) {
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null;
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/** Browser Notification API fallback. */
function browserShowNotification(title, body) {
  if (!('Notification' in window)) {
    return { success: false, error: 'Browser does not support notifications' };
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  if (Notification.permission === 'denied') {
    return { success: false, error: 'Notification permission denied' };
  }
  // default — request permission (async, fire-and-forget)
  Notification.requestPermission().then((perm) => {
    if (perm === 'granted') {
      try { new Notification(title, { body }); } catch (_) { /* ignore */ }
    }
  });
  return { success: true }; // optimistically return true (permission prompt shown)
}

// ---------------------------------------------------------------------------
// Public bridge object
// ---------------------------------------------------------------------------

const electronBridge = {
  // -- Feature detection ------------------------------------------------

  /** True when the preload has exposed window.electronAPI. */
  get isElectron() {
    return hasElectron();
  },

  /** The raw electronAPI object (or null). Prefer the wrapped methods below. */
  get raw() {
    return getElectron();
  },

  // -- Platform / versions (static, always safe) ------------------------

  get platform() {
    const api = getElectron();
    return api?.platform ?? (typeof navigator !== 'undefined' ? navigator.platform : 'unknown');
  },

  get versions() {
    const api = getElectron();
    return api?.versions ?? { node: 'browser', chrome: 'browser', electron: 'browser' };
  },

  async getVersion() {
    const api = getElectron();
    if (api) return api.getVersion();
    return {
      success: true,
      data: { app: 'browser', electron: 'browser', chrome: 'browser', node: 'browser' },
    };
  },

  // -- Code execution (Electron: native Python/C++; browser: HTTP API) --

  async executePython(code, stdin) {
    const api = getElectron();
    if (api) return api.executePython(code, stdin);
    // Browser fallback: delegate to the HTTP code-execution API
    try {
      const { createCodeExecution, executeCode } = await import('../services/api');
      const createRes = await createCodeExecution({ code, language: 'python', stdin });
      if (createRes.status !== 200 && createRes.status !== 201) {
        return { success: false, error: createRes.msg || 'Failed to create execution record' };
      }
      const execRes = await executeCode(createRes.result?.id);
      return {
        success: true,
        data: {
          stdout: execRes.result?.stdout || '',
          stderr: execRes.result?.stderr || '',
          exitCode: execRes.result?.exitCode,
        },
      };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  async executeCpp(code, stdin) {
    const api = getElectron();
    if (api) return api.executeCpp(code, stdin);
    // Browser fallback: delegate to the HTTP code-execution API
    try {
      const { createCodeExecution, executeCode } = await import('../services/api');
      const createRes = await createCodeExecution({ code, language: 'cpp', stdin });
      if (createRes.status !== 200 && createRes.status !== 201) {
        return { success: false, error: createRes.msg || 'Failed to create execution record' };
      }
      const execRes = await executeCode(createRes.result?.id);
      return {
        success: true,
        data: {
          stdout: execRes.result?.stdout || '',
          stderr: execRes.result?.stderr || '',
          exitCode: execRes.result?.exitCode,
          phase: execRes.result?.phase,
        },
      };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  // -- External links ---------------------------------------------------

  async openExternal(url) {
    const api = getElectron();
    if (api) return api.openExternal(url);
    return browserOpenExternal(url);
  },

  // -- Notifications ----------------------------------------------------

  async showNotification(title, body) {
    const api = getElectron();
    if (api) return api.showNotification(title, body);
    return browserShowNotification(title, body);
  },

  // -- Offline support --------------------------------------------------

  async offlineInit() {
    const api = getElectron();
    if (api) return api.offlineInit();
    return { isOnline: navigator.onLine, cacheSize: 0, cacheCount: 0, maxCacheSize: 0 };
  },

  async offlineGet(key) {
    const api = getElectron();
    if (api) return api.offlineGet(key);
    return { success: true, data: null, fromCache: false };
  },

  async offlineSet(key, data, ttlMs) {
    const api = getElectron();
    if (api) return api.offlineSet(key, data, ttlMs);
    return { success: false, error: 'Offline cache not available in browser mode' };
  },

  async offlineClear(type) {
    const api = getElectron();
    if (api) return api.offlineClear(type);
    return false;
  },

  async offlineGetStatus() {
    const api = getElectron();
    if (api) return api.offlineGetStatus();
    return {
      isOnline: navigator.onLine,
      lastOnlineTime: Date.now(),
      stats: { hits: 0, misses: 0, size: 0 },
      cacheCount: 0,
      maxCacheSize: 0,
      usagePercent: 0,
    };
  },

  async offlineCheckNetwork() {
    const api = getElectron();
    if (api) return api.offlineCheckNetwork();
    return navigator.onLine;
  },

  // Returns an unsubscribe function (or a no-op in browser mode).
  onNetworkStatusChange(callback) {
    if (typeof callback !== 'function') return () => {};
    const api = getElectron();
    if (api) return api.onNetworkStatusChange(callback);
    // Browser fallback: listen to the 'online'/'offline' events on window
    const onOnline = () => callback(true);
    const onOffline = () => callback(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  },
};

export default electronBridge;
