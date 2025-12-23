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
import { Loader2, Package, User, CreditCard, Calendar, FileText, Download } from "lucide-react";
import { fetchSaleById, downloadSalePdf } from "@/services/SaleQueries";
import { toast } from "sonner";

export default function SaleDetailModal({ open, onOpenChange, saleId }) {
  const [saleDetail, setSaleDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
      await downloadSalePdf(saleDetail.idVenta || saleDetail.id || saleId, saleDetail.codigoVenta);
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
    const variants = {
      "Completada": "bg-green-100 text-green-800",
      "Pendiente": "bg-yellow-100 text-yellow-800",
      "Rechazada": "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[estado] || "bg-gray-100 text-gray-800"}>
        {estado}
      </Badge>
    );
  };

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
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                size="sm"
                className="shrink-0"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </>
                )}
              </Button>
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
    </Dialog>
  );
}
