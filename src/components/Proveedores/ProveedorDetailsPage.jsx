import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { FileText as FaFilePdf, Sheet as FaFileExcel } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import PermissionGuard from "@/components/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getProveedorById,
  updateProveedor,
  fetchListasByProveedor,
  createLista,
  updateLista,
  deleteLista,
  toggleActivoLista,
  fetchItemsByLista,
  addItem,
  updateItem,
  deleteItem,
} from "@/services/ProveedorQueries";
import { fetchAvailableProducts } from "@/services/SaleQueries";
import {
  getComprasByProveedor,
  createCompra,
  exportarCompraExcel,
  exportarCompraPdf,
  exportarComprasPorProveedorExcel,
  exportarComprasPorProveedorPdf,
} from "@/services/CompraProveedorQueries";
import CompraForm from "@/components/Compras/CompraForm";
import AnularCompraDialog from "@/components/Compras/AnularCompraDialog";
import ProveedorForm from "./ProveedorForm";
import BulkPriceImportModal from "./BulkPriceImportModal";
import { getCurrentUser } from "@/services/AuthService";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";
import DateRangeFilter from "@/components/Common/DateRangeFilter";
import SearchBar from "@/components/Common/SearchBar";
import { AuditPagination } from "@/components/Audit/AuditPagination";

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

