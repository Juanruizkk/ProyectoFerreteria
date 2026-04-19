import { useState } from "react";
import { CalendarDays, CreditCard, DollarSign, User, History, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import LimitHistoryModal from "./LimitHistoryModal";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(dateString));
};

const formatDatetime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dateString));
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
};

export default function CurrentAccountOpeningInfo({ opening, latestLimitModification, clientId }) {
  const [showHistory, setShowHistory] = useState(false);

  if (!opening) return null;

  const hasModification = !!latestLimitModification;

  return (
    <>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {hasModification ? "Última modificación de límite" : "Apertura de cuenta corriente"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(true)}
          >
            <History className="h-3.5 w-3.5" />
            Ver historial
          </Button>
        </div>

        {hasModification ? (
          /* Muestra datos de la última modificación (sin saldo inicial) */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDatetime(latestLimitModification.fecha)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Límite actual</p>
                <p className="font-medium">{formatCurrency(latestLimitModification.limiteCuenta)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Registrado por</p>
                <p className="font-medium">{latestLimitModification.usuarioRegistra || "-"}</p>
              </div>
            </div>
            {latestLimitModification.detalle && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Motivo</p>
                  <p className="font-medium">{latestLimitModification.detalle}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Muestra datos de la apertura (con saldo inicial) */
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
                <p className="text-xs text-muted-foreground">Límite actual</p>
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
        )}
      </div>

      <LimitHistoryModal
        clientId={clientId}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
}
