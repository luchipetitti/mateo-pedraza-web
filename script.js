/* =========================================================
   INSTALACIONES MATEO — script.js

   >>> CAMBIÁ ESTO: poné el número real, con código de país y
   sin el 0 ni el 15. Villa María es 353.
   Ejemplo: 5493531234567
   ========================================================= */
const TELEFONO = '5493534290559';

/* >>> CAMBIÁ ESTO para activar "Entrar con Google" y el mail de
   bienvenida. Los dos datos salen de los pasos de CONFIGURAR-LOGIN.md.
   Mientras alguno quede vacío, el login no aparece y la web anda igual. */
const GOOGLE_CLIENT_ID = '142794252996-049vo1is1gjttjv5kqjqlm2pb5imub19.apps.googleusercontent.com';   // ej: '1234-abcd.apps.googleusercontent.com'
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTL2dGk5ZHeJz5w-_OWs2agwvlixtHFqi9RjAb8OFmn6JpynpndjAJwvHHq0KDTFYJXQ/exec';    // ej: 'https://script.google.com/macros/s/AKfy.../exec'

/* >>> CAMBIÁ ESTO: datos para cobrar desde el carrito. Lo que quede
   vacío no se muestra.
   - mercadoPago: tu link de cobro. En la app de Mercado Pago:
     "Cobrar" > "Link de pago" (el que deja poner cualquier monto).
     En el celular abre directo la app de Mercado Pago.
   - alias, cbu y titular: para transferencias desde cualquier banco
     o billetera (se copian con un toque). */
const PAGOS = {
  mercadoPago: '',   // ej: 'https://link.mercadopago.com.ar/instalacionesmateo'
  alias: 'Mateopedraza',
  cbu: '0110564330056410343733',
  titular: 'Sergio Mateo Pedraza',
  cuil: '20-38107712-9'
};

/* Dónde se guarda lo que la persona va escribiendo en el formulario */
const BORRADOR = 'mateo-borrador';
const SESION = 'mateo-sesion';

