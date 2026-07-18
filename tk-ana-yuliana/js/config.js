const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbybD_7OmDMAphiNdN9VEHFdvbYw1lM1Ah_mdphawlvqGBfx2HUFGG215uwrfNS8Kvog-w/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = `${MASTER_API_URL}?spreadsheetId=${encodeURIComponent(currentUser.apiUrl || "")}`;
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";
