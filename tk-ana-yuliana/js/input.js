const satuanOptions = [
  "PCS","Bungkus","Pack","Renteng","Slop","Dus","Box","Bal",
  "Lusin","Botol","Kaleng","Sachet","Kg","Gram","Liter","mL"
];

let multiCount = 1;
let codeReader = null;
let activeReaderId = null;
let activeTargetInput = null;
let torchOn = false;
let selectedCameraIndex = 0;
let availableCameras = [];

let editMode = false;
let editingRow = "";
let barcodeCache = new Map();

const DRAFT_KEY = "tk_ana_yuliana_draft_v111";
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  $("btnTambah").addEventListener("click", () => tambahSatuan());
  $("btnScan").addEventListener("click", () => startScanner("kode"));
  $("barangForm").addEventListener("input", simpanDraft);
  $("nama").addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });

  $("satuan1").addEventListener("change", updateLabelSatuan1);
  updateLabelSatuan1();
  updateModalLabel();
  updateTambahSatuanButton();

  await loadBarcodeCache();
  cekDraft();
});

async function loadBarcodeCache() {
  if (API_URL.includes("PASTE_URL")) return;

  try {
    const res = await fetch(`${API_URL}?action=getBarcodeList`);
    const data = await res.json();

    if (data.success && Array.isArray(data.items)) {
      barcodeCache.clear();
      data.items.forEach(item => {
        if (item.kode) barcodeCache.set(String(item.kode).trim(), item);
      });
      console.log(`Barcode cache: ${barcodeCache.size}`);
    }
  } catch (e) {
    console.warn("Gagal load barcode cache", e);
  }
}

function tambahSatuan(data = {}) {
  if (multiCount >= 7) {
    Swal.fire("Maksimal", "Satuan maksimal sampai Satuan 7", "info");
    return;
  }

  multiCount++;

  const div = document.createElement("div");
  div.className = "multi";
  div.innerHTML = `
    <h3 id="judulSatuan${multiCount}">Masukkan satuan setelah ${getSatuanSebelumnya(multiCount)}</h3>

    <label>Satuan ${multiCount}</label>
    <select name="satuan${multiCount}" onchange="updateLabelSatuan(${multiCount}); updateJudulSemuaSatuan();">
      <option value="">Pilih satuan</option>
      ${satuanOptions.map(s => `<option value="${s}" ${data.satuan === s ? "selected" : ""}>${s}</option>`).join("")}
    </select>

    <label id="labelKode${multiCount}"Kode Barang Satuan ${multiCount} (opsional)</label>
    <div class="scan-row">
      <input
          id="kode${multiCount}"
          name="kode${multiCount}"
          value="${data.kode || ""}"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          placeholder="Pilih satuan dulu">
      >
      <button type="button" class="btn-scan-mini" onclick="startScanner('kode${multiCount}')">📷</button>
    </div>

    <div id="reader-kode${multiCount}" class="reader hidden"></div>

    <label id="labelHarga${multiCount}"Harga Grosir Satuan ${multiCount}</label>
    <input
        name="harga${multiCount}"
        type="number"
        value="${data.harga || ""}"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="off"
        placeholder="Pilih satuan dulu">
    >

    <label id="labelIsi${multiCount}"Isi Satuan ${multiCount}</label>
    <input
        name="isi${multiCount}"
        type="number"
        value="${data.isi || ""}"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="off"
        placeholder="Pilih satuan dulu">
    >
  `;

  $("multiWrap").appendChild(div);
  updateLabelSatuan(multiCount);
}

function getSatuanSebelumnya(no) {
  if (no === 2) {
    return $("satuan1")?.value || "satuan terkecil";
  }

  return document.querySelector(`[name="satuan${no - 1}"]`)?.value || `Satuan ${no - 1}`;
}

function updateJudulSemuaSatuan() {
  for (let i = 2; i <= 7; i++) {
    const judul = document.getElementById(`judulSatuan${i}`);
    if (judul) {
      judul.textContent = `Masukkan satuan setelah ${getSatuanSebelumnya(i)}`;
    }
  }
}

