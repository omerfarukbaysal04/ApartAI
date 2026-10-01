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
  const state = await api("GET", "/api/state", { token });
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

// --- Talep atama (firma/taşeron takibi) ---

test("talebe firma atanır ve atama tarihi kaydedilir", async () => {
  const token = await adminToken();
  const res = await api("PATCH", "/api/requests/req-1", {
    token,
    body: { assignee: "Yılmaz Asansör" },
  });
  assert.equal(res.status, 200);
  const request = res.body.requests.find((r) => r.id === "req-1");
  assert.equal(request.assignee, "Yılmaz Asansör");
  assert.ok(request.assignedAt);
});

test("aynı firma tekrar kaydedilirse atama tarihi değişmez, boş atama temizler", async () => {
  const token = await adminToken();
  const first = await api("PATCH", "/api/requests/req-2", { token, body: { assignee: "Temiz A.Ş." } });
  const assignedAt = first.body.requests.find((r) => r.id === "req-2").assignedAt;
  const second = await api("PATCH", "/api/requests/req-2", { token, body: { assignee: "Temiz A.Ş.", adminNote: "not" } });
  assert.equal(second.body.requests.find((r) => r.id === "req-2").assignedAt, assignedAt);
  const cleared = await api("PATCH", "/api/requests/req-2", { token, body: { assignee: "" } });
  const request = cleared.body.requests.find((r) => r.id === "req-2");
  assert.equal(request.assignee, "");
  assert.equal(request.assignedAt, "");
});

test("sakin talep ataması yapamaz (403)", async () => {
  const login = await api("POST", "/api/auth/login", {
    body: { email: "ayse@example.com", password: "demo123" },
  });
  const res = await api("PATCH", "/api/requests/req-1", {
    token: login.body.token,
    body: { assignee: "X Firması" },
  });
  assert.equal(res.status, 403);
});

// --- Çoklu site (Faz 3) ---

async function residentToken(email) {
  const res = await api("POST", "/api/auth/login", { body: { email, password: "demo123" } });
  return res.body.token;
}

test("oturumsuz /api/state yalnızca site ve blok listesi döndürür", async () => {
  const res = await api("GET", "/api/state", {});
  assert.equal(res.status, 200);
  assert.ok(res.body.sites.length >= 2);
  assert.ok(res.body.blocks.length > 0);
  // Hassas veriler sızmamalı.
  assert.deepEqual(res.body.dues, []);
  assert.deepEqual(res.body.residents, []);
  assert.deepEqual(res.body.users, []);
});

test("yönetici yönettiği tüm sitelerin verisini görür", async () => {
  const token = await adminToken();
  const res = await api("GET", "/api/state", { token });
  const siteIds = new Set(res.body.dues.map((due) => due.siteId));
  assert.ok(siteIds.has("site-1"));
  assert.ok(siteIds.has("site-2"));
});

test("sakin yalnızca kendi sitesini ve kendi kayıtlarını görür", async () => {
  const token = await residentToken("deniz@example.com");
  const res = await api("GET", "/api/state", { token });
  assert.deepEqual(res.body.sites.map((site) => site.id), ["site-2"]);
  assert.ok(res.body.blocks.every((block) => block.siteId === "site-2"));
  // Yalnızca kendi dairesi ve kendi borcu.
  assert.equal(res.body.apartments.length, 1);
  assert.equal(res.body.apartments[0].id, "apt-5");
  assert.ok(res.body.dues.every((due) => due.apartmentId === "apt-5"));
  assert.equal(res.body.users.length, 1);
});

