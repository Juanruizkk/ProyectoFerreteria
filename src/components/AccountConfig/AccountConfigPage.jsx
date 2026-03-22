import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("limite-cc");
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
      anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}
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
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            {NEW_BUTTON_LABEL[activeTab] ?? "Nuevo"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="limite-cc">Límite de CC</TabsTrigger>
            <TabsTrigger value="motivos-nd">Motivos de Nota de Débito</TabsTrigger>
            {hasPermission("CC_NOTE_CREDIT") && (
              <TabsTrigger value="motivos-nc">Motivos de Nota de Crédito</TabsTrigger>
            )}
            {hasPermission("CC_MANAGE") && (
              <TabsTrigger value="config-interes">Configuración de Interés</TabsTrigger>
            )}
          </TabsList>

          {/* Límite de CC */}
          <TabsContent value="limite-cc" className="space-y-4">
            <Tabs value={limiteCCSubTab} onValueChange={setLimiteCCSubTab}>
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="activas">Activas ({configsActivas.length})</TabsTrigger>
                <TabsTrigger value="inactivas">Inactivas ({configsInactivas.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="activas" className="mt-4">
                {loadingActivas ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : (
                  <AccountConfigTable configs={configsActivas} onEdit={openEdit} onToggleState={handleSolicitarToggle} isActive={true} />
                )}
              </TabsContent>
              <TabsContent value="inactivas" className="mt-4">
                {loadingInactivas ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                ) : (
                  <AccountConfigTable configs={configsInactivas} onEdit={openEdit} onToggleState={handleSolicitarToggle} isActive={false} />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="motivos-nd" className="space-y-4">
            <DebitNoteReasonManager ref={ndRef} />
          </TabsContent>

          {hasPermission("CC_NOTE_CREDIT") && (
            <TabsContent value="motivos-nc" className="space-y-4">
              <CreditNoteReasonManager ref={ncRef} />
            </TabsContent>
          )}

          {hasPermission("CC_MANAGE") && (
            <TabsContent value="config-interes" className="space-y-4">
              <InterestConfigManager ref={intRef} />
            </TabsContent>
          )}
        </Tabs>

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
