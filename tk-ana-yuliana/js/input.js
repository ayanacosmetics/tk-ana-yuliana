const satuanOptions = [
  "PCS","Bungkus","Pack","Renteng","Slop","Dus","Box","Bal",
  "Lusin","Botol","Kaleng","Sachet","Kg","Gram","Liter","mL"
];

let multiCount = 1;
let codeReader = null;
let activeReaderId = null;
let activeTargetInput = null;
let torchOn = false;
let editMode = false;
let editingKode = "";

const DRAFT_KEY = "tk_ana_yuliana_draft";

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  cekDraft();

  $("btnTambah").addEventListener("click", () => tambahSatuan());

  $("btnScan").addEventListener("click", () => {
    startScanner("kode");
  });

  $("barangForm").addEventListener("input", simpanDraft);
});

function tambahSatuan(data = {}) {
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
      ${satuanOptions.map(s => `<option value="${s}" ${data.satuan === s ? "selected" : ""}>${s}</option>`).join("")}
    </select>

    <label>Kode Barang Satuan ${multiCount} (opsional)</label>
    <div class="scan-row">
      <input id="kode${multiCount}" name="kode${multiCount}" value="${data.kode || ""}" placeholder="Scan atau ketik manual">
      <button type="button" class="btn-scan-mini" onclick="startScanner('kode${multiCount}')">📷</button>
    </div>

    <div id="reader-kode${multiCount}" class="reader hidden"></div>

    <label>Harga Grosir Satuan ${multiCount}</label>
    <input name="harga${multiCount}" type="number" value="${data.harga || ""}" placeholder="Wajib jika satuan diisi">

    <label>Isi Satuan ${multiCount}</label>
    <input name="isi${multiCount}" type="number" value="${data.isi || ""}" placeholder="Wajib jika satuan diisi">
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
    Swal.fire("Reader tidak ditemukan", `Area kamera untuk ${targetInputId} belum ada.`, "error");
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

        if (!input) return;

        input.value = kode;

        if (navigator.vibrate) navigator.vibrate(120);
        beep();

        const targetSaatIni = activeTargetInput;

        await stopScanner();

        if (!cekBarcodeDuplikatDiForm()) return;

        await cekKodeSetelahScan(kode, targetSaatIni);

        simpanDraft();
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

function cekBarcodeDuplikatDiForm() {
  const inputs = document.querySelectorAll('input[id^="kode"]');
  const values = [];

  for (const input of inputs) {
    const val = input.value.trim();
    if (!val) continue;

    if (values.includes(val)) {
      Swal.fire("Barcode dobel", "Barcode ini sudah dipakai di satuan lain.", "warning");
      input.value = "";
      return false;
    }

    values.push(val);
  }

  return true;
}

async function cekKodeSetelahScan(kode, targetInputId) {
  if (!kode) return;

  if (API_URL.includes("PASTE_URL")) {
    Swal.fire("Barcode terbaca", "Silakan lanjut input.", "success");
    return;
  }

  try {
    Swal.showLoading();

    const res = await fetch(`${API_URL}?action=checkBarcode&kode=${encodeURIComponent(kode)}`);
    const data = await res.json();

    Swal.close();

    if (data.exists) {
      Swal.fire({
        icon: "warning",
        title: "Barang sudah terdaftar",
        html: `
          <b>${data.nama || "Nama barang tidak tersedia"}</b><br>
          <small>Kode: ${kode}</small><br><br>
          Mau edit barang ini?
        `,
        showCancelButton: true,
        confirmButtonText: "Edit Barang",
        cancelButtonText: "Batal",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          isiFormDariBarang(data);
        } else {
          const input = $(targetInputId);
          if (input) input.value = "";
          simpanDraft();
        }
      });

      return;
    }

    Swal.fire("Barcode baru", "Silakan lanjut input.", "success");

  } catch (e) {
    Swal.close();
    Swal.fire("Barcode terbaca", "Silakan lanjut input.", "success");
  }
}

