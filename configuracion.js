// ======== Importaciones Firebase ========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ======== Configuración Firebase ========
const firebaseConfig = {
  apiKey: "AIzaSyCKnLV__97cSphEtqg0awLYgmKxoziolM8",
  authDomain: "sistema-alberto-2-e27ef.firebaseapp.com",
  projectId: "sistema-alberto-2-e27ef",
  storageBucket: "sistema-alberto-2-e27ef.firebasestorage.app",
  messagingSenderId: "915120884721",
  appId: "1:915120884721:web:3d311447a04b881ad45250",
  measurementId: "G-CGKSVF3ZXJ"
};

// ======== Inicialización ========
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== Elementos del DOM ========
const logoutBtn = document.getElementById("logoutBtn");
const volverBtn = document.getElementById("volverBtn");
const negocioForm = document.getElementById("negocioForm");
const passwordForm = document.getElementById("passwordForm");
const generarTokenBtn = document.getElementById("generarTokenBtn");
const tokenInput = document.getElementById("tokenInput");

const nombreNegocio = document.getElementById("nombreNegocio");
const telefonoNegocio = document.getElementById("telefonoNegocio");
const direccionNegocio = document.getElementById("direccionNegocio");

// ======== Verificar sesión ========
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  cargarConfiguracion();
});

// ======== Cerrar sesión ========
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======== Volver al inicio ========
volverBtn.addEventListener("click", () => {
  window.location.href = "inicio.html";
});

// ======== Cargar configuración ========
async function cargarConfiguracion() {
  const docRef = doc(db, "configuracion", "datos");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    nombreNegocio.value = data.nombre || "";
    telefonoNegocio.value = data.telefono || "";
    direccionNegocio.value = data.direccion || "";
    tokenInput.value = data.token || "";
  }
}

// ======== Guardar datos del negocio ========
negocioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await setDoc(doc(db, "configuracion", "datos"), {
    nombre: nombreNegocio.value,
    telefono: telefonoNegocio.value,
    direccion: direccionNegocio.value,
    token: tokenInput.value || ""
  });

  alert("Configuración guardada correctamente ✅");
});

// ======== Actualizar contraseña con reautenticación segura ========
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  const currentPass = document.getElementById("actualPassword").value.trim();
  const newPass = document.getElementById("nuevaPassword").value.trim();

  if (!currentPass || !newPass) {
    alert("Debes completar ambos campos.");
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPass);

    // 🔐 Reautenticar usuario antes de cambiar la contraseña
    await reauthenticateWithCredential(user, credential);

    // ✅ Actualizar la contraseña
    await updatePassword(user, newPass);

    alert("Contraseña actualizada correctamente ✅");
    passwordForm.reset();
  } catch (error) {
    if (error.code === "auth/wrong-password") {
      alert("La contraseña actual es incorrecta ❌");
    } else if (error.code === "auth/weak-password") {
      alert("La nueva contraseña es demasiado débil. Usa una más segura 🔒");
    } else {
      console.error(error);
      alert("Error al actualizar la contraseña: " + error.message);
    }
  }
});

// ======== Generar nuevo token ========
generarTokenBtn.addEventListener("click", async () => {
  const nuevoToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  tokenInput.value = nuevoToken;

  await setDoc(doc(db, "configuracion", "datos"), {
    nombre: nombreNegocio.value,
    telefono: telefonoNegocio.value,
    direccion: direccionNegocio.value,
    token: nuevoToken
  });

  alert("Nuevo token generado y guardado ✅");
});
