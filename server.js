const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { createRepository } = require("./db/repository");
const { createStorage } = require("./db/storage");
const { createNotifier } = require("./db/notifier");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, ".env");
const DATA_DIR = path.join(ROOT, "data");
const SECRET_FILE = path.join(DATA_DIR, ".auth_secret");
loadEnvFile();
const repository = createRepository();
const storage = createStorage();
const notifier = createNotifier();
const AUTH_SECRET = resolveAuthSecret();
const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL || 60 * 60 * 24 * 7);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-nano";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_PROVIDER = (process.env.AI_PROVIDER || (GEMINI_API_KEY ? "gemini" : "openai")).toLocaleLowerCase("en-US");
const AI_DEBUG = ["1", "true", "yes"].includes(String(process.env.AI_DEBUG || "").toLocaleLowerCase("en-US"));
const MAX_AI_DEBUG_EVENTS = 20;
const aiDebugEvents = [];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function loadEnvFile() {
  if (!fsSync.existsSync(ENV_FILE)) return;
  const lines = fsSync.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveAuthSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  try {
    if (fsSync.existsSync(SECRET_FILE)) {
      const stored = fsSync.readFileSync(SECRET_FILE, "utf8").trim();
      if (stored) return stored;
    }
    const generated = crypto.randomBytes(32).toString("hex");
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    fsSync.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    return generated;
  } catch {
    // Fallback to an ephemeral secret; tokens won't survive restarts.
    return crypto.randomBytes(32).toString("hex");
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.startsWith("scrypt$")) return false;
  const [, salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const derivedBuffer = Buffer.from(derived, "hex");
  if (expectedBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signToken(payload) {
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function authUserFromRequest(req, data) {
  const payload = verifyToken(bearerToken(req));
  if (!payload?.sub) return null;
  return data.users.find((user) => user.id === payload.sub) || null;
}

async function readData() {
  const data = await repository.getState();
  if (migratePasswords(data)) {
    await writeData(data);
  }
  return data;
}

function migratePasswords(data) {
  let changed = false;
  for (const user of data.users) {
    if (user.password) {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
      changed = true;
    }
  }
  return changed;
}

async function writeData(data) {
  await repository.saveState(data);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setCorsHeaders(res, origin = "*") {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function json(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 3_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!size) {
        resolve({});
        return;
      }
      // Buffer'ları birleştirip tek seferde UTF-8 olarak çöz; aksi halde çok
      // baytlı karakterler chunk sınırında bölünüp bozulur (mojibake).
      const body = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", () => reject(new Error("Request stream error")));
  });
}

function clean(value) {
  return String(value ?? "").trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isEmail(value) {
  return EMAIL_RE.test(clean(value));
}

// Doğrulama hatası taşıyan, route'ların yakalayıp 400 döndürdüğü hata tipi.
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function ensure(condition, message) {
  if (!condition) throw new ValidationError(message);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// "data:image/jpeg;base64,...." biçimindeki bir data URL'yi mimeType + base64
// parçalarına ayırır. Geçersizse null döner (görselsiz akışa düşülür).
function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

// Bağımlılıksız CSV ayrıştırıcı: tırnaklı alan, gömülü virgül/yeni satır ve
// "" ile kaçırılmış tırnak destekler. Satır dizisi (alan dizileri) döndürür.
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => clean(cell) !== ""));
}

// Başlık adını Türkçe/İngilizce eşanlamlılardan kanonik alana eşler.
function mapCsvHeader(header) {
  const key = clean(header).toLocaleLowerCase("tr-TR");
  const aliases = {
    block: ["blok", "block", "blok adı", "blok adi"],
    no: ["daire", "daire_no", "daire no", "no", "kapı no", "kapi no"],
    floor: ["kat", "floor"],
    name: ["ad", "ad soyad", "sakin", "sakin_adi", "sakin adı", "isim", "name", "ad_soyad"],
    phone: ["telefon", "tel", "phone", "gsm"],
    email: ["eposta", "e-posta", "email", "mail", "e_posta"],
    occupancyType: ["mulkiyet", "mülkiyet", "durum", "tip", "ev_sahibi_kiraci", "ev sahibi / kiracı", "occupancy", "type"],
    plateNumber: ["plaka", "araç plakası", "arac_plakasi", "arac plakasi", "plaka no", "plate"],
    emergencyContact: ["acil durum", "acil irtibat", "acil_iletisim", "acil iletisim", "acil_irtibat", "emergency"],
  };
  for (const [canonical, list] of Object.entries(aliases)) {
    if (list.includes(key)) return canonical;
  }
  return null;
}

// CSV metnini { block, no, floor, name, phone, email } satır nesnelerine çevirir.
function parseApartmentCsv(text) {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = rows[0].map(mapCsvHeader);
  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((canonical, index) => {
      if (canonical) record[canonical] = clean(cells[index]);
    });
    return record;
  });
}

function aiStatus() {
  const enabled = AI_PROVIDER === "gemini" ? Boolean(GEMINI_API_KEY) : Boolean(OPENAI_API_KEY);
  return {
    enabled,
    provider: AI_PROVIDER,
    model: AI_PROVIDER === "gemini" ? GEMINI_MODEL : OPENAI_MODEL,
    fallbackAvailable: true,
  };
}

function recordAiAttempt(event) {
  const safeEvent = {
    time: new Date().toISOString(),
    ...event,
  };
  aiDebugEvents.unshift(safeEvent);
  aiDebugEvents.splice(MAX_AI_DEBUG_EVENTS);
  if (AI_DEBUG) {
    console.log(`[ai-debug] ${JSON.stringify(safeEvent)}`);
  }
}

function aiDebugSnapshot() {
  return {
    status: aiStatus(),
    env: {
      aiProvider: AI_PROVIDER,
      geminiModel: GEMINI_MODEL,
      geminiKeyPresent: Boolean(GEMINI_API_KEY),
      openaiModel: OPENAI_MODEL,
      openaiKeyPresent: Boolean(OPENAI_API_KEY),
      aiDebug: AI_DEBUG,
    },
    lastAttempts: aiDebugEvents,
  };
}

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

function publicData(data) {
  return {
    ...data,
    users: data.users.map(publicUser),
  };
}

const SITE_COLLECTIONS = ["blocks", "residents", "apartments", "dues", "payments", "requests", "announcements", "healthScores", "surveys", "expenses"];

// Kullanıcının erişebildiği site id'leri. Yönetici birden çok site yönetebilir;
// sakin yalnızca kendi sitesini görür.
function userSiteIds(user, data) {
  if (!user) return [];
  if (user.role === "admin") {
    const ids = Array.isArray(user.siteIds) && user.siteIds.length ? user.siteIds : data.sites.map((site) => site.id);
    return ids.filter((id) => data.sites.some((site) => site.id === id));
  }
  return user.siteId ? [user.siteId] : [];
}

function scopeToSites(data, siteIds) {
  const allow = new Set(siteIds);
  const scoped = { ...data, sites: data.sites.filter((site) => allow.has(site.id)) };
  for (const name of SITE_COLLECTIONS) {
    scoped[name] = (data[name] || []).filter((row) => allow.has(row.siteId));
  }
  return scoped;
}

// Tek bir sitenin verisi; skor/rapor hesapları bunun üzerinden çalışır.
function siteScope(data, siteId) {
  return scopeToSites(data, [siteId]);
}

// İstemciye dönen durum: oturum açmamış kullanıcı yalnızca kayıt formunun
// ihtiyaç duyduğu site/blok listesini görür; sakin yalnızca kendi kayıtlarını;
// yönetici ise yönettiği sitelerin tamamını.
function stateForUser(data, user) {
  const empty = { users: [], blocks: [], residents: [], apartments: [], dues: [], payments: [], requests: [], announcements: [], healthScores: [], surveys: [], expenses: [] };
  if (!user) {
    return { ...empty, sites: data.sites, blocks: data.blocks };
  }
  if (user.role === "resident") {
    const apartments = data.apartments.filter((item) => item.residentId === user.residentId);
    const apartmentIds = new Set(apartments.map((item) => item.id));
    return {
      ...empty,
      sites: data.sites.filter((site) => site.id === user.siteId),
      users: [publicUser(user)],
      blocks: data.blocks.filter((block) => block.siteId === user.siteId),
      residents: data.residents.filter((item) => item.id === user.residentId),
      apartments,
      dues: data.dues.filter((item) => apartmentIds.has(item.apartmentId)),
      payments: data.payments.filter((item) => apartmentIds.has(item.apartmentId)),
      requests: data.requests.filter((item) => apartmentIds.has(item.apartmentId)),
      announcements: data.announcements.filter((item) => item.siteId === user.siteId && (!item.blockId || item.blockId === "all" || apartments.some((a) => a.blockId === item.blockId))),
      surveys: (data.surveys || []).filter((item) => item.siteId === user.siteId && (!item.blockId || item.blockId === "all" || apartments.some((a) => a.blockId === item.blockId))),
      expenses: (data.expenses || []).filter((item) => item.siteId === user.siteId),
    };
  }
  const allowed = userSiteIds(user, data);
  const allow = new Set(allowed);
  const scoped = scopeToSites(data, allowed);
  return {
    ...scoped,
    users: data.users
      .filter((item) => item.id === user.id || (item.role === "resident" && allow.has(item.siteId)))
      .map(publicUser),
  };
}

