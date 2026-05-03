const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-nano";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const seed = await fs.readFile(SEED_FILE, "utf8");
    await fs.writeFile(DATA_FILE, seed);
  }
}

async function readData() {
  await ensureDataFile();
  return normalizeData(JSON.parse(await fs.readFile(DATA_FILE, "utf8")));
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 3_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function clean(value) {
  return String(value ?? "").trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function aiStatus() {
  return {
    enabled: Boolean(OPENAI_API_KEY),
    model: OPENAI_MODEL,
    fallbackAvailable: true,
  };
}

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

function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function publicData(data) {
  return {
    ...data,
    users: data.users.map(publicUser),
  };
}

function analyzeComplaint(data, text) {
  const lower = clean(text).toLocaleLowerCase("tr-TR");
  const rules = [
    ["Asansör", ["asansör", "asansÃ¶r", "kabin", "bakım", "bakÄ±m"]],
    ["Temizlik", ["çöp", "Ã§Ã¶p", "temizlik", "koku", "kirli", "pas pas"]],
    ["Güvenlik", ["güvenlik", "gÃ¼venlik", "kapı", "kapÄ±", "kamera", "yabancı", "yabancÄ±"]],
    ["Su ve tesisat", ["su", "tesisat", "kaçak", "kaÃ§ak", "gider", "musluk"]],
    ["Elektrik", ["elektrik", "lamba", "ışık", "Ä±ÅŸÄ±k", "sigorta"]],
    ["Otopark", ["otopark", "araç", "araÃ§", "park"]],
    ["Gürültü", ["gürültü", "gÃ¼rÃ¼ltÃ¼", "ses", "rahatsız", "rahatsÄ±z"]],
    ["Peyzaj", ["bahçe", "bahÃ§e", "peyzaj", "ağaç", "aÄŸaÃ§", "çim", "Ã§im"]],
  ];
  const category = rules.find(([, words]) => words.some((word) => lower.includes(word)))?.[0] ?? "Diğer";
  const urgency = ["acil", "tehlike", "patladı", "patladÄ±", "yangın", "yangÄ±n", "mahsur"].some((word) => lower.includes(word))
    ? "Yüksek"
    : ["iki gündür", "iki gÃ¼ndÃ¼r", "koku", "çalışmıyor", "Ã§alÄ±ÅŸmÄ±yor", "kaçak", "kaÃ§ak"].some((word) => lower.includes(word))
      ? "Orta"
      : "Düşük";
  const block = data.blocks.find((item) => lower.includes(item.name.toLocaleLowerCase("tr-TR").replace(" blok", "")));
  const location = block ? block.name : lower.includes("giriş") || lower.includes("giriÅŸ") ? "Giriş alanı" : "Belirtilmedi";
  const similar = data.requests.filter((request) => request.category === category && request.location.includes(block?.name ?? "")).length;

  return {
    category,
    urgency,
    location,
    summary: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    action: `${category} konusu için ilgili kontrol/servis kaydı açılmalı.`,
    similar,
  };
}

function improveAnnouncement(content, tone) {
  const openings = {
    "Resmi": "Değerli sakinlerimiz,",
    "Kibar": "Değerli komşularımız,",
    "Kısa": "Bilgilendirme:",
    "KÄ±sa": "Bilgilendirme:",
    "Detaylı": "Değerli sakinlerimiz, aşağıdaki konu hakkında bilginize başvururuz:",
    "DetaylÄ±": "Değerli sakinlerimiz, aşağıdaki konu hakkında bilginize başvururuz:",
    "Uyarı niteliğinde": "Önemli hatırlatma:",
    "UyarÄ± niteliÄŸinde": "Önemli hatırlatma:",
  };
  const closing = tone === "Kısa" || tone === "KÄ±sa" ? "" : " Anlayışınız ve iş birliğiniz için teşekkür ederiz.";
  return `${openings[tone] ?? openings.Kibar} ${clean(content)}${closing}`;
}

function withAiMeta(result, fallbackUsed) {
  return {
    ...result,
    provider: fallbackUsed ? "rules" : "openai",
    model: fallbackUsed ? "fallback" : OPENAI_MODEL,
    fallbackUsed,
  };
}

function fallbackPaymentReminder({ resident, due }) {
  const greeting = resident?.name ? `Sayın ${resident.name},` : "Değerli sakinimiz,";
  const statusNote = due.status === "overdue" ? "son ödeme tarihi geçtiği için" : "son ödeme tarihi yaklaşan";
  return `${greeting} ${due.period} dönemine ait ${due.amount} TL tutarındaki aidat borcunuz ${statusNote} ödeme beklemektedir. Uygun olduğunuzda ödemenizi tamamlamanızı rica ederiz. Teşekkürler.`;
}

async function callOpenAIJson({ instructions, input, fallback }) {
  if (!OPENAI_API_KEY) return withAiMeta(fallback, true);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
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
          { role: "user", content: JSON.stringify(input) },
        ],
        text: { format: { type: "json_object" } },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const payload = await response.json();
    const outputText =
      payload.output_text ||
      payload.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")?.text;
    const parsed = JSON.parse(outputText || "{}");
    return withAiMeta({ ...fallback, ...parsed }, false);
  } catch {
    return withAiMeta(fallback, true);
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeComplaintWithAI({ data, title, description }) {
  const fallback = analyzeComplaint(data, `${title}. ${description}`);
  return callOpenAIJson({
    fallback,
    instructions:
      "ApartAI için Türkçe apartman/site talebini analiz et. Sadece JSON döndür. Alanlar: category, urgency, location, summary, action. category şu değerlerden biri olmalı: Temizlik, Güvenlik, Asansör, Su ve tesisat, Elektrik, Otopark, Gürültü, Peyzaj, Diğer. urgency: Düşük, Orta veya Yüksek. summary kısa olsun. action yöneticiye uygulanabilir aksiyon olsun.",
    input: {
      title,
      description,
      blocks: data.blocks.map((block) => block.name),
      categories: ["Temizlik", "Güvenlik", "Asansör", "Su ve tesisat", "Elektrik", "Otopark", "Gürültü", "Peyzaj", "Diğer"],
    },
  });
}

async function improveAnnouncementWithAI({ content, tone }) {
  return callOpenAIJson({
    fallback: { content: improveAnnouncement(content, tone) },
    instructions:
      "ApartAI yöneticisinin duyuru metnini Türkçe olarak iyileştir. Sadece JSON döndür. Alan: content. Ton isteğine uy; metin sakin, profesyonel ve apartman/site sakinlerine uygun olsun.",
    input: { content, tone },
  });
}

async function draftPaymentReminderWithAI({ resident, apartment, due }) {
  return callOpenAIJson({
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

async function routeApi(req, res, url) {
  const data = await readData();
  const method = req.method;

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(req);
    const email = clean(body.email).toLocaleLowerCase("tr-TR");
    const password = clean(body.password);
    const user = data.users.find((item) => item.email.toLocaleLowerCase("tr-TR") === email && item.password === password);
    if (!user) {
      json(res, 401, { error: "E-posta veya şifre hatalı" });
      return;
    }
    json(res, 200, { user: publicUser(user), data: publicData(data) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readBody(req);
    const email = clean(body.email).toLocaleLowerCase("tr-TR");
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
      password: clean(body.password || "demo123"),
    };
    data.residents.push(resident);
    data.apartments.push(apartment);
    data.users.push(user);
    await writeData(data);
    json(res, 201, { user: publicUser(user), data: publicData(data) });
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

  if (method === "POST" && url.pathname === "/api/dues/bulk") {
    const body = await readBody(req);
    const period = clean(body.period);
    const amount = Number(body.amount);
    const dueDate = clean(body.dueDate);
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
    const analysis = await analyzeComplaintWithAI({ data, title, description });
    const request = {
      id: uid("req"),
      apartmentId: clean(body.apartmentId),
      category: analysis.category,
      title,
      description,
      photoDataUrl: clean(body.photoDataUrl),
      urgency: analysis.urgency,
      status: "yeni",
      adminNote: "",
      aiSummary: analysis.summary,
      aiSuggestedAction: analysis.action,
      aiProvider: analysis.provider,
      aiModel: analysis.model,
      aiFallbackUsed: analysis.fallbackUsed,
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
    data.requests.splice(index, 1);
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
    };
    data.announcements.push(announcement);
    await writeData(data);
    json(res, 201, { announcement, data: publicData(data) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/apartments") {
    const body = await readBody(req);
    const resident = {
      id: uid("resident"),
      name: clean(body.residentName),
      phone: clean(body.phone),
      email: clean(body.email),
    };
    const apartment = {
      id: uid("apt"),
      blockId: clean(body.blockId),
      no: clean(body.no),
      floor: Number(body.floor),
      residentId: resident.id,
    };
    data.users.push({
      id: uid("user"),
      name: resident.name,
      phone: resident.phone,
      email: resident.email,
      role: "resident",
      residentId: resident.id,
      password: "demo123",
    });
    data.residents.push(resident);
    data.apartments.push(apartment);
    await writeData(data);
    json(res, 201, { resident, apartment, data: publicData(data) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/reset") {
    await fs.copyFile(SEED_FILE, DATA_FILE);
    json(res, 200, publicData(await readData()));
    return;
  }

  json(res, 404, { error: "Endpoint not found" });
}

async function serveStatic(res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requested));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const ext = path.extname(filePath);
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
    json(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`ApartAI MVP server: http://localhost:${PORT}`);
});
