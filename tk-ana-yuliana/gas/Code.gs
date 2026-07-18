const SHEET_TOKO = "Toko";
const SHEET_AKUN = "Akun";
const SHEET_ROLE = "Role";

const SHEET_DATA = "Data Barang";
const SHEET_SIAP = "Siap Rilis";
const COLS = 32;
const TEMPLATE_ID = "1zy62rHIFAoPK2bM96gk1cx02pxuFzps-4GThqai5m7s";

function doGet(e) {
  const action = e.parameter.action;

  // -- MASTER ENDPOINTS --
  if (action === "getTokoApi") return json(getTokoApi_(e.parameter.toko));
  if (action === "listToko") return json(listToko_());
  if (action === "listAkun") return json(listAkun_());
  if (action === "listRole") return json(listRole_());
  if (action === "loginMaster" || action === "login") {
    return json(loginMaster_(e.parameter.username, e.parameter.pin));
  }

  // -- STORE ENDPOINTS --
  const ssId = e.parameter.spreadsheetId || e.parameter.api; // fallback if frontend still sends api
  if (!ssId && (
      action === "automationSelesai" || action === "kaspinExportData" || 
      action === "kaspinAutomationData" || action === "getBarcodeList" || 
      action === "getBarang" || action === "siapRilis" || 
      action === "modalKosong" || action === "jumlahPerbaikan" || 
      action === "dashboardSummary" || action === "tugasPerbaikan")) {
    return json({ success: false, message: "spreadsheetId diperlukan." });
  }

  if (action === "automationSelesai") return json(getAutomationSelesai_(ssId));
  if (action === "kaspinExportData") return json(getKaspinExportData_(ssId));
  if (action === "kaspinAutomationData") return json(getKaspinAutomationData_(ssId));
  if (action === "getBarcodeList") return json(getBarcodeList_(ssId));
  if (action === "getBarang") return json(getBarang_(ssId, e.parameter.kode));
  if (action === "siapRilis") return json(getSiapRilis_(ssId));
  if (action === "modalKosong") return json(getModalKosong_(ssId));
  if (action === "jumlahPerbaikan") return json(jumlahPerbaikan_(ssId, e.parameter.petugas));
  if (action === "dashboardSummary") return json(getDashboardSummary_(ssId, e.parameter.petugas));
  if (action === "tugasPerbaikan") return json(getTugasPerbaikan_(ssId, e.parameter.petugas));

  return json({ success: true });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  // -- MASTER ENDPOINTS --
  if (action === "saveToko") return json(saveToko_(data));
  if (action === "saveAkun") return json(saveAkun_(data));
  if (action === "deleteAkun") return json(deleteAkun_(data.username));

  // -- STORE ENDPOINTS --
  // Can be in URL parameter or JSON body
  const ssId = e.parameter.spreadsheetId || data.spreadsheetId || data.api;

  if (action === "automationLog") return json(saveAutomationLog_(ssId, data));
  if (action === "saveExportHistory") return json(saveExportHistory_(ssId, data));
  if (action === "addBarang") return json(addBarang_(ssId, data));
  if (action === "updateBarang") return json(updateBarang_(ssId, data));
  if (action === "updateModal") return json(updateModal_(ssId, data.row, data.modal));
  if (action === "importSemua") return json(importSemua_(ssId, data.codes || []));
  if (action === "importSelesai") return json(importSemua_(ssId, [data.kode]));
  if (action === "simpanPerbaikan") return json(simpanPerbaikan_(ssId, data));

  return json({ success: false, message: "Action tidak dikenal" });
}

// ==========================================
// MASTER FUNCTIONS
// ==========================================

