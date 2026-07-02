"use strict";

// Sıfır bağımlılıklı test paketi (node:test). Çalıştırma: `npm test` veya
// `node --test`. Testler izole bir geçici db.json ve sabit AUTH_SECRET kullanır.

const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

// Server modülü yüklenmeden ÖNCE ortam değişkenlerini ayarla.
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "apartai-test-"));
const TMP_DB = path.join(TMP_ROOT, "db.json");
process.env.APARTAI_DB_FILE = TMP_DB;
process.env.APARTAI_UPLOADS_DIR = path.join(TMP_ROOT, "uploads");
process.env.AUTH_SECRET = "test-secret-do-not-use-in-prod";
process.env.NODE_ENV = "test";
process.env.NOTIFY_DRIVER = "log";
process.env.AI_PROVIDER = "rules";
process.env.GEMINI_API_KEY = "";
process.env.OPENAI_API_KEY = "";

const app = require("../server");

let baseUrl;

test.before(async () => {
  await new Promise((resolve) => app.server.listen(0, resolve));
  baseUrl = `http://localhost:${app.server.address().port}`;
});

test.after(() => {
  app.server.close();
  try {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  } catch {
    /* yok say */
  }
});

async function api(method, pathname, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function adminToken() {
  const res = await api("POST", "/api/auth/login", {
    body: { email: "admin@apartai.local", password: "demo123" },
  });
  return res.body.token;
}

// --- Birim testleri: parola hash ---

test("hashPassword/verifyPassword doğru parolayı kabul eder", () => {
  const hash = app.hashPassword("gizli123");
  assert.ok(hash.startsWith("scrypt$"));
  assert.equal(app.verifyPassword("gizli123", hash), true);
  assert.equal(app.verifyPassword("yanlis", hash), false);
});

test("verifyPassword düz metin/boş değeri reddeder", () => {
  assert.equal(app.verifyPassword("x", "duzmetin"), false);
  assert.equal(app.verifyPassword("x", ""), false);
});

// --- Birim testleri: token ---

test("signToken/verifyToken geçerli token'ı çözer", () => {
  const token = app.signToken({ sub: "user-1", role: "admin" });
  const payload = app.verifyToken(token);
  assert.equal(payload.sub, "user-1");
  assert.equal(payload.role, "admin");
});

test("verifyToken kurcalanmış token'ı reddeder", () => {
  const token = app.signToken({ sub: "user-1", role: "admin" });
  const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
  assert.equal(app.verifyToken(tampered), null);
  assert.equal(app.verifyToken("bozuk.token"), null);
});

// --- Birim testleri: kural tabanlı analiz ---

test("analyzeComplaint kategoriyi metinden çıkarır", () => {
  const data = { blocks: [{ name: "C Blok" }], requests: [] };
  const result = app.analyzeComplaint(data, "C blok girişinde çöp kokusu var");
  assert.equal(result.category, "Temizlik");
});

// --- Birim testleri: data URL ayrıştırma (multimodal) ---

test("parseDataUrl geçerli görsel data URL'sini çözer", () => {
  const parsed = app.parseDataUrl("data:image/png;base64,AAAA");
  assert.equal(parsed.mimeType, "image/png");
  assert.equal(parsed.base64, "AAAA");
});

test("parseDataUrl geçersiz girdide null döner", () => {
  assert.equal(app.parseDataUrl(""), null);
  assert.equal(app.parseDataUrl("https://example.com/a.png"), null);
  assert.equal(app.parseDataUrl(undefined), null);
});

// --- Entegrasyon: kimlik doğrulama ---

test("doğru bilgiyle login token döndürür", async () => {
  const res = await api("POST", "/api/auth/login", {
    body: { email: "admin@apartai.local", password: "demo123" },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "admin");
  assert.equal(res.body.user.passwordHash, undefined);
});

test("yanlış parola 401 döndürür", async () => {
  const res = await api("POST", "/api/auth/login", {
    body: { email: "admin@apartai.local", password: "yanlis" },
  });
  assert.equal(res.status, 401);
});

test("eksik alanla login 400 döndürür", async () => {
  const res = await api("POST", "/api/auth/login", { body: { email: "" } });
  assert.equal(res.status, 400);
});

// --- Entegrasyon: erişim kontrolü ---

test("token olmadan admin endpoint 401", async () => {
  const res = await api("POST", "/api/dues/bulk", {
    body: { period: "2026-06", amount: 1000, dueDate: "2026-06-10" },
  });
  assert.equal(res.status, 401);
});

test("sakin admin endpoint'inde 403 alır", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/dues/bulk", {
    token: login.body.token,
    body: { period: "2026-08", amount: 1000, dueDate: "2026-08-10" },
  });
  assert.equal(res.status, 403);
});

