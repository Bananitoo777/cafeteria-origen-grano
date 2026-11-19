const API_URL = "https://6aff04223a0e70bc8d5472f4.mockapi.io";

let productos = [];
let categorias = [];
let categoriaActiva = "todas";
let carrito = [];

const gridProductos = document.getElementById("grid-productos");
const pillsCategorias = document.getElementById("pills-categorias");
const buscador = document.getElementById("buscador");
const ordenarPor = document.getElementById("ordenar-por");
const modalCarrito = document.getElementById("modal-carrito");
const listaCarrito = document.getElementById("lista-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const totalCarrito = document.getElementById("total-carrito");
const btnComprar = document.getElementById("btn-comprar");
const modalLightbox = document.getElementById("modal-lightbox");
const modalRecibo = document.getElementById("modal-recibo");

function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Eventos UI
document.getElementById("btn-abrir-carrito").addEventListener("click", () => {
  modalCarrito.classList.remove("hidden");
  renderizarCarrito();
});

document.getElementById("btn-cerrar-carrito").addEventListener("click", () => {
  modalCarrito.classList.add("hidden");
});

modalCarrito.addEventListener("click", (e) => {
  if (e.target === modalCarrito) modalCarrito.classList.add("hidden");
});

document.getElementById("btn-cerrar-lightbox").addEventListener("click", () => {
  modalLightbox.classList.add("hidden");
});

modalLightbox.addEventListener("click", (e) => {
  if (e.target === modalLightbox) modalLightbox.classList.add("hidden");
});

document.getElementById("btn-cerrar-recibo").addEventListener("click", () => {
  modalRecibo.classList.add("hidden");
});

buscador.addEventListener("input", renderizarProductos);
ordenarPor.addEventListener("change", renderizarProductos);
btnComprar.addEventListener("click", finalizarCompra);

function abrirLightbox(src, caption) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-caption").textContent = caption;
  modalLightbox.classList.remove("hidden");
}

