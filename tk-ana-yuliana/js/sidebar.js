function renderSidebar() {
  const user = getCurrentUser?.() || {};
  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff";

  const sidebarHTML = `
    <div id="drawerOverlay" class="drawer-overlay" onclick="closeDrawer()"></div>

    <aside id="sideDrawer" class="side-drawer">
      <button class="drawer-close" onclick="closeDrawer()">×</button>

      <div class="drawer-brand">
        <div class="drawer-logo">⬢</div>
        <div>
          <h2>INVENTORY</h2>
          <p>ENGINE</p>
        </div>
      </div>

      <a class="drawer-link" href="index.html">🏠 <span>Dashboard</span></a>

      <div class="drawer-section">MENU UTAMA</div>
      <a class="drawer-link" href="input.html">📦 <span>Input Barang</span></a>
      <a class="drawer-link" href="tugas-perbaikan.html">🛠️ <span>Tugas Perbaikan</span></a>
      ${!isStaff ? `<a class="drawer-link" href="lengkapi-modal.html">💰 <span>Lengkapi Modal</span></a>` : ""}
      ${!isStaff ? `<a class="drawer-link" href="siap-rilis.html">🚀 <span>Siap Rilis</span></a>` : ""}

      ${isAdmin ? `
        <div class="drawer-section">PANEL ADMIN</div>
        <a class="drawer-link" href="admin.html">⚙️ <span>Panel Admin</span></a>
      ` : ""}

      <button class="drawer-logout" onclick="logout()">↪ Logout</button>
    </aside>
  `;

  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);
}

function openDrawer() {
  document.getElementById("sideDrawer")?.classList.add("open");
  document.getElementById("drawerOverlay")?.classList.add("show");
}

function closeDrawer() {
  document.getElementById("sideDrawer")?.classList.remove("open");
  document.getElementById("drawerOverlay")?.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", renderSidebar);