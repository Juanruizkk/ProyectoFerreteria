import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Card, CardContent } from "@/components/ui/card"
import { Search, Pencil, Power, PowerOff, Trash2, Loader2, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
  searchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocation,
} from "@/services/LocationQueries"

const PAGE_SIZE = 10

const emptyForm = { seccion: "", fila: "", nivel: "" }

function validateForm(form) {
  const errors = {}
  if (!form.seccion.trim()) errors.seccion = "La sección es requerida."
  else if (form.seccion.trim().length > 5) errors.seccion = "Máximo 5 caracteres."
  const fila = parseInt(form.fila)
  if (!form.fila) errors.fila = "La fila es requerida."
  else if (isNaN(fila) || fila <= 0) errors.fila = "Debe ser un número mayor a 0."
  const nivel = parseInt(form.nivel)
  if (!form.nivel) errors.nivel = "El nivel es requerido."
  else if (isNaN(nivel) || nivel <= 0) errors.nivel = "Debe ser un número mayor a 0."
  return errors
}

function formatCodigo(loc) {
  return `${loc.seccion}-${loc.fila}-${loc.nivel}`
}

const LocationManager = forwardRef(function LocationManager(_, ref) {
  const [activeTab, setActiveTab] = useState("activos")

  // Activos
  const [activosItems, setActivosItems] = useState([])
  const [activosTotalPages, setActivosTotalPages] = useState(1)
  const [activosTotalCount, setActivosTotalCount] = useState(0)
  const [activosPage, setActivosPage] = useState(1)
  const [loadingActivos, setLoadingActivos] = useState(false)

  // Inactivos
  const [inactivosItems, setInactivosItems] = useState([])
  const [inactivosTotalPages, setInactivosTotalPages] = useState(1)
  const [inactivosTotalCount, setInactivosTotalCount] = useState(0)
  const [inactivosPage, setInactivosPage] = useState(1)
  const [loadingInactivos, setLoadingInactivos] = useState(false)

  // Search
  const [searchTerm, setSearchTerm] = useState("")
  const debounceRef = useRef(null)

  // Form dialog
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLoc, setEditingLoc] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Confirm dialogs
  const [dialogToggle, setDialogToggle] = useState(false)
  const [locAToggle, setLocAToggle] = useState(null)
  const [nuevoEstadoToggle, setNuevoEstadoToggle] = useState(false)
  const [procesandoToggle, setProcesandoToggle] = useState(false)

  const [dialogDelete, setDialogDelete] = useState(false)
  const [locAEliminar, setLocAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useImperativeHandle(ref, () => ({ openCreate }))

  const loadActivos = useCallback(async (page, term) => {
    try {
      setLoadingActivos(true)
      const data = await searchLocations({ pageIndex: page, pageSize: PAGE_SIZE, searchTerm: term, activos: true })
      setActivosItems(data.items ?? [])
      setActivosTotalPages(data.totalPages ?? 1)
      setActivosTotalCount(data.totalCount ?? 0)
    } catch { toast.error("Error al cargar ubicaciones activas.") }
    finally { setLoadingActivos(false) }
  }, [])

  const loadInactivos = useCallback(async (page, term) => {
    try {
      setLoadingInactivos(true)
      const data = await searchLocations({ pageIndex: page, pageSize: PAGE_SIZE, searchTerm: term, activos: false })
      setInactivosItems(data.items ?? [])
      setInactivosTotalPages(data.totalPages ?? 1)
      setInactivosTotalCount(data.totalCount ?? 0)
    } catch { toast.error("Error al cargar ubicaciones inactivas.") }
    finally { setLoadingInactivos(false) }
  }, [])

  useEffect(() => { loadActivos(activosPage, searchTerm) }, [activosPage])
  useEffect(() => { if (activeTab === "inactivos") loadInactivos(inactivosPage, searchTerm) }, [activeTab, inactivosPage])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setActivosPage(1)
      setInactivosPage(1)
      loadActivos(1, value)
      if (activeTab === "inactivos") loadInactivos(1, value)
    }, 300)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === "inactivos") loadInactivos(inactivosPage, searchTerm)
  }

  const openCreate = () => {
    setEditingLoc(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (loc) => {
    setEditingLoc(loc)
    setForm({ seccion: loc.seccion, fila: String(loc.fila), nivel: String(loc.nivel) })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setModalOpen(false)
    setEditingLoc(null)
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
    const payload = { seccion: form.seccion.trim(), fila: parseInt(form.fila), nivel: parseInt(form.nivel) }
    try {
      setSubmitting(true)
      if (editingLoc) {
        await updateLocation(editingLoc.idUbicacion, payload)
        toast.success("Ubicación actualizada exitosamente.")
      } else {
        await createLocation(payload)
        toast.success("Ubicación creada exitosamente.")
      }
      setModalOpen(false)
      setEditingLoc(null)
      setForm(emptyForm)
      loadActivos(activosPage, searchTerm)
    } catch (error) {
      toast.error(error.message || "Error al guardar la ubicación.")
    } finally { setSubmitting(false) }
  }

  const handleSolicitarToggle = (loc, newState) => {
    setLocAToggle(loc)
    setNuevoEstadoToggle(newState)
    setDialogToggle(true)
  }

  const handleConfirmarToggle = async () => {
    if (!locAToggle) return
    try {
      setProcesandoToggle(true)
      await toggleLocation(locAToggle.idUbicacion)
      toast.success(nuevoEstadoToggle ? "Ubicación activada." : "Ubicación desactivada.")
      loadActivos(activosPage, searchTerm)
      if (activeTab === "inactivos") loadInactivos(inactivosPage, searchTerm)
    } catch (error) {
      toast.error(error.message || "Error al cambiar el estado de la ubicación.")
    } finally {
      setProcesandoToggle(false)
      setDialogToggle(false)
      setLocAToggle(null)
    }
  }

  const handleSolicitarEliminar = (loc) => {
    setLocAEliminar(loc)
    setDialogDelete(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!locAEliminar) return
    try {
      setEliminando(true)
      await deleteLocation(locAEliminar.idUbicacion)
      toast.success("Ubicación eliminada exitosamente.")
      loadInactivos(inactivosPage, searchTerm)
    } catch (error) {
      toast.error(error.message || "Error al eliminar la ubicación.")
    } finally {
      setEliminando(false)
      setDialogDelete(false)
      setLocAEliminar(null)
    }
  }

  const LocationTable = ({ items, loading, isActive, emptyText, page, totalPages, onPageChange }) => (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Fila</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-8 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>{emptyText}</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((loc) => (
                <TableRow key={loc.idUbicacion}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatCodigo(loc)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{loc.seccion}</TableCell>
                  <TableCell>{loc.fila}</TableCell>
                  <TableCell>{loc.nivel}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {isActive ? (
                        <>
                          <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(loc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Desactivar" onClick={() => handleSolicitarToggle(loc, false)}>
                            <PowerOff className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" title="Activar" onClick={() => handleSolicitarToggle(loc, true)}>
                            <Power className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Eliminar" onClick={() => handleSolicitarEliminar(loc)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por sección, fila, nivel o código (ej: A-3-2)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="activos">Activas ({activosTotalCount})</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivas ({inactivosTotalCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="activos" className="mt-4">
          <LocationTable
            items={activosItems}
            loading={loadingActivos}
            isActive={true}
            emptyText={searchTerm ? `No se encontraron ubicaciones para "${searchTerm}"` : "No hay ubicaciones activas."}
            page={activosPage}
            totalPages={activosTotalPages}
            onPageChange={setActivosPage}
          />
        </TabsContent>
        <TabsContent value="inactivos" className="mt-4">
          <LocationTable
            items={inactivosItems}
            loading={loadingInactivos}
            isActive={false}
            emptyText={searchTerm ? `No se encontraron ubicaciones para "${searchTerm}"` : "No hay ubicaciones inactivas."}
            page={inactivosPage}
            totalPages={inactivosTotalPages}
            onPageChange={setInactivosPage}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog crear / editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLoc ? "Editar ubicación" : "Nueva ubicación"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="loc-seccion">
                Sección <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1 text-xs">(se normaliza a mayúsculas, máx. 5 chars)</span>
              </Label>
              <Input
                id="loc-seccion"
                value={form.seccion}
                onChange={(e) => setField("seccion", e.target.value)}
                placeholder="Ej: A, B, AB"
                maxLength={5}
                disabled={submitting}
                autoFocus
              />
              {formErrors.seccion && <p className="text-xs text-destructive">{formErrors.seccion}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="loc-fila">Fila <span className="text-destructive">*</span></Label>
                <Input
                  id="loc-fila"
                  type="number"
                  min="1"
                  value={form.fila}
                  onChange={(e) => setField("fila", e.target.value)}
                  placeholder="Ej: 3"
                  disabled={submitting}
                />
                {formErrors.fila && <p className="text-xs text-destructive">{formErrors.fila}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="loc-nivel">Nivel <span className="text-destructive">*</span></Label>
                <Input
                  id="loc-nivel"
                  type="number"
                  min="1"
                  value={form.nivel}
                  onChange={(e) => setField("nivel", e.target.value)}
                  placeholder="Ej: 2"
                  disabled={submitting}
                />
                {formErrors.nivel && <p className="text-xs text-destructive">{formErrors.nivel}</p>}
              </div>
            </div>
            {form.seccion && form.fila && form.nivel && (
              <p className="text-sm text-muted-foreground">
                Código resultante:{" "}
                <Badge variant="outline" className="font-mono text-xs ml-1">
                  {form.seccion.trim().toUpperCase()}-{form.fila}-{form.nivel}
                </Badge>
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingLoc ? "Guardando..." : "Creando..."}</>
                  : editingLoc ? "Guardar" : "Crear"
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
              ¿Querés {nuevoEstadoToggle ? "activar" : "desactivar"} la ubicación{" "}
              <span className="font-semibold text-foreground">"{locAToggle ? formatCodigo(locAToggle) : ""}"</span>?
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

      {/* Dialog confirmar eliminar */}
      <AlertDialog open={dialogDelete} onOpenChange={setDialogDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar la ubicación{" "}
              <span className="font-semibold text-foreground">"{locAEliminar ? formatCodigo(locAEliminar) : ""}"</span>?{" "}
              Esta acción no puede deshacerse. Si está asignada a productos, no podrá eliminarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setDialogDelete(false); setLocAEliminar(null) }}
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

export default LocationManager
