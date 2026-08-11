// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco


/////////////////////////////////////////////////////////////////////////////////
// Paleta de la visualización
/////////////////////////////////////////////////////////////////////////////////

// Nodos rojos y negros: relleno saturado + texto blanco, para que el color del
// nodo se lea de un vistazo (antes eran dos tonos de gris muy parecidos).
var FOREGROUND_RED = "#FFFFFF";
var BACKGROUND_RED = "#D93B3B";

var FOREGROUND_BLACK = "#FFFFFF";
var BACKGROUND_BLACK = "#1F2430";

// El nodo "doble negro" transitorio del borrado: negro puro + texto ámbar,
// para que se distinga del negro normal mientras se resuelve.
var FOREGROUND_DOUBLE_BLACK = "#FFD166";
var BACKGROUND_DOUBLE_BLACK = "#000000";

// Hojas nulas: conceptualmente negras, pero apagadas para no competir con los
// nodos reales.
var FOREGROUND_NULL = "#D7DBE2";
var BACKGROUND_NULL = "#5A6373";

var LINK_COLOR = "#3A4150";
var BLUE = "#1D4ED8";
var PRINT_COLOR = "#1F2430";

// Círculo verde que recorre el árbol durante las búsquedas y descensos.
var HIGHLIGHT_COLOR = "#0F9D58";

var widthDelta = 50;
var heightDelta = 50;
var startingY = 50;

var FIRST_PRINT_POS_X = 40;
var PRINT_VERTICAL_GAP = 22;
var PRINT_HORIZONTAL_GAP = 50;


/////////////////////////////////////////////////////////////////////////////////
// Nombres de fase y de caso
//
// Los casos van numerados EN EL ORDEN EN QUE OCURREN en la animación, para que
// el número que se lee en pantalla coincida con el orden del razonamiento.
/////////////////////////////////////////////////////////////////////////////////

var FASE_INSERTAR = "Insertar";
var FASE_ELIMINAR = "Eliminar";
var FASE_BUSCAR = "Buscar";
var FASE_IMPRIMIR = "Recorrido";
var FASE_DEMO = "Demo";
var FASE_LIMPIAR = "Limpiar";

// Inserción
var INS_CASO_1 = "Caso 1 · Tío rojo";
var INS_CASO_2 = "Caso 2 · Triángulo";
var INS_CASO_3 = "Caso 3 · Línea recta";
var INS_CASO_RAIZ = "Caso raíz";
var INS_CASO_BASE = "Caso base";

// Borrado (numeración estándar del doble negro)
var DEL_CASO_1 = "Caso 1 · Hermano rojo";
var DEL_CASO_2 = "Caso 2 · Hermano negro con hijos negros";
var DEL_CASO_3 = "Caso 3 · Sobrino cercano rojo";
var DEL_CASO_4 = "Caso 4 · Sobrino lejano rojo";
var DEL_CASO_RAIZ = "Caso raíz";

var CASO_FIN = "Operación completada";

// Separador interno del mensaje de narración: fase / caso / detalle / estado.
// El panel HTML lo parte por aquí. No usar en el texto visible.
var NARRACION_SEP = "§§";


function RedBlack(am, w, h) {
	this.init(am, w, h);
}


RedBlack.prototype = new Algorithm();
RedBlack.prototype.constructor = RedBlack;
RedBlack.superclass = Algorithm.prototype;


RedBlack.prototype.init = function (am, w, h) {
	var sc = RedBlack.superclass;
	var fn = sc.init;
	fn.call(this, am);
	this.addControls();
	this.nextIndex = 1;
	this.commands = [];
	this.startingX = w / 2;
	this.startingY = startingY;
	this.print_max = w - PRINT_HORIZONTAL_GAP;
	this.first_print_pos_y = h - 2 * PRINT_VERTICAL_GAP;
	this.faseActual = "";

	// Etiqueta 0: canal de narración. No se dibuja en el lienzo; el motor
	// reenvía su texto al panel de pasos en HTML (ver ObjectManager.setText).
	this.cmd("CreateLabel", 0, "", 0, 0, 1);
	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.animationManager.clearHistory();
}


RedBlack.NUMERIC_INPUT_MAX_LEN = 16;

RedBlack.parseNumericInput = function (raw) {
	var s = String(raw).trim();
	if (s === "" || s === "-" || s === "." || s === "-.") {
		return null;
	}
	if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
		return null;
	}
	var n = parseFloat(s);
	return isFinite(n) ? n : null;
};


RedBlack.prototype.normalizeNumber = function (input) {
	var n = RedBlack.parseNumericInput(input);
	return n === null ? "" : n;
};


/////////////////////////////////////////////////////////////////////////////////
// Narración paso a paso
//
// Regla de oro: NO existe ningún "Step" sin un texto que lo explique, y no
// existe ningún texto que no vaya seguido de su "Step". Todo pasa por paso().
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.narrar = function (caso, detalle, estado) {
	var partes = [this.faseActual || "", caso || "", detalle || "", estado || ""];
	this.cmd("SetText", 0, partes.join(NARRACION_SEP));
};


RedBlack.prototype.paso = function (caso, detalle, estado) {
	this.narrar(caso, detalle, estado);
	this.cmd("Step");
};


// Paso final de una operación: comprueba las cinco propiedades del árbol
// rojo-negro y lo reporta en el panel.
RedBlack.prototype.finalizar = function (resumen) {
	var problemas = this.validarPropiedades();
	var estado = problemas.length === 0 ? "ok" : "warn:" + problemas[0];
	this.paso(CASO_FIN, resumen, estado);
};


// Devuelve la lista de propiedades incumplidas. Vacía = árbol correcto.
// Las hojas nulas se tratan igual que un hijo ausente, así que el conteo de
// altura negra es válido tanto si están materializadas como si no.
RedBlack.prototype.validarPropiedades = function () {
	var problemas = [];
	if (this.treeRoot == null) {
		return problemas;
	}
	if (this.treeRoot.blackLevel < 1) {
		problemas.push("La raíz debería ser negra.");
	}

	function alturaNegra(nodo) {
		if (nodo == null || nodo.phantomLeaf) {
			return 1;
		}
		if (nodo.blackLevel > 1) {
			problemas.push("Ha quedado un nodo doble negro sin resolver (" + nodo.data + ").");
		}
		if (nodo.blackLevel === 0 && nodo.parent != null && nodo.parent.blackLevel === 0) {
			problemas.push("Dos rojos consecutivos: " + nodo.parent.data + " → " + nodo.data + ".");
		}
		var izq = alturaNegra(nodo.left);
		var der = alturaNegra(nodo.right);
		if (izq === -1 || der === -1) {
			return -1;
		}
		if (izq !== der) {
			problemas.push("Altura negra desigual bajo " + nodo.data + " (" + izq + " vs " + der + ").");
			return -1;
		}
		return izq + (nodo.blackLevel > 0 ? 1 : 0);
	}

	alturaNegra(this.treeRoot);
	return problemas;
};


