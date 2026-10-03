import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const outputDirectory = new URL("../public/icons/", import.meta.url);
const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];
const segments = [
  [[135, 58], [126, 49], [115, 45], [101, 45]],
  [[101, 45], [80, 45], [66, 56], [66, 73]],
  [[66, 73], [66, 90], [80, 96], [98, 100]],
  [[98, 100], [116, 104], [128, 109], [128, 125]],
  [[128, 125], [128, 142], [114, 151], [95, 151]],
  [[95, 151], [81, 151], [69, 145], [59, 136]],
];

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let value = n;
  for (let k = 0; k < 8; k += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[n] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function cubicPoint(points, t) {
  const inverse = 1 - t;
  const a = inverse ** 3;
  const b = 3 * inverse ** 2 * t;
  const c = 3 * inverse * t ** 2;
  const d = t ** 3;
  return [
    a * points[0][0] + b * points[1][0] + c * points[2][0] + d * points[3][0],
    a * points[0][1] + b * points[1][1] + c * points[2][1] + d * points[3][1],
  ];
}

function makeStrokeSegments(scale) {
  const lines = [];
  for (const curve of segments) {
    let previous = cubicPoint(curve, 0);
    for (let step = 1; step <= 32; step += 1) {
      const next = cubicPoint(curve, step / 32);
      lines.push([previous[0] * scale, previous[1] * scale, next[0] * scale, next[1] * scale]);
      previous = next;
    }
  }
  return lines;
}

function nearStroke(x, y, lines, radius) {
  for (const [ax, ay, bx, by] of lines) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
    if ((x - (ax + t * dx)) ** 2 + (y - (ay + t * dy)) ** 2 <= radius ** 2) return true;
  }
  return false;
}

function pixelColor(x, y, size, strokes) {
  const inset = size * 0.041667;
  const radius = size * 0.208333;
  const nearestX = Math.min(Math.max(x, inset + radius), size - inset - radius);
  const nearestY = Math.min(Math.max(y, inset + radius), size - inset - radius);
  const inTile =
    x >= inset &&
    x <= size - inset &&
    y >= inset &&
    y <= size - inset &&
    (x - nearestX) ** 2 + (y - nearestY) ** 2 <= radius ** 2;

  let color = [16, 28, 43, 255];
  if (inTile) {
    const t = Math.max(0, Math.min(1, (x + y) / (2 * size)));
    const start = [52, 120, 255];
    const end = [50, 214, 154];
    color = start.map((channel, index) => Math.round(channel + (end[index] - channel) * t));
    const glowDistance = Math.hypot((x - size * 0.25) / (size * 0.75), (y - size * 0.2) / (size * 0.75));
    const glow = Math.max(0, 0.18 * (1 - glowDistance));
    color = color.map((channel) => Math.round(channel + (255 - channel) * glow));
    color.push(255);
  }
  if (nearStroke(x, y, strokes, size * 14 / 384)) return [255, 255, 255, 255];
  return color;
}

function makePng(size) {
  const supersample = 2;
  const strokes = makeStrokeSegments(size / 192);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset++] = 0;
    for (let x = 0; x < size; x += 1) {
      const samples = [0, 0, 0, 0];
      for (let sy = 0; sy < supersample; sy += 1) {
        for (let sx = 0; sx < supersample; sx += 1) {
          const color = pixelColor(x + (sx + 0.5) / supersample, y + (sy + 0.5) / supersample, size, strokes);
          for (let channel = 0; channel < 4; channel += 1) samples[channel] += color[channel];
        }
      }
      for (const value of samples) raw[offset++] = Math.round(value / (supersample * supersample));
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    pngSignature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(outputDirectory, { recursive: true });
for (const [filename, size] of sizes) {
  await writeFile(new URL(filename, outputDirectory), makePng(size));
  console.log(`Generated ${filename} (${size}×${size})`);
}