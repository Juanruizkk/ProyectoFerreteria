import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  descargarPlantillaCsv,
  descargarPlantillaExcel,
  importarProductos,
  exportarProductosCsv,
  exportarProductosExcel,
} from "@/services/ProductQueries";

export default function ProductImport({ onImportComplete }) {
  const [uploading, setUploading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const fileInputRef = useRef(null);

  const handleDescargarPlantillaCsv = async () => {
    try {
      await descargarPlantillaCsv();
      toast.success("Plantilla CSV descargada", {
        description: "Puedes editarla y luego importarla.",
      });
    } catch (error) {
      toast.error("Error al descargar plantilla CSV", {
        description: error.message,
      });
    }
  };

  const handleDescargarPlantillaExcel = async () => {
    try {
      await descargarPlantillaExcel();
      toast.success("Plantilla Excel descargada", {
        description: "Puedes editarla y luego importarla.",
      });
    } catch (error) {
      toast.error("Error al descargar plantilla Excel", {
        description: error.message,
      });
    }
  };

  const handleExportarCsv = async () => {
    try {
      await exportarProductosCsv();
      toast.success("Productos exportados a CSV", {
        description: "El archivo se ha descargado correctamente.",
      });
    } catch (error) {
      toast.error("Error al exportar productos CSV", {
        description: error.message,
      });
    }
  };

  const handleExportarExcel = async () => {
    try {
      await exportarProductosExcel();
      toast.success("Productos exportados a Excel", {
        description: "El archivo se ha descargado correctamente.",
      });
    } catch (error) {
      toast.error("Error al exportar productos Excel", {
        description: error.message,
      });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      toast.error("Formato no válido", {
        description: "Solo se permiten archivos .csv o .xlsx",
      });
      return;
    }

    setUploading(true);
    setResultado(null);

    try {
      const resultado = await importarProductos(file);
      setResultado(resultado);

      if (resultado.errores && resultado.errores.length > 0) {
        toast.warning("Importación completada con errores", {
          description: `${resultado.productosCreados} creados, ${resultado.productosActualizados} actualizados, ${resultado.errores.length} errores.`,
        });
      } else {
        toast.success("Importación exitosa", {
          description: `${resultado.productosCreados} productos creados, ${resultado.productosActualizados} actualizados.`,
        });
      }

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      toast.error("Error al importar productos", {
        description: error.message,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Sección de plantillas y exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Plantillas */}
        <Card className="border-2 border-dashed hover:border-primary transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="rounded-full bg-primary/10 p-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Descargar Plantillas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Descarga plantillas vacías para importación
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleDescargarPlantillaCsv}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={handleDescargarPlantillaExcel}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de Exportación */}
        <Card className="border-2 border-dashed hover:border-green-600 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="rounded-full bg-green-500/10 p-3">
              <FileDown className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Exportar Productos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Exporta todos los productos actuales
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleExportarCsv}
                variant="outline"
                className="flex-1 gap-2"
              >
                <FileDown className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={handleExportarExcel}
                variant="outline"
                className="flex-1 gap-2"
              >
                <FileDown className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de carga de archivo */}
      <Card className="border-2 border-primary">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="rounded-full bg-blue-500/10 p-4">
            <Upload className="h-10 w-10 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Cargar Archivo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona un archivo CSV o Excel para importar productos
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full max-w-sm gap-2"
          >
            {uploading ? (
              <>Importando...</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Seleccionar Archivo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado de la importación */}
      {resultado && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold">Resumen de Importación</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Productos creados:</span>{" "}
                    {resultado.productosCreados}
                  </p>
                  <p>
                    <span className="font-medium">Productos actualizados:</span>{" "}
                    {resultado.productosActualizados}
                  </p>
                  {resultado.errores && resultado.errores.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-900">
                          Errores encontrados ({resultado.errores.length})
                        </span>
                      </div>
                      <ul className="space-y-1 text-xs text-amber-800">
                        {resultado.errores.slice(0, 5).map((error, idx) => (
                          <li key={idx}>
                            <span className="font-medium">Línea {error.lineNumber}:</span>{" "}
                            {error.errors.join(", ")}
                          </li>
                        ))}
                        {resultado.errores.length > 5 && (
                          <li className="italic">
                            ... y {resultado.errores.length - 5} errores más
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
