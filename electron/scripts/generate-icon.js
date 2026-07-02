const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const iconPngPath = path.join(buildDir, 'icon.png');
const iconIcoPath = path.join(buildDir, 'icon.ico');
const tempDir = path.join(buildDir, 'temp');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create a 256x256 icon for Cloud Island Learning Platform
// Design: Cloud island theme with blue sky gradient, green island, and book/learning symbol
async function generateIcon() {
  const size = 256;

  // Create SVG with cloud island theme
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="island" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#90EE90;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#228B22;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background: Sky -->
      <rect width="${size}" height="${size}" fill="url(#sky)" rx="30" ry="30"/>

      <!-- Cloud (left) -->
      <ellipse cx="70" cy="70" rx="45" ry="30" fill="white" opacity="0.9"/>
      <ellipse cx="100" cy="60" rx="35" ry="25" fill="white" opacity="0.9"/>
      <ellipse cx="45" cy="65" rx="30" ry="20" fill="white" opacity="0.9"/>

      <!-- Cloud (right) -->
      <ellipse cx="180" cy="55" rx="40" ry="28" fill="white" opacity="0.85"/>
      <ellipse cx="210" cy="50" rx="30" ry="20" fill="white" opacity="0.85"/>

      <!-- Island base -->
      <ellipse cx="128" cy="200" rx="100" ry="35" fill="url(#island)"/>

      <!-- Island dirt/earth -->
      <ellipse cx="128" cy="205" rx="85" ry="20" fill="#8B4513"/>

      <!-- Book symbol on island -->
      <rect x="98" y="165" width="60" height="45" fill="#F5F5DC" rx="3"/>
      <rect x="100" y="167" width="56" height="41" fill="#FFF8DC" rx="2"/>
      <line x1="128" y1="167" x2="128" y2="208" stroke="#DEB887" stroke-width="2"/>
      <line x1="100" y1="185" x2="156" y2="185" stroke="#DEB887" stroke-width="1"/>
      <line x1="100" y1="195" x2="156" y2="195" stroke="#DEB887" stroke-width="1"/>

      <!-- Small palm tree -->
      <rect x="170" y="150" width="8" height="40" fill="#8B4513"/>
      <ellipse cx="174" cy="145" rx="20" ry="12" fill="#228B22"/>
      <ellipse cx="165" cy="150" rx="15" ry="8" fill="#32CD32"/>
      <ellipse cx="183" cy="150" rx="15" ry="8" fill="#32CD32"/>

      <!-- Small wave at bottom -->
      <path d="M0,240 Q32,230 64,240 T128,240 T192,240 T256,240 L256,256 L0,256 Z" fill="#4A90E2" opacity="0.6"/>
    </svg>
  `;

  // Create temp directory for ICO conversion
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Generate PNG from SVG
  await sharp(Buffer.from(svg))
    .png()
    .toFile(iconPngPath);

  console.log('PNG icon created:', iconPngPath);

  // Generate multiple sizes for ICO
  const sizes = [256, 128, 64, 48, 32, 16];
  const tempPngPaths = [];

  for (const s of sizes) {
    const tempPath = path.join(tempDir, `icon-${s}.png`);
    await sharp(Buffer.from(svg))
      .resize(s, s)
      .png()
      .toFile(tempPath);
    tempPngPaths.push(tempPath);
  }

  console.log('Temp PNG files created for ICO conversion');

  // Convert to ICO using file paths
  const icoBuffer = await pngToIco(tempPngPaths);
  fs.writeFileSync(iconIcoPath, icoBuffer);

  console.log('ICO icon created:', iconIcoPath);

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Temp files cleaned up');

  console.log('Icon generation complete!');
}

generateIcon().catch(console.error);
