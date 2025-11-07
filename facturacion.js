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
const tablaProductos = document.getElementById("tablaCarrito");

const totalFacturaEl = document.getElementById("totalFactura");
const facturaForm = document.getElementById("facturaForm");
const facturasTable = document.getElementById("facturasTable");

// === NUEVOS ELEMENTOS ===
const tipoVentaSelect = document.getElementById("tipoVenta"); // 🔹 Venta normal o por mayor
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
const clientesList = document.getElementById("clientesList");

onSnapshot(collection(db, "clientes"), (snapshot) => {
  clientesList.innerHTML = "";
  snapshot.forEach(doc => {
    const c = doc.data();
    const option = document.createElement("option");
    option.value = c.nombre;
    clientesList.appendChild(option);
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
  const tipoVenta = tipoVentaSelect.value; // 🔹 Normal o por mayor

  if (!idProducto || cantidad <= 0) return alert("Selecciona un producto y una cantidad válida.");

  const producto = productosCache.find(p => p.id === idProducto);
  if (!producto) return;

  // 🔹 Determinar el precio según el tipo de venta
  const precioUsado = tipoVenta === "mayor" ? parseFloat(producto.porMayor || producto.precio) : parseFloat(producto.precio);

  const existente = carrito.find(p => p.id === idProducto);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      id: idProducto,
      nombre: producto.nombre,
      precio: producto.precio,
      porMayor: producto.porMayor || 0,
      costo: producto.costo || 0,
      precioUsado,
      cantidad
    });
  }

  renderCarrito();
});

// ======== RENDERIZAR CARRITO ========
// ======== RENDERIZAR CARRITO (ACTUALIZADA) ========
function renderCarrito() {
  tablaProductos.innerHTML = "";
  let total = 0;

  carrito.forEach((p, index) => {
    // Recalcula el subtotal en caso de que el precioUsado haya sido editado
    const subtotal = p.precioUsado * p.cantidad;
    total += subtotal;

    // Creamos la fila y celdas
    const fila = document.createElement("tr");

    // Columna de Producto y Cantidad
    fila.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.cantidad}</td>
    `;

    // Columna de Precio (¡EDITABLE!)
    const celdaPrecio = document.createElement("td");
    const inputPrecio = document.createElement("input");
    inputPrecio.type = "number";
    inputPrecio.min = "0.01";
    inputPrecio.step = "0.01";
    // Mostramos el precio actual del carrito (que fue determinado por tipoVenta o por edición anterior)
    inputPrecio.value = p.precioUsado.toFixed(2);
    inputPrecio.classList.add('input-precio-editable'); // Para aplicar estilos
    inputPrecio.dataset.index = index; // Para saber qué producto editar
    
    // 🚨 Evento de edición de precio 🚨
    inputPrecio.addEventListener('change', (e) => {
      const nuevoPrecio = parseFloat(e.target.value);
      if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert("El precio debe ser un número positivo.");
        e.target.value = p.precioUsado.toFixed(2); // Vuelve al valor anterior si es inválido
        return;
      }
      // Actualiza el precio en el carrito y vuelve a renderizar para actualizar subtotales y total
      carrito[index].precioUsado = nuevoPrecio;
      renderCarrito(); 
    });
    celdaPrecio.appendChild(inputPrecio);
    fila.appendChild(celdaPrecio);


    // Columna de Subtotal y Eliminar
    const celdaSubtotal = document.createElement("td");
    celdaSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    fila.appendChild(celdaSubtotal);
    
    const celdaEliminar = document.createElement("td");
    const btnDelete = document.createElement("button");
    btnDelete.classList.add("btn-delete");
    btnDelete.dataset.index = index;
    btnDelete.textContent = "X";
    btnDelete.addEventListener("click", () => {
      carrito.splice(index, 1); // Usamos el índice de la función forEach
      renderCarrito();
    });
    celdaEliminar.appendChild(btnDelete);
    fila.appendChild(celdaEliminar);
    
    tablaProductos.appendChild(fila);
  });

  totalFacturaEl.textContent = total.toFixed(2);
}

// Nota: Eliminé el código duplicado de la asignación de evento a ".btn-delete" 
// que estaba al final de la función original, ahora se hace en cada iteración.

// ======== GUARDAR FACTURA ========
facturaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const clienteNombre = clienteSelect.value.trim();
  const tipoVenta = tipoVentaSelect.value;

  if (!clienteNombre) return alert("Escribe o selecciona un cliente.");
  if (carrito.length === 0) return alert("Agrega al menos un producto.");
  if (!tipoVenta) return alert("Selecciona el tipo de venta.");

  const total = parseFloat(totalFacturaEl.textContent);

  try {
    await addDoc(collection(db, "facturas"), {
      cliente: clienteNombre,
      tipoVenta,
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
    alert("Error al guardar la factura. Revisa la consola.");
  }
});

// ======== FILTRAR FACTURAS ========
fechaFiltro.addEventListener("change", cargarFacturasFiltradas);
buscarFactura.addEventListener("input", cargarFacturasFiltradas);

import { Timestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

async function cargarFacturasFiltradas() {
  const fechaSeleccionada = fechaFiltro.value;
  const textoBuscar = buscarFactura.value.toLowerCase();

  if (!fechaSeleccionada) return;

  // Convertimos las fechas a Timestamp (🔥 clave)
  const inicio = Timestamp.fromDate(new Date(fechaSeleccionada + "T00:00:00"));
  const fin = Timestamp.fromDate(new Date(fechaSeleccionada + "T23:59:59"));

  const q = query(
    collection(db, "facturas"),
    where("fecha", ">=", inicio),
    where("fecha", "<=", fin),
    orderBy("fecha", "desc")
  );

  const snap = await getDocs(q);
  facturasTable.innerHTML = "";

  if (snap.empty) {
    facturasTable.innerHTML = `<tr><td colspan="5" class="empty">No hay facturas en esta fecha</td></tr>`;
    return;
  }

  snap.forEach((doc) => {
    const f = doc.data();
    const cliente = (f.cliente || "").toLowerCase();

    const productosHTML = Array.isArray(f.productos)
      ? f.productos.map(p => `${p.nombre} (${p.cantidad})`).join(", ")
      : "Sin productos";

    const fecha = f.fecha && f.fecha.toDate ? f.fecha.toDate().toLocaleDateString("es-ES") : "N/A";

    if (textoBuscar && !cliente.includes(textoBuscar) && !productosHTML.toLowerCase().includes(textoBuscar)) return;

    facturasTable.innerHTML += `
      <tr>
        <td>${f.cliente}</td>
        <td>${f.tipoVenta || "Normal"}</td> 
        <td>${productosHTML}</td>
        <td>$${f.total?.toFixed(2) || "0.00"}</td>
        <td>${fecha}</td>
      </tr>
    `;
  });

  if (facturasTable.innerHTML.trim() === "")
    facturasTable.innerHTML = `<tr><td colspan="5" class="empty">No hay coincidencias.</td></tr>`;
}

