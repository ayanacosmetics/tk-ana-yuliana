const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbwye_jLHQ7aeb4wtq8gN-EcGTPKmRVCintLvfKC8xft7poUnWKeXNb4rtZpr81SANBk_A/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = `${MASTER_API_URL}?spreadsheetId=${encodeURIComponent(currentUser.apiUrl || "")}`;
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";
