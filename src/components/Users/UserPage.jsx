import { useEffect, useMemo, useState } from "react";
import {
  searchUsers,
  getUserById,
  deleteUser,
} from "../../services/UsersQueries";
import { getPermissionCategories } from "../../services/PermissionsQueries";
import UserFormDrawer from "../Users/UserFormDrawer";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";
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
  const [estado, setEstado] = useState("activos"); // 🔹 activos | eliminados
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 400);

  const [pageIndex, setPageIndex] = useState(1);
  const [paged, setPaged] = useState({
    items: [],
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permCategories, setPermCategories] = useState([]);

  // Cargar categorías de permisos una sola vez
  useEffect(() => {
    getPermissionCategories()
      .then(setPermCategories)
      .catch((err) =>
        toast.error("Error al cargar permisos: " + err.message)
      );
  }, []);

  // 🔹 Cargar usuarios al cambiar página, búsqueda o estado
  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const data = await searchUsers({
          pageIndex,
          searchTerm: dq,
          estado, // 👈 enviamos el filtro de estado
        });
        if (!alive) return;
        setPaged(data);
      } catch (err) {
        toast.error("Error al listar usuarios: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [pageIndex, dq, estado]); // 👈 importante incluir 'estado'

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
      toast.error("No se pudo abrir el usuario: " + err.message);
    }
  }

  async function onDelete(userLite) {
    if (!confirm(`¿Eliminar a ${userLite.nombre} ${userLite.apellido}?`))
      return;
    try {
      await deleteUser(userLite.idUsuario);
      toast.success(`Usuario eliminado: ${userLite.nombre} ${userLite.apellido}`);
      const data = await searchUsers({ pageIndex, searchTerm: dq, estado });
      setPaged(data);
    } catch (err) {
      toast.error(`Error al eliminar usuario: ${err.message || "Ocurrió un error inesperado"}`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl w-full flex flex-col gap-8 px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={openCreate}>+ Nuevo Usuario</Button>
      </div>

      {/* Tabs de filtro */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 justify-center">
        <Card
          className={`cursor-pointer hover:shadow transition ${
            estado === "activos" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => {
            setEstado("activos");
            setPageIndex(1);
          }}
        >
          <CardHeader className="text-center">
            <CardTitle>Activos</CardTitle>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow transition ${
            estado === "eliminados" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => {
            setEstado("eliminados");
            setPageIndex(1);
          }}
        >
          <CardHeader className="text-center">
            <CardTitle>Eliminados</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Buscador */}
      <Card className="mt-2">
        <CardContent className="flex items-center gap-2 py-4">
          <Input
            placeholder="Buscar usuarios..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPageIndex(1);
            }}
          />
          <Button variant="outline" onClick={() => setQ("")}>
            Limpiar
          </Button>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <div
              className={`overflow-y-auto transition-all duration-300`}
              style={{
                maxHeight:
                  visibleItems.length > 10
                    ? "500px"
                    : `${visibleItems.length * 52 + 60}px`,
              }}
            >
              <Table className="w-full border-collapse">
                <TableHeader>
                  <TableRow className="sticky top-0 bg-muted z-10">
                    <TableHead>Id</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Sin datos
                      </TableCell>
                    </TableRow>
                  )}

                  {visibleItems.map((u) => (
                    <TableRow key={u.idUsuario} className="hover:bg-muted/40 transition">
                      <TableCell>{u.idUsuario}</TableCell>
                      <TableCell>{u.usuario}</TableCell>
                      <TableCell>{u.nombre}</TableCell>
                      <TableCell>{u.apellido}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.rol}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex gap-2 justify-end">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="secondary">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver permisos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <UserPermissionsPopover userId={u.idUsuario} />
                              </PopoverContent>
                            </Popover>

                            {estado === "activos" && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => openEdit(u)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar usuario</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => onDelete(u)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar usuario</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          disabled={pageIndex <= 1}
          onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <div className="text-sm">
          Página {pageIndex} de {paged.totalPages ?? 1}
        </div>
        <Button
          variant="outline"
          disabled={pageIndex >= (paged.totalPages ?? 1)}
          onClick={() => setPageIndex((p) => p + 1)}
        >
          Siguiente
        </Button>
      </div>

      {/* Drawer */}
      <UserFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={editingUser}
        permCategories={permCategories}
        onSaved={async () => {
          const data = await searchUsers({ pageIndex, searchTerm: dq, estado });
          setPaged(data);
        }}
      />
    </div>
  );
}

// Popover con permisos
function UserPermissionsPopover({ userId }) {
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState([]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const full = await getUserById(userId);
        if (!alive) return;
        setPerms(full?.permisos || []);
      } catch (err) {
        toast.error("Error al cargar permisos: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [userId]);

  if (loading) return <div className="text-sm">Cargando permisos…</div>;
  if (!perms.length)
    return (
      <div className="text-sm text-muted-foreground">
        Sin permisos asignados
      </div>
    );

  return (
    <ScrollArea className="h-48 pr-2">
      {perms.map((cat) => (
        <div key={cat.idCategoriaPermiso} className="mb-3">
          <div className="text-xs uppercase text-muted-foreground">
            {cat.categoria}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(cat.permissions || []).map((p) => (
              <Badge key={p.idPermiso} variant="outline">
                {p.permiso}
              </Badge>
            ))}
          </div>
          <Separator className="mt-2" />
        </div>
      ))}
    </ScrollArea>
  );
}
