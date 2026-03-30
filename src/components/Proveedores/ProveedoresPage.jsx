import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Pencil, Plus, Power, ShoppingCart, Truck } from "lucide-react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CompraForm from "@/components/Compras/CompraForm";
import { createCompra } from "@/services/CompraProveedorQueries";
import SearchBar from "../Common/SearchBar";
import PageHeader from "../Common/PageHeader";
import { AuditPagination } from "@/components/Audit/AuditPagination";

import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useCrud } from "@/hooks/useCrud";
import ProveedorForm from "./ProveedorForm";
import {
  createProveedor,
  exportarProveedoresExcel,
  exportarProveedoresPdf,
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
  const [pageSize, setPageSize] = useState(10);
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

  // ── Form inline ────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);

  // ── Dialog: registrar compra desde lista ───────────────────────────────
  const [compraDialog, setCompraDialog] = useState(false);
  const [compraProveedor, setCompraProveedor] = useState(null);

  // ── Exportación ────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(null); // "excel" | "pdf" | null

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
      const data = await fetchProveedores(pageActivos, pageSize, dqActivos, "activos");
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
      const data = await fetchProveedores(pageEliminados, pageSize, dqEliminados, "eliminados");
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
  }, [activeTab, pageActivos, dqActivos, pageSize]);

  useEffect(() => {
    if (activeTab === "eliminados") loadEliminados();
  }, [activeTab, pageEliminados, dqEliminados, pageSize]);

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

  const handleRegistrarCompra = (proveedor) => {
    setCompraProveedor(proveedor);
    setCompraDialog(true);
  };

  const handleCompraSubmit = async (payload) => {
    await createCompra(payload);
    toast.success("Compra registrada exitosamente");
    setCompraDialog(false);
    setCompraProveedor(null);
  };

  const handleExport = async (type) => {
    try {
      setExporting(type);
      if (type === "excel") await exportarProveedoresExcel();
      else await exportarProveedoresPdf();
    } catch (err) {
      toast.error("Error al exportar: " + err.message);
    } finally {
      setExporting(null);
    }
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
          <PageHeader
            icon={<Truck className="h-8 w-8 text-primary" />}
            title="Gestión de Proveedores"
            description="Administrá tus proveedores y sus listas de precios"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handleExport("excel")}
                    disabled={exporting !== null}>
                    <FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" />
                    {exporting === "excel" ? "Exportando..." : "Proveedores Excel"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar a Excel</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}>
                    <FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" />
                    {exporting === "pdf" ? "Exportando..." : "Proveedores PDF"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar a PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PermissionGuard permission="PROV_CREATE">
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </PermissionGuard>
          </PageHeader>

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

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "activos",    label: "Activos",    color: "border-primary" },
              { key: "eliminados", label: "Inactivos", color: "border-red-500" },
            ].map((card) => {
              const isActive = activeTab === card.key;
              const border = isActive ? card.color : "border-muted";
              return (
                <Card
                  key={card.key}
                  onClick={() => setActiveTab(card.key)}
                  className={`cursor-pointer border transition rounded-md p-3 text-center ${isActive ? `${card.color} bg-accent/60 shadow-sm` : "border-muted hover:bg-muted/40 hover:shadow-sm"}`}
                >
                  <CardHeader className="p-1">
                    <CardTitle className="text-lg font-medium">{card.label}</CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Contenido Activos */}
          {activeTab === "activos" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <SearchBar
                    value={searchActivos}
                    onChange={setSearchActivos}
                    placeholder="Buscar por nombre, teléfono o dirección..."
                  />
                </CardContent>
              </Card>

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
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                  No se encontraron proveedores activos
                                </TableCell>
                              </TableRow>
                            )}
                            {proveedoresActivos.map((p) => (
                              <TableRow key={p.idProveedor} className="hover:bg-muted/40 transition">
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
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="outline" onClick={() => navigate(`/proveedores/${p.idProveedor}`)}>
                                            <FileText className="h-4 w-4 mr-1" /> Ver detalles
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Ver detalle del proveedor</TooltipContent>
                                      </Tooltip>

                                      <PermissionGuard permission="COMP_CREATE">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="sm" variant="outline" onClick={() => handleRegistrarCompra(p)}>
                                              <ShoppingCart className="h-4 w-4 mr-1" /> Registrar compra
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Registrar una compra a este proveedor</TooltipContent>
                                        </Tooltip>
                                      </PermissionGuard>

                                      {hasPermission("PROV_UPDATE") && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button size="sm" variant="ghost" onClick={() => toggleDialog.openDialog(p)} disabled={crud.loading.toggle}>
                                              <Power className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{p.activo ? "Desactivar" : "Activar"}</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paginación activos */}
                  <Card className="border-border/50 shadow-sm">
                    <AuditPagination
                      metadata={{
                        pagedIndex: pageActivos,
                        totalPages: totalPagesActivos,
                        totalCount: totalCountActivos,
                        hasPreviousPage: pageActivos > 1,
                        hasNextPage: pageActivos < totalPagesActivos,
                      }}
                      pageSize={pageSize}
                      onPageChange={setPageActivos}
                      onPageSizeChange={(size) => { setPageSize(size); setPageActivos(1); setPageEliminados(1); }}
                    />
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Contenido Eliminados */}
          {activeTab === "eliminados" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <SearchBar
                    value={searchEliminados}
                    onChange={setSearchEliminados}
                    placeholder="Buscar por nombre, teléfono o dirección..."
                  />
                </CardContent>
              </Card>

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
                  <Card className="border-border/50 shadow-sm">
                    <AuditPagination
                      metadata={{
                        pagedIndex: pageEliminados,
                        totalPages: totalPagesEliminados,
                        totalCount: totalCountEliminados,
                        hasPreviousPage: pageEliminados > 1,
                        hasNextPage: pageEliminados < totalPagesEliminados,
                      }}
                      pageSize={pageSize}
                      onPageChange={setPageEliminados}
                      onPageSizeChange={(size) => { setPageSize(size); setPageActivos(1); setPageEliminados(1); }}
                    />
                  </Card>
                </>
              )}
            </div>
          )}
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

      {/* ── Dialog: registrar compra ──────────────────────────────────────── */}
      <Dialog open={compraDialog} onOpenChange={(v) => { if (!v) { setCompraDialog(false); setCompraProveedor(null); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Compra</DialogTitle>
            <DialogDescription>
              {compraProveedor ? `Registrando compra para ${compraProveedor.nombre}` : ""}
            </DialogDescription>
          </DialogHeader>
          {compraProveedor && (
            <CompraForm
              proveedorInicial={compraProveedor}
              onSubmit={handleCompraSubmit}
              onCancel={() => { setCompraDialog(false); setCompraProveedor(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