function isiFormDariBarang(data) {
  editMode = true;
  editingKode = data.kode || "";

  $("nama").value = data.nama || "";
  $("modal").value = data.modal || "";
  $("satuan1").value = data.satuan1 || "PCS";
  $("kode").value = data.kode || "";
  $("hargaEcer").value = data.hargaEcer || "";
  $("hargaGrosir1").value = data.hargaGrosir1 || "";

  $("multiWrap").innerHTML = "";
  multiCount = 1;

  if (data.multis && Array.isArray(data.multis)) {
    data.multis.forEach(m => {
      if (m.satuan || m.kode || m.harga || m.isi) {
        tambahSatuan(m);
      }
    });
  }

  simpanDraft();

  Swal.fire("Mode edit", "Semua data barang sudah dimunculkan. Silakan lanjut edit.", "info");
}

function ambilDataForm() {
  const form = new FormData($("barangForm"));

  const payload = {
    action: "addBarang",
    mode: editMode ? "edit" : "add",
    nama: form.get("nama"),
    modal: form.get("modal"),
    satuan1: form.get("satuan1"),
    kode: form.get("kode"),
    hargaEcer: form.get("hargaEcer"),
    hargaGrosir1: form.get("hargaGrosir1"),
    multis: []
  };

  for (let i = 2; i <= 7; i++) {
    payload.multis.push({
      satuan: form.get(`satuan${i}`) || "",
      kode: form.get(`kode${i}`) || "",
      harga: form.get(`harga${i}`) || "",
      isi: form.get(`isi${i}`) || ""
    });
  }

  return payload;
}

function simpanDraft() {
  const data = ambilDataForm();
  data.editMode = editMode;
  data.editingKode = editingKode;
  data.multiCount = multiCount;

  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function cekDraft() {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (!draft) return;

  Swal.fire({
    title: "Lanjutkan editan?",
    text: "Ada data yang belum selesai disimpan.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Lanjutkan",
    cancelButtonText: "Hapus"
  }).then(result => {
    if (result.isConfirmed) {
      muatDraft(JSON.parse(draft));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  });
}

function muatDraft(data) {
  editMode = data.editMode || false;
  editingKode = data.editingKode || "";

  $("nama").value = data.nama || "";
  $("modal").value = data.modal || "";
  $("satuan1").value = data.satuan1 || "PCS";
  $("kode").value = data.kode || "";
  $("hargaEcer").value = data.hargaEcer || "";
  $("hargaGrosir1").value = data.hargaGrosir1 || "";

  $("multiWrap").innerHTML = "";
  multiCount = 1;

  if (data.multis && Array.isArray(data.multis)) {
    data.multis.forEach(m => {
      if (m.satuan || m.kode || m.harga || m.isi) {
        tambahSatuan(m);
      }
    });
  }
}

$("barangForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!cekBarcodeDuplikatDiForm()) return;

  const payload = ambilDataForm();

  for (let i = 0; i < payload.multis.length; i++) {
    const m = payload.multis[i];

    if (m.satuan && (!m.harga || !m.isi)) {
      Swal.fire("Belum lengkap", `Harga dan isi Satuan ${i + 2} wajib diisi.`, "error");
      return;
    }
  }

  if (API_URL.includes("PASTE_URL")) {
    Swal.fire("Belum tersambung", "Isi dulu API_URL di js/config.js", "warning");
    return;
  }

  try {
    Swal.showLoading();

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    Swal.close();

    if (data.success) {
      Swal.fire(
        data.mode === "updated" ? "Berhasil diupdate" : "Tersimpan",
        data.mode === "updated" ? "Data barang berhasil diperbarui." : "Barang masuk ke Data Barang.",
        "success"
      );

      $("barangForm").reset();
      $("multiWrap").innerHTML = "";
      multiCount = 1;
      editMode = false;
      editingKode = "";
      localStorage.removeItem(DRAFT_KEY);

    } else {
      Swal.fire("Gagal", data.message || "Tidak bisa menyimpan.", "error");
    }

  } catch (err) {
    Swal.close();
    Swal.fire("Error", "Gagal konek ke server.", "error");
  }
});