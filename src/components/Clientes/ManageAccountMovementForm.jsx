import { useState, useEffect, useCallback } from "react";
import { usePermission } from "@/hooks/usePermission";
import { getCurrentUser } from "@/services/AuthService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  registerMovement,
  registerDebitNote,
  getDebitNoteReasons,
} from "@/services/CurrentAccountQueries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  Banknote,
  TrendingUp,
  FileMinus,
  SlidersHorizontal,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = {
  GLOBAL: "global",
  PARCIAL: "parcial",
  FAVOR: "favor",
  NOTA_DEBITO: "nota_debito",
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

const ACTION_CARDS = [
  {
    mode: MODES.GLOBAL,
    icon: CreditCard,
    title: "Pago global",
    description: "Salda el total de la deuda en un solo pago.",
    activeWhen: (balance) => balance > 0,
    disabledReason: "El cliente no tiene deuda",
  },
  {
    mode: MODES.PARCIAL,
    icon: Banknote,
    title: "Pago parcial",
    description: "Ingresá el monto que querés abonar.",
    activeWhen: (balance) => balance > 0,
    disabledReason: "El cliente no tiene deuda",
  },
  {
    mode: MODES.FAVOR,
    icon: TrendingUp,
    title: "Pago a favor",
    description: "Acreditá saldo a favor del cliente.",
    activeWhen: (balance) => balance <= 0,
    disabledReason: "El cliente tiene deuda pendiente",
  },
  {
    mode: MODES.NOTA_DEBITO,
    icon: FileMinus,
    title: "Nota de Débito",
    description: "Aplicá un cargo adicional a la cuenta.",
    activeWhen: () => true,
    disabledReason: null,
  },
];

export default function ManageAccountMovementForm({
  open,
  onClose,
  clientId,
  currentBalance,
  limiteTotal,
  onMovementRegistered,
  onModificarLimite,
}) {
  const { hasPermission } = usePermission();
  const [selectedMode, setSelectedMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Estado para pagos
  const [amount, setAmount] = useState("");

  // Estado para Nota de Débito
  const [motivos, setMotivos] = useState([]);
  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [importeND, setImporteND] = useState("");
  const [detalleND, setDetalleND] = useState("");

  // Auto-fill amount cuando se selecciona pago global
  useEffect(() => {
    if (selectedMode === MODES.GLOBAL) {
      setAmount(currentBalance.toString());
    } else if (selectedMode !== MODES.PARCIAL && selectedMode !== MODES.FAVOR) {
      setAmount("");
    }
  }, [selectedMode]);

  // Cargar motivos cuando se selecciona Nota de Débito (solo categoría "general")
  useEffect(() => {
    if (selectedMode === MODES.NOTA_DEBITO && motivos.length === 0) {
      const load = async () => {
        try {
          setLoadingMotivos(true);
          const data = await getDebitNoteReasons(true, "general");
          setMotivos(data || []);
        } catch {
          toast.error("No se pudieron cargar los motivos de nota de débito.");
        } finally {
          setLoadingMotivos(false);
        }
      };
      load();
    }
  }, [selectedMode]);

  const generateDetail = () => {
    const parsed = parseFloat(amount);
    const formatted = parsed.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (selectedMode === MODES.FAVOR) {
      return `Pago a favor del cliente - $${formatted}`;
    }
    if (selectedMode === MODES.PARCIAL) {
      return `Pago parcial de cuenta corriente - $${formatted}`;
    }
    if (parsed >= currentBalance) {
      return `Pago total de cuenta corriente - $${formatted}`;
    }
    return `Pago parcial de cuenta corriente - $${formatted}`;
  };

  const getGlobalAmountHint = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return null;

    if (parsed > currentBalance) {
      const aFavor = parsed - currentBalance;
      return {
        text: `Salda la deuda completa y deja ${formatCurrency(aFavor)} a favor`,
        color: "text-green-600",
      };
    }
    if (parsed === currentBalance) {
      return { text: "Salda la deuda completa", color: "text-primary" };
    }
    const resta = currentBalance - parsed;
    return {
      text: `Pago parcial — quedará una deuda de ${formatCurrency(resta)}`,
      color: "text-yellow-600",
    };
  };

  const validatePayment = () => {
    const parsed = parseFloat(amount);
    if (!amount || parsed <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }
    if (selectedMode === MODES.PARCIAL && parsed >= currentBalance) {
      toast.error(
        `El monto parcial debe ser menor al saldo actual (${formatCurrency(currentBalance)})`
      );
      return false;
    }
    return true;
  };

  const validateND = () => {
    if (!selectedMotivo) {
      toast.error("Seleccioná un motivo para la nota de débito.");
      return false;
    }
    const parsed = parseFloat(importeND);
    if (!importeND || parsed <= 0) {
      toast.error("El importe debe ser mayor que 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMode === MODES.NOTA_DEBITO) {
      if (!validateND()) return;
      try {
        setSubmitting(true);
        await registerDebitNote({
          idCliente: clientId,
          importe: parseFloat(importeND),
          idMotivo: parseInt(selectedMotivo),
          detalleAdicional: detalleND.trim() || null,
          idVenta: null,
          idUsuarioRegistra: getCurrentUser()?.userId,
        });
        toast.success("Nota de débito registrada exitosamente.");
        onMovementRegistered?.();
        onClose();
      } catch (error) {
        toast.error(error.message || "Error al registrar la nota de débito.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!validatePayment()) return;
    try {
      setSubmitting(true);
      await registerMovement({
        idCliente: clientId,
        importe: parseFloat(amount),
        detalle: generateDetail(),
        idTipoMovimiento: selectedMode === MODES.PARCIAL ? 11 : 6, // 11 = PAGO_PARCIAL, 6 = PAGO_GLOBAL / PAGO_A_FAVOR
        idVenta: 0,
        idUsuarioRegistra: 1, // TODO: reemplazar con auth real
      });
      toast.success("Movimiento registrado exitosamente");
      onMovementRegistered?.();
      onClose();
    } catch (error) {
      toast.error(error.message || "Error al registrar el movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMode = (mode) => {
    setSelectedMode((prev) => (prev === mode ? null : mode));
  };

  const handleCancelForm = useCallback(() => {
    setSelectedMode(null);
    setAmount("");
    setSelectedMotivo("");
    setImporteND("");
    setDetalleND("");
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen && !submitting) {
      handleCancelForm();
      onClose();
    }
  };

  const globalHint = selectedMode === MODES.GLOBAL ? getGlobalAmountHint() : null;
  const nuevoSaldoEstimadoND = currentBalance + parseFloat(importeND || 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Cuenta Corriente</DialogTitle>
          <DialogDescription>Seleccioná el tipo de movimiento a registrar</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
        {/* Saldo actual + Modificar Límite */}
        <div className="flex justify-between items-center rounded-lg border bg-muted/40 px-4 py-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-muted-foreground">Saldo actual</span>
            {limiteTotal !== undefined && (
              <p className="text-xs text-muted-foreground">Límite total: {formatCurrency(limiteTotal)}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xl font-bold",
                currentBalance > 0
                  ? "text-destructive"
                  : currentBalance < 0
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            >
              {formatCurrency(currentBalance)}
            </span>
            {onModificarLimite && hasPermission("CC_MANAGE") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { onClose(); onModificarLimite(); }}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Modificar límite
              </Button>
            )}
          </div>
        </div>

        {/* Cards de acción */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACTION_CARDS.map(({ mode, icon: Icon, title, description, activeWhen, disabledReason }) => {
            const disabled = !activeWhen(currentBalance);
            const isSelected = selectedMode === mode;

            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectMode(mode)}
                className={cn(
                  "text-left rounded-lg border p-4 transition-all",
                  disabled
                    ? "cursor-not-allowed opacity-40 bg-muted/20"
                    : "cursor-pointer hover:border-primary/50 hover:bg-muted/30",
                  isSelected && !disabled
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-primary" : ""
                    )}
                  >
                    {title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {disabled ? disabledReason : description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Formulario: pago */}
        {selectedMode && selectedMode !== MODES.NOTA_DEBITO && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {selectedMode === MODES.GLOBAL
                  ? "Monto (saldo total)"
                  : selectedMode === MODES.PARCIAL
                  ? "Monto a pagar"
                  : "Monto a acreditar a favor"}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting || selectedMode === MODES.GLOBAL}
                placeholder="Ingrese el monto"
                required
                autoFocus={selectedMode !== MODES.GLOBAL}
              />

              {globalHint && (
                <p className={cn("text-xs font-medium", globalHint.color)}>
                  {globalHint.text}
                </p>
              )}

              {selectedMode === MODES.PARCIAL && (
                <p className="text-xs text-muted-foreground">
                  Máximo: {formatCurrency(currentBalance)}
                </p>
              )}
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">Detalle: </span>
                <span className="text-muted-foreground">{generateDetail()}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Volver
              </Button>
            </div>
          </form>
        )}

        {/* Formulario: Nota de Débito */}
        {selectedMode === MODES.NOTA_DEBITO && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            {currentBalance <= 0 && (
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  El cliente no tiene deuda activa. La nota de débito generará una nueva deuda.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nd-motivo">Motivo</Label>
              {loadingMotivos ? (
                <p className="text-sm text-muted-foreground">Cargando motivos...</p>
              ) : motivos.length === 0 ? (
                <p className="text-sm text-destructive">
                  No hay motivos activos disponibles. Configurá uno en la sección de Configuración de CC.
                </p>
              ) : (
                <Select
                  value={selectedMotivo}
                  onValueChange={setSelectedMotivo}
                  disabled={submitting}
                >
                  <SelectTrigger id="nd-motivo">
                    <SelectValue placeholder="Seleccionar motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {motivos.map((m) => (
                      <SelectItem key={m.idMotivo} value={String(m.idMotivo)}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nd-importe">Importe</Label>
              <Input
                id="nd-importe"
                type="number"
                step="0.01"
                min="0.01"
                value={importeND}
                onChange={(e) => setImporteND(e.target.value)}
                disabled={submitting}
                placeholder="Ingresá el importe"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nd-detalle">Detalle adicional (opcional)</Label>
              <Input
                id="nd-detalle"
                type="text"
                value={detalleND}
                onChange={(e) => setDetalleND(e.target.value)}
                disabled={submitting}
                placeholder="Descripción adicional (opcional)"
              />
            </div>

            {importeND && parseFloat(importeND) > 0 && (
              <div className="rounded-md bg-muted/30 px-3 py-2 text-sm space-y-0.5">
                <span className="font-medium">Efecto estimado: </span>
                <span className="text-muted-foreground">
                  {formatCurrency(currentBalance)}
                  {" → "}
                  <span
                    className={cn(
                      "font-semibold",
                      nuevoSaldoEstimadoND > 0 ? "text-destructive" : "text-green-600"
                    )}
                  >
                    {formatCurrency(nuevoSaldoEstimadoND)}
                  </span>
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting || loadingMotivos || motivos.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar nota de débito"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Volver
              </Button>
            </div>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