document.addEventListener('DOMContentLoaded', function () {

  const quietito = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     0. Avisos cortos abajo de la pantalla
     --------------------------------------------------------- */
  const cajaAvisos = document.getElementById('avisos');

  const mostrarAviso = function (texto, tono) {
    if (!cajaAvisos) return;

    const aviso = document.createElement('p');
    aviso.className = 'aviso' + (tono ? ' aviso--' + tono : '');
    aviso.textContent = texto;
    cajaAvisos.appendChild(aviso);

    // si se juntan muchos, sacamos el más viejo
    while (cajaAvisos.children.length > 3) cajaAvisos.firstElementChild.remove();

    setTimeout(function () {
      aviso.classList.add('saliendo');
      setTimeout(function () { aviso.remove(); }, 300);
    }, 2600);
  };

  /* ---------------------------------------------------------
     1. Todos los enlaces de WhatsApp
     --------------------------------------------------------- */
  const armarLink = function (texto) {
    return 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(texto);
  };

  document.querySelectorAll('[data-wp]').forEach(function (enlace) {
    enlace.href = armarLink(enlace.dataset.wpTexto || 'Hola Mateo!');
    enlace.target = '_blank';
    enlace.rel = 'noopener';
  });

  /* ---------------------------------------------------------
     2. Menú lateral: la navegación, la cuenta y los
        datos de contacto, todo en una barra que se desliza
        desde el costado.
     --------------------------------------------------------- */
  const menu = document.getElementById('menu');
  const velo = document.getElementById('velo');
  const abrirMenuBtn = document.getElementById('abrir-menu');
  const cerrarMenuBtn = document.getElementById('cerrar-menu');

  // los paneles cerrados quedan "inertes": no se puede llegar a sus
  // botones con Tab ni los lee el lector de pantalla
  ['menu', 'carrito', 'visor', 'buscador', 'ficha', 'kit'].forEach(function (id) {
    const panel = document.getElementById(id);
    if (panel) panel.inert = true;
  });

  // el menú, el carrito y el visor de fotos comparten esto: con
  // cualquiera de los tres abierto, el fondo no se mueve; solo se
  // destraba cuando se cerraron todos
  const actualizarBloqueoScroll = function () {
    const abierto = !!document.querySelector('.menu.abierto, .carrito.abierto, .visor.abierto, .buscador.abierto, .ficha.abierto');
    document.documentElement.classList.toggle('menu-abierto', abierto);
  };

  const abrirMenu = function () {
    if (!menu) return;
    menu.classList.add('abierto');
    menu.inert = false;
    if (velo) velo.classList.add('visible');
    actualizarBloqueoScroll();
    if (abrirMenuBtn) abrirMenuBtn.setAttribute('aria-expanded', 'true');
    if (cerrarMenuBtn) cerrarMenuBtn.focus();
    // el botón "Entrar con Google" vive en el menú: su script baja recién ahora
    document.dispatchEvent(new Event('menu-abierto'));
  };

  // devolverFoco = false cuando se cierra para ir a otro lado de la
  // página (un link, un atajo): ahí el foco no tiene que volver arriba
  const cerrarMenu = function (devolverFoco) {
    if (!menu || !menu.classList.contains('abierto')) return;
    menu.classList.remove('abierto');
    menu.inert = true;
    if (velo) velo.classList.remove('visible');
    actualizarBloqueoScroll();
    if (abrirMenuBtn) {
      abrirMenuBtn.setAttribute('aria-expanded', 'false');
      if (devolverFoco !== false) abrirMenuBtn.focus();
    }
  };

  if (abrirMenuBtn) abrirMenuBtn.addEventListener('click', abrirMenu);
  if (cerrarMenuBtn) cerrarMenuBtn.addEventListener('click', function () { cerrarMenu(); });
  if (velo) velo.addEventListener('click', function () { cerrarMenu(); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    // el kit y la ficha pueden estar arriba del carrito: se cierra solo el de arriba
    const kitAbierto = document.querySelector('.kit.abierto');
    if (kitAbierto) { cerrarKit(); return; }
    if (document.querySelector('#ficha.abierto')) { cerrarFicha(); return; }
    cerrarMenu(); cerrarCarrito(); cerrarVisor(); cerrarBuscador();
  });

  // al tocar un link de navegación, el menú se cierra solo
  if (menu) {
    menu.querySelectorAll('.menu__nav a, .menu__pie a').forEach(function (a) {
      a.addEventListener('click', function () { cerrarMenu(false); });
    });
  }

  /* ---------------------------------------------------------
     3. Carrito de compra: se arma con lo que se agrega desde el
        catálogo de Equipos, queda guardado en el navegador aunque
        se cierre la página, y se abre desde el botón de arriba a
        la derecha.
     --------------------------------------------------------- */
  const CARRITO_GUARDADO = 'mateo-carrito';

  const carrito = document.getElementById('carrito');
  const veloCarrito = document.getElementById('velo-carrito');
  const abrirCarritoBtn = document.getElementById('abrir-carrito');
  const cerrarCarritoBtn = document.getElementById('cerrar-carrito');
  const carritoNum = document.getElementById('carrito-num');
  const carritoLista = document.getElementById('carrito-lista');
  const carritoOpciones = document.getElementById('carrito-opciones');
  const carritoPago = document.getElementById('carrito-pago');
  const carritoDireccion = document.getElementById('carrito-direccion');
  const carritoNombre = document.getElementById('carrito-nombre');
  const carritoTelefono = document.getElementById('carrito-telefono');
  const carritoTotalCaja = document.getElementById('carrito-total-caja');
  const carritoTotalTexto = document.getElementById('carrito-total');
  const carritoFinalizar = document.getElementById('carrito-finalizar');

  let pedido = [];

  const formatoPrecio = function (numero) {
    return '$' + Math.round(numero).toLocaleString('es-AR');
  };

  const guardarCarrito = function () {
    try { localStorage.setItem(CARRITO_GUARDADO, JSON.stringify(pedido)); } catch (e) { /* nada */ }
  };

  // lo guardado se cruza con el catálogo de hoy: si cambiaste un precio
  // o sacaste un equipo, el carrito viejo no arrastra datos vencidos
  const cargarCarrito = function () {
    try {
      const crudo = localStorage.getItem(CARRITO_GUARDADO);
      if (crudo) pedido = JSON.parse(crudo) || [];
    } catch (e) { pedido = []; }

    pedido = pedido.filter(function (item) {
      const li = document.querySelector('.producto[data-id="' + CSS.escape(String(item.id)) + '"]');
      if (!li) return false;
      item.nombre = li.dataset.nombre;
      item.precio = parseFloat(li.dataset.precio) || 0;
      return item.cantidad > 0 && item.precio > 0;
    });
    guardarCarrito();
  };

  const subtotalCarrito = function () {
    return pedido.reduce(function (acc, p) { return acc + p.precio * p.cantidad; }, 0);
  };

  /* 10 % de bienvenida: quien entró con Google tiene 10 % de descuento en
     su primera compra. Al finalizar ese pedido el mail queda anotado en
     este navegador; la planilla además avisa si ese mail ya había comprado */
  const DESCUENTO_BIENVENIDA = 0.10;
  const YA_COMPRARON = 'mateo-compraron';
  const sesionActual = function () {
    try { return JSON.parse(localStorage.getItem(SESION) || 'null'); } catch (e) { return null; }
  };
  const yaCompro = function (email) {
    try { return (JSON.parse(localStorage.getItem(YA_COMPRARON) || '[]')).indexOf(email) !== -1; } catch (e) { return false; }
  };
  const anotarCompra = function (email) {
    try {
      const lista = JSON.parse(localStorage.getItem(YA_COMPRARON) || '[]');
      if (lista.indexOf(email) === -1) lista.push(email);
      localStorage.setItem(YA_COMPRARON, JSON.stringify(lista));
    } catch (e) { /* nada */ }
  };
  const tieneBienvenida = function () {
    const s = sesionActual();
    return !!(s && s.email && !yaCompro(s.email));
  };
  const descuentoCarrito = function () {
    return tieneBienvenida() ? Math.round(subtotalCarrito() * DESCUENTO_BIENVENIDA) : 0;
  };
  const totalCarrito = function () {
    return subtotalCarrito() - descuentoCarrito();
  };

  const cantidadCarrito = function () {
    return pedido.reduce(function (acc, p) { return acc + p.cantidad; }, 0);
  };

  /* --- links de pago: según lo que elija en "Cómo pagás" se muestra
     el botón de Mercado Pago o los datos para transferir --- */
  const pagoMp = document.getElementById('pago-mp');
  const pagoMpLink = document.getElementById('pago-mp-link');
  const pagoMpMonto = document.getElementById('pago-mp-monto');
  const pagoTransferencia = document.getElementById('pago-transferencia');

  if (pagoMpLink && PAGOS.mercadoPago) pagoMpLink.href = PAGOS.mercadoPago;
  [['alias', 'pago-alias'], ['cbu', 'pago-cbu'], ['titular', 'pago-titular'], ['cuil', 'pago-cuil']].forEach(function (par) {
    const nodo = document.getElementById(par[1]);
    const fila = document.getElementById(par[1] + '-fila');
    if (nodo) nodo.textContent = PAGOS[par[0]];
    if (fila) fila.hidden = !PAGOS[par[0]];
  });

  const actualizarPago = function () {
    const forma = carritoPago ? carritoPago.value : '';
    const hayCosas = pedido.length > 0;
    const conMp = forma === 'Mercado Pago' || forma === 'Tarjeta de débito o crédito';

    if (pagoMp) pagoMp.hidden = !(hayCosas && conMp && PAGOS.mercadoPago);
    if (pagoMpMonto) pagoMpMonto.textContent = formatoPrecio(totalCarrito());
    if (pagoTransferencia) {
      pagoTransferencia.hidden = !(hayCosas && forma === 'Transferencia' && (PAGOS.alias || PAGOS.cbu));
    }
  };
  if (carritoPago) carritoPago.addEventListener('change', actualizarPago);

  const copiar = function (texto, aviso) {
    if (!texto || !navigator.clipboard) return Promise.resolve(false);
    return navigator.clipboard.writeText(texto).then(function () {
      if (aviso) mostrarAviso(aviso, 'verde');
      return true;
    }).catch(function () { return false; });
  };

  document.querySelectorAll('[data-copiar]').forEach(function (boton) {
    boton.addEventListener('click', function () {
      const origen = document.getElementById(boton.dataset.copiar);
      copiar(origen ? origen.textContent.trim() : '', 'Copiado. Pegalo en la app de tu banco');
    });
  });

  // al tocar "Pagar", el total queda copiado para pegarlo en Mercado Pago
  // (el link sigue de largo y abre la app)
  if (pagoMpLink) {
    pagoMpLink.addEventListener('click', function () {
      copiar(String(Math.round(totalCarrito())), 'Total copiado: pegalo en Mercado Pago');
    });
  }

  const cambiarCantidad = function (id, delta) {
    const item = pedido.find(function (p) { return p.id === id; });
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) pedido = pedido.filter(function (p) { return p.id !== id; });

    guardarCarrito();
    pintarCarrito();
  };

  const quitarDelCarrito = function (id) {
    pedido = pedido.filter(function (p) { return p.id !== id; });
    guardarCarrito();
    pintarCarrito();
    mostrarAviso('Producto quitado del carrito');
  };

  const pintarCarrito = function () {
    const hayCosas = pedido.length > 0;
    if (carrito) carrito.classList.toggle('tiene-cosas', hayCosas);
    if (carritoOpciones) carritoOpciones.hidden = !hayCosas;
    if (carritoTotalCaja) carritoTotalCaja.hidden = !hayCosas;
    if (carritoFinalizar) carritoFinalizar.hidden = !hayCosas;
    const privacidad = document.getElementById('carrito-privacidad');
    if (privacidad) privacidad.hidden = !hayCosas;

    const cantidad = cantidadCarrito();
    if (carritoNum) {
      carritoNum.textContent = cantidad;
      carritoNum.hidden = cantidad === 0;
    }
    if (abrirCarritoBtn) {
      abrirCarritoBtn.setAttribute('aria-label', cantidad
        ? 'Ver carrito de compra, ' + cantidad + (cantidad === 1 ? ' producto' : ' productos')
        : 'Ver carrito de compra, vacío');
    }
    if (carritoTotalTexto) carritoTotalTexto.textContent = formatoPrecio(totalCarrito());
    const descuento = descuentoCarrito();
    const cajaDescuento = document.getElementById('carrito-descuento');
    if (cajaDescuento) {
      cajaDescuento.hidden = !hayCosas || !descuento;
      document.getElementById('carrito-descuento-monto').textContent = '−' + formatoPrecio(descuento);
    }
    // a quien no entró con Google se le cuenta que tiene el 10 %
    const promo = document.getElementById('carrito-promo');
    if (promo) promo.hidden = !hayCosas || !!sesionActual();
    if (carritoVaciar) carritoVaciar.hidden = !hayCosas;
    if (resumenNum) resumenNum.textContent = cantidad;
    if (resumenTotal) resumenTotal.textContent = formatoPrecio(totalCarrito());
    actualizarResumen();
    actualizarPago();

    // cada tarjeta del catálogo muestra cuántos de ese equipo ya lleva
    document.querySelectorAll('#grilla-equipos .producto').forEach(function (li) {
      const item = pedido.find(function (p) { return p.id === li.dataset.id; });
      let marca = li.querySelector('.producto__cuenta');
      if (item && !marca) {
        marca = document.createElement('span');
        marca.className = 'producto__cuenta';
        const boton = li.querySelector('.producto__agregar');
        if (boton) boton.parentNode.insertBefore(marca, boton);
        else li.appendChild(marca);
      }
      if (marca) {
        if (item) marca.textContent = '✓ ' + item.cantidad + ' en tu pedido';
        else marca.remove();
      }
    });

    if (!carritoLista) return;
    carritoLista.innerHTML = '';

    pedido.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'carrito__item';

      const foto = document.createElement('div');
      foto.className = 'carrito__foto';
      if (item.foto) {
        const img = document.createElement('img');
        img.src = item.foto;
        img.alt = '';
        img.addEventListener('error', function () { img.remove(); });
        foto.appendChild(img);
      }

      const datos = document.createElement('div');
      datos.className = 'carrito__datos';
      const h3 = document.createElement('h3');
      h3.textContent = item.nombre;
      const p = document.createElement('p');
      p.textContent = formatoPrecio(item.precio) + ' c/u';
      datos.appendChild(h3);
      datos.appendChild(p);

      const cant = document.createElement('div');
      cant.className = 'carrito__cantidad';
      const menos = document.createElement('button');
      menos.type = 'button';
      menos.textContent = '−';
      menos.setAttribute('aria-label', 'Sacar uno de ' + item.nombre);
      menos.addEventListener('click', function () { cambiarCantidad(item.id, -1); });
      const num = document.createElement('span');
      num.textContent = item.cantidad;
      const mas = document.createElement('button');
      mas.type = 'button';
      mas.textContent = '+';
      mas.setAttribute('aria-label', 'Agregar uno más de ' + item.nombre);
      mas.addEventListener('click', function () { cambiarCantidad(item.id, 1); });
      cant.appendChild(menos);
      cant.appendChild(num);
      cant.appendChild(mas);

      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'carrito__quitar';
      quitar.textContent = 'Quitar';
      quitar.addEventListener('click', function () { quitarDelCarrito(item.id); });

      li.appendChild(foto);
      li.appendChild(datos);
      li.appendChild(cant);
      li.appendChild(quitar);
      carritoLista.appendChild(li);
    });
  };

  /* --- barra fija "Ver mi pedido": se ve solo si hay cosas y la
     sección del pedido quedó fuera de vista (abajo de todo) --- */
  const carritoVaciar = document.getElementById('carrito-vaciar');
  const resumen = document.getElementById('carrito-resumen');
  const resumenNum = document.getElementById('carrito-resumen-num');
  const resumenTotal = document.getElementById('carrito-resumen-total');
  const seccionPedido = document.querySelector('.carrito__seccion--pedido');
  let pedidoALaVista = false;

  const actualizarResumen = function () {
    if (resumen) resumen.hidden = !pedido.length || pedidoALaVista;
  };

  if (resumen && seccionPedido && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      pedidoALaVista = entradas[0].isIntersecting;
      actualizarResumen();
    }, { root: carrito, threshold: 0, rootMargin: '0px 0px -40% 0px' }).observe(seccionPedido);

    resumen.addEventListener('click', function () {
      seccionPedido.scrollIntoView({ behavior: quietito ? 'auto' : 'smooth', block: 'start' });
    });
  }

  // "Vaciar" pide un segundo toque, para no borrar todo sin querer
  if (carritoVaciar) {
    let confirmando = null;
    carritoVaciar.addEventListener('click', function () {
      if (!confirmando) {
        carritoVaciar.textContent = '¿Seguro? Tocá de nuevo';
        carritoVaciar.classList.add('confirmando');
        confirmando = setTimeout(function () {
          confirmando = null;
          carritoVaciar.textContent = 'Vaciar';
          carritoVaciar.classList.remove('confirmando');
        }, 3000);
        return;
      }
      clearTimeout(confirmando);
      confirmando = null;
      carritoVaciar.textContent = 'Vaciar';
      carritoVaciar.classList.remove('confirmando');
      pedido = [];
      guardarCarrito();
      pintarCarrito();
      mostrarAviso('Carrito vacío');
    });
  }

  const agregarAlCarrito = function (producto) {
    const existe = pedido.find(function (p) { return p.id === producto.id; });
    if (existe) {
      existe.cantidad++;
    } else {
      pedido.push({
        id: producto.id, nombre: producto.nombre, precio: producto.precio,
        foto: producto.foto, cantidad: 1
      });
    }
    guardarCarrito();
    pintarCarrito();
    mostrarAviso(producto.nombre + ' — agregado al carrito', 'verde');
  };

  const abrirCarrito = function () {
    if (!carrito) return;
    carrito.classList.add('abierto');
    carrito.inert = false;
    if (veloCarrito) veloCarrito.classList.add('visible');
    actualizarBloqueoScroll();
    if (cerrarCarritoBtn) cerrarCarritoBtn.focus();
  };

  const cerrarCarrito = function () {
    if (!carrito || !carrito.classList.contains('abierto')) return;
    carrito.classList.remove('abierto');
    carrito.inert = true;
    if (veloCarrito) veloCarrito.classList.remove('visible');
    actualizarBloqueoScroll();
    if (abrirCarritoBtn) abrirCarritoBtn.focus();
  };

  if (abrirCarritoBtn) abrirCarritoBtn.addEventListener('click', abrirCarrito);
  if (cerrarCarritoBtn) cerrarCarritoBtn.addEventListener('click', cerrarCarrito);
  if (veloCarrito) veloCarrito.addEventListener('click', cerrarCarrito);

  // el link "Equipos" del menú lateral abre el carrito (el catálogo vive ahí)
  document.querySelectorAll('[data-abre-carrito]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      cerrarMenu(false);
      abrirCarrito();
    });
  });

  if (carritoFinalizar) {
    carritoFinalizar.addEventListener('click', function (e) {
      e.preventDefault();
      if (!pedido.length) return;

      // nada viene elegido de antemano: si no tocó los selects, se lo
      // pedimos y marcamos el campo en rojo hasta que lo complete
      const faltaDato = function (campo, texto) {
        mostrarAviso(texto, 'rojo');
        if (!campo) return;
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
        campo.addEventListener('input', function () { campo.removeAttribute('aria-invalid'); }, { once: true });
        campo.addEventListener('change', function () { campo.removeAttribute('aria-invalid'); }, { once: true });
      };

      if (carritoPago && !carritoPago.value) return faltaDato(carritoPago, 'Elegí cómo vas a pagar');

      const nombre = carritoNombre ? carritoNombre.value.trim() : '';
      if (carritoNombre && !nombre) return faltaDato(carritoNombre, 'Poné tu nombre');

      const telefono = carritoTelefono ? carritoTelefono.value.trim() : '';
      if (carritoTelefono && telefono.replace(/\D/g, '').length < 8) {
        return faltaDato(carritoTelefono, 'Poné tu WhatsApp para coordinar la entrega');
      }

      const direccion = carritoDireccion ? carritoDireccion.value.trim() : '';
      if (!direccion) return faltaDato(carritoDireccion, 'Falta la dirección de entrega');

      guardarCliente();

      // el mismo número va en el WhatsApp y en la planilla, así Mateo
      // encuentra el pedido. Si toca "Finalizar" dos veces no se duplica.
      const firma = JSON.stringify([pedido, nombre, telefono, direccion, carritoPago.value]);
      if (firma !== ultimaFirma) {
        ultimaFirma = firma;
        numeroPedido = Date.now().toString(36).slice(-6).toUpperCase();
      }

      let mensaje = 'Hola Mateo! Soy ' + nombre + '. Quiero comprar (pedido ' + numeroPedido + '):\n';
      pedido.forEach(function (item) {
        mensaje += '- ' + item.nombre + ' x' + item.cantidad +
          ' (' + formatoPrecio(item.precio * item.cantidad) + ')\n';
      });
      const descuento = descuentoCarrito();
      const sesion = sesionActual();
      if (descuento) {
        mensaje += '\nSubtotal: ' + formatoPrecio(subtotalCarrito());
        mensaje += '\n10% de bienvenida por mi primera compra (entré con Google: ' + sesion.email + '): −' + formatoPrecio(descuento);
      }
      mensaje += '\nTotal según la web: ' + formatoPrecio(totalCarrito()) + ' (¿me confirmás precio y stock?)';
      mensaje += '\nPago: ' + carritoPago.value;
      if (pagoMp && !pagoMp.hidden || pagoTransferencia && !pagoTransferencia.hidden) {
        mensaje += ' (pago cuando me confirmes el total)';
      }
      mensaje += '\nDirección de entrega: ' + direccion;

      registrarPedido({
        numero: numeroPedido,
        nombre: nombre,
        telefono: telefono,
        direccion: direccion,
        pago: carritoPago.value,
        total: totalCarrito(),
        descuento: descuento,
        items: pedido.map(function (item) {
          return { nombre: item.nombre, cantidad: item.cantidad, precio: item.precio };
        })
      });

      window.open(armarLink(mensaje), '_blank', 'noopener');
      // el 10 % es para una sola compra
      if (descuento && sesion && sesion.email) {
        anotarCompra(sesion.email);
        pintarCarrito();
      }
    });
  }

  // al entrar o salir de la cuenta se recalcula el total
  document.addEventListener('mateo-sesion', function () { pintarCarrito(); });
  const promoBoton = document.getElementById('carrito-promo');
  if (promoBoton) promoBoton.addEventListener('click', function () { abrirMenu(); });

  /* --- base de clientes: cada pedido se anota en la planilla de Google
     (hojas "Pedidos" y "Clientes", ver apps-script/Codigo.gs). Si la
     planilla no responde, el pedido igual sale por WhatsApp. --- */
  let numeroPedido = '';
  let ultimaFirma = '';

  const registrarPedido = function (datos) {
    if (!APPS_SCRIPT_URL) return;
    try {
      const sesion = JSON.parse(localStorage.getItem(SESION) || 'null');
      if (sesion && sesion.email) datos.email = sesion.email;
    } catch (e) { /* sin sesión */ }
    datos.tipo = 'pedido';
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(datos)
    }).catch(function () { /* el WhatsApp ya salió igual */ });
  };

  // nombre, WhatsApp y dirección quedan guardados para la próxima compra
  const CLIENTE_GUARDADO = 'mateo-cliente';
  const guardarCliente = function () {
    try {
      localStorage.setItem(CLIENTE_GUARDADO, JSON.stringify({
        nombre: carritoNombre ? carritoNombre.value.trim() : '',
        telefono: carritoTelefono ? carritoTelefono.value.trim() : '',
        direccion: carritoDireccion ? carritoDireccion.value.trim() : ''
      }));
    } catch (e) { /* nada */ }
  };
  try {
    const cliente = JSON.parse(localStorage.getItem(CLIENTE_GUARDADO) || 'null');
    if (cliente) {
      if (carritoNombre && cliente.nombre) carritoNombre.value = cliente.nombre;
      if (carritoTelefono && cliente.telefono) carritoTelefono.value = cliente.telefono;
      if (carritoDireccion && cliente.direccion) carritoDireccion.value = cliente.direccion;
    }
  } catch (e) { /* arranca vacío */ }

  cargarCarrito();
  pintarCarrito();

  /* ---------------------------------------------------------
     4. Catálogo de Equipos: buscador, filtros y "Agregar"
     --------------------------------------------------------- */
  const buscadorEquipos = document.getElementById('buscador-equipos');
  const filtrosEquipos = document.getElementById('filtros-equipos');
  const filtrosCategoria = document.getElementById('filtros-categoria');
  const precioMax = document.getElementById('precio-max');
  const precioMaxValor = document.getElementById('precio-max-valor');
  const grillaEquipos = document.getElementById('grilla-equipos');
  const catalogoVacio = document.getElementById('catalogo-vacio');
  const avisoBuscador = document.getElementById('aviso-buscador');

  if (grillaEquipos) {
    const productos = Array.prototype.slice.call(grillaEquipos.querySelectorAll('.producto'));
    let filtroEstado = 'todos';
    let filtroCategoria = 'todos';

    const precioDe = function (li) { return parseFloat(li.dataset.precio) || 0; };

    // los que no tienen precio cargado no van al carrito: se consultan
    const marcarPrecio = function (li) {
      const consultar = !(precioDe(li) > 0);
      li.classList.toggle('producto--consultar', consultar);
      const boton = li.querySelector('.producto__agregar');
      if (boton) boton.textContent = consultar ? 'Consultar por WhatsApp' : 'Agregar';
      const texto = li.querySelector('.producto__precio');
      if (texto) texto.textContent = consultar ? 'Consultar precio' : formatoPrecio(precioDe(li));
    };
    productos.forEach(marcarPrecio);

    // el piso y el techo del slider salen de los precios que hay
    let pisoReal = 0;
    let techoReal = 0;
    const calcularRango = function () {
      const precios = productos.map(precioDe).filter(function (p) { return p > 0; });
      pisoReal = precios.length ? Math.min.apply(null, precios) : 0;
      techoReal = precios.length ? Math.max.apply(null, precios) : 0;
      const precioMinValor = document.getElementById('precio-min-valor');
      if (precioMinValor) precioMinValor.textContent = formatoPrecio(pisoReal);
    };
    calcularRango();

    // el slider va de 0 a 1000 en escala "logarítmica": la primera mitad
    // recorre los precios bajos (insumos) y la segunda los equipos, así
    // se puede afinar en $10.000 igual que en $1.000.000
    const precioDesdeSlider = function (v) {
      if (v >= 1000 || !pisoReal) return Infinity;
      const p = pisoReal * Math.pow(techoReal / pisoReal, v / 1000);
      const paso = p < 50000 ? 1000 : p < 500000 ? 10000 : 50000;
      return Math.ceil(p / paso) * paso;
    };

    // cuántos productos hay de cada tipo, al lado de cada filtro
    if (filtrosCategoria) {
      filtrosCategoria.querySelectorAll('.chip-filtro').forEach(function (b) {
        const cat = b.dataset.categoria;
        const n = productos.filter(function (li) { return cat === 'todos' || li.dataset.categoria === cat; }).length;
        const num = document.createElement('span');
        num.className = 'lateral__num';
        num.textContent = n;
        b.appendChild(num);
        if (!n) b.hidden = true;
      });
    }

    // orden por precio: arranca del más barato
    const ordenPrecio = document.getElementById('orden-precio');
    // "Recomendado": por rubro, en el mismo orden que los filtros de la
    // barra lateral (aires, kits, caños…); dentro de cada rubro, de menor
    // a mayor precio y al final los de "Consultar precio"
    const RUBROS = Array.prototype.map.call(
      document.querySelectorAll('.chip-filtro[data-categoria]:not([data-categoria="todos"])'),
      function (b) { return b.dataset.categoria; });
    const rubro = function (li) {
      const i = RUBROS.indexOf(li.dataset.categoria);
      return i === -1 ? RUBROS.length : i;
    };
    // dentro de los aires: primero los equipos para la casa (splits y
    // ventana), después los comerciales, el multi split por partes y al
    // final controles y VRF (si no, por precio arrancaba con un control)
    const TIPO_AIRE = [/^(split|ventana|portátil)/i, /^(piso techo|cassette|baja silueta|multiposición|comercial)/i, /^multi split/i];
    const tipoAire = function (li) {
      if (li.dataset.categoria !== 'aire') return 0;
      const fig = li.querySelector('figure');
      const tipo = (fig && fig.dataset.marca) || '';
      for (let i = 0; i < TIPO_AIRE.length; i++) if (TIPO_AIRE[i].test(tipo)) return i;
      return TIPO_AIRE.length;
    };
    const ordenar = function () {
      const modo = ordenPrecio ? ordenPrecio.value : 'recomendado';
      productos.slice().sort(function (x, y) {
        if (modo === 'recomendado' && rubro(x) !== rubro(y)) return rubro(x) - rubro(y);
        if (modo === 'recomendado' && tipoAire(x) !== tipoAire(y)) return tipoAire(x) - tipoAire(y);
        if (!precioDe(x) !== !precioDe(y)) return precioDe(x) ? -1 : 1;
        return modo === 'desc' ? precioDe(y) - precioDe(x) : precioDe(x) - precioDe(y);
      }).forEach(function (li) { grillaEquipos.appendChild(li); });
    };
    ordenar();
    if (ordenPrecio) ordenPrecio.addEventListener('change', ordenar);

    // sin tildes ni mayúsculas, para que "frio" encuentre "frío"
    const normalizar = function (s) {
      return s.normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '').toLowerCase().trim();
    };

    const catalogoCuenta = document.getElementById('catalogo-cuenta');
    const filtrosActivos = document.getElementById('filtros-activos');
    const limpiarFiltros = document.getElementById('limpiar-filtros');
    const lateral = document.getElementById('carrito-lateral');
    const abrirFiltrosBtn = document.getElementById('abrir-filtros');
    const cerrarFiltrosBtn = document.getElementById('cerrar-filtros');

    const aplicarFiltros = function () {
      const busqueda = normalizar(buscadorEquipos ? buscadorEquipos.value : '');
      const techo = precioMax ? precioDesdeSlider(parseFloat(precioMax.value)) : Infinity;
      let visibles = 0;

      productos.forEach(function (li) {
        const coincideEstado = filtroEstado === 'todos' || li.dataset.estado === filtroEstado;
        const coincideCategoria = filtroCategoria === 'todos' || li.dataset.categoria === filtroCategoria;
        const coincidePrecio = !precioDe(li) || precioDe(li) <= techo;
        const texto = normalizar((li.dataset.nombre || '') + ' ' + (li.dataset.palabras || ''));
        const coincideTexto = !busqueda || texto.indexOf(busqueda) !== -1;
        const mostrar = coincideEstado && coincideCategoria && coincidePrecio && coincideTexto;

        li.classList.toggle('oculto', !mostrar);
        if (mostrar) visibles++;
      });

      if (catalogoVacio) catalogoVacio.hidden = visibles > 0;
      if (catalogoCuenta) {
        catalogoCuenta.textContent = visibles === productos.length
          ? productos.length + ' productos'
          : visibles + ' de ' + productos.length + ' productos';
      }
      if (avisoBuscador) {
        avisoBuscador.textContent = visibles === productos.length
          ? ''
          : visibles + (visibles === 1 ? ' producto encontrado' : ' productos encontrados');
      }

      // cuántos filtros hay puestos: se ve en el botón "Filtros" del celular
      const activos = (filtroEstado !== 'todos') + (filtroCategoria !== 'todos') + (techo !== Infinity);
      if (filtrosActivos) {
        filtrosActivos.hidden = !activos;
        filtrosActivos.textContent = activos;
      }
      if (limpiarFiltros) limpiarFiltros.hidden = !activos;
      if (cerrarFiltrosBtn) cerrarFiltrosBtn.textContent = 'Ver ' + visibles + (visibles === 1 ? ' producto' : ' productos');
    };

    const elegir = function (grupo, chip) {
      grupo.querySelectorAll('.chip-filtro').forEach(function (b) {
        b.setAttribute('aria-pressed', b === chip ? 'true' : 'false');
      });
    };

    if (buscadorEquipos) {
      let demoraBusqueda = null;
      buscadorEquipos.addEventListener('input', function () {
        clearTimeout(demoraBusqueda);
        demoraBusqueda = setTimeout(aplicarFiltros, 150);
      });
    }

    if (filtrosEquipos) {
      filtrosEquipos.addEventListener('click', function (e) {
        let chip = e.target.closest('.chip-filtro');
        if (!chip) return;
        // tocar de nuevo el que ya está elegido lo destilda
        if (chip.dataset.filtro !== 'todos' && chip.getAttribute('aria-pressed') === 'true') {
          chip = filtrosEquipos.querySelector('[data-filtro="todos"]');
        }
        filtroEstado = chip.dataset.filtro;
        elegir(filtrosEquipos, chip);
        aplicarFiltros();
      });
    }

    if (filtrosCategoria) {
      filtrosCategoria.addEventListener('click', function (e) {
        let chip = e.target.closest('.chip-filtro');
        if (!chip) return;
        // tocar de nuevo el que ya está elegido lo destilda
        if (chip.dataset.categoria !== 'todos' && chip.getAttribute('aria-pressed') === 'true') {
          chip = filtrosCategoria.querySelector('[data-categoria="todos"]');
        }
        filtroCategoria = chip.dataset.categoria;
        elegir(filtrosCategoria, chip);
        aplicarFiltros();
      });
    }

    const mostrarTecho = function () {
      if (!precioMax) return;
      const techo = precioDesdeSlider(parseFloat(precioMax.value));
      if (precioMaxValor) precioMaxValor.textContent = techo === Infinity ? 'Sin límite' : 'Hasta ' + formatoPrecio(techo);
    };
    if (precioMax) {
      precioMax.addEventListener('input', function () {
        mostrarTecho();
        aplicarFiltros();
      });
    }

    if (limpiarFiltros) {
      limpiarFiltros.addEventListener('click', function () {
        filtroEstado = 'todos';
        filtroCategoria = 'todos';
        if (filtrosEquipos) elegir(filtrosEquipos, filtrosEquipos.querySelector('[data-filtro="todos"]'));
        if (filtrosCategoria) elegir(filtrosCategoria, filtrosCategoria.querySelector('[data-categoria="todos"]'));
        if (precioMax) { precioMax.value = 1000; mostrarTecho(); }
        aplicarFiltros();
      });
    }

    // celular: la barra lateral se abre arriba del catálogo
    const filtrosAbiertos = function (si) {
      if (!lateral) return;
      lateral.classList.toggle('abierta', si);
      if (abrirFiltrosBtn) abrirFiltrosBtn.setAttribute('aria-expanded', si ? 'true' : 'false');
      if (si && cerrarFiltrosBtn) cerrarFiltrosBtn.focus();
    };
    if (abrirFiltrosBtn) abrirFiltrosBtn.addEventListener('click', function () { filtrosAbiertos(true); });
    if (cerrarFiltrosBtn) {
      cerrarFiltrosBtn.addEventListener('click', function () {
        filtrosAbiertos(false);
        grillaEquipos.scrollIntoView({ block: 'start', behavior: quietito ? 'auto' : 'smooth' });
      });
    }

    aplicarFiltros();

    /* precios en vivo: Mateo los publica desde el presupuestador y quedan en
       la planilla del negocio. Si no llegan, quedan los que están en el HTML.
       Cada producto se reconoce por el código de la lista (lo que va después
       del primer guion en data-id: "gas-128001000001" -> "128001000001"). */
    /* equipos destacados en la página: copias de las tarjetas del
       catálogo. "Agregar" en la copia toca el botón del original. */
    const destacados = document.getElementById('destacados');
    const destacadosTotal = document.getElementById('destacados-total');
    if (destacadosTotal) destacadosTotal.textContent = '(' + productos.length + ')';
    const pintarDestacados = function () {
      if (!destacados) return;
      destacados.innerHTML = '';
      (destacados.dataset.ids || '').split(',').forEach(function (id) {
        const original = grillaEquipos.querySelector('.producto[data-id="' + CSS.escape(id.trim()) + '"]');
        if (!original) return;
        const copia = original.cloneNode(true);
        copia.classList.remove('oculto');
        const img = copia.querySelector('img');
        if (img) {
          img.loading = 'lazy';
          if (img.complete && img.naturalWidth) img.classList.add('cargada');
          else img.addEventListener('load', function () { img.classList.add('cargada'); }, { once: true });
        }
        destacados.appendChild(copia);
      });
    };
    pintarDestacados();
    if (destacados) {
      destacados.addEventListener('click', function (e) {
        const boton = e.target.closest('.producto__agregar');
        if (!boton) return;
        const li = boton.closest('.producto');
        const original = grillaEquipos.querySelector('.producto[data-id="' + CSS.escape(li.dataset.id) + '"] .producto__agregar');
        if (!original) return;
        original.click();
        if (li.classList.contains('producto--consultar')) return;
        boton.classList.add('agregado');
        boton.textContent = 'Agregado';
        setTimeout(function () {
          boton.classList.remove('agregado');
          boton.textContent = 'Agregar';
        }, 1200);
      });
    }

    // "02/11/2026" -> 20261102, para comparar fechas
    const fechaNumero = function (texto) {
      const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(texto || '');
      return m ? Number(m[3] + m[2] + m[1]) : 0;
    };
    const aplicarPreciosWeb = function (r) {
      if (!r || !r.ok || !r.precios) return;
      // si la planilla es más vieja que los precios escritos en la página
      // (se cargó una lista nueva a mano y todavía no se publicó desde el
      // presupuestador), mandan los de la página
      const nota = document.querySelector('.catalogo__nota');
      if (nota && fechaNumero(r.fecha) && fechaNumero(r.fecha) < fechaNumero(nota.textContent)) return;
      let cambios = 0;
      productos.forEach(function (li) {
        // el código va sin el prefijo de marca; los que no tienen marca
        // (split-usado, portatil-usado…) van con el data-id completo
        let ref = li.dataset.id;
        if (!(ref in r.precios)) ref = ref.slice(ref.indexOf('-') + 1);
        if (!(ref in r.precios)) return;
        const nuevo = Math.round(Number(r.precios[ref]) || 0);
        if (nuevo === precioDe(li)) return;
        li.dataset.precio = nuevo || '';
        marcarPrecio(li);
        cambios++;
      });
      if (nota && r.fecha) nota.textContent = nota.textContent.replace(/al \d{2}\/\d{2}\/\d{4}/, 'al ' + r.fecha);
      if (!cambios) return;
      calcularRango();
      mostrarTecho();
      ordenar();
      aplicarFiltros();
      pintarDestacados();
      cargarCarrito();
      pintarCarrito();
    };
    if (APPS_SCRIPT_URL) {
      fetch(APPS_SCRIPT_URL + '?precios=1')
        .then(function (res) { return res.json(); })
        .then(aplicarPreciosWeb)
        .catch(function () { /* quedan los precios del HTML */ });
    }

    grillaEquipos.addEventListener('click', function (e) {
      const boton = e.target.closest('.producto__agregar');
      if (!boton) return;

      const li = boton.closest('.producto');
      if (!li) return;

      if (!(parseFloat(li.dataset.precio) > 0)) {
        window.open(armarLink('Hola Mateo, quería consultar el precio de: ' + li.dataset.nombre), '_blank', 'noopener');
        return;
      }

      const foto = li.querySelector('img');

      agregarAlCarrito({
        id: li.dataset.id,
        nombre: li.dataset.nombre,
        precio: parseFloat(li.dataset.precio) || 0,
        foto: foto ? foto.currentSrc || foto.src : ''
      });

      boton.classList.add('agregado');
      const textoOriginal = boton.textContent;
      boton.textContent = 'Agregado';
      setTimeout(function () {
        boton.classList.remove('agregado');
        boton.textContent = textoOriginal;
      }, 1200);

      if (abrirCarritoBtn) {
        abrirCarritoBtn.classList.remove('late');
        void abrirCarritoBtn.offsetWidth; // fuerza el reflow para que la animación arranque de nuevo
        abrirCarritoBtn.classList.add('late');
      }
    });
  }

  /* El video de fondo del hero (img/hero-fondo.mp4) entra con un
     fundido. Se muestra siempre, aunque Windows tenga apagadas las
     animaciones: es una toma lenta y es la cara de la web. Si no
     está el archivo, se ve el degradé de siempre y ya. */
  /* cuandoCerca(elemento, fn): fn corre una sola vez, cuando la sección
     del elemento está a menos de ~1 pantalla de verse. Así las portadas
     de los videos de más abajo no bajan al abrir la página. */
  const esperandoCerca = new Map();
  const vigiaCerca = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      const fns = esperandoCerca.get(entrada.target) || [];
      esperandoCerca.delete(entrada.target);
      vigiaCerca.unobserve(entrada.target);
      fns.forEach(function (fn) { fn(); });
    });
  }, { rootMargin: '900px 0px' }) : null;
  const cuandoCerca = function (elemento, fn) {
    if (!vigiaCerca) { fn(); return; }
    const zona = elemento.closest('section') || elemento;
    if (!esperandoCerca.has(zona)) { esperandoCerca.set(zona, []); vigiaCerca.observe(zona); }
    esperandoCerca.get(zona).push(fn);
  };

  /* Para que la web abra liviana, el video empieza a bajar recién cuando
     terminó de cargar la página; mientras tanto se ve la foto del primer
     cuadro (fondo del .hero). Con "ahorro de datos" o conexión muy lenta
     queda solo la foto. */
  const heroVideo = document.getElementById('hero-video');
  const conexion = navigator.connection || {};
  const ahorrarDatos = conexion.saveData === true || /(^|-)2g$/.test(conexion.effectiveType || '');
  if (heroVideo && !ahorrarDatos) {
    let heroArrancado = false;
    let heroALaVista = true;
    const mostrarHeroVideo = function () { heroVideo.classList.add('cargada'); };
    heroVideo.addEventListener('loadeddata', mostrarHeroVideo);
    const arrancarHero = function () {
      if (heroArrancado) return;
      heroArrancado = true;
      heroVideo.preload = 'auto';
      if (heroALaVista) heroVideo.play().catch(function () { /* el navegador lo frenó, no pasa nada */ });
      else heroVideo.load();
    };
    if (document.readyState === 'complete') setTimeout(arrancarHero, 0);
    else window.addEventListener('load', function () { setTimeout(arrancarHero, 0); });

    // cuando el hero sale de pantalla el video se pausa: así el resto
    // de la página scrollea sin la placa de video trabajando de fondo
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        heroALaVista = entradas[0].isIntersecting;
        if (!heroArrancado) return;
        if (heroALaVista) {
          heroVideo.play().catch(function () { /* nada */ });
        } else {
          heroVideo.pause();
        }
      }, { threshold: 0 }).observe(heroVideo);
    }
  }

  /* El banner frío / calor / luz: anda solo mientras se ve. Como el
     hero, se reproduce aunque Windows tenga apagadas las animaciones. */
  const franjaVideo = document.getElementById('franja-video');
  // la portada y el video bajan recién cuando el banner está cerca
  if (franjaVideo) cuandoCerca(franjaVideo, function () {
    if (franjaVideo.dataset.poster) franjaVideo.poster = franjaVideo.dataset.poster;
    franjaVideo.preload = 'metadata';
  });
  if (franjaVideo && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) {
        franjaVideo.play().catch(function () { /* nada */ });
      } else {
        franjaVideo.pause();
      }
    }, { threshold: .3 }).observe(franjaVideo);
  }

  /* ---------------------------------------------------------
     5. La página entra en escena
     --------------------------------------------------------- */
  document.querySelectorAll('[data-entra]').forEach(function (pieza, i) {
    pieza.style.setProperty('--d', (i * 110) + 'ms');
  });
  requestAnimationFrame(function () { document.body.classList.add('cargado'); });

  /* Lo que aparece a medida que se baja.
     Cada grupo entra escalonado, no todo de golpe. */
  const apariciones = Array.prototype.slice.call(document.querySelectorAll('[data-revelar]'));

  apariciones.forEach(function (pieza) {
    const hermanos = Array.prototype.slice.call(
      pieza.parentElement.querySelectorAll(':scope > [data-revelar]')
    );
    const lugar = Math.min(hermanos.indexOf(pieza), 5);
    pieza.style.setProperty('--d', (lugar * 90) + 'ms');
  });

  if (quietito || !('IntersectionObserver' in window)) {
    apariciones.forEach(function (p) { p.classList.add('adentro'); });
  } else {
    const vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('adentro');
        vigia.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });

    apariciones.forEach(function (p) { vigia.observe(p); });
  }

  /* ---------------------------------------------------------
     6. Arrastre con el mouse en todo lo que se desliza
        (en el celular el dedo ya lo hace el navegador)
     --------------------------------------------------------- */
  // deslizamiento propio, lento y con frenada suave (el "smooth" del
  // navegador es corto y el imán de las tarjetas da un tirón al final)
  const deslizarSuave = function (pista, destino, duracion) {
    const max = pista.scrollWidth - pista.clientWidth;
    destino = Math.max(0, Math.min(max, destino));
    const desde = pista.scrollLeft;
    const distancia = destino - desde;
    if (pista._deslizando) cancelAnimationFrame(pista._deslizando);
    if (Math.abs(distancia) < 1 || quietito) { pista.scrollLeft = destino; return; }
    const t = duracion || Math.min(900, 420 + Math.abs(distancia) * .35);
    const inicio = performance.now();
    pista.style.scrollSnapType = 'none';
    const paso = function (ahora) {
      const p = Math.min(1, (ahora - inicio) / t);
      const e = 1 - Math.pow(1 - p, 3); // frena despacio al final
      pista.scrollLeft = desde + distancia * e;
      if (p < 1) { pista._deslizando = requestAnimationFrame(paso); return; }
      pista._deslizando = 0;
      pista.style.scrollSnapType = '';
    };
    pista._deslizando = requestAnimationFrame(paso);
  };
  // dónde queda centrada la tarjeta más cercana a una posición
  const centrarCerca = function (pista, posicion) {
    const mitad = pista.clientWidth / 2;
    let mejor = posicion;
    let menor = Infinity;
    const borde = pista.getBoundingClientRect().left - pista.scrollLeft;
    Array.prototype.forEach.call(pista.children, function (hijo) {
      const caja = hijo.getBoundingClientRect();
      if (!caja.width) return; // tarjetas ocultas por un filtro
      const centro = caja.left - borde + caja.width / 2 - mitad;
      const d = Math.abs(centro - posicion);
      if (d < menor) { menor = d; mejor = centro; }
    });
    return mejor;
  };

  const habilitarArrastre = function (caja) {
    let apretado = false;
    let ultimoX = 0;
    let ultimoT = 0;
    let velocidad = 0;
    let xInicial = 0;
    let scrollInicial = 0;
    let recorrido = 0;

    caja.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      apretado = true;
      recorrido = 0;
      xInicial = e.clientX;
      ultimoX = e.clientX;
      ultimoT = performance.now();
      velocidad = 0;
      if (caja._deslizando) { cancelAnimationFrame(caja._deslizando); caja._deslizando = 0; }
      scrollInicial = caja.scrollLeft;
    });

    caja.addEventListener('pointermove', function (e) {
      if (!apretado) return;
      const dx = e.clientX - xInicial;
      recorrido = Math.max(recorrido, Math.abs(dx));
      caja.scrollLeft = scrollInicial - dx;
      const ahora = performance.now();
      if (ahora > ultimoT) velocidad = (e.clientX - ultimoX) / (ahora - ultimoT);
      ultimoX = e.clientX;
      ultimoT = ahora;
      // recién cuando se mueve de verdad es un arrastre: si se marcara al
      // apretar, las fotos dejan de recibir el clic (y no abre el visor)
      if (recorrido > 4) {
        caja.classList.add('arrastrando');
        e.preventDefault();
      }
    });

    const soltar = function () {
      if (!apretado) return;
      apretado = false;
      // al soltar sigue un poco con el envión y se acomoda despacio en la
      // tarjeta más cercana (en vez del salto del imán)
      if (recorrido > 4 && !caja.classList.contains('atajos')) {
        const envion = performance.now() - ultimoT < 80 ? velocidad * 260 : 0;
        deslizarSuave(caja, centrarCerca(caja, caja.scrollLeft - envion));
      }
      caja.classList.remove('arrastrando');

      // Si arrastró de verdad, que no se dispare el clic del enlace
      if (recorrido > 8) {
        caja.dataset.arrastro = '1';
        setTimeout(function () { delete caja.dataset.arrastro; }, 60);
      }
    };

    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', soltar);
    caja.addEventListener('pointerleave', soltar);

    caja.addEventListener('click', function (e) {
      if (caja.dataset.arrastro) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    caja.addEventListener('dragstart', function (e) { e.preventDefault(); });
  };

  document.querySelectorAll('.carril, .trabajos__grilla, .atajos')
    .forEach(habilitarArrastre);

  /* ---------------------------------------------------------
     7. Fotos y videos: la misma lógica de carga sirve en Servicios,
        el catálogo de Equipos y Trabajos hechos. Un
        <figure data-marca="..."> con un <img> o <video> adentro ya
        sabe fundirse al entrar y mostrar el cartelito prolijo si
        el archivo todavía no existe.
     --------------------------------------------------------- */
  const prepararMedio = function (figura) {
    const medio = figura.querySelector('img, video');
    if (!medio) return;

    const esVideo = medio.tagName === 'VIDEO';

    if (esVideo) {
      medio.muted = true;
      medio.loop = true;
      medio.playsInline = true;
      medio.controls = false;
    }

    // sin IntersectionObserver no hay forma de saber si se ve: se da por visible
    let aLaVista = !('IntersectionObserver' in window);

    const lista = function () {
      medio.classList.add('cargada');
      figura.classList.add('lista');
      if (esVideo && aLaVista) medio.play().catch(function () { /* el navegador lo frenó, no pasa nada */ });
    };
    const fallo = function () {
      figura.classList.add('sin-foto', 'lista');
      // en "Trabajos hechos" solo van trabajos reales: si la foto todavía
      // no está, la tarjeta no se muestra (aparece sola cuando se sube)
      const trabajo = figura.closest('.trabajo');
      if (trabajo) {
        trabajo.hidden = true;
        document.dispatchEvent(new Event('trabajos-cambiaron'));
      }
    };

    // un video que no se ve, no se reproduce: así la página scrollea liviana.
    // Como el hero, andan aunque Windows tenga apagadas las animaciones
    // (son tomas mudas y en loop; con controles se veían desprolijos)
    if (esVideo && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        aLaVista = entradas[0].isIntersecting;
        if (aLaVista) {
          if (medio.classList.contains('cargada')) medio.play().catch(function () { /* nada */ });
        } else {
          medio.pause();
        }
      }, { threshold: 0, rootMargin: '150px' }).observe(medio);
    }

    // la portada (data-poster) se pone recién cuando la sección está cerca
    if (esVideo && medio.dataset.poster && !medio.poster) {
      cuandoCerca(figura, function () {
        medio.poster = medio.dataset.poster;
        prepararVideo(medio, lista, fallo);
      });
    } else if (esVideo) {
      prepararVideo(medio, lista, fallo);
    } else if (medio.complete) {
      if (medio.naturalWidth > 0) lista(); else fallo();
    } else {
      medio.addEventListener('load', lista);
      medio.addEventListener('error', fallo);
    }
  };

  // con preload="none" el video baja recién cuando se ve; mientras
  // tanto alcanza con la portada (poster) para mostrar la tarjeta
  function prepararVideo(medio, lista, fallo) {
    let yaLista = false;
    const listaUnaVez = function () { if (!yaLista) { yaLista = true; lista(); } };
    if (medio.readyState >= 1) { listaUnaVez(); return; }
    // si el video no baja pero la portada sí, la tarjeta queda con la
    // portada: solo se esconde si fallan los dos
    let portadaOk = !medio.poster ? false : null;
    let videoFallo = false;
    medio.addEventListener('loadedmetadata', listaUnaVez);
    medio.addEventListener('loadeddata', listaUnaVez);
    medio.addEventListener('error', function () {
      videoFallo = true;
      if (portadaOk === false) fallo();
    });
    if (medio.poster) {
      const portada = new Image();
      portada.onload = function () { portadaOk = true; listaUnaVez(); };
      portada.onerror = function () { portadaOk = false; if (videoFallo) fallo(); };
      portada.src = medio.poster;
    }
  }

  /* tarjetas de Servicios y productos del catálogo que llevan foto */
  document.querySelectorAll('.tarjeta--medio figure, .producto figure').forEach(prepararMedio);

  /* ---------------------------------------------------------
     8. Visor de fotos: cualquier foto de Trabajos hechos se
        agranda al tocarla. Lo abre la sección 9, más abajo,
        pasándole la lista de fotos que corresponda.
     --------------------------------------------------------- */
  const visor = document.getElementById('visor');
  const visorImg = document.getElementById('visor-img');
  const visorPie = document.getElementById('visor-pie');
  const visorCerrarBtn = document.getElementById('visor-cerrar');
  const visorAnteriorBtn = document.getElementById('visor-anterior');
  const visorSiguienteBtn = document.getElementById('visor-siguiente');
  const visorMiniaturas = document.getElementById('visor-miniaturas');

  let visorFotos = [];
  let visorIndice = 0;
  let visorOrigen = null; // la foto que se tocó, para devolverle el foco al cerrar

  const pintarMiniaturasVisor = function () {
    if (!visorMiniaturas) return;
    visorMiniaturas.innerHTML = '';
    visorFotos.forEach(function (foto, indice) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'visor__miniatura' + (indice === visorIndice ? ' activa' : '');
      boton.setAttribute('aria-label', 'Ver foto ' + (indice + 1));
      if (indice === visorIndice) boton.setAttribute('aria-current', 'true');
      const mini = document.createElement('img');
      mini.src = foto.src;
      mini.alt = '';
      boton.appendChild(mini);
      boton.addEventListener('click', function () {
        visorIndice = indice;
        pintarVisor();
      });
      visorMiniaturas.appendChild(boton);
    });
  };

  const pintarVisor = function () {
    const foto = visorFotos[visorIndice];
    if (!foto || !visorImg) return;
    visorImg.src = foto.src;
    visorImg.alt = foto.alt || '';
    if (visorPie) {
      visorPie.textContent = foto.titulo || '';
      if (foto.detalle) {
        const chico = document.createElement('small');
        chico.textContent = foto.detalle;
        visorPie.appendChild(chico);
      }
    }

    const variasFotos = visorFotos.length > 1;
    if (visorAnteriorBtn) visorAnteriorBtn.hidden = !variasFotos;
    if (visorSiguienteBtn) visorSiguienteBtn.hidden = !variasFotos;
    pintarMiniaturasVisor();
  };

  const abrirVisor = function (fotos, indice, modo) {
    if (!visor || !fotos.length) return;
    visor.dataset.modo = modo || '';
    visorOrigen = document.activeElement;
    visorFotos = fotos;
    visorIndice = indice;
    pintarVisor();
    visor.classList.add('abierto');
    visor.inert = false;
    actualizarBloqueoScroll();
    if (visorCerrarBtn) visorCerrarBtn.focus();
  };

  const cerrarVisor = function () {
    if (!visor || !visor.classList.contains('abierto')) return;
    visor.classList.remove('abierto');
    visor.inert = true;
    actualizarBloqueoScroll();
    if (visorOrigen && visorOrigen.focus) visorOrigen.focus();
  };

  const moverVisor = function (direccion) {
    if (visorFotos.length < 2) return;
    visorIndice = (visorIndice + direccion + visorFotos.length) % visorFotos.length;
    pintarVisor();

    // la foto nueva entra deslizándose desde el lado hacia donde se fue
    if (visorImg && !quietito) {
      visorImg.classList.remove('entra-derecha', 'entra-izquierda');
      void visorImg.offsetWidth; // reinicia la animación
      visorImg.classList.add(direccion > 0 ? 'entra-derecha' : 'entra-izquierda');
    }
  };

  if (visorCerrarBtn) visorCerrarBtn.addEventListener('click', cerrarVisor);
  if (visorAnteriorBtn) visorAnteriorBtn.addEventListener('click', function () { moverVisor(-1); });
  if (visorSiguienteBtn) visorSiguienteBtn.addEventListener('click', function () { moverVisor(1); });

  // tocar el fondo oscuro también cierra, tocar la foto no
  if (visor) {
    visor.addEventListener('click', function (e) {
      if (e.target === visor) cerrarVisor();
    });
  }

  document.addEventListener('click', function (e) {
    const img = e.target.closest('.producto figure img');
    if (!img || !img.classList.contains('cargada')) return;
    const grilla = img.closest('#grilla-equipos, #destacados');
    if (!grilla) return;
    if (grilla.dataset.arrastro) return; // fue un arrastre, no un toque
    const visibles = Array.prototype.filter.call(grilla.querySelectorAll('.producto'), function (li) {
      return !li.hidden && li.offsetParent !== null && li.querySelector('figure img');
    });
    const fotos = visibles.map(function (li) {
      const im = li.querySelector('figure img');
      const precio = parseFloat(li.dataset.precio) || 0;
      const unidad = li.dataset.unidad === 'm' ? ' por metro' : '';
      const ilustrativa = li.querySelector('.producto__ilustrativa') ? ' · Foto ilustrativa' : '';
      return {
        // la versión grande (1600x1200) se baja recién al abrir el visor
        src: im.dataset.grande || im.currentSrc || im.src,
        alt: im.alt,
        titulo: li.dataset.nombre || '',
        detalle: (precio ? formatoPrecio(precio) + unidad : 'Consultar precio') + ilustrativa
      };
    });
    abrirVisor(fotos, Math.max(0, visibles.indexOf(img.closest('.producto'))), 'producto');
  });

  document.addEventListener('keydown', function (e) {
    if (!visor || !visor.classList.contains('abierto')) return;
    if (e.key === 'ArrowRight') moverVisor(1);
    if (e.key === 'ArrowLeft') moverVisor(-1);
  });

  /* ---------------------------------------------------------
     8b. Fichas de Servicios: tocar una tarjeta abre su ficha con
         Instalación, Mantenimiento y el botón de mano de obra.
         Todas las fichas viven en #ficha y se muestra solo la que
         tiene el mismo data-ficha que la tarjeta.
     --------------------------------------------------------- */
  const ficha = document.getElementById('ficha');
  const fichaCerrarBtn = document.getElementById('ficha-cerrar');
  let fichaOrigen = null;

  const abrirFicha = function (id) {
    if (!ficha) return;
    let elegida = null;
    ficha.querySelectorAll('.ficha__servicio').forEach(function (art) {
      const esta = art.dataset.ficha === id;
      art.hidden = !esta;
      if (esta) elegida = art;
    });
    if (!elegida) return;
    const titulo = elegida.querySelector('.ficha__titulo');
    ficha.setAttribute('aria-label', titulo ? titulo.textContent : 'Servicio');
    fichaOrigen = document.activeElement;
    ficha.classList.add('abierto');
    ficha.inert = false;
    ficha.querySelector('.ficha__caja').scrollTop = 0;
    actualizarBloqueoScroll();
    if (fichaCerrarBtn) fichaCerrarBtn.focus({ preventScroll: true });
  };

  // devolverFoco = false cuando se cierra para abrir el carrito
  const cerrarFicha = function (devolverFoco) {
    if (!ficha || !ficha.classList.contains('abierto')) return;
    ficha.classList.remove('abierto');
    ficha.inert = true;
    actualizarBloqueoScroll();
    if (devolverFoco !== false && fichaOrigen && fichaOrigen.focus) fichaOrigen.focus({ preventScroll: true });
  };

  document.querySelectorAll('.servicio[data-ficha]').forEach(function (tarjeta) {
    tarjeta.addEventListener('click', function (e) {
      // la insignia "Lo que más instalamos" tiene su propio salto
      if (e.target.closest('.chip-destacado')) return;
      abrirFicha(tarjeta.dataset.ficha);
    });
  });

  if (ficha) {
    if (fichaCerrarBtn) fichaCerrarBtn.addEventListener('click', function () { cerrarFicha(); });
    // tocar afuera de la caja también cierra
    ficha.addEventListener('click', function (e) {
      if (e.target === ficha) cerrarFicha();
    });
    // "Ver productos": cierra la ficha y abre el carrito con el filtro puesto
    ficha.querySelectorAll('[data-abre-carrito]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        cerrarFicha(false);
        const cat = boton.dataset.categoriaCarrito;
        const chip = cat && document.querySelector('#filtros-categoria [data-categoria="' + cat + '"]');
        if (chip) chip.click();
      });
    });
  }

  /* ---------------------------------------------------------
     8c. Armá tu kit: se elige el tipo (tira LED, instalación de
         aire o seguridad), se completan las partes y sale la lista
         con las cantidades. Los nombres y precios se leen del
         catálogo; si todo tiene precio se puede sumar al carrito,
         si no, se pide por WhatsApp.
     --------------------------------------------------------- */
  const kit = document.getElementById('kit');
  const kitForm = document.getElementById('kit-form');
  const kitTipos = document.getElementById('kit-tipos');
  const kitLista = document.getElementById('kit-lista');
  const kitTotal = document.getElementById('kit-total');
  const kitTrafo = document.getElementById('kit-trafo');
  const kitWp = document.getElementById('kit-wp');
  const kitCarritoBtn = document.getElementById('kit-carrito');
  const kitInstalacion = document.getElementById('kit-instalacion');
  const kitCerrarBtn = document.getElementById('kit-cerrar');
  const kitBuscar = document.getElementById('kit-buscar');
  const kitSugerencias = document.getElementById('kit-sugerencias');
  const kitRubros = document.getElementById('kit-rubros');
  // rubros del mini buscador: tocás uno y aparecen todos sus productos,
  // sin tener que buscarlos. "Te puede servir" muestra lo que suele
  // acompañar al kit elegido
  const RUBROS_KIT = [
    ['sugeridos', 'Te puede servir'], ['aire', 'Aires'], ['kit', 'Kits de instalación'],
    ['cobre', 'Caños y aislantes'], ['gas', 'Gases'], ['quimicos', 'Selladores'],
    ['frio', 'Refrigeración'], ['electrico', 'Electricidad'], ['led', 'Iluminación LED'],
    ['seguridad', 'Seguridad']
  ];
  const ACOMPANAN = {
    led: ['led', 'electrico'],
    aire: ['kit', 'cobre', 'gas', 'quimicos'],
    seguridad: ['seguridad', 'electrico'],
    libre: []
  };
  // qué suele ir con cada rubro (para "Te puede servir" según lo que ya
  // tiene el kit, también en "A medida")
  const COMPLEMENTOS = {
    aire: ['kit', 'cobre', 'gas'], kit: ['cobre', 'gas', 'quimicos'],
    cobre: ['kit', 'gas', 'quimicos'], gas: ['quimicos', 'cobre'],
    quimicos: ['gas', 'cobre'], frio: ['gas', 'quimicos'],
    led: ['led', 'electrico'], electrico: ['led', 'seguridad'],
    seguridad: ['seguridad', 'electrico']
  };
  const rubrosSugeridos = function () {
    const lista = (ACOMPANAN[kitTipo] || []).slice();
    kitItems.forEach(function (p) {
      const cat = p.li && p.li.dataset.categoria;
      (COMPLEMENTOS[cat] || []).forEach(function (r) { if (lista.indexOf(r) === -1) lista.push(r); });
    });
    return lista;
  };
  let kitRubro = '';
  let kitTipo = 'led';
  let kitOrigen = null;
  let kitItems = [];
  // lo que se suma con el mini buscador: vale para cualquier tipo de kit
  let kitExtras = [];

  const productoDe = function (id) {
    return id ? document.querySelector('#grilla-equipos .producto[data-id="' + CSS.escape(id) + '"]') : null;
  };
  const elegido = function (nombre) {
    return kitForm ? kitForm.querySelector('[name="' + nombre + '"]:checked') : null;
  };
  const numero = function (nombre, minimo) {
    const campo = kitForm ? kitForm.querySelector('[name="' + nombre + '"]') : null;
    const n = campo ? Math.round(parseFloat(campo.value)) : 0;
    return isFinite(n) ? Math.max(minimo, n) : minimo;
  };

  // cada parte: el producto del catálogo, cuántos y en qué unidad.
  // Suma al total solo si se vende en esa misma unidad (data-unidad:
  // "m" por metro, "kg" por kilo; sin nada, por unidad) y tiene precio.
  const parte = function (id, cantidad, unidad, nota) {
    const li = productoDe(id);
    if (!li || !(cantidad > 0)) return null;
    const precio = unidad === (li.dataset.unidad || 'u') ? (parseFloat(li.dataset.precio) || 0) : 0;
    return { id: id, nombre: li.dataset.nombre, cantidad: cantidad, unidad: unidad, nota: nota || '', precio: precio, li: li };
  };

  const armarKitLed = function () {
    const tira = elegido('tira');
    const color = elegido('color');
    const metros = numero('metros', 1);
    const partes = [];

    const perfil = elegido('perfil');
    if (perfil && perfil.value) partes.push(parte(perfil.value, Math.ceil(metros / 2), 'u'));
    if (!tira) return partes;

    partes.unshift(parte(tira.value, Math.ceil(metros / 5), 'u', color ? 'luz ' + color.value : ''));

    // transformador: watts de la tira + 20% de margen, del mismo voltaje
    const voltios = tira.dataset.v;
    const necesita = Math.ceil(parseFloat(tira.dataset.w) * metros * 1.2);
    const chico = voltios === '24' ? 'demasled-fap-60-24v' : 'demasled-fap-60-12v';
    const grande = voltios === '24' ? 'demasled-fap-200-24v' : 'demasled-fap-200-12v';
    if (necesita <= 60) partes.push(parte(chico, 1, 'u'));
    else partes.push(parte(grande, Math.ceil(necesita / 200), 'u'));
    if (kitTrafo) {
      kitTrafo.textContent = 'Transformador: ' + metros + ' m de tira necesitan unos ' + necesita +
        ' W (con 20% de margen), a ' + voltios + 'V. Ya va en la lista.';
    }
    return partes;
  };

  // combo aire + kit + instalación: el equipo y el kit tienen precio;
  // la instalación (y el caño de más si la distancia pasa los 3 m del
  // kit) se confirma por WhatsApp
  const METROS_KIT = 3;
  const armarKitAire = function () {
    const partes = [];
    const equipo = elegido('equipo');
    if (equipo && equipo.value) partes.push(parte(equipo.value, 1, 'u'));
    const kitAire = elegido('kit-aire');
    if (kitAire && kitAire.value) {
      const metros = numero('metros-aire', 1);
      partes.push(parte(kitAire.value, 1, 'u', metros > METROS_KIT ? metros + ' m entre unidades: hay que sumar caño' : ''));
    }
    return partes;
  };
  // al elegir el equipo se marca el kit con las medidas de caño que le van
  if (kitForm) {
    kitForm.addEventListener('change', function (e) {
      if (e.target.name !== 'equipo') return;
      const id = e.target.dataset.kitInstalacion;
      const kitAire = id && kitForm.querySelector('[name="kit-aire"][value="' + id + '"]');
      if (kitAire) kitAire.checked = true;
    });
  }

  const armarKitSeguridad = function () {
    const partes = [];
    partes.push(parte('unv-ipc2122lb', numero('bullet', 0), 'u'));
    partes.push(parte('unv-ipc322lb', numero('domo', 0), 'u'));
    const alarma = kitForm.querySelector('[name="alarma"]');
    if (alarma && alarma.checked) partes.push(parte(alarma.value, 1, 'u'));
    const cerradura = elegido('cerradura');
    if (cerradura && cerradura.value) partes.push(parte(cerradura.value, 1, 'u'));
    return partes;
  };

  // los productos del mini buscador, sumados a los del kit: si ya están
  // (en la misma unidad) se suma la cantidad en vez de repetir la fila
  const sumarExtras = function (partes) {
    kitExtras.forEach(function (x) {
      const li = productoDe(x.id);
      if (!li) return;
      const unidad = li.dataset.unidad || 'u';
      const ya = partes.find(function (p) { return p.id === x.id && p.unidad === unidad; });
      if (ya) { ya.cantidad += x.cantidad; ya.extra = (ya.extra || 0) + x.cantidad; return; }
      const nueva = parte(x.id, x.cantidad, unidad);
      if (nueva) { nueva.extra = x.cantidad; partes.push(nueva); }
    });
    return partes;
  };

  const cambiarExtra = function (id, delta) {
    const x = kitExtras.find(function (e) { return e.id === id; });
    if (x) x.cantidad += delta;
    else if (delta > 0) kitExtras.push({ id: id, cantidad: delta });
    kitExtras = kitExtras.filter(function (e) { return e.cantidad > 0; });
    pintarKit();
    pintarSugerencias();
  };

  // mini buscador: todas las palabras tienen que estar, sin tildes ni
  // mayúsculas (sinTildes es la del buscador de toda la web, más abajo)
  const pintarSugerencias = function () {
    if (!kitSugerencias || !kitBuscar) return;
    // al sumar uno de abajo, la lista no vuelve al principio
    const clave = kitRubro + '|' + kitBuscar.value;
    const scrollPrevio = kitSugerencias.dataset.clave === clave ? kitSugerencias.scrollTop : 0;
    kitSugerencias.dataset.clave = clave;
    kitSugerencias.innerHTML = '';
    requestAnimationFrame(function () { kitSugerencias.scrollTop = scrollPrevio; });
    const palabras = sinTildes(kitBuscar.value).split(/\s+/).filter(Boolean);
    pintarRubros();
    if (!palabras.length && !kitRubro) return;
    const todos = Array.prototype.slice.call(document.querySelectorAll('#grilla-equipos .producto'));
    let hallados;
    if (palabras.length) {
      hallados = todos.filter(function (li) {
        const texto = sinTildes(li.dataset.nombre + ' ' + (li.dataset.palabras || ''));
        return palabras.every(function (p) { return texto.indexOf(p) !== -1; });
      });
    } else {
      // todo el rubro (o lo que acompaña al kit), sin lo que ya está en el kit
      const rubros = kitRubro === 'sugeridos' ? rubrosSugeridos() : [kitRubro];
      const enKit = {};
      kitItems.forEach(function (p) { if (!kitExtras.some(function (e) { return e.id === p.id; })) enKit[p.id] = true; });
      hallados = todos.filter(function (li) {
        return rubros.indexOf(li.dataset.categoria) !== -1 && !enKit[li.dataset.id];
      });
    }
    // los que muestran todo el rubro no se cortan: la lista tiene su propio scroll
    const tope = palabras.length ? 6 : hallados.length;
    kitSugerencias.classList.toggle('kit__sugerencias--rubro', !palabras.length);
    if (!hallados.length) {
      const nada = document.createElement('li');
      nada.className = 'kit__sin-resultados';
      nada.textContent = 'No encontramos eso. Igual podés pedirlo por WhatsApp.';
      kitSugerencias.appendChild(nada);
      return;
    }
    hallados.slice(0, tope).forEach(function (li) {
      const fila = document.createElement('li');
      const texto = document.createElement('span');
      texto.className = 'kit__sugerencia-nombre';
      texto.textContent = li.dataset.nombre;
      const precio = document.createElement('small');
      const valor = parseFloat(li.dataset.precio) || 0;
      precio.textContent = valor ? formatoPrecio(valor) + (li.dataset.unidad ? ' por ' + (li.dataset.unidad === 'm' ? 'metro' : li.dataset.unidad) : '') : 'Consultar precio';
      texto.appendChild(precio);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'kit__sumar';
      const ya = kitExtras.find(function (e) { return e.id === li.dataset.id; });
      boton.textContent = ya ? 'Sumar otro (' + ya.cantidad + ')' : 'Sumar';
      boton.addEventListener('click', function () { cambiarExtra(li.dataset.id, 1); });
      fila.appendChild(texto);
      fila.appendChild(boton);
      kitSugerencias.appendChild(fila);
    });
    if (hallados.length > tope) {
      const mas = document.createElement('li');
      mas.className = 'kit__sin-resultados';
      mas.textContent = 'Hay ' + (hallados.length - tope) + ' más: escribí algo más preciso.';
      kitSugerencias.appendChild(mas);
    }
  };
  // la fila de rubros: "Te puede servir" solo si el kit tiene acompañantes
  const pintarRubros = function () {
    if (!kitRubros) return;
    if (!kitRubros.children.length) {
      RUBROS_KIT.forEach(function (r) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip-filtro kit__rubro';
        b.dataset.rubro = r[0];
        b.textContent = r[1];
        kitRubros.appendChild(b);
      });
      kitRubros.addEventListener('click', function (e) {
        const b = e.target.closest('[data-rubro]');
        if (!b) return;
        // tocar el que ya está elegido lo suelta
        kitRubro = kitRubro === b.dataset.rubro ? '' : b.dataset.rubro;
        if (kitBuscar) kitBuscar.value = '';
        pintarSugerencias();
      });
    }
    const escribiendo = kitBuscar && kitBuscar.value.trim();
    Array.prototype.forEach.call(kitRubros.children, function (b) {
      if (b.dataset.rubro === 'sugeridos') b.hidden = !rubrosSugeridos().length;
      b.setAttribute('aria-pressed', !escribiendo && b.dataset.rubro === kitRubro ? 'true' : 'false');
    });
  };

  if (kitBuscar) {
    kitBuscar.addEventListener('input', pintarSugerencias);
    // Enter suma el primero de la lista
    kitBuscar.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const primero = kitSugerencias && kitSugerencias.querySelector('.kit__sumar');
      if (primero) primero.click();
    });
  }

  const kitConPrecio = function () {
    return kitItems.length > 0 && kitItems.every(function (p) { return p.precio > 0; });
  };

  const pintarKit = function () {
    if (!kitForm) return;
    if (kitTrafo) kitTrafo.textContent = '';
    const armar = { led: armarKitLed, aire: armarKitAire, seguridad: armarKitSeguridad, libre: function () { return []; } }[kitTipo];
    kitItems = sumarExtras(armar().filter(Boolean));

    if (kitLista) {
      kitLista.innerHTML = '';
      if (!kitItems.length) {
        const li = document.createElement('li');
        li.className = 'kit__vacio';
        li.textContent = kitTipo === 'libre' ? 'Tocá un rubro arriba y sumá lo que necesites.' : 'Elegí al menos una parte.';
        kitLista.appendChild(li);
      }
      kitItems.forEach(function (p) {
        const li = document.createElement('li');
        const cant = document.createElement('strong');
        cant.textContent = p.unidad === 'm' ? p.cantidad + ' m' : p.cantidad + ' ×';
        const nombre = document.createElement('span');
        nombre.textContent = p.nombre + (p.nota ? ' (' + p.nota + ')' : '');
        li.appendChild(cant);
        li.appendChild(nombre);
        // lo sumado con el buscador se puede subir, bajar o sacar
        if (p.extra) {
          const botones = document.createElement('span');
          botones.className = 'kit__cantidad';
          [['−', -1, 'Sacar uno de '], ['+', 1, 'Sumar uno más de ']].forEach(function (b) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = b[0];
            boton.setAttribute('aria-label', b[2] + p.nombre);
            boton.addEventListener('click', function () { cambiarExtra(p.id, b[1]); });
            botones.appendChild(boton);
          });
          li.appendChild(botones);
        }
        kitLista.appendChild(li);
      });
    }

    const conPrecio = kitConPrecio();
    const conInstalacion = kitInstalacion && kitInstalacion.checked;
    if (kitTotal) {
      kitTotal.textContent = !kitItems.length ? ''
        : conPrecio
          ? 'Total: ' + formatoPrecio(kitItems.reduce(function (a, p) { return a + p.precio * p.cantidad; }, 0)) + '*' +
            (conInstalacion ? ' + instalación (te la confirmamos por WhatsApp)' : '')
          : 'Algunas partes todavía no tienen precio en la web: te pasamos el total por WhatsApp.';
    }
    if (kitCarritoBtn) kitCarritoBtn.hidden = !conPrecio;

    if (kitWp) {
      const titulos = { led: 'kit de tira LED', aire: 'combo de aire + kit + instalación', seguridad: 'kit de seguridad', libre: 'kit a medida' };
      let texto = 'Hola Mateo, armé un ' + titulos[kitTipo] + ' en la web:\n';
      kitItems.forEach(function (p) {
        texto += '• ' + (p.unidad === 'm' ? p.cantidad + ' m de ' : p.cantidad + ' × ') + p.nombre + (p.nota ? ' (' + p.nota + ')' : '') + '\n';
      });
      const equipo = elegido('equipo');
      if (kitTipo === 'aire' && !(equipo && equipo.value)) texto += '• El equipo ya lo tengo\n';
      if (conInstalacion) texto += 'Lo quiero con instalación: ¿cuánto sale la mano de obra?\n';
      texto += '¿Me pasás el precio?';
      kitWp.href = armarLink(texto);
      kitWp.classList.toggle('desactivado', !kitItems.length);
    }
  };

  const elegirKit = function (tipo) {
    kitTipo = tipo;
    if (kitTipos) {
      kitTipos.querySelectorAll('[data-kit]').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.kit === tipo ? 'true' : 'false');
      });
    }
    if (kitForm) {
      kitForm.querySelectorAll('.kit__panel').forEach(function (panel) {
        panel.hidden = panel.dataset.kit !== tipo;
      });
    }
    pintarKit();
    if (kitRubro === 'sugeridos' && !rubrosSugeridos().length) kitRubro = '';
    else if (!kitRubro && rubrosSugeridos().length) kitRubro = 'sugeridos';
    // la lista se arma solo con el kit abierto (al cargar la página todavía
    // no está lista la función del buscador que usa)
    if (kit && kit.classList.contains('abierto')) pintarSugerencias();
  };

  const KIT_DE_RUBRO = { led: 'led', seguridad: 'seguridad', aire: 'aire', kit: 'aire', cobre: 'aire' };
  const abrirKit = function () {
    if (!kit) return;
    const filtro = document.querySelector('.chip-filtro[data-categoria][aria-pressed="true"]');
    const rubro = filtro && filtro.dataset.categoria !== 'todos' ? filtro.dataset.categoria : '';
    if (kitBuscar) kitBuscar.value = '';
    if (rubro) {
      kitRubro = rubro;
      elegirKit(KIT_DE_RUBRO[rubro] || 'libre');
    } else {
      pintarKit();
      kitRubro = rubrosSugeridos().length ? 'sugeridos' : '';
    }
    kitOrigen = document.activeElement;
    kit.classList.add('abierto');
    kit.inert = false;
    kit.querySelector('.ficha__caja').scrollTop = 0;
    actualizarBloqueoScroll();
    pintarKit();
    pintarSugerencias();
    if (kitCerrarBtn) kitCerrarBtn.focus({ preventScroll: true });
  };

  const cerrarKit = function (devolverFoco) {
    if (!kit || !kit.classList.contains('abierto')) return;
    kit.classList.remove('abierto');
    kit.inert = true;
    actualizarBloqueoScroll();
    if (devolverFoco !== false && kitOrigen && kitOrigen.focus) kitOrigen.focus({ preventScroll: true });
  };

  if (kit) {
    document.querySelectorAll('[data-abre-kit]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        abrirKit();
      });
    });
    if (kitCerrarBtn) kitCerrarBtn.addEventListener('click', function () { cerrarKit(); });
    kit.addEventListener('click', function (e) { if (e.target === kit) cerrarKit(); });
    if (kitTipos) {
      kitTipos.addEventListener('click', function (e) {
        const b = e.target.closest('[data-kit]');
        if (b) elegirKit(b.dataset.kit);
      });
    }
    if (kitForm) {
      // los radios se pueden destildar: si ya estaba elegido, tocarlo lo saca
      const recordar = function (e) {
        const label = e.target.closest('label');
        const radio = label ? label.querySelector('input[type="radio"]') : null;
        if (radio) radio.dataset.estaba = radio.checked ? '1' : '';
      };
      kitForm.addEventListener('pointerdown', recordar);
      kitForm.addEventListener('keydown', function (e) { if (e.key === ' ') recordar(e); });
      kitForm.addEventListener('click', function (e) {
        const radio = e.target.closest('input[type="radio"]');
        if (!radio || radio.dataset.estaba !== '1') return;
        radio.checked = false;
        radio.dataset.estaba = '';
        pintarKit();
      });
      kitForm.addEventListener('input', pintarKit);
      kitForm.addEventListener('change', pintarKit);
      kitForm.addEventListener('submit', function (e) { e.preventDefault(); });
    }
    if (kitInstalacion) kitInstalacion.addEventListener('change', pintarKit);
    if (kitWp) {
      kitWp.addEventListener('click', function (e) {
        if (!kitItems.length) e.preventDefault();
      });
    }
    if (kitCarritoBtn) {
      kitCarritoBtn.addEventListener('click', function () {
        if (!kitConPrecio()) return;
        kitItems.forEach(function (p) {
          const existe = pedido.find(function (x) { return x.id === p.id; });
          if (existe) existe.cantidad += p.cantidad;
          else {
            const foto = p.li.querySelector('img');
            pedido.push({ id: p.id, nombre: p.nombre, precio: p.precio, foto: foto ? foto.currentSrc || foto.src : '', cantidad: p.cantidad });
          }
        });
        guardarCarrito();
        pintarCarrito();
        cerrarKit(false);
        abrirCarrito();
        mostrarAviso('Kit agregado al carrito', 'verde');
      });
    }
    elegirKit('led');
  }

  /* ---------------------------------------------------------
     9. Trabajos hechos: filtro por rubro y visor de fotos.
        Las mismas fotos quedan a la vista u ocultas según el
        filtro elegido; el visor solo recorre las que están
        visibles en ese momento.
     --------------------------------------------------------- */
  const grillaTrabajos = document.getElementById('grilla-trabajos');
  const filtrosTrabajos = document.getElementById('filtros-trabajos');
  const trabajosVacio = document.getElementById('trabajos-vacio');
  const avisoFiltroTrabajos = document.getElementById('aviso-filtro-trabajos');

  if (grillaTrabajos) {
    const trabajos = Array.prototype.slice.call(grillaTrabajos.querySelectorAll('.trabajo'));

    // las fotos entran con fundido; si falta el archivo, el cartelito de siempre
    trabajos.forEach(function (li) { prepararMedio(li.querySelector('figure')); });

    let filtroTrabajos = 'todos';

    const aplicarFiltroTrabajos = function () {
      let visibles = 0;
      trabajos.forEach(function (li) {
        const mostrar = !li.hidden && (filtroTrabajos === 'todos' || li.dataset.categoria === filtroTrabajos);
        li.classList.toggle('oculto', !mostrar);
        if (mostrar) visibles++;
      });

      if (trabajosVacio) trabajosVacio.hidden = visibles > 0;
      // con pocas fotos los filtros no aportan: se esconden
      if (filtrosTrabajos) filtrosTrabajos.hidden = trabajos.filter(function (li) { return !li.hidden; }).length < 4;
      if (avisoFiltroTrabajos) {
        avisoFiltroTrabajos.textContent = filtroTrabajos === 'todos'
          ? ''
          : visibles + (visibles === 1 ? ' foto encontrada' : ' fotos encontradas');
      }
    };
    document.addEventListener('trabajos-cambiaron', function () { aplicarFiltroTrabajos(); });

    // elige un filtro y marca el chip que corresponde; la usan tanto
    // los chips de arriba de la grilla como el atajo desde Servicios
    const elegirFiltroTrabajos = function (valor) {
      filtroTrabajos = valor;
      if (filtrosTrabajos) {
        filtrosTrabajos.querySelectorAll('.chip-filtro').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.filtro === valor ? 'true' : 'false');
        });
      }
      aplicarFiltroTrabajos();
    };

    if (filtrosTrabajos) {
      filtrosTrabajos.addEventListener('click', function (e) {
        const chip = e.target.closest('.chip-filtro');
        if (!chip) return;
        // tocar de nuevo el que ya está elegido vuelve a "Todos"
        const yaEstaba = chip.dataset.filtro !== 'todos' && chip.getAttribute('aria-pressed') === 'true';
        elegirFiltroTrabajos(yaEstaba ? 'todos' : chip.dataset.filtro);
      });
    }

    // la insignia "Lo que más instalamos" de Servicios salta acá con el
    // filtro de LED ya puesto
    const verLedDestacado = document.getElementById('ver-led-destacado');
    if (verLedDestacado) {
      const irALed = function () {
        elegirFiltroTrabajos('led');
        document.getElementById('trabajos').scrollIntoView({ behavior: quietito ? 'auto' : 'smooth' });
      };
      verLedDestacado.addEventListener('click', irALed);
      verLedDestacado.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); irALed(); }
      });
    }

    // tocar una foto la agranda; el visor recorre solo las que
    // están visibles con el filtro puesto en ese momento
    trabajos.forEach(function (li) {
      const img = li.querySelector('img');
      if (!img) return;

      img.addEventListener('click', function () {
        if (!img.classList.contains('cargada')) return;

        // solo fotos (el video no entra al visor) y que estén a la vista.
        // Entran también las que todavía no bajaron (se cargan perezosas
        // al llegar a verlas): el visor las baja al mostrarlas
        const visibles = trabajos.filter(function (otro) {
          return !otro.hidden && !otro.classList.contains('oculto') &&
            otro.querySelector('img') && !otro.querySelector('figure.sin-foto');
        });
        const fotos = visibles.map(function (otro) {
          const im = otro.querySelector('img');
          const titulo = otro.querySelector('figcaption h3');
          return { src: im.currentSrc || im.src, alt: im.alt, titulo: titulo ? titulo.textContent : '' };
        });
        abrirVisor(fotos, visibles.indexOf(li));
      });
    });
  }

  /* ---------------------------------------------------------
     10. Caja de consulta: fotos + mensaje armado
     --------------------------------------------------------- */
  const entradaFotos = document.getElementById('fotos');
  const zona = document.getElementById('zona');
  const miniaturas = document.getElementById('miniaturas');
  const error = document.getElementById('error');
  const forma = document.getElementById('forma');
  const detalle = document.getElementById('detalle');
  const cuenta = document.getElementById('cuenta');
  const atajos = document.getElementById('atajos');
  const ayudaFotos = document.getElementById('fotos-ayuda');
  const botonEnviar = document.getElementById('enviar');

  const MAX_FOTOS = 3;
  const MAX_PESO = 8 * 1024 * 1024; // 8 MB
  let elegidas = [];

  const avisar = function (mensaje, campo) {
    if (!error) return;
    error.textContent = mensaje;
    error.hidden = false;
    if (campo) {
      campo.setAttribute('aria-invalid', 'true');
      campo.focus({ preventScroll: false });
    }
  };

  const limpiarAviso = function () {
    if (error) error.hidden = true;
    if (forma) {
      forma.querySelectorAll('[aria-invalid]').forEach(function (c) {
        c.removeAttribute('aria-invalid');
      });
    }
  };

  const contarFotos = function () {
    if (ayudaFotos) {
      ayudaFotos.textContent = elegidas.length
        ? elegidas.length + ' de ' + MAX_FOTOS + ' cargadas. Tocá para agregar otra.'
        : 'Sacá una con la cámara o elegí del carrete. Hasta 3.';
    }
    if (zona) zona.classList.toggle('llena', elegidas.length >= MAX_FOTOS);
  };

  const pintarMiniaturas = function () {
    if (!miniaturas) return;
    miniaturas.innerHTML = '';

    elegidas.forEach(function (archivo, indice) {
      const item = document.createElement('li');
      item.style.setProperty('animation-delay', (indice * 60) + 'ms');

      const img = document.createElement('img');
      img.alt = 'Foto ' + (indice + 1) + ': ' + archivo.name;
      img.src = URL.createObjectURL(archivo);
      img.addEventListener('load', function () { URL.revokeObjectURL(img.src); });

      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'quitar';
      quitar.innerHTML = '&times;';
      quitar.setAttribute('aria-label', 'Quitar foto ' + (indice + 1));
      quitar.addEventListener('click', function () {
        item.style.animationDelay = '0ms';
        item.classList.add('saliendo');
        setTimeout(function () {
          elegidas.splice(indice, 1);
          pintarMiniaturas();
          mostrarAviso('Foto quitada');
        }, quietito ? 0 : 200);
      });

      item.appendChild(img);
      item.appendChild(quitar);
      miniaturas.appendChild(item);
    });

    contarFotos();
  };

  const agregarFotos = function (lista) {
    limpiarAviso();
    let sumadas = 0;

    Array.prototype.forEach.call(lista, function (archivo) {
      if (!archivo.type.startsWith('image/')) {
        avisar('Solo se pueden adjuntar imágenes.');
        return;
      }
      if (archivo.size > MAX_PESO) {
        avisar('La foto "' + archivo.name + '" es muy pesada. Probá con una más liviana.');
        return;
      }
      if (elegidas.length >= MAX_FOTOS) {
        avisar('Podés adjuntar hasta ' + MAX_FOTOS + ' fotos.');
        return;
      }
      elegidas.push(archivo);
      sumadas++;
    });

    pintarMiniaturas();
    if (sumadas) {
      mostrarAviso(sumadas === 1 ? 'Foto agregada' : sumadas + ' fotos agregadas', 'verde');
    }
  };

  if (entradaFotos) {
    entradaFotos.addEventListener('change', function () {
      agregarFotos(entradaFotos.files);
      entradaFotos.value = '';
    });
  }

  if (zona) {
    ['dragenter', 'dragover'].forEach(function (evento) {
      zona.addEventListener(evento, function (e) {
        e.preventDefault();
        zona.classList.add('encima');
      });
    });
    ['dragleave', 'drop'].forEach(function (evento) {
      zona.addEventListener(evento, function (e) {
        e.preventDefault();
        zona.classList.remove('encima');
      });
    });
    zona.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) agregarFotos(e.dataTransfer.files);
    });
  }

  /* --- el textarea crece solo y lleva la cuenta --- */
  const estirar = function () {
    if (!detalle) return;
    detalle.style.height = 'auto';
    detalle.style.height = detalle.scrollHeight + 'px';
  };

  const contarLetras = function () {
    if (!detalle || !cuenta) return;
    const largo = detalle.value.length;
    cuenta.textContent = largo;
    cuenta.parentElement.classList.toggle('cerca', largo > 540);
  };

  /* --- atajos: un toque y queda escrito --- */
  if (atajos && detalle) {
    atajos.addEventListener('click', function (e) {
      const chip = e.target.closest('button');
      if (!chip) return;

      detalle.value = chip.dataset.texto;
      atajos.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('puesto', b === chip);
      });
      limpiarAviso();
      estirar();
      contarLetras();
      guardarBorrador();
      detalle.focus();
      detalle.setSelectionRange(detalle.value.length, detalle.value.length);
    });
  }

  /* --- guardamos lo escrito por si se cierra la página sin querer --- */
  const campos = ['nombre', 'rubro', 'zona-texto', 'detalle'];

  const guardarBorrador = function () {
    try {
      const datos = {};
      campos.forEach(function (id) {
        const nodo = document.getElementById(id);
        if (nodo) datos[id] = nodo.value;
      });
      localStorage.setItem(BORRADOR, JSON.stringify(datos));
    } catch (e) { /* si no deja guardar, seguimos igual */ }
  };

  const recuperarBorrador = function () {
    try {
      const crudo = localStorage.getItem(BORRADOR);
      if (!crudo) return;
      const datos = JSON.parse(crudo);
      let algo = false;

      campos.forEach(function (id) {
        const nodo = document.getElementById(id);
        if (nodo && datos[id]) {
          nodo.value = datos[id];
          // una opción que ya no existe deja el select vacío: vuelve a la primera
          if (nodo.tagName === 'SELECT' && nodo.selectedIndex < 0) nodo.selectedIndex = 0;
          algo = true;
        }
      });

      if (algo) mostrarAviso('Recuperamos lo que habías escrito');
    } catch (e) { /* nada */ }
  };

  const borrarBorrador = function () {
    try { localStorage.removeItem(BORRADOR); } catch (e) { /* nada */ }
  };

  if (forma) {
    recuperarBorrador();
    estirar();
    contarLetras();

    let demora = null;
    forma.addEventListener('input', function (e) {
      limpiarAviso();
      contarLetras();
      if (e.target === detalle) estirar();
      clearTimeout(demora);
      demora = setTimeout(guardarBorrador, 400);
    });

    forma.addEventListener('submit', function (e) {
      e.preventDefault();
      limpiarAviso();

      const nombre = document.getElementById('nombre');
      const rubro = document.getElementById('rubro');
      const barrio = document.getElementById('zona-texto');

      if (nombre.value.trim().length < 2) {
        avisar('Escribí tu nombre así sabemos con quién hablamos.', nombre);
        return;
      }
      if (detalle.value.trim().length < 10) {
        avisar('Contanos un poco más del trabajo, aunque sea en una línea.', detalle);
        return;
      }

      let mensaje = 'Hola Mateo! Soy ' + nombre.value.trim() + '.\n';
      mensaje += 'Necesito: ' + rubro.value + '\n';
      if (barrio.value.trim()) mensaje += 'Zona: ' + barrio.value.trim() + '\n';
      mensaje += '\n' + detalle.value.trim();
      if (elegidas.length) {
        mensaje += '\n\n(Te mando ' + elegidas.length +
          (elegidas.length === 1 ? ' foto' : ' fotos') + ' acá abajo.)';
      }

      if (botonEnviar) {
        const textoBoton = botonEnviar.querySelector('.btn__texto');
        botonEnviar.classList.add('listo');
        if (textoBoton) textoBoton.textContent = 'Abriendo WhatsApp…';
        setTimeout(function () {
          botonEnviar.classList.remove('listo');
          if (textoBoton) textoBoton.textContent = 'Enviar por WhatsApp';
        }, 2200);
      }

      mostrarAviso(
        elegidas.length ? 'Mensaje listo. Acordate de adjuntar las fotos con el clip.'
                        : 'Mensaje listo en WhatsApp',
        'verde'
      );

      borrarBorrador();
      window.open(armarLink(mensaje), '_blank', 'noopener');
    });
  }

  /* ---------------------------------------------------------
     11. Deslizar: flechas en los carruseles (en la PC, donde no
        hay dedo), swipe en el visor de fotos y cerrar el menú o
        el carrito empujándolos hacia el costado (en el celular)
     --------------------------------------------------------- */

  // flechas abajo de Servicios y Trabajos hechos (sin tapar tarjetas):
  // solo con mouse, y se apagan si no hay más para ver de ese lado
  document.querySelectorAll('.carril, .trabajos__grilla').forEach(function (pista) {
    const envoltorio = document.createElement('div');
    envoltorio.className = 'deslizable';
    pista.parentNode.insertBefore(envoltorio, pista);
    envoltorio.appendChild(pista);

    const fila = document.createElement('div');
    fila.className = 'deslizable__flechas';
    envoltorio.appendChild(fila);

    const flechas = ['anterior', 'siguiente'].map(function (lado) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deslizable__flecha deslizable__flecha--' + lado;
      b.textContent = lado === 'anterior' ? '‹' : '›';
      b.setAttribute('aria-label', lado === 'anterior' ? 'Ver anteriores' : 'Ver siguientes');
      b.addEventListener('click', function () {
        const salto = (lado === 'anterior' ? -1 : 1) * pista.clientWidth * .8;
        const desde = pista._deslizando ? pista._destino : pista.scrollLeft;
        pista._destino = centrarCerca(pista, desde + salto);
        deslizarSuave(pista, pista._destino, 750);
      });
      fila.appendChild(b);
      return b;
    });

    const actualizar = function () {
      const max = pista.scrollWidth - pista.clientWidth;
      flechas[0].disabled = pista.scrollLeft <= 4;
      flechas[1].disabled = pista.scrollLeft >= max - 4;
    };
    pista.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    // los filtros de Trabajos esconden fotos: el largo cambia
    new MutationObserver(actualizar).observe(pista, { subtree: true, attributes: true, attributeFilter: ['class'] });
    actualizar();
  });

  // visor: deslizar a los costados pasa de foto, hacia abajo lo cierra
  if (visor) {
    let x0 = null;
    let y0 = 0;
    visor.addEventListener('touchstart', function (e) {
      x0 = e.touches.length === 1 && !e.target.closest('.visor__miniaturas') ? e.touches[0].clientX : null;
      if (x0 !== null) y0 = e.touches[0].clientY;
    }, { passive: true });
    visor.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) moverVisor(dx < 0 ? 1 : -1);
      else if (dy > 90 && dy > Math.abs(dx) * 1.5) cerrarVisor();
    }, { passive: true });
  }

  // menú y carrito siguen al dedo; si se empujan lo suficiente hacia
  // su costado, se cierran (signo: -1 = hacia la izquierda)
  const deslizarParaCerrar = function (panel, signo, cerrar) {
    if (!panel) return;
    let x0 = null;
    let y0 = 0;
    let dx = 0;
    let horizontal = null;

    panel.addEventListener('touchstart', function (e) {
      x0 = null;
      if (e.touches.length !== 1 || e.target.closest('input[type="range"]')) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      dx = 0;
      horizontal = null;
    }, { passive: true });

    panel.addEventListener('touchmove', function (e) {
      if (x0 === null) return;
      const mx = e.touches[0].clientX - x0;
      const my = e.touches[0].clientY - y0;
      if (horizontal === null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) horizontal = Math.abs(mx) > Math.abs(my);
      if (!horizontal) return;
      dx = mx * signo > 0 ? mx : 0;
      panel.style.transition = 'none';
      panel.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: true });

    panel.addEventListener('touchend', function () {
      if (x0 === null) return;
      x0 = null;
      panel.style.transition = '';
      panel.style.transform = '';
      if (horizontal && Math.abs(dx) > 80) cerrar();
    });
  };
  deslizarParaCerrar(menu, -1, function () { cerrarMenu(false); });
  deslizarParaCerrar(carrito, 1, function () { cerrarCarrito(); });

  /* ---------------------------------------------------------
     12. Buscador de toda la web (la barra de arriba). También
        acepta preguntas y responde con lo que dice la web.
        El índice se arma solo con lo que ya está en la página:
        servicios, equipos, trabajos y preguntas. Si no encuentra
        nada, ofrece mandar la búsqueda por WhatsApp.
     --------------------------------------------------------- */
  const buscador = document.getElementById('buscador');
  const abrirBuscadorBtn = document.getElementById('abrir-buscador');
  const cerrarBuscadorBtn = document.getElementById('cerrar-buscador');
  const buscadorTexto = document.getElementById('buscador-texto');
  const buscadorResultados = document.getElementById('buscador-resultados');
  const buscadorSugerencias = document.getElementById('buscador-sugerencias');
  const buscadorAviso = document.getElementById('buscador-aviso');

  const sinTildes = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  };

  const textoDe = function (nodo, selector) {
    const n = nodo.querySelector(selector);
    return n ? n.textContent.trim() : '';
  };

  // lleva la vista hasta algo de la página y lo hace brillar un momento
  const resaltar = function (nodo) {
    nodo.scrollIntoView({ behavior: quietito ? 'auto' : 'smooth', block: 'center', inline: 'center' });
    nodo.classList.remove('resaltado');
    void nodo.offsetWidth;
    nodo.classList.add('resaltado');
    setTimeout(function () { nodo.classList.remove('resaltado'); }, 2200);
  };

  const indice = [];

  // cada servicio se encuentra también por lo que dice su ficha
  // (rubros, instalación y mantenimiento) y al tocarlo se abre la ficha
  document.querySelectorAll('#servicios .servicio[data-ficha]').forEach(function (li) {
    const fichaServicio = document.querySelector('.ficha__servicio[data-ficha="' + li.dataset.ficha + '"]');
    indice.push({
      tipo: 'Servicio', titulo: textoDe(li, 'h3'), detalle: textoDe(li, 'figcaption p'),
      extra: (fichaServicio ? fichaServicio.textContent : '') + ' instalacion mantenimiento mano de obra service',
      ir: function () {
        resaltar(li);
        setTimeout(function () { abrirFicha(li.dataset.ficha); }, quietito ? 0 : 500);
      }
    });
  });

  // solo el catálogo del carrito: los destacados son copias y saldrían repetidos
  document.querySelectorAll('#grilla-equipos .producto').forEach(function (li) {
    indice.push({
      tipo: 'Producto', titulo: li.dataset.nombre, detalle: parseFloat(li.dataset.precio) > 0 ? formatoPrecio(parseFloat(li.dataset.precio)) + '*' : 'Consultar precio',
      extra: li.dataset.palabras,
      ir: function () {
        abrirCarrito();
        // sin el filtro de rubro que haya quedado puesto (si no, podía no verse)
        const todosRubros = document.querySelector('#filtros-categoria [data-categoria="todos"]');
        if (todosRubros && todosRubros.getAttribute('aria-pressed') !== 'true') todosRubros.click();
        // el catálogo queda filtrado en ese equipo
        if (buscadorEquipos) {
          buscadorEquipos.value = li.dataset.nombre;
          buscadorEquipos.dispatchEvent(new Event('input'));
        }
        setTimeout(function () { resaltar(li); }, 400);
      }
    });
  });

  document.querySelectorAll('.trabajo').forEach(function (li) {
    const img = li.querySelector('img');
    indice.push({
      tipo: 'Trabajo hecho', titulo: textoDe(li, 'h3'), detalle: img ? img.alt : '',
      ir: function () {
        const todos = document.querySelector('#filtros-trabajos [data-filtro="todos"]');
        if (todos && li.classList.contains('oculto')) todos.click();
        resaltar(li);
      }
    });
  });

  // las preguntas frecuentes también se encuentran por las palabras
  // de data-palabras (otras formas de preguntar lo mismo)
  document.querySelectorAll('.faq__item').forEach(function (det) {
    indice.push({
      tipo: 'Pregunta', titulo: textoDe(det, 'summary'), detalle: textoDe(det, '.faq__caja'),
      extra: det.dataset.palabras || '',
      ir: function () { det.open = true; resaltar(det); }
    });
  });

  indice.forEach(function (r) {
    r.buscable = sinTildes([r.tipo, r.titulo, r.detalle, r.extra].join(' '));
    r.tituloBuscable = sinTildes(r.titulo);
    // para responder una pregunta frecuente cuenta su pregunta y sus
    // data-palabras, no el texto de la respuesta
    r.claves = r.tipo === 'Pregunta' ? sinTildes(r.titulo + ' ' + r.extra) : r.buscable;
  });

  /* Preguntas escritas como se habla ("¿cuánto sale un split?"):
     se sacan los signos y las palabras de relleno, y cada palabra
     se recorta un poco para que "instalar" encuentre "instalación". */
  const RELLENO = ('que cual cuales como donde cuando quien quienes el la lo los las un una unos unas ' +
    'de del al a en y o u para por con sin se me mi mis te tu tus su sus es son esta estan ser hay ' +
    'tienen tiene tenes hacen hace haces puedo pueden puede podes quiero queria necesito busco ' +
    'si no mas muy ya hola mateo ustedes vos yo nos les algo alguno alguna eso esto ese esa').split(' ');
  const PALABRAS_PRECIO = ['cuanto', 'cuantos', 'cuanta', 'sale', 'salen', 'cuesta', 'cuestan',
    'precio', 'precios', 'vale', 'valen', 'costo', 'cobran', 'cobras'];

  const leerConsulta = function (consulta) {
    const crudas = sinTildes(consulta).replace(/[¿?¡!.,;:()"']+/g, ' ').split(/\s+/).filter(Boolean);
    const precio = crudas.some(function (p) { return PALABRAS_PRECIO.indexOf(p) !== -1; });
    const pregunta = /[¿?]/.test(consulta) || precio ||
      ['que', 'cual', 'como', 'donde', 'cuando', 'quien', 'hacen', 'tienen', 'puedo', 'instalan', 'trabajan']
        .indexOf(crudas[0]) !== -1;
    const palabras = crudas
      .filter(function (p) { return RELLENO.indexOf(p) === -1 && PALABRAS_PRECIO.indexOf(p) === -1; })
      .map(function (p) { return p.length >= 6 ? p.slice(0, p.length - 2) : p.length === 5 ? p.slice(0, 4) : p; });
    return { palabras: palabras, precio: precio, pregunta: pregunta };
  };

  const buscar = function (lectura) {
    const palabras = lectura.palabras;
    if (!palabras.length) return [];
    const puntuados = indice.map(function (r) {
      const coinciden = palabras.filter(function (p) { return r.buscable.indexOf(p) !== -1; }).length;
      const enTitulo = palabras.filter(function (p) { return r.tituloBuscable.indexOf(p) !== -1; }).length;
      return { r: r, coinciden: coinciden, puntos: coinciden * 2 + enTitulo };
    });
    // primero lo que tiene todas las palabras; si nada las tiene todas
    // (pasa con las preguntas largas), lo que tiene al menos la mitad
    let elegidos = puntuados.filter(function (x) { return x.coinciden === palabras.length; });
    if (!elegidos.length) {
      const minimo = Math.max(1, Math.ceil(palabras.length / 2));
      elegidos = puntuados.filter(function (x) { return x.coinciden >= minimo; });
    }
    return elegidos
      .sort(function (a, b) { return b.puntos - a.puntos; })
      .slice(0, 12)
      .map(function (x) { return x.r; });
  };

  // arma la respuesta con lo que ya dice la web: precio del catálogo,
  // respuesta de las preguntas frecuentes o lo que incluye un servicio
  const responder = function (lectura, encontrados) {
    if (!lectura.pregunta || !encontrados.length) return null;
    // solo responde si tiene todas las palabras de la pregunta: así
    // "¿trabajan los domingos?" no contesta con las zonas de trabajo
    const primeroDe = function (tipo) {
      for (let i = 0; i < encontrados.length; i++) {
        const r = encontrados[i];
        if (r.tipo === tipo && lectura.palabras.every(function (p) { return r.claves.indexOf(p) !== -1; })) return r;
      }
      return null;
    };
    const conPunto = function (s) { return s && !/[.!?]$/.test(s) ? s + '.' : s; };
    const faq = primeroDe('Pregunta');
    if (lectura.precio) {
      const producto = primeroDe('Producto');
      // "¿cuánto sale el presupuesto?" es una pregunta frecuente, no un producto:
      // gana el que quedó mejor ubicado en la búsqueda
      if (producto && (!faq || encontrados.indexOf(producto) < encontrados.indexOf(faq))) {
        return {
          desde: producto, titulo: producto.titulo,
          texto: producto.detalle === 'Consultar precio'
            ? 'Este no tiene precio publicado: consultalo por WhatsApp y te pasamos el valor.'
            : 'Está a ' + producto.detalle + '. Tocá para verlo en el catálogo y sumarlo al carrito.'
        };
      }
    }
    if (faq) return { desde: faq, titulo: faq.titulo, texto: faq.detalle };
    // "¿tienen split de 3000?": si está en el catálogo, sí, y con su precio
    const hay = primeroDe('Producto');
    if (hay) {
      const otros = encontrados.filter(function (r) { return r.tipo === 'Producto' && r !== hay; }).length;
      return {
        desde: hay, titulo: hay.titulo,
        texto: 'Sí, lo tenemos' + (hay.detalle === 'Consultar precio' ? ' (precio a consultar)' : ', a ' + hay.detalle) + '. ' +
          (otros ? 'Abajo hay ' + otros + (otros === 1 ? ' opción más' : ' opciones más') + '. ' : '') +
          'Tocá para verlo en el catálogo.'
      };
    }
    const servicio = primeroDe('Servicio');
    if (servicio) {
      return {
        desde: servicio, titulo: servicio.titulo,
        texto: (servicio.detalle ? conPunto(servicio.detalle) + ' ' : '') +
          (lectura.precio ? 'El precio depende del trabajo: mandanos una foto por WhatsApp y te pasamos un precio cerrado. ' : '') +
          'Tocá para ver todo lo que incluye.'
      };
    }
    return null;
  };

  const armarResultado = function (nodo, tipoTexto, tituloTexto, detalleTexto) {
    nodo.className = 'resultado';
    const tipo = document.createElement('span');
    tipo.className = 'resultado__tipo';
    tipo.textContent = tipoTexto;
    const titulo = document.createElement('strong');
    titulo.textContent = tituloTexto;
    nodo.appendChild(tipo);
    nodo.appendChild(titulo);
    if (detalleTexto) {
      const detalle = document.createElement('span');
      detalle.className = 'resultado__detalle';
      detalle.textContent = detalleTexto;
      nodo.appendChild(detalle);
    }
    return nodo;
  };

  const pintarResultados = function () {
    if (!buscadorResultados || !buscadorTexto) return;
    const consulta = buscadorTexto.value.trim();
    const lectura = leerConsulta(consulta);
    let encontrados = buscar(lectura);
    const respuesta = responder(lectura, encontrados);
    buscadorResultados.innerHTML = '';
    if (buscadorSugerencias) buscadorSugerencias.hidden = !!consulta;

    // la respuesta va arriba de todo, completa; abajo, el resto
    if (respuesta) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      armarResultado(b, 'Respuesta', respuesta.titulo, respuesta.texto);
      b.classList.add('resultado--respuesta');
      b.addEventListener('click', function () {
        cerrarBuscador(false);
        respuesta.desde.ir();
      });
      li.appendChild(b);
      buscadorResultados.appendChild(li);
      encontrados = encontrados.filter(function (r) { return r !== respuesta.desde; });
    }

    encontrados.forEach(function (r) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      armarResultado(b, r.tipo, r.titulo, r.detalle);
      b.addEventListener('click', function () {
        cerrarBuscador(false);
        r.ir();
      });
      li.appendChild(b);
      buscadorResultados.appendChild(li);
    });

    // siempre queda a mano preguntarle directo a Mateo
    if (consulta) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = armarLink('Hola Mateo, te consulto por: ' + consulta);
      a.target = '_blank';
      a.rel = 'noopener';
      const hayAlgo = encontrados.length || respuesta;
      armarResultado(a,
        hayAlgo ? '¿No es esto?' : (lectura.pregunta ? 'Eso no lo tenemos en la web' : 'No encontramos nada en la web'),
        'Preguntanos por WhatsApp: "' + consulta + '"');
      a.classList.add('resultado--wp');
      li.appendChild(a);
      buscadorResultados.appendChild(li);
    }

    if (buscadorAviso) {
      buscadorAviso.textContent = consulta
        ? (respuesta ? 'Respuesta: ' + respuesta.texto + '. ' : '') +
          encontrados.length + (encontrados.length === 1 ? ' resultado' : ' resultados')
        : '';
    }
  };

  let buscadorOrigen = null;

  const abrirBuscador = function () {
    if (!buscador) return;
    buscadorOrigen = document.activeElement;
    cerrarMenu(false);
    buscador.classList.add('abierto');
    buscador.inert = false;
    actualizarBloqueoScroll();
    pintarResultados();
    if (buscadorTexto) setTimeout(function () { buscadorTexto.focus(); }, 50);
  };

  // devolverFoco = false cuando se cierra para ir a un resultado
  const cerrarBuscador = function (devolverFoco) {
    if (!buscador || !buscador.classList.contains('abierto')) return;
    buscador.classList.remove('abierto');
    buscador.inert = true;
    actualizarBloqueoScroll();
    if (devolverFoco !== false && buscadorOrigen && buscadorOrigen.focus) buscadorOrigen.focus();
  };

  if (buscador && abrirBuscadorBtn) {
    abrirBuscadorBtn.hidden = false;
    abrirBuscadorBtn.addEventListener('click', abrirBuscador);
    if (cerrarBuscadorBtn) cerrarBuscadorBtn.addEventListener('click', function () { cerrarBuscador(); });

    // tocar el fondo oscuro cierra
    buscador.addEventListener('click', function (e) { if (e.target === buscador) cerrarBuscador(); });

    if (buscadorTexto) {
      let demora = null;
      buscadorTexto.addEventListener('input', function () {
        clearTimeout(demora);
        demora = setTimeout(pintarResultados, 120);
      });
      // Enter va directo al primer resultado
      buscadorTexto.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        pintarResultados();
        const primero = buscadorResultados && buscadorResultados.querySelector('.resultado');
        if (primero) primero.click();
      });
    }

    if (buscadorSugerencias) {
      buscadorSugerencias.addEventListener('click', function (e) {
        const chip = e.target.closest('button');
        if (!chip || !buscadorTexto) return;
        buscadorTexto.value = chip.textContent;
        pintarResultados();
        buscadorTexto.focus();
      });
    }

    // en la PC, la tecla "/" abre el buscador
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.target.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      abrirBuscador();
    });
  }

  /* ---------------------------------------------------------
     13. Todo lo que reacciona al scroll, en un solo lugar
        (barra, sección activa y el globo
        de WhatsApp) para no hacer trabajar de más al celular
     --------------------------------------------------------- */
  const barra = document.getElementById('barra');
  const flotante = document.getElementById('flotante');
  const nav = menu ? menu.querySelector('.menu__nav') : null;
  // "Equipos" abre el carrito, no es una sección de la página
  const enlacesNav = nav ? Array.prototype.slice.call(nav.querySelectorAll('a:not([data-abre-carrito]):not([data-abre-kit])')) : [];

  const secciones = enlacesNav
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  const consulta = document.getElementById('consulta');

  let anterior_y = window.scrollY;
  let esperando = false;
  let ultimaSeccion = null;

  const revisarScroll = function () {
    const y = window.scrollY;

    // barra compacta
    if (barra) barra.classList.toggle('compacta', y > 40);

    // sección que se está mirando
    let activa = null;
    secciones.forEach(function (seccion) {
      if (seccion.getBoundingClientRect().top <= 160) activa = seccion;
    });

    // solo tocamos el menú cuando cambió de sección de verdad
    if (activa !== ultimaSeccion) {
      ultimaSeccion = activa;

      // así, cuando se abre el menú, ya se ve marcada la sección
      // en la que la persona está parada
      enlacesNav.forEach(function (a) {
        if (activa && a.getAttribute('href') === '#' + activa.id) {
          a.setAttribute('aria-current', 'true');
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }

    // globo de WhatsApp
    if (flotante) {
      const bajando = y > anterior_y + 6;
      const formularioALaVista = consulta
        ? (function () {
            const c = consulta.getBoundingClientRect();
            return c.top < window.innerHeight * .75 && c.bottom > 120;
          })()
        : false;

      flotante.classList.toggle('visible', y > 320 && !formularioALaVista);
      flotante.classList.toggle('escondida', bajando && y > 700);
    }

    anterior_y = y;
  };

  window.addEventListener('scroll', function () {
    if (esperando) return;
    esperando = true;
    requestAnimationFrame(function () {
      esperando = false;
      revisarScroll();
    });
  }, { passive: true });

  window.addEventListener('resize', revisarScroll);
  revisarScroll();

  /* ---------------------------------------------------------
     14. Entrar con Google.
        La persona entra con su Gmail (botón en el menú o el cartelito
        "One Tap" que ofrece Google). El token se manda al Apps Script,
        que lo verifica con Google, guarda el contacto en tu planilla
        y, si es la primera vez, le manda el mail de bienvenida desde
        tu Gmail. Acá solo guardamos nombre, mail y foto para mostrar.
     --------------------------------------------------------- */
  const cuentaCaja = document.getElementById('cuenta-google');
  const cuentaFuera = document.getElementById('cuenta-fuera');
  const cuentaDentro = document.getElementById('cuenta-dentro');
  const cuentaFoto = document.getElementById('cuenta-foto');
  const cuentaNombre = document.getElementById('cuenta-nombre');
  const cuentaEmail = document.getElementById('cuenta-email');
  const cuentaSalir = document.getElementById('cuenta-salir');
  const cuentaBoton = document.getElementById('cuenta-boton');
  const cuentaBotonFoto = document.getElementById('cuenta-boton-foto');
  const googleBoton = document.getElementById('google-boton');

  const leerSesion = function () {
    try { return JSON.parse(localStorage.getItem(SESION)); } catch (e) { return null; }
  };
  const guardarSesion = function (s) {
    try {
      if (s) localStorage.setItem(SESION, JSON.stringify(s));
      else localStorage.removeItem(SESION);
    } catch (e) { /* nada */ }
    document.dispatchEvent(new CustomEvent('mateo-sesion'));
  };

  // el token de Google es un JWT: la parte del medio trae nombre, mail y foto
  const leerToken = function (jwt) {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = atob(b64);
    const texto = decodeURIComponent(Array.prototype.map.call(bytes, function (c) {
      return '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(texto);
  };

  const mostrarSesion = function (s) {
    if (cuentaFuera) cuentaFuera.hidden = !!s;
    if (cuentaDentro) cuentaDentro.hidden = !s;
    if (cuentaBoton) {
      cuentaBoton.hidden = !s;
      cuentaBoton.setAttribute('aria-label', s ? 'Tu cuenta: ' + s.nombre : 'Tu cuenta');
    }
    if (!s) return;

    if (cuentaNombre) cuentaNombre.textContent = s.nombre;
    if (cuentaEmail) cuentaEmail.textContent = s.email;
    [cuentaFoto, cuentaBotonFoto].forEach(function (img) {
      if (img && s.foto) img.src = s.foto;
    });

    // el formulario de consulta ya viene con el nombre puesto
    const campoNombre = document.getElementById('nombre');
    if (campoNombre && !campoNombre.value.trim()) campoNombre.value = s.nombre;
  };

  const alEntrar = function (respuesta) {
    let datos;
    try { datos = leerToken(respuesta.credential); } catch (e) { return; }

    const sesion = { nombre: datos.name || datos.email, email: datos.email, foto: datos.picture || '' };
    guardarSesion(sesion);
    mostrarSesion(sesion);
    mostrarAviso('¡Hola, ' + (datos.given_name || sesion.nombre) + '!', 'verde');

    const pendiente = { credential: respuesta.credential, email: datos.email, nombre: datos.name || '', exp: Number(datos.exp) || 0 };
    guardarPendiente(pendiente);
    enviarIngreso(pendiente, true);
  };

  /* el ingreso tiene que llegar SIEMPRE a la hoja "Contactos": si se
     corta la conexión o Google no contesta, se reintenta 4 veces; si
     igual no llega, queda guardado en este navegador y se manda en la
     próxima visita. El permiso de Google dura una hora: si venció, se
     manda el mail y el nombre igual (la hoja lo marca "sin verificar") */
  const PENDIENTE = 'mateo-ingreso-pendiente';
  const guardarPendiente = function (p) {
    try { if (p) localStorage.setItem(PENDIENTE, JSON.stringify(p)); else localStorage.removeItem(PENDIENTE); } catch (e) { /* sin almacenamiento */ }
  };
  const leerPendiente = function () {
    try { return JSON.parse(localStorage.getItem(PENDIENTE) || 'null'); } catch (e) { return null; }
  };
  const postear = function (cuerpo) {
    // el texto plano evita la consulta previa (CORS) que Apps Script no responde
    return fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(cuerpo) }).then(function (r) { return r.json(); });
  };
  const vigente = function (p) { return p.exp && p.exp * 1000 > Date.now() + 60000; };
  const enviarIngreso = function (p, avisar, intento) {
    intento = intento || 0;
    const reintentar = function () {
      if (intento < 3) setTimeout(function () { enviarIngreso(p, avisar, intento + 1); }, [2000, 6000, 15000][intento]);
    };
    if (!vigente(p)) {
      postear({ tipo: 'contacto', email: p.email, nombre: p.nombre })
        .then(function (r) { if (r && r.ok) guardarPendiente(null); else reintentar(); })
        .catch(reintentar);
      return;
    }
    postear({ credential: p.credential })
      .then(function (r) {
        if (r && r.ok) {
          guardarPendiente(null);
          if (avisar && r.nuevo) mostrarAviso('Te mandamos un mail de bienvenida con las promos', 'verde');
        } else if (r && r.error === 'token-invalido') {
          guardarPendiente(null);
        } else {
          reintentar();
        }
      })
      .catch(reintentar);
  };
  // lo que quedó sin llegar en una visita anterior
  const quedo = leerPendiente();
  if (quedo && quedo.email && APPS_SCRIPT_URL) enviarIngreso(quedo, false);

  if (cuentaCaja && GOOGLE_CLIENT_ID && APPS_SCRIPT_URL) {
    cuentaCaja.hidden = false;
    const sesionGuardada = leerSesion();
    mostrarSesion(sesionGuardada);

    // el script de Google pesa ~270 KB: baja recién cuando se abre el
    // menú (ahí está el botón), no al abrir la página
    let googleCargado = false;
    const cargarGoogle = function () {
      if (googleCargado) return;
      googleCargado = true;
      const gsi = document.createElement('script');
      gsi.src = 'https://accounts.google.com/gsi/client';
      gsi.async = true;
      gsi.onerror = function () {
        // sin conexión con Google: se vuelve a intentar al reabrir el menú
        gsi.remove();
        googleCargado = false;
      };
      gsi.onload = function () {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: alEntrar,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true
        });
        if (googleBoton) {
          google.accounts.id.renderButton(googleBoton, {
            theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'es', width: 260
          });
        }
      };
      document.head.appendChild(gsi);
    };
    document.addEventListener('menu-abierto', cargarGoogle);
    if (document.querySelector('.menu.abierto')) cargarGoogle();

    if (cuentaSalir) {
      cuentaSalir.addEventListener('click', function () {
        guardarSesion(null);
        mostrarSesion(null);
        if (window.google && google.accounts) google.accounts.id.disableAutoSelect();
        mostrarAviso('Saliste de tu cuenta');
      });
    }
    if (cuentaBoton) cuentaBoton.addEventListener('click', abrirMenu);
  }

  /* ---------------------------------------------------------
     15. Año del pie
     --------------------------------------------------------- */
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

});

