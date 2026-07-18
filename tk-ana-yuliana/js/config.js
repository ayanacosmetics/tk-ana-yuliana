const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbwI7cFKNr_0qbiz4vzSlx4cl9XHKdWFPhWj8uEPEFypj7l5Qb6FLcfj0KCMFksK2s1Meg/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = `${MASTER_API_URL}?spreadsheetId=${encodeURIComponent(currentUser.apiUrl || "")}`;
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";