/////////////////////////////////////////////////////////////////////////////////
// Controles
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.addControls = function () {
	var maxLen = RedBlack.NUMERIC_INPUT_MAX_LEN;

	function marcar(elemento, clase) {
		if (elemento && elemento.parentNode) {
			elemento.parentNode.className = clase;
		}
		return elemento;
	}

	this.valueField = addControlToAlgorithmBar("Text", "");
	this.valueField.setAttribute("placeholder", "Valor numérico");
	this.valueField.setAttribute("title", "Escribe un número y pulsa Insertar, Buscar o Eliminar (Enter inserta)");
	this.valueField.setAttribute("aria-label", "Valor numérico");
	this.valueField.onkeydown = this.returnSubmitFloat(this.valueField, this.insertCallback.bind(this), maxLen);
	marcar(this.valueField, "control-celda control-celda--ancha");

	this.insertButton = addControlToAlgorithmBar("Button", "Insertar");
	this.insertButton.onclick = this.insertCallback.bind(this);
	this.insertButton.setAttribute("title", "Inserta el valor en el árbol (Enter)");
	marcar(this.insertButton, "control-celda control-celda--primaria");

	this.findButton = addControlToAlgorithmBar("Button", "Buscar");
	this.findButton.onclick = this.findCallback.bind(this);
	this.findButton.setAttribute("title", "Busca el valor recorriendo el árbol");
	marcar(this.findButton, "control-celda");

	this.deleteButton = addControlToAlgorithmBar("Button", "Eliminar");
	this.deleteButton.onclick = this.deleteCallback.bind(this);
	this.deleteButton.setAttribute("title", "Elimina el valor del árbol");
	marcar(this.deleteButton, "control-celda");

	this.printButton = addControlToAlgorithmBar("Button", "Recorrido");
	this.printButton.onclick = this.printCallback.bind(this);
	this.printButton.setAttribute("title", "Recorrido en orden (in-order): imprime los valores ordenados");
	marcar(this.printButton, "control-celda");

	this.demoButton = addControlToAlgorithmBar("Button", "Demo 1→19");
	this.demoButton.onclick = this.demoCallback.bind(this);
	this.demoButton.setAttribute("title", "Reinicia el árbol e inserta los números del 1 al 19");
	marcar(this.demoButton, "control-celda");

	this.clearButton = addControlToAlgorithmBar("Button", "Limpiar");
	this.clearButton.onclick = this.clearCallback.bind(this);
	this.clearButton.setAttribute("title", "Vacía el árbol");
	marcar(this.clearButton, "control-celda");

	this.showNullLeaves = addCheckboxToAlgorithmBar("Mostrar hojas nulas");
	this.showNullLeaves.onclick = this.showNullLeavesCallback.bind(this);
	this.showNullLeaves.checked = false;
	this.showNullLeaves.setAttribute("title", "Muestra las hojas NIL negras que cuelgan de cada nodo");
	marcar(this.showNullLeaves, "control-celda control-celda--ancha control-celda--check");
}


RedBlack.prototype.reset = function () {
	this.nextIndex = 1;
	this.treeRoot = null;
	this.faseActual = "";
}


/////////////////////////////////////////////////////////////////////////////////
// Callbacks
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.insertCallback = function (event) {
	var insertedValue = this.normalizeNumber(this.valueField.value);
	if (insertedValue !== "") {
		this.valueField.value = "";
		this.implementAction(this.insertElement.bind(this), insertedValue);
	}
}


RedBlack.prototype.deleteCallback = function (event) {
	var deletedValue = this.normalizeNumber(this.valueField.value);
	if (deletedValue !== "") {
		this.valueField.value = "";
		this.implementAction(this.deleteElement.bind(this), deletedValue);
	}
}


RedBlack.prototype.findCallback = function (event) {
	var findValue = this.normalizeNumber(this.valueField.value);
	if (findValue !== "") {
		this.valueField.value = "";
		this.implementAction(this.findElement.bind(this), findValue);
	}
}


RedBlack.prototype.printCallback = function (event) {
	this.implementAction(this.printTree.bind(this), "");
}


RedBlack.prototype.demoCallback = function (event) {
	this.implementAction(this.demoElements.bind(this), "");
}


RedBlack.prototype.clearCallback = function (event) {
	this.implementAction(this.clearTree.bind(this), "");
}


RedBlack.prototype.showNullLeavesCallback = function (event) {
	if (this.showNullLeaves.checked) {
		this.animationManager.setAllLayers([0, 1]);
	}
	else {
		this.animationManager.setAllLayers([0]);
	}
}


/////////////////////////////////////////////////////////////////////////////////
// Limpiar y demo
/////////////////////////////////////////////////////////////////////////////////

// Emite los "Delete" de todos los objetos del árbol (incluidas hojas nulas) y
// deja la estructura vacía. No emite ningún Step: lo decide quien la llama.
RedBlack.prototype.borrarTodosLosNodos = function () {
	var self = this;
	function recorrer(nodo) {
		if (nodo == null) {
			return;
		}
		recorrer(nodo.left);
		recorrer(nodo.right);
		self.cmd("Delete", nodo.graphicID);
	}
	recorrer(this.treeRoot);
	this.treeRoot = null;
	// La etiqueta 0 (canal de narración) no se toca; los identificadores de los
	// nodos empiezan en 1, así que se pueden reutilizar.
	this.nextIndex = 1;
}


RedBlack.prototype.clearTree = function (ignorado) {
	this.commands = [];
	this.faseActual = FASE_LIMPIAR;
	if (this.treeRoot == null) {
		this.paso("", "El árbol ya estaba vacío.");
		return this.commands;
	}
	this.borrarTodosLosNodos();
	this.paso("", "Árbol vaciado. Puedes empezar de cero.", "ok");
	return this.commands;
}


RedBlack.prototype.demoElements = function (ignorado) {
	this.commands = [];
	this.faseActual = FASE_DEMO;

	if (this.treeRoot != null) {
		this.borrarTodosLosNodos();
		this.paso("", "Se vacía el árbol para empezar la demostración desde cero.");
	}
	else {
		this.paso("", "Demostración: se insertan los números del 1 al 19, uno a uno.");
	}

	// insertElement() reinicia this.commands y devuelve su propio bloque, así
	// que hay que ir acumulando (y todos los elementos deben ser cadenas: el
	// motor de animación hace split("<;>") sobre cada uno).
	var acumulado = this.commands;
	for (var i = 1; i <= 19; i++) {
		acumulado = acumulado.concat(this.insertElement(i));
	}
	this.commands = acumulado;
	this.faseActual = FASE_DEMO;
	this.finalizar("Demostración terminada: 19 valores insertados. Fíjate en que la altura del árbol apenas crece.");
	return this.commands;
}


/////////////////////////////////////////////////////////////////////////////////
// Recorrido en orden
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.printTree = function (unused) {
	this.commands = [];
	this.faseActual = FASE_IMPRIMIR;

	if (this.treeRoot == null) {
		this.paso("", "El árbol está vacío: no hay nada que recorrer.");
		return this.commands;
	}

	// La salida se coloca justo debajo del nodo más profundo, para no pisar el
	// árbol por muy hondo que llegue.
	var maxY = startingY;
	(function profundidad(nodo) {
		if (nodo == null) {
			return;
		}
		if (nodo.y > maxY) {
			maxY = nodo.y;
		}
		profundidad(nodo.left);
		profundidad(nodo.right);
	})(this.treeRoot);

	this.first_print_pos_y = maxY + 2 * heightDelta;
	this.print_max = 2 * this.startingX - PRINT_HORIZONTAL_GAP;

	this.highlightID = this.nextIndex++;
	var firstLabel = this.nextIndex;
	this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, this.treeRoot.x, this.treeRoot.y);
	this.xPosOfNextLabel = FIRST_PRINT_POS_X;
	this.yPosOfNextLabel = this.first_print_pos_y;
	this.paso("", "Recorrido en orden: primero el subárbol izquierdo, después el nodo, después el derecho. El resultado sale ordenado de menor a mayor.");

	this.printTreeRec(this.treeRoot);

	this.cmd("Delete", this.highlightID);
	this.paso("", "Recorrido completo. Los valores han salido ordenados: esa es la propiedad de todo árbol binario de búsqueda.", "ok");
	for (var i = firstLabel; i < this.nextIndex; i++) {
		this.cmd("Delete", i);
	}
	this.nextIndex = this.highlightID;   // Reutilizamos identificadores. No es imprescindible.
	return this.commands;
}


