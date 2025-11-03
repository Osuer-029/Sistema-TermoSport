import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

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

// ======== INICIALIZAR ========
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ======== ELEMENTOS ========
const logoutBtn = document.getElementById("logoutBtn");
const productoForm = document.getElementById("productoForm");
const productosGrid = document.getElementById("productosGrid");
const buscador = document.getElementById("buscador");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("form-title");
const productoIdInput = document.getElementById("productoId");

let productosCache = [];

// ======== SESIÓN ========
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "index.html";
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ======== GUARDAR / EDITAR PRODUCTO ========
productoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = productoIdInput.value;
  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const costo = parseFloat(document.getElementById("costo").value);
  const stock = parseInt(document.getElementById("stock").value);
  const imagenFile = document.getElementById("imagen").files[0];

  if (!nombre || !precio || !costo || !stock) {
    alert("Completa todos los campos correctamente");
    return;
  }

  try {
    let imagenURL = "";
    if (imagenFile) {
      const storageRef = ref(storage, `productos/${Date.now()}_${imagenFile.name}`);
      await uploadBytes(storageRef, imagenFile);
      imagenURL = await getDownloadURL(storageRef);
    }

    if (id) {
      const docRef = doc(db, "productos", id);
      const oldProduct = productosCache.find(p => p.id === id);

      await updateDoc(docRef, {
        nombre, precio, costo, stock,
        imagen: imagenURL || oldProduct.imagen,
      });

      productoIdInput.value = "";
      formTitle.textContent = "Agregar producto";
      cancelEditBtn.style.display = "none";
      productoForm.reset();
    } else {
      await addDoc(collection(db, "productos"), {
        nombre, precio, costo, stock,
        imagen: imagenURL || "",
        fecha: serverTimestamp()
      });
      productoForm.reset();
    }
  } catch (error) {
    console.error("Error al guardar producto:", error);
  }
});

// ======== CANCELAR EDICIÓN ========
cancelEditBtn.addEventListener("click", () => {
  productoIdInput.value = "";
  formTitle.textContent = "Agregar producto";
  cancelEditBtn.style.display = "none";
  productoForm.reset();
});

// ======== ESCUCHAR PRODUCTOS ========
onSnapshot(collection(db, "productos"), (snapshot) => {
  productosCache = [];
  snapshot.forEach(doc => {
    productosCache.push({ id: doc.id, ...doc.data() });
  });
  mostrarProductos(productosCache);
});

// ======== MOSTRAR PRODUCTOS ========
function mostrarProductos(productos) {
  if (productos.length === 0) {
    productosGrid.innerHTML = `<p class="empty">No hay productos registrados.</p>`;
    return;
  }

  productosGrid.innerHTML = productos.map(p => `
    <div class="card">
      <img src="${p.imagen || 'https://cdn-icons-png.flaticon.com/512/679/679922.png'}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p><strong>Precio:</strong> $${p.precio.toFixed(2)}</p>
      <p><strong>Costo:</strong> $${p.costo.toFixed(2)}</p>
      <p><strong>Stock:</strong> ${p.stock}</p>
      <div class="card-actions">
        <button class="btn-edit" data-id="${p.id}">Editar</button>
        <button class="btn-delete" data-id="${p.id}" data-img="${p.imagen || ''}">Eliminar</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".btn-edit").forEach(btn =>
    btn.addEventListener("click", () => editarProducto(btn.dataset.id))
  );

  document.querySelectorAll(".btn-delete").forEach(btn =>
    btn.addEventListener("click", () => eliminarProducto(btn.dataset.id, btn.dataset.img))
  );
}

// ======== EDITAR ========
function editarProducto(id) {
  const p = productosCache.find(prod => prod.id === id);
  if (!p) return;

  document.getElementById("nombre").value = p.nombre;
  document.getElementById("precio").value = p.precio;
  document.getElementById("costo").value = p.costo;
  document.getElementById("stock").value = p.stock;
  productoIdInput.value = p.id;

  formTitle.textContent = "Editar producto";
  cancelEditBtn.style.display = "inline-block";
}

// ======== ELIMINAR ========
async function eliminarProducto(id, imgURL) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
  try {
    await deleteDoc(doc(db, "productos", id));

    if (imgURL) {
      const imgRef = ref(storage, imgURL);
      await deleteObject(imgRef).catch(() => {});
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}

// ======== BUSCADOR ========
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase().trim();
  const filtrados = productosCache.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  );
  mostrarProductos(filtrados);
});
