"use strict";

// Sıfır bağımlılıklı test paketi (node:test). Çalıştırma: `npm test` veya
// `node --test`. Testler izole bir geçici db.json ve sabit AUTH_SECRET kullanır.

const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

// Server modülü yüklenmeden ÖNCE ortam değişkenlerini ayarla.
const TMP_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "apartai-test-")), "db.json");
process.env.APARTAI_DB_FILE = TMP_DB;
process.env.AUTH_SECRET = "test-secret-do-not-use-in-prod";
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
    fs.rmSync(path.dirname(TMP_DB), { recursive: true, force: true });
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
