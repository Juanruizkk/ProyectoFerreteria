import { useState } from "react";
import { getCurrentUser } from "@/services/AuthService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { annulPayment } from "@/services/CurrentAccountQueries";

const formatCurrency = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n ?? 0);

export function AnnulPaymentDialog({ open, onClose, movimiento, onSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (motivo.trim().length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await annulPayment({
        idMovimientoPago: movimiento.idMovimiento,
        idUsuarioRegistra: getCurrentUser()?.userId,
        motivo: motivo.trim(),
      });
      toast.success("Pago anulado correctamente.");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.message ?? "Error al anular el pago.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setMotivo("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular pago #{movimiento?.idMovimiento}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Se revertirá el importe de{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(movimiento?.importe)}
            </span>{" "}
            y se recomputarán los estados de pago de los consumos del cliente.
            Esta acción no se puede deshacer.
          </p>
          <div className="space-y-1">
            <Label htmlFor="motivo">Motivo de anulación</Label>
            <Textarea
              id="motivo"
              placeholder="Ej: Monto incorrecto ingresado por error..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {motivo.trim().length} / 10 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Anulando..." : "Confirmar anulación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
