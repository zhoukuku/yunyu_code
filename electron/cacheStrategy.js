/**
 * 缓存策略模块 - cacheStrategy.js
 * 定义不同类型资源的缓存策略
 *
 * Compatible with Node 16 (Electron 18 main process):
 * - No Web APIs (Response, fetch, caches) are used — all replaced with
 *   http/https + in-memory structures.
 */

const http = require('http');
const https = require('https');

// ============================================================================
// Node 16 / Electron 18 main process polyfills for Web API concepts
// ============================================================================

/**
 * Minimal Response-like class usable in Node 16 main process.
 * Mimics the subset of the Web Response API that cacheStrategy uses.
 */
class NodeResponse {
  constructor(body, init = {}) {
    this._body = body;            // Buffer | string | null
    this.status = init.status || 200;
    this.statusText = init.statusText || '';
    this._headers = init.headers || {};
    this.ok = this.status >= 200 && this.status < 300;
  }

  get headers() {
    return {
      get: (name) => {
        const key = name.toLowerCase();
        for (const [k, v] of Object.entries(this._headers)) {
          if (k.toLowerCase() === key) return Array.isArray(v) ? v.join(', ') : v;
        }
        return null;
      }
    };
  }

  async text() {
    if (this._body === null) return '';
    if (Buffer.isBuffer(this._body)) return this._body.toString('utf-8');
    return String(this._body);
  }

  async json() {
    const txt = await this.text();
    return JSON.parse(txt);
  }

  clone() {
    // Shallow clone is sufficient for our cache-put-then-return pattern
    return new NodeResponse(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: { ...this._headers }
    });
  }
}

/**
 * Minimal in-memory Cache API replacement.
 * Instead of the browser CacheStorage API (unavailable in main process),
 * we use a Map keyed by URL string.
 */
class MemoryCache {
  constructor(name) {
    this.name = name;
    this._store = new Map();
  }

  async match(request) {
    const key = typeof request === 'string' ? request : request.url;
    const entry = this._store.get(key);
    if (!entry) return undefined;
    // Check expiration
    if (entry.expires && entry.expires < Date.now()) {
      this._store.delete(key);
      return undefined;
    }
    return entry.response;
  }

  async put(request, response) {
    const key = typeof request === 'string' ? request : request.url;
    this._store.set(key, { response, timestamp: Date.now(), expires: null });
  }

  async delete(request) {
    const key = typeof request === 'string' ? request : request.url;
    return this._store.delete(key);
  }

  async keys() {
    return [...this._store.keys()].map(k => ({ url: k }));
  }
}

// Singleton cache store (replaces browser caches global)
const cacheStore = new Map();

async function openCache(name) {
  let c = cacheStore.get(name);
  if (!c) {
    c = new MemoryCache(name);
    cacheStore.set(name, c);
  }
  return c;
}

// ============================================================================
// HTTP fetch implementation (Node 16 — no global fetch)
// ============================================================================

