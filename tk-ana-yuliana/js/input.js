const satuanOptions = [
  "PCS","Bungkus","Pack","Renteng","Slop","Dus","Box","Bal",
  "Lusin","Botol","Kaleng","Sachet","Kg","Gram","Liter","mL"
];

const MAX_SATUAN = 4;

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
  $("kode").addEventListener("change", async function () {
    const kode = this.value.trim();
    if (!kode) return;

    if (!cekBarcodeDuplikatDiForm()) return;

    await tampilkanBarangDariGSheet(kode, "kode");
    simpanDraft();
  });
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
  if (multiCount >= MAX_SATUAN) {
    Swal.fire("Maksimal", "Satuan maksimal sampai Satuan 4", "info");
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

    <label id="labelIsi${multiCount}">Isi Satuan ${multiCount}</label>
        <input
            name="isi${multiCount}"
            type="number"
            value="${data.isi || ""}"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            placeholder="Pilih satuan dulu">

    <label id="labelKode${multiCount}">Kode Barang Satuan ${multiCount} (opsional)</label>
    <div class="scan-row">
      <input
          id="kode${multiCount}"
          name="kode${multiCount}"
          value="${data.kode || ""}"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          placeholder="Pilih satuan dulu">
      
      <button type="button" class="btn-scan-mini" onclick="startScanner('kode${multiCount}')">📷</button>
    </div>

    <div id="reader-kode${multiCount}" class="reader hidden"></div>

    <div class="grosir-box grosir-1">
      <label id="labelHarga1_${multiCount}">Harga Grosir 1</label>
      <input
          name="harga1_${multiCount}"
          type="number"
          value="${data.harga1 || data.harga || ""}"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          placeholder="Pilih satuan dulu">
    </div>

    <div id="wrapHarga2_${multiCount}" class="grosir-box grosir-2" style="${data.harga2 ? "" : "display:none"}">
      <label id="labelHarga2_${multiCount}">Harga Grosir 2</label>
      <input
          name="harga2_${multiCount}"
          type="number"
          value="${data.harga2 || ""}"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          placeholder="Opsional">
    </div>

    <div id="wrapHarga3_${multiCount}" class="grosir-box grosir-3" style="${data.harga3 ? "" : "display:none"}">
      <label id="labelHarga3_${multiCount}">Harga Grosir 3</label>
      <input
          name="harga3_${multiCount}"
          type="number"
          value="${data.harga3 || ""}"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          placeholder="Opsional">
    </div>

    <div class="grosir-actions">
      <button type="button" class="btn secondary btn-grosir-mini" onclick="tambahHargaGrosir(${multiCount})">
        + Tambah Harga Grosir
      </button>

      <button type="button" class="btn-cancel-mini" onclick="tutupHargaGrosirTerakhir(${multiCount})">
        ×
      </button>
    </div>
    
    
  `;

  $("multiWrap").appendChild(div);
  updateLabelSatuan(multiCount);
}

function tambahHargaGrosir(no) {
  const wrap2 = document.getElementById(`wrapHarga2_${no}`);
  const wrap3 = document.getElementById(`wrapHarga3_${no}`);

  if (wrap2 && wrap2.style.display === "none") {
    wrap2.style.display = "";
    return;
  }

  if (wrap3 && wrap3.style.display === "none") {
    wrap3.style.display = "";
    return;
  }

  Swal.fire("Maksimal", "Harga grosir maksimal sampai 3.", "info");
}

function tutupHargaGrosir(no, level) {
  const wrap = document.getElementById(`wrapHarga${level}_${no}`);
  const input = document.querySelector(`[name="harga${level}_${no}"]`);

  if (input) input.value = "";
  if (wrap) wrap.style.display = "none";

  simpanDraft();
}

function tutupHargaGrosirTerakhir(no) {
  const wrap3 = document.getElementById(`wrapHarga3_${no}`);
  const input3 = document.querySelector(`[name="harga3_${no}"]`);

  if (wrap3 && wrap3.style.display !== "none") {
    if (input3) input3.value = "";
    wrap3.style.display = "none";
    simpanDraft();
    return;
  }

  const wrap2 = document.getElementById(`wrapHarga2_${no}`);
  const input2 = document.querySelector(`[name="harga2_${no}"]`);

  if (wrap2 && wrap2.style.display !== "none") {
    if (input2) input2.value = "";
    wrap2.style.display = "none";
    simpanDraft();
  }
}

function getSatuanSebelumnya(no) {
  if (no === 2) {
    return $("satuan1")?.value || "satuan terkecil";
  }

  return document.querySelector(`[name="satuan${no - 1}"]`)?.value || `Satuan ${no - 1}`;
}

function updateJudulSemuaSatuan() {
  for (let i = 2; i <= MAX_SATUAN; i++) {
    const judul = document.getElementById(`judulSatuan${i}`);
    if (judul) {
      judul.textContent = `Masukkan satuan setelah ${getSatuanSebelumnya(i)}`;
    }
  }
}

function updateLabelSatuan(no) {
  const satuan = document.querySelector(`[name="satuan${no}"]`)?.value || "";

  const labelKode = document.getElementById(`labelKode${no}`);
  const labelHarga1 = document.getElementById(`labelHarga1_${no}`);
  const labelHarga2 = document.getElementById(`labelHarga2_${no}`);
  const labelHarga3 = document.getElementById(`labelHarga3_${no}`);
  const labelIsi = document.getElementById(`labelIsi${no}`);

  const inputKode = document.querySelector(`[name="kode${no}"]`);
  const inputHarga1 = document.querySelector(`[name="harga1_${no}"]`);
  const inputHarga2 = document.querySelector(`[name="harga2_${no}"]`);
  const inputHarga3 = document.querySelector(`[name="harga3_${no}"]`);
  const inputIsi = document.querySelector(`[name="isi${no}"]`);

  if (!satuan) {
    if (labelKode) labelKode.textContent = "Kode Barang";
    if (labelHarga1) labelHarga1.textContent = "Harga Grosir 1";
    if (labelHarga2) labelHarga2.textContent = "Harga Grosir 2";
    if (labelHarga3) labelHarga3.textContent = "Harga Grosir 3";
    if (labelIsi) labelIsi.textContent = "Isi";

    if (inputKode) inputKode.placeholder = "Pilih satuan dulu";
    if (inputHarga1) inputHarga1.placeholder = "Pilih satuan dulu";
    if (inputHarga2) inputHarga2.placeholder = "Opsional";
    if (inputHarga3) inputHarga3.placeholder = "Opsional";
    if (inputIsi) inputIsi.placeholder = "Pilih satuan dulu";
    return;
  }

  if (labelKode) labelKode.textContent = `Kode Barang ${satuan} (opsional)`;
  if (labelHarga1) labelHarga1.textContent = `Harga Grosir 1 per ${satuan}`;
  if (labelHarga2) labelHarga2.textContent = `Harga Grosir 2 per ${satuan}`;
  if (labelHarga3) labelHarga3.textContent = `Harga Grosir 3 per ${satuan}`;
  if (labelIsi) labelIsi.textContent = `Isi ${satuan}`;

  if (inputKode) inputKode.placeholder = `Scan/ketik barcode ${satuan}`;
  if (inputHarga1) inputHarga1.placeholder = `Harga Grosir 1 per ${satuan}`;
  if (inputHarga2) inputHarga2.placeholder = `Harga Grosir 2 per ${satuan}`;
  if (inputHarga3) inputHarga3.placeholder = `Harga Grosir 3 per ${satuan}`;
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
    console.log("API:", API_URL);
    console.log("Kode:", kode);

    const res = await fetch(`${API_URL}?action=getBarang&kode=${encodeURIComponent(kode)}`);

    console.log("Status:", res.status);

    const text = await res.text();
    console.log("Response:", text);

    const data = JSON.parse(text);

    if (data.exists) {
      // isi lama
    } else {
      toast("Barcode baru", "Silakan lanjut input.", "success");
    }

  } catch (e) {
    console.error(e);

    Swal.fire(
      "Gagal cek barcode",
      e.message,
      "error"
    );
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
      if (m.satuan || m.kode || m.harga1 || m.harga2 || m.harga3 || m.isi) {
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

  for (let i = 2; i <= MAX_SATUAN; i++) {
    payload.multis.push({
      satuan: document.querySelector(`[name="satuan${i}"]`)?.value.trim() || "",
      isi: document.querySelector(`[name="isi${i}"]`)?.value.trim() || "",
      kode: document.querySelector(`[name="kode${i}"]`)?.value.trim() || "",
      harga1: document.querySelector(`[name="harga1_${i}"]`)?.value.trim() || "",
      harga2: document.querySelector(`[name="harga2_${i}"]`)?.value.trim() || "",
      harga3: document.querySelector(`[name="harga3_${i}"]`)?.value.trim() || ""
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
      if (m.satuan || m.kode || m.harga1 || m.harga2 || m.harga3 || m.isi) {
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

    if (!m.satuan && (m.harga1 || m.harga2 || m.harga3 || m.isi || m.kode)) {
      Swal.fire(
        "Satuan belum dipilih",
        `Satuan ${i + 2} wajib dipilih jika kode, harga, atau isi sudah diisi.`,
        "error"
      );
      return;
    }

    if (m.satuan && (!m.harga1 || !m.isi)) {
      Swal.fire(
        "Belum lengkap",
        `Harga Grosir 1 dan isi Satuan ${i + 2} wajib diisi.`,
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
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log(text);

    const data = JSON.parse(text);
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