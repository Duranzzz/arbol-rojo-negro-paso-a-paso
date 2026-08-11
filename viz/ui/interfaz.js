// Interfaz de la visualización: panel de pasos, progreso, historial, leyenda,
// zoom y atajos de teclado.
//
// El motor de animación (animation/) solo sabe de una cosa: el "canal de
// narración", que es la etiqueta 0. Cada vez que su texto cambia —hacia delante
// o al deshacer— llega aquí a través de ObjectManager.onNarration.

(function () {
	"use strict";

	var SEPARADOR = "§§";

	var el = {};
	var algoritmo = null;
	var gestor = null;

	// Pasos ya mostrados en la operación en curso, indexados por número de paso.
	var historial = [];
	var pasoActual = 0;
	var totalPasos = 0;

	function $(id) {
		return document.getElementById(id);
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
	}

	/////////////////////////////////////////////////////////////////////////
	// Panel de pasos
	/////////////////////////////////////////////////////////////////////////

	function parsearNarracion(bruto) {
		var partes = String(bruto == null ? "" : bruto).split(SEPARADOR);
		if (partes.length < 3) {
			// Texto suelto (no debería ocurrir): se muestra tal cual.
			return { fase: "", caso: "", detalle: partes.join(" ").trim(), estado: "" };
		}
		return {
			fase: partes[0].trim(),
			caso: partes[1].trim(),
			detalle: partes[2].trim(),
			estado: (partes[3] || "").trim()
		};
	}

	function claseDeFase(fase) {
		switch (fase) {
			case "Insertar": return "chip--insertar";
			case "Eliminar": return "chip--eliminar";
			case "Buscar": return "chip--buscar";
			case "Recorrido": return "chip--recorrido";
			case "Demo": return "chip--demo";
			case "Limpiar": return "chip--limpiar";
			default: return "chip--neutro";
		}
	}

	function pintarNarracion(n) {
		el.fase.textContent = n.fase || "Listo";
		el.fase.className = "chip chip--fase " + claseDeFase(n.fase);

		if (n.caso) {
			el.caso.textContent = n.caso;
			el.caso.hidden = false;
		}
		else {
			el.caso.hidden = true;
		}

		el.texto.textContent = n.detalle;

		if (n.estado === "ok") {
			el.estado.textContent = "✓ Propiedades verificadas";
			el.estado.className = "chip chip--estado chip--ok";
			el.estado.hidden = false;
		}
		else if (n.estado && n.estado.indexOf("warn:") === 0) {
			el.estado.textContent = "⚠ " + n.estado.slice(5);
			el.estado.className = "chip chip--estado chip--warn";
			el.estado.hidden = false;
		}
		else {
			el.estado.hidden = true;
		}
	}

	function registrarEnHistorial(n) {
		if (!n.detalle) {
			return;
		}
		// Al retroceder, el paso actual baja: todo lo que quede por delante deja
		// de ser válido.
		historial = historial.filter(function (entrada) {
			return entrada.paso < pasoActual;
		});
		historial.push({ paso: pasoActual, fase: n.fase, caso: n.caso, detalle: n.detalle });
		if (!el.historialLista.hidden) {
			pintarHistorial();
		}
	}

	function pintarHistorial() {
		el.historialLista.innerHTML = "";
		if (historial.length === 0) {
			var vacio = document.createElement("li");
			vacio.className = "historial-vacio";
			vacio.textContent = "Todavía no hay pasos que mostrar.";
			el.historialLista.appendChild(vacio);
			return;
		}
		historial.forEach(function (entrada, indice) {
			var li = document.createElement("li");
			li.className = "historial-item" + (indice === historial.length - 1 ? " historial-item--actual" : "");
			var cabecera = document.createElement("span");
			cabecera.className = "historial-etiqueta";
			cabecera.textContent = entrada.caso || entrada.fase || "Paso";
			var cuerpo = document.createElement("span");
			cuerpo.className = "historial-detalle";
			cuerpo.textContent = entrada.detalle;
			li.appendChild(cabecera);
			li.appendChild(cuerpo);
			el.historialLista.appendChild(li);
		});
		el.historialLista.scrollTop = el.historialLista.scrollHeight;
	}

	function alNarrar(bruto) {
		var n = parsearNarracion(bruto);
		if (!n.detalle && !n.caso) {
			return;
		}
		pintarNarracion(n);
		registrarEnHistorial(n);
	}

	/////////////////////////////////////////////////////////////////////////
	// Progreso y estado
	/////////////////////////////////////////////////////////////////////////

	function alProgresar(actual, total) {
		pasoActual = actual;
		totalPasos = total;
		el.contador.textContent = "Paso " + actual + " de " + total;
		var porcentaje = total > 0 ? Math.round((actual / total) * 100) : 0;
		el.barra.style.width = porcentaje + "%";
	}

	function alCambiarEstado(estado) {
		var textos = {
			"reproduciendo": "En marcha",
			"pausa": "En pausa",
			"fin": "Terminado"
		};
		var clases = {
			"reproduciendo": "estado-chip estado-chip--corriendo",
			"pausa": "estado-chip estado-chip--pausa",
			"fin": "estado-chip estado-chip--fin"
		};
		el.estadoAnimacion.textContent = textos[estado] || "Lista";
		el.estadoAnimacion.className = clases[estado] || "estado-chip estado-chip--fin";
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
