async function login() {
  const username = document.getElementById("username").value.trim().toLowerCase();
  document.getElementById("username").value = username;
  const pin = document.getElementById("pin").value.trim();

  if (!username || !pin) {
    Swal.fire("Belum lengkap", "Username dan PIN wajib diisi.", "error");
    return;
  }

  Swal.fire({
    title: "Memeriksa akun...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch(
      `${MASTER_API_URL}?action=loginMaster&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`
    );

    const data = await res.json();
    Swal.close();

    if (!data.success) {
      Swal.fire("Gagal", data.message || "Username atau PIN salah.", "error");
      return;
    }
    const raw = data.user || {};

    const user = {
      username: raw.username || username,
      name: raw.name || raw.nama || username,
      role: raw.role || "staff",
      toko: raw.toko || raw.tokoId || "",
      tokoNama: raw.tokoNama || raw.namaToko || "Inventory Engine",
      apiUrl: raw.apiUrl || raw.api || "",
      logo: raw.logo || "",
      permission: raw.permission || {}
    };

    localStorage.setItem("tay_user", JSON.stringify(user));
    window.location.href = "index.html";

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

function can(permission) {
  const user = getCurrentUser();
  return !!user?.permission?.[permission];
}

function logout() {
  localStorage.removeItem("tay_user");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");

  if (usernameInput) {
    usernameInput.setAttribute("autocapitalize", "none");
    usernameInput.setAttribute("spellcheck", "false");

    usernameInput.addEventListener("input", function () {
      this.value = this.value.toLowerCase();
    });
  }
});
