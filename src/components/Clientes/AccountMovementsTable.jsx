import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AccountMovementsTable({ movements }) {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "-";
    return `$${amount.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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

  const getTipoMovimientoBadge = (tipo) => {
    const isDebito = tipo?.toLowerCase().includes("débito") || tipo?.toLowerCase().includes("debito");
    return (
      <Badge variant={isDebito ? "destructive" : "default"}>
        {tipo || "-"}
      </Badge>
    );
  };

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay movimientos registrados para esta cuenta corriente.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead className="text-right">Saldo Actual</TableHead>
            <TableHead className="text-right">Límite Cuenta</TableHead>
            <TableHead>Usuario Registra</TableHead>
            <TableHead>Venta Asociada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.idMovimiento}>
              <TableCell>{getTipoMovimientoBadge(movement.tipoMovimiento)}</TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={movement.detalle}>
                  {movement.detalle || "-"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getEstadoBadgeVariant(movement.estado)}>
                  {movement.estado || "-"}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(movement.fecha)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(movement.importe)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(movement.saldoActual)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(movement.limiteCuenta)}
              </TableCell>
              <TableCell>{movement.usuarioRegistra || "-"}</TableCell>
              <TableCell>
                {movement.codigoVenta ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="font-mono">
                      {movement.codigoVenta}
                    </Badge>
                    {movement.totalVenta && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(movement.totalVenta)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}