import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ======== CONFIGURACIÓN FIREBASE ========
const firebaseConfig = {
  apiKey: "AIzaSyCKnLV__97cSphEtqg0awLYgmKxoziolM8",
  authDomain: "sistema-alberto-2-e27ef.firebaseapp.com",
  projectId: "sistema-alberto-2-e27ef",
  storageBucket: "sistema-alberto-2-e27ef.firebasestorage.app",
  messagingSenderId: "915120884721",
  appId: "1:915120884721:web:3d311447a04b881ad45250",
  measurementId: "G-CGKSVF3ZXJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== ELEMENTOS ========
const logoutBtn = document.getElementById("logoutBtn");
const clienteForm = document.getElementById("clienteForm");
const clientesGrid = document.getElementById("clientesGrid");
const buscador = document.getElementById("buscador");

let clientesCache = [];

// ======== SESIÓN ========
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======== GUARDAR CLIENTE ========
clienteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  let telefono = document.getElementById("telefono").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !telefono) {
    alert("Por favor completa todos los campos obligatorios");
    return;
  }

  // Eliminar caracteres no numéricos
  telefono = telefono.replace(/\D/g, "");

  try {
    await addDoc(collection(db, "clientes"), {
      nombre,
      telefono,
      descripcion,
      fecha: serverTimestamp()
    });

    clienteForm.reset();
  } catch (error) {
    console.error("Error al guardar cliente:", error);
  }
});

// ======== CARGAR CLIENTES ========
onSnapshot(collection(db, "clientes"), (snapshot) => {
  clientesCache = [];
  snapshot.forEach(doc => {
    clientesCache.push({ id: doc.id, ...doc.data() });
  });
  mostrarClientes(clientesCache);
});

// ======== MOSTRAR CLIENTES ========
function mostrarClientes(clientes) {
  if (clientes.length === 0) {
    clientesGrid.innerHTML = `<p class="empty">No hay clientes registrados.</p>`;
    return;
  }

  clientesGrid.innerHTML = clientes.map(c => {
    // WhatsApp: si el número no tiene +, se asume República Dominicana (+1)
    const telefonoLimpio = c.telefono.startsWith("+")
      ? c.telefono
      : `1${c.telefono}`;

    const linkWhatsapp = `https://wa.me/${telefonoLimpio}`;

    return `
      <div class="card">
        <h3>${c.nombre}</h3>
        <p><strong>Tel:</strong> 
          <a href="${linkWhatsapp}" target="_blank" class="whatsapp-link">
            ${c.telefono}
          </a>
        </p>
        <p>${c.descripcion || ""}</p>
      </div>
    `;
  }).join("");
}

// ======== BUSCADOR ========
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase().trim();
  const filtrados = clientesCache.filter(c =>
    c.nombre.toLowerCase().includes(texto) ||
    c.telefono.includes(texto)
  );
  mostrarClientes(filtrados);
});
