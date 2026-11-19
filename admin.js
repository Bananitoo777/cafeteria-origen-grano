const API_URL = "https://6aff04223a0e70bc8d5472f4.mockapi.io";
const ADMIN_USER = "admin";
const ADMIN_PASS = "cafe2026";

const vistaLogin = document.getElementById("vista-login");
const vistaPanel = document.getElementById("vista-panel");
const formLogin = document.getElementById("form-login");
const errorLogin = document.getElementById("error-login");

const formCategoria = document.getElementById("form-categoria");
const listaCategorias = document.getElementById("lista-categorias");
const selectCategoria = document.getElementById("prod-categoria");

const formProducto = document.getElementById("form-producto");
const tablaProductos = document.getElementById("tabla-productos");
const tituloForm = document.getElementById("titulo-form-producto");
const btnCancelarEdit = document.getElementById("btn-cancelar-edit");
const buscarAdmin = document.getElementById("buscar-admin");
const modalDetalle = document.getElementById("modal-detalle");

let productosCache = [];

function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Mantener sesión si ya inició
if (sessionStorage.getItem("adminLogueado") === "true") {
  mostrarPanel();
}

// Login
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("login-usuario").value.trim();
  const pass = document.getElementById("login-password").value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("adminLogueado", "true");
    errorLogin.classList.add("hidden");
    mostrarPanel();
    mostrarToast("Bienvenido al Panel de Administración", "success");
  } else {
    errorLogin.classList.remove("hidden");
  }
});

// Logout
document.getElementById("btn-logout").addEventListener("click", () => {
  sessionStorage.removeItem("adminLogueado");
  vistaPanel.classList.add("hidden");
  vistaLogin.classList.remove("hidden");
  formLogin.reset();
});

function mostrarPanel() {
  vistaLogin.classList.add("hidden");
  vistaPanel.classList.remove("hidden");
  cargarCategorias();
  cargarProductos();
}

// Categorías
async function cargarCategorias() {
  const porDefecto = ["Café en Grano", "Bebidas Calientes", "Bebidas Frías", "Repostería", "Accesorios"];
  try {
    const res = await fetch(`${API_URL}/categorias`);
    if (!res.ok) throw new Error("Sin recurso /categorias");
    const categorias = await res.json();

    listaCategorias.innerHTML =
      categorias.length === 0
        ? `<p style="font-size:0.85rem; color:#6e6259;">Aún no hay categorías creadas.</p>`
        : categorias
            .map(
              (c) => `
          <span class="cat-chip">
            ${c.nombre}
            <button onclick="eliminarCategoria('${c.id}')" title="Eliminar">&times;</button>
          </span>
        `
            )
            .join("");

    const opciones = categorias.length > 0 ? categorias.map((c) => c.nombre) : porDefecto;
    selectCategoria.innerHTML = opciones.map((n) => `<option value="${n}">${n}</option>`).join("");
  } catch (error) {
    listaCategorias.innerHTML = `<p style="font-size:0.85rem; color:#d97706;">Crea el recurso <strong>categorias</strong> en MockAPI para editarlas (usando categorías base por ahora).</p>`;
    selectCategoria.innerHTML = porDefecto.map((n) => `<option value="${n}">${n}</option>`).join("");
  }
}

formCategoria.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("input-categoria");
  const nombre = input.value.trim();
  if (!nombre) return;

  try {
    const res = await fetch(`${API_URL}/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });
    if (!res.ok) throw new Error();
    input.value = "";
    mostrarToast("Categoría agregada", "success");
    cargarCategorias();
  } catch {
    mostrarToast("Error: verifica que el recurso 'categorias' exista en MockAPI", "error");
  }
});

async function eliminarCategoria(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;
  await fetch(`${API_URL}/categorias/${id}`, { method: "DELETE" });
  mostrarToast("Categoría eliminada");
  cargarCategorias();
}

// Productos
async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/productos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    productosCache = await res.json();
    actualizarKPIs();
    renderizarTabla();
  } catch (error) {
    tablaProductos.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#dc2626; padding: 24px;">Error al conectar con ${API_URL}/productos</td></tr>`;
  }
}

