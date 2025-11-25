# Arquitectura del Proyecto - Sistema de Gestión de Ferretería

## Información General

**Proyecto:** Frontend React para Sistema de Gestión de Ferretería
**Backend API:** http://localhost:5019
**Framework:** React 19.1.1 + Vite 7.1.2
**Branch Principal:** dev_user
**Branch Actual:** dev_client

---

## Stack Tecnológico

### Core
- **React** 19.1.1 (última versión)
- **React Router DOM** 7.9.1
- **Vite** 7.1.2 (build tool)

### UI y Estilos
- **Tailwind CSS** 4.1.13
- **shadcn/ui** (componentes basados en Radix UI)
- **Lucide React** 0.544.0 (iconos)
- **Sonner** 2.0.7 (notificaciones toast)

### Herramientas
- ESLint 9.33.0
- class-variance-authority (CVA)
- tailwind-merge & clsx

---

## Estructura del Proyecto

```
ProyectoFerreteria/
├── src/
│   ├── components/
│   │   ├── ui/                    # Componentes shadcn/ui (21 componentes)
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── drawer.jsx
│   │   │   ├── select.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── table.jsx
│   │   │   └── ... (más componentes UI)
│   │   │
│   │   ├── Common/                # Componentes compartidos
│   │   │   ├── PaginationControls.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Prueba.jsx
│   │   │
│   │   ├── Productos/             # Módulo de Productos
│   │   │   ├── ProductosPage.jsx
│   │   │   ├── product-form.jsx
│   │   │   ├── product-list.jsx
│   │   │   └── product-table.jsx
│   │   │
│   │   ├── Users/                 # Módulo de Usuarios
│   │   │   ├── UserPage.jsx
│   │   │   └── UserFormDrawer.jsx
│   │   │
│   │   ├── Layout.jsx             # Layout principal
│   │   └── app-sidebar.jsx        # Sidebar de navegación
│   │
│   ├── services/                  # Capa de integración API
│   │   ├── ProductQueries.js      # CRUD Productos
│   │   ├── UsersQueries.js        # CRUD Usuarios
│   │   ├── CategoryQueries.js     # Categorías
│   │   ├── LocationQueries.js     # Ubicaciones
│   │   └── PermissionsQueries.js  # Permisos
│   │
│   ├── hooks/                     # Custom hooks
│   │   └── use-mobile.js
│   │
│   ├── lib/                       # Utilidades
│   │   └── utils.js
│   │
│   ├── App.jsx                    # Componente principal
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Estilos globales + variables CSS
│
├── public/                        # Assets estáticos
├── package.json
├── vite.config.js                 # Configuración Vite
├── tailwind.config.js             # Configuración Tailwind
├── components.json                # Configuración shadcn/ui
└── index.html
```

---

## Patrones de Arquitectura

### 1. Gestión de Estado
**NO usa librerías globales de estado (Redux/Zustand)**

**Estrategia:**
- Estado local con `useState`
- Side effects con `useEffect`
- Custom hooks para lógica reutilizable
- Caché en cliente con `useRef` para paginación
- Debouncing para búsquedas

**Ejemplo de patrón:**
```javascript
// Estado local + caché
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const cachedProducts = useRef(new Map());

// Búsqueda con debouncing
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebouncedValue(searchTerm, 500);
```

### 2. Servicios API
**Patrón:** Archivos `*Queries.js` en `/services`

**Convenciones:**
- Un archivo por entidad/recurso
- Funciones async/await con fetch
- Headers estándar: `Content-Type: application/json`
- Credenciales incluidas: `credentials: "include"`
- Manejo de errores con try-catch en componentes
- Toast notifications para feedback

**Ejemplo de servicio:**
```javascript
const API_BASE = "http://localhost:5019";

export const createEntity = async (data) => {
  const response = await fetch(`${API_BASE}/Entity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error("Error al crear");
  return await response.json();
};
```

### 3. Estructura de Componentes
**Jerarquía típica por módulo:**

```
[Módulo]Page.jsx (página principal)
├── SearchBar (búsqueda)
├── Filtros y controles
├── [Módulo]Form o Drawer (crear/editar)
├── [Módulo]List o Table (visualización)
└── PaginationControls (paginación)
```

**Ejemplo - Productos:**
```
ProductosPage.jsx
├── SearchBar
├── Tabs (All/Deleted)
├── Filters (Low Stock)
├── ProductForm (Dialog)
├── ProductList (Cards) o ProductTable
└── PaginationControls
```

### 4. Routing
**Configuración:** `main.jsx` + `App.jsx`

```javascript
// main.jsx
<BrowserRouter>
  <App />
