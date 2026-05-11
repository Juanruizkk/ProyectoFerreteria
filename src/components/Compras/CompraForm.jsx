import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fetchProveedores, fetchListasByProveedor, fetchItemsByLista } from "@/services/ProveedorQueries";
import { fetchProductsWithDetails } from "@/services/ProductQueries";
import { getCurrentUser } from "@/services/AuthService";
import { useUnidadesMedida } from "@/contexts/UnidadesMedidaContext";

// ── Constantes ───────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const TIPOS_COMPROBANTE = ["FACTURA A", "FACTURA B", "FACTURA C", "REMITO", "NOTA DE PEDIDO"];
const IVA_OPCIONES = [0, 10.5, 21, 27];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function calcLinea(det) {
  const sub = (det.cantidad || 0) * (det.precioUnitario || 0);
  const desc = sub * ((det.descuentoPorcentaje || 0) / 100);
  const base = sub - desc;
  const iva = base * ((det.ivaPorcentaje || 0) / 100);
  return { subtotal: sub, descuento: desc, total: base + iva };
}

function useDebouncedValue(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// ── Componente principal ─────────────────────────────────────────────────────

// proveedorInicial: { idProveedor, nombre } — pre-selecciona el proveedor y lo bloquea
// listaInicial: number — pre-selecciona la lista de precios (idLista)
// compraParaRepetir: compra completa — pre-carga datos como base para nueva compra
export default function CompraForm({ initialData, proveedorInicial, listaInicial, compraParaRepetir, onSubmit, onCancel }) {
  const isEditing = !!initialData;
  const { getAbreviatura } = useUnidadesMedida();

  // ── Encabezado ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    idProveedor: "",
    idLista: "",
    fecha: TODAY,
    fechaVencimiento: "",
    tipoComprobante: "",
    numeroComprobante: "",
    observacion: "",
  });
  const [errors, setErrors] = useState({});

  // ── Datos remotos ─────────────────────────────────────────────────────────
  const [proveedores, setProveedores] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(true);

  const [listas, setListas] = useState([]);
  const [loadingListas, setLoadingListas] = useState(false);

  const [itemsLista, setItemsLista] = useState([]);     // productos de la lista seleccionada
  const [loadingItems, setLoadingItems] = useState(false);
  const [filtroLista, setFiltroLista] = useState("");   // búsqueda dentro de la lista

  // ── Búsqueda de producto externo ──────────────────────────────────────────
  const [busquedaExterna, setBusquedaExterna] = useState("");
  const dqExterna = useDebouncedValue(busquedaExterna);
  const [resultadosExternos, setResultadosExternos] = useState([]);
  const [loadingExterno, setLoadingExterno] = useState(false);
  const [mostrarExterno, setMostrarExterno] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // ── Panel de lista abierto/cerrado ────────────────────────────────────────
  const [listaAbierta, setListaAbierta] = useState(true);

  // ── Carrito (detalles) ────────────────────────────────────────────────────
  const [detalles, setDetalles] = useState([]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────────────────────────────────

  // Cargar proveedores al montar (solo si no hay proveedor pre-seleccionado)
  useEffect(() => {
    if (proveedorInicial) {
      setLoadingProveedores(false);
      setForm((f) => ({ ...f, idProveedor: String(proveedorInicial.idProveedor) }));
      return;
    }
    fetchProveedores(1, 200, "", "activos")
      .then((d) => setProveedores(d.items ?? []))
      .catch(() => toast.error("No se pudieron cargar los proveedores"))
      .finally(() => setLoadingProveedores(false));
  }, []);

  // Cuando cambia el proveedor → cargar sus listas de precios
  useEffect(() => {
    if (!form.idProveedor) {
      setListas([]);
      setItemsLista([]);
      setForm((f) => ({ ...f, idLista: "" }));
      return;
    }
    setLoadingListas(true);
    setListas([]);
    setItemsLista([]);
    setForm((f) => ({ ...f, idLista: "" }));
    fetchListasByProveedor(parseInt(form.idProveedor))
      .then((data) => {
        const activas = (data ?? []).filter((l) => l.activo);
        setListas(activas);
        if (listaInicial && activas.some((l) => l.idLista === listaInicial))
          setForm((f) => ({ ...f, idLista: String(listaInicial) }));
      })
      .catch(() => toast.error("No se pudieron cargar las listas de precios"))
      .finally(() => setLoadingListas(false));
  }, [form.idProveedor]);

  // Cuando cambia la lista → cargar sus ítems
  useEffect(() => {
    if (!form.idLista) {
      setItemsLista([]);
      return;
    }
    setLoadingItems(true);
    setItemsLista([]);
    fetchItemsByLista(parseInt(form.idLista))
      .then((data) => setItemsLista(data ?? []))
      .catch(() => toast.error("No se pudieron cargar los productos de la lista"))
      .finally(() => setLoadingItems(false));
  }, [form.idLista]);

  // Búsqueda de producto externo (debounced)
  useEffect(() => {
    if (!dqExterna.trim()) {
      setResultadosExternos([]);
      setMostrarExterno(false);
      return;
    }
    setLoadingExterno(true);
    fetchProductsWithDetails(true, 1, 15, dqExterna)
      .then((d) => {
        setResultadosExternos(d.items ?? []);
        setMostrarExterno(true);
      })
      .catch(() => setResultadosExternos([]))
      .finally(() => setLoadingExterno(false));
  }, [dqExterna]);

  // Cerrar dropdown externo al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        !searchRef.current?.contains(e.target)
      ) setMostrarExterno(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hidratar si es edición
  useEffect(() => {
    if (!initialData) return;
    setForm({
      idProveedor: String(initialData.idProveedor ?? ""),
      idLista: "",
      fecha: initialData.fecha ?? TODAY,
      fechaVencimiento: initialData.fechaVencimiento ?? "",
      tipoComprobante: initialData.tipoComprobante ?? "",
      numeroComprobante: initialData.numeroComprobante ?? "",
      observacion: initialData.observacion ?? "",
    });
    if (initialData.detalles) {
      setDetalles(
        initialData.detalles.map((d) => ({
          _key: crypto.randomUUID(),
          idProducto: d.idProducto,
          nombreProducto: d.nombreProducto,
          idUnidadMedida: d.idUnidadMedida ?? null,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuentoPorcentaje: d.descuentoPorcentaje,
          ivaPorcentaje: d.ivaPorcentaje,
          margenAplicado: d.margenAplicado ?? null,
          deLista: false,
        }))
      );
    }
  }, [initialData]);

  // Hidratar si es repetición de compra (nueva compra con datos pre-cargados)
  useEffect(() => {
    if (!compraParaRepetir) return;
    setForm({
      idProveedor: String(compraParaRepetir.idProveedor ?? proveedorInicial?.idProveedor ?? ""),
      idLista: "",
      fecha: TODAY,
      fechaVencimiento: "",
      tipoComprobante: compraParaRepetir.tipoComprobante ?? "",
      numeroComprobante: "",
      observacion: compraParaRepetir.observacion ?? "",
    });
    if (compraParaRepetir.detalles) {
      setDetalles(
        compraParaRepetir.detalles.map((d) => ({
          _key: crypto.randomUUID(),
          idProducto: d.idProducto,
          nombreProducto: d.nombreProducto,
          idUnidadMedida: d.idUnidadMedida ?? null,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descuentoPorcentaje: d.descuentoPorcentaje,
          ivaPorcentaje: d.ivaPorcentaje,
          margenAplicado: d.margenAplicado ?? null,
          deLista: false,
        }))
      );
    }
  }, [compraParaRepetir]);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  // Agregar producto desde la lista de precios (precio pre-cargado)
  const agregarDesdeLista = (item) => {
    const yaExiste = detalles.some((d) => d.idProducto === item.idProducto);
    if (yaExiste) {
      setDetalles((prev) =>
        prev.map((d) =>
          d.idProducto === item.idProducto ? { ...d, cantidad: d.cantidad + 1 } : d
        )
      );
      toast.info(`Cantidad actualizada para "${item.nombreProducto}"`);
    } else {
      const iva = listaSeleccionada?.ivaPorDefecto ?? 21;
      const precioNeto = iva > 0 ? (item.precio ?? 0) / (1 + iva / 100) : (item.precio ?? 0);
      setDetalles((prev) => [
        ...prev,
        {
          _key: crypto.randomUUID(),
          idProducto: item.idProducto,
          nombreProducto: item.nombreProducto,
          idUnidadMedida: item.idUnidadMedida ?? null,
          cantidad: 1,
          precioUnitario: precioNeto,
          descuentoPorcentaje: 0,
          ivaPorcentaje: iva,
          margenAplicado: item.margen ?? null,
          deLista: true,
        },
      ]);
    }
    setErrors((e) => ({ ...e, detalles: null }));
  };

  // Agregar producto externo (precio desde el producto, o 0)
  const agregarExterno = (producto) => {
    const yaExiste = detalles.some((d) => d.idProducto === producto.id);
    if (yaExiste) {
      setDetalles((prev) =>
        prev.map((d) =>
          d.idProducto === producto.id ? { ...d, cantidad: d.cantidad + 1 } : d
        )
      );
      toast.info(`Cantidad actualizada para "${producto.nombre}"`);
    } else {
      setDetalles((prev) => [
        ...prev,
        {
          _key: crypto.randomUUID(),
          idProducto: producto.id,
          nombreProducto: producto.nombre,
          idUnidadMedida: producto.idUnidadMedida ?? null,
          cantidad: 1,
          precioUnitario: producto.precio ?? 0,
          descuentoPorcentaje: 0,
          ivaPorcentaje: 21,
          margenAplicado: producto.porcentajeGanancia ?? null,
          deLista: false,
        },
      ]);
    }
    setBusquedaExterna("");
    setMostrarExterno(false);
    setErrors((e) => ({ ...e, detalles: null }));
  };

  const actualizarDetalle = (key, field, value) => {
    const num = parseFloat(value);
    setDetalles((prev) =>
      prev.map((d) =>
        d._key === key ? { ...d, [field]: isNaN(num) ? 0 : num } : d
      )
    );
  };

  const eliminarDetalle = (key) => {
    setDetalles((prev) => prev.filter((d) => d._key !== key));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TOTALES
  // ─────────────────────────────────────────────────────────────────────────

  const totales = detalles.reduce(
    (acc, d) => {
      const { subtotal, descuento, total } = calcLinea(d);
      return {
        subtotal: acc.subtotal + subtotal,
        descuento: acc.descuento + descuento,
        iva: acc.iva + (total - (subtotal - descuento)),
        total: acc.total + total,
      };
    },
    { subtotal: 0, descuento: 0, iva: 0, total: 0 }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // VALIDACIÓN Y SUBMIT
  // ─────────────────────────────────────────────────────────────────────────

  const validar = () => {
    const e = {};
    if (!form.idProveedor) e.idProveedor = "Seleccioná un proveedor";
    if (!form.fecha) e.fecha = "La fecha es obligatoria";
    if (detalles.length === 0) e.detalles = "Agregá al menos un producto a la compra";
    detalles.forEach((d) => {
      if (d.cantidad <= 0) e.detalles = "Todas las cantidades deben ser mayores a 0";
      if (d.precioUnitario < 0) e.detalles = "Los precios no pueden ser negativos";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const user = getCurrentUser();
    const payload = {
      ...(isEditing && { idCompraProveedor: initialData.idCompraProveedor }),
      idProveedor: parseInt(form.idProveedor),
      fecha: form.fecha,
      fechaVencimiento: form.fechaVencimiento || null,
      tipoComprobante: form.tipoComprobante || null,
      numeroComprobante: form.numeroComprobante || null,
      observacion: form.observacion || null,
      idUsuario: user?.userId ?? null,
      detalles: detalles.map((d) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descuentoPorcentaje: d.descuentoPorcentaje,
        ivaPorcentaje: d.ivaPorcentaje,
        margenAplicado: d.margenAplicado ?? null,
      })),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVADOS
  // ─────────────────────────────────────────────────────────────────────────

  const itemsListaFiltrados = filtroLista.trim()
    ? itemsLista.filter(
        (i) =>
          i.nombreProducto?.toLowerCase().includes(filtroLista.toLowerCase()) ||
          i.marca?.toLowerCase().includes(filtroLista.toLowerCase())
      )
    : itemsLista;

  const listaSeleccionada = listas.find((l) => l.idLista === parseInt(form.idLista));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── PASO 1: Encabezado ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isEditing ? "Editar Compra" : "Nueva Compra"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Proveedor */}
            <div className="space-y-1.5">
              <Label>Proveedor <span className="text-destructive">*</span></Label>
              {proveedorInicial ? (
                <div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm font-medium">
                  {proveedorInicial.nombre}
                </div>
              ) : loadingProveedores ? (
                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                </div>
              ) : (
                <Select
                  value={form.idProveedor}
                  onValueChange={(v) => handleField("idProveedor", v)}
                >
                  <SelectTrigger className={errors.idProveedor ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccioná un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.idProveedor} value={String(p.idProveedor)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.idProveedor && (
                <p className="text-xs text-destructive">{errors.idProveedor}</p>
              )}
            </div>

            {/* Lista de precios */}
            <div className="space-y-1.5">
              <Label>
                Lista de precios
                <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>
              </Label>
              {loadingListas ? (
                <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando listas...
                </div>
              ) : (
                <Select
                  value={form.idLista}
                  onValueChange={(v) => handleField("idLista", v)}
                  disabled={!form.idProveedor || listas.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !form.idProveedor
                          ? "Primero seleccioná un proveedor"
                          : listas.length === 0
                          ? "Sin listas de precios"
                          : "Seleccioná una lista"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {listas.map((l) => (
                      <SelectItem key={l.idLista} value={String(l.idLista)}>
                        {l.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => handleField("fecha", e.target.value)}
                className={errors.fecha ? "border-destructive" : ""}
              />
              {errors.fecha && (
                <p className="text-xs text-destructive">{errors.fecha}</p>
              )}
            </div>

            {/* Fecha Vencimiento */}
            <div className="space-y-1.5">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => handleField("fechaVencimiento", e.target.value)}
              />
            </div>

            {/* Tipo Comprobante */}
            <div className="space-y-1.5">
              <Label>Tipo de Comprobante</Label>
              <Select
                value={form.tipoComprobante}
                onValueChange={(v) => handleField("tipoComprobante", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número Comprobante */}
            <div className="space-y-1.5">
              <Label>Número de Comprobante</Label>
              <Input
                placeholder="Ej: 0001-00012345"
                value={form.numeroComprobante}
                onChange={(e) => handleField("numeroComprobante", e.target.value)}
              />
            </div>

            {/* Observación — full width */}
            <div className="space-y-1.5 md:col-span-2">
              <Label>Observación</Label>
              <Textarea
                placeholder="Notas adicionales..."
                value={form.observacion}
                onChange={(e) => handleField("observacion", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── PASO 2: Productos de la lista ──────────────────────────────── */}
      {form.idLista && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">
                  Productos de la lista
                </CardTitle>
                {listaSeleccionada && (
                  <Badge variant="secondary">{listaSeleccionada.nombre}</Badge>
                )}
                {itemsLista.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {itemsLista.length} productos
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setListaAbierta((v) => !v)}
              >
                {listaAbierta ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {listaAbierta && (
            <CardContent className="pt-4 space-y-3">
              {loadingItems ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                </div>
              ) : itemsLista.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Esta lista no tiene productos cargados.
                </p>
              ) : (
                <>
                  {/* Filtro dentro de la lista */}
                  {itemsLista.length > 5 && (
                    <div className="relative max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-8 h-8 text-sm"
                        placeholder="Filtrar productos..."
                        value={filtroLista}
                        onChange={(e) => setFiltroLista(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className="text-xs">Producto</TableHead>
                          <TableHead className="text-xs">Marca</TableHead>
                          <TableHead className="text-xs text-right">Precio lista</TableHead>
                          <TableHead className="w-16" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsListaFiltrados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                              Sin resultados
                            </TableCell>
                          </TableRow>
                        ) : (
                          itemsListaFiltrados.map((item) => {
                            const enCarrito = detalles.some((d) => d.idProducto === item.idProducto);
                            return (
                              <TableRow
                                key={item.idProducto}
                                className={enCarrito ? "bg-primary/5" : "hover:bg-muted/40"}
                              >
                                <TableCell className="text-sm font-medium py-2">
                                  {item.nombreProducto}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground py-2">
                                  {item.marca || "-"}
                                </TableCell>
                                <TableCell className="text-sm text-right py-2 font-semibold">
                                  {fmt(item.precio)}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={enCarrito ? "secondary" : "outline"}
                                    className="h-7 text-xs"
                                    onClick={() => agregarDesdeLista(item)}
                                  >
                                    {enCarrito ? (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />+1
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3 w-3 mr-1" />Agregar
                                      </>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── PASO 3: Producto externo (fuera de lista) ──────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              {form.idLista
                ? "Agregar producto externo a la lista"
                : "Buscar y agregar productos"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchRef}
                  className="pl-9"
                  placeholder="Buscar por nombre o marca..."
                  value={busquedaExterna}
                  onChange={(e) => setBusquedaExterna(e.target.value)}
                  onFocus={() => dqExterna && setMostrarExterno(true)}
                />
                {busquedaExterna && (
                  <button
                    type="button"
                    onClick={() => { setBusquedaExterna(""); setMostrarExterno(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {loadingExterno && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>

            {/* Dropdown resultados externos */}
            {mostrarExterno && resultadosExternos.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {resultadosExternos.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => agregarExterno(prod)}
                    className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors flex items-center justify-between gap-4 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{prod.nombre}</p>
                      {prod.marca && (
                        <p className="text-xs text-muted-foreground">{prod.marca}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {fmt(prod.precio)}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          / {getAbreviatura(prod.idUnidadMedida)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">Stock: {prod.stock ?? 0}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {mostrarExterno && !loadingExterno && resultadosExternos.length === 0 && dqExterna && (
              <div
                ref={dropdownRef}
                className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-sm px-4 py-3 text-sm text-muted-foreground"
              >
                Sin resultados para "{dqExterna}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── PASO 4: Carrito / Detalle de la compra ──────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Detalle de la compra
            </CardTitle>
            {detalles.length > 0 && (
              <Badge variant="outline">{detalles.length} producto{detalles.length !== 1 ? "s" : ""}</Badge>
            )}
          </div>
          {errors.detalles && (
            <p className="text-xs text-destructive mt-1">{errors.detalles}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">

          {detalles.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-md py-10 text-center text-muted-foreground text-sm">
              <Plus className="mx-auto h-6 w-6 mb-2 opacity-40" />
              Agregá productos desde la lista o usando el buscador
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="min-w-[160px]">Producto</TableHead>
                    <TableHead className="w-10 text-center">Origen</TableHead>
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-32">Precio Unit.</TableHead>
                    <TableHead className="w-24">Desc. %</TableHead>
                    <TableHead className="w-24">IVA %</TableHead>
                    <TableHead className="w-24">Margen %</TableHead>
                    <TableHead className="w-28 text-right">Subtotal</TableHead>
                    <TableHead className="w-28 text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.map((det) => {
                    const { subtotal, total } = calcLinea(det);
                    return (
                      <TableRow key={det._key}>
                        <TableCell className="font-medium text-sm">
                          {det.nombreProducto}
                        </TableCell>

                        <TableCell className="text-center">
                          {det.deLista ? (
                            <Badge variant="secondary" className="text-xs px-1.5">Lista</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1.5">Externo</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="1"
                              className="h-8 w-20"
                              value={det.cantidad}
                              onChange={(e) => actualizarDetalle(det._key, "cantidad", e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {getAbreviatura(det.idUnidadMedida)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 w-28"
                            value={det.precioUnitario}
                            onChange={(e) => actualizarDetalle(det._key, "precioUnitario", e.target.value)}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="h-8 w-20"
                            value={det.descuentoPorcentaje}
                            onChange={(e) => actualizarDetalle(det._key, "descuentoPorcentaje", e.target.value)}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="h-8 w-20"
                            value={det.ivaPorcentaje}
                            onChange={(e) => actualizarDetalle(det._key, "ivaPorcentaje", e.target.value)}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            className="h-8 w-20"
                            placeholder="—"
                            value={det.margenAplicado ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDetalles((prev) =>
                                prev.map((d) =>
                                  d._key === det._key
                                    ? { ...d, margenAplicado: v === "" ? null : parseFloat(v) }
                                    : d
                                )
                              );
                            }}
                          />
                        </TableCell>

                        <TableCell className="text-right text-sm">{fmt(subtotal)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{fmt(total)}</TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => eliminarDetalle(det._key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totales */}
          {detalles.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2 rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(totales.subtotal)}</span>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>- {fmt(totales.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total sin IVA</span>
                    <span>{fmt(totales.subtotal - totales.descuento)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA</span>
                    <span>{fmt(totales.iva)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{fmt(totales.total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Registrar Compra"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </form>
  );
}
