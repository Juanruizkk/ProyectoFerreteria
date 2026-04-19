import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/Common/PageHeader";
import EmptyState from "@/components/Common/EmptyState";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, Plus, AlertCircle, Search, Calendar, Eye } from "lucide-react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import { CartProvider } from "@/contexts/CartContext";
import CreateSaleModal from "./CreateSaleModal";
import SaleDetailModal from "./SaleDetailModal";
import PendingSaleDetailModal from "./PendingSaleDetailModal";
import PermissionGuard from "@/components/PermissionGuard";
import {
  fetchSales,
  fetchPendingSales,
  exportarVentasExcel,
  exportarVentasPdf,
} from "@/services/SaleQueries";
import { AuditPagination } from "@/components/Audit/AuditPagination";
import { toast } from "sonner";

const ESTADO_FILTERS = [
  { label: "Todas",      estadoValue: "",         tab: "todas",      color: "border-primary" },
  { label: "Pendientes", estadoValue: "",         tab: "pendientes", color: "border-orange-500" },
  { label: "Aprobadas",  estadoValue: "aprobado", tab: "todas",      color: "border-green-500" },
  { label: "Rechazadas", estadoValue: "rechazado",tab: "todas",      color: "border-red-500" },
  { label: "Anuladas",   estadoValue: "Anulada",  tab: "todas",      color: "border-gray-400" },
];

