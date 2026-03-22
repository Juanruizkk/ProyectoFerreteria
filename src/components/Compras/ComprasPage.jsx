import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

import PermissionGuard from "@/components/PermissionGuard";
import AccessDenied from "@/components/Common/AccessDenied";
import { PermissionGroups } from "@/config/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useCrud } from "@/hooks/useCrud";

import CompraForm from "./CompraForm";
import {
  createCompra,
  deleteCompra,
  fetchCompras,
  getCompraById,
  toggleEstadoCompra,
  updateCompra,
} from "@/services/CompraProveedorQueries";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function fmtFecha(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const { hasPermission } = usePermission();

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("activas");

  // ── Datos ──────────────────────────────────────────────────────────────────
  const [todasLasCompras, setTodasLasCompras] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  const [searchActivas, setSearchActivas] = useState("");
  const [searchInactivas, setSearchInactivas] = useState("");
  const dqActivas = useDebouncedValue(searchActivas);
  const dqInactivas = useDebouncedValue(searchInactivas);

  // ── Expand rows ────────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpand = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Form ───────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const crud = useCrud({
    onSuccess: ({ message }) => { if (message) toast.success(message); },
    onError: ({ error, message }) => {
      toast.error(message || error?.message || "Error inesperado");
    },
  });

  const deleteDialog = useConfirmDialog(async (compra) => {
    await crud.remove(deleteCompra, compra.idCompraProveedor, {
      successMessage: `Compra #${compra.idCompraProveedor} eliminada`,
      errorMessage: "No se pudo eliminar la compra",
    });
    cargarCompras();
  });

  const toggleDialog = useConfirmDialog(async (compra) => {
    await crud.toggle(toggleEstadoCompra, compra.idCompraProveedor, {
      successMessage: compra.activo
        ? "Compra desactivada"
        : "Compra activada",
      errorMessage: "No se pudo cambiar el estado",
    });
    cargarCompras();
  });

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const cargarCompras = async () => {
    try {
      setLoading(true);
      const data = await fetchCompras();
      setTodasLasCompras(data ?? []);
    } catch (err) {
      toast.error("Error al cargar compras: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarCompras(); }, []);

  // ── Filtrado client-side ───────────────────────────────────────────────────
  function filtrar(lista, search) {
    if (!search.trim()) return lista;
    const q = search.toLowerCase();
    return lista.filter(
      (c) =>
        c.nombreProveedor?.toLowerCase().includes(q) ||
        c.numeroComprobante?.toLowerCase().includes(q) ||
        c.tipoComprobante?.toLowerCase().includes(q) ||
        c.fecha?.includes(q)
    );
  }

  const comprasActivas = filtrar(
    todasLasCompras.filter((c) => c.activo),
    dqActivas
  );
  const comprasInactivas = filtrar(
    todasLasCompras.filter((c) => !c.activo),
    dqInactivas
  );

  // ── Handlers form ──────────────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingCompra(null);
    setShowForm(true);
    setExpandedRows({});
  };

  const handleEdit = async (compra) => {
    try {
      const full = await getCompraById(compra.idCompraProveedor);
      setEditingCompra(full);
      setShowForm(true);
    } catch (err) {
      toast.error("Error al cargar la compra: " + err.message);
    }
  };

  const handleSubmit = async (payload) => {
    if (editingCompra) {
      await updateCompra(payload);
      toast.success("Compra actualizada correctamente");
    } else {
      await createCompra(payload);
      toast.success("Compra registrada correctamente");
    }
    setShowForm(false);
    setEditingCompra(null);
    cargarCompras();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.PURCHASES.permissions)}
      fallback={<AccessDenied moduleName="la gestión de compras" />}
    >
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">Compras a Proveedores</h1>
            <PermissionGuard permission="COMP_CREATE">
              <Button onClick={handleCreate} disabled={showForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Compra
              </Button>
            </PermissionGuard>
          </div>

          {/* Form inline */}
          <PermissionGuard anyOf={["COMP_CREATE", "COMP_UPDATE"]}>
            {showForm && (
              <CompraForm
                initialData={editingCompra}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingCompra(null); }}
              />
            )}
          </PermissionGuard>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="activas">
                Activas
                {comprasActivas.length > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                    {comprasActivas.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="inactivas">Inactivas</TabsTrigger>
            </TabsList>

            {/* ── TAB ACTIVAS ──────────────────────────────────────────── */}
            <TabsContent value="activas" className="space-y-4">
              <Card>
                <CardContent className="flex items-center gap-2 py-4">
                  <Input
                    placeholder="Buscar por proveedor, comprobante o fecha..."
                    value={searchActivas}
                    onChange={(e) => setSearchActivas(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => setSearchActivas("")}>
                    Limpiar
                  </Button>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="w-10" />
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-5 w-5 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-36 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                              <TableCell><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="w-10" />
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comprasActivas.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-10 text-muted-foreground"
                              >
                                No se encontraron compras activas
                              </TableCell>
                            </TableRow>
                          )}
                          {comprasActivas.map((c) => (
                            <Fragment key={c.idCompraProveedor}>
                              <TableRow className="hover:bg-muted/40 transition">
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => toggleExpand(c.idCompraProveedor)}
                                  >
                                    {expandedRows[c.idCompraProveedor] ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>{fmtFecha(c.fecha)}</TableCell>
                                <TableCell className="font-medium">
                                  {c.nombreProveedor}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {c.numeroComprobante || "-"}
                                </TableCell>
                                <TableCell>
                                  {c.tipoComprobante ? (
                                    <Badge variant="outline" className="text-xs">
                                      {c.tipoComprobante}
                                    </Badge>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {fmt(c.total)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <TooltipProvider>
                                    <div className="flex gap-2 justify-end">
                                      {hasPermission("COMP_UPDATE") && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              onClick={() => handleEdit(c)}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Editar</TooltipContent>
                                        </Tooltip>
                                      )}
                                      {hasPermission("COMP_UPDATE") && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              onClick={() => toggleDialog.openDialog(c)}
                                              disabled={crud.loading.toggle}
                                            >
                                              <Power className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Desactivar</TooltipContent>
                                        </Tooltip>
                                      )}
                                      {hasPermission("COMP_DELETE") && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              onClick={() => deleteDialog.openDialog(c)}
                                              disabled={crud.loading.remove}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Eliminar</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TooltipProvider>
                                </TableCell>
                              </TableRow>

                              {/* ── Expand: detalles ── */}
                              {expandedRows[c.idCompraProveedor] && (
                                <TableRow>
                                  <TableCell colSpan={7} className="bg-muted/30 px-6 py-4">
                                    <CompraExpandContent compra={c} />
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
              )}
            </TabsContent>

            {/* ── TAB INACTIVAS ─────────────────────────────────────────── */}
            <TabsContent value="inactivas" className="space-y-4">
              <Card>
                <CardContent className="flex items-center gap-2 py-4">
                  <Input
                    placeholder="Buscar por proveedor, comprobante o fecha..."
                    value={searchInactivas}
                    onChange={(e) => setSearchInactivas(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => setSearchInactivas("")}>
                    Limpiar
                  </Button>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="w-10" />
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-5 w-5 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-36 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                              <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                              <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted">
                            <TableHead className="w-10" />
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comprasInactivas.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-10 text-muted-foreground"
                              >
                                No hay compras inactivas
                              </TableCell>
                            </TableRow>
                          )}
                          {comprasInactivas.map((c) => (
                            <Fragment key={c.idCompraProveedor}>
                              <TableRow className="opacity-60 hover:opacity-80 transition">
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => toggleExpand(`i-${c.idCompraProveedor}`)}
                                  >
                                    {expandedRows[`i-${c.idCompraProveedor}`] ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>{fmtFecha(c.fecha)}</TableCell>
                                <TableCell className="font-medium">
                                  {c.nombreProveedor}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {c.numeroComprobante || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {fmt(c.total)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {hasPermission("COMP_UPDATE") && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => toggleDialog.openDialog(c)}
                                            disabled={crud.loading.toggle}
                                          >
                                            <Power className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Activar</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </TableCell>
                              </TableRow>

                              {expandedRows[`i-${c.idCompraProveedor}`] && (
                                <TableRow>
                                  <TableCell colSpan={6} className="bg-muted/30 px-6 py-4">
                                    <CompraExpandContent compra={c} />
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
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Dialog: eliminar ──────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialog.open} onOpenChange={deleteDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la compra del{" "}
              <span className="font-semibold text-foreground">
                {fmtFecha(deleteDialog.item?.fecha)}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-foreground">
                {deleteDialog.item?.nombreProveedor}
              </span>
              . El stock de los productos se revertirá automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.confirm}
              disabled={deleteDialog.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDialog.loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: toggle estado ─────────────────────────────────────────── */}
      <AlertDialog open={toggleDialog.open} onOpenChange={toggleDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.item?.activo ? "¿Desactivar compra?" : "¿Activar compra?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.item?.activo
                ? "Se revertirá el stock de todos los productos de esta compra."
                : "Se sumará nuevamente el stock de todos los productos de esta compra."}
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

// ── Expand row: detalle de productos ─────────────────────────────────────────

function CompraExpandContent({ compra }) {
  function fmt(value) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value || 0);
  }

  const detalles = compra.detalles ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-2">
        {compra.observacion && (
          <span>
            <span className="font-medium text-foreground">Obs:</span>{" "}
            {compra.observacion}
          </span>
        )}
        {compra.nombreUsuario && (
          <span>
            <span className="font-medium text-foreground">Usuario:</span>{" "}
            {compra.nombreUsuario}
          </span>
        )}
        {compra.fechaVencimiento && (
          <span>
            <span className="font-medium text-foreground">Vence:</span>{" "}
            {compra.fechaVencimiento}
          </span>
        )}
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background">
              <TableHead className="text-xs">Producto</TableHead>
              <TableHead className="text-xs text-right">Cant.</TableHead>
              <TableHead className="text-xs text-right">Precio Unit.</TableHead>
              <TableHead className="text-xs text-right">Desc. %</TableHead>
              <TableHead className="text-xs text-right">IVA %</TableHead>
              <TableHead className="text-xs text-right">Subtotal</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-xs text-muted-foreground">
                  Sin detalles disponibles
                </TableCell>
              </TableRow>
            ) : (
              detalles.map((d) => (
                <TableRow key={d.idCompraProveedorDetalle}>
                  <TableCell className="text-sm font-medium">
                    {d.nombreProducto}
                  </TableCell>
                  <TableCell className="text-sm text-right">{d.cantidad}</TableCell>
                  <TableCell className="text-sm text-right">
                    {fmt(d.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {d.descuentoPorcentaje > 0 ? `${d.descuentoPorcentaje}%` : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    {d.ivaPorcentaje}%
                  </TableCell>
                  <TableCell className="text-sm text-right">{fmt(d.subtotal)}</TableCell>
                  <TableCell className="text-sm text-right font-semibold">
                    {fmt(d.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mini resumen de totales */}
      <div className="flex justify-end gap-6 text-sm pr-1">
        <span className="text-muted-foreground">
          Subtotal: <span className="text-foreground font-medium">{fmt(compra.subtotal)}</span>
        </span>
        {compra.descuentoTotal > 0 && (
          <span className="text-green-600">
            Descuento: <span className="font-medium">- {fmt(compra.descuentoTotal)}</span>
          </span>
        )}
        <span className="text-muted-foreground">
          IVA: <span className="text-foreground font-medium">{fmt(compra.ivaTotal)}</span>
        </span>
        <span className="font-bold">
          Total: {fmt(compra.total)}
        </span>
      </div>
    </div>
  );
}
