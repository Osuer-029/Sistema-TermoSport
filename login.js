// login.js - lógica de login / registro + token inteligente conectado a Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* ========= FIREBASE CONFIG ========= */
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

/* ========= DOM ========= */
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const goRegister = document.getElementById("goRegister");
const goLogin = document.getElementById("goLogin");

const tokenGroup = document.getElementById("tokenGroup");
const pasteBtn = document.getElementById("pasteTokenBtn");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginToken = document.getElementById("loginToken");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

/* ========= Helpers ========= */
function showForm(which) {
  document.querySelectorAll(".form").forEach(f => f.classList.remove("active"));
  document.getElementById(which).classList.add("active");
  tokenGroup.classList.add("hidden"); // reset token visibility
}

function isTokenVerifiedLocal() {
  return localStorage.getItem("tokenVerified") === "true";
}

/* ===== Show/Hide Forms ===== */
goRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showForm("registerForm");
});
goLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showForm("loginForm");
});

/* ===== Paste token from clipboard ===== */
pasteBtn?.addEventListener("click", async () => {
  try {
    const txt = await navigator.clipboard.readText();
    if (txt) loginToken.value = txt.trim();
  } catch (err) {
    alert("No se pudo leer el portapapeles. Pega manualmente el token.");
  }
});

/* ===== Verificar sesión activa ===== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "inicio.html";
  }
});

/* ===== Token fetcher - Firestore ===== */
async function fetchTokenFromConfig() {
  try {
    const docRef = doc(db, "configuracion", "datos");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data || !data.token) return null;
    return String(data.token).toUpperCase();
  } catch (err) {
    console.error("Error leyendo token en Firestore:", err);
    return null;
  }
}

/* ===== REGISTER - No token required ===== */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = registerEmail.value.trim();
  const pwd = registerPassword.value.trim();
  if (!email || !pwd) return alert("Completa todos los campos.");

  try {
    await createUserWithEmailAndPassword(auth, email, pwd);
    localStorage.setItem("tokenVerified", "true");
    alert("Registro correcto. Bienvenido.");
    window.location.href = "inicio.html";
  } catch (err) {
    console.error("Error al registrar:", err);
    alert("Error al registrar: " + (err.message || err));
  }
});

/* ===== LOGIN - Token inteligente ===== */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const pwd = loginPassword.value.trim();

  if (!email || !pwd) return alert("Completa todos los campos.");

  try {
    // Si navegador ya verificado
    if (isTokenVerifiedLocal()) {
      await signInWithEmailAndPassword(auth, email, pwd);
      window.location.href = "inicio.html";
      return;
    }

    // Traer token desde Firestore
    const tokenValido = await fetchTokenFromConfig();

    if (!tokenValido) {
      // No hay token configurado, permitir login
      await signInWithEmailAndPassword(auth, email, pwd);
      localStorage.setItem("tokenVerified", "true");
      window.location.href = "inicio.html";
      return;
    }

    // Token existe -> mostrar sección de token
    tokenGroup.classList.remove("hidden");

    const tokenIngresado = loginToken.value.trim().toUpperCase();
    if (!tokenIngresado) {
      alert("Debes introducir el token de seguridad para este navegador.");
      return;
    }

    if (tokenIngresado !== tokenValido) {
      alert("Token incorrecto. Acceso denegado.");
      return;
    }

    // Token correcto -> marcar navegador y login
    localStorage.setItem("tokenVerified", "true");
    await signInWithEmailAndPassword(auth, email, pwd);
    window.location.href = "inicio.html";

  } catch (err) {
    console.error("Login error:", err);
    if (err.code && err.code.startsWith("auth/")) {
      alert("Error de autenticación: " + err.message);
    } else {
      alert("Error: " + (err.message || err));
    }
  }
});