function updateLabelSatuan(no) {
  const satuan = document.querySelector(`[name="satuan${no}"]`)?.value || "";

  const labelKode = document.getElementById(`labelKode${no}`);
  const labelHarga = document.getElementById(`labelHarga${no}`);
  const labelIsi = document.getElementById(`labelIsi${no}`);

  const inputKode = document.querySelector(`[name="kode${no}"]`);
  const inputHarga = document.querySelector(`[name="harga${no}"]`);
  const inputIsi = document.querySelector(`[name="isi${no}"]`);

  if (!satuan) {
    if (labelKode) labelKode.textContent = "Kode Barang";
    if (labelHarga) labelHarga.textContent = "Harga Grosir";
    if (labelIsi) labelIsi.textContent = "Isi";

    if (inputKode) inputKode.placeholder = "Pilih satuan dulu";
    if (inputHarga) inputHarga.placeholder = "Pilih satuan dulu";
    if (inputIsi) inputIsi.placeholder = "Pilih satuan dulu";
    return;
  }

  if (labelKode) labelKode.textContent = `Kode Barang ${satuan} (opsional)`;
  if (labelHarga) labelHarga.textContent = `Harga Grosir ${satuan}`;
  if (labelIsi) labelIsi.textContent = `Isi ${satuan}`;

  if (inputKode) inputKode.placeholder = `Scan/ketik barcode ${satuan}`;
  if (inputHarga) inputHarga.placeholder = `Harga grosir per ${satuan}`;
  if (inputIsi) inputIsi.placeholder = `Jumlah pcs dalam ${satuan}`;
  updateTambahSatuanButton();
  updateModalLabel();
}

function updateModalLabel(){

    let terakhir = $("satuan1").value || "PCS";

    for(let i=2;i<=multiCount;i++){

        const s=document.querySelector(`[name="satuan${i}"]`);

        if(s && s.value){
            terakhir=s.value;
        }

    }

    $("labelModal").textContent =
        `Modal per ${terakhir}`;

    $("modal").placeholder =
        `Masukkan modal per ${terakhir}`;

}

function updateLabelSatuan1() {
  const satuan = $("satuan1")?.value || "PCS";

  const labelEcer = $("labelHargaEcer1");
  const labelGrosir = $("labelHargaGrosir1");
  const inputEcer = $("hargaEcer");
  const inputGrosir = $("hargaGrosir1");

  if (labelEcer) labelEcer.textContent = `Harga Ecer per ${satuan}`;
  if (labelGrosir) labelGrosir.textContent = `Harga Grosir per ${satuan}`;

  if (inputEcer) inputEcer.placeholder = `Harga ecer per ${satuan}`;
  if (inputGrosir) inputGrosir.placeholder = `Harga grosir per ${satuan}`;
  updateJudulSemuaSatuan();
  updateTambahSatuanButton();
  updateModalLabel();
}

