"use strict";

// Seed ile gelen demo kullanıcı hesaplarını veritabanından kaldırır.
//
// Demo hesaplar arayüzde gösterilmiyor ama veritabanında durduğu sürece
// bilinen şifreyle (demo123) giriş yapılabilir. Canlı ortamda gerçek bir
// yönetici açtıktan sonra bu araçla temizlenmelidir.
//
// Hangi veritabanına bağlanacağı ortam değişkenleriyle belirlenir:
//   - DATABASE_URL tanımlıysa  -> PostgreSQL (Supabase / Neon / Render)
//   - tanımlı değilse          -> yerel data/db.json
//
// Varsayılan davranış KURU ÇALIŞMADIR: ne silineceğini yazar, dokunmaz.
// Gerçekten silmek için --confirm gerekir.
//
// Kullanım:
//   node tools/remove-demo-users.js                 # ne silinecek, göster
//   node tools/remove-demo-users.js --confirm       # sil
//   node tools/remove-demo-users.js --emails a@b,c@d --confirm

const { createRepository } = require("../db/repository");

// Seed dosyasıyla gelen bilinen demo hesaplar.
const DEFAULT_DEMO_EMAILS = ["admin@apartai.local", "ayse@example.com", "mert@example.com", "deniz@example.com"];

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

const norm = (value) => String(value || "").trim().toLowerCase();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = (args.emails ? String(args.emails).split(",") : DEFAULT_DEMO_EMAILS).map(norm).filter(Boolean);

  const driver = process.env.DB_DRIVER || (process.env.DATABASE_URL ? "postgres" : "json");
  console.log(`\nVeritabanı sürücüsü: ${driver}`);

  const repository = createRepository();
  const data = await repository.getState();
  if (!Array.isArray(data.users)) data.users = [];

  const doomed = data.users.filter((user) => targets.includes(norm(user.email)));
  const survivors = data.users.filter((user) => !targets.includes(norm(user.email)));

  if (!doomed.length) {
    console.log("\nSilinecek demo hesap bulunamadı. Veritabanı zaten temiz.\n");
    process.exit(0);
  }

  console.log("\nSilinecek hesaplar:");
  for (const user of doomed) {
    console.log(`  - ${user.email}  (${user.role}${user.name ? ", " + user.name : ""})`);
  }

  // Güvenlik freni: kimse yönetici olarak kalmıyorsa işlemi reddet, aksi hâlde
  // panele giriş yapılamaz hâle gelir.
  const remainingAdmins = survivors.filter((user) => user.role === "admin");
  if (!remainingAdmins.length) {
    console.error("\n✗ İşlem durduruldu: bu silme sonrasında hiç yönetici hesabı kalmıyor.");
    console.error("  Önce gerçek bir yönetici açın:");
    console.error('    node tools/create-admin.js --email ben@sirket.com --name "Ad Soyad"\n');
    process.exit(1);
  }

  console.log(`\nSilme sonrası kalacak yönetici(ler): ${remainingAdmins.map((u) => u.email).join(", ")}`);

  if (!args.confirm) {
    console.log("\nKuru çalışma — hiçbir şey silinmedi.");
    console.log("Gerçekten silmek için aynı komutu --confirm ile çalıştırın.\n");
    process.exit(0);
  }

  data.users = survivors;
  await repository.saveState(data);

  console.log(`\n✓ ${doomed.length} demo hesap silindi.`);
  console.log("  Not: Daire ve sakin kayıtlarına dokunulmadı; yalnızca giriş hesapları kaldırıldı.\n");
  process.exit(0);
}

main().catch((error) => {
  console.error("\nHata:", error.message);
  process.exit(1);
});
