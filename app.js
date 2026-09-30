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
  activeSiteId: "site-1",
  isAssistantOpen: false,
  assistantMessages: [],
  isAssistantLoading: false,
  mobileNavOpen: false,
  sites: [
    { id: "site-1", name: "Çınar Apartmanı", address: "Kadıköy, İstanbul" },
    { id: "site-2", name: "Meltem Sitesi", address: "Ataşehir, İstanbul" },
  ],
  users: [
    { id: "user-admin-1", name: "Ömer Faruk Baysal", email: "admin@apartai.local", phone: "05xx 000 00 00", role: "admin", siteIds: ["site-1", "site-2"] },
    { id: "user-resident-1", name: "Ayşe Demir", email: "ayse@example.com", phone: "05xx 111 22 33", role: "resident", residentId: "resident-1", siteId: "site-1" },
    { id: "user-resident-2", name: "Mert Kaya", email: "mert@example.com", phone: "05xx 222 33 44", role: "resident", residentId: "resident-2", siteId: "site-1" },
    { id: "user-resident-3", name: "Deniz Yıldız", email: "deniz@example.com", phone: "05xx 555 66 77", role: "resident", residentId: "resident-5", siteId: "site-2" },
  ],
  blocks: [
    { id: "block-a", siteId: "site-1", name: "A Blok" },
    { id: "block-b", siteId: "site-1", name: "B Blok" },
    { id: "block-c", siteId: "site-1", name: "C Blok" },
    { id: "block-d", siteId: "site-2", name: "D Blok" },
    { id: "block-e", siteId: "site-2", name: "E Blok" },
  ],
  apartments: [
    { id: "apt-1", siteId: "site-1", blockId: "block-a", no: "1", floor: 1, residentId: "resident-1" },
    { id: "apt-2", siteId: "site-1", blockId: "block-a", no: "2", floor: 1, residentId: "resident-2" },
    { id: "apt-3", siteId: "site-1", blockId: "block-b", no: "7", floor: 3, residentId: "resident-3" },
    { id: "apt-4", siteId: "site-1", blockId: "block-c", no: "11", floor: 5, residentId: "resident-4" },
    { id: "apt-5", siteId: "site-2", blockId: "block-d", no: "3", floor: 2, residentId: "resident-5" },
    { id: "apt-6", siteId: "site-2", blockId: "block-d", no: "4", floor: 2, residentId: "resident-6" },
    { id: "apt-7", siteId: "site-2", blockId: "block-e", no: "9", floor: 4, residentId: "resident-7" },
  ],
  residents: [
    { id: "resident-1", siteId: "site-1", name: "Ayşe Demir", phone: "05xx 111 22 33", email: "ayse@example.com", occupancyType: "owner", plateNumber: "34 ABC 123", emergencyContact: "Ahmet Demir (0532 111 00 00)" },
    { id: "resident-2", siteId: "site-1", name: "Mert Kaya", phone: "05xx 222 33 44", email: "mert@example.com", occupancyType: "tenant", plateNumber: "34 DEF 456", emergencyContact: "Mehmet Kaya (0533 222 00 00)" },
    { id: "resident-3", siteId: "site-1", name: "Selin Ak", phone: "05xx 333 44 55", email: "selin@example.com", occupancyType: "owner", plateNumber: "34 GHK 789", emergencyContact: "Fatma Ak (0534 333 00 00)" },
    { id: "resident-4", siteId: "site-1", name: "Can Öztürk", phone: "05xx 444 55 66", email: "can@example.com", occupancyType: "tenant", plateNumber: "34 LMN 012", emergencyContact: "Süleyman Öztürk (0535 444 00 00)" },
    { id: "resident-5", siteId: "site-2", name: "Deniz Yıldız", phone: "05xx 555 66 77", email: "deniz@example.com", occupancyType: "owner", plateNumber: "34 PRS 345", emergencyContact: "Hakan Yıldız (0536 555 00 00)" },
    { id: "resident-6", siteId: "site-2", name: "Burak Şen", phone: "05xx 666 77 88", email: "burak@example.com", occupancyType: "tenant", plateNumber: "34 TUV 678", emergencyContact: "Kemal Şen (0537 666 00 00)" },
    { id: "resident-7", siteId: "site-2", name: "Elif Kara", phone: "05xx 777 88 99", email: "elif@example.com", occupancyType: "owner", plateNumber: "34 YZ 901", emergencyContact: "Zeynep Kara (0538 777 00 00)" },
  ],
  dues: [
    { id: "due-1", siteId: "site-1", apartmentId: "apt-1", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "paid" },
    { id: "due-2", siteId: "site-1", apartmentId: "apt-2", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "pending" },
    { id: "due-3", siteId: "site-1", apartmentId: "apt-3", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "overdue" },
    { id: "due-4", siteId: "site-1", apartmentId: "apt-4", period: "2026-05", amount: 1850, dueDate: "2026-05-10", status: "paid" },
    { id: "due-5", siteId: "site-2", apartmentId: "apt-5", period: "2026-05", amount: 2400, dueDate: "2026-05-10", status: "paid" },
    { id: "due-6", siteId: "site-2", apartmentId: "apt-6", period: "2026-05", amount: 2400, dueDate: "2026-05-10", status: "overdue" },
    { id: "due-7", siteId: "site-2", apartmentId: "apt-7", period: "2026-05", amount: 2400, dueDate: "2026-05-10", status: "overdue" },
  ],
  payments: [
    { id: "pay-1", siteId: "site-1", dueId: "due-1", apartmentId: "apt-1", amount: 1850, date: "2026-05-02", method: "Havale", note: "Mayıs aidatı" },
    { id: "pay-2", siteId: "site-1", dueId: "due-4", apartmentId: "apt-4", amount: 1850, date: "2026-05-03", method: "Nakit", note: "Makbuz kesildi" },
    { id: "pay-3", siteId: "site-2", dueId: "due-5", apartmentId: "apt-5", amount: 2400, date: "2026-05-04", method: "Havale", note: "Mayıs aidatı" },
  ],
  requests: [
    {
      id: "req-1",
      siteId: "site-1",
      apartmentId: "apt-4",
      category: "Temizlik",
      title: "C blok girişinde çöp kokusu",
      description: "C blok girişinde iki gündür çöpler alınmıyor, koku oluştu.",
      photoUrl: "",
      urgency: "Orta",
      status: "inceleniyor",
      adminNote: "Temizlik firması aranacak.",
      assignee: "",
      assignedAt: "",
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
      siteId: "site-1",
      apartmentId: "apt-3",
      category: "Asansör",
      title: "B blok asansör ses yapıyor",
      description: "B blok asansörü kalkışta sert ses çıkarıyor.",
      photoUrl: "",
      urgency: "Yüksek",
      status: "firmaya_iletildi",
      adminNote: "Bakım firması bugün gelecek.",
      assignee: "Yılmaz Asansör",
      assignedAt: "2026-04-30",
      aiSummary: "B blok asansörü için teknik kontrol gerekli.",
      aiSuggestedAction: "Bakım firmasına servis kaydı aç, çözüm saatini sakinlerle duyuru olarak paylaş.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "B blok",
      createdAt: "2026-04-29",
      resolvedAt: "",
    },
    {
      id: "req-3",
      siteId: "site-2",
      apartmentId: "apt-6",
      category: "Elektrik",
      title: "D blok ortak alan aydınlatması yanmıyor",
      description: "D blok merdiven boşluğundaki lambalar iki gündür yanmıyor.",
      photoUrl: "",
      urgency: "Orta",
      status: "yeni",
      adminNote: "",
      assignee: "",
      assignedAt: "",
      aiSummary: "D blok merdiven aydınlatmasında elektrik arızası bildirildi.",
      aiSuggestedAction: "Elektrik ekibine kontrol kaydı aç, ortak alan güvenliğini önceliklendir.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "D Blok",
      createdAt: "2026-05-02",
      resolvedAt: "",
    },
  ],
  announcements: [
    {
      id: "ann-1",
      siteId: "site-1",
      title: "Mayıs aidat dönemi",
      content: "Mayıs ayı aidat ödemeleri 10 Mayıs tarihine kadar yapılmalıdır.",
      aiContent: "Değerli sakinlerimiz, Mayıs ayı aidat ödemelerinizi 10 Mayıs tarihine kadar tamamlamanızı rica ederiz.",
      audience: "Tüm site",
      date: "2026-05-01",
      readBy: [],
    },
    {
      id: "ann-2",
      siteId: "site-2",
      title: "Otopark çizgi yenileme çalışması",
      content: "Cumartesi günü otopark çizgileri yenilenecek, araçlar sokağa alınmalı.",
      aiContent: "Değerli komşularımız, Cumartesi günü otopark çizgi yenileme çalışması yapılacaktır. Araçlarınızı geçici olarak site dışına almanızı rica ederiz.",
      audience: "Tüm site",
      date: "2026-05-03",
      readBy: [],
    },
  ],
  healthScores: [],
  surveys: [
    {
      id: "survey-1",
      siteId: "site-1",
      title: "Otopark Giriş Düzenlemesi ve Misafir Araç Kuralı",
      description: "Akşam 22:00'den sonra misafir araçlarının kapalı otoparka girişi sınırlandırılsın mı?",
      options: [
        "Evet, sınırlandırılsın (Yalnızca sakinler park etsin)",
        "Hayır, müsait yer varsa misafir girebilsin",
        "Çekimser",
      ],
      votes: [
        { userId: "user-resident-1", residentId: "resident-1", apartmentId: "apt-1", optionIndex: 0, date: "2026-05-02" },
        { userId: "user-resident-2", residentId: "resident-2", apartmentId: "apt-2", optionIndex: 1, date: "2026-05-03" },
      ],
      createdAt: "2026-05-01",
      expiresAt: "2026-05-25",
      status: "active",
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
    activeSiteId: state.activeSiteId,
  };
  state = { ...state, ...data, ...uiState, ...patch };
  if (state.sessionUser?.role === "resident") {
    state.mode = "resident";
    state.selectedResidentId = state.sessionUser.residentId;
  }
  ensureActiveSite();
  render();
}

// Seçili site her zaman erişilebilir bir siteye işaret etmeli.
function ensureActiveSite() {
  const sites = state.sites || [];
  if (state.sessionUser?.role === "resident") {
    state.activeSiteId = state.sessionUser.siteId || sites[0]?.id || "";
    return;
  }
  if (!sites.some((site) => site.id === state.activeSiteId)) {
    state.activeSiteId = sites[0]?.id || "";
  }
}

function activeSite() {
  return (state.sites || []).find((site) => site.id === state.activeSiteId) || null;
}

