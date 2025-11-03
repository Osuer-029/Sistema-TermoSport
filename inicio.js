// inicio.js - Configuración de Firebase integrada
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ====== CONFIGURACIÓN FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyCKnLV__97cSphEtqg0awLYgmKxoziolM8",
  authDomain: "sistema-alberto-2-e27ef.firebaseapp.com",
  projectId: "sistema-alberto-2-e27ef",
  storageBucket: "sistema-alberto-2-e27ef.firebasestorage.app",
  messagingSenderId: "915120884721",
  appId: "1:915120884721:web:3d311447a04b881ad45250",
  measurementId: "G-CGKSVF3ZXJ"
};

// ====== Inicialización ======
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
