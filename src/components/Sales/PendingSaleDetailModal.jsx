import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, User, CreditCard, Calendar, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { fetchPendingSaleById, approvePendingSale, rejectPendingSale } from "@/services/SaleQueries";
import { toast } from "sonner";

export default function PendingSaleDetailModal({ open, onOpenChange, saleId, onActionCompleted }) {
  const [saleDetail, setSaleDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      loadSaleDetail();
      setObservaciones(""); // Limpiar observaciones al abrir
    }
  }, [open, saleId]);

  const loadSaleDetail = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingSaleById(saleId);
      setSaleDetail(data);
    } catch (err) {
      toast.error("Error al cargar detalle de venta pendiente", {
        description: err.message,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setShowApproveConfirm(false);
    setIsProcessing(true);
    try {
      await approvePendingSale(saleId, observaciones);
      toast.success("Venta aprobada exitosamente", {
        description: "La venta ha sido autorizada y procesada.",
      });
      onOpenChange(false);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      toast.error("Error al aprobar la venta", {
        description: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!observaciones || observaciones.trim() === "") {
      toast.error("Observaciones requeridas", {
        description: "Debe proporcionar un motivo para rechazar la venta.",
      });
      setShowRejectConfirm(false);
      return;
    }

    setShowRejectConfirm(false);
    setIsProcessing(true);
    try {
      await rejectPendingSale(saleId, observaciones);
      toast.success("Venta rechazada", {
        description: "La venta ha sido rechazada.",
      });
      onOpenChange(false);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      toast.error("Error al rechazar la venta", {
        description: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Venta Pendiente de Autorización
            </DialogTitle>
            <DialogDescription>
              Revise los detalles y apruebe o rechace esta venta que excede el límite de crédito
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando detalle...</span>
            </div>
          ) : saleDetail ? (
            <div className="space-y-6">
              {/* Alerta de excedente */}
              {saleDetail.excedente > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900">
                        Límite de Crédito Excedido
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Esta venta excede el límite de crédito del cliente por{" "}
                        <span className="font-bold">{formatCurrency(saleDetail.excedente)}</span>
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-orange-600">Saldo actual:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.saldoActual)}</span>
                        </div>
                        <div>
                          <span className="text-orange-600">Límite:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.limiteCredito)}</span>
                        </div>
                        <div>
                          <span className="text-orange-600">Nueva deuda:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.nuevoSaldo)}</span>
                        </div>
                        <div>
                          <span className="text-orange-600">Días pendiente:</span>{" "}
                          <span className="font-medium">{saleDetail.diasPendiente} días</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="text-lg font-semibold">{saleDetail.codigoVentaPendiente}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Solicitud</p>
                      <p className="text-base">{formatDate(saleDetail.fechaSolicitud)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p className="text-base">{saleDetail.cliente}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
                      <p className="text-base">{saleDetail.vendedor}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <div className="mt-1">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {saleDetail.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de la Venta</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(saleDetail.total)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items de la Venta */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items de la Venta
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleDetail.items && saleDetail.items.length > 0 ? (
                        saleDetail.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.nombreProducto}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.marcaProducto}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.precioUnitario)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No hay items en esta venta
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Observaciones {saleDetail.estado === "Pendiente" && <span className="text-destructive">(requerido para rechazar)</span>}
                </label>
                <Textarea
                  placeholder="Ingrese observaciones o motivo de aprobación/rechazo..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            {saleDetail && saleDetail.estado === "Pendiente" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={isProcessing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de Aprobación */}
      <AlertDialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ¿Aprobar esta venta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción autorizará la venta que excede el límite de crédito del cliente.
              La venta será procesada inmediatamente y se actualizará el saldo del cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Sí, Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación de Rechazo */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              ¿Rechazar esta venta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción rechazará la venta y no se procesará.
              Asegúrese de haber ingresado el motivo del rechazo en las observaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
