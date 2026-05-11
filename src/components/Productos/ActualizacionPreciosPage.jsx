import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, FileDown, Upload, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fetchAvailableProducts } from "@/services/SaleQueries";
import {
  descargarPlantillaPrecios,
  actualizarMasivoManual,
  actualizarMasivoExcel,
} from "@/services/ProductQueries";

// ── Buscador de productos ─────────────────────────────────────────────────────
function ProductSearch({ onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
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

  const handleSelect = (p) => {
    onSelect(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Input
        placeholder="Buscar producto por nombre o marca..."
        value={query}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off"
      />
      {searching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
          {results.map((p) => {
            const id = p.idProducto ?? p.IdProducto;
            const nombre = p.nombre ?? p.Nombre ?? "";
            const marca = p.marca ?? p.Marca ?? "";
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
    : "-";

// ── Tab: Actualización Manual ─────────────────────────────────────────────────
function ActualizacionManualTab() {
  const [staging, setStaging] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null); // null = form, object = resumen

  const handleSelectProducto = (p) => {
    const id = p.idProducto ?? p.IdProducto;
    if (staging.some((s) => s.idProducto === id)) {
      toast.info("El producto ya está en la lista");
      return;
    }
    const margenActual = p.porcentajeGanancia ?? p.PorcentajeGanancia ?? null;
    setStaging((prev) => [
      ...prev,
      {
        idProducto: id,
        nombre: p.nombre ?? p.Nombre ?? "",
        marca: p.marca ?? p.Marca ?? "",
        costoActual: p.costo ?? p.Costo ?? null,
        margenActual,
        costoNeto: "",
        ivaPorcentaje: "21",
        margen: margenActual != null ? String(margenActual) : "",
      },
    ]);
    setError("");
  };

  const updateField = (idProducto, field, value) => {
    setStaging((prev) =>
      prev.map((s) => (s.idProducto === idProducto ? { ...s, [field]: value } : s))
    );
  };

  const removeItem = (idProducto) => {
    setStaging((prev) => prev.filter((s) => s.idProducto !== idProducto));
  };

  const handleSubmit = async () => {
    const invalidos = staging.filter(
      (s) => s.costoNeto === "" || isNaN(parseFloat(s.costoNeto)) || parseFloat(s.costoNeto) < 0
    );
    if (invalidos.length > 0) {
      setError("Todos los productos deben tener un costo neto válido.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const items = staging.map((s) => ({
        idProducto: s.idProducto,
        costoNeto: parseFloat(s.costoNeto),
        ivaPorcentaje: parseFloat(s.ivaPorcentaje) || 21,
        margen: s.margen !== "" && !isNaN(parseFloat(s.margen)) ? parseFloat(s.margen) : null,
      }));

      const result = await actualizarMasivoManual(items);
      setResultado(result);
      toast.success(
        `${result.actualizados} precio${result.actualizados !== 1 ? "s" : ""} actualizado${result.actualizados !== 1 ? "s" : ""}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStaging([]);
    setError("");
    setResultado(null);
  };

  // ── Vista resumen ─────────────────────────────────────────────────────────
  if (resultado) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Actualización completada —{" "}
          <span className="font-semibold text-foreground">
            {resultado.actualizados} producto{resultado.actualizados !== 1 ? "s" : ""} actualizado{resultado.actualizados !== 1 ? "s" : ""}
          </span>.
          {" "}Si no modificaste el margen, se mantuvo el actual del producto.
        </p>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Costo anterior</TableHead>
                <TableHead className="text-right">Costo nuevo</TableHead>
                <TableHead className="text-right">Precio anterior</TableHead>
                <TableHead className="text-right">Precio nuevo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultado.detalle?.map((d) => (
                <TableRow key={d.idProducto}>
                  <TableCell className="font-medium text-sm py-2">{d.nombre}</TableCell>
                  <TableCell className="text-right text-sm font-mono py-2 text-muted-foreground">{fmt(d.costoAnterior)}</TableCell>
                  <TableCell className="text-right text-sm font-mono py-2 font-semibold">{fmt(d.costoNuevo)}</TableCell>
                  <TableCell className="text-right text-sm font-mono py-2 text-muted-foreground">{fmt(d.precioAnterior)}</TableCell>
                  <TableCell className="text-right text-sm font-mono py-2 font-semibold text-green-600 dark:text-green-400">{fmt(d.precioNuevo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {resultado.ignorados?.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {resultado.ignorados.length} producto{resultado.ignorados.length !== 1 ? "s" : ""} ignorado{resultado.ignorados.length !== 1 ? "s" : ""} (no encontrados o inactivos).
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={handleReset}>Nueva actualización</Button>
        </div>
      </div>
    );
  }

  // ── Vista formulario ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Buscá los productos y cargá los nuevos costos. Si no modificás el margen, se mantiene el actual del producto.
      </p>

      {/* Buscador */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label>Agregar producto</Label>
          <ProductSearch onSelect={handleSelectProducto} disabled={saving} />
        </div>
      </div>

      {/* Tabla staging */}
      {staging.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Producto</TableHead>
                <TableHead className="w-32 text-right">Costo neto</TableHead>
                <TableHead className="w-24 text-right">IVA %</TableHead>
                <TableHead className="w-28 text-right">Costo c/IVA</TableHead>
                <TableHead className="w-24 text-right">Margen %</TableHead>
                <TableHead className="w-32 text-right">Precio venta</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {staging.map((s) => {
                const costoConIva =
                  s.costoNeto !== "" && !isNaN(parseFloat(s.costoNeto))
                    ? parseFloat(s.costoNeto) * (1 + (parseFloat(s.ivaPorcentaje) || 0) / 100)
                    : null;
                const margenEfectivo =
                  s.margen !== "" && !isNaN(parseFloat(s.margen))
                    ? parseFloat(s.margen)
                    : s.margenActual;
                const precioPreview =
                  costoConIva != null && margenEfectivo != null
                    ? costoConIva * (1 + margenEfectivo / 100)
                    : null;
                return (
                  <TableRow key={s.idProducto}>
                    <TableCell className="py-2">
                      <p className="font-medium text-sm">{s.nombre}</p>
                      {s.marca && <p className="text-xs text-muted-foreground">{s.marca}</p>}
                      {s.costoActual != null && (
                        <p className="text-xs text-muted-foreground">Costo actual: {fmt(s.costoActual)}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        className="h-8 w-28 text-right" value={s.costoNeto}
                        onChange={(e) => updateField(s.idProducto, "costoNeto", e.target.value)}
                        disabled={saving}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number" min="0" max="100" step="0.5"
                        className="h-8 w-20 text-right" value={s.ivaPorcentaje}
                        onChange={(e) => updateField(s.idProducto, "ivaPorcentaje", e.target.value)}
                        disabled={saving}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right text-sm font-mono">
                      {costoConIva != null ? fmt(costoConIva) : "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number" min="0" step="0.1"
                        placeholder="—"
                        className="h-8 w-24 text-right" value={s.margen}
                        onChange={(e) => updateField(s.idProducto, "margen", e.target.value)}
                        disabled={saving}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right text-sm font-mono font-semibold">
                      {precioPreview != null ? fmt(precioPreview) : "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(s.idProducto)}
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-md py-10 text-center text-sm text-muted-foreground">
          <Plus className="mx-auto h-6 w-6 mb-2 opacity-40" />
          Buscá productos para actualizar sus precios
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {staging.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={saving || staging.length === 0}>
            {saving ? "Actualizando..." : `Actualizar (${staging.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Importar desde Excel ─────────────────────────────────────────────────
function ImportarExcelTab() {
  const [file, setFile] = useState(null);
  const [ivaDefecto, setIvaDefecto] = useState(21);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [ignorados, setIgnorados] = useState(null);
  const fileInputRef = useRef(null);

  const handleDescargarPlantilla = async () => {
    try {
      setDownloadingTemplate(true);
      await descargarPlantillaPrecios();
      toast.success("Plantilla descargada");
    } catch (err) {
      toast.error("Error al descargar la plantilla: " + err.message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImportar = async () => {
    if (!file) {
      toast.error("Seleccioná un archivo Excel primero");
      return;
    }
    try {
      setImporting(true);
      setIgnorados(null);
      const result = await actualizarMasivoExcel(file, ivaDefecto);
      toast.success(
        `${result.actualizados} precio${result.actualizados !== 1 ? "s" : ""} actualizado${result.actualizados !== 1 ? "s" : ""}`
      );
      if (result.codigosIgnorados?.length > 0) {
        setIgnorados(result.codigosIgnorados);
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error("Error al importar: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <p className="text-sm text-muted-foreground">
        Descargá la plantilla con todos los productos y sus costos actuales, completá los nuevos valores y subí el archivo para actualizar masivamente.
      </p>

      {/* Paso 1: Descargar plantilla */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Paso 1 — Descargar plantilla</p>
        <Button
          variant="outline"
          onClick={handleDescargarPlantilla}
          disabled={downloadingTemplate}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          {downloadingTemplate ? "Descargando..." : "Descargar plantilla de precios"}
        </Button>
        <p className="text-xs text-muted-foreground">
          El archivo incluye todos los productos activos con sus costos y márgenes actuales.
        </p>
      </div>

      <Separator />

      {/* Paso 2: Cargar archivo */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Paso 2 — Cargar archivo actualizado</p>

        <div className="space-y-1">
          <Label htmlFor="iva-defecto">IVA por defecto del archivo (%)</Label>
          <Input
            id="iva-defecto"
            type="number"
            min="0"
            max="100"
            step="0.5"
            className="w-32"
            value={ivaDefecto}
            onChange={(e) => setIvaDefecto(parseFloat(e.target.value) || 0)}
            disabled={importing}
          />
          <p className="text-xs text-muted-foreground">
            Se aplica si el archivo no especifica IVA por fila.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="archivo-excel">Archivo Excel (.xlsx)</Label>
          <div
            className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-7 w-7 mb-2 text-muted-foreground opacity-60" />
            {file ? (
              <p className="text-sm font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hacé clic para seleccionar un archivo <span className="font-medium">.xlsx</span>
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            id="archivo-excel"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={importing}
          />
        </div>

        <Button
          onClick={handleImportar}
          disabled={importing || !file}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {importing ? "Importando..." : "Importar"}
        </Button>
      </div>

      {/* Productos ignorados */}
      {ignorados && ignorados.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 space-y-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {ignorados.length} producto{ignorados.length !== 1 ? "s" : ""} ignorado{ignorados.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Los siguientes códigos no fueron encontrados o corresponden a productos inactivos:
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ignorados.map((cod) => (
              <span
                key={cod}
                className="inline-block text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded px-2 py-0.5 font-mono"
              >
                {cod}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ActualizacionPreciosPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Actualización de Precios</h1>
          <p className="text-sm text-muted-foreground">
            Actualizá costos y precios de venta de forma masiva
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/productos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a productos
        </Button>
      </div>

      {/* Contenido en tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de actualización</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="mb-6">
              <TabsTrigger value="manual">Actualización Manual</TabsTrigger>
              <TabsTrigger value="excel">Importar desde Excel</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <ActualizacionManualTab />
            </TabsContent>

            <TabsContent value="excel">
              <ImportarExcelTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