RedBlack.prototype.printTreeRec = function (tree) {
	if (tree.left != null && !tree.left.phantomLeaf) {
		this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
		this.paso("", "Bajamos al subárbol izquierdo de " + tree.data + ": lo de la izquierda va antes.");
		this.printTreeRec(tree.left);
		this.cmd("Move", this.highlightID, tree.x, tree.y);
		this.paso("", "Volvemos a " + tree.data + ".");
	}

	var nextLabelID = this.nextIndex++;
	this.cmd("CreateLabel", nextLabelID, tree.data, tree.x, tree.y);
	this.cmd("SetForegroundColor", nextLabelID, PRINT_COLOR);
	this.cmd("Move", nextLabelID, this.xPosOfNextLabel, this.yPosOfNextLabel);
	this.paso("", "Visitamos " + tree.data + " y lo añadimos a la salida.");

	this.xPosOfNextLabel += PRINT_HORIZONTAL_GAP;
	if (this.xPosOfNextLabel > this.print_max) {
		this.xPosOfNextLabel = FIRST_PRINT_POS_X;
		this.yPosOfNextLabel += PRINT_VERTICAL_GAP;
	}

	if (tree.right != null && !tree.right.phantomLeaf) {
		this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
		this.paso("", "Bajamos al subárbol derecho de " + tree.data + ".");
		this.printTreeRec(tree.right);
		this.cmd("Move", this.highlightID, tree.x, tree.y);
		this.paso("", "Volvemos a " + tree.data + ".");
	}
}


/////////////////////////////////////////////////////////////////////////////////
// Buscar
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.findElement = function (findValue) {
	this.commands = [];
	this.faseActual = FASE_BUSCAR;
	this.highlightID = this.nextIndex++;
	this.doFind(this.treeRoot, findValue);
	return this.commands;
}


RedBlack.prototype.doFind = function (tree, value) {
	if (tree == null || tree.phantomLeaf) {
		if (this.treeRoot == null) {
			this.paso("", "El árbol está vacío, así que " + value + " no puede estar.");
		}
		else {
			this.paso("", "Hemos llegado a una hoja nula: por debajo no hay más nodos.");
		}
		this.finalizar("El valor " + value + " no está en el árbol.");
		return;
	}

	this.cmd("SetHighlight", tree.graphicID, 1);

	if (tree.data == value) {
		this.paso("", "Comparamos " + value + " con " + tree.data + ": son iguales. ¡Encontrado!");
		this.cmd("SetHighlight", tree.graphicID, 0);
		this.finalizar("El valor " + value + " está en el árbol.");
		return;
	}

	if (tree.data > value) {
		this.narrar("", "Comparamos " + value + " con " + tree.data + ": " + value + " < " + tree.data + ", así que solo puede estar en el subárbol izquierdo.");
		if (tree.left != null) {
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
			this.cmd("Step");
			this.cmd("Delete", this.highlightID);
		}
		else {
			this.cmd("Step");
		}
		this.cmd("SetHighlight", tree.graphicID, 0);
		this.doFind(tree.left, value);
	}
	else {
		this.narrar("", "Comparamos " + value + " con " + tree.data + ": " + value + " > " + tree.data + ", así que solo puede estar en el subárbol derecho.");
		if (tree.right != null) {
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
			this.cmd("Step");
			this.cmd("Delete", this.highlightID);
		}
		else {
			this.cmd("Step");
		}
		this.cmd("SetHighlight", tree.graphicID, 0);
		this.doFind(tree.right, value);
	}
}


/////////////////////////////////////////////////////////////////////////////////
// Hojas nulas
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.blackLevel = function (tree) {
	if (tree == null) {
		return 1;
	}
	return tree.blackLevel;
}


RedBlack.prototype.pintarHojaNula = function (graphicID) {
	this.cmd("SetForegroundColor", graphicID, FOREGROUND_NULL);
	this.cmd("SetBackgroundColor", graphicID, BACKGROUND_NULL);
}


RedBlack.prototype.attachLeftNullLeaf = function (node) {
	var treeNodeID = this.nextIndex++;
	this.cmd("CreateCircle", treeNodeID, "null", node.x, node.y);
	this.pintarHojaNula(treeNodeID);
	node.left = new RedBlackNode("", treeNodeID, this.startingX, startingY);
	node.left.phantomLeaf = true;
	node.left.parent = node;
	node.left.blackLevel = 1;
	this.cmd("SetLayer", treeNodeID, 1);
	this.cmd("Connect", node.graphicID, treeNodeID, LINK_COLOR);
}


RedBlack.prototype.attachRightNullLeaf = function (node) {
	var treeNodeID = this.nextIndex++;
	this.cmd("CreateCircle", treeNodeID, "null", node.x, node.y);
	this.pintarHojaNula(treeNodeID);
	node.right = new RedBlackNode("", treeNodeID, this.startingX, startingY);
	node.right.phantomLeaf = true;
	node.right.parent = node;
	node.right.blackLevel = 1;
	this.cmd("SetLayer", treeNodeID, 1);
	this.cmd("Connect", node.graphicID, treeNodeID, LINK_COLOR);
}


RedBlack.prototype.attachNullLeaves = function (node) {
	this.attachLeftNullLeaf(node);
	this.attachRightNullLeaf(node);
}


/////////////////////////////////////////////////////////////////////////////////
// Insertar
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.insertElement = function (insertedValue) {
	this.commands = new Array();
	this.faseActual = FASE_INSERTAR;
	this.highlightID = this.nextIndex++;
	var treeNodeID;

	if (this.treeRoot == null) {
		treeNodeID = this.nextIndex++;
		this.cmd("CreateCircle", treeNodeID, insertedValue, this.startingX, startingY);
		this.cmd("SetForegroundColor", treeNodeID, FOREGROUND_BLACK);
		this.cmd("SetBackgroundColor", treeNodeID, BACKGROUND_BLACK);
		this.treeRoot = new RedBlackNode(insertedValue, treeNodeID, this.startingX, startingY);
		this.treeRoot.blackLevel = 1;

		this.attachNullLeaves(this.treeRoot);
		this.resizeTree();

		this.paso(INS_CASO_BASE, "El árbol estaba vacío: " + insertedValue + " entra como raíz y se pinta de NEGRO, porque la raíz de un árbol rojo-negro siempre es negra.");
		this.finalizar("Insertado " + insertedValue + " como raíz del árbol.");
		return this.commands;
	}

	treeNodeID = this.nextIndex++;
	this.cmd("CreateCircle", treeNodeID, insertedValue, 30, startingY);
	this.cmd("SetForegroundColor", treeNodeID, FOREGROUND_RED);
	this.cmd("SetBackgroundColor", treeNodeID, BACKGROUND_RED);
	this.paso("", "El nodo " + insertedValue + " nace ROJO. Se inserta siempre en rojo porque así no cambia la altura negra de ningún camino; como mucho habrá que arreglar un doble rojo.");

	var insertElem = new RedBlackNode(insertedValue, treeNodeID, 100, 100);
	this.cmd("SetHighlight", insertElem.graphicID, 1);
	insertElem.height = 1;
	this.insert(insertElem, this.treeRoot);

	this.finalizar("Insertado " + insertedValue + ". El árbol vuelve a cumplir las propiedades rojo-negro.");
	return this.commands;
}


