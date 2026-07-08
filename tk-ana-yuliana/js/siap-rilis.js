const list = document.getElementById("list");

let siapRilisItems = [];

document.addEventListener("DOMContentLoaded", () => {
  loadSiapRilis();
});

async function loadSiapRilis() {
  list.innerHTML = `<div class="item">Memuat data...</div>`;

  try {
    const res = await fetch(`${API_URL}?action=siapRilis`);
    const data = await res.json();

    siapRilisItems = data.items || [];

    if (!siapRilisItems.length) {
      list.innerHTML = `<div class="item">Belum ada barang siap rilis.</div>`;
      return;
    }

    list.innerHTML = `
      <button class="btn primary release-all-btn" onclick="importSemuaSelesai()">
        <i data-lucide="upload-cloud"></i>
        Import Semua Selesai
      </button>

      ${siapRilisItems.map(item => `
        <div class="item">
          <b>${item.nama}</b>
          <div class="small">Kode: ${item.kode}</div>
          <div class="small">Satuan: ${item.satuan1 || "-"}</div>
          <div class="small">Harga Ecer: ${item.hargaEcer || "-"}</div>
        </div>
      `).join("")}
    `;
    if (window.lucide) lucide.createIcons();

  } catch (e) {
    list.innerHTML = `<div class="item">Gagal memuat data.</div>`;
  }
}

async function importSemuaSelesai() {
  if (!siapRilisItems.length) {
    Swal.fire("Kosong", "Tidak ada barang siap rilis.", "info");
    return;
  }

  const result = await Swal.fire({
    title: "Import semua selesai?",
    text: `${siapRilisItems.length} barang akan diberi Tanggal Import.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, selesai",
    cancelButtonText: "Batal"
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({
      title: "Memproses...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const codes = siapRilisItems.map(item => item.kode);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "importSemua",
        codes
      })
    });

    const data = await res.json();

    Swal.close();

    if (data.success) {
      Swal.fire(
        "Berhasil",
        `${data.count} barang sudah diberi Tanggal Import.`,
        "success"
      );

      loadSiapRilis();
    } else {
      Swal.fire("Gagal", data.message || "Tidak berhasil.", "error");
    }

  } catch (e) {
    Swal.close();
    Swal.fire("Error", e.message, "error");
  }
}