function calculateFinances(rawData, siteId) {
  const data = siteId ? siteScope(rawData, siteId) : rawData;
  const dues = data.dues || [];
  const expenses = (data.expenses || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalIncome = dues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const currentPeriod = today().slice(0, 7);
  const thisMonthIncome = dues
    .filter((d) => d.status === "paid" && (d.period === currentPeriod || (d.paidDate && d.paidDate.startsWith(currentPeriod))))
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const thisMonthExpense = expenses
    .filter((e) => e.date && e.date.startsWith(currentPeriod))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const categories = {
    electricity: "Ortak Alan Elektrik",
    water: "Su & Hidrofor",
    elevator: "Asansör Bakım",
    cleaning: "Temizlik & Hijyen",
    maintenance: "Teknik Bakım",
    garden: "Bahçe & Peyzaj",
    security: "Güvenlik & Kamera",
    fixture: "Demirbaş Alımı",
    other: "Diğer Giderler",
  };

  const catSums = {};
  for (const exp of expenses) {
    const cat = exp.category || "other";
    catSums[cat] = (catSums[cat] || 0) + (exp.amount || 0);
  }

  const categoryBreakdown = Object.entries(catSums)
    .map(([cat, amount]) => ({
      category: cat,
      label: categories[cat] || cat,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    balance,
    thisMonthIncome,
    thisMonthExpense,
    thisMonthNet: thisMonthIncome - thisMonthExpense,
    categoryBreakdown,
    recentExpenses: expenses.slice(0, 20),
  };
}

// İstekteki ?siteId= değerini doğrular; yoksa kullanıcının ilk sitesine düşer.
function resolveSiteId(url, user, data) {
  const allowed = userSiteIds(user, data);
  ensure(allowed.length > 0, "Erişebileceğiniz bir site bulunamadı.");
  const requested = clean(url.searchParams.get("siteId"));
  if (!requested) return allowed[0];
  ensure(allowed.includes(requested), "Bu siteye erişim yetkiniz yok.");
  return requested;
}

// Gövdeden gelen siteId'yi doğrular (yazma uçları için).
function requireSiteAccess(siteId, user, data) {
  const allowed = userSiteIds(user, data);
  ensure(allowed.includes(siteId), "Bu siteye erişim yetkiniz yok.");
  return siteId;
}

function daysBetween(start, end) {
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
}

function recurringIssues(data) {
  const groups = {};
  data.requests.forEach((request) => {
    const apt = data.apartments.find((item) => item.id === request.apartmentId);
    const block = data.blocks.find((item) => item.id === apt?.blockId);
    const key = `${block?.name ?? "Genel"}-${request.category}`;
    groups[key] = (groups[key] ?? 0) + 1;
  });
  return Object.entries(groups)
    .filter(([, count]) => count > 1)
    .map(([label, count]) => ({ label: label.replace("-", " / "), count }));
}

// Site Sağlık Skoru: dokümandaki ağırlıklar (ödeme %35, çözüm %25, şikayet %20,
// tekrar %10, iletişim %10). İstemci ve sunucu aynı formülü kullanır.
// siteId verilirse skor yalnızca o sitenin verisinden hesaplanır.
function calculateHealthScore(rawData, siteId) {
  const data = siteId ? siteScope(rawData, siteId) : rawData;
  const totalDues = data.dues.length || 1;
  const paidRatio = data.dues.filter((due) => due.status === "paid").length / totalDues;
  const openRequests = data.requests.filter((request) => request.status !== "cozuldu" && request.status !== "reddedildi");
  const resolved = data.requests.filter((request) => request.resolvedAt);
  const avgResolutionDays = resolved.length
    ? resolved.reduce((sum, request) => sum + daysBetween(request.createdAt, request.resolvedAt), 0) / resolved.length
    : 2.5;
  const complaintDensity = Math.min(data.requests.length / Math.max(data.apartments.length, 1), 1.4);
  const recurring = recurringIssues(data);
  const recurringRatio = recurring.length ? 0.35 : 0.08;
  const communicationScore = Math.min(data.announcements.length / 4, 1);

  const paymentScore = paidRatio * 35;
  const resolutionScore = Math.max(0, 1 - avgResolutionDays / 10) * 25;
  const complaintScore = Math.max(0, 1 - complaintDensity / 1.4) * 20;
  const recurringScore = Math.max(0, 1 - recurringRatio) * 10;
  const commScore = communicationScore * 10;
  const score = Math.round(paymentScore + resolutionScore + complaintScore + recurringScore + commScore);

  const reasons = [];
  const actions = [];
  if (paidRatio < 0.85) {
    reasons.push(`Tahsilat oranı %${Math.round(paidRatio * 100)} seviyesinde.`);
    actions.push("Gecikmedeki dairelere kibar ödeme hatırlatması gönder.");
  }
  if (openRequests.length > 0) {
    reasons.push(`${openRequests.length} açık talep çözüm bekliyor.`);
    actions.push("Yüksek aciliyetli talepleri bugün içinde durumlandır.");
  }
  if (recurring.length) {
    reasons.push("Aynı blok ve kategoride tekrar eden talepler var.");
    actions.push(`${recurring[0].label} için kalıcı çözüm kontrolü planla.`);
  }
  if (data.announcements.length < 2) {
    reasons.push("Duyuru trafiği düşük, sakin bilgilendirmesi sınırlı.");
    actions.push("Haftalık kısa yönetim bilgilendirmesi yayınla.");
  }

  return {
    score,
    status: score >= 90 ? "Çok iyi" : score >= 75 ? "İyi" : score >= 60 ? "Dikkat edilmeli" : score >= 40 ? "Riskli" : "Kritik",
    reasons: reasons.length ? reasons : ["Operasyonel göstergeler dengeli ilerliyor."],
    actions: actions.length ? actions : ["Mevcut takip ritmini koru ve ay sonunda raporu paylaş."],
  };
}

function analyzeComplaint(data, text) {
  const lower = clean(text).toLocaleLowerCase("tr-TR");
  const rules = [
    ["Asansör", ["asansör", "kabin", "bakım"]],
    ["Temizlik", ["çöp", "temizlik", "koku", "kirli", "pas pas"]],
    ["Güvenlik", ["güvenlik", "kapı", "kamera", "yabancı"]],
    ["Su ve tesisat", ["su", "tesisat", "kaçak", "gider", "musluk"]],
    ["Elektrik", ["elektrik", "lamba", "ışık", "sigorta"]],
    ["Otopark", ["otopark", "araç", "park"]],
    ["Gürültü", ["gürültü", "ses", "rahatsız"]],
    ["Peyzaj", ["bahçe", "peyzaj", "ağaç", "çim"]],
  ];
  const category = rules.find(([, words]) => words.some((word) => lower.includes(word)))?.[0] ?? "Diğer";
  const urgency = ["acil", "tehlike", "patladı", "yangın", "mahsur"].some((word) => lower.includes(word))
    ? "Yüksek"
    : ["iki gündür", "koku", "çalışmıyor", "kaçak"].some((word) => lower.includes(word))
      ? "Orta"
      : "Düşük";
  const block = data.blocks.find((item) => lower.includes(item.name.toLocaleLowerCase("tr-TR").replace(" blok", "")));
  const location = block ? block.name : lower.includes("giriş") ? "Giriş alanı" : "Belirtilmedi";
  const similar = data.requests.filter((request) => request.category === category && request.location.includes(block?.name ?? "")).length;

  return {
    category,
    urgency,
    location,
    summary: text.length > 120 ? text.slice(0, 117) + "..." : text,
    action: category + " konusu için ilgili kontrol/servis kaydı açılmalı.",
    similar,
  };
}

function improveAnnouncement(content, tone) {
  const openings = {
    "Resmi": "Değerli sakinlerimiz,",
    "Kibar": "Değerli komşularımız,",
    "Kısa": "Bilgilendirme:",
    "Detaylı": "Değerli sakinlerimiz, aşağıdaki konu hakkında bilginize başvururuz:",
    "Uyarı niteliğinde": "Önemli hatırlatma:",
  };
  const closing = tone === "Kısa" ? "" : " Anlayışınız ve iş birliğiniz için teşekkür ederiz.";
  return (openings[tone] ?? openings.Kibar) + " " + clean(content) + closing;
}

function withAiMeta(result, fallbackUsed, provider = "rules", model = "fallback") {
  return {
    ...result,
    provider: fallbackUsed ? "rules" : provider,
    model: fallbackUsed ? "fallback" : model,
    fallbackUsed,
  };
}

function fallbackPaymentReminder({ resident, due }) {
  const greeting = resident?.name ? "Sayın " + resident.name + "," : "Değerli sakinimiz,";
  const statusNote = due.status === "overdue" ? "son ödeme tarihi geçtiği için" : "son ödeme tarihi yaklaşan";
  return greeting + " " + due.period + " dönemine ait " + due.amount + " TL tutarındaki aidat borcunuz " + statusNote + " ödeme beklemektedir. Uygun olduğunuzda ödemenizi tamamlamanızı rica ederiz. Teşekkürler.";
}

async function callOpenAIJson({ instructions, input, fallback, operation = "unknown", image }) {
  const photo = parseDataUrl(image);
  if (!OPENAI_API_KEY) {
    recordAiAttempt({
      operation,
      provider: "openai",
      model: OPENAI_MODEL,
      ok: false,
      hasImage: Boolean(photo),
      fallbackUsed: true,
      fallbackReason: "missing_api_key",
    });
    return withAiMeta(fallback, true);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let recordedFailure = false;
  try {
    const userContent = photo
      ? [
          { type: "input_text", text: JSON.stringify(input) },
          { type: "input_image", image_url: image },
        ]
      : JSON.stringify(input);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: instructions },
          { role: "user", content: userContent },
        ],
        text: { format: { type: "json_object" } },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      recordAiAttempt({
        operation,
        provider: "openai",
        model: OPENAI_MODEL,
        ok: false,
        httpStatus: response.status,
        fallbackUsed: true,
        fallbackReason: "http_error",
      });
      recordedFailure = true;
      throw new Error(`OpenAI ${response.status}`);
    }
    const payload = await response.json();
    const outputText =
      payload.output_text ||
      payload.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")?.text;
    const parsed = JSON.parse(outputText || "{}");
    recordAiAttempt({
      operation,
      provider: "openai",
      model: OPENAI_MODEL,
      ok: true,
      httpStatus: response.status,
      hasImage: Boolean(photo),
      fallbackUsed: false,
    });
    return withAiMeta({ ...fallback, ...parsed }, false, "openai", OPENAI_MODEL);
  } catch (error) {
    if (!recordedFailure) {
      recordAiAttempt({
        operation,
        provider: "openai",
        model: OPENAI_MODEL,
        ok: false,
        fallbackUsed: true,
        fallbackReason: error.name === "AbortError" ? "timeout" : "parse_or_network_error",
        errorName: error.name,
        errorMessage: error.message,
      });
    }
    return withAiMeta(fallback, true);
  } finally {
    clearTimeout(timeout);
  }
}

async function callGeminiJson({ instructions, input, fallback, operation = "unknown", image }) {
  const photo = parseDataUrl(image);
  if (!GEMINI_API_KEY) {
    recordAiAttempt({
      operation,
      provider: "gemini",
      model: GEMINI_MODEL,
      ok: false,
      hasImage: Boolean(photo),
      fallbackUsed: true,
      fallbackReason: "missing_api_key",
    });
    return withAiMeta(fallback, true);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  let recordedFailure = false;
  try {
    const userParts = [{ text: JSON.stringify(input) }];
    if (photo) {
      userParts.push({ inlineData: { mimeType: photo.mimeType, data: photo.base64 } });
    }
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [{ text: instructions }],
      },
      contents: [
        {
          role: "user",
          parts: userParts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const retryableStatuses = new Set([429, 500, 502, 503, 504]);
    let lastHttpError = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      });
      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = (await response.text()).slice(0, 500);
        } catch {
          errorBody = "";
        }
        lastHttpError = new Error(`Gemini ${response.status}`);
        const willRetry = retryableStatuses.has(response.status) && attempt < 3;
        recordAiAttempt({
          operation,
          provider: "gemini",
          model: GEMINI_MODEL,
          ok: false,
          attempt,
          httpStatus: response.status,
          fallbackUsed: !willRetry,
          retrying: willRetry,
          fallbackReason: willRetry ? "retryable_http_error" : "http_error",
          errorBody,
        });
        if (willRetry) {
          await delay(450 * attempt);
          continue;
        }
        recordedFailure = true;
        throw lastHttpError;
      }
      const payload = await response.json();
      const outputText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
      const parsed = JSON.parse(outputText || "{}");
      recordAiAttempt({
        operation,
        provider: "gemini",
        model: GEMINI_MODEL,
        ok: true,
        attempt,
        httpStatus: response.status,
        hasImage: Boolean(photo),
        fallbackUsed: false,
        outputPreview: outputText ? outputText.slice(0, 180) : "",
      });
      return withAiMeta({ ...fallback, ...parsed }, false, "gemini", GEMINI_MODEL);
    }

    recordedFailure = true;
    throw lastHttpError || new Error("Gemini retry loop ended without response");
  } catch (error) {
    if (!recordedFailure) {
      recordAiAttempt({
        operation,
        provider: "gemini",
        model: GEMINI_MODEL,
        ok: false,
        fallbackUsed: true,
        fallbackReason: error.name === "AbortError" ? "timeout" : "parse_or_network_error",
        errorName: error.name,
        errorMessage: error.message,
      });
    }
    return withAiMeta(fallback, true);
  } finally {
    clearTimeout(timeout);
  }
}

