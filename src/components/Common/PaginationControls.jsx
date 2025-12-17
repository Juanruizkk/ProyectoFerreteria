import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange
}) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="gap-2"
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
