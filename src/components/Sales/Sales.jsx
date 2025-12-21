import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, AlertCircle, Search, Calendar, Eye, Loader2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGroups } from "@/config/permissions";
import { CartProvider } from "@/contexts/CartContext";
import CreateSaleModal from "./CreateSaleModal";
import SaleDetailModal from "./SaleDetailModal";
import PendingSaleDetailModal from "./PendingSaleDetailModal";
import PermissionGuard from "@/components/PermissionGuard";
import { fetchSales, fetchPendingSales } from "@/services/SaleQueries";
import { AuditPagination } from "@/components/Audit/AuditPagination";
import { toast } from "sonner";

export default function Sales() {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState("todas");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [isPendingDetailModalOpen, setIsPendingDetailModalOpen] = useState(false);
  const [selectedPendingSaleId, setSelectedPendingSaleId] = useState(null);

  // Estado para las ventas
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para las ventas pendientes
  const [pendingSales, setPendingSales] = useState([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  // Estado para paginación
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMetadata, setPaginationMetadata] = useState(null);

  // Estado para filtros
  const [clienteFilter, setClienteFilter] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const canCreate = hasPermission(PermissionGroups.SALES.permissions.CREATE);

  // Cargar ventas
  const loadSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSales(
        pageNumber,
        pageSize,
        searchTerm || null,
        fechaDesde || null,
        fechaHasta || null
      );
      console.log("Ventas recibidas:", result.items); // Debug
      setSales(result.items || []);
      setPaginationMetadata({
        pagedIndex: result.pagedIndex,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasPreviousPage: result.hasPreviousPage,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      setError(err.message);
      toast.error("Error al cargar ventas", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ventas pendientes
  const loadPendingSales = async () => {
    setIsPendingLoading(true);
    try {
      const data = await fetchPendingSales();
      setPendingSales(data || []);
    } catch (err) {
      toast.error("Error al cargar ventas pendientes", {
        description: err.message,
      });
    } finally {
      setIsPendingLoading(false);
    }
  };

  // Cargar ventas al montar y cuando cambien los filtros o paginación
  useEffect(() => {
    if (activeTab === "todas") {
      loadSales();
    } else if (activeTab === "pendientes") {
      loadPendingSales();
    }
  }, [pageNumber, pageSize, activeTab]);

  // Aplicar búsqueda con debounce
  useEffect(() => {
    if (activeTab === "todas") {
      const timer = setTimeout(() => {
        setPageNumber(1); // Reset a la primera página al buscar
        loadSales();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, fechaDesde, fechaHasta]);

  const handleSaleCreated = () => {
    setIsCreateModalOpen(false);
    loadSales(); // Recargar la lista después de crear una venta
  };

  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPageNumber(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFechaDesde("");
    setFechaHasta("");
    setPageNumber(1);
  };

  const handleViewDetail = (saleId) => {
    setSelectedSaleId(saleId);
    setIsDetailModalOpen(true);
  };

  const handleViewPendingDetail = (pendingSaleId) => {
    setSelectedPendingSaleId(pendingSaleId);
    setIsPendingDetailModalOpen(true);
  };

  // Función para manejar el clic en "Ver detalle" según el tipo de venta
  const handleViewSaleDetail = (sale) => {
    // Si la venta está rechazada, abrir modal de venta pendiente
    if (sale.estado && sale.estado.toLowerCase().includes("rechazada")) {
      handleViewPendingDetail(sale.id || sale.idVenta);
    } else {
      // Caso normal: abrir modal de venta completada
      handleViewDetail(sale.id || sale.idVenta);
    }
  };

  const handlePendingActionCompleted = () => {
    loadPendingSales(); // Recargar la lista de ventas pendientes
    loadSales(); // Recargar también el tab "Todas" (para mostrar ventas rechazadas)
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

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeClass = (estado) => {
    if (!estado) return "bg-gray-100 text-gray-800";

    const estadoLower = estado.toLowerCase();

    // Verde para completadas y aprobadas
    if (estadoLower.includes("completada") || estadoLower.includes("aprobada")) {
      return "bg-green-100 text-green-800";
    }

    // Rojo para rechazadas
    if (estadoLower.includes("rechazada")) {
      return "bg-red-100 text-red-800";
    }

    // Amarillo para pendientes
    if (estadoLower.includes("pendiente")) {
      return "bg-yellow-100 text-yellow-800";
    }

    // Gris por defecto
    return "bg-gray-100 text-gray-800";
  };

  return (
    <CartProvider>
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Ventas</h1>
                <p className="text-muted-foreground">
                  Gestión de ventas y punto de venta
                </p>
              </div>
            </div>
            <PermissionGuard permission="VEN_CREATE">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Button>
            </PermissionGuard>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="todas">Todas las Ventas</TabsTrigger>
              <TabsTrigger value="pendientes">Ventas Pendientes</TabsTrigger>
            </TabsList>

            {/* Tab Todas las Ventas */}
            <TabsContent value="todas" className="space-y-4">
              {/* Filtros */}
              <div className="bg-card rounded-lg border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Búsqueda por cliente */}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">
                      Buscar por cliente
                    </label>
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

                  {/* Fecha desde */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Fecha desde
                    </label>
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

                  {/* Fecha hasta */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Fecha hasta
                    </label>
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

                {/* Botón limpiar filtros */}
                {(searchTerm || fechaDesde || fechaHasta) && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </div>

              {/* Tabla de ventas */}
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      // Estado de carga
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
                      // Sin resultados
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            {searchTerm || fechaDesde || fechaHasta
                              ? "No se encontraron ventas con los filtros aplicados"
                              : "No hay ventas registradas"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Datos
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.codigoVenta}
                          </TableCell>
                          <TableCell>
                            {formatDate(sale.fecha)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {sale.cliente}
                          </TableCell>
                          <TableCell>
                            {sale.medioPago}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeClass(sale.estado)}`}
                            >
                              {sale.estado || "Sin estado"}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {sale.vendedor}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(sale.total)}
                          </TableCell>
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

              {/* Paginación */}
              {!isLoading && paginationMetadata && (
                <AuditPagination
                  metadata={paginationMetadata}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </TabsContent>

            {/* Tab Ventas Pendientes */}
            <TabsContent value="pendientes" className="space-y-4">
              <PermissionGuard permission="SALE_AUTHORIZE">
                {/* Alerta informativa */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-900">
                        Ventas Pendientes de Autorización
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Estas ventas exceden el límite de crédito del cliente y requieren su autorización.
                        Revise cada venta y apruebe o rechace según corresponda.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla de ventas pendientes */}
                <div className="rounded-md border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                        // Estado de carga
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
                        // Sin resultados
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground font-medium">
                              No hay ventas pendientes de autorización
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Las ventas que excedan el límite de crédito aparecerán aquí
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        // Datos
                        pendingSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">
                              {sale.codigoVenta}
                            </TableCell>
                            <TableCell>
                              {formatDate(sale.fechaRegistro)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {sale.cliente}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {sale.vendedor}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-orange-700 font-semibold">
                                {formatCurrency(sale.excedente)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                sale.diasPendiente > 7
                                  ? "bg-red-100 text-red-800"
                                  : sale.diasPendiente > 3
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {sale.diasPendiente}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  sale.estado === "Pendiente"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : sale.estado === "Aprobada"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal de crear venta */}
        <CreateSaleModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSaleCreated={handleSaleCreated}
        />

        {/* Modal de detalle de venta */}
        <SaleDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          saleId={selectedSaleId}
        />

        {/* Modal de detalle de venta pendiente con aprobación/rechazo */}
        <PendingSaleDetailModal
          open={isPendingDetailModalOpen}
          onOpenChange={setIsPendingDetailModalOpen}
          saleId={selectedPendingSaleId}
          onActionCompleted={handlePendingActionCompleted}
        />
      </div>
    </CartProvider>
  );
}
