/**
 * 离线支持模块 - offlineSupport.js
 * 提供本地数据缓存、网络状态检测、离线指示器控制、IndexedDB兼容接口
 */

const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ============== 配置 ==============
const CACHE_DIR = 'offline-cache';
const CACHE_DB_FILE = 'cache-manifest.json';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache size
const DEFAULT_TTL = 3600000; // 1 hour

// ============== 缓存清单（内存） ==============
let cacheManifest = {
  version: Date.now(),
  entries: {},  // { key: { hash, size, timestamp, expires, type } }
  stats: { hits: 0, misses: 0, size: 0 }
};

// ============== 网络状态 ==============
let isOnline = true;
let networkCheckInterval = null;
let lastOnlineTime = Date.now();

// ============== 初始化缓存目录 ==============
function initCacheDir(app) {
  const userDataPath = app.getPath('userData');
  const cachePath = path.join(userDataPath, CACHE_DIR);

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }

  return cachePath;
}

// ============== 加载缓存清单 ==============
function loadCacheManifest(cachePath) {
  const manifestPath = path.join(cachePath, CACHE_DB_FILE);

  if (fs.existsSync(manifestPath)) {
    try {
      const data = fs.readFileSync(manifestPath, 'utf8');
      cacheManifest = JSON.parse(data);
    } catch (e) {
      console.error('[OfflineSupport] 缓存清单加载失败:', e);
      // Reset to default on parse error
      cacheManifest = {
        version: Date.now(),
        entries: {},
        stats: { hits: 0, misses: 0, size: 0 }
      };
    }
  }
}

// ============== 保存缓存清单 ==============
function saveCacheManifest(cachePath) {
  const manifestPath = path.join(cachePath, CACHE_DB_FILE);

  try {
    fs.writeFileSync(manifestPath, JSON.stringify(cacheManifest, null, 2));
  } catch (e) {
    console.error('[OfflineSupport] 缓存清单保存失败:', e);
  }
}

// ============== 生成缓存键的哈希 ==============
function generateHash(key) {
  return crypto.createHash('md5').update(key).digest('hex');
}

// ============== 缓存数据到本地文件 ==============
function cacheDataToFile(cachePath, hash, data) {
  const filePath = path.join(cachePath, `${hash}.cache`);

  try {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (e) {
    console.error('[OfflineSupport] 缓存文件写入失败:', e);
    return false;
  }
}

// ============== 从本地文件读取缓存 ==============
function getDataFromFile(cachePath, hash) {
  const filePath = path.join(cachePath, `${hash}.cache`);

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (e) {
      console.error('[OfflineSupport] 缓存文件读取失败:', e);
    }
  }
  return null;
}

// ============== 删除缓存文件 ==============
function deleteCacheFile(cachePath, hash) {
  const filePath = path.join(cachePath, `${hash}.cache`);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (e) {
    console.error('[OfflineSupport] 缓存文件删除失败:', e);
  }
  return false;
}

