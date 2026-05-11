import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { annulSale, getCreditNoteReasons, downloadCreditNotePdf } from "@/services/SaleQueries";

export default function AnnulSaleDialog({ open, onOpenChange, sale, onSuccess }) {
  const [motivos, setMotivos] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [annulResult, setAnnulResult] = useState(null);
  const [downloadingNc, setDownloadingNc] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMotivo("");
      setDetalle("");
      setAnnulResult(null);
      loadMotivos();
    }
  }, [open]);

  const loadMotivos = async () => {
    try {
      setLoadingMotivos(true);
      const data = await getCreditNoteReasons(true);
      const lista = data || [];
      setMotivos(lista);
      if (lista.length === 1) setSelectedMotivo(String(lista[0].idMotivo));
    } catch {
      toast.error("No se pudieron cargar los motivos de nota de crédito.");
    } finally {
      setLoadingMotivos(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMotivo) {
      toast.error("Seleccioná un motivo para la nota de crédito.");
      return;
    }
    try {
      setSubmitting(true);
      const result = await annulSale(sale.idVenta || sale.id, {
        idMotivo: parseInt(selectedMotivo),
        detalleAdicional: detalle.trim() || null,
      });
      setAnnulResult(result);
      toast.success("Venta anulada. Se generó la nota de crédito.");
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || "Error al anular la venta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadNc = async () => {
    try {
      setDownloadingNc(true);
      await downloadCreditNotePdf(sale.idVenta || sale.id, sale.codigoVenta);
    } catch {
      toast.error("No se pudo descargar la nota de crédito.");
    } finally {
      setDownloadingNc(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anular Venta</DialogTitle>
          <DialogDescription>
            {sale && (
              <>
                Vas a anular la venta{" "}
                <Badge variant="outline" className="font-mono text-xs">
                  {sale.codigoVenta}
                </Badge>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {annulResult ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">Venta anulada exitosamente.</p>
                <p>Se generó la nota de crédito y el stock fue repuesto.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadNc} disabled={downloadingNc} variant="outline">
                {downloadingNc ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Descargando...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Descargar Nota de Crédito</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Advertencia de consecuencias */}
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Esta acción es irreversible.</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>La venta quedará marcada como <strong>Anulada</strong>.</li>
                  <li>Se generará una <strong>Nota de Crédito</strong> en la cuenta corriente del cliente.</li>
                  <li>El <strong>stock</strong> de los productos será repuesto.</li>
                </ul>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo de anulación</Label>
              {loadingMotivos ? (
                <p className="text-sm text-muted-foreground">Cargando motivos...</p>
              ) : motivos.length === 0 ? (
                <p className="text-sm text-destructive">
                  No hay motivos de nota de crédito activos. Configurá uno en Configuración de CC.
                </p>
              ) : motivos.length === 1 ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">{motivos[0].nombre}</span>
                  <span className="text-xs text-muted-foreground">(único motivo disponible)</span>
                </div>
              ) : (
                <Select value={selectedMotivo} onValueChange={setSelectedMotivo} disabled={submitting}>
                  <SelectTrigger>
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

            {/* Detalle adicional */}
            <div className="space-y-2">
              <Label>Detalle adicional (opcional)</Label>
              <Textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                disabled={submitting}
                placeholder="Descripción adicional..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={submitting || loadingMotivos || motivos.length === 0}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Anulando...</>
                ) : (
                  "Confirmar Anulación"
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