RedBlack.prototype.insert = function (elem, tree) {
	this.cmd("SetHighlight", tree.graphicID, 1);

	var esIzquierda = elem.data < tree.data;
	var comparacion = esIzquierda
		? elem.data + " < " + tree.data + ": bajamos por la izquierda."
		: elem.data + " ≥ " + tree.data + ": bajamos por la derecha.";

	if (esIzquierda) {
		if (tree.left == null || tree.left.phantomLeaf) {
			this.narrar("", "Comparamos " + comparacion + " Ahí abajo hay una hoja nula: ese es el sitio de " + elem.data + ".");
			this.cmd("Step");
			this.cmd("SetHighlight", tree.graphicID, 0);
			this.cmd("SetHighlight", elem.graphicID, 0);

			if (tree.left != null) {
				this.cmd("Delete", tree.left.graphicID);
			}
			tree.left = elem;
			elem.parent = tree;
			this.cmd("Connect", tree.graphicID, elem.graphicID, LINK_COLOR);
			this.attachNullLeaves(elem);
			this.resizeTree();

			this.paso("", "El nodo " + elem.data + " ocupa el lugar de esa hoja nula, colgando de " + tree.data + ". Ahora toca comprobar si ha aparecido un doble rojo.");
			this.fixDoubleRed(elem);
		}
		else {
			this.narrar("", "Comparamos " + comparacion);
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
			this.cmd("Step");
			this.cmd("Delete", this.highlightID);
			this.cmd("SetHighlight", tree.graphicID, 0);
			this.insert(elem, tree.left);
		}
	}
	else {
		if (tree.right == null || tree.right.phantomLeaf) {
			this.narrar("", "Comparamos " + comparacion + " Ahí abajo hay una hoja nula: ese es el sitio de " + elem.data + ".");
			this.cmd("Step");
			this.cmd("SetHighlight", tree.graphicID, 0);
			this.cmd("SetHighlight", elem.graphicID, 0);

			if (tree.right != null) {
				this.cmd("Delete", tree.right.graphicID);
			}
			tree.right = elem;
			elem.parent = tree;
			this.cmd("Connect", tree.graphicID, elem.graphicID, LINK_COLOR);
			elem.x = tree.x + widthDelta / 2;
			elem.y = tree.y + heightDelta;
			this.cmd("Move", elem.graphicID, elem.x, elem.y);
			this.attachNullLeaves(elem);
			this.resizeTree();

			this.paso("", "El nodo " + elem.data + " ocupa el lugar de esa hoja nula, colgando de " + tree.data + ". Ahora toca comprobar si ha aparecido un doble rojo.");
			this.fixDoubleRed(elem);
		}
		else {
			this.narrar("", "Comparamos " + comparacion);
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
			this.cmd("Step");
			this.cmd("Delete", this.highlightID);
			this.cmd("SetHighlight", tree.graphicID, 0);
			this.insert(elem, tree.right);
		}
	}
}


// Resalta / apaga el trío nodo-padre-abuelo y sus dos aristas.
RedBlack.prototype.marcarTrio = function (tree, encendido) {
	this.cmd("SetHighlight", tree.graphicID, encendido);
	this.cmd("SetHighlight", tree.parent.graphicID, encendido);
	this.cmd("SetHighlight", tree.parent.parent.graphicID, encendido);
	this.cmd("SetEdgeHighlight", tree.parent.parent.graphicID, tree.parent.graphicID, encendido);
	this.cmd("SetEdgeHighlight", tree.parent.graphicID, tree.graphicID, encendido);
}


RedBlack.prototype.pintarNegro = function (nodo) {
	nodo.blackLevel = 1;
	this.cmd("SetForegroundColor", nodo.graphicID, FOREGROUND_BLACK);
	this.cmd("SetBackgroundColor", nodo.graphicID, BACKGROUND_BLACK);
}


RedBlack.prototype.pintarRojo = function (nodo) {
	nodo.blackLevel = 0;
	this.cmd("SetForegroundColor", nodo.graphicID, FOREGROUND_RED);
	this.cmd("SetBackgroundColor", nodo.graphicID, BACKGROUND_RED);
}


RedBlack.prototype.fixDoubleRed = function (tree) {
	if (tree.parent == null) {
		if (tree.blackLevel == 0) {
			this.pintarNegro(tree);
			this.paso(INS_CASO_RAIZ, "El nodo ha llegado a ser la raíz y estaba rojo. La raíz siempre es negra, así que se repinta: eso sube en uno la altura negra de TODOS los caminos a la vez, y por eso no rompe nada.");
		}
		return;
	}

	if (tree.parent.blackLevel > 0) {
		this.cmd("SetHighlight", tree.parent.graphicID, 1);
		this.paso("", "El padre (" + tree.parent.data + ") es NEGRO, así que no hay dos rojos seguidos. No hay que arreglar nada.");
		this.cmd("SetHighlight", tree.parent.graphicID, 0);
		return;
	}

	if (tree.parent.parent == null) {
		this.pintarNegro(tree.parent);
		this.paso(INS_CASO_RAIZ, "El padre es rojo y además es la raíz. Basta con pintar la raíz de NEGRO y el conflicto desaparece.");
		return;
	}

	// A partir de aquí: padre rojo y existe abuelo (que es negro, porque su
	// hijo era rojo). Hay doble rojo que resolver.
	var padreEsIzquierdo = tree.parent.isLeftChild();
	var uncle = padreEsIzquierdo ? tree.parent.parent.right : tree.parent.parent.left;

	if (uncle != null && uncle.blackLevel == 0) {
		// ---- Caso 1: el tío también es rojo -> recoloreo, sin rotaciones ----
		this.marcarTrio(tree, 1);
		this.cmd("SetHighlight", uncle.graphicID, 1);
		this.paso(INS_CASO_1, "Hay doble rojo (" + tree.parent.data + " y " + tree.data + ") y el TÍO (" + uncle.data + ") también es rojo. Con el tío rojo no hace falta rotar: basta con recolorear.");

		this.marcarTrio(tree, 0);
		this.cmd("SetHighlight", uncle.graphicID, 0);
		this.pintarNegro(tree.parent);
		this.pintarNegro(uncle);
		this.pintarRojo(tree.parent.parent);
		this.paso(INS_CASO_1, "Padre y tío pasan a NEGRO y el abuelo (" + tree.parent.parent.data + ") pasa a ROJO. Cada camino sigue teniendo la misma cantidad de nodos negros que antes.");

		this.paso("", "Pero el abuelo ahora es rojo y su propio padre podría serlo también, así que repetimos la comprobación un nivel más arriba.");
		this.fixDoubleRed(tree.parent.parent);
		return;
	}

	// ---- Tío negro (o inexistente) -> hay que rotar ----
	var esTriangulo = padreEsIzquierdo ? !tree.isLeftChild() : tree.isLeftChild();

	if (esTriangulo) {
		// ---- Caso 2: triángulo -> se rota sobre el padre para enderezarlo ----
		this.marcarTrio(tree, 1);
		this.paso(INS_CASO_2, "Hay doble rojo y el TÍO es negro (o no existe). Además " + tree.data + ", " + tree.parent.data + " y " + tree.parent.parent.data + " forman un TRIÁNGULO (el nodo está en el lado interior).");

		this.marcarTrio(tree, 0);
		this.paso(INS_CASO_2, "Con un triángulo no se puede rotar directamente sobre el abuelo. Primero rotamos sobre el PADRE para convertirlo en una línea recta.");

		if (padreEsIzquierdo) {
			this.singleRotateLeft(tree.parent);
			tree = tree.left;
		}
		else {
			this.singleRotateRight(tree.parent);
			tree = tree.right;
		}
		this.paso(INS_CASO_2, "Ya tenemos una línea recta. Seguimos con el Caso 3.");
	}

	// ---- Caso 3: línea recta -> rotación sobre el abuelo + intercambio ----
	this.marcarTrio(tree, 1);
	this.paso(INS_CASO_3, "El nodo, su padre y su abuelo están alineados en LÍNEA RECTA y el tío es negro. Esto se arregla con una sola rotación sobre el abuelo (" + tree.parent.parent.data + ").");

	this.marcarTrio(tree, 0);
	var padre = tree.parent;
	var abuelo = tree.parent.parent;
	this.pintarNegro(padre);
	this.pintarRojo(abuelo);
	this.paso(INS_CASO_3, "Intercambiamos los colores: el padre (" + padre.data + ") pasa a NEGRO y el abuelo (" + abuelo.data + ") a ROJO. Ahora la rotación.");

	if (padreEsIzquierdo) {
		this.singleRotateRight(abuelo);
	}
	else {
		this.singleRotateLeft(abuelo);
	}

	this.paso(INS_CASO_3, "Tras la rotación, " + padre.data + " queda arriba en negro con dos hijos rojos. Ya no hay dos rojos seguidos y la altura negra no ha cambiado: la inserción termina aquí.");
}


