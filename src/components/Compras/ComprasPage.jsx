import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { FileText as FaFilePdf, Sheet as FaFileExcel } from "lucide-react";
import SearchBar from "../Common/SearchBar";
import PageHeader from "../Common/PageHeader";
import DateRangeFilter from "../Common/DateRangeFilter";
import { AuditPagination } from "@/components/Audit/AuditPagination";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import AnularCompraDialog from "./AnularCompraDialog";
import { fetchCompras, exportarComprasExcel, exportarComprasPdf, exportarCompraExcel, exportarCompraPdf } from "@/services/CompraProveedorQueries";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";

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

// ── Detalle expandible de compra ──────────────────────────────────────────────
function CompraExpandContent({ compra }) {
  const { getAbreviatura } = useUnidadesMedida();
  if (!compra.detalles || compra.detalles.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin detalle de productos disponible.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background">
              <TableHead className="text-xs">Producto</TableHead>
              <TableHead className="text-xs text-right">Cant.</TableHead>
              <TableHead className="text-xs text-right">Precio unit.</TableHead>
              <TableHead className="text-xs text-right">Desc %</TableHead>
              <TableHead className="text-xs text-right">IVA %</TableHead>
              <TableHead className="text-xs text-right">Total línea</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compra.detalles.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">{d.nombreProducto}</TableCell>
                <TableCell className="text-sm text-right">
                  {d.cantidad} <span className="text-muted-foreground text-xs">{getAbreviatura(d.idUnidadMedida)}</span>
                </TableCell>
                <TableCell className="text-sm text-right font-mono">{fmt(d.precioUnitario)}</TableCell>
                <TableCell className="text-sm text-right">{d.descuentoPorcentaje > 0 ? `${d.descuentoPorcentaje}%` : "-"}</TableCell>
                <TableCell className="text-sm text-right">{d.ivaPorcentaje > 0 ? `${d.ivaPorcentaje}%` : "-"}</TableCell>
                <TableCell className="text-sm text-right font-mono font-medium">{fmt(d.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-start text-sm px-1">
        <div className="text-muted-foreground">
          {compra.observacion && <p>Obs: {compra.observacion}</p>}
          {compra.nombreUsuario && <p>Registrado por: {compra.nombreUsuario}</p>}
        </div>
        <div className="text-right space-y-0.5">
          {compra.descuentoTotal > 0 && (
            <p className="text-muted-foreground">Descuento: {fmt(compra.descuentoTotal)}</p>
          )}
          <p className="text-muted-foreground">Total sin IVA: {fmt(compra.subtotal - compra.descuentoTotal)}</p>
          {compra.ivaTotal > 0 && (
            <p className="text-muted-foreground">IVA: {fmt(compra.ivaTotal)}</p>
          )}
          <p className="font-bold">Total: {fmt(compra.total)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton de tabla ─────────────────────────────────────────────────────────

function ComprasTableSkeleton() {
  return (
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
                <TableHead className="text-right w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function ComprasPage() {
  const { hasPermission } = usePermission();

  const [activeTab, setActiveTab] = useState("activas");
  const [exporting, setExporting] = useState(null); // "excel" | "pdf" | null

  // Export dialog
  const [exportDialog, setExportDialog] = useState(false);
  const [exportType, setExportType] = useState(null); // "excel" | "pdf"
  const [exportFechaDesde, setExportFechaDesde] = useState("");
  const [exportFechaHasta, setExportFechaHasta] = useState("");

  // Estado por tab
  const [searchActivas, setSearchActivas] = useState("");
  const [searchAnuladas, setSearchAnuladas] = useState("");
  const dqActivas = useDebouncedValue(searchActivas);
  const dqAnuladas = useDebouncedValue(searchAnuladas);

  const [pageActivas, setPageActivas] = useState(1);
  const [pageAnuladas, setPageAnuladas] = useState(1);

  // Filtros de fecha por tab
  const [fechaDesdeActivas, setFechaDesdeActivas] = useState("");
  const [fechaHastaActivas, setFechaHastaActivas] = useState("");
  const [fechaDesdeAnuladas, setFechaDesdeAnuladas] = useState("");
  const [fechaHastaAnuladas, setFechaHastaAnuladas] = useState("");

  const [dataActivas, setDataActivas] = useState({ items: [], totalPages: 0, totalCount: 0 });
  const [dataAnuladas, setDataAnuladas] = useState({ items: [], totalPages: 0, totalCount: 0 });
  const [loadingActivas, setLoadingActivas] = useState(false);
  const [loadingAnuladas, setLoadingAnuladas] = useState(false);

  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpand = (key) =>
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  // Anular
  const [anularDialog, setAnularDialog] = useState(false);
  const [compraAAnular, setCompraAAnular] = useState(null);

  const cargarActivas = async (page = pageActivas, search = dqActivas, desde = fechaDesdeActivas, hasta = fechaHastaActivas) => {
    try {
      setLoadingActivas(true);
      const data = await fetchCompras({ pageIndex: page, pageSize: PAGE_SIZE, search, activo: "true", fechaDesde: desde, fechaHasta: hasta });
      setDataActivas(data);
    } catch (err) {
      toast.error("Error al cargar compras: " + err.message);
    } finally {
      setLoadingActivas(false);
    }
  };

  const cargarAnuladas = async (page = pageAnuladas, search = dqAnuladas, desde = fechaDesdeAnuladas, hasta = fechaHastaAnuladas) => {
    try {
      setLoadingAnuladas(true);
      const data = await fetchCompras({ pageIndex: page, pageSize: PAGE_SIZE, search, activo: "false", fechaDesde: desde, fechaHasta: hasta });
      setDataAnuladas(data);
    } catch (err) {
      toast.error("Error al cargar compras anuladas: " + err.message);
    } finally {
      setLoadingAnuladas(false);
    }
  };

  // Carga inicial de activas
  useEffect(() => { cargarActivas(1, ""); }, []);

  // Refetch al cambiar búsqueda o página — activas
  useEffect(() => {
    setPageActivas(1);
    cargarActivas(1, dqActivas);
  }, [dqActivas]);

  useEffect(() => {
    cargarActivas(pageActivas, dqActivas);
  }, [pageActivas]);

  // Refetch al cambiar búsqueda o página — anuladas (lazy: solo si el tab está activo)
  useEffect(() => {
    if (activeTab !== "anuladas") return;
    setPageAnuladas(1);
    cargarAnuladas(1, dqAnuladas);
  }, [dqAnuladas]);

  useEffect(() => {
    if (activeTab !== "anuladas") return;
    cargarAnuladas(pageAnuladas, dqAnuladas);
  }, [pageAnuladas]);

  // Al cambiar al tab anuladas por primera vez, cargar datos
  useEffect(() => {
    if (activeTab === "anuladas" && dataAnuladas.items.length === 0 && !loadingAnuladas) {
      cargarAnuladas(1, dqAnuladas);
    }
  }, [activeTab]);

  const openExportDialog = (type) => {
    setExportType(type);
    setExportFechaDesde("");
    setExportFechaHasta("");
    setExportDialog(true);
  };

  const handleExportConfirm = async () => {
    try {
      setExporting(exportType);
      setExportDialog(false);
      if (exportType === "excel") await exportarComprasExcel({ fechaDesde: exportFechaDesde, fechaHasta: exportFechaHasta });
      else await exportarComprasPdf({ fechaDesde: exportFechaDesde, fechaHasta: exportFechaHasta });
    } catch (err) {
      toast.error("Error al exportar: " + err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleAnular = (compra) => {
    setCompraAAnular(compra);
    setAnularDialog(true);
  };

  // ── Tabla reutilizable ────────────────────────────────────────────────────
  function ComprasTable({ compras, rowKey = (c) => c.idCompraProveedor, showAnular = false, emptyMsg }) {
    return (
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
                  <TableHead className="text-right w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      {emptyMsg}
                    </TableCell>
                  </TableRow>
                )}
                {compras.map((c) => (
                  <Fragment key={rowKey(c)}>
                    <TableRow className="hover:bg-muted/40 transition">
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-6 w-6"
                          onClick={() => toggleExpand(rowKey(c))}>
                          {expandedRows[rowKey(c)]
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm">{fmtFecha(c.fecha)}</TableCell>
                      <TableCell className="font-medium text-sm">{c.nombreProveedor}</TableCell>
                      <TableCell className="text-sm">{c.numeroComprobante || "-"}</TableCell>
                      <TableCell>
                        {c.tipoComprobante
                          ? <Badge variant="outline" className="text-xs">{c.tipoComprobante}</Badge>
                          : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm font-mono">
                        {fmt(c.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => { toast.promise(exportarCompraPdf(c.idCompraProveedor), { loading: "Generando PDF...", success: "PDF descargado", error: (e) => e.message }); }}>
                                  <FaFilePdf className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Exportar PDF</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => { toast.promise(exportarCompraExcel(c.idCompraProveedor), { loading: "Generando Excel...", success: "Excel descargado", error: (e) => e.message }); }}>
                                  <FaFileExcel className="h-4 w-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Exportar Excel</TooltipContent>
                            </Tooltip>
                            {showAnular && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleAnular(c)}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Anular compra</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>

                    {expandedRows[rowKey(c)] && (
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
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.PURCHASES.permissions)}
      fallback={<AccessDenied moduleName="la gestión de compras" />}
    >
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6">

          <div className="flex items-start justify-between gap-4">
            <PageHeader
              icon={<ClipboardList className="h-8 w-8 text-primary" />}
              title="Historial de Compras"
              description="Consultá y anulá compras registradas. Para crear nuevas compras, accedé desde el detalle del proveedor."
            />
            <div className="flex gap-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => openExportDialog("excel")}
                      disabled={exporting !== null}>
                      <FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" />
                      {exporting === "excel" ? "Exportando..." : "Excel"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar a Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => openExportDialog("pdf")}
                      disabled={exporting !== null}>
                      <FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" />
                      {exporting === "pdf" ? "Exportando..." : "PDF"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar a PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "activas",  label: "Activas",  color: "border-primary",   count: dataActivas.totalCount },
              { key: "anuladas", label: "Anuladas", color: "border-red-500",   count: dataAnuladas.totalCount },
            ].map((card) => {
              const isActive = activeTab === card.key;
              return (
                <Card
                  key={card.key}
                  onClick={() => setActiveTab(card.key)}
                  className={`cursor-pointer border transition rounded-md p-3 text-center ${
                    isActive
                      ? `${card.color} bg-accent/60 shadow-sm`
                      : "border-muted hover:bg-muted/40 hover:shadow-sm"
                  }`}
                >
                  <CardHeader className="p-1">
                    <CardTitle className="text-lg font-medium">
                      {card.label}
                      {card.count > 0 && (
                        <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-foreground"
                        }`}>
                          {card.count}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Activas */}
          {activeTab === "activas" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <div className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-[200px]">
                      <SearchBar value={searchActivas} onChange={setSearchActivas}
                        placeholder="Buscar por proveedor, comprobante o fecha..." />
                    </div>
                    <DateRangeFilter
                      desde={fechaDesdeActivas}
                      hasta={fechaHastaActivas}
                      onDesdeChange={(v) => { setFechaDesdeActivas(v); setPageActivas(1); cargarActivas(1, dqActivas, v, fechaHastaActivas); }}
                      onHastaChange={(v) => { setFechaHastaActivas(v); setPageActivas(1); cargarActivas(1, dqActivas, fechaDesdeActivas, v); }}
                      onClear={() => { setFechaDesdeActivas(""); setFechaHastaActivas(""); setPageActivas(1); cargarActivas(1, dqActivas, "", ""); }}
                    />
                  </div>
                </CardContent>
              </Card>
              {loadingActivas ? (
                <ComprasTableSkeleton />
              ) : (
                <>
                  <ComprasTable
                    compras={dataActivas.items}
                    showAnular={hasPermission("COMP_UPDATE")}
                    emptyMsg="No se encontraron compras activas"
                  />
                  {dataActivas.totalCount > 0 && (
                    <Card className="border-border/50 shadow-sm">
                      <AuditPagination
                        metadata={{
                          pagedIndex: pageActivas,
                          totalPages: dataActivas.totalPages,
                          totalCount: dataActivas.totalCount,
                          hasPreviousPage: pageActivas > 1,
                          hasNextPage: pageActivas < dataActivas.totalPages,
                        }}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPageActivas}
                        showPageSize={false}
                      />
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Anuladas */}
          {activeTab === "anuladas" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <div className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-[200px]">
                      <SearchBar value={searchAnuladas} onChange={setSearchAnuladas}
                        placeholder="Buscar por proveedor, comprobante o fecha..." />
                    </div>
                    <DateRangeFilter
                      desde={fechaDesdeAnuladas}
                      hasta={fechaHastaAnuladas}
                      onDesdeChange={(v) => { setFechaDesdeAnuladas(v); setPageAnuladas(1); cargarAnuladas(1, dqAnuladas, v, fechaHastaAnuladas); }}
                      onHastaChange={(v) => { setFechaHastaAnuladas(v); setPageAnuladas(1); cargarAnuladas(1, dqAnuladas, fechaDesdeAnuladas, v); }}
                      onClear={() => { setFechaDesdeAnuladas(""); setFechaHastaAnuladas(""); setPageAnuladas(1); cargarAnuladas(1, dqAnuladas, "", ""); }}
                    />
                  </div>
                </CardContent>
              </Card>
              {loadingAnuladas ? (
                <ComprasTableSkeleton />
              ) : (
                <>
                  <ComprasTable
                    compras={dataAnuladas.items}
                    rowKey={(c) => `a-${c.idCompraProveedor}`}
                    showAnular={false}
                    emptyMsg="No hay compras anuladas"
                  />
                  {dataAnuladas.totalCount > 0 && (
                    <Card className="border-border/50 shadow-sm">
                      <AuditPagination
                        metadata={{
                          pagedIndex: pageAnuladas,
                          totalPages: dataAnuladas.totalPages,
                          totalCount: dataAnuladas.totalCount,
                          hasPreviousPage: pageAnuladas > 1,
                          hasNextPage: pageAnuladas < dataAnuladas.totalPages,
                        }}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPageAnuladas}
                        showPageSize={false}
                      />
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnularCompraDialog
        open={anularDialog}
        onOpenChange={setAnularDialog}
        compra={compraAAnular}
        onSuccess={() => cargarActivas(1, dqActivas, fechaDesdeActivas, fechaHastaActivas)}
      />

      {/* Dialog exportar */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Exportar Compras — {exportType === "excel" ? "Excel" : "PDF"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Dejá los campos vacíos para exportar todas las compras.
            </p>
            <DateRangeFilter
              desde={exportFechaDesde}
              hasta={exportFechaHasta}
              onDesdeChange={setExportFechaDesde}
              onHastaChange={setExportFechaHasta}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>Cancelar</Button>
            <Button onClick={handleExportConfirm}>
              {exportType === "excel"
                ? <><FaFileExcel className="h-4 w-4 mr-1.5 text-green-600" /> Exportar Excel</>
                : <><FaFilePdf className="h-4 w-4 mr-1.5 text-red-500" /> Exportar PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
