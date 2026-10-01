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

// Yazma kilidi için sabit danışmanlı kilit anahtarı (uygulamaya özgü, rastgele).
const WRITE_LOCK_KEY = 728413905;

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
  return migrateToMultiSite(data);
}

// Tek siteli eski kayıtları çoklu site modeline taşır: `site` -> `sites[]` ve
// tüm varlıklara `siteId` damgalanır. Zaten taşınmış veride etkisizdir.
function migrateToMultiSite(data) {
  if (!Array.isArray(data.sites)) {
    data.sites = data.site ? [data.site] : [{ id: "site-1", name: "Site", address: "" }];
    delete data.site;
  }
  if (!data.sites.length) {
    data.sites = [{ id: "site-1", name: "Site", address: "" }];
  }
  const defaultSiteId = data.sites[0].id;
  if (!Array.isArray(data.expenses) || data.expenses.length === 0) {
    try {
      if (fsSync.existsSync(SEED_FILE)) {
        const seedData = JSON.parse(fsSync.readFileSync(SEED_FILE, "utf8"));
        if (Array.isArray(seedData.expenses)) {
          data.expenses = structuredClone(seedData.expenses);
        }
      }
    } catch {}
  }
  const collections = ["blocks", "residents", "apartments", "dues", "payments", "requests", "announcements", "healthScores", "surveys", "expenses"];
  for (const name of collections) {
    if (!Array.isArray(data[name])) data[name] = [];
    for (const row of data[name]) {
      if (!row.siteId) row.siteId = defaultSiteId;
    }
  }
  for (const user of data.users) {
    if (user.role === "admin") {
      // Yönetici birden çok site yönetebilir; eski kayıtlar tüm sitelere erişir.
      if (!Array.isArray(user.siteIds)) user.siteIds = data.sites.map((site) => site.id);
    } else if (!user.siteId) {
      const resident = data.residents.find((item) => item.id === user.residentId);
      user.siteId = resident?.siteId || defaultSiteId;
    }
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

  // Tek süreçte çalışan JSON sürücüsünde süreç içi sıra yeterlidir; ek kilide
  // gerek yoktur (bkz. server.js içindeki serializeWrite).
  async withWriteLock(fn) {
    return fn();
  }
}

// PostgreSQL sürücüsü (Supabase / Neon uyumlu).
// Tüm durum apartai_state tablosundaki JSONB belgesinde atomik olarak saklanır.
// DATABASE_URL tanımlandığında otomatik olarak devreye girer.
class PostgresRepository {
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.DATABASE_URL;
    this.pool = null;
    this.seedFile = options.seedFile || process.env.APARTAI_SEED_FILE || SEED_FILE;
    this.dataFile = options.dataFile || process.env.APARTAI_DB_FILE || DATA_FILE;
  }

  async getPool() {
    if (!this.pool) {
      const { Pool } = require("pg");
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: this.connectionString && (this.connectionString.includes("localhost") || this.connectionString.includes("127.0.0.1"))
          ? false
          : { rejectUnauthorized: false },
      });
    }
    return this.pool;
  }

  async init() {
    const pool = await this.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS apartai_state (
        id text PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    const res = await pool.query("SELECT data FROM apartai_state WHERE id = 'current'");
    if (res.rows.length === 0) {
      let initialData = null;
      try {
        if (fsSync.existsSync(this.dataFile)) {
          initialData = JSON.parse(await fs.readFile(this.dataFile, "utf8"));
        } else if (fsSync.existsSync(this.seedFile)) {
          initialData = JSON.parse(await fs.readFile(this.seedFile, "utf8"));
        }
      } catch {
        initialData = { sites: [], blocks: [], apartments: [], residents: [], dues: [], payments: [], requests: [], announcements: [], surveys: [], expenses: [], users: [] };
      }
      if (initialData) {
        await pool.query(
          "INSERT INTO apartai_state (id, data, updated_at) VALUES ('current', $1, now()) ON CONFLICT (id) DO NOTHING",
          [JSON.stringify(initialData)]
        );
      }
    }
  }

  async getState() {
    await this.init();
    const pool = await this.getPool();
    const res = await pool.query("SELECT data FROM apartai_state WHERE id = 'current'");
    if (res.rows.length > 0) {
      return normalizeData(res.rows[0].data);
    }
    return normalizeData({});
  }

  async saveState(data) {
    const pool = await this.getPool();
    await pool.query(
      `INSERT INTO apartai_state (id, data, updated_at)
       VALUES ('current', $1, now())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [JSON.stringify(data)]
    );
  }

  // Yazma işlemlerini sunucu örnekleri arasında seri hale getirir.
  //
  // Tüm durum tek bir JSONB belgesinde tutulduğu için oku-değiştir-yaz döngüsü
  // korumasız bırakılırsa eşzamanlı iki istek birbirinin değişikliğini siler
  // (lost update). Postgres danışmanlı kilidi (advisory lock) isteğin tamamı
  // boyunca tutulur; böylece aynı anda yalnızca tek bir yazma akışı çalışır.
  async withWriteLock(fn) {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("SET statement_timeout = 8000");
      await client.query("SELECT pg_advisory_lock($1)", [WRITE_LOCK_KEY]);
      return await fn();
    } finally {
      try {
        await client.query("SELECT pg_advisory_unlock($1)", [WRITE_LOCK_KEY]);
      } catch {
        /* bağlantı koptuysa kilit zaten serbest kalır */
      }
      try {
        await client.query("RESET statement_timeout");
      } catch {}
      client.release();
    }
  }

  async reset() {
    const pool = await this.getPool();
    let seed = {};
    if (fsSync.existsSync(this.seedFile)) {
      seed = JSON.parse(await fs.readFile(this.seedFile, "utf8"));
    }
    await pool.query(
      `INSERT INTO apartai_state (id, data, updated_at)
       VALUES ('current', $1, now())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [JSON.stringify(seed)]
    );
    return this.getState();
  }
}

function createRepository(driver = process.env.DB_DRIVER || (process.env.DATABASE_URL ? "postgres" : "json")) {
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
