const STORAGE_KEY = "apartai-mvp-state-v1";
const SESSION_KEY = "apartai-session-v1";
const TOKEN_KEY = "apartai-token-v1";
const API_BASE = location.protocol === "file:" ? "" : "/api";

// Sosyal medya yapılandırması (küratörlü). Buradaki handle/url alanlarını
// kendi hesaplarınla değiştir. `featured` alanı öne çıkan içeriği belirler:
//   - youtube: video URL'si ya da video ID'si
//   - instagram/tiktok/x: gönderi (post/tweet) URL'si
// `featured` boş bırakılırsa o platform için sadece kart gösterilir.
const SOCIAL = {
  youtube: { handle: "@ApartAI", url: "https://www.youtube.com/@ApartAI", featured: "" },
  instagram: { handle: "@apartai", url: "https://www.instagram.com/apartai", featured: "" },
  tiktok: { handle: "@apartai", url: "https://www.tiktok.com/@apartai", featured: "" },
  x: { handle: "@apartai", url: "https://x.com/apartai", featured: "" },
};

const SOCIAL_META = {
  youtube: { label: "YouTube", color: "#ff0000", icon: "M23 12s0-3.2-.4-4.6a2.4 2.4 0 0 0-1.7-1.7C19.4 5.3 12 5.3 12 5.3s-7.4 0-8.9.4A2.4 2.4 0 0 0 1.4 7.4C1 8.8 1 12 1 12s0 3.2.4 4.6a2.4 2.4 0 0 0 1.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.4 2.4 0 0 0 1.7-1.7C23 15.2 23 12 23 12ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" },
  instagram: { label: "Instagram", color: "#e1306c", icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .4 1.4.9.5.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.4 1-.9 1.4-.4.5-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.7 3.7 0 0 1-1.4-.9 3.7 3.7 0 0 1-.9-1.4c-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.4-1 .9-1.4.4-.5.8-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 3.2A6.6 6.6 0 1 0 18.6 12 6.6 6.6 0 0 0 12 5.4Zm0 10.9A4.3 4.3 0 1 1 16.3 12 4.3 4.3 0 0 1 12 16.3Zm6.8-11.2a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5Z" },
  tiktok: { label: "TikTok", color: "#010101", icon: "M16.6 5.8a4.8 4.8 0 0 1-3-2.7h-2.9v12.4a2.6 2.6 0 1 1-2-2.5V9.9a5.4 5.4 0 1 0 4.9 5.4V9.2a7.7 7.7 0 0 0 4.4 1.4V7.7a4.8 4.8 0 0 1-1.4-1.9Z" },
  x: { label: "X", color: "#000000", icon: "M18.2 2.5h3.3l-7.2 8.2 8.5 11.3h-6.6l-5.2-6.8-6 6.8H1.7l7.7-8.8L1.3 2.5H8l4.7 6.2 5.5-6.2Zm-1.2 17.8h1.8L7.1 4.3H5.2L17 20.3Z" },
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const seedState = {
  view: "dashboard",
  mode: "manager",
  selectedResidentId: "resident-1",
  selectedRequestId: null,
  selectedDueId: null,
  reminderDraft: "",
  reminderFallbackUsed: true,
  requestStatusFilter: "all",
  requestCategoryFilter: "all",
  sessionUser: null,
  site: {
    id: "site-1",
    name: "Çınar Apartmanı",
    address: "Kadıköy, İstanbul",
  },
  users: [
    { id: "user-admin-1", name: "Ömer Faruk Baysal", email: "admin@apartai.local", phone: "05xx 000 00 00", role: "admin" },
    { id: "user-resident-1", name: "Ayşe Demir", email: "ayse@example.com", phone: "05xx 111 22 33", role: "resident", residentId: "resident-1" },
    { id: "user-resident-2", name: "Mert Kaya", email: "mert@example.com", phone: "05xx 222 33 44", role: "resident", residentId: "resident-2" },
  ],
  blocks: [
    { id: "block-a", name: "A Blok" },
    { id: "block-b", name: "B Blok" },
    { id: "block-c", name: "C Blok" },
  ],
  apartments: [
    { id: "apt-1", blockId: "block-a", no: "1", floor: 1, residentId: "resident-1" },
    { id: "apt-2", blockId: "block-a", no: "2", floor: 1, residentId: "resident-2" },
    { id: "apt-3", blockId: "block-b", no: "7", floor: 3, residentId: "resident-3" },
    { id: "apt-4", blockId: "block-c", no: "11", floor: 5, residentId: "resident-4" },
  ],
  residents: [
    { id: "resident-1", name: "Ayşe Demir", phone: "05xx 111 22 33", email: "ayse@example.com" },
    { id: "resident-2", name: "Mert Kaya", phone: "05xx 222 33 44", email: "mert@example.com" },
    { id: "resident-3", name: "Selin Ak", phone: "05xx 333 44 55", email: "selin@example.com" },
    { id: "resident-4", name: "Can Öztürk", phone: "05xx 444 55 66", email: "can@example.com" },
  ],
  dues: [
    { id: "due-1", apartmentId: "apt-1", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "paid" },
    { id: "due-2", apartmentId: "apt-2", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "pending" },
    { id: "due-3", apartmentId: "apt-3", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "overdue" },
    { id: "due-4", apartmentId: "apt-4", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "paid" },
  ],
  payments: [
    { id: "pay-1", dueId: "due-1", apartmentId: "apt-1", amount: 1850, date: "2026-05-02", method: "Havale", note: "Mayıs aidatı" },
    { id: "pay-2", dueId: "due-4", apartmentId: "apt-4", amount: 1850, date: "2026-05-03", method: "Nakit", note: "Makbuz kesildi" },
  ],
  requests: [
    {
      id: "req-1",
      apartmentId: "apt-4",
      category: "Temizlik",
      title: "C blok girişinde çöp kokusu",
      description: "C blok girişinde iki gündür çöpler alınmıyor, koku oluştu.",
      photoDataUrl: "",
      urgency: "Orta",
      status: "inceleniyor",
      adminNote: "Temizlik firması aranacak.",
      aiSummary: "C blok girişinde çöp toplama aksaması bildirildi.",
      aiSuggestedAction: "Temizlik firmasıyla aynı gün kontrol planla ve ilgili blokta takip notu oluştur.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "C blok girişi",
      createdAt: "2026-05-01",
      resolvedAt: "",
    },
    {
      id: "req-2",
      apartmentId: "apt-3",
      category: "Asansör",
      title: "B blok asansör ses yapıyor",
      description: "B blok asansörü kalkışta sert ses çıkarıyor.",
      photoDataUrl: "",
      urgency: "Yüksek",
      status: "firmaya_iletildi",
      adminNote: "Bakım firması bugün gelecek.",
      aiSummary: "B blok asansörü için teknik kontrol gerekli.",
      aiSuggestedAction: "Bakım firmasına servis kaydı aç, çözüm saatini sakinlerle duyuru olarak paylaş.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "B blok",
      createdAt: "2026-04-29",
      resolvedAt: "",
    },
  ],
  announcements: [
    {
      id: "ann-1",
      title: "Mayıs aidat dönemi",
      content: "Mayıs ayı aidat ödemeleri 10 Mayıs tarihine kadar yapılmalıdır.",
      aiContent: "Değerli sakinlerimiz, Mayıs ayı aidat ödemelerinizi 10 Mayıs tarihine kadar tamamlamanızı rica ederiz.",
      audience: "Tüm site",
      date: "2026-05-01",
    },
  ],
};

let state = structuredClone(seedState);
let authMode = "login";
let authModalOpen = false;

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedState);
  try {
    return { ...structuredClone(seedState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = { ...state, ...patch };
  if (!API_BASE) saveState();
  render();
}

function applyServerData(data, patch = {}) {
  const uiState = {
    view: state.view,
    mode: state.mode,
    selectedResidentId: state.selectedResidentId,
    selectedRequestId: state.selectedRequestId,
    selectedDueId: state.selectedDueId,
    reminderDraft: state.reminderDraft,
    reminderFallbackUsed: state.reminderFallbackUsed,
    requestStatusFilter: state.requestStatusFilter,
    requestCategoryFilter: state.requestCategoryFilter,
    sessionUser: state.sessionUser,
  };
  state = { ...state, ...data, ...uiState, ...patch };
  if (state.sessionUser?.role === "resident") {
    state.mode = "resident";
    state.selectedResidentId = state.sessionUser.residentId;
  }
  render();
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function apiRequest(path, options = {}) {
  if (!API_BASE) return null;
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (response.status === 401) {
    setToken(null);
    saveSession(null);
    state.sessionUser = null;
    render();
    throw new Error("Oturum süresi doldu, lütfen tekrar giriş yapın.");
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "İstek başarısız oldu" }));
    throw new Error(error.error || "İstek başarısız oldu");
  }
  return response.json();
}

async function loadRemoteState() {
  if (!API_BASE) {
    state = loadLocalState();
    state.sessionUser = loadSession();
    render();
    return;
  }
  try {
    state = { ...state, ...(await apiRequest("/state")) };
    state.sessionUser = loadSession();
    if (state.sessionUser?.role === "resident") {
      state.mode = "resident";
      state.view = "resident-home";
      state.selectedResidentId = state.sessionUser.residentId;
    }
    render();
  } catch (error) {
    document.querySelector("#app").innerHTML = `<div class="main"><section class="section"><h1>Bağlantı kurulamadı</h1><p>${safeText(error.message)}</p></section></div>`;
  }
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeText(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Yalnızca görsel dosyası eklenebilir."));
      return;
    }
    if (file.size > 1_500_000) {
      reject(new Error("Fotoğraf 1.5 MB altında olmalı."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
    reader.readAsDataURL(file);
  });
}

function previewRequestPhoto(input) {
  const preview = document.querySelector("#request-photo-preview");
  if (!preview) return;
  const file = input.files?.[0];
  if (!file) {
    preview.innerHTML = "";
    return;
  }
  fileToDataUrl(file)
    .then((dataUrl) => {
      preview.innerHTML = `<img src="${dataUrl}" alt="Talep fotoğrafı önizleme" />`;
    })
    .catch((error) => {
      input.value = "";
      preview.innerHTML = `<span>${safeText(error.message)}</span>`;
    });
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
}

function dateText(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function apartmentLabel(apartmentId) {
  const apt = state.apartments.find((item) => item.id === apartmentId);
  if (!apt) return "-";
  const block = state.blocks.find((item) => item.id === apt.blockId);
  return `${block?.name ?? "Blok"} / Daire ${apt.no}`;
}

function residentForApartment(apartmentId) {
  const apt = state.apartments.find((item) => item.id === apartmentId);
  return state.residents.find((item) => item.id === apt?.residentId);
}

function statusClass(status) {
  if (["paid", "cozuldu"].includes(status)) return "ok";
  if (["overdue", "reddedildi"].includes(status)) return "danger";
  if (["firmaya_iletildi", "inceleniyor"].includes(status)) return "info";
  return "warn";
}

function dueStatusText(status) {
  return { paid: "Ödendi", pending: "Bekliyor", overdue: "Gecikti" }[status] ?? status;
}

function dueSummary() {
  const total = state.dues.reduce((sum, due) => sum + Number(due.amount), 0);
  const paid = state.dues.filter((due) => due.status === "paid").reduce((sum, due) => sum + Number(due.amount), 0);
  const pending = state.dues.filter((due) => due.status !== "paid").reduce((sum, due) => sum + Number(due.amount), 0);
  const overdue = state.dues.filter((due) => due.status === "overdue").reduce((sum, due) => sum + Number(due.amount), 0);
  const paidCount = state.dues.filter((due) => due.status === "paid").length;
  const collectionRate = Math.round((paid / Math.max(total, 1)) * 100);
  return { total, paid, pending, overdue, paidCount, collectionRate };
}

function dueRiskLevel(due) {
  if (due.status === "paid") return { label: "Düşük", className: "ok" };
  if (due.status === "overdue") return { label: "Yüksek", className: "danger" };
  const daysLeft = Math.ceil((new Date(due.dueDate) - new Date()) / 86400000);
  if (daysLeft <= 3) return { label: "Orta", className: "warn" };
  return { label: "Düşük", className: "info" };
}

function reminderTextForDue(due) {
  const resident = residentForApartment(due.apartmentId);
  const greeting = resident?.name ? `Sayın ${resident.name},` : "Değerli sakinimiz,";
  const statusNote = due.status === "overdue" ? "son ödeme tarihi geçtiği için" : "son ödeme tarihi yaklaşan";
  return `${greeting} ${due.period} dönemine ait ${money(due.amount)} tutarındaki aidat borcunuz ${statusNote} ödeme beklemektedir. Uygun olduğunuzda ödemenizi tamamlamanızı rica ederiz. Teşekkürler.`;
}

function requestPhotoSrc(request) {
  // Yeni kayıtlar dosya URL'si (photoUrl), eski kayıtlar/localStorage modu
  // gömülü base64 (photoDataUrl) tutabilir.
  return request?.photoUrl || request?.photoDataUrl || "";
}

function aiBadge(item) {
  if (!item) return `<span class="status warn">Demo AI</span>`;
  return item.aiFallbackUsed === false || item.fallbackUsed === false
    ? `<span class="status info">AI</span>`
    : `<span class="status warn">Demo AI</span>`;
}

function brandLogo(className = "brand-logo") {
  return `<img class="${className}" src="assets/apartai-logo-transparent.png" alt="ApartAI" />`;
}

function requestStatusText(status) {
  return {
    yeni: "Yeni",
    inceleniyor: "İnceleniyor",
    firmaya_iletildi: "Firmaya iletildi",
    cozuldu: "Çözüldü",
    reddedildi: "Reddedildi",
  }[status] ?? status;
}

function calculateHealthScore() {
  const totalDues = state.dues.length || 1;
  const paidRatio = state.dues.filter((due) => due.status === "paid").length / totalDues;
  const openRequests = state.requests.filter((request) => request.status !== "cozuldu" && request.status !== "reddedildi");
  const resolved = state.requests.filter((request) => request.resolvedAt);
  const avgResolutionDays = resolved.length
    ? resolved.reduce((sum, request) => sum + daysBetween(request.createdAt, request.resolvedAt), 0) / resolved.length
    : 2.5;
  const complaintDensity = Math.min(state.requests.length / Math.max(state.apartments.length, 1), 1.4);
  const recurringRatio = recurringIssues().length ? 0.35 : 0.08;
  const communicationScore = Math.min(state.announcements.length / 4, 1);

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
  if (recurringIssues().length) {
    reasons.push("Aynı blok ve kategoride tekrar eden talepler var.");
    actions.push(`${recurringIssues()[0].label} için kalıcı çözüm kontrolü planla.`);
  }
  if (state.announcements.length < 2) {
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

function daysBetween(start, end) {
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
}

function recurringIssues() {
  const groups = {};
  state.requests.forEach((request) => {
    const apt = state.apartments.find((item) => item.id === request.apartmentId);
    const block = state.blocks.find((item) => item.id === apt?.blockId);
    const key = `${block?.name ?? "Genel"}-${request.category}`;
    groups[key] = (groups[key] ?? 0) + 1;
  });
  return Object.entries(groups)
    .filter(([, count]) => count > 1)
    .map(([label, count]) => ({ label: label.replace("-", " / "), count }));
}

function requestStats() {
  const open = state.requests.filter((request) => !["cozuldu", "reddedildi"].includes(request.status)).length;
  const resolved = state.requests.filter((request) => request.status === "cozuldu").length;
  const resolutionRate = Math.round((resolved / Math.max(state.requests.length, 1)) * 100);
  return { open, resolved, resolutionRate };
}

function knownAssignees() {
  return [...new Set(state.requests.map((request) => request.assignee).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr-TR"));
}

// Firma/taşeron performansı: atanmış taleplerden toplam/açık/çözülen sayısı
// ve ortalama çözüm süresi (gün) çıkarılır.
function vendorPerformance() {
  const groups = {};
  state.requests
    .filter((request) => request.assignee)
    .forEach((request) => {
      const key = request.assignee;
      if (!groups[key]) groups[key] = { assignee: key, total: 0, open: 0, resolved: 0, totalDays: 0 };
      const group = groups[key];
      group.total += 1;
      if (request.status === "cozuldu" && request.resolvedAt) {
        group.resolved += 1;
        group.totalDays += daysBetween(request.assignedAt || request.createdAt, request.resolvedAt);
      } else if (!["cozuldu", "reddedildi"].includes(request.status)) {
        group.open += 1;
      }
    });
  return Object.values(groups)
    .map((group) => ({ ...group, avgDays: group.resolved ? Math.round((group.totalDays / group.resolved) * 10) / 10 : null }))
    .sort((a, b) => b.total - a.total);
}

function blockIssueDensity() {
  const counts = state.blocks.map((block) => {
    const apartmentIds = state.apartments.filter((apartment) => apartment.blockId === block.id).map((apartment) => apartment.id);
    const count = state.requests.filter((request) => apartmentIds.includes(request.apartmentId)).length;
    return { block: block.name, count };
  });
  return counts.sort((a, b) => b.count - a.count);
}

function pilotMetrics() {
  const residentsWithActivity = new Set([
    ...state.dues.map((due) => state.apartments.find((apartment) => apartment.id === due.apartmentId)?.residentId).filter(Boolean),
    ...state.requests.map((request) => state.apartments.find((apartment) => apartment.id === request.apartmentId)?.residentId).filter(Boolean),
  ]);
  const residentActivityRate = Math.round((residentsWithActivity.size / Math.max(state.residents.length, 1)) * 100);
  const systemRequestRate = state.requests.length ? 100 : 0;
  const announcementCount = state.announcements.length;
  return { residentActivityRate, systemRequestRate, announcementCount };
}

function similarRequests(targetRequest) {
  if (!targetRequest) return [];
  const targetApartment = state.apartments.find((item) => item.id === targetRequest.apartmentId);
  return state.requests
    .filter((request) => {
      if (request.id === targetRequest.id) return false;
      const apartment = state.apartments.find((item) => item.id === request.apartmentId);
      return request.category === targetRequest.category || apartment?.blockId === targetApartment?.blockId;
    })
    .slice(0, 4);
}

function aiActionForRequest(request) {
  if (!request) return "";
  const byCategory = {
    Temizlik: "Temizlik firmasıyla aynı gün kontrol planla ve ilgili blokta takip notu oluştur.",
    Asansör: "Bakım firmasına servis kaydı aç, çözüm saatini sakinlerle duyuru olarak paylaş.",
    Güvenlik: "Güvenlik vardiyası ve kamera kayıtlarını kontrol ederek olay notu oluştur.",
    "Su ve tesisat": "Tesisat firmasına keşif kaydı aç ve su kesintisi riski varsa duyuru hazırla.",
    Elektrik: "Elektrik ekibine kontrol kaydı aç, ortak alan güvenliğini önceliklendir.",
    Otopark: "Araç/plaka bilgisini netleştir ve otopark kullanım kuralını tekrar duyur.",
    Gürültü: "İlgili daireyle kibar uyarı iletişimi kur ve tekrarı için kayıt tut.",
    Peyzaj: "Bahçe bakım planına ekle ve çözüm tarihini sakin ekranında güncelle.",
  };
  return byCategory[request.category] ?? "Talebi ilgili sorumluya yönlendir ve çözüm tarihini görünür şekilde güncelle.";
}

function analyzeComplaint(text) {
  const lower = text.toLocaleLowerCase("tr-TR");
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
  const block = state.blocks.find((item) => lower.includes(item.name.toLocaleLowerCase("tr-TR").replace(" blok", "")));
  const location = block ? `${block.name}` : lower.includes("giriş") ? "Giriş alanı" : "Belirtilmedi";
  const similar = state.requests.filter((request) => request.category === category && request.location.includes(block?.name ?? "")).length;
  return {
    category,
    urgency,
    location,
    summary: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    action: `${category} konusu için ilgili kontrol/servis kaydı açılmalı.`,
    similar,
  };
}

function improveAnnouncement(text, tone) {
  const cleaned = text.trim();
  const openings = {
    Resmi: "Değerli sakinlerimiz,",
    Kibar: "Değerli komşularımız,",
    Kısa: "Bilgilendirme:",
    Detaylı: "Değerli sakinlerimiz, aşağıdaki konu hakkında bilginize başvururuz:",
    "Uyarı niteliğinde": "Önemli hatırlatma:",
  };
  const closing = tone === "Kısa" ? "" : " Anlayışınız ve iş birliğiniz için teşekkür ederiz.";
  return `${openings[tone] ?? openings.Kibar} ${cleaned}${closing}`;
}

function render() {
  const app = document.querySelector("#app");
  if (!state.sessionUser) {
    app.innerHTML = authView();
    return;
  }
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          ${brandLogo()}
          <div>
            <strong>ApartAI</strong>
            <span>AI destekli site yönetimi</span>
          </div>
        </div>
        ${state.mode === "manager" ? managerNav() : residentNav()}
        <div class="sidebar-footer">
          ${state.site.name}<br />
          ${state.site.address}
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="title">
            <h1>${pageTitle()}</h1>
            <p>${pageDescription()}</p>
          </div>
          ${sessionActions()}
        </div>
        ${state.mode === "manager" ? managerView() : residentView()}
      </main>
    </div>
  `;
}

function youtubeId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function socialIcon(platform) {
  const meta = SOCIAL_META[platform];
  return `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" style="--brand:${meta.color}"><path d="${meta.icon}" /></svg>`;
}

function socialFeaturedSlot(platform) {
  const conf = SOCIAL[platform];
  if (!conf?.featured) {
    return `<div class="social-featured empty"><span>Öne çıkan içerik eklenmedi</span></div>`;
  }
  // YouTube gizlilik dostu iframe ile doğrudan gömülür (çerez yükü düşük).
  if (platform === "youtube") {
    const vid = youtubeId(conf.featured);
    if (!vid) return `<div class="social-featured empty"><span>Geçersiz YouTube bağlantısı</span></div>`;
    return `<div class="social-featured"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="YouTube önizleme" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  // Instagram / TikTok / X: dış scriptler yalnızca kullanıcı tıklayınca yüklenir
  // (KVKK/gizlilik ve performans için tıkla-yükle önizleme).
  return `
    <div class="social-featured facade" id="social-facade-${platform}">
      <button type="button" class="social-load" onclick="loadSocialEmbed('${platform}')">
        ${socialIcon(platform)}
        <span>Önizlemeyi yükle</span>
        <small>İçerik ${SOCIAL_META[platform].label}'dan yüklenir</small>
      </button>
    </div>`;
}

function socialCard(platform) {
  const conf = SOCIAL[platform];
  const meta = SOCIAL_META[platform];
  return `
    <article class="social-card" style="--brand:${meta.color}">
      <header class="social-card-head">
        ${socialIcon(platform)}
        <div>
          <strong>${meta.label}</strong>
          <span>${safeText(conf.handle)}</span>
        </div>
        <a class="social-follow" href="${conf.url}" target="_blank" rel="noopener noreferrer">Takip et</a>
      </header>
      ${socialFeaturedSlot(platform)}
    </article>`;
}

function socialSection() {
  const platforms = Object.keys(SOCIAL);
  return `
    <section class="social-section" id="sosyal-medya">
      <div class="social-head">
        <div class="auth-kicker"><span></span>Sosyal Medya</div>
        <h2>Bizi takip et, içeriklerimizi sitenin içinden gör</h2>
        <p>Hesaplarımızı tek tıkla aç ya da öne çıkan içeriklerimizi buradan önizle.</p>
      </div>
      <div class="social-grid">
        ${platforms.map((platform) => socialCard(platform)).join("")}
      </div>
    </section>`;
}

// Resmi gömme scriptini bir kez yükler ve widget'ı işler.
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-social="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.social = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Önizleme yüklenemedi."));
    document.head.appendChild(script);
  });
}

function loadSocialEmbed(platform) {
  const conf = SOCIAL[platform];
  const slot = document.querySelector(`#social-facade-${platform}`);
  if (!conf?.featured || !slot) return;
  const url = conf.featured;
  if (platform === "instagram") {
    slot.classList.remove("facade");
    slot.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>`;
    loadScriptOnce("https://www.instagram.com/embed.js")
      .then(() => window.instgrm?.Embeds?.process())
      .catch((error) => (slot.innerHTML = `<div class="social-featured empty"><span>${safeText(error.message)}</span></div>`));
  } else if (platform === "tiktok") {
    slot.classList.remove("facade");
    slot.innerHTML = `<blockquote class="tiktok-embed" cite="${url}"><a href="${url}"></a></blockquote>`;
    loadScriptOnce("https://www.tiktok.com/embed.js").catch(
      (error) => (slot.innerHTML = `<div class="social-featured empty"><span>${safeText(error.message)}</span></div>`)
    );
  } else if (platform === "x") {
    slot.classList.remove("facade");
    slot.innerHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
    loadScriptOnce("https://platform.twitter.com/widgets.js")
      .then(() => window.twttr?.widgets?.load(slot))
      .catch((error) => (slot.innerHTML = `<div class="social-featured empty"><span>${safeText(error.message)}</span></div>`));
  }
}

function authView() {
  const isLogin = authMode === "login";
  return `
    <main class="auth-page">
      <section class="auth-hero">
        <nav class="landing-nav">
          <div class="landing-brand">
            ${brandLogo("landing-logo")}
            <div>
              <strong>ApartAI</strong>
              <span>AI destekli site yönetimi</span>
            </div>
          </div>
          <div class="landing-actions">
            <button class="btn ghost" onclick="openAuthModal('login')">Giriş</button>
            <button class="btn primary" onclick="openAuthModal('register')">Sakin Kaydı</button>
          </div>
        </nav>
        <div class="auth-copy">
          <div class="auth-kicker"><span></span>AI destekli site yönetim asistanı</div>
          <h1>Apartman yönetimini tek panelde sakinleştir.</h1>
          <p>Aidat, arıza, şikayet, duyuru ve aylık yönetici özetlerini aynı yerde topla. ApartAI veriyi yorumlar, tekrar eden sorunları yakalar ve yöneticinin sonraki aksiyonunu netleştirir.</p>
          <div class="hero-cta">
            <button class="btn primary" onclick="openAuthModal('login')">Demo Panele Gir</button>
            <button class="btn ghost" onclick="openAuthModal('register')">Sakin Hesabı Oluştur</button>
          </div>
        </div>
        <div class="auth-scene" aria-hidden="true">
          <img class="hero-logo" src="assets/apartai-logo-wide.png" alt="" />
          <svg viewBox="0 0 620 430" role="img">
            <defs>
              <linearGradient id="towerGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f7fffb" stop-opacity="0.98" />
                <stop offset="100%" stop-color="#bfe6df" stop-opacity="0.84" />
              </linearGradient>
              <linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.94" />
                <stop offset="100%" stop-color="#dbeaf8" stop-opacity="0.76" />
              </linearGradient>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#061816" flood-opacity="0.22" />
              </filter>
            </defs>
            <path class="svg-orbit" d="M116 219c56-92 183-135 296-96 95 33 150 112 121 178-31 72-156 98-272 70-111-27-192-75-145-152z" />
            <g class="svg-building" filter="url(#softShadow)">
              <rect x="96" y="92" width="170" height="260" rx="18" fill="url(#towerGradient)" />
              <rect x="130" y="132" width="35" height="35" rx="8" />
              <rect x="194" y="132" width="35" height="35" rx="8" />
              <rect x="130" y="190" width="35" height="35" rx="8" />
              <rect x="194" y="190" width="35" height="35" rx="8" />
              <rect x="130" y="248" width="35" height="35" rx="8" />
              <rect x="194" y="248" width="35" height="35" rx="8" />
              <rect x="160" y="308" width="42" height="44" rx="10" />
            </g>
            <g class="svg-panel" filter="url(#softShadow)">
              <rect x="294" y="72" width="226" height="160" rx="20" fill="url(#panelGradient)" />
              <path d="M326 183c25-31 52-19 72-42 21-25 45-19 80-50" />
              <circle cx="326" cy="183" r="8" />
              <circle cx="398" cy="141" r="8" />
              <circle cx="478" cy="91" r="8" />
              <rect x="326" y="112" width="82" height="10" rx="5" />
              <rect x="326" y="132" width="50" height="10" rx="5" />
            </g>
            <g class="svg-score" filter="url(#softShadow)">
              <circle cx="446" cy="304" r="70" />
              <path d="M446 247a57 57 0 1 1-51 82" />
              <text x="446" y="314" text-anchor="middle">72</text>
            </g>
            <g class="svg-chip chip-one">
              <rect x="70" y="46" width="150" height="42" rx="21" />
              <text x="145" y="73" text-anchor="middle">Tahsilat %68</text>
            </g>
            <g class="svg-chip chip-two">
              <rect x="386" y="248" width="158" height="42" rx="21" />
              <text x="465" y="275" text-anchor="middle">4 açık talep</text>
            </g>
          </svg>
        </div>
        <div class="auth-stats">
          <span><strong>72</strong> Site Sağlık Skoru</span>
          <span><strong>3 dk</strong> Talep sınıflandırma</span>
          <span><strong>1 panel</strong> Yönetici ve sakin akışı</span>
        </div>
        <div class="auth-features">
          <article><strong>AI Şikayet Analizi</strong><span>Kategori, aciliyet, lokasyon ve önerilen aksiyon.</span></article>
          <article><strong>Akıllı Yönetici Özeti</strong><span>Aidat, talep ve tekrar eden sorunlardan aylık özet.</span></article>
          <article><strong>Mobil Sakin Ekranı</strong><span>Borç, duyuru ve talep durumu için sade web deneyimi.</span></article>
        </div>
      </section>
      ${socialSection()}
      ${authModalOpen ? authModalView(isLogin) : ""}
    </main>
  `;
}

function authModalView(isLogin) {
  return `
    <div class="modal-backdrop" onclick="closeAuthModal(event)">
      <section class="auth-card" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="authModalOpen = false; render()" aria-label="Kapat">×</button>
        <div class="auth-card-head">
          ${brandLogo("modal-logo")}
          <div>
            <strong>ApartAI'ye Hoş Geldin</strong>
            <span>Pilot paneline giriş yap veya yeni sakin hesabı oluştur.</span>
          </div>
        </div>
        <div class="auth-tabs">
          <button class="${isLogin ? "active" : ""}" onclick="authMode = 'login'; authModalOpen = true; render()">Giriş</button>
          <button class="${!isLogin ? "active" : ""}" onclick="authMode = 'register'; authModalOpen = true; render()">Sakin kaydı</button>
        </div>
        ${
          isLogin
            ? `<form class="grid" onsubmit="loginUser(event)">
                <label>E-posta<input name="email" type="email" value="admin@apartai.local" required /></label>
                <label>Şifre<input name="password" type="password" value="demo123" required /></label>
                <button class="btn primary" type="submit">Panele Gir</button>
                <div class="demo-users">
                  <button type="button" onclick="quickLogin('admin@apartai.local')">Yönetici demosu</button>
                  <button type="button" onclick="quickLogin('ayse@example.com')">Sakin demosu</button>
                </div>
                <p class="auth-note">Demo hesapları pilot akışlarını hızlıca denemen için hazırlandı.</p>
              </form>`
            : `<form class="grid" onsubmit="registerResident(event)">
                <label>Ad soyad<input name="name" required /></label>
                <label>E-posta<input name="email" type="email" required /></label>
                <label>Telefon<input name="phone" placeholder="05xx" /></label>
                <label>Blok
                  <select name="blockId">${state.blocks.map((block) => `<option value="${block.id}">${block.name}</option>`).join("")}</select>
                </label>
                <div class="form-grid wide">
                  <label>Daire no<input name="apartmentNo" required /></label>
                  <label>Kat<input name="floor" type="number" value="1" required /></label>
                </div>
                <label>Şifre<input name="password" type="password" value="demo123" required /></label>
                <button class="btn primary" type="submit">Sakin Hesabı Oluştur</button>
              </form>`
        }
      </section>
    </div>
  `;
}

function openAuthModal(mode) {
  authMode = mode;
  authModalOpen = true;
  render();
}

function closeAuthModal(event) {
  if (event.target.classList.contains("modal-backdrop")) {
    authModalOpen = false;
    render();
  }
}

function sessionActions() {
  const user = state.sessionUser;
  const switcher =
    user.role === "admin"
      ? `<div class="mode-switch" aria-label="Ekran tipi">
          <button class="${state.mode === "manager" ? "active" : ""}" onclick="setState({ mode: 'manager', view: 'dashboard' })">Yönetici</button>
          <button class="${state.mode === "resident" ? "active" : ""}" onclick="setState({ mode: 'resident', view: 'resident-home', selectedResidentId: '${state.residents[0]?.id ?? ""}' })">Sakin</button>
        </div>`
      : `<span class="status info">Sakin hesabı</span>`;
  return `
    <div class="session-bar">
      ${switcher}
      <div class="user-chip">
        <strong>${user.name}</strong>
        <span>${user.email}</span>
      </div>
      <button class="btn" onclick="logoutUser()">Çıkış</button>
    </div>
  `;
}

function managerNav() {
  const items = [
    ["dashboard", "Panel"],
    ["dues", "Aidatlar"],
    ["requests", "Talepler"],
    ["announcements", "Duyurular"],
    ["setup", "Site Kurulumu"],
    ["reports", "Rapor"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}' })">${label}</button>`).join("")}</nav>`;
}

function residentNav() {
  const items = [
    ["resident-home", "Özet"],
    ["resident-request", "Talep Aç"],
    ["resident-announcements", "Duyurular"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}' })">${label}</button>`).join("")}</nav>`;
}

function pageTitle() {
  const titles = {
    dashboard: "Yönetici Paneli",
    dues: "Aidat Takibi",
    requests: "Arıza ve Şikayet Talepleri",
    announcements: "Duyurular",
    setup: "Site Kurulumu",
    reports: "Aylık Rapor",
    "resident-home": "Sakin Ekranı",
    "resident-request": "Talep Aç",
    "resident-announcements": "Duyurular",
  };
  return titles[state.view] ?? "ApartAI";
}

function pageDescription() {
  const descriptions = {
    dashboard: "Site sağlığı, ödeme durumu, açık talepler ve AI aksiyonları.",
    dues: "Dönem bazlı borç oluşturma ve manuel ödeme takibi.",
    requests: "Sakin taleplerini sınıflandır, önceliklendir ve çözüm süresini izle.",
    announcements: "Duyuru yayınla ve AI ile metni sakin bir tona getir.",
    setup: "Blok, daire ve sakin kayıtlarını yönet.",
    reports: "Tahsilat, kategori yoğunluğu ve skor nedenlerini incele.",
    "resident-home": "Borcunu, ödeme geçmişini ve açık taleplerini gör.",
    "resident-request": "Arıza veya şikayetini yönetime ilet.",
    "resident-announcements": "Yönetim duyurularını takip et.",
  };
  return descriptions[state.view] ?? "";
}

function managerView() {
  return {
    dashboard: dashboardView,
    dues: duesView,
    requests: requestsView,
    announcements: announcementsView,
    setup: setupView,
    reports: reportsView,
  }[state.view]();
}

function residentView() {
  return {
    "resident-home": residentHomeView,
    "resident-request": residentRequestView,
    "resident-announcements": residentAnnouncementsView,
  }[state.view]();
}

function dashboardView() {
  const health = calculateHealthScore();
  const paid = state.dues.filter((due) => due.status === "paid").length;
  const openRequests = state.requests.filter((request) => !["cozuldu", "reddedildi"].includes(request.status));
  const avgResolution = openRequests.length ? "Açık takip" : "2.5 gün";
  return `
    <div class="grid dashboard-grid">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Site Sağlık Skoru</h2>
            <p>Operasyonel durumun tek bakış özeti.</p>
          </div>
          <span class="score-status">${health.status}</span>
        </div>
        <div class="score">
          <div class="score-ring" style="--score: ${health.score}">
            <strong>${health.score}</strong>
          </div>
          <div>
            <ul class="plain-list">
              ${health.reasons.map((reason) => `<li>${reason}</li>`).join("")}
            </ul>
          </div>
        </div>
      </section>
      <section class="section metric">
        <span>Bu ay tahsilat</span>
        <strong>%${Math.round((paid / Math.max(state.dues.length, 1)) * 100)}</strong>
        <small>${paid}/${state.dues.length} aidat ödendi</small>
      </section>
      <section class="section metric">
        <span>Açık talep</span>
        <strong>${openRequests.length}</strong>
        <small>Ortalama çözüm: ${avgResolution}</small>
      </section>
    </div>
    <div class="split" style="margin-top:16px">
      <section class="section">
        <div class="section-header"><h2>AI Aksiyon Önerileri</h2></div>
        <ul class="actions-list">
          ${health.actions.map((action) => `<li>${action}</li>`).join("")}
        </ul>
      </section>
      <section class="section">
        <div class="section-header"><h2>Son Duyurular</h2></div>
        <ul class="plain-list">
          ${state.announcements.slice(-3).reverse().map((item) => `<li><strong>${item.title}</strong><br>${item.aiContent || item.content}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function duesView() {
  const summary = dueSummary();
  const riskyDues = state.dues.filter((due) => due.status !== "paid").sort((a, b) => {
    const riskOrder = { Yüksek: 0, Orta: 1, Düşük: 2 };
    return riskOrder[dueRiskLevel(a).label] - riskOrder[dueRiskLevel(b).label];
  });
  const selectedDue = state.dues.find((due) => due.id === state.selectedDueId);
  return `
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>Tahsilat oranı</span>
        <strong>%${summary.collectionRate}</strong>
        <small>${summary.paidCount}/${state.dues.length} aidat ödendi</small>
      </section>
      <section class="section metric">
        <span>Tahsil edilen</span>
        <strong>${money(summary.paid)}</strong>
        <small>Toplam: ${money(summary.total)}</small>
      </section>
      <section class="section metric">
        <span>Bekleyen risk</span>
        <strong>${money(summary.pending)}</strong>
        <small>Gecikmiş: ${money(summary.overdue)}</small>
      </section>
    </div>
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Tahsilat Risk Listesi</h2>
            <p>Öncelikli hatırlatma gönderilecek daireler.</p>
          </div>
        </div>
        <ul class="mini-list">
          ${
            riskyDues.length
              ? riskyDues.slice(0, 5).map((due) => {
                  const risk = dueRiskLevel(due);
                  return `<li><span>${risk.label} risk</span>${apartmentLabel(due.apartmentId)} - ${money(due.amount)}<small>${residentForApartment(due.apartmentId)?.name ?? "-"} / ${dateText(due.dueDate)}</small></li>`;
                }).join("")
              : `<li><span>Temiz</span>Bekleyen aidat bulunmuyor.<small>Tahsilat akışı dengeli.</small></li>`
          }
        </ul>
      </section>
      <section class="section">
        <div class="section-header">
          <div>
            <h2>AI Tahsilat Yorumu</h2>
            <p>Bu dönem için kısa yönetici aksiyonu.</p>
          </div>
        </div>
        <div class="ai-panel">
          <span class="status info">AI önerisi</span>
          <h3>${summary.collectionRate >= 85 ? "Tahsilat ritmi sağlıklı" : "Hatırlatma aksiyonu gerekli"}</h3>
          <p>${summary.collectionRate >= 85 ? "Ödeme düzeni iyi görünüyor. Bekleyen küçük tutarlar için dönem kapanışına yakın tek hatırlatma yeterli." : `${riskyDues.length} daire için ödeme takibi gerekiyor. Önce gecikmiş aidatlar, ardından son ödeme tarihi yaklaşan kayıtlar ele alınmalı.`}</p>
          <strong>${summary.overdue > 0 ? "Gecikmiş dairelere bugün kibar hatırlatma metni gönder." : "Bekleyen kayıtları son ödeme tarihinden 3 gün önce hatırlat."}</strong>
        </div>
      </section>
    </div>
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Toplu Aidat Oluştur</h2>
          <p>Seçilen dönem için tüm dairelere borç kaydı açılır.</p>
        </div>
      </div>
      <form class="form-grid" onsubmit="createDues(event)">
        <label>Dönem<input name="period" type="month" value="2026-05" required /></label>
        <label>Tutar<input name="amount" type="number" min="1" value="1850" required /></label>
        <label>Son ödeme<input name="dueDate" type="date" value="2026-05-10" required /></label>
        <button class="btn primary" type="submit">Aidat Oluştur</button>
      </form>
    </section>
    <section class="section" style="margin-top:16px">
      <div class="section-header"><h2>Daire Bazlı Borçlar</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Daire</th><th>Sakin</th><th>Dönem</th><th>Tutar</th><th>Son Ödeme</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>
            ${state.dues.map((due) => `
              <tr>
                <td>${apartmentLabel(due.apartmentId)}</td>
                <td>${residentForApartment(due.apartmentId)?.name ?? "-"}</td>
                <td>${due.period}</td>
                <td>${money(due.amount)}</td>
                <td>${dateText(due.dueDate)}</td>
                <td><span class="status ${statusClass(due.status)}">${dueStatusText(due.status)}</span></td>
                <td>
                  ${due.status !== "paid" ? `<div class="inline-actions"><button class="btn" onclick="markPaid('${due.id}')">Ödendi</button><button class="btn" onclick="openReminderModal('${due.id}')">Hatırlat</button></div>` : "-"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
    ${selectedDue ? reminderModal(selectedDue) : ""}
  `;
}

function reminderModal(due) {
  const resident = residentForApartment(due.apartmentId);
  const risk = dueRiskLevel(due);
  const draft = state.reminderDraft || reminderTextForDue(due);
  return `
    <div class="modal-backdrop" onclick="closeDueModal(event)">
      <section class="request-modal" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="setState({ selectedDueId: null, reminderDraft: '' })" aria-label="Kapat">×</button>
        <div class="section-header">
          <div>
            <h2>Ödeme Hatırlatma Taslağı</h2>
            <p>${apartmentLabel(due.apartmentId)} - ${resident?.name ?? "Sakin"}</p>
          </div>
          <span class="status ${risk.className}">${risk.label} risk</span>
        </div>
        <div class="request-detail-grid">
          <div class="request-detail-main">
            <div class="ai-panel">
              ${aiBadge({ fallbackUsed: state.reminderFallbackUsed })}
              <h3>${due.period} dönemi / ${money(due.amount)}</h3>
              <p>Son ödeme tarihi: ${dateText(due.dueDate)}. Bu metin sakinle paylaşılmadan önce yönetici tarafından düzenlenebilir.</p>
              <strong>${due.status === "overdue" ? "Ton kibar ama net tutulmalı; gecikme bilgisi açıkça belirtilmeli." : "Ton yumuşak tutulmalı; son ödeme tarihi yaklaşımı hatırlatılmalı."}</strong>
            </div>
            <label>Hatırlatma metni
              <textarea rows="7" oninput="state.reminderDraft = this.value">${safeText(draft)}</textarea>
            </label>
          </div>
          <div class="request-side-form">
            <span class="status ${statusClass(due.status)}">${dueStatusText(due.status)}</span>
            <div class="notice">
              <strong>Ödeme Bilgisi</strong>
              <p>${money(due.amount)} / ${due.period}</p>
              <small>${resident?.phone ?? "-"} / ${resident?.email ?? "-"}</small>
            </div>
            <button class="btn primary" onclick="markReminderSent('${due.id}')">Hatırlatma Gönderildi İşaretle</button>
            <button class="btn" onclick="markPaid('${due.id}')">Ödendi İşaretle</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function requestsView() {
  const categories = [...new Set(state.requests.map((request) => request.category))];
  const statusOptions = ["yeni", "inceleniyor", "firmaya_iletildi", "cozuldu", "reddedildi"];
  const statusFilter = statusOptions.includes(state.requestStatusFilter) ? state.requestStatusFilter : "all";
  const categoryFilter = categories.includes(state.requestCategoryFilter) ? state.requestCategoryFilter : "all";
  const filteredRequests = state.requests.filter((request) => {
    const statusOk = statusFilter === "all" || request.status === statusFilter;
    const categoryOk = categoryFilter === "all" || request.category === categoryFilter;
    return statusOk && categoryOk;
  });
  const selectedRequest = state.requests.find((request) => request.id === state.selectedRequestId);
  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Talep Listesi</h2>
          <p>AI özetleri ve durum takibi aynı ekranda.</p>
        </div>
      </div>
      <div class="toolbar">
        <label>Durum
          <select onchange="setState({ requestStatusFilter: this.value })">
            <option value="all" ${statusFilter === "all" ? "selected" : ""}>Tümü</option>
            ${statusOptions.map((status) => `<option value="${status}" ${statusFilter === status ? "selected" : ""}>${requestStatusText(status)}</option>`).join("")}
          </select>
        </label>
        <label>Kategori
          <select onchange="setState({ requestCategoryFilter: this.value })">
            <option value="all" ${categoryFilter === "all" ? "selected" : ""}>Tümü</option>
            ${categories.map((category) => `<option value="${category}" ${categoryFilter === category ? "selected" : ""}>${category}</option>`).join("")}
          </select>
        </label>
        <button class="btn" onclick="setState({ requestStatusFilter: 'all', requestCategoryFilter: 'all' })">Filtreleri Temizle</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Talep</th><th>Daire</th><th>Kategori</th><th>Aciliyet</th><th>AI Özeti</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>
            ${filteredRequests.map((request) => `
              <tr>
                <td><strong>${request.title}</strong><br>${request.description}<br><small>${dateText(request.createdAt)} - ${request.location}</small></td>
                <td>${apartmentLabel(request.apartmentId)}</td>
                <td>${request.category}</td>
                <td><span class="status ${request.urgency === "Yüksek" ? "danger" : request.urgency === "Orta" ? "warn" : "info"}">${request.urgency}</span></td>
                <td>${request.aiSummary}<br>${aiBadge(request)}${requestPhotoSrc(request) ? ` <span class="status info">Fotoğraflı</span>` : ""}</td>
                <td><span class="status ${statusClass(request.status)}">${requestStatusText(request.status)}</span>${request.assignee ? `<br><small>${safeText(request.assignee)}</small>` : ""}</td>
                <td>
                  <button class="btn" onclick="setState({ selectedRequestId: '${request.id}' })">Detay</button>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="7">Bu filtrelere uygun talep yok.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    ${selectedRequest ? requestDetailModal(selectedRequest) : ""}
  `;
}

function requestDetailModal(request) {
  const similar = similarRequests(request);
  return `
    <div class="modal-backdrop" onclick="closeRequestModal(event)">
      <section class="request-modal" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="setState({ selectedRequestId: null })" aria-label="Kapat">×</button>
        <div class="section-header">
          <div>
            <h2>${request.title}</h2>
            <p>${apartmentLabel(request.apartmentId)} - ${dateText(request.createdAt)}</p>
          </div>
          <span class="status ${request.urgency === "Yüksek" ? "danger" : request.urgency === "Orta" ? "warn" : "info"}">${request.urgency}</span>
        </div>
        <div class="request-detail-grid">
          <div class="request-detail-main">
            <div class="notice">
              <strong>Talep Açıklaması</strong>
              <p>${request.description}</p>
            </div>
            ${
              requestPhotoSrc(request)
                ? `<figure class="attachment-preview"><img src="${requestPhotoSrc(request)}" alt="Talep fotoğrafı" /><figcaption>Sakin tarafından eklenen fotoğraf${request.aiImageAnalyzed ? ` <span class="status info">Görsel AI ile analiz edildi</span>` : ""}</figcaption></figure>`
                : ""
            }
            <div class="ai-panel">
              ${aiBadge(request)}
              <h3>${request.category} - ${request.location}</h3>
              <p>${request.aiSummary}</p>
              <strong>${request.aiSuggestedAction || aiActionForRequest(request)}</strong>
            </div>
            <div class="notice">
              <strong>Benzer Talepler</strong>
              ${
                similar.length
                  ? `<ul class="mini-list">${similar.map((item) => `<li><span>${item.category}</span>${item.title}<small>${apartmentLabel(item.apartmentId)} - ${requestStatusText(item.status)}</small></li>`).join("")}</ul>`
                  : `<p>Benzer blok veya kategoride yakın talep bulunmadı.</p>`
              }
            </div>
          </div>
          <form class="request-side-form" onsubmit="saveRequestDetail(event, '${request.id}')">
            <label>Durum
              <select name="status">
                ${["yeni", "inceleniyor", "firmaya_iletildi", "cozuldu", "reddedildi"].map((status) => `<option value="${status}" ${request.status === status ? "selected" : ""}>${requestStatusText(status)}</option>`).join("")}
              </select>
            </label>
            <label>Atanan firma/kişi
              <input name="assignee" list="assignee-options" placeholder="Örn. Yılmaz Asansör" value="${safeText(request.assignee || "")}" />
              <datalist id="assignee-options">
                ${knownAssignees().map((name) => `<option value="${safeText(name)}"></option>`).join("")}
              </datalist>
            </label>
            ${request.assignee && request.assignedAt ? `<small class="muted">Atama tarihi: ${dateText(request.assignedAt)}</small>` : ""}
            <label>Yönetici notu
              <textarea name="adminNote" placeholder="Firma, aksiyon veya sakin iletişimi notu">${safeText(request.adminNote || "")}</textarea>
            </label>
            <button class="btn primary" type="submit">Kaydet</button>
            <button class="btn warn" type="button" onclick="deleteRequest('${request.id}')">Talebi Sil</button>
          </form>
        </div>
      </section>
    </div>
  `;
}

function announcementReadStats(item) {
  const readCount = (item.readBy || []).length;
  const residentCount = state.users.filter((user) => user.role === "resident").length;
  return { readCount, residentCount };
}

function deliveryText(delivery) {
  if (!delivery) return "";
  const channel = delivery.channel === "sms" ? "SMS" : "e-posta";
  const sim = delivery.simulated ? ", simülasyon" : "";
  if (delivery.sent !== undefined) return ` (${delivery.sent}/${delivery.total} ${channel}${sim})`;
  return delivery.ok ? ` (${channel} iletildi${sim})` : ` (${channel} iletilemedi)`;
}

function notificationHistory() {
  const reminders = state.payments
    .filter((payment) => payment.method === "Hatırlatma")
    .map((payment) => ({
      type: "Hatırlatma",
      date: payment.date,
      target: apartmentLabel(payment.apartmentId),
      detail: (payment.note || "Aidat hatırlatması") + deliveryText(payment.delivery),
    }));
  const announcements = state.announcements.map((item) => {
    const stats = announcementReadStats(item);
    return {
      type: "Duyuru",
      date: item.date,
      target: item.audience || "Tüm site",
      detail: `${item.title} — ${stats.readCount}/${stats.residentCount} okundu` + deliveryText(item.delivery),
    };
  });
  return [...reminders, ...announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function announcementsView() {
  const history = notificationHistory();
  return `
    <div class="split">
      <section class="section">
        <div class="section-header"><h2>Duyuru Oluştur</h2></div>
        <form class="grid" onsubmit="createAnnouncement(event)">
          <label>Başlık<input name="title" required placeholder="Örn. Su kesintisi bilgilendirmesi" /></label>
          <label>Ton
            <select name="tone">
              <option>Kibar</option>
              <option>Resmi</option>
              <option>Kısa</option>
              <option>Detaylı</option>
              <option>Uyarı niteliğinde</option>
            </select>
          </label>
          <label>İçerik<textarea name="content" required placeholder="Duyuru metnini yazın"></textarea></label>
          <label>Hedef kitle<input name="audience" value="Tüm site" required /></label>
          <button class="btn primary" type="submit">AI ile Düzenle ve Yayınla</button>
        </form>
      </section>
      <section class="section">
        <div class="section-header"><h2>Yayınlanan Duyurular</h2></div>
        <div class="grid">
          ${state.announcements.slice().reverse().map((item) => {
            const stats = announcementReadStats(item);
            return `
            <article class="notice">
              <strong>${item.title}</strong>
              <span class="status info">${item.audience}</span> ${aiBadge(item)}
              <span class="status ${stats.readCount ? "ok" : "warn"}">${stats.readCount}/${stats.residentCount} okundu</span>
              <p>${item.aiContent || item.content}</p>
              <small>${dateText(item.date)}</small>
            </article>
          `;
          }).join("")}
        </div>
      </section>
    </div>
    <section class="section">
      <div class="section-header"><h2>Bildirim Geçmişi</h2></div>
      ${
        history.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Tarih</th><th>Tür</th><th>Hedef</th><th>Detay</th></tr></thead>
              <tbody>${history.map((item) => `<tr><td>${dateText(item.date)}</td><td><span class="status ${item.type === "Duyuru" ? "info" : "warn"}">${item.type}</span></td><td>${safeText(item.target)}</td><td>${safeText(item.detail)}</td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p>Henüz gönderilen bildirim yok.</p>`
      }
    </section>
  `;
}

function setupView() {
  return `
    <div class="split">
      <section class="section">
        <div class="section-header"><h2>Daire ve Sakin Ekle</h2></div>
        <form class="form-grid wide" onsubmit="createApartment(event)">
          <label>Blok
            <select name="blockId">${state.blocks.map((block) => `<option value="${block.id}">${block.name}</option>`).join("")}</select>
          </label>
          <label>Daire No<input name="no" required /></label>
          <label>Kat<input name="floor" type="number" value="1" required /></label>
          <label>Sakin Adı<input name="residentName" required /></label>
          <label>Telefon<input name="phone" placeholder="05xx" /></label>
          <label>E-posta<input name="email" type="email" /></label>
          <button class="btn primary" type="submit">Kaydı Ekle</button>
        </form>
        ${
          API_BASE
            ? `<div class="section-header" style="margin-top:1.5rem"><h2>CSV ile Toplu İçeri Aktarma</h2></div>
              <p class="muted">Başlık: <code>Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta</code>. Olmayan bloklar otomatik oluşturulur, mevcut daireler atlanır.</p>
              <form class="form-grid wide" onsubmit="importApartmentsCsv(event)">
                <label class="full">CSV içeriği<textarea name="csv" rows="5" placeholder="Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta&#10;D Blok,3,2,Ali Veli,05xx,ali@example.com"></textarea></label>
                <label>veya dosya seç<input name="csvFile" type="file" accept=".csv,text/csv" onchange="loadCsvFileIntoTextarea(this)" /></label>
                <button class="btn primary" type="submit">İçeri Aktar</button>
              </form>`
            : ""
        }
      </section>
      <section class="section">
        <div class="section-header"><h2>Mevcut Daireler</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Daire</th><th>Kat</th><th>Sakin</th><th>Telefon</th></tr></thead>
            <tbody>
              ${state.apartments.map((apt) => {
                const resident = state.residents.find((item) => item.id === apt.residentId);
                return `<tr><td>${apartmentLabel(apt.id)}</td><td>${apt.floor}</td><td>${resident?.name ?? "-"}</td><td>${resident?.phone ?? "-"}</td></tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function reportsView() {
  const health = calculateHealthScore();
  const dues = dueSummary();
  const requests = requestStats();
  const blocks = blockIssueDensity();
  const pilot = pilotMetrics();
  const byCategory = state.requests.reduce((acc, request) => {
    acc[request.category] = (acc[request.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Henüz veri yok";
  const topBlock = blocks[0]?.count ? blocks[0].block : "Henüz veri yok";
  return `
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>Site Sağlık Skoru</span>
        <strong>${health.score}</strong>
        <small>${health.status}</small>
      </section>
      <section class="section metric">
        <span>Tahsilat oranı</span>
        <strong>%${dues.collectionRate}</strong>
        <small>${money(dues.paid)} tahsil edildi</small>
      </section>
      <section class="section metric">
        <span>Çözüm oranı</span>
        <strong>%${requests.resolutionRate}</strong>
        <small>${requests.open} açık talep</small>
      </section>
    </div>
    <div class="split">
      <section class="section">
        <div class="section-header"><h2>Aylık Yönetici Özeti</h2></div>
        <ul class="plain-list">
          <li>Toplam tahsilat oranı %${dues.collectionRate}; bekleyen tutar ${money(dues.pending)}.</li>
          <li>En çok talep gelen kategori: ${topCategory}.</li>
          <li>En yoğun blok/alan: ${topBlock}.</li>
          <li>Site Sağlık Skoru ${health.score}/100 ve durum ${health.status}.</li>
          <li>${health.actions[0]}</li>
        </ul>
      </section>
      <section class="section">
        <div class="section-header"><h2>Kategori Yoğunluğu</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Kategori</th><th>Talep Sayısı</th></tr></thead>
            <tbody>
              ${Object.entries(byCategory).map(([category, count]) => `<tr><td>${category}</td><td>${count}</td></tr>`).join("") || `<tr><td colspan="2">Henüz talep yok</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <div class="split">
      <section class="section">
        <div class="section-header"><h2>Blok Bazlı Yoğunluk</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Blok</th><th>Talep Sayısı</th><th>Durum</th></tr></thead>
            <tbody>
              ${blocks.map((item) => `<tr><td>${item.block}</td><td>${item.count}</td><td><span class="status ${item.count > 2 ? "warn" : "ok"}">${item.count > 2 ? "İzlenmeli" : "Normal"}</span></td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>
      <section class="section">
        <div class="section-header"><h2>Pilot Başarı Metrikleri</h2></div>
        <ul class="plain-list">
          <li>Sakin aktivite oranı: %${pilot.residentActivityRate}</li>
          <li>Sistemden açılan talep oranı: %${pilot.systemRequestRate}</li>
          <li>Yayınlanan duyuru sayısı: ${pilot.announcementCount}</li>
          <li>Tekrarlayan sorun sinyali: ${recurringIssues().length ? recurringIssues().map((item) => `${item.label} (${item.count})`).join(", ") : "Henüz yok"}</li>
        </ul>
      </section>
    </div>
    <section class="section">
      <div class="section-header"><h2>Firma / Taşeron Performansı</h2></div>
      ${
        vendorPerformance().length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Firma/Kişi</th><th>Toplam</th><th>Açık</th><th>Çözülen</th><th>Ort. Çözüm (gün)</th></tr></thead>
              <tbody>${vendorPerformance().map((v) => `<tr><td>${safeText(v.assignee)}</td><td>${v.total}</td><td>${v.open}</td><td>${v.resolved}</td><td>${v.avgDays ?? "-"}</td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p>Henüz atanmış talep yok. Talep detayından firma/kişi atayabilirsin.</p>`
      }
    </section>
    <section class="section">
      <div class="section-header">
        <h2>Site Sağlık Skoru Geçmişi</h2>
        ${API_BASE ? `<button class="btn-primary" onclick="saveHealthSnapshot()">Skoru kaydet</button>` : ""}
      </div>
      ${
        (state.healthScores || []).length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Tarih</th><th>Skor</th><th>Durum</th></tr></thead>
              <tbody>${state.healthScores.slice().reverse().map((item) => `<tr><td>${dateText(item.date)}</td><td>${item.score}</td><td><span class="status ${item.score >= 75 ? "ok" : item.score >= 60 ? "warn" : "danger"}">${item.status}</span></td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p>Henüz kayıtlı skor anlık görüntüsü yok. "Skoru kaydet" ile bugünün skorunu geçmişe ekleyebilirsin.</p>`
      }
    </section>
  `;
}

function saveHealthSnapshot() {
  if (!API_BASE) return;
  apiRequest("/health-score/snapshot", { method: "POST" })
    .then((result) => {
      setState({ healthScores: result.history });
    })
    .catch((error) => alert(error.message));
}

function currentResident() {
  const residentId = state.sessionUser?.role === "resident" ? state.sessionUser.residentId : state.selectedResidentId;
  return state.residents.find((item) => item.id === residentId) ?? state.residents[0];
}

function residentApartment() {
  return state.apartments.find((item) => item.residentId === currentResident().id);
}

function residentHomeView() {
  const apt = residentApartment();
  const dues = state.dues.filter((due) => due.apartmentId === apt?.id);
  const requests = state.requests.filter((request) => request.apartmentId === apt?.id);
  return `
    <div class="resident-shell">
      <section class="mobile-preview">
        <div class="resident-header">
          <h1>${currentResident().name}</h1>
          <span>${apartmentLabel(apt?.id)}</span>
        </div>
        <div class="resident-body">
          <section class="section">
            <div class="section-header"><h2>Borç Durumu</h2></div>
            ${dues.map((due) => `<div class="notice"><strong>${due.period} - ${money(due.amount)}</strong><span class="status ${statusClass(due.status)}">${dueStatusText(due.status)}</span><p>Son ödeme: ${dateText(due.dueDate)}</p></div>`).join("")}
          </section>
          <section class="section">
            <div class="section-header"><h2>Açık Taleplerim</h2></div>
            ${requests.length ? requests.map((request) => `<div class="notice"><strong>${request.title}</strong><span class="status ${statusClass(request.status)}">${requestStatusText(request.status)}</span><p>${request.aiSummary}</p></div>`).join("") : `<div class="empty">Açık talep bulunmuyor.</div>`}
          </section>
        </div>
      </section>
    </div>
  `;
}

function residentRequestView() {
  const apt = residentApartment();
  return `
    <div class="resident-shell">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Yeni Talep</h2>
            <p>${apartmentLabel(apt?.id)} adına kayıt açılır.</p>
          </div>
        </div>
        <form class="grid" onsubmit="createResidentRequest(event)">
          <label>Başlık<input name="title" required placeholder="Örn. Asansör çalışmıyor" /></label>
          <label>Açıklama<textarea name="description" required placeholder="Sorunu kısa ve net yazın"></textarea></label>
          <label>Fotoğraf
            <input name="photo" type="file" accept="image/*" onchange="previewRequestPhoto(this)" />
          </label>
          <div id="request-photo-preview" class="upload-preview"></div>
          <button class="btn primary" type="submit">AI ile Analiz Et ve Gönder</button>
        </form>
      </section>
    </div>
  `;
}

let markingAnnouncementsRead = false;

function unreadAnnouncementsForSession() {
  const userId = state.sessionUser?.id;
  if (!userId) return [];
  return state.announcements.filter((item) => !(item.readBy || []).some((entry) => entry.userId === userId));
}

// Sakin duyuru ekranını açtığında okunmamışları sunucuda okundu işaretler.
// İşaretleme idempotent olduğundan tekrar render'lar yeni istek üretmez.
function markAnnouncementsRead() {
  if (markingAnnouncementsRead) return;
  const unread = unreadAnnouncementsForSession();
  if (!unread.length) return;
  markingAnnouncementsRead = true;
  if (!API_BASE) {
    const userId = state.sessionUser.id;
    state.announcements = state.announcements.map((item) =>
      unread.includes(item)
        ? { ...item, readBy: [...(item.readBy || []), { userId, name: state.sessionUser.name, date: new Date().toISOString().slice(0, 10) }] }
        : item
    );
    saveState();
    markingAnnouncementsRead = false;
    render();
    return;
  }
  unread
    .reduce((chain, item) => chain.then(() => apiRequest(`/announcements/${item.id}/read`, { method: "POST" })), Promise.resolve(null))
    .then((finalData) => {
      if (finalData) applyServerData(finalData);
    })
    .catch(() => {})
    .finally(() => {
      markingAnnouncementsRead = false;
    });
}

function residentAnnouncementsView() {
  const userId = state.sessionUser?.id;
  if (unreadAnnouncementsForSession().length) {
    setTimeout(markAnnouncementsRead, 60);
  }
  return `
    <div class="resident-shell">
      <section class="section">
        <div class="section-header"><h2>Duyurular</h2></div>
        <div class="grid">
          ${state.announcements.slice().reverse().map((item) => {
            const isNew = userId && !(item.readBy || []).some((entry) => entry.userId === userId);
            return `<article class="notice"><strong>${item.title}</strong>${isNew ? `<span class="status warn">Yeni</span>` : ""}${aiBadge(item)}<p>${item.aiContent || item.content}</p><small>${dateText(item.date)}</small></article>`;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

function createDues(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const period = form.get("period");
  const amount = Number(form.get("amount"));
  const dueDate = form.get("dueDate");
  if (API_BASE) {
    apiRequest("/dues/bulk", { method: "POST", body: JSON.stringify({ period, amount, dueDate }) }).then((result) => {
      applyServerData(result.data);
    });
    return;
  }
  const existing = new Set(state.dues.filter((due) => due.period === period).map((due) => due.apartmentId));
  const newDues = state.apartments
    .filter((apt) => !existing.has(apt.id))
    .map((apt) => ({ id: id("due"), apartmentId: apt.id, period, amount, dueDate, status: "pending" }));
  state.dues = [...state.dues, ...newDues];
  saveState();
  render();
}

function userWithoutPassword(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function applyLoggedInUser(user) {
  const safeUser = userWithoutPassword(user);
  saveSession(safeUser);
  state.sessionUser = safeUser;
  authModalOpen = false;
  state.selectedRequestId = null;
  if (safeUser.role === "resident") {
    state.mode = "resident";
    state.view = "resident-home";
    state.selectedResidentId = safeUser.residentId;
  } else {
    state.mode = "manager";
    state.view = "dashboard";
  }
  render();
}

function loginUser(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = safeText(form.get("email"));
  const password = safeText(form.get("password"));
  if (API_BASE) {
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
      .then((result) => {
        setToken(result.token);
        state = { ...state, ...result.data };
        applyLoggedInUser(result.user);
      })
      .catch((error) => alert(error.message));
    return;
  }
  const user = state.users.find((item) => item.email.toLocaleLowerCase("tr-TR") === email.toLocaleLowerCase("tr-TR"));
  applyLoggedInUser(user);
}

function quickLogin(email) {
  const form = document.createElement("form");
  form.innerHTML = `<input name="email" value="${email}"><input name="password" value="demo123">`;
  loginUser({ preventDefault() {}, target: form });
}

function registerResident(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    name: safeText(form.get("name")),
    email: safeText(form.get("email")),
    phone: safeText(form.get("phone")),
    blockId: safeText(form.get("blockId")),
    apartmentNo: safeText(form.get("apartmentNo")),
    floor: Number(form.get("floor")),
    password: safeText(form.get("password")),
  };
  if (API_BASE) {
    apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) })
      .then((result) => {
        setToken(result.token);
        state = { ...state, ...result.data };
        applyLoggedInUser(result.user);
      })
      .catch((error) => alert(error.message));
    return;
  }
  const residentId = id("resident");
  const user = { id: id("user"), name: payload.name, email: payload.email, phone: payload.phone, role: "resident", residentId };
  state.residents = [...state.residents, { id: residentId, name: payload.name, phone: payload.phone, email: payload.email }];
  state.apartments = [...state.apartments, { id: id("apt"), blockId: payload.blockId, no: payload.apartmentNo, floor: payload.floor, residentId }];
  state.users = [...state.users, user];
  saveState();
  applyLoggedInUser(user);
}

function logoutUser() {
  setToken(null);
  saveSession(null);
  state.sessionUser = null;
  render();
}

function markPaid(dueId) {
  if (API_BASE) {
    apiRequest(`/dues/${dueId}/pay`, { method: "POST" }).then((result) => {
      applyServerData(result, { selectedDueId: null, reminderDraft: "", reminderFallbackUsed: true });
    });
    return;
  }
  state.dues = state.dues.map((due) => (due.id === dueId ? { ...due, status: "paid" } : due));
  const due = state.dues.find((item) => item.id === dueId);
  state.payments = [
    ...state.payments,
    { id: id("pay"), dueId, apartmentId: due.apartmentId, amount: due.amount, date: new Date().toISOString().slice(0, 10), method: "Manuel", note: "Yönetici tarafından işlendi" },
  ];
  saveState();
  render();
}

function openReminderModal(dueId) {
  const due = state.dues.find((item) => item.id === dueId);
  setState({ selectedDueId: dueId, reminderDraft: due ? reminderTextForDue(due) : "", reminderFallbackUsed: true });
  if (API_BASE) {
    apiRequest(`/dues/${dueId}/reminder-draft`, { method: "POST" }).then((result) => {
      setState({
        selectedDueId: dueId,
        reminderDraft: result.content || (due ? reminderTextForDue(due) : ""),
        reminderFallbackUsed: result.fallbackUsed !== false,
      });
    });
  }
}

function closeDueModal(event) {
  if (event.target.classList.contains("modal-backdrop")) {
    setState({ selectedDueId: null, reminderDraft: "", reminderFallbackUsed: true });
  }
}

function markReminderSent(dueId) {
  const due = state.dues.find((item) => item.id === dueId);
  const payload = {
    note: state.reminderDraft || (due ? reminderTextForDue(due) : "Ödeme hatırlatması gönderildi."),
  };
  if (API_BASE) {
    apiRequest(`/dues/${dueId}/reminder`, { method: "POST", body: JSON.stringify(payload) }).then((result) => {
      applyServerData(result, { selectedDueId: null, reminderDraft: "", reminderFallbackUsed: true });
    });
    return;
  }
  state.payments = [
    ...state.payments,
    { id: id("reminder"), dueId, apartmentId: due.apartmentId, amount: 0, date: new Date().toISOString().slice(0, 10), method: "Hatırlatma", note: payload.note },
  ];
  state.selectedDueId = null;
  state.reminderDraft = "";
  state.reminderFallbackUsed = true;
  saveState();
  render();
}

function updateRequestStatus(requestId, status) {
  if (API_BASE) {
    apiRequest(`/requests/${requestId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }).then((result) => {
      applyServerData(result);
    });
    return;
  }
  state.requests = state.requests.map((request) =>
    request.id === requestId
      ? { ...request, status, resolvedAt: status === "cozuldu" ? new Date().toISOString().slice(0, 10) : request.resolvedAt }
      : request,
  );
  saveState();
  render();
}

function saveRequestDetail(event, requestId) {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    status: safeText(form.get("status")),
    adminNote: safeText(form.get("adminNote")),
    assignee: safeText(form.get("assignee")),
  };
  if (API_BASE) {
    apiRequest(`/requests/${requestId}`, { method: "PATCH", body: JSON.stringify(payload) }).then((result) => {
      applyServerData(result, { selectedRequestId: null });
    });
    return;
  }
  state.requests = state.requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: payload.status,
          adminNote: payload.adminNote,
          assignee: payload.assignee,
          assignedAt: payload.assignee && payload.assignee !== request.assignee ? new Date().toISOString().slice(0, 10) : request.assignedAt,
          resolvedAt: payload.status === "cozuldu" ? new Date().toISOString().slice(0, 10) : request.resolvedAt,
        }
      : request,
  );
  state.selectedRequestId = null;
  saveState();
  render();
}

function deleteRequest(requestId) {
  if (!confirm("Bu talebi silmek istediğine emin misin?")) return;
  if (API_BASE) {
    apiRequest(`/requests/${requestId}`, { method: "DELETE" }).then((result) => {
      applyServerData(result, { selectedRequestId: null });
    });
    return;
  }
  state.requests = state.requests.filter((request) => request.id !== requestId);
  state.selectedRequestId = null;
  saveState();
  render();
}

function closeRequestModal(event) {
  if (event.target.classList.contains("modal-backdrop")) {
    setState({ selectedRequestId: null });
  }
}

function createAnnouncement(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const content = safeText(form.get("content"));
  const tone = safeText(form.get("tone"));
  const payload = {
    title: safeText(form.get("title")),
    content,
    tone,
    audience: safeText(form.get("audience")),
  };
  if (API_BASE) {
    apiRequest("/announcements", { method: "POST", body: JSON.stringify(payload) }).then((result) => {
      event.target.reset();
      applyServerData(result.data);
    });
    return;
  }
  state.announcements = [
    ...state.announcements,
    {
      id: id("ann"),
      title: payload.title,
      content,
      aiContent: improveAnnouncement(content, tone),
      audience: payload.audience,
      date: new Date().toISOString().slice(0, 10),
    },
  ];
  saveState();
  event.target.reset();
  render();
}

function createApartment(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    blockId: safeText(form.get("blockId")),
    no: safeText(form.get("no")),
    floor: Number(form.get("floor")),
    residentName: safeText(form.get("residentName")),
    phone: safeText(form.get("phone")),
    email: safeText(form.get("email")),
  };
  if (API_BASE) {
    apiRequest("/apartments", { method: "POST", body: JSON.stringify(payload) })
      .then((result) => {
        event.target.reset();
        applyServerData(result.data);
      })
      .catch((error) => alert(error.message));
    return;
  }
  const residentId = id("resident");
  const apartmentId = id("apt");
  state.residents = [
    ...state.residents,
    { id: residentId, name: payload.residentName, phone: payload.phone, email: payload.email },
  ];
  state.apartments = [
    ...state.apartments,
    { id: apartmentId, blockId: payload.blockId, no: payload.no, floor: payload.floor, residentId },
  ];
  saveState();
  event.target.reset();
  render();
}

function loadCsvFileIntoTextarea(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const textarea = input.closest("form")?.querySelector('textarea[name="csv"]');
    if (textarea) textarea.value = String(reader.result || "");
  };
  reader.readAsText(file, "utf-8");
}

function importApartmentsCsv(event) {
  event.preventDefault();
  if (!API_BASE) return;
  const form = new FormData(event.target);
  const csv = String(form.get("csv") || "");
  if (!csv.trim()) {
    alert("Lütfen CSV içeriği yapıştırın veya bir dosya seçin.");
    return;
  }
  apiRequest("/apartments/import", { method: "POST", body: JSON.stringify({ csv }) })
    .then((result) => {
      event.target.reset();
      const errorNote = result.errors?.length ? `\nHatalar:\n- ${result.errors.join("\n- ")}` : "";
      alert(`${result.created} kayıt eklendi, ${result.skipped} mükerrer atlandı, ${result.blocksCreated} yeni blok oluşturuldu.${errorNote}`);
      applyServerData(result.data);
    })
    .catch((error) => alert(error.message));
}

async function createResidentRequest(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const title = safeText(form.get("title"));
  const description = safeText(form.get("description"));
  let photoDataUrl = "";
  try {
    photoDataUrl = await fileToDataUrl(form.get("photo"));
  } catch (error) {
    alert(error.message);
    return;
  }
  if (API_BASE) {
    apiRequest("/requests", {
      method: "POST",
      body: JSON.stringify({ apartmentId: residentApartment().id, title, description, photoDataUrl }),
    }).then((result) => {
      event.target.reset();
      applyServerData(result.data, { view: "resident-home" });
    });
    return;
  }
  const ai = analyzeComplaint(`${title}. ${description}`);
  state.requests = [
    ...state.requests,
    {
      id: id("req"),
      apartmentId: residentApartment().id,
      category: ai.category,
      title,
      description,
      photoDataUrl,
      urgency: ai.urgency,
      status: "yeni",
      adminNote: "",
      aiSummary: ai.summary,
      aiSuggestedAction: ai.action,
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: ai.location,
      createdAt: new Date().toISOString().slice(0, 10),
      resolvedAt: "",
    },
  ];
  saveState();
  event.target.reset();
  setState({ view: "resident-home" });
}

loadRemoteState();
