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
import { FaFilePdf } from "react-icons/fa";
import { fetchPendingSaleById, approvePendingSale, rejectPendingSale, downloadPendingSalePdf } from "@/services/SaleQueries";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";
import PermissionGuard from "@/components/PermissionGuard";
import { toast } from "sonner";

export default function PendingSaleDetailModal({ open, onOpenChange, saleId, onActionCompleted }) {
  const { formatCantidad } = useUnidadesMedida();
  const [saleDetail, setSaleDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      setObservaciones("");
      loadSaleDetail();
    }
  }, [open, saleId]);

  const loadSaleDetail = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingSaleById(saleId);
      setSaleDetail(data);
      if (data.observaciones) setObservaciones(data.observaciones);
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

  const handleDownloadPdf = async () => {
    if (!saleId || !saleDetail) return;

    setIsDownloading(true);
    try {
      await downloadPendingSalePdf(saleId, saleDetail.codigoVenta);
      toast.success("Comprobante descargado exitosamente");
    } catch (err) {
      toast.error("Error al descargar el comprobante", {
        description: err.message,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  const getEstadoBadgeClass = (estado) => {
    const lower = estado?.toLowerCase() ?? "";
    if (lower.includes("aprobad")) return "bg-green-100 text-green-800";
    if (lower.includes("rechazad")) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
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
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {saleDetail?.estado?.toLowerCase().includes("aprobad") ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : saleDetail?.estado?.toLowerCase().includes("rechazad") ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  {saleDetail?.estado?.toLowerCase().includes("aprobad")
                    ? "Venta Aprobada"
                    : saleDetail?.estado?.toLowerCase().includes("rechazad")
                    ? "Venta Rechazada"
                    : "Venta Pendiente de Autorización"}
                </DialogTitle>
                <DialogDescription>
                  {saleDetail?.estado?.toLowerCase().includes("aprobad")
                    ? "Esta venta fue aprobada y procesada exitosamente."
                    : saleDetail?.estado?.toLowerCase().includes("rechazad")
                    ? "Esta venta fue rechazada y nunca se efectuó."
                    : "Revise los detalles y apruebe o rechace esta venta que excede el límite de crédito"}
                </DialogDescription>
              </div>
              {saleDetail && (
                <div className="flex gap-2 shrink-0 mr-8">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    size="sm"
                    variant="outline"
                  >
                    {isDownloading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Descargando...</>
                    ) : (
                      <><FaFilePdf className="h-4 w-4 mr-2 text-red-500" />Descargar comprobante</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Cargando detalle...</span>
            </div>
          ) : saleDetail ? (
            <div className="space-y-6">
              {/* Banner de resultado cuando ya fue procesada */}
              {saleDetail.estado?.toLowerCase().includes("aprobada") && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Venta Aprobada</p>
                    <p className="text-sm text-green-700">Esta venta fue aprobada y el crédito del cliente fue actualizado.</p>
                  </div>
                </div>
              )}
              {saleDetail.estado?.toLowerCase().includes("rechazada") && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Venta Rechazada</p>
                    <p className="text-sm text-red-700">Esta venta fue rechazada. No se realizó ningún cargo al cliente.</p>
                  </div>
                </div>
              )}

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
                      <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-orange-600">Saldo actual:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.saldoActual)}</span>
                        </div>
                        <div>
                          <span className="text-orange-600">Límite:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.limiteCuenta)}</span>
                        </div>
                        <div>
                          <span className="text-orange-600">Saldo después:</span>{" "}
                          <span className="font-medium">{formatCurrency(saleDetail.saldoDespuesVenta)}</span>
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
                      <p className="text-lg font-semibold">{saleDetail.codigoVenta}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Solicitud</p>
                      <p className="text-base">{formatDate(saleDetail.fechaRegistro)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p className="text-base">{saleDetail.cliente}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
                      <p className="text-base">{saleDetail.vendedor}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <div className="mt-1">
                        <Badge className={getEstadoBadgeClass(saleDetail.estado)}>
                          {saleDetail.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
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
                            <TableCell className="text-center font-medium">
                              {formatCantidad(item.cantidad, item.idUnidadMedida)}
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

              {/* Observaciones / Motivo */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {saleDetail.estado?.toLowerCase().includes("rechazada")
                    ? "Motivo del rechazo"
                    : saleDetail.estado?.toLowerCase().includes("aprobada")
                    ? "Observaciones de aprobación"
                    : <>Observaciones <span className="text-destructive">(requerido para rechazar)</span></>}
                </label>
                <Textarea
                  placeholder="Ingrese observaciones o motivo de aprobación/rechazo..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={!saleDetail.estado || !saleDetail.estado.toLowerCase().includes("pendiente")}
                />
                {!saleDetail.estado?.toLowerCase().includes("pendiente") && !observaciones && (
                  <p className="text-xs text-muted-foreground mt-1">Sin observaciones registradas.</p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing || isDownloading}
            >
              Cancelar
            </Button>
            {saleDetail && saleDetail.estado && saleDetail.estado.toLowerCase().includes("pendiente") && (
              <PermissionGuard permission="SALE_AUTHORIZE">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={isProcessing || isDownloading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing || isDownloading}
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
              </PermissionGuard>
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