// --- Entegrasyon: validasyon ---

test("geçersiz dönem ile dues/bulk 400", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/dues/bulk", {
    token,
    body: { period: "haziran", amount: 1000, dueDate: "2026-06-10" },
  });
  assert.equal(res.status, 400);
});

test("geçerli dues/bulk kayıt oluşturur", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/dues/bulk", {
    token,
    body: { period: "2026-09", amount: 1500, dueDate: "2026-09-10" },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.created > 0);
});

// --- Entegrasyon: UTF-8 round-trip ---

test("Türkçe karakterli talep bozulmadan saklanır", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/requests", {
    token: login.body.token,
    body: { apartmentId: "apt-1", title: "Çöp ve gürültü şikayeti", description: "Şişli girişinde çöp ve koku var." },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.request.title, "Çöp ve gürültü şikayeti");
  assert.equal(res.body.request.category, "Temizlik");
});

test("fotoğraflı talep anahtar yokken fallback ile çalışır", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/requests", {
    token: login.body.token,
    body: {
      apartmentId: "apt-1",
      title: "Asansör arızası",
      description: "Asansör kabini katta takılı kaldı.",
      photoDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.request.category, "Asansör");
  // AI anahtarı yokken görsel analiz edilemez; bayrak false olmalı.
  assert.equal(res.body.request.aiImageAnalyzed, false);
});

// --- Entegrasyon: dosya saklama (storage seam) ---

test("fotoğraf storage'a yazılır ve /uploads üzerinden servis edilir", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/requests", {
    token: login.body.token,
    body: {
      apartmentId: "apt-1",
      title: "Su kaçağı",
      description: "Banyoda su kaçağı var.",
      photoDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    },
  });
  assert.equal(res.status, 201);
  assert.match(res.body.request.photoUrl, /^\/uploads\/.+\.png$/);
  // Yazılan görsel base64 olarak db'ye gömülmemeli.
  assert.equal(res.body.request.photoDataUrl, undefined);
  // Dosya gerçekten servis edilebilmeli.
  const file = await fetch(`${baseUrl}${res.body.request.photoUrl}`);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("content-type"), "image/png");
});

test("veri dizinine statik erişim engellenir", async () => {
  const res = await fetch(`${baseUrl}/data/db.json`);
  assert.equal(res.status, 403);
});

// --- Site Sağlık Skoru (sunucu tarafı) ---

test("calculateHealthScore 0-100 arası skor ve durum üretir", () => {
  const data = {
    dues: [{ status: "paid" }, { status: "overdue" }],
    requests: [],
    apartments: [{ id: "apt-1", blockId: "b1" }],
    blocks: [{ id: "b1", name: "A Blok" }],
    announcements: [],
  };
  const result = app.calculateHealthScore(data);
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(typeof result.status === "string");
  assert.ok(Array.isArray(result.reasons) && result.reasons.length > 0);
});

test("GET /api/health-score mevcut skor ve geçmiş döndürür", async () => {
  const token = await adminToken();
  const res = await api("GET", "/api/health-score", { token });
  assert.equal(res.status, 200);
  assert.ok(Number.isInteger(res.body.current.score));
  assert.ok(Array.isArray(res.body.history));
});

test("snapshot skor geçmişine kayıt ekler", async () => {
  const token = await adminToken();
  const before = await api("GET", "/api/health-score", { token });
  const snap = await api("POST", "/api/health-score/snapshot", { token });
  assert.equal(snap.status, 201);
  assert.equal(snap.body.history.length, before.body.history.length + 1);
  assert.equal(snap.body.snapshot.score, snap.body.current.score);
});

test("sakin snapshot oluşturamaz (403)", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/health-score/snapshot", { token: login.body.token });
  assert.equal(res.status, 403);
});

// --- CSV içeri aktarma ---

test("parseApartmentCsv başlıkları kanonik alanlara eşler", () => {
  const records = app.parseApartmentCsv("Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta\nD Blok,3,2,Ali Veli,0555,ali@example.com");
  assert.equal(records.length, 1);
  assert.equal(records[0].block, "D Blok");
  assert.equal(records[0].no, "3");
  assert.equal(records[0].name, "Ali Veli");
  assert.equal(records[0].email, "ali@example.com");
});

test("parseCsvRows tırnaklı/gömülü virgüllü alanı çözer", () => {
  const rows = app.parseCsvRows('a,"b,c",d');
  assert.deepEqual(rows[0], ["a", "b,c", "d"]);
});

