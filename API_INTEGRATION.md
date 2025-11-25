  # Integración con API - Sistema de Gestión de Ferretería

## Configuración Base

### URL de la API
```javascript
const API_BASE = "http://localhost:5019";
```

### Headers Estándar
```javascript
{
  "Content-Type": "application/json"
}
```

### Credenciales
```javascript
credentials: "include"  // Para endpoints que requieren autenticación
```

---

## Servicios Disponibles

### 1. ProductQueries.js

**Base URL:** `http://localhost:5019/Product`

#### Funciones Disponibles

##### `fetchProductsWithDetails(page, pageSize, searchTerm = "", activo = true)`
Obtiene lista paginada de productos con detalles.

**Endpoint:** `GET /Product`

**Query Params:**
- `page` (number) - Número de página (1-indexed)
- `pageSize` (number) - Cantidad de items por página
- `searchTerm` (string, opcional) - Término de búsqueda
- `activo` (boolean) - Filtrar por estado activo/inactivo

**Response:**
```javascript
{
  productos: [
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
      ubicacion: {
        fila: string,
        seccion: string,
        nivel: string
      },
      ventaSinStock: boolean,
      activo: boolean
    }
  ],
  totalPages: number,
  currentPage: number,
  totalItems: number
}
```

**Uso:**
```javascript
import { fetchProductsWithDetails } from "@/services/ProductQueries";

const data = await fetchProductsWithDetails(1, 10, "martillo", true);
```

---

##### `createProduct(productData)`
Crea un nuevo producto.

**Endpoint:** `POST /Product`

**Body:**
```javascript
{
  nombre: string,           // Requerido
  marca: string,            // Requerido
  descripcion: string,      // Opcional
  precio: number,           // Requerido
  stock: number,            // Requerido
  stockMinimo: number,      // Requerido
  idCategoria: number,      // Requerido
  idUbicacion: number,      // Requerido
  ventaSinStock: boolean    // Default: false
}
```

**Response:**
```javascript
{
  message: string,
  producto: { ... }
}
```

**Uso:**
```javascript
const newProduct = {
  nombre: "Martillo",
  marca: "Stanley",
  descripcion: "Martillo de acero",
  precio: 1500,
  stock: 50,
  stockMinimo: 10,
  idCategoria: 1,
  idUbicacion: 2,
  ventaSinStock: false
};

const result = await createProduct(newProduct);
```

---

##### `updateProduct(id, productData)`
Actualiza un producto existente.

**Endpoint:** `PUT /Product/{id}`

**Body:** Mismo formato que `createProduct`

**Response:**
```javascript
{
  message: string,
  producto: { ... }
}
```

**Uso:**
```javascript
const updatedData = {
  nombre: "Martillo Actualizado",
  marca: "Stanley",
  // ... resto de campos
};

await updateProduct(123, updatedData);
```

---

##### `deleteProduct(id)`
Elimina (soft delete) un producto.

**Endpoint:** `DELETE /Product/{id}`

**Response:**
```javascript
{
  message: string
}
```

**Uso:**
```javascript
await deleteProduct(123);
```

---

##### `toggleProductEstado(id)`
Alterna el estado activo/inactivo de un producto.

**Endpoint:** `PATCH /Product/{id}/toggle-estado`

**Response:**
```javascript
{
  message: string,
  nuevoEstado: boolean
}
```

**Uso:**
```javascript
await toggleProductEstado(123); // Activo → Inactivo o viceversa
```

---

### 2. UsersQueries.js

**Base URL:** `http://localhost:5019/api/User`

**IMPORTANTE:** Todos los endpoints de usuarios usan `credentials: "include"`

#### Funciones Disponibles

##### `searchUsers(query = "", page = 1, pageSize = 10, isDeleted = false)`
Busca usuarios con paginación y filtros.

**Endpoint:** `GET /api/User/search`

**Query Params:**
- `query` (string) - Término de búsqueda (nombre, usuario, email)
- `page` (number) - Número de página
- `pageSize` (number) - Items por página
- `isDeleted` (boolean) - Mostrar usuarios eliminados

**Response:**
```javascript
{
  users: [
    {
      idUsuario: number,
      usuario: string,
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
  ],
  totalPages: number,
  currentPage: number,
  totalUsers: number
}
```

**Uso:**
```javascript
import { searchUsers } from "@/services/UsersQueries";

const data = await searchUsers("juan", 1, 10, false);
```

---

##### `getUserById(id)`
Obtiene un usuario específico con sus permisos.

**Endpoint:** `GET /api/User/{id}`

**Response:**
```javascript
{
  idUsuario: number,
  usuario: string,
  nombre: string,
  apellido: string,
  email: string,
  rol: string,
  permisos: [ ... ]
}
```

**Uso:**
```javascript
const user = await getUserById(123);
```

---

##### `createUser(userData)`
Crea un nuevo usuario.

**Endpoint:** `POST /api/User`

