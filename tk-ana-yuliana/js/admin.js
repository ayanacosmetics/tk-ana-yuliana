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

document.getElementById("menuAkun").addEventListener("click", loadAkun);
document.getElementById("menuToko").addEventListener("click", loadToko);
document.getElementById("menuRole").addEventListener("click", loadRole);