/* ---------------------------------------------------------
   Registro de visitas (hoja "Visitas" de la planilla CONTACTOS
   MATEO). Es anónimo: de quien solo mira no se sabe el nombre ni
   el mail; se guarda un número de visitante al azar (para saber si
   vuelve), celular o PC, de dónde llegó y qué miró. Si la persona
   entró con Google, va también su nombre y mail.
   En la PC de prueba (localhost) no se registra, salvo con
   ?probar-visita en la dirección.
   --------------------------------------------------------- */
(function () {
  if (!APPS_SCRIPT_URL) return;
  const local = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) || location.protocol === 'file:';
  if (local && location.search.indexOf('probar-visita') === -1) return;

  const leer = function (k, guardado) { try { return guardado.getItem(k); } catch (e) { return null; } };
  const escribir = function (k, v, guardado) { try { guardado.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };

  // número de visitante (al azar, queda en este navegador) y cuántas veces vino
  let visitante = leer('mateo-visitante', localStorage);
  if (!visitante) {
    visitante = 'V-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    escribir('mateo-visitante', visitante, localStorage);
  }
  // una visita por pestaña: recargar la página no cuenta como otra
  const yaContada = leer('mateo-visita-numero', sessionStorage);
  const numero = yaContada ? Number(yaContada) : (Number(leer('mateo-visitas', localStorage)) || 0) + 1;
  if (!yaContada) {
    escribir('mateo-visitas', String(numero), localStorage);
    escribir('mateo-visita-numero', String(numero), sessionStorage);
  }

  const ancho = Math.min(screen.width, screen.height);
  const dispositivo = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Celular'
    : (/iPad|Tablet/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && ancho < 900) ? 'Tablet' : 'PC');

  // de dónde llegó: ?utm_source=..., o la página anterior, o directo
  const desde = (function () {
    const p = new URLSearchParams(location.search);
    const utm = p.get('utm_source') || (p.get('fbclid') ? 'Facebook/Instagram' : '') || (p.get('gclid') ? 'Google (anuncio)' : '');
    if (utm) return utm;
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { ref = ''; }
    if (!ref || ref === location.hostname) return 'Directo';
    if (/google\./.test(ref)) return 'Google';
    if (/instagram\./.test(ref)) return 'Instagram';
    if (/facebook\.|fb\./.test(ref)) return 'Facebook';
    if (/whatsapp\.|wa\.me/.test(ref)) return 'WhatsApp';
    return ref.replace(/^www\./, '');
  })();

  // qué miró: secciones a la vista y lo que abrió o tocó
  const vio = [];
  const anotar = function (cosa) { if (cosa && vio.indexOf(cosa) === -1) vio.push(cosa); };
  const NOMBRES = { hero: 'Inicio', equipo: 'Equipo', servicios: 'Servicios', equipos: 'Equipos y precios', trabajos: 'Trabajos', consulta: 'Consulta', preguntas: 'Preguntas' };
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) anotar(NOMBRES[en.target.id]); });
    }, { threshold: 0.35 });
    Object.keys(NOMBRES).forEach(function (id) { const s = document.getElementById(id); if (s) obs.observe(s); });
  }
  document.addEventListener('click', function (e) {
    const t = e.target;
    if (t.closest('#abrir-carrito, [href="#carrito"]')) anotar('Catálogo');
    if (t.closest('[data-abre-kit]')) anotar('Armá tu kit');
    if (t.closest('.producto__agregar')) anotar('Agregó al carrito');
    if (t.closest('[data-wp], .flotante, a[href*="wa.me"]')) anotar('Escribió por WhatsApp');
    if (t.closest('a[href^="mailto:"]')) anotar('Tocó el mail');
    const ficha = t.closest('[data-abre-ficha], [data-ficha]');
    if (ficha && (ficha.dataset.abreFicha || ficha.dataset.ficha)) anotar('Ficha: ' + (ficha.dataset.abreFicha || ficha.dataset.ficha));
  }, true);

  const inicio = Date.now();
  let enviada = false;
  const enviar = function () {
    if (enviada) return;
    enviada = true;
    let sesion = null;
    try { sesion = JSON.parse(localStorage.getItem(SESION) || 'null'); } catch (e) { sesion = null; }
    const datos = JSON.stringify({
      tipo: 'visita', visitante: visitante, numero: numero, dispositivo: dispositivo, desde: desde,
      vio: vio.join(', '), segundos: Math.round((Date.now() - inicio) / 1000),
      nombre: sesion && sesion.nombre || '', email: sesion && sesion.email || ''
    });
    // sendBeacon sale aunque se esté cerrando la pestaña
    if (!(navigator.sendBeacon && navigator.sendBeacon(APPS_SCRIPT_URL, new Blob([datos], { type: 'text/plain' })))) {
      fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: datos }).catch(function () {});
    }
  };
  // se manda al irse (o al pasar a otra app en el celular); si se
  // queda mucho rato, igual se manda a los 3 minutos
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') enviar(); });
  window.addEventListener('pagehide', enviar);
  setTimeout(enviar, 180000);
})();