function loginMaster_(username, pin) {
  const ss = SpreadsheetApp.getActive();
  const shAkun = ss.getSheetByName(SHEET_AKUN);
  const shToko = ss.getSheetByName(SHEET_TOKO);
  const shRole = ss.getSheetByName(SHEET_ROLE);

  if (!shAkun || !shToko) {
    return { success: false, message: "Sheet Akun/Toko belum ada di Master." };
  }

  username = String(username || "").trim().toLowerCase();
  pin = String(pin || "").trim();

  const akunValues = shAkun.getRange(2, 1, Math.max(shAkun.getLastRow() - 1, 0), 6).getDisplayValues();
  const tokoValues = shToko.getRange(2, 1, Math.max(shToko.getLastRow() - 1, 0), 5).getDisplayValues();

  const tokoMap = {};
  tokoValues.forEach(r => {
    const id = String(r[0] || "").trim();
    if (!id) return;
    tokoMap[id] = {
      id,
      nama: r[1],
      api: r[2], // Ini sekarang menyimpan ID Spreadsheet toko
      logo: r[3],
      status: String(r[4] || "").trim().toLowerCase()
    };
  });

  const roleValues = shRole ? shRole.getRange(2, 1, Math.max(shRole.getLastRow() - 1, 0), 8).getDisplayValues() : [];
  const roleMap = {};
  roleValues.forEach(r => {
    roleMap[String(r[0]).trim().toLowerCase()] = {
      dashboard: r[1] === "Y",
      input: r[2] === "Y",
      perbaikan: r[3] === "Y",
      modal: r[4] === "Y",
      export: r[5] === "Y",
      admin: r[6] === "Y"
    };
  });

  for (const r of akunValues) {
    const u = String(r[0] || "").trim().toLowerCase();
    const nama = String(r[1] || "").trim();
    const p = String(r[2] || "").trim();
    const role = String(r[3] || "staff").trim();
    const tokoId = String(r[4] || "").trim();
    const status = String(r[5] || "").trim().toLowerCase();

    if (u === username && p === pin && status === "aktif") {
      const toko = tokoMap[tokoId];

      if (!toko || toko.status !== "aktif") {
        return { success: false, message: "Toko tidak aktif / tidak ditemukan." };
      }

      const permission = roleMap[role.toLowerCase()] || {};

      return {
        success: true,
        user: {
          username: u,
          name: nama,
          role,
          toko: tokoId,
          tokoNama: toko.nama,
          apiUrl: toko.api, // ID Spreadsheet toko dikembalikan ke frontend
          logo: toko.logo,
          permission
        }
      };
    }
  }

  return { success: false, message: "Username atau PIN salah." };
}

function saveToko_(data) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_TOKO);
  const values = sh.getDataRange().getValues();

  const id = String(data.id || "").trim();
  if (!id) return { success: false, message: "ID toko wajib diisi." };

  let existingRow = -1;
  let apiId = data.api || "";

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === id) {
      existingRow = i + 1;
      if (!apiId) {
        apiId = String(values[i][2]).trim();
      }
      break;
    }
  }

  // Jika ini toko baru dan apiId kosong, duplikasi template!
  if (existingRow === -1 && !apiId) {
    try {
      const template = DriveApp.getFileById(TEMPLATE_ID);
      const copy = template.makeCopy("Toko: " + (data.nama || id));
      apiId = copy.getId();
    } catch(err) {
      return { 
        success: false, 
        message: "Gagal membuat spreadsheet dari template. Pastikan akun Google memiliki akses ke file template: " + err.message 
      };
    }
  }

  const rowData = [
    id,
    data.nama || "",
    apiId,
    data.logo || "",
    data.status || "aktif"
  ];

  if (existingRow > -1) {
    sh.getRange(existingRow, 1, 1, 5).setValues([rowData]);
  } else {
    sh.appendRow(rowData);
  }
  
  return { success: true };
}

function listToko_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_TOKO);
  const last = sh.getLastRow();
  if (last < 2) return { success: true, items: [] };

  const values = sh.getRange(2, 1, last - 1, 5).getDisplayValues();

  return {
    success: true,
    items: values.filter(r => r[0]).map(r => ({
      id: r[0],
      nama: r[1],
      api: r[2], // spreadsheetId
      logo: r[3],
      status: r[4]
    }))
  };
}

function getTokoApi_(idToko) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_TOKO);
  const last = sh.getLastRow();
  if (last < 2) return { success: false, message: "Data toko kosong." };

  const values = sh.getRange(2, 1, last - 1, 5).getDisplayValues();
  idToko = String(idToko || "").trim().toLowerCase();

  for (const r of values) {
    const id = String(r[0] || "").trim().toLowerCase();
    const status = String(r[4] || "").trim().toLowerCase();
    if (id === idToko && status === "aktif") {
      return {
        success: true,
        id,
        nama: String(r[1] || "").trim(),
        apiUrl: String(r[2] || "").trim()
      };
    }
  }
  return { success: false, message: "Toko tidak ditemukan atau tidak aktif." };
}

function listAkun_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_AKUN);
  const last = sh.getLastRow();
  if (last < 2) return { success: true, items: [] };

  const values = sh.getRange(2, 1, last - 1, 6).getDisplayValues();

  return {
    success: true,
    items: values.filter(r => r[0]).map(r => ({
      username: r[0],
      nama: r[1],
      pin: r[2],
      role: r[3],
      toko: r[4],
      status: r[5]
    }))
  };
}

