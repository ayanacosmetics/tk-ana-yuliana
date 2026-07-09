function getLoginUserExport() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}

function downloadExportKaspin() {
  const user = getLoginUserExport();

  const tokoId = user.toko || user.toko_id || user.id_toko;

  if (!tokoId) {
    alert("Toko ID tidak ditemukan. Silakan logout lalu login ulang.");
    return;
  }

  const yakin = confirm("Export data Kasir Pintar untuk toko ini?");

  if (!yakin) return;

  window.location.href = `/api/export-kaspin?toko=${encodeURIComponent(tokoId)}`;
}