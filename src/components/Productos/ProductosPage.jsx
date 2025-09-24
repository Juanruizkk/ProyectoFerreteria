"use client";

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
import { Search, Plus, Package } from "lucide-react";
import ProductForm from "@/components/Productos/product-form";
import ProductList from "@/components/Productos/product-list";
import { toast } from "sonner";
import { fetchProductsWithDetails, createProduct } from "@/services/ProductQueries";
import { fetchCategorias } from "@/services/CategoryQueries";
import { fetchLocations } from "@/services/LocationQueries";

// Datos de ejemplo para categorías y ubicaciones
const categoriasIniciales = [
  { id: 1, categoria: "Electrónicos" },
  { id: 2, categoria: "Ropa" },
  { id: 3, categoria: "Hogar" },
  { id: 4, categoria: "Deportes" },
  { id: 5, categoria: "Libros" },
];

const ubicaciones = [
  { id: 1, nombre: "Almacén A" },
  { id: 2, nombre: "Almacén B" },
  { id: 3, nombre: "Tienda Principal" },
  { id: 4, nombre: "Depósito" },
];

// Productos de ejemplo
const productosIniciales = [
  {
    id: 1,
    nombre: "iPhone 15",
    marca: "Apple",
    descripcion: "Smartphone de última generación con cámara avanzada",
    precio: 999.99,
    stock: 25,
    stock_minimo: 5,
    idubicacion: 3,
    idcategoria: 1,
  },
  {
    id: 2,
    nombre: "Camiseta Deportiva",
    marca: "Nike",
    descripcion: "Camiseta transpirable para actividades deportivas",
    precio: 29.99,
    stock: 50,
    stock_minimo: 10,
    idubicacion: 1,
    idcategoria: 2,
  },
  {
    id: 3,
    nombre: "Cafetera Express",
    marca: "Nespresso",
    descripcion: "Cafetera automática con sistema de cápsulas",
    precio: 199.99,
    stock: 8,
    stock_minimo: 3,
    idubicacion: 2,
    idcategoria: 3,
  },
];

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [productosFiltrados, setProductosFiltrados] =
    useState(productosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Obtener productos al cargar el componente/
  useEffect(() => {
    let mounted = true;

    async function cargarProductos() {
      try {
        const data = await fetchProductsWithDetails();

        if (mounted) {
          setProductos(data);
        }
      } catch (error) {
        if (!mounted) return;

        toast.error("Error al cargar los productos");
        setProductos(productosIniciales);
      }
    }

    async function cargarCategorias() {
    try {
      const data = await fetchCategorias();
      if (mounted) setCategorias(data);
    } catch (error) {
      if (!mounted) return;
      toast.error("Error al cargar las categorías");
      setCategorias(categoriasIniciales);
    }
  }

  async function cargarUbicaciones() {
    try {
      const data = await fetchLocations();
      if (mounted) setUbicaciones(data);
    } catch (error) {
      if (!mounted) return;
      toast.error("Error al cargar las ubicaciones");
      setUbicaciones(ubicaciones);
    }
  }

    cargarProductos();
    cargarCategorias();
    cargarUbicaciones();

    return () => {
      mounted = false;
    };
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === "") {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          producto.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
          producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const handleCrearProducto = async (nuevoProducto) => {
    try {
      const creado = await createProduct(nuevoProducto) 
      setProductos([...productos, creado])
      toast.success("Producto creado", {
        description: `${creado.nombre} ha sido agregado exitosamente.`,
      })
    } catch (err) {
      toast.error("Error", {
        description: "No se pudo crear el producto",
      })
    } finally {
      setMostrarFormulario(false)
    }
  }

  const handleEditarProducto = (productoActualizado) => {
    setProductos(
      productos.map((p) =>
        p.id === productoActualizado.id ? productoActualizado : p
      )
    );
    setProductoEditando(null);
    setMostrarFormulario(false);
    toast({
      title: "Producto actualizado",
      description: `${productoActualizado.nombre} ha sido actualizado exitosamente.`,
    });
  };

  const handleEliminarProducto = (id) => {
    const producto = productos.find((p) => p.id === id);
    setProductos(productos.filter((p) => p.id !== id));
    toast({
      title: "Producto eliminado",
      description: `${producto.nombre} ha sido eliminado.`,
      variant: "destructive",
    });
  };

  const abrirFormularioCrear = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
  };


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Gestión de Productos
            </h1>
            <p className="text-muted-foreground">
              Administra tu inventario de productos
            </p>
          </div>
        </div>
        <Button onClick={abrirFormularioCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {productos.filter((p) => p.stock <= p.stock_minimo).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {productos
                .reduce((total, p) => total + p.precio * p.stock, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos por nombre, marca o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          {busqueda && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {productosFiltrados.length} de {productos.length}{" "}
              productos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formulario de producto */}
      {mostrarFormulario && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {productoEditando ? "Editar Producto" : "Crear Nuevo Producto"}
            </CardTitle>
            <CardDescription>
              {productoEditando
                ? "Modifica los datos del producto seleccionado"
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

      {/* Lista de productos */}
      <ProductList
        productos={productosFiltrados}
        onEditar={abrirFormularioEditar}
        onEliminar={handleEliminarProducto}
      />
    </div>
  );
}
