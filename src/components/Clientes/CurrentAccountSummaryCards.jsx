import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    amount
  );

export default function CurrentAccountSummaryCards({
  deudaActual,
  creditoDisponible,
  saldoAFavor,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Deuda actual */}
      <Card className={cn(deudaActual > 0 && "border-destructive/40")}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deuda actual
              </p>
              <p
                className={cn(
                  "text-2xl font-bold mt-1",
                  deudaActual > 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {formatCurrency(deudaActual)}
              </p>
            </div>
            <TrendingDown
              className={cn(
                "h-8 w-8",
                deudaActual > 0
                  ? "text-destructive/50"
                  : "text-muted-foreground/30"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Crédito disponible */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Crédito disponible
              </p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(creditoDisponible)}
              </p>
            </div>
            <Shield className="h-8 w-8 text-muted-foreground/30" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo a favor */}
      <Card className={cn(saldoAFavor > 0 && "border-green-500/40")}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Saldo a favor
              </p>
              <p
                className={cn(
                  "text-2xl font-bold mt-1",
                  saldoAFavor > 0 ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {formatCurrency(saldoAFavor)}
              </p>
            </div>
            <TrendingUp
              className={cn(
                "h-8 w-8",
                saldoAFavor > 0
                  ? "text-green-500/50"
                  : "text-muted-foreground/30"
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