function listRole_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_ROLE);
  if (!sh) return { success: true, items: [] };
  const last = sh.getLastRow();
  if (last < 2) return { success: true, items: [] };

  const values = sh.getRange(2, 1, last - 1, 8).getDisplayValues();

  return {
    success: true,
    items: values.filter(r => r[0]).map(r => ({
      nama: r[0],
      dashboard: String(r[1] || "").trim().toUpperCase() === "Y",
      input: String(r[2] || "").trim().toUpperCase() === "Y",
      perbaikan: String(r[3] || "").trim().toUpperCase() === "Y",
      modal: String(r[4] || "").trim().toUpperCase() === "Y",
      export: String(r[5] || "").trim().toUpperCase() === "Y",
      admin: String(r[6] || "").trim().toUpperCase() === "Y",
      status: r[7]
    }))
  };
}

function saveAkun_(data) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_AKUN);
  const values = sh.getDataRange().getValues();

  const username = String(data.username || "").trim().toLowerCase();
  if (!username) return { success: false, message: "Username wajib diisi." };

  const rowData = [
    username,
    data.nama || "",
    data.pin || "",
    data.role || "staff",
    data.toko || "",
    data.status || "aktif"
  ];

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === username) {
      sh.getRange(i + 1, 1, 1, 6).setValues([rowData]);
      return { success: true };
    }
  }

  sh.appendRow(rowData);
  return { success: true };
}

function deleteAkun_(username) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_AKUN);
  const values = sh.getDataRange().getValues();
  username = String(username || "").trim().toLowerCase();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === username) {
      sh.getRange(i + 1, 6).setValue("nonaktif");
      return { success: true };
    }
  }
  return { success: false, message: "Akun tidak ditemukan." };
}


// ==========================================
// STORE FUNCTIONS (Requires ssId)
// ==========================================

function addBarang_(ssId, data) {
  const ss = SpreadsheetApp.openById(ssId);
  const found = findBarang_(ss, data.kode);
  if (found.exists) return { success: false, message: "Barcode sudah terdaftar" };

  const sh = ss.getSheetByName(SHEET_DATA);
  sh.appendRow(buildValues_(data));
  return { success: true, mode: "added" };
}

function updateBarang_(ssId, data) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  const row = Number(data.row);
  if (!row) return { success: false, message: "Baris barang tidak ditemukan" };

  sh.getRange(row, 1, 1, COLS).setValues([buildValues_(data)]);
  return { success: true, mode: "updated", row };
}

function buildValues_(data) {
  const multis = data.multis || [];
  const m2 = multis[0] || {};
  const m3 = multis[1] || {};
  const m4 = multis[2] || {};

  return [
    data.nama || "", data.modal || "", data.satuan1 || "", data.kode || "",
    data.hargaEcer || "", data.hargaGrosir1 || "", data.hargaGrosir2_1 || "", data.hargaGrosir3_1 || "",

    m2.satuan || "", m2.isi || "", m2.kode || "", m2.harga1 || "", m2.harga2 || "", m2.harga3 || "",
    m3.satuan || "", m3.isi || "", m3.kode || "", m3.harga1 || "", m3.harga2 || "", m3.harga3 || "",
    m4.satuan || "", m4.isi || "", m4.kode || "", m4.harga1 || "", m4.harga2 || "", m4.harga3 || "",

    "", data.petugas || "", new Date(), "", "", ""
  ];
}

function getBarang_(ssId, kode) {
  const ss = SpreadsheetApp.openById(ssId);
  const found = findBarang_(ss, kode);
  if (!found.exists) return { success: true, exists: false };

  const v = found.values;

  return {
    success: true,
    exists: true,
    row: found.row,
    nama: v[0] || "", modal: v[1] || "", satuan1: v[2] || "", kode: v[3] || "",
    hargaEcer: v[4] || "", hargaGrosir1: v[5] || "", hargaGrosir2_1: v[6] || "", hargaGrosir3_1: v[7] || "",
    multis: [
      { satuan: v[8] || "", isi: v[9] || "", kode: v[10] || "", harga1: v[11] || "", harga2: v[12] || "", harga3: v[13] || "" },
      { satuan: v[14] || "", isi: v[15] || "", kode: v[16] || "", harga1: v[17] || "", harga2: v[18] || "", harga3: v[19] || "" },
      { satuan: v[20] || "", isi: v[21] || "", kode: v[22] || "", harga1: v[23] || "", harga2: v[24] || "", harga3: v[25] || "" }
    ]
  };
}

