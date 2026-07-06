const list = document.getElementById("list");
const btnLoad = document.getElementById("btnLoad");

btnLoad.addEventListener("click", loadModalKosong);

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
      <div class="small">Harga Ecer: ${item.hargaEcer || "-"}</div>

      <input 
        type="number" 
        id="modal-${item.row}" 
        placeholder="Isi modal asli"
      >

      <button class="btn primary" onclick="simpanModal(${item.row})">
        Simpan Modal
      </button>
    </div>
  `).join("");
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