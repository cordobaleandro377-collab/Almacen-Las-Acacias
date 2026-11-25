// Catálogo de productos: los datos se guardan en un array de objetos.
const productos = [
  { id: 1, nombre: "Yerba mate", categoria: "Almacén", detalle: "Paquete de 1 kg", precio: 4500, stock: 12, emoji: "🧉", fondo: "fondo-amarillo" },
  { id: 2, nombre: "Arroz", categoria: "Almacén", detalle: "Paquete de 1 kg", precio: 1800, stock: 18, emoji: "🍚", fondo: "fondo-verde" },
  { id: 3, nombre: "Fideos", categoria: "Almacén", detalle: "Paquete de 500 g", precio: 1250, stock: 0, emoji: "🍝", fondo: "fondo-rosa" },
  { id: 4, nombre: "Galletitas", categoria: "Almacén", detalle: "Paquete surtido", precio: 1600, stock: 20, emoji: "🍪", fondo: "fondo-amarillo" },
  { id: 5, nombre: "Leche", categoria: "Almacén", detalle: "Caja de 1 litro", precio: 1700, stock: 15, emoji: "🥛", fondo: "fondo-celeste" },
  { id: 6, nombre: "Agua mineral", categoria: "Bebidas", detalle: "Botella de 1,5 litros", precio: 1400, stock: 24, emoji: "💧", fondo: "fondo-celeste" },
  { id: 7, nombre: "Jugo de naranja", categoria: "Bebidas", detalle: "Botella de 1 litro", precio: 2200, stock: 9, emoji: "🍊", fondo: "fondo-naranja" },
  { id: 8, nombre: "Gaseosa", categoria: "Bebidas", detalle: "Botella de 2,25 litros", precio: 3200, stock: 11, emoji: "🥤", fondo: "fondo-lila" },
  { id: 9, nombre: "Detergente", categoria: "Limpieza", detalle: "Envase de 750 ml", precio: 2100, stock: 10, emoji: "🧴", fondo: "fondo-verde" },
  { id: 10, nombre: "Lavandina", categoria: "Limpieza", detalle: "Botella de 1 litro", precio: 1300, stock: 14, emoji: "🫧", fondo: "fondo-celeste" },
  { id: 11, nombre: "Jabón en polvo", categoria: "Limpieza", detalle: "Paquete de 800 g", precio: 3900, stock: 7, emoji: "🧼", fondo: "fondo-rosa" },
  { id: 12, nombre: "Esponja", categoria: "Limpieza", detalle: "Unidad", precio: 900, stock: 30, emoji: "🧽", fondo: "fondo-amarillo" }
];

const elementoProductos = document.querySelector("#productos");
const buscador = document.querySelector("#buscador");
const filtros = document.querySelector("#filtros");
const sinResultados = document.querySelector("#sin-resultados");
const mensajeResultados = document.querySelector("#mensaje-resultados");
const carritoPanel = document.querySelector("#carrito");
const velo = document.querySelector("#velo");
const listaCarrito = document.querySelector("#lista-carrito");
const carritoVacio = document.querySelector("#carrito-vacio");
const contadorCarrito = document.querySelector("#contador-carrito");
const totalCarrito = document.querySelector("#total-carrito");
const totalCheckout = document.querySelector("#total-checkout");
const formulario = document.querySelector("#formulario-compra");

let categoriaActiva = "todos";
let carrito = cargarCarrito();
let cotizacionDolar = null;

// Formatea importes con la convención argentina.
function formatoPesos(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(valor);
}

