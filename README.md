# ApartAI MVP

ApartAI dokümantasyonuna göre başlatılmış statik MVP prototipi.

## Kapsam

- Yönetici paneli
- Site Sağlık Skoru v1
- Aidat oluşturma ve manuel ödeme takibi
- Arıza/şikayet talep yönetimi
- Sakin mobil web ekranı
- Gemini/OpenAI destekli AI şikayet analizi ve kural tabanlı fallback
- Gemini/OpenAI destekli AI duyuru metni iyileştirme ve aidat hatırlatma taslağı
- Aylık yönetici özeti

## Yapılanlar

- [x] Statik MVP prototipi oluşturuldu.
- [x] Bağımlılıksız Node.js backend eklendi.
- [x] JSON dosya tabanlı veri kalıcılığı eklendi.
- [x] GitHub reposu oluşturulup proje push edildi.
- [x] Modern landing ekranı ve auth modalı tasarlandı.
- [x] Yönetici/sakin rol bazlı demo giriş akışı eklendi.
- [x] Site, blok, daire ve sakin kayıt akışı eklendi.
- [x] Aidat oluşturma, ödeme işaretleme ve risk özeti eklendi.
- [x] Aidat hatırlatma taslağı ve hatırlatma kaydı eklendi.
- [x] Sakin talep açma akışı eklendi.
- [x] Talep fotoğrafı ekleme ve yönetici detayında görüntüleme eklendi.
- [x] Talep detay modalı, yönetici notu, durum güncelleme ve silme eklendi.
- [x] Kural tabanlı AI simülasyonları eklendi.
- [x] OpenAI API entegrasyonu için gerçek AI/fallback servis katmanı eklendi.
- [x] Gemini 2.5 Flash provider ayarları ve marka logoları eklendi.
- [x] AI debug endpoint'i, terminal logları ve Gemini geçici hata retry akışı eklendi.
- [x] Rapor ekranı aylık özet, blok yoğunluğu ve pilot metrikleriyle geliştirildi.
- [x] PostgreSQL geçiş şeması taslağı eklendi.
- [x] Gerçek auth: scrypt parola hash, imzalı token ve rol bazlı endpoint koruması eklendi.
- [x] Veri erişimi repository katmanına alındı (JSON varsayılan, Postgres'e hazır).
- [x] Encoding kök nedeni (chunk sınırı UTF-8 bozulması) düzeltildi ve input validasyonu eklendi.
- [x] `node:test` ile sıfır bağımlılıklı API/birim test paketi eklendi.
- [x] Multimodal AI: talep fotoğrafı Gemini/OpenAI görsel girdisi olarak analiz ediliyor (anahtar yoksa fallback).
- [x] Fotoğraf saklama dosya storage seam'ine alındı (yerel FS varsayılan, S3'e hazır); `data/`'ya statik erişim engellendi.
- [x] Site Sağlık Skoru sunucuda hesaplanıyor ve skor geçmişi raporda gösteriliyor.
- [x] CSV ile toplu daire/sakin içeri aktarma eklendi.
- [x] Landing ekranına küratörlü sosyal medya bölümü eklendi (YouTube gömme + tıkla-yükle önizlemeler).
- [x] Duyuru okunma takibi (sakin ekranında otomatik işaretleme) ve yönetici bildirim geçmişi eklendi.

## Yol Haritası

### Faz 0 — Sağlamlaştırma (pilot öncesi şart)

- [x] Demo auth akışını gerçek parola hash (scrypt) ve token/session altyapısına taşı, API uçlarını koru.
- [x] Veri erişimini repository katmanına taşı (JSON varsayılan, `DB_DRIVER=postgres` ile Postgres'e hazır).
- [x] Encoding (mojibake) kök nedenini çöz ve temel input validasyonu ekle.
- [x] Test altyapısı ve kritik API uçları için smoke/regresyon testleri ekle.

### Faz 1 — MVP'yi pilota hazırlama

- [x] Fotoğraf analizini multimodal AI (görsel + metin) akışına taşı.
- [x] MVP fotoğraf saklamasını dosya saklama seam'ine taşı (yerel FS varsayılan, `STORAGE_DRIVER=s3` ile S3'e hazır).
- [x] Pilot siteler için CSV içeri aktarma (toplu daire/sakin, blok otomatik oluşturma) ekle.
- [x] Site Sağlık Skoru'nu sunucuda hesapla ve skor geçmişi (anlık görüntü) kaydet.

### Faz 2 — Operasyonel derinlik

