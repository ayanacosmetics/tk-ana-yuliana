document.addEventListener("DOMContentLoaded", () => {
  const tokoId = document.getElementById("tokoId");
  const username = document.getElementById("username");

  if (tokoId) {
    tokoId.addEventListener("input", function () {
      this.value = this.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    });
  }

  if (username) {
    username.addEventListener("input", function () {
      this.value = this.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    });
  }
});

async function daftarTokoDanOwner() {
  const tokoId = document.getElementById("tokoId").value.trim().toLowerCase();
  const tokoNama = document.getElementById("tokoNama").value.trim();
  const tokoLogo = document.getElementById("tokoLogo").value.trim();
  const username = document.getElementById("username").value.trim().toLowerCase();
  const nama = document.getElementById("nama").value.trim();
  const pin = document.getElementById("pin").value.trim();

  if (!tokoId || !tokoNama || !username || !nama || !pin) {
    Swal.fire("Belum lengkap", "Semua kolom wajib diisi (kecilkan logo jika tidak ada).", "error");
    return;
  }

  Swal.fire({
    title: "Mendaftarkan Toko & Owner...",
    text: "Mohon tunggu sebentar, sistem sedang menduplikasi template database toko Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // 1. Simpan Toko (Memicu pembuatan Spreadsheet baru)
    const resToko = await fetch(MASTER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveToko",
        id: tokoId,
        nama: tokoNama,
        logo: tokoLogo,
        status: "aktif",
        api: "" // Dibiarkan kosong agar Apps Script otomatis menduplikasi template spreadsheet
      })
    });

    const dataToko = await resToko.json();

    if (!dataToko.success) {
      Swal.fire("Gagal", dataToko.message || "Gagal mendaftarkan toko.", "error");
      return;
    }

    // 2. Simpan Akun Owner (Langsung Aktif & Role Admin)
    const resAkun = await fetch(MASTER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAkun",
        username: username,
        nama: nama,
        pin: pin,
        role: "owner",
        toko: tokoId,
        status: "aktif"
      })
    });

    const dataAkun = await resAkun.json();

    if (!dataAkun.success) {
      Swal.fire("Gagal", dataAkun.message || "Toko berhasil didaftarkan tetapi gagal membuat akun owner.", "error");
      return;
    }

    Swal.fire(
      "Berhasil!",
      "Toko dan Akun Owner berhasil dibuat. Silakan login.",
      "success"
    ).then(() => {
      window.location.href = "login.html";
    });

  } catch (err) {
    Swal.fire("Error", "Gagal menghubungi server pendaftaran: " + err.message, "error");
  }
}
