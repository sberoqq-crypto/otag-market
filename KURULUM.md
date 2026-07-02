# Otağ Market — Paket Servis Takip Uygulaması Kurulumu

Bu uygulama tamamen **ücretsiz** çalışır: veritabanı Google Sheets, backend Google Apps
Script, barındırma GitHub Pages. Aylık hiçbir ücret yok.

---

## 1. Google Sheets'i hazırla

Yeni bir Google E-Tablo aç, iki sayfa oluştur (sayfa adları **aynen böyle** olmalı):

**Siparisler** sayfası — A1'den itibaren şu başlıklar:
```
SiparisID | MusteriAdi | Adres | Tutar | Durum | OdemeTipi | OdenenMiktar | Notlar | KuryeAdi | Tarih
```
Örnek satır:
```
1 | Ayşe Yılmaz | Cumhuriyet Mah. No:12 | 145 | Bekliyor | | 0 | | Barış | 2026-07-03
```

**Kullanicilar** sayfası:
```
Isim | Sifre | Rol
Barış | 1234 | Kurye
Ahmet | 1234 | Kurye
Serkan | 9999 | Admin
```
(Şifreleri kendine göre değiştir.)

## 2. Backend'i yayınla (Google Apps Script)

1. Sheets içinde **Uzantılar > Apps Script** menüsüne gir.
2. Açılan editördeki boş kodu sil, sana verdiğim **Code.gs** dosyasının içeriğini yapıştır.
3. Üstteki **Dağıt (Deploy) > Yeni dağıtım** butonuna bas.
4. Tür olarak **Web Uygulaması** seç.
5. "Yürüten kişi" → **Ben**, "Erişimi olanlar" → **Herkes** seç.
6. Dağıt'a bas, ilk seferde Google izin ekranı çıkar, kendi hesabınla onayla.
7. Sana bir **Web App URL** verir (https://script.google.com/macros/s/..../exec şeklinde). Bunu kopyala.

> Not: Kodda küçük bir değişiklik yaptığında (ör. rapor mantığını değiştirirsen) her seferinde
> **Dağıt > Dağıtımları Yönet > Düzenle (kalem ikonu) > Yeni Sürüm > Dağıt** yapman gerekir,
> yoksa değişiklik yayına yansımaz.

## 3. index.html içine API adresini yapıştır

`index.html` dosyasını aç, en üstteki script kısmında şu satırı bul:

```js
const API_URL = "BURAYA_GOOGLE_APPS_SCRIPT_WEB_APP_URLINI_YAPISTIR";
```

Tırnak içine 2. adımda kopyaladığın URL'yi yapıştır, kaydet.

## 4. GitHub Pages'e yükle (ücretsiz barındırma)

1. github.com'da yeni bir repo oluştur (ör. `otag-paket-takip`), **Public** seç.
2. Bu klasördeki 5 dosyayı (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`,
   `icon-512.png`) repoya yükle (sürükle-bırak ile GitHub arayüzünden de yapılabilir).
3. Repo içinde **Settings > Pages** sekmesine git.
4. "Branch" olarak `main` / `/ (root)` seç, Save'e bas.
5. Birkaç dakika içinde sana bir adres verir:
   `https://kullaniciadin.github.io/otag-paket-takip/`
   Uygulaman bu adreste canlı olur.

## 5. Telefona "Ana Ekrana Ekle"

- **Android (Chrome):** Adresi aç → sağ üstteki ⋮ menü → "Ana ekrana ekle" / "Uygulamayı yükle".
- **iPhone (Safari):** Adresi aç → alttaki Paylaş ikonu → "Ana Ekrana Ekle".

Kuryelerine bu linki WhatsApp'tan atman yeterli — bir kere "Ana ekrana ekle" dedikten sonra
telefonlarında gerçek bir uygulama ikonu gibi durur, tam ekran açılır.

---

## Test etme

1. GitHub Pages linkini aç.
2. Kullanicilar sayfasındaki isim/şifre ile giriş yap.
3. Kurye olarak giriş yaparsan sadece kendi adının yazılı olduğu siparişleri görürsün.
4. Admin (Serkan) olarak girersen tüm siparişleri ve Rapor sekmesinde günlük
   nakit/POS/veresiye toplamlarını ve kurye performansını görürsün.

## "Şifre yanlış" hatası alıyorsan

Kod artık **Kullanicilar sayfasında sütun sırasına** bakıyor (A sütunu=İsim,
B sütunu=Şifre, C sütunu=Rol), başlık yazısına değil. Yani sayfanın ilk üç
sütunu tam bu sırayla olmalı — başlık hücresinde ne yazdığı (İsim/isim/İSİM
fark etmez).

Sorunu kesin teşhis etmek için:
1. Apps Script'te kodu güncelledikten sonra **mutlaka yeniden Dağıt**
   (Dağıt > Dağıtımları Yönet > kalem ikonu > Yeni Sürüm > Dağıt) — yoksa
   eski kod çalışmaya devam eder, bu en sık yapılan hatadır.
2. Tarayıcıda (veya Postman'da) API_URL'e şu gövdeyle bir POST isteği at:
   ```json
   {"action":"debugUsers"}
   ```
   Dönen cevapta kullanıcı isimlerini, şifre uzunluklarını (şifrenin
   kendisini değil, kaç karakter olduğunu) ve rollerini görürsün. Eğer
   `kullanicilar` listesi boşsa ya da isimler yanlış görünüyorsa, sorun
   Sheets tarafındadır (muhtemelen Kullanicilar sekmesinin adı tam olarak
   "Kullanicilar" değildir, ya da veri A sütunundan başlamıyordur).
3. Şifre sütununu **Biçim > Sayı > Düz Metin** yaparsan, "0123" gibi
   baştaki sıfırlı şifreler kesin korunur.
4. İsim eşleştirmesi büyük/küçük harfe duyarsız (Barış / barış / BARIŞ hepsi
   çalışır), ama şifre eşleştirmesi harfe duyarlıdır — kuryene şifreyi
   birebir söylediğinden emin ol.

## Bilinmesi gerekenler / sınırlar

- **Güvenlik seviyesi:** Bu basit kurulumda şifre kontrolü tarayıcı ile Apps Script
  arasında düz metin gidiyor (HTTPS ile şifreli taşınıyor ama Sheets'te şifreler açık
  metin duruyor). Küçük bir ekip için pratikte sorun değildir, ama hassas/finansal
  veriyse ileride Apps Script tarafında basit bir hash de ekleyebiliriz.
- **Çevrimdışı çalışma:** Service worker sayfayı önbelleğe alır ama sipariş verisi için
  hâlâ internet gerekir (Apps Script'e bağlanmadan yeni veri gelmez).
- **Apps Script limiti:** Ücretsiz Google hesabında günlük ~20.000 istek hakkı var — 2-3
  kuryelik bir market için fazlasıyla yeterli.
- **Yavaş ilk yükleme:** Apps Script "soğuk başlangıç"ta 1-2 saniye gecikme yapabilir,
  normaldir.
