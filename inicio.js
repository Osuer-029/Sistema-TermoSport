import { auth } from "../firebaseConfig.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ====== Elementos del DOM ======
const logoutBtn = document.getElementById("logoutBtn");
const cards = document.querySelectorAll(".card");

// ====== Verificar sesión activa ======
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html"; // si no hay sesión, volver al login
  }
});

// ====== Cerrar sesión ======
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ====== Manejar clics de las tarjetas ======
const moduleMap = {
  facturacion: "facturacion.html",
  productos: "productos.html",
  clientes: "clientes.html",
  cuadre: "cuadre.html",
  configuracion: "configuracion.html"
};

// Efecto de transición + carga directa del módulo
cards.forEach(card => {
  card.addEventListener("click", () => {
    const module = card.dataset.module;
    const destino = moduleMap[module];

    if (!destino) return alert(`Módulo "${module}" no disponible aún.`);

    // Evita múltiples clics
    card.style.pointerEvents = "none";

    // Animación de salida (fade)
    document.body.classList.add("fade-out");

    setTimeout(() => {
      window.location.href = destino;
    }, 300); // espera un poco para el efecto
  });
});

// ====== Animación CSS ======
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("fade-in");
});
