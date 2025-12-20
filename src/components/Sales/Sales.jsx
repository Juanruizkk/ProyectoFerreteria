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
import PermissionGuard from "@/components/PermissionGuard";
import { fetchSales } from "@/services/SaleQueries";
import { AuditPagination } from "@/components/Audit/AuditPagination";
import { toast } from "sonner";

export default function Sales() {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState("todas");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  // Estado para las ventas
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Cargar ventas al montar y cuando cambien los filtros o paginación
  useEffect(() => {
    if (activeTab === "todas") {
      loadSales();
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
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sale.estado === "Completada"
                                  ? "bg-green-100 text-green-800"
                                  : sale.estado === "Pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sale.estado}
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
                              onClick={() => handleViewDetail(sale.id)}
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
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
                <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-orange-900">
                  Ventas Pendientes de Autorización
                </h3>
                <p className="text-orange-700 mb-4">
                  Aquí se mostrarán las ventas que exceden el límite de crédito y requieren autorización
                </p>
                <p className="text-sm text-orange-600">
                  Funcionalidad disponible cuando se implementen los endpoints correspondientes en el backend
                </p>
              </div>
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
      </div>
    </CartProvider>
  );
}
