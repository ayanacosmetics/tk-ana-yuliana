let akunCache = [];
let tokoCache = [];
let modeEditAkun = false;

async function loadAkun() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="item">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
    <div class="item">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `;

  const [akunRes, tokoRes] = await Promise.all([
    fetch(`${MASTER_API_URL}?action=listAkun`),
    fetch(`${MASTER_API_URL}?action=listToko`)
  ]);

  const akunData = await akunRes.json();
  const tokoData = await tokoRes.json();

  let allAkun = akunData.items || [];
  let allToko = tokoData.items || [];

  if (!isSuperAdmin) {
    allAkun = allAkun.filter(a => a.toko === user.toko);
    allToko = allToko.filter(t => t.id === user.toko);
  }

  akunCache = allAkun;
  tokoCache = allToko;

  renderAkunPage();
}

function renderAkunPage() {
  const content = document.getElementById("content");

  content.innerHTML = `
    <div class="form admin-module-card">
      <h3><i data-lucide="users"></i> Kelola Karyawan</h3>

      <div class="admin-search-wrap">
        <i data-lucide="search"></i>
        <input
          id="searchAkun"
          placeholder="Cari nama atau username..."
          oninput="renderAkunList()">
      </div>

      <button class="btn primary admin-action-btn" onclick="showFormAkun()">
        <i data-lucide="user-plus"></i>
        Tambah Akun
      </button>
    </div>

    <div id="formAkun" class="form admin-form-card" style="display:none">
      <h3 id="judulFormAkun"><i data-lucide="user-plus"></i> Tambah Akun</h3>

      <label>Username</label>
      <input id="akunUsername" placeholder="contoh: ana">

      <label>Nama</label>
      <input id="akunNama" placeholder="Nama karyawan">

      <label>PIN</label>
      <input id="akunPin" inputmode="numeric" placeholder="PIN">

      <label>Role</label>
      <select id="akunRole">
        <option value="owner">Owner</option>
        <option value="supervisor">Supervisor</option>
        <option value="staff">Staff</option>
      </select>

      <label>Toko</label>
      <select id="akunToko" ${!isSuperAdmin ? 'disabled' : ''}>
        ${tokoCache.map(t => `
          <option value="${t.id}">${t.nama}</option>
        `).join("")}
      </select>

      <label>Status</label>
      <select id="akunStatus">
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Nonaktif</option>
      </select>

      <button class="btn primary admin-action-btn" onclick="saveAkun()">
        <i data-lucide="save"></i>
        Simpan Akun
      </button>

      <button class="btn secondary admin-action-btn" onclick="hideFormAkun()">
        <i data-lucide="x"></i>
        Batal
      </button>
    </div>

    <div id="akunList" class="list admin-list"></div>
  `;

  renderAkunList();
  if (window.lucide) lucide.createIcons();
}

function renderAkunList() {
  const q = (document.getElementById("searchAkun")?.value || "").toLowerCase();
  const list = document.getElementById("akunList");

  const filtered = akunCache.filter(a =>
    (a.nama || "").toLowerCase().includes(q) ||
    (a.username || "").toLowerCase().includes(q)
  );

  if (!filtered.length) {
    list.innerHTML = `
      <div class="item admin-user-card empty-state">
        <i data-lucide="search-x"></i>
        <b>Tidak ada akun ditemukan.</b>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  list.innerHTML = filtered.map(a => {
    const tokoNama = tokoCache.find(t => t.id === a.toko)?.nama || a.toko;
    const isBudhi = a.username === "budhi";
    const status = (a.status || "").toLowerCase();
    const role = (a.role || "staff").toLowerCase();

    return `
      <div class="item admin-user-card">
        <div class="admin-user-top">
          <div class="admin-avatar">
            <i data-lucide="user"></i>
          </div>

          <div>
            <b>${a.nama}</b>
            <div class="small">@${a.username}</div>
          </div>
        </div>

        <div class="admin-badges">
          <span class="badge-role ${role}">
            <i data-lucide="shield"></i>
            ${a.role || "staff"}
          </span>

          <span class="badge-status ${status}">
            ${status === "aktif" ? "Aktif" : "Nonaktif"}
          </span>
        </div>

        <div class="admin-info-line">
          <i data-lucide="store"></i>
          <span>${tokoNama}</span>
        </div>

        <div class="admin-info-line">
          <i data-lucide="key-round"></i>
          <span>PIN: ••••</span>
        </div>

        <div class="admin-card-actions">
          <button class="btn secondary" onclick='editAkun(${JSON.stringify(a)})'>
            <i data-lucide="pencil"></i>
            Edit
          </button>

          <button
            class="btn secondary danger-soft"
            ${isBudhi ? "disabled" : ""}
            onclick="deleteAkun('${a.username}')">
            <i data-lucide="ban"></i>
            Nonaktifkan
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

function showFormAkun() {
  modeEditAkun = false;
  document.getElementById("judulFormAkun").innerText = "Tambah Akun";
  document.getElementById("formAkun").style.display = "";

  document.getElementById("akunUsername").disabled = false;
  document.getElementById("akunUsername").value = "";
  document.getElementById("akunNama").value = "";
  document.getElementById("akunPin").value = "";
  document.getElementById("akunRole").value = "staff";
  document.getElementById("akunStatus").value = "aktif";
}

function hideFormAkun() {
  document.getElementById("formAkun").style.display = "none";
}

function editAkun(a) {
  modeEditAkun = true;

  document.getElementById("judulFormAkun").innerText = "Edit Akun";
  document.getElementById("formAkun").style.display = "";

  document.getElementById("akunUsername").value = a.username;
  document.getElementById("akunUsername").disabled = true;
  document.getElementById("akunNama").value = a.nama;
  document.getElementById("akunPin").value = a.pin;
  document.getElementById("akunRole").value = a.role || "staff";
  document.getElementById("akunToko").value = a.toko;
  document.getElementById("akunStatus").value = a.status || "aktif";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveAkun() {
  const username = document.getElementById("akunUsername").value.trim().toLowerCase();

  if (!modeEditAkun && akunCache.some(a => a.username === username)) {
    Swal.fire("Username dipakai", "Username ini sudah terdaftar.", "error");
    return;
  }

  const payload = {
    action: "saveAkun",
    username,
    nama: document.getElementById("akunNama").value.trim(),
    pin: document.getElementById("akunPin").value.trim(),
    role: document.getElementById("akunRole").value,
    toko: document.getElementById("akunToko").value,
    status: document.getElementById("akunStatus").value
  };

  if (!payload.username || !payload.nama || !payload.pin || !payload.toko) {
    Swal.fire("Belum lengkap", "Username, nama, PIN, dan toko wajib diisi.", "error");
    return;
  }

  const res = await fetch(MASTER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Akun berhasil disimpan.", "success");
    hideFormAkun();
    loadAkun();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan akun.", "error");
  }
}

async function deleteAkun(username) {
  if (username === "budhi") {
    Swal.fire("Tidak bisa", "Akun Budhi tidak boleh dinonaktifkan.", "warning");
    return;
  }

  const result = await Swal.fire({
    title: "Nonaktifkan akun?",
    text: username,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Nonaktifkan",
    cancelButtonText: "Batal"
  });

  if (!result.isConfirmed) return;

  const res = await fetch(MASTER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "deleteAkun",
      username
    })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Akun dinonaktifkan.", "success");
    loadAkun();
  }
}
