import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProveedorForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ nombre: "", direccion: "", telefono: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        direccion: initialData.direccion || "",
        telefono: initialData.telefono || "",
      });
    } else {
      setFormData({ nombre: "", direccion: "", telefono: "" });
    }
    setErrors({});
    setApiError(null);
  }, [initialData?.idProveedor]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...(initialData && { idProveedor: initialData.idProveedor }),
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim() || null,
        telefono: formData.telefono.trim() || null,
      };
      await onSubmit(payload);
    } catch (err) {
      const msg = err.message || "Error inesperado";
      if (msg.toLowerCase().includes("nombre")) {
        setErrors((prev) => ({ ...prev, nombre: msg }));
      } else {
        setApiError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Editar Proveedor" : "Nuevo Proveedor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Nombre del proveedor"
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
                placeholder="Ej: 3814123456"
                inputMode="numeric"
                maxLength={15}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
                placeholder="Dirección del proveedor"
              />
            </div>
          </div>

          {apiError && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {apiError}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