// ============== 缓存清理（过期数据） ==============
function cleanExpiredCache(cachePath) {
  const now = Date.now();
  let cleaned = 0;
  let freedSize = 0;

  for (const [key, entry] of Object.entries(cacheManifest.entries)) {
    if (entry.expires && entry.expires < now) {
      deleteCacheFile(cachePath, entry.hash);
      freedSize += entry.size || 0;
      delete cacheManifest.entries[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    cacheManifest.stats.size -= freedSize;
    saveCacheManifest(cachePath);
  }

  return cleaned;
}

// ============== LRU缓存淘汰（当缓存满时） ==============
function evictLRU(cachePath) {
  if (cacheManifest.stats.size < MAX_CACHE_SIZE) {
    return 0;
  }

  let evicted = 0;
  let targetSize = MAX_CACHE_SIZE * 0.8; // 清理到80%

  // Sort by last access (oldest first) - entries with no expires are treated as newest
  const entries = Object.entries(cacheManifest.entries)
    .sort((a, b) => {
      const aTime = a[1].lastAccess || a[1].timestamp || 0;
      const bTime = b[1].lastAccess || b[1].timestamp || 0;
      return aTime - bTime;
    });

  for (const [key, entry] of entries) {
    if (cacheManifest.stats.size <= targetSize) {
      break;
    }

    deleteCacheFile(cachePath, entry.hash);
    cacheManifest.stats.size -= entry.size || 0;
    delete cacheManifest.entries[key];
    evicted++;
  }

  if (evicted > 0) {
    saveCacheManifest(cachePath);
  }

  return evicted;
}

// ============== 网络状态检测 ==============
function checkNetworkStatus() {
  return new Promise((resolve) => {
    const net = require('net');
    const hosts = ['www.baidu.com', 'www.google.com', 'dns.google'];
    let settled = false;

    function done(online) {
      if (settled) return;
      settled = true;
      resolve(online);
    }

    let tried = 0;

    function tryNextHost() {
      if (tried >= hosts.length) {
        // All hosts exhausted — no network
        done(false);
        return;
      }

      const host = hosts[tried++];
      let client;

      try {
        // Create a fresh socket for each host attempt.
        // A destroyed socket cannot be reused, so we must instantiate
        // a new one per host.
        client = new net.Socket();
      } catch (e) {
        // Socket creation failed (very unlikely) — move on
        tryNextHost();
        return;
      }

      client.setTimeout(5000);

      client.on('connect', () => {
        client.destroy();
        done(true);
      });

      client.on('timeout', () => {
        client.destroy();
        // Timeout on this host, try the next one
        tryNextHost();
      });

      client.on('error', (err) => {
        client.destroy();
        // On Windows, ECONNREFUSED still fires error event — the TCP stack
        // was able to reach the host (network is up), the port just refused.
        if (err && err.code === 'ECONNREFUSED') {
          done(true);
        } else {
          // DNS failure, ENOTFOUND, or other — try the next host
          tryNextHost();
        }
      });

      try {
        client.connect(80, host);
      } catch (e) {
        // Synchronous connect error (rare) — try the next host
        try { client.destroy(); } catch (_) { /* ignore */ }
        tryNextHost();
      }
    }

    tryNextHost();
  });
}

async function updateNetworkStatus(mainWindow) {
  const wasOnline = isOnline;
  isOnline = await checkNetworkStatus();

  if (isOnline && !wasOnline) {
    lastOnlineTime = Date.now();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network-status-changed', isOnline);
  }

  return isOnline;
}

function startNetworkMonitoring(mainWindow, intervalMs = 15000) {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
  }

  // 立即检测一次
  updateNetworkStatus(mainWindow);

  // 定期检测
  networkCheckInterval = setInterval(() => {
    updateNetworkStatus(mainWindow);
  }, intervalMs);
}

function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
}

