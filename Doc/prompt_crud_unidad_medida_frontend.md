# Proyecto Venta Stock Frontend - CRUD de Unidades de Medida

Hola Claude. El backend ya tiene listo el CRUD y la validación de negocio para las `UnidadesMedida` (Gestión dinámica de las unidades físicas: Kg, Metros, Unidades).

Necesitamos implementar en React (`ProyectoFerreteria`) la interfaz de administración para que el dueño de la ferretería pueda sumar unidades de medida o empaques (como "Caja x50").

## Requisitos de Implementación

### Frontend React (`ProyectoFerreteria`)
Este CRUD administrativo es un calco casi exacto del que hiciste para `TipoMovimientoStock`, así que apóyate en esos componentes.

- Crea un componente **`UnidadesMedidaPage.jsx`** dentro de la sección de configuración o administración de productos.
- **Grilla:** Una tabla Shadcn UI que consuma el endpoint `GET /api/unidadmedida/admin`.
- **Columnas de la Tabla:** 
  - ID
  - Nombre
  - Abreviatura (Renderízalo dentro de un Badge sutil, ej: `[ m ]` o `[ kg ]`).
  - Estado (Badge verde para Activo, gris para Inactivo).

**Modales y Acciones:** 
- **Botón "Nueva Unidad"**: Abre un Dialog/Modal con `react-hook-form`. Requiere los inputs de `Nombre` y `Abreviatura` (Hará `POST /api/unidadmedida`).
- **Acciones de fila (Dropdown Menu):** 
  - Editar: Abre el mismo modal para modificar el nombre o abreviatura (`PUT /api/unidadmedida/{id}`).
  - Activar/Desactivar: Un botón Toggle que hace `PATCH /api/unidadmedida/{id}/toggle`. (Aclaración UX: Si lo desactivan, esa unidad ya no se podrá seleccionar al crear productos nuevos en el futuro).

¡A codificar esas vistas! Mantenlo limpio y coherente con el estilo de Shadcn UI de los demás paneles.
