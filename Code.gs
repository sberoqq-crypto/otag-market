/**
 * OTAĞ MARKET - PAKET SERVİS TAKİP API
 * ------------------------------------
 * Bu dosyayı Google Sheets'te: Uzantılar > Apps Script içine yapıştır.
 * Sonra "Dağıt > Yeni Dağıtım > Web Uygulaması" ile yayınla.
 *   - Yürüten kişi: Ben (kendi hesabın)
 *   - Erişimi olanlar: Herkes
 * Yayınladıktan sonra sana verilen "Web App URL"i index.html içindeki
 * API_URL değişkenine yapıştıracaksın.
 *
 * Sheet yapısı (sayfa adları aynen böyle olmalı):
 *
 * "Siparisler" sütunları (A'dan itibaren):
 *   SiparisID | MusteriAdi | Adres | Tutar | Durum | OdemeTipi |
 *   OdenenMiktar | Notlar | KuryeAdi | Tarih
 *
 * "Kullanicilar" sütunları:
 *   Isim | Sifre | Rol
 */

const SIPARIS_SHEET = "Siparisler";
const KULLANICI_SHEET = "Kullanicilar";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    switch (action) {
      case "login":
        result = handleLogin(body);
        break;
      case "getOrders":
        result = handleGetOrders(body);
        break;
      case "updateOrder":
        result = handleUpdateOrder(body);
        break;
      case "getReport":
        result = handleGetReport(body);
        break;
      case "addOrder":
        result = handleAddOrder(body);
        break;
      default:
        result = { ok: false, error: "Bilinmeyen işlem: " + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  // Basit sağlık kontrolü (tarayıcıdan URL'yi açınca görünür)
  return jsonResponse({ ok: true, message: "Otağ Market Paket Servis API çalışıyor." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = data[i][idx]));
    obj._row = i + 1; // gerçek satır no (1-index, başlık dahil)
    rows.push(obj);
  }
  return rows;
}

// ---------- LOGIN ----------
function handleLogin(body) {
  const isim = (body.isim || "").trim();
  const sifre = (body.sifre || "").trim();
  const users = sheetToObjects(getSheet(KULLANICI_SHEET));
  const user = users.find(
    (u) => String(u.Isim).trim() === isim && String(u.Sifre).trim() === sifre
  );
  if (!user) {
    return { ok: false, error: "İsim veya şifre hatalı." };
  }
  return { ok: true, isim: user.Isim, rol: user.Rol };
}

// ---------- SİPARİŞLERİ GETİR ----------
function handleGetOrders(body) {
  const rol = body.rol;
  const isim = body.isim;
  let orders = sheetToObjects(getSheet(SIPARIS_SHEET));

  if (rol !== "Admin") {
    orders = orders.filter((o) => String(o.KuryeAdi).trim() === String(isim).trim());
  }
  // Tarihleri okunabilir string'e çevir
  orders.forEach((o) => {
    if (o.Tarih instanceof Date) {
      o.Tarih = Utilities.formatDate(o.Tarih, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    }
  });
  return { ok: true, orders: orders };
}

// ---------- SİPARİŞ GÜNCELLE (Teslim Edildi formu) ----------
function handleUpdateOrder(body) {
  const sheet = getSheet(SIPARIS_SHEET);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowIndex = findRowBySiparisID(sheet, headers, body.siparisId);
  if (!rowIndex) return { ok: false, error: "Sipariş bulunamadı." };

  const updates = {
    Durum: "Teslim Edildi",
    OdemeTipi: body.odemeTipi,
    OdenenMiktar: body.odenenMiktar,
    Notlar: body.notlar || "",
  };

  Object.keys(updates).forEach((key) => {
    const colIdx = headers.indexOf(key);
    if (colIdx > -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(updates[key]);
    }
  });

  return { ok: true };
}

function findRowBySiparisID(sheet, headers, siparisId) {
  const idCol = headers.indexOf("SiparisID");
  const data = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(siparisId)) {
      return i + 2; // başlık satırı +1
    }
  }
  return null;
}

// ---------- YENİ SİPARİŞ EKLE (opsiyonel, admin için) ----------
function handleAddOrder(body) {
  const sheet = getSheet(SIPARIS_SHEET);
  const lastRow = sheet.getLastRow();
  const newId = lastRow; // basit otomatik ID; istersen değiştir
  sheet.appendRow([
    newId,
    body.musteriAdi,
    body.adres,
    body.tutar,
    "Bekliyor",
    "",
    0,
    "",
    body.kuryeAdi,
    new Date(),
  ]);
  return { ok: true, siparisId: newId };
}

// ---------- RAPOR (admin ekranı) ----------
function handleGetReport(body) {
  const orders = sheetToObjects(getSheet(SIPARIS_SHEET));
  const bugun = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  let nakitToplam = 0;
  let posToplam = 0;
  let veresiyeToplam = 0;
  const kuryePerf = {};

  orders.forEach((o) => {
    const tarihStr =
      o.Tarih instanceof Date
        ? Utilities.formatDate(o.Tarih, Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(o.Tarih).slice(0, 10);

    if (o.Durum === "Teslim Edildi" && tarihStr === bugun) {
      const miktar = Number(o.OdenenMiktar) || 0;
      if (o.OdemeTipi === "Nakit") nakitToplam += miktar;
      else if (o.OdemeTipi === "POS") posToplam += miktar;
      else if (o.OdemeTipi === "Veresiye") veresiyeToplam += miktar;

      const kurye = o.KuryeAdi || "Bilinmiyor";
      if (!kuryePerf[kurye]) kuryePerf[kurye] = 0;
      kuryePerf[kurye] += 1;
    }
  });

  return {
    ok: true,
    tarih: bugun,
    nakitToplam,
    posToplam,
    veresiyeToplam,
    kuryePerformans: kuryePerf,
  };
}
