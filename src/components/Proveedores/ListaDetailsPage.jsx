import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

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
  addItem,
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

  // Dialog add / edit item
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = agregar
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

    if (!editingItem && !itemForm.producto) {
      setItemFormError("Seleccioná un producto.");
      return;
    }
    if (isNaN(precio) || precio < 0) {
      setItemFormError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    if (margen !== null && (isNaN(margen) || margen < 0)) {
      setItemFormError("El margen debe ser un número mayor o igual a 0.");
      return;
    }

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
    n != null
      ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
      : "-";

  const formatMargen = (n) =>
    n != null ? `${(n * 100).toFixed(1)}%` : "-";

  // ── Loading / not found ──────────────────────────────────────────────────
  if (loadingLista) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al proveedor
        </Button>
        <div className="text-center py-12 text-muted-foreground">Cargando lista...</div>
      </div>
    );
  }

  if (!lista) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`)}>
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
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/proveedores/${idProveedor}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al proveedor
        </Button>
        <h1 className="text-2xl font-bold">Lista de Precios</h1>
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
        <div className="flex items-center justify-between">
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
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Sin productos en esta lista — agregá el primero con el botón de arriba
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.idProducto} className="hover:bg-muted/40 transition">
                        <TableCell className="font-medium">
                          {item.nombreProducto || `Producto #${item.idProducto}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.marca || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.precio)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatMargen(item.margen)}
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
                    ))
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

      {/* ── Dialog: agregar / editar item ─────────────────────────────────── */}
      <Dialog open={itemDialog} onOpenChange={(v) => { if (!savingItem) setItemDialog(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar precio" : "Agregar producto a la lista"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Modificando precio de "${editingItem.nombreProducto}"`
                : `Seleccioná un producto y definí su precio en "${lista.nombre}"`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleItemSubmit} className="space-y-4">
            {/* Búsqueda de producto — solo al agregar */}
            {!editingItem && (
              <div className="space-y-1">
                <Label>
                  Producto <span className="text-destructive">*</span>
                </Label>
                <ProductSearch
                  value={itemForm.producto}
                  onChange={(p) => {
                    const precioActual = p?.precio ?? p?.Precio;
                    setItemForm((prev) => ({
                      ...prev,
                      producto: p,
                      // Auto-rellena el precio si el campo está vacío o si es un producto nuevo
                      precio: precioActual != null ? String(precioActual) : prev.precio,
                    }));
                  }}
                  disabled={savingItem}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="item-precio">
                  Precio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="item-precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.precio}
                  onChange={(e) => setItemForm((p) => ({ ...p, precio: e.target.value }))}
                  disabled={savingItem}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="item-margen">
                  Margen{" "}
                  <span className="text-muted-foreground font-normal text-xs">(opcional, ej: 0.25)</span>
                </Label>
                <Input
                  id="item-margen"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={itemForm.margen}
                  onChange={(e) => setItemForm((p) => ({ ...p, margen: e.target.value }))}
                  disabled={savingItem}
                />
              </div>
            </div>

            {itemFormError && (
              <p className="text-sm text-destructive">{itemFormError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemDialog(false)}
                disabled={savingItem}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingItem}>
                {savingItem ? "Guardando..." : editingItem ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
