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

    const barangRows = makeBarangRows(data.rows);
    const fileBuffer = fillBarangTemplate(barangRows);

    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TEMPLATE_BARANG_HASIL.xls"
    );

    return res.status(200).send(fileBuffer);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};