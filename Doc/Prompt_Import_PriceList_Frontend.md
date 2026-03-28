# Prompt Claude Code: Modal con Plantillas de Importación (Frontend)

Copia este texto y pégalo en tu sesión de Claude Code apuntando a la carpeta del Frontend (`ProyectoFerreteria`).

```md
Hola Claude. Actúa como un Desarrollador UI/UX Senior experto en React y Tailwind CSS.

Tenemos que armar la UX definitiva para el **"Caso de Uso Rey"**: La carga masiva de precios mediante Plantillas Estandarizadas.

**EL FLUJO UX DETERMINADO:**
Los proveedores envían PDFs y excels caóticos inservibles. Para estandarizar, obligaremos al usuario de la ferretería a hacer un flujo de 3 pasos re simple en la UI:
1. "Descargar Plantilla del Sistema" (Excel estandarizado para ese proveedor).
2. Llenar los datos.
3. Arrastrar y Soltar (Dropzone) esa plantilla llena para subirla, decidiendo ahí mismo si se pisan los precios de venta de mostrador.

**ESTRATEGIA DE EJECUCIÓN:**
Orquesta la implementación revisando la vista de `ProveedorDetailsPage` o donde estén las listas de precios. Implementa en un flujo ininterrumpido.

### ETAPA ÚNICA: Componente de Importación Avanzada

1. **Botón Disparador**:
   - En la sección "Listas de Precios" del Detalle del Proveedor, agrega un action button destacado "Carga Masiva (Excel)".

2. **El Modal de Carga Masiva (`BulkPriceImportModal.jsx` o similar)**:
   - Usa diseño Premium (glassmorphism, Tailwind).
   - **Paso 1 (Visual)**: Un bloque instructivo con un botón grande `[Descargar Plantilla Base]`. Al clickearlo, hace GET a `GET /ProductoListaPrecioProveedor/{idLista}/plantilla-excel` y descarga el archivo automáticamente.
   - **Paso 2 (Visual)**: Un Dropzone muy intuitivo animando al usuario a arrastrar la plantilla ya rellenada (ícono de Excel o nube).
   - **Paso 3 (Decisión Comercial)**: Un Checkbox o Switch toggle súper visible: *"Actualizar Precios de Venta al Público"*. Ayuda visual que aclare: "El precio de góndola de estos productos se recalculará automáticamente usando el Nuevo Costo multiplicado por su Margen de Ganancia de este proveedor".

3. **Subida y Estado (Submit)**:
   - Al darle a "Procesar", envía el File y el Bool a `POST /ProductoListaPrecioProveedor/{idLista}/importar` como `multipart/form-data`.
   - Mientras dure la request, bloquea el Modal con un Spinner (para evitar dobles clicks).

4. **Feedback Final (Toast/Alert) y Artículos No Encontrados**:
   - Al responder el 200 OK del Backend, tira un Toast o resumen hermoso: "¡Éxito! 45 líneas procesadas y actualizadas".
   - **IMPORTANTE:** El backend te devolverá un listado de "Nuevos Artículos Ignorados" (productos que el operario pegó en el Excel pero que no están dados de alta en el sistema). Si esta lista no viene vacía, **muestra una alerta roja/naranja debajo** o dentro de un Alert Box advirtiendo: *"Atención: X productos nuevos fueron ignorados en esta importación porque no existen en el sistema. Debes darlos de Alta primero para cargarles un precio."* Esto evitará grandes confusiones del cliente final.
   - Al cerrar el modal, haz que la tabla de precios re-cargue (`refetch()`).

**Instrucción Final**:
Queremos una interfaz a prueba de tontos, que lleve de la mano al ferretero para que no rompa su propia base de datos. Haz foco en el diseño y especialmente en el control visual de los artículos ignorados. ¡Orquesta tus herramientas de modificación y pon a punto este modal!
```
