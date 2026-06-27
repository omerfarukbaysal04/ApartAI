"use strict";

// Veri erişim katmanı (repository seam).
//
// server.js veriye yalnızca bu modülün döndürdüğü repository üzerinden erişir;
// böylece depolama teknolojisi tek noktadan değiştirilebilir.
//
// Varsayılan sürücü JSON dosyasıdır (bağımlılıksız). PostgreSQL'e geçmek için
// `PostgresRepository` sınıfı aynı arayüzü (init/getState/saveState/reset)
// uygulayacak şekilde doldurulur ve `DB_DRIVER=postgres` ile devreye alınır.

const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");

function normalizeData(data) {
  if (!Array.isArray(data.users)) {
    data.users = [
      {
        id: "user-admin-1",
        name: "Ömer Faruk Baysal",
        email: "admin@apartai.local",
        phone: "05xx 000 00 00",
        role: "admin",
        password: "demo123",
      },
      ...data.residents.slice(0, 2).map((resident, index) => ({
        id: `user-resident-${index + 1}`,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        role: "resident",
        residentId: resident.id,
        password: "demo123",
      })),
    ];
  }
  return data;
}

// JSON dosyası tabanlı repository. Tüm durum tek bir db.json dosyasında tutulur.
class JsonRepository {
  constructor(options = {}) {
    this.dataFile = options.dataFile || process.env.APARTAI_DB_FILE || DATA_FILE;
    this.seedFile = options.seedFile || process.env.APARTAI_SEED_FILE || SEED_FILE;
    this.dataDir = options.dataDir || path.dirname(this.dataFile);
  }

  async init() {
    await fs.mkdir(this.dataDir, { recursive: true });
    try {
      await fs.access(this.dataFile);
    } catch {
      const seed = await fs.readFile(this.seedFile, "utf8");
      await fs.writeFile(this.dataFile, seed);
    }
  }

  async getState() {
    await this.init();
    return normalizeData(JSON.parse(await fs.readFile(this.dataFile, "utf8")));
  }

  async saveState(data) {
    await this.saveStateSync(data);
  }

  async saveStateSync(data) {
    await fs.writeFile(this.dataFile, `${JSON.stringify(data, null, 2)}\n`);
  }

  async reset() {
    await fs.copyFile(this.seedFile, this.dataFile);
    return this.getState();
  }
}

// PostgreSQL sürücüsü için yer tutucu. Aynı arayüzü (init/getState/saveState/reset)
// `pg` istemcisi ve `db/schema.sql` üzerinden uygular. Devreye almak için
// DB_DRIVER=postgres ve DATABASE_URL ayarlanır.
class PostgresRepository {
  constructor() {
    throw new Error(
      "PostgresRepository henüz uygulanmadı. db/schema.sql + 'pg' istemcisi ile doldurulup DB_DRIVER=postgres ile devreye alınır."
    );
  }
}

function createRepository(driver = process.env.DB_DRIVER || "json") {
  switch (driver.toLowerCase()) {
    case "postgres":
    case "pg":
      return new PostgresRepository();
    case "json":
    default:
      return new JsonRepository();
  }
}

module.exports = {
  createRepository,
  JsonRepository,
  PostgresRepository,
  normalizeData,
  paths: { DATA_DIR, DATA_FILE, SEED_FILE },
};
