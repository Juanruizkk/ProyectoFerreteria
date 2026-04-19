import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLimitHistory } from "@/services/CurrentAccountQueries";
import { CalendarDays, CreditCard, User, FileText } from "lucide-react";

const formatDate = (d) =>
  d ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)) : "-";

const formatCurrency = (n) =>
  n == null ? "-" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

const TIPO_APERTURA = 2;

export default function LimitHistoryModal({ clientId, open, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getLimitHistory(clientId)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, clientId]);

  const modifications = history.filter((m) => m.idTipoMovimiento !== TIPO_APERTURA);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de límite de cuenta</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin registros.
          </p>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.map((m, i) => {
              const isApertura = m.idTipoMovimiento === TIPO_APERTURA;
              const modIndex = isApertura ? null : modifications.length - modifications.indexOf(m);

              return (
                <li key={m.idMovimiento} className="rounded-lg border p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {isApertura ? "Apertura de cuenta" : `Modificación #${modIndex}`}
                    </span>
                    {i === 0 && !isApertura && (
                      <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                        Actual
                      </span>
                    )}
                    {isApertura && (
                      <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">
                        Límite inicial
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Límite</p>
                        <p className="font-medium">{formatCurrency(m.limiteCuenta)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium">{formatDate(m.fecha)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Registrado por</p>
                        <p className="font-medium">{m.usuarioRegistra || "-"}</p>
                      </div>
                    </div>
                    {isApertura && (
                      <div className="flex items-start gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo inicial</p>
                          <p className="font-medium">{formatCurrency(m.saldoActual)}</p>
                        </div>
                      </div>
                    )}
                    {!isApertura && m.detalle && (
                      <div className="flex items-start gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Motivo</p>
                          <p className="font-medium">{m.detalle}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
