const satuanOptions = [
  "PCS","Bungkus","Pack","Renteng","Slop","Dus","Box","Bal",
  "Lusin","Botol","Kaleng","Sachet","Kg","Gram","Liter","mL"
];

let multiCount = 1;
let codeReader = null;
let activeReaderId = null;
let activeTargetInput = null;
let torchOn = false;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  $("btnTambah").addEventListener("click", tambahSatuan);
  $("btnScan").addEventListener("click", () => startScanner("kode"));
});

function tambahSatuan() {
  if (multiCount >= 7) {
    Swal.fire("Maksimal", "Satuan maksimal sampai Satuan 7", "info");
    return;
  }

  multiCount++;

  const div = document.createElement("div");
  div.className = "multi";
  div.innerHTML = `
    <h3>Satuan ${multiCount}</h3>

    <label>Satuan ${multiCount}</label>
    <select name="satuan${multiCount}">
      <option value="">Pilih satuan</option>
      ${satuanOptions.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>

    <label>Kode Barang Satuan ${multiCount} (opsional)</label>
    <div class="scan-row">
      <input id="kode${multiCount}" name="kode${multiCount}" placeholder="Scan atau ketik manual">
      <button type="button" class="btn-scan-mini" onclick="startScanner('kode${multiCount}')">📷</button>
    </div>

    <div id="reader-kode${multiCount}" class="reader hidden"></div>

    <label>Harga Grosir Satuan ${multiCount}</label>
    <input name="harga${multiCount}" type="number" placeholder="Wajib jika satuan diisi">

    <label>Isi Satuan ${multiCount}</label>
    <input name="isi${multiCount}" type="number" placeholder="Wajib jika satuan diisi">
  `;

  $("multiWrap").appendChild(div);
}

async function startScanner(targetInputId) {
  await stopScanner();

  activeTargetInput = targetInputId;
  activeReaderId = `reader-${targetInputId}`;
  torchOn = false;

  const reader = $(activeReaderId);

  if (!reader) {
    Swal.fire("Error", "Area kamera tidak ditemukan.", "error");
    return;
  }

  reader.classList.remove("hidden");
  reader.innerHTML = `
    <div class="scanner-box">
      <video id="scannerVideo" playsinline></video>
      <div class="scan-frame"></div>
      <div class="scan-line"></div>
    </div>

    <div class="zoom-row">
      <button type="button" onclick="setZoom(1)">1x</button>
      <button type="button" onclick="setZoom(2)">2x</button>
      <button type="button" onclick="setZoom(3)">3x</button>
      <button type="button" onclick="toggleTorch()">🔦</button>
    </div>

    <button type="button" class="btn secondary" onclick="stopScanner()">Tutup Kamera</button>
  `;

  try {
    codeReader = new ZXing.BrowserMultiFormatReader();

    const devices = await codeReader.listVideoInputDevices();
    let selectedDeviceId = devices[0]?.deviceId;

    const backCamera = devices.find(device => {
      const label = device.label.toLowerCase();
      return label.includes("back") || label.includes("rear") || label.includes("environment");
    });

    if (backCamera) selectedDeviceId = backCamera.deviceId;

    codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      "scannerVideo",
      async (result) => {
        if (!result) return;

        const kode = result.text.trim();
        const input = $(activeTargetInput);

        if (input) input.value = kode;

        if (navigator.vibrate) navigator.vibrate(120);
        beep();

        await stopScanner();

        Swal.fire({
          icon: "success",
          title: "Barcode terbaca",
          text: kode,
          timer: 1000,
          showConfirmButton: false
        });
      }
    );

  } catch (error) {
    Swal.fire("Kamera gagal", "Izinkan akses kamera di browser HP.", "error");
    await stopScanner();
  }
}

async function stopScanner() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }

  if (activeReaderId && $(activeReaderId)) {
    $(activeReaderId).classList.add("hidden");
    $(activeReaderId).innerHTML = "";
  }

  activeReaderId = null;
  activeTargetInput = null;
  torchOn = false;
}

async function setZoom(level) {
  const video = document.getElementById("scannerVideo");
  if (!video || !video.srcObject) return;

  const track = video.srcObject.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities();

  if (!capabilities.zoom) {
    Swal.fire("Zoom tidak support", "Kamera HP ini tidak mendukung zoom dari browser.", "info");
    return;
  }

  const zoom = Math.min(level, capabilities.zoom.max);

  await track.applyConstraints({
    advanced: [{ zoom }]
  });
}

async function toggleTorch() {
  const video = document.getElementById("scannerVideo");
  if (!video || !video.srcObject) return;

  const track = video.srcObject.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities();

  if (!capabilities.torch) {
    Swal.fire("Flash tidak support", "Browser atau HP ini tidak mendukung flash kamera.", "info");
    return;
  }

  torchOn = !torchOn;

  await track.applyConstraints({
    advanced: [{ torch: torchOn }]
  });
}

function beep() {
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

function ambilDataForm() {
  const payload = {
    action: "addBarang",
    nama: $("nama").value.trim(),
    modal: $("modal").value.trim(),
    satuan1: $("satuan1").value.trim(),
    kode: $("kode").value.trim(),
    hargaEcer: $("hargaEcer").value.trim(),
    hargaGrosir1: $("hargaGrosir1").value.trim(),
    multis: []
  };

  for (let i = 2; i <= 7; i++) {
    payload.multis.push({
      satuan: document.querySelector(`[name="satuan${i}"]`)?.value.trim() || "",
      kode: document.querySelector(`[name="kode${i}"]`)?.value.trim() || "",
      harga: document.querySelector(`[name="harga${i}"]`)?.value.trim() || "",
      isi: document.querySelector(`[name="isi${i}"]`)?.value.trim() || ""
    });
  }

  return payload;
}

$("barangForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = ambilDataForm();

  if (!payload.kode || !payload.nama || !payload.modal || !payload.satuan1 || !payload.hargaEcer) {
    Swal.fire("Belum lengkap", "Kode, nama, modal, satuan 1, dan harga ecer wajib diisi.", "error");
    return;
  }

  for (let i = 0; i < payload.multis.length; i++) {
    const m = payload.multis[i];

    if (m.satuan && (!m.harga || !m.isi)) {
      Swal.fire("Belum lengkap", `Harga dan isi Satuan ${i + 2} wajib diisi.`, "error");
      return;
    }
  }

  try {
    Swal.fire({
      title: "Menyimpan...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    Swal.close();

    if (data.success) {
      Swal.fire("Berhasil", "Barang berhasil disimpan.", "success");

      $("barangForm").reset();
      $("multiWrap").innerHTML = "";
      multiCount = 1;
    } else {
      Swal.fire("Gagal", data.message || "Tidak bisa menyimpan.", "error");
    }

  } catch (err) {
    Swal.close();
    Swal.fire("Error", err.message, "error");
  }
});