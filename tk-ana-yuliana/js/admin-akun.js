async function loadAkun() {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="item">Memuat akun...</div>`;

  const res = await fetch(`${MASTER_API_URL}?action=listAkun`);
  const data = await res.json();

  if (!data.success) {
    content.innerHTML = `<div class="item">Gagal memuat akun.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="form">
      <h3>👥 Kelola Karyawan</h3>

      <label>Username</label>
      <input id="akunUsername" placeholder="contoh: ana">

      <label>Nama</label>
      <input id="akunNama" placeholder="Nama karyawan">

      <label>PIN</label>
      <input id="akunPin" inputmode="numeric" placeholder="PIN">

      <label>Role</label>
      <select id="akunRole">
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="supervisor">Supervisor</option>
      </select>

      <label>Toko ID</label>
      <input id="akunToko" placeholder="contoh: ana / hamzah">

      <label>Status</label>
      <select id="akunStatus">
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Nonaktif</option>
      </select>

      <button class="btn primary" onclick="saveAkun()">Simpan Akun</button>
    </div>

    <div class="list">
      ${data.items.map(a => `
        <div class="item">
          <b>${a.nama}</b>
          <div class="small">Username: ${a.username}</div>
          <div class="small">Role: ${a.role}</div>
          <div class="small">Toko: ${a.toko}</div>
          <div class="small">Status: ${a.status}</div>

          <button class="btn secondary" onclick='editAkun(${JSON.stringify(a)})'>Edit</button>
          <button class="btn secondary" onclick="deleteAkun('${a.username}')">Nonaktifkan</button>
        </div>
      `).join("")}
    </div>
  `;
}

function editAkun(a) {
  document.getElementById("akunUsername").value = a.username;
  document.getElementById("akunNama").value = a.nama;
  document.getElementById("akunPin").value = a.pin;
  document.getElementById("akunRole").value = a.role || "staff";
  document.getElementById("akunToko").value = a.toko;
  document.getElementById("akunStatus").value = a.status || "aktif";
}

async function saveAkun() {
  const payload = {
    action: "saveAkun",
    username: document.getElementById("akunUsername").value.trim().toLowerCase(),
    nama: document.getElementById("akunNama").value.trim(),
    pin: document.getElementById("akunPin").value.trim(),
    role: document.getElementById("akunRole").value,
    toko: document.getElementById("akunToko").value.trim(),
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
    loadAkun();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan akun.", "error");
  }
}

async function deleteAkun(username) {
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