async function callAIJson(options) {
  if (AI_PROVIDER === "gemini") return callGeminiJson(options);
  return callOpenAIJson(options);
}

async function analyzeComplaintWithAI({ data, title, description, photoDataUrl }) {
  const fallback = analyzeComplaint(data, `${title}. ${description}`);
  const hasPhoto = Boolean(parseDataUrl(photoDataUrl));
  const photoInstruction = hasPhoto
    ? " Talebe bir fotoğraf eklendi; görseldeki arıza/durumu da değerlendirip kategori, aciliyet ve özeti buna göre belirle."
    : "";
  return callAIJson({
    operation: "analyze_complaint",
    fallback,
    image: hasPhoto ? photoDataUrl : undefined,
    instructions:
      "ApartAI için Türkçe apartman/site talebini analiz et. Sadece JSON döndür. Alanlar: category, urgency, location, summary, action. category şu değerlerden biri olmalı: Temizlik, Güvenlik, Asansör, Su ve tesisat, Elektrik, Otopark, Gürültü, Peyzaj, Diğer. urgency: Düşük, Orta veya Yüksek. summary kısa olsun. action yöneticiye uygulanabilir aksiyon olsun." +
      photoInstruction,
    input: {
      title,
      description,
      blocks: data.blocks.map((block) => block.name),
      categories: ["Temizlik", "Güvenlik", "Asansör", "Su ve tesisat", "Elektrik", "Otopark", "Gürültü", "Peyzaj", "Diğer"],
    },
  });
}

async function improveAnnouncementWithAI({ content, tone }) {
  return callAIJson({
    operation: "improve_announcement",
    fallback: { content: improveAnnouncement(content, tone) },
    instructions:
      "ApartAI yöneticisinin duyuru metnini Türkçe olarak iyileştir. Sadece JSON döndür. Alan: content. Ton isteğine uy; metin sakin, profesyonel ve apartman/site sakinlerine uygun olsun.",
    input: { content, tone },
  });
}

async function draftPaymentReminderWithAI({ resident, apartment, due }) {
  return callAIJson({
    operation: "draft_payment_reminder",
    fallback: { content: fallbackPaymentReminder({ resident, apartment, due }) },
    instructions:
      "ApartAI için Türkçe, kibar ve net aidat ödeme hatırlatma metni yaz. Sadece JSON döndür. Alan: content. Yasal tehdit veya sert ifade kullanma.",
    input: {
      residentName: resident?.name,
      apartmentNo: apartment?.no,
      period: due.period,
      amount: due.amount,
      dueDate: due.dueDate,
      status: due.status,
    },
  });
}

