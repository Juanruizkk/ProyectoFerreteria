# Fix: Kardex — Columna StockAnterior + Alta de Producto

## Contexto

Durante la presentación del proyecto se realizaron dos observaciones sobre el módulo de stock:

1. **Alta de producto no registraba movimiento**: Al crear un producto, el stock inicial no quedaba en el Kardex.
2. **Kardex incompleto**: La tabla solo mostraba `Cantidad` y `Stock Final`. Debe mostrar tres columnas: `Stock Anterior`, `Cantidad`, `Stock Final`.

Ambas fueron corregidas en el backend. Este documento describe los cambios que debe aplicar el frontend.

---

## Qué cambió en el backend

### 1. Alta de producto ahora registra movimiento de stock

Cuando se crea un producto (con stock inicial 0 o mayor), el backend registra automáticamente un movimiento de tipo **"Alta de Producto"** (id=8, `es_sistema=true`) en el Kardex. Esto es transparente para el frontend — no requiere ningún cambio en el form ni en el payload.

### 2. El DTO de movimientos ahora incluye `stockAnterior`

`GET /api/StockMovement/producto/{id}/movimientos` ahora devuelve:

```json
{
  "idMovimientoStock": 12,
  "idProducto": 3,
  "idTipoMovimientoStock": 8,
  "tipoMovimiento": "Alta de Producto",
  "stockAnterior": 0,
  "cantidad": 0,
  "stockResultante": 0,
  "fecha": "2026-04-16T14:30:00Z",
  "usuario": "admin",
  "referencia": "STOCK INICIAL AL DAR DE ALTA EL PRODUCTO"
}
```

El campo nuevo es **`stockAnterior`** (calculado en el backend como `stockResultante - cantidad`).

---

## Cambios en el frontend

### Archivo: `src/components/Productos/HistorialStockModal.jsx`

**Solo un cambio: agregar la columna `Stock Anterior` a la tabla.**

---

#### 1. Actualizar `SkeletonRows` — de 6 a 7 celdas

```jsx
// ANTES
function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((__, j) => (

// DESPUÉS
function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
```

---

#### 2. Actualizar el `<TableHeader>` — agregar columna entre Tipo y Cantidad

```jsx
// ANTES
<TableHeader>
  <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableHead className="w-[15%]">Fecha</TableHead>
    <TableHead className="w-[22%]">Tipo</TableHead>
    <TableHead className="w-[10%] text-center">Cantidad</TableHead>
    <TableHead className="w-[12%] text-center">Stock Final</TableHead>
    <TableHead className="w-[25%]">Referencia / Motivo</TableHead>
    <TableHead className="w-[16%]">Usuario</TableHead>
  </TableRow>
</TableHeader>

// DESPUÉS
<TableHeader>
  <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableHead className="w-[14%]">Fecha</TableHead>
    <TableHead className="w-[20%]">Tipo</TableHead>
    <TableHead className="w-[10%] text-center">Stock Anterior</TableHead>
    <TableHead className="w-[10%] text-center">Cantidad</TableHead>
    <TableHead className="w-[10%] text-center">Stock Final</TableHead>
    <TableHead className="w-[22%]">Referencia / Motivo</TableHead>
    <TableHead className="w-[14%]">Usuario</TableHead>
  </TableRow>
</TableHeader>
```

---

#### 3. Agregar la celda `stockAnterior` en cada fila

Dentro del `.map((m) => { ... })`, agregar la celda entre el badge de tipo y la celda de cantidad:

```jsx
// ANTES
{/* Tipo badge */}
<TableCell>
  <Badge variant={esPositivo ? "default" : "destructive"} className="text-xs">
    {m.tipoMovimiento ?? "—"}
  </Badge>
</TableCell>

{/* Cantidad */}
<TableCell className="text-center font-semibold">
  <span className={esPositivo ? "text-green-600" : "text-red-600"}>
    {esPositivo ? "+" : ""}{formatCantidad(m.cantidad, producto?.idUnidadMedida)}
  </span>
</TableCell>

// DESPUÉS
{/* Tipo badge */}
<TableCell>
  <Badge variant={esPositivo ? "default" : "destructive"} className="text-xs">
    {m.tipoMovimiento ?? "—"}
  </Badge>
</TableCell>

{/* Stock anterior */}
<TableCell className="text-center text-muted-foreground">
  {formatCantidad(m.stockAnterior, producto?.idUnidadMedida)}
</TableCell>

{/* Cantidad */}
<TableCell className="text-center font-semibold">
  <span className={esPositivo ? "text-green-600" : "text-red-600"}>
    {esPositivo ? "+" : ""}{formatCantidad(m.cantidad, producto?.idUnidadMedida)}
  </span>
</TableCell>
```

---

#### 4. Actualizar el `colSpan` del mensaje vacío — de 6 a 7

```jsx
// ANTES
<TableCell colSpan={6} className="text-center py-10 text-muted-foreground">

// DESPUÉS
<TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
```

---

### Archivo: `src/components/Productos/product-form.jsx`

**No requiere cambios.** El formulario ya envía `stock` como número (default `0`) en el payload, lo cual es compatible con el nuevo campo `[Required] decimal Stock` del backend.

---

## Comportamiento esperado después del fix

- Al crear un producto con stock inicial = 0 → el Kardex muestra **1 fila**: Alta de Producto | Ant: 0 | Cant: 0 | Final: 0
- Al crear un producto con stock inicial = 50 → el Kardex muestra **1 fila**: Alta de Producto | Ant: 0 | Cant: 50 | Final: 50
- Movimientos subsiguientes (ventas, compras, ajustes) muestran correctamente el stock anterior antes de ese movimiento

---

## Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/Productos/HistorialStockModal.jsx` | Agregar columna `Stock Anterior` (4 lugares: SkeletonRows, TableHeader, fila del map, colSpan) |
| `src/components/Productos/product-form.jsx` | Sin cambios |