/////////////////////////////////////////////////////////////////////////////////
// Rotaciones
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.singleRotateRight = function (tree) {
	var B = tree;
	var A = tree.left;
	var t2 = A.right;

	this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 1);
	this.paso("", "Rotación simple a la DERECHA sobre " + B.data + ": " + A.data + " sube y " + B.data + " baja a ser su hijo derecho.");
	this.cmd("SetEdgeHighlight", B.graphicID, A.graphicID, 0);

	if (t2 != null) {
		this.cmd("Disconnect", A.graphicID, t2.graphicID);
		this.cmd("Connect", B.graphicID, t2.graphicID, LINK_COLOR);
		t2.parent = B;
	}
	this.cmd("Disconnect", B.graphicID, A.graphicID);
	this.cmd("Connect", A.graphicID, B.graphicID, LINK_COLOR);

	A.parent = B.parent;
	if (this.treeRoot == B) {
		this.treeRoot = A;
	}
	else {
		this.cmd("Disconnect", B.parent.graphicID, B.graphicID, LINK_COLOR);
		this.cmd("Connect", B.parent.graphicID, A.graphicID, LINK_COLOR);
		if (B.isLeftChild()) {
			B.parent.left = A;
		}
		else {
			B.parent.right = A;
		}
	}
	A.right = B;
	B.parent = A;
	B.left = t2;
	this.resetHeight(B);
	this.resetHeight(A);
	this.resizeTree();
	return A;
}


RedBlack.prototype.singleRotateLeft = function (tree) {
	var A = tree;
	var B = tree.right;
	var t2 = B.left;

	this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 1);
	this.paso("", "Rotación simple a la IZQUIERDA sobre " + A.data + ": " + B.data + " sube y " + A.data + " baja a ser su hijo izquierdo.");
	this.cmd("SetEdgeHighlight", A.graphicID, B.graphicID, 0);

	if (t2 != null) {
		this.cmd("Disconnect", B.graphicID, t2.graphicID);
		this.cmd("Connect", A.graphicID, t2.graphicID, LINK_COLOR);
		t2.parent = A;
	}
	this.cmd("Disconnect", A.graphicID, B.graphicID);
	this.cmd("Connect", B.graphicID, A.graphicID, LINK_COLOR);

	B.parent = A.parent;
	if (this.treeRoot == A) {
		this.treeRoot = B;
	}
	else {
		this.cmd("Disconnect", A.parent.graphicID, A.graphicID, LINK_COLOR);
		this.cmd("Connect", A.parent.graphicID, B.graphicID, LINK_COLOR);
		if (A.isLeftChild()) {
			A.parent.left = B;
		}
		else {
			A.parent.right = B;
		}
	}
	B.left = A;
	A.parent = B;
	A.right = t2;
	this.resetHeight(A);
	this.resetHeight(B);
	this.resizeTree();
	return B;
}


RedBlack.prototype.getHeight = function (tree) {
	if (tree == null) {
		return 0;
	}
	return tree.height;
}


RedBlack.prototype.resetHeight = function (tree) {
	if (tree != null) {
		tree.height = Math.max(this.getHeight(tree.left), this.getHeight(tree.right)) + 1;
	}
}


/////////////////////////////////////////////////////////////////////////////////
// Eliminar
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.deleteElement = function (deletedValue) {
	this.commands = new Array();
	this.faseActual = FASE_ELIMINAR;
	this.highlightID = this.nextIndex++;

	if (this.treeRoot == null) {
		this.paso("", "El árbol está vacío: no hay nada que eliminar.");
		return this.commands;
	}

	this.paso("", "Vamos a eliminar " + deletedValue + ". Primero hay que localizarlo, igual que en una búsqueda.");
	this.treeDelete(this.treeRoot, deletedValue);
	return this.commands;
}


RedBlack.prototype.fixLeftNull = function (tree) {
	var treeNodeID = this.nextIndex++;
	this.cmd("CreateCircle", treeNodeID, "null", tree.x, tree.y);
	this.cmd("SetForegroundColor", treeNodeID, FOREGROUND_DOUBLE_BLACK);
	this.cmd("SetBackgroundColor", treeNodeID, BACKGROUND_DOUBLE_BLACK);

	var nullLeaf = new RedBlackNode("null", treeNodeID, tree.x, tree.y);
	nullLeaf.blackLevel = 2;
	nullLeaf.parent = tree;
	nullLeaf.phantomLeaf = true;
	tree.left = nullLeaf;
	this.cmd("Connect", tree.graphicID, nullLeaf.graphicID, LINK_COLOR);
	this.resizeTree();

	this.paso("", "Al quitar un nodo negro, ese camino ha perdido un negro. Lo representamos con una hoja DOBLE NEGRA: es una deuda que hay que devolver antes de terminar.");

	this.fixExtraBlackChild(tree, true);

	this.cmd("SetLayer", nullLeaf.graphicID, 1);
	nullLeaf.blackLevel = 1;
	this.pintarHojaNula(nullLeaf.graphicID);
}


RedBlack.prototype.fixRightNull = function (tree) {
	var treeNodeID = this.nextIndex++;
	this.cmd("CreateCircle", treeNodeID, "null", tree.x, tree.y);
	this.cmd("SetForegroundColor", treeNodeID, FOREGROUND_DOUBLE_BLACK);
	this.cmd("SetBackgroundColor", treeNodeID, BACKGROUND_DOUBLE_BLACK);

	var nullLeaf = new RedBlackNode("null", treeNodeID, tree.x, tree.y);
	nullLeaf.parent = tree;
	nullLeaf.phantomLeaf = true;
	nullLeaf.blackLevel = 2;
	tree.right = nullLeaf;
	this.cmd("Connect", tree.graphicID, nullLeaf.graphicID, LINK_COLOR);
	this.resizeTree();

	this.paso("", "Al quitar un nodo negro, ese camino ha perdido un negro. Lo representamos con una hoja DOBLE NEGRA: es una deuda que hay que devolver antes de terminar.");

	this.fixExtraBlackChild(tree, false);

	this.cmd("SetLayer", nullLeaf.graphicID, 1);
	nullLeaf.blackLevel = 1;
	this.pintarHojaNula(nullLeaf.graphicID);
}


