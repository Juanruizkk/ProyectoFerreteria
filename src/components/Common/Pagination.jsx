import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination — barra de paginación genérica con contador de registros
 * y selector de tamaño de página.
 *
 * Props:
 *   metadata          { pagedIndex, totalPages, totalCount, hasPreviousPage, hasNextPage }
 *   pageSize          number
 *   onPageChange      (page: number) => void
 *   onPageSizeChange  (size: number) => void
 */
export function Pagination({
  metadata,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSize = false,
}) {
  if (!metadata) return null;

  const {
    pagedIndex = 1,
    totalPages = 1,
    totalCount = 0,
    hasPreviousPage = false,
    hasNextPage = false,
  } = metadata;

  const startItem = totalCount === 0 ? 0 : (pagedIndex - 1) * pageSize + 1;
  const endItem = Math.min(pagedIndex * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/20 border-t">
      {/* Contador de registros */}
      <div className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {startItem} - {endItem}
        </span>{" "}
        de{" "}
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        registros
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4">
        {/* Selector de tamaño */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Registros por página:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navegación */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagedIndex - 1)}
            disabled={!hasPreviousPage}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-medium">
              Página {pagedIndex} de {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagedIndex + 1)}
            disabled={!hasNextPage}
            className="gap-1"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