// ============== IndexedDB兼容的存储接口 ==============
function setupOfflineSupportIPC(channelsSet) {
  const OFFLINE_CHANNELS = [
    'offline-init',
    'offline-get',
    'offline-set',
    'offline-remove',
    'offline-clear',
    'offline-get-status',
    'offline-check-network',
    'offline-get-keys',
    'offline-get-meta',
    'offline-batch-get',
    'offline-batch-set'
  ];

  // Track channels for cleanup
  if (channelsSet) {
    for (const ch of OFFLINE_CHANNELS) {
      channelsSet.add(ch);
    }
  }

  let cachePath = null;

  ipcMain.handle('offline-init', async (event) => {
    const app = require('electron').app;

    cachePath = initCacheDir(app);
    loadCacheManifest(cachePath);
    cleanExpiredCache(cachePath);

    return {
      isOnline,
      cacheSize: cacheManifest.stats.size,
      cacheCount: Object.keys(cacheManifest.entries).length,
      maxCacheSize: MAX_CACHE_SIZE
    };
  });

  ipcMain.handle('offline-get', async (event, key, options = {}) => {
    if (!cachePath) return { success: false, data: null, error: 'Not initialized' };

    const entry = cacheManifest.entries[key];

    // Cache miss
    if (!entry) {
      cacheManifest.stats.misses++;
      return { success: true, data: null, fromCache: false };
    }

    // Check expiration
    if (entry.expires && entry.expires < Date.now()) {
      deleteCacheFile(cachePath, entry.hash);
      delete cacheManifest.entries[key];
      saveCacheManifest(cachePath);
      cacheManifest.stats.misses++;
      return { success: true, data: null, fromCache: false, expired: true };
    }

    const data = getDataFromFile(cachePath, entry.hash);
    if (data) {
      // Update last access time
      entry.lastAccess = Date.now();
      cacheManifest.stats.hits++;
      saveCacheManifest(cachePath);
      return { success: true, data, fromCache: true };
    }

    // File deleted but entry exists
    delete cacheManifest.entries[key];
    saveCacheManifest(cachePath);
    cacheManifest.stats.misses++;
    return { success: true, data: null, fromCache: false };
  });

  ipcMain.handle('offline-set', async (event, key, data, options = {}) => {
    if (!cachePath) return { success: false, error: 'Not initialized' };

    const ttl = options.ttl || DEFAULT_TTL;
    const type = options.type || 'auto'; // 'auto' | 'session' | 'persistent'

    // Generate hash for the key
    const hash = generateHash(key);
    const size = JSON.stringify(data).length;

    // Check if we're over size limit and need to evict
    if (cacheManifest.stats.size + size > MAX_CACHE_SIZE) {
      evictLRU(cachePath);
    }

    // Write data to file
    const success = cacheDataToFile(cachePath, hash, data);

    if (success) {
      const now = Date.now();
      cacheManifest.entries[key] = {
        hash,
        size,
        timestamp: now,
        lastAccess: now,
        expires: type === 'session' ? now + 24 * 60 * 60 * 1000 : now + ttl,
        type
      };
      cacheManifest.stats.size += size;
      saveCacheManifest(cachePath);
      return { success: true, size };
    }

    return { success: false, error: 'Failed to write cache file' };
  });

  ipcMain.handle('offline-remove', async (event, key) => {
    if (!cachePath) return false;

    const entry = cacheManifest.entries[key];
    if (entry) {
      deleteCacheFile(cachePath, entry.hash);
      cacheManifest.stats.size -= entry.size || 0;
      delete cacheManifest.entries[key];
      saveCacheManifest(cachePath);
    }
    return true;
  });

  ipcMain.handle('offline-clear', async (event, options = {}) => {
    if (!cachePath) return false;

    const type = options.type; // Optional filter by type

    // Delete cache files
    for (const [key, entry] of Object.entries(cacheManifest.entries)) {
      if (!type || entry.type === type) {
        deleteCacheFile(cachePath, entry.hash);
        delete cacheManifest.entries[key];
      }
    }

    // Recalculate size
    cacheManifest.stats.size = Object.values(cacheManifest.entries)
      .reduce((sum, e) => sum + (e.size || 0), 0);

    saveCacheManifest(cachePath);
    return true;
  });

  ipcMain.handle('offline-get-status', async () => {
    return {
      isOnline,
      lastOnlineTime,
      stats: cacheManifest.stats,
      cacheCount: Object.keys(cacheManifest.entries).length,
      maxCacheSize: MAX_CACHE_SIZE,
      usagePercent: Math.round((cacheManifest.stats.size / MAX_CACHE_SIZE) * 100)
    };
  });

  ipcMain.handle('offline-check-network', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      return await updateNetworkStatus(win);
    } catch (e) {
      console.error('[OfflineSupport] 网络检查失败:', e);
      return isOnline;
    }
  });

  ipcMain.handle('offline-get-keys', async () => {
    return Object.keys(cacheManifest.entries);
  });

  ipcMain.handle('offline-get-meta', async (event, key) => {
    const entry = cacheManifest.entries[key];
    if (!entry) return null;

    return {
      key,
      size: entry.size,
      timestamp: entry.timestamp,
      lastAccess: entry.lastAccess,
      expires: entry.expires,
      type: entry.type,
      isExpired: entry.expires ? entry.expires < Date.now() : false
    };
  });

  // Batch operations for efficiency
  ipcMain.handle('offline-batch-get', async (event, keys) => {
    if (!cachePath) return {};
    const results = {};
    for (const key of keys) {
      try {
        const entry = cacheManifest.entries[key];
        if (!entry) {
          cacheManifest.stats.misses++;
          continue;
        }
        // Check expiration
        if (entry.expires && entry.expires < Date.now()) {
          deleteCacheFile(cachePath, entry.hash);
          delete cacheManifest.entries[key];
          cacheManifest.stats.misses++;
          continue;
        }
        const result = getDataFromFile(cachePath, entry.hash);
        if (result) {
          entry.lastAccess = Date.now();
          cacheManifest.stats.hits++;
          results[key] = result;
        } else {
          // File deleted but entry still exists — clean up
          delete cacheManifest.entries[key];
          cacheManifest.stats.misses++;
        }
      } catch (e) {
        cacheManifest.stats.misses++;
        console.error('[OfflineSupport] batch-get error for key:', key, e);
      }
    }
    saveCacheManifest(cachePath);
    return results;
  });

  ipcMain.handle('offline-batch-set', async (event, items, options = {}) => {
    if (!cachePath) return {};
    const results = {};

    // Pre-calculate total size to check against MAX_CACHE_SIZE
    let newTotalSize = cacheManifest.stats.size;
    for (const { key, data } of items) {
      try {
        const size = JSON.stringify(data).length;
        // If key already exists, subtract its old size first
        const oldEntry = cacheManifest.entries[key];
        if (oldEntry) {
          newTotalSize -= oldEntry.size || 0;
        }
        newTotalSize += size;
      } catch (e) {
        console.error('[OfflineSupport] batch-set size calc error for key:', key, e);
      }
    }

    // Evict if total would exceed max
    if (newTotalSize > MAX_CACHE_SIZE) {
      const evicted = evictLRU(cachePath);
      if (evicted > 0) {
        // Recalculate after eviction
        newTotalSize = cacheManifest.stats.size;
        for (const { key, data } of items) {
          try {
            const size = JSON.stringify(data).length;
            const oldEntry = cacheManifest.entries[key];
            if (oldEntry) {
              newTotalSize -= oldEntry.size || 0;
            }
            newTotalSize += size;
          } catch (e) { console.error('Cache size recalc error:', e.message); }
        }
      }
    }

    for (const { key, data } of items) {
      try {
        const hash = generateHash(key);
        const success = cacheDataToFile(cachePath, hash, data);
        if (success) {
          const now = Date.now();
          const size = JSON.stringify(data).length;
          const oldEntry = cacheManifest.entries[key];
          // If replacing an existing entry, subtract its old size
          if (oldEntry) {
            cacheManifest.stats.size -= oldEntry.size || 0;
          }
          cacheManifest.entries[key] = {
            hash,
            size,
            timestamp: now,
            lastAccess: now,
            expires: now + (options.ttl || DEFAULT_TTL),
            type: options.type || 'auto'
          };
          cacheManifest.stats.size += size;
          results[key] = true;
        } else {
          results[key] = false;
        }
      } catch (e) {
        console.error('[OfflineSupport] batch-set error for key:', key, e);
        results[key] = false;
      }
    }
    saveCacheManifest(cachePath);
    return results;
  });
}

module.exports = {
  setupOfflineSupportIPC,
  startNetworkMonitoring,
  stopNetworkMonitoring,
  updateNetworkStatus
};