**Body:**
```javascript
{
  usuario: string,          // Requerido - username
  password: string,         // Requerido
  nombre: string,           // Requerido
  apellido: string,         // Requerido
  email: string,            // Requerido - formato email
  rol: string,              // Requerido
  permisos: number[]        // Array de IDs de permisos
}
```

**Response:**
```javascript
{
  message: string,
  user: { ... }
}
```

**Uso:**
```javascript
const newUser = {
  usuario: "jperez",
  password: "Password123!",
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@example.com",
  rol: "Vendedor",
  permisos: [1, 2, 5, 8]
};

await createUser(newUser);
```

---

##### `updateUser(id, userData)`
Actualiza un usuario existente.

**Endpoint:** `PUT /api/User/{id}`

**Body:**
```javascript
{
  usuario: string,
  password: string,         // Opcional - solo si se quiere cambiar
  nombre: string,
  apellido: string,
  email: string,
  rol: string,
  permisos: number[]
}
```

**Response:**
```javascript
{
  message: string,
  user: { ... }
}
```

**Uso:**
```javascript
const updatedUser = {
  usuario: "jperez",
  nombre: "Juan Carlos",
  apellido: "Pérez",
  email: "juanc@example.com",
  rol: "Gerente",
  permisos: [1, 2, 3, 5, 8]
};

await updateUser(123, updatedUser);
```

---

##### `deleteUser(id)`
Elimina (soft delete) un usuario.

**Endpoint:** `DELETE /api/User/{id}`

**Response:**
```javascript
{
  message: string
}
```

**Uso:**
```javascript
await deleteUser(123);
```

---

### 3. CategoryQueries.js

**Base URL:** `http://localhost:5019/Category`

#### Funciones Disponibles

##### `fetchCategorias()`
Obtiene todas las categorías de productos.

**Endpoint:** `GET /Category`

**Response:**
```javascript
[
  {
    idCategoria: number,
    categoria: string,
    descripcion: string
  }
]
```

**Uso:**
```javascript
import { fetchCategorias } from "@/services/CategoryQueries";

const categories = await fetchCategorias();
```

---

### 4. LocationQueries.js

**Base URL:** `http://localhost:5019/Location`

#### Funciones Disponibles

##### `fetchLocations()`
Obtiene todas las ubicaciones del almacén.

**Endpoint:** `GET /Location`

**Response:**
```javascript
[
  {
    idUbicacion: number,
    fila: string,
    seccion: string,
    nivel: string
  }
]
```

**Uso:**
```javascript
import { fetchLocations } from "@/services/LocationQueries";

const locations = await fetchLocations();
```

---

### 5. PermissionsQueries.js

**Base URL:** `http://localhost:5019/api/Permission`

#### Funciones Disponibles

##### `getPermissionCategories()`
Obtiene todos los permisos agrupados por categorías.

**Endpoint:** `GET /api/Permission/categories`

**Response:**
```javascript
[
  {
    idCategoriaPermiso: number,
    categoria: string,
    descripcion: string,
    permissions: [
      {
        idPermiso: number,
        permiso: string,
        descripcion: string
      }
    ]
  }
]
```

**Uso:**
```javascript
import { getPermissionCategories } from "@/services/PermissionsQueries";

const permissionCategories = await getPermissionCategories();

// Ejemplo de estructura de respuesta:
[
  {
    idCategoriaPermiso: 1,
    categoria: "Productos",
    descripcion: "Gestión de productos",
    permissions: [
      { idPermiso: 1, permiso: "Ver Productos", descripcion: "..." },
      { idPermiso: 2, permiso: "Crear Productos", descripcion: "..." },
      { idPermiso: 3, permiso: "Editar Productos", descripcion: "..." },
      { idPermiso: 4, permiso: "Eliminar Productos", descripcion: "..." }
    ]
  },
  {
    idCategoriaPermiso: 2,
    categoria: "Usuarios",
    descripcion: "Gestión de usuarios",
    permissions: [
      { idPermiso: 5, permiso: "Ver Usuarios", descripcion: "..." },
      // ...
    ]
  }
]
```

---

## Patrón de Implementación de Servicios

### Template Base para Nuevo Servicio

```javascript
// src/services/[Entity]Queries.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5019";

// GET - Listar/Buscar
export const fetchEntities = async (page = 1, pageSize = 10, searchTerm = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(searchTerm && { search: searchTerm }),
  });

  const response = await fetch(`${API_BASE}/Entity?${params}`, {
    method: "GET",
    credentials: "include", // Si requiere auth
  });

  if (!response.ok) {
    throw new Error("Error al obtener entidades");
  }

  return await response.json();
};

// POST - Crear
export const createEntity = async (entityData) => {
  const response = await fetch(`${API_BASE}/Entity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Si requiere auth
    body: JSON.stringify(entityData),
  });

  if (!response.ok) {
    throw new Error("Error al crear entidad");
  }

  return await response.json();
};

