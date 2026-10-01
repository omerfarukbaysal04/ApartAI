"use strict";

// Tek seferlik araç: ApartAI logosunun açık zeminli varyantını üretir.
//
// Kaynak logonun yazısı beyaz olduğu için açık renkli üst barda görünmüyor.
// Bu betik yalnızca doygunluğu düşük (gri/beyaz) ve açık pikselleri koyu
// lacivere çevirir; renkli ikon olduğu gibi kalır.
//
// Kullanım: node tools/make-light-logo.js

const fs = require("node:fs");
const zlib = require("node:zlib");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "assets", "apartai-logo-transparent.png");
const OUT = path.join(__dirname, "..", "assets", "apartai-logo-light.png");

function readChunks(buf) {
  const chunks = [];
  let offset = 8; // PNG imzası
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
  }
  return chunks;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// PNG satır filtrelerini çözerek ham RGBA elde eder.
function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[x] = v & 0xff;
    }
  }
  return out;
}

const src = fs.readFileSync(SRC);
const chunks = readChunks(src);
const ihdr = chunks.find((c) => c.type === "IHDR").data;
const width = ihdr.readUInt32BE(0);
const height = ihdr.readUInt32BE(4);
const bitDepth = ihdr[8];
const colorType = ihdr[9];

if (bitDepth !== 8 || colorType !== 6) {
  console.error(`Beklenen 8-bit RGBA değil (bitDepth=${bitDepth}, colorType=${colorType}).`);
  process.exit(1);
}

const bpp = 4;
const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
const pixels = unfilter(zlib.inflateSync(idat), width, height, bpp);

let recolored = 0;
for (let i = 0; i < pixels.length; i += 4) {
  const alpha = pixels[i + 3];
  if (alpha < 25) continue;
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  // Açık + doygunluğu düşük pikseller yazıdır; koyu laciverte çevir.
  if (lum > 165 && sat < 42) {
    pixels[i] = 17;
    pixels[i + 1] = 24;
    pixels[i + 2] = 39;
    recolored++;
  }
}

// Logo en fazla ~44px yükseklikte gösteriliyor; 2x için 128px yeterli.
// Kutu filtresiyle küçülterek dosya boyutunu düşür.
const TARGET_H = 128;
const scale = Math.min(1, TARGET_H / height);
const outW = Math.max(1, Math.round(width * scale));
const outH = Math.max(1, Math.round(height * scale));
const small = Buffer.alloc(outW * outH * bpp);
for (let y = 0; y < outH; y++) {
  const y0 = Math.floor((y * height) / outH);
  const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / outH));
  for (let x = 0; x < outW; x++) {
    const x0 = Math.floor((x * width) / outW);
    const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / outW));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        const i = (sy * width + sx) * bpp;
        const alpha = pixels[i + 3];
        // Renkleri alfa ile ağırlıklandır ki saydam kenarlar rengi kirletmesin.
        r += pixels[i] * alpha;
        g += pixels[i + 1] * alpha;
        b += pixels[i + 2] * alpha;
        a += alpha;
        n++;
      }
    }
    const o = (y * outW + x) * bpp;
    if (a > 0) {
      small[o] = Math.round(r / a);
      small[o + 1] = Math.round(g / a);
      small[o + 2] = Math.round(b / a);
      small[o + 3] = Math.round(a / n);
    }
  }
}

const ihdrOut = Buffer.from(ihdr);
ihdrOut.writeUInt32BE(outW, 0);
ihdrOut.writeUInt32BE(outH, 4);

// Filtresiz (tip 0) satırlarla yeniden paketle.
const stride = outW * bpp;
const packed = Buffer.alloc((stride + 1) * outH);
for (let y = 0; y < outH; y++) {
  packed[y * (stride + 1)] = 0;
  small.copy(packed, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
}

const out = Buffer.concat([
  src.subarray(0, 8),
  makeChunk("IHDR", ihdrOut),
  makeChunk("IDAT", zlib.deflateSync(packed, { level: 9 })),
  makeChunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync(OUT, out);
console.log(`${width}x${height} -> ${outW}x${outH}, ${recolored} piksel koyulaştırıldı -> ${path.basename(OUT)} (${Math.round(out.length / 1024)} KB)`);