function updateTambahSatuanButton() {

    let terakhir = $("satuan1").value || "PCS";

    for (let i = 2; i <= multiCount; i++) {

        const s = document.querySelector(`[name="satuan${i}"]`);

        if (s && s.value) {
            terakhir = s.value;
        }

    }

    $("btnTambah").textContent =
        `+ Tambah Satuan setelah ${terakhir}`;

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
      <button type="button" onclick="switchCamera()">🔄</button>
    </div>

    <button type="button" class="btn secondary" onclick="stopScanner()">Tutup Kamera</button>
  `;

  try {
    codeReader = new ZXing.BrowserMultiFormatReader();

    const devices = await codeReader.listVideoInputDevices();
    availableCameras = devices;

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
        const input = $(activeTargetInput);

        if (!input) return;

        input.value = kode;

        if (navigator.vibrate) navigator.vibrate(120);
        beep();

        const targetSaatIni = activeTargetInput;

        await stopScanner();

        if (!cekBarcodeDuplikatDiForm()) return;

        await handleBarcodeAfterScan(kode, targetSaatIni);
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

async function switchCamera() {
  if (!availableCameras.length) {
    Swal.fire("Kamera tidak ditemukan", "Tidak ada kamera lain yang bisa dipilih.", "info");
    return;
  }

  selectedCameraIndex++;

  if (selectedCameraIndex >= availableCameras.length) {
    selectedCameraIndex = 0;
  }

  const target = activeTargetInput || "kode";

  await stopScanner();
  await startScanner(target);
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

async function handleBarcodeAfterScan(kode, targetInputId) {
  if (!kode) return;

  if (targetInputId !== "kode") {
    toast("Barcode terbaca", "Silakan lanjut input.", "success");
    return;
  }

  const cached = barcodeCache.get(String(kode).trim());

  if (cached) {
    await tampilkanBarangDariGSheet(kode, targetInputId);
    return;
  }

  // Fallback: kalau cache belum kebaca, tetap cek langsung ke GSheet
  await tampilkanBarangDariGSheet(kode, targetInputId);
}

async function tampilkanBarangDariGSheet(kode, targetInputId) {
  try {
    const res = await fetch(`${API_URL}?action=getBarang&kode=${encodeURIComponent(kode)}`);
    const data = await res.json();

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

    toast("Barcode baru", "Silakan lanjut input.", "success");

  } catch (e) {
    Swal.fire("Gagal cek barcode", "Silakan lanjut input manual.", "warning");
  }
}

function toast(title, text, icon = "success") {
  Swal.fire({
    icon,
    title,
    text,
    timer: 1200,
    showConfirmButton: false
  });
}

function isiFormDariBarang(data) {
  editMode = true;
  editingRow = data.row || "";

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
  const payload = {
    action: editMode ? "updateBarang" : "addBarang",
    row: editingRow,

    nama: $("nama").value.trim().toUpperCase(),
    modal: $("modal").value.trim(),
    satuan1: $("satuan1").value.trim(),
    kode: $("kode").value.trim(),
    hargaEcer: $("hargaEcer").value.trim(),
    hargaGrosir1: $("hargaGrosir1").value.trim(),
    petugas: JSON.parse(localStorage.getItem("tay_user") || "{}").name || "",

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

function simpanDraft() {
  const data = ambilDataForm();
  data.editMode = editMode;
  data.editingRow = editingRow;
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
  editingRow = data.editingRow || "";

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

  if (
    !payload.kode ||
    !payload.nama ||
    !payload.modal ||
    !payload.satuan1 ||
    !payload.hargaEcer ||
    !payload.hargaGrosir1
  ) {
    Swal.fire(
      "Belum lengkap",
      "Kode, nama, modal, satuan terkecil, harga ecer, dan harga grosir wajib diisi.",
      "error"
    );
    return;
  }

  for (let i = 0; i < payload.multis.length; i++) {
    const m = payload.multis[i];

    if (!m.satuan && (m.harga || m.isi || m.kode)) {
  Swal.fire(
    "Satuan belum dipilih",
    `Satuan ${i + 2} wajib dipilih jika kode, harga, atau isi sudah diisi.`,
    "error"
  );
  return;
}

  if (m.satuan && (!m.harga || !m.isi)) {
  Swal.fire(
    "Belum lengkap",
    `Harga dan isi Satuan ${i + 2} wajib diisi.`,
    "error"
  );
  return;
}
  }

  if (API_URL.includes("PASTE_URL")) {
    Swal.fire("Belum tersambung", "Isi dulu API_URL di js/config.js", "warning");
    return;
  }

  try {
    Swal.fire({
      title: editMode ? "Mengupdate barang..." : "Menyimpan barang...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

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

      if (payload.kode) {
        barcodeCache.set(String(payload.kode).trim(), {
          kode: payload.kode,
          row: data.row || editingRow || "",
          nama: payload.nama
        });
      }

      $("barangForm").reset();
      $("multiWrap").innerHTML = "";
      multiCount = 1;
      editMode = false;
      editingRow = "";
      localStorage.removeItem(DRAFT_KEY);

    } else {
      Swal.fire("Gagal", data.message || "Tidak bisa menyimpan.", "error");
    }

  } catch (err) {
    Swal.close();
    Swal.fire("Error", "Gagal konek ke server.", "error");
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  const el = document.activeElement;

  if (!el || !["INPUT", "SELECT"].includes(el.tagName)) return;

  e.preventDefault();

  const fields = Array.from(
    document.querySelectorAll("input, select, button")
  ).filter(field =>
    !field.disabled &&
    field.offsetParent !== null &&
    field.type !== "button"
  );

  const index = fields.indexOf(el);

  if (index >= 0 && index < fields.length - 1) {
    fields[index + 1].focus();
  }
});