</BrowserRouter>

// App.jsx
<Layout>
  <Routes>
    <Route path="/" element={<Prueba />} />
    <Route path="/productos" element={<ProductosPage />} />
    <Route path="/usuarios" element={<UsersPage />} />
  </Routes>
</Layout>
```

**Rutas actuales:**
- `/` - Home/Dashboard (placeholder)
- `/productos` - Gestión de Productos
- `/usuarios` - Gestión de Usuarios

---

## Módulos Principales

### Módulo: PRODUCTOS
**Ubicación:** `src/components/Productos/`

**Funcionalidades:**
- CRUD completo (Create, Read, Update, Delete)
- Soft delete + restore
- Vistas duales: Cards y Tabla
- Paginación (9 items por defecto)
- Búsqueda en tiempo real con debouncing
- Alertas de stock bajo
- Gestión de inventario

**Modelo de datos:**
```javascript
{
  idProducto: number,
  nombre: string,
  marca: string,
  descripcion: string,
  precio: number,
  stock: number,
  stockMinimo: number,
  idCategoria: number,
  categoria: string,
  idUbicacion: number,
  ubicacion: { fila, seccion, nivel },
  ventaSinStock: boolean,
  activo: boolean
}
```

**Archivos:**
- `ProductosPage.jsx` - Página principal con lógica de estado
- `product-form.jsx` - Formulario create/edit (Dialog)
- `product-list.jsx` - Vista de tarjetas (Grid)
- `product-table.jsx` - Vista de tabla

**Servicios:** `ProductQueries.js`
- `fetchProductsWithDetails(page, pageSize, searchTerm, activo)`
- `createProduct(productData)`
- `updateProduct(id, productData)`
- `deleteProduct(id)`
- `toggleProductEstado(id)`

---

### Módulo: USUARIOS
**Ubicación:** `src/components/Users/`

**Funcionalidades:**
- CRUD de usuarios
- Sistema de roles
- Gestión de permisos por categorías
- Búsqueda por nombre/usuario/email
- Filtros por estado (activo/eliminado)
- Paginación
- Vista de permisos en popover

**Modelo de datos:**
```javascript
{
  idUsuario: number,
  usuario: string,
  password: string,
  nombre: string,
  apellido: string,
  email: string,
  rol: string,
  permisos: [
    {
      idCategoriaPermiso: number,
      categoria: string,
      permissions: [
        {
          idPermiso: number,
          permiso: string,
          descripcion: string
        }
      ]
    }
  ]
}
```

**Archivos:**
- `UserPage.jsx` - Página principal
- `UserFormDrawer.jsx` - Formulario en Drawer con permisos

**Servicios:** `UsersQueries.js`
- `searchUsers(query, page, pageSize, isDeleted)`
- `getUserById(id)`
- `createUser(userData)`
- `updateUser(id, userData)`
- `deleteUser(id)`

**Servicios adicionales:**
- `PermissionsQueries.js` - `getPermissionCategories()`

---

## Componentes Compartidos

### Common Components
**Ubicación:** `src/components/Common/`

1. **SearchBar.jsx**
   - Input de búsqueda con icono
   - Reutilizable en todos los módulos
   - Props: `value`, `onChange`, `placeholder`

2. **PaginationControls.jsx**
   - Navegación Prev/Next
   - Props: `currentPage`, `totalPages`, `onPageChange`

3. **Prueba.jsx**
   - Placeholder para home/dashboard

### UI Components (shadcn/ui)
**Ubicación:** `src/components/ui/`

**21 componentes basados en Radix UI:**

**Layout:**
- `card.jsx` - Contenedores con header/content/footer
- `sheet.jsx` - Paneles laterales
- `sidebar.jsx` - Sidebar colapsable
- `drawer.jsx` - Drawers (vaul)
- `tabs.jsx` - Pestañas

**Forms:**
- `input.jsx` - Input de texto
- `textarea.jsx` - Textarea
- `label.jsx` - Labels
- `select.jsx` - Selects
- `checkbox.jsx` - Checkboxes

**Feedback:**
- `badge.jsx` - Badges de estado
- `button.jsx` - Botones con variantes
- `skeleton.jsx` - Loading skeletons
- `tooltip.jsx` - Tooltips
- `alert-dialog.jsx` - Diálogos de confirmación

**Navegación:**
- `dropdown-menu.jsx` - Menús dropdown
- `breadcrumb.jsx` - Breadcrumbs

**Data:**
- `table.jsx` - Tablas
- `scroll-area.jsx` - Scroll containers

**Utils:**
- `separator.jsx` - Separadores
- `popover.jsx` - Popovers

---

## Configuración

### Vite Config
```javascript
{
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
}
```
- Alias `@/` → `src/`

### Tailwind Config
```javascript
{
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: { extend: {} },
  plugins: []
}
```

### shadcn/ui Config
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### Scripts Disponibles
```json
{
  "dev": "vite",           // Servidor desarrollo
  "build": "vite build",   // Build producción
  "lint": "eslint .",      // Linting
  "preview": "vite preview" // Preview build
}
```

---

## Autenticación y Autorización

### Estado Actual
**No hay UI de login/logout visible en el codebase**

### Sistema de Permisos
- **Permisos agrupados por categorías**
- **Asignación granular** mediante checkboxes
- **Vista de permisos** en popover
- **Roles** definidos como string

### Sesión
- **Cookies:** `credentials: "include"` en peticiones de usuarios
- **No hay manejo de tokens JWT visible en frontend**

---

## Convenciones de Código

### Naming
- **Componentes:** PascalCase (`ProductosPage.jsx`)
- **Servicios:** camelCase con sufijo Queries (`ProductQueries.js`)
- **Funciones:** camelCase (`fetchProducts`, `createUser`)
- **Constantes API:** UPPER_SNAKE_CASE (`API_BASE`)

### Estructura de Archivos
- **Un componente por archivo**
- **Servicios agrupados por entidad**
- **UI components en carpeta dedicada**

### Imports
```javascript
// Alias @ para src/
import { Button } from "@/components/ui/button"
import { fetchProducts } from "@/services/ProductQueries"
```

### Manejo de Errores
```javascript
try {
  const result = await apiCall();
  toast.success("Operación exitosa");
} catch (error) {
  toast.error(error.message || "Error en la operación");
  console.error(error);
}
```

### Normalización de IDs
```javascript
// Backend puede usar diferentes nombres para IDs
const id = item.idProducto || item.id || item.ID;
```

---

## Próximos Módulos

### Módulo CLIENTES (próximo a implementar)
**Seguir los mismos patrones:**

1. **Estructura de carpeta:**
   ```
   src/components/Clientes/
   ├── ClientesPage.jsx
   ├── ClienteFormDrawer.jsx (o cliente-form.jsx)
   └── cliente-table.jsx (opcional)
   ```

2. **Servicio API:**
   ```
   src/services/ClientQueries.js
   ```

3. **Funcionalidades esperadas:**
   - CRUD completo
   - Búsqueda y paginación
   - Vista en tabla o cards
   - Soft delete (consistente con otros módulos)

4. **Ruta:**
   ```javascript
   <Route path="/clientes" element={<ClientesPage />} />
   ```

---

## Notas Importantes

### Variables de Entorno
- **NO hay archivo .env actualmente**
- **URLs hardcoded:** `http://localhost:5019`
- **Recomendación:** Migrar a variables de entorno

### Pendientes
- Completar navegación del sidebar
- Implementar dashboard en `/`
- Agregar autenticación UI
- Protected routes

### Performance
- **Caché de paginación** con useRef
- **Debouncing** en búsquedas (500ms)
- **React 19** con optimizaciones automáticas

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview build
npm run preview

# Agregar componente shadcn/ui
npx shadcn@latest add [component-name]
```

---

**Última actualización:** 2025-11-24
**Versión del documento:** 1.0
