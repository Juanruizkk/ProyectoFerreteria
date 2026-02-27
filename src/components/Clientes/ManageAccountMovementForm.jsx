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
import { getMovementTypes, registerMovement, getPendingSales } from "@/services/CurrentAccountQueries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [paymentMode, setPaymentMode] = useState("global"); // "global" or "sale"
  const [paymentType, setPaymentType] = useState("total"); // "total" or "parcial"
  const [amount, setAmount] = useState("");

  // Sales payment state
  const [pendingSales, setPendingSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    loadMovementTypes();
  }, []);

  useEffect(() => {
    // Load pending sales when mode is "sale"
    if (paymentMode === "sale") {
      loadPendingSales();
    } else {
      // Reset sale selection when switching to global mode
      setSelectedSale(null);
      setPendingSales([]);
    }
  }, [paymentMode]);

  useEffect(() => {
    // Auto-fill amount when payment type is "total"
    const referenceBalance = paymentMode === "sale" && selectedSale
      ? selectedSale.saldoPendiente
      : currentBalance;

    if (paymentType === "total" && referenceBalance && referenceBalance > 0) {
      setAmount(referenceBalance.toString());
    } else if (paymentType === "parcial") {
      setAmount("");
    }
  }, [paymentType, currentBalance, selectedSale, paymentMode]);

  useEffect(() => {
    // Reset payment type when changing sale
    if (paymentMode === "sale" && selectedSale) {
      setPaymentType("total");
    }
  }, [selectedSale, paymentMode]);

  useEffect(() => {
    // If balance is 0 in global mode, force payment type to "parcial"
    if (paymentMode === "global" && currentBalance === 0) {
      setPaymentType("parcial");
    }
  }, [currentBalance, paymentMode]);

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

  const loadPendingSales = async () => {
    try {
      setLoadingSales(true);
      const sales = await getPendingSales(clientId);
      setPendingSales(sales);

      if (sales.length === 0) {
        toast.info("Este cliente no tiene ventas pendientes de pago");
      }
    } catch (error) {
      toast.error("Error al cargar las ventas pendientes");
      console.error("Error loading pending sales:", error);
    } finally {
      setLoadingSales(false);
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

    if (paymentMode === "sale" && selectedSale) {
      // Payment for specific sale
      if (paymentType === "total") {
        return `Pago total de venta ${selectedSale.codigoVenta} - $${formattedAmount}`;
      } else {
        return `Pago parcial de venta ${selectedSale.codigoVenta} - $${formattedAmount}`;
      }
    } else {
      // Global payment
      if (currentBalance === 0) {
        return `Pago a favor del cliente - $${formattedAmount}`;
      } else if (paymentType === "total") {
        return `Pago total de cuenta corriente - $${formattedAmount}`;
      } else {
        return `Pago parcial de cuenta corriente - $${formattedAmount}`;
      }
    }
  };

  const validateForm = () => {
    if (paymentMode === "sale" && !selectedSale) {
      toast.error("Debe seleccionar una venta para pagar");
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }

    // Validate against the appropriate balance
    if (paymentMode === "sale" && selectedSale) {
      if (parseFloat(amount) > selectedSale.saldoPendiente) {
        toast.error(`El monto no puede ser mayor al saldo pendiente de la venta ($${selectedSale.saldoPendiente.toLocaleString("es-AR")})`);
        return false;
      }
    } else if (paymentMode === "global") {
      // Only validate against balance if balance > 0
      if (currentBalance > 0 && parseFloat(amount) > currentBalance) {
        toast.error(`El monto no puede ser mayor al saldo actual ($${currentBalance.toLocaleString("es-AR")})`);
        return false;
      }
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

      // Determine the movement type ID
      // 6 = PAGO_GLOBAL (global payment)
      // 8 = PAGO_FACTURA (sale-specific payment)
      const tipoMovimiento = paymentMode === "sale" ? 8 : 6;

      const movementData = {
        idCliente: clientId,
        importe: parseFloat(amount),
        detalle: generateDetail(),
        idTipoMovimiento: tipoMovimiento,
        idVenta: paymentMode === "sale" && selectedSale ? selectedSale.idVenta : null,
        idUsuarioRegistra: 1, // TODO: Get from user context
      };

      await registerMovement(movementData);

      toast.success("Movimiento registrado exitosamente");

      // Call callback to refresh movements
      if (onMovementRegistered) {
        onMovementRegistered();
      }

      // Reset form and close
      setPaymentMode("global");
      setPaymentType("total");
      setAmount("");
      setSelectedSale(null);
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

            {/* Payment Mode Selector */}
            <div className="space-y-3">
              <Label>Modo de Pago</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="mode-global"
                    name="payment-mode"
                    value="global"
                    checked={paymentMode === "global"}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    disabled={submitting}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="mode-global"
                    className="font-normal cursor-pointer"
                  >
                    Pago Global - Saldar toda la deuda del cliente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="mode-sale"
                    name="payment-mode"
                    value="sale"
                    checked={paymentMode === "sale"}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    disabled={submitting}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="mode-sale"
                    className="font-normal cursor-pointer"
                  >
                    Pago de Venta Específica - Pagar una factura en particular
                  </Label>
                </div>
              </div>
            </div>

            {/* Sale Selector - Only for sale mode */}
            {paymentMode === "sale" && (
              <div className="space-y-2">
                <Label htmlFor="sale-selector">Seleccionar Venta</Label>
                {loadingSales ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Cargando ventas...</span>
                  </div>
                ) : pendingSales.length === 0 ? (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-yellow-900">
                        No hay ventas pendientes de pago para este cliente.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Select
                      value={selectedSale?.idVenta.toString()}
                      onValueChange={(value) => {
                        const sale = pendingSales.find(
                          (s) => s.idVenta.toString() === value
                        );
                        setSelectedSale(sale);
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger id="sale-selector">
                        <SelectValue placeholder="Seleccione una venta" />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingSales.map((sale) => (
                          <SelectItem
                            key={sale.idVenta}
                            value={sale.idVenta.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {sale.codigoVenta}
                              </Badge>
                              <span className="text-sm">
                                Total: {formatCurrency(sale.totalVenta)} -
                                Pendiente: {formatCurrency(sale.saldoPendiente)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Selected Sale Info */}
                    {selectedSale && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Venta:</span>
                            <Badge variant="outline" className="font-mono">
                              {selectedSale.codigoVenta}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Venta:</span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(selectedSale.totalVenta)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Pagado:</span>
                            <span className="text-sm">
                              {formatCurrency(selectedSale.totalPagado)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-sm font-medium">Saldo Pendiente:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(selectedSale.saldoPendiente)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Payment Type Selection */}
            {((paymentMode === "global") || (paymentMode === "sale" && selectedSale)) && (
              <>
                {paymentMode === "global" && currentBalance === 0 ? (
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
                          Pago Total - Saldar {paymentMode === "sale" ? "venta completa" : "deuda completa"} (
                          {formatCurrency(paymentMode === "sale" ? selectedSale?.saldoPendiente : currentBalance)})
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
                    {paymentMode === "global" && currentBalance === 0
                      ? "Monto a Pagar (a favor del cliente)"
                      : `Monto ${paymentType === "parcial" ? "a Pagar" : "(Auto-calculado)"}`
                    }
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={paymentMode === "sale" ? selectedSale?.saldoPendiente : (currentBalance > 0 ? currentBalance : undefined)}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting || (paymentType === "total")}
                    placeholder="Ingrese el monto"
                    required
                  />
                  {paymentMode === "global" && currentBalance === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Este monto aumentará el límite de cuenta corriente del cliente
                    </p>
                  ) : (
                    paymentType === "parcial" && (
                      <p className="text-xs text-muted-foreground">
                        Monto máximo: {formatCurrency(paymentMode === "sale" ? selectedSale?.saldoPendiente : currentBalance)}
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
              <Button
                type="submit"
                disabled={submitting || (paymentMode === "sale" && !selectedSale)}
              >
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
