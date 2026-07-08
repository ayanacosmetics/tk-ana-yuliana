document.addEventListener("DOMContentLoaded", loadTokoDaftar);

async function loadTokoDaftar() {
  const select = document.getElementById("toko");

  const res = await fetch(`${MASTER_API_URL}?action=listToko`);
  const data = await res.json();

  select.innerHTML = `<option value="">Pilih toko</option>`;

  (data.items || [])
    .filter(t => String(t.status).toLowerCase() === "aktif")
    .forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.nama;
      select.appendChild(opt);
    });
}

async function daftarAkun() {
  document.getElementById("username").value =
    document.getElementById("username").value.trim().toLowerCase();
  const payload = {
    action: "saveAkun",
    username: document.getElementById("username").value.trim().toLowerCase(),
    nama: document.getElementById("nama").value.trim(),
    pin: document.getElementById("pin").value.trim(),
    role: "staff",
    toko: document.getElementById("toko").value,
    status: "pending"
  };

  if (!payload.username || !payload.nama || !payload.pin || !payload.toko) {
    Swal.fire("Belum lengkap", "Semua kolom wajib diisi.", "error");
    return;
  }

  const res = await fetch(MASTER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire(
      "Berhasil daftar",
      "Akun sudah dibuat. Tunggu admin mengaktifkan akun Anda.",
      "success"
    ).then(() => {
      window.location.href = "login.html";
    });
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa daftar akun.", "error");
  }
}