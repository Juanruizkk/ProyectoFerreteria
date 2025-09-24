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
import { Save, X } from "lucide-react";

export default function ProductForm({
  producto,
  categorias,
  ubicaciones,
  onSubmit,
  onCancel,
}) {
  const mapProductoToState = (p) => ({
    nombre: p?.nombre ?? "",
    marca: p?.marca ?? "",
    descripcion: p?.descripcion ?? "",
    precio: p?.precio?.toString() ?? "",
    stock: p?.stock?.toString() ?? "",
    stockMinimo: (p?.stockMinimo ?? p?.stock_minimo)?.toString() ?? "",
    idUbicacion: (p?.idUbicacion ?? p?.id_ubicacion ?? p?.idubicacion)?.toString() ?? "",
    idCategoria: (p?.idCategoria ?? p?.id_categoria ?? p?.idcategoria)?.toString() ?? "",
    ventaSinStock: Boolean(p?.ventaSinStock ?? p?.venta_sin_stock ?? false),
  })


  const [formData, setFormData] = useState(() => mapProductoToState(producto))

  // Rehidratar el formulario si cambian las props (p. ej., editar otro producto sin cerrar)
  useEffect(() => {
    setFormData(mapProductoToState(producto))
    setErrores({})
  }, [producto])

  const [errores, setErrores] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errores[field]) {
      setErrores((prev) => ({ ...prev, [field]: "" }));
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

  const validarFormulario = () => {
    const e = {};

    // nombre: texto requerido (si tu DB realmente lo quiere int, decime y lo cambio)
    if (!formData.nombre.trim()) {
      e.nombre = "El nombre es requerido";
    }

    // marca: varchar(100)
    if (!formData.marca.trim()) e.marca = "La marca es requerida";
    else if (formData.marca.length > 100) e.marca = "Máximo 100 caracteres";

    // descripcion: varchar(100) (opcional)
    if ((formData.descripcion || "").length > 100) {
      e.descripcion = "Máximo 100 caracteres";
    }

    // precio: numeric(10,2) > 0
    const precioOk =
      Number.isFinite(parseFloat(formData.precio)) &&
      toMoney2(formData.precio) > 0;
    if (!precioOk)
      e.precio = "El precio debe ser un número mayor a 0 (2 decimales)";

    // stock: int >= 0
    const stockN = toInt(formData.stock, NaN);
    if (!Number.isFinite(stockN) || stockN < 0)
      e.stock = "El stock debe ser un entero ≥ 0";

    // stockMinimo: int >= 0
    const stockMinN = toInt(formData.stockMinimo, NaN);
    if (!Number.isFinite(stockMinN) || stockMinN < 0)
      e.stockMinimo = "El stock mínimo debe ser un entero ≥ 0";

    // FK requeridas
    if (!formData.idCategoria) e.idCategoria = "Debe seleccionar una categoría";
    if (!formData.idUbicacion) e.idUbicacion = "Debe seleccionar una ubicación";

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    // Normalizar para API (camelCase típico en .NET)
    const payload = {
      nombre: formData.nombre.trim(),
      marca: formData.marca.trim(),
      descripcion: formData.descripcion?.trim() || "",
      precio: toMoney2(formData.precio, 0), // number con 2 decimales
      stock: toInt(formData.stock, 0), // int
      stockMinimo: toInt(formData.stockMinimo, 0), // int (camelCase)
      ventaSinStock: Boolean(formData.ventaSinStock),
      idUbicacion: toInt(formData.idUbicacion, 0),
      idCategoria: toInt(formData.idCategoria, 0),
      activo: true,
    };
    if (producto?.id ?? producto?.id_producto ?? producto?.idProducto) {
      const anyId = producto.id ?? producto.id_producto ?? producto.idProducto;
      payload.id = anyId; // útil para la UI/state local
      payload.idProducto = anyId; // útil para la API .NET si espera esta clave
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            placeholder="Nombre del producto"
            className={errores.nombre ? "border-destructive" : ""}
          />
          {errores.nombre && (
            <p className="text-sm text-destructive">{errores.nombre}</p>
          )}
        </div>

        {/* Marca */}
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
          {errores.marca && (
            <p className="text-sm text-destructive">{errores.marca}</p>
          )}
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <Label htmlFor="precio">Precio *</Label>
          <Input
            id="precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio}
            onChange={(e) => handleInputChange("precio", e.target.value)}
            placeholder="0.00"
            className={errores.precio ? "border-destructive" : ""}
          />
          {errores.precio && (
            <p className="text-sm text-destructive">{errores.precio}</p>
          )}
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => handleInputChange("stock", e.target.value)}
            placeholder="0"
            className={errores.stock ? "border-destructive" : ""}
          />
          {errores.stock && (
            <p className="text-sm text-destructive">{errores.stock}</p>
          )}
        </div>

        {/* Stock Mínimo */}
        <div className="space-y-2">
          <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
          <Input
            id="stockMinimo"
            type="number"
            min="0"
            value={formData.stockMinimo}
            onChange={(e) => handleInputChange("stockMinimo", e.target.value)}
            placeholder="0"
            className={errores.stockMinimo ? "border-destructive" : ""}
          />
          {errores.stockMinimo && (
            <p className="text-sm text-destructive">{errores.stockMinimo}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría *</Label>
          <Select
            value={formData.idCategoria || undefined}
            onValueChange={(v) => handleInputChange("idCategoria", v)}
          >
            <SelectTrigger
              id="categoria"
              className={errores.idCategoria ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => {
                const cid = c.idCategoria ?? c.id;
                return (
                  <SelectItem key={cid} value={String(cid)}>
                    {c.categoria}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {errores.idCategoria && (
            <p className="text-sm text-destructive">{errores.idCategoria}</p>
          )}
        </div>

        {/* Ubicación */}
        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación *</Label>
          <Select
            value={formData.idUbicacion || undefined}
            onValueChange={(v) => handleInputChange("idUbicacion", v)}
          >
            <SelectTrigger
              id="ubicacion"
              className={errores.idUbicacion ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((u) => {
                const uid = u.idUbicacion ?? u.id;
                const label =
                  [u.fila, u.seccion, u.nivel].some((v) => v !== undefined)
                    ? `${u.fila ?? ''} ${u.seccion ?? ''} ${u.nivel ?? ''}`.trim()
                    : u.nombre ?? `Ubicación ${uid}`;
                return (
                  <SelectItem key={uid} value={String(uid)}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {errores.idUbicacion && (
            <p className="text-sm text-destructive">{errores.idUbicacion}</p>
          )}
        </div>

        {/* Venta sin stock (bool) */}
         <div className="space-y-2">
          <Label htmlFor="ventaSinStock">Permitir venta sin stock</Label>
          <div className="flex items-center gap-2">
            <input
              id="ventaSinStock"
              type="checkbox"
              checked={formData.ventaSinStock}
              onChange={(e) => handleInputChange("ventaSinStock", e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">Habilita vender con stock 0</span>
          </div>
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
          rows={3}
          className={errores.descripcion ? "border-destructive" : ""}
        />
        {errores.descripcion && (
          <p className="text-sm text-destructive">{errores.descripcion}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="gap-2">
          <Save className="h-4 w-4" />
          {producto ? "Actualizar" : "Crear"} Producto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="gap-2 bg-transparent"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}
