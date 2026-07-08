const list = document.getElementById("list");

document.addEventListener("DOMContentLoaded", () => {
  loadTugas();
});

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
                <button type="button" class="btn-scan-mini" onclick="scanPerbaikan('fix-${item.row}-${f.col}')"><i data-lucide="scan-barcode"></i></button>
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
    if (window.lucide) lucide.createIcons();

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
let repairActiveReaderId = null;
let repairAvailableCameras = [];
let repairSelectedCameraIndex = 0;
let repairTorchOn = false;

async function scanPerbaikan(inputId) {
  const readerId = `reader-${inputId}`;
  const reader = document.getElementById(readerId);

  if (!reader) return;

  await stopScanPerbaikan();

  repairActiveReaderId = readerId;
  repairTorchOn = false;

  reader.classList.remove("hidden");
  reader.innerHTML = `
    <div class="scanner-box">
      <video id="repairVideo" playsinline></video>
      <div class="scan-frame"></div>
      <div class="scan-line"></div>
    </div>

    <div class="zoom-row">
      <button type="button" onclick="setRepairZoom(1)">1x</button>
      <button type="button" onclick="setRepairZoom(2)">2x</button>
      <button type="button" onclick="setRepairZoom(3)">3x</button>
      <button type="button" onclick="toggleRepairTorch()">🔦</button>
      <button type="button" onclick="switchRepairCamera('${inputId}')">🔄</button>
    </div>

    <button type="button" class="btn secondary" onclick="stopScanPerbaikan()">Tutup Kamera</button>
  `;

  try {
    repairScanner = new ZXing.BrowserMultiFormatReader();

    const devices = await repairScanner.listVideoInputDevices();
    repairAvailableCameras = devices;

    if (!repairAvailableCameras.length) {
      Swal.fire("Kamera tidak ditemukan", "Tidak ada kamera yang bisa digunakan.", "error");
      return;
    }

    if (repairSelectedCameraIndex >= repairAvailableCameras.length) {
      repairSelectedCameraIndex = 0;
    }

    const selectedDeviceId = repairAvailableCameras[repairSelectedCameraIndex]?.deviceId;

    repairScanner.decodeFromVideoDevice(
      selectedDeviceId,
      "repairVideo",
      async (result) => {
        if (!result) return;

        document.getElementById(inputId).value = result.text.trim();

        if (navigator.vibrate) navigator.vibrate(120);
        beepRepair();

        await stopScanPerbaikan();
        document.getElementById(inputId).blur();

        Swal.fire({
          icon: "success",
          title: "Barcode terbaca",
          timer: 900,
          showConfirmButton: false
        });
      }
    );
  } catch (err) {
    Swal.fire("Kamera gagal", "Izinkan akses kamera di browser HP.", "error");
    await stopScanPerbaikan();
  }
}

async function stopScanPerbaikan() {
  if (repairScanner) {
    repairScanner.reset();
    repairScanner = null;
  }

  const videos = document.querySelectorAll("video");
  videos.forEach(video => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  });

  document.querySelectorAll(".reader").forEach(reader => {
    reader.classList.add("hidden");
    reader.innerHTML = "";
  });

  repairActiveReaderId = null;
  repairTorchOn = false;
}

async function setRepairZoom(level) {
  const video = document.getElementById("repairVideo");
  if (!video || !video.srcObject) return;

  const track = video.srcObject.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities();

  if (!capabilities.zoom) {
    Swal.fire("Zoom tidak support", "Kamera HP ini tidak mendukung zoom dari browser.", "info");
    return;
  }

  const zoom = Math.min(level, capabilities.zoom.max);
  await track.applyConstraints({ advanced: [{ zoom }] });
}

async function toggleRepairTorch() {
  const video = document.getElementById("repairVideo");
  if (!video || !video.srcObject) return;

  const track = video.srcObject.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities();

  if (!capabilities.torch) {
    Swal.fire("Flash tidak support", "Browser atau HP ini tidak mendukung flash kamera.", "info");
    return;
  }

  repairTorchOn = !repairTorchOn;
  await track.applyConstraints({ advanced: [{ torch: repairTorchOn }] });
}

async function switchRepairCamera(inputId) {
  if (!repairAvailableCameras.length) {
    Swal.fire("Kamera tidak ditemukan", "Tidak ada kamera lain yang bisa dipilih.", "info");
    return;
  }

  repairSelectedCameraIndex++;

  if (repairSelectedCameraIndex >= repairAvailableCameras.length) {
    repairSelectedCameraIndex = 0;
  }

  await stopScanPerbaikan();
  await scanPerbaikan(inputId);
}

function beepRepair() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = 900;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}