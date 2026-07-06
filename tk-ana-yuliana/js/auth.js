const USERS = [
  { username: "budhi", name: "Budhi", pin: "1234" },
  { username: "karyawan1", name: "Ana", pin: "1111" },
  { username: "karyawan2", name: "Alia", pin: "2222" },
  { username: "karyawan3", name: "Cia", pin: "3333" },
  { username: "karyawan4", name: "Fika", pin: "4444" },
  { username: "karyawan5", name: "Fira", pin: "5555" }
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