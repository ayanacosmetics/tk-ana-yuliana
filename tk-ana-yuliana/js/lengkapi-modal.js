const list = document.getElementById("list");
let modalData = [];

document.addEventListener("DOMContentLoaded", () => {
  loadModalKosong();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = modalData.filter(item => 
        (item.nama && item.nama.toLowerCase().includes(keyword)) ||
        (item.kode && String(item.kode).toLowerCase().includes(keyword))
      );
      renderList(filtered);
    });
  }
});

async function loadModalKosong() {
  list.innerHTML = `<div class="item">Memuat...</div>`;

  try {
    const res = await fetch(`${API_URL}?action=modalKosong`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      list.innerHTML = `<div class="item">Tidak ada barang modal 0.</div>`;
      modalData = [];
      return;
    }

    modalData = data.items;
    renderList(modalData);
  } catch (error) {
    list.innerHTML = `<div class="item">Gagal memuat data.</div>`;
    console.error(error);
  }
}

function renderList(items) {
  if (items.length === 0) {
    list.innerHTML = `<div class="item">Pencarian tidak ditemukan.</div>`;
    return;
  }

  list.innerHTML = items.map(item => `
  <div class="item">
    <b>${item.nama}</b>
    <div class="small">Kode: ${item.kode}</div>
    <div class="small">Satuan 1: ${item.satuan1 || "-"}</div>
    <div class="small">Harga Ecer per ${item.satuan1 || "Satuan 1"}: ${item.hargaEcer || "-"}</div>
    <div class="small">Harga Grosir 1 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir1 || "-"}</div>
    ${item.hargaGrosir2_1 && item.hargaGrosir2_1 !== "-" && item.hargaGrosir2_1 !== "x" && item.hargaGrosir2_1 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir2_1}</div>` : ""}
    ${item.hargaGrosir3_1 && item.hargaGrosir3_1 !== "-" && item.hargaGrosir3_1 !== "x" && item.hargaGrosir3_1 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan1 || "Satuan 1"}: ${item.hargaGrosir3_1}</div>` : ""}

    ${item.satuan2 && item.satuan2 !== "-" && item.satuan2 !== "x" && item.satuan2 !== "X" ? `
      <hr>
      <div class="small">Satuan 2: ${item.satuan2}</div>
      <div class="small">Kode Barang ${item.satuan2}: ${item.kode2 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan2}: ${item.harga2_1 || "-"}</div>
      ${item.harga2_2 && item.harga2_2 !== "-" && item.harga2_2 !== "x" && item.harga2_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan2}: ${item.harga2_2}</div>` : ""}
      ${item.harga2_3 && item.harga2_3 !== "-" && item.harga2_3 !== "x" && item.harga2_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan2}: ${item.harga2_3}</div>` : ""}
      <div class="small">Isi ${item.satuan2}: ${item.isi2 || "-"}</div>
    ` : ""}

    ${item.satuan3 && item.satuan3 !== "-" && item.satuan3 !== "x" && item.satuan3 !== "X" ? `
      <hr>
      <div class="small">Satuan 3: ${item.satuan3}</div>
      <div class="small">Kode Barang ${item.satuan3}: ${item.kode3 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan3}: ${item.harga3_1 || "-"}</div>
      ${item.harga3_2 && item.harga3_2 !== "-" && item.harga3_2 !== "x" && item.harga3_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan3}: ${item.harga3_2}</div>` : ""}
      ${item.harga3_3 && item.harga3_3 !== "-" && item.harga3_3 !== "x" && item.harga3_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan3}: ${item.harga3_3}</div>` : ""}
      <div class="small">Isi ${item.satuan3}: ${item.isi3 || "-"}</div>
    ` : ""}

    ${item.satuan4 && item.satuan4 !== "-" && item.satuan4 !== "x" && item.satuan4 !== "X" ? `
      <hr>
      <div class="small">Satuan 4: ${item.satuan4}</div>
      <div class="small">Kode Barang ${item.satuan4}: ${item.kode4 || "-"}</div>
      <div class="small">Harga Grosir 1 per ${item.satuan4}: ${item.harga4_1 || "-"}</div>
      ${item.harga4_2 && item.harga4_2 !== "-" && item.harga4_2 !== "x" && item.harga4_2 !== "X" ? `<div class="small">Harga Grosir 2 per ${item.satuan4}: ${item.harga4_2}</div>` : ""}
      ${item.harga4_3 && item.harga4_3 !== "-" && item.harga4_3 !== "x" && item.harga4_3 !== "X" ? `<div class="small">Harga Grosir 3 per ${item.satuan4}: ${item.harga4_3}</div>` : ""}
      <div class="small">Isi ${item.satuan4}: ${item.isi4 || "-"}</div>
    ` : ""}

    <input
      type="number"
      id="modal-${item.row}"
      inputmode="numeric"
      pattern="[0-9]*"
      placeholder="Isi modal asli">

    <button class="btn primary" onclick="simpanModal(${item.row})">
      Simpan Modal
    </button>
  </div>
`).join("");
  if (window.lucide) lucide.createIcons();
}

