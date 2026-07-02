const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const logoPath = path.join(buildDir, 'logo.png');
const iconPngPath = path.join(buildDir, 'icon.png');
const iconIcoPath = path.join(buildDir, 'icon.ico');
const trayIconPath = path.join(buildDir, 'tray-icon.png');

async function generateIcons() {
  try {
    // Read the original logo and resize to 256x256 PNG
    await sharp(logoPath)
      .resize(256, 256)
      .png()
      .toFile(iconPngPath);
    console.log('✓ icon.png (256x256) created');

    // Create tray icon (16x16 for Windows tray)
    await sharp(logoPath)
      .resize(16, 16)
      .png()
      .toFile(trayIconPath);
    console.log('✓ tray-icon.png (16x16) created');

    // Generate ICO for Windows using multiple sizes
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(logoPath)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    const icoBuffer = await toIco(pngBuffers);
    fs.writeFileSync(iconIcoPath, icoBuffer);
    console.log('✓ icon.ico created');

    console.log('\nAll icons generated successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

generateIcons();