function findBarang_(ss, kode) {
  if (!kode) return { exists: false };
  const target = String(kode).trim();
  if (!target || target.toLowerCase() === "x") return { exists: false };

  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();
  if (last < 4) return { exists: false };

  const data = sh.getRange(4, 1, last - 3, COLS).getValues();

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const codes = [r[3], r[10], r[16], r[22]];
    for (const c of codes) {
      if (String(c || "").trim() === target) {
        return { exists: true, row: i + 4, values: r };
      }
    }
  }
  return { exists: false };
}

function getBarcodeList_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();
  if (last < 4) return { success: true, items: [] };

  const data = sh.getRange(4, 1, last - 3, COLS).getValues();
  const items = [];

  data.forEach((r, i) => {
    const row = i + 4;
    const nama = r[0] || "";
    const codes = [r[3], r[10], r[16], r[22]];

    codes.forEach(kode => {
      const k = String(kode || "").trim();
      if (k && k.toLowerCase() !== "x") {
        items.push({ kode: k, row, nama });
      }
    });
  });
  return { success: true, items };
}

function getSiapRilis_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_SIAP);
  const last = sh.getLastRow();
  if (last < 3) return { success: true, items: [] };

  const values = sh.getRange(3, 1, last - 2, COLS).getValues();
  const items = values.filter(r => r[0] && r[3]).map(r => ({
    nama: r[0], modal: r[1], satuan1: r[2], kode: r[3],
    hargaEcer: r[4], hargaGrosir1: r[5], tanggalImport: r[26]
  }));
  return { success: true, items };
}

function importSemua_(ssId, codes) {
  if (!codes.length) return { success: false, message: "Tidak ada barang siap rilis." };
  
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();
  if (last < 4) return { success: false, message: "Data Barang kosong." };

  const today = new Date();
  const kodeSet = new Set(codes.map(c => String(c).trim()));
  const kodeValues = sh.getRange(4, 4, last - 3, 1).getValues();
  const tanggalRange = sh.getRange(4, 27, last - 3, 1);
  const tanggalValues = tanggalRange.getValues();
  let count = 0;

  for (let i = 0; i < kodeValues.length; i++) {
    const kode = String(kodeValues[i][0]).trim();
    if (kodeSet.has(kode)) {
      tanggalValues[i][0] = today;
      count++;
    }
  }
  tanggalRange.setValues(tanggalValues);
  return { success: true, count };
}

function getModalKosong_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();
  if (last < 4) return { success: true, items: [] };

  const values = sh.getRange(4, 1, last - 3, COLS).getDisplayValues();
  const items = [];

  values.forEach((r, i) => {
    const modal = String(r[1]).trim();
    if (r[0] && (modal === "0" || modal === "0,00" || modal === "0.00" || modal === "")) {
      items.push({
        row: i + 4, nama: r[0], modal: r[1], satuan1: r[2], kode: r[3],
        hargaEcer: r[4], hargaGrosir1: r[5], hargaGrosir2_1: r[6], hargaGrosir3_1: r[7],
        satuan2: r[8], isi2: r[9], kode2: r[10], harga2_1: r[11], harga2_2: r[12], harga2_3: r[13],
        satuan3: r[14], isi3: r[15], kode3: r[16], harga3_1: r[17], harga3_2: r[18], harga3_3: r[19],
        satuan4: r[20], isi4: r[21], kode4: r[22], harga4_1: r[23], harga4_2: r[24], harga4_3: r[25]
      });
    }
  });
  return { success: true, items };
}

function updateModal_(ssId, row, modal) {
  row = Number(row);
  if (!row) return { success: false, message: "Baris tidak ditemukan" };
  
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  sh.getRange(row, 2).setValue(modal);
  return { success: true };
}

