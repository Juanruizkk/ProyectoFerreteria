# Proyecto Venta Stock Frontend - Fase 2: Historial de Stock (Kardex)

Hola Claude. Ya integramos exitosamente el Ajuste Manual de Stock (Fase 1). Ahora vamos a implementar la **Fase 2: El Historial de Movimientos de Stock (Kardex)** en el frontend de React (`../ProyectoFerreteria`).

Nuestro backend ya expone los endpoints que necesitamos:
1. `GET /api/StockMovement/tipos` -> Devuelve lista de `TipoMovimientoStockDTO`.
2. `GET /api/StockMovement/producto/{idProducto}/movimientos?pageIndex=1&pageSize=10&idTipoMovimiento=X` -> Devuelve un `PagedList<MovimientoStockDTO>`.

## Metodología de Trabajo Exigida
1. Utiliza **agentes** para investigar las tablas de las vistas de Cuenta Corriente (ej. `CurrentAccountMovementsSection.jsx`) o Ventas (`SaleQueries.js`, `VentasPage.jsx`). Esto te servirá de plantilla para entender cómo manejamos la **Paginación** y los **Filtros** en nuestro frontend (con componentes de tipo `AuditPagination.jsx` o similares).
2. Sigue los estilos de Tailwind CSS y `Shadcn UI` que ya venimos utilizando.
3. No rompas la UI existente de Productos, agrega esto de forma limpia y modular.

---

## Especificación Técnica a Implementar

### 1. Actualización de Servicios API
En `src/services/StockMovementQueries.js`, agrega las nuevas llamadas usando Axios (o el cliente que estemos usando en el proyecto, ej: `apiRoute` o `axios` auth):

```javascript
export async function fetchTiposMovimientoStock() {
  // GET /api/StockMovement/tipos
}

export async function fetchHistorialStock(idProducto, pageIndex = 1, pageSize = 10, idTipoMovimiento = null) {
  // GET /api/StockMovement/producto/{idProducto}/movimientos?...
}
```

### 2. Componente `HistorialStockModal`
Crea un componente grande y claro (recomiendo un `Dialog` ancho de Shadcn UI o un modal modal tipo overley) que reciba el `producto` como prop.

**A. Encabezado:**
- Título: "Historial de Stock - {producto.nombre}".
- Destacar de algún modo visual el `Stock Actual: {producto.stock}`.

**B. Barra de Filtros:**
- Implementa un combobox/Select con los `Tipos de Movimientos` obtenidos del backend. Permite seleccionar una opción "Todos los Tipos" (por defecto).

**C. Grilla de Movimientos (La Tabla):**
Construye una tabla dinámica con un estado local `movimientos` cargado desde el hook o `useEffect`. Columnas:
- **Fecha:** En formato `DD/MM/YYYY HH:mm`.
- **Tipo de Movimiento:** Muestra el nombre. Usa `Badge` de Shadcn UI con colores intuitivos: verdes (o default) si la `Cantidad` es positiva (ingresos), rojo (`destructive`) si es negativa.
- **Cantidad:** Muestra `+X` o `-Y` (en color verde o rojo para hacerlo ultra visible).
- **Stock Final:** El campo `stockResultante` (en negrita).
- **Referencia/Motivo:** El campo `referencia`, si lo hay.
- **Usuario:** El nombre de usuario.

**D. Paginación:**
- Al pie de la tabla, reutiliza el componente de paginación o la botonería que ya usa el proyecto (ej. `AuditPagination`) conectado a `pageIndex`, `totalPages`, `hasPreviousPage`, `hasNextPage` que viene de la respuesta del backend `PagedList`.

### 3. Integración en el Listado de Productos
En `product-table.jsx` y `product-list.jsx` (o donde estén las acciones por fila):
- Agrega un nuevo intem en el menú desplegable (`DropdownMenuItem`) junto al Ajuste de Stock.
- Lámalo **"Ver Historial"**, poniéndole el ícono `History` (de lucide-react) o similar.
- Al hacer click, setea un estado `productoKardex` (al igual que seteas el modal de edición o ajuste) y renderiza condicionalmente tu nuevo `<HistorialStockModal />`.

## Entrega
Por favor, asegúrate de que todo renderice fluido y de que al cambiar de producto, cambiar de página o cambiar el filtro, los efectos de carga (`isLoading` spinner/skeleton) se comporten bien. ¡Dale para adelante!

# Resumen de lo implementado en el backend:
Archivos nuevos:
  - DTO/TipoMovimientoStockDTO.cs                                                                    - DTO/MovimientoStockDTO.cs
  - Profile/StockMovementProfile.cs — mapeo MovimientoStock → MovimientoStockDTO con TipoMovimiento
   y Usuario desde navegaciones                                                                    

  Archivos modificados:
  - IMovimientoStockRepository + MovimientoStockRepository — GetTiposAsync() y MovementsQueryable()
  - IStockMovementService + StockMovementService — GetTiposMovimientoAsync() y
  MovimientosPagedAsync() + inyección de IMapper
  - StockMovementController — dos endpoints nuevos

  Endpoints disponibles:
  - GET /api/StockMovement/tipos → lista para el combo del frontend
  - GET /api/StockMovement/producto/{idProducto}/movimientos?pageIndex=1&idTipoMovimiento=2 →      
  Kardex paginado (10 por página, DESC por fecha)