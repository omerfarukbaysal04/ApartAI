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
  requestEntryTypeFilter: "all",
  residentRequestType: "fault",
  selectedNotificationDetailId: null,
  activePaymentDueId: null,
  paymentStep: "form",
  paymentReceiptData: null,
  setupBlockFilter: "all",
  duesPeriodFilter: "all",
  duesBlockFilter: "all",
  duesStatusFilter: "all",
  duesSelectedAptId: "all",
  financesDateFilter: "all",
  financesStartDate: "",
  financesEndDate: "",
  financesSelectedMonth: "all",
  financesCategoryFilter: "all",
  warningModalDueId: null,
  warningModalAptId: null,
  warningModalTone: "friendly",
  warningModalDraft: "",
  editingSurveyId: null,
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
    // Geçmiş Dönem Aidatları (Nisan & Mart 2026)
    { id: "due-h-1", siteId: "site-1", apartmentId: "apt-1", period: "2026-04", amount: 1850, dueDate: "2026-04-10", status: "paid", paidDate: "2026-04-05" },
    { id: "due-h-2", siteId: "site-1", apartmentId: "apt-2", period: "2026-04", amount: 1850, dueDate: "2026-04-10", status: "paid", paidDate: "2026-04-08" },
    { id: "due-h-3", siteId: "site-1", apartmentId: "apt-3", period: "2026-04", amount: 1850, dueDate: "2026-04-10", status: "overdue" },
    { id: "due-h-4", siteId: "site-1", apartmentId: "apt-4", period: "2026-04", amount: 1850, dueDate: "2026-04-10", status: "paid", paidDate: "2026-04-03" },
    { id: "due-h-5", siteId: "site-1", apartmentId: "apt-1", period: "2026-03", amount: 1750, dueDate: "2026-03-10", status: "paid", paidDate: "2026-03-04" },
    { id: "due-h-6", siteId: "site-1", apartmentId: "apt-2", period: "2026-03", amount: 1750, dueDate: "2026-03-10", status: "paid", paidDate: "2026-03-06" },
    { id: "due-h-7", siteId: "site-1", apartmentId: "apt-3", period: "2026-03", amount: 1750, dueDate: "2026-03-10", status: "paid", paidDate: "2026-03-09" },
    { id: "due-h-8", siteId: "site-1", apartmentId: "apt-4", period: "2026-03", amount: 1750, dueDate: "2026-03-10", status: "paid", paidDate: "2026-03-02" },
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
      entryType: "complaint",
      title: "C blok girişinde çöp kokusu ve atık birikmesi",
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
      entryType: "fault",
      title: "B blok asansör kalkışta sert ses yapıyor",
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
      entryType: "fault",
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
    {
      id: "req-4",
      siteId: "site-1",
      apartmentId: "apt-1",
      category: "Su ve tesisat",
      entryType: "fault",
      title: "A blok bodrum hidrofor su sızıntısı",
      description: "Bodrum kattaki ana hidrofor vanasında damlatma vardı, teknik ekip contayı yeniledi.",
      photoUrl: "",
      urgency: "Yüksek",
      status: "cozuldu",
      adminNote: "Tesisatçı contayı değiştirdi, sızıntı kesildi.",
      assignee: "Termo Teknik",
      assignedAt: "2026-05-03",
      aiSummary: "Hidrofor vanasındaki su sızıntısı başarıyla giderildi.",
      aiSuggestedAction: "Basınç testini tamamla ve kontrol kaydını kapat.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "A Blok Bodrum",
      createdAt: "2026-05-02",
      resolvedAt: "2026-05-04",
    },
    {
      id: "req-5",
      siteId: "site-1",
      apartmentId: "apt-2",
      category: "Güvenlik",
      entryType: "complaint",
      title: "Kapalı otoparkta hatalı araç parkı",
      description: "Yangın çıkış kapısının önüne park eden araç sebebiyle geçiş engelleniyor.",
      photoUrl: "",
      urgency: "Orta",
      status: "yeni",
      adminNote: "",
      assignee: "",
      assignedAt: "",
      aiSummary: "Kapalı otoparkta acil çıkış koridorunu kapatan araç şikayeti.",
      aiSuggestedAction: "Araç plakasına SMS/uyarı ileterek çekilmesini sağla.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "Kapalı Otopark -1",
      createdAt: "2026-09-25",
      resolvedAt: "",
    },
    {
      id: "req-6",
      siteId: "site-1",
      apartmentId: "apt-1",
      category: "Bahçe",
      entryType: "suggestion",
      title: "Ortak bahçeye çocuk oyun alanı ve kamelya eklenmesi",
      description: "Arka bahçedeki atıl çim alana çocuklar için ahşap oyun grubu ve sakinler için kamelya yapılabilir.",
      photoUrl: "",
      urgency: "Düşük",
      status: "yeni",
      adminNote: "",
      assignee: "",
      assignedAt: "",
      aiSummary: "Bahçe alanına çocuk oyun parkı ve dinlenme kamelyası önerisi.",
      aiSuggestedAction: "Site genel kurul gündemine al ve sakin anketi başlat.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "Arka Bahçe",
      createdAt: "2026-09-20",
      resolvedAt: "",
    },
    {
      id: "req-7",
      siteId: "site-1",
      apartmentId: "apt-4",
      category: "Ortak Alan",
      entryType: "suggestion",
      title: "Çatıya güneş panelleri kurulumu ile aidat tasarrufu",
      description: "Ortak alan elektrik giderlerini %60 düşürmek adına çatıya lisanssız GES kurulması teklifi.",
      photoUrl: "",
      urgency: "Düşük",
      status: "inceleniyor",
      adminNote: "Mühendislik firmalarından fizibilite teklifi isteniyor.",
      assignee: "Solar Mühendislik",
      assignedAt: "2026-09-18",
      aiSummary: "Ortak elektrik maliyetini düşürmek için güneş enerjisi önerisi.",
      aiSuggestedAction: "Fizibilite ve geri dönüş süresi hesap raporu hazırlat.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "Çatı Alanı",
      createdAt: "2026-09-15",
      resolvedAt: "",
    },
    {
      id: "req-8",
      siteId: "site-1",
      apartmentId: "apt-3",
      category: "Ortak Alan",
      entryType: "complaint",
      title: "Gece saatlerinde yüksek müzik sesi şikayeti",
      description: "Hafta içi saat 23:30 sonrası üst kattan gelen aşırı gürültü uykuyu engelliyor.",
      photoUrl: "",
      urgency: "Yüksek",
      status: "reddedildi",
      adminNote: "Belirtilen saatte nöbetçi güvenlik kontrol ettiğinde ses tespit edilemedi.",
      assignee: "Güvenlik Amiri",
      assignedAt: "2026-09-12",
      aiSummary: "Gece gürültü şikayeti yerinde teyit edilemediğinden işlem kapatıldı.",
      aiSuggestedAction: "İlgili daireye apartman yaşam kuralları hatırlatması ilet.",
      aiProvider: "rules",
      aiModel: "fallback",
      aiFallbackUsed: true,
      location: "B Blok 3. Kat",
      createdAt: "2026-09-11",
      resolvedAt: "2026-09-12",
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
  expenses: [
    {
      id: "exp-1",
      siteId: "site-1",
      title: "Ortak Alan Elektrik Faturası (Nisan)",
      category: "electricity",
      amount: 4250,
      date: "2026-05-02",
      vendor: "BEDAŞ / Enerji A.Ş.",
      invoiceNo: "FTR-2026-8812",
      description: "Bina merdiven otomatiği, hidrofor ve asansör ortak sayaç tüketimi",
    },
    {
      id: "exp-2",
      siteId: "site-1",
      title: "Asansör Aylık Periyodik Bakım ve Yağlama",
      category: "elevator",
      amount: 2800,
      date: "2026-05-04",
      vendor: "Kone Asansör Servis",
      invoiceNo: "SRV-4410",
      description: "A ve B blok çift asansör aylık yasal periyodik servis bakımı",
    },
    {
      id: "exp-3",
      siteId: "site-1",
      title: "Ortak Alan Temizlik Kimyasalları ve Sarf Malzeme",
      category: "cleaning",
      amount: 1650,
      date: "2026-05-06",
      vendor: "Titiz Kimya ve Hijyen Ltd.",
      invoiceNo: "FAT-0914",
      description: "Ortak alan zemin temizlik otomatı deterjanı ve çöp torbaları",
    },
    {
      id: "exp-4",
      siteId: "site-1",
      title: "Bahçe Çim Biçme ve Sulama Sistemi Onarımı",
      category: "garden",
      amount: 1900,
      date: "2026-05-08",
      vendor: "Yeşil Vadi Peyzaj",
      invoiceNo: "MAK-102",
      description: "Bahar dönemi çim havalandırma ve patlayan damlama borusu değişimi",
    },
    // Son Dönem Giderleri (Eylül, Ağustos, Temmuz 2026)
    {
      id: "exp-s-1",
      siteId: "site-1",
      title: "Asansör Periyodik Bakımı (Eylül)",
      category: "elevator",
      amount: 3200,
      date: "2026-09-28",
      vendor: "Kone Asansör Servis",
      invoiceNo: "SRV-9011",
      description: "Eylül ayı A ve B blok asansör bakım kontrolü ve yağlama",
    },
    {
      id: "exp-s-2",
      siteId: "site-1",
      title: "Site Ortak Alan Temizlik Malzemeleri",
      category: "cleaning",
      amount: 1450,
      date: "2026-09-22",
      vendor: "Titiz Kimya ve Hijyen Ltd.",
      invoiceNo: "FAT-1840",
      description: "Otomat deterjanı, sıvı sabun ve kat temizlik sarf malzemeleri",
    },
    {
      id: "exp-s-3",
      siteId: "site-1",
      title: "Ortak Alan Elektrik Faturası (Eylül)",
      category: "electricity",
      amount: 4300,
      date: "2026-09-10",
      vendor: "BEDAŞ / Enerji A.Ş.",
      invoiceNo: "FTR-2026-9901",
      description: "Eylül ayı merdiven, asansör ve çevre aydınlatma elektrik faturası",
    },
    {
      id: "exp-s-4",
      siteId: "site-1",
      title: "Havuz & Su Deposu Dezenfeksiyonu",
      category: "water",
      amount: 2600,
      date: "2026-08-15",
      vendor: "Mavi Su Hijyen Ltd.",
      invoiceNo: "FAT-7714",
      description: "Yaz dönemi hidrofor ve ana su deposu klorlama ve filtre değişimi",
    },
    {
      id: "exp-s-5",
      siteId: "site-1",
      title: "Güvenlik Kamera Sistemi Genişletme",
      category: "security",
      amount: 3500,
      date: "2026-07-20",
      vendor: "Kale Güvenlik Sistemleri",
      invoiceNo: "FTR-4402",
      description: "Kapalı otopark girişine 2 adet gece görüşlü IP kamera montajı",
    },
    // Geçmiş Dönem Giderleri (Nisan & Mart 2026)
    {
      id: "exp-h-1",
      siteId: "site-1",
      title: "Ortak Alan Elektrik Faturası (Nisan)",
      category: "electricity",
      amount: 3850,
      date: "2026-04-03",
      vendor: "BEDAŞ / Enerji A.Ş.",
      invoiceNo: "FTR-2026-7721",
      description: "Nisan ayı ortak alan aydınlatma ve asansör elektrik tüketimi",
    },
    {
      id: "exp-h-2",
      siteId: "site-1",
      title: "Asansör Nisan Ayı Periyodik Bakımı",
      category: "elevator",
      amount: 2800,
      date: "2026-04-05",
      vendor: "Kone Asansör Servis",
      invoiceNo: "SRV-3312",
      description: "A ve B blok asansör bakım faturası",
    },
    {
      id: "exp-h-3",
      siteId: "site-1",
      title: "Merkezi Kazan & Hidrofor Bakımı",
      category: "maintenance",
      amount: 4200,
      date: "2026-03-15",
      vendor: "Termo Teknik Servis",
      invoiceNo: "FTR-2026-5509",
      description: "Kazan brülör ayarı ve hidrofor basınç tankı yenileme",
    },
    {
      id: "exp-h-4",
      siteId: "site-1",
      title: "Ortak Alan Elektrik Faturası (Mart)",
      category: "electricity",
      amount: 4100,
      date: "2026-03-04",
      vendor: "BEDAŞ / Enerji A.Ş.",
      invoiceNo: "FTR-2026-6610",
      description: "Mart ayı ortak alan elektrik tüketimi",
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

const ACTIVE_VIEW_KEY = "apartai-active-view-v1";

function saveActiveView(view) {
  if (!view) return;
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, view);
    if (location.hash !== `#${view}`) {
      history.replaceState(null, "", `#${view}`);
    }
  } catch (e) {}
}

function getSavedActiveView(role) {
  const hashView = (location.hash || "").replace(/^#/, "").trim();
  const storedView = localStorage.getItem(ACTIVE_VIEW_KEY) || "";
  const candidate = hashView || storedView;

  const managerViews = ["dashboard", "dues", "finances", "requests", "announcements", "surveys", "setup", "reports", "sites", "profile"];
  const residentViews = ["resident-home", "resident-request", "resident-announcements", "resident-surveys", "profile"];

  if (role === "resident") {
    if (residentViews.includes(candidate)) return candidate;
    return "resident-home";
  } else {
    if (managerViews.includes(candidate)) return candidate;
    return "dashboard";
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = { ...state, ...patch };
  if (patch.view) {
    saveActiveView(patch.view);
  }
  if (!API_BASE) saveState();
  render();
}

function applyServerData(data, patch = {}) {
  const currentView = patch.view || state.view;
  const uiState = {
    view: currentView,
    mode: state.mode,
    selectedResidentId: state.selectedResidentId,
    selectedRequestId: state.selectedRequestId,
    selectedDueId: state.selectedDueId,
    reminderDraft: state.reminderDraft,
    reminderFallbackUsed: state.reminderFallbackUsed,
    requestStatusFilter: state.requestStatusFilter,
    requestCategoryFilter: state.requestCategoryFilter,
    requestEntryTypeFilter: state.requestEntryTypeFilter,
    residentRequestType: state.residentRequestType,
    selectedNotificationDetailId: state.selectedNotificationDetailId,
    activePaymentDueId: state.activePaymentDueId,
    paymentStep: state.paymentStep,
    paymentReceiptData: state.paymentReceiptData,
    setupBlockFilter: state.setupBlockFilter,
    duesPeriodFilter: state.duesPeriodFilter,
    duesBlockFilter: state.duesBlockFilter,
    duesStatusFilter: state.duesStatusFilter,
    duesSelectedAptId: state.duesSelectedAptId,
    financesDateFilter: state.financesDateFilter,
    financesStartDate: state.financesStartDate,
    financesEndDate: state.financesEndDate,
    financesSelectedMonth: state.financesSelectedMonth,
    financesCategoryFilter: state.financesCategoryFilter,
    editingSurveyId: state.editingSurveyId,
    assistantMessages: state.assistantMessages,
    sessionUser: state.sessionUser,
    activeSiteId: state.activeSiteId,
  };
  state = { ...state, ...data, ...uiState, ...patch };
  if (patch.view) {
    saveActiveView(patch.view);
  }
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
  expenses: [],
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
    expenses: pick(state.expenses),
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
    const savedView = getSavedActiveView(state.sessionUser?.role);
    if (savedView) {
      state.view = savedView;
      saveActiveView(savedView);
    }
    render();
    return;
  }
  try {
    state = { ...state, ...(await apiRequest("/state")) };
    state.sessionUser = loadSession();
    const role = state.sessionUser?.role;
    if (role === "resident") {
      state.mode = "resident";
      state.selectedResidentId = state.sessionUser.residentId;
    }
    // F5 yenilemesinde kullanıcının bulunduğu sayfayı koru
    const restoredView = getSavedActiveView(role);
    if (restoredView) {
      state.view = restoredView;
      saveActiveView(restoredView);
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
    document.body.classList.remove("resident-mode", "manager-mode", "ai-chat-open");
    app.innerHTML = authView();
    return;
  }
  document.body.classList.toggle("resident-mode", state.mode === "resident");
  document.body.classList.toggle("manager-mode", state.mode === "manager");
  document.body.classList.toggle("ai-chat-open", Boolean(state.isAssistantOpen));

  // Sakin hesabında mobilde sol menü gereksiz kalır (alt bar varken sol bar açılmaz)
  if (state.mode === "resident" && state.mobileNavOpen) {
    state.mobileNavOpen = false;
  }

  const site = activeSite();
  app.innerHTML = `
    <div class="shell ${state.mode === "resident" ? "resident-shell" : ""}">
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
            ${state.mode === "manager" ? `<button class="mobile-menu-trigger" onclick="setState({ mobileNavOpen: true })" aria-label="Menü">☰</button>` : ""}
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
    ${notificationDetailModal()}
    ${paymentGatewayModal()}
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

let audioCtx = null;
function playNotificationSound() {
  if (state.soundDisabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Kristalline 2-tonlu chime (C6: 1046Hz -> E6: 1318Hz)
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

    osc2.frequency.setValueAtTime(1046.5, now);
    osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.54);
    osc2.stop(now + 0.54);
  } catch (e) {
    // Ses engeli durumunda sessiz devam et
  }
}

function toggleSoundPreference(enabled) {
  setState({ soundDisabled: !enabled });
  if (enabled) {
    playNotificationSound();
  }
}

const READ_NOTIFS_STORAGE_KEY = "apartai_read_notif_ids_v2";

function getReadNotifIds() {
  try {
    return JSON.parse(localStorage.getItem(READ_NOTIFS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function markNotifAsRead(id) {
  const ids = getReadNotifIds();
  if (!ids.includes(id)) {
    ids.push(id);
    try {
      localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }
}

function userNotifications() {
  const list = [];
  const user = state.sessionUser;
  if (!user) return [];
  const readIds = getReadNotifIds();

  // 1. Duyurular
  const unreadAnnouncements = unreadAnnouncementsForSession();
  scoped.announcements.slice(-6).reverse().forEach((ann) => {
    const isUnread = !readIds.includes(`notif-ann-${ann.id}`) && !(ann.readBy || []).some((entry) => entry.userId === user.id);
    list.push({
      id: `notif-ann-${ann.id}`,
      targetId: ann.id,
      type: "announcement",
      icon: "📢",
      title: "Yönetim Duyurusu: " + ann.title,
      desc: ann.content.length > 70 ? ann.content.slice(0, 70) + "..." : ann.content,
      fullText: ann.content,
      date: ann.date,
      view: user.role === "resident" ? "resident-announcements" : "announcements",
      unread: isUnread,
    });
  });

  // 2. Anketler
  const activeSurveys = (scoped.surveys || []).filter((s) => s.status === "active");
  if (user.role === "resident") {
    const apt = residentApartment();
    activeSurveys.forEach((s) => {
      const hasVoted = (s.votes || []).some((v) => v.userId === user.id || (apt && v.apartmentId === apt.id));
      const notifId = `notif-survey-${s.id}`;
      list.push({
        id: notifId,
        targetId: s.id,
        type: "survey",
        icon: "🗳️",
        title: hasVoted ? "Karar Anketi: " + s.title : "Oyunuz Bekleniyor: " + s.title,
        desc: hasVoted ? "Bu ankette oyunuz kaydedildi, dilerseniz tercihinizi güncelleyebilirsiniz." : "Site karar istişare anketine henüz oy vermediniz.",
        fullText: s.description || (s.title + " konulu anket aktiftir."),
        date: s.createdAt,
        view: "resident-surveys",
        unread: !readIds.includes(notifId) && !hasVoted,
      });
    });
  } else {
    activeSurveys.forEach((s) => {
      const notifId = `notif-survey-admin-${s.id}`;
      list.push({
        id: notifId,
        targetId: s.id,
        type: "survey",
        icon: "🗳️",
        title: "Aktif Karar Anketi: " + s.title,
        desc: `${(s.votes || []).length} daire oy kullandı.`,
        fullText: `${s.title} anketine katılım devam ediyor. Toplam oy sayısı: ${(s.votes || []).length}.`,
        date: s.createdAt,
        view: "surveys",
        unread: !readIds.includes(notifId),
      });
    });
  }

  // 3. Aidat / Kasa
  if (user.role === "resident") {
    const apt = residentApartment();
    const unpaid = scoped.dues.filter((d) => d.apartmentId === apt?.id && d.status !== "paid");
    if (unpaid.length > 0) {
      const firstDue = unpaid[0];
      const notifId = `notif-due-${firstDue.id}`;
      list.push({
        id: notifId,
        targetId: firstDue.id,
        type: "due",
        icon: "💳",
        title: "Ödenmemiş Aidat Bakiyesi",
        desc: `${unpaid.length} döneme ait toplam ${money(unpaid.reduce((s, d) => s + Number(d.amount), 0))} borcunuz bulunmaktadır.`,
        fullText: `${firstDue.period} dönemi ve önceki ödenmemiş aidatlarınız bulunmaktadır. ApartAI güvenli ödeme geçidi üzerinden kredi kartı veya banka kartınızla anında ödeyebilirsiniz.`,
        date: firstDue.dueDate || new Date().toISOString().slice(0, 10),
        view: "resident-home",
        unread: !readIds.includes(notifId),
      });
    }
  } else {
    const overdue = scoped.dues.filter((d) => d.status === "overdue");
    if (overdue.length > 0) {
      const notifId = "notif-dues-overdue";
      list.push({
        id: notifId,
        targetId: null,
        type: "due",
        icon: "⚠️",
        title: "Gecikmiş Aidat Bildirimi",
        desc: `${overdue.length} dairenin aidat ödemesi gecikmede.`,
        fullText: `Sitede ${overdue.length} dairenin aidat ödemesi vadesi geçmiş durumdadır. Hatırlatma SMS/WhatsApp mesajı gönderebilirsiniz.`,
        date: new Date().toISOString().slice(0, 10),
        view: "dues",
        unread: !readIds.includes(notifId),
      });
    }
  }

  // 4. Talepler
  if (user.role === "resident") {
    const apt = residentApartment();
    const reqs = scoped.requests.filter((r) => r.apartmentId === apt?.id);
    // Sakin kendi açtığı 'yeni' talepleri bildirim kutusunda 'yeni' olarak almaz.
    // Yalnızca yönetim durumu güncellediğinde (inceleniyor, firmaya_iletildi, cozuldu, vb.) bilgilendirilir.
    const updatedReqs = reqs.filter((r) => r.status && r.status !== "yeni");
    updatedReqs.forEach((r) => {
      const notifId = `notif-req-${r.id}-${r.status}`;
      list.push({
        id: notifId,
        targetId: r.id,
        type: "request",
        icon: r.status === "cozuldu" ? "✅" : r.status === "firmaya_iletildi" ? "🔧" : r.status === "inceleniyor" ? "🔍" : r.entryType === "complaint" ? "⚠️" : r.entryType === "suggestion" ? "💡" : "🛠️",
        title: `Talep Güncellemesi: ${r.title}`,
        desc: `Durum: ${requestStatusText(r.status)}${r.assignee ? ` • ${r.assignee}` : ""}`,
        fullText: `${r.title}\n\nAçıklama: ${r.description}\nGüncel Durum: ${requestStatusText(r.status)}${r.assignee ? `\nAtanan Firma/Usta: ${r.assignee}` : ""}${r.adminNote ? `\nYönetim Notu: ${r.adminNote}` : ""}`,
        date: r.updatedAt || r.createdAt,
        view: "resident-home",
        unread: !readIds.includes(notifId),
      });
    });
  } else {
    // YÖNETİCİ: Sakinlerin açtığı her yeni talep tek tek bildirim olarak admine gelir
    const newReqs = scoped.requests.filter((r) => r.status === "yeni");
    newReqs.forEach((r) => {
      const apt = scoped.apartments.find((a) => a.id === r.apartmentId);
      const res = scoped.residents.find((x) => x.id === apt?.residentId);
      const notifId = `notif-admin-new-req-${r.id}`;
      const typeLabel = r.entryType === "complaint" ? "Şikayet" : r.entryType === "suggestion" ? "Öneri" : "Arıza Talebi";
      const icon = r.urgency === "Acil" ? "🚨" : r.entryType === "complaint" ? "⚠️" : r.entryType === "suggestion" ? "💡" : "🛠️";
      list.push({
        id: notifId,
        targetId: r.id,
        type: "request",
        icon,
        title: `Yeni ${typeLabel}: ${r.title}`,
        desc: `${apt ? `Daire ${apt.no}` : "Sakin"}${res ? ` (${res.name})` : ""} • ${r.urgency || "Orta"} Öncelik`,
        fullText: `Yeni Sakin Talebi:\nBaşlık: ${r.title}\nTür: ${typeLabel}\nKategori: ${r.category || "Genel"}\nÖncelik: ${r.urgency || "Orta"}\nDaire: ${apt ? `No ${apt.no}` : "Bilinmiyor"}\nAçıklama: ${r.description}`,
        date: r.createdAt,
        view: "requests",
        unread: !readIds.includes(notifId),
      });
    });
  }

  // Bildirimleri her zaman en yeniden en eskiye sırala (en yeni bildirim daima en üstte)
  list.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  return list;
}

function updateNotificationDrawerDom() {
  const wrapper = document.querySelector(".notification-dropdown-wrapper");
  if (!wrapper) return;
  const notifs = userNotifications();
  const unreadCount = notifs.filter((n) => n.unread).length;

  const bellBtn = wrapper.querySelector(".notification-bell-btn");
  if (bellBtn) {
    if (unreadCount > 0) {
      bellBtn.classList.add("has-unread");
      let badge = bellBtn.querySelector(".notification-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "notification-badge";
        bellBtn.appendChild(badge);
      }
      badge.textContent = unreadCount;
    } else {
      bellBtn.classList.remove("has-unread");
      const badge = bellBtn.querySelector(".notification-badge");
      if (badge) badge.remove();
    }
  }

  const listContainer = wrapper.querySelector(".notification-list");
  if (listContainer) {
    listContainer.innerHTML = notifs.length
      ? notifs.map((n) => `
        <div class="notification-item ${n.unread ? "unread" : ""}" onclick="handleNotificationClick('${n.id}')">
          <div class="notif-icon-col">${n.icon}</div>
          <div class="notif-content-col">
            <strong>${safeText(n.title)}</strong>
            <p>${safeText(n.desc)}</p>
            <small>${dateText(n.date)}</small>
          </div>
          ${n.unread ? `<span class="unread-dot"></span>` : ""}
        </div>
      `).join("")
      : `<div class="empty" style="padding:20px; font-size:13px;">Yeni bildirim bulunmuyor.</div>`;
  }

  const headerStatus = wrapper.querySelector(".notif-drawer-unread-count");
  if (headerStatus) {
    headerStatus.innerHTML = unreadCount > 0 ? `<span class="status warn" style="font-size:11px;">${unreadCount} yeni</span>` : "";
  }
}

function toggleNotificationDrawer(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const wrapper = document.querySelector(".notification-dropdown-wrapper");
  if (!wrapper) return;
  const isOpen = wrapper.classList.toggle("is-open");
  if (isOpen) {
    updateNotificationDrawerDom();
  }
  // Bildirim ziline basıldığında ses ÇIKMAZ. Ses sadece yeni bildirim gelince çıkar.
}

// Bildirim paneli dışına tıklandığında paneli kapatır (sayfayı yenilemeden)
document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".notification-dropdown-wrapper");
  if (wrapper && wrapper.classList.contains("is-open") && !wrapper.contains(e.target)) {
    wrapper.classList.remove("is-open");
  }
});

function handleNotificationClick(notifId) {
  markNotifAsRead(notifId);
  const wrapper = document.querySelector(".notification-dropdown-wrapper");
  if (wrapper) wrapper.classList.remove("is-open");
  updateNotificationDrawerDom();
  openNotificationDetail(notifId);
}

function markAllNotificationsRead(event) {
  if (event) event.stopPropagation();
  const notifs = userNotifications();
  const ids = getReadNotifIds();
  notifs.forEach((n) => {
    if (!ids.includes(n.id)) ids.push(n.id);
  });
  try {
    localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
  if (state.sessionUser?.role === "resident") {
    markAnnouncementsRead();
  }
  updateNotificationDrawerDom();
}

function openNotificationDetail(notifId) {
  const notifs = userNotifications();
  const found = notifs.find((n) => n.id === notifId);
  if (found) {
    state.selectedNotificationDetail = found;
    render();
  }
}

function closeNotificationDetail() {
  state.selectedNotificationDetail = null;
  render();
}

function notificationDetailModal() {
  const notif = state.selectedNotificationDetail;
  if (!notif) return "";
  let actionBtn = "";
  if (notif.type === "due") {
    actionBtn = `<button type="button" class="btn primary" onclick="closeNotificationDetail(); openPaymentModal('${notif.targetId || ''}')">💳 Hemen Öde (Kredi Kartı)</button>`;
  } else if (notif.type === "survey") {
    actionBtn = `<button type="button" class="btn primary" onclick="closeNotificationDetail(); setState({ view: 'resident-surveys' })">🗳️ Ankete Git ve Oy Ver</button>`;
  } else if (notif.type === "request") {
    actionBtn = `<button type="button" class="btn primary" onclick="closeNotificationDetail(); setState({ view: state.sessionUser?.role === 'admin' ? 'requests' : 'resident-home', selectedRequestId: '${notif.targetId || ''}' })">🛠️ Talebi İncele</button>`;
  } else if (notif.type === "announcement") {
    actionBtn = `<button type="button" class="btn primary" onclick="closeNotificationDetail(); setState({ view: state.sessionUser?.role === 'admin' ? 'announcements' : 'resident-announcements' })">📢 Duyuruya Git</button>`;
  }

  return `
    <div class="modal-backdrop" onclick="closeNotificationDetail()">
      <div class="notif-detail-card" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeNotificationDetail()" aria-label="Kapat">×</button>
        <div class="notif-detail-head">
          <div class="notif-detail-icon">${notif.icon}</div>
          <div>
            <span class="status info" style="font-size:11px; text-transform:uppercase;">${notif.type === "due" ? "Aidat & Finans" : notif.type === "survey" ? "Karar Anketi" : notif.type === "request" ? "Talep Bildirimi" : "Resmi Duyuru"}</span>
            <h3 style="margin:4px 0 0; font-size:17px; color:var(--text);">${safeText(notif.title)}</h3>
            <small style="color:var(--muted);">${dateText(notif.date)}</small>
          </div>
        </div>
        <div class="notif-detail-body">
          <p style="margin:0; font-size:14px; line-height:1.6; white-space:pre-wrap;">${safeText(notif.fullText || notif.desc)}</p>
        </div>
        <div class="notif-detail-actions">
          <button type="button" class="btn text-btn" onclick="closeNotificationDetail()">Kapat</button>
          ${actionBtn}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   ÖDEME GEÇİDİ (DEMO CREDIT CARD PAYMENT & 3D SECURE & DEKONT)
   ========================================================================== */
function openPaymentModal(dueId) {
  const apt = residentApartment();
  const targetDue = scoped.dues.find((d) => d.id === dueId) || scoped.dues.find((d) => d.status !== "paid" && d.apartmentId === apt?.id);
  if (!targetDue) {
    alert("Ödenecek aidat kaydı bulunamadı.");
    return;
  }
  state.activePaymentDueId = targetDue.id;
  state.paymentStep = "form";
  state.paymentReceiptData = null;
  render();
}

function closePaymentModal() {
  state.activePaymentDueId = null;
  state.paymentStep = "form";
  state.paymentReceiptData = null;
  state.tempPaymentPayload = null;
  render();
}

function handleCardNumberInput(input) {
  let val = input.value.replace(/\D/g, "").slice(0, 16);
  let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
  input.value = formatted;
  const displayEl = document.getElementById("virtual-card-number");
  if (displayEl) {
    displayEl.textContent = formatted || "•••• •••• •••• ••••";
  }
}

function handleCardHolderInput(input) {
  const displayEl = document.getElementById("virtual-card-holder");
  if (displayEl) {
    displayEl.textContent = (input.value || "AD SOYAD").toUpperCase();
  }
}

function handleCardExpiryInput(input) {
  let val = input.value.replace(/\D/g, "").slice(0, 4);
  if (val.length >= 3) {
    val = val.slice(0, 2) + "/" + val.slice(2);
  }
  input.value = val;
  const displayEl = document.getElementById("virtual-card-expiry");
  if (displayEl) {
    displayEl.textContent = val || "AA/YY";
  }
}

async function submitPaymentForm(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const cardHolder = (form.get("cardHolder") || state.sessionUser?.name || "Kart Sahibi").trim();
  const cardNumber = (form.get("cardNumber") || "").replace(/\s/g, "");
  const expiry = form.get("expiry") || "";
  const cvv = form.get("cvv") || "";
  const installment = parseInt(form.get("installment") || "1", 10);
  const is3d = Boolean(form.get("is3d"));

  if (cardNumber.length < 15) {
    alert("Lütfen 16 haneli geçerli kart numarasını giriniz.");
    return;
  }

  state.tempPaymentPayload = {
    dueId: state.activePaymentDueId,
    cardLast4: cardNumber.slice(-4),
    cardHolder,
    installment,
    referenceCode: "PAY-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
  };

  if (is3d) {
    state.paymentStep = "3d_otp";
    render();
  } else {
    await executeDuePayment(state.tempPaymentPayload);
  }
}

async function verify3dOtp(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const code = (form.get("otpCode") || "").trim();
  if (code.length < 4) {
    alert("Lütfen telefonunuza gelen 6 haneli doğrulama kodunu giriniz (Demo: 123456).");
    return;
  }
  if (!state.tempPaymentPayload) {
    alert("Ödeme oturumu zaman aşımına uğradı.");
    closePaymentModal();
    return;
  }
  await executeDuePayment(state.tempPaymentPayload);
}

async function executeDuePayment(payload) {
  const due = scoped.dues.find((d) => d.id === payload.dueId);
  const apt = residentApartment();
  const resident = currentResident();

  if (API_BASE) {
    try {
      const res = await apiRequest(`/dues/${payload.dueId}/pay`, {
        method: "POST",
        body: JSON.stringify({
          method: "credit_card",
          cardLast4: payload.cardLast4,
          cardHolder: payload.cardHolder,
          installment: payload.installment,
          referenceCode: payload.referenceCode,
        }),
      });
      state.paymentReceiptData = res.receipt || {
        referenceCode: payload.referenceCode,
        amount: due?.amount || 0,
        paidAt: new Date().toISOString(),
        cardLast4: payload.cardLast4,
        cardHolder: payload.cardHolder,
        apartmentNo: apt?.no || "-",
        residentName: resident?.name || state.sessionUser?.name || "Sakin",
        period: due?.period || "-",
        authCode: "AUTH-" + Math.floor(100000 + Math.random() * 900000),
      };
      playNotificationSound();
      applyServerData(res.data, { paymentStep: "success_receipt" });
    } catch (err) {
      alert("Ödeme işlemi tamamlanamadı: " + err.message);
    }
  } else {
    // Offline / Local state simulation
    if (due) due.status = "paid";
    state.paymentReceiptData = {
      referenceCode: payload.referenceCode,
      amount: due?.amount || 0,
      paidAt: new Date().toISOString(),
      cardLast4: payload.cardLast4,
      cardHolder: payload.cardHolder,
      apartmentNo: apt?.no || "-",
      residentName: resident?.name || state.sessionUser?.name || "Sakin",
      period: due?.period || "-",
      authCode: "AUTH-" + Math.floor(100000 + Math.random() * 900000),
    };
    playNotificationSound();
    state.paymentStep = "success_receipt";
    render();
  }
}

function showReceiptModal(dueId) {
  const due = scoped.dues.find((d) => d.id === dueId);
  const apt = residentApartment();
  const resident = currentResident();
  state.activePaymentDueId = dueId;
  state.paymentStep = "success_receipt";
  state.paymentReceiptData = {
    referenceCode: "REC-" + dueId.slice(-6).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
    amount: due?.amount || 0,
    paidAt: due?.paidAt || new Date().toISOString(),
    cardLast4: "9010",
    cardHolder: resident?.name || state.sessionUser?.name || "Kart Sahibi",
    apartmentNo: apt?.no || "-",
    residentName: resident?.name || state.sessionUser?.name || "Sakin",
    period: due?.period || "-",
    authCode: "AUTH-892411",
  };
  render();
}

function paymentGatewayModal() {
  if (!state.activePaymentDueId) return "";
  const due = scoped.dues.find((d) => d.id === state.activePaymentDueId);
  if (!due && state.paymentStep !== "success_receipt") return "";
  const step = state.paymentStep || "form";
  const resident = currentResident();
  const apt = residentApartment();
  const amount = Number(due?.amount || state.paymentReceiptData?.amount || 0);

  return `
    <div class="modal-backdrop" onclick="closePaymentModal()">
      <div class="payment-modal-card" onclick="event.stopPropagation()">
        <div class="payment-modal-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:22px;">🔒</span>
            <div>
              <strong style="font-size:16px;">ApartAI Güvenli Ödeme Geçidi</strong>
              <div style="font-size:11px; opacity:0.85;">256-Bit SSL Şifreli • PCI-DSS Seviye 1 Uyumlu</div>
            </div>
          </div>
          <button class="modal-close" style="color:#ffffff;" onclick="closePaymentModal()" aria-label="Kapat">×</button>
        </div>

        <div class="payment-modal-body">
          ${step === "form" ? `
            <!-- Sanal Kart Önizlemesi -->
            <div class="virtual-card-wrapper">
              <div class="virtual-card">
                <div class="card-chip-row">
                  <div class="card-emv-chip"></div>
                  <div class="card-brand-logo">ApartPay</div>
                </div>
                <div id="virtual-card-number" class="card-number-display">5400 1234 5678 9010</div>
                <div class="card-meta-row">
                  <div>
                    <span>Kart Sahibi</span>
                    <div id="virtual-card-holder" class="card-holder-name">${safeText((resident?.name || state.sessionUser?.name || "Ayşe Demir").toUpperCase())}</div>
                  </div>
                  <div>
                    <span>Son Kullanma</span>
                    <div id="virtual-card-expiry" class="card-expiry-val">08/28</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bilgilendirme -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${due.period} Dönemi Aidat Borcu</strong>
                <div style="font-size:12px; color:var(--muted);">${apartmentLabel(due.apartmentId)} • Son Ödeme: ${dateText(due.dueDate)}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:12px; color:var(--muted);">Ödenecek Tutar</span>
                <div style="font-size:20px; font-weight:800; color:var(--accent);">${money(amount)}</div>
              </div>
            </div>

            <!-- Kart Formu -->
            <form class="grid" onsubmit="submitPaymentForm(event)">
              <label>
                <span>Kart Üzerindeki İsim</span>
                <input name="cardHolder" required value="${safeText(resident?.name || state.sessionUser?.name || "Ayşe Demir")}" oninput="handleCardHolderInput(this)" placeholder="Ad Soyad" />
              </label>

              <label>
                <span>Kart Numarası</span>
                <input name="cardNumber" required value="5400 1234 5678 9010" maxlength="19" oninput="handleCardNumberInput(this)" placeholder="•••• •••• •••• ••••" style="font-family:monospace; font-size:15px; letter-spacing:1px;" />
              </label>

              <div class="form-row-2">
                <label>
                  <span>Son Kullanma (AA/YY)</span>
                  <input name="expiry" required value="08/28" maxlength="5" oninput="handleCardExpiryInput(this)" placeholder="MM/YY" style="font-family:monospace;" />
                </label>
                <label>
                  <span>CVV / Güvenlik Kodu</span>
                  <input name="cvv" type="password" required value="884" maxlength="4" placeholder="•••" style="font-family:monospace;" />
                </label>
              </div>

              <div>
                <span style="font-size:12.5px; font-weight:600; color:var(--text);">Taksit Seçenekleri:</span>
                <div class="installment-grid">
                  <label class="installment-opt">
                    <input type="radio" name="installment" value="1" checked />
                    <strong>Tek Çekim</strong>
                    <span>${money(amount)}</span>
                    <small style="color:var(--accent);">Vade farksız</small>
                  </label>
                  <label class="installment-opt">
                    <input type="radio" name="installment" value="3" />
                    <strong>3 Taksit</strong>
                    <span>${money(Math.round(amount / 3))} x 3</span>
                    <small style="color:var(--muted);">Toplam: ${money(amount)}</small>
                  </label>
                  <label class="installment-opt">
                    <input type="radio" name="installment" value="6" />
                    <strong>6 Taksit</strong>
                    <span>${money(Math.round(amount / 6))} x 6</span>
                    <small style="color:var(--muted);">Toplam: ${money(amount)}</small>
                  </label>
                </div>
              </div>

              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:500; margin-bottom:10px;">
                <input type="checkbox" name="is3d" checked style="width:16px; height:16px;" />
                <span>3D Secure ile Güvenli Doğrulama Yap (SMS Kodu İle)</span>
              </label>

              <div style="display:flex; gap:10px; margin-top:8px;">
                <button type="button" class="btn text-btn" onclick="closePaymentModal()" style="flex:1;">İptal</button>
                <button type="submit" class="btn primary" style="flex:2; padding:12px; font-size:15px; font-weight:700;">
                  🔒 ${money(amount)} Güvenli Öde
                </button>
              </div>
            </form>
          ` : step === "3d_otp" ? `
            <!-- 3D Secure SMS Ekranı -->
            <div class="secure-otp-box">
              <div class="bank-badge">🏛️ Türkiye Finans / Banka 3D Secure Doğrulama</div>
              <h3 style="margin:0 0 6px; font-size:18px;">Tek Kullanımlık Şifre Doğrulama</h3>
              <p style="font-size:13px; color:var(--muted); margin:0 0 16px;">
                <strong>${safeText(state.tempPaymentPayload?.cardHolder || "Ayşe Demir")}</strong> adına kayıtlı <strong>05** *** 22 33</strong> numaralı cep telefonunuza 6 haneli güvenlik kodu gönderilmiştir.
              </p>

              <div style="background:#e0f2fe; border:1px solid #bae6fd; border-radius:8px; padding:8px 12px; font-size:12px; color:#0369a1; margin-bottom:14px;">
                💡 <strong>Demo Test İpucu:</strong> Test için kutuya <strong>123456</strong> veya dilediğiniz 6 haneyi giriniz.
              </div>

              <form onsubmit="verify3dOtp(event)">
                <div style="display:flex; justify-content:center; margin:16px 0;">
                  <input name="otpCode" value="123456" maxlength="6" autofocus required class="otp-digit" style="width:180px; letter-spacing:8px; font-size:26px;" />
                </div>
                <div style="font-size:12px; color:var(--muted); margin-bottom:18px;">
                  ⏳ Kalan Süre: <strong>02:45</strong> • İşlem Tutarı: <strong>${money(amount)}</strong>
                </div>
                <div style="display:flex; gap:10px;">
                  <button type="button" class="btn text-btn" onclick="state.paymentStep = 'form'; render();" style="flex:1;">Geri</button>
                  <button type="submit" class="btn primary" style="flex:2; padding:12px; font-weight:700;">
                    ✓ Onayla ve Ödemeyi Bitir
                  </button>
                </div>
              </form>
            </div>
          ` : `
            <!-- Başarılı Ödeme ve Resmi Dekont Görünümü -->
            <div class="receipt-paper">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                <div>
                  <div class="receipt-stamp">✓ ÖDENDİ / TAHSİL EDİLDİ</div>
                  <h3 style="margin:4px 0 2px; font-size:20px;">Resmi Tahsilat Dekontu</h3>
                  <small style="color:var(--muted);">ApartAI Akıllı Tahsilat ve Kasa Altyapısı</small>
                </div>
                <div style="text-align:right;">
                  <code style="font-size:13px; font-weight:800; background:#f1f5f9; padding:4px 8px; border-radius:6px;">${state.paymentReceiptData?.referenceCode || "PAY-2026-X892"}</code>
                  <div style="font-size:11px; color:var(--muted); margin-top:4px;">${new Date().toLocaleString("tr-TR")}</div>
                </div>
              </div>

              <div class="receipt-line">
                <span>Ödeme Yapan:</span>
                <strong>${safeText(state.paymentReceiptData?.residentName || resident?.name || state.sessionUser?.name || "Ayşe Demir")}</strong>
              </div>
              <div class="receipt-line">
                <span>Site & Daire:</span>
                <strong>${safeText(activeSite()?.name || "Çınar Apartmanı")} — Daire No: ${safeText(state.paymentReceiptData?.apartmentNo || apt?.no || "1")}</strong>
              </div>
              <div class="receipt-line">
                <span>Dönem / Açıklama:</span>
                <strong>${safeText(state.paymentReceiptData?.period || due?.period || "Eylül 2026")} Aidat Tahakkuku</strong>
              </div>
              <div class="receipt-line">
                <span>Ödeme Yöntemi:</span>
                <strong>Kredi Kartı (**** ${state.paymentReceiptData?.cardLast4 || "9010"})</strong>
              </div>
              <div class="receipt-line">
                <span>Banka Onay Kodu:</span>
                <code>${state.paymentReceiptData?.authCode || "AUTH-892411"}</code>
              </div>
              <div class="receipt-line total">
                <span>Tahsil Edilen Toplam:</span>
                <span style="color:var(--accent);">${money(state.paymentReceiptData?.amount || amount)}</span>
              </div>

              <div style="display:flex; justify-content:space-between; margin-top:24px; gap:10px;">
                <button type="button" class="btn" onclick="window.print()" style="display:flex; align-items:center; gap:6px;">
                  🖨️ Dekontu Yazdır / PDF
                </button>
                <button type="button" class="btn primary" onclick="closePaymentModal()">
                  ✓ Tamamla ve Kapat
                </button>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function sessionActions() {
  const user = state.sessionUser;
  if (!user) return "";
  const notifs = userNotifications();
  const unreadCount = notifs.filter((n) => n.unread).length;

  const switcher =
    user.role === "admin"
      ? `<div class="mode-switch" aria-label="Ekran tipi">
          <button class="${state.mode === "manager" ? "active" : ""}" onclick="setState({ mode: 'manager', view: 'dashboard' })">Yönetici</button>
          <button class="${state.mode === "resident" ? "active" : ""}" onclick="setState({ mode: 'resident', view: 'resident-home', selectedResidentId: '${scoped.residents[0]?.id ?? ""}' })">Sakin</button>
        </div>`
      : `<span class="status info">Sakin Hesabı</span>`;

  return `
    <div class="session-bar">
      ${switcher}

      <!-- Bildirim Kutusu & Zili (Flicker-Free, No sound on click) -->
      <div class="notification-dropdown-wrapper">
        <button type="button" class="notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}" onclick="toggleNotificationDrawer(event)" aria-label="Bildirim Kutusu" title="Bildirimler">
          <span class="bell-icon">🔔</span>
          ${unreadCount > 0 ? `<span class="notification-badge">${unreadCount}</span>` : ""}
        </button>

        <div class="notification-drawer" onclick="event.stopPropagation()">
          <div class="notification-drawer-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <strong>🔔 Bildirimler & Mesajlar</strong>
              <span class="notif-drawer-unread-count">
                ${unreadCount > 0 ? `<span class="status warn" style="font-size:11px;">${unreadCount} yeni</span>` : ""}
              </span>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn text-btn" style="font-size:11.5px; padding:2px 6px;" onclick="markAllNotificationsRead(event)" title="Tümünü okundu say">Tümünü Oku</button>
              <button type="button" class="btn text-btn" style="font-size:14px; padding:2px 6px;" onclick="document.querySelector('.notification-dropdown-wrapper')?.classList.remove('is-open')" title="Kapat">×</button>
            </div>
          </div>
          <div class="notification-list">
            ${
              notifs.length
                ? notifs.map((n) => `
                  <div class="notification-item ${n.unread ? "unread" : ""}" onclick="handleNotificationClick('${n.id}')">
                    <div class="notif-icon-col">${n.icon}</div>
                    <div class="notif-content-col">
                      <strong>${safeText(n.title)}</strong>
                      <p>${safeText(n.desc)}</p>
                      <small>${dateText(n.date)}</small>
                    </div>
                    ${n.unread ? `<span class="unread-dot"></span>` : ""}
                  </div>
                `).join("")
                : `<div class="empty" style="padding:20px; font-size:13px;">Yeni bildirim bulunmuyor.</div>`
            }
          </div>
          <div class="notification-drawer-footer">
            <button type="button" class="btn text-btn" onclick="playNotificationSound()" style="font-size:11.5px;">🔊 Bildirim Sesi Dinle</button>
            <button type="button" class="btn text-btn" onclick="setState({ view: 'profile' }); document.querySelector('.notification-dropdown-wrapper')?.classList.remove('is-open');" style="font-size:11.5px;">Profil & Ayarlar →</button>
          </div>
        </div>
      </div>

      <!-- Kullanıcı Çipi & Profil Linki -->
      <div class="user-chip clickable ${state.view === "profile" ? "active" : ""}" onclick="setState({ view: 'profile' })" title="Profil & Daire Bilgilerini Düzenle">
        <div class="user-avatar-circle">
          ${user.avatar
            ? `<img src="${escapeAttr(user.avatar)}" class="user-chip-avatar-img" alt="${safeText(user.name)}" />`
            : `<span>${(user.name || "U").slice(0, 2).toUpperCase()}</span>`
          }
        </div>
        <div class="user-chip-text">
          <strong>${safeText(user.name)}</strong>
          <span>${safeText(user.email)}</span>
        </div>
        <span class="user-chip-arrow">⚙️</span>
      </div>

      <button class="btn logout-btn" onclick="logoutUser()" title="Oturumu Kapat">Çıkış</button>
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
    ["finances", "Kasa & Giderler"],
    ["requests", "Talepler"],
    ["announcements", "Duyurular"],
    ["surveys", "Anketler"],
    ["setup", "Site Kurulumu"],
    ["ai-assistant", "✨ AI Asistan"],
    ["reports", "Rapor"],
    ["sites", "Tüm Siteler"],
    ["profile", "Profilim"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}', mobileNavOpen: false })">${label}</button>`).join("")}</nav>`;
}

function residentNav() {
  const items = [
    ["resident-home", "Özet"],
    ["resident-request", "Talep Aç"],
    ["ai-assistant", "✨ AI Asistan"],
    ["resident-announcements", "Duyurular"],
    ["resident-surveys", "Anketler"],
    ["profile", "Profilim"],
  ];
  return `<nav class="nav">${items.map(([view, label]) => `<button class="${state.view === view ? "active" : ""}" onclick="setState({ view: '${view}', mobileNavOpen: false })">${label}</button>`).join("")}</nav>`;
}

function pageTitle() {
  const titles = {
    dashboard: "Yönetici Paneli",
    dues: "Aidat Takibi",
    finances: "Apartman Kasası & Gider Yönetimi",
    requests: "Arıza, Şikayet ve Öneri Talepleri",
    announcements: "Duyurular",
    surveys: "Site Anketleri ve Kararlar",
    setup: "Site Kurulumu",
    "ai-assistant": "ApartAI Akıllı Asistan",
    reports: "Aylık Rapor & Faaliyet Özeti",
    sites: "Tüm Siteler",
    profile: "Profil & Daire Ayarları",
    "resident-home": "Sakin Ekranı",
    "resident-request": "Talep, Şikayet & Öneri Bildir",
    "resident-announcements": "Duyurular",
    "resident-surveys": "Site Anketleri",
  };
  return titles[state.view] ?? "ApartAI";
}

function pageDescription() {
  const descriptions = {
    dashboard: "Site sağlığı, ödeme durumu, açık talepler ve AI aksiyonları.",
    dues: "Dönem bazlı borç oluşturma, tahsilat tahmini ve risk analizi.",
    finances: "Kasa bakiyesi, faturalar, harcama kalemleri ve kategori bazlı gider dağılımı.",
    requests: "Sakin taleplerini sınıflandır, önceliklendir ve çözüm süresini izle.",
    announcements: "Duyuru yayınla ve AI ile metni sakin bir tona getir.",
    surveys: "Site geneli oylama ve anketler ile şeffaf karar alma süreci.",
    setup: "Blok, daire, mülkiyet ve araç plaka kayıtlarını yönet.",
    "ai-assistant": "Arıza, şikayet veya önerinizi yapay zeka ile analiz edip otomatik onaylayarak yönetime iletin.",
    reports: "Aylık faaliyet bülteni yazdır, tedarikçi karnesi ve analizleri incele.",
    sites: "Yönettiğin tüm siteleri karşılaştır ve yeni site ekle.",
    profile: "Kişisel bilgiler, daire statüsü, araç plaka ve hesap güvenlik ayarları.",
    "resident-home": "Borcunu, ödeme geçmişini ve açık taleplerini gör.",
    "resident-request": "Arıza, şikayet veya önerinizi kategori seçerek yönetime iletin.",
    "resident-announcements": "Yönetim duyurularını takip et.",
    "resident-surveys": "Site kararlarına oy vererek görüşünü bildir veya oyunu düzenle.",
  };
  return descriptions[state.view] ?? "";
}

function managerView() {
  const views = {
    dashboard: dashboardView,
    dues: duesView,
    finances: managerFinancesView,
    requests: requestsView,
    announcements: announcementsView,
    surveys: surveysView,
    setup: setupView,
    "ai-assistant": aiAssistantPageView,
    reports: reportsView,
    sites: sitesView,
    profile: profileView,
  };
  return (views[state.view] || dashboardView)();
}

function residentView() {
  return ({
    "resident-home": residentHomeView,
    "resident-request": residentRequestView,
    "ai-assistant": aiAssistantPageView,
    "resident-announcements": residentAnnouncementsView,
    "resident-surveys": residentSurveysView,
    profile: profileView,
  }[state.view] || residentHomeView)();
}

function dashboardView() {
  const health = calculateHealthScore();
  const dues = dueSummary();
  const openRequests = scoped.requests.filter((request) => !["cozuldu", "reddedildi"].includes(request.status));
  const avgResolution = openRequests.length ? "Açık takip" : "2.5 gün";
  const expenses = scoped.expenses || [];
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const vaultBalance = dues.paid - totalExpense;
  const activeSurveys = (scoped.surveys || []).filter((s) => s.status === "active");

  return `
    <div class="grid dashboard-grid">
      <!-- 1. Sağlık Skoru Kartı -->
      <section class="section interactive-dash-card card-health" onclick="setState({ view: 'reports' })" title="Detaylı Sağlık Raporuna Git">
        <div class="section-header">
          <div>
            <h2 style="font-size:16px;">🏆 Site Sağlık Skoru</h2>
            <p>Operasyonel durum özeti</p>
          </div>
          <span class="score-status ${health.score >= 80 ? "ok" : "warn"}">${health.status}</span>
        </div>
        <div class="score">
          <div class="score-ring" style="--score: ${health.score}">
            <strong>${health.score}</strong>
          </div>
          <div>
            <ul class="plain-list" style="margin:0; padding:0;">
              ${health.reasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("")}
            </ul>
          </div>
        </div>
        <div class="card-action-hint">Rapor & Bülten Detayı →</div>
      </section>

      <!-- 2. Aidat Tahsilat Kartı -->
      <section class="section metric interactive-dash-card card-metric-dues" onclick="setState({ view: 'dues' })" title="Aidatlar Ekranına Git">
        <div class="metric-top-row">
          <span class="metric-icon-badge">💳</span>
          <span class="metric-label">Tahsilat Oranı</span>
        </div>
        <strong class="metric-number text-accent">%${dues.collectionRate}</strong>
        <div class="progress-bar-thin">
          <div class="progress-fill-thin" style="width: ${dues.collectionRate}%;"></div>
        </div>
        <small class="metric-sub">${money(dues.paid)} tahsil edildi (${dues.paidCount}/${scoped.dues.length})</small>
        <div class="card-action-hint">Aidat Takibine Git →</div>
      </section>

      <!-- 3. Kasa & Bakiye Kartı -->
      <section class="section metric interactive-dash-card card-metric-vault" onclick="setState({ view: 'finances' })" title="Kasa ve Giderler Ekranına Git">
        <div class="metric-top-row">
          <span class="metric-icon-badge">💰</span>
          <span class="metric-label">Kasa Bakiyesi</span>
        </div>
        <strong class="metric-number ${vaultBalance >= 0 ? "text-emerald" : "text-danger"}">${money(vaultBalance)}</strong>
        <div class="progress-bar-thin">
          <div class="progress-fill-thin" style="width: ${Math.min(100, Math.max(10, Math.round((dues.paid / Math.max(totalExpense, 1)) * 100)))}%; background:${vaultBalance >= 0 ? "var(--ok)" : "var(--danger)"};"></div>
        </div>
        <small class="metric-sub">Toplam Gider: ${money(totalExpense)} (${expenses.length} fatura)</small>
        <div class="card-action-hint">Kasa & Gider Yönetimi →</div>
      </section>

      <!-- 4. Açık Talepler Kartı -->
      <section class="section metric interactive-dash-card card-metric-reqs" onclick="setState({ view: 'requests' })" title="Talepler Ekranına Git">
        <div class="metric-top-row">
          <span class="metric-icon-badge">🛠️</span>
          <span class="metric-label">Açık Talepler</span>
        </div>
        <strong class="metric-number ${openRequests.length > 0 ? "text-warning" : "text-ok"}">${openRequests.length}</strong>
        <div class="progress-bar-thin">
          <div class="progress-fill-thin" style="width: ${Math.round(((scoped.requests.length - openRequests.length) / Math.max(scoped.requests.length, 1)) * 100)}%; background:var(--accent);"></div>
        </div>
        <small class="metric-sub">Ortalama Çözüm: ${avgResolution}</small>
        <div class="card-action-hint">Talepleri İncele & Ata →</div>
      </section>
    </div>

    <!-- Alt İkili Kolon -->
    <div class="split" style="margin-top:20px;">
      <!-- AI Aksiyon Önerileri Kartı -->
      <section class="section modern-card">
        <div class="section-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">⚡</span>
            <div>
              <h3 style="margin:0;">AI Akıllı Aksiyon Önerileri</h3>
              <p style="margin:2px 0 0; font-size:12.5px; color:var(--muted);">Sitenizin öncelikli operasyonel adımları.</p>
            </div>
          </div>
          <span class="badge-ai-smart">AI Analiz</span>
        </div>
        <ul class="actions-list" style="margin-top:10px;">
          ${health.actions.map((action) => `
            <li class="action-item-modern">
              <span class="action-bullet">✦</span>
              <div class="action-text">${action}</div>
            </li>
          `).join("")}
        </ul>
      </section>

      <!-- Son Duyurular & Anketler -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        <section class="section modern-card interactive-dash-card" onclick="setState({ view: 'announcements' })" title="Tüm Duyuruları Yönet">
          <div class="section-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">📢</span>
              <h3 style="margin:0; font-size:15px;">Yayınlanan Son Duyurular</h3>
            </div>
            <span class="card-action-hint" style="margin:0;">Duyurulara Git →</span>
          </div>
          <div class="dash-mini-announcements">
            ${
              scoped.announcements.length
                ? scoped.announcements.slice(-2).reverse().map((item) => `
                  <div class="dash-mini-ann-item">
                    <strong>${safeText(item.title)}</strong>
                    <p>${safeText(item.aiContent || item.content)}</p>
                    <small>${dateText(item.date)}</small>
                  </div>
                `).join("")
                : `<div class="empty">Yayınlanmış duyuru yok.</div>`
            }
          </div>
        </section>

        <section class="section modern-card interactive-dash-card" onclick="setState({ view: 'surveys' })" title="Site Anketlerini Yönet">
          <div class="section-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">🗳️</span>
              <h3 style="margin:0; font-size:15px;">Site Karar Oylamaları</h3>
            </div>
            <span class="card-action-hint" style="margin:0;">Anketlere Git →</span>
          </div>
          <div style="font-size:13px; color:var(--text-sub);">
            ${
              activeSurveys.length > 0
                ? `<p style="margin:0;">Şu anda yayında <strong>${activeSurveys.length} adet</strong> aktif karar anketi bulunuyor.</p>
                   <small style="color:var(--muted);">${activeSurveys[0].title}</small>`
                : `<p style="margin:0; color:var(--muted);">Aktif anket bulunmuyor. Yeni bir istişare oylaması başlatabilirsiniz.</p>`
            }
          </div>
        </section>
      </div>
    </div>
  `;
}

function duesView() {
  const allDues = scoped.dues || [];
  const siteBlocks = scoped.blocks || [];
  const siteApartments = scoped.apartments || [];
  const allPeriods = [...new Set(allDues.map((d) => d.period))].filter(Boolean).sort().reverse();

  // Filtreleme mantığı
  let filteredDues = allDues.slice();

  if (state.duesBlockFilter && state.duesBlockFilter !== "all") {
    const aptIdsInBlock = new Set(siteApartments.filter((a) => a.blockId === state.duesBlockFilter).map((a) => a.id));
    filteredDues = filteredDues.filter((d) => aptIdsInBlock.has(d.apartmentId));
  }

  if (state.duesSelectedAptId && state.duesSelectedAptId !== "all") {
    filteredDues = filteredDues.filter((d) => d.apartmentId === state.duesSelectedAptId);
  }

  if (state.duesPeriodFilter && state.duesPeriodFilter !== "all") {
    filteredDues = filteredDues.filter((d) => d.period === state.duesPeriodFilter);
  }

  if (state.duesStatusFilter && state.duesStatusFilter !== "all") {
    filteredDues = filteredDues.filter((d) => d.status === state.duesStatusFilter);
  }

  const hasActiveFilter = (state.duesBlockFilter && state.duesBlockFilter !== "all") || (state.duesSelectedAptId && state.duesSelectedAptId !== "all") || (state.duesPeriodFilter && state.duesPeriodFilter !== "all") || (state.duesStatusFilter && state.duesStatusFilter !== "all");

  const summary = dueSummary(filteredDues);
  const forecast = collectionForecast();

  // Seçilen daire bilgisi (tek merkezden inceleme)
  const selectedApartment = state.duesSelectedAptId !== "all"
    ? siteApartments.find((a) => a.id === state.duesSelectedAptId)
    : null;
  const selectedResident = selectedApartment ? residentForApartment(selectedApartment.id) : null;
  const selectedBlock = selectedApartment ? siteBlocks.find((b) => b.id === selectedApartment.blockId) : null;
  const aptHistoryDues = selectedApartment
    ? allDues.filter((d) => d.apartmentId === selectedApartment.id).sort((a, b) => (b.period || "").localeCompare(a.period || ""))
    : [];
  const aptUnpaidDues = aptHistoryDues.filter((d) => d.status !== "paid");
  const aptTotalDebt = aptUnpaidDues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const aptTotalPaid = aptHistoryDues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const activeWarningDue = state.warningModalDueId ? allDues.find((d) => d.id === state.warningModalDueId) : null;

  return `
    <!-- 1. Üst KPI Özet Kartları -->
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>📊 Tahsilat Oranı</span>
        <strong>%${summary.collectionRate}</strong>
        <small>${summary.paidCount}/${filteredDues.length} aidat tahsil edildi</small>
      </section>
      <section class="section metric">
        <span>💰 Tahsil Edilen Tutar</span>
        <strong style="color:var(--ok);">${money(summary.paid)}</strong>
        <small>${hasActiveFilter ? `Filtrelenen Toplam: ${money(summary.total)}` : `Toplam: ${money(summary.total)}`}</small>
      </section>
      <section class="section metric">
        <span>⚠️ Kalan / Geciken Borç</span>
        <strong style="color:var(--danger);">${money(summary.pending)}</strong>
        <small>${filteredDues.filter((d) => d.status !== "paid").length} adet ödenmemiş aidat</small>
      </section>
      <section class="section metric">
        <span>🎯 Filtre Kapsamı</span>
        <strong style="color:var(--accent);">${filteredDues.length} / ${allDues.length} Kayıt</strong>
        <small>${hasActiveFilter ? "Kriterlere göre filtrelendi" : "Tüm aidat kayıtları"}</small>
      </section>
    </div>

    <!-- 2. Merkezi Daire, Blok ve Dönem Filtreleme Barı -->
    <div class="dues-filter-panel">
      <div class="dues-filter-group">
        <span class="dues-filter-label">🏢 Blok Seç:</span>
        <select class="dues-filter-select" onchange="setState({ duesBlockFilter: this.value, duesSelectedAptId: 'all' })">
          <option value="all" ${state.duesBlockFilter === "all" ? "selected" : ""}>Tüm Bloklar (${siteBlocks.length})</option>
          ${siteBlocks.map((b) => `<option value="${b.id}" ${state.duesBlockFilter === b.id ? "selected" : ""}>${safeText(b.name)}</option>`).join("")}
        </select>
      </div>

      <div class="dues-filter-group">
        <span class="dues-filter-label">🚪 Daire Seç (Merkezi İncele):</span>
        <select class="dues-filter-select" onchange="setState({ duesSelectedAptId: this.value })">
          <option value="all" ${state.duesSelectedAptId === "all" ? "selected" : ""}>Tüm Daireler (${siteApartments.length})</option>
          ${siteApartments
            .filter((a) => state.duesBlockFilter === "all" || a.blockId === state.duesBlockFilter)
            .map((a) => {
              const res = residentForApartment(a.id);
              const blk = siteBlocks.find((b) => b.id === a.blockId);
              return `<option value="${a.id}" ${state.duesSelectedAptId === a.id ? "selected" : ""}>${blk?.name || "Blok"} No: ${a.no} (${res?.name || "Boş"})</option>`;
            }).join("")}
        </select>
      </div>

      <div class="dues-filter-group">
        <span class="dues-filter-label">📅 Dönem:</span>
        <select class="dues-filter-select" onchange="setState({ duesPeriodFilter: this.value })">
          <option value="all" ${state.duesPeriodFilter === "all" ? "selected" : ""}>Tüm Dönemler (${allPeriods.length})</option>
          ${allPeriods.map((p) => `<option value="${p}" ${state.duesPeriodFilter === p ? "selected" : ""}>${p}</option>`).join("")}
        </select>
      </div>

      <div class="dues-filter-group">
        <span class="dues-filter-label">📌 Durum:</span>
        <select class="dues-filter-select" onchange="setState({ duesStatusFilter: this.value })">
          <option value="all" ${state.duesStatusFilter === "all" ? "selected" : ""}>Tümü</option>
          <option value="overdue" ${state.duesStatusFilter === "overdue" ? "selected" : ""}>🚨 Gecikmiş</option>
          <option value="pending" ${state.duesStatusFilter === "pending" ? "selected" : ""}>⏳ Bekliyor</option>
          <option value="paid" ${state.duesStatusFilter === "paid" ? "selected" : ""}>✅ Ödendi</option>
        </select>
      </div>

      ${
        hasActiveFilter
          ? `<button class="btn" style="padding:6px 14px; font-size:12.5px; border-color:var(--line); color:var(--text-sub);" onclick="setState({ duesBlockFilter: 'all', duesSelectedAptId: 'all', duesPeriodFilter: 'all', duesStatusFilter: 'all' })" title="Tüm filtreleri temizle">
              ✕ Filtreleri Temizle
            </button>`
          : ""
      }

      <div style="margin-left:auto; display:flex; gap:8px;">
        <button class="btn" style="border-color:var(--danger); color:var(--danger); font-size:12.5px; padding:6px 14px;" onclick="sendBatchOverdueReminders()" title="Vadesi geçen tüm sakinlere uyarı bildirimi gönderir">
          📢 Geciken Dairelere Toplu Hatırlatma Gönder
        </button>
      </div>
    </div>

    <!-- 3. Daire Tek Merkezden İnceleme Kartı (İstenen Daire Seçildiğinde Gözükür) -->
    ${
      selectedApartment
        ? `
        <div class="apartment-central-card">
          <div class="apt-central-header">
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">🏠</span>
                <h2 style="margin:0; font-size:22px; color:#ffffff;">${safeText(selectedBlock?.name || "Blok")} — Daire No: ${selectedApartment.no}</h2>
                <span class="status ${aptTotalDebt > 0 ? "danger" : "ok"}" style="font-size:12px;">
                  ${aptTotalDebt > 0 ? `${aptUnpaidDues.length} Dönem Borçlu` : "Tüm Dönemler Güncel"}
                </span>
              </div>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.75); font-size:13.5px;">
                Sakin: <strong>${safeText(selectedResident?.name || "Tanımsız")}</strong> (${selectedResident?.occupancyType === "tenant" ? "Kiracı" : "Ev Sahibi"}) · 
                Telefon: <strong>${safeText(selectedResident?.phone || "-")}</strong> · 
                Plaka: <strong>${safeText(selectedResident?.plateNumber || "-")}</strong>
              </p>
            </div>
            <button class="btn" style="background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.25); color:#ffffff;" onclick="setState({ duesSelectedAptId: 'all' })">
              ✕ Tüm Dairelere Dön
            </button>
          </div>

          <div class="apt-central-stats">
            <div class="apt-stat-box">
              <span>Toplam Ödenmemiş Borç</span>
              <strong style="color:#fca5a5;">${money(aptTotalDebt)}</strong>
            </div>
            <div class="apt-stat-box">
              <span>Toplam Tahsil Edilen</span>
              <strong style="color:#6ee7b7;">${money(aptTotalPaid)}</strong>
            </div>
            <div class="apt-stat-box">
              <span>Toplam Aidat Dönemi</span>
              <strong>${aptHistoryDues.length} Ay</strong>
            </div>
            <div class="apt-stat-box">
              <span>Geciken Dönemler</span>
              <strong style="color:${aptUnpaidDues.length > 0 ? "#fca5a5" : "#6ee7b7"};">${aptUnpaidDues.length} Adet</strong>
            </div>
          </div>

          <div class="apt-central-actions">
            ${
              aptTotalDebt > 0
                ? `
                <button class="btn primary" style="background:#ef4444; border-color:#dc2626;" onclick="openWarningModalForApt('${selectedApartment.id}')">
                  🚨 Daireye Özel Uyarı / İhtar Gönder
                </button>
                <button class="btn" style="background:#25d366; border-color:#16a34a; color:#ffffff;" onclick="shareApartmentViaWhatsApp('${selectedApartment.id}')">
                  📲 WhatsApp ile Borç Uyarısı İlet
                </button>
                <button class="btn" style="background:rgba(255,255,255,0.2); border-color:rgba(255,255,255,0.3); color:#ffffff;" onclick="markAllApartmentDuesPaid('${selectedApartment.id}')">
                  ✅ Tüm Borçları Ödendi Yap
                </button>
                `
                : `
                <span style="font-size:13.5px; color:#6ee7b7; font-weight:600;">✨ Bu dairenin herhangi bir gecikmiş aidat borcu bulunmamaktadır.</span>
                `
            }
          </div>
        </div>
        `
        : ""
    }

    <!-- 4. Tahsilat Tahmini & Daire Alışkanlıkları -->
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Tahsilat Tahmini & Ödeme Alışkanlıkları</h2>
            <p>Geçmiş dönem ödeme hızlarına göre sakin davranış dağılımı.</p>
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
            <h2>Toplu Yeni Aidat Oluştur</h2>
            <p>Seçilen dönem için sitedeki tüm dairelere borç tahakkuk ettirilir.</p>
          </div>
        </div>
        <form onsubmit="createDues(event)" style="display:flex; flex-direction:column; gap:14px; margin-top:6px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:12px;">
            <label>Dönem<input name="period" type="month" value="${new Date().toISOString().slice(0, 7)}" required /></label>
            <label>Tutar (TL)<input name="amount" type="number" min="1" value="1850" required /></label>
            <label>Son Ödeme<input name="dueDate" type="date" value="${new Date().toISOString().slice(0, 8)}15" required /></label>
          </div>
          <button class="btn primary" type="submit" style="width:100%; justify-content:center; padding:10px 16px; font-weight:700;">
            ⚡ Tüm Daireler İçin Toplu Aidat Oluştur
          </button>
        </form>
      </section>
    </div>

    <!-- 5. Filtrelenmiş Daire Aidat Kayıtları Tablosu -->
    <section class="section" style="margin-top:16px">
      <div class="section-header">
        <div>
          <h2>Aidat ve Borç Dökümü (${filteredDues.length} Kayıt)</h2>
          <p>Daireye tıklayarak o dairenin tüm geçmişini tek merkezden inceleyebilirsiniz.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Daire</th>
              <th>Sakin</th>
              <th>Dönem</th>
              <th>Tutar</th>
              <th>Son Ödeme</th>
              <th>Durum</th>
              <th style="text-align:right;">İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredDues.length
                ? filteredDues.map((due) => {
                    const apt = siteApartments.find((a) => a.id === due.apartmentId);
                    const blk = siteBlocks.find((b) => b.id === apt?.blockId);
                    const res = residentForApartment(due.apartmentId);
                    return `
                      <tr style="cursor:pointer;" onclick="if (!event.target.closest('button') && !event.target.closest('a')) setState({ duesSelectedAptId: '${due.apartmentId}' })">
                        <td>
                          <strong>${blk?.name || "Blok"} No: ${apt?.no || "-"}</strong>
                          <span style="display:block; font-size:11px; color:var(--accent);">🔍 Daireyi İncele</span>
                        </td>
                        <td>
                          <strong>${res?.name || "-"}</strong><br>
                          <small style="color:var(--muted);">${res?.phone || ""}</small>
                        </td>
                        <td><strong>${due.period}</strong></td>
                        <td style="font-weight:700;">${money(due.amount)}</td>
                        <td>${dateText(due.dueDate)}</td>
                        <td><span class="status ${statusClass(due.status)}">${dueStatusText(due.status)}</span></td>
                        <td style="text-align:right;">
                          <div class="inline-actions" style="justify-content:flex-end;">
                            ${
                              due.status !== "paid"
                                ? `
                                  <button class="btn" style="padding:5px 10px; font-size:12px;" onclick="markPaid('${due.id}')">Ödendi</button>
                                  <button class="btn" style="padding:5px 10px; font-size:12px; border-color:var(--danger); color:var(--danger);" onclick="openWarningModalForDue('${due.id}')">🚨 Uyarı</button>
                                  <button class="btn" style="padding:5px 10px; font-size:12px; border-color:#22c55e; color:#15803d;" onclick="shareDueViaWhatsApp('${due.id}')" title="WhatsApp Mesajı Aç">💬</button>
                                `
                                : `<span style="font-size:12px; color:var(--ok); font-weight:600;">✓ Tahsil Edildi</span>`
                            }
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join("")
                : `
                <tr>
                  <td colspan="7" style="text-align:center; padding:36px 16px; color:var(--muted);">
                    <div style="font-size:26px; margin-bottom:8px;">🔍</div>
                    <strong style="font-size:14px; color:var(--ink-secondary);">Seçilen filtre kriterlerine uygun aidat kaydı bulunamadı.</strong>
                    <p style="margin:4px 0 14px; font-size:12.5px;">Farklı bir blok, daire, dönem veya durum seçebilirsiniz.</p>
                    <button class="btn btn-sm primary" onclick="setState({ duesBlockFilter: 'all', duesSelectedAptId: 'all', duesPeriodFilter: 'all', duesStatusFilter: 'all' })">
                      Tüm Filtreleri Sıfırla
                    </button>
                  </td>
                </tr>
                `
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- 6. Çok Kanallı Uyarı & İhtar Modalı -->
    ${activeWarningDue || state.warningModalAptId ? warningReminderModal() : ""}
  `;
}

function openWarningModalForDue(dueId) {
  const due = scoped.dues.find((d) => d.id === dueId);
  if (!due) return;
  const resident = residentForApartment(due.apartmentId);
  const draft = generateWarningText(due, resident, "friendly");
  setState({ warningModalDueId: dueId, warningModalAptId: null, warningModalTone: "friendly", warningModalDraft: draft });
}

function openWarningModalForApt(aptId) {
  const apt = scoped.apartments.find((a) => a.id === aptId);
  if (!apt) return;
  const resident = residentForApartment(aptId);
  const unpaidDues = scoped.dues.filter((d) => d.apartmentId === aptId && d.status !== "paid");
  const firstDue = unpaidDues[0] || { period: "Güncel", amount: 0, dueDate: today() };
  const draft = generateWarningText(firstDue, resident, "official", unpaidDues);
  setState({ warningModalDueId: firstDue.id, warningModalAptId: aptId, warningModalTone: "official", warningModalDraft: draft });
}

function closeWarningModal() {
  setState({ warningModalDueId: null, warningModalAptId: null, warningModalDraft: "" });
}

function generateWarningText(due, resident, tone, multiDues = null) {
  const residentName = resident?.name ? `Sayın ${resident.name}` : "Değerli Sakinimiz";
  const siteName = activeSite()?.name || "Apartman Yönetimi";
  const totalAmount = multiDues ? multiDues.reduce((s, d) => s + (Number(d.amount) || 0), 0) : due.amount;
  const periodsStr = multiDues ? multiDues.map((d) => d.period).join(", ") : due.period;

  if (tone === "friendly") {
    return `${residentName}, ${siteName} ${periodsStr} dönemi aidat ödemenizi (${money(totalAmount)}) hatırlatır, anlayışınız ve katkılarınız için teşekkür eder, iyi günler dileriz.`;
  } else if (tone === "official") {
    return `BİLGİLENDİRME: ${residentName}, adınıza tahakkuk eden ${periodsStr} dönemine ait ${money(totalAmount)} tutarındaki aidat borcunuzun son ödeme tarihi (${dateText(due.dueDate)}) geçmiştir. Apartman ortak hizmetlerinin aksamaması adına ödemenizi en kısa sürede gerçekleştirmenizi rica ederiz. ${siteName}`;
  } else {
    return `RESMİ İHTAR VE SON ÇAĞRI: ${residentName}, ${siteName} bünyesindeki bağımsız bölümünüze ait ${periodsStr} dönemi toplam ${money(totalAmount)} tutarındaki aidat borcunuz vadesi geçmiş olarak beklemektedir. Kat Mülkiyeti Kanunu Madde 20 uyarınca söz konusu borcun 3 (üç) iş günü içinde ödenmesi, aksi halde gecikme tazminatı ve yasal icra takibi sürecinin başlatılacağı önemle ihtar olunur.`;
  }
}

function selectWarningTone(tone) {
  const due = scoped.dues.find((d) => d.id === state.warningModalDueId);
  const resident = due ? residentForApartment(due.apartmentId) : null;
  const multiDues = state.warningModalAptId
    ? scoped.dues.filter((d) => d.apartmentId === state.warningModalAptId && d.status !== "paid")
    : null;
  const draft = generateWarningText(due, resident, tone, multiDues);
  setState({ warningModalTone: tone, warningModalDraft: draft });
}

function warningReminderModal() {
  const due = scoped.dues.find((d) => d.id === state.warningModalDueId);
  const apt = scoped.apartments.find((a) => a.id === (due ? due.apartmentId : state.warningModalAptId));
  const resident = residentForApartment(apt?.id);
  const tone = state.warningModalTone || "friendly";
  const draft = state.warningModalDraft || (due ? generateWarningText(due, resident, tone) : "");

  return `
    <div class="modal-backdrop" onclick="closeWarningModal()">
      <div class="request-modal" style="max-width:580px;" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeWarningModal()" aria-label="Kapat">×</button>
        <div class="section-header">
          <div>
            <h2 style="margin:0; font-size:20px;">Daireye Uyarı / Hatırlatma Gönder</h2>
            <p style="margin:4px 0 0; color:var(--muted); font-size:13px;">${apartmentLabel(apt?.id)} — ${resident?.name || "Sakin"}</p>
          </div>
        </div>

        <!-- Ton Seçici -->
        <span style="font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase;">Uyarı Tonu ve Formatı:</span>
        <div class="warning-tone-selector">
          <div class="warning-tone-btn ${tone === "friendly" ? "active" : ""}" onclick="selectWarningTone('friendly')">
            🟢 Nazik Hatırlatma
          </div>
          <div class="warning-tone-btn ${tone === "official" ? "active" : ""}" onclick="selectWarningTone('official')">
            🟡 Resmi Vade Uyarısı
          </div>
          <div class="warning-tone-btn ${tone === "legal" ? "active" : ""}" onclick="selectWarningTone('legal')">
            🔴 Hukuki İhtar & Yasal Çağrı
          </div>
        </div>

        <label style="margin-top:12px; display:block;">
          <span style="font-size:13px; font-weight:650; display:block; margin-bottom:6px;">Düzenlenebilir İhtar / Bildirim Metni:</span>
          <textarea id="warningModalDraftInput" rows="5" style="font-size:13.5px; line-height:1.5;" oninput="state.warningModalDraft = this.value">${safeText(draft)}</textarea>
        </label>

        <!-- İletim Kanalları -->
        <span style="font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; display:block; margin-top:14px;">İletim Kanalını Seçin:</span>
        <div class="warning-channels-grid">
          <div class="warning-channel-card" onclick="sendWarningViaNotification('${due?.id || ""}')" title="Sakinin ApartAI bildirim kutusuna resmi bildirim düşürür">
            <span style="font-size:18px;">🔔</span>
            <div>
              <strong>ApartAI Bildirimi</strong>
              <small style="display:block; color:var(--muted); font-size:11px;">Uygulama içi zil</small>
            </div>
          </div>
          <div class="warning-channel-card" onclick="sendWarningViaWhatsApp('${resident?.phone || ""}')" title="WhatsApp üzerinden hazır mesajı açar">
            <span style="font-size:18px;">💬</span>
            <div>
              <strong>WhatsApp</strong>
              <small style="display:block; color:var(--muted); font-size:11px;">Mesajla ilet</small>
            </div>
          </div>
          <div class="warning-channel-card" onclick="sendWarningViaSMS('${due?.id || ""}')" title="SMS iletim logunu sisteme işler">
            <span style="font-size:18px;">📱</span>
            <div>
              <strong>SMS İhtar</strong>
              <small style="display:block; color:var(--muted); font-size:11px;">Doğrudan hatta</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function sendWarningViaNotification(dueId) {
  const text = document.getElementById("warningModalDraftInput")?.value || state.warningModalDraft;
  if (!text) return;
  if (API_BASE && dueId) {
    apiRequest(`/dues/${dueId}/reminder`, { method: "POST", body: JSON.stringify({ note: text }) })
      .then((data) => {
        closeWarningModal();
        applyServerData(data);
        alert("✅ Bildirim sakinin ApartAI bildirim kutusuna başarıyla iletildi.");
      })
      .catch((err) => alert(err.message));
  } else {
    closeWarningModal();
    alert("✅ Bildirim sakinin ApartAI bildirim kutusuna başarıyla iletildi.");
  }
}

function sendWarningViaWhatsApp(phone) {
  const text = document.getElementById("warningModalDraftInput")?.value || state.warningModalDraft;
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const targetPhone = cleanPhone ? (cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone.replace(/^0/, "")}`) : "";
  const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
  closeWarningModal();
}

function sendWarningViaSMS(dueId) {
  sendWarningViaNotification(dueId);
}

function shareDueViaWhatsApp(dueId) {
  const due = scoped.dues.find((d) => d.id === dueId);
  if (!due) return;
  const resident = residentForApartment(due.apartmentId);
  const msg = generateWarningText(due, resident, "official");
  sendWarningViaWhatsApp(resident?.phone || "");
}

function shareApartmentViaWhatsApp(aptId) {
  openWarningModalForApt(aptId);
}

function markAllApartmentDuesPaid(aptId) {
  if (!confirm("Bu daireye ait tüm bekleyen aidatları 'Ödendi' olarak işaretlemek istiyor musunuz?")) return;
  const unpaid = scoped.dues.filter((d) => d.apartmentId === aptId && d.status !== "paid");
  unpaid.forEach((due) => markPaid(due.id));
}

function sendBatchOverdueReminders() {
  const overdues = scoped.dues.filter((d) => d.status === "overdue");
  if (!overdues.length) {
    alert("Harika! Sitede şu anda vadesi geçmiş aidat borcu bulunmuyor.");
    return;
  }
  if (!confirm(`Sitede vadesi geçmiş ${overdues.length} adet aidat borcu tespit edildi. Tüm bu dairelerin sakinlerine resmi hatırlatma bildirimi gönderilsin mi?`)) {
    return;
  }
  overdues.forEach((due) => {
    if (API_BASE) {
      apiRequest(`/dues/${due.id}/reminder`, { method: "POST", body: JSON.stringify({ note: "Sayın sakinimiz, vadesi geçen aidat borcunuz bulunmaktadır." }) }).catch(() => {});
    }
  });
  alert(`📢 ${overdues.length} adet geciken daire sakinine başarıyla hatırlatma bildirimi gönderildi.`);
}

const EXPENSE_CATEGORIES = {
  electricity: { label: "Ortak Alan Elektrik", icon: "⚡", color: "#eab308" },
  water: { label: "Su & Hidrofor", icon: "💧", color: "#06b6d4" },
  elevator: { label: "Asansör Bakım", icon: "🛗", color: "#3b82f6" },
  cleaning: { label: "Temizlik & Hijyen", icon: "🧹", color: "#10b981" },
  maintenance: { label: "Teknik Bakım", icon: "🔧", color: "#f97316" },
  garden: { label: "Bahçe & Peyzaj", icon: "🌿", color: "#84cc16" },
  security: { label: "Güvenlik & Kamera", icon: "🛡️", color: "#8b5cf6" },
  fixture: { label: "Demirbaş Alımı", icon: "📦", color: "#ec4899" },
  other: { label: "Diğer Giderler", icon: "📋", color: "#64748b" },
};

function expenseCategoryBadge(cat) {
  const meta = EXPENSE_CATEGORIES[cat] || { label: cat || "Gider", icon: "📋", color: "#64748b" };
  return `<span class="expense-badge" style="--badge-color: ${meta.color};">${meta.icon} ${safeText(meta.label)}</span>`;
}

function managerFinancesView() {
  const allDues = scoped.dues || [];
  const allExpenses = (scoped.expenses || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Tarih Filtresi Hesaplama
  const dateFilter = state.financesDateFilter || "all";
  const selectedMonth = state.financesSelectedMonth || "all";
  const now = new Date();
  let filterStart = null;
  let filterEnd = null;

  if (dateFilter === "week") {
    filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (dateFilter === "month") {
    filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (dateFilter === "quarter") {
    filterStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  } else if (dateFilter === "year") {
    filterStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  } else if (dateFilter === "custom") {
    filterStart = state.financesStartDate || null;
    filterEnd = state.financesEndDate || null;
  }

  // Aidat ve Gider Filtreleme
  const categoryFilter = state.financesCategoryFilter || "all";

  const filteredDues = allDues.filter((d) => {
    if (selectedMonth !== "all" && d.period !== selectedMonth) return false;
    const dateStr = d.paidDate || (d.period ? d.period + "-01" : "");
    if (filterStart && dateStr && dateStr < filterStart) return false;
    if (filterEnd && dateStr && dateStr > filterEnd) return false;
    return true;
  });

  const filteredExpenses = allExpenses.filter((e) => {
    if (selectedMonth !== "all" && (!e.date || !e.date.startsWith(selectedMonth))) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (filterStart && e.date && e.date < filterStart) return false;
    if (filterEnd && e.date && e.date > filterEnd) return false;
    return true;
  });

  // Filtrelenmiş Dönem Finans Özeti
  const periodIncome = filteredDues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const periodExpense = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const periodNet = periodIncome - periodExpense;

  // Genel Kasa Mevcudu (Tüm Zamanlar Kümülatif Nakit)
  const totalIncome = allDues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalExpense = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const vaultBalance = totalIncome - totalExpense;

  // Aylık Nakit Akışı Kırılımı (Monthly Breakdown)
  const monthMap = {};
  for (const d of allDues) {
    if (d.status === "paid" && d.period) {
      if (!monthMap[d.period]) monthMap[d.period] = { period: d.period, income: 0, expense: 0 };
      monthMap[d.period].income += (Number(d.amount) || 0);
    }
  }
  for (const e of allExpenses) {
    const period = (e.date || "").slice(0, 7);
    if (period) {
      if (!monthMap[period]) monthMap[period] = { period, income: 0, expense: 0 };
      monthMap[period].expense += (Number(e.amount) || 0);
    }
  }
  const monthlyBreakdown = Object.values(monthMap).sort((a, b) => b.period.localeCompare(a.period));

  // Filtrelenmiş Kategori Dağılımı
  const catSums = {};
  for (const exp of filteredExpenses) {
    const cat = exp.category || "other";
    catSums[cat] = (catSums[cat] || 0) + (Number(exp.amount) || 0);
  }
  const categoryBreakdown = Object.entries(catSums)
    .map(([cat, amount]) => ({
      category: cat,
      meta: EXPENSE_CATEGORIES[cat] || { label: cat, icon: "📋", color: "#64748b" },
      amount,
      pct: periodExpense > 0 ? Math.round((amount / periodExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return `
    <!-- 1. Üst Finansal KPI Kartları -->
    <div class="grid dashboard-grid">
      <section class="section metric ${vaultBalance >= 0 ? "vault-positive" : "vault-negative"}">
        <span>💰 Toplam Kasa Bakiyesi</span>
        <strong style="color: ${vaultBalance >= 0 ? "var(--accent)" : "var(--danger)"};">${money(vaultBalance)}</strong>
        <small>${vaultBalance >= 0 ? "Kasa nakit durumu dengeli" : "Açık veriyor, tahsilat hızlandırılmalı"}</small>
      </section>
      <section class="section metric">
        <span>📈 Seçilen Dönem Geliri</span>
        <strong style="color: var(--ok);">${money(periodIncome)}</strong>
        <small>${filteredDues.filter((d) => d.status === "paid").length} adet aidat tahsilatı</small>
      </section>
      <section class="section metric">
        <span>📉 Seçilen Dönem Gideri</span>
        <strong style="color: var(--danger);">${money(periodExpense)}</strong>
        <small>${filteredExpenses.length} adet fatura ve masraf</small>
      </section>
      <section class="section metric">
        <span>⚖️ Dönem Net Nakit Farkı</span>
        <strong style="color: ${periodNet >= 0 ? "var(--accent)" : "var(--danger)"};">
          ${periodNet >= 0 ? "+" : ""}${money(periodNet)}
        </strong>
        <small>${selectedMonth !== "all" ? `${selectedMonth} ayı net akışı` : "Filtrelenen aralık sonucu"}</small>
      </section>
    </div>

    <!-- 2. Gelişmiş Tarih Filtreleme Araç Çubuğu -->
    <div class="finances-filter-bar">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <span style="font-size:12.5px; font-weight:700; color:var(--muted); text-transform:uppercase;">📅 Tarih Aralığı:</span>
        <div class="date-preset-pills">
          <button type="button" class="date-preset-btn ${dateFilter === "all" && selectedMonth === "all" ? "active" : ""}" onclick="setState({ financesDateFilter: 'all', financesSelectedMonth: 'all', financesStartDate: '', financesEndDate: '' })">
            Tüm Zamanlar
          </button>
          <button type="button" class="date-preset-btn ${dateFilter === "week" ? "active" : ""}" onclick="setState({ financesDateFilter: 'week', financesSelectedMonth: 'all' })">
            Son 1 Hafta
          </button>
          <button type="button" class="date-preset-btn ${dateFilter === "month" ? "active" : ""}" onclick="setState({ financesDateFilter: 'month', financesSelectedMonth: 'all' })">
            Son 1 Ay
          </button>
          <button type="button" class="date-preset-btn ${dateFilter === "quarter" ? "active" : ""}" onclick="setState({ financesDateFilter: 'quarter', financesSelectedMonth: 'all' })">
            Son 3 Ay
          </button>
          <button type="button" class="date-preset-btn ${dateFilter === "year" ? "active" : ""}" onclick="setState({ financesDateFilter: 'year', financesSelectedMonth: 'all' })">
            Bu Yıl
          </button>
        </div>
      </div>

      <!-- Özel Tarih Aralığı Seçicisi -->
      <div class="custom-date-inputs">
        <span style="font-size:12px; font-weight:600; color:var(--muted);">Özel:</span>
        <input type="date" value="${state.financesStartDate || ""}" onchange="setState({ financesDateFilter: 'custom', financesSelectedMonth: 'all', financesStartDate: this.value })" title="Başlangıç Tarihi" />
        <span style="color:var(--muted);">-</span>
        <input type="date" value="${state.financesEndDate || ""}" onchange="setState({ financesDateFilter: 'custom', financesSelectedMonth: 'all', financesEndDate: this.value })" title="Bitiş Tarihi" />
      </div>

      <!-- Kategori Filtresi -->
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase;">🏷️ Kategori:</span>
        <select class="dues-filter-select" onchange="setState({ financesCategoryFilter: this.value })" style="min-height:34px !important; padding:4px 10px !important;">
          <option value="all" ${categoryFilter === "all" ? "selected" : ""}>Tüm Kategoriler</option>
          ${Object.entries(EXPENSE_CATEGORIES).map(([catKey, catVal]) => `<option value="${catKey}" ${categoryFilter === catKey ? "selected" : ""}>${catVal.icon} ${safeText(catVal.label)}</option>`).join("")}
        </select>
      </div>

      ${
        dateFilter !== "all" || selectedMonth !== "all" || categoryFilter !== "all" || state.financesStartDate || state.financesEndDate
          ? `<button class="btn" style="padding:6px 12px; font-size:12px; border-color:var(--line); color:var(--text-sub);" onclick="setState({ financesDateFilter: 'all', financesSelectedMonth: 'all', financesCategoryFilter: 'all', financesStartDate: '', financesEndDate: '' })">
              ✕ Filtreleri Temizle
            </button>`
          : ""
      }
    </div>

    <!-- 3. Aylık Nakit Akışı ve Gelir-Gider İncelemesi (Monthly Breakdown) -->
    <section class="section" style="margin-bottom:22px;">
      <div class="section-header">
        <div>
          <h2>Aylık Nakit Akışı ve Gelir-Gider Analizi</h2>
          <p>Her ayın gelir, gider ve net bakiye dengesi. İlgili aya tıklayarak detaylı filtreleme yapabilirsiniz.</p>
        </div>
        ${
          selectedMonth !== "all"
            ? `<button class="btn" style="padding:6px 12px; font-size:12.5px;" onclick="setState({ financesSelectedMonth: 'all' })">✕ Ay Filtresini Temizle (${selectedMonth})</button>`
            : ""
        }
      </div>

      <div class="monthly-cashflow-container">
        ${
          monthlyBreakdown.length
            ? monthlyBreakdown.map((m) => {
                const net = m.income - m.expense;
                const totalVol = (m.income + m.expense) || 1;
                const incPct = Math.round((m.income / totalVol) * 100);
                const expPct = 100 - incPct;
                const isSelected = selectedMonth === m.period;
                return `
                  <div class="monthly-cashflow-card ${isSelected ? "active-period" : ""}" onclick="setState({ financesSelectedMonth: '${isSelected ? "all" : m.period}' })" title="Bu ayın detaylarını filtrelemek için tıklayın">
                    <div class="cashflow-month-header">
                      <span class="cashflow-month-title">${m.period}</span>
                      <span class="cashflow-diff-badge ${net >= 0 ? "positive" : "negative"}">
                        ${net >= 0 ? "+" : ""}${money(net)}
                      </span>
                    </div>
                    <div class="cashflow-row">
                      <span>Gelir:</span>
                      <strong style="color:var(--ok);">${money(m.income)}</strong>
                    </div>
                    <div class="cashflow-row">
                      <span>Gider:</span>
                      <strong style="color:var(--danger);">${money(m.expense)}</strong>
                    </div>
                    <div class="cashflow-ratio-bar">
                      <div class="cashflow-ratio-income" style="width:${incPct}%;" title="Gelir Payı: %${incPct}"></div>
                      <div class="cashflow-ratio-expense" style="width:${expPct}%;" title="Gider Payı: %${expPct}"></div>
                    </div>
                    <small style="display:block; text-align:right; margin-top:6px; font-size:11px; color:var(--muted);">
                      ${isSelected ? "✓ Seçili Ay (Aktif)" : "Filtrelemek için tıkla"}
                    </small>
                  </div>
                `;
              }).join("")
            : `<div class="empty">Henüz aylık akış verisi bulunmuyor.</div>`
        }
      </div>
    </section>

    <!-- 4. Yeni Gider Kaydı ve Kategori Dağılımı -->
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Yeni Masraf / Gider Kaydı</h2>
            <p>Fatura, fiş ve ortak alan harcamalarını kasaya işleyin.</p>
          </div>
        </div>
        <form class="grid" onsubmit="createExpense(event)">
          <label>Gider Başlığı / Konusu
            <input name="title" required placeholder="Örn. Ortak alan merdiven otomatiği ve asansör elektrik faturası" />
          </label>
          <div class="form-row-2" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <label>Kategori
              <select name="category" required>
                ${Object.entries(EXPENSE_CATEGORIES).map(([cat, info]) => `<option value="${cat}">${info.icon} ${info.label}</option>`).join("")}
              </select>
            </label>
            <label>Tutar (TL)
              <input name="amount" type="number" min="1" step="any" required placeholder="Örn. 3250" />
            </label>
          </div>
          <div class="form-row-2" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <label>Harcama / Fatura Tarihi
              <input name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}" />
            </label>
            <label>Fatura / Makbuz No (Opsiyonel)
              <input name="invoiceNo" placeholder="Örn. FTR-2026-981" />
            </label>
          </div>
          <label>Tedarikçi Firma / Hizmet Veren
            <input name="vendor" placeholder="Örn. BEDAŞ, Kone Asansör Servis, Kale Kilit" />
          </label>
          <label>Açıklama & Detay
            <textarea name="description" rows="2" placeholder="Harcamanın detayı, yapılan onarım veya satın alma gerekçesi"></textarea>
          </label>
          <button class="btn primary" type="submit">Gideri Kaydet & Kasadan Düş</button>
        </form>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <h2>Kategori Bazlı Gider Dağılımı</h2>
            <p>Seçilen dönemde harcamaların kalemlere göre yoğunluğu.</p>
          </div>
        </div>
        ${
          categoryBreakdown.length
            ? `
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
              ${categoryBreakdown.map((item) => `
                <div class="category-breakdown-card">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13.5px;">
                    <span><strong>${item.meta.icon} ${safeText(item.meta.label)}</strong></span>
                    <span><strong>${money(item.amount)}</strong> <small style="color:var(--muted);">(%${item.pct})</small></span>
                  </div>
                  <div style="height:8px; background:rgba(0,0,0,0.06); border-radius:999px; overflow:hidden;">
                    <div style="width:${item.pct}%; height:100%; background:${item.meta.color}; border-radius:999px; transition:width 0.4s ease;"></div>
                  </div>
                </div>
              `).join("")}
            </div>
            `
            : `<div class="empty">Bu tarih aralığında kaydedilmiş harcama bulunmamaktadır.</div>`
        }
      </section>
    </div>

    <!-- 5. Filtrelenmiş Gider Belgeleri ve Faturalar Tablosu -->
    <section class="section" style="margin-top:16px;">
      <div class="section-header">
        <div>
          <h2>Kayıtlı Gider Belgeleri ve Faturalar (${filteredExpenses.length})</h2>
          <p>Filtreye uygun tüm harcamalar, faturalar ve tedarikçiler.</p>
        </div>
      </div>
      ${
        filteredExpenses.length
          ? `
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Gider / Belge Başlığı</th>
                  <th>Kategori</th>
                  <th>Tedarikçi Firma</th>
                  <th>Fatura No</th>
                  <th style="text-align:right;">Tutar</th>
                  <th style="text-align:center;">İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${filteredExpenses.map((exp) => `
                  <tr>
                    <td style="white-space:nowrap; font-size:13px; color:var(--muted);">${dateText(exp.date)}</td>
                    <td>
                      <strong style="display:block; font-size:13.5px;">${safeText(exp.title)}</strong>
                      ${exp.description ? `<small style="color:var(--muted); font-size:12px;">${safeText(exp.description)}</small>` : ""}
                    </td>
                    <td>${expenseCategoryBadge(exp.category)}</td>
                    <td style="font-size:13px;">${safeText(exp.vendor || "-")}</td>
                    <td style="font-size:12.5px; font-family:monospace; color:var(--muted);">${safeText(exp.invoiceNo || "-")}</td>
                    <td style="text-align:right; font-weight:700; color:var(--danger); white-space:nowrap;">-${money(exp.amount)}</td>
                    <td style="text-align:center;">
                      <button class="btn danger" style="padding:4px 10px; font-size:12px;" onclick="deleteExpense('${exp.id}')" title="Gider kaydını sil">Sil</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          `
          : `
          <div class="empty" style="text-align:center; padding:32px 16px;">
            <div style="font-size:24px; margin-bottom:6px;">🧾</div>
            <strong>Seçilen filtre kriterlerine uygun gider kaydı bulunamadı.</strong>
            <p style="margin:4px 0 12px; font-size:12.5px; color:var(--muted);">Farklı bir tarih aralığı, ay veya kategori seçebilirsiniz.</p>
            <button class="btn btn-sm" onclick="setState({ financesDateFilter: 'all', financesStartDate: '', financesEndDate: '', financesSelectedMonth: 'all', financesCategoryFilter: 'all' })">
              Filtreleri Sıfırla
            </button>
          </div>
          `
      }
    </section>
  `;
}

function requestEntryTypeBadge(entryType) {
  if (entryType === "complaint") return `<span class="status complaint" style="font-size:11px;">⚠️ Şikayet</span>`;
  if (entryType === "suggestion") return `<span class="status suggestion" style="font-size:11px;">💡 Öneri</span>`;
  return `<span class="status fault" style="font-size:11px;">🛠️ Arıza</span>`;
}

function requestsView() {
  const categories = [...new Set(scoped.requests.map((request) => request.category))];
  const statusOptions = ["yeni", "inceleniyor", "firmaya_iletildi", "cozuldu", "reddedildi"];
  const statusFilter = statusOptions.includes(state.requestStatusFilter) ? state.requestStatusFilter : "all";
  const categoryFilter = categories.includes(state.requestCategoryFilter) ? state.requestCategoryFilter : "all";
  const entryTypeFilter = state.requestEntryTypeFilter || "all";

  const faultCount = scoped.requests.filter((r) => !r.entryType || r.entryType === "fault").length;
  const complaintCount = scoped.requests.filter((r) => r.entryType === "complaint").length;
  const suggestionCount = scoped.requests.filter((r) => r.entryType === "suggestion").length;

  const filteredRequests = scoped.requests.filter((request) => {
    const statusOk = statusFilter === "all" || request.status === statusFilter;
    const categoryOk = categoryFilter === "all" || request.category === categoryFilter;
    const entryTypeOk =
      entryTypeFilter === "all" ||
      (entryTypeFilter === "fault" ? (!request.entryType || request.entryType === "fault") : request.entryType === entryTypeFilter);
    return statusOk && categoryOk && entryTypeOk;
  });
  const selectedRequest = scoped.requests.find((request) => request.id === state.selectedRequestId);

  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Arıza, Şikayet ve Öneri Talepleri (${filteredRequests.length} / ${scoped.requests.length} Kayıt)</h2>
          <p>Yapay zeka analizleri, otomatik kategori sınıflandırması ve durum takibi.</p>
        </div>
      </div>

      <!-- Talep Türü Filtre Butonları -->
      <div class="request-type-segmented" style="margin-bottom:16px;">
        <button type="button" class="req-type-btn ${entryTypeFilter === "all" ? "active" : ""}" onclick="setState({ requestEntryTypeFilter: 'all' })">
          📋 Tümü (${scoped.requests.length})
        </button>
        <button type="button" class="req-type-btn ${entryTypeFilter === "fault" ? "active" : ""}" data-type="fault" onclick="setState({ requestEntryTypeFilter: 'fault' })">
          🛠️ Arızalar (${faultCount})
        </button>
        <button type="button" class="req-type-btn ${entryTypeFilter === "complaint" ? "active" : ""}" data-type="complaint" onclick="setState({ requestEntryTypeFilter: 'complaint' })">
          ⚠️ Şikayetler (${complaintCount})
        </button>
        <button type="button" class="req-type-btn ${entryTypeFilter === "suggestion" ? "active" : ""}" data-type="suggestion" onclick="setState({ requestEntryTypeFilter: 'suggestion' })">
          💡 Öneriler (${suggestionCount})
        </button>
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
        <button class="btn" onclick="setState({ requestStatusFilter: 'all', requestCategoryFilter: 'all', requestEntryTypeFilter: 'all' })">Filtreleri Temizle</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tür & Talep</th><th>Daire</th><th>Kategori</th><th>Aciliyet</th><th>AI Özeti</th><th>Durum</th><th>İşlem</th></tr></thead>
          <tbody>
            ${filteredRequests.map((request) => `
              <tr>
                <td>
                  <div style="margin-bottom:4px;">${requestEntryTypeBadge(request.entryType)}</div>
                  <strong>${request.title}</strong><br>${request.description}<br><small>${dateText(request.createdAt)} - ${request.location || ""}</small>
                </td>
                <td>${apartmentLabel(request.apartmentId)}</td>
                <td><span style="font-weight:600; font-size:12.5px;">${request.category}</span></td>
                <td><span class="status ${request.urgency === "Yüksek" ? "danger" : request.urgency === "Orta" ? "warn" : "info"}">${request.urgency}</span></td>
                <td>${request.aiSummary}<br>${aiBadge(request)}${requestPhotoSrc(request) ? ` <span class="status info">Fotoğraflı</span>` : ""}</td>
                <td><span class="status ${statusClass(request.status)}">${requestStatusText(request.status)}</span>${request.assignee ? `<br><small>${safeText(request.assignee)}</small>` : ""}</td>
                <td>
                  <button class="btn" onclick="setState({ selectedRequestId: '${request.id}' })">Detay</button>
                </td>
              </tr>
            `).join("") || `
              <tr>
                <td colspan="7" style="text-align:center; padding:36px 16px; color:var(--muted);">
                  <div style="font-size:24px; margin-bottom:6px;">📋</div>
                  <strong style="color:var(--ink-secondary);">Bu filtrelere uygun arıza, şikayet veya öneri talebi bulunamadı.</strong>
                  <p style="margin:4px 0 12px; font-size:12.5px;">Talep türü, durum veya kategori filtresini değiştirmeyi deneyebilirsiniz.</p>
                  <button class="btn btn-sm" onclick="setState({ requestStatusFilter: 'all', requestCategoryFilter: 'all', requestEntryTypeFilter: 'all' })">
                    Filtreleri Sıfırla
                  </button>
                </td>
              </tr>
            `}
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
            <div style="margin-bottom:6px;">${requestEntryTypeBadge(request.entryType)}</div>
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

async function bulkSetupSite(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const prefix = (form.get("prefix") || "Ç").trim();
  const buildingCount = parseInt(form.get("buildingCount") || "12", 10);
  const flatsPerBuilding = parseInt(form.get("flatsPerBuilding") || "20", 10);
  const flatPrefix = (form.get("flatPrefix") || "ÇD").trim();
  const duesAmount = parseFloat(form.get("duesAmount") || "750");

  const siteId = state.activeSiteId;
  if (!siteId) {
    alert("Lütfen önce bir site seçiniz.");
    return;
  }

  if (API_BASE) {
    try {
      const res = await apiRequest(`/sites/${siteId}/bulk-setup`, {
        method: "POST",
        body: JSON.stringify({ prefix, buildingCount, flatsPerBuilding, flatPrefix, duesAmount }),
      });
      alert(`Toplu kurulum başarılı! ${res.blocksCreated} bina/blok ve ${res.apartmentsCreated} daire oluşturuldu.`);
      applyServerData(res.data);
    } catch (err) {
      alert("Toplu kurulum hatası: " + err.message);
    }
  } else {
    alert(`Toplu kurulum simüle edildi: ${buildingCount} bina ve ${buildingCount * flatsPerBuilding} daire.`);
  }
}

function fillBulkSetupPreset() {
  const form = document.getElementById("bulk-setup-form");
  if (!form) return;
  form.querySelector('input[name="prefix"]').value = "Ç";
  form.querySelector('input[name="buildingCount"]').value = "12";
  form.querySelector('input[name="flatsPerBuilding"]').value = "20";
  form.querySelector('input[name="flatPrefix"]').value = "ÇD";
  form.querySelector('input[name="duesAmount"]').value = "750";
}

function setupView() {
  const currentBlockFilter = state.setupBlockFilter || "all";
  const filteredApts = scoped.apartments.filter((apt) => currentBlockFilter === "all" || apt.blockId === currentBlockFilter);

  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <!-- 🏗️ Toplu Bina & Daire Sihirbazı (Bulk Setup) -->
      <section class="bulk-setup-banner">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:24px;">🏗️</span>
              <h3 style="margin:0; font-size:18px; color:#0f766e;">Toplu Site, Bina (Ç1..Ç12) ve Daire (ÇD1..ÇD20) Sihirbazı</h3>
            </div>
            <p style="margin:4px 0 0; font-size:13px; color:#334155;">
              Büyük siteler için tüm binaları, kat dağılımlarını ve daire numaralarını saniyeler içinde topluca oluşturun.
            </p>
          </div>
          <button type="button" class="btn text-btn btn-sm" onclick="fillBulkSetupPreset()" style="background:#ffffff; border:1px solid #5eead4; border-radius:8px; font-weight:700;">
            ⚡ 12 Bina & 20 Daire Örneğini Doldur
          </button>
        </div>

        <form id="bulk-setup-form" class="form-grid wide" onsubmit="bulkSetupSite(event)" style="background:#ffffff; padding:18px; border-radius:12px; border:1px solid #ccfbf1;">
          <label>
            <span>Bina / Blok Ön Eki</span>
            <input name="prefix" value="Ç" required placeholder="Örn: Ç veya Blok-" />
          </label>
          <label>
            <span>Bina / Blok Sayısı</span>
            <input name="buildingCount" type="number" min="1" max="50" value="12" required placeholder="Örn: 12" />
          </label>
          <label>
            <span>Bina Başına Daire Sayısı</span>
            <input name="flatsPerBuilding" type="number" min="1" max="100" value="20" required placeholder="Örn: 20" />
          </label>
          <label>
            <span>Daire Numarası Ön Eki</span>
            <input name="flatPrefix" value="ÇD" required placeholder="Örn: ÇD veya D" />
          </label>
          <label>
            <span>Varsayılan Aylık Aidat (TL)</span>
            <input name="duesAmount" type="number" min="0" value="750" required placeholder="750" />
          </label>
          <div style="display:flex; align-items:flex-end;">
            <button class="btn primary" type="submit" style="width:100%; height:42px; font-weight:700;">
              🚀 Toplu Binaları ve Daireleri Oluştur
            </button>
          </div>
        </form>
      </section>

      <div class="split">
        <!-- Manuel Tek Daire Ekleme -->
        <section class="section">
          <div class="section-header"><h2>Tek Daire ve Sakin Ekle</h2></div>
          <form class="form-grid wide" onsubmit="createApartment(event)">
            <label>Bina / Blok
              <select name="blockId">${scoped.blocks.map((block) => `<option value="${block.id}">${safeText(block.name)}</option>`).join("")}</select>
            </label>
            <label>Daire No<input name="no" required placeholder="Örn: ÇD12" /></label>
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
                <p class="muted" style="font-size:13px; line-height:1.5;">Başlıklar: <code>Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta,Mülkiyet,Plaka,Acil İrtibat</code>.</p>
                <form class="form-grid wide" onsubmit="importApartmentsCsv(event)">
                  <label class="full">CSV içeriği<textarea name="csv" rows="4" placeholder="Blok,Daire No,Kat,Ad Soyad,Telefon,E-posta,Mülkiyet,Plaka,Acil İrtibat&#10;Ç1,ÇD1,1,Ali Veli,05xx,ali@example.com,Ev Sahibi,34 ABC 123,0532 xxx"></textarea></label>
                  <label>veya dosya seç<input name="csvFile" type="file" accept=".csv,text/csv" onchange="loadCsvFileIntoTextarea(this)" /></label>
                  <button class="btn primary" type="submit">İçeri Aktar</button>
                </form>`
              : ""
          }
        </section>

        <!-- Mevcut Daireler & Blok Filtresi -->
        <section class="section">
          <div class="section-header">
            <div>
              <h2>Mevcut Daireler & Sakin Profili</h2>
              <p style="margin:2px 0 0; font-size:12.5px; color:var(--muted);">Toplam ${scoped.apartments.length} daire listeleniyor.</p>
            </div>
          </div>

          <!-- Bina / Blok Filtreleme Sekmeleri -->
          <div class="block-filter-bar">
            <button type="button" class="block-pill ${currentBlockFilter === "all" ? "active" : ""}" onclick="setState({ setupBlockFilter: 'all' })">
              Tüm Bloklar (${scoped.apartments.length})
            </button>
            ${scoped.blocks.map((b) => {
              const count = scoped.apartments.filter((a) => a.blockId === b.id).length;
              return `<button type="button" class="block-pill ${currentBlockFilter === b.id ? "active" : ""}" onclick="setState({ setupBlockFilter: '${b.id}' })">${safeText(b.name)} (${count})</button>`;
            }).join("")}
          </div>

          <div class="table-wrap">
            <table>
              <thead><tr><th>Daire</th><th>Kat</th><th>Mülkiyet</th><th>Sakin</th><th>Plaka</th><th>Acil İrtibat</th></tr></thead>
              <tbody>
                ${filteredApts.map((apt) => {
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
                }).join("") || `<tr><td colspan="6">Bu blokta kayıtlı daire bulunamadı.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="margin:0; font-size:24px;">📊 Aylık Faaliyet, Denetim & Sağlık Raporu</h2>
        <p style="margin:4px 0 0; color:var(--muted); font-size:13.5px;">Tüm operasyonel, finansal ve teknik verilerin konsolide yönetici analizi.</p>
      </div>
      <button class="btn primary" onclick="openPrintModal()">🖨️ Resmi Faaliyet Bülteni (Pano Çıktısı)</button>
    </div>

    <!-- 1. Sağlık Skoru Kadranı ve Anahtar Metrikler -->
    <div class="report-hero-grid">
      <div class="health-score-dial-card">
        <span style="font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:rgba(255,255,255,0.7); margin-bottom:8px;">Site Sağlık Endeksi</span>
        <div class="dial-circle">
          <span class="dial-score-num">${health.score}</span>
        </div>
        <strong style="font-size:15px; color:#5eead4;">${health.status}</strong>
        <small style="color:rgba(255,255,255,0.65); font-size:11.5px; margin-top:4px;">100 üzerinden ağırlıklı skor</small>
        ${API_BASE ? `<button class="btn" style="background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.25); color:#ffffff; font-size:11.5px; padding:4px 10px; margin-top:12px;" onclick="saveHealthSnapshot()">📸 Skoru Kaydet</button>` : ""}
      </div>

      <div class="grid dashboard-grid" style="margin:0;">
        <section class="section metric">
          <span>💰 Tahsilat Başarısı</span>
          <strong style="color:var(--ok);">%${dues.collectionRate}</strong>
          <small>${money(dues.paid)} tahsil edildi / ${money(dues.pending)} bekliyor</small>
        </section>
        <section class="section metric">
          <span>🛠️ Talep Çözüm Oranı</span>
          <strong style="color:var(--accent);">%${requests.resolutionRate}</strong>
          <small>${requests.resolved} çözülen / ${requests.open} açık talep</small>
        </section>
        <section class="section metric">
          <span>👥 Sakin Aktivite Payı</span>
          <strong style="color:var(--info);">%${pilot.residentActivityRate}</strong>
          <small>Sistemden talep açma: %${pilot.systemRequestRate}</small>
        </section>
      </div>
    </div>

    <!-- 2. Yönetici Özeti ve Kategori Yoğunluğu -->
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Aylık Yönetici Özet Bülteni</h2>
            <p>Yapay zeka destekli operasyonel durum özeti.</p>
          </div>
        </div>
        <ul class="plain-list">
          <li><strong>Finansal Durum:</strong> Toplam tahsilat oranı <strong>%${dues.collectionRate}</strong> seviyesinde; tahsil edilmeyi bekleyen tutar <strong>${money(dues.pending)}</strong>.</li>
          <li><strong>Operasyonel Yoğunluk:</strong> Bu dönem en çok talep gelen alan: <strong>${topCategory}</strong>.</li>
          <li><strong>Kritik Lokasyon:</strong> En yoğun arıza/istek bildirimi yapılan bölüm: <strong>${topBlock}</strong>.</li>
          <li><strong>Genel Skor:</strong> Sitenin sağlık skoru <strong>${health.score}/100</strong> ve durum <strong>${health.status}</strong>.</li>
          <li><strong>Öncelikli Aksiyon:</strong> ${health.actions[0] || "Tüm operasyonel göstergeler normal seyrediyor."}</li>
        </ul>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <h2>Kategori Yoğunluk Dağılımı</h2>
            <p>Gelen taleplerin departman ve konulara göre dağılımı.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Kategori</th><th>Talep Sayısı</th><th>Durum</th></tr></thead>
            <tbody>
              ${
                Object.entries(byCategory).map(([category, count]) => `
                  <tr>
                    <td><strong>${category}</strong></td>
                    <td>${count} adet</td>
                    <td><span class="status ${count > 3 ? "warn" : "ok"}">${count > 3 ? "Yoğun" : "Normal"}</span></td>
                  </tr>
                `).join("") || `<tr><td colspan="3">Henüz talep kaydı bulunmuyor.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- 3. Blok Yoğunlukları ve Pilot Başarı Metrikleri -->
    <div class="split">
      <section class="section">
        <div class="section-header">
          <div>
            <h2>Bina / Blok Bazlı Arıza Yoğunluğu</h2>
            <p>Hangi blokta daha fazla teknik bakım gerektiğini gösterir.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Blok Adı</th><th>Talep Sayısı</th><th>İzleme Durumu</th></tr></thead>
            <tbody>
              ${
                blocks.map((item) => `
                  <tr>
                    <td><strong>${item.block}</strong></td>
                    <td>${item.count} adet</td>
                    <td><span class="status ${item.count > 2 ? "warn" : "ok"}">${item.count > 2 ? "İzlenmeli" : "Sorunsuz"}</span></td>
                  </tr>
                `).join("") || `<tr><td colspan="3">Blok verisi bulunamadı.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <h2>Platform Kullanım & Otomasyon Başarısı</h2>
            <p>ApartAI dijital dönüşüm ve sakin katılım metrikleri.</p>
          </div>
        </div>
        <ul class="plain-list">
          <li><strong>Sakin Katılım Oranı:</strong> %${pilot.residentActivityRate}</li>
          <li><strong>Dijital Kanaldan Açılan Talep:</strong> %${pilot.systemRequestRate}</li>
          <li><strong>Yayınlanan Resmi Duyuru:</strong> ${pilot.announcementCount} adet</li>
          <li><strong>Tekrarlayan Arıza Sinyali:</strong> ${recurringIssues().length ? recurringIssues().map((item) => `${item.label} (${item.count})`).join(", ") : "Tespit edilen kronik arıza yok"}</li>
        </ul>
      </section>
    </div>

    <!-- 4. Tedarikçi & Bakım Firma Performans Karnesi -->
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Tedarikçi & Bakım Firma Performans Karnesi</h2>
          <p>Anlaşmalı bakım firmalarının ortalama çözüm süresi ve SLA hedeflerine uyumu.</p>
        </div>
      </div>
      ${
        vendors.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Firma / Hizmet Veren</th><th>Hizmet Alanı</th><th>Toplam İş</th><th>Açık</th><th>Çözülen</th><th>Ort. Çözüm Süresi</th><th>SLA Karnesi</th></tr></thead>
              <tbody>${vendors.map((v) => `<tr><td><strong>${safeText(v.assignee)}</strong></td><td><span class="status info">${safeText(v.category)}</span></td><td>${v.total}</td><td>${v.open}</td><td>${v.resolved}</td><td><strong>${v.avgDays !== null ? `${v.avgDays} gün` : "-"}</strong></td><td><span class="status ${v.scoreStatus}">${v.scoreText}</span></td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p style="color:var(--muted); padding:12px 0;">Henüz firmaya atanmış talep bulunmuyor. Talepler ekranından firma atayarak karne oluşturabilirsiniz.</p>`
      }
    </section>

    <!-- 5. Site Sağlık Skoru Geçmişi -->
    <section class="section">
      <div class="section-header">
        <div>
          <h2>Site Sağlık Skoru Geçmiş Kayıtları</h2>
          <p>Dönemsel performans ve iyileşme trendi.</p>
        </div>
      </div>
      ${
        scoped.healthScores.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Tarih</th><th>Skor</th><th>Değerlendirme</th></tr></thead>
              <tbody>${scoped.healthScores.slice().reverse().map((item) => `<tr><td>${dateText(item.date)}</td><td><strong>${item.score}/100</strong></td><td><span class="status ${item.score >= 75 ? "ok" : item.score >= 60 ? "warn" : "danger"}">${item.status}</span></td></tr>`).join("")}</tbody>
            </table></div>`
          : `<p style="color:var(--muted); padding:12px 0;">Henüz kayıtlı anlık görüntü bulunmuyor. Yukarıdaki "Skoru Kaydet" butonu ile bugünün skorunu arşivleyebilirsiniz.</p>`
      }
    </section>
  `;
}

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
    blocks: rows.blocks.length,
    collectionRate: summary.collectionRate,
    pending: summary.pending,
    openRequests: stats.open,
    score: health.score,
    status: health.status,
  };
}

function sitesView() {
  const rows = (state.sites || []).map((site) => siteMetrics(site.id)).sort((a, b) => b.score - a.score);
  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
  const avgScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
  const totalApartments = rows.reduce((sum, row) => sum + row.apartments, 0);

  return `
    <!-- 1. Üst Portföy KPI Kartları -->
    <div class="grid dashboard-grid">
      <section class="section metric">
        <span>🏢 Yönetilen Siteler</span>
        <strong>${rows.length} Site</strong>
        <small>${totalApartments} bağımsız bölüm</small>
      </section>
      <section class="section metric">
        <span>⭐ Portföy Ortalama Skoru</span>
        <strong style="color:var(--accent);">${avgScore} / 100</strong>
        <small>${rows.length} siteden hesaplandı</small>
      </section>
      <section class="section metric">
        <span>⚠️ Toplam Bekleyen Alacak</span>
        <strong style="color:var(--danger);">${money(totalPending)}</strong>
        <small>Tüm sitelerdeki kümülatif borç</small>
      </section>
    </div>

    <!-- 2. Siteler Portföy Kartları Gridi -->
    <div style="margin-top:24px;">
      <div class="section-header">
        <div>
          <h2>Site Portföyü & Hızlı Yönetim</h2>
          <p>Yönettiğiniz tüm siteler. İlgili siteyi aktif yapmak ve yönetmek için kart üzerindeki butona tıklayın.</p>
        </div>
      </div>

      <div class="sites-portfolio-grid">
        ${rows.map((row) => {
          const isActive = row.siteId === state.activeSiteId;
          return `
            <div class="site-portfolio-card ${isActive ? "is-active-site" : ""}">
              <div class="site-card-header">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="site-card-icon">🏢</div>
                  <div>
                    <h3 style="margin:0; font-size:16.5px; color:var(--ink);">${safeText(row.name)}</h3>
                    <small style="color:var(--muted); font-size:12px;">${safeText(row.address || "Adres belirtilmedi")}</small>
                  </div>
                </div>
                <span class="status ${row.score >= 75 ? "ok" : row.score >= 60 ? "warn" : "danger"}" style="font-size:11.5px; font-weight:750;">
                  ⭐ ${row.score}
                </span>
              </div>

              <div class="site-card-body">
                <div class="site-card-metrics-row">
                  <div>
                    <small>Daire</small>
                    <strong>${row.apartments}</strong>
                  </div>
                  <div>
                    <small>Tahsilat</small>
                    <strong style="color:var(--ok);">%${row.collectionRate}</strong>
                  </div>
                  <div>
                    <small>Açık Talep</small>
                    <strong style="color:${row.openRequests > 0 ? "var(--danger)" : "var(--muted)"};">${row.openRequests}</strong>
                  </div>
                </div>

                <div style="font-size:12.5px; color:var(--muted); display:flex; justify-content:space-between; margin-top:2px;">
                  <span>Bekleyen Alacak:</span>
                  <strong style="color:var(--danger);">${money(row.pending)}</strong>
                </div>

                <div style="height:6px; background:#f1f5f9; border-radius:999px; overflow:hidden;">
                  <div style="width:${row.collectionRate}%; height:100%; background:var(--accent); border-radius:999px;"></div>
                </div>
              </div>

              <div class="site-card-footer">
                ${
                  isActive
                    ? `<span class="status ok" style="padding:6px 14px; font-weight:750;">🟢 Şu An Yönetilen Site</span>`
                    : `<button class="btn primary" style="width:100%; font-size:13px; padding:8px 14px;" onclick="switchSite('${row.siteId}')">Bu Siteyi Yönet →</button>`
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- 3. Karşılaştırmalı Detay Tablosu -->
    <section class="section" style="margin-top:24px">
      <div class="section-header">
        <div>
          <h2>Siteler Arası Performans Karşılaştırması</h2>
          <p>Tüm sitelerin operasyonel göstergeleri tek bir tabloda.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Site Adı</th><th>Blok & Daire</th><th>Tahsilat Oranı</th><th>Bekleyen Borç</th><th>Açık Talepler</th><th>Sağlık Skoru</th><th style="text-align:right;">İşlem</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr class="${row.siteId === state.activeSiteId ? "row-active" : ""}">
                <td>
                  <strong>${safeText(row.name)}</strong><br>
                  <small style="color:var(--muted);">${safeText(row.address)}</small>
                </td>
                <td>${row.blocks || "-"} Blok · ${row.apartments} Daire</td>
                <td><strong>%${row.collectionRate}</strong></td>
                <td style="color:var(--danger); font-weight:700;">${money(row.pending)}</td>
                <td>${row.openRequests} adet</td>
                <td><span class="status ${row.score >= 75 ? "ok" : row.score >= 60 ? "warn" : "danger"}">${row.score} · ${row.status}</span></td>
                <td style="text-align:right;">
                  ${row.siteId === state.activeSiteId ? `<span class="status ok">Aktif</span>` : `<button class="btn" style="padding:5px 12px; font-size:12.5px;" onclick="switchSite('${row.siteId}')">Yönet</button>`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <!-- 4. Yeni Site Ekleme Formu -->
    ${
      API_BASE
        ? `<section class="section" style="margin-top:24px">
            <div class="section-header">
              <div>
                <h2>Portföye Yeni Site Ekle</h2>
                <p>Yönetimine başladığınız yeni bir site veya apartmanı sisteme tanımlayın.</p>
              </div>
            </div>
            <form class="form-grid wide" onsubmit="createSite(event)">
              <label>Site / Apartman Adı<input name="name" required placeholder="Örn. Palmiye Konakları veya Çınar Sitesi" /></label>
              <label>Adres & Konum<input name="address" placeholder="İlçe, İl (Örn: Kadıköy, İstanbul)" /></label>
              <button class="btn primary" type="submit" style="align-self:end;">Siteyi Sisteme Ekle</button>
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
  const unpaidDues = dues.filter((due) => due.status !== "paid");
  const totalUnpaid = unpaidDues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const requests = scoped.requests.filter((request) => request.apartmentId === apt?.id);
  const openRequests = requests.filter((r) => !["cozuldu", "reddedildi"].includes(r.status));
  const announcements = scoped.announcements || [];
  const unreadAnnouncements = unreadAnnouncementsForSession();
  const activeSurveys = (scoped.surveys || []).filter((s) => s.status === "active");
  const user = state.sessionUser;
  const userVotedSurveys = activeSurveys.filter((s) => (s.votes || []).some((v) => v.userId === user?.id || (apt && v.apartmentId === apt.id)));

  // Finansal Şeffaflık
  const totalSiteIncome = scoped.dues.filter((d) => d.status === "paid").reduce((sum, d) => sum + (d.amount || 0), 0);
  const siteExpenses = (scoped.expenses || []).slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const totalSiteExpense = siteExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const siteVaultBalance = totalSiteIncome - totalSiteExpense;
  const recentExpenses = siteExpenses.slice(0, 3);
  const res = currentResident();
  const block = scoped.blocks.find((b) => b.id === apt?.blockId);

  return `
    <div class="resident-shell">
      <!-- Sakin Karşılama Kartı -->
      <section class="resident-welcome-card modern-card">
        <div class="resident-welcome-main">
          <div class="user-avatar-circle" style="width:48px; height:48px; font-size:18px;">
            <span>${(res?.name || "S").slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h2 style="margin:0; font-size:18px;">Hoş Geldiniz, ${safeText(res?.name || "Sakin")}</h2>
              <span class="status ok" style="font-size:11.5px;">${res?.occupancyType === "tenant" ? "Kiracı" : "Kat Maliki"}</span>
            </div>
            <p style="margin:4px 0 0; font-size:13px; color:var(--text-sub);">
              🏢 ${safeText(block?.name || "Blok")}, No: ${apt?.no || "-"} (Kat: ${apt?.floor || "-"}) • ${safeText(activeSite()?.name || "Apartman")}
            </p>
          </div>
        </div>
        <button type="button" class="btn text-btn" onclick="setState({ view: 'profile' })" style="font-size:12.5px; border:1px solid var(--line); padding:6px 12px; border-radius:8px;">
          👤 Daire & Profilimi Düzenle →
        </button>
      </section>

      <!-- 4 İnteraktif Metrik Kartı -->
      <div class="stats-grid" style="margin-top:16px;">
        <!-- Aidat Kartı -->
        <section class="stat-card modern-card interactive-dash-card ${totalUnpaid > 0 ? "card-metric-due-warn" : "card-metric-dues"}" onclick="document.getElementById('resident-dues-section')?.scrollIntoView({ behavior: 'smooth' })" title="Aidat Detaylarına Git">
          <div class="stat-card-top">
            <span class="stat-icon">💳</span>
            <span class="badge ${totalUnpaid > 0 ? "warn" : "ok"}">${totalUnpaid > 0 ? `${unpaidDues.length} Dönem Borç` : "Ödemeler Tamam"}</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Toplam Borç Bakiyesi</span>
            <div class="stat-value" style="color:${totalUnpaid > 0 ? 'var(--danger)' : 'var(--accent)'};">${money(totalUnpaid)}</div>
          </div>
          <small class="metric-sub">${totalUnpaid > 0 ? `Son ödeme: ${dateText(unpaidDues[0]?.dueDate)}` : "Tüm aidatlarınız ödendi"}</small>
          <div class="card-action-hint">Borç Dökümünü İncele ↓</div>
        </section>

        <!-- Açık Talepler Kartı -->
        <section class="stat-card modern-card interactive-dash-card card-metric-reqs" onclick="setState({ view: 'resident-request' })" title="Arıza ve Talep Bildir">
          <div class="stat-card-top">
            <span class="stat-icon">🛠️</span>
            <span class="badge ${openRequests.length > 0 ? "info" : "neutral"}">${openRequests.length > 0 ? `${openRequests.length} Açık` : "Sorun Yok"}</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Taleplerim & Bildirimler</span>
            <div class="stat-value">${requests.length} Kayıt</div>
          </div>
          <small class="metric-sub">${openRequests.length > 0 ? "Yönetim inceliyor / usta yönlendirildi" : "Aktif arıza talebiniz yok"}</small>
          <div class="card-action-hint">Yeni Talep Aç →</div>
        </section>

        <!-- Duyurular Kartı -->
        <section class="stat-card modern-card interactive-dash-card card-metric-ann" onclick="setState({ view: 'resident-announcements' })" title="Duyuruları Görüntüle">
          <div class="stat-card-top">
            <span class="stat-icon">📢</span>
            <span class="badge ${unreadAnnouncements.length > 0 ? "warn" : "neutral"}">${unreadAnnouncements.length > 0 ? `${unreadAnnouncements.length} Yeni` : "Hepsi Okundu"}</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Yönetim Duyuruları</span>
            <div class="stat-value">${announcements.length} Duyuru</div>
          </div>
          <small class="metric-sub">${announcements.length ? safeText(announcements[announcements.length - 1]?.title.slice(0, 28)) + "..." : "Yayınlanmış duyuru"}</small>
          <div class="card-action-hint">Duyuruları Oku →</div>
        </section>

        <!-- Anket & Kararlar Kartı -->
        <section class="stat-card modern-card interactive-dash-card card-metric-surv" onclick="setState({ view: 'resident-surveys' })" title="Anketlere Oy Ver">
          <div class="stat-card-top">
            <span class="stat-icon">🗳️</span>
            <span class="badge ${activeSurveys.length > userVotedSurveys.length ? "warn" : "ok"}">${activeSurveys.length > userVotedSurveys.length ? "Oyunuz Bekleniyor" : "Oylar Verildi"}</span>
          </div>
          <div class="stat-content">
            <span class="stat-label">Site Karar Anketleri</span>
            <div class="stat-value">${activeSurveys.length} Aktif Anket</div>
          </div>
          <small class="metric-sub">${activeSurveys.length > userVotedSurveys.length ? "1 karar oylamasına henüz oy vermediniz" : "Görüşleriniz yönetime iletildi"}</small>
          <div class="card-action-hint">Anketlere Katıl →</div>
        </section>
      </div>

      <!-- Alt Detay Bölümleri -->
      <div class="split" style="margin-top:20px; align-items:start;">
        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- Borç Durumu & Ödeme Listesi -->
          <section id="resident-dues-section" class="section modern-card">
            <div class="section-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">💳</span>
                <div>
                  <h3 style="margin:0; font-size:16px;">Aidat ve Borç Geçmişim</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">${apartmentLabel(apt?.id)} için kayıtlı tahakkuklar.</p>
                </div>
              </div>
              ${totalUnpaid > 0 ? `<span class="status warn">${money(totalUnpaid)} Borç</span>` : `<span class="status ok">Borç Yok</span>`}
            </div>
            <div class="resident-dues-list" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
              ${
                dues.length
                  ? dues.map((due) => `
                    <div class="notice" style="display:flex; justify-content:space-between; align-items:center; margin:0; flex-wrap:wrap; gap:8px;">
                      <div>
                        <strong>${due.period} Dönemi</strong>
                        <div style="color:var(--muted); font-size:12px;">Son Ödeme: ${dateText(due.dueDate)}</div>
                      </div>
                      <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                        <div style="font-weight:700; font-size:15px;">${money(due.amount)}</div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <span class="status ${statusClass(due.status)}">${dueStatusText(due.status)}</span>
                          ${due.status !== "paid"
                            ? `<button type="button" class="btn primary btn-sm" onclick="openPaymentModal('${due.id}')" style="padding:3px 10px; font-size:11.5px; border-radius:6px; font-weight:700;">💳 Kartla Öde</button>`
                            : `<button type="button" class="btn text-btn btn-sm" onclick="showReceiptModal('${due.id}')" style="padding:2px 8px; font-size:11px; border:1px solid var(--line); border-radius:6px;">🧾 Dekont Gör</button>`
                          }
                        </div>
                      </div>
                    </div>
                  `).join("")
                  : `<div class="empty">Kayıtlı aidat bilgisi bulunamadı.</div>`
              }
            </div>
          </section>

          <!-- Açık Taleplerim -->
          <section class="section modern-card interactive-dash-card" onclick="setState({ view: 'resident-request' })" title="Talepler Sayfasına Git">
            <div class="section-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">🛠️</span>
                <div>
                  <h3 style="margin:0; font-size:16px;">Açık Destek Taleplerim</h3>
                  <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">Apartman yönetimine ilettiğiniz arıza veya şikayetler.</p>
                </div>
              </div>
              <span class="card-action-hint" style="margin:0;">Tümünü Yönet →</span>
            </div>
            ${
              requests.length
                ? requests.slice(-2).reverse().map((request) => `
                  <div class="notice" style="margin-top:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong>${safeText(request.title)}</strong>
                      <span class="status ${statusClass(request.status)}">${requestStatusText(request.status)}</span>
                    </div>
                    <p style="margin:4px 0 0; font-size:12.5px; color:var(--text-sub);">${safeText(request.aiSummary || request.description)}</p>
                  </div>
                `).join("")
                : `<div class="empty" style="padding:14px;">Açık talep bulunmuyor. Yeni bir arıza veya öneri bildirebilirsiniz.</div>`
            }
          </section>
        </div>

        <!-- Şeffaf Kasa & Ortak Harcama Özeti -->
        <section class="section modern-card resident-vault-card">
          <div class="section-header">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px;">💰</span>
                <h3 style="margin:0; font-size:16px;">Site Kasası & Şeffaf Gider Özeti</h3>
              </div>
              <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">Yönetim harcamaları tüm sakinlerle şeffaf olarak paylaşılır.</p>
            </div>
          </div>
          <div class="resident-vault-grid">
            <div class="resident-vault-stat">
              <span>Güncel Kasa Bakiyesi</span>
              <strong style="color: ${siteVaultBalance >= 0 ? 'var(--accent)' : 'var(--danger)'};">${money(siteVaultBalance)}</strong>
            </div>
            <div class="resident-vault-stat">
              <span>Toplam Yapılan Harcama</span>
              <strong>${money(totalSiteExpense)}</strong>
            </div>
          </div>
          ${
            recentExpenses.length
              ? `
              <div style="margin-top:14px; border-top:1px solid var(--line); padding-top:10px;">
                <span style="font-size:11.5px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.04em;">Son Ortak Harcamalar:</span>
                <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                  ${recentExpenses.map((exp) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; padding:8px 10px; background:rgba(255,255,255,0.7); border-radius:8px; border:1px solid var(--line);">
                      <div>
                        <strong>${safeText(exp.title)}</strong>
                        <div style="color:var(--muted); font-size:11px;">${dateText(exp.date)} ${exp.vendor ? `• ${safeText(exp.vendor)}` : ""}</div>
                      </div>
                      <span style="font-weight:700; color:var(--danger); white-space:nowrap;">-${money(exp.amount)}</span>
                    </div>
                  `).join("")}
                </div>
              </div>`
              : `<div class="empty" style="margin-top:10px; font-size:12px;">Henüz kaydedilmiş harcama yok.</div>`
          }
        </section>
      </div>
    </div>
  `;
}

async function uploadProfilePhoto(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Fotoğraf boyutu 5 MB'dan küçük olmalıdır.");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const avatarUrl = e.target.result;
    const token = getToken();
    if (token && API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: avatarUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fotoğraf yüklenemedi.");
        if (data.user) {
          state.sessionUser = { ...state.sessionUser, ...data.user };
          localStorage.setItem(SESSION_KEY, JSON.stringify(state.sessionUser));
        }
        if (data.resident) {
          const idx = state.residents.findIndex((r) => r.id === data.resident.id);
          if (idx !== -1) {
            state.residents[idx] = { ...state.residents[idx], ...data.resident };
          }
        }
      } catch (err) {
        alert(err.message);
        return;
      }
    } else {
      if (state.sessionUser) {
        state.sessionUser.avatar = avatarUrl;
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.sessionUser));
      }
      const resObj = currentResident();
      if (resObj) resObj.avatar = avatarUrl;
    }
    playNotificationSound();
    render();
  };
  reader.readAsDataURL(file);
}

function profileView() {
  const user = state.sessionUser || {
    name: "Misafir Kullanıcı",
    email: "user@apartai.local",
    role: state.mode === "manager" ? "admin" : "resident",
  };
  const isResident = user.role === "resident";
  const resident = currentResident() || {};
  const apt = residentApartment();
  const block = scoped.blocks.find((b) => b.id === apt?.blockId);
  const site = activeSite();

  return `
    <div class="profile-container">
      <!-- Profil Başlık Kartı / Hero -->
      <section class="profile-hero-card modern-card">
        <div class="profile-hero-content">
          <div class="profile-avatar-large" title="Profil Fotoğrafı">
            ${user.avatar
              ? `<img src="${escapeAttr(user.avatar)}" class="profile-avatar-img" alt="${safeText(user.name)}" />`
              : `<span>${(user.name || "U").slice(0, 2).toUpperCase()}</span>`
            }
            <label class="avatar-upload-overlay" title="Fotoğraf Değiştir">
              <span>📷 Değiştir</span>
              <input type="file" accept="image/*" style="display:none;" onchange="uploadProfilePhoto(this)" />
            </label>
          </div>
          <div class="profile-hero-info">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h2 style="margin:0; font-size:22px; font-weight:700;">${safeText(user.name || "Kullanıcı")}</h2>
              <span class="status ${isResident ? "ok" : "info"}">${isResident ? "Sakin & Daire Sakini" : "Yönetici & Admin"}</span>
              <label class="btn text-btn btn-sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:6px; font-size:11px; padding:3px 8px;">
                📷 Fotoğraf Yükle
                <input type="file" accept="image/*" style="display:none;" onchange="uploadProfilePhoto(this)" />
              </label>
            </div>
            <p style="margin:4px 0 0; color:var(--muted); font-size:13.5px;">${safeText(user.email)} • ${safeText(user.phone || "Telefon belirtilmedi")}</p>
            ${
              isResident && apt
                ? `<div class="profile-hero-badges">
                    <span class="profile-tag">🏢 ${safeText(site?.name || "Apartman")}</span>
                    <span class="profile-tag">🚪 ${safeText(block?.name || "Blok")} - No: ${apt.no} (Kat: ${apt.floor})</span>
                    <span class="profile-tag">🔑 ${resident.occupancyType === "tenant" ? "Kiracı" : "Ev Sahibi (Kat Maliki)"}</span>
                    ${resident.plateNumber ? `<span class="profile-tag">🚗 ${safeText(resident.plateNumber)}</span>` : ""}
                  </div>`
                : `<div class="profile-hero-badges">
                    <span class="profile-tag">🏢 Yönetilen Site: ${safeText(site?.name || "Tüm Siteler")}</span>
                    <span class="profile-tag">⚡ Sistem Yetkilisi</span>
                  </div>`
            }
          </div>
        </div>
      </section>

      <!-- Daire & Blok Bilgi Özeti (Sadece Sakin İçin) -->
      ${
        isResident
          ? `
          <div class="profile-info-grid">
            <div class="profile-info-box">
              <span class="info-label">Bağlı Olduğu Site</span>
              <strong class="info-val">${safeText(site?.name || "Apartman")}</strong>
              <small>${safeText(site?.address || "Kadıköy / İstanbul")}</small>
            </div>
            <div class="profile-info-box">
              <span class="info-label">Blok & Kat</span>
              <strong class="info-val">${safeText(block?.name || "-")}, Kat ${apt?.floor ?? "-"}</strong>
              <small>Daire Numarası: ${apt?.no ?? "-"}</small>
            </div>
            <div class="profile-info-box">
              <span class="info-label">Mülkiyet Durumu</span>
              <strong class="info-val" style="color:var(--accent);">${resident.occupancyType === "tenant" ? "Kiracı" : "Kat Maliki (Ev Sahibi)"}</strong>
              <small>Temsil yetkisi aktiftir</small>
            </div>
            <div class="profile-info-box">
              <span class="info-label">Kayıtlı Araç Plakası</span>
              <strong class="info-val">${safeText(resident.plateNumber || "Plaka Girilmedi")}</strong>
              <small>Otopark otomatik tanıma</small>
            </div>
          </div>
          `
          : ""
      }

      <div class="split" style="margin-top:20px; align-items:start;">
        <!-- Profil & Kişisel / Daire Bilgileri Düzenleme -->
        <section class="section modern-card">
          <div class="section-header">
            <div>
              <h3>👤 Kişisel ve Daire Bilgilerini Güncelle</h3>
              <p style="margin:2px 0 0; font-size:12.5px; color:var(--muted);">İletişim, araç ve acil durum irtibatlarınızı güncel tutun.</p>
            </div>
          </div>

          <form class="grid" onsubmit="saveProfile(event)">
            <div class="form-row-2">
              <label>
                <span>Ad Soyad</span>
                <input name="name" required value="${safeText(user.name || "")}" placeholder="Adınız Soyadınız" />
              </label>
              <label>
                <span>Telefon</span>
                <input name="phone" required value="${safeText(user.phone || "")}" placeholder="05xx xxx xx xx" />
              </label>
            </div>

            <label>
              <span>E-posta Adresi</span>
              <input name="email" type="email" required value="${safeText(user.email || "")}" placeholder="ornek@posta.com" />
            </label>

            ${
              isResident
                ? `
                <div class="form-row-2">
                  <label>
                    <span>Mülkiyet Statüsü</span>
                    <select name="occupancyType">
                      <option value="owner" ${resident.occupancyType !== "tenant" ? "selected" : ""}>Ev Sahibi (Kat Maliki)</option>
                      <option value="tenant" ${resident.occupancyType === "tenant" ? "selected" : ""}>Kiracı</option>
                    </select>
                  </label>
                  <label>
                    <span>Araç Plakası</span>
                    <input name="plateNumber" value="${safeText(resident.plateNumber || "")}" placeholder="34 ABC 123" />
                  </label>
                </div>

                <label>
                  <span>Acil Durum İrtibatı (Kişi ve Telefon)</span>
                  <input name="emergencyContact" value="${safeText(resident.emergencyContact || "")}" placeholder="Örn: Ahmet Yılmaz (0532 000 00 00)" />
                  <small style="color:var(--muted); font-size:11.5px; margin-top:3px; display:block;">Su baskını, yangın, deprem vb. acil durumlarda ulaşılabilecek yakın.</small>
                </label>
                `
                : ""
            }

            <div style="border-top:1px solid var(--line); padding-top:16px; margin-top:8px;">
              <h4 style="margin:0 0 10px; font-size:14px; color:var(--text); display:flex; align-items:center; gap:6px;">
                <span>🔒</span> Şifre Değiştir (İsteğe Bağlı)
              </h4>
              <div class="form-row-3">
                <label>
                  <span style="font-size:12px;">Mevcut Şifre</span>
                  <input name="currentPassword" type="password" placeholder="••••••" />
                </label>
                <label>
                  <span style="font-size:12px;">Yeni Şifre</span>
                  <input name="newPassword" type="password" placeholder="En az 6 karakter" />
                </label>
                <label>
                  <span style="font-size:12px;">Yeni Şifre Tekrar</span>
                  <input name="confirmPassword" type="password" placeholder="En az 6 karakter" />
                </label>
              </div>
            </div>

            <div style="margin-top:14px; display:flex; justify-content:flex-end;">
              <button type="submit" class="btn btn-primary" style="padding:10px 22px; font-weight:600;">
                💾 Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        </section>

        <!-- Güvenlik & Bildirim Tercihleri Kartı -->
        <section class="section modern-card">
          <div class="section-header">
            <div>
              <h3>🔔 Bildirim & Tercihler</h3>
              <p style="margin:2px 0 0; font-size:12.5px; color:var(--muted);">Sesli uyarı ve oturum tercihlerinizi yönetin.</p>
            </div>
          </div>

          <div class="preference-list">
            <div class="preference-item">
              <div>
                <strong>🔊 Sesli Bildirim Uyarısı</strong>
                <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">Yeni duyuru ve talep bildirimlerinde akustik zil çal.</p>
              </div>
              <button type="button" class="btn text-btn" onclick="playNotificationSound()" style="font-size:12px; border:1px solid var(--line); padding:4px 8px;">
                🔔 Sesi Sına
              </button>
            </div>

            <div class="preference-item">
              <div>
                <strong>📱 Mobil Hızlı Erişim (PWA)</strong>
                <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">Uygulamayı telefon ana ekranına ekleyerek tek tıkla açın.</p>
              </div>
              <button type="button" class="btn text-btn" onclick="showPwaInfo()" style="font-size:12px; border:1px solid var(--line); padding:4px 10px;">Bilgi</button>
            </div>

            <div class="preference-item" style="border-top:1px solid var(--line); padding-top:12px;">
              <div>
                <strong style="color:var(--danger);">🚪 Oturumu Kapat</strong>
                <p style="margin:2px 0 0; font-size:12px; color:var(--muted);">Mevcut hesaptan güvenli bir şekilde çıkış yapın.</p>
              </div>
              <button type="button" class="btn" style="background:#fee2e2; color:#b91c1c; border-color:#fca5a5; font-size:12px; font-weight:600;" onclick="logoutUser()">Çıkış Yap</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

async function saveProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = (formData.get("name") || "").trim();
  const phone = (formData.get("phone") || "").trim();
  const email = (formData.get("email") || "").trim();
  const occupancyType = formData.get("occupancyType") || undefined;
  const plateNumber = (formData.get("plateNumber") || "").trim();
  const emergencyContact = (formData.get("emergencyContact") || "").trim();
  const currentPassword = (formData.get("currentPassword") || "").trim();
  const newPassword = (formData.get("newPassword") || "").trim();
  const confirmPassword = (formData.get("confirmPassword") || "").trim();

  if (newPassword) {
    if (newPassword.length < 6) {
      alert("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Yeni şifreler birbiriyle uyuşmuyor.");
      return;
    }
    if (!currentPassword) {
      alert("Şifre değiştirmek için mevcut şifrenizi girmelisiniz.");
      return;
    }
  }

  const payload = {
    name,
    phone,
    email,
    ...(occupancyType ? { occupancyType } : {}),
    plateNumber,
    emergencyContact,
    ...(newPassword ? { currentPassword, newPassword } : {}),
  };

  try {
    const token = getToken();
    if (token) {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profil güncellenemedi.");
      }
      if (data.user) {
        state.sessionUser = { ...state.sessionUser, ...data.user };
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.sessionUser));
      }
      if (data.resident) {
        const idx = state.residents.findIndex((r) => r.id === data.resident.id);
        if (idx !== -1) {
          state.residents[idx] = { ...state.residents[idx], ...data.resident };
        }
      }
    } else {
      // Local fallback
      if (state.sessionUser) {
        state.sessionUser.name = name;
        state.sessionUser.phone = phone;
        state.sessionUser.email = email;
      }
      const resObj = currentResident();
      if (resObj) {
        resObj.name = name;
        resObj.phone = phone;
        resObj.email = email;
        if (occupancyType) resObj.occupancyType = occupancyType;
        resObj.plateNumber = plateNumber;
        resObj.emergencyContact = emergencyContact;
      }
    }
    playNotificationSound();
    alert("Profil ve daire bilgileriniz başarıyla güncellendi.");
    render();
  } catch (err) {
    alert(err.message || "Güncelleme sırasında bir hata oluştu.");
  }
}


const REQUEST_CATEGORY_TEMPLATES = {
  fault: [
    { label: "🛗 Asansör Arızası", category: "Asansör", defaultTitle: "Asansör Çalışmıyor / Arızalandı", placeholder: "Asansör hangi katta kaldı? Ses veya sarsıntı var mı?" },
    { label: "💧 Su Kaçağı & Tesisat", category: "Sıhhi Tesisat", defaultTitle: "Bina Tesisatında Su Kaçağı", placeholder: "Su sızıntısının yeri ve akış yoğunluğu nedir?" },
    { label: "⚡ Ortak Alan Aydınlatması", category: "Elektrik", defaultTitle: "Merdiven / Otopark Aydınlatması Yanmıyor", placeholder: "Hangi blok ve katın lambası sönük?" },
    { label: "🚪 Giriş Kapısı & İnterkom", category: "İnterkom & Kapı", defaultTitle: "Bina Ana Giriş Kapısı Kapanmıyor", placeholder: "Manyetik kilit veya otomatikte sorun nedir?" },
    { label: "🧱 Çatı & İzolasyon", category: "Çatı", defaultTitle: "Yağmur Suyu / Çatı İzolasyon Sızıntısı", placeholder: "Hangi alana su sızıyor?" },
    { label: "🏊 Havuz & Peyzaj", category: "Havuz & Peyzaj", defaultTitle: "Havuz Bakımı / Bahçe Sulama Sorunu", placeholder: "Havuz veya yeşil alandaki arıza detayı:" },
  ],
  complaint: [
    { label: "🔊 Gürültü ve Saat Dışı Rahatsızlık", category: "Gürültü ve Huzursuzluk", defaultTitle: "Saat Dışı Yüksek Müzik ve Gürültü Şikayeti", placeholder: "Gürültünün saati, geldiği tahmini daire veya alan:" },
    { label: "🚗 Otopark & Hatalı Park", category: "Otopark İhlali", defaultTitle: "Hatalı Araç Parkı ve Yol Engelleme", placeholder: "Araç plakası ve kapattığı geçiş alanı:" },
    { label: "🗑️ Çöp & Hijyen / Koridor", category: "Çöp & Hijyen", defaultTitle: "Kat Koridorunda Çöp ve Koku Şikayeti", placeholder: "Sorunun yaşandığı kat veya ortak alan:" },
    { label: "🐕 Evcil Hayvan Kuralları", category: "Evcil Hayvan Kuralları", defaultTitle: "Ortak Alanda Tasma/Temizlik İhlali", placeholder: "Yaşanan ihlali ve yeri belirtiniz:" },
    { label: "📦 Ortak Alan İşgali", category: "Ortak Alan İşgali", defaultTitle: "Yangın Merdiveni / Koridor İşgali", placeholder: "Geçişi engelleyen eşyalar ve kat bilgisi:" },
    { label: "👮 Güvenlik & Bina Girişi", category: "Güvenlik İhlali", defaultTitle: "Yabancı Kişilerin Girişi / Güvenlik Zaafiyeti", placeholder: "Gözlemlenen güvenlik açığı:" },
  ],
  suggestion: [
    { label: "🌿 Bahçe & Peyzaj İyileştirmesi", category: "Peyzaj & Bahçe", defaultTitle: "Site Bahçesine Yeni Ağaç ve Çiçeklendirme Önerisi", placeholder: "Planlanan peyzaj fikriniz:" },
    { label: "💡 Sensörlü Aydınlatma & Enerji", category: "Enerji Tasarrufu", defaultTitle: "Ortak Alanlara LED/Sensörlü Lamba Önerisi", placeholder: "Enerji tasarrufu sağlayacak fikir:" },
    { label: "📹 Güvenlik Kamerası Takviyesi", category: "Güvenlik Kamerası", defaultTitle: "Kör Noktalara Ek Kamera Konulması Önerisi", placeholder: "Kamera yerleştirilmesi önerilen noktalar:" },
    { label: "♻️ Geri Dönüşüm / Sıfır Atık", category: "Sıfır Atık & Geri Dönüşüm", defaultTitle: "Siteye Sıfır Atık / Geri Dönüşüm Kutusu Önerisi", placeholder: "Atık kutuları için önerilen yer:" },
    { label: "🚲 Bisiklet Park Yeri", category: "Sosyal Alanlar", defaultTitle: "Kapalı Bisiklet Park Alanı Düzenleme Önerisi", placeholder: "Bisiklet alanı için düşünülen nokta:" },
    { label: "☕ Sosyal Alan & Çocuk Parkı", category: "Sosyal Alanlar", defaultTitle: "Çocuk Oyun Parkının Zemin Yenileme Önerisi", placeholder: "Sosyal alan iyileştirme tavsiyeniz:" },
  ],
};

function selectRequestTemplate(entryType, template) {
  const form = document.getElementById("resident-request-form");
  if (!form) return;
  const titleInput = form.querySelector('input[name="title"]');
  const catInput = form.querySelector('input[name="category"]');
  const descTextarea = form.querySelector('textarea[name="description"]');
  if (titleInput) titleInput.value = template.defaultTitle;
  if (catInput) catInput.value = template.category;
  if (descTextarea) {
    descTextarea.placeholder = template.placeholder;
    descTextarea.focus();
  }
}

function residentRequestView() {
  const apt = residentApartment();
  const currentType = state.residentRequestType || "fault";
  const templates = REQUEST_CATEGORY_TEMPLATES[currentType] || REQUEST_CATEGORY_TEMPLATES.fault;

  return `
    <div class="resident-shell">
      <section class="section modern-card">
        <div class="section-header">
          <div>
            <h2>Talep, Şikayet ve Öneri Bildir</h2>
            <p>${apartmentLabel(apt?.id)} adına resmi kayıt oluşturulur.</p>
          </div>
        </div>

        <!-- 1. Talep Türü Seçimi (Arıza / Şikayet / Öneri) -->
        <div class="request-type-segmented">
          <button type="button" class="req-type-btn ${currentType === "fault" ? "active" : ""}" data-type="fault" onclick="setState({ residentRequestType: 'fault' })">
            🛠️ Arıza Bildirimi
          </button>
          <button type="button" class="req-type-btn ${currentType === "complaint" ? "active" : ""}" data-type="complaint" onclick="setState({ residentRequestType: 'complaint' })">
            ⚠️ Şikayet Bildirimi
          </button>
          <button type="button" class="req-type-btn ${currentType === "suggestion" ? "active" : ""}" data-type="suggestion" onclick="setState({ residentRequestType: 'suggestion' })">
            💡 Öneri & İyileştirme
          </button>
        </div>

        <!-- 2. Hızlı Kategori Seçimi -->
        <div style="margin-bottom:14px;">
          <span style="font-size:12.5px; font-weight:600; color:var(--text); display:block; margin-bottom:8px;">Hızlı Kategori Seçimi (Otomatik Başlık ve Alan Doldurur):</span>
          <div class="category-chip-group">
            ${templates.map((tpl, i) => `
              <button type="button" class="category-chip" onclick='selectRequestTemplate("${currentType}", ${JSON.stringify(tpl)})'>
                ${tpl.label}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- 3. Form -->
        <form id="resident-request-form" class="grid" onsubmit="createResidentRequest(event)">
          <input type="hidden" name="entryType" value="${currentType}" />
          <input type="hidden" name="category" value="${templates[0]?.category || "Genel"}" />

          <label>
            <span>Başlık</span>
            <input name="title" required value="${safeText(templates[0]?.defaultTitle || "")}" placeholder="Örn: Asansör çalışmıyor veya Koridorda gürültü var" />
          </label>

          <div>
            <span style="font-size:13px; font-weight:650; color:var(--ink-secondary); display:block; margin-bottom:4px;">Öncelik Derecesi</span>
            <div class="priority-selector-grid">
              <label class="priority-pill priority-low">
                <input type="radio" name="urgency" value="Düşük" />
                <span class="priority-icon">🟢</span>
                <span>Düşük</span>
              </label>
              <label class="priority-pill priority-medium">
                <input type="radio" name="urgency" value="Orta" checked />
                <span class="priority-icon">🟡</span>
                <span>Normal / Orta</span>
              </label>
              <label class="priority-pill priority-high">
                <input type="radio" name="urgency" value="Yüksek" />
                <span class="priority-icon">🚨</span>
                <span style="font-weight:750;">Acil</span>
              </label>
            </div>
          </div>

          <label>
            <span>Açıklama</span>
            <textarea name="description" rows="4" required placeholder="${escapeAttr(templates[0]?.placeholder || "Sorunu veya talebinizi detaylıca açıklayınız...")}"></textarea>
          </label>

          <label>
            <span>Fotoğraf Ekle (Opsiyonel)</span>
            <input name="photo" type="file" accept="image/*" onchange="previewRequestPhoto(this)" />
          </label>
          <div id="request-photo-preview" class="upload-preview"></div>

          <button class="btn primary" type="submit" style="padding:12px; font-size:15px; font-weight:700; margin-top:6px;">
            🚀 AI ile Analiz Et ve Yönetime Gönder
          </button>
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

function createExpense(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const title = String(form.get("title") || "").trim();
  const category = String(form.get("category") || "other").trim();
  const amount = Number(form.get("amount"));
  const date = String(form.get("date") || "").trim();
  const vendor = String(form.get("vendor") || "").trim();
  const invoiceNo = String(form.get("invoiceNo") || "").trim();
  const description = String(form.get("description") || "").trim();

  if (!title || !amount || amount <= 0) {
    alert("Lütfen geçerli bir başlık ve tutar girin.");
    return;
  }

  const payload = {
    siteId: state.activeSiteId,
    title,
    category,
    amount,
    date: date || new Date().toISOString().slice(0, 10),
    vendor,
    invoiceNo,
    description,
  };

  if (API_BASE) {
    apiRequest(`/expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((result) => {
        applyServerData(result.data || result);
        event.target.reset();
      })
      .catch((error) => alert(error.message));
    return;
  }

  const newExpense = {
    id: id("exp"),
    ...payload,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  state.expenses = [...(state.expenses || []), newExpense];
  saveState();
  render();
  event.target.reset();
}

function deleteExpense(expenseId) {
  if (!confirm("Bu harcama kaydını silmek istediğinize emin misiniz? Kasa bakiyesi güncellenecektir.")) return;
  if (API_BASE) {
    apiRequest(`/expenses/${encodeURIComponent(expenseId)}`, {
      method: "DELETE",
    })
      .then((result) => {
        applyServerData(result.data || result);
      })
      .catch((error) => alert(error.message));
    return;
  }
  state.expenses = (state.expenses || []).filter((e) => e.id !== expenseId);
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

function showPwaInfo() {
  alert("ApartAI mobil uyumlu bir web uygulamasıdır. Akıllı telefonunuzda Safari veya Chrome tarayıcısının Paylaş veya Menü kısmından 'Ana Ekrana Ekle' seçeneğini kullanarak uygulamayı tek dokunuşla tam ekran kullanabilirsiniz.");
}

function logoutUser() {
  setToken(null);
  saveSession(null);
  try {
    localStorage.removeItem(ACTIVE_VIEW_KEY);
    history.replaceState(null, "", " ");
  } catch (e) {}
  state.sessionUser = null;
  state.mode = "manager";
  state.view = "dashboard";
  state.isAssistantOpen = false;
  state.mobileNavOpen = false;
  document.body.classList.remove("resident-mode", "manager-mode", "ai-chat-open");
  render();
}

function logout() {
  logoutUser();
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
  const entryType = safeText(form.get("entryType") || state.residentRequestType || "fault");
  const category = safeText(form.get("category") || "Genel");
  const urgency = safeText(form.get("urgency") || "Orta");
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
      body: JSON.stringify({ apartmentId: apartment.id, title, description, photoDataUrl, entryType, category, urgency }),
    })
      .then((result) => {
        event.target.reset();
        alert("Talebiniz başarıyla oluşturuldu ve site yönetimine iletildi.");
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
      entryType,
      category: category || ai.category,
      title,
      description,
      photoDataUrl,
      urgency: urgency || ai.urgency,
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
  alert("Talebiniz başarıyla oluşturuldu.");
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
  const reqStats = requestStats();
  const requests = { ...reqStats, total: scoped.requests.length };
  const vendors = vendorPerformance() || [];
  const expenses = scoped.expenses || [];
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const vaultBalance = dues.paid - totalExpense;

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
              <span class="bulletin-box-title">Güncel Kasa Bakiyesi</span>
              <div class="bulletin-score-num" style="color:${vaultBalance >= 0 ? '#059669' : '#dc2626'};">${money(vaultBalance)}</div>
              <div class="bulletin-box-sub">Gider: ${money(totalExpense)}</div>
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
                  <tr>
                    <td>Ortak Alan Harcamaları & Giderler</td>
                    <td>-</td>
                    <td>${money(totalExpense)}</td>
                    <td><strong>Kasa: ${money(vaultBalance)}</strong></td>
                    <td><span style="color:${vaultBalance >= 0 ? '#059669' : '#dc2626'}; font-weight:600;">${vaultBalance >= 0 ? 'Kasa Pozitif' : 'Kasa Negatif'}</span></td>
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
                  <tr><th>Firma / Tedarikçi</th><th>Hizmet Alanı</th><th>İş Sayısı</th><th>Ort. Çözüm Süresi</th><th>Performans / Durum</th></tr>
                </thead>
                <tbody>
                  ${
                    vendors.length
                      ? vendors.map((v) => `
                        <tr>
                          <td><strong>${safeText(v.assignee || v.name || "-")}</strong></td>
                          <td>${safeText(v.category || "Genel")}</td>
                          <td>${v.total} iş (${v.resolved} çözüldü)</td>
                          <td>${v.avgDays !== null ? `${v.avgDays} gün` : "Açık takip"}</td>
                          <td><span class="status ${v.scoreStatus || "ok"}">${v.scoreText || "SLA Uygun"}</span></td>
                        </tr>
                      `).join("")
                      : `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:12px;">Henüz atanmış anlaşmalı firma kaydı bulunmamaktadır.</td></tr>`
                  }
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
          <p>Yönetim tarafından sitemiz için açılan anketlere oy verin, kararlara doğrudan katılın veya tercihinizi güncelleyin.</p>
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
          const isEditing = state.editingSurveyId === survey.id;

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

              ${!isClosed && (!hasVoted || isEditing) ? `
                <form onsubmit="castVote(event, '${survey.id}')">
                  <div class="survey-vote-options">
                    ${survey.options.map((opt, idx) => {
                      const isPreChecked = isEditing && userVote ? (userVote.optionIndex === idx || userVote.option === opt) : idx === 0;
                      return `
                        <label class="survey-vote-label" style="display:flex; align-items:center; gap:10px; padding:10px 14px; margin-bottom:8px; background:var(--surface-sunken); border:1px solid var(--border); border-radius:10px; cursor:pointer;">
                          <input type="radio" name="optionIndex" value="${idx}" required ${isPreChecked ? 'checked' : ''} />
                          <span style="font-weight:500;">${safeText(opt)}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                  <div style="display:flex; gap:10px; align-items:center; margin-top:10px;">
                    <button class="btn primary" type="submit">
                      ${isEditing ? '💾 Güncellenmiş Oyu Kaydet' : '✓ Oyu Kaydet'}
                    </button>
                    ${isEditing ? `<button type="button" class="btn text-btn" onclick="setState({ editingSurveyId: null })">Vazgeç</button>` : ''}
                  </div>
                </form>
              ` : `
                <div class="survey-results">
                  ${userVote ? `
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px; background:#f0fdfa; padding:8px 12px; border-radius:8px; border:1px solid #ccfbf1;">
                      <span style="font-size:13px; font-weight:600; color:var(--primary);">
                        Sizin Tercihiniz: <strong>"${safeText(userVote.option || (survey.options && survey.options[userVote.optionIndex]) || 'Oyunuz Kaydedildi')}"</strong>
                      </span>
                      ${!isClosed ? `
                        <button type="button" class="btn text-btn btn-sm" onclick="setState({ editingSurveyId: '${survey.id}' })" style="border:1px solid var(--line); border-radius:6px; padding:3px 10px; font-size:11.5px; font-weight:700;">
                          ✏️ Oyu Güncelle / Değiştir
                        </button>
                      ` : ''}
                    </div>
                  ` : ''}
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
        state.editingSurveyId = null;
        playNotificationSound();
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
  state.editingSurveyId = null;
  saveState();
  playNotificationSound();
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
    { view: "profile", icon: "👤", label: "Profilim" },
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
    { view: "finances", icon: "💰", label: "Kasa" },
    { view: "dues", icon: "💳", label: "Aidatlar" },
    { view: "requests", icon: "🛠️", label: "Talepler" },
    { view: "surveys", icon: "🗳️", label: "Anketler" },
    { view: "profile", icon: "👤", label: "Profil" },
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

function getAssistantHistoryKey() {
  const uid = state.sessionUser?.id || "guest";
  return `apartai_chat_v2_${uid}`;
}

function loadAssistantHistory() {
  try {
    const raw = localStorage.getItem(getAssistantHistoryKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAssistantHistory() {
  try {
    localStorage.setItem(getAssistantHistoryKey(), JSON.stringify(state.assistantMessages || []));
  } catch {}
}

function clearAssistantChat() {
  state.assistantMessages = [];
  try {
    localStorage.removeItem(getAssistantHistoryKey());
  } catch {}
  initAssistantWelcome();
  updateAssistantDOM();
  if (state.view === "ai-assistant") render();
}

function initAssistantWelcome() {
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
    initialText = `Merhaba ${safeText(name)}! Ben **ApartAI Akıllı Asistanınızım** 👋\n\nAidat borcunuz, arıza bildirimleriniz, şikayet veya önerilerinizle ilgili bana yazabilirsiniz. Talebinizi otomatik analiz edip yönetime iletirim.`;
    initialPrompts = [
      "Aidat borcum ne kadar?",
      "Asansör 3. katta kaldı ve ses yapıyor",
      "Üst kattan gece yüksek ses ve gürültü geliyor",
      "Bahçeye kedi evi ve kuş yemliği konulmasını öneriyorum",
    ];
  } else {
    initialText = `Merhaba Sayın Yöneticim! Ben **ApartAI Akıllı Asistanınızım** 🤖\n\nSitenizin tahsilat performansı, arıza yoğunlukları, sakin profili ve duyuru hazırlama süreçlerinde 7/24 yanınızdayım. Size nasıl yardımcı olabilirim?`;
    initialPrompts = [
      "Aidat tahsilat durumu nasıl?",
      "En çok hangi konuda arıza ve şikayet var?",
      "Asansör bakımı için duyuru taslağı yaz",
      "Sitede kaç kiracı, kaç ev sahibi var?",
    ];
  }

  state.assistantMessages = [
    {
      id: "aimsg-init",
      role: "assistant",
      content: initialText,
      suggestedPrompts: initialPrompts,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    },
  ];
  saveAssistantHistory();
}

function renderAssistantMessagesHtml() {
  if (!state.assistantMessages || state.assistantMessages.length === 0) {
    const saved = loadAssistantHistory();
    if (saved && saved.length > 0) {
      state.assistantMessages = saved;
    } else {
      initAssistantWelcome();
    }
  }

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

      <!-- AI Tarafından Algılanan Talep & Şikayet & Öneri Onay Kartı -->
      ${msg.suggestedRequest ? `
        <div class="ai-suggested-card">
          <div class="ai-suggested-header">
            <span class="status ${msg.suggestedRequest.entryType === "complaint" ? "complaint" : msg.suggestedRequest.entryType === "suggestion" ? "suggestion" : "fault"}">
              ${msg.suggestedRequest.entryType === "complaint" ? "⚠️ Şikayet Bildirimi Tespit Edildi" : msg.suggestedRequest.entryType === "suggestion" ? "💡 Öneri Bildirimi Tespit Edildi" : "🛠️ Arıza Bildirimi Tespit Edildi"}
            </span>
            <strong>${safeText(msg.suggestedRequest.title)}</strong>
          </div>
          <p style="margin:4px 0 0; font-size:13px; color:var(--text); line-height:1.5;">${safeText(msg.suggestedRequest.description)}</p>
          <div class="ai-suggested-meta">
            <span>Kategori: <strong>${safeText(msg.suggestedRequest.category)}</strong></span>
            <span>Öncelik: <strong>${safeText(msg.suggestedRequest.urgency)}</strong></span>
          </div>
          ${!msg.requestConfirmed ? `
            <div class="ai-suggested-actions">
              <button type="button" class="btn primary btn-sm" onclick="confirmAiSuggestedRequest('${msg.id}')">
                ✅ Onayla ve Yönetime Gönder
              </button>
              <button type="button" class="btn text-btn btn-sm" onclick="dismissAiSuggestedRequest('${msg.id}')">
                Vazgeç
              </button>
            </div>
          ` : `
            <div style="font-size:12px; color:var(--accent); font-weight:700; display:flex; align-items:center; gap:6px;">
              <span>✓</span> Resmi talep olarak site yönetimine iletildi.
            </div>
          `}
        </div>
      ` : ""}

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
  if (container) {
    const bodyEl = container.querySelector(".ai-chat-body");
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  }
  const pageContainer = document.querySelector("#ai-page-messages-container");
  if (pageContainer) {
    pageContainer.scrollTop = pageContainer.scrollHeight;
  }
}

function updateAssistantDOM() {
  document.body.classList.toggle("ai-chat-open", Boolean(state.isAssistantOpen));
  // 1. FAB widget'ı güncelle
  const container = document.querySelector("#ai-assistant-root");
  if (container) {
    const existingWindow = container.querySelector(".ai-chat-window");
    const existingBody = container.querySelector(".ai-chat-body");
    if (state.isAssistantOpen && existingWindow && existingBody) {
      existingBody.innerHTML = renderAssistantMessagesHtml();
      const sendBtn = container.querySelector(".ai-send-btn");
      if (sendBtn) sendBtn.disabled = Boolean(state.isAssistantLoading);
    } else {
      container.innerHTML = assistantWidgetMarkup();
    }
  }

  // 2. Eğer kullanıcı dedicated AI sayfasındaysa, orayı da anında güncelle
  const pageContainer = document.querySelector("#ai-page-messages-container");
  if (pageContainer) {
    pageContainer.innerHTML = renderAssistantMessagesHtml();
    const pageSendBtn = document.querySelector("#ai-page-send-btn");
    if (pageSendBtn) pageSendBtn.disabled = Boolean(state.isAssistantLoading);
  }

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
  document.body.classList.toggle("ai-chat-open", Boolean(state.isAssistantOpen));
  if (state.isAssistantOpen && (!state.assistantMessages || state.assistantMessages.length === 0)) {
    const saved = loadAssistantHistory();
    if (saved && saved.length > 0) {
      state.assistantMessages = saved;
    } else {
      initAssistantWelcome();
    }
  }
  updateAssistantDOM();
}

async function sendAssistantMessage(customText) {
  const inputEl = document.querySelector("#assistant-input") || document.querySelector("#ai-page-input");
  const text = (customText !== undefined && customText !== null ? String(customText) : (inputEl ? inputEl.value : "")).trim();
  if (!text || state.isAssistantLoading) return;

  const pageInput = document.querySelector("#ai-page-input");
  const widgetInput = document.querySelector("#assistant-input");
  if (pageInput) pageInput.value = "";
  if (widgetInput) widgetInput.value = "";

  const userMsg = {
    id: "msg-" + Date.now(),
    role: "user",
    content: text,
    time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };

  state.assistantMessages = [...(state.assistantMessages || []), userMsg];
  state.isAssistantLoading = true;
  saveAssistantHistory();
  updateAssistantDOM();
  scrollAssistantToBottom();

  try {
    let reply = "";
    let suggestedPrompts = [];
    let suggestedRequest = null;

    const minDelay = new Promise((resolve) => setTimeout(resolve, 600));

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
      suggestedRequest = res.suggestedRequest || null;
    } else {
      await minDelay;
      reply = `ApartAI Asistanı: "${safeText(text)}" sorunuz incelendi. Talebiniz analiz edilmiştir.`;
      suggestedPrompts = ["Aidat borcum ne kadar?", "Yeni arıza bildir"];
    }

    const assistantMsg = {
      id: "aimsg-" + Date.now(),
      role: "assistant",
      content: reply,
      suggestedPrompts,
      suggestedRequest,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };

    state.assistantMessages = [...state.assistantMessages, assistantMsg];
    state.isAssistantLoading = false;
    saveAssistantHistory();
    updateAssistantDOM();
    scrollAssistantToBottom();
  } catch (error) {
    state.assistantMessages = [
      ...state.assistantMessages,
      {
        id: "aimsg-err-" + Date.now(),
        role: "assistant",
        content: `⚠️ Yanıt oluşturulurken bir hata oluştu: ${safeText(error.message)}`,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    state.isAssistantLoading = false;
    saveAssistantHistory();
    updateAssistantDOM();
    scrollAssistantToBottom();
  }
}

async function confirmAiSuggestedRequest(msgId) {
  const msg = (state.assistantMessages || []).find((m) => m.id === msgId);
  if (!msg || !msg.suggestedRequest) return;
  const apt = residentApartment();
  if (!apt) {
    alert("Kayıtlı daire bulunamadı.");
    return;
  }

  const { entryType, category, title, description, urgency } = msg.suggestedRequest;

  if (API_BASE) {
    try {
      const res = await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({
          apartmentId: apt.id,
          title,
          description,
          entryType: entryType || "fault",
          category: category || "Genel",
          urgency: urgency || "Orta",
        }),
      });
      msg.requestConfirmed = true;
      const confirmReply = {
        id: "aimsg-confirm-" + Date.now(),
        role: "assistant",
        content: `✅ **Talebiniz başarıyla oluşturuldu ve site yönetimine iletildi!**\n\nTakip Kodu: \`${res.data?.requests?.[0]?.id || "REQ-OK"}\`\nYönetici incelediğinde veya bir teknik firma yönlendirildiğinde bildirim kutunuza bilgi iletilecektir.`,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      };
      state.assistantMessages = [...state.assistantMessages, confirmReply];
      saveAssistantHistory();
      playNotificationSound();
      applyServerData(res.data);
      updateAssistantDOM();
    } catch (err) {
      alert("Talep iletilemedi: " + err.message);
    }
  } else {
    msg.requestConfirmed = true;
    const reqId = id("req");
    state.requests = [
      ...state.requests,
      {
        id: reqId,
        siteId: apt.siteId,
        apartmentId: apt.id,
        entryType: entryType || "fault",
        category: category || "Genel",
        title,
        description,
        urgency: urgency || "Orta",
        status: "yeni",
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];
    const confirmReply = {
      id: "aimsg-confirm-" + Date.now(),
      role: "assistant",
      content: `✅ **Talebiniz başarıyla oluşturuldu ve site yönetimine iletildi!**\n\nTakip Kodu: \`${reqId}\`\nYönetim incelediğinde bildirim kutunuza bilgi düşecektir.`,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    state.assistantMessages = [...state.assistantMessages, confirmReply];
    saveAssistantHistory();
    playNotificationSound();
    saveState();
    render();
    updateAssistantDOM();
  }
}

function dismissAiSuggestedRequest(msgId) {
  const msg = (state.assistantMessages || []).find((m) => m.id === msgId);
  if (msg) {
    delete msg.suggestedRequest;
    saveAssistantHistory();
    updateAssistantDOM();
  }
}

/* ==========================================================================
   DEDICATED AI ASİSTAN SAYFASI (SOL MENÜ)
   ========================================================================== */
function aiAssistantPageView() {
  const isLoading = state.isAssistantLoading;
  const isResident = state.mode === "resident";

  return `
    <div class="ai-page-shell">
      <div class="ai-page-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="ai-avatar-icon" style="font-size:24px;">✨</div>
          <div>
            <h3 style="margin:0; font-size:17px; color:var(--text);">ApartAI Akıllı Asistan</h3>
            <span style="font-size:12px; color:var(--accent); font-weight:600; display:flex; align-items:center; gap:5px;">
              <span class="pulse-dot"></span> 7/24 Aktif • Otomatik Arıza, Şikayet & Öneri Sınıflandırıcısı
            </span>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn text-btn btn-sm" onclick="clearAssistantChat()" title="Sohbet geçmişini sıfırla">
            🗑️ Sohbeti Sıfırla
          </button>
        </div>
      </div>

      <div id="ai-page-messages-container" class="ai-page-messages">
        ${renderAssistantMessagesHtml()}
      </div>

      <div class="ai-page-footer">
        <form onsubmit="event.preventDefault(); sendAssistantMessage(document.querySelector('#ai-page-input')?.value);" style="display:flex; gap:10px;">
          <input
            id="ai-page-input"
            type="text"
            autocomplete="off"
            style="flex:1; padding:12px 16px; border-radius:12px; border:1px solid #cbd5e1; font-size:14px;"
            placeholder="${isResident ? "Örn: Üst komşu gece çok yüksek sesle müzik dinliyor, ne yapmalıyım?" : "Örn: Aidat tahsilat oranı nedir? Asansör bakımı için duyuru yaz..."}"
          />
          <button id="ai-page-send-btn" type="submit" class="btn primary" ${isLoading ? "disabled" : ""} style="padding:12px 20px; font-weight:700;">
            Gönder 🚀
          </button>
        </form>
      </div>
    </div>
  `;
}

function assistantWidgetMarkup() {
  const isOpen = state.isAssistantOpen;
  const isLoading = state.isAssistantLoading;

  return `
    ${isOpen ? `<div class="ai-chat-backdrop" onclick="toggleAssistant()" aria-label="Asistanı Kapat"></div>` : ""}
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
            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="btn text-btn btn-sm" onclick="clearAssistantChat()" title="Temizle" style="color:#ffffff; font-size:11px;">🗑️</button>
              <button type="button" class="ai-chat-close-btn" onclick="toggleAssistant()" aria-label="Kapat">×</button>
            </div>
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

// Tarayıcı İleri/Geri ve URL hash navigasyonu
window.addEventListener("hashchange", () => {
  const hashView = (location.hash || "").replace(/^#/, "").trim();
  if (hashView && hashView !== state.view) {
    const validView = getSavedActiveView(state.sessionUser?.role);
    if (validView && validView !== state.view) {
      state.view = validView;
      render();
    }
  }
});