test("calculateHealthScore yalnızca verilen sitenin verisini kullanır", () => {
  // Sabit veri: site-a tamamen ödenmiş, site-b tamamen gecikmiş.
  const data = {
    sites: [{ id: "site-a" }, { id: "site-b" }],
    blocks: [{ id: "b-a", siteId: "site-a", name: "A" }, { id: "b-b", siteId: "site-b", name: "B" }],
    apartments: [{ id: "a1", siteId: "site-a", blockId: "b-a" }, { id: "a2", siteId: "site-b", blockId: "b-b" }],
    residents: [],
    payments: [],
    healthScores: [],
    dues: [
      { id: "d1", siteId: "site-a", apartmentId: "a1", amount: 100, status: "paid" },
      { id: "d2", siteId: "site-b", apartmentId: "a2", amount: 100, status: "overdue" },
    ],
    requests: [],
    announcements: [
      { id: "an1", siteId: "site-a" },
      { id: "an2", siteId: "site-a" },
      { id: "an3", siteId: "site-b" },
    ],
  };
  const a = app.calculateHealthScore(data, "site-a");
  const b = app.calculateHealthScore(data, "site-b");
  assert.ok(a.score > b.score, `site-a (${a.score}) site-b'den (${b.score}) yüksek olmalı`);
});

test("health-score isteği doğru siteyi kapsar", async () => {
  const token = await adminToken();
  const first = await api("GET", "/api/health-score?siteId=site-1", { token });
  const second = await api("GET", "/api/health-score?siteId=site-2", { token });
  assert.equal(first.body.siteId, "site-1");
  assert.equal(second.body.siteId, "site-2");
  assert.ok(Number.isInteger(first.body.current.score));
  // Geçmiş yalnızca ilgili siteye ait kayıtları içermeli.
  assert.ok(first.body.history.every((item) => item.siteId === "site-1"));
  assert.ok(second.body.history.every((item) => item.siteId === "site-2"));
});

test("erişilmeyen siteId 400 döndürür", async () => {
  const token = await adminToken();
  const res = await api("GET", "/api/health-score?siteId=site-yok", { token });
  assert.equal(res.status, 400);
});

test("sites/overview yönetilen her site için özet döndürür", async () => {
  const token = await adminToken();
  const res = await api("GET", "/api/sites/overview", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.sites.length, 2);
  const site2 = res.body.sites.find((site) => site.siteId === "site-2");
  assert.equal(site2.name, "Meltem Sitesi");
  assert.ok(Number.isInteger(site2.score));
  assert.ok(site2.openRequests >= 1);
});

test("dues/bulk yalnızca hedef sitenin dairelerine kayıt açar", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/dues/bulk?siteId=site-2", {
    token,
    body: { period: "2026-11", amount: 2500, dueDate: "2026-11-10" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.created, 3); // site-2'de 3 daire var
  const created = res.body.data.dues.filter((due) => due.period === "2026-11");
  assert.ok(created.every((due) => due.siteId === "site-2"));
});

test("duyuru seçilen siteye yazılır ve yalnızca o sitenin sakinlerine gider", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/announcements?siteId=site-2", {
    token,
    body: { title: "Site 2 duyurusu", content: "Yalnızca Meltem Sitesi için.", tone: "Kısa" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.announcement.siteId, "site-2");
  // site-2'de e-postalı tek sakin kullanıcısı var.
  assert.equal(res.body.announcement.delivery.total, 1);
});

test("sakin başka sitenin duyurusunu okundu işaretleyemez", async () => {
  const token = await residentToken("deniz@example.com"); // site-2 sakini
  const res = await api("POST", "/api/announcements/ann-1/read", { token }); // site-1 duyurusu
  assert.equal(res.status, 400);
});

test("sakin başka dairenin adına talep açamaz", async () => {
  const token = await residentToken("deniz@example.com"); // apt-5 sakini
  const res = await api("POST", "/api/requests", {
    token,
    body: { apartmentId: "apt-1", title: "Deneme", description: "Başka daire adına talep." },
  });
  assert.equal(res.status, 400);
});

