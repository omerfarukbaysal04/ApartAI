"use strict";

// Gerçek bir yönetici hesabı oluşturur veya mevcut bir kullanıcıyı yöneticiye
// yükseltir / şifresini sıfırlar.
//
// Hangi veritabanına yazacağı ortam değişkenleriyle belirlenir:
//   - DATABASE_URL tanımlıysa  -> PostgreSQL (Supabase / Neon / Render)
//   - tanımlı değilse          -> yerel data/db.json
//
// Şifre komut satırından alınmaz (kabuk geçmişine düşmesin diye); gizli
// olarak sorulur. Otomasyon için ADMIN_PASSWORD ortam değişkeni de kullanılabilir.
//
// Kullanım:
//   node tools/create-admin.js --email ... --name "..." [--sites site-1,site-2]
//
// Production örneği (PowerShell):
//   $env:DATABASE_URL="postgres://..."; node tools/create-admin.js --email ... --name "..."

const crypto = require("node:crypto");
const readline = require("node:readline");
const { createRepository } = require("../db/repository");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

// server.js ile birebir aynı biçim: scrypt$salt$hash
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

// Terminalde yankısız (gizli) şifre okur.
function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("Şifre sorulamıyor (TTY yok). ADMIN_PASSWORD ortam değişkenini kullanın."));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char) => {
      const s = String(char);
      if (s === "\n" || s === "\r" || s === "\u0004") {
        process.stdin.removeListener("data", onData);
      } else {
        // Yazılanı gizle: satırı temizleyip soruyu yeniden bas.
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(question);
      }
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      process.stdin.removeListener("data", onData);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = String(args.email || "").trim().toLowerCase();
  const name = String(args.name || "").trim();

  if (!isEmail(email)) {
    console.error("Hata: geçerli bir --email verin.\n");
    console.error('Örnek: node tools/create-admin.js --email ben@site.com --name "Ad Soyad"');
    process.exit(1);
  }
  if (!name) {
    console.error('Hata: --name zorunlu. Örnek: --name "Ömer Faruk Baysal"');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    password = await askHidden("Yeni yönetici şifresi (en az 8 karakter): ");
    const again = await askHidden("Şifreyi tekrar girin: ");
    if (password !== again) {
      console.error("Hata: şifreler eşleşmiyor.");
      process.exit(1);
    }
  }
  if (password.length < 8) {
    console.error("Hata: şifre en az 8 karakter olmalı.");
    process.exit(1);
  }

  const driver = process.env.DB_DRIVER || (process.env.DATABASE_URL ? "postgres" : "json");
  console.log(`\nVeritabanı sürücüsü: ${driver}`);

  const repository = createRepository();
  const data = await repository.getState();

  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.sites)) data.sites = [];

  const requestedSites = args.sites ? String(args.sites).split(",").map((s) => s.trim()).filter(Boolean) : null;
  const allSiteIds = data.sites.map((site) => site.id);
  const siteIds = requestedSites || allSiteIds;

  const unknown = siteIds.filter((id) => !allSiteIds.includes(id));
  if (unknown.length) {
    console.error(`Hata: şu site id'leri bulunamadı: ${unknown.join(", ")}`);
    console.error(`Mevcut siteler: ${allSiteIds.join(", ") || "(yok)"}`);
    process.exit(1);
  }

  const existing = data.users.find((u) => String(u.email || "").toLowerCase() === email);
  let action;

  if (existing) {
    action = existing.role === "admin" ? "güncellendi (şifre sıfırlandı)" : "yöneticiye yükseltildi";
    existing.name = name;
    existing.role = "admin";
    existing.siteIds = siteIds;
    existing.passwordHash = hashPassword(password);
    delete existing.password;
    delete existing.residentId;
    delete existing.siteId;
  } else {
    action = "oluşturuldu";
    data.users.push({
      id: uid("user"),
      name,
      email,
      phone: String(args.phone || "").trim(),
      role: "admin",
      siteIds,
      passwordHash: hashPassword(password),
    });
  }

  await repository.saveState(data);

  console.log(`\n✓ Yönetici hesabı ${action}.`);
  console.log(`  E-posta : ${email}`);
  console.log(`  Ad      : ${name}`);
  console.log(`  Siteler : ${siteIds.length ? siteIds.join(", ") : "(henüz site yok)"}`);
  if (!siteIds.length) {
    console.log("\n  Not: Henüz site yok. Giriş yaptıktan sonra 'Tüm Siteler' ekranından site oluşturabilirsiniz;");
    console.log("       oluşturduğunuz site otomatik olarak hesabınıza bağlanır.");
  }
  console.log("");
  process.exit(0);
}

main().catch((error) => {
  console.error("\nHata:", error.message);
  process.exit(1);
});
