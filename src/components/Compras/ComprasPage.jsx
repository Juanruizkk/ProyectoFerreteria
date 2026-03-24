import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  XCircle,
} from "lucide-react";
import SearchBar from "../Common/SearchBar";
import PageHeader from "../Common/PageHeader";

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
import { fetchCompras, exportarComprasExcel, exportarComprasPdf } from "@/services/CompraProveedorQueries";

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
                <TableCell className="text-sm text-right">{d.cantidad}</TableCell>
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
          {compra.ivaTotal > 0 && (
            <p className="text-muted-foreground">IVA: {fmt(compra.ivaTotal)}</p>
          )}
          <p className="font-bold">Total: {fmt(compra.total)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const { hasPermission } = usePermission();

  const [activeTab, setActiveTab] = useState("activas");
  const [todasLasCompras, setTodasLasCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // "excel" | "pdf" | null

  const [searchActivas, setSearchActivas] = useState("");
  const [searchAnuladas, setSearchAnuladas] = useState("");
  const dqActivas = useDebouncedValue(searchActivas);
  const dqAnuladas = useDebouncedValue(searchAnuladas);

  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpand = (key) =>
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

  // Anular
  const [anularDialog, setAnularDialog] = useState(false);
  const [compraAAnular, setCompraAAnular] = useState(null);

  const cargarCompras = async () => {
    try {
      setLoading(true);
      setTodasLasCompras(await fetchCompras() ?? []);
    } catch (err) {
      toast.error("Error al cargar compras: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarCompras(); }, []);

  const handleExport = async (type) => {
    try {
      setExporting(type);
      if (type === "excel") await exportarComprasExcel();
      else await exportarComprasPdf();
    } catch (err) {
      toast.error("Error al exportar: " + err.message);
    } finally {
      setExporting(null);
    }
  };

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

  const comprasActivas = filtrar(todasLasCompras.filter((c) => c.activo), dqActivas);
  const comprasAnuladas = filtrar(todasLasCompras.filter((c) => !c.activo), dqAnuladas);

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
                  {showAnular && <TableHead className="text-right w-24">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={showAnular ? 7 : 6} className="text-center py-10 text-muted-foreground">
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
                      {showAnular && (
                        <TableCell className="text-right">
                          <TooltipProvider>
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
                          </TooltipProvider>
                        </TableCell>
                      )}
                    </TableRow>

                    {expandedRows[rowKey(c)] && (
                      <TableRow>
                        <TableCell colSpan={showAnular ? 7 : 6} className="bg-muted/30 px-6 py-4">
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
                    <Button variant="outline" size="sm" onClick={() => handleExport("excel")}
                      disabled={exporting !== null}>
                      <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                      {exporting === "excel" ? "Exportando..." : "Excel"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar a Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}
                      disabled={exporting !== null}>
                      <FileText className="h-4 w-4 mr-1.5" />
                      {exporting === "pdf" ? "Exportando..." : "PDF"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar a PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "activas",   label: "Activas",   color: "border-primary" },
              { key: "anuladas",  label: "Anuladas",  color: "border-red-500" },
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
                      {card.key === "activas" && comprasActivas.length > 0 && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                          {comprasActivas.length}
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
                  <SearchBar value={searchActivas} onChange={setSearchActivas}
                    placeholder="Buscar por proveedor, comprobante o fecha..." />
                </CardContent>
              </Card>
              {loading ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Cargando...</CardContent></Card>
              ) : (
                <ComprasTable
                  compras={comprasActivas}
                  showAnular={hasPermission("COMP_UPDATE")}
                  emptyMsg="No se encontraron compras activas"
                />
              )}
            </div>
          )}

          {/* Anuladas */}
          {activeTab === "anuladas" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-4">
                  <SearchBar value={searchAnuladas} onChange={setSearchAnuladas}
                    placeholder="Buscar por proveedor, comprobante o fecha..." />
                </CardContent>
              </Card>
              {loading ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Cargando...</CardContent></Card>
              ) : (
                <ComprasTable
                  compras={comprasAnuladas}
                  rowKey={(c) => `a-${c.idCompraProveedor}`}
                  showAnular={false}
                  emptyMsg="No hay compras anuladas"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <AnularCompraDialog
        open={anularDialog}
        onOpenChange={setAnularDialog}
        compra={compraAAnular}
        onSuccess={cargarCompras}
      />
    </PermissionGuard>
  );
}
