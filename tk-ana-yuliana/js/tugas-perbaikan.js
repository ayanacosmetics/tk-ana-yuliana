const list = document.getElementById("list");
const btnLoad = document.getElementById("btnLoad");

btnLoad.addEventListener("click", loadTugas);

async function loadTugas() {
  list.innerHTML = `<div class="item">Memuat tugas...</div>`;

  try {
    const user = JSON.parse(localStorage.getItem("tay_user") || "{}");

    const res = await fetch(
      `${API_URL}?action=tugasPerbaikan&petugas=${encodeURIComponent(user.name || "")}`
    );

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      list.innerHTML = `
        <div class="item success-card">
          <h3>🎉 Selamat!</h3>
          <p>Anda telah menginput semua barang dengan benar.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = data.items.map(item => `
      <div class="item">
        <b>${item.nama}</b>
        <div class="small">Kode: ${item.kode || "-"}</div>
        <div class="small">Satuan terkecil: ${item.satuan1 || "-"}</div>

        <hr>

        <b>Perlu diperbaiki:</b>

        ${item.fields.map(f => `
          <div style="margin-top:10px">
            <label>${f.label}</label>

            ${f.label.toLowerCase().includes("kode barang") ? `
              <div class="scan-row">
                <input
                  id="fix-${item.row}-${f.col}"
                  inputmode="numeric"
                  placeholder="${f.placeholder}">
                <button type="button" class="btn-scan-mini" onclick="scanPerbaikan('fix-${item.row}-${f.col}')">📷</button>
              </div>
              <div id="reader-fix-${item.row}-${f.col}" class="reader hidden"></div>
            ` : `
              <input
                id="fix-${item.row}-${f.col}"
                inputmode="${f.type === "number" ? "numeric" : "text"}"
                placeholder="${f.placeholder}">
            `}
          </div>
        `).join("")}

        <button class="btn primary" onclick='simpanPerbaikan(${JSON.stringify(item)})'>
          Simpan Perbaikan
        </button>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="item">Gagal memuat tugas.</div>`;
  }
}

async function simpanPerbaikan(item) {
  const updates = [];

  for (const f of item.fields) {
    const input = document.getElementById(`fix-${item.row}-${f.col}`);
    const value = input.value.trim();

    if (!value) {
      Swal.fire("Belum lengkap", `${f.label} wajib diisi.`, "error");
      return;
    }

    updates.push({
      col: f.col,
      value
    });
  }

  const user = JSON.parse(localStorage.getItem("tay_user") || "{}");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "simpanPerbaikan",
      row: item.row,
      updates,
      petugas: user.name || ""
    })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Perbaikan berhasil disimpan.", "success");
    loadTugas();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa menyimpan perbaikan.", "error");
  }
}

let repairScanner = null;

async function scanPerbaikan(inputId) {
  const readerId = `reader-${inputId}`;
  const reader = document.getElementById(readerId);

  if (!reader) return;

  if (repairScanner) {
    repairScanner.reset();
    repairScanner = null;
  }

  reader.classList.remove("hidden");
  reader.innerHTML = `
    <div class="scanner-box">
      <video id="repairVideo" playsinline></video>
      <div class="scan-frame"></div>
      <div class="scan-line"></div>
    </div>
    <button type="button" class="btn secondary" onclick="stopScanPerbaikan('${readerId}')">Tutup Kamera</button>
  `;

  repairScanner = new ZXing.BrowserMultiFormatReader();

  const devices = await repairScanner.listVideoInputDevices();
  const deviceId = devices[0]?.deviceId;

  repairScanner.decodeFromVideoDevice(deviceId, "repairVideo", (result) => {
    if (!result) return;

    document.getElementById(inputId).value = result.text.trim();

    if (navigator.vibrate) navigator.vibrate(120);

    stopScanPerbaikan(readerId);

    Swal.fire({
      icon: "success",
      title: "Barcode terbaca",
      timer: 900,
      showConfirmButton: false
    });
  });
}

function stopScanPerbaikan(readerId) {
  if (repairScanner) {
    repairScanner.reset();
    repairScanner = null;
  }

  const reader = document.getElementById(readerId);
  if (reader) {
    reader.classList.add("hidden");
    reader.innerHTML = "";
  }
}