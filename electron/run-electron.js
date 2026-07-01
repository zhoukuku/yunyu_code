const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the Electron binary from multiple possible locations
function findElectronBinary() {
  const candidates = [
    // 1. Local runtime directory (extracted from electron.zip)
    path.join(__dirname, 'runtime', 'electron.exe'),
    // 2. Alternate temp directory
    path.join(__dirname, 'electron_temp', 'electron.exe'),
    // 3. npm-installed electron (the real binary, not the impostor)
    path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe'),
    // 4. Global npm electron
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'electron', 'dist', 'electron.exe'),
    // 5. Common Electron install path
    'C:\\Program Files\\Electron\\electron.exe',
    // 6. User-local
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'electron', 'electron.exe'),
    // 7. Mac/Linux
    path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron'),
    '/usr/local/bin/electron',
    '/usr/bin/electron'
  ];

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        console.log('Found Electron binary:', candidate);
        return candidate;
      }
    } catch (e) {
      // ignore permission errors
    }
  }

  return null;
}

// Try to extract electron.zip if binary not found
function extractElectronZip() {
  const zipPath = path.join(__dirname, 'electron-official.zip');
  const altZipPath = path.join(__dirname, 'electron.zip');
  const runtimeDir = path.join(__dirname, 'runtime');

  const zipFile = fs.existsSync(zipPath) ? zipPath : (fs.existsSync(altZipPath) ? altZipPath : null);
  if (!zipFile) return false;

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  console.log('Extracting Electron from:', zipFile);
  try {
    if (process.platform === 'win32') {
      // Escape single quotes for PowerShell: double them inside a single-quoted string.
      // Using -LiteralPath prevents PowerShell from interpreting wildcard characters.
      const escapedZip = zipFile.replace(/'/g, "''");
      const escapedDir = runtimeDir.replace(/'/g, "''");
      execSync(
        `powershell -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDir}' -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      // Escape double quotes for the shell on Unix
      const escapedZip = zipFile.replace(/"/g, '\\"');
      const escapedDir = runtimeDir.replace(/"/g, '\\"');
      execSync(`unzip -o "${escapedZip}" -d "${escapedDir}"`, { stdio: 'inherit' });
    }
    console.log('Extraction complete');
    return true;
  } catch (e) {
    console.error('Extraction failed:', e.message);
    console.error('Please extract', zipFile, 'manually to', runtimeDir);
    return false;
  }
}

let electronPath = findElectronBinary();

if (!electronPath) {
  console.log('Electron binary not found, trying to extract from zip...');
  extractElectronZip();
  electronPath = findElectronBinary();
}

if (!electronPath) {
  console.error('='.repeat(60));
  console.error('ERROR: Electron binary not found!');
  console.error('');
  console.error('Tried the following locations:');
  console.error('  1. runtime/electron.exe');
  console.error('  2. electron_temp/electron.exe');
  console.error('  3. node_modules/electron/dist/electron.exe');
  console.error('');
  console.error('To fix:');
  console.error('  1. Extract electron-official.zip to the runtime/ folder');
  console.error('  2. OR install: npm install electron --save-dev');
  console.error('  3. OR download from https://www.electronjs.org/');
  console.error('='.repeat(60));
  process.exit(1);
}

const cmdArgs = process.argv.slice(2);
const args = cmdArgs.length > 0 ? cmdArgs : ['.'];

console.log('Starting Electron from:', electronPath);
console.log('Working directory:', __dirname);
console.log('With args:', args);

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development', ELECTRON_RUN_AS_NODE: undefined }
});

child.on('close', (code) => {
  console.log('Electron exited with code:', code);
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start Electron:', err.message);
  if (err.code === 'ENOENT') {
    console.error('The Electron binary was not found at:', electronPath);
  }
  process.exit(1);
});
