# Proyecto Venta Stock Frontend - Integración de Nuevos Reportes (RF002.3)

Hola Claude. Necesito que integres en el frontend de React (`ProyectoFerreteria`) los nuevos endpoints de reportes que acabamos de desarrollar en el backend.

El frontend de reportes está ubicado principalmente en:
1. `src/components/Reportes/ReportesPage.jsx`
2. `src/services/ReportQueries.js`

## Arquitectura y Estilo Visual
- La página usa componentes de **Shadcn UI** (`Card`, `Table`, `Select`, `Input`, `Badge`).
- Los íconos provienen de **lucide-react** (ej: `TrendingUp`, `ShoppingCart`).
- Las métricas rápidas usan un componente `KpiCard` estandarizado.
- Las consultas al backend se hacen devolviendo la promesa (`fetch...`) en el archivo `ReportQueries.js` y se consumen con `Promise.allSettled` dentro del `buscar()` de la página.

## Lo que debes implementar

### 1. Actualizar `ReportQueries.js`
Agrega las firmas para interactuar con los nuevos endpoints:
- `fetchMargenUtilidad(fechaDesde, fechaHasta)` → `GET /api/Report/margen-utilidad`
- `fetchClientesFrecuentes(fechaDesde, fechaHasta, topN)` → `GET /api/Report/clientes-frecuentes`
- `fetchTiempoPromedioCobro(fechaDesde, fechaHasta)` → `GET /api/Report/tiempo-promedio-cobro`
- `fetchDeudaTotal()` → `GET /api/Report/deuda-total`
- `fetchClientesSaldoDeudor()` → `GET /api/Report/clientes-saldo-deudor`
- **Modificar** `fetchProductosMasVendidos` para que también reciba `idCategoria` opcionalmente: `?fechaDesde=...&fechaHasta=...&topN=...&idCategoria=...`

### 2. Modificar `ReportesPage.jsx` - Estado y Filtros
- Agrega los nuevos estados locales para manejar la respuesta de las nuevas consultas (`muData`, `cfData`, `tcData`, `dtData`, `cdData`). No olvides declararlos e inicializarlos como nulos.
- Modifica la función `buscar()` para incluir estas nuevas peticiones en el `Promise.allSettled`.
- **Nuevo Filtro Opcional:** Agrega un selector para "Categoría" (si es posible, reutiliza algún estado de categorías o pon el input para el `idCategoria` si no quieres ensuciar mucho; ideal obtener la lista de categorías del contexto o servicio y mostrar un combo de Shadcn UI de "Todas las categorías" / "Categoría 1", etc.). Este filtro afectará el Top Productos.

### 3. Integración Visual Conservando el Estilo
No rompas la estética limpia del Dashboard. Incorpora las nuevas métricas armoniosamente:

**A. Nuevas KpiCards** (Agrega iconos como `Percent`, `Clock`, `CreditCard`):
- **Margen de Utilidad:** Muestra el `%` de margen (ej: `45.2%`) y en el sub-texto la Utilidad Bruta ganada (`$5,000`).
- **Tiempo de Cobro:** Muestra los días promedio (ej: `14 días`) y un texto descriptivo abajo ("Promedio CC").
- **Deuda Total CC:** Muestra el total adeudado (ej: `$150,000`) y abajo algo como "Saldo pendiente global".

**B. Tablas y Gráficos (Bottom Section)**
- Para los **Clientes más frecuentes**: Agrega una nueva `Card` (con icono `Users`) al lado o debajo del chart de productos. Puedes usar una estructura similar a `HorizontalBarChart` o una `Table` simplificada.
- Para **Clientes con Saldo Deudor**: Agrega una `Card` / `Table` que liste a esos clientes en rojo o mostrando el Saldo y el Límite. Asegúrate de mostrar el estado "vacío" de forma elegante si nadie debe nada.

## Instrucciones de Trabajo
1. Usa agentes si lo consideras necesario para repasar el código, hacer el refactor de estados, etc.
2. Respeta los estilos de las clases de Tailwind (`text-muted-foreground`, `gap-x`, `print:hidden`).
3. Revisa la consola para asegurarte de que ningún `useEffect` u objeto crashee si los datos aún no llegan (`null` checks constantes en los DTOs).
4. No asumas ni inventes APIs; confírmalas con la lista de arriba. Si tienes dudas de Tailwind, consúltame.
