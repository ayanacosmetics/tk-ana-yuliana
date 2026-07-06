const USERS = [
  { username: "budhi", name: "Budhi", pin: "0404" }
  { username: "ana", name: "Ana", pin: "0000" },
  { username: "fika", name: "Fika", pin: "1111" },
  { username: "fira", name: "Fira", pin: "2222" },
  { username: "cia", name: "Cia", pin: "3333" },
  { username: "alia", name: "Alia", pin: "4444" }
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