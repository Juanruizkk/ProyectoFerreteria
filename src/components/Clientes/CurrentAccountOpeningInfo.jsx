import { CalendarDays, CreditCard, DollarSign, User } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
    new Date(dateString)
  );
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

export default function CurrentAccountOpeningInfo({ opening }) {
  if (!opening) return null;

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Apertura de cuenta corriente
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Fecha de apertura</p>
            <p className="font-medium">{formatDate(opening.fecha)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Límite otorgado</p>
            <p className="font-medium">{formatCurrency(opening.limiteCuenta)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Saldo inicial</p>
            <p className="font-medium">{formatCurrency(opening.saldoActual)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Creado por</p>
            <p className="font-medium">{opening.usuarioRegistra || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
