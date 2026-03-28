import { useState, useEffect, useRef } from "react";
import { Eye, ShoppingCart, Calendar } from "lucide-react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditPagination } from "@/components/Audit/AuditPagination";
import EmptyState from "@/components/Common/EmptyState";
import SaleDetailModal from "@/components/Sales/SaleDetailModal";
import {
  fetchSales,
  exportarVentasClienteExcel,
  exportarVentasClientePdf,
} from "@/services/SaleQueries";

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const getEstadoBadgeClass = (estado) => {
  if (!estado) return "bg-gray-100 text-gray-800";
  const e = estado.toLowerCase();
  if (e.startsWith("aprobad")) return "bg-green-100 text-green-800";
  if (e === "pendiente") return "bg-yellow-100 text-yellow-800";
  if (e.startsWith("rechazad") || e.startsWith("anulad") || e === "cancelado")
    return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

export default function ClientSalesTab({ clientId }) {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [paginationMetadata, setPaginationMetadata] = useState(null);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const isFirstRender = useRef(true);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const result = await fetchSales(
        pageNumber,
        PAGE_SIZE,
        null,
        fechaDesde || null,
        fechaHasta || null,
        null,
        clientId
      );
      const filtered = (result.items || []).filter((s) => {
        const e = s.estado?.toLowerCase() ?? "";
        return e.startsWith("aprobad") || e === "anulada";
      });
      setSales(filtered);
      const totalPages = result.totalPages ?? 1;
      setPaginationMetadata({
        pagedIndex: pageNumber,
        totalPages,
        totalCount: result.totalCount ?? 0,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      });
    } catch (err) {
      toast.error("Error al cargar ventas del cliente", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) loadSales();
  }, [pageNumber, clientId]);

  // Debounce para filtros
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      if (pageNumber !== 1) setPageNumber(1);
      else loadSales();
    }, 400);
    return () => clearTimeout(timer);
  }, [fechaDesde, fechaHasta]);

  const hasFilters = fechaDesde || fechaHasta;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.promise(exportarVentasClientePdf(clientId), {
                loading: "Generando PDF...",
                success: "PDF descargado",
                error: (e) => e.message,
              })}
            >
              <FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" />
              Historial PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.promise(exportarVentasClienteExcel(clientId), {
                loading: "Generando Excel...",
                success: "Excel descargado",
                error: (e) => e.message,
              })}
            >
              <FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" />
              Historial Excel
            </Button>
          </div>
        </div>
        {hasFilters && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => {
              setFechaDesde(""); setFechaHasta(""); setPageNumber(1);
            }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px]">Código</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Medio de Pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={ShoppingCart}
                    title={hasFilters ? "No se encontraron ventas con los filtros aplicados" : "Este cliente no tiene ventas registradas"}
                    description={hasFilters ? "Probá ajustando los filtros" : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{sale.codigoVenta}</TableCell>
                  <TableCell>{formatDate(sale.fecha)}</TableCell>
                  <TableCell>{sale.medioPago}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeClass(sale.estado)}`}>
                      {sale.estado || "Sin estado"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{sale.vendedor}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => { setSelectedSaleId(sale.id); setIsDetailModalOpen(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {!isLoading && paginationMetadata && (
        <Card className="border-border/50 shadow-sm">
          <AuditPagination
            metadata={paginationMetadata}
            pageSize={PAGE_SIZE}
            onPageChange={setPageNumber}
            onPageSizeChange={() => {}}
          />
        </Card>
      )}

      <SaleDetailModal
        open={isDetailModalOpen}
        onOpenChange={(v) => { setIsDetailModalOpen(v); if (!v) setSelectedSaleId(null); }}
        saleId={selectedSaleId}
        onSaleAnnulled={loadSales}
      />
    </div>
  );
}
