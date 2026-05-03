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

## Çalıştırma

Statik demo için `index.html` dosyasını tarayıcıda açmak yeterlidir. Bu modda veriler tarayıcı `localStorage` alanında saklanır.

Backend bağlantılı çalışma için:

```bash
node server.js
```

Ardından tarayıcıda:

```text
http://localhost:4173
```

Bu modda veriler `data/db.json` dosyasında saklanır. İlk çalıştırmada `data/seed.json` üzerinden oluşturulur.

## API

- `GET /api/state`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/dues/bulk`
- `POST /api/dues/:id/pay`
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
3. AI yardımcılarını gerçek model çağrılarına taşı.
4. Pilot siteler için Excel içeri aktarma ekle.
5. Fotoğraf yükleme için S3 uyumlu storage bağla.
