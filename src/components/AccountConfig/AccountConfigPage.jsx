import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Settings, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import AccountConfigTable from "./AccountConfigTable";
import DebitNoteReasonManager from "./DebitNoteReasonManager";
import CreditNoteReasonManager from "./CreditNoteReasonManager";
import InterestConfigManager from "./InterestConfigManager";
import {
  fetchAccountConfigs,
  createAccountConfig,
  updateAccountConfig,
  toggleAccountConfigState,
} from "@/services/AccountConfigQueries";

function AccountConfigTableSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Monto Límite</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4].map((i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const emptyForm = { nombre: "", montoLimite: "" };

function validateForm(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es requerido.";
  const monto = parseFloat(form.montoLimite);
  if (!form.montoLimite) errors.montoLimite = "El monto límite es requerido.";
  else if (isNaN(monto) || monto <= 0) errors.montoLimite = "El monto límite debe ser mayor a 0.";
  return errors;
}

// Texto del botón "Nuevo" según tab activo
const NEW_BUTTON_LABEL = {
  "limite-cc":     "Nuevo Límite de CC",
  "motivos-nd":    "Nuevo Motivo",
  "motivos-nc":    "Nuevo Motivo",
  "config-interes":"Nueva Configuración",
};

export default function AccountConfigPage() {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState(() => hasPermission("CC_MANAGE") ? "limite-cc" : "motivos-nd");
  const [limiteCCSubTab, setLimiteCCSubTab] = useState("activas");

  // Refs hacia los sub-managers para disparar openCreate desde el header
  const ndRef = useRef(null);
  const ncRef = useRef(null);
  const intRef = useRef(null);

  const [configsActivas, setConfigsActivas] = useState([]);
  const [loadingActivas, setLoadingActivas] = useState(false);
  const [configsInactivas, setConfigsInactivas] = useState([]);
  const [loadingInactivas, setLoadingInactivas] = useState(false);

  // Form dialog para Límite CC
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Toggle dialog
  const [mostrarDialogoToggle, setMostrarDialogoToggle] = useState(false);
  const [configAToggle, setConfigAToggle] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (activeTab === "limite-cc") loadConfigsActivas();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "limite-cc" && limiteCCSubTab === "inactivas") loadConfigsInactivas();
  }, [activeTab, limiteCCSubTab]);

  const loadConfigsActivas = async () => {
    try {
      setLoadingActivas(true);
      setConfigsActivas((await fetchAccountConfigs(true)) || []);
    } catch { toast.error("Error al cargar configuraciones activas."); }
    finally { setLoadingActivas(false); }
  };

  const loadConfigsInactivas = async () => {
    try {
      setLoadingInactivas(true);
      setConfigsInactivas((await fetchAccountConfigs(false)) || []);
    } catch { toast.error("Error al cargar configuraciones inactivas."); }
    finally { setLoadingInactivas(false); }
  };

  // El botón "Nuevo" del header delega al manager correspondiente
  const handleNew = () => {
    if (activeTab === "limite-cc") { openCreate(); return; }
    if (activeTab === "motivos-nd") { ndRef.current?.openCreate(); return; }
    if (activeTab === "motivos-nc") { ncRef.current?.openCreate(); return; }
    if (activeTab === "config-interes") { intRef.current?.openCreate(); return; }
  };

  const openCreate = () => {
    setEditingConfig(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (config) => {
    setEditingConfig(config);
    setForm({ nombre: config.nombre, montoLimite: String(config.montoLimite) });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingConfig(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    try {
      setSubmitting(true);
      const payload = { nombre: form.nombre.trim(), montoLimite: parseFloat(form.montoLimite) };
      if (editingConfig) {
        await updateAccountConfig({ ...payload, idConfig: editingConfig.idConfig });
        toast.success("Configuración actualizada exitosamente.");
      } else {
        await createAccountConfig(payload);
        toast.success("Configuración creada exitosamente.");
      }
      setModalOpen(false);
      setEditingConfig(null);
      setForm(emptyForm);
      await loadConfigsActivas();
    } catch (error) {
      toast.error(error.message || "Error al guardar la configuración.");
    } finally { setSubmitting(false); }
  };

  const handleSolicitarToggle = (config, newState) => {
    setConfigAToggle(config);
    setNuevoEstado(newState);
    setMostrarDialogoToggle(true);
  };

  const handleConfirmarToggle = async () => {
    if (!configAToggle) return;
    try {
      setProcesando(true);
      await toggleAccountConfigState(configAToggle.idConfig, nuevoEstado);
      toast.success(nuevoEstado ? "Configuración activada exitosamente." : "Configuración desactivada exitosamente.");
      await Promise.all([loadConfigsActivas(), loadConfigsInactivas()]);
      setMostrarDialogoToggle(false);
      setConfigAToggle(null);
    } catch (error) {
      toast.error(error.message || "Error al cambiar el estado de la configuración.");
      setMostrarDialogoToggle(false);
      setConfigAToggle(null);
    } finally { setProcesando(false); }
  };

  return (
    <PermissionGuard
      permission="CC_MANAGE"
      fallback={<AccessDenied moduleName="la configuración de cuenta corriente" />}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Configuración de Cuenta Corriente</h1>
              <p className="text-muted-foreground">
                Administra límites de crédito, motivos de notas y tasas de interés
              </p>
            </div>
          </div>
          {(activeTab !== "limite-cc" || hasPermission("CC_MANAGE")) && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              {NEW_BUTTON_LABEL[activeTab] ?? "Nuevo"}
            </Button>
          )}
        </div>

        {/* Filtros de sección */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: "limite-cc",     label: "Límite de CC",               color: "border-primary",    visible: hasPermission("CC_MANAGE") },
            { key: "motivos-nd",    label: "Motivos de Nota de Débito",   color: "border-amber-500",  visible: true },
            { key: "motivos-nc",    label: "Motivos de Nota de Crédito",  color: "border-blue-500",   visible: hasPermission("CC_NOTE_CREDIT") },
            { key: "config-interes",label: "Configuración de Interés",    color: "border-purple-500", visible: hasPermission("CC_MANAGE") },
          ].filter((s) => s.visible).map((section) => {
            const isActive = activeTab === section.key;
            return (
              <Card
                key={section.key}
                onClick={() => setActiveTab(section.key)}
                className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${section.color} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
              >
                <CardHeader className="p-1">
                  <CardTitle className="text-base font-medium">{section.label}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Límite de CC */}
        {activeTab === "limite-cc" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "activas",   label: `Activas (${configsActivas.length})`,   color: "border-primary" },
                { key: "inactivas", label: `Inactivas (${configsInactivas.length})`,color: "border-red-500" },
              ].map((sub) => {
                const isActive = limiteCCSubTab === sub.key;
                return (
                  <Card
                    key={sub.key}
                    onClick={() => setLimiteCCSubTab(sub.key)}
                    className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${sub.color} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
                  >
                    <CardHeader className="p-1">
                      <CardTitle className="text-lg font-medium">{sub.label}</CardTitle>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            {limiteCCSubTab === "activas" && (
              loadingActivas
                ? <AccountConfigTableSkeleton />
                : <AccountConfigTable configs={configsActivas} onEdit={openEdit} onToggleState={handleSolicitarToggle} isActive={true} />
            )}
            {limiteCCSubTab === "inactivas" && (
              loadingInactivas
                ? <AccountConfigTableSkeleton />
                : <AccountConfigTable configs={configsInactivas} onEdit={openEdit} onToggleState={handleSolicitarToggle} isActive={false} />
            )}
          </div>
        )}

        {activeTab === "motivos-nd" && <DebitNoteReasonManager ref={ndRef} />}

        {activeTab === "motivos-nc" && hasPermission("CC_NOTE_CREDIT") && (
          <CreditNoteReasonManager ref={ncRef} />
        )}

        {activeTab === "config-interes" && hasPermission("CC_MANAGE") && (
          <InterestConfigManager ref={intRef} />
        )}

        {/* Dialog crear / editar Límite CC */}
        <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Editar configuración de límite de CC" : "Nueva configuración de límite de CC"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="cc-nombre">Nombre <span className="text-destructive">*</span></Label>
                <Input id="cc-nombre" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Ej: Bronze, Silver, Gold" disabled={submitting} autoFocus />
                {formErrors.nombre && <p className="text-xs text-destructive">{formErrors.nombre}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-monto">Monto límite <span className="text-destructive">*</span></Label>
                <Input id="cc-monto" type="number" step="0.01" min="0.01" value={form.montoLimite} onChange={(e) => setField("montoLimite", e.target.value)} placeholder="Ej: 50000" disabled={submitting} />
                {formErrors.montoLimite && <p className="text-xs text-destructive">{formErrors.montoLimite}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingConfig ? "Guardando..." : "Creando..."}</> : editingConfig ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog toggle estado */}
        <AlertDialog open={mostrarDialogoToggle} onOpenChange={setMostrarDialogoToggle}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de {nuevoEstado ? "activar" : "desactivar"} la configuración{" "}
                <span className="font-semibold text-foreground">"{configAToggle?.nombre}"</span>?{" "}
                {!nuevoEstado && "Dejará de estar disponible para asignación a clientes."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setMostrarDialogoToggle(false); setConfigAToggle(null); }} disabled={procesando}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmarToggle} disabled={procesando}
                className={nuevoEstado ? "bg-green-600 hover:bg-green-700" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}>
                {procesando ? (nuevoEstado ? "Activando..." : "Desactivando...") : (nuevoEstado ? "Activar" : "Desactivar")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  );
}
