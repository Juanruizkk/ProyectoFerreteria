"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Search,
  Plus,
  Package,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react"
import ProductForm from "@/components/Productos/product-form"
import ProductList from "@/components/Productos/product-list"
import ProductTable from "./product-table"
import { toast } from "sonner"
import {
  fetchProductsWithDetails,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/ProductQueries"
import { fetchCategorias } from "@/services/CategoryQueries"
import { fetchLocations } from "@/services/LocationQueries"

const categoriasIniciales = [
  { id: 1, categoria: "Electrónicos" },
  { id: 2, categoria: "Ropa" },
  { id: 3, categoria: "Hogar" },
  { id: 4, categoria: "Deportes" },
  { id: 5, categoria: "Libros" },
]

const ubicaciones = [
  { id: 1, nombre: "Almacén A" },
  { id: 2, nombre: "Almacén B" },
  { id: 3, nombre: "Tienda Principal" },
  { id: 4, nombre: "Depósito" },
]

export default function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [vista, setVista] = useState("cards")
  const [filtroActivo, setFiltroActivo] = useState("todos")
  const [loadingProductos, setLoadingProductos] = useState(false)

  // cache: guardamos resultados para no volver a pedir
  const cacheRef = useRef({ activos: null, eliminados: null })

  // Carga inicial → productos activos
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingProductos(true)
        const data = await fetchProductsWithDetails(true)
        if (!mounted) return
        cacheRef.current.activos = data
        setProductos(data)
      } catch {
        if (!mounted) return
        toast.error("Error al cargar los productos")
      } finally {
        if (mounted) setLoadingProductos(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Manejar cambios de filtro (todos, eliminados, stockBajo)
  useEffect(() => {
    const load = async () => {
      if (filtroActivo === "eliminados") {
        if (cacheRef.current.eliminados) {
          setProductos(cacheRef.current.eliminados)
          return
        }
        try {
          setLoadingProductos(true)
          const data = await fetchProductsWithDetails(false)
          cacheRef.current.eliminados = data
          setProductos(data)
        } catch {
          toast.error("Error al cargar productos eliminados")
        } finally {
          setLoadingProductos(false)
        }
      }
      if (filtroActivo === "todos") {
        if (cacheRef.current.activos) {
          setProductos(cacheRef.current.activos)
        }
      }
      if (filtroActivo === "stockBajo") {
        const base =
          cacheRef.current.eliminados && productos.some((p) => p.activo === false)
            ? cacheRef.current.eliminados
            : cacheRef.current.activos
        if (base) setProductos(base.filter((p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0)))
      }
    }
    load()
  }, [filtroActivo])

  // Filtrado por búsqueda
  useEffect(() => {
    if (busqueda.trim() === "") {
      setProductosFiltrados(productos)
    } else {
      const q = busqueda.toLowerCase()
      const filtrados = productos.filter((producto) => {
        const nombre = (producto.nombre || "").toLowerCase()
        const marca = (producto.marca || "").toLowerCase()
        const descripcion = (producto.descripcion || "").toLowerCase()
        return nombre.includes(q) || marca.includes(q) || descripcion.includes(q)
      })
      setProductosFiltrados(filtrados)
    }
  }, [busqueda, productos])

  // CRUD
  const handleCrearProducto = async (nuevoProducto) => {
    try {
      const creado = await createProduct(nuevoProducto)
      setProductos([...productos, creado])
      cacheRef.current.activos = [...(cacheRef.current.activos || []), creado]
      toast.success("Producto creado", {
        description: `${creado.nombre} ha sido agregado exitosamente.`,
      })
    } catch {
      toast.error("Error", { description: "No se pudo crear el producto" })
    } finally {
      setMostrarFormulario(false)
    }
  }

  const handleEditarProducto = async (productoActualizado) => {
    try {
      const actualizado = await updateProduct(productoActualizado)
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
      )
      // actualizar cache
      const targetKey = actualizado.activo ? "activos" : "eliminados"
      if (cacheRef.current[targetKey]) {
        cacheRef.current[targetKey] = cacheRef.current[targetKey].map((p) =>
          p.id === actualizado.id ? { ...p, ...actualizado } : p
        )
      }
      toast.success("Producto actualizado", {
        description: `${actualizado.nombre} ha sido actualizado exitosamente.`,
      })
    } catch {
      toast.error("Error", { description: "No se pudo actualizar el producto" })
    } finally {
      setProductoEditando(null)
      setMostrarFormulario(false)
    }
  }

  const handleEliminarProducto = async (id) => {
    try {
      await deleteProduct(id)
      setProductos((prev) => prev.filter((p) => p.id !== id))
      // sacar de cache activos
      if (cacheRef.current.activos) {
        cacheRef.current.activos = cacheRef.current.activos.filter((p) => p.id !== id)
      }
      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado exitosamente.",
      })
    } catch {
      toast.error("Error", { description: "No se pudo eliminar el producto" })
    }
  }

  const abrirFormularioCrear = () => {
    setProductoEditando(null)
    setMostrarFormulario(true)
  }
  const abrirFormularioEditar = (producto) => {
    setProductoEditando(producto)
    setMostrarFormulario(true)
  }
  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setProductoEditando(null)
  }

  const productosVisibles = productosFiltrados

  // Calculos para cards
  const totalStockBajo = productos.filter(
    (p) => p.stock <= (p.stockMinimo ?? p.stock_minimo ?? 0)
  ).length
  const valorTotal = productos.reduce((total, p) => total + p.precio * p.stock, 0)
  const totalEliminados = cacheRef.current.eliminados
    ? cacheRef.current.eliminados.length
    : 0

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra tu inventario de productos</p>
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

      {/* Cards estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          onClick={() => setFiltroActivo("todos")}
          className={`cursor-pointer hover:shadow transition ${
            filtroActivo === "todos" ? "border-primary" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFiltroActivo("stockBajo")}
          className={`cursor-pointer hover:shadow transition ${
            filtroActivo === "stockBajo" ? "border-primary" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalStockBajo}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow transition">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${valorTotal.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setFiltroActivo("eliminados")}
          className={`cursor-pointer hover:shadow transition ${
            filtroActivo === "eliminados" ? "border-red-500" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Productos Eliminados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {totalEliminados}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos por nombre, marca o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          {busqueda && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {productosFiltrados.length} de {productos.length} productos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formulario */}
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
              onSubmit={productoEditando ? handleEditarProducto : handleCrearProducto}
              onCancel={cerrarFormulario}
            />
          </CardContent>
        </Card>
      )}

      {loadingProductos && (
        <div className="text-sm text-muted-foreground mb-4">Actualizando listado...</div>
      )}

      {/* Listado */}
      {vista === "cards" ? (
        <ProductList
          productos={productosVisibles}
          onEditar={abrirFormularioEditar}
          onEliminar={handleEliminarProducto}
        />
      ) : (
        <ProductTable
          productos={productosVisibles}
          onEditar={abrirFormularioEditar}
          onEliminar={handleEliminarProducto}
        />
      )}
    </div>
  )
}
