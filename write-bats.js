var fs = require('fs');
var path = require('path');

function writeBat(filename, lines) {
  // Force CRLF line endings and ASCII-only content
  var content = lines.join('\r\n') + '\r\n';
  // Verify no special chars
  for (var i = 0; i < content.length; i++) {
    var c = content.charCodeAt(i);
    if (c > 127 && c !== 13 && c !== 10) {
      console.error('WARNING: Non-ASCII char at position', i, 'in', filename);
    }
  }
  fs.writeFileSync(filename, content, 'utf8');
  console.log('Written:', filename, '(' + content.split('\n').length + ' lines)');
}

var setupBat = [
  '@echo off',
  '',
  'cd /d "e:\\k\\meee\\code\\project01\\electron"',
  '',
  'if not exist electron.zip (',
  '    echo ============================================',
  '    echo   ERROR: electron.zip not found',
  '    echo   Place it in: e:\\k\\meee\\code\\project01\\electron\\',
  '    echo ============================================',
  '    pause',
  '    exit /b 1',
  ')',
  '',
  'echo ============================================',
  'echo [1/2] Extracting electron.zip to runtime\\',
  'echo ============================================',
  'if exist runtime rmdir /s /q runtime',
  'mkdir runtime',
  'powershell -Command "Expand-Archive -Path electron.zip -DestinationPath runtime -Force"',
  '',
  'if not exist runtime\\electron.exe (',
  '    echo   ERROR: Extraction failed',
  '    pause',
  '    exit /b 1',
  ')',
  'echo   Done.',
  '',
  'echo [2/2] Removing node_modules\\electron',
  'if exist node_modules\\electron rmdir /s /q node_modules\\electron',
  'echo   Done.',
  '',
  'echo ============================================',
  'echo   Setup complete. Run start.bat to launch.',
  'echo ============================================',
  'pause',
];

var startBat = [
  '@echo off',
  '',
  'cd /d "e:\\k\\meee\\code\\project01\\electron"',
  '',
  'if not exist runtime\\electron.exe (',
  '    echo ============================================',
  '    echo   ERROR: electron.exe not found in runtime\\',
  '    echo   Run setup-electron.bat first.',
  '    echo ============================================',
  '    pause',
  '    exit /b 1',
  ')',
  '',
  'echo [1/3] Starting backend on port 3000...',
  'start "Backend" cmd /c "cd /d e:\\k\\meee\\code\\project01\\backend && npm run start:dev"',
  '',
  'echo [2/3] Starting frontend on port 5174...',
  'start "Frontend" cmd /c "cd /d e:\\k\\meee\\code\\project01\\frontend-vite && set ELECTRON=true && npm run dev"',
  '',
  'echo [3/3] Waiting 15s for services to start...',
  'timeout /t 15 /nobreak >nul',
  '',
  'echo Launching Electron desktop app...',
  'start "Electron" cmd /c "cd /d e:\\k\\meee\\code\\project01\\electron && runtime\\electron.exe ."',
  '',
  'echo.',
  'echo ============================================',
  'echo   Login: admin / admin123',
  'echo ============================================',
  'pause',
];

writeBat('e:/k/meee/code/project01/setup-electron.bat', setupBat);
writeBat('e:/k/meee/code/project01/start.bat', startBat);