function actualizarKPIs() {
  const totalProd = productosCache.length;
  const totalStock = productosCache.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const bajoStock = productosCache.filter((p) => (Number(p.stock) || 0) <= 5).length;
  const valorTotal = productosCache.reduce((acc, p) => acc + (Number(p.precio) || 0) * (Number(p.stock) || 0), 0);

  document.getElementById("kpi-productos").textContent = totalProd;
  document.getElementById("kpi-stock").textContent = totalStock;
  document.getElementById("kpi-bajo-stock").textContent = bajoStock;
  document.getElementById("kpi-valor").textContent = `Bs. ${valorTotal.toFixed(0)}`;
}

buscarAdmin.addEventListener("input", renderizarTabla);

function renderizarTabla() {
  const filtro = buscarAdmin.value.trim().toLowerCase();
  const lista = productosCache.filter(
    (p) =>
      (p.nombre || "").toLowerCase().includes(filtro) ||
      (p.categoria || "").toLowerCase().includes(filtro)
  );

  if (lista.length === 0) {
    tablaProductos.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:#6e6259;">No hay productos registrados. Usa el botón "⚡ Cargar Datos de Ejemplo" arriba.</td></tr>`;
    return;
  }

  tablaProductos.innerHTML = lista
    .map((p) => {
      const stock = Number(p.stock) || 0;
      const colorStock = stock === 0 ? "#dc2626" : stock <= 5 ? "#d97706" : "#15803d";
      return `
        <tr>
          <td><img src="${p.imagen}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80'" class="table-img" /></td>
          <td><strong>${p.nombre}</strong></td>
          <td>${p.categoria}</td>
          <td>Bs. ${Number(p.precio).toFixed(2)}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <button class="qty-btn" onclick="ajustarStock('${p.id}', -1)">-</button>
              <strong style="min-width:26px; text-align:center; color:${colorStock};">${stock}</strong>
              <button class="qty-btn" onclick="ajustarStock('${p.id}', 1)">+</button>
            </div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-dark btn-sm" onclick="verProducto('${p.id}')">Ver</button>
            <button class="btn btn-secondary btn-sm" onclick="editarProducto('${p.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${p.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function ajustarStock(id, delta) {
  const prod = productosCache.find((p) => String(p.id) === String(id));
  if (!prod) return;
  const nuevoStock = Math.max(0, (Number(prod.stock) || 0) + delta);

  await fetch(`${API_URL}/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...prod, stock: nuevoStock })
  });
  mostrarToast(`Stock de "${prod.nombre}" actualizado a ${nuevoStock}`, "success");
  cargarProductos();
}

formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("prod-id").value;
  const datos = {
    nombre: document.getElementById("prod-nombre").value.trim(),
    categoria: document.getElementById("prod-categoria").value,
    precio: parseFloat(document.getElementById("prod-precio").value),
    stock: parseInt(document.getElementById("prod-stock").value, 10),
    imagen: document.getElementById("prod-imagen").value.trim(),
    descripcion: document.getElementById("prod-descripcion").value.trim()
  };

  try {
    const url = id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error();

    mostrarToast(id ? "Producto actualizado" : "Producto creado con éxito", "success");
    resetearFormulario();
    cargarProductos();
  } catch {
    mostrarToast("Error al guardar en MockAPI", "error");
  }
});

function editarProducto(id) {
  const p = productosCache.find((item) => String(item.id) === String(id));
  if (!p) return;

  document.getElementById("prod-id").value = p.id;
  document.getElementById("prod-nombre").value = p.nombre;
  document.getElementById("prod-categoria").value = p.categoria;
  document.getElementById("prod-precio").value = p.precio;
  document.getElementById("prod-stock").value = p.stock;
  document.getElementById("prod-imagen").value = p.imagen;
  document.getElementById("prod-descripcion").value = p.descripcion;

  tituloForm.textContent = "Editando Producto";
  btnCancelarEdit.classList.remove("hidden");
  formProducto.scrollIntoView({ behavior: "smooth" });
}

btnCancelarEdit.addEventListener("click", resetearFormulario);

function resetearFormulario() {
  formProducto.reset();
  document.getElementById("prod-id").value = "";
  tituloForm.textContent = "Agregar Nuevo Producto";
  btnCancelarEdit.classList.add("hidden");
}

async function eliminarProducto(id) {
  if (!confirm("¿Eliminar este producto permanentemente?")) return;
  await fetch(`${API_URL}/productos/${id}`, { method: "DELETE" });
  mostrarToast("Producto eliminado");
  cargarProductos();
}

// Ver detalle del producto
document.getElementById("btn-cerrar-detalle").addEventListener("click", () => {
  modalDetalle.classList.add("hidden");
});

