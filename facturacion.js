// ======== IMPORTACIONES FIREBASE ========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ======== CONFIG FIREBASE ========
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
const clienteSelect = document.getElementById("clienteSelect");
const productoSelect = document.getElementById("productoSelect");
const cantidadInput = document.getElementById("cantidad");
const agregarProductoBtn = document.getElementById("agregarProductoBtn");
const tablaProductos = document.querySelector("#tablaProductos tbody");
const totalFacturaEl = document.getElementById("totalFactura");
const facturaForm = document.getElementById("facturaForm");
const facturasTable = document.getElementById("facturasTable");

// === NUEVOS ELEMENTOS DE FILTRO ===
const fechaFiltro = document.getElementById("fechaFiltro");
const buscarFactura = document.getElementById("buscarFactura");

let carrito = [];
let productosCache = [];

// ======== SESIÓN ========
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
  else {
    const hoy = new Date();
    fechaFiltro.value = hoy.toISOString().split("T")[0];
    cargarFacturasFiltradas();
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======== CARGAR CLIENTES ========
onSnapshot(collection(db, "clientes"), (snapshot) => {
  clienteSelect.innerHTML = `<option value="">Seleccionar cliente...</option>`;
  snapshot.forEach(doc => {
    const c = doc.data();
    clienteSelect.innerHTML += `<option value="${doc.id}">${c.nombre}</option>`;
  });
});

// ======== CARGAR PRODUCTOS ========
onSnapshot(collection(db, "productos"), (snapshot) => {
  productosCache = [];
  productoSelect.innerHTML = `<option value="">Seleccionar producto...</option>`;
  snapshot.forEach(doc => {
    const p = { id: doc.id, ...doc.data() };
    productosCache.push(p);
    productoSelect.innerHTML += `<option value="${p.id}">${p.nombre} - $${p.precio}</option>`;
  });
});

// ======== AGREGAR PRODUCTO AL CARRITO ========
agregarProductoBtn.addEventListener("click", () => {
  const idProducto = productoSelect.value;
  const cantidad = parseInt(cantidadInput.value);

  if (!idProducto || cantidad <= 0) return alert("Selecciona un producto y una cantidad válida.");

  const producto = productosCache.find(p => p.id === idProducto);
  if (!producto) return;

  const existente = carrito.find(p => p.id === idProducto);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ id: idProducto, nombre: producto.nombre, precio: producto.precio, cantidad });
  }

  renderCarrito();
});

// ======== RENDERIZAR CARRITO ========
function renderCarrito() {
  tablaProductos.innerHTML = "";
  let total = 0;

  carrito.forEach((p, index) => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;

    tablaProductos.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio.toFixed(2)}</td>
        <td>$${subtotal.toFixed(2)}</td>
        <td><button class="btn-delete" data-index="${index}">X</button></td>
      </tr>
    `;
  });

  totalFacturaEl.textContent = total.toFixed(2);

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      carrito.splice(btn.dataset.index, 1);
      renderCarrito();
    });
  });
}

// ======== GUARDAR FACTURA ========
facturaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clienteId = clienteSelect.value;
  if (!clienteId) return alert("Selecciona un cliente.");
  if (carrito.length === 0) return alert("Agrega al menos un producto.");

  const cliente = clienteSelect.options[clienteSelect.selectedIndex].text;
  const total = parseFloat(totalFacturaEl.textContent);

  try {
    await addDoc(collection(db, "facturas"), {
      cliente,
      productos: carrito,
      total,
      fecha: serverTimestamp()
    });

    carrito = [];
    renderCarrito();
    facturaForm.reset();
    totalFacturaEl.textContent = "0.00";
    cargarFacturasFiltradas();
  } catch (err) {
    console.error("Error al guardar factura:", err);
  }
});

// ======== FILTRAR FACTURAS ========
fechaFiltro.addEventListener("change", cargarFacturasFiltradas);
buscarFactura.addEventListener("input", cargarFacturasFiltradas);

async function cargarFacturasFiltradas() {
  const fechaSeleccionada = fechaFiltro.value;
  const textoBuscar = buscarFactura.value.toLowerCase();

  if (!fechaSeleccionada) return;

  const inicio = new Date(fechaSeleccionada + "T00:00:00");
  const fin = new Date(fechaSeleccionada + "T23:59:59");

  const q = query(
    collection(db, "facturas"),
    where("fecha", ">=", inicio),
    where("fecha", "<=", fin),
    orderBy("fecha", "desc")
  );

  const snap = await getDocs(q);
  facturasTable.innerHTML = "";

  if (snap.empty) {
    facturasTable.innerHTML = `<tr><td colspan="4" class="empty">No hay facturas registradas en esta fecha</td></tr>`;
    return;
  }

  snap.forEach((doc) => {
    const f = doc.data();
    const cliente = (f.cliente || "").toLowerCase();
    const productosHTML = f.productos.map(p => `${p.nombre} (${p.cantidad})`).join(", ");
    const fecha = f.fecha ? f.fecha.toDate().toLocaleDateString("es-ES") : "-";

    if (textoBuscar && !cliente.includes(textoBuscar) && !productosHTML.toLowerCase().includes(textoBuscar)) return;

    facturasTable.innerHTML += `
      <tr>
        <td>${f.cliente}</td>
        <td>${productosHTML}</td>
        <td>$${f.total.toFixed(2)}</td>
        <td>${fecha}</td>
      </tr>
    `;
  });

  if (facturasTable.innerHTML.trim() === "")
    facturasTable.innerHTML = `<tr><td colspan="4" class="empty">No hay coincidencias con la búsqueda.</td></tr>`;
}
