import { useState, useEffect, useRef } from "react";
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

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportacion, setMostrarImportacion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [vista, setVista] = useState(() => {
    // Leer preferencia de vista desde localStorage
    const vistaGuardada = localStorage.getItem("productos-vista-preferencia");
    return vistaGuardada || "cards";
  });

  // filtros
  const [filtroPrincipal, setFiltroPrincipal] = useState("todos"); // "todos" | "eliminados"
  const [stockBajoActivo, setStockBajoActivo] = useState(false); // subfiltro
  const [loadingProductos, setLoadingProductos] = useState(false);

  // paginado
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // cache por página
  const cacheRef = useRef({ activos: {}, eliminados: {} });

  // guardar preferencia de vista en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem("productos-vista-preferencia", vista);
  }, [vista]);

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

  // cargar productos según filtro y paginado
  useEffect(() => {
    const load = async () => {
      const esEliminados = filtroPrincipal === "eliminados";
      const cacheKey = esEliminados ? "eliminados" : "activos";

      // si no hay búsqueda y ya tengo la página cacheada → uso cache
      if (!busqueda && cacheRef.current[cacheKey][pageIndex]) {
        const data = cacheRef.current[cacheKey][pageIndex];
        setProductos(data.items);
        setTotalPages(data.totalPages);
        setHasPrev(data.hasPrevioPage);
        setHasNext(data.hasNextPage);
        return;
      }

      try {
        setLoadingProductos(true);
        const data = await fetchProductsWithDetails(
          !esEliminados,
          pageIndex,
          pageSize,
          busqueda
        );

        // cachear solo si no hay búsqueda
        if (!busqueda) {
          cacheRef.current[cacheKey][pageIndex] = data;
        }

        setProductos(data.items);
        setTotalPages(data.totalPages);
        setHasPrev(data.hasPrevioPage);
        setHasNext(data.hasNextPage);
      } catch {
        toast.error("Error al cargar productos");
      } finally {
        setLoadingProductos(false);
      }
    };

    load();
  }, [filtroPrincipal, pageIndex, pageSize, busqueda]);

  // CRUD
  const handleCrearProducto = async (nuevoProducto) => {
    try {
      const creado = await createProduct(nuevoProducto);
      setProductos([...productos, creado]);
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
        prev.map((p) =>
          p.id === actualizado.id ? { ...p, ...actualizado } : p
        )
      );
      toast.success("Producto actualizado", {
        description: `${actualizado.nombre} ha sido actualizado exitosamente.`,
      });
    } catch {
      toast.error("Error", {
        description: "No se pudo actualizar el producto",
      });
    } finally {
      setProductoEditando(null);
      setMostrarFormulario(false);
    }
  };

  const handleEliminarProducto = async (id) => {
    try {
      await deleteProduct(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado exitosamente.",
      });
    } catch {
      toast.error("Error", { description: "No se pudo eliminar el producto" });
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      const { id: idProducto, activo } = await toggleProductEstado(id);

      setProductos((prev) => {
        if (filtroPrincipal === "eliminados" && activo) {
          return prev.filter((p) => p.id !== idProducto);
        }
        if (filtroPrincipal === "todos" && !activo) {
          return prev.filter((p) => p.id !== idProducto);
        }
        return prev.map((p) => (p.id === idProducto ? { ...p, activo } : p));
      });

      toast.success(activo ? "Producto reactivado" : "Producto desactivado");
    } catch {
      toast.error("Error al cambiar el estado del producto");
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
    // Limpiar cache y recargar
    cacheRef.current = { activos: {}, eliminados: {} };
    setPageIndex(1);
    // El useEffect se disparará automáticamente con el cambio de pageIndex
  };

  // aplicar subfiltro stock bajo
  let productosVisibles = productos;
  if (stockBajoActivo) {
    productosVisibles = productosVisibles.filter(
      (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0)
    );
  }

  // cards data (estos se calculan sobre productos de la página actual)
  const totalStockBajo = productos.filter(
    (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0)
  ).length;
  const valorTotal = productos.reduce(
    (total, p) => total + p.precio * p.stock,
    0
  );

  return (
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
          <Button onClick={abrirFormularioCrear} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Cards estadísticas compactas (solo texto) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: "todos", label: "Todos", color: "border-primary" },
          { key: "eliminados", label: "Eliminados", color: "border-red-500" },
          { key: "stock", label: "Stock Bajo", color: "border-amber-500" },
          { key: "nuevo", label: "Cargar Producto", color: "border-green-500" },
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
                  Descarga la plantilla, complétala y súbela para importar productos
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

      {loadingProductos && (
        <div className="text-sm text-muted-foreground mb-4">
          Actualizando listado...
        </div>
      )}

      {/* Listado */}
      {vista === "cards" ? (
        <ProductList
          productos={productosVisibles}
          onEditar={abrirFormularioEditar}
          onEliminar={handleEliminarProducto}
          onToggleEstado={handleToggleEstado}
        />
      ) : (
        <ProductTable
          productos={productosVisibles}
          onEditar={abrirFormularioEditar}
          onEliminar={handleEliminarProducto}
          onToggleEstado={handleToggleEstado}
        />
      )}

      {/* Paginación */}
      {productosVisibles.length > 0 && (
        <PaginationControls
          pageIndex={pageIndex}
          totalPages={totalPages}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPageChange={setPageIndex}
        />
      )}
    </div>
  );
}