- [x] Duyuru okunma takibi ve bildirim geçmişi ekle.
- [ ] SMS/e-posta bildirim entegrasyonu ekle.
- [ ] Talep atama ve firma/taşeron takibi + çözüm süresi performansı ekle.

### Faz 3+ — Entegrasyon ve akıllı yönetim katmanı

- [ ] Yönetim firmaları için çoklu site görünümü ekle (`siteId` filtrelemesi).
- [ ] Online ödeme veya banka hareketi içeri aktarma altyapısını planla.
- [ ] Karşılaştırmalı site skorları, tedarikçi performansı ve tahsilat tahmini ekle.

## Çalıştırma

Statik demo için `index.html` dosyasını tarayıcıda açmak yeterlidir. Bu modda veriler tarayıcı `localStorage` alanında saklanır.

Backend bağlantılı çalışma için:

```bash
node server.js
```

Gemini API ile çalıştırmak için `.env` dosyasını doldur:

```powershell
AI_PROVIDER=gemini
GEMINI_API_KEY="AIza..."
GEMINI_MODEL=gemini-2.5-flash
AI_DEBUG=true
node server.js
```

`.env.example` dosyası örnek ayarları içerir. `GEMINI_API_KEY` yoksa sistem otomatik olarak kural tabanlı Demo AI fallback akışını kullanır. OpenAI hattı yedek/provider seçeneği olarak korunur.
AI sorunlarını key göstermeden incelemek için `GET /api/ai/debug` endpoint'i son AI denemelerini, HTTP status ve fallback sebebini döndürür.
Gemini tarafında `429/500/502/503/504` gibi geçici hatalar alınırsa istek kısa aralıklarla 3 kez denenir.

Ardından tarayıcıda:

```text
http://localhost:4173
```

Bu modda veriler `data/db.json` dosyasında saklanır. İlk çalıştırmada `data/seed.json` üzerinden oluşturulur.

## Test

Sıfır bağımlılıklı test paketi Node'un yerleşik test çalıştırıcısını kullanır:

```bash
npm test
# veya
node --test
```

## Kimlik Doğrulama

Parolalar `scrypt` ile hash'lenir; eski düz-metin parolalar ilk okumada otomatik migrate edilir. `POST /api/auth/login` ve `register` imzalı bir token döndürür; istemci bunu saklayıp her istekte `Authorization: Bearer <token>` başlığıyla gönderir. Mutasyon uçları token ister; yönetici işlemleri `admin` rolü gerektirir. Token imza anahtarı `AUTH_SECRET` env değişkeninden okunur; yoksa `data/.auth_secret` dosyasına üretilip kaydedilir.

## API

Erişim: (genel) kimlik gerektirmez, (oturum) geçerli token gerekir, (admin) yönetici rolü gerekir.

- `GET /api/state` (genel)
- `GET /api/ai/status` (genel)
- `GET /api/ai/debug` (admin)
- `POST /api/auth/login` (genel)
- `POST /api/auth/register` (genel)
- `POST /api/dues/bulk` (admin)
- `POST /api/dues/:id/pay` (admin)
- `POST /api/dues/:id/reminder-draft` (admin)
- `POST /api/dues/:id/reminder` (admin)
- `POST /api/requests` (oturum)
- `PATCH /api/requests/:id` (admin)
- `DELETE /api/requests/:id` (admin)
- `PATCH /api/requests/:id/status` (admin)
- `POST /api/announcements` (admin)
- `POST /api/announcements/:id/read` (oturum) — duyuruyu okundu işaretle
- `POST /api/apartments` (admin)
- `POST /api/apartments/import` (admin) — CSV toplu içeri aktarma
- `GET /api/health-score` (admin) — mevcut skor + geçmiş
- `POST /api/health-score/snapshot` (admin) — skor anlık görüntüsü kaydet
- `POST /api/reset` (admin)

Yüklenen talep fotoğrafları `/uploads/<dosya>` yolundan servis edilir.

## Veritabanı

Veri erişimi `db/repository.js` içindeki repository katmanı arkasındadır. Varsayılan sürücü JSON dosyasıdır (`data/db.json`). PostgreSQL'e geçmek için `PostgresRepository` aynı arayüzle doldurulur ve `DB_DRIVER=postgres` ile devreye alınır. Geçiş şeması `db/schema.sql` dosyasındadır.

## Demo Kullanıcıları

- Yönetici: `admin@apartai.local` / `demo123`
- Sakin: `ayse@example.com` / `demo123`
