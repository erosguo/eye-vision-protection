const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = createChunk('IHDR', ihdrData)

  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3)
    rawData[offset] = 0
    for (let x = 0; x < width; x++) {
      const cx = width / 2
      const cy = height / 2
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const rx = width * 0.35
      const ry = height * 0.22
      const angle = Math.atan2(dy, dx)
      const edge = Math.sqrt((rx * rx * ry * ry) / (ry * ry * Math.cos(angle) * Math.cos(angle) + rx * rx * Math.sin(angle) * Math.sin(angle)))
      const onEye = dist <= edge * 1.05
      const irisR = width * 0.12
      const onIris = dist <= irisR
      const px = 1 + x * 3
      if (onIris) {
        rawData[offset + px] = 102
        rawData[offset + px + 1] = 126
        rawData[offset + px + 2] = 234
      } else if (onEye) {
        rawData[offset + px] = 200
        rawData[offset + px + 1] = 210
        rawData[offset + px + 2] = 240
      } else {
        rawData[offset + px] = r
        rawData[offset + px + 1] = g
        rawData[offset + px + 2] = b
      }
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)

  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc, 0)
  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

function crc32(data) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320
      } else {
        crc = crc >>> 1
      }
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets')

const icon256 = createPNG(256, 256, 15, 21, 42)
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon256)

const icon16 = createPNG(16, 16, 15, 21, 42)
fs.writeFileSync(path.join(assetsDir, 'tray-icon.png'), icon16)

function createRestPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8
  ihdrData[9] = 2
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = createChunk('IHDR', ihdrData)

  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3)
    rawData[offset] = 0
    for (let x = 0; x < width; x++) {
      const cx = width / 2
      const cy = height / 2
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const rx = width * 0.35
      const ry = height * 0.22
      const angle = Math.atan2(dy, dx)
      const edge = Math.sqrt((rx * rx * ry * ry) / (ry * ry * Math.cos(angle) * Math.cos(angle) + rx * rx * Math.sin(angle) * Math.sin(angle)))
      const onEye = dist <= edge * 1.05
      const irisR = width * 0.12
      const onIris = dist <= irisR
      const px = 1 + x * 3
      if (onIris) {
        rawData[offset + px] = 74
        rawData[offset + px + 1] = 222
        rawData[offset + px + 2] = 128
      } else if (onEye) {
        rawData[offset + px] = 200
        rawData[offset + px + 1] = 230
        rawData[offset + px + 2] = 210
      } else {
        rawData[offset + px] = r
        rawData[offset + px + 1] = g
        rawData[offset + px + 2] = b
      }
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

const icon16rest = createRestPNG(16, 16, 15, 21, 42)
fs.writeFileSync(path.join(assetsDir, 'tray-icon-rest.png'), icon16rest)

console.log('Icons generated successfully')
