const list = document.getElementById("list");

document.addEventListener("DOMContentLoaded", () => {
  loadModalKosong();
});

async function loadModalKosong() {
  list.innerHTML = `<div class="item">Memuat...</div>`;

  const res = await fetch(`${API_URL}?action=modalKosong`);
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    list.innerHTML = `<div class="item">Tidak ada barang modal 0.</div>`;
    return;
  }

  list.innerHTML = data.items.map(item => `
  <div class="item">
    <b>${item.nama}</b>
    <div class="small">Kode: ${item.kode}</div>
    <div class="small">Satuan 1: ${item.satuan1 || "-"}</div>
    <div class="small">Harga Ecer per ${item.satuan1 || "Satuan 1"}: ${item.hargaEcer || "-"}</div>
    <div class="small">Harga Grosir 1 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir1 || "-"}</div>
    ${item.hargaGrosir2_1 && item.hargaGrosir2_1 !== "-" && item.hargaGrosir2_1 !== "x" && item.hargaGrosir2_1 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir2_1}</div>` : ""}
    ${item.hargaGrosir3_1 && item.hargaGrosir3_1 !== "-" && item.hargaGrosir3_1 !== "x" && item.hargaGrosir3_1 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir3_1}</div>` : ""}

    ${item.satuan2 && item.satuan2 !== "-" && item.satuan2 !== "x" && item.satuan2 !== "X" ? `
      <hr>
      <div class="small">Satuan 2: ${item.satuan2}</div>
      <div class="small">Kode Barang ${item.satuan2}: ${item.kode2 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan2}: ${item.harga2_1 || "-"}</div>
      ${item.harga2_2 && item.harga2_2 !== "-" && item.harga2_2 !== "x" && item.harga2_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan2}: ${item.harga2_2}</div>` : ""}
      ${item.harga2_3 && item.harga2_3 !== "-" && item.harga2_3 !== "x" && item.harga2_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan2}: ${item.harga2_3}</div>` : ""}
      <div class="small">Isi ${item.satuan2}: ${item.isi2 || "-"}</div>
    ` : ""}

    ${item.satuan3 && item.satuan3 !== "-" && item.satuan3 !== "x" && item.satuan3 !== "X" ? `
      <hr>
      <div class="small">Satuan 3: ${item.satuan3}</div>
      <div class="small">Kode Barang ${item.satuan3}: ${item.kode3 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan3}: ${item.harga3_1 || "-"}</div>
      ${item.harga3_2 && item.harga3_2 !== "-" && item.harga3_2 !== "x" && item.harga3_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan3}: ${item.harga3_2}</div>` : ""}
      ${item.harga3_3 && item.harga3_3 !== "-" && item.harga3_3 !== "x" && item.harga3_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan3}: ${item.harga3_3}</div>` : ""}
      <div class="small">Isi ${item.satuan3}: ${item.isi3 || "-"}</div>
    ` : ""}

    ${item.satuan4 && item.satuan4 !== "-" && item.satuan4 !== "x" && item.satuan4 !== "X" ? `
      <hr>
      <div class="small">Satuan 4: ${item.satuan4}</div>
      <div class="small">Kode Barang ${item.satuan4}: ${item.kode4 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan4}: ${item.harga4_1 || "-"}</div>
      ${item.harga4_2 && item.harga4_2 !== "-" && item.harga4_2 !== "x" && item.harga4_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan4}: ${item.harga4_2}</div>` : ""}
      ${item.harga4_3 && item.harga4_3 !== "-" && item.harga4_3 !== "x" && item.harga4_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan4}: ${item.harga4_3}</div>` : ""}
      <div class="small">Isi ${item.satuan4}: ${item.isi4 || "-"}</div>
    ` : ""}

    <input
      type="number"
      id="modal-${item.row}"
      inputmode="numeric"
      pattern="[0-9]*"
      placeholder="Isi modal asli">

    <button class="btn primary" onclick="simpanModal(${item.row})">
      Simpan Modal
    </button>
  </div>
`).join("");
if (window.lucide) lucide.createIcons();
}

async function simpanModal(row) {
  const modal = document.getElementById(`modal-${row}`).value;

  if (!modal) {
    Swal.fire("Belum diisi", "Modal wajib diisi.", "error");
    return;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "updateModal",
      row,
      modal
    })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Modal berhasil diperbarui.", "success");
    loadModalKosong();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa update modal.", "error");
  }
}