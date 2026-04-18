import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAccountConfigs } from "@/services/AccountConfigQueries";

export default function CreateAccountForm({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    detalle: "Creación inicial de cuenta corriente",
    limiteCuenta: 0,
    tieneDueda: false,
    saldoActual: "",
  });
  const [accountConfigs, setAccountConfigs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  useEffect(() => {
    loadAccountConfigs();
  }, []);

  const loadAccountConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const configs = await fetchAccountConfigs();
      setAccountConfigs(configs);
    } catch (error) {
      console.error("Error loading account configs:", error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.detalle || formData.detalle.trim() === "") {
      newErrors.detalle = "El detalle es requerido";
    }

    if (formData.limiteCuenta < 0) {
      newErrors.limiteCuenta = "El límite de cuenta no puede ser negativo";
    }

    const saldo = parseFloat(formData.saldoActual);
    if (formData.tieneDueda && (isNaN(saldo) || saldo <= 0)) {
      newErrors.saldoActual = "Si tiene deuda, el saldo actual debe ser mayor a 0";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        saldoActual: parseFloat(formData.saldoActual) || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (value) => {
    const limitValue = parseFloat(value);
    setFormData({
      ...formData,
      limiteCuenta: limitValue,
    });
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen && !loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Cuenta Corriente</DialogTitle>
          <DialogDescription>
            Complete los datos para crear una nueva cuenta corriente para este cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Detalle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de la Cuenta</h3>

            <div className="space-y-2">
              <Label htmlFor="detalle">
                Detalle <span className="text-destructive">*</span>
              </Label>
              <Input
                id="detalle"
                value={formData.detalle}
                onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                placeholder="Descripción de la cuenta corriente"
              />
              {errors.detalle && (
                <p className="text-sm text-destructive">{errors.detalle}</p>
              )}
            </div>

            {/* Límite de Cuenta - Select from configs */}
            <div className="space-y-2">
              <Label htmlFor="limiteCuenta">
                Límite de Cuenta <span className="text-destructive">*</span>
              </Label>
              {loadingConfigs ? (
                <p className="text-sm text-muted-foreground">Cargando configuraciones...</p>
              ) : accountConfigs.length > 0 ? (
                <Select onValueChange={handleLimitChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un límite de cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountConfigs.map((config) => (
                      <SelectItem
                        key={config.idConfig}
                        value={config.montoLimite.toString()}
                      >
                        {config.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="limiteCuenta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limiteCuenta}
                  onChange={(e) =>
                    setFormData({ ...formData, limiteCuenta: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Ingrese el límite de cuenta"
                />
              )}
              {formData.limiteCuenta > 0 && (
                <p className="text-sm text-muted-foreground">
                  Límite seleccionado: ${formData.limiteCuenta.toLocaleString("es-AR")}
                </p>
              )}
              {errors.limiteCuenta && (
                <p className="text-sm text-destructive">{errors.limiteCuenta}</p>
              )}
            </div>
          </div>

          {/* Estado de la Cuenta */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estado de la Cuenta</h3>

            {/* Tiene Deuda */}
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <Label htmlFor="tieneDueda" className="flex-1 cursor-pointer">
                ¿Tiene deuda?
              </Label>
              <Switch
                id="tieneDueda"
                checked={formData.tieneDueda}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, tieneDueda: checked, saldoActual: checked ? formData.saldoActual : "" })
                }
              />
            </div>

            {/* Saldo Actual - Only show if tieneDueda is true */}
            {formData.tieneDueda && (
              <div className="space-y-2">
                <Label htmlFor="saldoActual">
                  Saldo Actual <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="saldoActual"
                  type="text"
                  inputMode="decimal"
                  value={formData.saldoActual}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setFormData({ ...formData, saldoActual: e.target.value })
                  }
                  placeholder="0.00"
                />
                {errors.saldoActual && (
                  <p className="text-sm text-destructive">{errors.saldoActual}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Si tiene deuda, el saldo debe ser mayor a 0
                </p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Cuenta Corriente"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
