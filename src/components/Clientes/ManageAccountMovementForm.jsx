import { useState, useEffect } from "react";
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
import { getMovementTypes, registerMovement } from "@/services/CurrentAccountQueries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ManageAccountMovementForm({
  onCancel,
  clientId,
  currentBalance,
  onMovementRegistered
}) {
  const [movementTypes, setMovementTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState(null);
  const [paymentType, setPaymentType] = useState("total"); // "total" or "parcial"
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadMovementTypes();
  }, []);

  useEffect(() => {
    // Auto-fill amount when payment type is "total"
    if (paymentType === "total" && currentBalance && currentBalance > 0) {
      setAmount(currentBalance.toString());
    } else if (paymentType === "parcial") {
      setAmount("");
    }
  }, [paymentType, currentBalance]);

  useEffect(() => {
    // If balance is 0, force payment type to "parcial"
    if (currentBalance === 0) {
      setPaymentType("parcial");
    }
  }, [currentBalance]);

  const loadMovementTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await getMovementTypes();
      setMovementTypes(types);

      // Auto-select "pago_global" if available
      const pagoGlobal = types.find(t => t.nombre === "pago_global");
      if (pagoGlobal) {
        setSelectedType(pagoGlobal);
      }
    } catch (error) {
      toast.error("Error al cargar los tipos de movimiento");
      console.error("Error loading movement types:", error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const getPaymentTypeLabel = () => {
    return paymentType === "total" ? "Pago Total" : "Pago Parcial";
  };

  const generateDetail = () => {
    const formattedAmount = parseFloat(amount).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (currentBalance === 0) {
      return `Pago a favor del cliente - $${formattedAmount}`;
    } else if (paymentType === "total") {
      return `Pago total de cuenta corriente - $${formattedAmount}`;
    } else {
      return `Pago parcial de cuenta corriente - $${formattedAmount}`;
    }
  };

  const validateForm = () => {
    if (!selectedType) {
      toast.error("Debe seleccionar un tipo de movimiento");
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }

    // Only validate against balance if balance > 0
    if (currentBalance > 0 && parseFloat(amount) > currentBalance) {
      toast.error(`El monto no puede ser mayor al saldo actual ($${currentBalance.toLocaleString("es-AR")})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const movementData = {
        idCliente: clientId,
        importe: parseFloat(amount),
        detalle: generateDetail(),
        idTipoMovimiento: selectedType.idTipoMovimiento,
        idVenta: 0, // 0 for global payments (backend expects int, not null)
        idUsuarioRegistra: 1, // TODO: Get from user context
      };

      await registerMovement(movementData);

      toast.success("Movimiento registrado exitosamente");

      // Call callback to refresh movements
      if (onMovementRegistered) {
        onMovementRegistered();
      }

      // Reset form and close
      setPaymentType("total");
      setAmount("");
      onCancel();
    } catch (error) {
      toast.error(error.message || "Error al registrar el movimiento");
      console.error("Error registering movement:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "$0,00";
    return `$${parseFloat(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Cuenta Corriente</CardTitle>
        <CardDescription>
          Registre movimientos en la cuenta corriente del cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingTypes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Balance Info */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Saldo Actual:
                  </span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(currentBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Movement Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="movement-type">Tipo de Movimiento</Label>
              <Select
                value={selectedType?.idTipoMovimiento.toString()}
                onValueChange={(value) => {
                  const type = movementTypes.find(
                    (t) => t.idTipoMovimiento.toString() === value
                  );
                  setSelectedType(type);
                }}
                disabled={submitting}
              >
                <SelectTrigger id="movement-type">
                  <SelectValue placeholder="Seleccione un tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem
                      key={type.idTipoMovimiento}
                      value={type.idTipoMovimiento.toString()}
                      disabled={type.nombre !== "pago_global"}
                    >
                      {type.nombre === "pago_global"
                        ? "Pagar Cuenta"
                        : type.nombre}
                      {type.nombre !== "pago_global" && " (Próximamente)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Description */}
            {selectedType && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Acción: </span>
                    {selectedType.accion}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Payment Type Selection - Only for pago_global */}
            {selectedType && selectedType.nombre === "pago_global" && (
              <>
                {currentBalance === 0 ? (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Nota: </span>
                        El cliente no tiene deuda. Cualquier pago quedará a favor del cliente y aumentará su límite de cuenta corriente.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <Label>Tipo de Pago</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pago-total"
                          name="payment-type"
                          value="total"
                          checked={paymentType === "total"}
                          onChange={(e) => setPaymentType(e.target.value)}
                          disabled={submitting}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor="pago-total"
                          className="font-normal cursor-pointer"
                        >
                          Pago Total - Saldar deuda completa ({formatCurrency(currentBalance)})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pago-parcial"
                          name="payment-type"
                          value="parcial"
                          checked={paymentType === "parcial"}
                          onChange={(e) => setPaymentType(e.target.value)}
                          disabled={submitting}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor="pago-parcial"
                          className="font-normal cursor-pointer"
                        >
                          Pago Parcial - Ingresar monto específico
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {currentBalance === 0
                      ? "Monto a Pagar (a favor del cliente)"
                      : `Monto ${paymentType === "parcial" ? "a Pagar" : "(Auto-calculado)"}`
                    }
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={currentBalance > 0 ? currentBalance : undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting || (currentBalance > 0 && paymentType === "total")}
                    placeholder="Ingrese el monto"
                    required
                  />
                  {currentBalance === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Este monto aumentará el límite de cuenta corriente del cliente
                    </p>
                  ) : (
                    paymentType === "parcial" && (
                      <p className="text-xs text-muted-foreground">
                        Monto máximo: {formatCurrency(currentBalance)}
                      </p>
                    )
                  )}
                </div>

                {/* Preview of generated detail */}
                {amount && parseFloat(amount) > 0 && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <p className="text-sm">
                        <span className="font-semibold">Detalle que se registrará: </span>
                        <span className="text-muted-foreground">
                          {generateDetail()}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || !selectedType}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Movimiento"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
