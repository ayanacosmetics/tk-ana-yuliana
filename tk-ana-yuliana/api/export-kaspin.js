const path = require("path");
const XLSX = require("xlsx");

const GAS_URL = process.env.GAS_URL;

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
    if (!GAS_URL) {
      return res.status(500).json({
        success: false,
        message: "GAS_URL belum diatur di Vercel."
      });
    }

    const response = await fetch(`${GAS_URL}?action=kaspinExportData`);
    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: "Gagal mengambil data dari Apps Script."
      });
    }

    const grosirRows = makeGrosirRows(data.rows);
    const fileBuffer = fillGrosirTemplate(grosirRows);

    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TEMPLATE_HARGA_GROSIR_HASIL.xls"
    );

    return res.status(200).send(fileBuffer);

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
    const hargaEcer = num(r[4]);
    const satuan1 = clean(r[2]);

    if (!kode1 || !satuan1) return;

    // Satuan 1
    result.push([
      kode1,
      satuan1,
      hargaEcer,
      1,
      satuan1
    ]);

    // Satuan 2
    const satuan2 = clean(r[8]);
    const isi2 = num(r[9]);
    const kode2 = clean(r[10]);

    if (satuan2 && isi2 > 0) {
      result.push([
        kode2 || kode1,
        satuan2,
        hargaEcer * isi2,
        isi2,
        satuan1
      ]);
    }

    // Satuan 3
    const satuan3 = clean(r[14]);
    const isi3 = num(r[15]);
    const kode3 = clean(r[16]);

    if (satuan3 && isi3 > 0) {
      result.push([
        kode3 || kode1,
        satuan3,
        hargaEcer * isi3,
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

  XLSX.utils.sheet_add_aoa(ws, rows, {
    origin: "A2"
  });

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xls"
  });
}