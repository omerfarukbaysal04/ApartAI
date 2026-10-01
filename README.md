# ApartAI

AI destekli apartman ve site yönetim asistanı. Aidat, arıza/şikayet, duyuru, anket ve kasa süreçlerini tek panelde toplar; verileri yorumlayıp yöneticiye skor, risk ve aksiyon önerisi sunar.

Ürün dokümantasyonu: [`ApartAI_urun_dokumantasyonu.md`](./ApartAI_urun_dokumantasyonu.md)

---

## Mimari

```
Tarayıcı
   │
   ▼
Vercel  ── statik frontend (index.html, app.js, styles.css, assets/)
   │        /api/*     → proxy ─┐
   │        /uploads/* → proxy ─┤
   │                            ▼
   │                   Render (node server.js)
   │                            │
   │                            ▼
   └──────────────────► PostgreSQL (Supabase / Neon)
                         ├── apartai_state  (uygulama verisi, JSONB)
                         └── apartai_files  (yüklenen görseller)
```

- **Frontend:** bağımlılıksız vanilla JS. Vercel'de statik olarak servis edilir.
- **Backend:** tek dosyalık Node HTTP sunucusu (`server.js`), Render'da çalışır.
- **Veri:** `db/repository.js` arkasında. `DATABASE_URL` varsa PostgreSQL, yoksa yerel `data/db.json`.
- **Dosyalar:** `db/storage.js` arkasında. `DATABASE_URL` varsa PostgreSQL, yoksa yerel `uploads/`.

Yönlendirme `vercel.json` içinde, backend servis tanımı `render.yaml` içindedir.

---

## Hızlı başlangıç (yerel)

```bash
npm install
npm run dev
```

Tarayıcıda: `http://localhost:4173`

`DATABASE_URL` tanımlı değilse veriler `data/db.json` dosyasında, görseller `uploads/` klasöründe tutulur. İlk çalıştırmada `data/seed.json` üzerinden oluşturulur.

Backend olmadan salt-frontend demo için `index.html` doğrudan açılabilir; bu modda veriler tarayıcının `localStorage` alanında tutulur.

### Demo kullanıcıları (yalnızca yerel geliştirme)

Seed iki site içerir: **Çınar Apartmanı** (`site-1`) ve **Meltem Sitesi** (`site-2`).

| Rol | E-posta | Şifre |
|---|---|---|
| Yönetici (iki siteyi de yönetir) | `admin@apartai.local` | `demo123` |
| Sakin — Çınar Apartmanı | `ayse@example.com` | `demo123` |
| Sakin — Meltem Sitesi | `deniz@example.com` | `demo123` |

> Bu hesaplar arayüzde gösterilmez. Canlı ortamda aşağıdaki araçla gerçek bir
> yönetici hesabı açıp demo kullanıcıları kaldırın.

---

## Yönetici hesabı oluşturma

Gerçek bir yönetici hesabı `tools/create-admin.js` ile açılır. Şifre komut
satırından alınmaz (kabuk geçmişine düşmemesi için), çalışırken gizli olarak
sorulur:

```bash
node tools/create-admin.js --email ben@sirket.com --name "Ad Soyad"
```

Hangi veritabanına yazacağı ortama göre belirlenir: `DATABASE_URL` tanımlıysa
PostgreSQL, tanımlı değilse yerel `data/db.json`. Canlı veritabanına yazmak için
bağlantı dizesini tanımlayıp aynı komutu çalıştırın:

```bash
DATABASE_URL="postgres://..." node tools/create-admin.js --email ben@sirket.com --name "Ad Soyad"
```

| Bayrak | Açıklama |
|---|---|
| `--email` | Zorunlu. Giriş e-postası. |
| `--name` | Zorunlu. Panelde görünen ad. |
| `--sites` | Opsiyonel. Virgülle ayrılmış site id listesi. Verilmezse tüm siteler. |
| `--phone` | Opsiyonel. |

E-posta zaten kayıtlıysa kullanıcı yöneticiye yükseltilir ve şifresi sıfırlanır.
Otomasyonda şifre `ADMIN_PASSWORD` ortam değişkeniyle de verilebilir.

---

## Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayıp doldurun. Production'da bunlar Render panelinden tanımlanır.

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `AUTH_SECRET` | **Production'da evet** | Token imza anahtarı. Tanımlı değilse veritabanına kalıcı bir anahtar yazılır; yine de açıkça tanımlanması önerilir. |
| `DATABASE_URL` | Production'da evet | PostgreSQL bağlantı dizesi. Tanımlıysa hem veri hem dosya saklama otomatik Postgres'e geçer. |
| `DB_DRIVER` | hayır | `postgres` veya `json`. Varsayılan: `DATABASE_URL` varsa `postgres`. |
| `STORAGE_DRIVER` | hayır | `postgres` veya `local`. Varsayılan: `DATABASE_URL` varsa `postgres`. |
| `GEMINI_API_KEY` | hayır | Yoksa kural tabanlı fallback çalışır. |
| `GEMINI_MODEL` | hayır | Varsayılan `gemini-2.5-flash`. |
| `AI_PROVIDER` | hayır | `gemini` veya `openai`. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | hayır | Alternatif sağlayıcı. |
| `AI_DEBUG` | hayır | `true` ise AI denemeleri loglanır. |
| `MAX_IMAGE_BYTES` | hayır | Yüklenebilir en büyük görsel. Varsayılan `819200` (800 KB). |
| `RATE_LIMIT_AI` | hayır | AI asistan için 5 dakikadaki istek sınırı. Varsayılan `15`. |
| `RATE_LIMIT_LOGIN` | hayır | 5 dakikadaki başarısız giriş sınırı. Varsayılan `10`. |
| `NOTIFY_DRIVER` | hayır | `log` (simülasyon) veya `webhook`. |
| `NOTIFY_WEBHOOK_URL` | hayır | `webhook` sürücüsünde hedef adres. |
| `PORT` | hayır | Render otomatik ayarlar. |

### `AUTH_SECRET` üretme

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Dağıtım

**Render (backend):** `render.yaml` servisi tanımlar. Panelden `GEMINI_API_KEY`, `DATABASE_URL` ve `AUTH_SECRET` girilir.

**Vercel (frontend):** `vercel.json` statik dosyaları yayınlar, `/api/*` ve `/uploads/*` isteklerini Render'a yönlendirir. `.vercelignore`, backend dosyalarının statik dağıtıma girmesini engeller.

Veritabanı tabloları ilk çalıştırmada otomatik oluşturulur; elle şema kurulumu gerekmez.

---

## Test

```bash
npm test
```

Testler izole bir geçici veritabanı ve yükleme klasörü kullanır; gerçek `data/` ve `uploads/` etkilenmez.

---

## Kimlik doğrulama ve yetkilendirme

Parolalar `scrypt` ile hash'lenir. `POST /api/auth/login` ve `/api/auth/register` imzalı bir token döndürür; istemci bunu `Authorization: Bearer <token>` başlığıyla gönderir.

Erişim seviyeleri:

- **genel** — kimlik gerekmez
- **oturum** — geçerli token gerekir (sakin veya yönetici)
- **admin** — yönetici rolü gerekir

### Veri kapsamı

| Kim | Ne görür |
|---|---|
| Oturumsuz | Yalnızca site ve blok listesi (kayıt formu için) |
| Sakin | Yalnızca kendi sitesi; kendi dairesi, borcu, talepleri ve sitesinin duyuruları |
| Yönetici | Yalnızca yönettiği siteler (`siteIds`) |

Site kapsamlı uçlar `?siteId=` parametresi alır; verilmezse kullanıcının ilk sitesi kullanılır. Yetkisiz bir `siteId` `400` döndürür.

---

## API

### Kimlik ve profil

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/auth/login` | genel | Giriş; token döndürür. Başarısız denemeler hız sınırına tabidir. |
| `POST /api/auth/register` | genel | Sakin kaydı; seçilen blok siteyi belirler. |
| `PATCH /api/auth/profile` | oturum | Ad, telefon, e-posta, şifre, plaka, avatar. |

### Durum ve siteler

| Uç | Erişim | Açıklama |
|---|---|---|
| `GET /api/state` | genel | Kullanıcının kapsamındaki tüm veri. |
| `GET /api/sites/overview` | admin | Yönetilen sitelerin karşılaştırmalı özeti. |
| `POST /api/sites` | admin | Yeni site oluşturur. |
| `POST /api/sites/:id/bulk-setup` | admin | Toplu blok/daire kurulumu. |
| `PATCH /api/blocks/:id` | admin | Blok adını günceller. |

### Daireler

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/apartments` | admin | Daire ve sakin ekler. |
| `PATCH /api/apartments/:id` | admin | Daire günceller. |
| `DELETE /api/apartments/:id` | admin | Daire siler. |
| `POST /api/apartments/import` | admin | CSV toplu içeri aktarma. |

### Aidat ve finans

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/dues/bulk` | admin | Dönem için toplu aidat oluşturur. |
| `POST /api/dues/:id/pay` | oturum | Ödeme işler. |
| `POST /api/dues/:id/reminder-draft` | admin | AI hatırlatma taslağı üretir. |
| `POST /api/dues/:id/reminder` | admin | Hatırlatma gönderir ve kaydeder. |
| `GET /api/finances` | oturum | Kasa bakiyesi ve gelir-gider özeti (şeffaflık). |
| `POST /api/expenses` | admin | Gider kaydı ekler. |
| `DELETE /api/expenses/:id` | admin | Gider siler. |

### Talepler

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/requests` | oturum | Talep açar; AI kategori/aciliyet önerir, fotoğraf analiz edilir. |
| `PATCH /api/requests/:id` | admin | Durum, yönetici notu, firma ataması. |
| `PATCH /api/requests/:id/status` | admin | Yalnızca durum günceller. |
| `DELETE /api/requests/:id` | admin | Talebi ve fotoğrafını siler. |

