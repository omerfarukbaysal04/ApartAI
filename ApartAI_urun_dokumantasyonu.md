# ApartAI Urun Dokumantasyonu

## 1. Urun Ozeti

ApartAI, apartman ve site yonetimini dijitallestiren, yonetici ile sakinler arasindaki operasyonel surecleri tek merkezde toplayan ve yapay zeka ile karar destegi sunan bir yonetim platformudur.

Urunun temel iddiasi sadece veri kaydetmek degil, yoneticinin is yukunu azaltmak ve site hakkinda daha iyi kararlar almasini saglamaktir.

ApartAI klasik bir aidat, duyuru ve ariza takip sistemi olarak baslar; zamanla sikayetleri analiz eden, tekrar eden problemleri tespit eden, odeme risklerini ongoren ve yoneticiye aylik aksiyon onerileri sunan akilli bir site yonetim asistanina donusur.

## 2. Konumlandirma

### Kisa Tanim

ApartAI, site yoneticileri icin AI destekli dijital yonetim asistanidir.

### Ana Deger Onerisi

Site yoneticileri WhatsApp, Excel, banka dekontlari ve daginik ariza talepleri arasinda kaybolmadan; aidat, duyuru, sikayet ve raporlama sureclerini tek panelden yonetir. ApartAI ise bu verileri analiz ederek yoneticiye net skorlar, riskler ve aksiyon onerileri sunar.

### Temel Fark

Klasik uygulamalar kayit tutar. ApartAI kayitlari yorumlar, onceliklendirir ve yonetime aksiyon onerir.

## 3. Hedef Kitle

### Birincil Kullanici: Site Yoneticisi

Profil:

- 35-60 yas arasi
- Profesyonel yonetici, apartman yoneticisi veya site yonetim firmasi calisani
- Gunde cok sayida mesaj, odeme ve ariza talebiyle ugrasir
- Excel, WhatsApp ve banka hesap hareketleri arasinda manuel takip yapar

Ihtiyaclari:

- Aidat odemelerini kolay takip etmek
- Ariza taleplerini kaybetmemek
- Sakinlere daha duzenli duyuru yapmak
- Sikayetleri objektif sekilde raporlamak
- Yonetim toplantilarinda net veri sunmak

### Ikincil Kullanici: Site Sakini

Profil:

- Aidat borcunu gormek ister
- Ariza veya sikayet bildirmek ister
- Duyurulari kacirmak istemez
- Yonetimle daha seffaf iletisim kurmak ister

Ihtiyaclari:

- Borc ve odeme durumunu gormek
- Hizli ariza kaydi acmak
- Talebinin durumunu takip etmek
- Duyurulari ve karar ozetlerini gormek

## 4. Cozulen Problemler

### Dagitik Iletisim

WhatsApp gruplarinda duyurular, sikayetler ve tartismalar birbirine karisir. Onemli talepler kaybolur.

### Manuel Aidat Takibi

Odemeler genellikle Excel veya banka hareketleri uzerinden manuel kontrol edilir. Bu da hata, gecikme ve zaman kaybina yol acar.

### Kaybolan Ariza Talepleri

Asansor, temizlik, guvenlik, su tesisati gibi ariza ve sikayetler sistematik kayda alinmadiginda takip edilemez.

### Veriye Dayanmayan Yonetim

Yonetici hangi blokta daha cok sorun oldugunu, hangi kategoride sikayet arttigini veya hangi firmalarin yavas cozum sundugunu net olarak goremez.

### Sertlesen Yonetici-Sakin Iliskisi

Belirsizlik ve iletisim eksikligi guvensizlik yaratir. Sakinler taleplerinin dikkate alinmadigini dusunur; yonetici ise surekli tekrar eden sorularla ugrasir.

## 5. MVP Kapsami

Ilk surumun amaci tum site yonetimini eksiksiz cozmek degil, en sik ve en acili sorunlari tek bir guvenilir sistemde toplamaktir.

