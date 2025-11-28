import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, CheckCircle, XCircle, Layers } from "lucide-react"
import CategoryForm from "./CategoryForm"
import CategoryList from "./CategoryList"
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  errorMessages
} from "@/services/CategoryQueries"

export default function CategoryManager() {
  const [categorias, setCategorias] = useState([])
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [busqueda, setBusqueda] = useState("")

  // Estados para el diálogo de confirmación
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false)
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  // Estados para mensajes/alertas
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: "", mensaje: "" })

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias()
  }, [])

  // Filtrar categorías cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === "") {
      setCategoriasFiltradas(categorias)
    } else {
      const busquedaLower = busqueda.toLowerCase()
      setCategoriasFiltradas(
        categorias.filter(cat =>
          cat.categoria.toLowerCase().includes(busquedaLower) ||
          cat.descripcion?.toLowerCase().includes(busquedaLower)
        )
      )
    }
  }, [busqueda, categorias])

  const cargarCategorias = async () => {
    try {
      setIsLoading(true)
      const data = await fetchCategorias()
      setCategorias(data)
      setCategoriasFiltradas(data)
    } catch (error) {
      mostrarAlerta("error", "Error al cargar las categorías")
    } finally {
      setIsLoading(false)
    }
  }

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje })
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: "", mensaje: "" })
    }, 4000)
  }

  const handleNuevaCategoria = () => {
    setCategoriaEditando(null)
    setMostrarFormulario(true)
  }

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria)
    setMostrarFormulario(true)
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setCategoriaEditando(null)
  }

  const handleSubmitFormulario = async (data) => {
    try {
      if (categoriaEditando) {
        // Actualizar
        await updateCategoria(categoriaEditando.idCategoria ?? categoriaEditando.id, data)
        mostrarAlerta("success", "Categoría actualizada exitosamente")
      } else {
        // Crear
        await createCategoria(data)
        mostrarAlerta("success", "Categoría creada exitosamente")
      }
      await cargarCategorias()
      handleCancelar()
    } catch (error) {
      const mensajeError = errorMessages[error.message] || error.message || "Error al guardar la categoría"
      mostrarAlerta("error", mensajeError)
    }
  }

  const handleSolicitarEliminar = (categoria) => {
    setCategoriaAEliminar(categoria)
    setMostrarDialogoEliminar(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!categoriaAEliminar) return

    try {
      setEliminando(true)
      await deleteCategoria(categoriaAEliminar.idCategoria ?? categoriaAEliminar.id)
      mostrarAlerta("success", "Categoría eliminada exitosamente")
      await cargarCategorias()
      setMostrarDialogoEliminar(false)
      setCategoriaAEliminar(null)
    } catch (error) {
      const mensajeError = errorMessages[error.message] || error.message || "Error al eliminar la categoría"
      mostrarAlerta("error", mensajeError)
      setMostrarDialogoEliminar(false)
      setCategoriaAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  const handleCancelarEliminar = () => {
    setMostrarDialogoEliminar(false)
    setCategoriaAEliminar(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Alerta de notificaciones */}
      {alerta.mostrar && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 ${
            alerta.tipo === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {alerta.tipo === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <p className="font-medium">{alerta.mensaje}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
            <p className="text-muted-foreground">
              Administra las categorías de productos
            </p>
          </div>
        </div>
        <Button onClick={handleNuevaCategoria} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Formulario (cuando está abierto) */}
      {mostrarFormulario && (
        <Card>
          <CardHeader>
            <CardTitle>
              {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
            </CardTitle>
            <CardDescription>
              {categoriaEditando
                ? "Modifica los datos de la categoría"
                : "Completa los datos para crear una nueva categoría"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm
              categoria={categoriaEditando}
              onSubmit={handleSubmitFormulario}
              onCancel={handleCancelar}
            />
          </CardContent>
        </Card>
      )}

      {/* Barra de búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar categorías por nombre o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías Registradas</CardTitle>
          <CardDescription>
            {categoriasFiltradas.length} categoría(s)
            {busqueda && ` encontrada(s) para "${busqueda}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryList
            categorias={categoriasFiltradas}
            onEditar={handleEditar}
            onEliminar={handleSolicitarEliminar}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar la categoría{" "}
              <span className="font-semibold text-foreground">
                "{categoriaAEliminar?.categoria}"
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
  )
}