async function assistantQueryWithAI({ user, siteId, message, data }) {
  const targetSiteId = siteId || (user?.siteIds && user.siteIds[0]) || (data.sites && data.sites[0]?.id);
  const site = (data.sites || []).find((s) => s.id === targetSiteId);
  const blocks = (data.blocks || []).filter((b) => b.siteId === targetSiteId);
  const apartments = (data.apartments || []).filter((a) => a.siteId === targetSiteId);
  const residents = (data.residents || []).filter((r) => r.siteId === targetSiteId);
  const dues = (data.dues || []).filter((d) => d.siteId === targetSiteId);
  const requests = (data.requests || []).filter((r) => r.siteId === targetSiteId);
  const announcements = (data.announcements || []).filter((a) => a.siteId === targetSiteId);
  const surveys = (data.surveys || []).filter((s) => s.siteId === targetSiteId);
  const finances = calculateFinances(data, targetSiteId);

  const role = user?.role || "guest";
  const isGuest = role === "guest";
  const isResident = role === "resident";

  let residentContext = null;
  if (isResident) {
    const apt = apartments.find((a) => a.id === user.apartmentId);
    const resInfo = residents.find((r) => r.id === apt?.residentId);
    const block = blocks.find((b) => b.id === apt?.blockId);
    const aptDues = dues.filter((d) => d.apartmentId === apt?.id);
    const unpaidDues = aptDues.filter((d) => d.status !== "paid");
    const totalUnpaid = unpaidDues.reduce((sum, d) => sum + (d.amount || 0), 0);
    const aptRequests = requests.filter((r) => r.apartmentId === apt?.id);
    const activeSurveys = surveys.filter((s) => s.status !== "closed");
    residentContext = {
      apartmentNo: apt?.no || "-",
      blockName: block?.name || "-",
      residentName: resInfo?.name || user.name,
      occupancyType: resInfo?.occupancyType === "tenant" ? "Kiracı" : "Ev Sahibi",
      plateNumber: resInfo?.plateNumber || "Kayıtlı araç yok",
      emergencyContact: resInfo?.emergencyContact || "Belirtilmemiş",
      totalUnpaid,
      unpaidPeriods: unpaidDues.map((d) => `${d.period} (${d.amount} TL - ${d.status === "overdue" ? "Gecikmiş" : "Beklemede"})`),
      totalRequests: aptRequests.length,
      openRequests: aptRequests.filter((r) => !["cozuldu", "reddedildi"].includes(r.status)).map((r) => `${r.title} (${r.status})`),
      activeSurveys: activeSurveys.map((s) => ({
        id: s.id,
        title: s.title,
        hasVoted: (s.votes || []).some((v) => v.userId === user.id || v.apartmentId === apt?.id),
      })),
      vaultBalance: finances.balance,
      totalExpenses: finances.totalExpense,
      recentExpenses: finances.recentExpenses.slice(0, 3).map((e) => `${e.title}: ${e.amount.toLocaleString("tr-TR")} TL (${e.date})`),
    };
  }

  let adminContext = null;
  if (!isResident && !isGuest) {
    const totalDuesAmount = dues.reduce((sum, d) => sum + (d.amount || 0), 0);
    const paidDuesAmount = dues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (d.amount || 0), 0);
    const overdueDuesAmount = dues.filter((d) => d.status === "overdue").reduce((sum, d) => sum + (d.amount || 0), 0);
    const collectionRate = totalDuesAmount > 0 ? Math.round((paidDuesAmount / totalDuesAmount) * 100) : 0;
    const openReqs = requests.filter((r) => !["cozuldu", "reddedildi"].includes(r.status));
    const resolvedReqs = requests.filter((r) => r.status === "cozuldu");

    const catCounts = requests.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Yok";

    const owners = residents.filter((r) => r.occupancyType !== "tenant").length;
    const tenants = residents.filter((r) => r.occupancyType === "tenant").length;

    adminContext = {
      siteName: site?.name || "Apartman",
      apartmentCount: apartments.length,
      residentCount: residents.length,
      owners,
      tenants,
      collectionRate,
      totalDuesAmount,
      paidDuesAmount,
      overdueDuesAmount,
      pendingDuesAmount: totalDuesAmount - paidDuesAmount,
      vaultBalance: finances.balance,
      totalExpenses: finances.totalExpense,
      thisMonthIncome: finances.thisMonthIncome,
      thisMonthExpense: finances.thisMonthExpense,
      thisMonthNet: finances.thisMonthNet,
      categoryBreakdown: finances.categoryBreakdown,
      totalRequests: requests.length,
      openRequests: openReqs.length,
      resolvedRequests: resolvedReqs.length,
      topCategory,
      activeSurveysCount: surveys.filter((s) => s.status !== "closed").length,
    };
  }

  const queryLower = (message || "").toLocaleLowerCase("tr-TR");
  let fallbackReply = "";
  let suggestedPrompts = [];
  let suggestedRequest = null;

  if (isGuest) {
    suggestedPrompts = [
      "ApartAI nedir ve ne işe yarar?",
      "Yönetici olarak nasıl denerim?",
      "Sakinler aidatlarını nasıl öder?",
      "Fotoğraflı arıza bildirimi nasıl çalışır?",
    ];
    if (queryLower.includes("nedir") || queryLower.includes("nasıl") || queryLower.includes("ne işe")) {
      fallbackReply = `**ApartAI**, apartman ve site yönetim süreçlerini otomatikleştiren yapay zeka destekli akıllı bir platformdur.\n\n` +
        `- **Yöneticiler için:** Kasa ve gelir-gider takibi, finansal tahsilat, gecikme riski analizi, arızaları firmalara atama ve resmi faaliyet bülteni üretimi.\n` +
        `- **Sakinler için:** Şeffaf kasa durumu, güncel aidat borç takibi, kayıtlı araç plakası ve acil durum bilgileri, fotoğraflı arıza bildirimi ve site karar anketlerine katılım.\n\n` +
        `Yukarıdaki **"Yönetici Demosunu Başlat"** veya **"Sakin Portaline Gir"** butonlarına tıklayarak anında canlı deneyebilirsiniz!`;
    } else if (queryLower.includes("yönetici") || queryLower.includes("demo") || queryLower.includes("denerim")) {
      fallbackReply = `Yönetici panelini test etmek için üst menüdeki **"👑 Yönetici Girişi"** butonuna basarak tek tıkla demo oturumu açabilirsiniz (admin@apartai.local / demo123).`;
    } else if (queryLower.includes("aidat") || queryLower.includes("ödeme") || queryLower.includes("öde")) {
      fallbackReply = `Sakinler kendi dairelerine tahakkuk eden aidatları, son ödeme tarihlerini ve gecikme durumlarını portallerinden anlık takip edebilirler. Yönetici ise tek tıkla hatırlatma mesajı gönderebilir.`;
    } else if (queryLower.includes("fotoğraf") || queryLower.includes("arıza") || queryLower.includes("talep")) {
      fallbackReply = `Sakinler telefonlarından arızanın (örn. asansör arızası, tesisat sızıntısı) fotoğrafını çekip ilettiğinde, ApartAI görseli analiz ederek aciliyet derecesini ve ilgili tedarikçi firmayı otomatik olarak belirler.`;
    } else {
      fallbackReply = `Merhaba! Ben **ApartAI Akıllı Asistanıyım** 👋\n\nApartman ve site yönetiminde yapay zekanın sağladığı kolaylıklar hakkında bana her şeyi sorabilir veya yukarıdaki demo butonlarıyla canlı panelleri anında keşfedebilirsiniz.`;
    }
  } else if (isResident) {
    suggestedPrompts = [
      "Aidat borcum ne kadar?",
      "Apartman kasası ne durumda?",
      "Kayıtlı araç plakam nedir?",
      "Aktif bir anket var mı?",
      "Arıza talebi nasıl açarım?",
    ];
    if (queryLower.includes("kasa") || queryLower.includes("harcama") || queryLower.includes("gider") || queryLower.includes("masraf") || queryLower.includes("şeffaf")) {
      fallbackReply = `📊 **Sitemizin Güncel Kasa ve Gider Durumu (Finansal Şeffaflık):**\n\n` +
        `- **Kasa Bakiyesi:** **${residentContext.vaultBalance.toLocaleString("tr-TR")} TL**\n` +
        `- **Toplam Gider Kaydı:** ${residentContext.totalExpenses.toLocaleString("tr-TR")} TL\n\n` +
        `Son Yapılan Harcamalar:\n${residentContext.recentExpenses.map((e) => `- ${e}`).join("\n") || "Henüz kaydedilmiş gider bulunmuyor."}\n\n` +
        `Sitemizin tüm harcamaları yöneticimiz tarafından şeffaf bir şekilde sisteme işlenmektedir.`;
    } else if (queryLower.includes("aidat") || queryLower.includes("borç") || queryLower.includes("ödeme")) {
      if (residentContext.totalUnpaid > 0) {
        fallbackReply = `Dairenize (${residentContext.blockName} Blok No: ${residentContext.apartmentNo}) ait **${residentContext.totalUnpaid.toLocaleString("tr-TR")} TL** ödenmemiş aidat bakiyesi bulunmaktadır.\n\n` +
          `Dönemler:\n${residentContext.unpaidPeriods.map((p) => `- ${p}`).join("\n")}\n\n` +
          `Ödemenizi site banka hesabına daire numaranızı belirterek yapabilir veya yönetime bildirebilirsiniz.`;
      } else {
        fallbackReply = `Tebrikler! Dairenize (${residentContext.blockName} Blok No: ${residentContext.apartmentNo}) ait herhangi bir gecikmiş veya ödenmemiş aidat borcu bulunmamaktadır. Tüm dönemleriniz günceldir.`;
      }
    } else if (queryLower.includes("plaka") || queryLower.includes("araç") || queryLower.includes("araba") || queryLower.includes("otopark")) {
      fallbackReply = `Dairenize kayıtlı araç plaka bilgisi: **${residentContext.plateNumber}**.\n\nMülkiyet durumu: **${residentContext.occupancyType}**.\nAcil durum irtibatı: **${residentContext.emergencyContact}**.\nBilgilerde değişiklik varsa lütfen site yönetimine başvurunuz.`;
    } else if (queryLower.includes("anket") || queryLower.includes("oy") || queryLower.includes("karar")) {
      if (residentContext.activeSurveys.length > 0) {
        fallbackReply = `Şu anda sitemizde **${residentContext.activeSurveys.length} adet** aktif karar anketi bulunmaktadır:\n\n` +
          residentContext.activeSurveys.map((s) => `- **${s.title}** (${s.hasVoted ? "✅ Oyunuzu kullandınız" : "⚠️ Henüz oy vermediniz"})`).join("\n") +
          `\n\nSol menüdeki **Anketler** sekmesinden hemen tercihinizi belirtebilirsiniz.`;
      } else {
        fallbackReply = "Şu anda oylamaya açık aktif bir site anketi bulunmamaktadır.";
      }
    } else if (
      queryLower.includes("talep") || queryLower.includes("arıza") || queryLower.includes("şikayet") ||
      queryLower.includes("tamir") || queryLower.includes("bozuk") || queryLower.includes("ses") ||
      queryLower.includes("gürültü") || queryLower.includes("koku") || queryLower.includes("çöp") ||
      queryLower.includes("su") || queryLower.includes("musluk") || queryLower.includes("daml") ||
      queryLower.includes("asansör") || queryLower.includes("öneri")
    ) {
      let entryType = "fault";
      let category = "other";
      let urgency = "normal";
      let title = "Apartman İyileştirme Talebi";

      if (/gürültü|ses|müzik|koku|çöp|sigara|komşu|rahatsız|köpek|kedi|otopark/.test(queryLower)) {
        entryType = "complaint";
        category = /çöp|koku/.test(queryLower) ? "cleaning" : (/otopark|park/.test(queryLower) ? "security" : "other");
        title = queryLower.includes("gürültü") || queryLower.includes("ses") || queryLower.includes("müzik")
          ? "Gürültü ve Rahatsızlık Şikayeti"
          : (queryLower.includes("otopark") ? "Hatalı Park & Otopark İhlali" : "Komşuluk & Çevre Şikayeti");
        urgency = queryLower.includes("gece") || queryLower.includes("acil") ? "high" : "normal";
      } else if (/öneri|fikir|yapsak|olsa iyi olur|peyzaj|bahçe|çocuk parkı|bank/.test(queryLower)) {
        entryType = "suggestion";
        category = /bahçe|peyzaj|ağaç/.test(queryLower) ? "cleaning" : "other";
        title = "Site Geliştirme ve İyileştirme Önerisi";
        urgency = "normal";
      } else {
        entryType = "fault";
        category = /su|musluk|daml|akı|sızıntı|boru|tıkan/.test(queryLower)
          ? "plumbing"
          : (/elektrik|lamba|ampul|ışık/.test(queryLower) ? "electrical" : (/asansör/.test(queryLower) ? "elevator" : "other"));
        title = queryLower.includes("asansör")
          ? "Asansör Arızası Bildirimi"
          : (category === "plumbing" ? "Sıhhi Tesisat ve Su Sızıntısı Arızası" : (category === "electrical" ? "Aydınlatma ve Elektrik Arızası" : "Teknik Arıza ve Onarım Talebi"));
        urgency = queryLower.includes("acil") || queryLower.includes("patla") || queryLower.includes("mahsur") ? "urgent" : "normal";
      }

      suggestedRequest = {
        entryType,
        category,
        title,
        description: message,
        urgency,
      };

      fallbackReply = `İlettiğiniz durumu analiz edip sınıflandırdım:\n\n` +
        `📌 **Bildirim Türü:** ${entryType === "complaint" ? "⚠️ Şikayet Bildirimi" : (entryType === "suggestion" ? "💡 Öneri & İyileştirme" : "🛠️ Arıza Bildirimi")}\n` +
        `🏷️ **Başlık:** ${title}\n` +
        `📂 **Kategori:** ${category}\n` +
        `⚡ **Aciliyet:** ${urgency === "urgent" ? "Acil" : (urgency === "high" ? "Yüksek" : "Normal")}\n\n` +
        `Bu talebi yöneticiye göndermek için aşağıdaki onay kutusunu kullanabilirsiniz.`;
    } else if (queryLower.includes("yönetim") || queryLower.includes("iletişim") || queryLower.includes("telefon") || queryLower.includes("acil")) {
      fallbackReply = `${site?.name || "Site"} Yönetimi ile görüşmek için sistem üzerinden talep oluşturabilir veya acil durumlarda bina görevlisine başvurabilirsiniz.\nKayıtlı Acil İrtibatınız: **${residentContext.emergencyContact}**.`;
    } else {
      fallbackReply = `Merhaba Sayın ${residentContext.residentName}! Ben **ApartAI Akıllı Asistanınızım**.\n\nSize aidat borç durumunuz, site kasa ve harcama durumu, kayıtlı araç plakanız, arıza talepleriniz veya aktif site anketleri konusunda yardımcı olabilirim. Aşağıdaki sorulardan birini seçebilir veya dilediğinizi sorabilirsiniz.`;
    }
  } else {
    suggestedPrompts = [
      "Kasa bakiyesi ve giderler ne durumda?",
      "Aidat tahsilat durumu nasıl?",
      "En çok hangi konuda arıza var?",
      "Asansör bakımı için duyuru taslağı yaz",
      "Sitede kaç kiracı, kaç ev sahibi var?",
    ];
    if (queryLower.includes("kasa") || queryLower.includes("bakiye") || queryLower.includes("gider") || queryLower.includes("harcama") || queryLower.includes("masraf")) {
      fallbackReply = `💰 **${adminContext.siteName} Apartman Kasası & Harcama Durumu:**\n\n` +
        `- **Güncel Kasa Bakiyesi:** **${adminContext.vaultBalance.toLocaleString("tr-TR")} TL**\n` +
        `- **Tahsil Edilen Aidat Geliri:** ${adminContext.paidDuesAmount.toLocaleString("tr-TR")} TL\n` +
        `- **Toplam Giderler:** ${adminContext.totalExpenses.toLocaleString("tr-TR")} TL\n` +
        `- **Bu Ay Net Nakit Akışı:** ${adminContext.thisMonthNet >= 0 ? "+" : ""}${adminContext.thisMonthNet.toLocaleString("tr-TR")} TL (Gelir: ${adminContext.thisMonthIncome.toLocaleString("tr-TR")} TL / Gider: ${adminContext.thisMonthExpense.toLocaleString("tr-TR")} TL)\n\n` +
        `Detaylı harcama dağılımı, faturalar ve yeni gider girişi için **Kasa & Giderler** sekmesini kullanabilirsiniz.`;
    } else if (queryLower.includes("tahsilat") || queryLower.includes("aidat") || queryLower.includes("alacak")) {
      fallbackReply = `**${adminContext.siteName}** Güncel Finansal Durum Özeti:\n\n` +
        `- **Tahsilat Başarı Oranı:** %${adminContext.collectionRate}\n` +
        `- **Tahsil Edilen:** ${adminContext.paidDuesAmount.toLocaleString("tr-TR")} TL\n` +
        `- **Bekleyen / Kalan:** ${adminContext.pendingDuesAmount.toLocaleString("tr-TR")} TL\n` +
        `- **Gecikmiş / Riskli Alacak:** ${adminContext.overdueDuesAmount.toLocaleString("tr-TR")} TL\n\n` +
        `Aidatlar ekranından geciken dairelere tek tıkla hatırlatma mesajı gönderebilirsiniz.`;
    } else if (queryLower.includes("arıza") || queryLower.includes("talep") || queryLower.includes("şikayet") || queryLower.includes("kategori")) {
      fallbackReply = `**Teknik & Operasyonel Durum:**\n\n` +
        `- Toplam Talep: **${adminContext.totalRequests}**\n` +
        `- Devam Eden / Açık: **${adminContext.openRequests}**\n` +
        `- Çözülen: **${adminContext.resolvedRequests}**\n` +
        `- En Sık Karşılaşılan Kategori: **${adminContext.topCategory}**\n\n` +
        `Talepler sekmesinden ilgili firmaya atama yapabilir veya detayları inceleyebilirsiniz.`;
    } else if (queryLower.includes("kiracı") || queryLower.includes("ev sahibi") || queryLower.includes("malik") || queryLower.includes("oturan")) {
      fallbackReply = `**${adminContext.siteName} Sakin Profili:**\n\n` +
        `- Toplam Daire: **${adminContext.apartmentCount}**\n` +
        `- Kayıtlı Sakin: **${adminContext.residentCount}**\n` +
        `- Ev Sahibi: **${adminContext.owners}** daire (%${Math.round((adminContext.owners / (adminContext.residentCount || 1)) * 100)})\n` +
        `- Kiracı: **${adminContext.tenants}** daire (%${Math.round((adminContext.tenants / (adminContext.residentCount || 1)) * 100)})\n\n` +
        `Detaylı plaka ve acil durum irtibat listesine **Site Kurulumu** sekmesinden ulaşabilirsiniz.`;
    } else if (queryLower.includes("duyuru") || queryLower.includes("taslak") || queryLower.includes("yaz") || queryLower.includes("hazırla")) {
      fallbackReply = `📢 **Yönetim Duyurusu Taslağı:**\n\n` +
        `**Başlık:** Ortak Alan Periyodik Bakım ve Bilgilendirme\n` +
        `**İçerik:** Değerli Site Sakinlerimiz, sitemizin ortak kullanım alanlarında konfor ve güvenliğinizi en üst düzeyde tutmak amacıyla yarın 10:00 - 16:00 saatleri arasında planlı bakım ve kontroller gerçekleştirilecektir. Süreç boyunca göstereceğiniz anlayış için teşekkür eder, iyi günler dileriz.\n\n` +
        `*Bu metni Duyurular sekmesinden sakinlerimize tek tıkla yayınlayabilirsiniz.*`;
    } else if (queryLower.includes("anket") || queryLower.includes("karar")) {
      fallbackReply = `Sistemde şu anda **${adminContext.activeSurveysCount} adet** aktif anket bulunmaktadır. Anketler sekmesinden katılım oranlarını ve oy dağılımını canlı inceleyebilirsiniz.`;
    } else {
      fallbackReply = `Merhaba Sayın Yöneticim! Ben **ApartAI Akıllı Yönetim Asistanınızım**.\n\nSitenizin apartman kasası, gider dağılımı, aidat tahsilatları, teknik arıza yoğunlukları, sakin/kiracı istatistikleri ve duyuru hazırlama süreçlerinde size yardımcı olmaya hazırım. Hızlı sorulardan birini seçebilir veya sormak istediğiniz konuyu yazabilirsiniz.`;
    }
  }

  const contextData = isGuest ? { info: "ApartAI Tanıtım & Demo" } : (isResident ? residentContext : adminContext);
  const aiResult = await callAIJson({
    operation: "assistant_chat",
    fallback: { reply: fallbackReply, suggestedPrompts, suggestedRequest },
    instructions: `Sen ApartAI platformunun yapay zeka site yönetim asistanısın. 
Kullanıcı rolü: ${isGuest ? "Ziyaretçi / Misafir" : (isResident ? "Site Sakini" : "Site Yöneticisi")}.
Site gerçek verileri JSON olarak verildi. Kullanıcının sorusuna bu verilere sadık kalarak nazik, çözüm odaklı, net ve Türkçe yanıt ver. 
Format: JSON { "reply": "...", "suggestedPrompts": ["..."] }. 
Eğer kullanıcı duyuru taslağı isterse şık, kurumsal ve yayınlanabilir bir duyuru metni üret.`,
    input: {
      userRole: user ? user.role : "guest",
      userMessage: message,
      contextData,
    },
  });
  if (suggestedRequest && !aiResult.suggestedRequest) {
    aiResult.suggestedRequest = suggestedRequest;
  }
  return aiResult;
}

