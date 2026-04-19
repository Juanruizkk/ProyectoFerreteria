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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, CreditCard, FileText, Tag, MoreHorizontal, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnnulPaymentDialog } from "./AnnulPaymentDialog";
import { getPaymentReceipt } from "@/services/CurrentAccountQueries";

const TIPO_LABELS = {
  alta_cliente: "Apertura",
  movimiento_cc: "Consumo (Venta CC)",
  pago_global: "Pago global",
  pago_parcial: "Pago parcial",
  pago_factura: "Pago por factura",
  nota_debito: "Nota de débito",
  nota_credito: "Nota de crédito",
  interes_saldo_global: "Interés por mora",

  anulacion_pago: "Pago Anulado",
  modificacion_limite: "Modificación de Límite",
};

const TIPO_BADGE_VARIANT = {
  movimiento_cc: "destructive",
  nota_debito: "destructive",
  interes_saldo_global: "destructive",
  anulacion_pago: "destructive",
  pago_global: "default",
  pago_parcial: "default",
  pago_factura: "default",
  nota_credito: "secondary",
  modificacion_limite: "outline",
};

// Tipos que permiten descargar comprobante PDF
const TIPOS_CON_PDF = ["pago_global", "pago_parcial", "pago_factura", "nota_debito", "nota_credito", "anulacion_pago"];

// Tipos que se pueden anular
const TIPOS_ANULABLES = ["pago_global", "pago_parcial", "pago_factura"];

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

const getEstadoPagoBadge = (estadoPago, importe, montoPagado) => {
  if (!estadoPago) return <span className="text-muted-foreground text-sm">—</span>;

  switch (estadoPago) {
    case "pendiente":
      return <Badge variant="destructive">Pendiente</Badge>;
    case "parcial":
      return (
        <div className="space-y-0.5">
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-100">
            Parcial
          </Badge>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(montoPagado)} de {formatCurrency(importe)}
          </p>
        </div>
      );
    case "pagado":
      return (
        <Badge className="bg-green-100 text-green-800 border border-green-300 hover:bg-green-100">
          Pagado
        </Badge>
      );
    case "anulado":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Anulado
        </Badge>
      );
    default:
      return <span className="text-muted-foreground text-sm">—</span>;
  }
};

export default function AccountMovementsTable({
  movements,
  limiteTotal = 0,
  emptyMessage,
  onPayConsumption = () => {},
  onViewReceipt = () => {},
  onMovementsChanged = () => {},
  onPriceAdjustment = () => {},
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [annulTarget, setAnnulTarget] = useState(null);

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenReceipt = async (e, idMovimiento) => {
    e.stopPropagation();
    try {
      const blob = await getPaymentReceipt(idMovimiento);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("No se pudo generar el comprobante.");
    }
  };

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage || "No hay movimientos registrados."}
      </div>
    );
  }

  return (
    <>
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
              <TableHead>Estado pago</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => {
              const isExpanded = expandedRows.has(m.idMovimiento);
              const creditoPost = m.limiteCuenta + Math.max(0, -m.saldoActual);
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={getTipoBadgeVariant(m.tipoMovimiento)}>
                          {getTipoLabel(m.tipoMovimiento)}
                        </Badge>
                        {m.esAnulado && (
                          <Badge variant="outline" className="text-xs text-red-500 border-red-300">
                            Anulado
                          </Badge>
                        )}
                      </div>
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

                    {/* Estado de pago */}
                    <TableCell>
                      {m.tipoMovimiento === "movimiento_cc"
                        ? getEstadoPagoBadge(m.estadoPago, m.importe, m.montoPagado)
                        : <span className="text-muted-foreground text-sm">—</span>
                      }
                    </TableCell>

                    {/* Acción */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Consumos: Comprobante / Pagar / Ajuste de precio */}
                          {m.tipoMovimiento === "movimiento_cc" && (
                            <>
                              {m.estadoPago === "pagado" ? (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewReceipt(m); }}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Comprobante
                                </DropdownMenuItem>
                              ) : (m.estadoPago === "pendiente" || m.estadoPago === "parcial") ? (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPayConsumption(m); }}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pagar Consumo
                                </DropdownMenuItem>
                              ) : null}
                              
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPriceAdjustment(m); }}>
                                <Tag className="h-4 w-4 mr-2" />
                                Ajuste de precio
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Pagos y ajustes con PDF: Ver comprobante */}
                          {TIPOS_CON_PDF.includes(m.tipoMovimiento) && (
                            <DropdownMenuItem onClick={(e) => handleOpenReceipt(e, m.idMovimiento)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Comprobante
                            </DropdownMenuItem>
                          )}

                          {/* Pagos anulables: Anular pago */}
                          {TIPOS_ANULABLES.includes(m.tipoMovimiento) && !m.esAnulado && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnnulTarget(m);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Anular pago
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Fila expandida */}
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={10} className="py-3 px-6">
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
                          {m.tipoMovimiento === "nota_debito" && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                                Motivo
                              </p>
                              <p className="font-semibold">{m.motivoNd ?? "—"}</p>
                            </div>
                          )}
                          {m.tipoMovimiento === "nota_credito" && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                                Motivo
                              </p>
                              <p className="font-semibold">{m.motivoNc ?? "—"}</p>
                            </div>
                          )}
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

      <AnnulPaymentDialog
        open={annulTarget !== null}
        onClose={() => setAnnulTarget(null)}
        movimiento={annulTarget}
        onSuccess={onMovementsChanged}
      />
    </>
  );
}
