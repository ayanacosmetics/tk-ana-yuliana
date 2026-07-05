const satuanOptions = ["PCS","Bungkus","Pack","Renteng","Slop","Dus","Box","Bal","Lusin","Botol","Kaleng","Sachet","Kg","Gram","Liter","mL"];

let multiCount = 1;
let codeReader = null;
let currentTargetInput = null;

const $ = (id) => document.getElementById(id);

$("btnTambah").addEventListener("click", () => {
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

    <label>Harga Grosir Satuan ${multiCount}</label>
    <input name="harga${multiCount}" type="number" placeholder="Wajib jika satuan diisi">

    <label>Isi Satuan ${multiCount}</label>
    <input name="isi${multiCount}" type="number" placeholder="Wajib jika satuan diisi">
  `;

  $("multiWrap").appendChild(div);
});

$("btnScan").addEventListener("click", () => {
  startScanner("kode");
});

async function startScanner(targetInputId) {
  currentTargetInput = targetInputId;

  const reader = $("reader");
  reader.classList.remove("hidden");
  reader.innerHTML = `
    <div class="scanner-box">
      <video id="scannerVideo"></video>
      <div class="scan-line"></div>
    </div>
    <button type="button" class="btn secondary" onclick="stopScanner()">Tutup Kamera</button>
  `;

  try {
    codeReader = new ZXing.BrowserMultiFormatReader();

    const videoInputDevices = await codeReader.listVideoInputDevices();

    let selectedDeviceId = videoInputDevices[0]?.deviceId;

    const backCamera = videoInputDevices.find(device =>
      device.label.toLowerCase().includes("back") ||
      device.label.toLowerCase().includes("rear") ||
      device.label.toLowerCase().includes("environment")
    );

    if (backCamera) {
      selectedDeviceId = backCamera.deviceId;
    }

    codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      "scannerVideo",
      async (result, err) => {
        if (result) {
          const kode = result.text.trim();

          $(currentTargetInput).value = kode;

          if (navigator.vibrate) navigator.vibrate(120);
          beep();

          await stopScanner();

          if (currentTargetInput === "kode") {
            cekKode(kode);
          }

          cekBarcodeDuplikatDiForm();
        }
      }
    );

  } catch (error) {
    Swal.fire("Kamera gagal", "Izinkan akses kamera di browser HP.", "error");
    stopScanner();
  }
}

async function stopScanner() {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }

  const reader = $("reader");
  reader.classList.add("hidden");
  reader.innerHTML = "";
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
  const inputs = document.querySelectorAll('input[name^="kode"], #kode');
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

async function cekKode(kode) {
  if (!kode || API_URL.includes("PASTE_URL")) return;

  try {
    const res = await fetch(`${API_URL}?action=checkBarcode&kode=${encodeURIComponent(kode)}`);
    const data = await res.json();

    if (data.exists) {
      Swal.fire("Kode sudah ada", data.nama || "Barang sudah terdaftar", "warning");
    }
  } catch (e) {}
}

$("barangForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!cekBarcodeDuplikatDiForm()) return;

  const form = new FormData(e.target);

  const payload = {
    action: "addBarang",
    nama: form.get("nama"),
    modal: form.get("modal"),
    satuan1: form.get("satuan1"),
    kode: form.get("kode"),
    hargaEcer: form.get("hargaEcer"),
    hargaGrosir1: form.get("hargaGrosir1"),
    multis: []
  };

  for (let i = 2; i <= 7; i++) {
    const satuan = form.get(`satuan${i}`) || "";
    const kode = form.get(`kode${i}`) || "";
    const harga = form.get(`harga${i}`) || "";
    const isi = form.get(`isi${i}`) || "";

    if (satuan && (!harga || !isi)) {
      Swal.fire("Belum lengkap", `Harga dan isi Satuan ${i} wajib diisi.`, "error");
      return;
    }

    payload.multis.push({ satuan, kode, harga, isi });
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
      Swal.fire("Tersimpan", "Barang masuk ke Data Barang.", "success");
      e.target.reset();
      $("multiWrap").innerHTML = "";
      multiCount = 1;
    } else {
      Swal.fire("Gagal", data.message || "Tidak bisa menyimpan.", "error");
    }

  } catch (err) {
    Swal.close();
    Swal.fire("Error", "Gagal konek ke server.", "error");
  }
});