import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  getListaById,
  fetchItemsByLista,
  addItemsBulk,
  updateItem,
  deleteItem,
} from "@/services/ProveedorQueries";
import { fetchAvailableProducts } from "@/services/SaleQueries";

// ── Buscador de productos con dropdown ──────────────────────────────────────
function ProductSearch({ value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
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
    onChange(null); // limpiar selección mientras escribe
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
    onChange(producto); // devuelve el objeto completo con precio incluido
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
      {searching && (
        <p className="text-xs text-muted-foreground mt-1">Buscando...</p>
      )}
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

// ── Página principal ─────────────────────────────────────────────────────────
const EMPTY_ITEM_FORM = { producto: null, precio: "", margen: "" };

export default function ListaDetailsPage() {
  const { id: idProveedor, idLista } = useParams();
  const navigate = useNavigate();

  const [lista, setLista] = useState(null);
  const [loadingLista, setLoadingLista] = useState(true);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Dialog add (multi) / edit (single)
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = modo agregar múltiple

  // Estado modo agregar múltiple
  const [stagingItems, setStagingItems] = useState([]); // [{ idProducto, nombreProducto, marca, precioNeto }]
  const [currentProducto, setCurrentProducto] = useState(null);
  const [currentPrecio, setCurrentPrecio] = useState("");
  const [currentPrecioError, setCurrentPrecioError] = useState("");

  // Estado modo editar uno
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [itemFormError, setItemFormError] = useState("");
  const [savingItem, setSavingItem] = useState(false);


  // Dialog eliminar item
  const deleteItemDialog = useConfirmDialog(async (item) => {
    await deleteItem(idLista, item.idProducto);
    toast.success(`"${item.nombreProducto}" quitado de la lista`);
    loadItems();
  });

  // ── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadLista();
    loadItems();
  }, [idLista]);

  const loadLista = async () => {
    try {
      setLoadingLista(true);
      const data = await getListaById(idLista);
      setLista(data);
    } catch (err) {
      toast.error("Error al cargar la lista: " + err.message);
    } finally {
      setLoadingLista(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoadingItems(true);
      const data = await fetchItemsByLista(idLista);
      setItems(data ?? []);
    } catch (err) {
      toast.error("Error al cargar los productos: " + err.message);
    } finally {
      setLoadingItems(false);
    }
  };

  // ── Handlers items ───────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setStagingItems([]);
    setCurrentProducto(null);
    setCurrentPrecio("");
    setCurrentPrecioError("");
    setItemFormError("");
    setItemDialog(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const iva = lista?.ivaPorDefecto ?? 21;
    const precioNeto = item.precio != null
      ? String(+(item.precio / (1 + iva / 100)).toFixed(2))
      : "";
    setItemForm({ producto: null, precio: precioNeto, margen: "" });
    setItemFormError("");
    setItemDialog(true);
  };

  const agregarAlStaging = () => {
    if (!currentProducto) { setCurrentPrecioError("Seleccioná un producto."); return; }
    const precio = parseFloat(currentPrecio);
    if (isNaN(precio) || precio < 0) { setCurrentPrecioError("Ingresá un costo neto válido."); return; }

    const idProducto = currentProducto.idProducto ?? currentProducto.IdProducto;
    setStagingItems((prev) => {
      const existe = prev.find((i) => i.idProducto === idProducto);
      if (existe) return prev.map((i) => i.idProducto === idProducto ? { ...i, precioNeto: precio } : i);
      return [...prev, {
        idProducto,
        nombreProducto: currentProducto.nombre ?? currentProducto.Nombre ?? "",
        marca: currentProducto.marca ?? currentProducto.Marca ?? "",
        precioNeto: precio,
      }];
    });
    setCurrentProducto(null);
    setCurrentPrecio("");
    setCurrentPrecioError("");
  };

  const handleBulkSubmit = async () => {
    if (stagingItems.length === 0) return;
    setSavingItem(true);
    setItemFormError("");
    try {
      const result = await addItemsBulk(idLista, stagingItems.map((i) => ({ idProducto: i.idProducto, precio: i.precioNeto })));
      const msg = [
        result.insertados > 0 && `${result.insertados} agregado${result.insertados !== 1 ? "s" : ""}`,
        result.actualizados > 0 && `${result.actualizados} actualizado${result.actualizados !== 1 ? "s" : ""}`,
      ].filter(Boolean).join(", ");
      toast.success(msg || "Guardado");
      setItemDialog(false);
      loadItems();
    } catch (err) {
      setItemFormError(err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const precio = parseFloat(itemForm.precio);
    if (isNaN(precio) || precio < 0) { setItemFormError("El costo neto debe ser un número mayor o igual a 0."); return; }
    try {
      setSavingItem(true);
      setItemFormError("");
      await updateItem(idLista, editingItem.idProducto, { idProducto: editingItem.idProducto, precio });
      toast.success("Precio actualizado");
      setItemDialog(false);
      loadItems();
    } catch (err) {
      setItemFormError(err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const formatCurrency = (n) =>
    n != null
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
      : "-";

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loadingLista) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`, { state: { tab: "listas" } })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al proveedor
        </Button>
        <div className="text-center py-12 text-muted-foreground">Cargando lista...</div>
      </div>
    );
  }

  if (!lista) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`, { state: { tab: "listas" } })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al proveedor
        </Button>
        <div className="text-center py-12 text-muted-foreground">Lista no encontrada.</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`, { state: { tab: "listas" } })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al proveedor
          </Button>
          <h1 className="text-2xl font-bold">Lista de Precios</h1>
        </div>
        <PermissionGuard permission="COMP_CREATE">
          <Button
            onClick={() => navigate(`/proveedores/${idProveedor}`, {
              state: { tab: "compras", abrirCompra: true, idLista: Number(idLista) },
            })}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Realizar compra
          </Button>
        </PermissionGuard>
      </div>

      {/* Card info lista */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{lista.nombre}</CardTitle>
              <CardDescription>
                {lista.observaciones || "Sin observaciones"}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={lista.activo ? "default" : "secondary"}>
                {lista.activo ? "Activa" : "Inactiva"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                IVA por defecto: {lista.ivaPorDefecto ?? 21}%
              </span>
              {lista.fechaCreacion && (
                <span className="text-xs text-muted-foreground">
                  Creada el {new Date(lista.fechaCreacion).toLocaleDateString("es-AR")}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla de items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Productos en la lista</h2>
          <PermissionGuard permission="LP_ITEM_ADD">
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> Agregar producto
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Producto</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Costo neto</TableHead>
                    <TableHead className="text-right">IVA ({lista?.ivaPorDefecto ?? 21}%)</TableHead>
                    <TableHead className="text-right">Costo final</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Sin productos en esta lista — agregá el primero con el botón de arriba
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const iva = lista?.ivaPorDefecto ?? 21;
                      const costoNeto = item.precio / (1 + iva / 100);
                      const ivaImporte = item.precio - costoNeto;
                      return (
                      <TableRow key={item.idProducto} className="hover:bg-muted/40 transition">
                        <TableCell className="font-medium">
                          {item.nombreProducto || `Producto #${item.idProducto}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.marca || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(costoNeto)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(ivaImporte)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(item.precio)}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex gap-2 justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => openEdit(item)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar precio</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => deleteItemDialog.openDialog(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Quitar de la lista</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <p className="text-sm text-muted-foreground text-right">
            {items.length} producto{items.length !== 1 ? "s" : ""} en la lista
          </p>
        )}
      </div>

      {/* ── Dialog: agregar múltiple ──────────────────────────────────────── */}
      {!editingItem && (
        <Dialog open={itemDialog} onOpenChange={(v) => { if (!savingItem) { setItemDialog(v); if (!v) setStagingItems([]); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar productos a la lista</DialogTitle>
              <DialogDescription>
                Buscá y agregá productos. Podés agregar varios antes de guardar.
                <span className="block mt-1 text-xs">IVA aplicado: <strong>{lista?.ivaPorDefecto ?? 21}%</strong></span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Buscador + precio */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Producto</Label>
                  <ProductSearch
                    value={currentProducto}
                    onChange={(p) => { setCurrentProducto(p); setCurrentPrecioError(""); }}
                    disabled={savingItem}
                  />
                </div>
                <div className="w-32 space-y-1">
                  <Label htmlFor="current-precio">Costo neto</Label>
                  <Input
                    id="current-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={currentPrecio}
                    onChange={(e) => { setCurrentPrecio(e.target.value); setCurrentPrecioError(""); }}
                    disabled={savingItem}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarAlStaging())}
                  />
                </div>
                <Button type="button" onClick={agregarAlStaging} disabled={savingItem} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {/* Preview costo final */}
              {currentPrecio && !isNaN(parseFloat(currentPrecio)) && parseFloat(currentPrecio) >= 0 && (
                <p className="text-xs text-muted-foreground">
                  Costo final (c/IVA):{" "}
                  <strong>{formatCurrency(parseFloat(currentPrecio) * (1 + (lista?.ivaPorDefecto ?? 21) / 100))}</strong>
                </p>
              )}

              {currentPrecioError && (
                <p className="text-xs text-destructive">{currentPrecioError}</p>
              )}

              {/* Lista staging */}
              {stagingItems.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="text-xs">Producto</TableHead>
                        <TableHead className="text-xs text-right">Costo neto</TableHead>
                        <TableHead className="text-xs text-right">Costo final</TableHead>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stagingItems.map((i) => (
                        <TableRow key={i.idProducto}>
                          <TableCell className="text-sm py-2">{i.nombreProducto}</TableCell>
                          <TableCell className="text-sm text-right py-2 font-mono">{formatCurrency(i.precioNeto)}</TableCell>
                          <TableCell className="text-sm text-right py-2 font-mono font-semibold">
                            {formatCurrency(i.precioNeto * (1 + (lista?.ivaPorDefecto ?? 21) / 100))}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setStagingItems((prev) => prev.filter((x) => x.idProducto !== i.idProducto))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {itemFormError && <p className="text-sm text-destructive">{itemFormError}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setItemDialog(false); setStagingItems([]); }} disabled={savingItem}>
                Cancelar
              </Button>
              <Button onClick={handleBulkSubmit} disabled={savingItem || stagingItems.length === 0}>
                {savingItem ? "Guardando..." : `Guardar ${stagingItems.length > 0 ? `(${stagingItems.length})` : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Dialog: editar precio de un item ─────────────────────────────── */}
      {editingItem && (
        <Dialog open={itemDialog} onOpenChange={(v) => { if (!savingItem) setItemDialog(v); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar costo</DialogTitle>
              <DialogDescription>
                Modificando costo de <strong>"{editingItem.nombreProducto}"</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="edit-precio">Costo neto (sin IVA)</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.precio}
                  onChange={(e) => setItemForm((p) => ({ ...p, precio: e.target.value }))}
                  disabled={savingItem}
                  autoFocus
                />
                {itemForm.precio && !isNaN(parseFloat(itemForm.precio)) && (
                  <p className="text-xs text-muted-foreground">
                    Costo final (c/IVA {lista?.ivaPorDefecto ?? 21}%):{" "}
                    <strong>{formatCurrency(parseFloat(itemForm.precio) * (1 + (lista?.ivaPorDefecto ?? 21) / 100))}</strong>
                  </p>
                )}
              </div>

              {itemFormError && <p className="text-sm text-destructive">{itemFormError}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setItemDialog(false)} disabled={savingItem}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingItem}>
                  {savingItem ? "Guardando..." : "Actualizar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── AlertDialog: eliminar item ─────────────────────────────────────── */}
      <AlertDialog open={deleteItemDialog.open} onOpenChange={deleteItemDialog.closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar producto de la lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará{" "}
              <span className="font-semibold text-foreground">
                "{deleteItemDialog.item?.nombreProducto}"
              </span>{" "}
              de la lista "{lista.nombre}". Podés volver a agregarlo después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemDialog.loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItemDialog.confirm}
              disabled={deleteItemDialog.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItemDialog.loading ? "Quitando..." : "Quitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