// Cargar datos desde MockAPI
async function cargarDatos() {
  try {
    const resProd = await fetch(`${API_URL}/productos`);
    if (!resProd.ok) throw new Error(`Error ${resProd.status} en /productos`);
    productos = await resProd.json();

    try {
      const resCat = await fetch(`${API_URL}/categorias`);
      if (resCat.ok) {
        const catsApi = await resCat.json();
        categorias = catsApi.map((c) => c.nombre).filter(Boolean);
      }
    } catch (_) {
      categorias = [];
    }

    if (categorias.length === 0) {
      categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];
    }

    renderizarCategorias();
    renderizarProductos();
  } catch (error) {
    console.error(error);
    gridProductos.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; background: #fff; padding: 36px; border-radius: 14px; border: 1px solid #e6dcd1;">
        <h3 style="color: #dc2626; margin-bottom: 8px;">No se pudo conectar con MockAPI</h3>
        <p style="color: #6e6259; font-size: 0.9rem; margin-bottom: 16px;">
          Verifica que el recurso <strong>productos</strong> exista en: <code>${API_URL}/productos</code>
        </p>
        <button onclick="cargarDatos()" class="btn btn-primary btn-sm">Reintentar</button>
      </div>
    `;
  }
}

function renderizarCategorias() {
  const todas = ["todas", ...categorias];
  pillsCategorias.innerHTML = todas
    .map(
      (cat) => `
      <button class="pill ${categoriaActiva === cat ? "active" : ""}" onclick="seleccionarCategoria('${cat.replace(/'/g, "\\'")}')">
        ${cat === "todas" ? "Todos los productos" : cat}
      </button>
    `
    )
    .join("");
}

function seleccionarCategoria(cat) {
  categoriaActiva = cat;
  renderizarCategorias();
  renderizarProductos();
}

function renderizarProductos() {
  if (productos.length === 0) {
    gridProductos.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; background: #fff; padding: 40px; border-radius: 14px;">
        <h3>El catálogo aún está vacío</h3>
        <p style="color: #6e6259; margin: 8px 0 18px;">Ingresa al Panel Admin y presiona "Cargar Datos de Ejemplo" para llenarlo en 1 clic.</p>
        <a href="admin.html" class="btn btn-primary">Ir al Panel Admin</a>
      </div>
    `;
    return;
  }

  const texto = buscador.value.trim().toLowerCase();
  let lista = productos.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const desc = (p.descripcion || "").toLowerCase();
    const coincideTexto = nombre.includes(texto) || desc.includes(texto);
    const coincideCat = categoriaActiva === "todas" || p.categoria === categoriaActiva;
    return coincideTexto && coincideCat;
  });

  const orden = ordenarPor.value;
  if (orden === "precio-asc") lista.sort((a, b) => Number(a.precio) - Number(b.precio));
  if (orden === "precio-desc") lista.sort((a, b) => Number(b.precio) - Number(a.precio));
  if (orden === "stock-desc") lista.sort((a, b) => Number(b.stock) - Number(a.stock));

  if (lista.length === 0) {
    gridProductos.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #6e6259;">No se encontraron productos con ese filtro.</p>`;
    return;
  }

  gridProductos.innerHTML = lista
    .map((p) => {
      const stock = Number(p.stock) || 0;
      const sinStock = stock <= 0;
      const badgeClass = sinStock ? "badge-out" : stock <= 5 ? "badge-low" : "badge-ok";
      const badgeText = sinStock ? "Agotado" : stock <= 5 ? `¡Últimas ${stock}!` : `Stock: ${stock}`;

      return `
        <article class="product-card">
          <div class="product-img-wrap">
            <img src="${p.imagen}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" alt="${p.nombre}" />
            <span class="badge-cat">${p.categoria || "General"}</span>
            <span class="badge-stock ${badgeClass}">${badgeText}</span>
          </div>
          <div class="product-body">
            <h3>${p.nombre}</h3>
            <p class="product-desc">${p.descripcion || "Especialidad preparada al momento."}</p>
            <div class="product-footer">
              <span class="price">Bs. ${Number(p.precio).toFixed(2)}</span>
              <button class="btn btn-dark btn-sm" onclick="agregarAlCarrito('${p.id}')" ${sinStock ? "disabled" : ""}>
                ${sinStock ? "Sin stock" : "+ Agregar"}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function agregarAlCarrito(id) {
  const prod = productos.find((p) => String(p.id) === String(id));
  if (!prod || Number(prod.stock) <= 0) return;

  const existente = carrito.find((i) => String(i.id) === String(id));
  if (existente) {
    if (existente.cantidad >= Number(prod.stock)) {
      mostrarToast("Alcanzaste el límite de stock disponible", "error");
      return;
    }
    existente.cantidad++;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }

  actualizarContador();
  mostrarToast(`"${prod.nombre}" agregado al carrito`, "success");
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((i) => String(i.id) === String(id));
  const prod = productos.find((p) => String(p.id) === String(id));
  if (!item || !prod) return;

  const nueva = item.cantidad + delta;
  if (nueva <= 0) {
    carrito = carrito.filter((i) => String(i.id) !== String(id));
  } else if (nueva <= Number(prod.stock)) {
    item.cantidad = nueva;
  } else {
    mostrarToast("No hay más unidades en stock", "error");
  }

  actualizarContador();
  renderizarCarrito();
}

function actualizarContador() {
  contadorCarrito.textContent = carrito.reduce((acc, i) => acc + i.cantidad, 0);
}

function renderizarCarrito() {
  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p style="text-align: center; color: #6e6259; padding: 40px 0;">Tu carrito está vacío.</p>`;
    totalCarrito.textContent = "Bs. 0.00";
    btnComprar.disabled = true;
    return;
  }

  btnComprar.disabled = false;
  let total = 0;

  listaCarrito.innerHTML = carrito
    .map((item) => {
      const subtotal = Number(item.precio) * item.cantidad;
      total += subtotal;
      return `
        <div class="cart-item">
          <img src="${item.imagen}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80'" alt="${item.nombre}" />
          <div class="cart-item-info">
            <h4>${item.nombre}</h4>
            <p>Bs. ${Number(item.precio).toFixed(2)} × ${item.cantidad} = <strong>Bs. ${subtotal.toFixed(2)}</strong></p>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="cambiarCantidad('${item.id}', -1)">-</button>
            <span>${item.cantidad}</span>
            <button class="qty-btn" onclick="cambiarCantidad('${item.id}', 1)">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  totalCarrito.textContent = `Bs. ${total.toFixed(2)}`;
}

async function finalizarCompra() {
  if (carrito.length === 0) return;

  btnComprar.disabled = true;
  btnComprar.textContent = "Actualizando stock...";

  const resumenCompra = [...carrito];
  const cliente = document.getElementById("cliente-nombre").value.trim() || "Cliente";

  try {
    for (const item of carrito) {
      const actual = productos.find((p) => String(p.id) === String(item.id));
      const nuevoStock = Math.max(0, Number(actual.stock) - item.cantidad);

      const res = await fetch(`${API_URL}/productos/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...actual, stock: nuevoStock })
      });

      if (!res.ok) throw new Error("Error actualizando stock");
    }

    const totalFinal = resumenCompra.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0);

    document.getElementById("recibo-contenido").innerHTML = `
      <p style="margin-bottom: 12px;">Gracias por tu compra, <strong>${cliente}</strong>. El stock fue descontado en vivo.</p>
      <div style="background: #faf7f2; padding: 14px; border-radius: 10px; margin-bottom: 16px; font-size: 0.9rem;">
        ${resumenCompra
          .map(
            (i) => `<div style="display:flex; justify-content:space-between; margin-bottom:6px;">
              <span>${i.cantidad}x ${i.nombre}</span>
              <strong>Bs. ${(Number(i.precio) * i.cantidad).toFixed(2)}</strong>
            </div>`
          )
          .join("")}
        <hr style="border:none; border-top:1px dashed #d6ccc2; margin: 10px 0;" />
        <div style="display:flex; justify-content:space-between; font-size: 1.05rem;">
          <strong>Total Pagado</strong>
          <strong>Bs. ${totalFinal.toFixed(2)}</strong>
        </div>
      </div>
      <button onclick="document.getElementById('modal-recibo').classList.add('hidden')" class="btn btn-primary" style="width:100%;">Aceptar</button>
    `;

    carrito = [];
    actualizarContador();
    modalCarrito.classList.add("hidden");
    modalRecibo.classList.remove("hidden");
    await cargarDatos();
  } catch (error) {
    console.error(error);
    mostrarToast("Error al procesar la compra en MockAPI", "error");
  } finally {
    btnComprar.textContent = "Confirmar Compra";
    btnComprar.disabled = false;
  }
}

cargarDatos();