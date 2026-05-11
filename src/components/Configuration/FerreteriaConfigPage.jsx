import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { getFerreteria, updateFerreteria } from "@/services/FerreteriaQueries";

const emptyForm = {
  nombre: "",
  direccion: "",
  telefono: "",
  email: "",
  cuit: "",
  logoUrl: "",
};

function validateForm(form) {
  const errors = {};
  if (!form.nombre?.trim()) errors.nombre = "El nombre es obligatorio.";
  else if (form.nombre.length > 150) errors.nombre = "No puede superar los 150 caracteres.";

  if (!form.direccion?.trim()) errors.direccion = "La dirección es obligatoria.";
  else if (form.direccion.length > 200) errors.direccion = "No puede superar los 200 caracteres.";

  if (!form.telefono?.trim()) errors.telefono = "El teléfono es obligatorio.";
  else if (form.telefono.length > 30) errors.telefono = "No puede superar los 30 caracteres.";

  if (!form.email?.trim()) errors.email = "El email es obligatorio.";
  else if (form.email.length > 150) errors.email = "No puede superar los 150 caracteres.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Formato de email inválido.";

  if (!form.cuit?.trim()) errors.cuit = "El CUIT es obligatorio.";
  else if (!/^\d{2}-\d{8}-\d{1}$/.test(form.cuit)) errors.cuit = "Formato de CUIT inválido (XX-XXXXXXXX-X).";

  return errors;
}

// ── Vista de solo lectura ──────────────────────────────────────────────────────
function DataRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="italic text-muted-foreground">—</span>}</span>
    </div>
  );
}

export default function FerreteriaConfigPage() {
  const [data, setData]         = useState(emptyForm);
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing]   = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getFerreteria();
      if (res) {
        const parsed = {
          nombre:   res.nombre   || "",
          direccion:res.direccion|| "",
          telefono: res.telefono || "",
          email:    res.email    || "",
          cuit:     res.cuit     || "",
          logoUrl:  res.logoUrl  || "",
        };
        setData(parsed);
        setForm(parsed);
      }
    } catch (error) {
      toast.error(error.message || "Error al cargar los datos de la ferretería.");
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEditar = () => {
    setForm(data);
    setErrors({});
    setEditing(true);
  };

  const handleCancelar = () => {
    setForm(data);
    setErrors({});
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentErrors = validateForm(form);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      toast.error("Por favor, corregí los errores en el formulario.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nombre:    form.nombre.trim(),
        direccion: form.direccion.trim(),
        telefono:  form.telefono.trim(),
        email:     form.email.trim(),
        cuit:      form.cuit.trim(),
        logoUrl:   form.logoUrl?.trim() || null,
      };
      await updateFerreteria(payload);
      setData(form);
      setEditing(false);
      toast.success("Información de la ferretería actualizada correctamente.");
    } catch (error) {
      toast.error(error.message || "Error al actualizar la configuración.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard
      anyOf={[
        ...Object.values(PermissionGroups.USERS.permissions),
        ...Object.values(PermissionGroups.PRODUCTS.permissions),
      ]}
      fallback={<AccessDenied moduleName="la configuración de la ferretería" />}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Datos de la Ferretería</h1>
              <p className="text-muted-foreground">
                Información principal de la empresa usada en los comprobantes.
              </p>
            </div>
          </div>

          {!editing && !loading && (
            <PermissionGuard permission="SYS_CONFIG">
              <Button variant="outline" onClick={handleEditar}>
                <Pencil className="h-4 w-4 mr-2" />
                Modificar
              </Button>
            </PermissionGuard>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2 text-muted-foreground">Cargando datos...</span>
          </div>
        ) : editing ? (
          /* ── Modo edición ─────────────────────────────────────────────── */
          <Card className="max-w-3xl">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Editar Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="nombre">Nombre / Razón Social <span className="text-destructive">*</span></Label>
                    <Input id="nombre" value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} disabled={submitting} />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cuit">CUIT <span className="text-destructive">*</span></Label>
                    <Input id="cuit" value={form.cuit} onChange={(e) => setField("cuit", e.target.value)} placeholder="XX-XXXXXXXX-X" disabled={submitting} />
                    {errors.cuit && <p className="text-xs text-destructive">{errors.cuit}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="direccion">Dirección Comercial <span className="text-destructive">*</span></Label>
                    <Input id="direccion" value={form.direccion} onChange={(e) => setField("direccion", e.target.value)} disabled={submitting} />
                    {errors.direccion && <p className="text-xs text-destructive">{errors.direccion}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="telefono">Teléfono <span className="text-destructive">*</span></Label>
                    <Input id="telefono" value={form.telefono} onChange={(e) => setField("telefono", e.target.value)} disabled={submitting} />
                    {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} disabled={submitting} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
                    <Input id="logoUrl" value={form.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} disabled={submitting} placeholder="https://ejemplo.com/logo.png" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={handleCancelar} disabled={submitting}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Guardar Cambios</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          /* ── Modo vista ───────────────────────────────────────────────── */
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DataRow label="Nombre / Razón Social" value={data.nombre} />
                <DataRow label="CUIT"                  value={data.cuit} />
                <div className="md:col-span-2">
                  <DataRow label="Dirección Comercial" value={data.direccion} />
                </div>
                <DataRow label="Teléfono"              value={data.telefono} />
                <DataRow label="Correo Electrónico"    value={data.email} />
                {data.logoUrl && (
                  <div className="md:col-span-2">
                    <DataRow label="URL del Logo" value={data.logoUrl} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
