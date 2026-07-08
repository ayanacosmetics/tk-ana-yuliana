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