/**
 * cleanup-processes.js
 *
 * Kills orphaned backend / frontend / Electron processes that may be left
 * lingering from a previous run.  Called by `npm run cleanup` and as a
 * prebuild hook to ensure a clean build environment.
 *
 * Platform support: Windows (taskkill), macOS/Linux (pkill / lsof).
 */

const { execSync, spawnSync } = require('child_process');
const os = require('os');

const PLATFORM = os.platform();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`[cleanup] ${msg}`);
}

function warn(msg) {
  console.warn(`[cleanup] WARN: ${msg}`);
}

/**
 * Run a command synchronously, swallowing non-zero exit codes so a missing
 * process doesn't cause the whole script to fail.
 */
function safeExec(cmd, args, options = {}) {
  try {
    return spawnSync(cmd, args, {
      stdio: 'pipe',
      windowsHide: true,
      timeout: 10000,
      ...options,
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Windows — use taskkill
// ---------------------------------------------------------------------------

function cleanupWindows() {
  const targets = [
    { name: 'node.exe',     desc: 'Node.js (backend / scripts)' },
    { name: 'electron.exe', desc: 'Electron' },
  ];

  for (const target of targets) {
    const result = safeExec('taskkill', ['/F', '/IM', target.name, '/T']);
    if (result && result.status === 0) {
      log(`Terminated lingering ${target.desc} processes`);
    }
  }

  // --- Port-based cleanup: kill whatever is listening on common dev ports ---
  const ports = [3000, 5173, 5174, 5175];
  for (const port of ports) {
    try {
      const netstat = execSync(
        `netstat -ano | findstr :${port}`,
        { windowsHide: true, timeout: 5000, encoding: 'utf8' }
      );
      const lines = netstat.trim().split(/\r?\n/);
      const killed = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && !killed.has(pid)) {
          killed.add(pid);
          const killResult = safeExec('taskkill', ['/F', '/PID', pid]);
          if (killResult && killResult.status === 0) {
            log(`Killed PID ${pid} listening on port ${port}`);
          }
        }
      }
    } catch {
      // netstat returned nothing — port is free
    }
  }
}

// ---------------------------------------------------------------------------
// macOS / Linux — use pkill / lsof
// ---------------------------------------------------------------------------

function cleanupUnix() {
  const nodeTargets = ['main.js', 'main.ts', 'vite', 'nest start'];
  for (const pattern of nodeTargets) {
    safeExec('pkill', ['-f', pattern]);
  }
  safeExec('pkill', ['-f', 'electron']);

  const ports = [3000, 5173, 5174, 5175];
  for (const port of ports) {
    try {
      const lsof = execSync(`lsof -ti:${port}`, { timeout: 5000, encoding: 'utf8' });
      const pids = lsof.trim().split('\n').map(s => s.trim()).filter(Boolean);
      for (const pid of pids) {
        safeExec('kill', ['-9', pid]);
        log(`Killed PID ${pid} listening on port ${port}`);
      }
    } catch {
      // port is free or lsof returned nothing
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

log('Cleanup started  (platform: ' + PLATFORM + ')');

if (PLATFORM === 'win32') {
  cleanupWindows();
} else if (PLATFORM === 'darwin' || PLATFORM === 'linux') {
  cleanupUnix();
} else {
  warn('Unsupported platform: ' + PLATFORM);
}

log('Cleanup complete');
