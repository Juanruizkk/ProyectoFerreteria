# Prompt Claude Code: Modal de Importación de Listas de Precios (Frontend)


```md
Hola Claude. Actúa como un Desarrollador UI/UX Senior experto en React, Tailwind CSS y arquitecturas modernas de frontend.

Tenemos un uso vital del negocio a nivel interfaz: **Importador Masivo de Listas de Precios por Excel**.
Nuestro backend acaba de exponer un endpoint `POST /ProductoListaPrecioProveedor/{idLista}/importar` que recibe un archivo `IFormFile` y un booleano `ActualizarPrecioVenta`.

**CONTEXTO UX/UI:**
- Ya refactorizamos los perfiles de los proveedores (`ProveedorDetailsPage.jsx`) concentrando en pestañas toda la información.
- En la sección "Listas de Precios" del proveedor, necesitamos incorporar esta funcionalidad de importación sin quitarle fluidez a la vista.

**ESTRATEGIA DE EJECUCIÓN:**
Orquesta la implementación en tu mente, revisa el componente `ProveedorDetailsPage` o donde estén las listas de precios actualmente, y aplica el código necesario operando de manera continua. 

### ETAPA ÚNICA: Componente Modal de Importación

1. **El Disparador (Trigger)**:
   - Dentro de la vista de la Lista de Precios de un Proveedor, al lado de los botones de "Editar", "Añadir Producto", debe haber un ícono o botón claro "Importar desde Excel".

2. **El Modal de Importación (`ImportPriceListModal.jsx` o similar)**:
   - Construye un Modal UI pulido (tipo glassmorphism o modal Tailwind estándar pero con excelente diseño).
   - El contenido central debe ser una zona de **Drag & Drop** (puedes usar el tag input type="file" estilizado o `react-dropzone`).
   - El diseño del dropzone debe ser atractivo (con un ícono de nube/Excel, colores suaves que inviten a soltar).

3. **El Checkbox Clave de Negocio (El Recálculo)**:
   - Debajo del uploader, agrega un Switch toggle visual o Checkbox prominente: 
     *"Actualizar Precios de Venta al Público (Aplica fórmula: Último Costo * Margen de Ganancia del Proveedor)"*
   - Un texto o Tooltip de ayuda (UI/UX 10/10) aclarando que esto "pisará" los precios actuales de la tienda para esos artículos.

4. **Conexión de API (Submit)**:
   - Al darle a "Confirmar", empaqueta el archivo y el boolean check en un `FormData`.
   - Haz un POST al endpoint usando tu hook custom o instancia de Axios (e.g. `multipart/form-data`).
   - Muestra un estado de Carga/Spinner dentro del botón mientras se procesa.

5. **Feedback Visual de Respuesta**:
   - Cuando la llamada HTTP sea exitosa, muestra una alerta tipo Toast (o modal de suceso) detallando la respuesta de la API (ej: "¡Éxito! 240 líneas leídas, 235 productos actualizados.").
   - Dispara el refetch para que la tabla de la lista de precio por debajo parpadee y refleje los precios nuevos mágicamente.

**Instrucción Final**:
Prioriza un **diseño visual increíble** en el Drag & Drop y el Toggle de actualizar precios. El usuario final es el dueño de la ferretería y esto le ahorra 4 horas de trabajo mensual; debe sentirse "premium". ¡Orquesta tus herramientas de modificación y despliega el código final!
```
