import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "@/services/AuthService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { registerMovement } from "@/services/CurrentAccountQueries";
import { toast } from "sonner";
import { Loader2, CheckCircle, Banknote, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = {
  TOTAL: "total",
  PARCIAL: "parcial",
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

export default function PayConsumptionForm({ open, onClose, consumo, clientId, onPaid }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const saldoPendiente = consumo.importe - (consumo.montoPagado ?? 0);

  // Auto-fill cuando se selecciona pago total
  useEffect(() => {
    if (selectedMode === MODES.TOTAL) {
      setAmount(saldoPendiente.toString());
    } else {
      setAmount("");
    }
  }, [selectedMode]);

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

  const generateDetail = () => {
    const formatted = parseFloat(amount).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return selectedMode === MODES.TOTAL
      ? `Pago total de venta ${consumo.codigoVenta} - $${formatted}`
      : `Pago parcial de venta ${consumo.codigoVenta} - $${formatted}`;
  };

  // Hint dinámico para pago parcial
  const getParcialHint = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return null;
    if (parsed >= saldoPendiente) {
      return {
        text: "El monto cubre el saldo completo — usá Pago total para esto",
        color: "text-yellow-600",
      };
    }
    const restante = saldoPendiente - parsed;
    return {
      text: `Quedará un saldo pendiente de ${formatCurrency(restante)}`,
      color: "text-muted-foreground",
    };
  };

  const validateForm = () => {
    const parsed = parseFloat(amount);
    if (!amount || parsed <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }
    if (parsed > saldoPendiente) {
      toast.error(`El importe supera el saldo pendiente (${formatCurrency(saldoPendiente)})`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const data = await registerMovement({
        idCliente: clientId,
        importe: parseFloat(amount),
        detalle: generateDetail(),
        idTipoMovimiento: 8, // pago_factura
        idVenta: consumo.idVenta,
        idUsuarioRegistra: getCurrentUser()?.userId,
      });
      toast.success("Pago registrado exitosamente");
      onPaid(data.idMovimiento);
    } catch (error) {
      toast.error(error.message || "Error al registrar el pago");
      console.error("Error registering payment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMode = (mode) => {
    setSelectedMode((prev) => (prev === mode ? null : mode));
  };

  const handleCancelForm = useCallback(() => {
    setSelectedMode(null);
    setAmount("");
  }, []);

  const parcialHint = selectedMode === MODES.PARCIAL ? getParcialHint() : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar Consumo</DialogTitle>
          <DialogDescription>
            Venta{" "}
            <Badge variant="outline" className="font-mono text-xs">
              {consumo.codigoVenta}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
        {/* Resumen del consumo */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total del consumo</span>
            <span className="font-medium">{formatCurrency(consumo.importe)}</span>
          </div>
          {(consumo.montoPagado ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ya pagado</span>
              <span className="font-medium text-green-600">
                {formatCurrency(consumo.montoPagado)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="font-medium text-muted-foreground">Saldo pendiente</span>
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(saldoPendiente)}
            </span>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              mode: MODES.TOTAL,
              icon: CheckCircle,
              title: "Pago total",
              description: `Salda el consumo completo (${formatCurrency(saldoPendiente)})`,
            },
            {
              mode: MODES.PARCIAL,
              icon: Banknote,
              title: "Pago parcial",
              description: "Ingresá el monto que querés abonar",
            },
          ].map(({ mode, icon: Icon, title, description }) => {
            const isSelected = selectedMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                disabled={submitting}
                className={cn(
                  "text-left rounded-lg border p-4 transition-all",
                  submitting
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:border-primary/50 hover:bg-muted/30",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-primary" : ""
                    )}
                  >
                    {title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{description}</p>
              </button>
            );
          })}
        </div>

        {/* Formulario dinámico */}
        {selectedMode && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {selectedMode === MODES.TOTAL
                  ? "Monto (auto-calculado)"
                  : "Monto a pagar"}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={saldoPendiente}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting || selectedMode === MODES.TOTAL}
                placeholder="Ingrese el monto"
                required
                autoFocus={selectedMode === MODES.PARCIAL}
              />

              {/* Hint dinámico para parcial */}
              {parcialHint && (
                <p className={cn("text-xs font-medium", parcialHint.color)}>
                  {parcialHint.text}
                </p>
              )}

              {/* Máximo para parcial */}
              {selectedMode === MODES.PARCIAL && !parcialHint && (
                <p className="text-xs text-muted-foreground">
                  Máximo: {formatCurrency(saldoPendiente)}
                </p>
              )}
            </div>

            {/* Preview del detalle */}
            {amount && parseFloat(amount) > 0 && (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">Detalle: </span>
                <span className="text-muted-foreground">{generateDetail()}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Volver
              </Button>
            </div>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
