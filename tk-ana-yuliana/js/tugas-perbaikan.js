const list = document.getElementById("list");
const btnLoad = document.getElementById("btnLoad");

btnLoad.addEventListener("click", loadTugas);

async function loadTugas() {
  list.innerHTML = `<div class="item">Memuat tugas...</div>`;

  const user = JSON.parse(localStorage.getItem("tay_user") || "{}");

  const res = await fetch(
    `${API_URL}?action=tugasPerbaikan&petugas=${encodeURIComponent(user.name || "")}`
  );
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
     list.innerHTML = `
        <div class="item success-card">
            <h3>🎉 Selamat!</h3>
            <p>Anda telah menginput semua barang dengan benar.</p>
        </div>
     `;
    return;
 }

  list.innerHTML = data.items.map(item => `
    <div class="item">
      <b>${item.nama}</b>
      <div class="small">Kode: ${item.kode || "-"}</div>
      <div class="small">Satuan terkecil: ${item.satuan1 || "-"}</div>

      <hr>

      <b>Perlu diperbaiki:</b>

      ${item.fields.map(f => `
        <div style="margin-top:10px">
          <label>${f.label}</label>
          <input
            id="fix-${item.row}-${f.col}"
            inputmode="${f.type === "number" ? "numeric" : "text"}"
            placeholder="${f.placeholder}">
        </div>
      `).join("")}

      <button class="btn primary" onclick='simpanPerbaikan(${JSON.stringify(item)})'>
        Simpan Perbaikan
      </button>
    </div>
  `).join("");
}

async function simpanPerbaikan(item) {
  const updates = [];

  for (const f of item.fields) {
    const input = document.getElementById(`fix-${item.row}-${f.col}`);
    const value = input.value.trim();

    if (!value) {
      Swal.fire("Belum lengkap", `${f.label} wajib diisi.`, "error");
      return;
    }

    updates.push({
      col: f.col,
      value
    });
  }

  const user = JSON.parse(localStorage.getItem("tay_user") || "{}");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "simpanPerbaikan",
      row: item.row,
      updates,
      petugas: user.name || ""
    })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Perbaikan berhasil disimpan.", "success");
    loadTugas();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan perbaikan.", "error");
  }
}