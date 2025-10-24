import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  updateUser,
  getUserById,
} from "../../services/UsersQueries";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function UserFormDrawer({
  open,
  onOpenChange,
  user,
  permCategories,
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

  // Pre-cargar valores si es edición
  useEffect(() => {
    if (isEdit) {
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
  }, [isEdit, user]);

  function togglePerm(id) {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payloadBase = {
      usuario: form.usuario,
      password: form.password,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
      permisos: selectedPerms, // backend espera List<int> de permisos
    };

    try {
      if (isEdit) {
        await updateUser({ idUsuario: form.idUsuario, ...payloadBase });
         toast.success(`Usuario actualizado correctamente: ${form.nombre} ${form.apellido}`)
      } else {
        await createUser(payloadBase);
         toast.success(`Usuario creado correctamente: ${form.nombre} ${form.apellido}`)
      }
      onOpenChange(false);
      onSaved && onSaved();
    } catch (err) {
      toast.error(`Error al guardar usuario: ${err.message || "Ocurrió un error inesperado"}`);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          {/* 🔹 Título accesible */}
          <DrawerTitle>
            {isEdit ? "Editar usuario" : "Nuevo usuario"}
          </DrawerTitle>

          {/* 🔹 Descripción accesible (puede estar visualmente oculta si no querés mostrarla) */}
          <DrawerDescription>
            {isEdit
              ? "Actualizá la información del usuario seleccionado."
              : "Completá los campos para registrar un nuevo usuario."}
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-hidden"
        >
          {/* Columna izquierda: datos */}
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Usuario</Label>
              <Input
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Apellido</Label>
              <Input
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Rol (string)</Label>
              <Input
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Columna derecha: permisos por categoría */}
          <div className="space-y-4">
            <Label>Permisos</Label>
            <ScrollArea className="h-[380px] pr-2">
              <div className="grid gap-3">
                {(permCategories || []).map((cat) => (
                  <Card key={cat.idCategoriaPermiso} className="border-dashed">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">
                        {cat.categoria}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      {(cat.permissions || []).map((p) => (
                        <label
                          key={p.idPermiso}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={selectedPerms.includes(p.idPermiso)}
                            onCheckedChange={() => togglePerm(p.idPermiso)}
                          />
                          <span>{p.permiso}</span>
                        </label>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer botones */}
          <div className="lg:col-span-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </form>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}
