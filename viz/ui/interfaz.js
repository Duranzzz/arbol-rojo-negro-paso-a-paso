// Interfaz de la visualización: panel de pasos, progreso, historial, leyenda,
// zoom, idioma y atajos de teclado.
//
// El motor de animación (animation/) solo sabe de una cosa: el "canal de
// narración", que es la etiqueta 0. Cada vez que su texto cambia —hacia delante
// o al deshacer— llega aquí a través de ObjectManager.onNarration.
//
// Lo que llega NO es texto, sino claves y argumentos:
//     faseClave §§ casoClave §§ textoClave §§ args §§ estado §§ argsEstado
// La traducción ocurre al pintar, así que cambiar de idioma reescribe el paso
// actual y todo el historial sin rehacer la animación.

(function () {
	"use strict";

	var SEPARADOR = "§§";
	var SEP_ARGS = "¦";

	var el = {};
	var algoritmo = null;
	var gestor = null;

	// Pasos ya mostrados en la operación en curso, indexados por número de paso.
	var historial = [];
	var pasoActual = 0;
	var totalPasos = 0;
	// Última narración recibida, guardada como claves para poder repintarla al
	// cambiar de idioma.
	var narracionActual = null;
	var estadoActual = "";

	function $(id) {
		return document.getElementById(id);
	}

	function t(clave, args) {
		return Idioma.t(clave, args);
	}

	function cachearElementos() {
		el.fase = $("pasoFase");
		el.caso = $("pasoCaso");
		el.estado = $("pasoEstado");
		el.texto = $("pasoTexto");
		el.contador = $("pasoContador");
		el.barra = $("pasoBarra");
		el.historialLista = $("historialLista");
		el.btnHistorial = $("btnHistorial");
		el.estadoAnimacion = $("estadoAnimacion");
		el.shell = document.querySelector(".canvas-shell");
		el.modal = $("modalAyuda");
		el.btnIdioma = $("btnIdioma");
	}

	/////////////////////////////////////////////////////////////////////////
	// Panel de pasos
	/////////////////////////////////////////////////////////////////////////

	function parsearNarracion(bruto) {
		var partes = String(bruto == null ? "" : bruto).split(SEPARADOR);
		if (partes.length < 3) {
			return null;
		}
		function args(texto) {
			return texto ? texto.split(SEP_ARGS) : [];
		}
		return {
			fase: partes[0],
			caso: partes[1],
			clave: partes[2],
			args: args(partes[3]),
			estado: partes[4] || "",
			argsEstado: args(partes[5])
		};
	}

	function claseDeFase(fase) {
		switch (fase) {
			case "fase.insertar": return "chip--insertar";
			case "fase.eliminar": return "chip--eliminar";
			case "fase.buscar": return "chip--buscar";
			case "fase.recorrido": return "chip--recorrido";
			case "fase.demo": return "chip--demo";
			case "fase.limpiar": return "chip--limpiar";
			default: return "chip--neutro";
		}
	}

	function pintarNarracion() {
		var n = narracionActual;
		if (n === null) {
			return;
		}

		el.fase.textContent = n.fase ? t(n.fase) : t("ui.listo");
		el.fase.className = "chip chip--fase " + claseDeFase(n.fase);

		if (n.caso) {
			el.caso.textContent = t(n.caso);
			el.caso.hidden = false;
		}
		else {
			el.caso.hidden = true;
		}

		el.texto.textContent = t(n.clave, n.args);

		if (n.estado === "ok") {
			el.estado.textContent = t("ui.propiedadesOk");
			el.estado.className = "chip chip--estado chip--ok";
			el.estado.hidden = false;
		}
		else if (n.estado.indexOf("warn:") === 0) {
			el.estado.textContent = "⚠ " + t(n.estado.slice(5), n.argsEstado);
			el.estado.className = "chip chip--estado chip--warn";
			el.estado.hidden = false;
		}
		else {
			el.estado.hidden = true;
		}
	}

	function registrarEnHistorial(n) {
		// Al retroceder, el paso actual baja: todo lo que quede por delante deja
		// de ser válido.
		historial = historial.filter(function (entrada) {
			return entrada.paso < pasoActual;
		});
		historial.push({ paso: pasoActual, fase: n.fase, caso: n.caso, clave: n.clave, args: n.args });
		if (!el.historialLista.hidden) {
			pintarHistorial();
		}
	}

	function pintarHistorial() {
		el.historialLista.innerHTML = "";
		if (historial.length === 0) {
			var vacio = document.createElement("li");
			vacio.className = "historial-vacio";
			vacio.textContent = t("ui.historialVacio");
			el.historialLista.appendChild(vacio);
			return;
		}
		historial.forEach(function (entrada, indice) {
			var li = document.createElement("li");
			li.className = "historial-item" + (indice === historial.length - 1 ? " historial-item--actual" : "");
			var cabecera = document.createElement("span");
			cabecera.className = "historial-etiqueta";
			cabecera.textContent = t(entrada.caso || entrada.fase);
			var cuerpo = document.createElement("span");
			cuerpo.className = "historial-detalle";
			cuerpo.textContent = t(entrada.clave, entrada.args);
			li.appendChild(cabecera);
			li.appendChild(cuerpo);
			el.historialLista.appendChild(li);
		});
		el.historialLista.scrollTop = el.historialLista.scrollHeight;
	}

	function alNarrar(bruto) {
		var n = parsearNarracion(bruto);
		if (n === null || !n.clave) {
			return;
		}
		narracionActual = n;
		pintarNarracion();
		registrarEnHistorial(n);
	}

	/////////////////////////////////////////////////////////////////////////
	// Progreso y estado
	/////////////////////////////////////////////////////////////////////////

	function alProgresar(actual, total) {
		pasoActual = actual;
		totalPasos = total;
		pintarContador();
	}

	function pintarContador() {
		el.contador.textContent = t("ui.contador", [pasoActual, totalPasos]);
		var porcentaje = totalPasos > 0 ? Math.round((pasoActual / totalPasos) * 100) : 0;
		el.barra.style.width = porcentaje + "%";
	}

	function alCambiarEstado(estado) {
		estadoActual = estado;
		pintarEstadoAnimacion();
	}

	function pintarEstadoAnimacion() {
		var claves = {
			"reproduciendo": "ui.estadoCorriendo",
			"pausa": "ui.estadoPausa",
			"fin": "ui.estadoFin"
		};
		var clases = {
			"reproduciendo": "estado-chip estado-chip--corriendo",
			"pausa": "estado-chip estado-chip--pausa",
			"fin": "estado-chip estado-chip--fin"
		};
		el.estadoAnimacion.textContent = t(claves[estadoActual] || "ui.estadoLista");
		el.estadoAnimacion.className = clases[estadoActual] || "estado-chip estado-chip--fin";
	}

	/////////////////////////////////////////////////////////////////////////
	// Idioma
	/////////////////////////////////////////////////////////////////////////

	// Traduce el HTML estático marcado con data-i18n / data-i18n-title /
	// data-i18n-aria / data-i18n-html.
	function traducirEstaticos() {
		var nodos = document.querySelectorAll("[data-i18n]");
		var i;
		for (i = 0; i < nodos.length; i++) {
			nodos[i].textContent = t(nodos[i].getAttribute("data-i18n"));
		}
		nodos = document.querySelectorAll("[data-i18n-html]");
		for (i = 0; i < nodos.length; i++) {
			nodos[i].innerHTML = t(nodos[i].getAttribute("data-i18n-html"));
		}
		nodos = document.querySelectorAll("[data-i18n-title]");
		for (i = 0; i < nodos.length; i++) {
			nodos[i].setAttribute("title", t(nodos[i].getAttribute("data-i18n-title")));
		}
		nodos = document.querySelectorAll("[data-i18n-aria]");
		for (i = 0; i < nodos.length; i++) {
			nodos[i].setAttribute("aria-label", t(nodos[i].getAttribute("data-i18n-aria")));
		}
	}

	function aplicarIdioma() {
		traducirEstaticos();
		algoritmo.traducirControles();
		traducirControlesAnimacion();
		pintarContador();
		pintarEstadoAnimacion();
		if (narracionActual === null) {
			el.texto.innerHTML = t("ui.bienvenida");
		}
		else {
			pintarNarracion();
		}
		if (!el.historialLista.hidden) {
			pintarHistorial();
		}
	}

	/////////////////////////////////////////////////////////////////////////
	// Lienzo: tamaño y zoom
	/////////////////////////////////////////////////////////////////////////

	function observarTamano() {
		var reajustar = function () {
			if (typeof ajustarLienzo === "function") {
				ajustarLienzo();
			}
		};
		if (typeof ResizeObserver === "function") {
			new ResizeObserver(reajustar).observe(el.shell);
		}
		window.addEventListener("resize", reajustar);
		window.addEventListener("orientationchange", reajustar);
	}

	function configurarZoom() {
		function aplicar(zoom, auto) {
			objectManager.userZoom = Math.max(0.4, Math.min(2.5, zoom));
			objectManager.autoFit = auto;
			objectManager.draw();
		}
		$("btnZoomMas").onclick = function () {
			aplicar(objectManager.userZoom * 1.2, objectManager.autoFit);
		};
		$("btnZoomMenos").onclick = function () {
			aplicar(objectManager.userZoom / 1.2, objectManager.autoFit);
		};
		$("btnZoomEncaje").onclick = function () {
			aplicar(1, true);
		};
	}

	/////////////////////////////////////////////////////////////////////////
	// Ayuda, historial y teclado
	/////////////////////////////////////////////////////////////////////////

	function cerrarHistorial() {
		if (el.historialLista.hidden) {
			return;
		}
		el.historialLista.hidden = true;
		el.btnHistorial.setAttribute("aria-expanded", "false");
	}

	function configurarPaneles() {
		el.btnHistorial.onclick = function () {
			var oculto = el.historialLista.hidden;
			el.historialLista.hidden = !oculto;
			el.btnHistorial.setAttribute("aria-expanded", String(oculto));
			if (oculto) {
				pintarHistorial();
			}
		};

		// Un clic en cualquier otro sitio cierra el historial. El clic sobre el
		// propio botón también llega hasta aquí, pero lo dejamos pasar para que
		// siga funcionando como interruptor.
		document.addEventListener("click", function (evento) {
			if (el.historialLista.hidden) {
				return;
			}
			if (el.historialLista.contains(evento.target) || el.btnHistorial.contains(evento.target)) {
				return;
			}
			cerrarHistorial();
		});

		var abrir = function (visible) {
			el.modal.hidden = !visible;
			$("btnAyuda").setAttribute("aria-expanded", String(visible));
		};
		$("btnAyuda").onclick = function () { abrir(el.modal.hidden); };
		$("btnCerrarAyuda").onclick = function () { abrir(false); };
		el.modal.onclick = function (evento) {
			if (evento.target === el.modal) {
				abrir(false);
			}
		};

		el.btnIdioma.onclick = function () { Idioma.alternar(); };
	}

	function configurarTeclado() {
		document.addEventListener("keydown", function (evento) {
			// El campo de valor se queda con el foco para poder encadenar
			// inserciones, así que los atajos solo se desactivan mientras haya
			// algo escrito en él.
			var foco = document.activeElement;
			var enCampoTexto = foco && foco.tagName === "INPUT" && foco.getAttribute("type") !== "button";
			var escribiendo = enCampoTexto && foco.value !== "";
			if (escribiendo || evento.ctrlKey || evento.altKey || evento.metaKey) {
				return;
			}
			switch (evento.key) {
				case "ArrowRight": gestor.step(); break;
				case "ArrowLeft": gestor.stepBack(); break;
				case " ": doPlayPause(); break;
				case "Home": gestor.skipBack(); break;
				case "End": gestor.skipForward(); break;
				case "Escape": el.modal.hidden = true; cerrarHistorial(); return;
				default: return;
			}
			evento.preventDefault();
		});
	}

	/////////////////////////////////////////////////////////////////////////
	// Arranque
	/////////////////////////////////////////////////////////////////////////

	window.initInterfaz = function (alg, animManager) {
		algoritmo = alg;
		gestor = animManager;
		cachearElementos();

		objectManager.onNarration = alNarrar;
		onProgresoAnimacion = alProgresar;
		onEstadoAnimacion = alCambiarEstado;

		Idioma.alCambiar(aplicarIdioma);
		aplicarIdioma();

		observarTamano();
		configurarZoom();
		configurarPaneles();
		configurarTeclado();

		if (typeof ajustarLienzo === "function") {
			ajustarLienzo();
		}
		algoritmo.valueField.focus();
	};
})();
