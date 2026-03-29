import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, User, CreditCard, Calendar, FileText, Download, Ban, XCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { FaFilePdf } from "react-icons/fa";
import { fetchSaleById, downloadSalePdf, downloadCreditNotePdf, exportarVentaPdf } from "@/services/SaleQueries";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import AnnulSaleDialog from "./AnnulSaleDialog";

export default function SaleDetailModal({ open, onOpenChange, saleId, onSaleAnnulled }) {
  const { hasPermission } = usePermission();
  const { formatCantidad } = useUnidadesMedida();
  const [saleDetail, setSaleDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAnnulDialog, setShowAnnulDialog] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      loadSaleDetail();
    }
  }, [open, saleId]);

  const loadSaleDetail = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSaleById(saleId);
      setSaleDetail(data);
    } catch (err) {
      toast.error("Error al cargar detalle de venta", {
        description: err.message,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const id = saleDetail.idVenta || saleDetail.id || saleId;
      if (isAnulada) {
        await downloadCreditNotePdf(id, saleDetail.codigoVenta);
      } else {
        await exportarVentaPdf(id);
      }
      toast.success("Comprobante descargado exitosamente");
    } catch (err) {
      toast.error("Error al descargar el comprobante", { description: err.message });
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado) => {
    const estadoKey = estado?.toLowerCase() ?? "";
    let className = "bg-gray-100 text-gray-800";
    if (estadoKey.startsWith("aprobad") || estadoKey.startsWith("completad")) {
      className = "bg-green-100 text-green-800";
    } else if (estadoKey === "pendiente") {
      className = "bg-yellow-100 text-yellow-800";
    } else if (estadoKey.startsWith("rechazad") || estadoKey.startsWith("anulad")) {
      className = "bg-red-100 text-red-800";
    }

    return (
      <Badge className={className}>
        {estado}
      </Badge>
    );
  };

  const estadoLower = saleDetail?.estado?.toLowerCase() ?? "";
  const isAnulada = estadoLower === "anulada";
  // Maneja tanto "Aprobada"/"Aprobado" como "Completada"/"Completado" (backend puede devolver cualquier forma)
  const canAnnul = hasPermission("CC_NOTE_CREDIT") && saleDetail &&
    (estadoLower.startsWith("aprobad") || estadoLower.startsWith("completad"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalle de Venta
              </DialogTitle>
              <DialogDescription>
                Información completa de la venta y sus items
              </DialogDescription>
            </div>
            {saleDetail && (
              <div className="flex gap-2 shrink-0 mr-8">
                {canAnnul && (
                  <Button
                    onClick={() => setShowAnnulDialog(true)}
                    size="sm"
                    variant="destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Anular Venta
                  </Button>
                )}
                <Button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  size="sm"
                  variant="outline"
                >
                  {isDownloading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Descargando...</>
                  ) : (
                    <><FaFilePdf className="h-4 w-4 mr-2 text-red-500" />{isAnulada ? "Descargar NC" : "Descargar comprobante"}</>
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
            {/* Banner de estado para ventas finalizadas (no completadas normalmente) */}
            {isAnulada && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Venta Anulada</p>
                  <p className="text-sm text-red-700">Esta venta fue anulada. Se generó una nota de crédito correspondiente.</p>
                </div>
              </div>
            )}
            {estadoLower.startsWith("rechazad") && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Venta Rechazada</p>
                  <p className="text-sm text-red-700">Esta venta fue rechazada y nunca se efectuó.</p>
                </div>
              </div>
            )}
            {estadoLower.startsWith("aprobad") && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Venta Aprobada</p>
                  <p className="text-sm text-green-700">Esta venta fue aprobada y procesada exitosamente.</p>
                </div>
              </div>
            )}
            {estadoLower === "pendiente" && (
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900">Venta Pendiente de Autorización</p>
                  <p className="text-sm text-yellow-700">Esta venta está esperando aprobación de un administrador.</p>
                </div>
              </div>
            )}

            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Código de Venta</p>
                    <p className="text-lg font-semibold">{saleDetail.codigoVenta}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                    <p className="text-base">{formatDate(saleDetail.fecha)}</p>
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
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medio de Pago</p>
                    <p className="text-base">{saleDetail.medioPago}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <div className="mt-1">
                      {getEstadoBadge(saleDetail.estado)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5" /> {/* Spacer for alignment */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
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

              {/* Total Final */}
              <div className="mt-4 flex justify-end">
                <div className="bg-primary/10 rounded-lg p-4 min-w-[250px]">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total de la Venta:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(saleDetail.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>

      <AnnulSaleDialog
        open={showAnnulDialog}
        onOpenChange={setShowAnnulDialog}
        sale={saleDetail}
        onSuccess={() => {
          loadSaleDetail();
          onSaleAnnulled?.();
        }}
      />
    </Dialog>
  );
}
