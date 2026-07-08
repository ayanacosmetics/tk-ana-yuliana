function renderSidebar() {
  const user = getCurrentUser?.() || {};
  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff";

  const sidebarHTML = `
    <div id="drawerOverlay" class="drawer-overlay" onclick="closeDrawer()"></div>

    <aside id="sideDrawer" class="side-drawer">
      <button class="drawer-close" onclick="closeDrawer()">
        <i data-lucide="x"></i>
      </button>

      <div class="drawer-brand">
        <div class="drawer-logo"><i data-lucide="box"></i></div>
        <div>
          <h2>INVENTORY</h2>
          <p>ENGINE</p>
        </div>
      </div>

      <a class="drawer-link" href="index.html">
        <i data-lucide="layout-dashboard"></i><span>Dashboard</span>
      </a>

      <div class="drawer-section">MENU UTAMA</div>

      <a class="drawer-link" href="input.html">
        <i data-lucide="package"></i><span>Input Barang</span>
      </a>

      <a class="drawer-link" href="tugas-perbaikan.html">
        <i data-lucide="wrench"></i><span>Tugas Perbaikan</span>
      </a>

      ${!isStaff ? `
      <a class="drawer-link" href="lengkapi-modal.html">
        <i data-lucide="badge-dollar-sign"></i><span>Lengkapi Modal</span>
      </a>` : ""}

      ${!isStaff ? `
      <a class="drawer-link" href="siap-rilis.html">
        <i data-lucide="rocket"></i><span>Siap Rilis</span>
      </a>` : ""}

      ${isAdmin ? `
        <div class="drawer-section">PANEL ADMIN</div>
        <a class="drawer-link" href="admin.html">
          <i data-lucide="shield-check"></i><span>Panel Admin</span>
        </a>
      ` : ""}

      <button class="drawer-logout" onclick="logout()">
        <i data-lucide="log-out"></i> Logout
      </button>
    </aside>
  `;

  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

  if (window.lucide) {
    lucide.createIcons();
  }
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