modalDetalle.addEventListener("click", (e) => {
  if (e.target === modalDetalle) modalDetalle.classList.add("hidden");
});

function verProducto(id) {
  const p = productosCache.find((item) => String(item.id) === String(id));
  if (!p) return;

  const stock = Number(p.stock) || 0;
  const precio = Number(p.precio) || 0;
  const valorStock = precio * stock;
  const estado = stock === 0 ? "Agotado" : stock <= 5 ? "Stock bajo" : "Disponible";
  const colorEstado = stock === 0 ? "#dc2626" : stock <= 5 ? "#d97706" : "#15803d";

  document.getElementById("detalle-titulo").textContent = p.nombre;
  document.getElementById("detalle-contenido").innerHTML = `
    <img src="${p.imagen}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" alt="${p.nombre}" style="width:100%; height:220px; object-fit:cover; border-radius:10px; margin-bottom:16px;" />
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span class="cat-chip">${p.categoria || "General"}</span>
      <span style="font-size:0.85rem; font-weight:700; color:${colorEstado};">● ${estado}</span>
    </div>
    <p style="color:#6e6259; font-size:0.92rem; margin-bottom:16px;">${p.descripcion || "Sin descripción."}</p>
    <div style="background:#faf7f2; padding:14px; border-radius:10px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.88rem; margin-bottom:18px;">
      <div><strong>ID MockAPI:</strong> #${p.id}</div>
      <div><strong>Precio:</strong> Bs. ${precio.toFixed(2)}</div>
      <div><strong>Stock actual:</strong> ${stock} uds.</div>
      <div><strong>Valor en stock:</strong> Bs. ${valorStock.toFixed(2)}</div>
    </div>
    <div style="display:flex; gap:10px;">
      <button onclick="modalDetalle.classList.add('hidden'); editarProducto('${p.id}')" class="btn btn-primary" style="flex:1;">Editar producto</button>
      <button onclick="modalDetalle.classList.add('hidden')" class="btn btn-secondary" style="flex:1;">Cerrar</button>
    </div>
  `;

  modalDetalle.classList.remove("hidden");
}

// Botón mágico para poblar MockAPI en 1 clic
document.getElementById("btn-cargar-demo").addEventListener("click", async () => {
  if (!confirm("¿Deseas cargar 6 productos y 4 categorías de cafetería en tu MockAPI?")) return;

  const demoCats = ["Café en Grano", "Bebidas Calientes", "Repostería", "Accesorios"];
  const demoProds = [
    {
      nombre: "Café Yungas Tostado 250g",
      descripcion: "Grano de altura con notas a chocolate amargo y frutos rojos.",
      precio: 48,
      stock: 12,
      categoria: "Café en Grano",
      imagen: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80"
    },
    {
      nombre: "Cappuccino Artesanal",
      descripcion: "Doble shot de espresso con leche vaporizada y espuma cremosa.",
      precio: 22,
      stock: 20,
      categoria: "Bebidas Calientes",
      imagen: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80"
    },
    {
      nombre: "Latte Vainilla Natural",
      descripcion: "Espresso suave combinado con leche fresca y jarabe de vainilla.",
      precio: 25,
      stock: 15,
      categoria: "Bebidas Calientes",
      imagen: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80"
    },
    {
      nombre: "Croissant de Mantequilla",
      descripcion: "Horneado cada mañana, masa hojaldrada crujiente.",
      precio: 16,
      stock: 8,
      categoria: "Repostería",
      imagen: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
    },
    {
      nombre: "Cheesecake Frutos Rojos",
      descripcion: "Porción cremosa con base de galleta y salsa artesanal de moras.",
      precio: 28,
      stock: 4,
      categoria: "Repostería",
      imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
    },
    {
      nombre: "Prensa Francesa 600ml",
      descripcion: "Cafetera de vidrio borosilicato y filtro de acero inoxidable.",
      precio: 140,
      stock: 5,
      categoria: "Accesorios",
      imagen: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
    }
  ];

  mostrarToast("Cargando datos en MockAPI...");
  try {
    for (const nombre of demoCats) {
      await fetch(`${API_URL}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
      }).catch(() => {});
    }
    for (const prod of demoProds) {
      await fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prod)
      });
    }
    mostrarToast("¡Datos cargados correctamente!", "success");
    cargarCategorias();
    cargarProductos();
  } catch {
    mostrarToast("Hubo un error al cargar los datos de ejemplo", "error");
  }
});