import { useEffect, useState } from "react";
import {
  createUser,
  updateUser,
} from "../../services/UsersQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const USER_ROLES = [
  "Administracion",
  "Ventas",
  "Control de stock y precios",
];

const ROLE_PERMISSIONS = {
  "Administracion": "ALL",
  "Ventas": [
    "CC_VIEW",
    "VEN_CREATE",
    "VEN_INVOICE",
    "VEN_READ",
    "CC_REGISTER_PAYMENT",
    "VEN_NO_STOCK",
    "CC_NOTE_CREDIT",
    "CC_NOTE_DEBIT",
    "PROD_READ",
    "CLI_CREATE",
    "CLI_UPDATE",
    "CLI_READ",
    "SEARCH_SALE",
    "SEARCH_PRODUCT",
    "SEARCH_CLIENT",
  ],
  "Control de stock y precios": [
    // Productos — control total
    "PROD_CREATE",
    "PROD_READ",
    "PROD_UPDATE",
    "PROD_DELETE",
    "PROD_BARCODE",
    "PROD_PRICE_UPDATE",
    "PROD_STOCK_LOW",
    "PROD_STOCK_IN",
    // Proveedores — control total
    "PROV_CREATE",
    "PROV_READ",
    "PROV_UPDATE",
    "PROV_DELETE",
    // Listas de precios — control total
    "LP_CREATE",
    "LP_READ",
    "LP_UPDATE",
    "LP_DELETE",
    "LP_TOGGLE",
    "LP_ITEM_ADD",
    "LP_ITEM_UPDATE",
    "LP_ITEM_DELETE",
    // Compras — control total
    "COMP_CREATE",
    "COMP_READ",
    "COMP_UPDATE",
    "COMP_DELETE",
    // Búsquedas
    "SEARCH_PRODUCT",
    // Reportes
    "REP_GENERATE",
    "REP_EXPORT",
  ],
};