// Aktif siteye göre filtrelenmiş koleksiyonlar. render() öncesi yeniden kurulur,
// böylece görünüm fonksiyonları site sınırını tek bir yerden alır.
let scoped = {
  sites: [],
  users: [],
  blocks: [],
  residents: [],
  apartments: [],
  dues: [],
  payments: [],
  requests: [],
  announcements: [],
  healthScores: [],
  surveys: [],
};

function rebuildScope() {
  const siteId = state.activeSiteId;
  // siteId taşımayan eski kayıtlar da görünür kalsın (geriye dönük uyumluluk).
  const pick = (rows) => (rows || []).filter((row) => !row.siteId || row.siteId === siteId);
  scoped = {
    sites: state.sites || [],
    users: (state.users || []).filter((user) => user.role !== "resident" || !user.siteId || user.siteId === siteId),
    blocks: pick(state.blocks),
    residents: pick(state.residents),
    apartments: pick(state.apartments),
    dues: pick(state.dues),
    payments: pick(state.payments),
    requests: pick(state.requests),
    announcements: pick(state.announcements),
    healthScores: pick(state.healthScores),
    surveys: pick(state.surveys),
  };
}

function switchSite(siteId) {
  setState({
    activeSiteId: siteId,
    selectedRequestId: null,
    selectedDueId: null,
    requestStatusFilter: "all",
    requestCategoryFilter: "all",
  });
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

function dueSummary(rows = scoped.dues) {
  const total = rows.reduce((sum, due) => sum + Number(due.amount), 0);
  const paid = rows.filter((due) => due.status === "paid").reduce((sum, due) => sum + Number(due.amount), 0);
  const pending = rows.filter((due) => due.status !== "paid").reduce((sum, due) => sum + Number(due.amount), 0);
  const overdue = rows.filter((due) => due.status === "overdue").reduce((sum, due) => sum + Number(due.amount), 0);
  const paidCount = rows.filter((due) => due.status === "paid").length;
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

// Varsayılan olarak aktif sitenin verisiyle çalışır; başka bir site kapsamı
// verilirse (çoklu site karşılaştırması) onun üzerinden hesaplar.
function calculateHealthScore(rows = scoped) {
  const totalDues = rows.dues.length || 1;
  const paidRatio = rows.dues.filter((due) => due.status === "paid").length / totalDues;
  const openRequests = rows.requests.filter((request) => request.status !== "cozuldu" && request.status !== "reddedildi");
  const resolved = rows.requests.filter((request) => request.resolvedAt);
  const avgResolutionDays = resolved.length
    ? resolved.reduce((sum, request) => sum + daysBetween(request.createdAt, request.resolvedAt), 0) / resolved.length
    : 2.5;
  const complaintDensity = Math.min(rows.requests.length / Math.max(rows.apartments.length, 1), 1.4);
  const recurring = recurringIssues(rows);
  const recurringRatio = recurring.length ? 0.35 : 0.08;
  const communicationScore = Math.min(rows.announcements.length / 4, 1);

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
  if (rows.announcements.length < 2) {
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

function recurringIssues(rows = scoped) {
  const groups = {};
  rows.requests.forEach((request) => {
    const apt = rows.apartments.find((item) => item.id === request.apartmentId);
    const block = rows.blocks.find((item) => item.id === apt?.blockId);
    const key = `${block?.name ?? "Genel"}-${request.category}`;
    groups[key] = (groups[key] ?? 0) + 1;
  });
  return Object.entries(groups)
    .filter(([, count]) => count > 1)
    .map(([label, count]) => ({ label: label.replace("-", " / "), count }));
}

function requestStats(rows = scoped.requests) {
  const open = rows.filter((request) => !["cozuldu", "reddedildi"].includes(request.status)).length;
  const resolved = rows.filter((request) => request.status === "cozuldu").length;
  const resolutionRate = Math.round((resolved / Math.max(rows.length, 1)) * 100);
  return { open, resolved, resolutionRate };
}

function knownAssignees() {
  return [...new Set(scoped.requests.map((request) => request.assignee).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr-TR"));
}

// Firma/taşeron performansı: atanmış taleplerden toplam/açık/çözülen sayısı,
// kategori, SLA hedefi ve performans karnesi çıkarılır.
function vendorPerformance() {
  const groups = {};
  scoped.requests
    .filter((request) => request.assignee)
    .forEach((request) => {
      const key = request.assignee;
      if (!groups[key]) {
        groups[key] = {
          assignee: key,
          category: request.category || "Genel Bakım",
          total: 0,
          open: 0,
          resolved: 0,
          totalDays: 0,
        };
      }
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
    .map((group) => {
      const avg = group.resolved ? Math.round((group.totalDays / group.resolved) * 10) / 10 : null;
      let scoreText = "⭐⭐⭐⭐⭐ Başarılı (SLA Uygun)";
      let scoreStatus = "ok";
      if (avg === null && group.open > 2) {
        scoreText = "⚠️ Takip Edilmeli";
        scoreStatus = "warn";
      } else if (avg !== null && avg > 3) {
        scoreText = "⚠️ Gecikmeli (>3 Gün)";
        scoreStatus = "danger";
      } else if (avg !== null && avg <= 2) {
        scoreText = "⭐ Hızlı Çözüm (<2 Gün)";
        scoreStatus = "ok";
      }
      return {
        ...group,
        avgDays: avg,
        scoreText,
        scoreStatus,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// Tahsilat Tahmini & Daire Ödeme Alışkanlık Analizi
function collectionForecast() {
  const dues = scoped.dues || [];
  const total = dues.reduce((sum, d) => sum + Number(d.amount), 0);
  const paid = dues.filter((d) => d.status === "paid").reduce((sum, d) => sum + Number(d.amount), 0);
  const overdue = dues.filter((d) => d.status === "overdue");
  const overdueAmount = overdue.reduce((sum, d) => sum + Number(d.amount), 0);

  const aptStats = scoped.apartments.map((apt) => {
    const aptDues = dues.filter((d) => d.apartmentId === apt.id);
    const overdueCount = aptDues.filter((d) => d.status === "overdue").length;
    let habit = "regular";
    if (overdueCount > 0) habit = overdueCount >= 2 ? "critical" : "slow";
    return {
      apartmentId: apt.id,
      habit,
      overdueCount,
      resident: residentForApartment(apt.id),
      dueAmount: aptDues[0]?.amount || 1850,
    };
  });

  const regularCount = aptStats.filter((a) => a.habit === "regular").length;
  const slowCount = aptStats.filter((a) => a.habit === "slow").length;
  const criticalCount = aptStats.filter((a) => a.habit === "critical").length;
  const totalApts = aptStats.length || 1;

  const estimatedRate = Math.min(100, Math.round(((paid + (total - paid) * 0.78) / Math.max(total, 1)) * 100));
  const estimatedAmount = Math.round(paid + (total - paid) * 0.78);

  return {
    total,
    paid,
    overdueAmount,
    estimatedRate,
    estimatedAmount,
    regularRate: Math.round((regularCount / totalApts) * 100),
    slowRate: Math.round((slowCount / totalApts) * 100),
    criticalRate: Math.round((criticalCount / totalApts) * 100),
    riskyApartments: aptStats.filter((a) => a.habit !== "regular"),
  };
}

function blockIssueDensity() {
  const counts = scoped.blocks.map((block) => {
    const apartmentIds = scoped.apartments.filter((apartment) => apartment.blockId === block.id).map((apartment) => apartment.id);
    const count = scoped.requests.filter((request) => apartmentIds.includes(request.apartmentId)).length;
    return { block: block.name, count };
  });
  return counts.sort((a, b) => b.count - a.count);
}

function pilotMetrics() {
  const residentsWithActivity = new Set([
    ...scoped.dues.map((due) => scoped.apartments.find((apartment) => apartment.id === due.apartmentId)?.residentId).filter(Boolean),
    ...scoped.requests.map((request) => scoped.apartments.find((apartment) => apartment.id === request.apartmentId)?.residentId).filter(Boolean),
  ]);
  const residentActivityRate = Math.round((residentsWithActivity.size / Math.max(scoped.residents.length, 1)) * 100);
  const systemRequestRate = scoped.requests.length ? 100 : 0;
  const announcementCount = scoped.announcements.length;
  return { residentActivityRate, systemRequestRate, announcementCount };
}

function similarRequests(targetRequest) {
  if (!targetRequest) return [];
  const targetApartment = scoped.apartments.find((item) => item.id === targetRequest.apartmentId);
  return scoped.requests
    .filter((request) => {
      if (request.id === targetRequest.id) return false;
      const apartment = scoped.apartments.find((item) => item.id === request.apartmentId);
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
  const block = scoped.blocks.find((item) => lower.includes(item.name.toLocaleLowerCase("tr-TR").replace(" blok", "")));
  const location = block ? `${block.name}` : lower.includes("giriş") ? "Giriş alanı" : "Belirtilmedi";
  const similar = scoped.requests.filter((request) => request.category === category && request.location.includes(block?.name ?? "")).length;
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
  ensureActiveSite();
  rebuildScope();
  if (!state.sessionUser) {
    app.innerHTML = authView();
    return;
  }
  const site = activeSite();
  app.innerHTML = `
    <div class="shell">
      ${state.mobileNavOpen ? `<div class="sidebar-backdrop" onclick="setState({ mobileNavOpen: false })"></div>` : ""}
      <aside class="sidebar ${state.mobileNavOpen ? "mobile-open" : ""}">
        <div class="brand">
          ${brandLogo()}
          <div>
            <strong>ApartAI</strong>
            <span>AI destekli site yönetimi</span>
          </div>
          <button class="mobile-close-btn" onclick="setState({ mobileNavOpen: false })" aria-label="Menüyü Kapat">×</button>
        </div>
        ${state.mode === "manager" ? siteSwitcher() : ""}
        ${state.mode === "manager" ? managerNav() : residentNav()}
        <div class="sidebar-footer">
          ${safeText(site?.name || "Site seçilmedi")}<br />
          ${safeText(site?.address || "")}
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="title" style="display:flex; align-items:center; gap:12px;">
            <button class="mobile-menu-trigger" onclick="setState({ mobileNavOpen: true })" aria-label="Menü">☰</button>
            <div>
              <h1>${pageTitle()}</h1>
              <p>${pageDescription()}</p>
            </div>
          </div>
          ${sessionActions()}
        </div>
        ${state.mode === "manager" ? managerView() : residentView()}
      </main>
    </div>
    ${state.mode === "resident" ? residentBottomNav() : managerBottomNav()}
    ${printReportModal()}
    <div id="ai-assistant-root">${assistantWidgetMarkup()}</div>
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
      <nav class="landing-nav">
        <div class="landing-brand">
          ${brandLogo("landing-logo")}
          <div>
            <strong>ApartAI</strong>
            <span>Akıllı Site Yönetimi</span>
          </div>
        </div>
        <div class="landing-actions">
          <button type="button" class="btn ghost" onclick="quickLogin('admin@apartai.local')">👑 Yönetici Girişi</button>
          <button type="button" class="btn ghost" onclick="quickLogin('ayse@example.com')">🏠 Sakin Girişi</button>
          <button type="button" class="btn primary" onclick="openAuthModal('login')">Giriş Yap</button>
        </div>
      </nav>

      <section class="hero-section">
        <div class="hero-bg-grid"></div>
        <div class="hero-glow hero-glow-1"></div>
        <div class="hero-glow hero-glow-2"></div>

        <div class="hero-content">
          <div class="hero-text">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              Yapay Zeka Destekli Site Yönetim Platformu
            </div>
            <h1>Apartman Yönetiminde<br/><span class="hero-gradient-text">Yapay Zeka Devrimi</span></h1>
            <p class="hero-desc">
              Aidatlar, arıza bildirimleri, kat malikleri anketleri ve resmi faaliyet bültenleri tek bir akıllı platformda.
              ApartAI veriyi anlık analiz eder, gecikme risklerini önler ve 7/24 sakin asistanlığı sunar.
            </p>
            <div class="hero-cta">
              <button type="button" class="btn primary hero-btn" onclick="quickLogin('admin@apartai.local')">
                <span>Yönetici Demosunu Başlat</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button type="button" class="btn ghost hero-btn" onclick="quickLogin('ayse@example.com')">
                <span>Sakin Portaline Gir</span>
              </button>
            </div>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <svg class="hero-svg" viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="buildGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.15"/>
                  <stop offset="100%" stop-color="#0284c7" stop-opacity="0.08"/>
                </linearGradient>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2dd4bf"/>
                  <stop offset="100%" stop-color="#0ea5e9"/>
                </linearGradient>
              </defs>

              <!-- Pulsing grid circles -->
              <circle class="hero-pulse-ring" cx="260" cy="210" r="200" stroke="rgba(45,212,191,0.08)" stroke-width="1"/>
              <circle class="hero-pulse-ring ring-delay-1" cx="260" cy="210" r="150" stroke="rgba(45,212,191,0.12)" stroke-width="1"/>
              <circle class="hero-pulse-ring ring-delay-2" cx="260" cy="210" r="100" stroke="rgba(45,212,191,0.15)" stroke-width="1"/>

              <!-- Building silhouette left -->
              <rect class="hero-building" x="80" y="120" width="110" height="220" rx="12" fill="url(#buildGrad)" stroke="rgba(45,212,191,0.2)" stroke-width="1.5"/>
              <!-- Windows left -->
              <rect class="hero-window w-blink-1" x="100" y="148" width="30" height="22" rx="4" fill="rgba(45,212,191,0.3)"/>
              <rect class="hero-window w-blink-2" x="142" y="148" width="30" height="22" rx="4" fill="rgba(45,212,191,0.1)"/>
              <rect class="hero-window w-blink-3" x="100" y="184" width="30" height="22" rx="4" fill="rgba(45,212,191,0.15)"/>
              <rect class="hero-window w-blink-4" x="142" y="184" width="30" height="22" rx="4" fill="rgba(45,212,191,0.4)"/>
              <rect class="hero-window w-blink-5" x="100" y="220" width="30" height="22" rx="4" fill="rgba(45,212,191,0.25)"/>
              <rect class="hero-window w-blink-6" x="142" y="220" width="30" height="22" rx="4" fill="rgba(45,212,191,0.35)"/>
              <rect class="hero-window w-blink-7" x="100" y="256" width="30" height="22" rx="4" fill="rgba(45,212,191,0.5)"/>
              <rect class="hero-window w-blink-8" x="142" y="256" width="30" height="22" rx="4" fill="rgba(45,212,191,0.2)"/>
              <!-- Door -->
              <rect x="120" y="300" width="30" height="40" rx="6" fill="rgba(13,56,53,0.6)"/>

              <!-- Building silhouette right (taller) -->
              <rect class="hero-building" x="210" y="80" width="130" height="260" rx="14" fill="url(#buildGrad)" stroke="rgba(45,212,191,0.2)" stroke-width="1.5"/>
              <!-- Windows right -->
              <rect class="hero-window w-blink-2" x="232" y="108" width="34" height="24" rx="5" fill="rgba(14,165,233,0.3)"/>
              <rect class="hero-window w-blink-5" x="280" y="108" width="34" height="24" rx="5" fill="rgba(14,165,233,0.12)"/>
              <rect class="hero-window w-blink-8" x="232" y="148" width="34" height="24" rx="5" fill="rgba(14,165,233,0.18)"/>
              <rect class="hero-window w-blink-1" x="280" y="148" width="34" height="24" rx="5" fill="rgba(14,165,233,0.4)"/>
              <rect class="hero-window w-blink-4" x="232" y="188" width="34" height="24" rx="5" fill="rgba(14,165,233,0.35)"/>
              <rect class="hero-window w-blink-7" x="280" y="188" width="34" height="24" rx="5" fill="rgba(14,165,233,0.1)"/>
              <rect class="hero-window w-blink-6" x="232" y="228" width="34" height="24" rx="5" fill="rgba(14,165,233,0.45)"/>
              <rect class="hero-window w-blink-3" x="280" y="228" width="34" height="24" rx="5" fill="rgba(14,165,233,0.2)"/>
              <rect class="hero-window w-blink-5" x="232" y="268" width="34" height="24" rx="5" fill="rgba(14,165,233,0.28)"/>
              <rect class="hero-window w-blink-1" x="280" y="268" width="34" height="24" rx="5" fill="rgba(14,165,233,0.5)"/>

              <!-- Score dial -->
              <g class="hero-score-group" transform="translate(380, 140)">
                <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.05)" stroke="rgba(45,212,191,0.15)" stroke-width="6"/>
                <circle class="hero-score-arc" cx="50" cy="50" r="46" fill="none" stroke="url(#scoreGrad)" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="52" transform="rotate(-90 50 50)"/>
                <text x="50" y="46" text-anchor="middle" font-size="24" font-weight="900" fill="#2dd4bf" dy=".3em">92</text>
                <text x="50" y="72" text-anchor="middle" font-size="9" font-weight="600" fill="rgba(255,255,255,0.5)">SKOR</text>
              </g>

              <!-- Floating info chips -->
              <g class="hero-chip chip-anim-1">
                <rect x="350" y="270" width="155" height="36" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(45,212,191,0.25)" stroke-width="1"/>
                <circle cx="370" cy="288" r="5" fill="#10b981"/>
                <text x="382" y="293" font-size="11" font-weight="700" fill="rgba(255,255,255,0.8)">Tahsilat: %94</text>
              </g>
              <g class="hero-chip chip-anim-2">
                <rect x="60" y="370" width="145" height="36" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(14,165,233,0.25)" stroke-width="1"/>
                <circle cx="80" cy="388" r="5" fill="#0ea5e9"/>
                <text x="92" y="393" font-size="11" font-weight="700" fill="rgba(255,255,255,0.8)">Anket: 14/16 Oy</text>
              </g>
              <g class="hero-chip chip-anim-3">
                <rect x="350" y="330" width="165" height="36" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(245,158,11,0.25)" stroke-width="1"/>
                <circle cx="370" cy="348" r="5" fill="#f59e0b"/>
                <text x="382" y="353" font-size="11" font-weight="700" fill="rgba(255,255,255,0.8)">AI: Asansör SLA ⚡</text>
              </g>
            </svg>
          </div>
        </div>

        <div class="hero-stats-bar">
          <div class="hero-stat"><span class="hero-stat-num">3dk</span><span class="hero-stat-label">Arıza Teşhisi</span></div>
          <div class="hero-stat"><span class="hero-stat-num">%94</span><span class="hero-stat-label">Zamanında Tahsilat</span></div>
          <div class="hero-stat"><span class="hero-stat-num">7/24</span><span class="hero-stat-label">AI Asistan</span></div>
          <div class="hero-stat"><span class="hero-stat-num">A4</span><span class="hero-stat-label">Resmi Bülten</span></div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section" id="ozellikler">
        <div class="features-header">
          <span class="section-tag">NEDEN APARTAI?</span>
          <h2>Site Yönetimini Kolaylaştıran<br/><span class="hero-gradient-text">5 Temel Özellik</span></h2>
          <p>Her detay kat malikleri, site sakinleri ve yönetim kurulları arasındaki güveni artırmak için tasarlandı.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card feature-highlight">
            <div class="feature-icon-wrap"><span>🧠</span></div>
            <h3>Yapay Zeka Destekli Arıza Teşhisi</h3>
            <p>Sakin arızanın fotoğrafını çeker, ApartAI görseli saniyeler içinde tarayarak kategorisini, aciliyet derecesini ve ilgili firmayı otomatik belirler.</p>
            <div class="feature-tags">
              <span>📸 Görsel Tarama</span>
              <span>⚡ Aciliyet Skoru</span>
              <span>🛠️ Firma Atama</span>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap"><span>📈</span></div>
            <h3>Tahsilat Tahmini & Analiz</h3>
            <p>Geçmiş ödeme sürelerini inceleyerek gecikme eğilimli daireleri tespit eder ve tek tıkla hatırlatma hazırlar.</p>
            <div class="feature-mini-stat">%94<small>zamanında tahsilat</small></div>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap"><span>🗳️</span></div>
            <h3>Karar Anketleri</h3>
            <p>Kamera yenileme, aidat artışı gibi kritik kararları şeffaf dijital oylama ile hızla sonuca bağlayın.</p>
            <div class="feature-bar-demo">
              <div class="feature-bar-fill" style="width:82%"></div>
            </div>
            <small class="feature-bar-label">%82 katılım oranı</small>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap"><span>🖨️</span></div>
            <h3>Resmi Faaliyet Bülteni</h3>
            <p>A4 formatında basıma hazır aylık mali durum, çözülen arızalar ve yönetim kurulu kaşe/imza alanı içeren resmi bülten.</p>
            <span class="feature-chip">📄 Tek Tıkla PDF / Baskı</span>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap"><span>🤖</span></div>
            <h3>7/24 AI Asistan</h3>
            <p>Sakinler ve yöneticiler için anlık yapay zeka destekli soru-cevap. Aidat borcu, plaka kaydı, arıza durumu hepsi bir tık uzağınızda.</p>
            <span class="feature-chip">💬 Bağlamsal Sohbet</span>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-content">
          <h2>Hemen Deneyin, Ücretsiz</h2>
          <p>Demo hesaplarıyla tüm özellikleri keşfedin. Kurulum gerektirmez.</p>
          <div class="cta-buttons">
            <button type="button" class="btn primary hero-btn" onclick="quickLogin('admin@apartai.local')">
              👑 Yönetici Paneli
            </button>
            <button type="button" class="btn ghost hero-btn" onclick="quickLogin('ayse@example.com')">
              🏠 Sakin Portalı
            </button>
            <button type="button" class="btn ghost hero-btn" onclick="openAuthModal('login')">
              Giriş Yap / Kayıt Ol
            </button>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <p>© 2026 ApartAI — Yapay Zeka Destekli Akıllı Site Yönetim Platformu</p>
      </footer>

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
                <label>Site ve blok
                  <select name="blockId">
                    ${(state.sites || [])
                      .map((site) => {
                        const blocks = (state.blocks || []).filter((block) => block.siteId === site.id);
                        if (!blocks.length) return "";
                        return `<optgroup label="${safeText(site.name)}">${blocks.map((block) => `<option value="${block.id}">${safeText(block.name)}</option>`).join("")}</optgroup>`;
                      })
                      .join("")}
                  </select>
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
          <button class="${state.mode === "resident" ? "active" : ""}" onclick="setState({ mode: 'resident', view: 'resident-home', selectedResidentId: '${scoped.residents[0]?.id ?? ""}' })">Sakin</button>
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

// Yöneticinin yönettiği siteler arasında geçiş yapmasını sağlar.
function siteSwitcher() {
  const sites = state.sites || [];
  if (sites.length <= 1) return "";
  return `
    <label class="site-switcher">
      <span>Aktif site</span>
      <select onchange="switchSite(this.value)">
        ${sites.map((site) => `<option value="${site.id}" ${site.id === state.activeSiteId ? "selected" : ""}>${safeText(site.name)}</option>`).join("")}
      </select>
    </label>`;
}

function managerNav() {
  const items = [
    ["dashboard", "Panel"],
    ["dues", "Aidatlar"],
    ["requests", "Talepler"],
    ["announcements", "Duyurular"],
    ["surveys", "Anketler"],
    ["setup", "Site Kurulumu"],
    ["reports", "Rapor"],
    ["sites", "Tüm Siteler"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}' })">${label}</button>`).join("")}</nav>`;
}

function residentNav() {
  const items = [
    ["resident-home", "Özet"],
    ["resident-request", "Talep Aç"],
    ["resident-announcements", "Duyurular"],
    ["resident-surveys", "Anketler"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}' })">${label}</button>`).join("")}</nav>`;
}

function pageTitle() {
  const titles = {
    dashboard: "Yönetici Paneli",
    dues: "Aidat Takibi",
    requests: "Arıza ve Şikayet Talepleri",
    announcements: "Duyurular",
    surveys: "Site Anketleri ve Kararlar",
    setup: "Site Kurulumu",
    reports: "Aylık Rapor & Faaliyet Özeti",
    sites: "Tüm Siteler",
    "resident-home": "Sakin Ekranı",
    "resident-request": "Talep Aç",
    "resident-announcements": "Duyurular",
    "resident-surveys": "Site Anketleri",
  };
  return titles[state.view] ?? "ApartAI";
}

function pageDescription() {
  const descriptions = {
    dashboard: "Site sağlığı, ödeme durumu, açık talepler ve AI aksiyonları.",
    dues: "Dönem bazlı borç oluşturma, tahsilat tahmini ve risk analizi.",
    requests: "Sakin taleplerini sınıflandır, önceliklendir ve çözüm süresini izle.",
    announcements: "Duyuru yayınla ve AI ile metni sakin bir tona getir.",
    surveys: "Site geneli oylama ve anketler ile şeffaf karar alma süreci.",
    setup: "Blok, daire, mülkiyet ve araç plaka kayıtlarını yönet.",
    reports: "Aylık faaliyet bülteni yazdır, tedarikçi karnesi ve analizleri incele.",
    sites: "Yönettiğin tüm siteleri karşılaştır ve yeni site ekle.",
    "resident-home": "Borcunu, ödeme geçmişini ve açık taleplerini gör.",
    "resident-request": "Arıza veya şikayetini yönetime ilet.",
    "resident-announcements": "Yönetim duyurularını takip et.",
    "resident-surveys": "Site kararlarına oy vererek görüşünü bildir.",
  };
  return descriptions[state.view] ?? "";
}

function managerView() {
  const views = {
    dashboard: dashboardView,
    dues: duesView,
    requests: requestsView,
    announcements: announcementsView,
    surveys: surveysView,
    setup: setupView,
    reports: reportsView,
    sites: sitesView,
  };
  return (views[state.view] || dashboardView)();
}

function residentView() {
  return ({
    "resident-home": residentHomeView,
    "resident-request": residentRequestView,
    "resident-announcements": residentAnnouncementsView,
    "resident-surveys": residentSurveysView,
  }[state.view] || residentHomeView)();
}

function dashboardView() {
  const health = calculateHealthScore();
  const paid = scoped.dues.filter((due) => due.status === "paid").length;
  const openRequests = scoped.requests.filter((request) => !["cozuldu", "reddedildi"].includes(request.status));
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
        <strong>%${Math.round((paid / Math.max(scoped.dues.length, 1)) * 100)}</strong>
        <small>${paid}/${scoped.dues.length} aidat ödendi</small>
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
          ${scoped.announcements.slice(-3).reverse().map((item) => `<li><strong>${item.title}</strong><br>${item.aiContent || item.content}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function duesView() {
  const summary = dueSummary();
  const forecast = collectionForecast();
  const riskyDues = scoped.dues.filter((due) => due.status !== "paid").sort((a, b) => {
    const riskOrder = { Yüksek: 0, Orta: 1, Düşük: 2 };
    return riskOrder[dueRiskLevel(a).label] - riskOrder[dueRiskLevel(b).label];
  });
  const selectedDue = scoped.dues.find((due) => due.id === state.selectedDueId);
  return `
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>Tahsilat oranı</span>
        <strong>%${summary.collectionRate}</strong>
        <small>${summary.paidCount}/${scoped.dues.length} aidat ödendi</small>
      </section>
      <section class="section metric">
        <span>Tahsil edilen</span>
        <strong>${money(summary.paid)}</strong>
        <small>Toplam: ${money(summary.total)}</small>
      </section>
      <section class="section metric">
        <span>Ay Sonu Tahmini</span>
        <strong>%${forecast.estimatedRate}</strong>
        <small>Beklenen: ${money(forecast.estimatedAmount)}</small>
      </section>
    </div>
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Tahsilat Tahmini & Daire Alışkanlıkları</h2>
            <p>Geçmiş 3 aya dayalı tahsilat olasılığı ve gecikme riski.</p>
          </div>
        </div>
        <div style="display:grid; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(255,255,255,0.7);">
            <div>
              <strong style="display:block; font-size:13.5px;">Düzenli Ödeyen Daireler</strong>
              <small style="color:var(--muted);">Gününde veya erken ödeyenler</small>
            </div>
            <span class="status ok">%${forecast.regularRate}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(255,255,255,0.7);">
            <div>
              <strong style="display:block; font-size:13.5px;">Gecikme Eğilimli Daireler</strong>
              <small style="color:var(--muted);">Hatırlatma ile 5-10 gün içinde ödeyenler</small>
            </div>
            <span class="status warn">%${forecast.slowRate}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(255,255,255,0.7);">
            <div>
              <strong style="display:block; font-size:13.5px;">Yüksek Risk / Takip Gerektiren</strong>
              <small style="color:var(--muted);">Önceki dönemlerden devir borcu olanlar</small>
            </div>
            <span class="status danger">%${forecast.criticalRate}</span>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Öncelikli Hatırlatma Listesi</h2>
            <p>Risk analizine göre önce uyarılması gereken daireler.</p>
          </div>
        </div>
        <ul class="mini-list">
          ${
            riskyDues.length
              ? riskyDues.slice(0, 5).map((due) => {
                  const risk = dueRiskLevel(due);
                  return `<li><span class="status ${risk.label === "Yüksek" ? "danger" : "warn"}">${risk.label} risk</span>${apartmentLabel(due.apartmentId)} - ${money(due.amount)}<small>${residentForApartment(due.apartmentId)?.name ?? "-"} / ${dateText(due.dueDate)}</small></li>`;
                }).join("")
              : `<li><span>Temiz</span>Bekleyen aidat bulunmuyor.<small>Tahsilat akışı dengeli.</small></li>`
          }
        </ul>
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
            ${scoped.dues.map((due) => `
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
  const categories = [...new Set(scoped.requests.map((request) => request.category))];
  const statusOptions = ["yeni", "inceleniyor", "firmaya_iletildi", "cozuldu", "reddedildi"];
  const statusFilter = statusOptions.includes(state.requestStatusFilter) ? state.requestStatusFilter : "all";
  const categoryFilter = categories.includes(state.requestCategoryFilter) ? state.requestCategoryFilter : "all";
  const filteredRequests = scoped.requests.filter((request) => {
    const statusOk = statusFilter === "all" || request.status === statusFilter;
    const categoryOk = categoryFilter === "all" || request.category === categoryFilter;
    return statusOk && categoryOk;
  });
  const selectedRequest = scoped.requests.find((request) => request.id === state.selectedRequestId);
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
  const residentCount = scoped.users.filter((user) => user.role === "resident").length;
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
  const reminders = scoped.payments
    .filter((payment) => payment.method === "Hatırlatma")
    .map((payment) => ({
      type: "Hatırlatma",
      date: payment.date,
      target: apartmentLabel(payment.apartmentId),
      detail: (payment.note || "Aidat hatırlatması") + deliveryText(payment.delivery),
    }));
  const announcements = scoped.announcements.map((item) => {
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
          ${scoped.announcements.slice().reverse().map((item) => {
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
            <select name="blockId">${scoped.blocks.map((block) => `<option value="${block.id}">${safeText(block.name)}</option>`).join("")}</select>
          </label>
          <label>Daire No<input name="no" required placeholder="Örn: 12" /></label>
          <label>Kat<input name="floor" type="number" value="1" required /></label>
          <label>Mülkiyet Durumu
            <select name="occupancyType">
              <option value="owner">Ev Sahibi</option>
              <option value="tenant">Kiracı</option>
            </select>
          </label>
          <label>Sakin Adı<input name="residentName" required placeholder="Ad Soyad" /></label>
          <label>Telefon<input name="phone" placeholder="05xx" /></label>
          <label>E-posta<input name="email" type="email" placeholder="ornek@apartai.com" /></label>
          <label>Araç Plakası<input name="plateNumber" placeholder="34 ABC 123" /></label>
          <label class="full">Acil Durum İrtibatı<input name="emergencyContact" placeholder="İsim ve Telefon (Örn: Yakını 0532...)" /></label>
          <button class="btn primary" type="submit" style="margin-top:8px;">Kaydı Ekle</button>
        </form>
        ${
          API_BASE
            ? `<div class="section-header" style="margin-top:1.8rem"><h2>CSV ile Toplu İçeri Aktarma</h2></div>
              <p class="muted" style="font-size:13px; line-height:1.5;">Başlıklar: <code>Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta,Mülkiyet,Plaka,Acil İrtibat</code>. Otomatik blok eşleşir, mükerrer daireler atlanır.</p>
              <form class="form-grid wide" onsubmit="importApartmentsCsv(event)">
                <label class="full">CSV içeriği<textarea name="csv" rows="5" placeholder="Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta,Mülkiyet,Plaka,Acil İrtibat&#10;D Blok,3,2,Ali Veli,05xx,ali@example.com,Ev Sahibi,34 ABC 123,0532 xxx&#10;D Blok,4,2,Ayşe Yılmaz,05xx,ayse@example.com,Kiracı,34 DEF 456,0533 xxx"></textarea></label>
                <label>veya dosya seç<input name="csvFile" type="file" accept=".csv,text/csv" onchange="loadCsvFileIntoTextarea(this)" /></label>
                <button class="btn primary" type="submit">İçeri Aktar</button>
              </form>`
            : ""
        }
      </section>
      <section class="section">
        <div class="section-header"><h2>Mevcut Daireler & Sakin Profili</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Daire</th><th>Kat</th><th>Mülkiyet</th><th>Sakin</th><th>Plaka</th><th>Acil İrtibat</th></tr></thead>
            <tbody>
              ${scoped.apartments.map((apt) => {
                const resident = scoped.residents.find((item) => item.id === apt.residentId);
                const isTenant = resident?.occupancyType === "tenant";
                return `
                  <tr>
                    <td><strong>${apartmentLabel(apt.id)}</strong></td>
                    <td>${apt.floor}</td>
                    <td><span class="status ${isTenant ? "warn" : "info"}">${isTenant ? "Kiracı" : "Ev Sahibi"}</span></td>
                    <td>${resident?.name ?? "-"}<br><small style="color:var(--muted);">${resident?.phone ?? ""}</small></td>
                    <td><code style="font-size:12px; font-weight:700;">${safeText(resident?.plateNumber || "-")}</code></td>
                    <td><small>${safeText(resident?.emergencyContact || "-")}</small></td>
                  </tr>
                `;
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
  const vendors = vendorPerformance();
  const byCategory = scoped.requests.reduce((acc, request) => {
    acc[request.category] = (acc[request.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Henüz veri yok";
  const topBlock = blocks[0]?.count ? blocks[0].block : "Henüz veri yok";
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <div>
        <h2 style="margin:0; font-size:22px;">Aylık Site Faaliyet & Sağlık Analizi</h2>
        <p style="margin:4px 0 0; color:var(--muted); font-size:13.5px;">Tüm operasyonel, finansal ve teknik verilerin konsolide özeti.</p>
      </div>
      <button class="btn primary" onclick="openPrintModal()">🖨️ Resmi Faaliyet Bülteni (Pano Çıktısı)</button>
    </div>

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
      <div class="section-header">
        <div>
          <h2>Tedarikçi & Firma Performans Karnesi</h2>
          <p>Anlaşmalı bakım firmalarının ortalama çözüm süresi ve SLA hedeflerine uyumu.</p>
        </div>
      </div>
      ${
        vendors.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Firma / Hizmet</th><th>Kategori</th><th>Toplam İş</th><th>Açık</th><th>Çözülen</th><th>Ort. Süre</th><th>SLA Başarı Karnesi</th></tr></thead>
              <tbody>${vendors.map((v) => `<tr><td><strong>${safeText(v.assignee)}</strong></td><td><span class="status info">${safeText(v.category)}</span></td><td>${v.total}</td><td>${v.open}</td><td>${v.resolved}</td><td><strong>${v.avgDays !== null ? `${v.avgDays} gün` : "-"}</strong></td><td><span class="status ${v.scoreStatus}">${v.scoreText}</span></td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p>Henüz atanmış talep yok. Talep detayından firma/kişi atayarak karnesini takip edebilirsiniz.</p>`
      }
    </section>
    <section class="section">
      <div class="section-header">
        <h2>Site Sağlık Skoru Geçmişi</h2>
        ${API_BASE ? `<button class="btn primary" onclick="saveHealthSnapshot()">Skoru kaydet</button>` : ""}
      </div>
      ${
        scoped.healthScores.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Tarih</th><th>Skor</th><th>Durum</th></tr></thead>
              <tbody>${scoped.healthScores.slice().reverse().map((item) => `<tr><td>${dateText(item.date)}</td><td>${item.score}</td><td><span class="status ${item.score >= 75 ? "ok" : item.score >= 60 ? "warn" : "danger"}">${item.status}</span></td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p>Henüz kayıtlı skor anlık görüntüsü yok. "Skoru kaydet" ile bugünün skorunu geçmişe ekleyebilirsiniz.</p>`
      }
    </section>
  `;
}

// Yönetim firması görünümü: her site için aynı metrikler, karşılaştırmalı.
function siteMetrics(siteId) {
  const pick = (rows) => (rows || []).filter((row) => !row.siteId || row.siteId === siteId);
  const rows = {
    dues: pick(state.dues),
    requests: pick(state.requests),
    apartments: pick(state.apartments),
    blocks: pick(state.blocks),
    announcements: pick(state.announcements),
  };
  const summary = dueSummary(rows.dues);
  const health = calculateHealthScore(rows);
  const stats = requestStats(rows.requests);
  const site = (state.sites || []).find((item) => item.id === siteId);
  return {
    siteId,
    name: site?.name || siteId,
    address: site?.address || "",
    apartments: rows.apartments.length,
    collectionRate: summary.collectionRate,
    pending: summary.pending,
    openRequests: stats.open,
    score: health.score,
    status: health.status,
  };
}

function sitesView() {
  const rows = (state.sites || []).map((site) => siteMetrics(site.id)).sort((a, b) => a.score - b.score);
  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
  const avgScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
  return `
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>Yönetilen site</span>
        <strong>${rows.length}</strong>
        <small>${rows.reduce((sum, row) => sum + row.apartments, 0)} daire</small>
      </section>
      <section class="section metric">
        <span>Ortalama skor</span>
        <strong>${avgScore}</strong>
        <small>En düşük: ${rows[0]?.name ?? "-"}</small>
      </section>
      <section class="section metric">
        <span>Toplam bekleyen</span>
        <strong>${money(totalPending)}</strong>
        <small>Tüm sitelerde tahsil edilmemiş</small>
      </section>
    </div>
    <section class="section" style="margin-top:16px">
      <div class="section-header">
        <div>
          <h2>Site Karşılaştırması</h2>
          <p>En düşük skordan başlayarak sıralanır; satıra tıklayarak o siteye geç.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Site</th><th>Daire</th><th>Tahsilat</th><th>Bekleyen</th><th>Açık Talep</th><th>Skor</th><th></th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="${row.siteId === state.activeSiteId ? "row-active" : ""}">
                <td><strong>${safeText(row.name)}</strong><br><small>${safeText(row.address)}</small></td>
                <td>${row.apartments}</td>
                <td>%${row.collectionRate}</td>
                <td>${money(row.pending)}</td>
                <td>${row.openRequests}</td>
                <td><span class="status ${row.score >= 75 ? "ok" : row.score >= 60 ? "warn" : "danger"}">${row.score} · ${row.status}</span></td>
                <td>${row.siteId === state.activeSiteId ? `<span class="status info">Aktif</span>` : `<button class="btn" onclick="switchSite('${row.siteId}')">Bu siteye geç</button>`}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
    ${
      API_BASE
        ? `<section class="section" style="margin-top:16px">
            <div class="section-header"><h2>Yeni Site Ekle</h2></div>
            <form class="form-grid wide" onsubmit="createSite(event)">
              <label>Site adı<input name="name" required placeholder="Örn. Palmiye Konakları" /></label>
              <label>Adres<input name="address" placeholder="İlçe, İl" /></label>
              <button class="btn primary" type="submit">Siteyi Oluştur</button>
            </form>
          </section>`
        : ""
    }
  `;
}

function createSite(event) {
  event.preventDefault();
  if (!API_BASE) return;
  const form = new FormData(event.target);
  const payload = { name: safeText(form.get("name")), address: safeText(form.get("address")) };
  apiRequest("/sites", { method: "POST", body: JSON.stringify(payload) })
    .then((result) => {
      event.target.reset();
      applyServerData(result.data, { activeSiteId: result.site.id, view: "setup" });
    })
    .catch((error) => alert(error.message));
}

function saveHealthSnapshot() {
  if (!API_BASE) return;
  apiRequest(`/health-score/snapshot?siteId=${encodeURIComponent(state.activeSiteId)}`, { method: "POST" })
    .then((result) => {
      // Sunucu yalnızca bu sitenin geçmişini döner; diğer sitelerin kayıtlarını koru.
      const others = (state.healthScores || []).filter((item) => item.siteId !== state.activeSiteId);
      setState({ healthScores: [...others, ...result.history] });
    })
    .catch((error) => alert(error.message));
}

function currentResident() {
  const residentId = state.sessionUser?.role === "resident" ? state.sessionUser.residentId : state.selectedResidentId;
  return scoped.residents.find((item) => item.id === residentId) ?? scoped.residents[0];
}

function residentApartment() {
  return scoped.apartments.find((item) => item.residentId === currentResident()?.id);
}

function residentHomeView() {
  const apt = residentApartment();
  const dues = scoped.dues.filter((due) => due.apartmentId === apt?.id);
  const requests = scoped.requests.filter((request) => request.apartmentId === apt?.id);
  return `
    <div class="resident-shell">
      <section class="mobile-preview">
        <div class="resident-header">
          <h1>${safeText(currentResident()?.name || "Sakin")}</h1>
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
  return scoped.announcements.filter((item) => !(item.readBy || []).some((entry) => entry.userId === userId));
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
          ${scoped.announcements.slice().reverse().map((item) => {
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
    apiRequest(`/dues/bulk?siteId=${encodeURIComponent(state.activeSiteId)}`, { method: "POST", body: JSON.stringify({ period, amount, dueDate }) })
      .then((result) => applyServerData(result.data))
      .catch((error) => alert(error.message));
    return;
  }
  const siteId = state.activeSiteId;
  const existing = new Set(scoped.dues.filter((due) => due.period === period).map((due) => due.apartmentId));
  const newDues = scoped.apartments
    .filter((apt) => !existing.has(apt.id))
    .map((apt) => ({ id: id("due"), siteId, apartmentId: apt.id, period, amount, dueDate, status: "pending" }));
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
    state.activeSiteId = safeUser.siteId || state.activeSiteId;
  } else {
    state.mode = "manager";
    state.view = "dashboard";
    // Yönetici oturumu yönettiği ilk siteyle başlar.
    const allowed = Array.isArray(safeUser.siteIds) && safeUser.siteIds.length ? safeUser.siteIds : (state.sites || []).map((site) => site.id);
    if (!allowed.includes(state.activeSiteId)) state.activeSiteId = allowed[0] || "";
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
  // Seçilen blok, sakinin bağlanacağı siteyi belirler.
  const block = (state.blocks || []).find((item) => item.id === payload.blockId) || state.blocks[0];
  const siteId = block?.siteId || state.activeSiteId;
  const user = { id: id("user"), name: payload.name, email: payload.email, phone: payload.phone, role: "resident", residentId, siteId };
  state.residents = [...state.residents, { id: residentId, siteId, name: payload.name, phone: payload.phone, email: payload.email }];
  state.apartments = [...state.apartments, { id: id("apt"), siteId, blockId: block?.id, no: payload.apartmentNo, floor: payload.floor, residentId }];
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
    { id: id("pay"), siteId: due.siteId, dueId, apartmentId: due.apartmentId, amount: due.amount, date: new Date().toISOString().slice(0, 10), method: "Manuel", note: "Yönetici tarafından işlendi" },
  ];
  saveState();
  render();
}

function openReminderModal(dueId) {
  const due = scoped.dues.find((item) => item.id === dueId);
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
  const due = scoped.dues.find((item) => item.id === dueId);
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
    { id: id("reminder"), siteId: due.siteId, dueId, apartmentId: due.apartmentId, amount: 0, date: new Date().toISOString().slice(0, 10), method: "Hatırlatma", note: payload.note },
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
    apiRequest(`/announcements?siteId=${encodeURIComponent(state.activeSiteId)}`, { method: "POST", body: JSON.stringify(payload) })
      .then((result) => {
        event.target.reset();
        applyServerData(result.data);
      })
      .catch((error) => alert(error.message));
    return;
  }
  state.announcements = [
    ...state.announcements,
    {
      id: id("ann"),
      siteId: state.activeSiteId,
      title: payload.title,
      content,
      aiContent: improveAnnouncement(content, tone),
      audience: payload.audience,
      date: new Date().toISOString().slice(0, 10),
      readBy: [],
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
    occupancyType: safeText(form.get("occupancyType") || "owner"),
    plateNumber: safeText(form.get("plateNumber") || ""),
    emergencyContact: safeText(form.get("emergencyContact") || ""),
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
  const siteId = (state.blocks || []).find((item) => item.id === payload.blockId)?.siteId || state.activeSiteId;
  state.residents = [
    ...state.residents,
    {
      id: residentId,
      siteId,
      name: payload.residentName,
      phone: payload.phone,
      email: payload.email,
      occupancyType: payload.occupancyType,
      plateNumber: payload.plateNumber,
      emergencyContact: payload.emergencyContact,
    },
  ];
  state.apartments = [
    ...state.apartments,
    { id: apartmentId, siteId, blockId: payload.blockId, no: payload.no, floor: payload.floor, residentId },
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
  apiRequest(`/apartments/import?siteId=${encodeURIComponent(state.activeSiteId)}`, { method: "POST", body: JSON.stringify({ csv }) })
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
  const apartment = residentApartment();
  if (!apartment) {
    alert("Kayıtlı daire bulunamadı.");
    return;
  }
  if (API_BASE) {
    apiRequest("/requests", {
      method: "POST",
      body: JSON.stringify({ apartmentId: apartment.id, title, description, photoDataUrl }),
    })
      .then((result) => {
        event.target.reset();
        applyServerData(result.data, { view: "resident-home" });
      })
      .catch((error) => alert(error.message));
    return;
  }
  const ai = analyzeComplaint(`${title}. ${description}`);
  state.requests = [
    ...state.requests,
    {
      id: id("req"),
      siteId: apartment.siteId,
      apartmentId: apartment.id,
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

function openPrintModal() {
  setState({ showPrintModal: true });
}

function closePrintModal(event) {
  if (!event || event.target.classList.contains("modal-backdrop") || event.target.classList.contains("modal-close")) {
    setState({ showPrintModal: false });
  }
}

function printReportModal() {
  if (!state.showPrintModal) return "";
  const site = activeSite();
  const health = calculateHealthScore();
  const dues = dueSummary();
  const requests = requestStats();
  const vendors = vendorPerformance();
  const dateStr = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
  const periodStr = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long" });

  return `
    <div class="modal-backdrop" onclick="closePrintModal(event)">
      <div class="print-modal-container" onclick="event.stopPropagation()">
        <div class="print-actions-bar no-print">
          <div>
            <strong>📋 Resmi Faaliyet & Sağlık Bülteni</strong>
            <span style="font-size:12px; color:var(--muted); margin-left:8px;">Panoya asmak veya PDF almak için hazır A4 şablonu</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn primary" onclick="window.print()">🖨️ Yazdır / PDF Olarak Kaydet</button>
            <button class="btn modal-close" onclick="closePrintModal()">Kapat</button>
          </div>
        </div>

        <div class="print-sheet-paper" id="official-bulletin-sheet">
          <div class="bulletin-header">
            <div class="bulletin-brand">
              <div class="bulletin-logo-badge">ApartAI</div>
              <div>
                <h2>${safeText(site?.name || "Apartman & Site Yönetimi")}</h2>
                <p>${safeText(site?.address || "Merkezi Site Yönetimi")} | Yönetim Kurulu Faaliyet Özeti</p>
              </div>
            </div>
            <div class="bulletin-meta">
              <div class="bulletin-badge">RESMİ BÜLTEN</div>
              <strong>Dönem: ${periodStr}</strong>
              <small>Yayın Tarihi: ${dateStr}</small>
            </div>
          </div>

          <div class="bulletin-intro">
            <strong>Sayın Site Sakinlerimiz ve Kat Maliklerimiz,</strong>
            <p>Sitemizin şeffaf, huzurlu ve sürdürülebilir yönetimi amacıyla hazırlanan aylık faaliyet, finansal durum ve teknik bakım bültenimiz bilgilerinize sunulmuştur.</p>
          </div>

          <div class="bulletin-grid-3">
            <div class="bulletin-box">
              <span class="bulletin-box-title">Genel Sağlık Puanı</span>
              <div class="bulletin-score-num">${health.score}<small>/100</small></div>
              <div class="bulletin-box-sub">${health.status} Operasyon</div>
            </div>
            <div class="bulletin-box">
              <span class="bulletin-box-title">Aidat Tahsilat Oranı</span>
              <div class="bulletin-score-num">%${dues.collectionRate}</div>
              <div class="bulletin-box-sub">${money(dues.paid)} / ${money(dues.total)}</div>
            </div>
            <div class="bulletin-box">
              <span class="bulletin-box-title">Arıza & Talep Çözüm Hızı</span>
              <div class="bulletin-score-num">%${requests.resolutionRate}</div>
              <div class="bulletin-box-sub">${requests.resolved} Çözüldü / ${requests.total} Talep</div>
            </div>
          </div>

          <div class="bulletin-section">
            <h3 class="bulletin-sec-title">1. Mali Durum & Bütçe İcrası</h3>
            <div class="bulletin-table-wrap">
              <table class="bulletin-table">
                <thead>
                  <tr><th>Kalem</th><th>Tahakkuk / Bütçe</th><th>Fiili Tahsilat</th><th>Kalan Alacak / Bakiye</th><th>Durum</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cari Dönem Site Aidatları</td>
                    <td>${money(dues.total)}</td>
                    <td>${money(dues.paid)}</td>
                    <td>${money(dues.pending)}</td>
                    <td><strong>%${dues.collectionRate} Tahsil</strong></td>
                  </tr>
                  <tr>
                    <td>Geciken Aidatlar (Takipte)</td>
                    <td>${money(dues.overdue)}</td>
                    <td>-</td>
                    <td>${money(dues.overdue)}</td>
                    <td><span style="color:#b91c1c;">Hukuki İhtar Süreci</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bulletin-section">
            <h3 class="bulletin-sec-title">2. Teknik Bakım & Çözülen Operasyonlar</h3>
            <p style="font-size:12.5px; color:#475569; margin-bottom:8px;">Bu ay sakinlerimizce iletilen toplam <strong>${requests.total}</strong> talebin <strong>${requests.resolved}</strong> adedi incelenip giderilmiştir. Devam eden <strong>${requests.open}</strong> talep anlaşmalı teknik firmalarımızın takibindedir.</p>
            <div class="bulletin-table-wrap">
              <table class="bulletin-table">
                <thead>
                  <tr><th>Firma / Tedarikçi</th><th>Hizmet Alanı</th><th>İş Sayısı</th><th>Ort. Çözüm Süresi</th><th>Performans / SLA</th></tr>
                </thead>
                <tbody>
                  ${vendors.map(v => `
                    <tr>
                      <td><strong>${safeText(v.name)}</strong></td>
                      <td>${v.categories.join(", ") || "Genel"}</td>
                      <td>${v.total} iş (${v.resolved} çözüldü)</td>
                      <td>${v.avgDays} gün</td>
                      <td>${v.badge}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <div class="bulletin-section">
            <h3 class="bulletin-sec-title">3. Önemli Yönetim Kararları & Hatırlatmalar</h3>
            <ul class="bulletin-list">
              <li><strong>Aidat Ödeme Takvimi:</strong> Aidatların her ayın 15'ine kadar sitemiz banka hesabına daire numarası belirtilerek yatırılması rica olunur.</li>
              <li><strong>Ortak Alan & Otopark Düzeni:</strong> Lütfen araçlarınızı sadece tahsisli daire numaralı otopark alanlarına nizami şekilde park ediniz.</li>
              <li><strong>Acil Durum & İletişim:</strong> Bina tesisatı ve asansör acil durumlarında 7/24 apartman görevlimiz ve sistem üzerinden talep oluşturabilirsiniz.</li>
            </ul>
          </div>

          <div class="bulletin-footer">
            <div>
              <p>ApartAI Akıllı Yönetim Sistemi Tarafından Dijital Olarak Doğrulanmıştır.</p>
              <small>Belge Doğrulama Kodu: APT-${Date.now().toString(36).toUpperCase()}</small>
            </div>
            <div class="bulletin-signatures">
              <div class="signature-box">
                <span>Site Yöneticisi</span>
                <div class="sig-line"></div>
                <small>İmza & Kaşe</small>
              </div>
              <div class="signature-box">
                <span>Denetçi Üye</span>
                <div class="sig-line"></div>
                <small>İmza</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function surveysView() {
  const surveys = scoped.surveys || [];
  const totalApartments = scoped.apartments.length || 1;

  return `
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Yeni Karar / İstişare Anketi Başlat</h2>
            <p>Sakinlerin görüşünü almak ve kararları şeffaflaştırmak için anket açın.</p>
          </div>
        </div>
        <form class="grid" onsubmit="createSurvey(event)">
          <label>Anket Başlığı
            <input name="title" required placeholder="Örn. Güvenlik kamerası sisteminin yenilenmesi" />
          </label>
          <label>Açıklama / Gerekçe
            <textarea name="description" rows="3" required placeholder="Neden bu kararı alıyoruz, bütçe ve alternatifler nedir?"></textarea>
          </label>
          <label>Son Oy Verme Tarihi
            <input type="date" name="deadline" required value="${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}" />
          </label>
          <label>Seçenekler (Her satıra bir seçenek veya virgülle ayırın)
            <textarea name="options" rows="3" required placeholder="Evet, yenilensin (Teklif 1)&#10;Evet, yenilensin (Teklif 2)&#10;Hayır, ertelensin"></textarea>
          </label>
          <button class="btn primary" type="submit">Anketi Yayınla</button>
        </form>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <h2>Site Anketleri & Katılım Sonuçları</h2>
            <p>Toplam ${surveys.length} anket mevcut.</p>
          </div>
        </div>
        <div class="survey-list">
          ${surveys.map(survey => {
            const totalVotes = survey.votes?.length || 0;
            const participationRate = Math.min(100, Math.round((totalVotes / totalApartments) * 100));
            const isClosed = survey.status === "closed";

            const optionCounts = (survey.options || []).map((opt, idx) => {
              const count = (survey.votes || []).filter(v => v.optionIndex === idx || v.option === opt).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return { option: opt, count, pct };
            });

            return `
              <div class="survey-card ${isClosed ? 'closed' : 'active'}">
                <div class="survey-card-header">
                  <div>
                    <span class="status ${isClosed ? 'info' : 'success'}">${isClosed ? 'Sonuçlandı' : 'Oy Vermeye Açık'}</span>
                    <h3 style="margin:6px 0 2px;">${safeText(survey.title)}</h3>
                    <small style="color:var(--muted);">Son Tarih: ${dateText(survey.deadline)} | Katılım: %${participationRate} (${totalVotes}/${totalApartments} daire)</small>
                  </div>
                  <div style="display:flex; gap:8px; align-items:center;">
                    <button class="btn ${isClosed ? '' : 'warn'}" onclick="toggleSurveyStatus('${survey.id}')">
                      ${isClosed ? 'Tekrar Aç' : 'Anketi Kapat'}
                    </button>
                    <button class="btn danger" onclick="deleteSurvey('${survey.id}')" title="Anketi Kalıcı Olarak Sil">
                      Sil
                    </button>
                  </div>
                </div>
                <p style="margin:10px 0 14px; font-size:13.5px; color:var(--text-sub);">${safeText(survey.description)}</p>
                
                <div class="survey-results">
                  ${optionCounts.map(item => `
                    <div class="survey-option-bar">
                      <div class="survey-bar-meta">
                        <span><strong>${safeText(item.option)}</strong></span>
                        <span>${item.count} oy (%${item.pct})</span>
                      </div>
                      <div class="survey-progress-bg">
                        <div class="survey-progress-fill" style="width: ${item.pct}%"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('') || '<p style="color:var(--muted); padding:20px; text-align:center;">Henüz açılmış bir anket bulunmuyor.</p>'}
        </div>
      </section>
    </div>
  `;
}

function residentSurveysView() {
  const surveys = scoped.surveys || [];
  const currentUserId = state.sessionUser?.id;
  const currentResidentId = state.sessionUser?.residentId;
  const currentApartment = residentApartment();

  return `
    <div class="resident-shell-content">
      <div class="section-header" style="margin-bottom:16px;">
        <div>
          <h2>Site Karar & İstişare Anketleri</h2>
          <p>Yönetim tarafından sitemiz için açılan anketlere oy verin, kararlara doğrudan katılın.</p>
        </div>
      </div>

      <div class="survey-list">
        ${surveys.map(survey => {
          const votes = survey.votes || [];
          const userVote = votes.find(v => 
            (currentUserId && v.userId === currentUserId) || 
            (currentResidentId && v.residentId === currentResidentId) || 
            (currentApartment && v.apartmentId === currentApartment.id)
          );
          const hasVoted = Boolean(userVote);
          const isClosed = survey.status === "closed";
          const totalVotes = votes.length;

          const optionCounts = (survey.options || []).map((opt, idx) => {
            const count = votes.filter(v => v.optionIndex === idx || v.option === opt).length;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const votedThis = userVote?.optionIndex === idx || userVote?.option === opt;
            return { option: opt, count, pct, isVoted: votedThis };
          });

          return `
            <div class="survey-card ${isClosed ? 'closed' : 'active'}">
              <div class="survey-card-header">
                <div>
                  <span class="status ${isClosed ? 'info' : (hasVoted ? 'success' : 'warn')}">
                    ${isClosed ? 'Sonuçlandı' : (hasVoted ? '✓ Oyunuz Alındı' : 'Oyunuzu Bekliyor')}
                  </span>
                  <h3 style="margin:6px 0 2px;">${safeText(survey.title)}</h3>
                  <small style="color:var(--muted);">Son Tarih: ${dateText(survey.deadline)} | Toplam ${totalVotes} kişi oy verdi</small>
                </div>
              </div>
              <p style="margin:10px 0 16px; font-size:14px; color:var(--text-sub);">${safeText(survey.description)}</p>

              ${!isClosed && !hasVoted ? `
                <form onsubmit="castVote(event, '${survey.id}')">
                  <div class="survey-vote-options">
                    ${survey.options.map((opt, idx) => `
                      <label class="survey-vote-label" style="display:flex; align-items:center; gap:10px; padding:10px 14px; margin-bottom:8px; background:var(--surface-sunken); border:1px solid var(--border); border-radius:10px; cursor:pointer;">
                        <input type="radio" name="optionIndex" value="${idx}" required ${idx === 0 ? 'checked' : ''} />
                        <span style="font-weight:500;">${safeText(opt)}</span>
                      </label>
                    `).join('')}
                  </div>
                  <button class="btn primary" type="submit" style="margin-top:10px;">✓ Oyu Kaydet</button>
                </form>
              ` : `
                <div class="survey-results">
                  ${userVote ? `<div style="font-size:13.5px; font-weight:600; color:var(--primary); margin-bottom:12px;">Sizin Tercihiniz: "${safeText(userVote.option || (survey.options && survey.options[userVote.optionIndex]) || 'Oyunuz Kaydedildi')}"</div>` : ''}
                  ${optionCounts.map(item => `
                    <div class="survey-option-bar ${item.isVoted ? 'highlight-vote' : ''}">
                      <div class="survey-bar-meta">
                        <span>${item.isVoted ? '👉 ' : ''}<strong>${safeText(item.option)}</strong></span>
                        <span>${item.count} oy (%${item.pct})</span>
                      </div>
                      <div class="survey-progress-bg">
                        <div class="survey-progress-fill" style="width: ${item.pct}%"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          `;
        }).join('') || '<div class="section"><p style="color:var(--muted); text-align:center; padding:24px;">Şu anda aktif bir anket bulunmuyor.</p></div>'}
      </div>
    </div>
  `;
}

function createSurvey(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const optionsRaw = String(form.get("options") || "");
  const options = optionsRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (options.length < 2) {
    alert("Lütfen en az 2 seçenek giriniz.");
    return;
  }

  const payload = {
    title: safeText(form.get("title")),
    description: safeText(form.get("description")),
    deadline: safeText(form.get("deadline")),
    options,
  };

  if (API_BASE) {
    apiRequest(`/surveys?siteId=${encodeURIComponent(state.activeSiteId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((result) => {
        event.target.reset();
        applyServerData(result.data);
      })
      .catch((error) => alert(error.message));
    return;
  }

  const newSurvey = {
    id: id("surv"),
    siteId: state.activeSiteId,
    title: payload.title,
    description: payload.description,
    deadline: payload.deadline,
    options: payload.options,
    status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
    votes: [],
  };
  state.surveys = [...(state.surveys || []), newSurvey];
  saveState();
  event.target.reset();
  render();
}

function castVote(event, surveyId) {
  event.preventDefault();
  const form = new FormData(event.target);
  const rawIdx = form.get("optionIndex");
  if (rawIdx === null || rawIdx === undefined) return;
  const optionIndex = Number(rawIdx);
  const survey = (state.surveys || []).find((s) => s.id === surveyId);
  if (!survey || optionIndex < 0 || optionIndex >= (survey.options || []).length) {
    alert("Geçersiz seçenek.");
    return;
  }
  const optionText = survey.options[optionIndex];

  if (API_BASE) {
    apiRequest(`/surveys/${encodeURIComponent(surveyId)}/vote`, {
      method: "POST",
      body: JSON.stringify({ optionIndex }),
    })
      .then((result) => {
        applyServerData(result);
      })
      .catch((error) => alert(error.message));
    return;
  }

  const currentApartment = residentApartment();
  survey.votes = survey.votes || [];
  const existingIdx = survey.votes.findIndex(v => 
    v.userId === (state.sessionUser?.id || "guest") || 
    (currentApartment && v.apartmentId === currentApartment.id)
  );
  const voteRecord = {
    userId: state.sessionUser?.id || "guest",
    residentId: state.sessionUser?.residentId || "",
    apartmentId: currentApartment?.id || "apt-unknown",
    optionIndex,
    option: optionText,
    date: new Date().toISOString().slice(0, 10),
  };
  if (existingIdx >= 0) {
    survey.votes[existingIdx] = voteRecord;
  } else {
    survey.votes.push(voteRecord);
  }
  saveState();
  render();
}

function toggleSurveyStatus(surveyId) {
  if (API_BASE) {
    apiRequest(`/surveys/${encodeURIComponent(surveyId)}/close`, {
      method: "PATCH",
    })
      .then((result) => {
        applyServerData(result);
      })
      .catch((error) => alert(error.message));
    return;
  }

  const survey = (state.surveys || []).find((s) => s.id === surveyId);
  if (!survey) return;
  survey.status = survey.status === "closed" ? "active" : "closed";
  saveState();
  render();
}

function deleteSurvey(surveyId) {
  if (!confirm("Bu anketi ve tüm oylarını silmek istediğinize emin misiniz?")) return;
  if (API_BASE) {
    apiRequest(`/surveys/${encodeURIComponent(surveyId)}`, {
      method: "DELETE",
    })
      .then((result) => {
        applyServerData(result);
      })
      .catch((error) => alert(error.message));
    return;
  }
  state.surveys = (state.surveys || []).filter((s) => s.id !== surveyId);
  saveState();
  render();
}

function residentBottomNav() {
  const items = [
    { view: "resident-home", icon: "🏠", label: "Ana Sayfa" },
    { view: "resident-request", icon: "🛠️", label: "Talep Aç" },
    { view: "resident-announcements", icon: "📢", label: "Duyurular" },
    { view: "resident-surveys", icon: "📊", label: "Anketler" },
  ];
  return `
    <nav class="mobile-bottom-nav">
      ${items.map((item) => `
        <button type="button" class="bottom-nav-item ${state.view === item.view ? "active" : ""}" onclick="setState({ view: '${item.view}' })">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function managerBottomNav() {
  const items = [
    { view: "dashboard", icon: "📊", label: "Özet" },
    { view: "dues", icon: "💳", label: "Aidatlar" },
    { view: "requests", icon: "🛠️", label: "Talepler" },
    { view: "surveys", icon: "🗳️", label: "Anketler" },
    { view: "reports", icon: "📑", label: "Raporlar" },
  ];
  return `
    <nav class="mobile-bottom-nav manager-nav">
      ${items.map((item) => `
        <button type="button" class="bottom-nav-item ${state.view === item.view ? "active" : ""}" onclick="setState({ view: '${item.view}' })">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderAssistantMessagesHtml() {
  const messages = state.assistantMessages || [];
  const isLoading = state.isAssistantLoading;
  return `
    ${messages.map((msg) => `
      <div class="ai-chat-msg-row ${msg.role}">
        <div class="ai-chat-bubble ${msg.role}">
          <div class="ai-msg-content">${msg.content.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>
          <span class="ai-msg-time">${msg.time || ""}</span>
        </div>
      </div>
      ${msg.suggestedPrompts && msg.suggestedPrompts.length > 0 ? `
        <div class="ai-chips-container">
          ${msg.suggestedPrompts.map((p) => `
            <button type="button" class="ai-prompt-chip" data-prompt="${escapeAttr(p)}" onclick="sendAssistantPrompt(this)">${safeText(p)}</button>
          `).join("")}
        </div>
      ` : ""}
    `).join("")}

    ${isLoading ? `
      <div class="ai-chat-msg-row assistant">
        <div class="ai-chat-bubble assistant typing">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    ` : ""}
  `;
}

function scrollAssistantToBottom() {
  const container = document.querySelector("#ai-assistant-root");
  if (!container) return;
  const bodyEl = container.querySelector(".ai-chat-body");
  if (bodyEl) {
    bodyEl.scrollTop = bodyEl.scrollHeight;
    requestAnimationFrame(() => {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    });
    setTimeout(() => {
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }, 60);
  }
}

function updateAssistantDOM() {
  const container = document.querySelector("#ai-assistant-root");
  if (!container) return;

  const existingWindow = container.querySelector(".ai-chat-window");
  const existingBody = container.querySelector(".ai-chat-body");

  // Eğer sohbet penceresi zaten açıksa, tüm widget'ı silip baştan render ETME (titremeyi önler)
  if (state.isAssistantOpen && existingWindow && existingBody) {
    existingBody.innerHTML = renderAssistantMessagesHtml();
    scrollAssistantToBottom();
    const sendBtn = container.querySelector(".ai-send-btn");
    if (sendBtn) sendBtn.disabled = Boolean(state.isAssistantLoading);
    return;
  }

  container.innerHTML = assistantWidgetMarkup();
  scrollAssistantToBottom();
}

function escapeAttr(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sendAssistantPrompt(btn) {
  const promptText = btn?.getAttribute("data-prompt");
  if (promptText) {
    sendAssistantMessage(promptText);
  }
}

function toggleAssistant() {
  state.isAssistantOpen = !state.isAssistantOpen;
  if (state.isAssistantOpen && (!state.assistantMessages || state.assistantMessages.length === 0)) {
    const isResident = state.mode === "resident";
    const isGuest = !state.sessionUser;
    const name = state.sessionUser?.name || "Ziyaretçi";
    let initialText = "";
    let initialPrompts = [];

    if (isGuest) {
      initialText = `Merhaba! Ben **ApartAI Akıllı Asistanıyım** 👋\n\nApartman ve site yönetim süreçlerinde yapay zekanın sağladığı kolaylıklar, tahsilat öngörüleri veya fotoğraflı arıza analizleri hakkında bana dilediğinizi sorabilirsiniz.`;
      initialPrompts = [
        "ApartAI nedir ve ne işe yarar?",
        "Yönetici olarak nasıl denerim?",
        "Sakinler aidatlarını nasıl öder?",
        "Fotoğraflı arıza bildirimi nasıl çalışır?",
      ];
    } else if (isResident) {
      initialText = `Merhaba ${safeText(name)}! Ben **ApartAI Akıllı Asistanınızım** 👋\n\nAidat borcunuz, otopark/plaka kaydınız, teknik arıza bildirimleriniz veya aktif anketlerle ilgili her şeyi bana sorabilirsiniz.`;
      initialPrompts = [
        "Aidat borcum ne kadar?",
        "Kayıtlı araç plakam nedir?",
        "Aktif bir anket var mı?",
        "Arıza talebi nasıl açarım?",
      ];
    } else {
      initialText = `Merhaba Sayın Yöneticim! Ben **ApartAI Akıllı Asistanınızım** 🤖\n\nSitenizin tahsilat performansı, arıza yoğunlukları, sakin profili ve duyuru hazırlama süreçlerinde 7/24 yanınızdayım. Size nasıl yardımcı olabilirim?`;
      initialPrompts = [
        "Aidat tahsilat durumu nasıl?",
        "En çok hangi konuda arıza var?",
        "Asansör bakımı için duyuru taslağı yaz",
        "Sitede kaç kiracı, kaç ev sahibi var?",
      ];
    }

    state.assistantMessages = [
      {
        role: "assistant",
        content: initialText,
        suggestedPrompts: initialPrompts,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  }
  updateAssistantDOM();
}

async function sendAssistantMessage(customText) {
  const inputEl = document.querySelector("#assistant-input");
  const text = (customText !== undefined && customText !== null ? String(customText) : (inputEl ? inputEl.value : "")).trim();
  if (!text || state.isAssistantLoading) return;

  if (inputEl) inputEl.value = "";

  const userMsg = {
    role: "user",
    content: text,
    time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };

  state.assistantMessages = [...(state.assistantMessages || []), userMsg];
  state.isAssistantLoading = true;
  updateAssistantDOM();
  scrollAssistantToBottom();

  try {
    let reply = "";
    let suggestedPrompts = [];

    // Gerçekçi düşünme hissi vermek ve anında çat diye yanıtın sırıtmasını önlemek için min gecikme
    const minDelay = new Promise((resolve) => setTimeout(resolve, 750));

    if (API_BASE) {
      const siteParam = state.activeSiteId ? `?siteId=${encodeURIComponent(state.activeSiteId)}` : "";
      const [res] = await Promise.all([
        apiRequest(`/ai/assistant${siteParam}`, {
          method: "POST",
          body: JSON.stringify({ message: text }),
        }),
        minDelay,
      ]);
      reply = res.reply || "Yanıt alınamadı.";
      suggestedPrompts = res.suggestedPrompts || [];
    } else {
      await minDelay;
      reply = `ApartAI Asistanı: "${safeText(text)}" sorunuz incelendi. Sistem verileriyle senkronize çalışmaktadır.`;
      suggestedPrompts = ["ApartAI nedir ve ne işe yarar?", "Yönetici olarak nasıl denerim?"];
    }

    state.assistantMessages = [
      ...state.assistantMessages,
      {
        role: "assistant",
        content: reply,
        suggestedPrompts,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    state.isAssistantLoading = false;
    updateAssistantDOM();
    scrollAssistantToBottom();
  } catch (error) {
    state.assistantMessages = [
      ...state.assistantMessages,
      {
        role: "assistant",
        content: `⚠️ Yanıt oluşturulurken bir hata oluştu: ${safeText(error.message)}`,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    state.isAssistantLoading = false;
    updateAssistantDOM();
    scrollAssistantToBottom();
  }
}

function assistantWidgetMarkup() {
  const isOpen = state.isAssistantOpen;
  const isLoading = state.isAssistantLoading;

  return `
    <div class="ai-widget-wrapper ${isOpen ? "open" : ""}">
      <button type="button" class="ai-fab-btn" onclick="toggleAssistant()" aria-label="ApartAI Asistanı" title="ApartAI Akıllı Asistan">
        ${isOpen ? `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ` : `
          <div class="ai-fab-glow"></div>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6.2 5 7.4V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.6c3-1.2 5-4.1 5-7.4a8 8 0 0 0-8-8z"></path>
            <circle cx="9" cy="10" r="1"></circle>
            <circle cx="15" cy="10" r="1"></circle>
            <path d="M9.5 14a3.5 3.5 0 0 0 5 0"></path>
          </svg>
          <span class="ai-fab-badge">AI</span>
        `}
      </button>

      ${isOpen ? `
        <div class="ai-chat-window">
          <div class="ai-chat-header">
            <div class="ai-chat-brand">
              <div class="ai-avatar-icon">✨</div>
              <div>
                <strong>ApartAI Asistanı</strong>
                <span class="ai-chat-status"><span class="pulse-dot"></span> 7/24 Aktif & Bağlamsal</span>
              </div>
            </div>
            <button type="button" class="ai-chat-close-btn" onclick="toggleAssistant()" aria-label="Kapat">×</button>
          </div>

          <div class="ai-chat-body">
            ${renderAssistantMessagesHtml()}
          </div>

          <form class="ai-chat-footer" onsubmit="event.preventDefault(); sendAssistantMessage();">
            <input
              id="assistant-input"
              type="text"
              autocomplete="off"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAssistantMessage();}"
              placeholder="${!state.sessionUser ? "ApartAI özellikleri veya demo hakkında sorun..." : (state.mode === "resident" ? "Aidat, arıza, araç plakanız hakkında sorun..." : "Tahsilat, arızalar, duyuru taslağı isteyin...")}"
            />
            <button type="submit" class="ai-send-btn" ${isLoading ? "disabled" : ""} aria-label="Gönder">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      ` : ""}
    </div>
  `;
}

loadRemoteState();