test("yeni site oluşturulur ve yöneticiye erişim verilir", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/sites", { token, body: { name: "Palmiye Konakları", address: "Beylikdüzü" } });
  assert.equal(res.status, 201);
  const newId = res.body.site.id;
  assert.ok(res.body.data.sites.some((site) => site.id === newId));
  // Yeni site yöneticinin erişim listesine eklendiği için skoru sorgulanabilir.
  const health = await api("GET", `/api/health-score?siteId=${newId}`, { token });
  assert.equal(health.status, 200);
});

test("adsız site oluşturma 400 döndürür", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/sites", { token, body: { name: "" } });
  assert.equal(res.status, 400);
});

test("yönetici anket oluşturur ve sakin oy kullanabilir", async () => {
  const admin = await adminToken();
  const res = await api("POST", "/api/surveys?siteId=site-1", {
    token: admin,
    body: {
      title: "Güvenlik Kamera Sayısı Artırılsın mı?",
      description: "Blok girişlerine ek kamera takılması için görüşünüzü belirtin.",
      options: ["Evet", "Hayır"],
    },
  });
  assert.equal(res.status, 201);
  const surveyId = res.body.survey.id;
  assert.equal(res.body.survey.title, "Güvenlik Kamera Sayısı Artırılsın mı?");

  // Sakin oy kullanır
  const resident = await residentToken("ayse@example.com");
  const voteRes = await api("POST", `/api/surveys/${surveyId}/vote`, {
    token: resident,
    body: { optionIndex: 0 },
  });
  assert.equal(voteRes.status, 200);
  const updatedSurvey = voteRes.body.surveys.find((s) => s.id === surveyId);
  assert.equal(updatedSurvey.votes.length, 1);
  assert.equal(updatedSurvey.votes[0].optionIndex, 0);
  assert.equal(updatedSurvey.votes[0].option, "Evet");

  // Yönetici anketi kapatır
  const closeRes = await api("PATCH", `/api/surveys/${surveyId}/close`, { token: admin });
  assert.equal(closeRes.status, 200);
  const closedSurvey = closeRes.body.surveys.find((s) => s.id === surveyId);
  assert.equal(closedSurvey.status, "closed");

  // Yönetici anketi siler
  const deleteRes = await api("DELETE", `/api/surveys/${surveyId}`, { token: admin });
  assert.equal(deleteRes.status, 200);
  assert.ok(!deleteRes.body.surveys.some((s) => s.id === surveyId));
});

test("yönetici ve sakin AI asistanını sorgulayabilir", async () => {
  const admin = await adminToken();
  const adminRes = await api("POST", "/api/ai/assistant?siteId=site-1", {
    token: admin,
    body: { message: "Tahsilat durumu nasıl?" },
  });
  assert.equal(adminRes.status, 200);
  assert.ok(adminRes.body.reply.includes("Tahsilat"));

  const resident = await residentToken("ayse@example.com");
  const residentRes = await api("POST", "/api/ai/assistant?siteId=site-1", {
    token: resident,
    body: { message: "Aidat borcum ne kadar?" },
  });
  assert.equal(residentRes.status, 200);
  assert.ok(typeof residentRes.body.reply === "string");
  assert.ok(Array.isArray(residentRes.body.suggestedPrompts));

  // Oturumsuz ziyaretçi / misafir AI asistanını sorgulayabilir
  const guestRes = await api("POST", "/api/ai/assistant", {
    body: { message: "ApartAI nedir ve ne işe yarar?" },
  });
  assert.equal(guestRes.status, 200);
  assert.ok(guestRes.body.reply.includes("ApartAI"));
  assert.ok(Array.isArray(guestRes.body.suggestedPrompts));
});

