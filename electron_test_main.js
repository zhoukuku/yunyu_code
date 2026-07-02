const electron = require('electron');
console.log('typeof require(electron):', typeof electron);
console.log('electron.app:', typeof electron.app);
if (electron.app) {
    console.log('ELECTRON_BUILTIN_OK');
    electron.app.quit();
} else {
    console.log('ELECTRON_BUILTIN_FAIL: got', typeof electron, String(electron).substring(0, 80));
    process.exit(1);
}
