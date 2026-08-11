# Árbol rojo-negro, paso a paso

Visualización interactiva y **paso a paso** de un árbol rojo-negro (insertar, buscar, eliminar y recorrido en orden), pensada para explicarlo en clase.

Es un *fork* mejorado de las [Data Structure Visualizations de David Galles (USF)](https://www.cs.usfca.edu/~galles/visualization/RedBlack.html): interfaz en español rediseñada para que quepa en pantalla sin scroll, narración escrita de cada paso con el caso del algoritmo que se está aplicando, historial navegable, validación automática de las propiedades del árbol y varias correcciones sobre el algoritmo original.

## Cómo ejecutarlo

Todo el código está en la carpeta [`viz/`](viz/).

1. Abre [`viz/index.html`](viz/index.html) en el navegador (doble clic o arrastrar el archivo).

2. Opcional — servidor local (por si tu navegador restringe `file://`):

```bash
cd viz && python -m http.server 8080
```

Luego entra en `http://localhost:8080/`.

> Si tras actualizar el código ves la versión antigua, fuerza la recarga con `Ctrl+F5`. Los recursos llevan un `?v=N` en [`viz/index.html`](viz/index.html): súbelo cuando publiques cambios para invalidar la caché de los alumnos.

## Cómo se usa

- Escribe un número y pulsa **Insertar** (o `Enter`), **Buscar** o **Eliminar**.
- **Recorrido** imprime los valores en orden; **Demo 1→19** reinicia el árbol y muestra cómo apenas crece la altura; **Limpiar** lo vacía.
- La animación **arranca en pausa**: cada pulsación de **Siguiente** avanza un paso y el panel inferior explica exactamente qué está pasando y en qué caso del algoritmo estás.
- **Historial** despliega los pasos anteriores de la operación en curso.
- **Reglas y atajos** (arriba a la derecha) recuerda las cinco propiedades del árbol.

Atajos: `→` siguiente · `←` anterior · `Espacio` reproducir/pausar · `Inicio`/`Fin` principio o final · `Esc` cerrar la ayuda.

## Estructura

| Qué | Dónde |
|-----|--------|
| Lógica del árbol, narración de los pasos y controles | [`viz/algorithm/RedBlack.js`](viz/algorithm/RedBlack.js) |
| Clase base de algoritmos (Galles) | [`viz/algorithm/Algorithm.js`](viz/algorithm/Algorithm.js) |
| Panel de pasos, historial, zoom y atajos | [`viz/ui/interfaz.js`](viz/ui/interfaz.js) |
| Motor de animación y cámara del lienzo | [`viz/animation/`](viz/animation/) |
| Entrada HTML | [`viz/index.html`](viz/index.html) |
| Estilos | [`viz/css/visualization.css`](viz/css/visualization.css) |

### Cómo funciona la narración

El algoritmo nunca emite un paso mudo: todo pasa por `RedBlack.prototype.paso(caso, detalle, estado)`, que escribe el texto y su `Step` juntos. Ese texto viaja por el "canal de narración" (la etiqueta con identificador `0`, que no se dibuja en el lienzo) hasta `ObjectManager.setText`, que lo reenvía al panel HTML. Como el mecanismo de deshacer del motor también termina llamando a `setText`, el panel se sincroniza igual hacia delante que hacia atrás.

El formato interno del mensaje es `fase§§caso§§detalle§§estado`.

### Validación de propiedades

Al terminar cada operación, `validarPropiedades()` comprueba las invariantes del árbol (raíz negra, sin dos rojos consecutivos, sin dobles negros pendientes y altura negra uniforme). El resultado se muestra como `✓ Propiedades verificadas` o como un aviso en el panel de pasos.

### Casos del algoritmo

Los casos van numerados **en el orden en que ocurren** en la animación:

- **Inserción** — Caso 1: tío rojo (recoloreo) · Caso 2: triángulo (rotación sobre el padre) · Caso 3: línea recta (rotación sobre el abuelo).
- **Eliminación** (resolución del doble negro) — Caso 1: hermano rojo · Caso 2: hermano negro con hijos negros · Caso 3: sobrino cercano rojo · Caso 4: sobrino lejano rojo.

Más contexto sobre el sistema de visualizaciones original: [source / tutorial USF](https://www.cs.usfca.edu/~galles/visualization/source.html).

## Licencia

Este proyecto es una obra derivada y combina varias licencias:

- Las **aportaciones de este repositorio** (rediseño de la interfaz, narración paso a paso, cámara del lienzo, validador de propiedades y correcciones del algoritmo) se publican bajo licencia MIT — ver [`LICENSE`](LICENSE).
- El **motor de animación original** de David Galles (Copyright 2011, University of San Francisco) se distribuye bajo licencia FreeBSD / BSD de 2 cláusulas. Cada fichero afectado conserva su cabecera de licencia original.
- **jQuery** y **jQuery UI** mantienen su licencia dual MIT / GPLv2.

El detalle completo, con los textos de licencia y los ficheros que cubre cada una, está en [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
