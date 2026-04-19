import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { importarListaExcel } from "@/services/ProveedorQueries";

export default function ImportarListaModal({ open, onOpenChange, idLista, listaNombre, ivaPorDefecto = 21, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { totalProcesados, errores, detalleErrores }
  const [error, setError] = useState("");
  const [ivaAplicacion, setIvaAplicacion] = useState(ivaPorDefecto);
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setLoading(false);
  };

  const handleClose = (v) => {
    if (loading) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
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

  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError("");
      const res = await importarListaExcel(idLista, file, ivaAplicacion);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Cargá un archivo Excel para actualizar los precios de "{listaNombre}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* IVA a aplicar */}
          {!result && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">IVA de la lista (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
                value={ivaAplicacion}
                onChange={(e) => setIvaAplicacion(parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-muted-foreground">Los precios del Excel se asumen netos (sin IVA)</span>
            </div>
          )}

          {/* Zona de drag & drop */}
          {!result && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
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
                  <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Arrastrá tu archivo aquí</p>
                  <p className="text-xs text-muted-foreground">o hacé clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground">Formatos admitidos: .xlsx, .xls</p>
                </div>
              )}
            </div>
          )}

          {/* Resultado de la importación */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">Importación completada</span>
              </div>
              <div className="rounded-md border bg-muted/40 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total procesados</span>
                  <span className="font-semibold">{result.totalProcesados ?? result.total ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Importados OK</span>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {(result.totalProcesados ?? result.total ?? 0) - (result.errores ?? result.totalErrores ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Con errores</span>
                  <span className={`font-semibold ${(result.errores ?? result.totalErrores ?? 0) > 0 ? "text-destructive" : ""}`}>
                    {result.errores ?? result.totalErrores ?? 0}
                  </span>
                </div>
              </div>
              {result.detalleErrores?.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-destructive text-xs font-medium mb-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Filas con errores
                  </div>
                  {result.detalleErrores.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {e}</p>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={reset}
              >
                Importar otro archivo
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        {!result && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        )}
        {result && (
          <DialogFooter>
            <Button onClick={() => handleClose(false)}>Cerrar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
