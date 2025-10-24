import { useEffect, useMemo, useRef, useState } from "react";
import { searchUsers, getUserById, deleteUser } from "../../services/UsersQueries";
import { getPermissionCategories } from "../../services/PermissionsQueries";
import UserFormDrawer from "../Users/UserFormDrawer";

// ShadCN UI
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function UsersPage() {
  const [tab, setTab] = useState("todos"); // "todos" | "eliminados" (UI-ready; ver nota abajo)
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 400);

  const [pageIndex, setPageIndex] = useState(1);
  const [paged, setPaged] = useState({ items: [], totalPages: 1, totalCount: 0, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permCategories, setPermCategories] = useState([]);

  // Carga categorías de permisos una sola vez (para Drawer)
  useEffect(() => {
    getPermissionCategories()
      .then(setPermCategories)
      .catch(err => toast({ variant: "destructive", title: "Error al cargar permisos", description: err.message }));
  }, []);

  // Buscar (lista paginada)
  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const data = await searchUsers({ pageIndex, searchTerm: dq });
        if (!alive) return;
        setPaged(data);
      } catch (err) {
        toast({ variant: "destructive", title: "Error al listar usuarios", description: err.message });
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [pageIndex, dq]);

  // Nota: El backend actual **no expone** en DTO si un usuario está eliminado (usa FechaBaja para ordenar pero no la mapea al DTO).
  // Por eso, la card "Eliminados" queda lista en UI pero no filtra hasta que el API lo exponga.
  // Mientras tanto, mantenemos el mismo listado para ambos tabs y dejamos el TODO.
  const visibleItems = useMemo(() => paged.items ?? [], [paged]);

  function openCreate() {
    setEditingUser(null);
    setDrawerOpen(true);
  }

  async function openEdit(userLite) {
    try {
      const full = await getUserById(userLite.idUsuario);
      setEditingUser(full);
      setDrawerOpen(true);
    } catch (err) {
      toast({ variant: "destructive", title: "No se pudo abrir el usuario", description: err.message });
    }
  }

  async function onDelete(userLite) {
    if (!confirm(`¿Eliminar a ${userLite.nombre} ${userLite.apellido}?`)) return;
    try {
      await deleteUser(userLite.idUsuario);
      toast({ title: "Usuario eliminado" });
      // refrescar
      const data = await searchUsers({ pageIndex, searchTerm: dq });
      setPaged(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: err.message });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header con cards filtro + search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`cursor-pointer hover:shadow ${tab === "todos" ? "ring-2 ring-primary" : ""}`} onClick={() => setTab("todos")}>
          <CardHeader><CardTitle>Todos</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Listado global (activos y eliminados*)</CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow ${tab === "eliminados" ? "ring-2 ring-primary" : ""}`} onClick={() => setTab("eliminados")}>
          <CardHeader><CardTitle>Eliminados</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">*Requiere que el API exponga estado</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Buscar</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input placeholder="Nombre, Apellido..." value={q} onChange={(e) => { setQ(e.target.value); setPageIndex(1); }} />
            <Button onClick={() => setQ("")} variant="outline">Limpiar</Button>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${paged.totalCount ?? 0} resultados`}
        </div>
        <Button onClick={openCreate}>Nuevo usuario</Button>
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {visibleItems.map((u) => (
              <div key={u.idUsuario} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{u.apellido}, {u.nombre}</div>
                  <div className="text-sm text-muted-foreground">{u.usuario} • {u.email}</div>
                  <div className="mt-1"><Badge variant="secondary">{u.rol || "Sin rol"}</Badge></div>
                </div>

                {/* Ver más (trae permisos del usuario usando GET users?id=... y muestra popover) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary">Ver más</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96">
                    <UserPermissionsPopover userId={u.idUsuario} />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                <Button variant="destructive" onClick={() => onDelete(u)}>Eliminar</Button>
              </div>
            ))}

            {visibleItems.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin datos</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paginación simple */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={pageIndex <= 1} onClick={() => setPageIndex(p => Math.max(1, p - 1))}>Anterior</Button>
        <div className="text-sm">Página {pageIndex} de {paged.totalPages ?? 1}</div>
        <Button variant="outline" disabled={pageIndex >= (paged.totalPages ?? 1)} onClick={() => setPageIndex(p => p + 1)}>Siguiente</Button>
      </div>

      {/* Drawer Crear/Editar */}
      <UserFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={editingUser}                  // null => crear
        permCategories={permCategories}     // [{ idCategoriaPermiso, categoria, permissions: [] }]
        onSaved={async () => {
          const data = await searchUsers({ pageIndex, searchTerm: dq });
          setPaged(data);
        }}
      />
    </div>
  );
}

function UserPermissionsPopover({ userId }) {
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const full = await getUserById(userId); // devuelve UserDTO con Permisos agrupados
        if (!alive) return;
        setPerms(full?.permisos || []);
      } catch (err) {
        toast({ variant: "destructive", title: "Error al cargar permisos", description: err.message });
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [userId]);

  if (loading) return <div className="text-sm">Cargando permisos…</div>;
  if (!perms.length) return <div className="text-sm text-muted-foreground">Sin permisos asignados</div>;

  return (
    <ScrollArea className="h-64 pr-2">
      {perms.map(cat => (
        <div key={cat.idCategoriaPermiso} className="mb-3">
          <div className="text-xs uppercase text-muted-foreground">{cat.categoria}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(cat.permissions || []).map(p => (
              <Badge key={p.idPermiso} variant="outline">{p.permiso}</Badge>
            ))}
          </div>
          <Separator className="mt-3" />
        </div>
      ))}
    </ScrollArea>
  );
}
