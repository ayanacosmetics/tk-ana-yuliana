function renderSidebar() {
  const sidebarHTML = `
    <div id="drawerOverlay" class="drawer-overlay" onclick="closeDrawer()"></div>

    <aside id="sideDrawer" class="side-drawer">
      <button class="drawer-close" onclick="closeDrawer()">
        <i data-lucide="x"></i>
      </button>

      <div class="drawer-brand">
        <div class="drawer-logo">
          <img id="sidebarStoreLogo" src="" alt="Logo toko">
        </div>

        <div>
          <h2 id="sidebarStoreName">INVENTORY</h2>
          <p>ENGINE</p>
        </div>
      </div>

      <a class="drawer-link" href="index.html">
        <i data-lucide="layout-dashboard"></i>
        <span>Dashboard</span>
      </a>

      <div class="drawer-section">MENU UTAMA</div>

      <a class="drawer-link" id="drawerInput" href="input.html">
        <i data-lucide="package"></i>
        <span>Input Barang</span>
      </a>

      <a class="drawer-link" id="drawerPerbaikan" href="tugas-perbaikan.html">
        <i data-lucide="wrench"></i>
        <span>Tugas Perbaikan</span>
      </a>

      <a class="drawer-link" id="drawerModal" href="lengkapi-modal.html">
        <i data-lucide="badge-dollar-sign"></i>
        <span>Lengkapi Modal</span>
      </a>

      <a class="drawer-link" id="drawerExportKaspin" href="siap-rilis.html">
        <i data-lucide="rocket"></i>
        <span>Export ke POS</span>
      </a>

      <div class="drawer-section" id="drawerAdminTitle">
        PANEL ADMIN
      </div>

      <a class="drawer-link" id="drawerAdmin" href="admin.html">
        <i data-lucide="shield-check"></i>
        <span>Panel Admin</span>
      </a>

      <button class="drawer-logout" onclick="logout()">
        <i data-lucide="log-out"></i>
        Logout
      </button>
    </aside>
  `;

  document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

  const logoEl = document.getElementById("sidebarStoreLogo");
  const namaEl = document.getElementById("sidebarStoreName");

  const user = getCurrentUser() || {};

  if (logoEl) {
    if (user.logo) {
      logoEl.src = user.logo;
      logoEl.style.display = "block";
    } else {
      logoEl.style.display = "none";
    }
  }

  if (namaEl) {
    namaEl.textContent = user.tokoNama || "INVENTORY";
  }

  applySidebarPermissions();

  if (window.lucide) {
    lucide.createIcons();
  }
}

function hideSidebarItem(id) {
  document
    .getElementById(id)
    ?.style.setProperty("display", "none");
}

function applySidebarPermissions() {
  if (!can("input")) {
    hideSidebarItem("drawerInput");
  }

  if (!can("perbaikan")) {
    hideSidebarItem("drawerPerbaikan");
  }

  if (!can("modal")) {
    hideSidebarItem("drawerModal");
  }

  if (!can("export")) {
    hideSidebarItem("drawerExportKaspin");
  }

  if (!can("admin")) {
    hideSidebarItem("drawerAdmin");
    hideSidebarItem("drawerAdminTitle");
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
