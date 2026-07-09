const path = require("path");
const XLSX = require("xlsx");
const JSZip = require("jszip");

const MASTER_GAS_URL = process.env.MASTER_GAS_URL;

function clean(v) {
  return String(v || "").trim();
}

function num(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;

  return Number(
    String(v)
      .replace(/\./g, "")
      .replace(/,/g, "")
      .replace(/[^\d]/g, "")
  ) || 0;
}

function clearRange(ws, startRow, endRow, startCol, endCol) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      delete ws[cell];
    }
  }
}

function makeBarangRows(rows) {
  return rows
    .filter(r => clean(r[0]) && clean(r[3]))
    .map(r => {
      const nama = clean(r[0]);
      const modal = num(r[1]);
      const kode = clean(r[3]);
      const hargaEcer = num(r[4]);

      const isi2 = num(r[9]);
      const isi3 = num(r[15]);

      const isiTertinggi = Math.max(1, isi2, isi3);
      const hargaBeli = Math.round(modal / isiTertinggi);

      return [
        "",          // alasan_gagal
        kode,        // data_kode_barang
        nama,        // data_nama_barang
        hargaBeli,   // data_harga_beli
        hargaEcer,   // data_harga_jual
        0,           // data_stok
        0,           // data_barang_jasa
        0,           // data_show_toko
        0,           // minimum_stok
        0,           // tipe_diskon
        0,           // diskon
        "",          // berat_dan_satuan
        0,           // berat
        "",          // letak_rak
        "",          // keterangan
        "",          // kategori
        ""           // gambar
      ];
    });
}

function fillBarangTemplate(rows) {
  const templatePath = path.join(
    __dirname,
    "templates",
    "TEMPLATE_BARANG.xls"
  );

  const workbook = XLSX.readFile(templatePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];

  clearRange(ws, 2, 5000, 0, 16);

  // Isi mulai baris 3 karena template barang biasanya punya header di baris 1-2
  XLSX.utils.sheet_add_aoa(ws, rows, {
    origin: "A3"
  });

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xls"
  });
}

function fillMultiTemplate(rows) {

  const templatePath = path.join(
    __dirname,
    "templates",
    "TEMPLATE_MULTI_SATUAN.xls"
  );

  const workbook = XLSX.readFile(templatePath);

  const ws = workbook.Sheets[
    workbook.SheetNames[0]
  ];

  clearRange(ws, 1, 5000, 0, 4);

  XLSX.utils.sheet_add_aoa(ws, rows, {
    origin: "A2"
  });

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xls"
  });

}

