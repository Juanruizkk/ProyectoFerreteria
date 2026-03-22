import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Power,
  Truck,
} from "lucide-react";
import SearchBar from "../Common/SearchBar";
import PaginationControls from "../Common/PaginationControls";

import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useCrud } from "@/hooks/useCrud";
import ProveedorForm from "./ProveedorForm";
import {
  createProveedor,
  fetchListasByProveedor,
  fetchProveedores,
  getProveedorById,
  toggleEstadoProveedor,
  updateProveedor,
} from "@/services/ProveedorQueries";

function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // ── Tabs ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("activos");

  // ── Estado activos ─────────────────────────────────────────────────────
  const [proveedoresActivos, setProveedoresActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [searchActivos, setSearchActivos] = useState("");
  const [pageActivos, setPageActivos] = useState(1);
  const [totalPagesActivos, setTotalPagesActivos] = useState(1);
  const [totalCountActivos, setTotalCountActivos] = useState(0);
  const dqActivos = useDebouncedValue(searchActivos);

  // ── Estado eliminados ──────────────────────────────────────────────────
  const [proveedoresEliminados, setProveedoresEliminados] = useState([]);
  const [loadingEliminados, setLoadingEliminados] = useState(false);
  const [searchEliminados, setSearchEliminados] = useState("");
  const [pageEliminados, setPageEliminados] = useState(1);
  const [totalPagesEliminados, setTotalPagesEliminados] = useState(1);
  const [totalCountEliminados, setTotalCountEliminados] = useState(0);
  const dqEliminados = useDebouncedValue(searchEliminados);

  // ── Expand rows ────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpandRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Form inline ────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);

  // ── useCrud (toggle) ───────────────────────────────────────────────────
  const crud = useCrud({
    onSuccess: ({ message }) => {
      if (message) toast.success(message);
    },
    onError: ({ error, message }) => {
      toast.error(message || error?.message || "Error inesperado");
    },
  });

  // ── Dialogs ────────────────────────────────────────────────────────────
  const toggleDialog = useConfirmDialog(async (proveedor) => {
    await crud.toggle(toggleEstadoProveedor, proveedor.idProveedor, {
      successMessage: proveedor.activo
        ? `"${proveedor.nombre}" desactivado`
        : `"${proveedor.nombre}" activado`,
      errorMessage: "No se pudo cambiar el estado",
    });
    loadActivos();
    loadEliminados();
  });

  // ── Carga de datos ─────────────────────────────────────────────────────
  const loadActivos = async () => {
    try {
      setLoadingActivos(true);
      const data = await fetchProveedores(pageActivos, 10, dqActivos, "activos");
      setProveedoresActivos(data.items ?? []);
      setTotalPagesActivos(data.totalPages ?? 1);
      setTotalCountActivos(data.totalCount ?? 0);
    } catch (err) {
      toast.error("Error al cargar proveedores: " + err.message);
    } finally {
      setLoadingActivos(false);
    }
  };

  const loadEliminados = async () => {
    try {
      setLoadingEliminados(true);
      const data = await fetchProveedores(pageEliminados, 10, dqEliminados, "eliminados");
      setProveedoresEliminados(data.items ?? []);
      setTotalPagesEliminados(data.totalPages ?? 1);
      setTotalCountEliminados(data.totalCount ?? 0);
    } catch (err) {
      toast.error("Error al cargar proveedores: " + err.message);
    } finally {
      setLoadingEliminados(false);
    }
  };

  useEffect(() => {
    if (activeTab === "activos") loadActivos();
  }, [activeTab, pageActivos, dqActivos]);

  useEffect(() => {
    if (activeTab === "eliminados") loadEliminados();
  }, [activeTab, pageEliminados, dqEliminados]);

  // Reset page on search
  useEffect(() => { setPageActivos(1); }, [dqActivos]);
  useEffect(() => { setPageEliminados(1); }, [dqEliminados]);

  // ── Handlers form ──────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingProveedor(null);
    setShowForm(true);
  };

  const handleEdit = async (proveedor) => {
    try {
      const full = await getProveedorById(proveedor.idProveedor);
      setEditingProveedor(full);
      setShowForm(true);
    } catch (err) {
      toast.error("Error al cargar el proveedor: " + err.message);
    }
  };

  const handleSubmit = async (payload) => {
    if (editingProveedor) {
      await updateProveedor(payload);
      toast.success(`"${payload.nombre}" actualizado`);
    } else {
      await createProveedor(payload);
      toast.success(`"${payload.nombre}" creado`);
    }
    setShowForm(false);
    setEditingProveedor(null);
    loadActivos();
  };

  // ──────────────────────────────────────────────────────────────────────
  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.SUPPLIERS.permissions)}
      fallback={<AccessDenied moduleName="la gestión de proveedores" />}
    >
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Gestión de Proveedores</h1>
                <p className="text-muted-foreground">Administrá tus proveedores y sus listas de precios</p>
              </div>
            </div>
            <PermissionGuard permission="PROV_CREATE">
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </PermissionGuard>
          </div>

          {/* Form inline */}
          <PermissionGuard anyOf={["PROV_CREATE", "PROV_UPDATE"]}>
            {showForm && (
              <ProveedorForm
                initialData={editingProveedor}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingProveedor(null); }}
              />
            )}
          </PermissionGuard>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="eliminados">Eliminados</TabsTrigger>
            </TabsList>

            {/* ── TAB ACTIVOS ─────────────────────────────────────────── */}
            <TabsContent value="activos" className="space-y-4">
              <SearchBar
                value={searchActivos}
                onChange={setSearchActivos}
                placeholder="Buscar por nombre, teléfono o dirección..."
              />

              {loadingActivos ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="w-10" />
                            <TableHead>Nombre</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-5 w-5 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-36 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-5 w-14 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-0">
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className="w-10" />
                              <TableHead>Nombre</TableHead>
                              <TableHead>Teléfono</TableHead>
                              <TableHead>Dirección</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proveedoresActivos.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-10 text-muted-foreground"
                                >
                                  No se encontraron proveedores activos
                                </TableCell>
                              </TableRow>
                            )}
                            {proveedoresActivos.map((p) => (
                              <Fragment key={p.idProveedor}>
                                <TableRow className="hover:bg-muted/40 transition">
                                  {/* Expand toggle */}
                                  <TableCell>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => toggleExpandRow(p.idProveedor)}
                                    >
                                      {expandedRows[p.idProveedor] ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="font-medium">{p.nombre}</TableCell>
                                  <TableCell>{p.telefono || "-"}</TableCell>
                                  <TableCell>{p.direccion || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant={p.activo ? "default" : "secondary"}>
                                      {p.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <TooltipProvider>
                                      <div className="flex gap-2 justify-end">
                                        {hasPermission("PROV_UPDATE") && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(p)}
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Editar</TooltipContent>
                                          </Tooltip>
                                        )}

                                        {hasPermission("PROV_UPDATE") && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleDialog.openDialog(p)}
                                                disabled={crud.loading.toggle}
                                              >
                                                <Power className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              {p.activo ? "Desactivar" : "Activar"}
                                            </TooltipContent>
                                          </Tooltip>
                                        )}

                                      </div>
                                    </TooltipProvider>
                                  </TableCell>
                                </TableRow>

                                {/* ── Expand row ── */}
                                {expandedRows[p.idProveedor] && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="bg-muted/30 px-6 py-4"
                                    >
                                      <ProveedorExpandContent
                                        proveedor={p}
                                        onNavigate={() =>
                                          navigate(`/proveedores/${p.idProveedor}`)
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paginación activos */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Página {pageActivos} de {totalPagesActivos} • Total: {totalCountActivos} proveedores
                    </div>
                    <PaginationControls
                      currentPage={pageActivos}
                      totalPages={totalPagesActivos}
                      onPageChange={setPageActivos}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── TAB ELIMINADOS ───────────────────────────────────────── */}
            <TabsContent value="eliminados" className="space-y-4">
              <SearchBar
                value={searchEliminados}
                onChange={setSearchEliminados}
                placeholder="Buscar por nombre, teléfono o dirección..."
              />

              {loadingEliminados ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-36 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-0">
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead>Nombre</TableHead>
                              <TableHead>Teléfono</TableHead>
                              <TableHead>Dirección</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proveedoresEliminados.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center py-10 text-muted-foreground"
                                >
                                  No hay proveedores inactivos
                                </TableCell>
                              </TableRow>
                            )}
                            {proveedoresEliminados.map((p) => (
                              <TableRow
                                key={p.idProveedor}
                                className="opacity-60 hover:opacity-80 transition"
                              >
                                <TableCell className="font-medium">{p.nombre}</TableCell>
                                <TableCell>{p.telefono || "-"}</TableCell>
                                <TableCell>{p.direccion || "-"}</TableCell>
                                <TableCell className="text-right">
                                  {hasPermission("PROV_UPDATE") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleDialog.openDialog(p)}
                                            disabled={crud.loading.toggle}
                                          >
                                            <Power className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Reactivar</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paginación eliminados */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Página {pageEliminados} de {totalPagesEliminados} • Total: {totalCountEliminados} proveedores
                    </div>
                    <PaginationControls
                      currentPage={pageEliminados}
                      totalPages={totalPagesEliminados}
                      onPageChange={setPageEliminados}
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Dialog: toggle estado ─────────────────────────────────────────── */}
      <AlertDialog open={toggleDialog.open} onOpenChange={toggleDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.item?.activo ? "¿Desactivar proveedor?" : "¿Activar proveedor?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.item?.activo
                ? `"${toggleDialog.item?.nombre}" dejará de aparecer en las operaciones activas.`
                : `"${toggleDialog.item?.nombre}" volverá a estar disponible en el sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleDialog.confirm}
              disabled={toggleDialog.loading}
            >
              {toggleDialog.loading
                ? "Procesando..."
                : toggleDialog.item?.activo
                ? "Desactivar"
                : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}

// ── Expand row content ──────────────────────────────────────────────────────
function ProveedorExpandContent({ proveedor, onNavigate }) {
  const [listas, setListas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListasByProveedor(proveedor.idProveedor)
      .then(setListas)
      .catch(() => setListas([]))
      .finally(() => setLoading(false));
  }, [proveedor.idProveedor]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Listas de Precios
        </p>
        <Button size="sm" variant="outline" onClick={onNavigate}>
          <ExternalLink className="mr-2 h-3 w-3" />
          Ir al proveedor
        </Button>
      </div>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background">
              <TableHead className="text-xs">Nombre</TableHead>
              <TableHead className="text-xs">Fecha</TableHead>
              <TableHead className="text-xs">Observaciones</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                  Cargando listas...
                </TableCell>
              </TableRow>
            ) : !listas || listas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                  Sin listas de precios — ver detalle completo en la página del proveedor
                </TableCell>
              </TableRow>
            ) : (
              listas.map((l) => (
                <TableRow key={l.idLista}>
                  <TableCell className="text-sm font-medium">{l.nombre}</TableCell>
                  <TableCell className="text-sm">
                    {l.fechaCreacion
                      ? new Date(l.fechaCreacion).toLocaleDateString("es-AR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">{l.observaciones || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={l.activo ? "default" : "secondary"} className="text-xs">
                      {l.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
