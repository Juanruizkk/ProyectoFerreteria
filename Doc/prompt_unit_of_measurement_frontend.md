# Proyecto Venta Stock Frontend - Refactor Decimales y Unidades de Medida 

Hola Claude. Mientras procesabas o terminabas el backend, necesitamos planificar y ejecutar el impacto visual y lógico de las **Unidades de Medida y Decimales** en nuestro frontend de React (`ProyectoFerreteria`).

El backend ahora soporta que los productos tengan un `IdUnidadMedida` (1=Unidad, 2=Kilos, 3=Litros, 4=Metros) y todas las propiedades de stock y cantidad ahora son numéricas (`decimal`). ¡Vamos a reflejar ese poder en la interfaz!

## Metodología de Trabajo
Realiza este refactor empleando agentes:
1. **Agente UI Analista:** Explora `product-form.jsx`, el módulo de Ventas (donde se agregan productos al "carrito" o tabla de detalles) y las grillas que muestran cantidades para ver dónde estamos usando `step="1"` o asumiendo enteros.
2. **Agente Implementador:** Aplica los cambios progresivamente sin romper validaciones de `react-hook-form` o estados.
3. **Agente Revisor:** Audita el UX final simulando que se compra "1.5 kilos" de clavos. No inventes componentes, usa tu set de Shadcn UI actual.

---

## Tareas de Implementación

### 1. Diccionario Global de Unidades
Crea en algún lugar estratégico (ej. `src/utils/constants.js` o dentro del mismo listado de constantes) un diccionario estático para mapear las unidades frentes al usuario, para no hacer llamados innecesarios a BD:
```javascript
export const UNIDADES_MEDIDA = {
  1: { nombre: "Unidad", abreviatura: "u" },
  2: { nombre: "Kilogramo", abreviatura: "kg" },
  3: { nombre: "Litro", abreviatura: "l" },
  4: { nombre: "Metro", abreviatura: "m" }
};
```

### 2. Formulario de Productos (`product-form.jsx`)
- Agrega un nuevo campo `Select` obligatorio (Shadcn UI) para elegir la "Unidad de Medida" al crear o editar un producto.
- Setea por defecto `1` ("Unidad") si el usuario no elige nada.
- Modifica el DTO/Schema del formulario para que el payload que se envía al backend en el PUT/POST contenga el `idUnidadMedida`.
- Permite que el input de `stockMinimo` y `stock` (si aún tienes visible stock inicial) acepte `step="0.01"` si la unidad elegida NO es 1.

### 3. El "Carrito" de Ventas (Punto Crítico)
- Inspecciona el componente donde el vendedor "agrega un detalle a la venta" (donde elige el producto y digita la cantidad).
- El input numérico de cantidad (`<input type="number">` o el equivalente de Shadcn) **debe ser dinámico**:
  ```jsx
  const esUnidad = productoSeleccionado?.idUnidadMedida === 1;
  // step={esUnidad ? "1" : "0.01"}
  ```
- **UX Premium:** Agrega un sufijo visual o un adorno text-muted al lado del input de la cantidad. Ej: Si elegí "Clavos Punta París" (ID 2), que el cajita numérica diga `1.50 [kg]`. 

### 4. Grillas y Tablas (Ventas, Historial, Productos)
- Da un repaso rápido por las tablas donde se muestra el Stock, o las cantidades vendidas (`VentasPage`, `DetalleVenta`, `HistorialStockModal`).
- Escribe un pequeño helper o pipe formatter (ej: `formatCantidad(valor, idUnidad)`) que muestre un número entero si es Unidad (`5 u`), y hasta 2 decimales si es peso/medida (`1.50 kg`).
- Pasa los valores crudos a través de este formateador para que todo el sistema hable en el mismo idioma visual.

## Ejecución Final
Revisa detenidamente los cálculos en el módulo de ventas. Si el frontend sumaba los subtotales (`cantidad * precio`), asegúrate de parsear correctamente `parseFloat(cantidad)` en el JS para que no haya problemas de strings y calcule bien el subtotal (ej: `1.5` * `$1000` = `$1500`). ¡Delega y avanza!
