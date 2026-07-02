/**
 * Safe localStorage utilities that handle the case where localStorage
 * is not available (e.g., in some Electron/SSR environments).
 *
 * When running inside Electron, this module delegates to the in-memory
 * safeStorage wrapper exposed by the preload script (window.electronAPI.safeStorage),
 * which provides a reliable fallback when the renderer sandbox blocks localStorage.
 * In browser mode, it falls back to raw localStorage with gentle error handling.
 */

function getStorageBackend() {
  // Electron: use the preload's in-memory-safe storage wrapper
  if (typeof window !== 'undefined' && window.electronAPI?.safeStorage) {
    return window.electronAPI.safeStorage;
  }
  return null;
}

const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export function safeGetItem(key) {
  const electronStore = getStorageBackend();
  if (electronStore) return electronStore.getItem(key);

  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key, value) {
  const electronStore = getStorageBackend();
  if (electronStore) { electronStore.setItem(key, value); return true; }

  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key) {
  const electronStore = getStorageBackend();
  if (electronStore) { electronStore.removeItem(key); return true; }

  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeGetJSON(key, fallback = null) {
  const value = safeGetItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function safeClear() {
  const electronStore = getStorageBackend();
  if (electronStore) { electronStore.clear(); return true; }

  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

export function safeSetJSON(key, value) {
  return safeSetItem(key, JSON.stringify(value));
}

export default {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJSON,
  safeSetJSON,
  safeClear,
};
