const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { createRepository } = require("./db/repository");
const { createStorage } = require("./db/storage");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, ".env");
const DATA_DIR = path.join(ROOT, "data");
const SECRET_FILE = path.join(DATA_DIR, ".auth_secret");
loadEnvFile();
const repository = createRepository();
const storage = createStorage();
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

function json(res, status, payload) {
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
function calculateHealthScore(data) {
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

function routeAccess(method, pathname) {
  const publicRoutes = [
    ["POST", "/api/auth/login"],
    ["POST", "/api/auth/register"],
    ["GET", "/api/state"],
    ["GET", "/api/ai/status"],
  ];
  if (publicRoutes.some(([m, p]) => m === method && p === pathname)) return "public";
  // Any authenticated user (resident or admin) may open a request.
  if (method === "POST" && pathname === "/api/requests") return "auth";
  // Any authenticated user may mark an announcement as read.
  if (method === "POST" && /^\/api\/announcements\/[^/]+\/read$/.test(pathname)) return "auth";
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
    json(res, 200, { user: publicUser(user), token, data: publicData(data) });
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
    const resident = {
      id: uid("resident"),
      name: clean(body.name),
      phone: clean(body.phone),
      email,
    };
    const apartment = {
      id: uid("apt"),
      blockId: clean(body.blockId || data.blocks[0]?.id),
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
      passwordHash: hashPassword(password),
    };
    data.residents.push(resident);
    data.apartments.push(apartment);
    data.users.push(user);
    await writeData(data);
    const token = signToken({ sub: user.id, role: user.role });
    json(res, 201, { user: publicUser(user), token, data: publicData(data) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/state") {
    json(res, 200, publicData(data));
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

  if (method === "POST" && url.pathname === "/api/dues/bulk") {
    const body = await readBody(req);
    const period = clean(body.period);
    const amount = Number(body.amount);
    const dueDate = clean(body.dueDate);
    ensure(PERIOD_RE.test(period), "Dönem YYYY-AA biçiminde olmalıdır (örn. 2026-06).");
    ensure(Number.isFinite(amount) && amount > 0, "Aidat tutarı sıfırdan büyük olmalıdır.");
    ensure(DATE_RE.test(dueDate), "Son ödeme tarihi YYYY-AA-GG biçiminde olmalıdır.");
    const existing = new Set(data.dues.filter((due) => due.period === period).map((due) => due.apartmentId));
    const newDues = data.apartments
      .filter((apartment) => !existing.has(apartment.id))
      .map((apartment) => ({ id: uid("due"), apartmentId: apartment.id, period, amount, dueDate, status: "pending" }));
    data.dues.push(...newDues);
    await writeData(data);
    json(res, 201, { created: newDues.length, data: publicData(data) });
    return;
  }

  const duePaidMatch = url.pathname.match(/^\/api\/dues\/([^/]+)\/pay$/);
  if (method === "POST" && duePaidMatch) {
    const due = data.dues.find((item) => item.id === duePaidMatch[1]);
    if (!due) {
      json(res, 404, { error: "Due not found" });
      return;
    }
    due.status = "paid";
    data.payments.push({
      id: uid("pay"),
      dueId: due.id,
      apartmentId: due.apartmentId,
      amount: due.amount,
      date: today(),
      method: "Manuel",
      note: "Yönetici tarafından işlendi",
    });
    await writeData(data);
    json(res, 200, publicData(data));
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
    const apartment = data.apartments.find((item) => item.id === due.apartmentId);
    const resident = data.residents.find((item) => item.id === apartment?.residentId);
    const reminder = clean(body.note)
      ? { content: clean(body.note), provider: "manual", model: "manual", fallbackUsed: false }
      : await draftPaymentReminderWithAI({ resident, apartment, due });
    data.payments.push({
      id: uid("reminder"),
      dueId: due.id,
      apartmentId: due.apartmentId,
      amount: 0,
      date: today(),
      method: "Hatırlatma",
      note: reminder.content,
      aiProvider: reminder.provider,
      aiModel: reminder.model,
      aiFallbackUsed: reminder.fallbackUsed,
    });
    await writeData(data);
    json(res, 200, publicData(data));
    return;
  }

  if (method === "POST" && url.pathname === "/api/requests") {
    const body = await readBody(req);
    const title = clean(body.title);
    const description = clean(body.description);
    const apartmentId = clean(body.apartmentId);
    ensure(title, "Talep başlığı zorunludur.");
    ensure(description, "Talep açıklaması zorunludur.");
    ensure(data.apartments.some((apartment) => apartment.id === apartmentId), "Geçerli bir daire seçilmelidir.");
    const photoDataUrl = clean(body.photoDataUrl);
    const analysis = await analyzeComplaintWithAI({ data, title, description, photoDataUrl });
    // Görseli AI'a verdikten sonra dosyaya yaz; db.json'da base64 tutma.
    const stored = await storage.saveDataUrl(photoDataUrl, "req");
    const request = {
      id: uid("req"),
      apartmentId,
      category: analysis.category,
      title,
      description,
      photoUrl: stored?.url || "",
      urgency: analysis.urgency,
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
    json(res, 201, { request, analysis, data: publicData(data) });
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
    request.status = clean(body.status);
    if (request.status === "cozuldu") request.resolvedAt = today();
    await writeData(data);
    json(res, 200, publicData(data));
    return;
  }

  const requestUpdateMatch = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
  if (method === "DELETE" && requestUpdateMatch) {
    const index = data.requests.findIndex((item) => item.id === requestUpdateMatch[1]);
    if (index === -1) {
      json(res, 404, { error: "Request not found" });
      return;
    }
    const [removed] = data.requests.splice(index, 1);
    if (removed?.photoUrl) await storage.remove(removed.photoUrl);
    await writeData(data);
    json(res, 200, publicData(data));
    return;
  }

  if (method === "PATCH" && requestUpdateMatch) {
    const body = await readBody(req);
    const request = data.requests.find((item) => item.id === requestUpdateMatch[1]);
    if (!request) {
      json(res, 404, { error: "Request not found" });
      return;
    }
    if (body.status !== undefined) request.status = clean(body.status);
    if (body.adminNote !== undefined) request.adminNote = clean(body.adminNote);
    if (request.status === "cozuldu" && !request.resolvedAt) request.resolvedAt = today();
    if (request.status !== "cozuldu") request.resolvedAt = "";
    await writeData(data);
    json(res, 200, publicData(data));
    return;
  }

  if (method === "POST" && url.pathname === "/api/announcements") {
    const body = await readBody(req);
    const content = clean(body.content);
    ensure(clean(body.title), "Duyuru başlığı zorunludur.");
    ensure(content, "Duyuru içeriği zorunludur.");
    const improved = await improveAnnouncementWithAI({ content, tone: clean(body.tone) });
    const announcement = {
      id: uid("ann"),
      title: clean(body.title),
      content,
      aiContent: improved.content,
      aiProvider: improved.provider,
      aiModel: improved.model,
      aiFallbackUsed: improved.fallbackUsed,
      audience: clean(body.audience || "Tüm site"),
      date: today(),
      readBy: [],
    };
    data.announcements.push(announcement);
    await writeData(data);
    json(res, 201, { announcement, data: publicData(data) });
    return;
  }

  const announcementReadMatch = url.pathname.match(/^\/api\/announcements\/([^/]+)\/read$/);
  if (method === "POST" && announcementReadMatch) {
    const announcement = data.announcements.find((item) => item.id === announcementReadMatch[1]);
    if (!announcement) {
      json(res, 404, { error: "Announcement not found" });
      return;
    }
    if (!Array.isArray(announcement.readBy)) announcement.readBy = [];
    // Aynı kullanıcı için tekrarlanan işaretlemeler yok sayılır (idempotent).
    if (!announcement.readBy.some((entry) => entry.userId === authUser.id)) {
      announcement.readBy.push({ userId: authUser.id, name: authUser.name, date: today() });
      await writeData(data);
    }
    json(res, 200, publicData(data));
    return;
  }

  if (method === "POST" && url.pathname === "/api/apartments") {
    const body = await readBody(req);
    const blockId = clean(body.blockId);
    const email = clean(body.email);
    ensure(clean(body.residentName), "Sakin adı zorunludur.");
    ensure(clean(body.no), "Daire numarası zorunludur.");
    ensure(data.blocks.some((block) => block.id === blockId), "Geçerli bir blok seçilmelidir.");
    ensure(!email || isEmail(email), "Geçerli bir e-posta adresi girin.");
    const resident = {
      id: uid("resident"),
      name: clean(body.residentName),
      phone: clean(body.phone),
      email,
    };
    const apartment = {
      id: uid("apt"),
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
      passwordHash: hashPassword(clean(body.password) || "demo123"),
    });
    data.residents.push(resident);
    data.apartments.push(apartment);
    await writeData(data);
    json(res, 201, { resident, apartment, data: publicData(data) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/apartments/import") {
    const body = await readBody(req);
    const records = parseApartmentCsv(body.csv);
    ensure(records.length > 0, "İçeri aktarılacak satır bulunamadı. Başlık satırı ve en az bir kayıt gerekir.");
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
      let block = data.blocks.find((item) => item.name.toLocaleLowerCase("tr-TR") === blockName.toLocaleLowerCase("tr-TR"));
      if (!block) {
        block = { id: uid("block"), name: blockName };
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
      const resident = { id: uid("resident"), name: clean(record.name), phone: clean(record.phone), email };
      data.residents.push(resident);
      data.apartments.push({ id: uid("apt"), blockId: block.id, no, floor: Number(record.floor) || 1, residentId: resident.id });
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
            passwordHash: hashPassword("demo123"),
          });
        }
      }
      result.created += 1;
    });
    await writeData(data);
    json(res, 201, { ...result, data: publicData(data) });
    return;
  }

  if (method === "GET" && url.pathname === "/api/health-score") {
    json(res, 200, { current: calculateHealthScore(data), history: data.healthScores || [] });
    return;
  }

  if (method === "POST" && url.pathname === "/api/health-score/snapshot") {
    const current = calculateHealthScore(data);
    const snapshot = {
      id: uid("hs"),
      date: today(),
      score: current.score,
      status: current.status,
      reasons: current.reasons,
      actions: current.actions,
    };
    if (!Array.isArray(data.healthScores)) data.healthScores = [];
    data.healthScores.push(snapshot);
    await writeData(data);
    json(res, 201, { snapshot, current, history: data.healthScores });
    return;
  }

  if (method === "POST" && url.pathname === "/api/reset") {
    await repository.reset();
    json(res, 200, publicData(await readData()));
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
    res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
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
};
