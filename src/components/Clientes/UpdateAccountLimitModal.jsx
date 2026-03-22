import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchAccountConfigs } from "@/services/AccountConfigQueries";
import { updateAccountLimit } from "@/services/CurrentAccountQueries";
import { getCurrentUser } from "@/services/AuthService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount ?? 0);

export default function UpdateAccountLimitModal({ open, onClose, clientId, limiteActual, onSuccess }) {
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedConfigId("");
      setMotivo("");
      setErrors({});
      loadConfigs();
    }
  }, [open]);

  const loadConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const data = await fetchAccountConfigs(true);
      setConfigs(data || []);
    } catch {
      toast.error("Error al cargar las configuraciones de límite.");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const selectedConfig = configs.find((c) => String(c.idConfig) === selectedConfigId) ?? null;
  const nuevoLimite = selectedConfig?.montoLimite ?? null;

  const getLimiteDiff = () => {
    if (nuevoLimite === null) return null;
    if (nuevoLimite > limiteActual) return "sube";
    if (nuevoLimite < limiteActual) return "baja";
    return "igual";
  };

  const diff = getLimiteDiff();

  const validate = () => {
    const e = {};
    if (!selectedConfigId) e.config = "Seleccioná una configuración.";
    if (!motivo.trim() || motivo.trim().length < 5)
      e.motivo = "El motivo debe tener al menos 5 caracteres.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    try {
      setSubmitting(true);
      const user = getCurrentUser();
      await updateAccountLimit({
        idCliente: clientId,
        idConfiguracion: parseInt(selectedConfigId),
        idUsuarioRegistra: user?.userId ?? 1,
        motivo: motivo.trim(),
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Error al actualizar el límite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar Límite de Cuenta Corriente</DialogTitle>
          <DialogDescription>
            Seleccioná una nueva configuración de límite de crédito para este cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Select de configuración */}
          <div className="space-y-1">
            <Label htmlFor="ul-config">Nueva configuración de límite</Label>
            {loadingConfigs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuraciones...
              </div>
            ) : (
              <Select
                value={selectedConfigId}
                onValueChange={(val) => {
                  setSelectedConfigId(val);
                  if (errors.config) setErrors((prev) => ({ ...prev, config: undefined }));
                }}
                disabled={submitting}
              >
                <SelectTrigger id="ul-config">
                  <SelectValue placeholder="Seleccioná un límite..." />
                </SelectTrigger>
                <SelectContent>
                  {configs.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No hay configuraciones activas
                    </SelectItem>
                  ) : (
                    configs.map((c) => (
                      <SelectItem key={c.idConfig} value={String(c.idConfig)}>
                        {c.nombre} — {formatCurrency(c.montoLimite)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.config && <p className="text-xs text-destructive">{errors.config}</p>}
          </div>

          {/* Preview del cambio */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Resumen del cambio</p>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Límite actual</p>
                <p className="font-semibold">{formatCurrency(limiteActual)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Nuevo límite</p>
                {nuevoLimite !== null ? (
                  <div className="flex items-center gap-1">
                    <p className={`font-semibold ${
                      diff === "sube" ? "text-green-700" :
                      diff === "baja" ? "text-destructive" : ""
                    }`}>
                      {formatCurrency(nuevoLimite)}
                    </p>
                    {diff === "sube" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {diff === "baja" && <TrendingDown className="h-4 w-4 text-destructive" />}
                    {diff === "igual" && <Minus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Sin seleccionar</p>
                )}
              </div>
            </div>
          </div>

          {diff === "igual" && (
            <p className="text-xs text-muted-foreground -mt-2">
              El límite seleccionado es igual al actual. Elegí una configuración diferente.
            </p>
          )}

          {/* Motivo */}
          <div className="space-y-1">
            <Label htmlFor="ul-motivo">
              Motivo de la modificación <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ul-motivo"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (errors.motivo) setErrors((prev) => ({ ...prev, motivo: undefined }));
              }}
              placeholder="Ej: Se amplía el límite por historial de pagos positivo"
              rows={3}
              disabled={submitting}
            />
            <div className="flex justify-between">
              {errors.motivo
                ? <p className="text-xs text-destructive">{errors.motivo}</p>
                : <span />}
              <p className={`text-xs ${motivo.trim().length < 5 ? "text-muted-foreground" : "text-green-700"}`}>
                {motivo.trim().length} car.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || loadingConfigs || diff === "igual"}>
              {submitting
                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Guardando...</>
                : "Confirmar cambio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