// PUT - Actualizar
export const updateEntity = async (id, entityData) => {
  const response = await fetch(`${API_BASE}/Entity/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(entityData),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar entidad");
  }

  return await response.json();
};

// DELETE - Eliminar
export const deleteEntity = async (id) => {
  const response = await fetch(`${API_BASE}/Entity/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Error al eliminar entidad");
  }

  return await response.json();
};
```

---

## Manejo de Errores en Componentes

### Patrón Estándar

```javascript
import { toast } from "sonner";
import { createProduct } from "@/services/ProductQueries";

const handleCreate = async (formData) => {
  try {
    setLoading(true);
    const result = await createProduct(formData);

    toast.success("Producto creado exitosamente");

    // Refrescar datos
    await loadProducts();

    // Cerrar formulario
    setIsFormOpen(false);

  } catch (error) {
    console.error("Error al crear producto:", error);
    toast.error(error.message || "Error al crear el producto");
  } finally {
    setLoading(false);
  }
};
```

---

## Normalización de IDs

El backend puede devolver IDs con diferentes nombres. Usar este patrón para normalizar:

```javascript
// Función helper para obtener ID
const getId = (item) => {
  return item.idProducto || item.idUsuario || item.id || item.ID;
};

// Uso en map
products.map((product) => {
  const id = getId(product);
  // ...
});
```

---

## Estados de Carga y Feedback

### Estados a Manejar

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Feedback con Toast

```javascript
import { toast } from "sonner";

// Éxito
toast.success("Operación exitosa");

// Error
toast.error("Error en la operación");

// Info
toast.info("Información relevante");

// Warning
toast.warning("Advertencia");

// Loading (con promise)
toast.promise(
  fetchData(),
  {
    loading: "Cargando...",
    success: "Datos cargados",
    error: "Error al cargar"
  }
);
```

---

## Paginación

### Patrón de Implementación

```javascript
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [pageSize] = useState(10);

const loadData = async (page) => {
  try {
    const response = await fetchEntities(page, pageSize, searchTerm);

    setData(response.items || response.productos || response.users);
    setTotalPages(response.totalPages);
    setCurrentPage(response.currentPage || page);
  } catch (error) {
    toast.error("Error al cargar datos");
  }
};

// Cambiar página
const handlePageChange = (newPage) => {
  setCurrentPage(newPage);
  loadData(newPage);
};
```

---

## Búsqueda con Debouncing

### Implementación con Custom Hook

```javascript
// Hook personalizado
const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Uso en componente
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebouncedValue(searchTerm, 500);

useEffect(() => {
  loadData(1); // Reset a página 1 en búsqueda
}, [debouncedSearch]);
```

---

## Ejemplo Completo: Integración en Componente

```javascript
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchProductsWithDetails, createProduct, updateProduct, deleteProduct } from "@/services/ProductQueries";
import { SearchBar } from "@/components/Common/SearchBar";
import { PaginationControls } from "@/components/Common/PaginationControls";

const ProductosPage = () => {
  // Estado
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  // Cargar productos
  const loadProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      const data = await fetchProductsWithDetails(
        page,
        9,
        debouncedSearch,
        !showDeleted
      );

      setProducts(data.productos);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    loadProducts(1);
  }, [debouncedSearch, showDeleted]);

  // Handlers
  const handleCreate = async (formData) => {
    try {
      await createProduct(formData);
      toast.success("Producto creado");
      loadProducts();
    } catch (error) {
      toast.error("Error al crear producto");
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await updateProduct(id, formData);
      toast.success("Producto actualizado");
      loadProducts();
    } catch (error) {
      toast.error("Error al actualizar producto");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success("Producto eliminado");
      loadProducts();
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  return (
    <div>
      <SearchBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar productos..."
      />

      {/* Contenido */}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductosPage;
```

---

## Checklist para Nuevo Servicio

Cuando crees un nuevo servicio de API, asegúrate de:

- [ ] Crear archivo en `src/services/[Entity]Queries.js`
- [ ] Usar constante `API_BASE` para la URL
- [ ] Implementar al menos CRUD básico (GET, POST, PUT, DELETE)
- [ ] Agregar `credentials: "include"` si requiere auth
- [ ] Headers con `Content-Type: application/json`
- [ ] Try-catch para manejo de errores
- [ ] Validar `response.ok`
- [ ] Retornar `response.json()`
- [ ] Documentar parámetros y respuestas
- [ ] Probar con toast en componente
- [ ] Normalizar IDs si es necesario

---

## Endpoints Futuros Esperados

### Clientes (próximo módulo)
```javascript
// src/services/ClientQueries.js

const API_BASE = "http://localhost:5019";

// GET /api/Client/search
export const searchClients = async (query, page, pageSize) => { ... }

// GET /api/Client/{id}
export const getClientById = async (id) => { ... }

// POST /api/Client
export const createClient = async (clientData) => { ... }

// PUT /api/Client/{id}
export const updateClient = async (id, clientData) => { ... }

// DELETE /api/Client/{id}
export const deleteClient = async (id) => { ... }
```

---

**Última actualización:** 2025-11-24
**Versión del documento:** 1.0