// N = nodo doble negro, S = su hermano, P = el padre de ambos.
RedBlack.prototype.fixExtraBlackChild = function (parNode, isLeftChild) {
	var sibling;
	var doubleBlackNode;
	if (isLeftChild) {
		sibling = parNode.right;
		doubleBlackNode = parNode.left;
	}
	else {
		sibling = parNode.left;
		doubleBlackNode = parNode.right;
	}

	var nombreS = (sibling == null || sibling.phantomLeaf) ? "el hermano" : sibling.data;

	if (this.blackLevel(sibling) > 0 && this.blackLevel(sibling.left) > 0 && this.blackLevel(sibling.right) > 0) {
		// ---- Caso 2: hermano negro con los dos hijos negros ----
		if (sibling != null) {
			this.cmd("SetHighlight", sibling.graphicID, 1);
		}
		this.paso(DEL_CASO_2, "El hermano (" + nombreS + ") es NEGRO y sus dos hijos también. Nadie del lado del hermano tiene un rojo que prestarnos, así que la deuda no se puede pagar aquí: hay que subirla al padre.");
		if (sibling != null) {
			this.cmd("SetHighlight", sibling.graphicID, 0);
		}

		this.pintarRojo(sibling);
		if (doubleBlackNode != null) {
			doubleBlackNode.blackLevel = 1;
			this.fixNodeColor(doubleBlackNode);
		}
		this.paso(DEL_CASO_2, "Quitamos un negro a cada hermano: N vuelve a ser negro normal y S se pinta de ROJO. Ese negro que sobra se lo pasamos al padre (" + parNode.data + ").");

		if (parNode.blackLevel == 0) {
			this.pintarNegro(parNode);
			this.paso(DEL_CASO_2, "El padre era ROJO: absorbe el negro extra pasando a NEGRO y la deuda queda saldada. Hemos terminado.");
		}
		else {
			parNode.blackLevel = 2;
			this.fixNodeColor(parNode);
			this.paso(DEL_CASO_2, "El padre ya era NEGRO, así que ahora es él quien queda DOBLE NEGRO. Repetimos el análisis un nivel más arriba.");
			this.fixExtraBlack(parNode);
		}
		return;
	}

	if (this.blackLevel(sibling) == 0) {
		// ---- Caso 1: hermano rojo ----
		this.cmd("SetHighlight", sibling.graphicID, 1);
		this.paso(DEL_CASO_1, "El hermano (" + nombreS + ") es ROJO. Entonces el padre y los sobrinos son negros. Este caso no resuelve la deuda: lo que hace es transformarla en uno de los otros tres.");
		this.cmd("SetHighlight", sibling.graphicID, 0);

		this.paso(DEL_CASO_1, "Intercambiamos los colores del padre y del hermano y rotamos el padre en dirección a N. Así N pasa a tener un hermano NEGRO.");

		var newPar;
		if (isLeftChild) {
			newPar = this.singleRotateLeft(parNode);
			this.pintarNegro(newPar);
			this.pintarRojo(newPar.left);
			this.paso(DEL_CASO_1, "Ya tenemos a N con un hermano negro y un padre rojo. Volvemos a analizar el caso con esta nueva figura.");
			this.fixExtraBlack(newPar.left.left);
		}
		else {
			newPar = this.singleRotateRight(parNode);
			this.pintarNegro(newPar);
			this.pintarRojo(newPar.right);
			this.paso(DEL_CASO_1, "Ya tenemos a N con un hermano negro y un padre rojo. Volvemos a analizar el caso con esta nueva figura.");
			this.fixExtraBlack(newPar.right.right);
		}
		return;
	}

	var sobrinoLejano = isLeftChild ? sibling.right : sibling.left;
	var sobrinoCercano = isLeftChild ? sibling.left : sibling.right;

	if (this.blackLevel(sobrinoLejano) > 0) {
		// ---- Caso 3: hermano negro, sobrino cercano rojo, lejano negro ----
		this.cmd("SetHighlight", sibling.graphicID, 1);
		this.cmd("SetHighlight", sobrinoCercano.graphicID, 1);
		this.paso(DEL_CASO_3, "El hermano (" + nombreS + ") es NEGRO, su hijo CERCANO a N es rojo y el LEJANO es negro. El rojo está en el lado que no nos sirve para rotar.");
		this.cmd("SetHighlight", sibling.graphicID, 0);
		this.cmd("SetHighlight", sobrinoCercano.graphicID, 0);

		this.paso(DEL_CASO_3, "Intercambiamos los colores del hermano y de ese sobrino rojo y rotamos el hermano en dirección contraria a N, para mover el rojo al lado lejano.");

		var newSib;
		if (isLeftChild) {
			newSib = this.singleRotateRight(sibling);
			this.pintarNegro(newSib);
			this.pintarRojo(newSib.right);
		}
		else {
			newSib = this.singleRotateLeft(sibling);
			this.pintarNegro(newSib);
			this.pintarRojo(newSib.left);
		}
		this.paso(DEL_CASO_3, "Ahora el sobrino rojo está en el lado lejano: esto ya es el Caso 4, que sí cierra la deuda.");
		this.fixExtraBlackChild(parNode, isLeftChild);
		return;
	}

	// ---- Caso 4: hermano negro con el sobrino lejano rojo ----
	this.cmd("SetHighlight", sibling.graphicID, 1);
	this.cmd("SetHighlight", sobrinoLejano.graphicID, 1);
	this.paso(DEL_CASO_4, "El hermano (" + nombreS + ") es NEGRO y su hijo LEJANO a N es ROJO. Este es el caso que resuelve la deuda de una vez.");
	this.cmd("SetHighlight", sibling.graphicID, 0);
	this.cmd("SetHighlight", sobrinoLejano.graphicID, 0);

	this.paso(DEL_CASO_4, "El hermano toma el color del padre, el padre y el sobrino lejano se pintan de NEGRO, y rotamos el padre en dirección a N.");

	var oldParBlackLevel = parNode.blackLevel;
	var nuevoPadre;
	if (isLeftChild) {
		nuevoPadre = this.singleRotateLeft(parNode);
		if (oldParBlackLevel == 0) {
			this.pintarRojo(nuevoPadre);
			this.pintarNegro(nuevoPadre.left);
		}
		this.pintarNegro(nuevoPadre.right);
		if (nuevoPadre.left.left != null) {
			nuevoPadre.left.left.blackLevel = 1;
			this.fixNodeColor(nuevoPadre.left.left);
		}
	}
	else {
		nuevoPadre = this.singleRotateRight(parNode);
		if (oldParBlackLevel == 0) {
			this.pintarRojo(nuevoPadre);
			this.pintarNegro(nuevoPadre.right);
		}
		this.pintarNegro(nuevoPadre.left);
		if (nuevoPadre.right.right != null) {
			nuevoPadre.right.right.blackLevel = 1;
			this.fixNodeColor(nuevoPadre.right.right);
		}
	}
	this.paso(DEL_CASO_4, "Ese camino recupera el negro que había perdido y ningún otro camino cambia. La deuda queda saldada y el borrado termina.");
}


RedBlack.prototype.fixExtraBlack = function (tree) {
	if (tree == null || tree.blackLevel <= 1) {
		return;
	}

	if (tree.parent == null) {
		tree.blackLevel = 1;
		this.cmd("SetForegroundColor", tree.graphicID, FOREGROUND_BLACK);
		this.cmd("SetBackgroundColor", tree.graphicID, BACKGROUND_BLACK);
		this.paso(DEL_CASO_RAIZ, "El doble negro ha subido hasta la RAÍZ. Aquí se descarta sin más: quitar un negro a la raíz baja en uno la altura negra de todos los caminos por igual.");
		return;
	}

	if (tree.parent.left == tree) {
		this.fixExtraBlackChild(tree.parent, true);
	}
	else {
		this.fixExtraBlackChild(tree.parent, false);
	}
}


