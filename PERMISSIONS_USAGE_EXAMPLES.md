# 🔐 Sistema de Permisos Frontend - Guía de Uso

## 📋 Descripción

Sistema completo y escalable de permisos a nivel frontend que:

1. **Oculta botones** que el usuario no puede usar
2. **Protege rutas** completas si el usuario no tiene ningún permiso del módulo
3. **Es escalable** - fácil de agregar nuevos módulos y permisos
4. **Es declarativo** - uso simple y claro en componentes

---

## 🏗️ Arquitectura

```
src/
├── config/
│   └── permissions.js           # ✅ Configuración centralizada
├── hooks/
│   └── usePermission.js         # ✅ Hook para verificar permisos
├── components/
│   ├── PermissionGuard.jsx      # ✅ Componente condicional
│   └── ProtectedRoute.jsx       # ✅ Protección de rutas (mejorado)
```

---

## 📖 Guía de Uso

### 1. Agregar Permisos a la Configuración

**Archivo:** `src/config/permissions.js`

```javascript
export const PermissionGroups = {
  // Agregar nuevo módulo
  NUEVO_MODULO: {
    prefix: "MOD",
    permissions: {
      CREATE: "MOD_CREATE",
      READ: "MOD_READ",
      UPDATE: "MOD_UPDATE",
      DELETE: "MOD_DELETE",
    },
  },
};

// Mapear ruta a permisos
export const RoutePermissions = {
  "/nuevo-modulo": {
    module: "Nuevo Módulo",
    permissionGroup: PermissionGroups.NUEVO_MODULO,
    requireAny: true, // Requiere al menos 1 permiso del grupo
  },
};
```

---

### 2. Usar el Hook `usePermission`

```javascript
import { usePermission } from "@/hooks/usePermission";
import { PermissionGroups } from "@/config/permissions";

function MiComponente() {
  const { hasPermission, hasAnyPermission, hasModuleAccess } = usePermission();

  // Verificar un permiso específico
  const puedeCrear = hasPermission("CLI_CREATE");

  // Verificar al menos uno de varios
  const puedeGestionar = hasAnyPermission(["CLI_CREATE", "CLI_UPDATE"]);

  // Verificar acceso a módulo completo
  const tieneAccesoClientes = hasModuleAccess(PermissionGroups.CLIENTS);

  return (
    <div>
      {puedeCrear && <button>Crear Cliente</button>}
      {puedeGestionar && <button>Gestionar</button>}
    </div>
  );
}
```

---

### 3. Usar el Componente `PermissionGuard`

#### Ejemplo 1: Botón con permiso único

```javascript
import PermissionGuard from "@/components/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// El botón solo se muestra si tiene el permiso CLI_CREATE
<PermissionGuard permission="CLI_CREATE">
  <Button onClick={handleCreate}>
    <Plus className="mr-2 h-4 w-4" />
    Nuevo Cliente
  </Button>
</PermissionGuard>
```

#### Ejemplo 2: Sección con múltiples permisos

```javascript
// Se muestra si tiene AL MENOS UNO de los permisos
<PermissionGuard anyOf={["CLI_UPDATE", "CLI_DELETE"]}>
  <div className="actions">
    <PermissionGuard permission="CLI_UPDATE">
      <Button onClick={handleEdit}>Editar</Button>
    </PermissionGuard>

    <PermissionGuard permission="CLI_DELETE">
      <Button variant="destructive" onClick={handleDelete}>
        Eliminar
      </Button>
    </PermissionGuard>
  </div>
</PermissionGuard>
```

#### Ejemplo 3: Con fallback

```javascript
// Muestra mensaje si NO tiene permiso
<PermissionGuard
  permission="USR_DELETE"
  fallback={<span className="text-muted-foreground">Sin permisos</span>}
>
  <Button variant="destructive">Eliminar Usuario</Button>
</PermissionGuard>
```

---

### 4. Implementación Completa en ClientesPage

**Archivo:** `src/components/Clientes/ClientesPage.jsx`

```javascript
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PermissionGuard from "@/components/PermissionGuard";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";

export default function ClientesPage() {
  const { hasPermission } = usePermission();
  // ... resto del estado

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* Header con botón protegido */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clientes</h1>

          {/* Botón "Nuevo Cliente" solo visible con permiso CLI_CREATE */}
          <PermissionGuard permission="CLI_CREATE">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </PermissionGuard>
        </div>

        {/* Formulario solo visible si puede crear o editar */}
        <PermissionGuard anyOf={["CLI_CREATE", "CLI_UPDATE"]}>
          {showForm && (
            <ClientForm
              initialData={editingCliente}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          )}
        </PermissionGuard>

        {/* Tabla con acciones protegidas */}
        <ClientTable
          clientes={clientesActivos}
          onView={handleViewDetails}
          // Pasar permisos a la tabla para que oculte botones
          canEdit={hasPermission("CLI_UPDATE")}
          canDelete={hasPermission("CLI_DELETE")}
        />
      </div>
    </div>
  );
}
```

---

### 5. Actualizar Tabla de Clientes (ClientTable.jsx)

