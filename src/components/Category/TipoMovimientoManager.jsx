import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Power, PowerOff, Lock, Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import {
  fetchTiposMovimientoAdmin,
  createTipoMovimiento,
  updateTipoMovimiento,
  toggleTipoMovimiento,
} from "@/services/StockMovementQueries"

const emptyForm = { nombre: "", descripcion: "", esPositivo: "" }

function validateForm(form, isCreating) {
  const errors = {}
  if (!form.nombre.trim()) errors.nombre = "El nombre es requerido."
  else if (form.nombre.trim().length > 50) errors.nombre = "Máximo 50 caracteres."
  if (form.descripcion && form.descripcion.length > 255) errors.descripcion = "Máximo 255 caracteres."
  if (isCreating && form.esPositivo === "") errors.esPositivo = "La dirección es requerida."
  return errors
}

const TipoMovimientoManager = forwardRef(function TipoMovimientoManager(_, ref) {
  const [activeTab, setActiveTab] = useState("activos")
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)

  // Form dialog
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Confirm toggle
  const [dialogToggle, setDialogToggle] = useState(false)
  const [tipoAToggle, setTipoAToggle] = useState(null)
  const [nuevoEstadoToggle, setNuevoEstadoToggle] = useState(false)
  const [procesandoToggle, setProcesandoToggle] = useState(false)

  useImperativeHandle(ref, () => ({ openCreate }))

  const loadTipos = async () => {
    try {
      setLoading(true)
      const data = await fetchTiposMovimientoAdmin()
      setTodos(data ?? [])
    } catch {
      toast.error("Error al cargar tipos de movimiento.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTipos() }, [])

  const activos = todos.filter((t) => t.activo)
  const inactivos = todos.filter((t) => !t.activo)

  const openCreate = () => {
    setEditingTipo(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (tipo) => {
    setEditingTipo(tipo)
    setForm({ nombre: tipo.nombre, descripcion: tipo.descripcion ?? "", esPositivo: "" })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingTipo(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm(form, !editingTipo)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    try {
      setSubmitting(true)
      if (editingTipo) {
        await updateTipoMovimiento(editingTipo.idTipoMovimientoStock, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null })
        toast.success("Tipo actualizado exitosamente.")
      } else {
        await createTipoMovimiento({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, esPositivo: form.esPositivo === "true" })
        toast.success("Tipo creado exitosamente.")
      }
      setModalOpen(false)
      setEditingTipo(null)
      setForm(emptyForm)
      loadTipos()
    } catch (error) {
      toast.error(error.message || "Error al guardar el tipo.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSolicitarToggle = (tipo, newState) => {
    setTipoAToggle(tipo)
    setNuevoEstadoToggle(newState)
    setDialogToggle(true)
  }

  const handleConfirmarToggle = async () => {
    if (!tipoAToggle) return
    try {
      setProcesandoToggle(true)
      await toggleTipoMovimiento(tipoAToggle.idTipoMovimientoStock)
      toast.success(nuevoEstadoToggle ? "Tipo activado." : "Tipo desactivado.")
      loadTipos()
    } catch (error) {
      toast.error(error.message || "Error al cambiar el estado del tipo.")
    } finally {
      setProcesandoToggle(false)
      setDialogToggle(false)
      setTipoAToggle(null)
    }
  }

  const TipoTable = ({ items, isActive, emptyText }) => (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{emptyText}</p>
              </TableCell>
            </TableRow>
          ) : (
            items.map((tipo) => (
              <TableRow key={tipo.idTipoMovimientoStock}>
                <TableCell className="font-medium">{tipo.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {tipo.descripcion ? tipo.descripcion : "-"}
                </TableCell>
                <TableCell>
                  {tipo.esPositivo ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                      Positivo (+)
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
                      Negativo (-)
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {tipo.esSistema && (
                    <Badge variant="secondary">Sistema</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {tipo.esSistema ? (
                      <span title="Tipo de sistema, no modificable" className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </span>
                    ) : isActive ? (
                      <>
                        <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(tipo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Desactivar" onClick={() => handleSolicitarToggle(tipo, false)}>
                          <PowerOff className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" title="Activar" onClick={() => handleSolicitarToggle(tipo, true)}>
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
          <TipoTable
            items={activos}
            isActive={true}
            emptyText="No hay tipos de movimiento activos."
          />
        </TabsContent>
        <TabsContent value="inactivos" className="mt-4">
          <TipoTable
            items={inactivos}
            isActive={false}
            emptyText="No hay tipos de movimiento inactivos."
          />
        </TabsContent>
      </Tabs>

      {/* Dialog crear / editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? "Editar tipo de movimiento" : "Nuevo tipo de movimiento"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="tipo-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tipo-nombre"
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ej: Devolución de cliente"
                maxLength={50}
                disabled={submitting}
                autoFocus
              />
              {formErrors.nombre && <p className="text-xs text-destructive">{formErrors.nombre}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="tipo-descripcion">Descripción</Label>
              <Textarea
                id="tipo-descripcion"
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
                placeholder="Descripción opcional..."
                maxLength={255}
                rows={2}
                disabled={submitting}
              />
              {formErrors.descripcion && <p className="text-xs text-destructive">{formErrors.descripcion}</p>}
            </div>

            {!editingTipo && (
              <div className="space-y-1">
                <Label htmlFor="tipo-direccion">
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.esPositivo}
                  onValueChange={(v) => setField("esPositivo", v)}
                  disabled={submitting}
                >
                  <SelectTrigger id="tipo-direccion" className={formErrors.esPositivo ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar dirección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Positivo - suma stock</SelectItem>
                    <SelectItem value="false">Negativo - resta stock</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.esPositivo && <p className="text-xs text-destructive">{formErrors.esPositivo}</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingTipo ? "Guardando..." : "Creando..."}</>
                  : editingTipo ? "Guardar" : "Crear"
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
              ¿Querés {nuevoEstadoToggle ? "activar" : "desactivar"} el tipo{" "}
              <span className="font-semibold text-foreground">"{tipoAToggle?.nombre ?? ""}"</span>?
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

export default TipoMovimientoManager