function getTugasPerbaikan_(ssId, petugas) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();
  if (last < 4) return { success: true, items: [] };

  const values = sh.getRange(4, 1, last - 3, COLS).getDisplayValues();
  const items = [];

  values.forEach((r, i) => {
    const diinputOleh = r[27];
    if (String(diinputOleh).trim() !== String(petugas).trim()) return;

    const row = i + 4;
    const fields = [];
    const map = [
      { col: 4, label: "Kode Barang Satuan Terkecil", type: "text", placeholder: "Scan / ketik kode benar" },
      { col: 5, label: `Harga Ecer per ${r[2] || "satuan terkecil"}`, type: "number", placeholder: "Isi harga ecer benar" },
      { col: 6, label: `Harga Grosir 1 per ${r[2] || "satuan terkecil"}`, type: "number", placeholder: "Isi harga grosir benar" },
      { col: 7, label: `Harga Grosir 2 per ${r[2] || "satuan terkecil"}`, type: "number", placeholder: "Isi harga grosir 2 benar" },
      { col: 8, label: `Harga Grosir 3 per ${r[2] || "satuan terkecil"}`, type: "number", placeholder: "Isi harga grosir 3 benar" },
      { col: 9, label: "Satuan setelah satuan terkecil", type: "text", placeholder: "Isi satuan benar" },
      { col: 10, label: `Isi ${r[8] || "Satuan 2"}`, type: "number", placeholder: "Isi jumlah benar" },
      { col: 11, label: `Kode Barang ${r[8] || "Satuan 2"}`, type: "text", placeholder: "Scan / ketik kode benar" },
      { col: 12, label: `Harga Grosir 1 per ${r[8] || "Satuan 2"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 13, label: `Harga Grosir 2 per ${r[8] || "Satuan 2"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 14, label: `Harga Grosir 3 per ${r[8] || "Satuan 2"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 15, label: "Satuan setelah Satuan 2", type: "text", placeholder: "Isi satuan benar" },
      { col: 16, label: `Isi ${r[14] || "Satuan 3"}`, type: "number", placeholder: "Isi jumlah benar" },
      { col: 17, label: `Kode Barang ${r[14] || "Satuan 3"}`, type: "text", placeholder: "Scan / ketik kode benar" },
      { col: 18, label: `Harga Grosir 1 per ${r[14] || "Satuan 3"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 19, label: `Harga Grosir 2 per ${r[14] || "Satuan 3"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 20, label: `Harga Grosir 3 per ${r[14] || "Satuan 3"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 21, label: "Satuan setelah Satuan 3", type: "text", placeholder: "Isi satuan benar" },
      { col: 22, label: `Isi ${r[20] || "Satuan 4"}`, type: "number", placeholder: "Isi jumlah benar" },
      { col: 23, label: `Kode Barang ${r[20] || "Satuan 4"}`, type: "text", placeholder: "Scan / ketik kode benar" },
      { col: 24, label: `Harga Grosir 1 per ${r[20] || "Satuan 4"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 25, label: `Harga Grosir 2 per ${r[20] || "Satuan 4"}`, type: "number", placeholder: "Isi harga benar" },
      { col: 26, label: `Harga Grosir 3 per ${r[20] || "Satuan 4"}`, type: "number", placeholder: "Isi harga benar" }
    ];

    map.forEach(f => {
      if (String(r[f.col - 1]).trim().toLowerCase() === "x") {
        fields.push(f);
      }
    });

    if (fields.length) {
      items.push({ row, nama: r[0], satuan1: r[2], kode: r[3], fields });
    }
  });
  return { success: true, items };
}

function jumlahPerbaikan_(ssId, petugas) {
  const data = getTugasPerbaikan_(ssId, petugas);
  return { success: true, count: data.items.length };
}

function simpanPerbaikan_(ssId, data) {
  const row = Number(data.row);
  const updates = data.updates || [];
  if (!row || !updates.length) return { success: false, message: "Data perbaikan tidak lengkap." };

  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);

  updates.forEach(u => {
    sh.getRange(row, Number(u.col)).setValue(u.value);
  });

  sh.getRange(row, 30).setValue("Selesai diperbaiki");
  sh.getRange(row, 31).setValue(new Date());
  sh.getRange(row, 32).setValue(data.petugas || "");
  return { success: true };
}

function getAutomationSelesai_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName("Log Automation");
  if (!sh || sh.getLastRow() < 2) return { success: true, barcodes: [] };

  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getDisplayValues();
  const barcodes = new Set();
  values.forEach(row => {
    const barcode = String(row[3] || "").trim();
    const status = String(row[4] || "").trim().toUpperCase();
    if (barcode && status === "BERHASIL") barcodes.add(barcode);
  });
  return { success: true, barcodes: Array.from(barcodes) };
}

function getDashboardSummary_(ssId, petugas) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName(SHEET_DATA);
  if (!sh) return { success: false, message: "Sheet Data Barang tidak ada" };

  const lastRow = sh.getLastRow();
  if (lastRow < 4) return { success: true, totalBarang: 0, barangSaya: 0 };

  const values = sh.getRange(4, 1, lastRow - 3, COLS).getDisplayValues();
  let totalBarang = 0, barangSaya = 0;
  petugas = String(petugas || "").trim().toLowerCase();

  values.forEach(r => {
    const nama = String(r[0] || "").trim();
    const inputBy = String(r[27] || "").trim().toLowerCase();
    if (nama) totalBarang++;
    if (nama && inputBy === petugas) barangSaya++;
  });
  return { success: true, totalBarang, barangSaya };
}

function getKaspinExportData_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName("Data Barang");
  const last = sh.getLastRow();
  if (last < 4) return { success: true, rows: [] };
  const values = sh.getRange(4, 1, last - 3, 32).getDisplayValues();
  return { success: true, rows: values };
}

function saveExportHistory_(ssId, data) {
  const ss = SpreadsheetApp.openById(ssId);
  let sh = ss.getSheetByName("Riwayat Export");
  if (!sh) {
    sh = ss.insertSheet("Riwayat Export");
    sh.appendRow(["Tanggal", "User", "Role", "Toko", "Barang", "Multi Satuan", "Harga Grosir", "Total Data"]);
  }
  sh.appendRow([new Date(), data.user || "", data.role || "", data.toko || "", data.barang || 0, data.multi || 0, data.grosir || 0, data.total || 0]);
  return { success: true };
}

function getKaspinAutomationData_(ssId) {
  const ss = SpreadsheetApp.openById(ssId);
  const sh = ss.getSheetByName("Data Barang");
  if (!sh) return { success: false, message: "Sheet Data Barang tidak ditemukan." };

  const lastRow = sh.getLastRow();
  if (lastRow < 4) return { success: true, count: 0, items: [] };

  const rows = sh.getRange(4, 1, lastRow - 3, 32).getDisplayValues();
  const items = [];

  rows.forEach((r, index) => {
    const namaBarang = cleanAutomation_(r[0]);
    const satuan1 = cleanAutomation_(r[2]);
    const barcodeUtama = cleanAutomation_(r[3]);
    const hargaEcer = numAutomation_(r[4]);
    const satuan2 = cleanAutomation_(r[8]), isi2 = numAutomation_(r[9]), barcode2 = cleanAutomation_(r[10]), harga2 = numAutomation_(r[11]);
    const satuan3 = cleanAutomation_(r[14]), isi3 = numAutomation_(r[15]), barcode3 = cleanAutomation_(r[16]), harga3 = numAutomation_(r[17]);

    if (!namaBarang || !barcodeUtama || !satuan1) return;
    if (barcode2 === "" && barcode3 === "") return;

    const satuanTambahan = [];
    if (satuan2 && isi2 > 0 && harga2 > 0 && barcode2) {
      satuanTambahan.push({ level: 2, nama: satuan2, barcode: barcode2, jumlah: isi2, harga: harga2 });
    }
    if (satuan3 && isi3 > 0 && harga3 > 0 && barcode3) {
      satuanTambahan.push({ level: 3, nama: satuan3, barcode: barcode3, jumlah: isi3, harga: harga3 });
    }
    if (!satuanTambahan.length) return;

    items.push({
      row: index + 4, namaBarang, barcodeUtama, satuanTerkecil: satuan1, hargaEcer,
      adaSatuanTanpaBarcode: Boolean((satuan2 && isi2 > 0 && harga2 > 0 && !barcode2) || (satuan3 && isi3 > 0 && harga3 > 0 && !barcode3)),
      satuanTambahan
    });
  });
  return { success: true, count: items.length, items };
}

function saveAutomationLog_(ssId, data) {
  const ss = SpreadsheetApp.openById(ssId);
  let sh = ss.getSheetByName("Log Automation");
  if (!sh) {
    sh = ss.insertSheet("Log Automation");
    sh.appendRow(["Waktu", "Baris Data", "Nama Barang", "Barcode Utama", "Status", "Keterangan"]);
    sh.setFrozenRows(1);
  }
  const waktu = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  sh.appendRow([waktu, data.row || "", data.namaBarang || "", data.barcodeUtama || "", String(data.status || "").toUpperCase(), data.keterangan || ""]);
  return { success: true };
}

function cleanAutomation_(value) { return String(value || "").trim(); }
function numAutomation_(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  return Number(String(value).replace(/\./g, "").replace(/,/g, "").replace(/[^\d]/g, "")) || 0;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}