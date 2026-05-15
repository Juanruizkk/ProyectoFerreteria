# SVS - Sistema de Venta y Stock (Frontend)

Frontend del sistema de gestión de ventas y stock para ferretería, desarrollado con React y shadcn/ui.

## Tecnologías

- **Framework**: React (JavaScript puro)
- **Build tool**: Vite
- **UI**: shadcn/ui
- **Autenticación**: JWT

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
npm install
```

## Scripts

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del proyecto

```
src/
  components/    # Componentes reutilizables (shadcn/ui y propios)
  pages/         # Vistas principales por módulo
  services/      # Llamadas a la API del backend
  hooks/         # Custom hooks
  utils/         # Funciones auxiliares
```

## Módulos del sistema

- **Autenticación**: Login con JWT, redirección según rol
- **Usuarios**: CRUD completo (solo Administrador)
- **Productos**: CRUD, carga de stock, códigos de barra, ubicación en depósito
- **Clientes**: CRUD, cuenta corriente, movimientos
- **Ventas**: Registro de ventas, emisión de facturas, búsqueda
- **Reportes**: Reportes financieros y de gestión, exportación PDF/Excel

## Roles

| Rol | Acceso |
|-----|--------|
| Administrador | Acceso completo |
| Encargado de Precios | Productos, stock, precios |
| Vendedor | Ventas, clientes, consulta de stock |

## Conexión con el backend

El frontend consume la API REST del backend (ASP.NET Core). Configurar la URL base en las variables de entorno:

```env
VITE_API_URL=http://localhost:5000
```

## Equipo

- Peralta Enzo
- Ruiz Rodriguez Juan Ignacio

**Universidad Nacional de Tucumán - FACET - 2025**
