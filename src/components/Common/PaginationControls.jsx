// src/components/ui/pagination-controls.jsx
"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function PaginationControls({ 
  pageIndex, 
  totalPages, 
  hasPrev, 
  hasNext, 
  onPageChange 
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex - 1)}
        disabled={!hasPrev}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Página <strong>{pageIndex}</strong> de <strong>{totalPages}</strong>
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex + 1)}
        disabled={!hasNext}
        className="gap-2"
      >
        Siguiente
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
