import { useState, useEffect } from "react";
import { AuditFilters } from "./AuditFilters";
import { AuditTable } from "./AuditTable";
import { AuditChangesModal } from "./AuditChangesModal";
import { AuditPagination } from "./AuditPagination";
import { searchAudit } from "@/services/AuditQueries";
import { Card } from "@/components/ui/card";
import { History } from "lucide-react";
import { toast } from "sonner";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";

export default function AuditPage() {
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAuditData = async (searchFilters = {}) => {
    setIsLoading(true);

    try {
      const params = {
        pageIndex,
        pageSize,
        ...searchFilters,
      };

      const response = await searchAudit(params);

      setData(response.items || []);
      setMetadata({
        pagedIndex: response.pagedIndex || 1,
        pageSize: response.pageSize || 10,
        totalPages: response.totalPages || 0,
        totalCount: response.totalCount || 0,
        hasPreviousPage: response.hasPrevioPage || false,
        hasNextPage: response.hasNextPage || false,
      });
    } catch (err) {
      toast.error("Error al cargar auditoría: " + err.message);
      setData([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData(filters);
  }, [pageIndex, pageSize]);

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
    setPageIndex(1);
    fetchAuditData(searchFilters);
  };

  const handleClear = () => {
    setFilters({});
    setPageIndex(1);
    setPageSize(10);
    fetchAuditData({});
  };

  const handlePageChange = (newPage) => {
    setPageIndex(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPageIndex(1);
  };

  const handleViewChanges = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <PermissionGuard
      permission="HIS_VIEW"
      fallback={<AccessDenied moduleName="el módulo de auditoría" />}
    >
      <div className="mx-auto max-w-7xl w-full flex flex-col gap-6 px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
            <p className="text-muted-foreground">
              Historial completo de cambios en el sistema
            </p>
          </div>
        </div>

      {/* Filtros */}
      <AuditFilters
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {/* Loading state */}
      {isLoading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Cargando registros de auditoría...
            </p>
          </div>
        </Card>
      )}

      {/* Tabla y paginación */}
      {!isLoading && (
        <div className="space-y-4">
          <AuditTable data={data} onViewChanges={handleViewChanges} />

          {metadata && metadata.totalCount > 0 && (
            <Card className="border-border/50 shadow-sm">
              <AuditPagination
                metadata={metadata}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </Card>
          )}
        </div>
      )}

        {/* Modal de cambios */}
        <AuditChangesModal
          item={selectedItem}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </PermissionGuard>
  );
}
