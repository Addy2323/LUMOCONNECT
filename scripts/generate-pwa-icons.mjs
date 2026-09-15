import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// --- CRC32 Table for PNG chunk integrity ---
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const toCrc = Buffer.concat([typeBuf, data])
  const crcVal = crc32(toCrc)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crcVal, 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type 6: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // IDAT with scanline filter bytes
  const scanlineLength = width * 4 + 1
  const rawData = Buffer.alloc(height * scanlineLength)
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength
    rawData[rowOffset] = 0 // Filter type 0 (None)
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4)
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 })
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

// Minimal ICO encoder from 32x32 PNG
function encodeICO(pngBuffer) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = ICO
  header.writeUInt16LE(1, 4) // 1 image

  const dirEntry = Buffer.alloc(16)
  dirEntry[0] = 32 // Width
  dirEntry[1] = 32 // Height
  dirEntry[2] = 0  // Color palette
  dirEntry[3] = 0  // Reserved
  dirEntry.writeUInt16LE(1, 4)  // Color planes
  dirEntry.writeUInt16LE(32, 6) // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8)  // Size in bytes
  dirEntry.writeUInt32LE(22, 12) // Offset of image data (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuffer])
}

// Distance from point to rounded rectangle
// Rectangle centered at (0,0), half-width hw, half-height hh, corner radius r
function sdRoundedBox(px, py, hw, hh, r) {
  const qx = Math.abs(px) - hw + r
  const qy = Math.abs(py) - hh + r
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  const outerDist = Math.sqrt(ox * ox + oy * oy)
  const innerDist = Math.min(Math.max(qx, qy), 0)
  return outerDist + innerDist - r
}

// Color definitions
const ORANGE = [255, 106, 0]     // #FF6A00 vibrant brand orange
const NAVY = [11, 19, 43]        // #0B132B dark navy
const BG_DARK = [11, 19, 43]     // background dark navy for maskable / icon bg
const BG_WHITE = [255, 255, 255]

/**
 * Render Lumo Emblem
 * @param {number} width 
 * @param {number} height 
 * @param {object} options
 *   isMaskable: boolean (adds full background and scales emblem within safe zone)
 *   theme: 'dark' | 'transparent' | 'apple'
 */
function renderLumoIcon(width, height, options = {}) {
  const { isMaskable = false, theme = 'dark' } = options
  const buffer = Buffer.alloc(width * height * 4)

  const cx = width / 2
  const cy = height / 2

  // Scale emblem:
  // In maskable mode, Android safe zone is the central 80% circle (radius 0.40 * size).
  // Standard mode can use ~68% of the icon canvas for pleasant margin.
  const emblemScale = isMaskable ? width * 0.46 : width * 0.62

  // Diamond configuration:
  // The 4 rotated rounded squares:
  // After 45deg rotation, the centers of the 4 diamonds are:
  // Top: (0, -D), Left: (-D, 0), Bottom: (0, D), Right: (D, 0)
  // Distance D and half-size S
  const D = emblemScale * 0.29
  const S = emblemScale * 0.22 // half-size of each rounded square
  const R = S * 0.35 // corner radius

  // Diamond definitions with color
  // User logo: Top orange, Left orange, Bottom orange, Right dark navy
  // On dark background, Right square can be either crisp dark navy with subtle edge or bright contrast
  const diamonds = [
    { cx: 0, cy: -D, color: ORANGE, label: 'top' },
    { cx: -D, cy: 0, color: ORANGE, label: 'left' },
    { cx: 0, cy: D, color: ORANGE, label: 'bottom' },
    { cx: D, cy: 0, color: theme === 'dark' ? [26, 38, 74] : NAVY, label: 'right', isNavy: true },
  ]

  // Super-sampling 2x2 for clean anti-aliasing
  const ss = 2
  const ssInv = 1 / ss
  const sampleCount = ss * ss

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let accumR = 0
      let accumG = 0
      let accumB = 0
      let accumA = 0

      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = x + (sx + 0.5) * ssInv
          const py = y + (sy + 0.5) * ssInv

          // Base background color
          let bgR = 0, bgG = 0, bgB = 0, bgA = 0
          if (isMaskable || theme === 'dark') {
            bgR = BG_DARK[0]; bgG = BG_DARK[1]; bgB = BG_DARK[2]; bgA = 255
          } else if (theme === 'apple') {
            // Elegant subtle dark gradient for Apple touch icon
            const distNorm = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)) / (width * 0.7)
            const factor = Math.min(1, Math.max(0, distNorm))
            bgR = Math.round(15 + factor * 5)
            bgG = Math.round(23 + factor * 10)
            bgB = Math.round(42 + factor * 15)
            bgA = 255
          }

          let curR = bgR, curG = bgG, curB = bgB, curA = bgA

          // Check each diamond
          // Diamonds are rotated 45 degrees
          // To calculate SDF in diamond local coordinates rotated 45 deg:
          // dx = px - (cx + d.cx), dy = py - (cy + d.cy)
          // rotate by -45 deg:
          // rx = (dx + dy) * 0.70710678, ry = (dy - dx) * 0.70710678
          for (const d of diamonds) {
            const dx = px - (cx + d.cx)
            const dy = py - (cy + d.cy)
            const cos45 = 0.70710678118
            const rx = (dx + dy) * cos45
            const ry = (dy - dx) * cos45

            const dist = sdRoundedBox(rx, ry, S, S, R)

            // Anti-aliased coverage
            if (dist < 1.0) {
              const coverage = Math.min(1, Math.max(0, 0.5 - dist))
              if (coverage > 0) {
                let colorR = d.color[0]
                let colorG = d.color[1]
                let colorB = d.color[2]

                // For the right navy diamond on dark background, give it a sleek lighter inner rim
                if (d.isNavy && (theme === 'dark' || isMaskable || theme === 'apple')) {
                  // highlight border
                  colorR = 45; colorG = 65; colorB = 110
                  if (dist < -2) {
                    colorR = 26; colorG = 38; colorB = 74
                  }
                }

                // Blend over current sample
                const invA = 1 - coverage
                curR = Math.round(curR * invA + colorR * coverage)
                curG = Math.round(curG * invA + colorG * coverage)
                curB = Math.round(curB * invA + colorB * coverage)
                curA = Math.round(curA * invA + 255 * coverage)
              }
            }
          }

          accumR += curR
          accumG += curG
          accumB += curB
          accumA += curA
        }
      }

      const pixelIndex = (y * width + x) * 4
      buffer[pixelIndex] = Math.round(accumR / sampleCount)
      buffer[pixelIndex + 1] = Math.round(accumG / sampleCount)
      buffer[pixelIndex + 2] = Math.round(accumB / sampleCount)
      buffer[pixelIndex + 3] = Math.round(accumA / sampleCount)
    }
  }

  return buffer
}

