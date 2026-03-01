import { Fragment, useState } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";

const TIPO_LABELS = {
  alta_cliente: "Apertura",
  movimiento_cc: "Consumo (Venta CC)",
  pago_global: "Pago global",
  pago_factura: "Pago por factura",
  nota_debito: "Nota de débito",
  nota_credito: "Nota de crédito",
  interes_saldo_global: "Interés por mora",
};

const TIPO_BADGE_VARIANT = {
  movimiento_cc: "destructive",
  nota_debito: "destructive",
  pago_global: "default",
  pago_factura: "default",
  nota_credito: "secondary",
};

const getTipoLabel = (tipo) => TIPO_LABELS[tipo] ?? "Movimiento";
const getTipoBadgeVariant = (tipo) => TIPO_BADGE_VARIANT[tipo] ?? "outline";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateString));
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

const getEstadoBadgeVariant = (estado) => {
  switch (estado?.toLowerCase()) {
    case "aprobado":
    case "approved":
      return "default";
    case "pendiente":
    case "pending":
      return "secondary";
    case "rechazado":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

const DETALLE_MAX_LEN = 45;

export default function AccountMovementsTable({ movements, limiteTotal = 0, emptyMessage }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage || "No hay movimientos registrados."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Tipo</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((m) => {
            const isExpanded = expandedRows.has(m.idMovimiento);
            const creditoPost = limiteTotal - m.saldoActual;
            const detalleLargo = m.detalle && m.detalle.length > DETALLE_MAX_LEN;

            return (
              <Fragment key={m.idMovimiento}>
                {/* Fila principal */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(m.idMovimiento)}
                >
                  {/* Chevron expand */}
                  <TableCell className="w-8 pr-0 pl-3">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                  </TableCell>

                  {/* Tipo */}
                  <TableCell>
                    <Badge variant={getTipoBadgeVariant(m.tipoMovimiento)}>
                      {getTipoLabel(m.tipoMovimiento)}
                    </Badge>
                  </TableCell>

                  {/* Detalle con tooltip si es largo */}
                  <TableCell className="max-w-[200px]">
                    {detalleLargo ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block cursor-default text-sm">
                            {m.detalle.slice(0, DETALLE_MAX_LEN)}…
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-normal">
                          {m.detalle}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm">{m.detalle || "-"}</span>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    {m.estado ? (
                      <Badge variant={getEstadoBadgeVariant(m.estado)}>
                        {m.estado}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(m.fecha)}
                  </TableCell>

                  {/* Importe */}
                  <TableCell className="text-right font-medium whitespace-nowrap text-sm">
                    {formatCurrency(m.importe)}
                  </TableCell>

                  {/* Usuario */}
                  <TableCell className="text-sm text-muted-foreground">
                    {m.usuarioRegistra || "-"}
                  </TableCell>

                  {/* Venta */}
                  <TableCell>
                    {m.codigoVenta ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {m.codigoVenta}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>

                {/* Fila expandida */}
                {isExpanded && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={8} className="py-3 px-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">
                            Saldo post-movimiento
                          </p>
                          <p className="font-semibold">{formatCurrency(m.saldoActual)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">
                            Crédito disponible post-mov.
                          </p>
                          <p className="font-semibold">{formatCurrency(creditoPost)}</p>
                        </div>
                        {m.codigoVenta && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-0.5">
                              Detalle de venta
                            </p>
                            <div className="space-y-0.5">
                              <p>
                                <span className="text-muted-foreground">Código: </span>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {m.codigoVenta}
                                </Badge>
                              </p>
                              {m.totalVenta != null && (
                                <p>
                                  <span className="text-muted-foreground">Total: </span>
                                  {formatCurrency(m.totalVenta)}
                                </p>
                              )}
                              {m.fechaVenta && (
                                <p>
                                  <span className="text-muted-foreground">Fecha: </span>
                                  {formatDate(m.fechaVenta)}
                                </p>
                              )}
                              {m.estadoVenta && (
                                <p>
                                  <span className="text-muted-foreground">Estado: </span>
                                  {m.estadoVenta}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
