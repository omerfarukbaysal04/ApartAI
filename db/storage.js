"use strict";

// Dosya saklama katmanı (storage seam).
//
// Talep fotoğrafları MVP'de db.json içine base64 olarak gömülüyordu; bu
// ölçeklenmez. Bu modül ikili veriyi gerçek dosyalara yazar ve geri bir
// genel URL döndürür.
//
// Varsayılan sürücü yerel dosya sistemidir (bağımlılıksız). S3'e geçmek için
// `S3Storage` aynı arayüzü (init/saveDataUrl/remove) uygular ve
// `STORAGE_DRIVER=s3` ile devreye alınır.

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "uploads");
const PUBLIC_PREFIX = "/uploads";

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

// Yerel dosya sistemi tabanlı storage. Dosyalar uploads/ altına yazılır ve
// /uploads/<dosya> yolundan servis edilir.
class LocalStorage {
  constructor(options = {}) {
    this.dir = options.dir || process.env.APARTAI_UPLOADS_DIR || UPLOADS_DIR;
    this.publicPrefix = options.publicPrefix || PUBLIC_PREFIX;
  }

  async init() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  // Bir data URL'yi dosyaya yazar ve { url } döndürür. Geçersizse null.
  async saveDataUrl(dataUrl, idHint = "") {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return null;
    await this.init();
    const ext = EXT_BY_MIME[parsed.mimeType.toLowerCase()] || "bin";
    const safeHint = String(idHint).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    const name = `${safeHint ? safeHint + "-" : ""}${crypto.randomBytes(8).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(this.dir, name), Buffer.from(parsed.base64, "base64"));
    return { url: `${this.publicPrefix}/${name}` };
  }

  // Bir genel URL'ye karşılık gelen dosyayı siler (yoksa sessizce geçer).
  async remove(url) {
    if (!url || !url.startsWith(`${this.publicPrefix}/`)) return;
    const name = path.basename(url);
    try {
      await fs.unlink(path.join(this.dir, name));
    } catch {
      /* dosya yoksa yok say */
    }
  }

  // serveStatic'in fiziksel yolu çözebilmesi için yardımcı.
  resolvePublicUrl(pathname) {
    if (!pathname.startsWith(`${this.publicPrefix}/`)) return null;
    const name = path.basename(decodeURIComponent(pathname));
    return path.join(this.dir, name);
  }
}

// S3 sürücüsü için yer tutucu. Aynı arayüzü (init/saveDataUrl/remove)
// AWS SDK ya da imzalı REST çağrılarıyla uygular.
class S3Storage {
  constructor() {
    throw new Error(
      "S3Storage henüz uygulanmadı. saveDataUrl/remove S3 PutObject/DeleteObject ile doldurulup STORAGE_DRIVER=s3 ile devreye alınır."
    );
  }
}

function createStorage(driver = process.env.STORAGE_DRIVER || "local") {
  switch (driver.toLowerCase()) {
    case "s3":
      return new S3Storage();
    case "local":
    default:
      return new LocalStorage();
  }
}

module.exports = { createStorage, LocalStorage, S3Storage, parseDataUrl, PUBLIC_PREFIX };
