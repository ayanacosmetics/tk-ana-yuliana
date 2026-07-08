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
    <div class="form admin-module-card">
      <h3><i data-lucide="store"></i> Kelola Toko</h3>

      <button class="btn primary admin-action-btn" onclick="showFormToko()">
        <i data-lucide="plus"></i>
        Tambah Toko
      </button>
    </div>

    <div id="formToko" class="form admin-form-card" style="display:none">
      <h3><i data-lucide="store"></i> Form Toko</h3>

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

      <button class="btn primary admin-action-btn" onclick="saveToko()">
        <i data-lucide="save"></i>
        Simpan Toko
      </button>

      <button class="btn secondary admin-action-btn" onclick="hideFormToko()">
        <i data-lucide="x"></i>
        Batal
      </button>
    </div>

    <div class="list admin-list">
      ${data.items.map(t => `
        <div class="item admin-store-card">
          <div class="admin-user-top">
            <div class="admin-avatar store-avatar">
              <i data-lucide="store"></i>
            </div>

            <div>
              <b>${t.nama}</b>
              <div class="small">ID: ${t.id}</div>
            </div>
          </div>

          <div class="admin-badges">
            <span class="badge-status ${(t.status || "").toLowerCase()}">
              ${t.status || "aktif"}
            </span>

            <span class="badge-api ${t.api ? "filled" : "empty"}">
              ${t.api ? "API Terisi" : "API Kosong"}
            </span>
          </div>

          <div class="admin-info-line">
            <i data-lucide="link"></i>
            <span>${t.api ? "URL Apps Script tersimpan" : "Belum ada API URL"}</span>
          </div>

          <div class="admin-info-line">
            <i data-lucide="image"></i>
            <span>${t.logo ? "Logo tersedia" : "Logo belum diisi"}</span>
          </div>

          <div class="admin-card-actions one">
            <button class="btn secondary" onclick='editToko(${JSON.stringify(t)})'>
              <i data-lucide="pencil"></i>
              Edit Toko
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function showFormToko() {
  document.getElementById("formToko").style.display = "";

  document.getElementById("tokoId").disabled = false;
  document.getElementById("tokoId").value = "";
  document.getElementById("tokoNama").value = "";
  document.getElementById("tokoApi").value = "";
  document.getElementById("tokoLogo").value = "";
  document.getElementById("tokoStatus").value = "aktif";
}

function hideFormToko() {
  document.getElementById("formToko").style.display = "none";
}

function editToko(t) {
  document.getElementById("formToko").style.display = "";

  document.getElementById("tokoId").value = t.id;
  document.getElementById("tokoId").disabled = true;
  document.getElementById("tokoNama").value = t.nama;
  document.getElementById("tokoApi").value = t.api;
  document.getElementById("tokoLogo").value = t.logo || "";
  document.getElementById("tokoStatus").value = t.status || "aktif";

  window.scrollTo({ top: 0, behavior: "smooth" });
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
    hideFormToko();
    loadToko();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan toko.", "error");
  }
}