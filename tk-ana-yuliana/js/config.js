const MASTER_API_URL = "https://script.google.com/macros/s/AKfycbxS1DjQQ8e0VqR0f7z73IHCm6OBVrb1mZ6fT3kiEiw8QFZj74RckxlCjib1lwIIp46Rtg/exec";

function getActiveUser() {
  return JSON.parse(localStorage.getItem("tay_user") || "{}");
}

const currentUser = getActiveUser();

const API_URL = currentUser.apiUrl || "";
const NAMA_TOKO = currentUser.tokoNama || "Inventory Engine";
const LOGO_TOKO = currentUser.logo || "";