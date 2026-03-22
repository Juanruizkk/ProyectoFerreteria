import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Package,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import ProductForm from "@/components/Productos/product-form";
import ProductList from "@/components/Productos/product-list";
import ProductTable from "./product-table";
import ProductImport from "@/components/Productos/ProductImport";
import PaginationControls from "../Common/PaginationControls";
import { toast } from "sonner";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useViewPreference } from "@/hooks/useViewPreference";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useProductosQuery } from "@/hooks/useProductosQuery";
import { useCrud } from "@/hooks/useCRUD";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductEstado,
} from "@/services/ProductQueries";
import { fetchCategorias } from "@/services/CategoryQueries";
import { fetchLocations } from "@/services/LocationQueries";
import SearchBar from "../Common/SearchBar";

export default function ProductosPage() {
  const { hasPermission } = usePermission();
 
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportacion, setMostrarImportacion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const [vista, setVista] = useViewPreference(
    "productos-vista-preferencia",
    "cards",
  );

  // filtros
  const [filtroPrincipal, setFiltroPrincipal] = useState("todos"); // "todos" | "eliminados"
  const [stockBajoActivo, setStockBajoActivo] = useState(false); // subfiltro
 

  // paginado
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(9);

  const esActivos = filtroPrincipal !== "eliminados";

  const {
    items: productos,
    loading: loadingProductos,
    totalPages,
    hasPrev,
    hasNext,
    clearCache,
    reload,
  } = useProductosQuery({
    activo: esActivos,
    pageIndex,
    pageSize,
    searchTerm: busqueda,
  });

  const crud = useCrud({
    onSuccess: () => {
      clearCache();
      reload();
    },
    onError: ({ error, message }) => {
      toast.error(message || "Ocurrió un error", {
        description: error?.message,
      });
    },
  });

  const deleteDialog = useConfirmDialog(async (producto) => {
    await crud.remove(deleteProduct, producto.id, {
      errorMessage: "No se pudo eliminar el producto",
    });
    toast.success("Producto eliminado", {
      description: "El producto ha sido eliminado exitosamente.",
    });
  });

  // cargar categorías y ubicaciones al montar
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await fetchCategorias();
        setCategorias(data);
      } catch (error) {
        toast.error("Error al cargar categorías", {
          description: error.message,
        });
      }
    };

    const loadUbicaciones = async () => {
      try {
        const data = await fetchLocations();
        setUbicaciones(data);
      } catch (error) {
        toast.error("Error al cargar ubicaciones", {
          description: error.message,
        });
      }
    };

    loadCategorias();
    loadUbicaciones();
  }, []);

  // CRUD
  const handleCrearProducto = async (nuevoProducto) => {
    try {
      const creado = await crud.create(createProduct, nuevoProducto, {
        errorMessage: "No se pudo crear el producto",
      });
      toast.success("Producto creado", {
        description: `${creado.nombre} ha sido agregado exitosamente.`,
      });
    } finally {
      setMostrarFormulario(false);
    }
  };

  const handleEditarProducto = async (productoActualizado) => {
    try {
      const actualizado = await crud.update(updateProduct, productoActualizado, {
        errorMessage: "No se pudo actualizar el producto",
      });
      toast.success("Producto actualizado", {
        description: `${actualizado.nombre} ha sido actualizado exitosamente.`,
      });
    } finally {
      setProductoEditando(null);
      setMostrarFormulario(false);
    }
  };

  const handleSolicitarEliminar = (producto) => {
    deleteDialog.openDialog(producto);
  };

  const handleToggleEstado = async (id) => {
    try {
      const { activo } = await crud.toggle(toggleProductEstado, id, {
        errorMessage: "Error al cambiar el estado del producto",
      });
      toast.success(activo ? "Producto reactivado" : "Producto desactivado");
    } catch {
      // onError ya dispara el toast
    }
  };

  const abrirFormularioCrear = () => {
    setMostrarImportacion(false);
    setMostrarFormulario(true);
  };
  const abrirFormularioEditar = (producto) => {
    setProductoEditando(producto);
    setMostrarImportacion(false);
    setMostrarFormulario(true);
  };
  const cerrarFormulario = () => {
    setProductoEditando(null);
    setMostrarFormulario(false);
  };
  const abrirImportacion = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
    setMostrarImportacion(true);
  };
  const cerrarImportacion = () => {
    setMostrarImportacion(false);
  };
  const handleImportComplete = () => {
    clearCache();
    setPageIndex(1);
    reload();
  };

  // aplicar subfiltro stock bajo
  let productosVisibles = productos;
  if (stockBajoActivo) {
    productosVisibles = productosVisibles.filter(
      (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0),
    );
  }

  // cards data (estos se calculan sobre productos de la página actual)
  const totalStockBajo = productos.filter(
    (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0),
  ).length;
  const valorTotal = productos.reduce(
    (total, p) => total + p.precio * p.stock,
    0,
  );

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de productos" />}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Gestión de Productos</h1>
              <p className="text-muted-foreground">
                Administra tu inventario de productos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={vista === "cards" ? "default" : "outline"}
              size="icon"
              onClick={() => setVista("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={vista === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setVista("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <PermissionGuard permission="PROD_CREATE">
              <Button onClick={abrirFormularioCrear} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo Producto
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Cards estadísticas compactas (solo texto) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "todos", label: "Todos", color: "border-primary" },
            { key: "eliminados", label: "Eliminados", color: "border-red-500" },
            { key: "stock", label: "Stock Bajo", color: "border-amber-500" },
            {
              key: "nuevo",
              label: "Cargar Producto",
              color: "border-green-500",
            },
          ].map((card) => {
            const isActive =
              (card.key === "todos" && filtroPrincipal === "todos") ||
              (card.key === "eliminados" && filtroPrincipal === "eliminados") ||
              (card.key === "stock" && stockBajoActivo);

            const border = isActive ? card.color : "border-muted";

            return (
              <Card
                key={card.key}
                onClick={() => {
                  if (card.key === "todos") setFiltroPrincipal("todos");
                  else if (card.key === "eliminados")
                    setFiltroPrincipal("eliminados");
                  else if (card.key === "stock")
                    setStockBajoActivo(!stockBajoActivo);
                  else if (card.key === "nuevo") abrirImportacion();
                }}
                className={`cursor-pointer border ${border} hover:shadow-sm transition rounded-xl p-3 text-center`}
              >
                <CardHeader className="p-1">
                  <CardTitle className="text-lg font-medium">
                    {card.label}
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Buscador */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <SearchBar
              value={busqueda}
              onChange={(val) => {
                setPageIndex(1);
                setBusqueda(val);
              }}
              placeholder="Buscar productos..."
            />
          </CardContent>
        </Card>

        {/* Importación masiva */}
        {mostrarImportacion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Carga Masiva de Productos</CardTitle>
                  <CardDescription>
                    Descarga la plantilla, complétala y súbela para importar
                    productos
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={cerrarImportacion}>
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProductImport onImportComplete={handleImportComplete} />
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {productoEditando ? "Editar Producto" : "Crear Nuevo Producto"}
              </CardTitle>
              <CardDescription>
                {productoEditando
                  ? "Modifica los datos del producto"
                  : "Completa la información del nuevo producto"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm
                producto={productoEditando}
                categorias={categorias}
                ubicaciones={ubicaciones}
                onSubmit={
                  productoEditando ? handleEditarProducto : handleCrearProducto
                }
                onCancel={cerrarFormulario}
              />
            </CardContent>
          </Card>
        )}

        {/* Listado */}
        {vista === "cards" ? (
          <ProductList
            productos={productosVisibles}
            onEditar={abrirFormularioEditar}
            onEliminar={handleSolicitarEliminar}
            onToggleEstado={handleToggleEstado}
            isLoading={loadingProductos}
          />
        ) : (
          <ProductTable
            productos={productosVisibles}
            onEditar={abrirFormularioEditar}
            onEliminar={handleSolicitarEliminar}
            onToggleEstado={handleToggleEstado}
            isLoading={loadingProductos}
          />
        )}

        {/* Paginación */}
        {!loadingProductos && productosVisibles.length > 0 && (
          <PaginationControls
            currentPage={pageIndex}
            totalPages={totalPages}
            onPageChange={setPageIndex}
          />
        )}

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(v) => !v && deleteDialog.closeDialog()}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar el producto{" "}
                <span className="font-semibold text-foreground">
                  "{deleteDialog.item?.nombre}"
                </span>
                ? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={deleteDialog.closeDialog}
                disabled={deleteDialog.loading}
              >
                Cancelar
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={deleteDialog.confirm}
                disabled={deleteDialog.loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDialog.loading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  );
}