```javascript
import PermissionGuard from "@/components/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function ClientTable({
  clientes,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <Table>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.idCliente}>
            <TableCell>{cliente.nombre}</TableCell>
            <TableCell>{cliente.apellido}</TableCell>

            {/* Columna de acciones */}
            <TableCell>
              <div className="flex gap-2">
                {/* Ver siempre visible (CLI_READ) */}
                <PermissionGuard permission="CLI_READ">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(cliente.idCliente)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </PermissionGuard>

                {/* Editar solo con permiso */}
                <PermissionGuard permission="CLI_UPDATE">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(cliente)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </PermissionGuard>

                {/* Eliminar solo con permiso */}
                <PermissionGuard permission="CLI_DELETE">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(cliente.idCliente)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </PermissionGuard>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

### 6. Protección de Rutas Completas

**El sistema YA está configurado automáticamente.**

Si un usuario intenta acceder a `/clientes` sin tener NINGÚN permiso de `CLI_*`:

1. ✅ `ProtectedRoute` detecta que no tiene permisos
2. ✅ Muestra toast: **"Acceso denegado - No tienes permisos para acceder al módulo de Clientes"**
3. ✅ Redirige automáticamente a `/` (inicio)

**No necesitas hacer nada adicional**, solo asegúrate de que las rutas estén envueltas en `<ProtectedRoute>` (ya lo están en `App.jsx`).

---

### 7. Ocultar Items del Sidebar según Permisos

**Archivo:** `src/components/app-sidebar.jsx`

```javascript
import { usePermission } from "@/hooks/usePermission";
import { PermissionGroups } from "@/config/permissions";
import PermissionGuard from "@/components/PermissionGuard";

export function AppSidebar() {
  const { hasModuleAccess } = usePermission();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Usuarios - solo si tiene algún permiso USR_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.USERS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/usuarios">
                      <Users />
                      <span>Usuarios</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Clientes - solo si tiene algún permiso CLI_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.CLIENTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/clientes">
                      <UserCircle />
                      <span>Clientes</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>

              {/* Productos - solo si tiene algún permiso PROD_* */}
              <PermissionGuard
                anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/productos">
                      <Package />
                      <span>Productos</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </PermissionGuard>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Usuario con CLI_READ solamente

✅ Puede acceder a `/clientes`
✅ Ve la lista de clientes
✅ Puede hacer clic en "Ver detalles"
❌ NO ve botón "Nuevo Cliente"
❌ NO ve botones "Editar" en la tabla
❌ NO ve botones "Eliminar" en la tabla

### Caso 2: Usuario con CLI_CREATE y CLI_UPDATE

✅ Puede acceder a `/clientes`
✅ Ve botón "Nuevo Cliente"
✅ Ve botones "Editar"
✅ Puede crear y editar clientes
❌ NO ve botones "Eliminar"

### Caso 3: Usuario sin ningún permiso CLI_*

❌ NO ve "Clientes" en el sidebar
❌ Si intenta acceder a `/clientes` directamente (URL):
   - Ve toast "Acceso denegado"
   - Es redirigido a `/` (inicio)

---

## 🚀 Ventajas del Sistema

### 1. **Escalable**
Agregar un nuevo módulo = agregar entrada en `permissions.js`. Todo lo demás funciona automáticamente.

### 2. **Declarativo**
El código es auto-documentado. Ver `<PermissionGuard permission="CLI_CREATE">` es claro.

### 3. **Centralizado**
Todos los permisos en un solo lugar (`permissions.js`).

### 4. **Flexible**
- Permisos únicos: `permission="X"`
- Al menos uno: `anyOf={["X", "Y"]}`
- Todos: `allOf={["X", "Y"]}`

### 5. **Seguridad en Capas**
- Frontend: Oculta UI innecesaria (UX)
- Backend: Valida permisos (Seguridad real)

---

## 📝 Checklist de Implementación

Para agregar permisos a un módulo existente:

- [ ] 1. Actualizar `permissions.js` con permisos del módulo
- [ ] 2. Agregar ruta en `RoutePermissions`
- [ ] 3. Envolver botones con `<PermissionGuard>`
- [ ] 4. Actualizar tabla para pasar permisos
- [ ] 5. Actualizar sidebar para ocultar item si no tiene permisos
- [ ] 6. Probar con usuario sin permisos
- [ ] 7. Probar con usuario con permisos parciales

---

## 🔍 Debugging

### Ver permisos del usuario actual

```javascript
import { getCurrentUser } from "@/services/AuthService";

function DebugPermisos() {
  const user = getCurrentUser();

  console.log("Permisos del usuario:", user?.permissions);

  return (
    <div>
      <h3>Permisos actuales:</h3>
      <ul>
        {user?.permissions.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Verificar por qué no se muestra un botón

```javascript
import { usePermission } from "@/hooks/usePermission";

const { hasPermission } = usePermission();
console.log("Tiene CLI_CREATE:", hasPermission("CLI_CREATE"));
```

---

## 🎓 Mejores Prácticas

1. **Siempre proteger rutas Y componentes**: Doble capa de seguridad
2. **Usar nombres descriptivos**: `CLI_CREATE` es mejor que `C1`
3. **Agrupar permisos lógicamente**: Por módulo (CLI_*, PROD_*, etc.)
4. **Documentar permisos nuevos**: Agregar al archivo de configuración con comentarios
5. **Testear con diferentes roles**: Crear usuarios de prueba con distintos permisos

---

## 🔗 Archivos Relacionados

- `src/config/permissions.js` - Configuración de permisos
- `src/hooks/usePermission.js` - Hook de permisos
- `src/components/PermissionGuard.jsx` - Componente condicional
- `src/components/ProtectedRoute.jsx` - Protección de rutas
- `src/services/AuthService.js` - Gestión de autenticación

---

## ✅ Conclusión

Este sistema de permisos frontend es:

- ✅ **Simple** de usar (componentes declarativos)
- ✅ **Escalable** (agregar módulos es fácil)
- ✅ **Mantenible** (configuración centralizada)
- ✅ **Seguro** (complementa validación backend)
- ✅ **UX friendly** (usuario solo ve lo que puede hacer)

**¡Listo para usar en producción!** 🚀
