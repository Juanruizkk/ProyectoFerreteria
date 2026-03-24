# Prompt Claude Code: Importación Excel y Exportación de Reportes (Frontend)


```
Hola Claude, necesito implementar nuevas vistas e interacciones en nuestro Frontend React (Vite) de gestión de ferretería, enfocadas en los módulos de Proveedores y Compras.

**CONTEXTO DEL PROYECTO:**
- Aplicación React + Vite + Tailwind CSS.
- Se comunica con una API REST en ASP.NET Core.
- El flujo UX centraliza Listas de Precios y Compras dentro del Detalle del Proveedor.

**ESTRATEGIA DE EJECUCIÓN:**
Actúa como un orquestador. Planifica primero analizando los componentes actuales, y luego utiliza tus herramientas de edición/agente para implementar las dos etapas requeridas de forma continua dentro de este mismo prompt. Emite un reporte al finalizar.

---

### ETAPA 1: UI para Importar Listas de Precios desde Excel
**Contexto**: En la vista de "Listas de Precios" dentro del Detalle del Proveedor, necesitamos permitirle al usuario cargar un archivo Excel.
**Objetivo**:
1. Agrega un botón "Importar desde Excel" al lado de "Nueva Lista" o como acción de una lista existente.
2. Al clickear, abre un Modal con un "Drag & Drop" o input file (idealmente usando herramientas como `react-dropzone`).
3. Al confirmar, envía el archivo (Multipart/form-data) al endpoint `POST /ProductoListaPrecioProveedor/{idLista}/import` del backend.
4. Muestra un Toast o Modal de resultados con el resumen de la importación (Total procesados, Errores) en base a la respuesta del backend.

### ETAPA 2: Botones de Exportación a PDF y Excel (Reportes)
**Contexto**: El cliente necesita descargar las vistas de Compras y Proveedores para enviarlas al contador.
**Objetivo**:
1. En los DataTables / Grillas de Compras y de Proveedores, agrega dos botones rápidos de exportación: "Exportar Excel" y "Exportar PDF" (con íconos representativos).
2. Si el backend realiza la exportación, estos botones deben llamar al endpoint `GET /export/excel` esperando un Blob file y disparar la descarga en el navegador.
3. Si prefieres hacer la exportación 100% en frontend, utiliza librerías como `xlsx` (SheetJS) para exportar la data actual de la tabla a Excel, y `jspdf` + `jspdf-autotable` para PDF. (Evalúa y elige la más conveniente según el stack existente; la delegación al backend suele ser mejor si hay paginación y se necesita exportar TODA la consulta).

---

**Instrucción Final para ti (Claude):**
Investiga el árbol de componentes (ej. vistas del detalle de proveedor y grillas de compras), diseña los componentes necesarios (Modal de Importación, Botones de Exportación), aplícalos orquestando tus herramientas y avísame cuando hayas concretado ambas etapas. El código debe quedar totalmente funcional.
```