### Duyuru ve anketler

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/announcements` | admin | Duyuru yayınlar; AI metni düzenler, sakinlere bildirim gider. |
| `POST /api/announcements/:id/read` | oturum | Okundu işaretler (idempotent). |
| `POST /api/surveys` | admin | Anket oluşturur. |
| `POST /api/surveys/:id/vote` | oturum | Oy verir. |
| `PATCH /api/surveys/:id/close` | admin | Anketi kapatır. |
| `DELETE /api/surveys/:id` | admin | Anketi siler. |

### Skor ve AI

| Uç | Erişim | Açıklama |
|---|---|---|
| `GET /api/health-score` | admin | Site Sağlık Skoru ve geçmişi. |
| `POST /api/health-score/snapshot` | admin | Anlık skoru geçmişe kaydeder. |
| `POST /api/ai/assistant` | genel | Landing demo sohbeti. IP bazlı hız sınırı vardır. |
| `GET /api/ai/status` | genel | Sağlayıcı ve model durumu. |
| `GET /api/ai/debug` | admin | Son AI denemeleri, HTTP durumu, fallback nedeni. |

### Diğer

| Uç | Erişim | Açıklama |
|---|---|---|
| `POST /api/reset` | admin | Veriyi seed'e döndürür. |

Yüklenen görseller `/uploads/<dosya>` yolundan servis edilir.

---

## Site Sağlık Skoru

100 üzerinden, ürün dokümanındaki ağırlıklarla hesaplanır: ödeme düzeni %35, arıza çözüm hızı %25, şikayet yoğunluğu %20, tekrarlayan sorun oranı %10, duyuru düzeni %10. Skorun yanında düşüş nedenleri ve önerilen aksiyonlar üretilir. Sunucu ve istemci aynı formülü kullanır.

---

## Tasarım notları

**Veri saklama.** Tüm uygulama durumu `apartai_state` tablosunda tek bir JSONB belgesi olarak tutulur. Bu, JSON dosya modelinden geçişi basitleştirir; karşılığında her yazma belgenin tamamını yeniden yazar. Yazma istekleri hem süreç içi kuyrukla hem de PostgreSQL danışmanlı kilidiyle (`pg_advisory_lock`) seri hale getirilir; aksi hâlde eşzamanlı oku-değiştir-yaz döngüleri birbirinin değişikliğini ezer.

> Kilit isteğin tamamı boyunca tutulur. AI çağrısı yapan yazma uçlarında (talep açma, duyuru yayınlama) bu süre modelin yanıt süresine bağlıdır. Pilot ölçeğinde sorun değildir; trafik arttığında kilidi yalnızca okuma-yazma penceresine daraltmak gerekir.

**Görseller.** Talep fotoğrafları ve avatarlar kayıtların içine gömülmez; `db/storage.js` üzerinden saklanıp kayda yalnızca URL yazılır. Yükleme öncesi tür ve boyut doğrulanır (`MAX_IMAGE_BYTES`). Render gibi geçici diskli ortamlarda dosyalar Postgres'te tutulduğu için yeniden başlatmadan etkilenmez.

**Bildirimler.** `db/notifier.js` arkasındadır. Varsayılan `log` sürücüsü gönderimi simüle eder; `NOTIFY_DRIVER=webhook` ile SMS/e-posta ağ geçidine bağlanır.

---

## Yol haritası

### Tamamlananlar

- Gerçek auth: scrypt parola hash, imzalı token, rol bazlı endpoint koruması
- Repository ve storage katmanları; PostgreSQL sürücüsü
- Encoding (UTF-8 chunk sınırı) düzeltmesi ve girdi doğrulama
- `node:test` ile API ve birim test paketi
- Multimodal AI talep analizi (görsel + metin) ve kural tabanlı fallback
- Sunucu tarafı Site Sağlık Skoru ve skor geçmişi
- CSV ile toplu daire/sakin içeri aktarma
- Duyuru okunma takibi ve bildirim geçmişi
- Talep atama ve firma/taşeron performans tablosu
- Çoklu site desteği ve rol bazlı veri kapsamı
- Dijital anket ve istişare oylamaları
- Apartman kasası, gelir-gider yönetimi ve AI finansal asistan
- Mobil arayüz revizyonu, bildirim merkezi, bina hiyerarşisi
- Gri-beyaz gradient arayüz teması ve otomatik ilerleyen landing özellik slider'ı
- Kalıcı dosya saklama, görsel boyut sınırı, eşzamanlı yazma koruması, hız sınırlama

### Sıradakiler

- [ ] Online ödeme (Iyzico / PayTR) veya banka hareketi içeri aktarma
- [ ] Tahsilat tahmini ve bütçe sapma analizi
- [ ] Tedarikçi performans skorlaması
- [ ] Yazma kilidini AI çağrılarının dışına daraltma
