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
- [x] Talep detay modalı, yönetici notu, durum güncelleme ve silme eklendi.
- [x] Kural tabanlı AI simülasyonları eklendi.
- [x] Rapor ekranı aylık özet, blok yoğunluğu ve pilot metrikleriyle geliştirildi.
- [x] PostgreSQL geçiş şeması taslağı eklendi.

## Yapılacaklar

- [ ] JSON dosya deposunu PostgreSQL repository katmanıyla değiştir.
- [ ] Demo auth akışını gerçek session/JWT ve parola hash altyapısına taşı.
- [ ] Kural tabanlı AI simülasyonlarını gerçek OpenAI API çağrılarına taşı.
- [ ] Talep fotoğrafı yükleme ve S3 uyumlu dosya saklama ekle.
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
3. AI yardımcılarını gerçek model çağrılarına taşı.
4. Pilot siteler için Excel içeri aktarma ekle.
5. Fotoğraf yükleme için S3 uyumlu storage bağla.