test("CSV import yeni blok ve daireleri oluşturur, mükerrer atlar", async () => {
  const token = await adminToken();
  const csv = [
    "Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta",
    "Z Blok,1,1,Zeynep Ak,0555 111,zeynep@example.com",
    "Z Blok,2,1,Kaan Su,0555 222,kaan@example.com",
    "A Blok,1,1,Mevcut Daire,0555,x@example.com", // A Blok/1 seed'de var -> atlanır
  ].join("\n");
  const res = await api("POST", "/api/apartments/import", { token, body: { csv } });
  assert.equal(res.status, 201);
  assert.equal(res.body.created, 2);
  assert.equal(res.body.skipped, 1);
  assert.equal(res.body.blocksCreated, 1);
  assert.ok(res.body.data.blocks.some((b) => b.name === "Z Blok"));
});

test("CSV import geçersiz e-postayı hata olarak raporlar", async () => {
  const token = await adminToken();
  const csv = "Blok,Daire No,Ad Soyad,E-posta\nY Blok,5,Hatalı,bozuk-eposta";
  const res = await api("POST", "/api/apartments/import", { token, body: { csv } });
  assert.equal(res.status, 201);
  assert.equal(res.body.created, 0);
  assert.equal(res.body.errors.length, 1);
});

test("boş CSV 400 döndürür", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/apartments/import", { token, body: { csv: "" } });
  assert.equal(res.status, 400);
});

// --- Duyuru okunma takibi ---

test("sakin duyuruyu okundu işaretler ve tekrar işaretleme idempotenttir", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const token = login.body.token;
  const annId = login.body.data.announcements[0].id;
  const first = await api("POST", `/api/announcements/${annId}/read`, { token });
  assert.equal(first.status, 200);
  const ann1 = first.body.announcements.find((a) => a.id === annId);
  assert.equal(ann1.readBy.length, 1);
  assert.equal(ann1.readBy[0].userId, login.body.user.id);
  // İkinci işaretleme kaydı çoğaltmamalı.
  const second = await api("POST", `/api/announcements/${annId}/read`, { token });
  const ann2 = second.body.announcements.find((a) => a.id === annId);
  assert.equal(ann2.readBy.length, 1);
});

test("token olmadan okundu işaretleme 401 döndürür", async () => {
  const res = await api("POST", "/api/announcements/ann-1/read", {});
  assert.equal(res.status, 401);
});

test("olmayan duyuru için okundu işaretleme 404 döndürür", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("POST", "/api/announcements/yok-boyle-duyuru/read", { token: login.body.token });
  assert.equal(res.status, 404);
});

test("yeni duyuru boş readBy listesiyle oluşturulur", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/announcements", {
    token,
    body: { title: "Okunma testi", content: "Bildirim geçmişi testi içeriği.", tone: "Kısa" },
  });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body.announcement.readBy, []);
});

// --- Bildirim katmanı (notifier seam) ---

test("duyuru yayını sakinlere bildirim iletimini kaydeder", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/announcements", {
    token,
    body: { title: "Bildirim testi", content: "Sakinlere iletim testi.", tone: "Kısa" },
  });
  assert.equal(res.status, 201);
  const delivery = res.body.announcement.delivery;
  assert.equal(delivery.driver, "log");
  assert.equal(delivery.simulated, true);
  assert.ok(delivery.total >= 2); // seed'de e-postalı en az 2 sakin var
  assert.equal(delivery.sent, delivery.total);
});

test("aidat hatırlatması bildirim iletim sonucunu kaydeder", async () => {
  const token = await adminToken();
  const state = await api("GET", "/api/state", {});
  const due = state.body.dues.find((d) => d.status !== "paid");
  const res = await api("POST", `/api/dues/${due.id}/reminder`, { token, body: {} });
  assert.equal(res.status, 200);
  const reminder = res.body.payments.filter((p) => p.method === "Hatırlatma").pop();
  assert.ok(reminder.delivery);
  assert.equal(reminder.delivery.simulated, true);
  assert.ok(["email", "sms"].includes(reminder.delivery.channel));
});

test("webhook sürücüsü URL tanımlı değilse hatayı raporlar", async () => {
  const { WebhookNotifier } = require("../db/notifier");
  const notifier = new WebhookNotifier({ url: "" });
  const result = await notifier.send({ channel: "email", to: "x@example.com", message: "test" });
  assert.equal(result.ok, false);
  assert.equal(result.driver, "webhook");
});