export default function Sales() {
  const [activeTab, setActiveTab] = useState("todas");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isPendingDetailModalOpen, setIsPendingDetailModalOpen] = useState(false);
  const [selectedPendingSaleId, setSelectedPendingSaleId] = useState(null);

  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSales, setPendingSales] = useState([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMetadata, setPaginationMetadata] = useState(null);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  const isFirstFilterRender = useRef(true);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const result = await fetchSales(
        pageNumber,
        pageSize,
        searchTerm || null,
        fechaDesde || null,
        fechaHasta || null,
        estadoFilter || null
      );
      const totalPages = result.totalPages ?? 1;
      setSales(result.items || []);
      setPaginationMetadata({
        pagedIndex: pageNumber,
        totalPages,
        totalCount: result.totalCount ?? 0,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
      });
    } catch (err) {
      toast.error("Error al cargar ventas", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingSales = async () => {
    setIsPendingLoading(true);
    try {
      const data = await fetchPendingSales();
      setPendingSales(data || []);
    } catch (err) {
      toast.error("Error al cargar ventas pendientes", { description: err.message });
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Carga inicial de pendientes para el badge
  useEffect(() => {
    loadPendingSales();
  }, []);

  // Carga principal según tab activo
  useEffect(() => {
    if (activeTab === "todas") {
      loadSales();
    } else if (activeTab === "pendientes") {
      loadPendingSales();
    }
  }, [pageNumber, pageSize, activeTab, estadoFilter]);

  // Búsqueda con debounce
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    if (activeTab !== "todas") return;
    const timer = setTimeout(() => {
      if (pageNumber !== 1) setPageNumber(1);
      else loadSales();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fechaDesde, fechaHasta]);

  const handleSaleCreated = () => {
    setIsCreateModalOpen(false);
    loadSales();
  };

  const handlePageChange = (newPage) => setPageNumber(newPage);
  const handlePageSizeChange = (newSize) => { setPageSize(newSize); setPageNumber(1); };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFechaDesde("");
    setFechaHasta("");
    setEstadoFilter("");
    setPageNumber(1);
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const [exportDialog, setExportDialog] = useState(false);
  const [exportType, setExportType] = useState(null); // "excel" | "pdf"
  const [exportDesde, setExportDesde] = useState("");
  const [exportHasta, setExportHasta] = useState("");
  const [exportEstado, setExportEstado] = useState("");
  const [exporting, setExporting] = useState(null);

  const openExportDialog = (type) => {
    setExportType(type);
    setExportDesde(fechaDesde);
    setExportHasta(fechaHasta);
    setExportEstado(estadoFilter || "todos");
    setExportDialog(true);
  };

  const handleExportConfirm = async () => {
    const fn = exportType === "excel" ? exportarVentasExcel : exportarVentasPdf;
    setExporting(exportType);
    try {
      await fn({
        fechaDesde: exportDesde,
        fechaHasta: exportHasta,
        estadoVenta: exportEstado === "todos" ? "" : exportEstado,
      });
      toast.success(exportType === "excel" ? "Excel descargado" : "PDF descargado");
      setExportDialog(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(null);
    }
  };

  const handleFilterClick = (filter) => {
    setActiveTab(filter.tab);
    setEstadoFilter(filter.estadoValue);
    setPageNumber(1);
  };

  const isFilterActive = (filter) =>
    filter.tab === "pendientes"
      ? activeTab === "pendientes"
      : activeTab === "todas" && estadoFilter === filter.estadoValue;

  const handleViewDetail = (saleId) => { setSelectedSaleId(saleId); setIsDetailModalOpen(true); };
  const handleViewPendingDetail = (saleId) => { setSelectedPendingSaleId(saleId); setIsPendingDetailModalOpen(true); };

  const handleViewSaleDetail = (sale) => {
    if (sale.estado && sale.estado.toLowerCase().startsWith("rechazad")) {
      handleViewPendingDetail(sale.id || sale.idVenta);
    } else {
      handleViewDetail(sale.id || sale.idVenta);
    }
  };

  const handlePendingActionCompleted = () => {
    loadPendingSales();
    loadSales();
  };

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
    if (e.startsWith("rechazad") || e.startsWith("anulad") || e === "cancelado") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <CartProvider>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <PageHeader
            icon={<ShoppingCart className="h-8 w-8 text-primary" />}
            title="Ventas"
            description="Gestión de ventas y punto de venta"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => openExportDialog("excel")}>
                    <FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" />
                    Ventas Excel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar listado de ventas a Excel</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => openExportDialog("pdf")}>
                    <FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" />
                    Ventas PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar listado de ventas a PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PermissionGuard permission="VEN_CREATE">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </PermissionGuard>
          </PageHeader>

          {/* Barra de filtros unificada */}
          <div className="grid grid-cols-5 gap-3">
            {ESTADO_FILTERS.map((filter) => {
              const isActive = isFilterActive(filter);
              return (
                <Card
                  key={filter.tab + filter.estadoValue}
                  onClick={() => handleFilterClick(filter)}
                  className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${filter.color} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
                >
                  <CardHeader className="p-1">
                    <CardTitle className="text-lg font-medium flex items-center justify-center gap-1.5">
                      {filter.label}
                      {filter.tab === "pendientes" && pendingSales.length > 0 && (
                        <span className="inline-flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full h-4 min-w-[1rem] px-1">
                          {pendingSales.length}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Filtros de texto/fecha — solo en tab todas */}
          {activeTab === "todas" && (
            <div className="bg-card rounded-lg border p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Buscar por cliente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nombre del cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha desde</label>
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
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha hasta</label>
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
              </div>
              {(searchTerm || fechaDesde || fechaHasta || estadoFilter) && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Banner informativo — solo en pendientes */}
          {activeTab === "pendientes" && (
            <PermissionGuard permission="VEN_READ">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Ventas Pendientes de Autorización</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Estas ventas exceden el límite de crédito del cliente y requieren su autorización.
                      Revise cada venta y apruebe o rechace según corresponda.
                    </p>
                  </div>
                </div>
              </div>
            </PermissionGuard>
          )}

          {/* Tabla ventas (todas / filtradas) */}
          {activeTab === "todas" && (
            <>
              <div className="rounded-md border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[120px]">Código</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Medio de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                          <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <EmptyState
                            icon={ShoppingCart}
                            title={searchTerm || fechaDesde || fechaHasta || estadoFilter
                              ? "No se encontraron ventas con los filtros aplicados"
                              : "No hay ventas registradas"}
                            description={searchTerm || fechaDesde || fechaHasta || estadoFilter
                              ? "Probá ajustando los filtros de búsqueda"
                              : undefined}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{sale.codigoVenta}</TableCell>
                          <TableCell>{formatDate(sale.fecha)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{sale.cliente}</TableCell>
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
                              onClick={() => handleViewSaleDetail(sale)}
                              className="h-8 w-8 p-0"
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

              {!isLoading && paginationMetadata && (
                <Card className="border-border/50 shadow-sm">
                  <AuditPagination
                    metadata={paginationMetadata}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Card>
              )}
            </>
          )}

          {/* Tabla ventas pendientes */}
          {activeTab === "pendientes" && (
            <PermissionGuard permission="VEN_READ">
              <div className="rounded-md border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[120px]">Código</TableHead>
                      <TableHead>Fecha Solicitud</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Excedente</TableHead>
                      <TableHead className="text-center">Días</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPendingLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                          <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto" /></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : pendingSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <EmptyState
                            icon={ShoppingCart}
                            title="No hay ventas pendientes de autorización"
                            description="Las ventas que excedan el límite de crédito aparecerán aquí"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{sale.codigoVenta}</TableCell>
                          <TableCell>{formatDate(sale.fechaRegistro)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{sale.cliente}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{sale.vendedor}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-orange-700 font-semibold">{formatCurrency(sale.excedente)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              sale.diasPendiente > 7 ? "bg-red-100 text-red-800"
                              : sale.diasPendiente > 3 ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {sale.diasPendiente}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeClass(sale.estado)}`}>
                              {sale.estado}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPendingDetail(sale.id)}
                              className="h-8 w-8 p-0"
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
            </PermissionGuard>
          )}

        </div>

        <CreateSaleModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSaleCreated={handleSaleCreated}
        />

        <SaleDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          saleId={selectedSaleId}
          onSaleAnnulled={loadSales}
        />

        <PendingSaleDetailModal
          open={isPendingDetailModalOpen}
          onOpenChange={setIsPendingDetailModalOpen}
          saleId={selectedPendingSaleId}
          onActionCompleted={handlePendingActionCompleted}
        />

        {/* ── Dialog exportación global ───────────────────────────────────── */}
        <Dialog open={exportDialog} onOpenChange={setExportDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {exportType === "pdf"
                  ? <FaFilePdf className="h-4 w-4 text-red-500" />
                  : <FaFileExcel className="h-4 w-4 text-green-600" />}
                Exportar ventas — {exportType === "pdf" ? "PDF" : "Excel"}
              </DialogTitle>
              <DialogDescription>
                Filtrá el período y estado antes de exportar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha desde</label>
                  <Input type="date" value={exportDesde} onChange={(e) => setExportDesde(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha hasta</label>
                  <Input type="date" value={exportHasta} onChange={(e) => setExportHasta(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Estado</label>
                <Select value={exportEstado} onValueChange={setExportEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="aprobado">Aprobadas</SelectItem>
                    <SelectItem value="Anulada">Anuladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialog(false)}>Cancelar</Button>
              <Button onClick={handleExportConfirm} disabled={exporting !== null}>
                {exporting !== null ? "Exportando..." : (
                  exportType === "excel"
                    ? <><FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" /> Exportar Excel</>
                    : <><FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" /> Exportar PDF</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
  );
}
