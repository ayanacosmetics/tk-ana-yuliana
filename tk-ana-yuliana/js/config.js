const currentUser = JSON.parse(localStorage.getItem("tay_user") || "{}");

const currentToko = TOKO[currentUser.toko] || TOKO.ana;

const API_URL = currentToko.api;
const NAMA_TOKO = currentToko.nama;