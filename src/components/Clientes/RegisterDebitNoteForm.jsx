import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/AuthService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, X, AlertCircle, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDebitNoteReasons, registerDebitNote } from "@/services/CurrentAccountQueries";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

export default function RegisterDebitNoteForm({
  open,
  onClose,
  clientId,
  currentBalance,
  onMovementRegistered,
  // Props opcionales para modo "Ajuste de precio"
  idVenta = null,
  codigoVenta = null,
}) {
  const isAjustePrecio = idVenta !== null;

  const [motivos, setMotivos] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(true);
  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [importe, setImporte] = useState("");
  const [detalleAdicional, setDetalleAdicional] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // En modo ajuste de precio, solo traer motivos de esa categoría
        const data = await getDebitNoteReasons(true, isAjustePrecio ? "ajuste_precio" : "general");
        const lista = data || [];
        setMotivos(lista);
        // Auto-seleccionar si hay exactamente uno
        if (lista.length === 1) {
          setSelectedMotivo(String(lista[0].idMotivo));
        }
      } catch {
        toast.error("No se pudieron cargar los motivos de nota de débito.");
      } finally {
        setLoadingMotivos(false);
      }
    };
    load();
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen && !submitting) {
      onClose();
    }
  };

  const nuevoSaldoEstimado = currentBalance + parseFloat(importe || 0);

  const validateForm = () => {
    if (!selectedMotivo) {
      toast.error("Seleccioná un motivo para la nota de débito.");
      return false;
    }
    const parsed = parseFloat(importe);
    if (!importe || parsed <= 0) {
      toast.error("El importe debe ser mayor que 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await registerDebitNote({
        idCliente: clientId,
        importe: parseFloat(importe),
        idMotivo: parseInt(selectedMotivo),
        detalleAdicional: detalleAdicional.trim() || null,
        idVenta: idVenta,
        idUsuarioRegistra: getCurrentUser()?.userId,
      });
      toast.success(
        isAjustePrecio
          ? `Ajuste de precio registrado para venta ${codigoVenta}.`
          : "Nota de débito registrada exitosamente."
      );
      onMovementRegistered?.();
      onClose();
    } catch (error) {
      toast.error(error.message || "Error al registrar la nota de débito.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAjustePrecio ? "Ajuste de precio — Nota de Débito" : "Registrar Nota de Débito"}
          </DialogTitle>
          <DialogDescription>
            {isAjustePrecio
              ? "Aplicá un cargo de ajuste de precio vinculado a la venta seleccionada"
              : "Aplicá un cargo adicional a la cuenta corriente del cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
        {/* Venta vinculada (modo ajuste de precio) */}
        {isAjustePrecio && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
            <Tag className="h-4 w-4 shrink-0" />
            <span>
              Ajuste vinculado a la venta{" "}
              <Badge variant="outline" className="font-mono text-xs ml-1">
                {codigoVenta}
              </Badge>
            </span>
          </div>
        )}

        {/* Saldo actual */}
        <div className="flex justify-between items-center rounded-lg border bg-muted/40 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Saldo actual</span>
          <span
            className={cn(
              "text-xl font-bold",
              currentBalance > 0
                ? "text-destructive"
                : currentBalance < 0
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {formatCurrency(currentBalance)}
          </span>
        </div>

        {/* Advertencia si no tiene deuda */}
        {currentBalance <= 0 && (
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              El cliente no tiene deuda activa. La nota de débito generará una nueva deuda.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            {loadingMotivos ? (
              <p className="text-sm text-muted-foreground">Cargando motivos...</p>
            ) : motivos.length === 0 ? (
              <p className="text-sm text-destructive">
                No hay motivos de categoría "{isAjustePrecio ? "Ajuste de precio" : "General"}" activos.
                Configurá uno en la sección de Configuración de CC.
              </p>
            ) : motivos.length === 1 ? (
              // Un único motivo: mostrar como fijo, sin dropdown
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">{motivos[0].nombre}</span>
                <span className="text-xs text-muted-foreground">(único motivo disponible)</span>
              </div>
            ) : (
              <Select
                value={selectedMotivo}
                onValueChange={setSelectedMotivo}
                disabled={submitting}
              >
                <SelectTrigger id="motivo">
                  <SelectValue placeholder="Seleccionar motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {motivos.map((m) => (
                    <SelectItem key={m.idMotivo} value={String(m.idMotivo)}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Importe */}
          <div className="space-y-2">
            <Label htmlFor="importe">Importe</Label>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0.01"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              disabled={submitting}
              placeholder="Ingresá el importe"
              autoFocus
            />
          </div>

          {/* Detalle adicional */}
          <div className="space-y-2">
            <Label htmlFor="detalle">Detalle adicional (opcional)</Label>
            <Input
              id="detalle"
              type="text"
              value={detalleAdicional}
              onChange={(e) => setDetalleAdicional(e.target.value)}
              disabled={submitting}
              placeholder="Descripción adicional (opcional)"
            />
          </div>

          {/* Preview del efecto */}
          {importe && parseFloat(importe) > 0 && (
            <div className="rounded-md bg-muted/30 px-3 py-2 text-sm space-y-0.5">
              <span className="font-medium">Efecto estimado: </span>
              <span className="text-muted-foreground">
                {formatCurrency(currentBalance)}
                {" → "}
                <span
                  className={cn(
                    "font-semibold",
                    nuevoSaldoEstimado > 0 ? "text-destructive" : "text-green-600"
                  )}
                >
                  {formatCurrency(nuevoSaldoEstimado)}
                </span>
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={submitting || loadingMotivos || motivos.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : isAjustePrecio ? (
                "Registrar ajuste de precio"
              ) : (
                "Registrar nota de débito"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
