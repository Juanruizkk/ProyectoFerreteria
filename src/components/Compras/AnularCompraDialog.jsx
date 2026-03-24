import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { anularCompra } from "@/services/CompraProveedorQueries";

function fmt(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function fmtFecha(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function AnularCompraDialog({ open, onOpenChange, compra, onSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMotivo("");
      setError("");
    }
  }, [open]);

  const handleAnular = async () => {
    if (!motivo.trim() || motivo.trim().length < 5) {
      setError("El motivo es obligatorio (mínimo 5 caracteres).");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await anularCompra(compra.idCompraProveedor, motivo.trim());
      toast.success("Compra anulada correctamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular compra</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es irreversible. La compra quedará anulada con auditoría completa del motivo, usuario y fecha.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {compra && (
          <div className="bg-muted/50 rounded-md px-4 py-3 text-sm space-y-1 my-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proveedor</span>
              <span className="font-medium">{compra.nombreProveedor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{fmtFecha(compra.fecha)}</span>
            </div>
            {compra.numeroComprobante && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comprobante</span>
                <span>{compra.numeroComprobante}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{fmt(compra.total)}</span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 mt-2">
          <Label>
            Motivo de anulación <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Describí el motivo de la anulación..."
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setError(""); }}
            rows={3}
            disabled={loading}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleAnular(); }}
            disabled={loading || !motivo.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Anulando..." : "Anular compra"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
