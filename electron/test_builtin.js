// Minimal test — run with: runtime\electron.exe test_builtin.js
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron || 'NOT SET');
console.log('Chrome version:', process.versions.chrome || 'NOT SET');

// Check if 'electron' is a built-in module
var builtins;
try {
  builtins = require('module').builtinModules;
  console.log('Builtin modules count:', builtins ? builtins.length : 'N/A');
  if (builtins) {
    var hasElectron = builtins.indexOf('electron') >= 0;
    console.log('electron in builtinModules:', hasElectron);
    if (!hasElectron) {
      // Show all builtins that look relevant
      var relevant = builtins.filter(function(m) {
        return m.indexOf('electron') >= 0 || m.indexOf('_electron') >= 0;
      });
      console.log('Electron-related builtins:', relevant.length > 0 ? relevant : 'NONE');
    }
  }
} catch(e) {
  console.log('Could not get builtinModules:', e.message);
}

// Try require('electron')
try {
  var elec = require('electron');
  console.log('require("electron") returned typeof:', typeof elec);
  if (typeof elec === 'string') {
    console.log('  -> It returned a PATH string:', elec);
  } else if (typeof elec === 'object') {
    console.log('  -> It returned an object with keys:', Object.keys(elec).slice(0, 10).join(', '));
    console.log('  -> electron.app:', typeof elec.app);
  }
} catch(e) {
  console.log('require("electron") FAILED:', e.message);
  console.log('  code:', e.code);
}

// Also try the internal binding identifier
try {
  var bindings = process.binding('electron_common_features');
  console.log('electron_common_features binding:', typeof bindings);
} catch(e) {
  console.log('electron_common_features binding not available:', e.message);
}

// Done
console.log('TEST_COMPLETE');
