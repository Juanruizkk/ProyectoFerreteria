import { useEffect, useMemo, useState } from "react";
import {
  searchUsers,
  getUserById,
  activateUser,
  deleteUser,
} from "../../services/UsersQueries";
import { getPermissionCategories } from "../../services/PermissionsQueries";
import { getCurrentUser } from "@/services/AuthService";
import UserFormDrawer from "../Users/UserFormDrawer";
import UserChangePasswordForm from "../Users/UserChangePasswordForm";
import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchBar from "../Common/SearchBar";
import PageHeader from "../Common/PageHeader";
import { AuditPagination } from "@/components/Audit/AuditPagination";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, KeyRound, Pencil, Plus, Trash2, UserCheck, Users } from "lucide-react";
import EmptyState from "@/components/Common/EmptyState";
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
  const { hasPermission } = usePermission();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId;
  const isCurrentUserMaster = currentUser?.root === true;

  // Devuelve el motivo por el que no se pueden editar los permisos del target,
  // o null si el usuario logueado sí puede hacerlo.
  function getPermissionsLockReason(targetUser) {
    if (!targetUser || isCurrentUserMaster) return null;
    if (targetUser.idUsuario === currentUserId)
      return "No podés modificar tus propios permisos.";
    if (targetUser.root === true)
      return "No podés modificar los permisos del administrador maestro.";
    return null;
  }

  const [estado, setEstado] = useState("activos");
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 400);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paged, setPaged] = useState({
    items: [],
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permCategories, setPermCategories] = useState([]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState(null);

  // Estados para el diálogo de eliminación
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para el diálogo de activación
  const [mostrarDialogoActivar, setMostrarDialogoActivar] = useState(false);
  const [usuarioAActivar, setUsuarioAActivar] = useState(null);
  const [activando, setActivando] = useState(false);

  // Cargar categorías de permisos una sola vez
  useEffect(() => {
    getPermissionCategories()
      .then(setPermCategories)
      .catch((err) =>
        toast.error("Error al cargar permisos: " + err.message)
      );
  }, []);

  // Cargar usuarios al cambiar página, búsqueda o estado
  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const data = await searchUsers({
          pageIndex,
          pageSize,
          searchTerm: dq,
          estado,
        });
        if (!alive) return;
        setPaged(data);
        setLoading(false);
      } catch (err) {
        if (!alive) return;
        toast.error("Error al listar usuarios: " + err.message);
        setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [pageIndex, dq, estado]);

  const visibleItems = useMemo(() => paged.items ?? [], [paged]);

  function openCreate() {
    setEditingUser(null);
    setShowChangePassword(false);
    setChangePasswordUser(null);
    setShowForm(true);
  }

  async function openEdit(userLite) {
    try {
      const full = await getUserById(userLite.idUsuario);
      setEditingUser(full);
      setShowChangePassword(false);
      setChangePasswordUser(null);
      setShowForm(true);
    } catch (err) {
      toast.error("No se pudo abrir el usuario: " + err.message);
    }
  }

  function openChangePassword(u) {
    setShowForm(false);
    setEditingUser(null);
    setChangePasswordUser(u);
    setShowChangePassword(true);
  }

  function handleSolicitarEliminar(userLite) {
    setUsuarioAEliminar(userLite);
    setMostrarDialogoEliminar(true);
  }

  async function handleConfirmarEliminar() {
    if (!usuarioAEliminar) return;

    try {
      setEliminando(true);
      await deleteUser(usuarioAEliminar.idUsuario);
      toast.success(`Usuario eliminado: ${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido}`);
      const data = await searchUsers({ pageIndex, searchTerm: dq, estado });
      setPaged(data);
      setMostrarDialogoEliminar(false);
      setUsuarioAEliminar(null);
    } catch (err) {
      toast.error(`Error al eliminar usuario: ${err.message || "Ocurrió un error inesperado"}`);
      setMostrarDialogoEliminar(false);
      setUsuarioAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  function handleCancelarEliminar() {
    setMostrarDialogoEliminar(false);
    setUsuarioAEliminar(null);
  }

  function handleSolicitarActivar(userLite) {
    setUsuarioAActivar(userLite);
    setMostrarDialogoActivar(true);
  }

  async function handleConfirmarActivar() {
    if (!usuarioAActivar) return;

    try {
      setActivando(true);
      await activateUser(usuarioAActivar.idUsuario);
      toast.success(`Usuario activado: ${usuarioAActivar.nombre} ${usuarioAActivar.apellido}`);
      const data = await searchUsers({ pageIndex, searchTerm: dq, estado });
      setPaged(data);
      setMostrarDialogoActivar(false);
      setUsuarioAActivar(null);
    } catch (err) {
      toast.error(`Error al activar usuario: ${err.message || "Ocurrió un error inesperado"}`);
      setMostrarDialogoActivar(false);
      setUsuarioAActivar(null);
    } finally {
      setActivando(false);
    }
  }

  function handleCancelarActivar() {
    setMostrarDialogoActivar(false);
    setUsuarioAActivar(null);
  }

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.USERS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de usuarios" />}
    >
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <PageHeader
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Gestión de Usuarios"
            description="Administrá los usuarios y sus permisos"
          >
            <PermissionGuard permission="USR_CREATE">
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </Button>
            </PermissionGuard>
          </PageHeader>

          {/* Form crear/editar */}
          <PermissionGuard anyOf={["USR_CREATE", "USR_UPDATE"]}>
            {showForm && (
              <UserFormDrawer
                open={showForm}
                onOpenChange={setShowForm}
                user={editingUser}
                permCategories={permCategories}
                permissionsLockReason={getPermissionsLockReason(editingUser)}
                onSaved={async () => {
                  const data = await searchUsers({ pageIndex, searchTerm: dq, estado });
                  setPaged(data);
                }}
              />
            )}
          </PermissionGuard>

          {/* Form cambiar contraseña */}
          <PermissionGuard permission="USR_PASSWORD_UPDATE">
            {showChangePassword && (
              <UserChangePasswordForm
                open={showChangePassword}
                onOpenChange={setShowChangePassword}
                user={changePasswordUser}
                onSaved={() => {}}
              />
            )}
          </PermissionGuard>

          {/* Filtro de estado */}
          {hasPermission("USR_READ") && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "activos",    label: "Activos",    color: "border-primary" },
                { key: "eliminados", label: "Eliminados", color: "border-red-500" },
              ].map((card) => {
                const isActive = estado === card.key;
                const border = isActive ? card.color : "border-muted";
                const count = isActive ? paged.totalCount : null;
                return (
                  <Card
                    key={card.key}
                    onClick={() => { setEstado(card.key); setPageIndex(1); }}
                    className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${border} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
                  >
                    <CardHeader className="p-1">
                      <CardTitle className="text-lg font-medium">
                        {card.label}
                      </CardTitle>
                      {count > 0 && (
                        <p className="text-sm text-muted-foreground">{count}</p>
                      )}
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Buscador */}
          {hasPermission("USR_READ") && (
            <Card>
              <CardContent className="py-4">
                <SearchBar
                  value={q}
                  onChange={(v) => { setQ(v); setPageIndex(1); }}
                  placeholder="Buscar usuarios..."
                />
              </CardContent>
            </Card>
          )}

          {/* Tabla + Paginación */}
          {hasPermission("USR_READ") && (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                      <Table className="w-full border-collapse">
                        <TableHeader>
                          <TableRow className="sticky top-0 bg-muted z-10">
                            <TableHead>Usuario</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Apellido</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                              <TableRow key={i}>
                                <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-8 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <>
                              {visibleItems.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6}>
                                    <EmptyState
                                      icon={Users}
                                      title="Sin usuarios encontrados"
                                      description={q ? "Probá con otro término de búsqueda" : undefined}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                          {visibleItems.map((u) => (
                            <TableRow key={u.idUsuario} className="hover:bg-muted/40 transition">
                              <TableCell>{u.usuario}</TableCell>
                              <TableCell>{u.nombre}</TableCell>
                              <TableCell>{u.apellido}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{u.rol}</TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <div className="flex gap-2 justify-end">
                                    {/* Ver permisos — requiere USR_READ (cubierto por el bloque padre) */}
                                    <Popover>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <PopoverTrigger asChild>
                                            <Button size="sm" variant="outline">
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Ver permisos</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <PopoverContent className="w-80">
                                        <UserPermissionsPopover userId={u.idUsuario} />
                                      </PopoverContent>
                                    </Popover>

                                    {/* Activar — solo en eliminados, requiere USR_DELETE */}
                                    {estado === "eliminados" && hasPermission("USR_DELETE") && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSolicitarActivar(u)}
                                          >
                                            <UserCheck className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Activar usuario</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {/* Acciones sobre activos */}
                                    {estado === "activos" && (
                                      <>
                                        {/* Editar — requiere USR_UPDATE */}
                                        {hasPermission("USR_UPDATE") && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
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
                                        )}

                                        {/* Cambiar contraseña — requiere USR_PASSWORD_UPDATE */}
                                        {hasPermission("USR_PASSWORD_UPDATE") && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openChangePassword(u)}
                                              >
                                                <KeyRound className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Cambiar contraseña</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}

                                        {/* Eliminar — requiere USR_DELETE */}
                                        {hasPermission("USR_DELETE") && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSolicitarEliminar(u)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Eliminar usuario</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Paginación */}
              {!loading && (
                <Card className="border-border/50 shadow-sm">
                  <AuditPagination
                    metadata={{
                      pagedIndex: pageIndex,
                      totalPages: paged.totalPages ?? 1,
                      totalCount: paged.totalCount ?? 0,
                      hasPreviousPage: pageIndex > 1,
                      hasNextPage: pageIndex < (paged.totalPages ?? 1),
                    }}
                    pageSize={pageSize}
                    onPageChange={setPageIndex}
                    onPageSizeChange={(size) => { setPageSize(size); setPageIndex(1); }}
                  />
                </Card>
              )}
            </>
          )}
        </div>

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar al usuario{" "}
                <span className="font-semibold text-foreground">
                  "{usuarioAEliminar?.nombre} {usuarioAEliminar?.apellido}"
                </span>
                ? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelarEliminar} disabled={eliminando}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Diálogo de confirmación para activar */}
      <AlertDialog open={mostrarDialogoActivar} onOpenChange={setMostrarDialogoActivar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Activar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de activar al usuario{" "}
              <span className="font-semibold text-foreground">
                "{usuarioAActivar?.nombre} {usuarioAActivar?.apellido}"
              </span>
              ? El usuario podrá volver a iniciar sesión en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelarActivar} disabled={activando}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarActivar}
              disabled={activando}
            >
              {activando ? "Activando..." : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
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
                {p.descripcion || p.permiso}
              </Badge>
            ))}
          </div>
          <Separator className="mt-2" />
        </div>
      ))}
    </ScrollArea>
  );
}