function routeAccess(method, pathname) {
  const publicRoutes = [
    ["POST", "/api/auth/login"],
    ["POST", "/api/auth/register"],
    ["GET", "/api/state"],
    ["GET", "/api/ai/status"],
    ["POST", "/api/ai/assistant"],
  ];
  if (publicRoutes.some(([m, p]) => m === method && p === pathname)) return "public";
  // Any authenticated user (resident or admin) may view finances (transparency).
  if (method === "GET" && pathname === "/api/finances") return "auth";
  // Any authenticated user may update their profile.
  if (method === "PATCH" && pathname === "/api/auth/profile") return "auth";
  // Any authenticated user (resident or admin) may open a request.
  if (method === "POST" && pathname === "/api/requests") return "auth";
  // Any authenticated user (resident or admin) may pay an allowed due.
  if (method === "POST" && /^\/api\/dues\/[^/]+\/pay$/.test(pathname)) return "auth";
  // Any authenticated user may mark an announcement as read.
  if (method === "POST" && /^\/api\/announcements\/[^/]+\/read$/.test(pathname)) return "auth";
  // Any authenticated user may vote on a survey.
  if (method === "POST" && /^\/api\/surveys\/[^/]+\/vote$/.test(pathname)) return "auth";
  // Everything else that mutates data or exposes internals requires an admin.
  return "admin";
}

