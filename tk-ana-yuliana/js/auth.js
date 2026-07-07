const USERS = [
  { username: "budhi", name: "Budhi", pin: "1234", toko: "ana" },
  { username: "ana", name: "Ana", pin: "1111", toko: "ana" },
  { username: "alia", name: "Alia", pin: "2222", toko: "ana" },
  { username: "cia", name: "Cia", pin: "3333", toko: "ana" },
  { username: "fika", name: "Fika", pin: "4444", toko: "ana" },
  { username: "fira", name: "Fira", pin: "5555", toko: "ana" },

  { username: "hamzah", name: "Admin Hamzah", pin: "0000", toko: "demo" }
];

function login() {
  const username = document.getElementById("username").value;
  const pin = document.getElementById("pin").value;

  const user = USERS.find(u => u.username === username && u.pin === pin);

  if (!user) {
    Swal.fire("Gagal", "Nama atau PIN salah.", "error");
    return;
  }

  localStorage.setItem("tay_user", JSON.stringify(user));
  window.location.href = "index.html";
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