export default function UserFormDrawer({
  open,
  onOpenChange,
  user,
  permCategories,
  permissionsLockReason = null,
  onSaved,
}) {
  const isEdit = !!user?.idUsuario;
  const [form, setForm] = useState({
    idUsuario: null,
    usuario: "",
    password: "",
    nombre: "",
    apellido: "",
    email: "",
    rol: "",
  });
  const [selectedPerms, setSelectedPerms] = useState([]); // ids
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-cargar valores cuando se abre el formulario
  useEffect(() => {
    if (!open) return;

    if (isEdit && user) {
      setForm({
        idUsuario: user.idUsuario,
        usuario: user.usuario || "",
        password: user.password || "",
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
        rol: user.rol || "",
      });
      const ids = (user.permisos || []).flatMap((c) =>
        (c.permissions || []).map((p) => p.idPermiso)
      );
      setSelectedPerms(ids);
    } else {
      setForm({
        idUsuario: null,
        usuario: "",
        password: "",
        nombre: "",
        apellido: "",
        email: "",
        rol: "",
      });
      setSelectedPerms([]);
    }
    setErrors({});
    setApiError(null);
  }, [open, isEdit, user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    if (apiError) {
      setApiError(null);
    }
  };

  function togglePerm(id) {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Seleccionar/deseleccionar todos los permisos de una categoría
  function toggleCategoryPerms(category) {
    const categoryPermIds = (category.permissions || []).map((p) => p.idPermiso);
    const allSelected = categoryPermIds.every((id) => selectedPerms.includes(id));

    if (allSelected) {
      // Deseleccionar todos los permisos de esta categoría
      setSelectedPerms((prev) => prev.filter((id) => !categoryPermIds.includes(id)));
    } else {
      // Seleccionar todos los permisos de esta categoría
      setSelectedPerms((prev) => {
        const newPerms = [...prev];
        categoryPermIds.forEach((id) => {
          if (!newPerms.includes(id)) {
            newPerms.push(id);
          }
        });
        return newPerms;
      });
    }
  }

  // Verificar si todos los permisos de una categoría están seleccionados
  function isCategoryFullySelected(category) {
    const categoryPermIds = (category.permissions || []).map((p) => p.idPermiso);
    return categoryPermIds.length > 0 && categoryPermIds.every((id) => selectedPerms.includes(id));
  }

  // Verificar si algunos (pero no todos) permisos de una categoría están seleccionados
  function isCategoryPartiallySelected(category) {
    const categoryPermIds = (category.permissions || []).map((p) => p.idPermiso);
    const selectedCount = categoryPermIds.filter((id) => selectedPerms.includes(id)).length;
    return selectedCount > 0 && selectedCount < categoryPermIds.length;
  }

  // Auto-seleccionar permisos según el rol elegido
  function applyRolePermissions(rol) {
    if (!permCategories || permissionsLockReason) return;
    const allIds = permCategories.flatMap((c) => c.permissions.map((p) => p.idPermiso));
    if (ROLE_PERMISSIONS[rol] === "ALL") {
      setSelectedPerms(allIds);
      return;
    }
    const codes = ROLE_PERMISSIONS[rol] ?? [];
    const ids = permCategories.flatMap((c) =>
      c.permissions.filter((p) => codes.includes(p.permiso)).map((p) => p.idPermiso)
    );
    setSelectedPerms(ids);
  }

  const validateForm = () => {
    const newErrors = {};

    if (!form.usuario.trim()) {
      newErrors.usuario = "El usuario es requerido";
    }

    if (!isEdit && !form.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    }

    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!form.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!form.email.trim()) {
      newErrors.email = "El email es requerido";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Ingrese un email válido";
      }
    }

    if (!form.rol.trim()) {
      newErrors.rol = "El rol es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setApiError(null);

    const payloadBase = {
      usuario: form.usuario,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
      permisos: selectedPerms,
    };

    try {
      if (isEdit) {
        await updateUser({ idUsuario: form.idUsuario, ...payloadBase });
        toast.success(`Usuario actualizado correctamente: ${form.nombre} ${form.apellido}`);
      } else {
        await createUser({ ...payloadBase, password: form.password });
        toast.success(`Usuario creado correctamente: ${form.nombre} ${form.apellido}`);
      }
      onOpenChange(false);
      onSaved && onSaved();
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      setApiError(err.message || "Ocurrió un error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Actualiza la información del usuario"
            : "Completa los datos para registrar un nuevo usuario"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Usuario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos del Usuario</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">
                  Usuario <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="usuario"
                  value={form.usuario}
                  onChange={(e) => handleChange("usuario", e.target.value)}
                  placeholder="Nombre de usuario"
                />
                {errors.usuario && (
                  <p className="text-sm font-medium text-red-500">{errors.usuario}</p>
                )}
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Contraseña"
                  />
                  {errors.password && (
                    <p className="text-sm font-medium text-red-500">{errors.password}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre"
                />
                {errors.nombre && (
                  <p className="text-sm font-medium text-red-500">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellido"
                  value={form.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  placeholder="Apellido"
                />
                {errors.apellido && (
                  <p className="text-sm font-medium text-red-500">{errors.apellido}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="usuario@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-sm font-medium text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">
                  Rol <span className="text-destructive">*</span>
                </Label>
                <Select
                  key={`rol-${form.idUsuario || "new"}`}
                  value={form.rol}
                  onValueChange={(value) => {
                    handleChange("rol", value);
                    applyRolePermissions(value);
                  }}
                >
                  <SelectTrigger id="rol">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.rol && (
                  <p className="text-sm font-medium text-red-500">{errors.rol}</p>
                )}
              </div>
            </div>
          </div>

          {/* Permisos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Permisos</h3>

            {permissionsLockReason && (
              <div className="bg-amber-50 border border-amber-400 text-amber-700 px-4 py-3 rounded-md">
                <p className="text-sm font-medium">{permissionsLockReason}</p>
              </div>
            )}

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-3">
                {(permCategories || []).map((cat) => (
                  <Card key={cat.idCategoriaPermiso} className="border-dashed">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {cat.categoria}
                        </CardTitle>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={isCategoryFullySelected(cat)}
                            onCheckedChange={() => toggleCategoryPerms(cat)}
                            disabled={!!permissionsLockReason}
                            className={isCategoryPartiallySelected(cat) ? "data-[state=checked]:bg-primary/50" : ""}
                          />
                          <span className="font-medium text-primary">Seleccionar todo</span>
                        </label>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      {(cat.permissions || []).map((p) => (
                        <label
                          key={p.idPermiso}
                          className={`flex items-center gap-2 text-sm ${permissionsLockReason ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          <Checkbox
                            checked={selectedPerms.includes(p.idPermiso)}
                            onCheckedChange={() => togglePerm(p.idPermiso)}
                            disabled={!!permissionsLockReason}
                          />
                          <span>{p.descripcion || p.permiso}</span>
                        </label>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Mensaje de error de la API */}
          {apiError && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* Botones de acción */}
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
              {submitting
                ? isEdit
                  ? "Actualizando..."
                  : "Guardando..."
                : isEdit
                ? "Actualizar Usuario"
                : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
