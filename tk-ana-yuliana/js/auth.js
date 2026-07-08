const USERS = [
  { username: "budhi", name: "Budhi", pin: "1234", toko: "ana" },
  { username: "ana", name: "Ana", pin: "1111", toko: "ana" },
  { username: "alia", name: "Alia", pin: "2222", toko: "ana" },
  { username: "cia", name: "Cia", pin: "3333", toko: "ana" },
  { username: "fika", name: "Fika", pin: "4444", toko: "ana" },
  { username: "fira", name: "Fira", pin: "5555", toko: "ana" },

  { username: "hamzah", name: "Admin Hamzah", pin: "0000", toko: "demo" }
];

async function login() {
  const username = document.getElementById("username").value;
  const pin = document.getElementById("pin").value;

  if (!username || !pin) {
    Swal.fire("Belum lengkap", "Nama pengguna dan PIN wajib diisi.", "error");
    return;
  }

  Swal.fire({
    title: "Memeriksa akun...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    for (const tokoId of Object.keys(TOKO)) {
      const api = TOKO[tokoId].api;

      if (!api || api.includes("PASTE_URL")) continue;

      const res = await fetch(
        `${api}?action=login&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`
      );

      const data = await res.json();

      if (data.success) {
        Swal.close();
        localStorage.setItem("tay_user", JSON.stringify(data.user));
        window.location.href = "index.html";
        return;
      }
    }

    Swal.close();
    Swal.fire("Gagal", "Nama atau PIN salah.", "error");

  } catch (err) {
    Swal.close();
    Swal.fire("Error", "Gagal menghubungi server login.", "error");
  }
}

function getCurrentUser() {
  const data = localStorage.getItem("tay_user");
  return data ? JSON.parse(data) : null;
}

function requireLogin() {
  if (!getCurrentUser()) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("tay_user");
  window.location.href = "login.html";
}