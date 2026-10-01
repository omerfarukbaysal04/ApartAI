"use strict";

// Dosya saklama katmanı (storage seam).
//
// Talep fotoğrafları ve profil avatarları kayıtların içine base64 olarak
// gömülmez; bu modül ikili veriyi kalıcı bir yere yazar ve geri bir genel
// URL döndürür.
//
// Sürücüler:
//   - postgres (varsayılan, DATABASE_URL varsa): dosyaları `apartai_files`
//     tablosunda saklar. Render/Vercel gibi geçici diskli ortamlarda
//     yeniden başlatmadan etkilenmez, ek servis veya anahtar gerektirmez.
//   - local (varsayılan, DATABASE_URL yoksa): uploads/ klasörü — geliştirme.
//
// Ortak arayüz: init() / saveDataUrl() / remove() / read()

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PUBLIC_PREFIX = "/uploads";

// Yüklenebilecek en büyük görsel. Avatarların kayıt içine gömülüp veritabanını
// şişirmesini engellemek için sunucu tarafında da doğrulanır.
const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 800 * 1024);

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  bin: "application/octet-stream",
};

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

// Bir data URL'nin tür ve boyut olarak kabul edilebilir olup olmadığını söyler.
// { ok: true } veya { ok: false, error: "..." } döner.
function validateImageDataUrl(dataUrl, maxBytes = MAX_IMAGE_BYTES) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return { ok: false, error: "Geçersiz görsel biçimi." };
  const mime = parsed.mimeType.toLowerCase();
  if (!EXT_BY_MIME[mime]) {
    return { ok: false, error: "Yalnızca JPEG, PNG, WebP, GIF veya HEIC yüklenebilir." };
  }
  const bytes = Buffer.byteLength(parsed.base64, "base64");
  if (bytes > maxBytes) {
    return { ok: false, error: `Görsel en fazla ${Math.round(maxBytes / 1024)} KB olabilir.` };
  }
  return { ok: true, bytes, mimeType: mime };
}

function buildFileName(mimeType, idHint) {
  const ext = EXT_BY_MIME[String(mimeType).toLowerCase()] || "bin";
  const safeHint = String(idHint).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return `${safeHint ? safeHint + "-" : ""}${crypto.randomBytes(8).toString("hex")}.${ext}`;
}

function contentTypeForName(name) {
  const ext = path.extname(name).replace(".", "").toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

// Yerel dosya sistemi tabanlı storage (geliştirme). Dosyalar uploads/ altına
// yazılır ve /uploads/<dosya> yolundan servis edilir.
class LocalStorage {
  constructor(options = {}) {
    this.dir = options.dir || process.env.APARTAI_UPLOADS_DIR || UPLOADS_DIR;
    this.publicPrefix = options.publicPrefix || PUBLIC_PREFIX;
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async saveDataUrl(dataUrl, idHint = "") {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return null;
    await this.init();
    const name = buildFileName(parsed.mimeType, idHint);
    await fs.writeFile(path.join(this.dir, name), Buffer.from(parsed.base64, "base64"));
    return { url: `${this.publicPrefix}/${name}` };
  }

  async remove(url) {
    if (!url || !url.startsWith(`${this.publicPrefix}/`)) return;
    try {
      await fs.unlink(path.join(this.dir, path.basename(url)));
    } catch {
      /* dosya yoksa yok say */
    }
  }

  // { buffer, contentType } döndürür; dosya yoksa null.
  async read(pathname) {
    if (!pathname.startsWith(`${this.publicPrefix}/`)) return null;
    const name = path.basename(decodeURIComponent(pathname));
    try {
      const buffer = await fs.readFile(path.join(this.dir, name));
      return { buffer, contentType: contentTypeForName(name) };
    } catch {
      return null;
    }
  }
}

// PostgreSQL tabanlı storage. Dosyalar `apartai_files` tablosunda saklanır;
// geçici diskli barındırmada (Render free plan vb.) yeniden başlatmayı atlatır.
class PostgresStorage {
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.DATABASE_URL;
    this.publicPrefix = options.publicPrefix || PUBLIC_PREFIX;
    this.pool = null;
    this.ready = null;
  }

  async getPool() {
    if (!this.pool) {
      const { Pool } = require("pg");
      const local = this.connectionString && /localhost|127\.0\.0\.1/.test(this.connectionString);
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: local ? false : { rejectUnauthorized: false },
      });
    }
    return this.pool;
  }

  async init() {
    if (!this.ready) {
      this.ready = (async () => {
        const pool = await this.getPool();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS apartai_files (
            name text PRIMARY KEY,
            content_type text NOT NULL,
            bytes bytea NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
          );
        `);
      })();
    }
    return this.ready;
  }

  async saveDataUrl(dataUrl, idHint = "") {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return null;
    await this.init();
    const pool = await this.getPool();
    const name = buildFileName(parsed.mimeType, idHint);
    await pool.query("INSERT INTO apartai_files (name, content_type, bytes) VALUES ($1, $2, $3)", [
      name,
      parsed.mimeType.toLowerCase(),
      Buffer.from(parsed.base64, "base64"),
    ]);
    return { url: `${this.publicPrefix}/${name}` };
  }

  async remove(url) {
    if (!url || !url.startsWith(`${this.publicPrefix}/`)) return;
    await this.init();
    const pool = await this.getPool();
    await pool.query("DELETE FROM apartai_files WHERE name = $1", [path.basename(url)]);
  }

  async read(pathname) {
    if (!pathname.startsWith(`${this.publicPrefix}/`)) return null;
    await this.init();
    const pool = await this.getPool();
    const name = path.basename(decodeURIComponent(pathname));
    const res = await pool.query("SELECT content_type, bytes FROM apartai_files WHERE name = $1", [name]);
    if (!res.rows.length) return null;
    return { buffer: res.rows[0].bytes, contentType: res.rows[0].content_type || contentTypeForName(name) };
  }
}

function createStorage(driver = process.env.STORAGE_DRIVER || (process.env.DATABASE_URL ? "postgres" : "local")) {
  switch (String(driver).toLowerCase()) {
    case "postgres":
    case "pg":
      return new PostgresStorage();
    case "local":
    default:
      return new LocalStorage();
  }
}

module.exports = {
  createStorage,
  LocalStorage,
  PostgresStorage,
  parseDataUrl,
  validateImageDataUrl,
  PUBLIC_PREFIX,
  MAX_IMAGE_BYTES,
};