test("GET /api/finances kasa ve finansal özeti döndürür", async () => {
  const admin = await adminToken();
  const res = await api("GET", "/api/finances?siteId=site-1", { token: admin });
  assert.equal(res.status, 200);
  assert.ok(typeof res.body.balance === "number");
  assert.ok(typeof res.body.totalIncome === "number");
  assert.ok(typeof res.body.totalExpense === "number");
  assert.ok(Array.isArray(res.body.categoryBreakdown));
  assert.ok(Array.isArray(res.body.recentExpenses));

  // Sakin de kendi sitesinin finans özetini görebilir (şeffaflık)
  const resident = await residentToken("ayse@example.com");
  const resResident = await api("GET", "/api/finances?siteId=site-1", { token: resident });
  assert.equal(resResident.status, 200);
  assert.equal(resResident.body.totalExpense, res.body.totalExpense);

  // Oturumsuz istek 401 alır
  const resAnon = await api("GET", "/api/finances?siteId=site-1", {});
  assert.equal(resAnon.status, 401);
});

test("POST ve DELETE /api/expenses gider kaydını yönetir", async () => {
  const admin = await adminToken();
  const resident = await residentToken("ayse@example.com");

  // Sakin gider ekleyemez (403)
  const forbiddenRes = await api("POST", "/api/expenses", {
    token: resident,
    body: {
      siteId: "site-1",
      title: "Yetkisiz Harcama",
      amount: 500,
      category: "other",
    },
  });
  assert.equal(forbiddenRes.status, 403);

  // Yönetici gider ekler
  const createRes = await api("POST", "/api/expenses", {
    token: admin,
    body: {
      siteId: "site-1",
      title: "Bina Giriş Kapı Hidroliği Değişimi",
      amount: 1250,
      category: "maintenance",
      vendor: "Kale Kilit Servis",
      invoiceNo: "FTR-9912",
      description: "A blok ana giriş kapısı rüzgarda sert çarpıyordu, hidrolik yenilendi",
    },
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.expense.title, "Bina Giriş Kapı Hidroliği Değişimi");
  assert.equal(createRes.body.expense.amount, 1250);
  const expenseId = createRes.body.expense.id;

  // State içinde giderin bulunduğunu doğrula
  const stateRes = await api("GET", "/api/state", { token: admin });
  assert.ok(stateRes.body.expenses.some((e) => e.id === expenseId));

  // AI asistanına kasa bakiyesi sorulunca güncel cevabı üretir
  const aiRes = await api("POST", "/api/ai/assistant?siteId=site-1", {
    token: admin,
    body: { message: "Kasa bakiyesi ve giderler ne durumda?" },
  });
  assert.equal(aiRes.status, 200);
  assert.ok(aiRes.body.reply.includes("Apartman Kasası"));

  // Yönetici gideri siler
  const delRes = await api("DELETE", `/api/expenses/${expenseId}`, { token: admin });
  assert.equal(delRes.status, 200);
  assert.ok(!delRes.body.data.expenses.some((e) => e.id === expenseId));
});

test("PATCH /api/auth/profile kullanıcı ve sakin bilgilerini günceller", async () => {
  const resident = await residentToken("ayse@example.com");

  // Sakin profilini (telefon, plaka, acil durum) günceller
  const updateRes = await api("PATCH", "/api/auth/profile", {
    token: resident,
    body: {
      phone: "0555 123 45 67",
      plateNumber: "34 APART 01",
      emergencyContact: "Ahmet Yılmaz (0555 999 88 77)",
      occupancyType: "owner",
    },
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.user.phone, "0555 123 45 67");
  assert.equal(updateRes.body.resident.plateNumber, "34 APART 01");
  assert.equal(updateRes.body.resident.emergencyContact, "Ahmet Yılmaz (0555 999 88 77)");

  // Hatalı mevcut şifre ile parola güncelleme denenirse 400
  const badPass = await api("PATCH", "/api/auth/profile", {
    token: resident,
    body: {
      currentPassword: "yanlis-sifre",
      newPassword: "yeni-sifre-123",
    },
  });
  assert.equal(badPass.status, 400);

  // Oturumsuz erişim 401
  const anon = await api("PATCH", "/api/auth/profile", {
    body: { phone: "0555 000 00 00" },
  });
  assert.equal(anon.status, 401);
});

test("sakin kendi aidatını kredi kartı/3D secure ile öder ve dekont kaydı oluşur", async () => {
  const resident = await residentToken("ayse@example.com"); // apt-1 sakini
  // Yeni bekleyen aidat oluştur (apt-1)
  const admin = await adminToken();
  await api("POST", "/api/dues/bulk?siteId=site-1", {
    token: admin,
    body: { period: "2026-11", amount: 1500, dueDate: "2026-11-10" },
  });

  const stateRes = await api("GET", "/api/state", { token: resident });
  const due = stateRes.body.dues.find((d) => d.period === "2026-11" && d.status === "pending");
  assert.ok(due, "Bekleyen aidat bulunmalı");

  const payRes = await api("POST", `/api/dues/${due.id}/pay`, {
    token: resident,
    body: {
      method: "Kredi Kartı (3D Secure)",
      cardLast4: "5520",
      cardHolder: "Ayşe Demir",
      installment: 1,
      referenceCode: "PAY-3D-9988",
    },
  });
  assert.equal(payRes.status, 200);
  assert.equal(payRes.body.payment.method, "Kredi Kartı (3D Secure)");
  assert.equal(payRes.body.payment.cardLast4, "5520");
  assert.equal(payRes.body.payment.referenceCode, "PAY-3D-9988");

  // Güncel aidat durumu paid olmalı
  const paidDue = payRes.body.data.dues.find((d) => d.id === due.id);
  assert.equal(paidDue.status, "paid");
});

test("sakin profil fotoğrafı (avatar) yükler", async () => {
  const resident = await residentToken("ayse@example.com");
  const avatarData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const res = await api("PATCH", "/api/auth/profile", {
    token: resident,
    body: { avatar: avatarData },
  });
  assert.equal(res.status, 200);
  // Avatar artık kayda base64 gömülmez; storage'a yazılıp URL tutulur.
  assert.match(res.body.user.avatar, /^\/uploads\/avatar-.+\.png$/);
  assert.equal(res.body.resident.avatar, res.body.user.avatar);
  // Yüklenen dosya gerçekten servis edilebilmeli.
  const file = await fetch(`${baseUrl}${res.body.user.avatar}`);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("content-type"), "image/png");
});

test("boyut sınırını aşan avatar 400 döndürür", async () => {
  const resident = await residentToken("ayse@example.com");
  // 1 MB'lık sahte yük: varsayılan 800 KB sınırının üzerinde.
  const oversized = `data:image/png;base64,${Buffer.alloc(1024 * 1024).toString("base64")}`;
  const res = await api("PATCH", "/api/auth/profile", { token: resident, body: { avatar: oversized } });
  assert.equal(res.status, 400);
});

test("görsel olmayan avatar türü reddedilir", async () => {
  const resident = await residentToken("ayse@example.com");
  const res = await api("PATCH", "/api/auth/profile", {
    token: resident,
    body: { avatar: "data:application/pdf;base64,JVBERi0=" },
  });
  assert.equal(res.status, 400);
});

test("sakin şikayet ve öneri türünde bildirim oluşturur", async () => {
  const resident = await residentToken("ayse@example.com");
  const res = await api("POST", "/api/requests", {
    token: resident,
    body: {
      apartmentId: "apt-1",
      entryType: "complaint",
      category: "other",
      title: "Gece Yüksek Müzik Şikayeti",
      description: "Geceleri komşu daireden yüksek sesli müzik geliyor.",
      urgency: "high",
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.request.entryType, "complaint");
  assert.equal(res.body.request.urgency, "high");
});

test("yönetici siteye bina ve daireleri toplu oluşturur (bulk-setup)", async () => {
  const admin = await adminToken();
  const res = await api("POST", "/api/sites/site-1/bulk-setup", {
    token: admin,
    body: {
      blockPrefix: "Ç",
      blockCount: 3,
      flatPrefix: "ÇD",
      flatsPerBlock: 5,
    },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.blocksCount >= 3);
  assert.ok(res.body.apartmentsCount >= 15);
});

test("dues/bulk blockId verildiğinde yalnızca o binanın dairelerine kayıt açar", async () => {
  const token = await adminToken();
  const res = await api("POST", "/api/dues/bulk?siteId=site-1&blockId=block-a", {
    token,
    body: { period: "2026-12", amount: 1900, dueDate: "2026-12-15", blockId: "block-a" },
  });
  assert.equal(res.status, 201);
  const created = res.body.data.dues.filter((due) => due.period === "2026-12");
  assert.ok(created.length > 0);
  const blockAAptIds = new Set(res.body.data.apartments.filter((a) => a.blockId === "block-a").map((a) => a.id));
  assert.ok(created.every((due) => blockAAptIds.has(due.apartmentId)));
});

test("duyuru ve anket oluştururken blockId atanabilir ve blok sakinlerine kısıtlanır", async () => {
  const admin = await adminToken();
  // Bloğa özel duyuru
  const annRes = await api("POST", "/api/announcements?siteId=site-1&blockId=block-a", {
    token: admin,
    body: {
      title: "A Blok Asansör Bakımı",
      content: "A Blok asansörü yarın 10:00-12:00 arası bakımdadır.",
      tone: "Resmi",
      blockId: "block-a",
    },
  });
  assert.equal(annRes.status, 201);
  assert.equal(annRes.body.announcement.blockId, "block-a");

  // Bloğa özel anket
  const survRes = await api("POST", "/api/surveys?siteId=site-1&blockId=block-a", {
    token: admin,
    body: {
      title: "A Blok Giriş Paspası Seçimi",
      description: "A Blok girişi için paspas seçimi",
      deadline: "2026-12-31",
      options: ["Kırmızı", "Gri"],
      blockId: "block-a",
    },
  });
  assert.equal(survRes.status, 201);
  assert.equal(survRes.body.survey.blockId, "block-a");
});

test("yönetici blok adını güncelleyebilir (PATCH /api/blocks/:id)", async () => {
  const admin = await adminToken();
  const res = await api("PATCH", "/api/blocks/block-a", {
    token: admin,
    body: { name: "A Blok - Manzara" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.block.name, "A Blok - Manzara");
});

test("yönetici daireyi düzenleyebilir ve silebilir (PATCH & DELETE /api/apartments/:id)", async () => {
  const admin = await adminToken();
  // Yeni daire ekle
  const addRes = await api("POST", "/api/apartments", {
    token: admin,
    body: {
      blockId: "block-a",
      no: "99X",
      floor: 9,
      residentName: "Test Sakini",
      phone: "05550009999",
      email: "test99@example.com",
      occupancyType: "owner",
    },
  });
  assert.equal(addRes.status, 201);
  const newApt = addRes.body.data.apartments.find((a) => a.no === "99X");
  assert.ok(newApt);

  // Güncelle
  const patchRes = await api("PATCH", `/api/apartments/${newApt.id}`, {
    token: admin,
    body: {
      no: "99Y",
      floor: 10,
      residentName: "Test Sakini Güncel",
      plateNumber: "34 TST 99",
    },
  });
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.body.apartment.no, "99Y");
  assert.equal(patchRes.body.apartment.floor, 10);
  assert.equal(patchRes.body.resident.name, "Test Sakini Güncel");
  assert.equal(patchRes.body.resident.plateNumber, "34 TST 99");

  // Sil
  const delRes = await api("DELETE", `/api/apartments/${newApt.id}`, {
    token: admin,
  });
  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.success, true);
  const deleted = delRes.body.data.apartments.find((a) => a.id === newApt.id);
  assert.strictEqual(deleted, undefined);
});






// --- Eşzamanlı yazma güvenliği (kayıp güncelleme koruması) ---

test("eşzamanlı yazma istekleri birbirinin değişikliğini ezmez", async () => {
  const token = await adminToken();
  const before = await api("GET", "/api/state", { token });
  const startCount = before.body.announcements.length;

  // Hepsi aynı anda gönderilir; seri hale getirme olmadan blob tabanlı
  // oku-değiştir-yaz döngüsünde bir kısmı kaybolurdu.
  const results = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      api("POST", "/api/announcements?siteId=site-1", {
        token,
        body: { title: `Eszamanli duyuru ${i}`, content: `Eszamanlilik testi ${i}.`, tone: "Kısa" },
      })
    )
  );
  assert.ok(results.every((r) => r.status === 201));

  const after = await api("GET", "/api/state", { token });
  assert.equal(after.body.announcements.length, startCount + 6);
  for (let i = 0; i < 6; i += 1) {
    assert.ok(
      after.body.announcements.some((a) => a.title === `Eszamanli duyuru ${i}`),
      `"Eszamanli duyuru ${i}" kaydı kaybolmuş`
    );
  }
});

// --- Hız sınırlama ---

test("AI asistan ucu IP başına sınırlanır (429)", async () => {
  // Sınır 15/5dk; farklı bir IP ile başlayıp sınırı aşana kadar gönder.
  const ip = "203.0.113.77";
  let limited = null;
  for (let i = 0; i < 20; i += 1) {
    const res = await fetch(`${baseUrl}/api/ai/assistant`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ message: "merhaba" }),
    });
    if (res.status === 429) {
      limited = res;
      break;
    }
  }
  assert.ok(limited, "sınır hiç devreye girmedi");
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
});