// Dibuja las tarjetas a partir del array, sin escribir productos a mano en HTML.
function mostrarProductos(lista) {
  elementoProductos.innerHTML = "";

  lista.forEach((producto) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = `producto ${producto.stock === 0 ? "agotado" : ""}`;
    const precioEnDolares = cotizacionDolar
      ? `<p class="precio-usd">≈ US$ ${(producto.precio / cotizacionDolar).toFixed(2)}</p>`
      : "";

    tarjeta.innerHTML = `
      <div class="producto-imagen ${producto.fondo}">${producto.emoji}</div>
      <div class="producto-cuerpo">
        <span class="categoria-producto">${producto.categoria}</span>
        <h3>${producto.nombre}</h3>
        <p class="detalle">${producto.detalle}</p>
        <div class="producto-pie">
          <div><span class="precio">${formatoPesos(producto.precio)}</span>${precioEnDolares}</div>
          <button class="boton-agregar" type="button" data-id="${producto.id}" ${producto.stock === 0 ? "disabled" : ""}>
            ${producto.stock === 0 ? "Sin stock" : "Agregar +"}
          </button>
        </div>
      </div>`;
    elementoProductos.append(tarjeta);
  });

  sinResultados.classList.toggle("oculto", lista.length !== 0);
  mensajeResultados.textContent = `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;
}

// Combina el filtro de categoría con el texto del buscador.
function filtrarProductos() {
  const texto = buscador.value.trim().toLowerCase();
  const resultado = productos.filter((producto) => {
    const coincideCategoria = categoriaActiva === "todos" || producto.categoria === categoriaActiva;
    const coincideTexto = producto.nombre.toLowerCase().includes(texto);
    return coincideCategoria && coincideTexto;
  });
  mostrarProductos(resultado);
}

// Delegación de eventos: un solo listener atiende todos los botones Agregar.
elementoProductos.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".boton-agregar");
  if (!boton) return;
  agregarAlCarrito(Number(boton.dataset.id));
});

filtros.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".chip");
  if (!boton) return;
  categoriaActiva = boton.dataset.categoria;
  filtros.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("activo"));
  boton.classList.add("activo");
  filtrarProductos();
});

buscador.addEventListener("input", filtrarProductos);

// Agrega un producto o aumenta su cantidad, respetando el stock disponible.
function agregarAlCarrito(id) {
  const producto = productos.find((item) => item.id === id);
  const itemCarrito = carrito.find((item) => item.id === id);
  const cantidadActual = itemCarrito ? itemCarrito.cantidad : 0;
  if (!producto || cantidadActual >= producto.stock) return;

  if (itemCarrito) itemCarrito.cantidad += 1;
  else carrito.push({ id, cantidad: 1 });

  guardarCarrito();
  mostrarCarrito();
}

// Actualiza cantidad; si llega a cero, quita el producto del carrito.
function cambiarCantidad(id, cambio) {
  const item = carrito.find((producto) => producto.id === id);
  const producto = productos.find((producto) => producto.id === id);
  if (!item || !producto) return;

  const nuevaCantidad = item.cantidad + cambio;
  if (nuevaCantidad <= 0) {
    carrito = carrito.filter((producto) => producto.id !== id);
  } else if (nuevaCantidad <= producto.stock) {
    item.cantidad = nuevaCantidad;
  }
  guardarCarrito();
  mostrarCarrito();
}

// Calcula el importe total con reduce.
function calcularTotal() {
  return carrito.reduce((total, item) => {
    const producto = productos.find((producto) => producto.id === item.id);
    return total + (producto ? producto.precio * item.cantidad : 0);
  }, 0);
}

// Dibuja los renglones del carrito y sus totales.
function mostrarCarrito() {
  listaCarrito.innerHTML = "";
  carrito.forEach((item) => {
    const producto = productos.find((producto) => producto.id === item.id);
    if (!producto) return;

    const renglon = document.createElement("article");
    renglon.className = "item-carrito";
    renglon.innerHTML = `
      <div class="item-emoji ${producto.fondo}">${producto.emoji}</div>
      <div>
        <h4>${producto.nombre}</h4>
        <small>${formatoPesos(producto.precio)} c/u</small>
        <div class="controles-cantidad">
          <button type="button" data-accion="menos" data-id="${producto.id}" aria-label="Restar una unidad">−</button>
          <strong>${item.cantidad}</strong>
          <button type="button" data-accion="mas" data-id="${producto.id}" aria-label="Sumar una unidad">+</button>
          <button type="button" class="boton-quitar" data-accion="quitar" data-id="${producto.id}">Quitar</button>
        </div>
      </div>
      <strong>${formatoPesos(producto.precio * item.cantidad)}</strong>`;
    listaCarrito.append(renglon);
  });

  const unidades = carrito.reduce((total, item) => total + item.cantidad, 0);
  contadorCarrito.textContent = unidades;
  totalCarrito.textContent = formatoPesos(calcularTotal());
  totalCheckout.textContent = formatoPesos(calcularTotal());
  carritoVacio.classList.toggle("oculto", carrito.length > 0);
  listaCarrito.classList.toggle("oculto", carrito.length === 0);
  document.querySelector("#btn-finalizar").disabled = carrito.length === 0;
}

listaCarrito.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "mas") cambiarCantidad(id, 1);
  if (boton.dataset.accion === "menos") cambiarCantidad(id, -1);
  if (boton.dataset.accion === "quitar") {
    carrito = carrito.filter((item) => item.id !== id);
    guardarCarrito();
    mostrarCarrito();
  }
});

function guardarCarrito() {
  localStorage.setItem("almacen-las-acacias-carrito", JSON.stringify(carrito));
}

// Recupera los datos guardados; si el contenido está dañado, inicia vacío.
function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem("almacen-las-acacias-carrito")) || [];
    return guardado.filter((item) =>
      productos.some((producto) => producto.id === item.id) &&
      Number.isInteger(item.cantidad) && item.cantidad > 0
    );
  } catch (error) {
    console.warn("No se pudo recuperar el carrito guardado:", error);
    return [];
  }
}

// Abre o cierra el panel lateral y el fondo oscuro.
function abrirCarrito() {
  carritoPanel.classList.add("abierto");
  carritoPanel.setAttribute("aria-hidden", "false");
  velo.classList.add("visible");
  velo.setAttribute("aria-hidden", "false");
}

function cerrarCarrito() {
  carritoPanel.classList.remove("abierto");
  carritoPanel.setAttribute("aria-hidden", "true");
  velo.classList.remove("visible");
  velo.setAttribute("aria-hidden", "true");
}

document.querySelector("#btn-carrito").addEventListener("click", abrirCarrito);
document.querySelector("#cerrar-carrito").addEventListener("click", cerrarCarrito);
velo.addEventListener("click", cerrarCarrito);
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    cerrarCarrito();
    cerrarFormulario();
  }
});

document.querySelector("#vaciar-carrito").addEventListener("click", () => {
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
});

// Muestra el formulario de compra y cierra el carrito.
document.querySelector("#btn-finalizar").addEventListener("click", () => {
  if (carrito.length === 0) return;
  cerrarCarrito();
  document.querySelector("#form-compra").classList.remove("oculto");
});

function cerrarFormulario() {
  document.querySelector("#form-compra").classList.add("oculto");
}

document.querySelector("#cerrar-formulario").addEventListener("click", cerrarFormulario);

// La dirección solo es obligatoria cuando se elige envío a domicilio.
document.querySelectorAll('input[name="entrega"]').forEach((opcion) => {
  opcion.addEventListener("change", () => {
    const requiereDireccion = document.querySelector('input[name="entrega"]:checked').value === "Envío a domicilio";
    document.querySelector("#grupo-direccion").classList.toggle("oculto", !requiereDireccion);
  });
});

// Valida los campos y muestra el error debajo del campo correspondiente.
function validarCampo(id, mensaje) {
  const campo = document.querySelector(`#${id}`);
  const error = document.querySelector(`#error-${id}`);
  const esValido = mensaje === "";
  campo.classList.toggle("invalido", !esValido);
  error.textContent = mensaje;
  return esValido;
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nombre = document.querySelector("#nombre").value.trim();
  const email = document.querySelector("#email").value.trim();
  const telefono = document.querySelector("#telefono").value.trim();
  const entrega = document.querySelector('input[name="entrega"]:checked').value;
  const direccion = document.querySelector("#direccion").value.trim();
  const acepta = document.querySelector("#acepta").checked;

  const nombreOk = validarCampo("nombre", nombre.length >= 3 ? "" : "Ingresá al menos 3 caracteres.");
  const emailOk = validarCampo("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Ingresá un correo válido.");
  const telefonoOk = validarCampo("telefono", /^\d{8,}$/.test(telefono) ? "" : "Ingresá al menos 8 números, sin espacios.");
  const direccionOk = entrega !== "Envío a domicilio" || validarCampo("direccion", direccion ? "" : "La dirección es obligatoria para el envío.");

  document.querySelector("#error-acepta").textContent = acepta ? "" : "Tenés que confirmar tus datos.";
  if (!nombreOk || !emailOk || !telefonoOk || !direccionOk || !acepta || carrito.length === 0) return;

  const total = formatoPesos(calcularTotal());
  document.querySelector("#mensaje-exito").textContent = `Gracias, ${nombre}. Tu pedido por ${total} está confirmado. Modalidad: ${entrega}.`;
  cerrarFormulario();
  document.querySelector("#compra-exitosa").classList.remove("oculto");
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
  formulario.reset();
  document.querySelector("#grupo-direccion").classList.add("oculto");
});

document.querySelector("#cerrar-exito").addEventListener("click", () => {
  document.querySelector("#compra-exitosa").classList.add("oculto");
});

// Consulta la cotización oficial del dólar y mantiene la tienda operativa si falla.
async function consultarDolar() {
  const etiquetaDolar = document.querySelector("#cotizacion-dolar");
  try {
    const respuesta = await fetch("https://dolarapi.com/v1/dolares/oficial");
    if (!respuesta.ok) throw new Error("La API respondió con un error.");
    const datos = await respuesta.json();
    cotizacionDolar = Number(datos.venta);
    if (!Number.isFinite(cotizacionDolar) || cotizacionDolar <= 0) {
      throw new Error("La cotización recibida no es válida.");
    }
    etiquetaDolar.className = "";
    etiquetaDolar.textContent = `Dólar oficial: ${formatoPesos(cotizacionDolar)}`;
    filtrarProductos();
  } catch (error) {
    console.error("No se pudo consultar la cotización:", error);
    etiquetaDolar.className = "error";
    etiquetaDolar.textContent = "Cotización no disponible";
  }
}

// Inicialización de la tienda.
filtrarProductos();
mostrarCarrito();
consultarDolar();
