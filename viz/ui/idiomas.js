// Diccionario de textos y cambio de idioma.
//
// El algoritmo NO genera texto: emite claves y argumentos. La traducción ocurre
// al pintar, así que cambiar de idioma reescribe también el paso que ya está en
// pantalla y todo el historial, sin tener que rehacer la animación.

var Idioma = (function () {
	"use strict";

	var TEXTOS = {
		es: {
			// ---- Interfaz ----
			"ui.idioma": "English",
			"ui.idiomaTitulo": "Switch to English",
			"ui.subtitulo": "Visualización paso a paso",
			"ui.reglasBtn": "Reglas y atajos",
			"ui.reglasBtnTitulo": "Reglas del árbol rojo-negro y atajos de teclado",
			"ui.operaciones": "Operaciones",
			"ui.animacion": "Animación",
			"ui.leyenda": "Leyenda",
			"ui.panelControles": "Panel de controles",
			"ui.panelOperaciones": "Operaciones sobre el árbol",
			"ui.panelAnimacion": "Controles de la animación",
			"ui.panelLeyenda": "Leyenda de colores",
			"ui.panelPasos": "Explicación del paso actual",
			"ui.lienzo": "Lienzo de la visualización del árbol",

			// ---- Botones de operaciones ----
			"ui.valor": "Valor numérico",
			"ui.valorTitulo": "Escribe un número y pulsa Insertar, Buscar o Eliminar (Enter inserta)",
			"ui.insertar": "Insertar",
			"ui.insertarTitulo": "Inserta el valor en el árbol (Enter)",
			"ui.buscar": "Buscar",
			"ui.buscarTitulo": "Busca el valor recorriendo el árbol",
			"ui.eliminar": "Eliminar",
			"ui.eliminarTitulo": "Elimina el valor del árbol",
			"ui.recorrido": "Recorrido",
			"ui.recorridoTitulo": "Recorrido en orden (in-order): imprime los valores ordenados",
			"ui.demo": "Demo 1→19",
			"ui.demoTitulo": "Reinicia el árbol e inserta los números del 1 al 19",
			"ui.limpiar": "Limpiar",
			"ui.limpiarTitulo": "Vacía el árbol",
			"ui.mostrarNulas": "Mostrar hojas nulas",
			"ui.mostrarNulasTitulo": "Muestra las hojas NIL negras que cuelgan de cada nodo",

			// ---- Reproducción ----
			"ui.reproducir": "▶  Reproducir",
			"ui.reproducirTitulo": "Reproducir la animación sin parar en cada paso (Espacio)",
			"ui.pausar": "❚❚  Pausar",
			"ui.pausarTitulo": "Pausar para avanzar paso a paso (Espacio)",
			"ui.anterior": "◀  Anterior",
			"ui.anteriorTitulo": "Retroceder un paso (flecha izquierda)",
			"ui.siguiente": "Siguiente  ▶",
			"ui.siguienteTitulo": "Avanzar un paso (flecha derecha)",
			"ui.alPrincipio": "Volver al principio de la operación (Inicio)",
			"ui.alFinal": "Ir al final de la operación (Fin)",
			"ui.velocidad": "Velocidad",
			"ui.estadoLista": "Lista",
			"ui.estadoCorriendo": "En marcha",
			"ui.estadoPausa": "En pausa",
			"ui.estadoFin": "Terminado",

			// ---- Panel de pasos ----
			"ui.listo": "Listo",
			"ui.contador": "Paso {0} de {1}",
			"ui.historial": "Historial",
			"ui.historialTitulo": "Ver los pasos anteriores de esta operación",
			"ui.historialVacio": "Todavía no hay pasos que mostrar.",
			"ui.propiedadesOk": "✓ Propiedades verificadas",
			"ui.bienvenida": "Escribe un número y pulsa <strong>Insertar</strong>. La animación arranca en pausa: usa <strong>Siguiente</strong> para avanzar paso a paso.",

			// ---- Zoom ----
			"ui.alejar": "Alejar",
			"ui.acercar": "Acercar",
			"ui.encajar": "Encajar",
			"ui.encajarTitulo": "Encajar el árbol en la vista",
			"ui.zoomGrupo": "Zoom del lienzo",

			// ---- Leyenda ----
			"leyenda.rojo": "Nodo rojo",
			"leyenda.negro": "Nodo negro",
			"leyenda.doble": "Doble negro",
			"leyenda.nula": "Hoja nula",
			"leyenda.foco": "Nodo en foco",
			"leyenda.recorrido": "Recorrido",

			// ---- Modal de reglas ----
			"reglas.titulo": "Reglas del árbol rojo-negro",
			"reglas.cerrar": "Cerrar",
			"reglas.r1": "Todo nodo es <b>rojo</b> o <b>negro</b>.",
			"reglas.r2": "La <b>raíz</b> siempre es negra.",
			"reglas.r3": "Todas las <b>hojas nulas</b> (NIL) son negras.",
			"reglas.r4": "Un nodo rojo <b>no puede tener hijos rojos</b> (nunca dos rojos seguidos).",
			"reglas.r5": "Desde cualquier nodo, todos los caminos hasta sus hojas nulas contienen el <b>mismo número de nodos negros</b> (altura negra).",
			"reglas.nota": "De ahí sale la garantía: ningún camino puede ser más del doble de largo que otro, así que buscar, insertar y eliminar cuestan O(log n).",
			"reglas.atajos": "Atajos de teclado",
			"reglas.a1": "<kbd>→</kbd> paso siguiente",
			"reglas.a2": "<kbd>←</kbd> paso anterior",
			"reglas.a3": "<kbd>Espacio</kbd> reproducir / pausar",
			"reglas.a4": "<kbd>Inicio</kbd> / <kbd>Fin</kbd> principio o final de la operación",
			"reglas.a5": "<kbd>Enter</kbd> (en el campo) insertar el valor",
			"reglas.credito": "Basado en la visualización de",

			// ---- Fases ----
			"fase.insertar": "Insertar",
			"fase.eliminar": "Eliminar",
			"fase.buscar": "Buscar",
			"fase.recorrido": "Recorrido",
			"fase.demo": "Demo",
			"fase.limpiar": "Limpiar",

			// ---- Casos ----
			"caso.insBase": "Caso base",
			"caso.insRaiz": "Caso raíz",
			"caso.ins1": "Caso 1 · Tío rojo",
			"caso.ins2": "Caso 2 · Triángulo",
			"caso.ins3": "Caso 3 · Línea recta",
			"caso.del1": "Caso 1 · Hermano rojo",
			"caso.del2": "Caso 2 · Hermano negro con hijos negros",
			"caso.del3": "Caso 3 · Sobrino cercano rojo",
			"caso.del4": "Caso 4 · Sobrino lejano rojo",
			"caso.delRaiz": "Caso raíz",
			"caso.fin": "Operación completada",

			// ---- Validador ----
			"val.raizNegra": "La raíz debería ser negra.",
			"val.dobleNegro": "Ha quedado un nodo doble negro sin resolver ({0}).",
			"val.dosRojos": "Dos rojos consecutivos: {0} → {1}.",
			"val.alturaDesigual": "Altura negra desigual bajo {0} ({1} vs {2}).",

			// ---- Limpiar y demo ----
			"lim.yaVacio": "El árbol ya estaba vacío.",
			"lim.hecho": "Árbol vaciado. Puedes empezar de cero.",
			"demo.vaciar": "Se vacía el árbol para empezar la demostración desde cero.",
			"demo.inicio": "Demostración: se insertan los números del 1 al 19, uno a uno.",
			"demo.fin": "Demostración terminada: 19 valores insertados. Fíjate en que la altura del árbol apenas crece.",

			// ---- Recorrido ----
			"rec.vacio": "El árbol está vacío: no hay nada que recorrer.",
			"rec.inicio": "Recorrido en orden: primero el subárbol izquierdo, después el nodo, después el derecho. El resultado sale ordenado de menor a mayor.",
			"rec.fin": "Recorrido completo. Los valores han salido ordenados: esa es la propiedad de todo árbol binario de búsqueda.",
			"rec.bajaIzq": "Bajamos al subárbol izquierdo de {0}: lo de la izquierda va antes.",
			"rec.bajaDer": "Bajamos al subárbol derecho de {0}.",
			"rec.volver": "Volvemos a {0}.",
			"rec.visitar": "Visitamos {0} y lo añadimos a la salida.",

			// ---- Buscar ----
			"bus.arbolVacio": "El árbol está vacío, así que {0} no puede estar.",
			"bus.hojaNula": "Hemos llegado a una hoja nula: por debajo no hay más nodos.",
			"bus.iguales": "Comparamos {0} con {1}: son iguales. ¡Encontrado!",
			"bus.menor": "Comparamos {0} con {1}: {0} < {1}, así que solo puede estar en el subárbol izquierdo.",
			"bus.mayor": "Comparamos {0} con {1}: {0} > {1}, así que solo puede estar en el subárbol derecho.",
			"bus.finSi": "El valor {0} está en el árbol.",
			"bus.finNo": "El valor {0} no está en el árbol.",

			// ---- Insertar ----
			"ins.raizVacia": "El árbol estaba vacío: {0} entra como raíz y se pinta de NEGRO, porque la raíz de un árbol rojo-negro siempre es negra.",
			"ins.finRaiz": "Insertado {0} como raíz del árbol.",
			"ins.naceRojo": "El nodo {0} nace ROJO. Se inserta siempre en rojo porque así no cambia la altura negra de ningún camino; como mucho habrá que arreglar un doble rojo.",
			"ins.compIzq": "Comparamos {0} < {1}: bajamos por la izquierda.",
			"ins.compDer": "Comparamos {0} ≥ {1}: bajamos por la derecha.",
			"ins.compIzqHoja": "Comparamos {0} < {1}: bajamos por la izquierda. Ahí abajo hay una hoja nula: ese es el sitio de {0}.",
			"ins.compDerHoja": "Comparamos {0} ≥ {1}: bajamos por la derecha. Ahí abajo hay una hoja nula: ese es el sitio de {0}.",
			"ins.colocado": "El nodo {0} ocupa el lugar de esa hoja nula, colgando de {1}. Ahora toca comprobar si ha aparecido un doble rojo.",
			"ins.fin": "Insertado {0}. El árbol vuelve a cumplir las propiedades rojo-negro.",
			"ins.raizRoja": "El nodo ha llegado a ser la raíz y estaba rojo. La raíz siempre es negra, así que se repinta: eso sube en uno la altura negra de TODOS los caminos a la vez, y por eso no rompe nada.",
			"ins.padreNegro": "El padre ({0}) es NEGRO, así que no hay dos rojos seguidos. No hay que arreglar nada.",
			"ins.padreRojoRaiz": "El padre es rojo y además es la raíz. Basta con pintar la raíz de NEGRO y el conflicto desaparece.",
			"ins.caso1a": "Hay doble rojo ({0} y {1}) y el TÍO ({2}) también es rojo. Con el tío rojo no hace falta rotar: basta con recolorear.",
			"ins.caso1b": "Padre y tío pasan a NEGRO y el abuelo ({0}) pasa a ROJO. Cada camino sigue teniendo la misma cantidad de nodos negros que antes.",
			"ins.caso1c": "Pero el abuelo ahora es rojo y su propio padre podría serlo también, así que repetimos la comprobación un nivel más arriba.",
			"ins.caso2a": "Hay doble rojo y el TÍO es negro (o no existe). Además {0}, {1} y {2} forman un TRIÁNGULO (el nodo está en el lado interior).",
			"ins.caso2b": "Con un triángulo no se puede rotar directamente sobre el abuelo. Primero rotamos sobre el PADRE para convertirlo en una línea recta.",
			"ins.caso2c": "Ya tenemos una línea recta. Seguimos con el Caso 3.",
			"ins.caso3a": "El nodo, su padre y su abuelo están alineados en LÍNEA RECTA y el tío es negro. Esto se arregla con una sola rotación sobre el abuelo ({0}).",
			"ins.caso3b": "Intercambiamos los colores: el padre ({0}) pasa a NEGRO y el abuelo ({1}) a ROJO. Ahora la rotación.",
			"ins.caso3c": "Tras la rotación, {0} queda arriba en negro con dos hijos rojos. Ya no hay dos rojos seguidos y la altura negra no ha cambiado: la inserción termina aquí.",

			// ---- Rotaciones ----
			"rot.derecha": "Rotación simple a la DERECHA sobre {0}: {1} sube y {0} baja a ser su hijo derecho.",
			"rot.izquierda": "Rotación simple a la IZQUIERDA sobre {0}: {1} sube y {0} baja a ser su hijo izquierdo.",

			// ---- Eliminar ----
			"del.arbolVacio": "El árbol está vacío: no hay nada que eliminar.",
			"del.inicio": "Vamos a eliminar {0}. Primero hay que localizarlo, igual que en una búsqueda.",
			"del.hojaDobleNegra": "Al quitar un nodo negro, ese camino ha perdido un negro. Lo representamos con una hoja DOBLE NEGRA: es una deuda que hay que devolver antes de terminar.",
			"del.caso2a": "El hermano ({0}) es NEGRO y sus dos hijos también. Nadie del lado del hermano tiene un rojo que prestarnos, así que la deuda no se puede pagar aquí: hay que subirla al padre.",
			"del.caso2b": "Quitamos un negro a cada hermano: N vuelve a ser negro normal y S se pinta de ROJO. Ese negro que sobra se lo pasamos al padre ({0}).",
			"del.caso2padreRojo": "El padre era ROJO: absorbe el negro extra pasando a NEGRO y la deuda queda saldada. Hemos terminado.",
			"del.caso2padreNegro": "El padre ya era NEGRO, así que ahora es él quien queda DOBLE NEGRO. Repetimos el análisis un nivel más arriba.",
			"del.caso1a": "El hermano ({0}) es ROJO. Entonces el padre y los sobrinos son negros. Este caso no resuelve la deuda: lo que hace es transformarla en uno de los otros tres.",
			"del.caso1b": "Intercambiamos los colores del padre y del hermano y rotamos el padre en dirección a N. Así N pasa a tener un hermano NEGRO.",
			"del.caso1c": "Ya tenemos a N con un hermano negro y un padre rojo. Volvemos a analizar el caso con esta nueva figura.",
			"del.caso3a": "El hermano ({0}) es NEGRO, su hijo CERCANO a N es rojo y el LEJANO es negro. El rojo está en el lado que no nos sirve para rotar.",
			"del.caso3b": "Intercambiamos los colores del hermano y de ese sobrino rojo y rotamos el hermano en dirección contraria a N, para mover el rojo al lado lejano.",
			"del.caso3c": "Ahora el sobrino rojo está en el lado lejano: esto ya es el Caso 4, que sí cierra la deuda.",
			"del.caso4a": "El hermano ({0}) es NEGRO y su hijo LEJANO a N es ROJO. Este es el caso que resuelve la deuda de una vez.",
			"del.caso4b": "El hermano toma el color del padre, el padre y el sobrino lejano se pintan de NEGRO, y rotamos el padre en dirección a N.",
			"del.caso4c": "Ese camino recupera el negro que había perdido y ningún otro camino cambia. La deuda queda saldada y el borrado termina.",
			"del.raizDobleNegro": "El doble negro ha subido hasta la RAÍZ. Aquí se descarta sin más: quitar un negro a la raíz baja en uno la altura negra de todos los caminos por igual.",
			"del.noEncontrado": "Hemos llegado a una hoja nula sin encontrar el valor.",
			"del.finNoEncontrado": "El valor {0} no está en el árbol: no se puede eliminar.",
			"del.compMenor": "Comparamos {0} con {1}: es menor, seguimos por el subárbol izquierdo.",
			"del.compMayor": "Comparamos {0} con {1}: es mayor, seguimos por el subárbol derecho.",
			"del.bajaIzq": "Bajamos al hijo izquierdo de {0}.",
			"del.bajaDer": "Bajamos al hijo derecho de {0}.",
			"del.encontradoNegro": "Encontrado: {0} es el nodo a eliminar y es NEGRO.",
			"del.encontradoRojo": "Encontrado: {0} es el nodo a eliminar y es ROJO.",
			"del.encontradoNegroRaiz": "Encontrado: {0} es el nodo a eliminar y es NEGRO. Además es la raíz.",
			"del.encontradoRojoRaiz": "Encontrado: {0} es el nodo a eliminar y es ROJO. Además es la raíz.",
			"del.sinHijosNegro": "El nodo no tiene hijos reales (solo hojas nulas) y es NEGRO. Al quitarlo, su camino se queda con un negro de menos: aparecerá un DOBLE NEGRO.",
			"del.sinHijosRojo": "El nodo no tiene hijos reales y es ROJO. Quitar un rojo no cambia la altura negra de ningún camino, así que simplemente desaparece.",
			"del.eraUnico": "Era el único nodo del árbol, que queda vacío.",
			"del.finVacio": "Eliminado {0}. El árbol está vacío.",
			"del.unHijoNegro": "El nodo es NEGRO y tiene un único hijo real ({0}). En un árbol rojo-negro ese hijo es forzosamente ROJO: ocupará su sitio y se repintará de NEGRO para devolver el negro perdido.",
			"del.unHijoRojo": "El nodo es ROJO y tiene un único hijo real ({0}): el hijo ocupa su lugar sin más ajustes.",
			"del.eraRaizHijo": "Era la raíz: su hijo {0} pasa a ser la nueva raíz y se pinta de NEGRO.",
			"del.hijoEngancha": "El hijo {0} se engancha directamente al padre {1}, ocupando el hueco.",
			"del.hijoAbsorbe": "El hijo rojo absorbe el negro que faltaba y pasa a NEGRO. El camino recupera su altura negra sin tocar nada más.",
			"del.dosHijos": "El nodo tiene DOS hijos reales, así que no se puede quitar directamente. Buscamos su predecesor en orden: el mayor del subárbol izquierdo (izquierda una vez, y luego siempre a la derecha).",
			"del.pasoIzq": "Un paso a la izquierda, hasta {0}.",
			"del.todoDerecha": "Todo lo a la derecha que se pueda: llegamos a {0}.",
			"del.copiaPredecesor": "Copiamos el valor del predecesor ({0}) dentro del nodo que queríamos borrar. El orden del árbol se mantiene intacto.",
			"del.valorDuplicado": "Ahora el valor {0} está duplicado. El borrado real es el del nodo de abajo, que tiene como mucho un hijo: un caso que ya sabemos resolver.",
			"del.predNegroSinHijos": "El nodo predecesor era NEGRO y no tenía hijos: su camino pierde un negro.",
			"del.predRojoSinHijos": "El nodo predecesor era ROJO y sus dos hijos eran nulos: desaparece sin más ajustes.",
			"del.predHijoIzq": "El hijo izquierdo del predecesor ocupa su lugar.",
			"del.predNegroConHijo": "El predecesor era NEGRO y tenía un hijo, que es forzosamente ROJO: ese hijo se repinta de NEGRO y devuelve el negro perdido.",
			"del.predNegroSinReales": "El predecesor era NEGRO y no tenía hijos reales: aparece un DOBLE NEGRO que hay que resolver.",
			"del.predRojo": "El predecesor era ROJO: quitarlo no altera la altura negra de ningún camino.",
			"del.fin": "Eliminado {0}. El árbol vuelve a cumplir las propiedades rojo-negro."
		},

		en: {
			// ---- Interface ----
			"ui.idioma": "Español",
			"ui.idiomaTitulo": "Cambiar a español",
			"ui.subtitulo": "Step-by-step visualization",
			"ui.reglasBtn": "Rules & shortcuts",
			"ui.reglasBtnTitulo": "Red-black tree rules and keyboard shortcuts",
			"ui.operaciones": "Operations",
			"ui.animacion": "Animation",
			"ui.leyenda": "Legend",
			"ui.panelControles": "Control panel",
			"ui.panelOperaciones": "Tree operations",
			"ui.panelAnimacion": "Animation controls",
			"ui.panelLeyenda": "Colour legend",
			"ui.panelPasos": "Current step explanation",
			"ui.lienzo": "Tree visualization canvas",

			// ---- Operation buttons ----
			"ui.valor": "Numeric value",
			"ui.valorTitulo": "Type a number and press Insert, Find or Delete (Enter inserts)",
			"ui.insertar": "Insert",
			"ui.insertarTitulo": "Insert the value into the tree (Enter)",
			"ui.buscar": "Find",
			"ui.buscarTitulo": "Search for the value by walking the tree",
			"ui.eliminar": "Delete",
			"ui.eliminarTitulo": "Remove the value from the tree",
			"ui.recorrido": "Traversal",
			"ui.recorridoTitulo": "In-order traversal: prints the values in sorted order",
			"ui.demo": "Demo 1→19",
			"ui.demoTitulo": "Reset the tree and insert the numbers 1 through 19",
			"ui.limpiar": "Clear",
			"ui.limpiarTitulo": "Empty the tree",
			"ui.mostrarNulas": "Show null leaves",
			"ui.mostrarNulasTitulo": "Show the black NIL leaves hanging from every node",

			// ---- Playback ----
			"ui.reproducir": "▶  Play",
			"ui.reproducirTitulo": "Play the animation without stopping at each step (Space)",
			"ui.pausar": "❚❚  Pause",
			"ui.pausarTitulo": "Pause to move forward one step at a time (Space)",
			"ui.anterior": "◀  Previous",
			"ui.anteriorTitulo": "Go back one step (left arrow)",
			"ui.siguiente": "Next  ▶",
			"ui.siguienteTitulo": "Advance one step (right arrow)",
			"ui.alPrincipio": "Back to the start of the operation (Home)",
			"ui.alFinal": "Jump to the end of the operation (End)",
			"ui.velocidad": "Speed",
			"ui.estadoLista": "Ready",
			"ui.estadoCorriendo": "Running",
			"ui.estadoPausa": "Paused",
			"ui.estadoFin": "Finished",

			// ---- Step panel ----
			"ui.listo": "Ready",
			"ui.contador": "Step {0} of {1}",
			"ui.historial": "History",
			"ui.historialTitulo": "See the previous steps of this operation",
			"ui.historialVacio": "No steps to show yet.",
			"ui.propiedadesOk": "✓ Properties verified",
			"ui.bienvenida": "Type a number and press <strong>Insert</strong>. The animation starts paused: use <strong>Next</strong> to move one step at a time.",

			// ---- Zoom ----
			"ui.alejar": "Zoom out",
			"ui.acercar": "Zoom in",
			"ui.encajar": "Fit",
			"ui.encajarTitulo": "Fit the tree to the view",
			"ui.zoomGrupo": "Canvas zoom",

			// ---- Legend ----
			"leyenda.rojo": "Red node",
			"leyenda.negro": "Black node",
			"leyenda.doble": "Double black",
			"leyenda.nula": "Null leaf",
			"leyenda.foco": "Focused node",
			"leyenda.recorrido": "Traversal",

			// ---- Rules modal ----
			"reglas.titulo": "Red-black tree rules",
			"reglas.cerrar": "Close",
			"reglas.r1": "Every node is either <b>red</b> or <b>black</b>.",
			"reglas.r2": "The <b>root</b> is always black.",
			"reglas.r3": "Every <b>null leaf</b> (NIL) is black.",
			"reglas.r4": "A red node <b>cannot have red children</b> (never two reds in a row).",
			"reglas.r5": "From any node, every path down to its null leaves contains the <b>same number of black nodes</b> (black height).",
			"reglas.nota": "That is where the guarantee comes from: no path can be more than twice as long as another, so search, insert and delete all cost O(log n).",
			"reglas.atajos": "Keyboard shortcuts",
			"reglas.a1": "<kbd>→</kbd> next step",
			"reglas.a2": "<kbd>←</kbd> previous step",
			"reglas.a3": "<kbd>Space</kbd> play / pause",
			"reglas.a4": "<kbd>Home</kbd> / <kbd>End</kbd> start or end of the operation",
			"reglas.a5": "<kbd>Enter</kbd> (in the field) insert the value",
			"reglas.credito": "Based on the visualization by",

			// ---- Phases ----
			"fase.insertar": "Insert",
			"fase.eliminar": "Delete",
			"fase.buscar": "Find",
			"fase.recorrido": "Traversal",
			"fase.demo": "Demo",
			"fase.limpiar": "Clear",

			// ---- Cases ----
			"caso.insBase": "Base case",
			"caso.insRaiz": "Root case",
			"caso.ins1": "Case 1 · Red uncle",
			"caso.ins2": "Case 2 · Triangle",
			"caso.ins3": "Case 3 · Straight line",
			"caso.del1": "Case 1 · Red sibling",
			"caso.del2": "Case 2 · Black sibling with black children",
			"caso.del3": "Case 3 · Red near nephew",
			"caso.del4": "Case 4 · Red far nephew",
			"caso.delRaiz": "Root case",
			"caso.fin": "Operation complete",

			// ---- Validator ----
			"val.raizNegra": "The root should be black.",
			"val.dobleNegro": "A double black node was left unresolved ({0}).",
			"val.dosRojos": "Two reds in a row: {0} → {1}.",
			"val.alturaDesigual": "Uneven black height below {0} ({1} vs {2}).",

			// ---- Clear and demo ----
			"lim.yaVacio": "The tree was already empty.",
			"lim.hecho": "Tree cleared. You can start from scratch.",
			"demo.vaciar": "Clearing the tree to start the demo from scratch.",
			"demo.inicio": "Demo: inserting the numbers 1 through 19, one at a time.",
			"demo.fin": "Demo finished: 19 values inserted. Notice how little the height of the tree grows.",

			// ---- Traversal ----
			"rec.vacio": "The tree is empty: there is nothing to traverse.",
			"rec.inicio": "In-order traversal: left subtree first, then the node, then the right one. The result comes out sorted from smallest to largest.",
			"rec.fin": "Traversal complete. The values came out sorted: that is the property of every binary search tree.",
			"rec.bajaIzq": "Going down into the left subtree of {0}: everything on the left comes first.",
			"rec.bajaDer": "Going down into the right subtree of {0}.",
			"rec.volver": "Back to {0}.",
			"rec.visitar": "Visiting {0} and adding it to the output.",

			// ---- Find ----
			"bus.arbolVacio": "The tree is empty, so {0} cannot be in it.",
			"bus.hojaNula": "We reached a null leaf: there are no more nodes below.",
			"bus.iguales": "Comparing {0} with {1}: they are equal. Found it!",
			"bus.menor": "Comparing {0} with {1}: {0} < {1}, so it can only be in the left subtree.",
			"bus.mayor": "Comparing {0} with {1}: {0} > {1}, so it can only be in the right subtree.",
			"bus.finSi": "The value {0} is in the tree.",
			"bus.finNo": "The value {0} is not in the tree.",

			// ---- Insert ----
			"ins.raizVacia": "The tree was empty: {0} comes in as the root and is painted BLACK, because the root of a red-black tree is always black.",
			"ins.finRaiz": "Inserted {0} as the root of the tree.",
			"ins.naceRojo": "Node {0} is born RED. Insertion always starts red because that way the black height of every path stays the same; at worst there will be a double red to fix.",
			"ins.compIzq": "Comparing {0} < {1}: going down to the left.",
			"ins.compDer": "Comparing {0} ≥ {1}: going down to the right.",
			"ins.compIzqHoja": "Comparing {0} < {1}: going down to the left. There is a null leaf down there: that is where {0} belongs.",
			"ins.compDerHoja": "Comparing {0} ≥ {1}: going down to the right. There is a null leaf down there: that is where {0} belongs.",
			"ins.colocado": "Node {0} takes the place of that null leaf, hanging from {1}. Now we check whether a double red has appeared.",
			"ins.fin": "Inserted {0}. The tree satisfies the red-black properties again.",
			"ins.raizRoja": "The node ended up being the root and it was red. The root is always black, so it gets repainted: that raises the black height of ALL paths by one at once, which is why it breaks nothing.",
			"ins.padreNegro": "The parent ({0}) is BLACK, so there are no two reds in a row. Nothing to fix.",
			"ins.padreRojoRaiz": "The parent is red and it is also the root. Painting the root BLACK is enough and the conflict disappears.",
			"ins.caso1a": "There is a double red ({0} and {1}) and the UNCLE ({2}) is red too. With a red uncle there is no need to rotate: recolouring is enough.",
			"ins.caso1b": "Parent and uncle turn BLACK and the grandparent ({0}) turns RED. Every path still holds the same number of black nodes as before.",
			"ins.caso1c": "But the grandparent is red now and its own parent could be red as well, so we repeat the check one level up.",
			"ins.caso2a": "There is a double red and the UNCLE is black (or does not exist). On top of that {0}, {1} and {2} form a TRIANGLE (the node is on the inner side).",
			"ins.caso2b": "With a triangle you cannot rotate around the grandparent directly. First we rotate around the PARENT to turn it into a straight line.",
			"ins.caso2c": "Now we have a straight line. On to Case 3.",
			"ins.caso3a": "The node, its parent and its grandparent are lined up in a STRAIGHT LINE and the uncle is black. This is fixed with a single rotation around the grandparent ({0}).",
			"ins.caso3b": "We swap the colours: the parent ({0}) turns BLACK and the grandparent ({1}) turns RED. Now the rotation.",
			"ins.caso3c": "After the rotation, {0} sits on top in black with two red children. There are no two reds in a row any more and the black height has not changed: the insertion ends here.",

			// ---- Rotations ----
			"rot.derecha": "Single RIGHT rotation around {0}: {1} moves up and {0} moves down to become its right child.",
			"rot.izquierda": "Single LEFT rotation around {0}: {1} moves up and {0} moves down to become its left child.",

			// ---- Delete ----
			"del.arbolVacio": "The tree is empty: there is nothing to delete.",
			"del.inicio": "We are going to delete {0}. First we have to locate it, just like in a search.",
			"del.hojaDobleNegra": "Removing a black node left that path one black short. We represent it with a DOUBLE BLACK leaf: a debt that has to be paid off before we finish.",
			"del.caso2a": "The sibling ({0}) is BLACK and so are both of its children. Nobody on the sibling's side has a red to lend us, so the debt cannot be paid here: it has to be pushed up to the parent.",
			"del.caso2b": "We take one black off each sibling: N goes back to plain black and S is painted RED. The leftover black is handed to the parent ({0}).",
			"del.caso2padreRojo": "The parent was RED: it absorbs the extra black by turning BLACK and the debt is settled. We are done.",
			"del.caso2padreNegro": "The parent was already BLACK, so now it is the one left DOUBLE BLACK. We repeat the analysis one level up.",
			"del.caso1a": "The sibling ({0}) is RED. That means the parent and the nephews are black. This case does not settle the debt: what it does is turn it into one of the other three.",
			"del.caso1b": "We swap the colours of the parent and the sibling and rotate the parent towards N. That gives N a BLACK sibling.",
			"del.caso1c": "Now N has a black sibling and a red parent. We analyse the case again with this new shape.",
			"del.caso3a": "The sibling ({0}) is BLACK, its child NEAR to N is red and the FAR one is black. The red is on the side that is no use for rotating.",
			"del.caso3b": "We swap the colours of the sibling and that red nephew and rotate the sibling away from N, to move the red to the far side.",
			"del.caso3c": "Now the red nephew is on the far side: this is Case 4, which does settle the debt.",
			"del.caso4a": "The sibling ({0}) is BLACK and its child FAR from N is RED. This is the case that settles the debt in one go.",
			"del.caso4b": "The sibling takes the parent's colour, the parent and the far nephew are painted BLACK, and we rotate the parent towards N.",
			"del.caso4c": "That path gets back the black it had lost and no other path changes. The debt is settled and the deletion ends.",
			"del.raizDobleNegro": "The double black has risen all the way to the ROOT. Here it is simply discarded: taking one black off the root lowers the black height of every path equally.",
			"del.noEncontrado": "We reached a null leaf without finding the value.",
			"del.finNoEncontrado": "The value {0} is not in the tree: it cannot be deleted.",
			"del.compMenor": "Comparing {0} with {1}: it is smaller, we carry on through the left subtree.",
			"del.compMayor": "Comparing {0} with {1}: it is larger, we carry on through the right subtree.",
			"del.bajaIzq": "Going down to the left child of {0}.",
			"del.bajaDer": "Going down to the right child of {0}.",
			"del.encontradoNegro": "Found it: {0} is the node to delete and it is BLACK.",
			"del.encontradoRojo": "Found it: {0} is the node to delete and it is RED.",
			"del.encontradoNegroRaiz": "Found it: {0} is the node to delete and it is BLACK. It is also the root.",
			"del.encontradoRojoRaiz": "Found it: {0} is the node to delete and it is RED. It is also the root.",
			"del.sinHijosNegro": "The node has no real children (only null leaves) and it is BLACK. Removing it leaves its path one black short: a DOUBLE BLACK will appear.",
			"del.sinHijosRojo": "The node has no real children and it is RED. Removing a red does not change the black height of any path, so it simply disappears.",
			"del.eraUnico": "It was the only node in the tree, which is now empty.",
			"del.finVacio": "Deleted {0}. The tree is empty.",
			"del.unHijoNegro": "The node is BLACK and has a single real child ({0}). In a red-black tree that child is necessarily RED: it will take its place and be repainted BLACK to give back the missing black.",
			"del.unHijoRojo": "The node is RED and has a single real child ({0}): the child takes its place with no further adjustments.",
			"del.eraRaizHijo": "It was the root: its child {0} becomes the new root and is painted BLACK.",
			"del.hijoEngancha": "Child {0} hooks straight onto parent {1}, filling the gap.",
			"del.hijoAbsorbe": "The red child absorbs the missing black and turns BLACK. The path recovers its black height without touching anything else.",
			"del.dosHijos": "The node has TWO real children, so it cannot be removed directly. We look for its in-order predecessor: the largest of the left subtree (left once, then right as far as possible).",
			"del.pasoIzq": "One step to the left, to {0}.",
			"del.todoDerecha": "As far right as possible: we reach {0}.",
			"del.copiaPredecesor": "We copy the predecessor's value ({0}) into the node we wanted to delete. The order of the tree stays intact.",
			"del.valorDuplicado": "The value {0} is duplicated now. The real deletion is the node below, which has at most one child: a case we already know how to solve.",
			"del.predNegroSinHijos": "The predecessor node was BLACK and had no children: its path loses one black.",
			"del.predRojoSinHijos": "The predecessor node was RED and both of its children were null: it disappears with no further adjustments.",
			"del.predHijoIzq": "The predecessor's left child takes its place.",
			"del.predNegroConHijo": "The predecessor was BLACK and had one child, which is necessarily RED: that child is repainted BLACK and gives back the missing black.",
			"del.predNegroSinReales": "The predecessor was BLACK and had no real children: a DOUBLE BLACK appears and has to be resolved.",
			"del.predRojo": "The predecessor was RED: removing it does not alter the black height of any path.",
			"del.fin": "Deleted {0}. The tree satisfies the red-black properties again."
		}
	};

	var actual = "es";
	var oyentes = [];

	function traducir(clave, args) {
		if (!clave) {
			return "";
		}
		var tabla = TEXTOS[actual] || TEXTOS.es;
		var texto = tabla[clave];
		if (texto === undefined) {
			texto = TEXTOS.es[clave];
		}
		if (texto === undefined) {
			return clave;   // clave sin traducir: se ve en pantalla y se detecta enseguida
		}
		if (args && args.length) {
			for (var i = 0; i < args.length; i++) {
				texto = texto.split("{" + i + "}").join(String(args[i]));
			}
		}
		return texto;
	}

	return {
		LISTA: ["es", "en"],

		get: function () {
			return actual;
		},

		set: function (codigo) {
			if (!TEXTOS[codigo] || codigo === actual) {
				return;
			}
			actual = codigo;
			try {
				localStorage.setItem("rbIdioma", codigo);
			}
			catch (e) {
				// Sin almacenamiento (por ejemplo, abierto con file:// y cookies
				// bloqueadas): el idioma simplemente no se recuerda.
			}
			document.documentElement.setAttribute("lang", codigo);
			for (var i = 0; i < oyentes.length; i++) {
				oyentes[i]();
			}
		},

		alternar: function () {
			this.set(actual === "es" ? "en" : "es");
		},

		restaurar: function () {
			var guardado = null;
			try {
				guardado = localStorage.getItem("rbIdioma");
			}
			catch (e) {
				guardado = null;
			}
			if (guardado && TEXTOS[guardado]) {
				actual = guardado;
				document.documentElement.setAttribute("lang", guardado);
			}
		},

		alCambiar: function (fn) {
			oyentes.push(fn);
		},

		t: traducir
	};
})();