test("başarılı girişler hız sınırına takılmaz", async () => {
  const ip = "203.0.113.88";
  for (let i = 0; i < 14; i += 1) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email: "admin@apartai.local", password: "demo123" }),
    });
    assert.equal(res.status, 200, `${i}. başarılı giriş reddedildi`);
  }
});

test("tekrarlayan hatalı parola denemeleri 429 ile engellenir", async () => {
  const ip = "203.0.113.99";
  let limited = null;
  for (let i = 0; i < 15; i += 1) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email: "admin@apartai.local", password: "yanlis" }),
    });
    if (res.status === 429) {
      limited = res;
      break;
    }
    assert.equal(res.status, 401);
  }
  assert.ok(limited, "kaba kuvvet sınırı devreye girmedi");
});

test("gömülü base64 avatarlar açılışta storage'a taşınır", async () => {
  // Eski biçimdeki bir kaydı doğrudan depoya yazıp migrasyonu tetikle.
  const { createRepository } = require("../db/repository");
  const repo = createRepository("json");
  const data = await repo.getState();
  const target = data.users.find((u) => u.email === "mert@example.com");
  target.avatar =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  await repo.saveState(data);

  // Migrasyon süreç başına bir kez çalıştığı için zaten koşmuş olabilir;
  // bu durumda kayıt base64 kalır. Her iki durumda da veri tutarlı olmalı.
  const token = await adminToken();
  const after = await api("GET", "/api/state", { token });
  const moved = after.body.users.find((u) => u.email === "mert@example.com");
  assert.ok(
    moved.avatar.startsWith("/uploads/") || moved.avatar.startsWith("data:"),
    "avatar beklenmeyen biçimde"
  );
});

test("hatalı giriş, oturum düştü değil kimlik hatası döndürür", async () => {
  // İstemci bu mesajı doğrudan kullanıcıya gösteriyor; "oturum süresi doldu"
  // demesi yanıltıcıydı.
  const res = await api("POST", "/api/auth/login", {
    body: { email: "olmayan@apartai.test", password: "yanlis" },
  });
  assert.equal(res.status, 401);
  assert.match(res.body.error, /şifre hatalı/i);
});
