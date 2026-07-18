async function loadRole() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="item">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
    <div class="item">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `;

  const res = await fetch(`${MASTER_API_URL}?action=listRole`);
  const data = await res.json();

  if (!data.success) {
    content.innerHTML = `<div class="item">Gagal memuat hak akses.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="form admin-module-card">
      <h3><i data-lucide="key-round"></i> Hak Akses</h3>
      <p class="admin-desc">
        Role diatur dari Sheet Role pada Master Admin.
      </p>
    </div>

    <div class="list admin-list">
      ${data.items.map(r => {
        const status = (r.status || "").toLowerCase();
        const nama = (r.nama || "").toLowerCase();

        return `
          <div class="item admin-role-card">
            <div class="admin-user-top">
              <div class="admin-avatar role-avatar">
                <i data-lucide="shield-check"></i>
              </div>

              <div>
                <b>${r.nama}</b>
                <div class="small">Role akses sistem</div>
              </div>
            </div>

            <div class="admin-badges">
              <span class="badge-role ${nama}">
                <i data-lucide="shield"></i>
                ${r.nama}
              </span>

              <span class="badge-status ${status}">
                ${r.status || "aktif"}
              </span>
            </div>

            <div class="permission-grid">
              ${permissionItem("layout-dashboard", "Dashboard", r.dashboard)}
              ${permissionItem("package", "Input Barang", r.input)}
              ${permissionItem("wrench", "Perbaikan", r.perbaikan)}
              ${permissionItem("badge-dollar-sign", "Modal", r.modal)}
              ${permissionItem("download", "Export POS", r.export)}
              ${permissionItem("settings", "Admin", r.admin)}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function permissionItem(icon, label, allowed) {
  return `
    <div class="permission-item ${allowed ? "allowed" : "denied"}">
      <i data-lucide="${icon}"></i>
      <span>${label}</span>
      <b>${allowed ? "✓" : "×"}</b>
    </div>
  `;
}
