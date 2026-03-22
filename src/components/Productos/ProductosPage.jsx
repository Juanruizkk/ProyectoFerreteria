import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  Package,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  X,
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

import {
  fetchProductsWithDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductEstado,
} from "@/services/ProductQueries";
import { fetchCategorias } from "@/services/CategoryQueries";
import { fetchLocations } from "@/services/LocationQueries";
import SearchBar from "../Common/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductosPage() {
  const { hasPermission } = usePermission();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportacion, setMostrarImportacion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [vista, setVista] = useState(() => {
    const vistaGuardada = localStorage.getItem("productos-vista-preferencia");
    return vistaGuardada || "cards";
  });

  // filtro único: "activos" | "inactivos" | "stockBajo"
  const [filtro, setFiltro] = useState("activos");
  // filtro por categoría: null = todas
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  // sub-filtro solo para stockBajo: "todos" | "activos" | "inactivos"
  const [stockBajoSubFiltro, setStockBajoSubFiltro] = useState("todos");
  const [stockBajoCounts, setStockBajoCounts] = useState({ todos: 0, activos: 0, inactivos: 0 });
  const [loadingProductos, setLoadingProductos] = useState(false);

  // paginado
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // cache por filtro y página
  const cacheRef = useRef({ activos: {}, inactivos: {} });
  // cache para el listado completo de stock bajo (paginado client-side)
  const stockBajoRef = useRef(null);

  // diálogo de eliminación
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    localStorage.setItem("productos-vista-preferencia", vista);
  }, [vista]);

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await fetchCategorias();
        setCategorias(data);
      } catch (error) {
        toast.error("Error al cargar categorías", { description: error.message });
      }
    };
    const loadUbicaciones = async () => {
      try {
        const data = await fetchLocations();
        setUbicaciones(data);
      } catch (error) {
        toast.error("Error al cargar ubicaciones", { description: error.message });
      }
    };
    loadCategorias();
    loadUbicaciones();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProductos(true);

        if (filtro === "stockBajo") {
          // Para stock bajo: traer activos e inactivos en paralelo y filtrar
          if (!busqueda && !categoriaFiltro && stockBajoRef.current) {
            // usar cache, re-aplicar sub-filtro
            aplicarPaginacionStockBajo(stockBajoRef.current);
            return;
          }

          const [dataActivos, dataInactivos] = await Promise.all([
            fetchProductsWithDetails(true, 1, 500, busqueda, categoriaFiltro),
            fetchProductsWithDetails(false, 1, 500, busqueda, categoriaFiltro),
          ]);

          const todos = [...dataActivos.items, ...dataInactivos.items];
          const conStockBajo = todos.filter(
            (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0)
          );

          if (!busqueda) stockBajoRef.current = conStockBajo;
          setStockBajoCounts({
            todos:    conStockBajo.length,
            activos:  conStockBajo.filter((p) => p.activo).length,
            inactivos: conStockBajo.filter((p) => !p.activo).length,
          });
          aplicarPaginacionStockBajo(conStockBajo);
        } else {
          const cacheKey = filtro; // "activos" o "inactivos"

          if (!busqueda && cacheRef.current[cacheKey]?.[pageIndex]) {
            const data = cacheRef.current[cacheKey][pageIndex];
            setProductos(data.items);
            setTotalPages(data.totalPages);
            setHasPrev(data.hasPrevioPage);
            setHasNext(data.hasNextPage);
            return;
          }

          const data = await fetchProductsWithDetails(
            filtro === "activos",
            pageIndex,
            pageSize,
            busqueda,
            categoriaFiltro
          );

          if (!busqueda && !categoriaFiltro) {
            cacheRef.current[cacheKey][pageIndex] = data;
          }

          setProductos(data.items);
          setTotalPages(data.totalPages);
          setHasPrev(data.hasPrevioPage);
          setHasNext(data.hasNextPage);
        }
      } catch {
        toast.error("Error al cargar productos");
      } finally {
        setLoadingProductos(false);
      }
    };

    load();
  }, [filtro, pageIndex, pageSize, busqueda, stockBajoSubFiltro, categoriaFiltro]);

  const aplicarPaginacionStockBajo = (items, subFiltro = stockBajoSubFiltro) => {
    const filtrados =
      subFiltro === "activos"   ? items.filter((p) => p.activo) :
      subFiltro === "inactivos" ? items.filter((p) => !p.activo) :
      items;
    const start = (pageIndex - 1) * pageSize;
    const totalPagesCalc = Math.max(1, Math.ceil(filtrados.length / pageSize));
    setProductos(filtrados.slice(start, start + pageSize));
    setTotalPages(totalPagesCalc);
    setHasPrev(pageIndex > 1);
    setHasNext(pageIndex < totalPagesCalc);
  };

  // CRUD
  const handleCrearProducto = async (nuevoProducto) => {
    try {
      const creado = await createProduct(nuevoProducto);
      setProductos((prev) => [...prev, creado]);
      toast.success("Producto creado", {
        description: `${creado.nombre} ha sido agregado exitosamente.`,
      });
    } catch {
      toast.error("Error", { description: "No se pudo crear el producto" });
    } finally {
      setMostrarFormulario(false);
    }
  };

  const handleEditarProducto = async (productoActualizado) => {
    try {
      const actualizado = await updateProduct(productoActualizado);
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
      );
      toast.success("Producto actualizado", {
        description: `${actualizado.nombre} ha sido actualizado exitosamente.`,
      });
    } catch {
      toast.error("Error", { description: "No se pudo actualizar el producto" });
    } finally {
      setProductoEditando(null);
      setMostrarFormulario(false);
    }
  };

  const handleSolicitarEliminar = (producto) => {
    setProductoAEliminar(producto);
    setMostrarDialogoEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      setEliminando(true);
      await deleteProduct(productoAEliminar.id);
      setProductos((prev) => prev.filter((p) => p.id !== productoAEliminar.id));
      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado exitosamente.",
      });
      setMostrarDialogoEliminar(false);
      setProductoAEliminar(null);
    } catch {
      toast.error("Error", { description: "No se pudo eliminar el producto" });
      setMostrarDialogoEliminar(false);
      setProductoAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const handleCancelarEliminar = () => {
    setMostrarDialogoEliminar(false);
    setProductoAEliminar(null);
  };

  const handleGestionarCodigosBarras = async (producto, codigosActualizados) => {
    const actualizado = await updateProduct({
      id: producto.id,
      idProducto: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      descripcion: producto.descripcion ?? "",
      precio: producto.precio,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo ?? producto.stock_minimo ?? 0,
      ventaSinStock: producto.ventaSinStock ?? false,
      idUbicacion: producto.idUbicacion ?? producto.id_ubicacion,
      idCategoria: producto.idCategoria ?? producto.id_categoria,
      activo: producto.activo,
      codigoBarras: codigosActualizados,
    });
    setProductos((prev) =>
      prev.map((p) =>
        p.id === actualizado.id ? { ...p, codigoBarras: codigosActualizados } : p
      )
    );
    toast.success("Códigos de barra actualizados");
  };

  const handleToggleVentaSinStock = async (producto) => {
    try {
      const actualizado = await updateProduct({
        id: producto.id,
        idProducto: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio,
        stock: producto.stock,
        stockMinimo: producto.stockMinimo ?? producto.stock_minimo ?? 0,
        ventaSinStock: !producto.ventaSinStock,
        idUbicacion: producto.idUbicacion ?? producto.id_ubicacion,
        idCategoria: producto.idCategoria ?? producto.id_categoria,
        activo: producto.activo,
        codigoBarras: producto.codigoBarras ?? [],
      });
      setProductos((prev) =>
        prev.map((p) =>
          p.id === actualizado.id ? { ...p, ventaSinStock: actualizado.ventaSinStock } : p
        )
      );
      toast.success(
        actualizado.ventaSinStock
          ? "Venta sin stock activada"
          : "Venta sin stock desactivada"
      );
    } catch {
      toast.error("Error al actualizar el producto");
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      const { id: idProducto, activo } = await toggleProductEstado(id);

      setProductos((prev) => {
        if (filtro === "inactivos" && activo) return prev.filter((p) => p.id !== idProducto);
        if (filtro === "activos" && !activo) return prev.filter((p) => p.id !== idProducto);
        return prev.map((p) => (p.id === idProducto ? { ...p, activo } : p));
      });

      toast.success(activo ? "Producto reactivado" : "Producto desactivado");
    } catch {
      toast.error("Error al cambiar el estado del producto");
    }
  };

  const limpiarCache = () => {
    cacheRef.current = { activos: {}, inactivos: {} };
    stockBajoRef.current = null;
  };

  const cambiarFiltro = (nuevoFiltro) => {
    setFiltro(nuevoFiltro);
    setStockBajoSubFiltro("todos");
    setPageIndex(1);
    setMostrarImportacion(false);
    setMostrarFormulario(false);
    setProductoEditando(null);
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
    limpiarCache();
    setPageIndex(1);
  };

  const filterCards = [
    { key: "activos",    label: "Activos",          color: "border-primary" },
    { key: "inactivos",  label: "Inactivos",         color: "border-red-500" },
    { key: "stockBajo",  label: "Stock Bajo",        color: "border-amber-500" },
    { key: "nuevo",      label: "Cargar Producto",   color: "border-green-500" },
  ];

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.PRODUCTS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de productos" />}
    >
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
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

        {/* Filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {filterCards.map((card) => {
            const isActive =
              card.key !== "nuevo"
                ? filtro === card.key
                : mostrarImportacion;
            const border = isActive ? card.color : "border-muted";

            return (
              <Card
                key={card.key}
                onClick={() => {
                  if (card.key === "nuevo") abrirImportacion();
                  else cambiarFiltro(card.key);
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

        {/* Sub-filtro Stock Bajo */}
        {filtro === "stockBajo" && (
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm text-muted-foreground">Filtrar por estado</span>
            <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-0.5">
              {[
                { key: "todos",     label: "Todos" },
                { key: "activos",   label: "Activos" },
                { key: "inactivos", label: "Inactivos" },
              ].map((op) => {
                const isSelected = stockBajoSubFiltro === op.key;
                return (
                  <button
                    key={op.key}
                    onClick={() => { setStockBajoSubFiltro(op.key); setPageIndex(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {op.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
                      isSelected ? "bg-muted text-foreground" : "bg-background/60 text-muted-foreground"
                    }`}>
                      {stockBajoCounts[op.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Buscador + Filtro categoría */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchBar
                  value={busqueda}
                  onChange={(val) => { setPageIndex(1); setBusqueda(val); }}
                  placeholder="Buscar por nombre, marca, código..."
                />
              </div>
              <Select
                value={categoriaFiltro ? String(categoriaFiltro) : "todas"}
                onValueChange={(val) => {
                  setCategoriaFiltro(val === "todas" ? null : Number(val));
                  setPageIndex(1);
                  limpiarCache();
                }}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map((c) => {
                    const cid = c.idCategoria ?? c.id;
                    return (
                      <SelectItem key={cid} value={String(cid)}>
                        {c.categoria}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
                    Descarga la plantilla, complétala y súbela para importar productos
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={cerrarImportacion} className="gap-2">
                  <X className="h-4 w-4" /> Cerrar
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
                onSubmit={productoEditando ? handleEditarProducto : handleCrearProducto}
                onCancel={cerrarFormulario}
              />
            </CardContent>
          </Card>
        )}

        {loadingProductos && (
          <div className="text-sm text-muted-foreground mb-4">
            Actualizando listado...
          </div>
        )}

        {/* Listado */}
        {vista === "cards" ? (
          <ProductList
            productos={productos}
            onEditar={abrirFormularioEditar}
            onEliminar={handleSolicitarEliminar}
            onToggleEstado={handleToggleEstado}
            onToggleVentaSinStock={handleToggleVentaSinStock}
          />
        ) : (
          <ProductTable
            productos={productos}
            onEditar={abrirFormularioEditar}
            onEliminar={handleSolicitarEliminar}
            onToggleEstado={handleToggleEstado}
            onToggleVentaSinStock={handleToggleVentaSinStock}
            onGestionarCodigosBarras={handleGestionarCodigosBarras}
          />
        )}

        {/* Paginación */}
        {productos.length > 0 && (
          <div className="flex justify-end mt-6">
            <PaginationControls
              currentPage={pageIndex}
              totalPages={totalPages}
              onPageChange={setPageIndex}
            />
          </div>
        )}

        {/* Diálogo eliminar */}
        <AlertDialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar el producto{" "}
                <span className="font-semibold text-foreground">
                  "{productoAEliminar?.nombre}"
                </span>
                ? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelarEliminar} disabled={eliminando}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  );
}
