const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");

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
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
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
      if (body.length > 1_000_000) {
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
    summary: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    action: `${category} konusu için ilgili kontrol/servis kaydı açılmalı.`,
    similar,
  };
}

function improveAnnouncement(content, tone) {
  const openings = {
    Resmi: "Değerli sakinlerimiz,",
    Kibar: "Değerli komşularımız,",
    Kısa: "Bilgilendirme:",
    Detaylı: "Değerli sakinlerimiz, aşağıdaki konu hakkında bilginize başvururuz:",
    "Uyarı niteliğinde": "Önemli hatırlatma:",
  };
  const closing = tone === "Kısa" ? "" : " Anlayışınız ve iş birliğiniz için teşekkür ederiz.";
  return `${openings[tone] ?? openings.Kibar} ${clean(content)}${closing}`;
}

async function routeApi(req, res, url) {
  const data = await readData();
  const method = req.method;

  if (method === "GET" && url.pathname === "/api/state") {
    json(res, 200, data);
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
    json(res, 201, { created: newDues.length, data });
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
    json(res, 200, data);
    return;
  }

  if (method === "POST" && url.pathname === "/api/requests") {
    const body = await readBody(req);
    const title = clean(body.title);
    const description = clean(body.description);
    const analysis = analyzeComplaint(data, `${title}. ${description}`);
    const request = {
      id: uid("req"),
      apartmentId: clean(body.apartmentId),
      category: analysis.category,
      title,
      description,
      urgency: analysis.urgency,
      status: "yeni",
      adminNote: "",
      aiSummary: analysis.summary,
      location: analysis.location,
      createdAt: today(),
      resolvedAt: "",
    };
    data.requests.push(request);
    await writeData(data);
    json(res, 201, { request, analysis, data });
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
    json(res, 200, data);
    return;
  }

  if (method === "POST" && url.pathname === "/api/announcements") {
    const body = await readBody(req);
    const content = clean(body.content);
    const announcement = {
      id: uid("ann"),
      title: clean(body.title),
      content,
      aiContent: improveAnnouncement(content, clean(body.tone)),
      audience: clean(body.audience || "Tüm site"),
      date: today(),
    };
    data.announcements.push(announcement);
    await writeData(data);
    json(res, 201, { announcement, data });
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
    data.residents.push(resident);
    data.apartments.push(apartment);
    await writeData(data);
    json(res, 201, { resident, apartment, data });
    return;
  }

  if (method === "POST" && url.pathname === "/api/reset") {
    await fs.copyFile(SEED_FILE, DATA_FILE);
    json(res, 200, await readData());
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
