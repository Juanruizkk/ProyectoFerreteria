import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Power, PowerOff, Loader2, Ruler } from "lucide-react"
import { toast } from "sonner"
import {
  fetchUnidadesMedidaAdmin,
  createUnidadMedida,
  updateUnidadMedida,
  toggleUnidadMedida,
} from "@/services/UnidadMedidaQueries"
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext"

const emptyForm = { nombre: "", abreviatura: "" }

function validateForm(form) {
  const errors = {}
  if (!form.nombre.trim()) errors.nombre = "El nombre es requerido."
  else if (form.nombre.trim().length > 50) errors.nombre = "Máximo 50 caracteres."
  if (!form.abreviatura.trim()) errors.abreviatura = "La abreviatura es requerida."
  else if (form.abreviatura.trim().length > 10) errors.abreviatura = "Máximo 10 caracteres."
  return errors
}

const UnidadesMedidaManager = forwardRef(function UnidadesMedidaManager(_, ref) {
  const { refreshUnidades } = useUnidadesMedida()
  const [activeTab, setActiveTab] = useState("activos")
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)

  // Form dialog
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUnidad, setEditingUnidad] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Confirm toggle
  const [dialogToggle, setDialogToggle] = useState(false)
  const [unidadAToggle, setUnidadAToggle] = useState(null)
  const [nuevoEstadoToggle, setNuevoEstadoToggle] = useState(false)
  const [procesandoToggle, setProcesandoToggle] = useState(false)

  useImperativeHandle(ref, () => ({ openCreate }))

  const loadUnidades = async () => {
    try {
      setLoading(true)
      const data = await fetchUnidadesMedidaAdmin()
      setTodos(data ?? [])
    } catch {
      toast.error("Error al cargar unidades de medida.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUnidades() }, [])

  const activos = todos.filter((u) => u.activo)
  const inactivos = todos.filter((u) => !u.activo)

  const openCreate = () => {
    setEditingUnidad(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (unidad) => {
    setEditingUnidad(unidad)
    setForm({ nombre: unidad.nombre, abreviatura: unidad.abreviatura })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingUnidad(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    try {
      setSubmitting(true)
      if (editingUnidad) {
        await updateUnidadMedida(editingUnidad.idUnidadMedida, { nombre: form.nombre.trim(), abreviatura: form.abreviatura.trim() })
        toast.success("Unidad de medida actualizada exitosamente.")
      } else {
        await createUnidadMedida({ nombre: form.nombre.trim(), abreviatura: form.abreviatura.trim() })
        toast.success("Unidad de medida creada exitosamente.")
      }
      setModalOpen(false)
      setEditingUnidad(null)
      setForm(emptyForm)
      loadUnidades()
      refreshUnidades()
    } catch (error) {
      toast.error(error.message || "Error al guardar la unidad de medida.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSolicitarToggle = (unidad, newState) => {
    setUnidadAToggle(unidad)
    setNuevoEstadoToggle(newState)
    setDialogToggle(true)
  }

  const handleConfirmarToggle = async () => {
    if (!unidadAToggle) return
    try {
      setProcesandoToggle(true)
      await toggleUnidadMedida(unidadAToggle.idUnidadMedida)
      toast.success(nuevoEstadoToggle ? "Unidad de medida activada." : "Unidad de medida desactivada.")
      loadUnidades()
      refreshUnidades()
    } catch (error) {
      toast.error(error.message || "Error al cambiar el estado de la unidad de medida.")
    } finally {
      setProcesandoToggle(false)
      setDialogToggle(false)
      setUnidadAToggle(null)
    }
  }

  const UnidadTable = ({ items, isActive, emptyText }) => (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Abreviatura</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-10 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <Ruler className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{emptyText}</p>
              </TableCell>
            </TableRow>
          ) : (
            items.map((unidad) => (
              <TableRow key={unidad.idUnidadMedida}>
                <TableCell className="text-muted-foreground text-sm">{unidad.idUnidadMedida}</TableCell>
                <TableCell className="font-medium">{unidad.nombre}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{unidad.abreviatura}</Badge>
                </TableCell>
                <TableCell>
                  {unidad.activo ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">Activo</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isActive ? (
                      <>
                        <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(unidad)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Desactivar" onClick={() => handleSolicitarToggle(unidad, false)}>
                          <PowerOff className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" title="Activar" onClick={() => handleSolicitarToggle(unidad, true)}>
                        <Power className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activos">Activos ({activos.length})</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivos ({inactivos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activos" className="mt-4">
          <UnidadTable
            items={activos}
            isActive={true}
            emptyText="No hay unidades de medida activas."
          />
        </TabsContent>
        <TabsContent value="inactivos" className="mt-4">
          <UnidadTable
            items={inactivos}
            isActive={false}
            emptyText="No hay unidades de medida inactivas."
          />
        </TabsContent>
      </Tabs>

      {/* Dialog crear / editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnidad ? "Editar unidad de medida" : "Nueva unidad de medida"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="unidad-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unidad-nombre"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ej: Kilogramo"
                maxLength={50}
                disabled={submitting}
                autoFocus
              />
              {formErrors.nombre && <p className="text-xs text-destructive">{formErrors.nombre}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="unidad-abreviatura">
                Abreviatura <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unidad-abreviatura"
                value={form.abreviatura}
                onChange={(e) => setField("abreviatura", e.target.value)}
                placeholder="Ej: kg, m, u, caja50"
                maxLength={10}
                disabled={submitting}
              />
              {formErrors.abreviatura && <p className="text-xs text-destructive">{formErrors.abreviatura}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingUnidad ? "Guardando..." : "Creando..."}</>
                  : editingUnidad ? "Guardar" : "Crear"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog toggle estado */}
      <AlertDialog open={dialogToggle} onOpenChange={setDialogToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Querés {nuevoEstadoToggle ? "activar" : "desactivar"} la unidad{" "}
              <span className="font-semibold text-foreground">"{unidadAToggle?.nombre ?? ""}"</span>?
              {!nuevoEstadoToggle && (
                <> Las unidades desactivadas no estarán disponibles al crear nuevos productos.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesandoToggle}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarToggle}
              disabled={procesandoToggle}
              className={nuevoEstadoToggle ? "bg-green-600 hover:bg-green-700" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {procesandoToggle
                ? (nuevoEstadoToggle ? "Activando..." : "Desactivando...")
                : (nuevoEstadoToggle ? "Activar" : "Desactivar")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

export default UnidadesMedidaManager