RedBlack.prototype.treeDelete = function (tree, valueToDelete) {
	var leftchild = false;

	if (tree == null || tree.phantomLeaf) {
		this.paso("", "Hemos llegado a una hoja nula sin encontrar el valor.");
		this.finalizar("El valor " + valueToDelete + " no está en el árbol: no se puede eliminar.");
		return;
	}

	if (tree.parent != null) {
		leftchild = tree.parent.left == tree;
	}
	this.cmd("SetHighlight", tree.graphicID, 1);

	if (valueToDelete < tree.data) {
		this.narrar("", "Comparamos " + valueToDelete + " con " + tree.data + ": es menor, seguimos por el subárbol izquierdo.");
		this.cmd("Step");
		this.cmd("SetHighlight", tree.graphicID, 0);
		if (tree.left != null) {
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.left.x, tree.left.y);
			this.paso("", "Bajamos al hijo izquierdo de " + tree.data + ".");
			this.cmd("Delete", this.highlightID);
		}
		this.treeDelete(tree.left, valueToDelete);
		return;
	}

	if (valueToDelete > tree.data) {
		this.narrar("", "Comparamos " + valueToDelete + " con " + tree.data + ": es mayor, seguimos por el subárbol derecho.");
		this.cmd("Step");
		this.cmd("SetHighlight", tree.graphicID, 0);
		if (tree.right != null) {
			this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);
			this.cmd("Move", this.highlightID, tree.right.x, tree.right.y);
			this.paso("", "Bajamos al hijo derecho de " + tree.data + ".");
			this.cmd("Delete", this.highlightID);
		}
		this.treeDelete(tree.right, valueToDelete);
		return;
	}

	// ---- Nodo encontrado ----
	var eraNegro = tree.blackLevel > 0;
	var colorTexto = eraNegro ? "NEGRO" : "ROJO";
	this.paso("", "Encontrado: " + tree.data + " es el nodo a eliminar y es " + colorTexto + "." + (tree.parent == null ? " Además es la raíz." : ""));
	this.cmd("SetHighlight", tree.graphicID, 0);

	var sinHijoIzq = (tree.left == null) || tree.left.phantomLeaf;
	var sinHijoDer = (tree.right == null) || tree.right.phantomLeaf;

	if (sinHijoIzq && sinHijoDer) {
		this.eliminarSinHijos(tree, leftchild, eraNegro, valueToDelete);
		return;
	}

	if (sinHijoIzq || sinHijoDer) {
		this.eliminarConUnHijo(tree, leftchild, eraNegro, sinHijoIzq, valueToDelete);
		return;
	}

	this.eliminarConDosHijos(tree, valueToDelete);
}


// Caso "sin hijos": el nodo desaparece. Si era rojo no pasa nada; si era negro
// nace el doble negro.
RedBlack.prototype.eliminarSinHijos = function (tree, leftchild, eraNegro, valueToDelete) {
	if (eraNegro) {
		this.paso("", "El nodo no tiene hijos reales (solo hojas nulas) y es NEGRO. Al quitarlo, su camino se queda con un negro de menos: aparecerá un DOBLE NEGRO.");
	}
	else {
		this.paso("", "El nodo no tiene hijos reales y es ROJO. Quitar un rojo no cambia la altura negra de ningún camino, así que simplemente desaparece.");
	}

	this.cmd("Delete", tree.graphicID);
	if (tree.left != null) {
		this.cmd("Delete", tree.left.graphicID);
	}
	if (tree.right != null) {
		this.cmd("Delete", tree.right.graphicID);
	}

	if (tree.parent == null) {
		this.treeRoot = null;
		this.paso("", "Era el único nodo del árbol, que queda vacío.");
		this.finalizar("Eliminado " + valueToDelete + ". El árbol está vacío.");
		return;
	}

	if (leftchild) {
		tree.parent.left = null;
		this.resizeTree();
		if (eraNegro) {
			this.fixLeftNull(tree.parent);
		}
		else {
			this.attachLeftNullLeaf(tree.parent);
			this.resizeTree();
		}
	}
	else {
		tree.parent.right = null;
		this.resizeTree();
		if (eraNegro) {
			this.fixRightNull(tree.parent);
		}
		else {
			this.attachRightNullLeaf(tree.parent);
			this.resizeTree();
		}
	}

	this.finalizar("Eliminado " + valueToDelete + ". El árbol vuelve a cumplir las propiedades rojo-negro.");
}


// Caso "un solo hijo real". En un árbol rojo-negro válido eso implica que el
// nodo es negro y su único hijo es rojo.
RedBlack.prototype.eliminarConUnHijo = function (tree, leftchild, eraNegro, sinHijoIzq, valueToDelete) {
	var hijo = sinHijoIzq ? tree.right : tree.left;
	var hojaSobrante = sinHijoIzq ? tree.left : tree.right;

	if (eraNegro) {
		this.paso("", "El nodo es NEGRO y tiene un único hijo real (" + hijo.data + "). En un árbol rojo-negro ese hijo es forzosamente ROJO: ocupará su sitio y se repintará de NEGRO para devolver el negro perdido.");
	}
	else {
		this.paso("", "El nodo es ROJO y tiene un único hijo real (" + hijo.data + "): el hijo ocupa su lugar sin más ajustes.");
	}

	if (hojaSobrante != null) {
		this.cmd("Delete", hojaSobrante.graphicID);
	}
	if (sinHijoIzq) {
		tree.left = null;
	}
	else {
		tree.right = null;
	}

	if (tree.parent == null) {
		this.cmd("Delete", tree.graphicID);
		this.treeRoot = hijo;
		this.treeRoot.parent = null;
		if (this.treeRoot.blackLevel == 0) {
			this.pintarNegro(this.treeRoot);
		}
		this.resizeTree();
		this.paso("", "Era la raíz: su hijo " + hijo.data + " pasa a ser la nueva raíz y se pinta de NEGRO.");
		this.finalizar("Eliminado " + valueToDelete + ". El árbol vuelve a cumplir las propiedades rojo-negro.");
		return;
	}

	this.cmd("Disconnect", tree.parent.graphicID, tree.graphicID);
	this.cmd("Connect", tree.parent.graphicID, hijo.graphicID, LINK_COLOR);
	this.paso("", "El hijo " + hijo.data + " se engancha directamente al padre " + tree.parent.data + ", ocupando el hueco.");
	this.cmd("Delete", tree.graphicID);

	if (leftchild) {
		tree.parent.left = hijo;
	}
	else {
		tree.parent.right = hijo;
	}
	hijo.parent = tree.parent;
	this.resizeTree();

	if (eraNegro) {
		hijo.blackLevel++;
		this.fixNodeColor(hijo);
		this.paso("", "El hijo rojo absorbe el negro que faltaba y pasa a NEGRO. El camino recupera su altura negra sin tocar nada más.");
		this.fixExtraBlack(hijo);
	}

	this.finalizar("Eliminado " + valueToDelete + ". El árbol vuelve a cumplir las propiedades rojo-negro.");
}


