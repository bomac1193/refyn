// This script generates PNG icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sizes = [16, 32, 48, 128];
const iconDir = path.join(__dirname, '..', 'public', 'icons');

// CRC32 implementation
function makeCrcTable() {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(size) {
  const width = size;
  const height = size;

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);   // Bit depth
  ihdrData.writeUInt8(6, 9);   // Color type (RGBA)
  ihdrData.writeUInt8(0, 10);  // Compression
  ihdrData.writeUInt8(0, 11);  // Filter
  ihdrData.writeUInt8(0, 12);  // Interlace

  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));

  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdrType.copy(ihdr, 4);
  ihdrData.copy(ihdr, 8);
  ihdr.writeUInt32BE(ihdrCrc, 21);

  // Create image data (RGBA)
  const rawData = [];
  const cornerRadius = Math.floor(size * 0.2);

  for (let y = 0; y < height; y++) {
    rawData.push(0); // Filter byte
    for (let x = 0; x < width; x++) {
      // Check if pixel is within rounded rectangle
      const inCorner = isInRoundedRect(x, y, width, height, cornerRadius);

      if (inCorner) {
        // Background color: #0A0A0C
        rawData.push(10);   // R
        rawData.push(10);   // G
        rawData.push(12);   // B
        rawData.push(255);  // A

        // Draw the "R" letter in cyan
        const centerX = width / 2;
        const centerY = height / 2;
        const fontSize = size * 0.5;

        // Simple R shape (very basic)
        const relX = (x - centerX) / fontSize;
        const relY = (y - centerY) / fontSize;

        // R letter approximation
        const isR = (
          // Vertical bar
          (relX > -0.35 && relX < -0.15 && relY > -0.35 && relY < 0.35) ||
          // Top horizontal
          (relX > -0.35 && relX < 0.2 && relY > -0.35 && relY < -0.2) ||
          // Middle horizontal
          (relX > -0.35 && relX < 0.1 && relY > -0.05 && relY < 0.1) ||
          // Curved part (simplified as diagonal)
          (relX > 0.05 && relX < 0.25 && relY > -0.35 && relY < -0.05 &&
           Math.abs(relX - 0.15) < 0.15 - Math.abs(relY + 0.2) * 0.5) ||
          // Leg diagonal
          (relY > 0.05 && relY < 0.35 &&
           relX > -0.15 + (relY - 0.05) * 1.2 &&
           relX < 0.05 + (relY - 0.05) * 1.2)
        );

        if (isR) {
          rawData[rawData.length - 4] = 0;    // R - cyan
          rawData[rawData.length - 3] = 240;  // G
          rawData[rawData.length - 2] = 255;  // B
        }
      } else {
        // Transparent
        rawData.push(0);
        rawData.push(0);
        rawData.push(0);
        rawData.push(0);
      }
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const compressed = zlib.deflateSync(rawBuffer, { level: 9 });

  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressed]));

  const idat = Buffer.alloc(compressed.length + 12);
  idat.writeUInt32BE(compressed.length, 0);
  idatType.copy(idat, 4);
  compressed.copy(idat, 8);
  idat.writeUInt32BE(idatCrc, compressed.length + 8);

  // IEND chunk
  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iend = Buffer.alloc(12);
  iend.writeUInt32BE(0, 0);
  iendType.copy(iend, 4);
  iend.writeUInt32BE(iendCrc, 8);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function isInRoundedRect(x, y, w, h, r) {
  // Check corners
  const corners = [
    { cx: r, cy: r },
    { cx: w - r, cy: r },
    { cx: r, cy: h - r },
    { cx: w - r, cy: h - r }
  ];

  for (const corner of corners) {
    const dx = Math.abs(x - corner.cx);
    const dy = Math.abs(y - corner.cy);

    // In corner region
    if ((x < r || x >= w - r) && (y < r || y >= h - r)) {
      if (dx * dx + dy * dy > r * r) {
        return false;
      }
    }
  }

  return x >= 0 && x < w && y >= 0 && y < h;
}

// Generate icons
console.log('Generating icons...');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

sizes.forEach(size => {
  const png = createPNG(size);
  const filename = path.join(iconDir, `icon-${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created: icon-${size}.png (${png.length} bytes)`);
});

console.log('\nDone!');
