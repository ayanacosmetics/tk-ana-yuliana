async function loadToko() {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="item">Memuat toko...</div>`;

  const res = await fetch(`${MASTER_API_URL}?action=listToko`);
  const data = await res.json();

  if (!data.success) {
    content.innerHTML = `<div class="item">Gagal memuat toko.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="form">
      <h3>🏪 Kelola Toko</h3>

      <label>ID Toko</label>
      <input id="tokoId" placeholder="contoh: hamzah">

      <label>Nama Toko</label>
      <input id="tokoNama" placeholder="Nama toko">

      <label>API URL</label>
      <input id="tokoApi" placeholder="URL Apps Script toko">

      <label>Logo</label>
      <input id="tokoLogo" placeholder="Opsional">

      <label>Status</label>
      <select id="tokoStatus">
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Nonaktif</option>
      </select>

      <button class="btn primary" onclick="saveToko()">Simpan Toko</button>
    </div>

    <div class="list">
      ${data.items.map(t => `
        <div class="item">
          <b>${t.nama}</b>
          <div class="small">ID: ${t.id}</div>
          <div class="small">Status: ${t.status}</div>
          <div class="small">API: ${t.api ? "Terisi" : "Belum terisi"}</div>

          <button class="btn secondary" onclick='editToko(${JSON.stringify(t)})'>Edit</button>
        </div>
      `).join("")}
    </div>
  `;
}

function editToko(t) {
  document.getElementById("tokoId").value = t.id;
  document.getElementById("tokoNama").value = t.nama;
  document.getElementById("tokoApi").value = t.api;
  document.getElementById("tokoLogo").value = t.logo || "";
  document.getElementById("tokoStatus").value = t.status || "aktif";
}

async function saveToko() {
  const payload = {
    action: "saveToko",
    id: document.getElementById("tokoId").value.trim().toLowerCase(),
    nama: document.getElementById("tokoNama").value.trim(),
    api: document.getElementById("tokoApi").value.trim(),
    logo: document.getElementById("tokoLogo").value.trim(),
    status: document.getElementById("tokoStatus").value
  };

  if (!payload.id || !payload.nama || !payload.api) {
    Swal.fire("Belum lengkap", "ID toko, nama toko, dan API URL wajib diisi.", "error");
    return;
  }

  const res = await fetch(MASTER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Toko berhasil disimpan.", "success");
    loadToko();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan toko.", "error");
  }
}