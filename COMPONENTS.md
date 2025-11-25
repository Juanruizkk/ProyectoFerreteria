# Guía de Componentes - Sistema de Gestión de Ferretería

## Índice
1. [Componentes UI (shadcn/ui)](#componentes-ui-shadcnui)
2. [Componentes Compartidos](#componentes-compartidos)
3. [Módulo Productos](#módulo-productos)
4. [Módulo Usuarios](#módulo-usuarios)
5. [Layout y Navegación](#layout-y-navegación)
6. [Patrones de Uso](#patrones-de-uso)

---

## Componentes UI (shadcn/ui)

Ubicación: `src/components/ui/`

Todos los componentes están construidos sobre Radix UI y estilizados con Tailwind CSS.

### Layout Components

#### Card
**Archivo:** `card.jsx`

Contenedor versátil con header, content y footer.

```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
  <CardFooter>
    {/* Acciones */}
  </CardFooter>
</Card>
```

**Props:**
- `className` - Clases adicionales de Tailwind

---

#### Sheet
**Archivo:** `sheet.jsx`

Panel lateral que se desliza desde el borde de la pantalla.

```jsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button>Abrir Panel</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Título</SheetTitle>
      <SheetDescription>Descripción</SheetDescription>
    </SheetHeader>
    {/* Contenido */}
    <SheetFooter>
      {/* Acciones */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Props SheetContent:**
- `side` - "left" | "right" | "top" | "bottom" (default: "right")
- `className` - Clases adicionales

---

#### Drawer
**Archivo:** `drawer.jsx`

Drawer inferior (usa biblioteca vaul).

```jsx
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

<Drawer>
  <DrawerTrigger asChild>
    <Button>Abrir Drawer</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Título</DrawerTitle>
      <DrawerDescription>Descripción</DrawerDescription>
    </DrawerHeader>
    {/* Contenido */}
    <DrawerFooter>
      <Button>Guardar</Button>
      <DrawerClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**Uso:** Formularios y acciones en móvil.

---

#### Tabs
**Archivo:** `tabs.jsx`

Sistema de pestañas.

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">Todos</TabsTrigger>
    <TabsTrigger value="active">Activos</TabsTrigger>
    <TabsTrigger value="deleted">Eliminados</TabsTrigger>
  </TabsList>

  <TabsContent value="all">
    {/* Contenido de Todos */}
  </TabsContent>
  <TabsContent value="active">
    {/* Contenido de Activos */}
  </TabsContent>
  <TabsContent value="deleted">
    {/* Contenido de Eliminados */}
  </TabsContent>
</Tabs>
```

**Props Tabs:**
- `defaultValue` - Pestaña activa por defecto
- `value` - Pestaña activa (controlado)
- `onValueChange` - Callback al cambiar

---

#### Sidebar
**Archivo:** `sidebar.jsx`

Sistema completo de sidebar colapsable.

```jsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menú</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/productos">Productos</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <main>
    <SidebarTrigger /> {/* Botón para colapsar */}
    {/* Contenido */}
  </main>
</SidebarProvider>
```

---

### Form Components

#### Input
**Archivo:** `input.jsx`

Input de texto estilizado.

```jsx
import { Input } from "@/components/ui/input";

<Input
  type="text"
  placeholder="Ingrese texto..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**Props:**
- Todas las props estándar de `<input>`
- `type` - "text" | "email" | "password" | "number" | etc.
- `className` - Clases adicionales

---

#### Textarea
**Archivo:** `textarea.jsx`

Área de texto multilínea.

```jsx
import { Textarea } from "@/components/ui/textarea";

<Textarea
  placeholder="Descripción..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
/>
```

---

#### Label
**Archivo:** `label.jsx`

Etiqueta para inputs.

```jsx
import { Label } from "@/components/ui/label";

<Label htmlFor="name">Nombre</Label>
<Input id="name" />
```

---

#### Select
**Archivo:** `select.jsx`

Selector dropdown personalizado.

```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccione una opción" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
    <SelectItem value="option3">Opción 3</SelectItem>
  </SelectContent>
</Select>
```

**Props Select:**
- `value` - Valor seleccionado
- `onValueChange` - Callback al cambiar
- `disabled` - Deshabilitar

---

#### Checkbox
**Archivo:** `checkbox.jsx`

Checkbox personalizado.

```jsx
import { Checkbox } from "@/components/ui/checkbox";

<div className="flex items-center space-x-2">
  <Checkbox
    id="terms"
    checked={checked}
    onCheckedChange={setChecked}
  />
  <Label htmlFor="terms">Acepto los términos</Label>
</div>
```

**Props:**
- `checked` - Estado del checkbox (boolean)
- `onCheckedChange` - Callback (boolean => void)
- `disabled` - Deshabilitar

---

### Feedback Components

#### Button
**Archivo:** `button.jsx`

Botón con múltiples variantes.

```jsx
import { Button } from "@/components/ui/button";

<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

**Props:**
- `variant` - "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size` - "default" | "sm" | "lg" | "icon"
- `disabled` - Deshabilitar
- `asChild` - Renderizar como hijo directo (útil para Links)

---

#### Badge
**Archivo:** `badge.jsx`

Badge para estados o etiquetas.

```jsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

**Props:**
- `variant` - "default" | "secondary" | "destructive" | "outline"

---

#### Skeleton
**Archivo:** `skeleton.jsx`

Placeholder de carga.

```jsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-12 w-full" />
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />
```

---

#### Tooltip
**Archivo:** `tooltip.jsx`

Tooltip hover.

```jsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Información adicional</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

#### Alert Dialog
**Archivo:** `alert-dialog.jsx`

Diálogo modal de confirmación.

```jsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Continuar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

#### Dialog
**Archivo:** `dialog.jsx`

Diálogo modal genérico.

```jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    {/* Contenido */}
    <DialogFooter>
      <Button onClick={handleSubmit}>Guardar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Props Dialog:**
- `open` - Estado abierto/cerrado
- `onOpenChange` - Callback al cambiar estado

---

### Navigation Components

#### Dropdown Menu
**Archivo:** `dropdown-menu.jsx`

Menú desplegable.

```jsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Opciones</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleEdit}>
      Editar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

#### Breadcrumb
**Archivo:** `breadcrumb.jsx`

Navegación de migas de pan.

```jsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/productos">Productos</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Detalle</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### Data Components

#### Table
**Archivo:** `table.jsx`

Componentes para construir tablas.

```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Rol</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.nombre}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.rol}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

#### Scroll Area
**Archivo:** `scroll-area.jsx`

Área de scroll personalizada.

```jsx
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[400px] w-full rounded-md border p-4">
  {/* Contenido largo */}
</ScrollArea>
```

---

### Utility Components

#### Separator
**Archivo:** `separator.jsx`

Línea separadora.

```jsx
import { Separator } from "@/components/ui/separator";

<div>
  <p>Sección 1</p>
  <Separator className="my-4" />
  <p>Sección 2</p>
</div>

<Separator orientation="vertical" /> {/* Vertical */}
```

**Props:**
- `orientation` - "horizontal" | "vertical" (default: "horizontal")

---

#### Popover
**Archivo:** `popover.jsx`

Popover flotante.

```jsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Ver detalles</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-medium">Información</h4>
      <p className="text-sm">Contenido del popover</p>
    </div>
  </PopoverContent>
</Popover>
```

---

## Componentes Compartidos

Ubicación: `src/components/Common/`

### SearchBar
**Archivo:** `SearchBar.jsx`

Input de búsqueda reutilizable con icono.

```jsx
import { SearchBar } from "@/components/Common/SearchBar";

<SearchBar
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Buscar productos..."
/>
```

**Props:**
- `value` (string) - Valor del input
- `onChange` (function) - Handler del cambio
- `placeholder` (string, opcional) - Placeholder

**Características:**
- Icono de búsqueda integrado
- Estilos consistentes con el sistema
- Responsive

---

### PaginationControls
**Archivo:** `PaginationControls.jsx`

Controles de paginación Prev/Next.

```jsx
import { PaginationControls } from "@/components/Common/PaginationControls";

<PaginationControls
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>
```

**Props:**
- `currentPage` (number) - Página actual
- `totalPages` (number) - Total de páginas
- `onPageChange` (function) - Callback al cambiar página

**Características:**
- Botones Anterior/Siguiente
- Deshabilita botones en límites
- Muestra página actual / total

---

## Módulo Productos

Ubicación: `src/components/Productos/`

### ProductosPage
**Archivo:** `ProductosPage.jsx`

Página principal del módulo de productos.

**Estado:**
```javascript
- products: Array de productos
- loading: Boolean de carga
- currentPage: Número de página actual
- totalPages: Total de páginas
- searchTerm: Término de búsqueda
- showDeleted: Mostrar productos eliminados
- viewMode: "cards" | "table"
- cachedProducts: Map de productos por página (caché)
```

**Características:**
- CRUD completo
- Búsqueda con debouncing
- Paginación con caché
- Filtros (activos/eliminados, stock bajo)
- Vista dual (cards/tabla)
- Soft delete y restauración

**Funciones principales:**
```javascript
loadProducts(page)       // Cargar productos
handleCreate(formData)   // Crear producto
handleUpdate(id, data)   // Actualizar producto
handleDelete(id)         // Eliminar producto
handleRestore(id)        // Restaurar producto
toggleProductEstado(id)  // Toggle activo/inactivo
```

---

### ProductForm
**Archivo:** `product-form.jsx`

Formulario de creación/edición de productos en Dialog.

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onSubmit: function,
  initialData: object | null,  // null para crear, object para editar
  categories: array,            // Categorías disponibles
  locations: array              // Ubicaciones disponibles
}
```

**Campos:**
- Nombre (requerido)
- Marca (requerido)
- Descripción (opcional)
- Precio (requerido, number)
- Stock (requerido, number)
- Stock Mínimo (requerido, number)
- Categoría (select, requerido)
- Ubicación (select, requerido)
- Venta sin Stock (checkbox)

**Validaciones:**
- Todos los campos requeridos
- Precio > 0
- Stock >= 0
- Stock mínimo >= 0

**Uso:**
```jsx
<ProductForm
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  onSubmit={editingProduct ? handleUpdate : handleCreate}
  initialData={editingProduct}
  categories={categories}
  locations={locations}
/>
```

---

### ProductList
**Archivo:** `product-list.jsx`

Vista de productos en tarjetas (grid).

**Props:**
```javascript
{
  products: array,
  onEdit: function,
  onDelete: function,
  onRestore: function,
  onToggleEstado: function
}
```

**Características:**
- Grid responsive (3 columnas en desktop)
- Tarjetas con información del producto
- Badges de estado de stock:
  - Verde: Stock suficiente
  - Amarillo: Stock bajo
  - Rojo: Sin stock
- Botones de acción en cada card
- Información de ubicación

**Ejemplo de Card:**
```jsx
<Card>
  <CardHeader>
    <CardTitle>{producto.nombre}</CardTitle>
    <Badge>{stockStatus}</Badge>
  </CardHeader>
  <CardContent>
    <p>Marca: {producto.marca}</p>
    <p>Precio: ${producto.precio}</p>
    <p>Stock: {producto.stock}</p>
    <p>Ubicación: {ubicacion}</p>
  </CardContent>
  <CardFooter>
    <Button onClick={() => onEdit(producto)}>Editar</Button>
    <Button variant="destructive" onClick={() => onDelete(producto.id)}>
      Eliminar
    </Button>
  </CardFooter>
</Card>
```

---

### ProductTable
**Archivo:** `product-table.jsx`

Vista de productos en tabla.

**Props:**
```javascript
{
  products: array,
  onEdit: function,
  onDelete: function,
  onRestore: function
}
```

**Columnas:**
- Nombre
- Marca
- Precio
- Stock
- Stock Mínimo
- Categoría
- Ubicación
- Estado
- Acciones

**Características:**
- Tabla responsive
- Dropdown de acciones por fila
- Badges de estado
- Iconos para acciones

---

## Módulo Usuarios

Ubicación: `src/components/Users/`

### UserPage
**Archivo:** `UserPage.jsx`

Página principal del módulo de usuarios.

**Estado:**
```javascript
- users: Array de usuarios
- loading: Boolean de carga
- currentPage: Número de página
- totalPages: Total de páginas
- searchTerm: Término de búsqueda
- showDeleted: Mostrar usuarios eliminados
- permissionCategories: Categorías de permisos
- selectedUser: Usuario seleccionado para editar
- isDrawerOpen: Estado del drawer de formulario
```

**Características:**
- CRUD de usuarios
- Búsqueda por nombre/usuario/email con debouncing
- Filtros (activos/eliminados)
- Paginación
- Sistema de permisos por categorías
- Vista de permisos en popover

**Funciones principales:**
```javascript
loadUsers(page)              // Cargar usuarios
handleCreate(userData)       // Crear usuario
handleEdit(user)             // Abrir edición
handleUpdate(id, userData)   // Actualizar usuario
handleDelete(id)             // Eliminar usuario
```

**Tabla de usuarios:**
- Columnas: Usuario, Nombre, Email, Rol, Permisos, Acciones
- Popover para ver permisos detallados
- Dropdown de acciones (editar/eliminar)

---

### UserFormDrawer
**Archivo:** `UserFormDrawer.jsx`

Drawer lateral con formulario de usuario y gestión de permisos.

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  onSubmit: function,
  user: object | null,              // null para crear, object para editar
  permissionCategories: array
}
```

**Campos:**
- Usuario (requerido, unique)
- Contraseña (requerido en creación, opcional en edición)
- Nombre (requerido)
- Apellido (requerido)
- Email (requerido, formato email)
- Rol (requerido)
- Permisos (checkboxes por categoría)

**Sistema de Permisos:**
```jsx
{permissionCategories.map((category) => (
  <div key={category.idCategoriaPermiso}>
    <h4>{category.categoria}</h4>
    {category.permissions.map((permission) => (
      <div key={permission.idPermiso}>
        <Checkbox
          checked={selectedPermissions.includes(permission.idPermiso)}
          onCheckedChange={(checked) => handlePermissionChange(permission.idPermiso, checked)}
        />
        <Label>{permission.permiso}</Label>
        <Tooltip>
          <TooltipContent>{permission.descripcion}</TooltipContent>
        </Tooltip>
      </div>
    ))}
  </div>
))}
```

**Validaciones:**
- Usuario único
- Email formato válido
- Contraseña con requisitos mínimos
- Al menos un permiso seleccionado

**Uso:**
```jsx
<UserFormDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  onSubmit={selectedUser ? handleUpdate : handleCreate}
  user={selectedUser}
  permissionCategories={permissionCategories}
/>
```

---

## Layout y Navegación

### Layout
**Archivo:** `Layout.jsx`

Wrapper principal de la aplicación.

**Estructura:**
```jsx
<SidebarProvider>
  <div className="flex min-h-screen">
    <AppSidebar />
    <div className="flex-1">
      <header>
        <SidebarTrigger />
        <h1>Título de Página</h1>
      </header>
      <main>
        {children}
      </main>
    </div>
  </div>
</SidebarProvider>
```

**Características:**
- Sidebar colapsable
- Header con trigger y título
- Responsive
- Área de contenido principal

---

### AppSidebar
**Archivo:** `app-sidebar.jsx`

Sidebar de navegación del sistema.

**Estructura actual:**
```jsx
<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Menú</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Items de menú */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

**Rutas actuales:**
- `/` - Home/Dashboard
- `/productos` - Productos
- `/usuarios` - Usuarios

**Nota:** Sidebar actual tiene items placeholder. Actualizar con rutas reales del sistema.

---

## Patrones de Uso

### Patrón de Página Completa

```jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SearchBar } from "@/components/Common/SearchBar";
import { PaginationControls } from "@/components/Common/PaginationControls";
import { Button } from "@/components/ui/button";
import { fetchEntities, createEntity, updateEntity, deleteEntity } from "@/services/EntityQueries";

const EntityPage = () => {
  // Estado
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  // Cargar datos
  const loadEntities = async (page = currentPage) => {
    try {
      setLoading(true);
      const data = await fetchEntities(page, 10, debouncedSearch);
      setEntities(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntities(1);
  }, [debouncedSearch]);

  // Handlers CRUD
  const handleCreate = () => {
    setEditingEntity(null);
    setIsFormOpen(true);
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingEntity) {
        await updateEntity(editingEntity.id, formData);
        toast.success("Actualizado exitosamente");
      } else {
        await createEntity(formData);
        toast.success("Creado exitosamente");
      }
      setIsFormOpen(false);
      loadEntities();
    } catch (error) {
      toast.error("Error en la operación");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEntity(id);
      toast.success("Eliminado exitosamente");
      loadEntities();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Entidades</h1>
        <Button onClick={handleCreate}>Crear Nuevo</Button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <>
          {/* Lista o Tabla de entidades */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entities.map((entity) => (
              <Card key={entity.id}>
                {/* Contenido de la card */}
                <CardFooter>
                  <Button onClick={() => handleEdit(entity)}>Editar</Button>
                  <Button variant="destructive" onClick={() => handleDelete(entity.id)}>
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Formulario (Dialog/Drawer) */}
      <EntityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingEntity}
      />
    </div>
  );
};

export default EntityPage;
```

---

### Patrón de Formulario en Dialog

```jsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EntityForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    // ... más campos
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        email: "",
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Entidad" : "Crear Entidad"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EntityForm;
```

---

### Patrón de Tabla con Acciones

```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";

const EntityTable = ({ entities, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entities.map((entity) => (
          <TableRow key={entity.id}>
            <TableCell className="font-medium">{entity.name}</TableCell>
            <TableCell>{entity.email}</TableCell>
            <TableCell>
              <Badge variant={entity.active ? "default" : "secondary"}>
                {entity.active ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(entity)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(entity.id)}
                    className="text-red-600"
                  >
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default EntityTable;
```

---

### Custom Hook: useDebouncedValue

```javascript
import { useState, useEffect } from "react";

export const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

---

## Checklist para Nuevo Módulo

Cuando crees un nuevo módulo, sigue esta estructura:

- [ ] Crear carpeta en `src/components/[Modulo]/`
- [ ] Crear página principal `[Modulo]Page.jsx`
- [ ] Crear formulario `[Modulo]Form.jsx` o `[Modulo]FormDrawer.jsx`
- [ ] Crear tabla/lista `[Modulo]Table.jsx` o `[Modulo]List.jsx`
- [ ] Crear servicio en `src/services/[Modulo]Queries.js`
- [ ] Agregar ruta en `App.jsx`
- [ ] Agregar item en `AppSidebar.jsx`
- [ ] Implementar CRUD completo
- [ ] Agregar búsqueda con debouncing
- [ ] Implementar paginación
- [ ] Agregar toast notifications
- [ ] Validación de formularios
- [ ] Manejo de errores
- [ ] Responsive design

---

**Última actualización:** 2025-11-24
**Versión del documento:** 1.0
