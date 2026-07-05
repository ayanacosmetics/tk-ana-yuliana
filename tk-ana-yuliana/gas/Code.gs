const SHEET_DATA = "Data Barang";
const SHEET_SIAP = "Siap Rilis";

function doGet(e) {
  const action = e.parameter.action;

  if (action === "checkBarcode") {
    return json(checkBarcode_(e.parameter.kode));
  }

  if (action === "siapRilis") {
    return json(getSiapRilis_());
  }

  return json({ success: false, message: "Action tidak dikenal" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === "addBarang") {
    return json(saveBarang_(body));
  }

  if (action === "importSelesai") {
    return json(importSelesai_(body.kode));
  }

  return json({ success: false, message: "Action tidak dikenal" });
}

function saveBarang_(data) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_DATA);

  const existing = findRowByKode_(data.kode);

  const row = buildRow_(data);

  if (data.mode === "edit" && existing.row > 0) {
    sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    return { success: true, mode: "updated" };
  }

  if (existing.row > 0) {
    return { success: false, message: "Kode barang sudah ada" };
  }

  sh.appendRow(row);
  return { success: true, mode: "added" };
}

function buildRow_(data) {
  const row = [
    data.nama || "",
    data.modal || "",
    data.satuan1 || "",
    data.kode || "",
    data.hargaEcer || "",
    data.hargaGrosir1 || ""
  ];

  const multis = data.multis || [];

  for (let i = 0; i < 6; i++) {
    const m = multis[i] || {};
    row.push(m.satuan || "");
    row.push(m.kode || "");
    row.push(m.harga || "");
    row.push(m.isi || "");
  }

  row.push(data.tanggalImport || "");

  return row;
}

function checkBarcode_(kode) {
  const found = findRowByKode_(kode);

  if (found.row === 0) {
    return { exists: false };
  }

  return {
    exists: true,
    row: found.row,
    nama: found.values[0],
    modal: found.values[1],
    satuan1: found.values[2],
    kode: found.values[3],
    hargaEcer: found.values[4],
    hargaGrosir1: found.values[5],
    multis: [
      { satuan: found.values[6], kode: found.values[7], harga: found.values[8], isi: found.values[9] },
      { satuan: found.values[10], kode: found.values[11], harga: found.values[12], isi: found.values[13] },
      { satuan: found.values[14], kode: found.values[15], harga: found.values[16], isi: found.values[17] },
      { satuan: found.values[18], kode: found.values[19], harga: found.values[20], isi: found.values[21] },
      { satuan: found.values[22], kode: found.values[23], harga: found.values[24], isi: found.values[25] },
      { satuan: found.values[26], kode: found.values[27], harga: found.values[28], isi: found.values[29] }
    ],
    tanggalImport: found.values[30] || ""
  };
}

function findRowByKode_(kode) {
  if (!kode) return { row: 0 };

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_DATA);
  const last = sh.getLastRow();

  if (last < 3) return { row: 0 };

  const values = sh.getRange(3, 1, last - 2, 31).getValues();
  const target = String(kode).trim();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][3]).trim() === target) {
      return {
        row: i + 3,
        values: values[i]
      };
    }
  }

  return { row: 0 };
}

function getSiapRilis_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_SIAP);
  const last = sh.getLastRow();

  if (last < 3) return { success: true, items: [] };

  const values = sh.getRange(3, 1, last - 2, 5).getValues();

  const items = values
    .filter(r => r[0] && r[3])
    .map(r => ({
      nama: r[0],
      kode: r[3],
      hargaEcer: r[4]
    }));

  return { success: true, items };
}

function importSelesai_(kode) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_DATA);
  const found = findRowByKode_(kode);

  if (found.row === 0) {
    return { success: false, message: "Kode tidak ditemukan" };
  }

  sh.getRange(found.row, 31).setValue(new Date());
  return { success: true };
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}