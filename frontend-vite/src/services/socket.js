/**
 * Cloud Variables WebSocket client.
 * Uses socket.io-client for real-time cloud variable synchronization.
 *
 * When socket.io-client is not installed, all functions gracefully no-op
 * and log a warning. To enable cloud variable sync:
 *   npm install socket.io-client
 */

const SOCKET_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000';
const NAMESPACE = '/cloud-variables';

let socket = null;
let ioModule = null;
let ioAvailable = false;

// Lazy-load socket.io-client at runtime (dynamic import avoids build-time errors)
let loadPromise = null;
function ensureIo() {
  if (ioAvailable) return true;
  if (loadPromise) return false; // already loading
  loadPromise = import('socket.io-client')
    .then((mod) => {
      ioModule = mod;
      ioAvailable = true;
      loadPromise = null;
    })
    .catch(() => {
      console.warn('[CloudVariables] socket.io-client not installed. Cloud variable sync is disabled.');
      loadPromise = null;
    });
  return false;
}

/**
 * Connect to the cloud variables WebSocket namespace.
 * Returns the socket instance (reuses existing connection).
 */
export function connectCloudVariablesSocket() {
  if (!ioAvailable) {
    ensureIo();
    return null;
  }
  if (socket?.connected) {
    return socket;
  }

  const io = ioModule.io || ioModule.default;
  socket = io(`${SOCKET_URL}${NAMESPACE}`, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[CloudVariables] WebSocket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[CloudVariables] WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[CloudVariables] WebSocket connection error:', error.message);
  });

  return socket;
}

/**
 * Subscribe to cloud variable updates for a specific project.
 * @param {number} projectId
 */
export function subscribeToProject(projectId) {
  if (!ioAvailable) { ensureIo(); return; }
  if (!socket?.connected) {
    connectCloudVariablesSocket();
  }
  socket?.emit('subscribe', { projectId });
}

/**
 * Unsubscribe from a project's cloud variable updates.
 * @param {number} projectId
 */
export function unsubscribeFromProject(projectId) {
  if (!ioAvailable) return;
  socket?.emit('unsubscribe', { projectId });
}

/**
 * Push a cloud variable update to the server (for broadcasting to other clients).
 * @param {number} projectId
 * @param {string} name
 * @param {string} value
 * @param {number} [userId]
 */
export function pushCloudVariableUpdate(projectId, name, value, userId) {
  if (!ioAvailable) return;
  socket?.emit('updateVariable', { projectId, name, value, userId });
}

/**
 * Listen for cloud variable changes from the server.
 * @param {(data: { projectId: number; variables: Array<{name: string; value: string}>; updatedBy?: number; timestamp: number }) => void} callback
 */
export function onVariablesUpdated(callback) {
  if (!ioAvailable) { ensureIo(); return () => {}; }
  socket?.on('variablesUpdated', callback);
  return () => socket?.off('variablesUpdated', callback);
}

/**
 * Listen for a single variable change from the server.
 * @param {(data: { projectId: number; name: string; value: string; updatedBy?: number; timestamp: number }) => void} callback
 */
export function onVariableChanged(callback) {
  if (!ioAvailable) { ensureIo(); return () => {}; }
  socket?.on('variableChanged', callback);
  return () => socket?.off('variableChanged', callback);
}

/**
 * Disconnect the socket.
 */
export function disconnectCloudVariablesSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (may be null if not connected).
 */
export function getSocket() {
  return socket;
}