### MVP Modul 1: Yonetici Paneli

Yonetici paneli web tabanli olur.

Ozellikler:

- Site, blok ve daire kaydi
- Sakin kaydi
- Aidat borcu olusturma
- Odeme durumu takibi
- Duyuru olusturma
- Ariza ve sikayet taleplerini listeleme
- Temel gelir-gider ozeti
- Aylik site ozeti

### MVP Modul 2: Sakin Ekrani

Ilk asamada native mobil uygulama yerine mobil uyumlu web ekran tercih edilir.

Ozellikler:

- Borc goruntuleme
- Odeme gecmisi goruntuleme
- Ariza veya sikayet bildirimi
- Talep durumunu takip etme
- Duyurulari goruntuleme

### MVP Modul 3: Ariza ve Sikayet Yonetimi

Ozellikler:

- Kategori secimi veya otomatik kategori onerisi
- Aciliyet seviyesi
- Fotograf ekleme
- Talep durumu: yeni, inceleniyor, firmaya iletildi, cozuldu, reddedildi
- Yonetici notu
- Cozum suresi takibi

### MVP Modul 4: AI Sikayet Analizi

AI, sakin tarafindan yazilan metni analiz eder.

Ornek:

Sakin metni:

> C blok girisinde iki gundur copler alinmiyor, koku olustu.

AI ciktisi:

- Kategori: Temizlik
- Aciliyet: Orta
- Lokasyon: C blok girisi
- Onerilen aksiyon: Temizlik firmasina bildirim ac
- Benzer talepler: Son 7 gunde C blok icin 3 temizlik talebi var

### MVP Modul 5: Site Saglik Skoru

Site Saglik Skoru, yoneticiye sitenin operasyonel durumunu tek bakista anlatan ana metriktir.

Ilk versiyon hesaplama girdileri:

- Aidat odeme duzeni
- Acik ariza sayisi
- Ortalama cozum suresi
- Sikayet yogunlugu
- Tekrarlayan sikayet orani

Ornek skor:

Site Saglik Skoru: 72 / 100

Yorum:

Odeme duzeni iyi, ancak temizlik sikayetleri son aya gore artis gosteriyor. C blok icin aksiyon alinmasi onerilir.

## 6. MVP Disinda Birakilacaklar

Ilk surumde asagidaki ozellikler kapsam disi tutulmalidir:

- Native iOS ve Android uygulamalari
- Kapsamli muhasebe sistemi
- Banka entegrasyonu
- Otomatik tahsilat
- E-imza veya resmi karar defteri entegrasyonu
- Cok detayli yetkilendirme rolleri
- Cagri merkezi altyapisi
- Tedarikci pazaryeri

Bu karar, urunun daha hizli test edilmesini ve temel deger onerisine odaklanmasini saglar.

## 7. Temel Kullanici Akislari

### Akis 1: Yonetici Aidat Olusturur

1. Yonetici panele girer.
2. Site ve ay secimi yapar.
3. Daire basina aidat tutarini girer.
4. Sistem tum dairelere borc kaydi olusturur.
5. Sakinler kendi ekranlarinda borclarini gorur.
6. Yonetici odeme durumlarini takip eder.

### Akis 2: Sakin Ariza Bildirir

1. Sakin mobil uyumlu web ekranindan giris yapar.
2. Ariza veya sikayet formunu acar.
3. Kisa aciklama yazar ve fotograf ekler.
4. Sistem talebi kaydeder.
5. AI kategori, aciliyet ve lokasyon onerir.
6. Yonetici talebi onaylar veya duzenler.
7. Talep cozuldukce sakin durum guncellemesini gorur.

### Akis 3: Yonetici Aylik Ozeti Inceler

