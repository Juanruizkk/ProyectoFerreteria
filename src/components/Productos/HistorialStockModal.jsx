import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { History, Package } from "lucide-react";
import { toast } from "sonner";
import PaginationControls from "@/components/Common/PaginationControls";
import { fetchTiposMovimientoStock, fetchHistorialStock } from "@/services/StockMovementQueries";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";

const PAGE_SIZE = 10;

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
        <TableCell key={j}>
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export default function HistorialStockModal({ open, producto, onClose }) {
  const { formatCantidad } = useUnidadesMedida();
  const [tipos, setTipos] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [pageIndex, setPageIndex] = useState(1);
  const [movimientos, setMovimientos] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar tipos una sola vez al abrir
  useEffect(() => {
    if (!open) return;
    fetchTiposMovimientoStock()
      .then(setTipos)
      .catch(() => toast.error("Error al cargar tipos de movimiento"));
  }, [open]);

  // Cargar historial cuando cambia producto, página o filtro
  useEffect(() => {
    if (!open || !producto?.id) return;
    let cancelled = false;

    const cargar = async () => {
      try {
        setLoading(true);
        const data = await fetchHistorialStock(
          producto.id,
          pageIndex,
          PAGE_SIZE,
          tipoFiltro !== "todos" ? Number(tipoFiltro) : null
        );
        if (cancelled) return;
        setMovimientos(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        if (!cancelled) toast.error("Error al cargar el historial de stock");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargar();
    return () => { cancelled = true; };
  }, [open, producto?.id, pageIndex, tipoFiltro]);

  const handleTipoChange = (val) => {
    setTipoFiltro(val);
    setPageIndex(1);
  };

  const handleClose = () => {
    setTipoFiltro("todos");
    setPageIndex(1);
    setMovimientos([]);
    onClose();
  };

  const formatFecha = (fechaStr) => {
    try {
      return format(new Date(fechaStr), "dd/MM/yyyy HH:mm");
    } catch {
      return fechaStr ?? "—";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Historial de Stock —{" "}
            <span className="font-semibold">{producto?.nombre}</span>
          </DialogTitle>

          {/* Stock actual */}
          <div className="flex items-center gap-2 pt-1">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Stock actual:</span>
            <Badge
              variant="outline"
              className={
                (producto?.stock ?? 0) === 0
                  ? "border-red-400 text-red-600"
                  : (producto?.stock ?? 0) <= (producto?.stockMinimo ?? 0)
                  ? "border-amber-400 text-amber-600"
                  : "border-green-400 text-green-600"
              }
            >
              {producto?.stock ?? 0} unidades
            </Badge>
          </div>
        </DialogHeader>

        {/* Filtro tipo */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por tipo:</span>
          <Select value={tipoFiltro} onValueChange={handleTipoChange}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t.idTipoMovimientoStock} value={String(t.idTipoMovimientoStock)}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border mt-3 overflow-y-auto max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[14%]">Fecha</TableHead>
                <TableHead className="w-[20%]">Tipo</TableHead>
                <TableHead className="w-[10%] text-center">Stock Anterior</TableHead>
                <TableHead className="w-[10%] text-center">Cantidad</TableHead>
                <TableHead className="w-[10%] text-center">Stock Final</TableHead>
                <TableHead className="w-[22%]">Referencia / Motivo</TableHead>
                <TableHead className="w-[14%]">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows />
              ) : movimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No se encontraron movimientos.
                  </TableCell>
                </TableRow>
              ) : (
                movimientos.map((m) => {
                  const esPositivo = m.cantidad > 0;
                  return (
                    <TableRow key={m.idMovimiento} className="hover:bg-muted/30 transition-colors">
                      {/* Fecha */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFecha(m.fecha)}
                      </TableCell>

                      {/* Tipo badge */}
                      <TableCell>
                        <Badge variant={esPositivo ? "default" : "destructive"} className="text-xs">
                          {m.tipoMovimiento ?? "—"}
                        </Badge>
                      </TableCell>

                      {/* Stock anterior */}
                      <TableCell className="text-center text-muted-foreground">
                        {formatCantidad(m.stockAnterior, producto?.idUnidadMedida)}
                      </TableCell>

                      {/* Cantidad */}
                      <TableCell className="text-center font-semibold">
                        <span className={esPositivo ? "text-green-600" : "text-red-600"}>
                          {esPositivo ? "+" : ""}{formatCantidad(m.cantidad, producto?.idUnidadMedida)}
                        </span>
                      </TableCell>

                      {/* Stock resultante */}
                      <TableCell className="text-center font-bold">
                        {formatCantidad(m.stockResultante, producto?.idUnidadMedida)}
                      </TableCell>

                      {/* Referencia / Motivo */}
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {m.referencia ? (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block cursor-default">
                                  {m.referencia}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                {m.referencia}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : "—"}
                      </TableCell>

                      {/* Usuario */}
                      <TableCell className="text-xs text-muted-foreground">
                        {m.usuario ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {!loading && movimientos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-sm text-muted-foreground">
              Página {pageIndex} de {totalPages} • {totalCount} movimiento{totalCount !== 1 ? "s" : ""}
            </span>
            <PaginationControls
              currentPage={pageIndex}
              totalPages={totalPages}
              onPageChange={setPageIndex}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
