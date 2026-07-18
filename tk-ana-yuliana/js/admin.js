requireLogin();

const user = getCurrentUser();

if (user.role !== "admin") {

Swal.fire(
"Akses Ditolak",
"Hanya Admin yang boleh membuka Panel Admin.",
"error"
).then(()=>{
location.href="index.html";
});

}

const isSuperAdmin = !user.toko || user.toko.trim() === "";

document.getElementById("menuAkun").addEventListener("click", loadAkun);
document.getElementById("menuToko").addEventListener("click", loadToko);

if (isSuperAdmin) {
  document.getElementById("menuRole").addEventListener("click", loadRole);
} else {
  document.getElementById("menuRole").style.display = "none";
}