1. Yonetici aylik rapor ekranini acar.
2. Sistem odeme, sikayet ve cozum verilerini ozetler.
3. AI tekrar eden problemleri ve riskleri listeler.
4. Yonetici raporu toplantida veya sakinlerle paylasir.

### Akis 4: AI Duyuru Metni Iyilestirir

1. Yonetici kaba bir duyuru metni yazar.
2. AI metni daha net, profesyonel ve sakin bir dile cevirir.
3. Yonetici metni onaylar.
4. Duyuru sakin ekraninda yayinlanir.

## 8. AI Ozellikleri

### 8.1 Sikayet Siniflandirma

Kullanici metninden kategori ve aciliyet cikarir.

Kategoriler:

- Temizlik
- Guvenlik
- Asansor
- Su ve tesisat
- Elektrik
- Otopark
- Gurultu
- Peyzaj
- Diger

### 8.2 Tekrarlayan Sorun Tespiti

Ayni blok, ayni kategori veya ayni lokasyonda tekrar eden talepleri tespit eder.

Ornek:

Son 30 gunde B blok asansoru icin 8 ariza kaydi acildi. Bakim firmasi performansi incelenmeli.

### 8.3 Odeme Risk Analizi

Gecmis odeme davranisina gore gecikme riski olan daireleri isaretler.

Ornek:

12 daire son 3 ayda aidatini ortalama 10 gunden fazla geciktirdi.

### 8.4 Akilli Duyuru Asistani

Yonetici metnini farkli tonlarda duzenler.

Ton secenekleri:

- Resmi
- Kibar
- Kisa
- Detayli
- Uyari niteliginde

### 8.5 Aylik Yonetici Ozeti

AI her ay yonetici icin okunabilir bir ozet uretir.

Ornek ciktida bulunacaklar:

- Toplam tahsilat orani
- En cok sikayet gelen kategori
- Ortalama ariza cozum suresi
- En sorunlu blok veya alan
- Onerilen aksiyonlar

## 9. Site Saglik Skoru

### Amac

Site Saglik Skoru, yoneticinin siteyi tek metrik uzerinden takip etmesini saglar.

### Baslangic Formulu

Skor 100 uzerinden hesaplanir.

Onerilen agirliklar:

- Odeme duzeni: %35
- Ariza cozum hizi: %25
- Sikayet yogunlugu: %20
- Tekrarlayan sorun orani: %10
- Duyuru ve iletisim duzeni: %10

### Skor Araliklari

90-100: Cok iyi

75-89: Iyi

60-74: Dikkat edilmeli

40-59: Riskli

0-39: Kritik

### Skorun Urundeki Yeri

Site Saglik Skoru ana panelin en gorunur yerinde olmalidir. Skorun altinda yalnizca sayi degil, nedenler ve aksiyon onerileri de bulunmalidir.

Ornek:

Skor: 68 / 100

Neden dustu:

- Ortalama ariza cozum suresi 4.2 gune cikti.
- Temizlik sikayetleri onceki aya gore %35 artti.
- Aidat tahsilat orani %81 seviyesinde kaldi.

Onerilen aksiyon:

- C blok icin temizlik denetimi planla.
- Gecikmede olan dairelere kibar hatirlatma gonder.

## 10. Baslangic Veri Modeli

### Site

- id
- ad
- adres
- yonetici_id
- blok_sayisi
- daire_sayisi
- olusturma_tarihi

### Blok

- id
- site_id
- ad

### Daire

- id
- site_id
- blok_id
- daire_no
- kat
- sakin_id

### Sakin

- id
- ad_soyad
- telefon
- e_posta
- daire_id
- rol

### Aidat

- id
- site_id
- daire_id
- donem
- tutar
- son_odeme_tarihi
- durum

### Odeme

- id
- aidat_id
- daire_id
- tutar
- odeme_tarihi
- odeme_yontemi
- aciklama

### Talep

