const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbyEA0GjpwfcvM1YxIFDLBZLqcM0weO0zEvv5xAuBkOVJD15OLNxP6cAnsf8RozhdBhHxQ/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = `${MASTER_API_URL}?spreadsheetId=${encodeURIComponent(currentUser.apiUrl || "")}`;
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";
