import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Pencil, CheckCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getInterestConfigs,
  createInterestConfig,
  updateInterestConfig,
  setCurrentInterestConfig,
} from "@/services/CurrentAccountQueries";

const emptyForm = { nombre: "", porcentajeInteres: "", diaVencimiento: "" };

function validate(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  else if (form.nombre.trim().length > 100) errors.nombre = "Máximo 100 caracteres.";
  const pct = parseFloat(form.porcentajeInteres);
  if (!form.porcentajeInteres) errors.porcentajeInteres = "La tasa es obligatoria.";
  else if (isNaN(pct) || pct < 0.01 || pct > 100) errors.porcentajeInteres = "Debe estar entre 0.01 y 100.";
  const day = parseInt(form.diaVencimiento, 10);
  if (!form.diaVencimiento) errors.diaVencimiento = "El día es obligatorio.";
  else if (isNaN(day) || day < 1 || day > 28) errors.diaVencimiento = "Debe ser un número entre 1 y 28.";
  return errors;
}

const InterestConfigManager = forwardRef(function InterestConfigManager(_, ref) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [setCurrTarget, setSetCurrTarget] = useState(null);
  const [settingCurrent, setSettingCurrent] = useState(false);

  useImperativeHandle(ref, () => ({ openCreate }));

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setConfigs((await getInterestConfigs()) || []);
    } catch (error) {
      toast.error(error.message || "Error al cargar configuraciones de interés.");
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingConfig(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (config) => {
    setEditingConfig(config);
    setForm({
      nombre: config.nombre,
      porcentajeInteres: String(config.porcentajeInteres),
      diaVencimiento: String(config.diaVencimiento),
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    try {
      setSubmitting(true);
      const body = {
        nombre: form.nombre.trim(),
        porcentajeInteres: parseFloat(form.porcentajeInteres),
        diaVencimiento: parseInt(form.diaVencimiento, 10),
      };
      if (editingConfig) {
        await updateInterestConfig({ ...body, idConfig: editingConfig.idConfig });
        toast.success("Configuración actualizada.");
      } else {
        await createInterestConfig(body);
        toast.success("Configuración creada.");
      }
      setModalOpen(false);
      await loadConfigs();
    } catch (error) {
      toast.error(error.message || "Error al guardar la configuración.");
    } finally { setSubmitting(false); }
  };

  const handleSetCurrent = async () => {
    if (!setCurrTarget) return;
    try {
      setSettingCurrent(true);
      await setCurrentInterestConfig(setCurrTarget.idConfig);
      toast.success(`"${setCurrTarget.nombre}" marcada como configuración activa.`);
      setSetCurrTarget(null);
      await loadConfigs();
    } catch (error) {
      toast.error(error.message || "Error al cambiar la configuración activa.");
    } finally { setSettingCurrent(false); }
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tasa de interés</TableHead>
              <TableHead>Día de vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay configuraciones de interés registradas.
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.idConfig}>
                  <TableCell className="font-medium">{config.nombre}</TableCell>
                  <TableCell>{config.porcentajeInteres.toFixed(2)}%</TableCell>
                  <TableCell>Día {config.diaVencimiento}</TableCell>
                  <TableCell>
                    {config.esActual ? (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Editar" onClick={() => openEdit(config)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!config.esActual && (
                        <Button variant="ghost" size="sm" title="Marcar como activa" onClick={() => setSetCurrTarget(config)}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
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

      {/* Dialog crear / editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!submitting) setModalOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar configuración de interés" : "Nueva configuración de interés"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ic-nombre">Nombre</Label>
              <Input id="ic-nombre" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Ej: Interés Marzo 2026" maxLength={100} disabled={submitting} autoFocus />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ic-pct">Tasa de interés (%)</Label>
              <Input id="ic-pct" type="number" step="0.01" min="0.01" max="100" value={form.porcentajeInteres} onChange={(e) => setField("porcentajeInteres", e.target.value)} placeholder="Ej: 5.00" disabled={submitting} />
              {errors.porcentajeInteres && <p className="text-xs text-destructive">{errors.porcentajeInteres}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ic-day">Día de vencimiento</Label>
              <Input id="ic-day" type="number" step="1" min="1" max="28" value={form.diaVencimiento} onChange={(e) => setField("diaVencimiento", e.target.value)} placeholder="Ej: 10" disabled={submitting} />
              {errors.diaVencimiento && <p className="text-xs text-destructive">{errors.diaVencimiento}</p>}
              <p className="text-xs text-muted-foreground">
                Los clientes que no paguen antes del día {form.diaVencimiento || "X"} del mes serán considerados morosos.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{editingConfig ? "Guardando..." : "Creando..."}</> : editingConfig ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog marcar como activa */}
      <AlertDialog open={!!setCurrTarget} onOpenChange={(open) => { if (!open && !settingCurrent) setSetCurrTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como activa?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Marcar <span className="font-semibold text-foreground">"{setCurrTarget?.nombre}"</span> como la configuración activa? Esto desactivará la configuración actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={settingCurrent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetCurrent} disabled={settingCurrent} className="bg-green-600 hover:bg-green-700">
              {settingCurrent ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Marcando...</> : "Marcar como activa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export default InterestConfigManager;