// Caso "dos hijos": se sustituye por el predecesor en orden y el problema se
// traslada a borrar ese predecesor, que tiene como mucho un hijo.
RedBlack.prototype.eliminarConDosHijos = function (tree, valueToDelete) {
	this.paso("", "El nodo tiene DOS hijos reales, así que no se puede quitar directamente. Buscamos su predecesor en orden: el mayor del subárbol izquierdo (izquierda una vez, y luego siempre a la derecha).");

	this.highlightID = this.nextIndex++;
	this.cmd("CreateHighlightCircle", this.highlightID, HIGHLIGHT_COLOR, tree.x, tree.y);

	var tmp = tree.left;
	this.cmd("Move", this.highlightID, tmp.x, tmp.y);
	this.paso("", "Un paso a la izquierda, hasta " + tmp.data + ".");

	while (tmp.right != null && !tmp.right.phantomLeaf) {
		tmp = tmp.right;
		this.cmd("Move", this.highlightID, tmp.x, tmp.y);
		this.paso("", "Todo lo a la derecha que se pueda: llegamos a " + tmp.data + ".");
	}

	if (tmp.right != null) {
		this.cmd("Delete", tmp.right.graphicID);
		tmp.right = null;
	}

	var valorPredecesor = tmp.data;
	var eraNegro = tmp.blackLevel > 0;

	this.cmd("SetText", tree.graphicID, " ");
	var labelID = this.nextIndex++;
	this.cmd("CreateLabel", labelID, tmp.data, tmp.x, tmp.y);
	this.cmd("SetForegroundColor", labelID, BLUE);
	tree.data = tmp.data;
	this.cmd("Move", labelID, tree.x, tree.y);
	this.paso("", "Copiamos el valor del predecesor (" + valorPredecesor + ") dentro del nodo que queríamos borrar. El orden del árbol se mantiene intacto.");

	this.cmd("Delete", labelID);
	this.cmd("SetText", tree.graphicID, tree.data);
	this.cmd("Delete", this.highlightID);
	this.paso("", "Ahora el valor " + valorPredecesor + " está duplicado. El borrado real es el del nodo de abajo, que tiene como mucho un hijo: un caso que ya sabemos resolver.");

	if (tmp.left == null) {
		this.cmd("Delete", tmp.graphicID);
		if (tmp.parent != tree) {
			tmp.parent.right = null;
			this.resizeTree();
			if (eraNegro) {
				this.paso("", "El nodo predecesor era NEGRO y no tenía hijos: su camino pierde un negro.");
				this.fixRightNull(tmp.parent);
			}
			else {
				this.paso("", "El nodo predecesor era ROJO y sus dos hijos eran nulos: desaparece sin más ajustes.");
			}
		}
		else {
			tree.left = null;
			this.resizeTree();
			if (eraNegro) {
				this.paso("", "El nodo predecesor era NEGRO y no tenía hijos: su camino pierde un negro.");
				this.fixLeftNull(tmp.parent);
			}
			else {
				this.paso("", "El nodo predecesor era ROJO y sus dos hijos eran nulos: desaparece sin más ajustes.");
			}
		}
	}
	else {
		this.cmd("Disconnect", tmp.parent.graphicID, tmp.graphicID);
		this.cmd("Connect", tmp.parent.graphicID, tmp.left.graphicID, LINK_COLOR);
		this.paso("", "El hijo izquierdo del predecesor ocupa su lugar.");
		this.cmd("Delete", tmp.graphicID);

		var esHijoDeTree = tmp.parent == tree;
		if (!esHijoDeTree) {
			tmp.parent.right = tmp.left;
		}
		else {
			tree.left = tmp.left;
		}
		var nuevoPadre = esHijoDeTree ? tree : tmp.parent;
		tmp.left.parent = nuevoPadre;
		this.resizeTree();

		if (eraNegro) {
			if (!tmp.left.phantomLeaf) {
				this.paso("", "El predecesor era NEGRO y tenía un hijo, que es forzosamente ROJO: ese hijo se repinta de NEGRO y devuelve el negro perdido.");
			}
			else {
				this.paso("", "El predecesor era NEGRO y no tenía hijos reales: aparece un DOBLE NEGRO que hay que resolver.");
			}
			tmp.left.blackLevel++;
			if (tmp.left.phantomLeaf) {
				this.cmd("SetLayer", tmp.left.graphicID, 0);
			}
			this.fixNodeColor(tmp.left);
			this.fixExtraBlack(tmp.left);
			if (tmp.left.phantomLeaf) {
				this.cmd("SetLayer", tmp.left.graphicID, 1);
				tmp.left.blackLevel = 1;
				this.pintarHojaNula(tmp.left.graphicID);
			}
		}
		else {
			this.paso("", "El predecesor era ROJO: quitarlo no altera la altura negra de ningún camino.");
		}
	}

	this.finalizar("Eliminado " + valueToDelete + ". El árbol vuelve a cumplir las propiedades rojo-negro.");
}


RedBlack.prototype.fixNodeColor = function (tree) {
	if (tree.blackLevel == 0) {
		this.cmd("SetForegroundColor", tree.graphicID, FOREGROUND_RED);
		this.cmd("SetBackgroundColor", tree.graphicID, BACKGROUND_RED);
	}
	else if (tree.blackLevel > 1) {
		this.cmd("SetForegroundColor", tree.graphicID, FOREGROUND_DOUBLE_BLACK);
		this.cmd("SetBackgroundColor", tree.graphicID, BACKGROUND_DOUBLE_BLACK);
	}
	else if (tree.phantomLeaf) {
		this.pintarHojaNula(tree.graphicID);
	}
	else {
		this.cmd("SetForegroundColor", tree.graphicID, FOREGROUND_BLACK);
		this.cmd("SetBackgroundColor", tree.graphicID, BACKGROUND_BLACK);
	}
}


/////////////////////////////////////////////////////////////////////////////////
// Colocación en el lienzo
//
// resizeTree() ya NO emite un "Step": los movimientos se funden con el paso que
// venga después, para no dejar pasos mudos sin explicación.
/////////////////////////////////////////////////////////////////////////////////

RedBlack.prototype.resizeTree = function () {
	var startingPoint = this.startingX;
	this.resizeWidths(this.treeRoot);
	if (this.treeRoot != null) {
		if (this.treeRoot.leftWidth > startingPoint) {
			startingPoint = this.treeRoot.leftWidth;
		}
		else if (this.treeRoot.rightWidth > startingPoint) {
			startingPoint = Math.max(this.treeRoot.leftWidth, 2 * startingPoint - this.treeRoot.rightWidth);
		}
		this.setNewPositions(this.treeRoot, startingPoint, startingY, 0);
		this.animateNewPositions(this.treeRoot);
	}
}


RedBlack.prototype.setNewPositions = function (tree, xPosition, yPosition, side) {
	if (tree != null) {
		tree.y = yPosition;
		if (side == -1) {
			xPosition = xPosition - tree.rightWidth;
			tree.heightLabelX = xPosition - 20;
		}
		else if (side == 1) {
			xPosition = xPosition + tree.leftWidth;
			tree.heightLabelX = xPosition + 20;
		}
		else {
			tree.heightLabelX = xPosition - 20;
		}
		tree.x = xPosition;
		tree.heightLabelY = tree.y - 20;
		this.setNewPositions(tree.left, xPosition, yPosition + heightDelta, -1);
		this.setNewPositions(tree.right, xPosition, yPosition + heightDelta, 1);
	}
}


RedBlack.prototype.animateNewPositions = function (tree) {
	if (tree != null) {
		this.cmd("Move", tree.graphicID, tree.x, tree.y);
		this.animateNewPositions(tree.left);
		this.animateNewPositions(tree.right);
	}
}


RedBlack.prototype.resizeWidths = function (tree) {
	if (tree == null) {
		return 0;
	}
	tree.leftWidth = Math.max(this.resizeWidths(tree.left), widthDelta / 2);
	tree.rightWidth = Math.max(this.resizeWidths(tree.right), widthDelta / 2);
	return tree.leftWidth + tree.rightWidth;
}


RedBlack.prototype.disableUI = function (event) {
	this.valueField.disabled = true;
	this.insertButton.disabled = true;
	this.deleteButton.disabled = true;
	this.findButton.disabled = true;
	this.printButton.disabled = true;
	this.demoButton.disabled = true;
	this.clearButton.disabled = true;
}


RedBlack.prototype.enableUI = function (event) {
	this.valueField.disabled = false;
	this.insertButton.disabled = false;
	this.deleteButton.disabled = false;
	this.findButton.disabled = false;
	this.printButton.disabled = false;
	this.demoButton.disabled = false;
	this.clearButton.disabled = false;
}


/////////////////////////////////////////////////////////
// Red black node
////////////////////////////////////////////////////////


function RedBlackNode(val, id, initialX, initialY) {
	this.data = val;
	this.x = initialX;
	this.y = initialY;
	this.blackLevel = 0;
	this.phantomLeaf = false;
	this.graphicID = id;
	this.left = null;
	this.right = null;
	this.parent = null;
	this.height = 0;
	this.leftWidth = 0;
	this.rightWidth = 0;
}


RedBlackNode.prototype.isLeftChild = function () {
	if (this.parent == null) {
		return true;
	}
	return this.parent.left == this;
}


/////////////////////////////////////////////////////////
// Setup stuff
////////////////////////////////////////////////////////


var currentAlg;

function init() {
	var animManag = initCanvas();
	currentAlg = new RedBlack(animManag, LOGICAL_CANVAS_WIDTH, LOGICAL_CANVAS_HEIGHT);
	if (typeof initInterfaz === "function") {
		initInterfaz(currentAlg, animManag);
	}
}
