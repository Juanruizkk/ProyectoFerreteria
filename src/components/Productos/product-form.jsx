import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, X, Barcode, Plus, Trash2, Loader2 } from "lucide-react";
import { fetchUnidadesMedida } from "@/services/UnidadMedidaQueries";

export default function ProductForm({
  producto,
  categorias,
  ubicaciones,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const esEdicion = Boolean(producto);

  const mapProductoToState = (p) => ({
    nombre: p?.nombre ?? "",
    marca: p?.marca ?? "",
    descripcion: p?.descripcion ?? "",
    precio: p?.precio?.toString() ?? "",
    costo: p?.costo?.toString() ?? "0",
    porcentajeGanancia: p?.porcentajeGanancia?.toString() ?? "30",
    stock: p?.stock?.toString() ?? "",
    stockMinimo: (p?.stockMinimo ?? p?.stock_minimo)?.toString() ?? "",
    idUbicacion: (p?.idUbicacion ?? p?.id_ubicacion)?.toString() ?? "",
    idCategoria: (p?.idCategoria ?? p?.id_categoria)?.toString() ?? "",
    idUnidadMedida: String(p?.idUnidadMedida ?? 1),
    ventaSinStock: Boolean(p?.ventaSinStock ?? p?.venta_sin_stock ?? false),
  });

  const [formData, setFormData] = useState(() => mapProductoToState(producto));
  const [errores, setErrores] = useState({});

  // Barcodes: en edición se preservan sin mostrarlos; en alta son editables
  const [codigosBarras, setCodigosBarras] = useState([]);
  const [agregarCodigosBarras, setAgregarCodigosBarras] = useState(false);
  const [codigoBarraInput, setCodigoBarraInput] = useState("");
  const [errorCodigoBarra, setErrorCodigoBarra] = useState("");

  useEffect(() => {
    setFormData(mapProductoToState(producto));
    setErrores({});

    if (producto?.codigoBarras && Array.isArray(producto.codigoBarras)) {
      setCodigosBarras(producto.codigoBarras.map((cb) => ({
        idCodigo: cb.idCodigo ?? cb.IdCodigo ?? 0,
        codigo: cb.codigo ?? cb.Codigo ?? "",
      })));
      setAgregarCodigosBarras(producto.codigoBarras.length > 0);
    } else {
      setCodigosBarras([]);
      setAgregarCodigosBarras(false);
    }
    setCodigoBarraInput("");
    setErrorCodigoBarra("");
  }, [producto]);

  const [unidades, setUnidades] = useState([]);
  useEffect(() => {
    fetchUnidadesMedida().then(setUnidades).catch(() => {});
  }, []);

  // ¿La unidad elegida permite decimales?
  const esDecimal = formData.idUnidadMedida !== "1";
  const stepCantidad = esDecimal ? "0.01" : "1";

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errores[field]) setErrores((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCostoChange = (val) => {
    const costo = parseFloat(val);
    const margen = parseFloat(formData.porcentajeGanancia);
    setFormData((prev) => ({
      ...prev,
      costo: val,
      precio: Number.isFinite(costo) && Number.isFinite(margen)
        ? (costo * (1 + margen / 100)).toFixed(2)
        : prev.precio,
    }));
    if (errores.precio) setErrores((prev) => ({ ...prev, precio: "" }));
  };

  const handleMargenChange = (val) => {
    const margen = parseFloat(val);
    const costo = parseFloat(formData.costo);
    setFormData((prev) => ({
      ...prev,
      porcentajeGanancia: val,
      precio: Number.isFinite(costo) && costo > 0 && Number.isFinite(margen)
        ? (costo * (1 + margen / 100)).toFixed(2)
        : prev.precio,
    }));
  };

  const handlePrecioChange = (val) => {
    const precio = parseFloat(val);
    const costo = parseFloat(formData.costo);
    setFormData((prev) => ({
      ...prev,
      precio: val,
      porcentajeGanancia: Number.isFinite(precio) && Number.isFinite(costo) && costo > 0
        ? ((precio / costo - 1) * 100).toFixed(2)
        : prev.porcentajeGanancia,
    }));
    if (errores.precio) setErrores((prev) => ({ ...prev, precio: "" }));
  };

  const handleAgregarCodigoBarra = () => {
    setErrorCodigoBarra("");
    if (!codigoBarraInput.trim()) {
      setErrorCodigoBarra("El código de barra no puede estar vacío");
      return;
    }
    if (codigosBarras.some((cb) => cb.codigo === codigoBarraInput.trim())) {
      setErrorCodigoBarra("Este código de barra ya fue agregado");
      return;
    }
    setCodigosBarras((prev) => [...prev, { idCodigo: 0, codigo: codigoBarraInput.trim() }]);
    setCodigoBarraInput("");
  };

  const handleEliminarCodigoBarra = (codigo) => {
    setCodigosBarras((prev) => prev.filter((cb) => cb.codigo !== codigo));
    setErrorCodigoBarra("");
  };

  const handleToggleCodigosBarras = (checked) => {
    setAgregarCodigosBarras(checked);
    if (!checked) {
      setCodigosBarras([]);
      setCodigoBarraInput("");
      setErrorCodigoBarra("");
    }
  };

  const toInt = (v, def = 0) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  };
  const toMoney2 = (v, def = 0) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return def;
    return Math.round(n * 100) / 100;
  };
  // Para stock/stockMinimo cuando la unidad es decimal
  const toCantidad = (v, def = 0) => esDecimal ? toMoney2(v, def) : toInt(v, def);

  const validarFormulario = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!formData.marca.trim()) e.marca = "La marca es requerida";
    else if (formData.marca.length > 100) e.marca = "Máximo 100 caracteres";
    if ((formData.descripcion || "").length > 100) e.descripcion = "Máximo 100 caracteres";
    const precioOk = Number.isFinite(parseFloat(formData.precio)) && toMoney2(formData.precio) > 0;
    if (!precioOk) e.precio = "El precio debe ser un número mayor a 0 (2 decimales)";
    if (!esEdicion) {
      const stockN = esDecimal ? parseFloat(formData.stock) : toInt(formData.stock, NaN);
      if (!Number.isFinite(stockN) || stockN < 0)
        e.stock = esDecimal ? "El stock debe ser un número ≥ 0" : "El stock debe ser un entero ≥ 0";
    }
    const stockMinN = esDecimal ? parseFloat(formData.stockMinimo) : toInt(formData.stockMinimo, NaN);
    if (!Number.isFinite(stockMinN) || stockMinN < 0)
      e.stockMinimo = esDecimal ? "El stock mínimo debe ser un número ≥ 0" : "El stock mínimo debe ser un entero ≥ 0";
    if (!formData.idCategoria) e.idCategoria = "Debe seleccionar una categoría";
    if (!formData.idUbicacion) e.idUbicacion = "Debe seleccionar una ubicación";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    // Si el usuario escribió un código pero no lo confirmó con +, agregarlo automáticamente
    let codigosFinales = codigosBarras;
    if (!esEdicion && agregarCodigosBarras && codigoBarraInput.trim()) {
      const codigoPendiente = codigoBarraInput.trim();
      if (!codigosFinales.some((cb) => cb.codigo === codigoPendiente)) {
        codigosFinales = [...codigosFinales, { idCodigo: 0, codigo: codigoPendiente }];
      }
    }

    const payload = {
      nombre: formData.nombre.trim(),
      marca: formData.marca.trim(),
      descripcion: formData.descripcion?.trim() || "",
      precio: toMoney2(formData.precio, 0),
      costo: toMoney2(formData.costo, 0),
      porcentajeGanancia: toMoney2(formData.porcentajeGanancia, 30),
      stock: toCantidad(formData.stock, 0),
      stockMinimo: toCantidad(formData.stockMinimo, 0),
      ventaSinStock: Boolean(formData.ventaSinStock),
      idUbicacion: toInt(formData.idUbicacion, 0),
      idCategoria: toInt(formData.idCategoria, 0),
      idUnidadMedida: toInt(formData.idUnidadMedida, 1),
      activo: true,
      codigoBarras: esEdicion ? codigosBarras : (agregarCodigosBarras ? codigosFinales : []),
    };

    if (producto?.id ?? producto?.id_producto ?? producto?.idProducto) {
      const anyId = producto.id ?? producto.id_producto ?? producto.idProducto;
      payload.id = anyId;
      payload.idProducto = anyId;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre + Marca */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Nombre del producto"
            className={errores.nombre ? "border-destructive" : ""}
          />
          {errores.nombre && <p className="text-sm text-destructive">{errores.nombre}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="marca">Marca *</Label>
          <Input
            id="marca"
            value={formData.marca}
            maxLength={100}
            onChange={(e) => handleInputChange("marca", e.target.value)}
            placeholder="Marca (máx. 100)"
            className={errores.marca ? "border-destructive" : ""}
          />
          {errores.marca && <p className="text-sm text-destructive">{errores.marca}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          maxLength={100}
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Descripción del producto (opcional, máx. 100)"
          rows={2}
          className={errores.descripcion ? "border-destructive" : ""}
        />
        {errores.descripcion && <p className="text-sm text-destructive">{errores.descripcion}</p>}
      </div>

      {/* Unidad de Medida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unidadMedida">Unidad de Medida *</Label>
          <Select
            value={formData.idUnidadMedida}
            onValueChange={(v) => handleInputChange("idUnidadMedida", v)}
          >
            <SelectTrigger id="unidadMedida">
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((u) => (
                <SelectItem key={String(u.idUnidadMedida)} value={String(u.idUnidadMedida)}>
                  {u.nombre} ({u.abreviatura})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Costo + Margen + Precio de venta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costo">Costo (con IVA)</Label>
          <Input
            id="costo"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo}
            onChange={(e) => handleCostoChange(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="porcentajeGanancia">Margen (%)</Label>
          <Input
            id="porcentajeGanancia"
            type="number"
            step="0.1"
            min="0"
            value={formData.porcentajeGanancia}
            onChange={(e) => handleMargenChange(e.target.value)}
            placeholder="30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="precio">
            Precio de venta *
            <span className="ml-1 text-xs text-muted-foreground font-normal">(o editalo para recalcular el margen)</span>
          </Label>
          <Input
            id="precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio}
            onChange={(e) => handlePrecioChange(e.target.value)}
            placeholder="0.00"
            className={errores.precio ? "border-destructive" : ""}
          />
          {errores.precio && <p className="text-sm text-destructive">{errores.precio}</p>}
        </div>
      </div>

      {/* Stock + Stock Mínimo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!esEdicion && (
          <div className="space-y-2">
            <Label htmlFor="stock">Stock inicial *</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step={stepCantidad}
              value={formData.stock}
              onChange={(e) => handleInputChange("stock", e.target.value)}
              placeholder="0"
              className={errores.stock ? "border-destructive" : ""}
            />
            {errores.stock && <p className="text-sm text-destructive">{errores.stock}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
          <Input
            id="stockMinimo"
            type="number"
            min="0"
            step={stepCantidad}
            value={formData.stockMinimo}
            onChange={(e) => handleInputChange("stockMinimo", e.target.value)}
            placeholder="0"
            className={errores.stockMinimo ? "border-destructive" : ""}
          />
          {errores.stockMinimo && <p className="text-sm text-destructive">{errores.stockMinimo}</p>}
        </div>
      </div>

      {/* Categoría + Ubicación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría *</Label>
          <Select
            value={formData.idCategoria || undefined}
            onValueChange={(v) => handleInputChange("idCategoria", v)}
          >
            <SelectTrigger id="categoria" className={errores.idCategoria ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => {
                const cid = c.idCategoria ?? c.id;
                return <SelectItem key={cid} value={String(cid)}>{c.categoria}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          {errores.idCategoria && <p className="text-sm text-destructive">{errores.idCategoria}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación *</Label>
          <Select
            value={formData.idUbicacion || undefined}
            onValueChange={(v) => handleInputChange("idUbicacion", v)}
          >
            <SelectTrigger id="ubicacion" className={errores.idUbicacion ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((u) => {
                const uid = u.idUbicacion ?? u.id;
                const label =
                  [u.fila, u.seccion, u.nivel].some((v) => v !== undefined)
                    ? `${u.seccion ?? ""}-${u.fila ?? ""}-${u.nivel ?? ""}`.trim()
                    : u.nombre ?? `Ubicación ${uid}`;
                return <SelectItem key={uid} value={String(uid)}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          {errores.idUbicacion && <p className="text-sm text-destructive">{errores.idUbicacion}</p>}
        </div>
      </div>

      {/* Venta sin stock + códigos de barra — solo en alta */}
      {!esEdicion && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              id="ventaSinStock"
              type="checkbox"
              checked={formData.ventaSinStock}
              onChange={(e) => handleInputChange("ventaSinStock", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="ventaSinStock" className="cursor-pointer font-normal">
              Permitir venta sin stock
            </Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="agregarCodigosBarras"
                type="checkbox"
                checked={agregarCodigosBarras}
                onChange={(e) => handleToggleCodigosBarras(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="agregarCodigosBarras" className="cursor-pointer flex items-center gap-2 font-normal">
                <Barcode className="h-4 w-4" />
                Agregar códigos de barra
              </Label>
            </div>

            {agregarCodigosBarras && (
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={codigoBarraInput}
                    onChange={(e) => { setCodigoBarraInput(e.target.value); setErrorCodigoBarra(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAgregarCodigoBarra(); } }}
                    placeholder="Código de barra"
                    className={errorCodigoBarra ? "border-destructive" : ""}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAgregarCodigoBarra}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errorCodigoBarra && <p className="text-sm text-destructive">{errorCodigoBarra}</p>}

                {codigosBarras.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {codigosBarras.map((cb) => (
                      <Badge key={cb.codigo} variant="secondary" className="pl-3 pr-1 py-1 gap-2 text-sm">
                        <Barcode className="h-3 w-3" />
                        {cb.codigo}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarCodigoBarra(cb.codigo)}
                          className="h-5 w-5 p-0 hover:bg-destructive/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="gap-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {esEdicion ? "Actualizando..." : "Creando..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {esEdicion ? "Actualizar" : "Crear"} Producto
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2 bg-transparent" disabled={isSubmitting}>
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}