module.exports = async function handler(req, res) {
  try {
    if (!MASTER_GAS_URL) {
      return res.status(500).json({
        success: false,
        message: "MASTER_GAS_URL belum diatur di Vercel."
      });
    }

    const toko = String(req.query.toko || "").trim().toLowerCase();
    const userName = String(req.query.user || "").trim();
    const userRole = String(req.query.role || "").trim();
    const exportBarang = req.query.barang !== "0";
    const exportMulti = req.query.multi !== "0";
    const exportGrosir = req.query.grosir !== "0";

    if (!exportBarang && !exportMulti && !exportGrosir) {
      return res.status(400).json({
        success: false,
        message: "Pilih minimal satu file untuk diexport."
      });
    }

    if (!toko) {
      return res.status(400).json({
        success: false,
        message: "Parameter toko tidak ditemukan."
      });
    }

    const tokoRes = await fetch(
      `${MASTER_GAS_URL}?action=getTokoApi&toko=${encodeURIComponent(toko)}`
    );

    const tokoData = await tokoRes.json();

    if (!tokoData.success || !tokoData.apiUrl) {
      return res.status(400).json({
        success: false,
        message: tokoData.message || "API toko tidak ditemukan."
      });
    }

    const response = await fetch(`${tokoData.apiUrl}?action=kaspinExportData`);
    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: "Gagal mengambil data dari Apps Script toko."
      });
    }

    const zip = new JSZip();
    let countBarang = 0;
    let countMulti = 0;
    let countGrosir = 0;

    if (exportBarang) {
      const barangRows = makeBarangRows(data.rows);
      countBarang = barangRows.length;
      const barangFile = fillBarangTemplate(barangRows);
      zip.file("TEMPLATE_BARANG.xls", barangFile);
    }

    if (exportMulti) {
      const multiRows = makeMultiRows(data.rows);
      countMulti = multiRows.length;
      const multiFile = fillMultiTemplate(multiRows);
      zip.file("TEMPLATE_MULTI_SATUAN.xls", multiFile);
    }

    if (exportGrosir) {
      const grosirRows = makeGrosirRows(data.rows);
      countGrosir = grosirRows.length;
      const grosirFile = fillGrosirTemplate(grosirRows);
      zip.file("TEMPLATE_HARGA_GROSIR.xls", grosirFile);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer"
    });

    fetch(tokoData.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveExportHistory",
        user: userName,
        role: userRole,
        toko: tokoData.nama || toko,
        barang: countBarang,
        multi: countMulti,
        grosir: countGrosir,
        total: countBarang + countMulti + countGrosir
      })
    }).catch(() => {});

    const safeNama = String(tokoData.nama || toko)
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_");
    
    let fileName = "";

    if (exportBarang && exportMulti && exportGrosir) {
      fileName = `EXPORT_POS_${safeNama}`;
    } else {
      const parts = [];

      if (exportBarang) parts.push("BARANG");
      if (exportMulti) parts.push("MULTI_SATUAN");
      if (exportGrosir) parts.push("HARGA_GROSIR");

      fileName = `${parts.join("_")}_${safeNama}`;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}.zip`
    );

    return res.status(200).send(zipBuffer);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

function makeMultiRows(rows) {
  const result = [];

  rows.forEach(r => {
    const kode1 = clean(r[3]);
    const satuan1 = clean(r[2]);
    const hargaEcer = num(r[4]);

    if (!kode1 || !satuan1) return;

    // SATUAN 1
    result.push([
      kode1,
      satuan1,
      hargaEcer,
      1,
      satuan1
    ]);

    // SATUAN 2
    const satuan2 = clean(r[8]);
    const isi2 = num(r[9]);
    const kode2 = clean(r[10]);
    const hargaGrosir1Satuan2 = num(r[11]);

    if (satuan2 && isi2 > 0 && hargaGrosir1Satuan2 > 0) {
      result.push([
        kode1,
        satuan2,
        hargaGrosir1Satuan2,
        isi2,
        satuan1
      ]);
    }

    // SATUAN 3
    const satuan3 = clean(r[14]);
    const isi3 = num(r[15]);
    const kode3 = clean(r[16]);
    const hargaGrosir1Satuan3 = num(r[17]);

    if (satuan3 && isi3 > 0 && hargaGrosir1Satuan3 > 0) {
      result.push([
        kode1,
        satuan3,
        hargaGrosir1Satuan3,
        isi3,
        satuan1
      ]);
    }
  });

  return result;
}

function makeGrosirRows(rows) {
  const out = [];

  function add(kode, tipe, minimal, harga) {
    if (!kode || !harga || harga <= 0) return;
    out.push([kode, tipe, minimal, harga]);
  }

  function hargaPerPcs(hargaTotal, isi) {
    if (!hargaTotal || !isi) return 0;
    return Math.round(hargaTotal / isi);
  }

  rows.forEach(r => {
    const kode1 = clean(r[3]);
    if (!clean(r[0]) || !kode1) return;

    // SATUAN 1 / PCS
    add(kode1, "Grosir 1", 1, num(r[5]));
    add(kode1, "Grosir 2", 1, num(r[6]));
    add(kode1, "Grosir 3", 1, num(r[7]));

    // SATUAN 2
    const isi2 = num(r[9]);
    if (isi2 > 0) {
      add(kode1, "Grosir 1", isi2, hargaPerPcs(num(r[11]), isi2));
      add(kode1, "Grosir 2", isi2, hargaPerPcs(num(r[12]), isi2));
      add(kode1, "Grosir 3", isi2, hargaPerPcs(num(r[13]), isi2));
    }

    // SATUAN 3
    const isi3 = num(r[15]);
    if (isi3 > 0) {
      add(kode1, "Grosir 1", isi3, hargaPerPcs(num(r[17]), isi3));
      add(kode1, "Grosir 2", isi3, hargaPerPcs(num(r[18]), isi3));
      add(kode1, "Grosir 3", isi3, hargaPerPcs(num(r[19]), isi3));
    }
  });

  return out;
}

function fillGrosirTemplate(rows) {
  const templatePath = path.join(
    __dirname,
    "templates",
    "TEMPLATE_HARGA_GROSIR.xls"
  );

  const workbook = XLSX.readFile(templatePath);
  const ws = workbook.Sheets[workbook.SheetNames[0]];

  clearRange(ws, 1, 10000, 0, 3);

  XLSX.utils.sheet_add_aoa(ws, rows, {
    origin: "A2"
  });

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xls"
  });
}