// ── Buscador de productos para listas ────────────────────────────────────────
function ProductSearch({ value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(null);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await fetchAvailableProducts(q);
        const items = data?.items ?? data ?? [];
        setResults(items.slice(0, 8));
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelect = (producto) => {
    setQuery(producto.nombre ?? producto.Nombre ?? "");
    onChange(producto);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder="Buscar producto por nombre..."
        value={value ? (value.nombre ?? value.Nombre ?? query) : query}
        onChange={handleInputChange}
        disabled={disabled}
        autoComplete="off"
      />
      {searching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
          {results.map((p) => {
            const nombre = p.nombre ?? p.Nombre ?? "";
            const marca = p.marca ?? p.Marca ?? "";
            const id = p.idProducto ?? p.IdProducto;
            return (
              <button
                key={id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition flex justify-between gap-2"
                onMouseDown={() => handleSelect(p)}
              >
                <span className="font-medium truncate">{nombre}</span>
                {marca && <span className="text-muted-foreground shrink-0">{marca}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Panel inline de productos de una lista ───────────────────────────────────
const EMPTY_ITEM_FORM = { producto: null, precio: "", margen: "" };

function ListaItemsPanel({ idLista, listaNombre }) {
  const { hasPermission } = usePermission();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [itemFormError, setItemFormError] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const deleteItemDlg = useConfirmDialog(async (item) => {
    await deleteItem(idLista, item.idProducto);
    toast.success(`"${item.nombreProducto}" quitado de la lista`);
    loadItems();
  });

  useEffect(() => { loadItems(); }, [idLista]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setItems(await fetchItemsByLista(idLista) ?? []);
    } catch (err) {
      toast.error("Error al cargar productos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setItemForm(EMPTY_ITEM_FORM);
    setItemFormError("");
    setItemDialog(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setItemForm({
      producto: { idProducto: item.idProducto, nombre: item.nombreProducto, marca: item.marca },
      precio: String(item.precio ?? ""),
      margen: item.margen != null ? String(item.margen) : "",
    });
    setItemFormError("");
    setItemDialog(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const precio = parseFloat(itemForm.precio);
    const margen = itemForm.margen !== "" ? parseFloat(itemForm.margen) : null;
    if (!editingItem && !itemForm.producto) { setItemFormError("Seleccioná un producto."); return; }
    if (isNaN(precio) || precio < 0) { setItemFormError("El precio debe ser mayor o igual a 0."); return; }
    if (margen !== null && (isNaN(margen) || margen < 0)) { setItemFormError("El margen debe ser mayor o igual a 0."); return; }
    try {
      setSavingItem(true);
      setItemFormError("");
      if (editingItem) {
        await updateItem(idLista, editingItem.idProducto, { idProducto: editingItem.idProducto, precio, margen });
        toast.success("Precio actualizado");
      } else {
        const idProducto = itemForm.producto.idProducto ?? itemForm.producto.IdProducto;
        await addItem(idLista, { idProducto, precio, margen });
        toast.success(`"${itemForm.producto.nombre ?? itemForm.producto.Nombre}" agregado a la lista`);
      }
      setItemDialog(false);
      loadItems();
    } catch (err) {
      setItemFormError(err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const formatCurrency = (n) =>
    n != null ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n) : "-";
  const formatMargen = (n) =>
    n != null ? `${Number(n).toFixed(1)}%` : "-";

  return (
    <div className="space-y-3">
      {hasPermission("LP_ITEM_ADD") && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-3 w-3" /> Agregar producto
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Producto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                  Sin productos — usá "Agregar producto" para cargar el primero
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.idProducto} className="hover:bg-muted/30 transition">
                  <TableCell className="font-medium text-sm">{item.nombreProducto || `Producto #${item.idProducto}`}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.marca || "-"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(item.precio)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatMargen(item.margen)}</TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex gap-1.5 justify-end">
                        {hasPermission("LP_UPDATE") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar precio</TooltipContent>
                          </Tooltip>
                        )}
                        {hasPermission("LP_DELETE") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteItemDlg.openDialog(item)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Quitar de la lista</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {items.length} producto{items.length !== 1 ? "s" : ""} en la lista
        </p>
      )}

      {/* Dialog agregar/editar item */}
      <Dialog open={itemDialog} onOpenChange={(v) => { if (!savingItem) setItemDialog(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar precio" : "Agregar producto a la lista"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Modificando precio de "${editingItem.nombreProducto}"`
                : `Seleccioná un producto y definí su precio en "${listaNombre}"`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4">
            {!editingItem && (
              <div className="space-y-1">
                <Label>Producto <span className="text-destructive">*</span></Label>
                <ProductSearch
                  value={itemForm.producto}
                  onChange={(p) => {
                    const precioActual = p?.precio ?? p?.Precio;
                    setItemForm((prev) => ({
                      ...prev,
                      producto: p,
                      precio: precioActual != null ? String(precioActual) : prev.precio,
                    }));
                  }}
                  disabled={savingItem}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="item-precio">Precio <span className="text-destructive">*</span></Label>
                <Input id="item-precio" type="number" min="0" step="0.01" placeholder="0.00"
                  value={itemForm.precio}
                  onChange={(e) => setItemForm((p) => ({ ...p, precio: e.target.value }))}
                  disabled={savingItem}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="item-margen">
                  Margen <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                </Label>
                <Input id="item-margen" type="number" min="0" step="0.1" placeholder="25"
                  value={itemForm.margen}
                  onChange={(e) => setItemForm((p) => ({ ...p, margen: e.target.value }))}
                  disabled={savingItem}
                />
              </div>
            </div>
            {itemFormError && <p className="text-sm text-destructive">{itemFormError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialog(false)} disabled={savingItem}>Cancelar</Button>
              <Button type="submit" disabled={savingItem}>{savingItem ? "Guardando..." : editingItem ? "Actualizar" : "Agregar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog eliminar item */}
      <AlertDialog open={deleteItemDlg.open} onOpenChange={deleteItemDlg.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar producto de la lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará <span className="font-semibold text-foreground">"{deleteItemDlg.item?.nombreProducto}"</span> de la lista "{listaNombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemDlg.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItemDlg.confirm} disabled={deleteItemDlg.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteItemDlg.loading ? "Quitando..." : "Quitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Fila expandible de compra ─────────────────────────────────────────────────
function CompraRow({ compra, onRepetir, onAnular }) {
  const [expanded, setExpanded] = useState(false);
  const { getAbreviatura } = useUnidadesMedida();

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="text-sm">{fmtFecha(compra.fecha)}</TableCell>
        <TableCell className="text-sm">
          {compra.tipoComprobante ? (
            <span>{compra.tipoComprobante}{compra.numeroComprobante ? ` ${compra.numeroComprobante}` : ""}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-sm font-mono text-right">{fmt(compra.total)}</TableCell>
        <TableCell>
          <Badge variant={compra.activo ? "default" : "secondary"} className="text-xs">
            {compra.activo ? "Activa" : "Anulada"}
          </Badge>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider>
            <div className="flex gap-1 justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => toast.promise(exportarCompraPdf(compra.idCompraProveedor), { loading: "Generando PDF...", success: "PDF descargado", error: (e) => e.message })}>
                    <FaFilePdf className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar PDF</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => toast.promise(exportarCompraExcel(compra.idCompraProveedor), { loading: "Generando Excel...", success: "Excel descargado", error: (e) => e.message })}>
                    <FaFileExcel className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar Excel</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRepetir(compra)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Repetir compra</TooltipContent>
              </Tooltip>
              {compra.activo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onAnular(compra)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Anular compra</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </TableCell>
      </TableRow>

      {expanded && compra.detalles && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20 px-6 pb-4 pt-2">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs text-right">Cantidad</TableHead>
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
                  {compra.descuentoTotal > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="text-right text-sm text-muted-foreground">Descuento</TableCell>
                      <TableCell className="text-right text-sm font-mono text-muted-foreground">- {fmt(compra.descuentoTotal)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="text-right text-sm font-medium">Total sin IVA</TableCell>
                    <TableCell className="text-right text-sm font-mono font-medium">{fmt(compra.subtotal - compra.descuentoTotal)}</TableCell>
                  </TableRow>
                  {compra.ivaTotal > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="text-right text-sm text-muted-foreground">IVA</TableCell>
                      <TableCell className="text-right text-sm font-mono text-muted-foreground">{fmt(compra.ivaTotal)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="text-right text-sm font-semibold">Total</TableCell>
                    <TableCell className="text-right text-sm font-bold font-mono">{fmt(compra.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {compra.observacion && (
              <p className="text-xs text-muted-foreground mt-2">Obs: {compra.observacion}</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const EMPTY_LISTA_FORM = { nombre: "", observaciones: "", ivaPorDefecto: 21 };

export default function ProveedorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermission();

  // Proveedor
  const [proveedor, setProveedor] = useState(null);
  const [loadingProveedor, setLoadingProveedor] = useState(true);
  const [showEditProveedor, setShowEditProveedor] = useState(false);

  // Listas de precios
  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(false);

  // Dialog crear/editar lista
  const [listaDialog, setListaDialog] = useState(false);
  const [editingLista, setEditingLista] = useState(null);
  const [listaForm, setListaForm] = useState(EMPTY_LISTA_FORM);
  const [listaFormError, setListaFormError] = useState("");
  const [savingLista, setSavingLista] = useState(false);

  const deleteListaDlg = useConfirmDialog(async (lista) => {
    await deleteLista(lista.idLista);
    toast.success(`"${lista.nombre}" eliminada`);
    loadListas();
  });
  const toggleListaDlg = useConfirmDialog(async (lista) => {
    await toggleActivoLista(lista.idLista);
    toast.success(lista.activo ? `"${lista.nombre}" desactivada` : `"${lista.nombre}" activada`);
    loadListas();
  });

  // Compras
  const [comprasData, setComprasData] = useState({ items: [], totalPages: 0, totalCount: 0 });
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [activoFiltro, setActivoFiltro] = useState("true");
  const [pageCompras, setPageCompras] = useState(1);
  const PAGE_SIZE_COMPRAS = 10;
  const [searchCompras, setSearchCompras] = useState("");
  const [fechaDesdeCompras, setFechaDesdeCompras] = useState("");
  const [fechaHastaCompras, setFechaHastaCompras] = useState("");

  // Dialog exportación global proveedor
  const [exportProvDialog, setExportProvDialog] = useState(false);
  const [exportProvType, setExportProvType] = useState("pdf");
  const [exportProvDesde, setExportProvDesde] = useState("");
  const [exportProvHasta, setExportProvHasta] = useState("");
  const [exportProvLoading, setExportProvLoading] = useState(false);

  // Dialog compra
  const [compraFormOpen, setCompraFormOpen] = useState(false);
  const [compraParaRepetir, setCompraParaRepetir] = useState(null);
  const [idListaParaCompra, setIdListaParaCompra] = useState(null);
  // Sentinel para auto-abrir el form cuando se navega desde ListaDetailsPage
  const pendingCompraSentinel = useRef(
    location.state?.abrirCompra === true ? { idLista: location.state?.idLista ?? null } : null
  );

  // Dialog anular
  const [anularDialog, setAnularDialog] = useState(false);
  const [compraAAnular, setCompraAAnular] = useState(null);

  // Modal importar Excel (por lista)
  const [importarModal, setImportarModal] = useState(false);
  const [listaParaImportar, setListaParaImportar] = useState(null);

  // ── Carga ─────────────────────────────────────────────────────────────────
  useEffect(() => { loadProveedor(); loadListas(); }, [id]);

  // Auto-abrir form de compra cuando se viene desde ListaDetailsPage
  useEffect(() => {
    if (pendingCompraSentinel.current && proveedor && !compraFormOpen) {
      setIdListaParaCompra(pendingCompraSentinel.current.idLista);
      setCompraFormOpen(true);
      pendingCompraSentinel.current = null;
    }
  }, [proveedor]);

  const loadProveedor = async () => {
    try {
      setLoadingProveedor(true);
      setProveedor(await getProveedorById(id));
    } catch (err) {
      toast.error("Error al cargar el proveedor: " + err.message);
    } finally {
      setLoadingProveedor(false);
    }
  };

  const loadListas = async () => {
    try {
      setLoadingListas(true);
      setListas(await fetchListasByProveedor(id) ?? []);
    } catch (err) {
      toast.error("Error al cargar las listas: " + err.message);
    } finally {
      setLoadingListas(false);
    }
  };

  const loadCompras = async (page = pageCompras, activo = activoFiltro, desde = fechaDesdeCompras, hasta = fechaHastaCompras, search = searchCompras) => {
    try {
      setLoadingCompras(true);
      const data = await getComprasByProveedor(id, { pageIndex: page, pageSize: PAGE_SIZE_COMPRAS, activo, fechaDesde: desde, fechaHasta: hasta, search });
      setComprasData(data);
    } catch (err) {
      toast.error("Error al cargar las compras: " + err.message);
    } finally {
      setLoadingCompras(false);
    }
  };

  // ── Handlers listas ───────────────────────────────────────────────────────
  const openCreateLista = () => {
    setEditingLista(null);
    setListaForm(EMPTY_LISTA_FORM);
    setListaFormError("");
    setListaDialog(true);
  };

  const openEditLista = (lista) => {
    setEditingLista(lista);
    setListaForm({ nombre: lista.nombre ?? "", observaciones: lista.observaciones ?? "", ivaPorDefecto: lista.ivaPorDefecto ?? 21 });
    setListaFormError("");
    setListaDialog(true);
  };

  const handleListaSubmit = async (e) => {
    e.preventDefault();
    if (!listaForm.nombre.trim()) { setListaFormError("El nombre es requerido."); return; }
    if (listaForm.nombre.trim().length < 2) { setListaFormError("El nombre debe tener al menos 2 caracteres."); return; }
    if (listaForm.ivaPorDefecto < 0 || listaForm.ivaPorDefecto > 100) { setListaFormError("El IVA debe estar entre 0 y 100."); return; }
    try {
      setSavingLista(true);
      setListaFormError("");
      if (editingLista) {
        await updateLista({ idLista: editingLista.idLista, nombre: listaForm.nombre.trim(), observaciones: listaForm.observaciones.trim() || null, ivaPorDefecto: listaForm.ivaPorDefecto });
        toast.success(`"${listaForm.nombre}" actualizada`);
      } else {
        await createLista({ idProveedor: Number(id), nombre: listaForm.nombre.trim(), observaciones: listaForm.observaciones.trim() || null, ivaPorDefecto: listaForm.ivaPorDefecto });
        toast.success(`"${listaForm.nombre}" creada`);
      }
      setListaDialog(false);
      loadListas();
    } catch (err) {
      setListaFormError(err.message);
    } finally {
      setSavingLista(false);
    }
  };

  // ── Handlers compras ──────────────────────────────────────────────────────
  const handleNuevaCompra = () => {
    setCompraParaRepetir(null);
    setIdListaParaCompra(null);
    setCompraFormOpen(true);
  };

  const handleRepetirCompra = (compra) => {
    setCompraParaRepetir(compra);
    setCompraFormOpen(true);
  };

  const handleAnularCompra = (compra) => {
    setCompraAAnular(compra);
    setAnularDialog(true);
  };

  const handleCompraSubmit = async (payload) => {
    try {
      await createCompra(payload);
      toast.success("Compra registrada exitosamente");
      setCompraFormOpen(false);
      setCompraParaRepetir(null);
      loadCompras(1, activoFiltro, fechaDesdeCompras, fechaHastaCompras, searchCompras);
    } catch (err) {
      toast.error("Error al registrar la compra: " + err.message);
    }
  };

  const handleExportProvConfirm = async () => {
    try {
      setExportProvLoading(true);
      const opts = { fechaDesde: exportProvDesde, fechaHasta: exportProvHasta };
      if (exportProvType === "pdf") await exportarComprasPorProveedorPdf(id, opts);
      else await exportarComprasPorProveedorExcel(id, opts);
      setExportProvDialog(false);
    } catch (err) {
      toast.error("Error al exportar: " + err.message);
    } finally {
      setExportProvLoading(false);
    }
  };

  const handleEditProveedorSubmit = async (payload) => {
    await updateProveedor(payload);
    toast.success(`"${payload.nombre}" actualizado`);
    setShowEditProveedor(false);
    loadProveedor();
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loadingProveedor) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">Cargando proveedor...</div>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-12 text-muted-foreground">Proveedor no encontrado.</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/proveedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{proveedor.nombre}</h1>
          <p className="text-sm text-muted-foreground">{proveedor.direccion || "Sin dirección registrada"}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={location.state?.tab ?? "detalle"} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-4">
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger
            value="listas"
            onClick={() => { if (listas.length === 0 && !loadingListas) loadListas(); }}
          >
            Listas de Precios
          </TabsTrigger>
          <TabsTrigger
            value="compras"
            onClick={() => { if (comprasData.items.length === 0 && !loadingCompras) loadCompras(1, activoFiltro); }}
          >
            Compras
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Detalle ──────────────────────────────────────────────────── */}
        <TabsContent value="detalle">
          {showEditProveedor ? (
            <PermissionGuard anyOf={["PROV_UPDATE"]}>
              <ProveedorForm
                initialData={proveedor}
                onSubmit={handleEditProveedorSubmit}
                onCancel={() => setShowEditProveedor(false)}
              />
            </PermissionGuard>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{proveedor.nombre}</CardTitle>
                    <CardDescription>{proveedor.direccion || "Sin dirección registrada"}</CardDescription>
                  </div>
                  {hasPermission("PROV_UPDATE") && (
                    <Button size="sm" variant="outline" onClick={() => setShowEditProveedor(true)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-base">{proveedor.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p className="text-base">{proveedor.telefono || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                    <p className="text-base">{proveedor.direccion || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab Listas ───────────────────────────────────────────────────── */}
        <TabsContent value="listas">
          <div className="space-y-3">
          <PermissionGuard permission="LP_CREATE">
            <div className="flex justify-end">
              <Button onClick={openCreateLista}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Lista
              </Button>
            </div>
          </PermissionGuard>

          {loadingListas ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Cargando listas...</div>
          ) : listas.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Sin listas de precios — creá la primera con el botón de arriba
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {listas.map((lista) => (
                <Card key={lista.idLista} className="overflow-hidden">
                  {/* Cabecera de lista */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition select-none"
                    onClick={() => navigate(`/proveedores/${id}/lista/${lista.idLista}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{lista.nombre}</span>
                        <Badge variant={lista.activo ? "default" : "secondary"} className="text-xs">
                          {lista.activo ? "Activa" : "Inactiva"}
                        </Badge>
                        {lista.cantidadItems != null && (
                          <span className="text-xs text-muted-foreground">
                            {lista.cantidadItems} producto{lista.cantidadItems !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {lista.observaciones && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lista.observaciones}</p>
                      )}
                    </div>

                    <TooltipProvider>
                      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {hasPermission("LP_ITEM_ADD") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 px-2 text-xs border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                                onClick={() => { setListaParaImportar(lista); setImportarModal(true); }}
                              >
                                <Upload className="h-3 w-3" />
                                Carga Masiva
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Carga Masiva (Excel)</TooltipContent>
                          </Tooltip>
                        )}
                        {hasPermission("LP_UPDATE") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditLista(lista)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar lista</TooltipContent>
                          </Tooltip>
                        )}
                        {hasPermission("LP_TOGGLE") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleListaDlg.openDialog(lista)}>
                                <Power className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{lista.activo ? "Desactivar" : "Activar"}</TooltipContent>
                          </Tooltip>
                        )}
                        {hasPermission("LP_DELETE") && lista.cantidadItems === 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteListaDlg.openDialog(lista)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar lista</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </div>

                </Card>
              ))}
            </div>
          )}
        </div>
        </TabsContent>

        {/* ── Tab Compras ──────────────────────────────────────────────────── */}
        <TabsContent value="compras">
          <div className="space-y-4">
          {/* Botones superiores */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setExportProvType("pdf"); setExportProvDesde(""); setExportProvHasta(""); setExportProvDialog(true); }}>
              <FaFilePdf className="mr-2 h-4 w-4 text-red-500" /> Historial PDF
            </Button>
            <Button variant="outline" onClick={() => { setExportProvType("excel"); setExportProvDesde(""); setExportProvHasta(""); setExportProvDialog(true); }}>
              <FaFileExcel className="mr-2 h-4 w-4 text-green-600" /> Historial Excel
            </Button>
            <PermissionGuard permission="COMP_CREATE">
              <Button onClick={handleNuevaCompra}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Realizar compra
              </Button>
            </PermissionGuard>
          </div>

          {/* Buscador + estado + fechas */}
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <SearchBar
                    value={searchCompras}
                    onChange={(v) => { setSearchCompras(v); setPageCompras(1); loadCompras(1, activoFiltro, fechaDesdeCompras, fechaHastaCompras, v); }}
                    placeholder="Buscar por comprobante..."
                  />
                </div>
                <Select
                  value={activoFiltro}
                  onValueChange={(v) => {
                    setActivoFiltro(v);
                    setPageCompras(1);
                    setSearchCompras("");
                    loadCompras(1, v, fechaDesdeCompras, fechaHastaCompras, "");
                  }}
                >
                  <SelectTrigger className="w-44 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Realizadas</SelectItem>
                    <SelectItem value="false">Anuladas</SelectItem>
                  </SelectContent>
                </Select>
                <DateRangeFilter
                  desde={fechaDesdeCompras}
                  hasta={fechaHastaCompras}
                  onDesdeChange={(v) => { setFechaDesdeCompras(v); setPageCompras(1); loadCompras(1, activoFiltro, v, fechaHastaCompras, searchCompras); }}
                  onHastaChange={(v) => { setFechaHastaCompras(v); setPageCompras(1); loadCompras(1, activoFiltro, fechaDesdeCompras, v, searchCompras); }}
                  onClear={() => { setFechaDesdeCompras(""); setFechaHastaCompras(""); setPageCompras(1); loadCompras(1, activoFiltro, "", "", searchCompras); }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          {loadingCompras ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">Cargando compras...</CardContent></Card>
          ) : comprasData.items.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                {activoFiltro === "true" ? "Sin compras realizadas para este proveedor" : "Sin compras anuladas para este proveedor"}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="w-10" />
                          <TableHead>Fecha</TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comprasData.items.map((c) => (
                          <CompraRow
                            key={c.idCompraProveedor}
                            compra={c}
                            onRepetir={handleRepetirCompra}
                            onAnular={handleAnularCompra}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Paginación */}
              {comprasData.totalCount > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <AuditPagination
                    metadata={{
                      pagedIndex: pageCompras,
                      totalPages: comprasData.totalPages,
                      totalCount: comprasData.totalCount,
                      hasPreviousPage: pageCompras > 1,
                      hasNextPage: pageCompras < comprasData.totalPages,
                    }}
                    pageSize={PAGE_SIZE_COMPRAS}
                    onPageChange={(p) => { setPageCompras(p); loadCompras(p, activoFiltro, fechaDesdeCompras, fechaHastaCompras, searchCompras); }}
                    showPageSize={false}
                  />
                </Card>
              )}
            </>
          )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: crear/editar lista ───────────────────────────────────────── */}
      <Dialog open={listaDialog} onOpenChange={(v) => { if (!savingLista) setListaDialog(v); }}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingLista ? "Editar Lista de Precios" : "Nueva Lista de Precios"}</DialogTitle>
            <DialogDescription>
              {editingLista ? `Modificando "${editingLista.nombre}"` : `Creando una lista para ${proveedor.nombre}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleListaSubmit} className="space-y-4 min-w-0">
            <div className="space-y-1">
              <Label htmlFor="lista-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="lista-nombre" placeholder="Ej: Lista Marzo 2025"
                value={listaForm.nombre}
                onChange={(e) => setListaForm((p) => ({ ...p, nombre: e.target.value }))}
                disabled={savingLista}
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lista-obs">Observaciones</Label>
              <Textarea id="lista-obs" placeholder="Observaciones opcionales..." rows={3}
                value={listaForm.observaciones}
                onChange={(e) => setListaForm((p) => ({ ...p, observaciones: e.target.value }))}
                disabled={savingLista}
                maxLength={500}
                className="resize-none w-full"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lista-iva">
                IVA por defecto (%)
                <span className="ml-1 text-xs text-muted-foreground font-normal">— se aplica al importar Excel o cargar ítems</span>
              </Label>
              <Input
                id="lista-iva"
                inputMode="decimal"
                className="w-32"
                value={listaForm.ivaPorDefecto}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  const val = parseFloat(raw);
                  setListaForm((p) => ({ ...p, ivaPorDefecto: isNaN(val) ? 0 : Math.min(val, 100) }));
                }}
                disabled={savingLista}
                maxLength={6}
              />
            </div>
            {listaFormError && <p className="text-sm text-destructive">{listaFormError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setListaDialog(false)} disabled={savingLista}>Cancelar</Button>
              <Button type="submit" disabled={savingLista}>{savingLista ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: eliminar lista ──────────────────────────────────────── */}
      <AlertDialog open={deleteListaDlg.open} onOpenChange={deleteListaDlg.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <span className="font-semibold text-foreground">"{deleteListaDlg.item?.nombre}"</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteListaDlg.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteListaDlg.confirm} disabled={deleteListaDlg.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteListaDlg.loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── AlertDialog: toggle lista ────────────────────────────────────────── */}
      <AlertDialog open={toggleListaDlg.open} onOpenChange={toggleListaDlg.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleListaDlg.item?.activo ? "¿Desactivar lista?" : "¿Activar lista?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleListaDlg.item?.activo
                ? `"${toggleListaDlg.item?.nombre}" quedará como inactiva.`
                : `"${toggleListaDlg.item?.nombre}" volverá a estar activa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleListaDlg.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={toggleListaDlg.confirm} disabled={toggleListaDlg.loading}>
              {toggleListaDlg.loading ? "Procesando..." : toggleListaDlg.item?.activo ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: formulario de compra ─────────────────────────────────────── */}
      <Dialog open={compraFormOpen} onOpenChange={(v) => { if (!v) { setCompraFormOpen(false); setCompraParaRepetir(null); setIdListaParaCompra(null); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{compraParaRepetir ? "Repetir Compra" : "Nueva Compra"}</DialogTitle>
            <DialogDescription>
              {compraParaRepetir
                ? "Los datos de la compra anterior están precargados. Revisá y ajustá antes de confirmar."
                : `Registrando compra para ${proveedor.nombre}`}
            </DialogDescription>
          </DialogHeader>
          <CompraForm
            proveedorInicial={proveedor}
            listaInicial={idListaParaCompra}
            compraParaRepetir={compraParaRepetir ?? undefined}
            onSubmit={handleCompraSubmit}
            onCancel={() => {
              const origenLista = idListaParaCompra;
              setCompraFormOpen(false);
              setCompraParaRepetir(null);
              setIdListaParaCompra(null);
              if (origenLista) navigate(`/proveedores/${id}/lista/${origenLista}`);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Dialog: exportar compras del proveedor ───────────────────────────── */}
      <Dialog open={exportProvDialog} onOpenChange={setExportProvDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportProvType === "pdf" ? <FaFilePdf className="h-4 w-4 text-red-500" /> : <FaFileExcel className="h-4 w-4 text-green-600" />}
              Exportar compras — {exportProvType === "pdf" ? "PDF" : "Excel"}
            </DialogTitle>
            <DialogDescription>
              Seleccioná el período. Si no elegís fechas se exportan todas las compras de este proveedor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <DateRangeFilter
              desde={exportProvDesde}
              hasta={exportProvHasta}
              onDesdeChange={setExportProvDesde}
              onHastaChange={setExportProvHasta}
              onClear={() => { setExportProvDesde(""); setExportProvHasta(""); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportProvDialog(false)} disabled={exportProvLoading}>
              Cancelar
            </Button>
            <Button onClick={handleExportProvConfirm} disabled={exportProvLoading}>
              <Download className="mr-2 h-4 w-4" />
              {exportProvLoading ? "Generando..." : "Descargar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: anular compra ────────────────────────────────────────────── */}
      <AnularCompraDialog
        open={anularDialog}
        onOpenChange={setAnularDialog}
        compra={compraAAnular}
        onSuccess={() => loadCompras(1, activoFiltro, fechaDesdeCompras, fechaHastaCompras, searchCompras)}
      />

      {/* ── Modal: carga masiva de precios ────────────────────────────────────── */}
      {listaParaImportar && (
        <BulkPriceImportModal
          open={importarModal}
          onOpenChange={(v) => { setImportarModal(v); if (!v) setListaParaImportar(null); }}
          idLista={listaParaImportar.idLista}
          listaNombre={listaParaImportar.nombre}
          onSuccess={loadListas}
        />
      )}

    </div>
  );
}