function nodeFetch(input, init) {
  return new Promise((resolve, reject) => {
    let url, method, headers, body;

    if (typeof input === 'string') {
      url = input;
      method = (init && init.method) || 'GET';
      headers = (init && init.headers) || {};
      body = init && init.body;
    } else {
      // Request-like object (Cache API)
      url = input.url;
      method = input.method || 'GET';
      headers = {};
      body = null;
      if (input.headers) {
        if (typeof input.headers.forEach === 'function') {
          input.headers.forEach((value, key) => { headers[key] = value; });
        } else if (typeof input.headers.entries === 'function') {
          for (const [key, value] of input.headers.entries()) {
            headers[key] = value;
          }
        }
      }
    }

    const urlObj = new URL(url);
    const mod = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
      // IMPORTANT: never disable TLS certificate validation.
      // rejectUnauthorized defaults to true (secure).
    };

    const req = mod.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks);
        const response = new NodeResponse(responseBody, {
          status: res.statusCode,
          statusText: res.statusMessage || '',
          headers: res.headers
        });
        resolve(response);
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ============================================================================
// Cache strategy constants
// ============================================================================

const CACHE_STRATEGY = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// ============================================================================
// Resource type configuration
// ============================================================================

const RESOURCE_CONFIG = {
  // Static assets (CSS, JS, images) — long-term cache
  static: {
    strategy: CACHE_STRATEGY.CACHE_FIRST,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    priority: 'high',
    matchPatterns: [
      /\.css$/,
      /\.js$/,
      /\.png$/,
      /\.jpg$/,
      /\.jpeg$/,
      /\.gif$/,
      /\.svg$/,
      /\.ico$/,
      /\.woff$/,
      /\.woff2$/,
      /\.ttf$/,
      /\.eot$/
    ]
  },

  // API requests — Network First with cache fallback
  api: {
    strategy: CACHE_STRATEGY.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000,  // 5 minutes
    priority: 'high',
    matchPatterns: [
      /\/api\//
    ],
    fallbackCache: true
  },

  // Page content — Stale While Revalidate
  page: {
    strategy: CACHE_STRATEGY.STALE_WHILE_REVALIDATE,
    maxAge: 60 * 1000,  // 1 minute
    priority: 'medium',
    matchPatterns: [
      /\.html$/,
      /^\/$/
    ]
  },

  // User data (code execution results etc.) — short-term cache
  userData: {
    strategy: CACHE_STRATEGY.NETWORK_FIRST,
    maxAge: 30 * 60 * 1000,  // 30 minutes
    priority: 'medium',
    matchPatterns: [
      /\/user\//,
      /\/data\//
    ]
  },

  // External resources — conservative caching
  external: {
    strategy: CACHE_STRATEGY.STALE_WHILE_REVALIDATE,
    maxAge: 24 * 60 * 60 * 1000,  // 1 day
    priority: 'low',
    matchPatterns: [
      /^https?:\/\/.*\.baidu\.com/,
      /^https?:\/\/.*\.aliyun\.com/
    ]
  }
};

// ============================================================================
// Cache Strategy Executor
// ============================================================================

class CacheStrategyExecutor {
  constructor() {
    this.cache = null;
    this.cacheName = 'yunyu-offline-v1';
  }

  // Initialize cache
  async init() {
    try {
      this.cache = await openCache(this.cacheName);
      return true;
    } catch (e) {
      console.error('[CacheStrategy] Cache initialization failed:', e);
      return false;
    }
  }

  // Get matching resource type for a URL
  getResourceType(url) {
    for (const [type, config] of Object.entries(RESOURCE_CONFIG)) {
      for (const pattern of config.matchPatterns) {
        if (pattern.test(url)) {
          return { type, config };
        }
      }
    }
    return null;
  }

  // Determine whether a request should be cached
  shouldCache(request) {
    const url = request.url;

    // Skip non-GET requests
    if (request.method !== 'GET') return false;

    // Skip chrome-extension and other extension protocols
    if (url.startsWith('chrome-extension://')) return false;

    // Skip ws/wss protocols
    if (url.startsWith('ws://') || url.startsWith('wss://')) return false;

    return true;
  }

  // Cache First strategy
  async cacheFirst(request) {
    const cacheKey = this.getCacheKey(request.url);
    const cachedResponse = await this.cache.match(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await nodeFetch(request);
      if (networkResponse.ok) {
        await this.cache.put(cacheKey, networkResponse.clone());
      }
      return networkResponse;
    } catch (e) {
      console.error('[CacheStrategy] Cache First network request failed:', e.message);
      return null;
    }
  }

  // Network First strategy
  async networkFirst(request, fallbackCache = true) {
    const cacheKey = this.getCacheKey(request.url);

    try {
      const networkResponse = await nodeFetch(request);
      if (networkResponse.ok) {
        await this.cache.put(cacheKey, networkResponse.clone());
      }
      return networkResponse;
    } catch (e) {
      console.error('[CacheStrategy] Network First network request failed, using cache fallback:', e.message);
      if (fallbackCache) {
        const cachedResponse = await this.cache.match(cacheKey);
        return cachedResponse || null;
      }
      return null;
    }
  }

  // Stale While Revalidate strategy
  async staleWhileRevalidate(request) {
    const cacheKey = this.getCacheKey(request.url);
    const cachedResponse = await this.cache.match(cacheKey);

    // Return cached immediately, update in background
    nodeFetch(request)
      .then(response => {
        if (response.ok) {
          this.cache.put(cacheKey, response);
        }
      })
      .catch(err => {
        console.error('[CacheStrategy] Background revalidation failed:', err.message);
      });

    return cachedResponse || null;
  }

  // Execute cache strategy
  async handle(request) {
    if (!this.shouldCache(request)) {
      return nodeFetch(request);
    }

    const resourceType = this.getResourceType(request.url);
    const strategy = resourceType?.config.strategy || CACHE_STRATEGY.CACHE_FIRST;
    const fallbackCache = resourceType?.config.fallbackCache !== false;

    switch (strategy) {
      case CACHE_STRATEGY.CACHE_FIRST:
        return this.cacheFirst(request);

      case CACHE_STRATEGY.NETWORK_FIRST:
        return this.networkFirst(request, fallbackCache);

      case CACHE_STRATEGY.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(request);

      case CACHE_STRATEGY.CACHE_ONLY: {
        const cached = await this.cache.match(request);
        return cached || new NodeResponse('Offline - No Cache', { status: 503 });
      }

      case CACHE_STRATEGY.NETWORK_ONLY:
      default:
        return nodeFetch(request);
    }
  }

  // Pre-cache a list of resource URLs
  async precache(urls) {
    for (const url of urls) {
      try {
        const response = await nodeFetch(url);
        if (response.ok) {
          await this.cache.put(url, response);
          console.log('[CacheStrategy] Pre-cached:', url);
        }
      } catch (e) {
        console.error('[CacheStrategy] Pre-cache failed:', url, e.message);
      }
    }
  }

  // Clean expired cache entries
  async cleanExpired(maxAge) {
    const now = Date.now();
    const keys = await this.cache.keys();
    let cleaned = 0;

    for (const request of keys) {
      const response = await this.cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const date = new Date(dateHeader).getTime();
          if (now - date > maxAge) {
            await this.cache.delete(request);
            cleaned++;
          }
        }
      }
    }

    console.log(`[CacheStrategy] Cleaned ${cleaned} expired cache entries`);
    return cleaned;
  }

  // Get cache statistics
  async getCacheStats() {
    const keys = await this.cache.keys();
    return {
      totalItems: keys.length,
      cacheName: this.cacheName
    };
  }

  // Helper for cache key generation
  getCacheKey(url) {
    return url;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  CACHE_STRATEGY,
  RESOURCE_CONFIG,
  CacheStrategyExecutor,
  // Also export the NodeResponse class so other modules can use it
  NodeResponse,
  // Export memory cache primitives for manual use
  openCache,
  MemoryCache
};
