import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { descargarPlantillaExcel, importarPlantillaExcel } from "@/services/ProveedorQueries";

// ── Resultado de importación ─────────────────────────────────────────────────
function ImportResult({ result, onReset }) {
  const ignorados = result.ignorados ?? result.codigosIgnorados ?? result.productosIgnorados ?? [];
  const actualizados = result.totalActualizados ?? result.actualizados ?? 0;
  const procesados = result.totalProcesados ?? result.procesados ?? 0;

  return (
    <div className="space-y-4">
      {/* Banner éxito */}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="font-semibold text-green-800 dark:text-green-300">Importación completada</p>
          <p className="text-sm text-green-700 dark:text-green-400">
            {actualizados} precio{actualizados !== 1 ? "s" : ""} actualizados de {procesados} líneas procesadas
          </p>
        </div>
      </div>

      {/* Artículos ignorados */}
      {ignorados.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-semibold text-sm">
              {ignorados.length} producto{ignorados.length !== 1 ? "s" : ""} ignorado{ignorados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-500">
            Los siguientes artículos no existen en el sistema. Dálos de alta primero para poder cargarles un precio.
          </p>
          <div className="max-h-36 overflow-y-auto rounded border border-orange-200 dark:border-orange-800 bg-white/60 dark:bg-black/20 p-2 space-y-0.5">
            {ignorados.map((codigo, i) => (
              <p key={i} className="text-xs font-mono text-orange-700 dark:text-orange-400">
                • {codigo}
              </p>
            ))}
          </div>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={onReset}>
        Importar otro archivo
      </Button>
    </div>
  );
}

// ── Modal principal ──────────────────────────────────────────────────────────
export default function BulkPriceImportModal({ open, onOpenChange, idLista, listaNombre, ivaPorDefecto = 21, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [actualizarPrecio, setActualizarPrecio] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setLoading(false);
    setActualizarPrecio(false);
  };

  const handleClose = (v) => {
    if (loading || downloading) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const selectFile = (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      setError("Solo se admiten archivos Excel (.xlsx, .xls)");
      return;
    }
    setError("");
    setResult(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      setError("");
      await descargarPlantillaExcel(idLista, listaNombre);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError("");
      const res = await importarPlantillaExcel(idLista, file, actualizarPrecio);
      setResult(res);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Carga Masiva de Precios
          </DialogTitle>
          <DialogDescription>
            Actualizá los precios de <span className="font-medium text-foreground">"{listaNombre}"</span> usando una plantilla Excel estandarizada.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <>
            <ImportResult result={result} onReset={reset} />
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-5">
              {/* Paso 1 — Descargar plantilla */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <p className="font-semibold text-sm">Descargá la plantilla base</p>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  La plantilla contiene los productos ya asociados a esta lista con sus columnas: Código de Barra, Nombre, Nuevo Costo y Margen.
                </p>
                <div className="pl-8">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
                    onClick={handleDownloadTemplate}
                    disabled={downloading || loading}
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloading ? "Descargando..." : "Descargar Plantilla Base"}
                  </Button>
                </div>
              </div>

              {/* Paso 2 — Subir archivo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <p className="font-semibold text-sm">Completá la plantilla y subila</p>
                </div>
                <div
                  className={`ml-8 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    dragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="h-7 w-7 text-green-600 shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-sm truncate max-w-[180px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 ml-1 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setFile(null); setError(""); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Arrastrá tu plantilla aquí</p>
                      <p className="text-xs text-muted-foreground">o hacé clic para seleccionar · .xlsx / .xls</p>
                    </div>
                  )}
                </div>
              </div>

              {/* IVA info */}
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">IVA aplicado:</span>
                <span>{ivaPorDefecto}% (configurado en la lista)</span>
              </div>

              {/* Paso 3 — Decisión de precio de venta */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <p className="font-semibold text-sm">Decisión comercial</p>
                </div>
                <div className="pl-8 flex items-start gap-3">
                  <Switch
                    id="actualizar-precio"
                    checked={actualizarPrecio}
                    onCheckedChange={setActualizarPrecio}
                    disabled={loading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="actualizar-precio" className="font-medium cursor-pointer">
                      Actualizar Precios de Venta al Público
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Si lo activás, el precio de góndola de cada producto se recalculará automáticamente usando:{" "}
                      <span className="font-mono bg-muted px-1 rounded text-foreground">Precio Venta = Nuevo Costo × (1 + Margen%)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Procesar"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
