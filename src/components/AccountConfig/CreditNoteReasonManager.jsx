import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Pencil, Power, PowerOff, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getCreditNoteReasons,
  createCreditNoteReason,
  updateCreditNoteReason,
  toggleCreditNoteReasonState,
} from "@/services/SaleQueries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const emptyForm = { nombre: "" };

const CreditNoteReasonManager = forwardRef(function CreditNoteReasonManager(_, ref) {
  const [activeTab, setActiveTab] = useState("activos");
  const [motivosActivos, setMotivosActivos] = useState([]);
  const [motivosInactivos, setMotivosInactivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [loadingInactivos, setLoadingInactivos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [dialogToggle, setDialogToggle] = useState(false);
  const [motivoAToggle, setMotivoAToggle] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useImperativeHandle(ref, () => ({ openCreate }));

  useEffect(() => { loadActivos(); }, []);
  useEffect(() => { if (activeTab === "activos") loadActivos(); }, [activeTab]);
  useEffect(() => { if (activeTab === "inactivos") loadInactivos(); }, [activeTab]);

  const loadActivos = async () => {
    try {
      setLoadingActivos(true);
      setMotivosActivos((await getCreditNoteReasons(true)) || []);
    } catch { toast.error("Error al cargar los motivos activos."); }
    finally { setLoadingActivos(false); }
  };

  const loadInactivos = async () => {
    try {
      setLoadingInactivos(true);
      setMotivosInactivos((await getCreditNoteReasons(false)) || []);
    } catch { toast.error("Error al cargar los motivos inactivos."); }
    finally { setLoadingInactivos(false); }
  };

  const openCreate = () => {
    setEditingMotivo(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (motivo) => {
    setEditingMotivo(motivo);
    setForm({ nombre: motivo.nombre });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingMotivo(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre no puede estar vacío."); return; }
    try {
      setSubmitting(true);
      if (editingMotivo) {
        await updateCreditNoteReason({ idMotivo: editingMotivo.idMotivo, nombre: form.nombre.trim() });
        toast.success("Motivo actualizado exitosamente.");
      } else {
        await createCreditNoteReason({ nombre: form.nombre.trim() });
        toast.success("Motivo creado exitosamente.");
      }
      setModalOpen(false);
      setEditingMotivo(null);
      setForm(emptyForm);
      await loadActivos();
    } catch (error) {
      toast.error(error.message || "Error al guardar el motivo.");
    } finally { setSubmitting(false); }
  };

  const handleSolicitarToggle = (motivo, newState) => {
    setMotivoAToggle(motivo);
    setNuevoEstado(newState);
    setDialogToggle(true);
  };

  const handleConfirmarToggle = async () => {
    if (!motivoAToggle) return;
    try {
      setProcesando(true);
      await toggleCreditNoteReasonState(motivoAToggle.idMotivo, nuevoEstado);
      toast.success(nuevoEstado ? "Motivo activado." : "Motivo desactivado.");
      if (activeTab === "activos") await loadActivos();
      else await loadInactivos();
    } catch (error) {
      toast.error(error.message || "Error al cambiar el estado del motivo.");
    } finally {
      setProcesando(false);
      setDialogToggle(false);
      setMotivoAToggle(null);
    }
  };

  const MotivoTable = ({ motivos, loading, isActive, emptyText }) => (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : motivos.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">{emptyText}</TableCell></TableRow>
          ) : (
            motivos.map((motivo) => (
              <TableRow key={motivo.idMotivo}>
                <TableCell className="font-medium">{motivo.nombre}</TableCell>
                <TableCell>
                  <Badge variant={motivo.activo ? "default" : "secondary"}>
                    {motivo.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {isActive ? (
                      <>
                        <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(motivo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Desactivar" onClick={() => handleSolicitarToggle(motivo, false)}>
                          <PowerOff className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" title="Activar" onClick={() => handleSolicitarToggle(motivo, true)}>
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
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activos">Activos ({motivosActivos.length})</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivos ({motivosInactivos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activos" className="mt-4">
          <MotivoTable motivos={motivosActivos} loading={loadingActivos} isActive={true} emptyText="No hay motivos activos." />
        </TabsContent>
        <TabsContent value="inactivos" className="mt-4">
          <MotivoTable motivos={motivosInactivos} loading={loadingInactivos} isActive={false} emptyText="No hay motivos inactivos." />
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMotivo ? "Editar motivo de nota de crédito" : "Nuevo motivo de nota de crédito"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="nc-nombre">Nombre</Label>
              <Input id="nc-nombre" value={form.nombre} onChange={(e) => setForm({ nombre: e.target.value })} placeholder="Ej: Devolución de mercadería" disabled={submitting} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingMotivo ? "Guardando..." : "Creando..."}</> : editingMotivo ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogToggle} onOpenChange={setDialogToggle}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Querés {nuevoEstado ? "activar" : "desactivar"} el motivo{" "}
              <span className="font-semibold text-foreground">"{motivoAToggle?.nombre}"</span>?{" "}
              {!nuevoEstado && "Los registros ya existentes no se verán afectados, pero dejará de estar disponible para nuevas notas de crédito."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarToggle} disabled={procesando}
              className={nuevoEstado ? "bg-green-600 hover:bg-green-700" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}>
              {procesando ? (nuevoEstado ? "Activando..." : "Desactivando...") : (nuevoEstado ? "Activar" : "Desactivar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default CreditNoteReasonManager;
