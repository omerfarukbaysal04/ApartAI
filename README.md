# ApartAI MVP

ApartAI dokümantasyonuna göre başlatılmış statik MVP prototipi.

## Kapsam

- Yönetici paneli
- Site Sağlık Skoru v1
- Aidat oluşturma ve manuel ödeme takibi
- Arıza/şikayet talep yönetimi
- Sakin mobil web ekranı
- AI şikayet analizi simülasyonu
- AI duyuru metni iyileştirme simülasyonu
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
- [x] Rapor ekranı aylık özet, blok yoğunluğu ve pilot metrikleriyle geliştirildi.
- [x] PostgreSQL geçiş şeması taslağı eklendi.

## Yapılacaklar

- [ ] JSON dosya deposunu PostgreSQL repository katmanıyla değiştir.
- [ ] Demo auth akışını gerçek session/JWT ve parola hash altyapısına taşı.
- [ ] Fotoğraf analizini multimodal AI akışına taşı.
- [ ] MVP fotoğraf saklamasını S3 uyumlu dosya saklama altyapısına taşı.
- [ ] Pilot siteler için Excel içeri aktarma ekle.
- [ ] Duyuru okunma takibi ve bildirim geçmişi ekle.
- [ ] SMS/e-posta bildirim entegrasyonu ekle.
- [ ] Online ödeme veya banka hareketi içeri aktarma altyapısını planla.
- [ ] Yönetim firmaları için çoklu site görünümü ekle.
- [ ] Test altyapısı ve temel API/UI regresyon testleri ekle.

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

## API

- `GET /api/state`
- `GET /api/ai/status`
- `GET /api/ai/debug`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/dues/bulk`
- `POST /api/dues/:id/pay`
- `POST /api/dues/:id/reminder-draft`
- `POST /api/dues/:id/reminder`
- `POST /api/requests`
- `PATCH /api/requests/:id`
- `DELETE /api/requests/:id`
- `PATCH /api/requests/:id/status`
- `POST /api/announcements`
- `POST /api/apartments`
- `POST /api/reset`

## Veritabanı

PostgreSQL geçiş şeması `db/schema.sql` dosyasındadır.

## Demo Kullanıcıları

- Yönetici: `admin@apartai.local` / `demo123`
- Sakin: `ayse@example.com` / `demo123`

## Sonraki Teknik Adımlar

1. JSON dosya deposunu PostgreSQL repository katmanıyla değiştir.
2. Demo auth akışını gerçek session/JWT ve parola hash altyapısına taşı.
3. Fotoğraf analizini gerçek model çağrılarına taşı.
4. Pilot siteler için Excel içeri aktarma ekle.
5. Fotoğraf yükleme için S3 uyumlu storage bağla.