- id
- site_id
- daire_id
- kategori
- baslik
- aciklama
- fotograf_url
- aciliyet
- durum
- ai_ozet
- olusturma_tarihi
- cozum_tarihi

### Duyuru

- id
- site_id
- baslik
- icerik
- ai_duzenlenmis_icerik
- yayin_tarihi
- hedef_kitle

## 11. Basari Metrikleri

### Urun Kullanimi

- Aktif site sayisi
- Aktif yonetici sayisi
- Aylik giris yapan sakin orani
- Acilan talep sayisi
- Cozulen talep orani

### Operasyonel Etki

- Ortalama ariza cozum suresi
- Aidat tahsilat orani
- Geciken aidat sayisi
- Tekrarlayan sikayet orani
- Duyuru okunma orani

### AI Degeri

- AI tarafindan dogru kategorilenen talep orani
- AI duyuru asistaninin kullanilma orani
- Aylik rapor goruntulenme orani
- Site Saglik Skoru ekranina geri donus orani

## 12. Gelir Modeli

### Free Plan

Amac urunu denetmek ve kucuk apartmanlari iceri almaktir.

Kapsam:

- 1 site
- 20 daireye kadar
- Temel aidat takibi
- Temel duyuru
- Temel ariza kaydi

### Premium Plan

Ana gelir modeli.

Kapsam:

- Sinirsiz veya yuksek daire limiti
- AI sikayet analizi
- Site Saglik Skoru
- Aylik AI raporu
- Coklu blok destegi
- Gelir-gider ozeti
- Bildirim ve hatirlatma ozellikleri

### Profesyonel Yonetim Firmasi Plani

Birden fazla site yoneten firmalar icin.

Kapsam:

- Coklu site paneli
- Tum siteler icin karsilastirmali skorlar
- Firma bazli kullanici rolleri
- Toplu duyuru
- Gelismis raporlama

## 13. Rekabet Avantaji

ApartAI'nin rekabet avantaji klasik ozelliklerde degil, bu ozelliklerin urettigi veriyi anlamli kararlara donusturmesindedir.

Fark noktalar:

- Site Saglik Skoru
- AI destekli sikayet siniflandirma
- Tekrarlayan problem tespiti
- Aylik yonetici ozeti
- Akilli duyuru asistani
- Odeme riski uyarilari

## 14. Urun Yol Haritasi

### Faz 1: MVP

Hedef: Ilk pilot sitelerde temel kullanim.

Ozellikler:

- Web yonetici paneli
- Mobil uyumlu sakin ekrani
- Aidat takibi
- Duyuru
- Ariza ve sikayet kaydi
- Temel AI kategori onerisi
- Site Saglik Skoru v1

### Faz 2: Operasyonel Derinlik

Hedef: Yonetici is akisini daha guclu hale getirmek.

Ozellikler:

- Gelir-gider raporlari
- Talep atama
- Firma/tasaron takibi
- Gecikme hatirlatmalari
- Aylik AI raporu
- Duyuru okunma takibi

### Faz 3: Entegrasyonlar

Hedef: Manuel operasyonu azaltmak.

Ozellikler:

- Banka hareketi iceri aktarma
- SMS/e-posta bildirimleri
- Online odeme
- Muhasebe ciktilari
- Belge ve karar arsivi

### Faz 4: Akilli Yonetim Katmani

Hedef: ApartAI'yi karar destek platformuna donusturmek.

Ozellikler:

- Site karsilastirma paneli
- Tedarikci performans skoru
- Tahsilat tahmini
- Butce sapma analizi
- AI destekli toplanti gundemi ve karar ozeti

## 15. Ilk Pilot Stratejisi

### Hedef Pilot

- 3-5 apartman veya site
- Her biri 20-150 daire arasi
- Dijital arac kullanmaya acik yonetici
- Aktif WhatsApp grubu olan ve iletisim sorunu yasayan yapilar

### Pilot Amaci

