const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbz2SUIQp9BcV5YYtcVtxboDhKXBZkESr3wT33hIsy6BYWXgTnTz5vwG4zlil3ockrWN2Q/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = `${MASTER_API_URL}?spreadsheetId=${encodeURIComponent(currentUser.apiUrl || "")}`;
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";