async function routeApi(req, res, url) {
  const data = await readData();
  const method = req.method;

  const access = routeAccess(method, url.pathname);
  const authUser = authUserFromRequest(req, data);
  if (access !== "public") {
    if (!authUser) {
      json(res, 401, { error: "Oturum gerekli, lütfen tekrar giriş yapın." });
      return;
    }
    if (access === "admin" && authUser.role !== "admin") {
      json(res, 403, { error: "Bu işlem için yönetici yetkisi gerekli." });
      return;
    }
  }

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(req);
    const email = clean(body.email).toLocaleLowerCase("tr-TR");
    const password = clean(body.password);
    ensure(email && password, "E-posta ve şifre zorunludur.");
    const user = data.users.find((item) => item.email.toLocaleLowerCase("tr-TR") === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      json(res, 401, { error: "E-posta veya şifre hatalı" });
      return;
    }
    const token = signToken({ sub: user.id, role: user.role });
    json(res, 200, { user: publicUser(user), token, data: stateForUser(data, user) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readBody(req);
    const email = clean(body.email).toLocaleLowerCase("tr-TR");
    ensure(clean(body.name), "Ad soyad zorunludur.");
    ensure(isEmail(email), "Geçerli bir e-posta adresi girin.");
    ensure(clean(body.apartmentNo), "Daire numarası zorunludur.");
    const password = clean(body.password) || "demo123";
    ensure(password.length >= 6, "Şifre en az 6 karakter olmalıdır.");
    if (data.users.some((item) => item.email.toLocaleLowerCase("tr-TR") === email)) {
      json(res, 409, { error: "Bu e-posta ile kayıtlı kullanıcı var" });
      return;
    }
    // Kayıt olan sakin bir siteye bağlanır: seçilen blok sitesini belirler.
    const block = data.blocks.find((item) => item.id === clean(body.blockId)) || data.blocks[0];
    ensure(block, "Kayıt için tanımlı bir blok bulunamadı.");
    const siteId = block.siteId;
    const resident = {
      id: uid("resident"),
      siteId,
      name: clean(body.name),
      phone: clean(body.phone),
      email,
    };
    const apartment = {
      id: uid("apt"),
      siteId,
      blockId: block.id,
      no: clean(body.apartmentNo),
      floor: Number(body.floor || 1),
      residentId: resident.id,
    };
    const user = {
      id: uid("user"),
      name: resident.name,
      email,
      phone: resident.phone,
      role: "resident",
      residentId: resident.id,
      siteId,
      passwordHash: hashPassword(password),
    };
    data.residents.push(resident);
    data.apartments.push(apartment);
    data.users.push(user);
    await writeData(data);
    const token = signToken({ sub: user.id, role: user.role });
    json(res, 201, { user: publicUser(user), token, data: stateForUser(data, user) });
    return;
  }

  if (method === "PATCH" && url.pathname === "/api/auth/profile") {
    const body = await readBody(req);
    const user = data.users.find((u) => u.id === authUser.id);
    if (!user) {
      json(res, 404, { error: "Kullanıcı bulunamadı" });
      return;
    }
    const name = clean(body.name);
    const phone = clean(body.phone);
    const email = clean(body.email).toLocaleLowerCase("tr-TR");

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email !== user.email) {
      ensure(isEmail(email), "Geçerli bir e-posta adresi girin.");
      if (data.users.some((u) => u.id !== user.id && u.email.toLocaleLowerCase("tr-TR") === email)) {
        json(res, 409, { error: "Bu e-posta başka bir hesap tarafından kullanılıyor" });
        return;
      }
      user.email = email;
    }

    // Parola değişikliği (opsiyonel)
    const newPassword = clean(body.newPassword);
    if (newPassword) {
      const currentPassword = clean(body.currentPassword);
      ensure(currentPassword, "Mevcut şifrenizi girmelisiniz.");
      ensure(verifyPassword(currentPassword, user.passwordHash), "Mevcut şifreniz hatalı.");
      ensure(newPassword.length >= 6, "Yeni şifre en az 6 karakter olmalıdır.");
      user.passwordHash = hashPassword(newPassword);
    }

    // Sakin için resident kaydı güncellemesi (plaka, acil durum vb.)
    let resident = null;
    if (user.role === "resident" && user.residentId) {
      resident = data.residents.find((r) => r.id === user.residentId);
      if (resident) {
        if (name) resident.name = name;
        if (phone) resident.phone = phone;
        if (email) resident.email = email;
        if (body.plateNumber !== undefined) resident.plateNumber = clean(body.plateNumber);
        if (body.emergencyContact !== undefined) resident.emergencyContact = clean(body.emergencyContact);
        if (body.avatar !== undefined) {
          resident.avatar = clean(body.avatar);
        }
      }
    }

    if (body.avatar !== undefined) {
      user.avatar = clean(body.avatar);
    }

    await writeData(data);
    json(res, 200, { user: publicUser(user), resident, data: stateForUser(data, user) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/state") {
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "GET" && url.pathname === "/api/sites/overview") {
    // Yönetim firması görünümü: yönetilen her site için özet metrikler.
    const overview = userSiteIds(authUser, data).map((siteId) => {
      const site = data.sites.find((item) => item.id === siteId);
      const scoped = siteScope(data, siteId);
      const total = scoped.dues.reduce((sum, due) => sum + Number(due.amount), 0);
      const paid = scoped.dues.filter((due) => due.status === "paid").reduce((sum, due) => sum + Number(due.amount), 0);
      const health = calculateHealthScore(data, siteId);
      return {
        siteId,
        name: site?.name || siteId,
        address: site?.address || "",
        apartments: scoped.apartments.length,
        collectionRate: Math.round((paid / Math.max(total, 1)) * 100),
        pendingAmount: total - paid,
        openRequests: scoped.requests.filter((request) => !["cozuldu", "reddedildi"].includes(request.status)).length,
        score: health.score,
        status: health.status,
      };
    });
    json(res, 200, { sites: overview });
    return;
  }

  if (method === "POST" && url.pathname === "/api/sites") {
    const body = await readBody(req);
    const name = clean(body.name);
    ensure(name, "Site adı zorunludur.");
    const site = { id: uid("site"), name, address: clean(body.address) };
    data.sites.push(site);
    // Siteyi oluşturan yönetici otomatik olarak bu siteye erişir.
    const owner = data.users.find((item) => item.id === authUser.id);
    if (owner && Array.isArray(owner.siteIds)) owner.siteIds.push(site.id);
    await writeData(data);
    json(res, 201, { site, data: stateForUser(data, owner || authUser) });
    return;
  }

  const bulkSetupMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/bulk-setup$/);
  if (method === "POST" && bulkSetupMatch) {
    const siteId = bulkSetupMatch[1];
    requireSiteAccess(siteId, authUser, data);
    const body = await readBody(req);
    const blockPrefix = clean(body.blockPrefix) || "Ç";
    const blockCount = Math.min(50, Math.max(1, Number(body.blockCount) || 12));
    const flatPrefix = clean(body.flatPrefix) || "ÇD";
    const flatsPerBlock = Math.min(100, Math.max(1, Number(body.flatsPerBlock) || 20));

    const createdBlocks = [];
    const createdApartments = [];

    for (let b = 1; b <= blockCount; b++) {
      const blockName = `${blockPrefix}${b}`;
      let block = data.blocks.find((blk) => blk.siteId === siteId && blk.name === blockName);
      if (!block) {
        block = { id: uid("block"), siteId, name: blockName };
        data.blocks.push(block);
        createdBlocks.push(block);
      }

      for (let f = 1; f <= flatsPerBlock; f++) {
        const flatNo = `${flatPrefix}${f}`;
        const existingApt = data.apartments.find((apt) => apt.siteId === siteId && apt.blockId === block.id && apt.no === flatNo);
        if (!existingApt) {
          const apt = {
            id: uid("apt"),
            siteId,
            blockId: block.id,
            no: flatNo,
            floor: Math.ceil(f / 4),
            residentId: null,
          };
          data.apartments.push(apt);
          createdApartments.push(apt);
        }
      }
    }

    await writeData(data);
    json(res, 201, {
      message: `${blockCount} bina/blok ve her birinde ${flatsPerBlock} daire oluşturuldu.`,
      blocksCount: createdBlocks.length,
      apartmentsCount: createdApartments.length,
      data: stateForUser(data, authUser),
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/ai/status") {
    json(res, 200, aiStatus());
    return;
  }

  if (method === "GET" && url.pathname === "/api/ai/debug") {
    json(res, 200, aiDebugSnapshot());
    return;
  }

  if (method === "POST" && url.pathname === "/api/ai/assistant") {
    const body = await readBody(req);
    const message = clean(body.message);
    ensure(message, "Mesaj boş olamaz.");
    let targetSiteId = null;
    if (authUser) {
      targetSiteId = resolveSiteId(url, authUser, data);
    } else {
      const requested = clean(url.searchParams.get("siteId"));
      targetSiteId = (data.sites || []).find((s) => s.id === requested)?.id || data.sites?.[0]?.id || null;
    }
    const result = await assistantQueryWithAI({
      user: authUser || { role: "guest", name: "Ziyaretçi" },
      siteId: targetSiteId,
      message,
      data,
    });
    json(res, 200, result);
    return;
  }

  if (method === "POST" && url.pathname === "/api/dues/bulk") {
    const body = await readBody(req);
    const period = clean(body.period);
    const amount = Number(body.amount);
    const dueDate = clean(body.dueDate);
    ensure(PERIOD_RE.test(period), "Dönem YYYY-AA biçiminde olmalıdır (örn. 2026-06).");
    ensure(Number.isFinite(amount) && amount > 0, "Aidat tutarı sıfırdan büyük olmalıdır.");
    ensure(DATE_RE.test(dueDate), "Son ödeme tarihi YYYY-AA-GG biçiminde olmalıdır.");
    // Aidat yalnızca seçili site için oluşturulur.
    const siteId = resolveSiteId(url, authUser, data);
    const existing = new Set(data.dues.filter((due) => due.period === period).map((due) => due.apartmentId));
    const blockId = clean(body.blockId || url.searchParams.get("blockId"));
    const newDues = data.apartments
      .filter((apartment) => apartment.siteId === siteId && (!blockId || blockId === "all" || apartment.blockId === blockId) && !existing.has(apartment.id))
      .map((apartment) => ({ id: uid("due"), siteId, apartmentId: apartment.id, period, amount, dueDate, status: "pending" }));
    data.dues.push(...newDues);
    await writeData(data);
    json(res, 201, { created: newDues.length, data: stateForUser(data, authUser) });
    return;
  }

  const duePaidMatch = url.pathname.match(/^\/api\/dues\/([^/]+)\/pay$/);
  if (method === "POST" && duePaidMatch) {
    const due = data.dues.find((item) => item.id === duePaidMatch[1]);
    if (!due) {
      json(res, 404, { error: "Due not found" });
      return;
    }
    if (authUser.role === "resident") {
      const userApartment = data.apartments.find((apt) => apt.residentId === authUser.residentId);
      ensure(userApartment && due.apartmentId === userApartment.id, "Yalnızca kendi dairenizin aidatını ödeyebilirsiniz.");
    } else {
      requireSiteAccess(due.siteId, authUser, data);
    }

    const body = await readBody(req).catch(() => ({}));
    due.status = "paid";
    const methodStr = clean(body.method) || (authUser.role === "resident" ? "Kredi Kartı (3D Secure)" : "Manuel");
    const payment = {
      id: uid("pay"),
      siteId: due.siteId,
      dueId: due.id,
      apartmentId: due.apartmentId,
      amount: due.amount,
      date: today(),
      method: methodStr,
      cardLast4: clean(body.cardLast4) || "4543",
      cardHolder: clean(body.cardHolder) || authUser.name,
      installment: Number(body.installment) || 1,
      referenceCode: clean(body.referenceCode) || `TX-${Date.now().toString(36).toUpperCase()}`,
      note: clean(body.note) || (authUser.role === "resident" ? "Online Kredi Kartı (3D Secure) Ödemesi" : "Yönetici tarafından işlendi"),
    };
    data.payments.push(payment);
    await writeData(data);
    json(res, 200, { payment, data: stateForUser(data, authUser) });
    return;
  }

  const dueReminderMatch = url.pathname.match(/^\/api\/dues\/([^/]+)\/reminder$/);
  const dueReminderDraftMatch = url.pathname.match(/^\/api\/dues\/([^/]+)\/reminder-draft$/);
  if (method === "POST" && dueReminderDraftMatch) {
    const due = data.dues.find((item) => item.id === dueReminderDraftMatch[1]);
    if (!due) {
      json(res, 404, { error: "Due not found" });
      return;
    }
    requireSiteAccess(due.siteId, authUser, data);
    const apartment = data.apartments.find((item) => item.id === due.apartmentId);
    const resident = data.residents.find((item) => item.id === apartment?.residentId);
    const reminder = await draftPaymentReminderWithAI({ resident, apartment, due });
    json(res, 200, reminder);
    return;
  }

  if (method === "POST" && dueReminderMatch) {
    const body = await readBody(req);
    const due = data.dues.find((item) => item.id === dueReminderMatch[1]);
    if (!due) {
      json(res, 404, { error: "Due not found" });
      return;
    }
    requireSiteAccess(due.siteId, authUser, data);
    const apartment = data.apartments.find((item) => item.id === due.apartmentId);
    const resident = data.residents.find((item) => item.id === apartment?.residentId);
    const reminder = clean(body.note)
      ? { content: clean(body.note), provider: "manual", model: "manual", fallbackUsed: false }
      : await draftPaymentReminderWithAI({ resident, apartment, due });
    // Hatırlatmayı bildirim katmanı üzerinden sakine ilet (e-posta varsa
    // e-posta, yoksa telefon üzerinden SMS kanalı hedeflenir).
    const channel = resident?.email ? "email" : "sms";
    const delivery = await notifier.send({
      channel,
      to: resident?.email || resident?.phone || "",
      subject: `Aidat hatırlatması - ${due.period}`,
      message: reminder.content,
    });
    data.payments.push({
      id: uid("reminder"),
      siteId: due.siteId,
      dueId: due.id,
      apartmentId: due.apartmentId,
      amount: 0,
      date: today(),
      method: "Hatırlatma",
      note: reminder.content,
      aiProvider: reminder.provider,
      aiModel: reminder.model,
      aiFallbackUsed: reminder.fallbackUsed,
      delivery,
    });
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "POST" && url.pathname === "/api/requests") {
    const body = await readBody(req);
    const title = clean(body.title);
    const description = clean(body.description);
    const apartmentId = clean(body.apartmentId);
    ensure(title, "Talep başlığı zorunludur.");
    ensure(description, "Talep açıklaması zorunludur.");
    const apartment = data.apartments.find((item) => item.id === apartmentId);
    ensure(apartment, "Geçerli bir daire seçilmelidir.");
    // Sakin yalnızca kendi dairesi için talep açabilir; yönetici yönettiği sitede.
    if (authUser.role === "resident") {
      ensure(apartment.residentId === authUser.residentId, "Yalnızca kendi daireniz için talep açabilirsiniz.");
    } else {
      requireSiteAccess(apartment.siteId, authUser, data);
    }
    const photoDataUrl = clean(body.photoDataUrl);
    const entryType = clean(body.entryType) || "fault"; // fault, complaint, suggestion
    const categoryOverride = clean(body.category);
    const urgencyOverride = clean(body.urgency);
    const analysis = await analyzeComplaintWithAI({ data: siteScope(data, apartment.siteId), title, description, photoDataUrl });
    // Görseli AI'a verdikten sonra dosyaya yaz; db.json'da base64 tutma.
    const stored = await storage.saveDataUrl(photoDataUrl, "req");
    const request = {
      id: uid("req"),
      siteId: apartment.siteId,
      apartmentId,
      entryType, // fault, complaint, suggestion
      category: categoryOverride || analysis.category,
      title,
      description,
      photoUrl: stored?.url || "",
      urgency: urgencyOverride || analysis.urgency,
      status: "yeni",
      adminNote: "",
      aiSummary: analysis.summary,
      aiSuggestedAction: analysis.action,
      aiProvider: analysis.provider,
      aiModel: analysis.model,
      aiFallbackUsed: analysis.fallbackUsed,
      aiImageAnalyzed: Boolean(parseDataUrl(photoDataUrl)) && analysis.fallbackUsed === false,
      location: analysis.location,
      createdAt: today(),
      resolvedAt: "",
    };
    data.requests.push(request);
    await writeData(data);
    json(res, 201, { request, analysis, data: stateForUser(data, authUser) });
    return;
  }

  const requestStatusMatch = url.pathname.match(/^\/api\/requests\/([^/]+)\/status$/);
  if (method === "PATCH" && requestStatusMatch) {
    const body = await readBody(req);
    const request = data.requests.find((item) => item.id === requestStatusMatch[1]);
    if (!request) {
      json(res, 404, { error: "Request not found" });
      return;
    }
    requireSiteAccess(request.siteId, authUser, data);
    request.status = clean(body.status);
    if (request.status === "cozuldu") request.resolvedAt = today();
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  const requestUpdateMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
  if (method === "DELETE" && requestUpdateMatch) {
    const index = data.requests.findIndex((item) => item.id === requestUpdateMatch[1]);
    if (index === -1) {
      json(res, 404, { error: "Request not found" });
      return;
    }
    requireSiteAccess(data.requests[index].siteId, authUser, data);
    const [removed] = data.requests.splice(index, 1);
    if (removed?.photoUrl) await storage.remove(removed.photoUrl);
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "PATCH" && requestUpdateMatch) {
    const body = await readBody(req);
    const request = data.requests.find((item) => item.id === requestUpdateMatch[1]);
    if (!request) {
      json(res, 404, { error: "Request not found" });
      return;
    }
    requireSiteAccess(request.siteId, authUser, data);
    if (body.status !== undefined) request.status = clean(body.status);
    if (body.adminNote !== undefined) request.adminNote = clean(body.adminNote);
    if (body.assignee !== undefined) {
      const assignee = clean(body.assignee);
      // Yeni bir firma/kişi atandığında atama tarihini kaydet (performans ölçümü için).
      if (assignee && assignee !== request.assignee) request.assignedAt = today();
      if (!assignee) request.assignedAt = "";
      request.assignee = assignee;
    }
    if (request.status === "cozuldu" && !request.resolvedAt) request.resolvedAt = today();
    if (request.status !== "cozuldu") request.resolvedAt = "";
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "POST" && url.pathname === "/api/announcements") {
    const body = await readBody(req);
    const content = clean(body.content);
    ensure(clean(body.title), "Duyuru başlığı zorunludur.");
    ensure(content, "Duyuru içeriği zorunludur.");
    const siteId = resolveSiteId(url, authUser, data);
    const rawBlockId = clean(body.blockId || url.searchParams.get("blockId"));
    const blockId = (rawBlockId && rawBlockId !== "all") ? rawBlockId : null;
    let audience = clean(body.audience);
    if (!audience || audience === "Tüm site") {
      if (blockId) {
        const blk = data.blocks.find((b) => b.id === blockId);
        audience = blk ? `${blk.name} Sakinleri` : "Blok Özel";
      } else {
        audience = "Tüm site";
      }
    }
    const improved = await improveAnnouncementWithAI({ content, tone: clean(body.tone) });
    const announcement = {
      id: uid("ann"),
      siteId,
      blockId,
      title: clean(body.title),
      content,
      aiContent: improved.content,
      aiProvider: improved.provider,
      aiModel: improved.model,
      aiFallbackUsed: improved.fallbackUsed,
      audience,
      date: today(),
      readBy: [],
    };
    // Duyuruyu yalnızca ilgili sitenin (ve eğer blok seçildiyse ilgili bloğun) sakinlerine ilet.
    let eligibleResidentIds = null;
    if (blockId) {
      eligibleResidentIds = new Set(data.apartments.filter((a) => a.blockId === blockId).map((a) => a.residentId).filter(Boolean));
    }
    const recipients = data.users.filter((user) => {
      if (user.role !== "resident" || user.siteId !== siteId || !clean(user.email)) return false;
      if (eligibleResidentIds && !eligibleResidentIds.has(user.residentId)) return false;
      return true;
    });
    const results = await Promise.all(
      recipients.map((user) =>
        notifier.send({
          channel: "email",
          to: user.email,
          subject: `Duyuru: ${announcement.title}`,
          message: announcement.aiContent || announcement.content,
        })
      )
    );
    announcement.delivery = {
      driver: results[0]?.driver || "log",
      simulated: results.every((r) => r.simulated),
      sent: results.filter((r) => r.ok).length,
      total: recipients.length,
    };
    data.announcements.push(announcement);
    await writeData(data);
    json(res, 201, { announcement, data: stateForUser(data, authUser) });
    return;
  }

  const announcementReadMatch = url.pathname.match(/^\/api\/announcements\/([^/]+)\/read$/);
  if (method === "POST" && announcementReadMatch) {
    const announcement = data.announcements.find((item) => item.id === announcementReadMatch[1]);
    if (!announcement) {
      json(res, 404, { error: "Announcement not found" });
      return;
    }
    // Kullanıcı yalnızca kendi sitesinin duyurusunu okundu işaretleyebilir.
    const readable = authUser.role === "resident" ? [authUser.siteId] : userSiteIds(authUser, data);
    ensure(readable.includes(announcement.siteId), "Bu duyuruya erişim yetkiniz yok.");
    if (!Array.isArray(announcement.readBy)) announcement.readBy = [];
    // Aynı kullanıcı için tekrarlanan işaretlemeler yok sayılır (idempotent).
    if (!announcement.readBy.some((entry) => entry.userId === authUser.id)) {
      announcement.readBy.push({ userId: authUser.id, name: authUser.name, date: today() });
      await writeData(data);
    }
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "POST" && url.pathname === "/api/apartments") {
    const body = await readBody(req);
    const blockId = clean(body.blockId);
    const email = clean(body.email);
    ensure(clean(body.residentName), "Sakin adı zorunludur.");
    ensure(clean(body.no), "Daire numarası zorunludur.");
    const block = data.blocks.find((item) => item.id === blockId);
    ensure(block, "Geçerli bir blok seçilmelidir.");
    ensure(!email || isEmail(email), "Geçerli bir e-posta adresi girin.");
    const siteId = requireSiteAccess(block.siteId, authUser, data);
    const resident = {
      id: uid("resident"),
      siteId,
      name: clean(body.residentName),
      phone: clean(body.phone),
      email,
      occupancyType: clean(body.occupancyType) === "tenant" ? "tenant" : "owner",
      plateNumber: clean(body.plateNumber) || "",
      emergencyContact: clean(body.emergencyContact) || "",
    };
    const apartment = {
      id: uid("apt"),
      siteId,
      blockId,
      no: clean(body.no),
      floor: Number(body.floor) || 1,
      residentId: resident.id,
    };
    data.users.push({
      id: uid("user"),
      name: resident.name,
      phone: resident.phone,
      email: resident.email,
      role: "resident",
      residentId: resident.id,
      siteId,
      passwordHash: hashPassword(clean(body.password) || "demo123"),
    });
    data.residents.push(resident);
    data.apartments.push(apartment);
    await writeData(data);
    json(res, 201, { resident, apartment, data: stateForUser(data, authUser) });
    return;
  }

  const blockPatchMatch = url.pathname.match(/^\/api\/blocks\/([^/]+)$/);
  if (method === "PATCH" && blockPatchMatch) {
    const block = data.blocks.find((b) => b.id === blockPatchMatch[1]);
    if (!block) {
      json(res, 404, { error: "Blok bulunamadı." });
      return;
    }
    requireSiteAccess(block.siteId, authUser, data);
    const body = await readBody(req);
    const newName = clean(body.name);
    ensure(newName, "Blok adı boş olamaz.");
    block.name = newName;
    await writeData(data);
    json(res, 200, { block, data: stateForUser(data, authUser) });
    return;
  }

  const aptMatch = url.pathname.match(/^\/api\/apartments\/([^/]+)$/);
  if (method === "PATCH" && aptMatch) {
    const apt = data.apartments.find((a) => a.id === aptMatch[1]);
    if (!apt) {
      json(res, 404, { error: "Daire bulunamadı." });
      return;
    }
    requireSiteAccess(apt.siteId, authUser, data);
    const body = await readBody(req);
    if (body.no) apt.no = clean(body.no);
    if (body.floor !== undefined) apt.floor = Number(body.floor) || apt.floor;
    if (body.blockId) {
      const targetBlock = data.blocks.find((b) => b.id === body.blockId && b.siteId === apt.siteId);
      if (targetBlock) apt.blockId = targetBlock.id;
    }
    const resident = data.residents.find((r) => r.id === apt.residentId);
    if (resident) {
      if (body.residentName) resident.name = clean(body.residentName);
      if (body.phone !== undefined) resident.phone = clean(body.phone);
      if (body.email !== undefined) {
        ensure(!body.email || isEmail(body.email), "Geçerli bir e-posta adresi girin.");
        resident.email = clean(body.email);
      }
      if (body.occupancyType) resident.occupancyType = clean(body.occupancyType) === "tenant" ? "tenant" : "owner";
      if (body.plateNumber !== undefined) resident.plateNumber = clean(body.plateNumber);
      if (body.emergencyContact !== undefined) resident.emergencyContact = clean(body.emergencyContact);

      const user = data.users.find((u) => u.residentId === resident.id);
      if (user) {
        user.name = resident.name;
        user.phone = resident.phone;
        user.email = resident.email;
      }
    }
    await writeData(data);
    json(res, 200, { apartment: apt, resident, data: stateForUser(data, authUser) });
    return;
  }

  if (method === "DELETE" && aptMatch) {
    const apt = data.apartments.find((a) => a.id === aptMatch[1]);
    if (!apt) {
      json(res, 404, { error: "Daire bulunamadı." });
      return;
    }
    requireSiteAccess(apt.siteId, authUser, data);
    data.apartments = data.apartments.filter((a) => a.id !== apt.id);
    if (apt.residentId) {
      data.residents = data.residents.filter((r) => r.id !== apt.residentId);
      data.users = data.users.filter((u) => u.residentId !== apt.residentId);
    }
    data.dues = data.dues.filter((d) => d.apartmentId !== apt.id);
    data.payments = data.payments.filter((p) => p.apartmentId !== apt.id);
    data.requests = data.requests.filter((r) => r.apartmentId !== apt.id);
    await writeData(data);
    json(res, 200, { success: true, data: stateForUser(data, authUser) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/apartments/import") {
    const body = await readBody(req);
    const records = parseApartmentCsv(body.csv);
    ensure(records.length > 0, "İçeri aktarılacak satır bulunamadı. Başlık satırı ve en az bir kayıt gerekir.");
    // İçeri aktarma seçili siteye yapılır; bloklar o site içinde eşleşir.
    const siteId = resolveSiteId(url, authUser, data);
    const result = { created: 0, skipped: 0, blocksCreated: 0, errors: [] };
    records.forEach((record, index) => {
      const rowNo = index + 2; // başlık + 1 tabanlı
      const blockName = clean(record.block);
      const no = clean(record.no);
      if (!blockName || !no) {
        result.errors.push(`Satır ${rowNo}: blok ve daire no zorunludur.`);
        return;
      }
      const email = clean(record.email);
      if (email && !isEmail(email)) {
        result.errors.push(`Satır ${rowNo}: geçersiz e-posta (${email}).`);
        return;
      }
      let block = data.blocks.find(
        (item) => item.siteId === siteId && item.name.toLocaleLowerCase("tr-TR") === blockName.toLocaleLowerCase("tr-TR")
      );
      if (!block) {
        block = { id: uid("block"), siteId, name: blockName };
        data.blocks.push(block);
        result.blocksCreated += 1;
      }
      const exists = data.apartments.some(
        (apt) => apt.blockId === block.id && clean(apt.no).toLocaleLowerCase("tr-TR") === no.toLocaleLowerCase("tr-TR")
      );
      if (exists) {
        result.skipped += 1;
        return;
      }
      const occRaw = clean(record.occupancyType).toLocaleLowerCase("tr-TR");
      const occupancyType = occRaw.includes("kiraci") || occRaw.includes("tenant") ? "tenant" : "owner";
      const resident = {
        id: uid("resident"),
        siteId,
        name: clean(record.name),
        phone: clean(record.phone),
        email,
        occupancyType,
        plateNumber: clean(record.plateNumber) || "",
        emergencyContact: clean(record.emergencyContact) || "",
      };
      data.residents.push(resident);
      data.apartments.push({ id: uid("apt"), siteId, blockId: block.id, no, floor: Number(record.floor) || 1, residentId: resident.id });
      if (email) {
        const userExists = data.users.some((u) => clean(u.email).toLocaleLowerCase("tr-TR") === email.toLocaleLowerCase("tr-TR"));
        if (!userExists) {
          data.users.push({
            id: uid("user"),
            name: resident.name,
            phone: resident.phone,
            email,
            role: "resident",
            residentId: resident.id,
            siteId,
            passwordHash: hashPassword("demo123"),
          });
        }
      }
      result.created += 1;
    });
    await writeData(data);
    json(res, 201, { ...result, data: stateForUser(data, authUser) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/surveys") {
    const body = await readBody(req);
    ensure(clean(body.title), "Anket başlığı zorunludur.");
    const rawOptions = Array.isArray(body.options)
      ? body.options
      : (body.options || "").split("\n");
    const options = rawOptions.map(clean).filter(Boolean);
    ensure(options.length >= 2, "Anket için en az 2 seçenek gereklidir.");
    const siteId = resolveSiteId(url, authUser, data);
    const rawBlockId = clean(body.blockId || url.searchParams.get("blockId"));
    const blockId = (rawBlockId && rawBlockId !== "all") ? rawBlockId : null;
    const survey = {
      id: uid("survey"),
      siteId,
      blockId,
      title: clean(body.title),
      description: clean(body.description),
      options,
      votes: [],
      createdAt: today(),
      expiresAt: clean(body.expiresAt) || "",
      status: "active",
    };
    if (!Array.isArray(data.surveys)) data.surveys = [];
    data.surveys.push(survey);
    await writeData(data);
    json(res, 201, { survey, data: stateForUser(data, authUser) });
    return;
  }

  const surveyVoteMatch = url.pathname.match(/^\/api\/surveys\/([^/]+)\/vote$/);
  if (method === "POST" && surveyVoteMatch) {
    if (!authUser) {
      json(res, 401, { error: "Authentication required" });
      return;
    }
    const body = await readBody(req);
    const survey = (data.surveys || []).find((item) => item.id === surveyVoteMatch[1]);
    if (!survey) {
      json(res, 404, { error: "Survey not found" });
      return;
    }
    const accessible = authUser.role === "resident" ? [authUser.siteId] : userSiteIds(authUser, data);
    ensure(accessible.includes(survey.siteId), "Bu ankete erişim yetkiniz yok.");
    ensure(survey.status === "active", "Bu anket oylamaya kapatılmıştır.");
    if (authUser.role === "resident" && survey.blockId && survey.blockId !== "all") {
      const residentApts = data.apartments.filter((apt) => apt.residentId === authUser.residentId);
      const inBlock = residentApts.some((apt) => apt.blockId === survey.blockId);
      ensure(inBlock, "Bu anket yalnızca ilgili bloğun sakinlerine açıktır.");
    }
    const optionIndex = Number(body.optionIndex);
    ensure(Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < survey.options.length, "Geçerli bir seçenek seçiniz.");
    if (!Array.isArray(survey.votes)) survey.votes = [];
    const userApartment = data.apartments.find((apt) => apt.residentId === authUser.residentId);
    const existingIndex = survey.votes.findIndex((v) =>
      v.userId === authUser.id || (userApartment && v.apartmentId === userApartment.id)
    );
    const voteRecord = {
      userId: authUser.id,
      residentId: authUser.residentId || "",
      apartmentId: userApartment?.id || "",
      optionIndex,
      option: survey.options[optionIndex] || "",
      date: today(),
    };
    if (existingIndex >= 0) {
      survey.votes[existingIndex] = voteRecord;
    } else {
      survey.votes.push(voteRecord);
    }
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  const surveyCloseMatch = url.pathname.match(/^\/api\/surveys\/([^/]+)\/close$/);
  if (method === "PATCH" && surveyCloseMatch) {
    const survey = (data.surveys || []).find((item) => item.id === surveyCloseMatch[1]);
    if (!survey) {
      json(res, 404, { error: "Survey not found" });
      return;
    }
    requireSiteAccess(survey.siteId, authUser, data);
    survey.status = survey.status === "closed" ? "active" : "closed";
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  const surveyDeleteMatch = url.pathname.match(/^\/api\/surveys\/([^/]+)$/);
  if (method === "DELETE" && surveyDeleteMatch) {
    const surveyIndex = (data.surveys || []).findIndex((item) => item.id === surveyDeleteMatch[1]);
    if (surveyIndex < 0) {
      json(res, 404, { error: "Survey not found" });
      return;
    }
    const survey = data.surveys[surveyIndex];
    requireSiteAccess(survey.siteId, authUser, data);
    data.surveys.splice(surveyIndex, 1);
    await writeData(data);
    json(res, 200, stateForUser(data, authUser));
    return;
  }

  if (method === "GET" && url.pathname === "/api/finances") {
    const siteId = resolveSiteId(url, authUser, data);
    const summary = calculateFinances(data, siteId);
    json(res, 200, summary);
    return;
  }

  if (method === "POST" && url.pathname === "/api/expenses") {
    const body = await readBody(req);
    const title = clean(body.title);
    const amount = Number(body.amount);
    const category = clean(body.category) || "other";
    const date = clean(body.date) || today();
    const vendor = clean(body.vendor);
    const invoiceNo = clean(body.invoiceNo);
    const description = clean(body.description);

    ensure(title, "Gider başlığı zorunludur.");
    ensure(Number.isFinite(amount) && amount > 0, "Gider tutarı 0'dan büyük bir sayı olmalıdır.");
    const targetSiteId = clean(body.siteId) || resolveSiteId(url, authUser, data);
    requireSiteAccess(targetSiteId, authUser, data);

    const expense = {
      id: uid("exp"),
      siteId: targetSiteId,
      title,
      category,
      amount,
      date,
      vendor,
      invoiceNo,
      description,
      createdAt: today(),
    };
    if (!Array.isArray(data.expenses)) data.expenses = [];
    data.expenses.push(expense);
    await writeData(data);
    const finances = calculateFinances(data, targetSiteId);
    json(res, 201, { expense, finances, data: stateForUser(data, authUser) });
    return;
  }

  const expenseDeleteMatch = url.pathname.match(/^\/api\/expenses\/([^/]+)$/);
  if (method === "DELETE" && expenseDeleteMatch) {
    const expenseIndex = (data.expenses || []).findIndex((item) => item.id === expenseDeleteMatch[1]);
    if (expenseIndex < 0) {
      json(res, 404, { error: "Expense not found" });
      return;
    }
    const expense = data.expenses[expenseIndex];
    requireSiteAccess(expense.siteId, authUser, data);
    data.expenses.splice(expenseIndex, 1);
    await writeData(data);
    const finances = calculateFinances(data, expense.siteId);
    json(res, 200, { success: true, finances, data: stateForUser(data, authUser) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/health-score") {
    const siteId = resolveSiteId(url, authUser, data);
    json(res, 200, {
      siteId,
      current: calculateHealthScore(data, siteId),
      history: (data.healthScores || []).filter((item) => item.siteId === siteId),
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/health-score/snapshot") {
    const siteId = resolveSiteId(url, authUser, data);
    const current = calculateHealthScore(data, siteId);
    const snapshot = {
      id: uid("hs"),
      siteId,
      date: today(),
      score: current.score,
      status: current.status,
      reasons: current.reasons,
      actions: current.actions,
    };
    if (!Array.isArray(data.healthScores)) data.healthScores = [];
    data.healthScores.push(snapshot);
    await writeData(data);
    json(res, 201, { siteId, snapshot, current, history: data.healthScores.filter((item) => item.siteId === siteId) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/reset") {
    await repository.reset();
    const fresh = await readData();
    json(res, 200, stateForUser(fresh, fresh.users.find((item) => item.id === authUser.id) || authUser));
    return;
  }

  json(res, 404, { error: "Endpoint not found" });
}

async function serveStatic(res, url) {
  // Yüklenen dosyalar storage katmanından servis edilir.
  const uploadPath = storage.resolvePublicUrl?.(url.pathname);
  const filePath = uploadPath
    ? path.normalize(uploadPath)
    : path.normalize(path.join(ROOT, url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname)));

  // Veri dizinine (db.json, seed.json, .auth_secret) ve .env'e statik erişimi engelle.
  const blocked = filePath.startsWith(DATA_DIR) || path.basename(filePath) === ".env";
  if (!uploadPath && (blocked || !filePath.startsWith(ROOT))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "content-type": contentTypes[ext] || "application/octet-stream",
      "cache-control": "no-store, no-cache, must-revalidate",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res, req.headers.origin || "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await routeApi(req, res, url);
      return;
    }
    await serveStatic(res, url);
  } catch (error) {
    if (error instanceof ValidationError || error.message === "Invalid JSON") {
      json(res, 400, { error: error.message });
      return;
    }
    json(res, 500, { error: error.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`ApartAI MVP server: http://localhost:${PORT}`);
  });
}

module.exports = {
  server,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  analyzeComplaint,
  improveAnnouncement,
  parseDataUrl,
  calculateHealthScore,
  parseCsvRows,
  parseApartmentCsv,
  userSiteIds,
  scopeToSites,
  stateForUser,
};
