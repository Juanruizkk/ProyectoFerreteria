import { useEffect, useState } from "react";
import { changePassword } from "../../services/UsersQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UserChangePasswordForm({
  open,
  onOpenChange,
  user,
  onSaved,
}) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ newPassword: "", confirmPassword: "" });
    setErrors({});
    setApiError(null);
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.newPassword.trim()) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Debe confirmar la contraseña";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await changePassword({ idUsuario: user.idUsuario, newPassword: form.newPassword });
      toast.success(
        `Contraseña actualizada: ${user.nombre} ${user.apellido}`
      );
      onOpenChange(false);
      onSaved && onSaved();
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      setApiError(err.message || "Ocurrió un error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cambiar Contraseña</CardTitle>
        <CardDescription>
          Actualizá la contraseña de{" "}
          <span className="font-medium text-foreground">
            {user?.nombre} {user?.apellido}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nueva Contraseña</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  Nueva contraseña <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  placeholder="Nueva contraseña"
                />
                {errors.newPassword && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar contraseña{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder="Repetir contraseña"
                />
                {errors.confirmPassword && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
