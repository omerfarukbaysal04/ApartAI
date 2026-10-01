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

// server.js'teki doğrulamanın aynısı; yazdıktan sonra kontrol için kullanılır.
function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.startsWith("scrypt$")) return false;
  const [, salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(derived, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

// Terminalde yankısız (gizli) şifre okur.
//
// Önceki sürüm readline ile ayrı bir "data" dinleyicisini birlikte kullanıyordu;
// bu ikisi aynı akışı paylaşınca bazı terminallerde yazılan karakterler eksik
// yakalanabiliyordu. Ham mod (raw mode) ile karakterleri doğrudan okumak
// platformlar arasında daha güvenilir.
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    if (!input.isTTY) {
      reject(new Error("Şifre sorulamıyor (TTY yok). ADMIN_PASSWORD ortam değişkenini kullanın."));
      return;
    }
    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    let value = "";
    const finish = (err, result) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
      process.stdout.write("\n");
      if (err) reject(err);
      else resolve(result);
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          finish(null, value);
          return;
        }
        if (ch === "\u0003") {
          finish(new Error("İşlem iptal edildi."));
          return;
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        // Diğer kontrol karakterlerini yok say.
        if (ch < " ") continue;
        value += ch;
        process.stdout.write("*");
      }
    };

    input.on("data", onData);
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

  // Yazdığımızı geri okuyup girilen şifreyle doğrula. Böylece "kaydettim ama
  // giriş yapamıyorum" durumu burada yakalanır, web arayüzünde değil.
  const saved = await repository.getState();
  const check = (saved.users || []).find((u) => String(u.email || "").toLowerCase() === email);
  if (!check || !verifyPassword(password, check.passwordHash)) {
    console.error("\n✗ Doğrulama başarısız: kayıt yazıldı ama şifre geri okunduğunda eşleşmedi.");
    console.error("  Bağlantının doğru veritabanına gittiğinden emin olun ve tekrar deneyin.");
    process.exit(1);
  }

  console.log(`\n✓ Yönetici hesabı ${action} ve şifre doğrulandı.`);
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
