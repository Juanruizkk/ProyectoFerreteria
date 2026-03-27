# Proyecto Venta Stock Frontend - Admin de Tipos de Movimiento

Hola Claude. El backend ya tiene implementado todo el CRUD y la validación de negocio para los `TipoMovimientoStock` (Gestión dinámica de los tipos de ajuste de inventario protegiendo los de sistema y definiendo si suman o restan stock nativamente).

Ahora necesitamos implementar en React (`ProyectoFerreteria`) la interfaz de administración y refactorizar el modal de ajuste manual que ya existe para que deje de usar datos duros.

## Requisitos de Implementación

### 1. Panel de Administración (CRUD de Tipos)
Crea una nueva página `TiposMovimientoPage.jsx` (o agrégala como solapa dentro de alguna pantalla de configuración/administración que ya exista, ej: Settings/Usuarios).

**A. Grilla de Tipos (Tabla):**
Usa el componente de tabla (Shadcn UI) para listar los tipos consumiendo `GET /api/stockmovement/tipos/admin` (este endpoint trae todos, activos e inactivos).
Columnas a mostrar:
- **Nombre**
- **Descripción**
- **Sentido:** Usa un *Badge*. Si `EsPositivo === true` muestra "Ingreso (+)" (verde), si es `false` muestra "Egreso (-)" (rojo).
- **Origen:** Mostrar "Sistema" (gris/opaco) si `EsSistema === true`, o "Personalizado" (azul) si es `false`.
- **Estado:** "Activo" o "Inactivo".

**B. Alta de Tipo (Modal):**
- Botón "Nuevo Tipo" que abre un Dialog/Modal.
- Formulario con validación (Zod/React-Hook-Form): `Nombre` (requerido), `Descripción`, y un *Select* o *Radio Group* para definir el `Sentido` (Ingreso/Positivo o Egreso/Negativo).
- Hace un `POST /api/stockmovement/tipos`. Solo se crean tipos custom.

**C. Edición y Desactivación (Acciones de Fila):**
- Solo habilita los botones de Editar y Desactivar/Activar si la fila tiene `EsSistema === false`.
- El Modal de edición solo permite cambiar `Nombre` y `Descripción` (`PUT /api/stockmovement/tipos/{id}`).
- El botón de desactivar hace un `PATCH /api/stockmovement/tipos/{id}/toggle`.

### 2. Refactor: El Modal de Ajuste de Stock 
Busca el componente actual (`AjusteStockModal.jsx` u homólogo) que utiliza el usuario cuando clica en "Ajustar Stock" desde el catálogo de productos.

**Los cambios críticos aquí son:**
1. **Borrar los Hardcodes:** Elimina la constante o arreglo que tiene los `id: 5, 6, 7` hardcodeados en el Select.
2. **Consumo Dinámico:** Haz que el componente llame a `GET /api/stockmovement/tipos` (el endpoint base que trae solo los `Activo=true`).
3. **Poblar el Select:** Mapea el resultado en el combobox de Tipos de Ajuste. (Visualmente puedes mostrar el "Sentido" al lado del nombre para ayudar al cajero: Ej: `Merma por Rotura (-)`, chequeando `EsPositivo`).
4. **Simplificación del Payload:** El usuario digita únicamente la `Cantidad` (siempre como valor absoluto positivo, ej: `3`). El frontend **ya no envía signos negativos**. Envía directamente `{ IdProducto, Cantidad: 3, IdTipoMovimiento, Motivo }`. ¡El backend hará la resta matemáticamente gracias a su nueva columna `EsPositivo`!

## Notas de Estilo
- Apóyate en `lucide-react` para colocar íconos de Settings/Sliders en el sidebar para el acceso a esta nueva vista.
- Trata de reutilizar las *Queries* o *Hooks* (ej: React Query o AuthAxios) que usa el resto del proyecto para mantener coherencia.