// Generate SVG vector icon
function generateSVG({ isMaskable = false }) {
  const size = 512
  const center = size / 2
  const scale = isMaskable ? 0.75 : 1.0

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B132B" />
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A1A" />
      <stop offset="100%" stop-color="#FF5A00" />
    </linearGradient>
    <linearGradient id="navyDiamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3B62" />
      <stop offset="100%" stop-color="#18233C" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="${isMaskable ? 0 : 108}" fill="url(#bgGrad)" />

  <!-- Lumo 4-Diamond Emblem -->
  <g transform="translate(${center}, ${center}) scale(${scale})">
    <!-- Top Orange Diamond -->
    <rect x="-42" y="-128" width="84" height="84" rx="22" transform="rotate(45 0 -86)" fill="url(#orangeGrad)" filter="url(#subtleShadow)" />
    <!-- Left Orange Diamond -->
    <rect x="-128" y="-42" width="84" height="84" rx="22" transform="rotate(45 -86 0)" fill="url(#orangeGrad)" filter="url(#subtleShadow)" />
    <!-- Bottom Orange Diamond -->
    <rect x="-42" y="44" width="84" height="84" rx="22" transform="rotate(45 0 86)" fill="url(#orangeGrad)" filter="url(#subtleShadow)" />
    <!-- Right Dark Navy Diamond with illuminated border -->
    <rect x="44" y="-42" width="84" height="84" rx="22" transform="rotate(45 86 0)" fill="url(#navyDiamondGrad)" stroke="#3B4F7D" stroke-width="3" filter="url(#subtleShadow)" />
  </g>
</svg>`
}

async function main() {
  const publicDir = path.resolve('public')
  const iconsDir = path.resolve(publicDir, 'icons')
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  console.log('Generating PWA icons...')

  // 1. Generate SVGs
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), generateSVG({ isMaskable: false }))
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon.svg'), generateSVG({ isMaskable: true }))
  console.log('✓ SVGs created')

  // 2. 512x512 standard
  const buf512 = renderLumoIcon(512, 512, { isMaskable: false, theme: 'dark' })
  const png512 = encodePNG(512, 512, buf512)
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512)
  console.log('✓ icon-512x512.png created')

  // 3. 192x192 standard
  const buf192 = renderLumoIcon(192, 192, { isMaskable: false, theme: 'dark' })
  const png192 = encodePNG(192, 192, buf192)
  fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192)
  console.log('✓ icon-192x192.png created')

  // 4. 512x512 maskable (central 80% safe circle)
  const bufMaskable512 = renderLumoIcon(512, 512, { isMaskable: true, theme: 'dark' })
  const pngMaskable512 = encodePNG(512, 512, bufMaskable512)
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.png'), pngMaskable512)
  console.log('✓ maskable-icon-512x512.png created')

  // 5. 192x192 maskable
  const bufMaskable192 = renderLumoIcon(192, 192, { isMaskable: true, theme: 'dark' })
  const pngMaskable192 = encodePNG(192, 192, bufMaskable192)
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon-192x192.png'), pngMaskable192)
  console.log('✓ maskable-icon-192x192.png created')

  // 6. 180x180 Apple touch icon
  const bufApple = renderLumoIcon(180, 180, { isMaskable: false, theme: 'apple' })
  const pngApple = encodePNG(180, 180, bufApple)
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple)
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), pngApple)
  console.log('✓ apple-touch-icon.png created')

  // 7. Favicons (32x32, 16x16, favicon.ico)
  const buf32 = renderLumoIcon(32, 32, { isMaskable: false, theme: 'dark' })
  const png32 = encodePNG(32, 32, buf32)
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32)
  fs.writeFileSync(path.join(publicDir, 'icon-dark-32x32.png'), png32)

  const buf16 = renderLumoIcon(16, 16, { isMaskable: false, theme: 'dark' })
  const png16 = encodePNG(16, 16, buf16)
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16)

  const icoBuf = encodeICO(png32)
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf)
  console.log('✓ Favicons created')

  console.log('All PWA and favicon assets generated successfully.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