- Yonetici panelinin gercek ihtiyaci karsilayip karsilamadigini test etmek
- Sakinlerin mobil web ekranini kullanip kullanmadigini gormek
- AI kategori onerilerinin dogrulugunu olcmek
- Site Saglik Skoru'nun yonetici icin anlamli olup olmadigini anlamak

### Pilot Basari Kriterleri

- Yoneticinin haftada en az 3 kez panele girmesi
- Taleplerin en az %60'inin sistemden acilmasi
- Duyurularin WhatsApp yerine sistemden yayinlanmaya baslamasi
- Yonetici tarafindan Site Saglik Skoru'nun takip edilmesi

## 16. Riskler ve Cozumler

### Risk: Sakinler Yeni Sisteme Gecmek Istemeyebilir

Cozum:

- Ilk surumde uygulama indirtmek yerine link ile girilen mobil web ekran kullanmak
- WhatsApp ile rekabet etmek yerine WhatsApp'tan gelen kaosu duzene sokan bir konum almak

### Risk: Yonetici Manuel Veri Girmek Istemeyebilir

Cozum:

- Ilk kurulumda Excel iceri aktarma sunmak
- Aidat olusturma ve toplu daire kaydini cok hizli yapmak

### Risk: AI Ozellikleri Fazla Genel Kalabilir

Cozum:

- AI'yi metin susleme araci olarak degil, kategori, oncelik, tekrar eden sorun ve aylik aksiyon ureten sistem olarak konumlandirmak

### Risk: Pazar Fiyat Hassas Olabilir

Cozum:

- Kucuk apartmanlar icin uygun baslangic paketi
- Profesyonel yonetim firmalari icin daha yuksek degerli coklu site paketi

## 17. Ilk Ekranlar

### Yonetici Ana Paneli

Gosterilecekler:

- Site Saglik Skoru
- Bu ay tahsilat orani
- Acik ariza sayisi
- Ortalama cozum suresi
- Son duyurular
- AI aksiyon onerileri

### Aidat Ekrani

Gosterilecekler:

- Donem bazli aidatlar
- Daire bazli borc durumu
- Odendi/gecikti/bekliyor durumlari
- Toplu aidat olusturma
- Hatirlatma gonderme

### Talepler Ekrani

Gosterilecekler:

- Acik talepler
- Kategori ve aciliyet filtreleri
- AI ozetleri
- Cozum durumlari
- Ortalama cozum suresi

### Rapor Ekrani

Gosterilecekler:

- Aylik tahsilat
- Kategori bazli sikayetler
- Blok bazli sorun yogunlugu
- Site Saglik Skoru degisimi
- AI aylik ozet

## 18. Kisa Pitch Metni

ApartAI, apartman ve site yoneticileri icin gelistirilmis AI destekli dijital yonetim asistanidir. Aidat, duyuru, ariza ve sikayet sureclerini tek panelde toplar; yapay zeka ile sikayetleri analiz eder, tekrar eden sorunlari tespit eder ve yoneticiye aylik aksiyon onerileri sunar. En onemli farki Site Saglik Skoru'dur: yonetici, sitesinin operasyonel durumunu tek bakista gorur ve hangi konuda aksiyon almasi gerektigini anlar.

## 19. Sonuc

ApartAI'nin guclu cikis noktasi, mevcut site yonetimi pazarindaki temel ihtiyaclari cozmesi ve bunun uzerine AI destekli karar katmani eklemesidir. Urun, ilk asamada basit ve hizli kullanilabilen bir yonetim paneli olarak konumlanmali; farkini ise Site Saglik Skoru, sikayet analizi ve aylik AI yonetici ozeti ile gostermelidir.

Basarili bir MVP icin odak, cok fazla ozellik eklemek degil, yoneticinin her hafta geri donecegi kadar faydali ve sakinlerin ekstra caba harcamadan kullanacagi kadar basit bir sistem kurmaktir.
