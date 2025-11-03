// ======== Importaciones Firebase ========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ======== Configuración de Firebase ========
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
const backBtn = document.getElementById("backBtn"); // ← agregado
const movimientoForm = document.getElementById("movimientoForm");
const movimientosTable = document.getElementById("movimientosTable");
const totalIngresosEl = document.getElementById("totalIngresos");
const totalGastosEl = document.getElementById("totalGastos");
const totalVentasEl = document.getElementById("totalVentas");
const balanceGeneralEl = document.getElementById("balanceGeneral");
const resultadoCuadre = document.getElementById("resultadoCuadre");

const cuadreVentasBtn = document.getElementById("cuadreVentasBtn");
const cuadreIngresosBtn = document.getElementById("cuadreIngresosBtn");
const cuadreGastosBtn = document.getElementById("cuadreGastosBtn");

// ======== Variables globales ========
let movimientos = [];
let facturas = [];

// ======== Verificación de sesión ========
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
});

// ======== Cerrar sesión ========
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======== Volver al inicio ========
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "inicio.html";
  });
}

// ======== Guardar Movimiento ========
movimientoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tipo = document.getElementById("tipo").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);

  if (!tipo || !descripcion || isNaN(monto)) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  try {
    await addDoc(collection(db, "movimientos"), {
      tipo,
      descripcion,
      monto,
      fecha: serverTimestamp()
    });

    alert("✅ Movimiento guardado correctamente.");
    movimientoForm.reset();
  } catch (error) {
    console.error("Error al guardar movimiento:", error);
    alert("❌ Error al guardar movimiento. Intenta de nuevo.");
  }
});

// ======== Escuchar movimientos en tiempo real ========
onSnapshot(query(collection(db, "movimientos"), orderBy("fecha", "desc")), (snapshot) => {
  movimientos = [];
  snapshot.forEach((doc) => movimientos.push({ id: doc.id, ...doc.data() }));
  renderMovimientos();
  calcularTotales();
});

// ======== Escuchar facturas (ventas) ========
onSnapshot(query(collection(db, "facturas"), orderBy("fecha", "desc")), (snapshot) => {
  facturas = [];
  snapshot.forEach((doc) => facturas.push({ id: doc.id, ...doc.data() }));
  calcularTotales();
});

// ======== Renderizar movimientos ========
function renderMovimientos() {
  if (movimientos.length === 0) {
    movimientosTable.innerHTML = `<tr><td colspan="4" class="empty">No hay movimientos</td></tr>`;
    return;
  }

  movimientosTable.innerHTML = movimientos.map((m) => {
    const fecha = m.fecha ? m.fecha.toDate().toLocaleString("es-DO") : "-";
    const color = m.tipo === "ingreso" ? "#28a745" : "#dc3545";
    return `
      <tr>
        <td style="color:${color};font-weight:bold;text-transform:capitalize;">${m.tipo}</td>
        <td>${m.descripcion}</td>
        <td>RD$ ${m.monto.toFixed(2)}</td>
        <td>${fecha}</td>
      </tr>
    `;
  }).join("");
}

// ======== Calcular totales ========
function calcularTotales() {
  const totalIngresos = movimientos.filter(m => m.tipo === "ingreso").reduce((sum, m) => sum + m.monto, 0);
  const totalGastos = movimientos.filter(m => m.tipo === "gasto").reduce((sum, m) => sum + m.monto, 0);
  const totalVentas = facturas.reduce((sum, f) => sum + (f.total || 0), 0);

  const balance = (totalIngresos + totalVentas) - totalGastos;

  totalIngresosEl.textContent = totalIngresos.toFixed(2);
  totalGastosEl.textContent = totalGastos.toFixed(2);
  totalVentasEl.textContent = totalVentas.toFixed(2);
  balanceGeneralEl.textContent = balance.toFixed(2);
}

// ======== Cuadres por módulo ========
cuadreVentasBtn.addEventListener("click", () => {
  const total = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
  resultadoCuadre.innerHTML = `
    <strong>Cuadre de Ventas:</strong> RD$ ${total.toFixed(2)}
    <br><button class="btn-primary" id="descargarVentasPDF">Descargar PDF</button>
  `;
  document.getElementById("descargarVentasPDF").addEventListener("click", () => generarPDF("ventas", total));
});

cuadreIngresosBtn.addEventListener("click", () => {
  const total = movimientos.filter(m => m.tipo === "ingreso").reduce((sum, m) => sum + m.monto, 0);
  resultadoCuadre.innerHTML = `
    <strong>Cuadre de Ingresos:</strong> RD$ ${total.toFixed(2)}
    <br><button class="btn-primary" id="descargarIngresosPDF">Descargar PDF</button>
  `;
  document.getElementById("descargarIngresosPDF").addEventListener("click", () => generarPDF("ingresos", total));
});

cuadreGastosBtn.addEventListener("click", () => {
  const total = movimientos.filter(m => m.tipo === "gasto").reduce((sum, m) => sum + m.monto, 0);
  resultadoCuadre.innerHTML = `
    <strong>Cuadre de Gastos:</strong> RD$ ${total.toFixed(2)}
    <br><button class="btn-primary" id="descargarGastosPDF">Descargar PDF</button>
  `;
  document.getElementById("descargarGastosPDF").addEventListener("click", () => generarPDF("gastos", total));
});

// ======== Generar PDF tipo Ticket ========
function generarPDF(tipo, total) {
  const { jsPDF } = window.jspdf; // ← se usa desde el objeto global
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 200]
  });

  const fecha = new Date().toLocaleString("es-DO");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TermoSport", 40, 10, { align: "center" });
  doc.setFontSize(10);
  doc.text("Santo Domingo, R.D.", 40, 15, { align: "center" });
  doc.text("Tel: 809-000-0000", 40, 19, { align: "center" });
  doc.line(5, 22, 75, 22);

  doc.setFontSize(12);
  doc.text(`REPORTE DE ${tipo.toUpperCase()}`, 40, 28, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 5, 33);
  doc.line(5, 35, 75, 35);

  let y = 40;
  doc.setFont("helvetica", "normal");

  if (tipo === "ventas") {
    facturas.forEach(f => {
      const line = `${f.cliente || "Cliente"} - RD$${(f.total || 0).toFixed(2)}`;
      doc.text(line, 5, y);
      y += 5;
    });
  } else {
    const lista = movimientos.filter(m => m.tipo === tipo);
    lista.forEach(m => {
      const line = `${m.descripcion} - RD$${m.monto.toFixed(2)}`;
      doc.text(line, 5, y);
      y += 5;
    });
  }

  doc.line(5, y, 75, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: RD$ ${total.toFixed(2)}`, 40, y, { align: "center" });
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.text("Gracias por usar TermoSport", 40, y, { align: "center" });

  doc.save(`cuadre_${tipo}.pdf`);
}
