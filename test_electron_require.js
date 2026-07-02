const electron = require('electron');
console.log('typeof require(electron):', typeof electron);
if (typeof electron === 'object') {
  console.log('electron keys (first 8):', Object.keys(electron).slice(0,8));
  console.log('app type:', typeof electron.app);
  const { app } = electron;
  app.whenReady().then(() => {
    console.log('APP READY - Electron FULLY FUNCTIONAL');
    app.quit();
  });
} else {
  console.log('electron resolved to string (npm package path):', electron);
}
setTimeout(() => { console.log('TIMEOUT exit'); process.exit(0); }, 8000);