async function simpanModal(row) {
  const modal = document.getElementById(`modal-${row}`).value;

  if (!modal) {
    Swal.fire("Belum diisi", "Modal wajib diisi.", "error");
    return;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "updateModal",
      row,
      modal
    })
  });

  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil", "Modal berhasil diperbarui.", "success");
    loadModalKosong();
  } else {
    Swal.fire("Gagal", data.message || "Tidak bisa update modal.", "error");
  }
} catch (error) {
  Swal.fire("Gagal", "Gagal menghubungi server.", "error");
  console.error(error);
}
}

// --- SCANNER LOGIC ---
let codeReader = null;
let torchOn = false;
let selectedCameraIndex = 0;
let availableCameras = [];

async function startScannerSearch() {
  await stopScannerSearch();
  torchOn = false;

  const reader = document.getElementById("reader-search");
  if (!reader) return;

  reader.classList.remove("hidden");
  reader.innerHTML = `
    <div class="scanner-box">
      <video id="scannerVideo" playsinline style="width:100%; border-radius:8px;"></video>
    </div>
    <div class="zoom-row" style="display:flex; gap:8px; margin-top:8px; justify-content:center;">
      <button type="button" class="btn secondary" onclick="toggleTorchSearch()" style="padding: 6px 12px; font-size:14px;">🔦 Flash</button>
      <button type="button" class="btn secondary" onclick="switchCameraSearch()" style="padding: 6px 12px; font-size:14px;">🔄 Balik</button>
      <button type="button" class="btn secondary" onclick="stopScannerSearch()" style="padding: 6px 12px; font-size:14px;">Tutup</button>
    </div>
  `;

  try {
    codeReader = new ZXing.BrowserMultiFormatReader();
    availableCameras = await codeReader.listVideoInputDevices();

    if (!availableCameras.length) {
      Swal.fire("Kamera tidak ditemukan", "Tidak ada kamera yang bisa digunakan.", "error");
      return;
    }

    if (selectedCameraIndex >= availableCameras.length) {
      selectedCameraIndex = 0;
    }

    const selectedDeviceId = availableCameras[selectedCameraIndex]?.deviceId;

    codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      "scannerVideo",
      async (result) => {
        if (!result) return;

        const kode = result.text.trim();
        const searchInput = document.getElementById("searchInput");
        
        if (searchInput) {
          searchInput.value = kode;
          // Trigger input event to filter list
          searchInput.dispatchEvent(new Event("input"));
        }

        if (navigator.vibrate) navigator.vibrate(120);
        beepSearch();

        await stopScannerSearch();
      }
    );
  } catch (error) {
    Swal.fire("Kamera gagal", "Izinkan akses kamera di browser HP.", "error");
    await stopScannerSearch();
  }
}

async function stopScannerSearch() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
  const reader = document.getElementById("reader-search");
  if (reader) {
    reader.classList.add("hidden");
    reader.innerHTML = "";
  }
  torchOn = false;
}

async function toggleTorchSearch() {
  const video = document.getElementById("scannerVideo");
  if (!video || !video.srcObject) return;

  const track = video.srcObject.getVideoTracks()[0];
  if (!track) return;
  const capabilities = track.getCapabilities();
  if (!capabilities.torch) {
    Swal.fire("Flash tidak support", "HP ini tidak mendukung flash kamera dari web.", "info");
    return;
  }
  torchOn = !torchOn;
  await track.applyConstraints({ advanced: [{ torch: torchOn }] });
}

async function switchCameraSearch() {
  if (!availableCameras.length) return;
  selectedCameraIndex++;
  if (selectedCameraIndex >= availableCameras.length) {
    selectedCameraIndex = 0;
  }
  await stopScannerSearch();
  await startScannerSearch();
}

function beepSearch() {
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