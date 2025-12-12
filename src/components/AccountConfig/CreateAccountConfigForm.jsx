import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateAccountConfigForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    montoLimite: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre || formData.nombre.trim() === "") {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.montoLimite || formData.montoLimite === "") {
      newErrors.montoLimite = "El monto límite es requerido";
    } else if (parseFloat(formData.montoLimite) <= 0) {
      newErrors.montoLimite = "El monto límite debe ser mayor a 0";
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
        nombre: formData.nombre.trim(),
        montoLimite: parseFloat(formData.montoLimite),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Configuración de Cuenta Corriente</CardTitle>
        <CardDescription>
          Complete los datos para crear una nueva configuración de cuenta corriente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Bronze, Silver, Gold"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoLimite">
              Monto Límite <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montoLimite"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.montoLimite}
              onChange={(e) =>
                setFormData({ ...formData, montoLimite: e.target.value })
              }
              placeholder="Ingrese el monto límite"
            />
            {errors.montoLimite && (
              <p className="text-sm text-destructive">{errors.montoLimite}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Configuración"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
