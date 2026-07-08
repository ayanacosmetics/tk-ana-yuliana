async function loadRole() {
  const content = document.getElementById("content");
  content.innerHTML = `<div class="item">Memuat role...</div>`;

  const res = await fetch(`${MASTER_API_URL}?action=listRole`);
  const data = await res.json();

  if (!data.success) {
    content.innerHTML = `<div class="item">Gagal memuat role.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="form">
      <h3>🛡️ Hak Akses</h3>

      <div class="list">
        ${data.items.map(r => `
          <div class="item">
            <b>${r.nama}</b>
            <div class="small">Dashboard: ${r.dashboard ? "✅" : "❌"}</div>
            <div class="small">Input Barang: ${r.input ? "✅" : "❌"}</div>
            <div class="small">Tugas Perbaikan: ${r.perbaikan ? "✅" : "❌"}</div>
            <div class="small">Lengkapi Modal: ${r.modal ? "✅" : "❌"}</div>
            <div class="small">Siap Rilis: ${r.rilis ? "✅" : "❌"}</div>
            <div class="small">Panel Admin: ${r.admin ? "✅" : "❌"}</div>
            <div class="small">Status: ${r.status}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}