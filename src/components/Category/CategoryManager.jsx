import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import CategoryForm from "./CategoryForm"
import CategoryList from "./CategoryList"
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  errorMessages
} from "@/services/CategoryQueries"

const CategoryManager = forwardRef(function CategoryManager(_, ref) {
  const [categorias, setCategorias] = useState([])
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [submittingForm, setSubmittingForm] = useState(false)

  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false)
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useImperativeHandle(ref, () => ({ openCreate }))

  useEffect(() => { cargarCategorias() }, [])

  useEffect(() => {
    if (busqueda.trim() === "") {
      setCategoriasFiltradas(categorias)
    } else {
      const lower = busqueda.toLowerCase()
      setCategoriasFiltradas(
        categorias.filter(cat =>
          cat.categoria.toLowerCase().includes(lower) ||
          cat.descripcion?.toLowerCase().includes(lower)
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
    } catch {
      toast.error("Error al cargar las categorías")
    } finally {
      setIsLoading(false)
    }
  }

  const openCreate = () => {
    setCategoriaEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria)
    setModalOpen(true)
  }

  const handleCancelarModal = () => {
    setModalOpen(false)
    setCategoriaEditando(null)
  }

  const handleSubmitFormulario = async (data) => {
    try {
      setSubmittingForm(true)
      if (categoriaEditando) {
        await updateCategoria(categoriaEditando.idCategoria ?? categoriaEditando.id, data)
        toast.success("Categoría actualizada exitosamente")
      } else {
        await createCategoria(data)
        toast.success("Categoría creada exitosamente")
      }
      setModalOpen(false)
      setCategoriaEditando(null)
      await cargarCategorias()
    } catch (error) {
      toast.error(errorMessages[error.message] || error.message || "Error al guardar la categoría")
    } finally {
      setSubmittingForm(false)
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
      toast.success("Categoría eliminada exitosamente")
      await cargarCategorias()
      setMostrarDialogoEliminar(false)
      setCategoriaAEliminar(null)
    } catch (error) {
      toast.error(errorMessages[error.message] || error.message || "Error al eliminar la categoría")
      setMostrarDialogoEliminar(false)
      setCategoriaAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      <CategoryList
        categorias={categoriasFiltradas}
        onEditar={handleEditar}
        onEliminar={handleSolicitarEliminar}
        isLoading={isLoading}
        busqueda={busqueda}
      />

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCancelarModal() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            categoria={categoriaEditando}
            onSubmit={handleSubmitFormulario}
            onCancel={handleCancelarModal}
            isSubmitting={submittingForm}
          />
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel
              onClick={() => { setMostrarDialogoEliminar(false); setCategoriaAEliminar(null) }}
              disabled={eliminando}
            >
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
})

export default CategoryManager
