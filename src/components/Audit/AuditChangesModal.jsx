import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, User, FileType, Hash } from "lucide-react";

// Helper para formatear fechas
function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Helper para traducir acciones
function translateAction(accion) {
  switch (accion) {
    case "INSERT":
      return "Creación";
    case "UPDATE":
      return "Actualización";
    case "DELETE":
      return "Eliminación";
    default:
      return accion;
  }
}

// Helper para parsear JSON de forma segura
function parseJSON(jsonString) {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    return null;
  }
}

// Componente para mostrar comparación de valores en tabla
function ComparisonTable({ valoresAnteriores, valoresNuevos, accion }) {
  // Si no hay datos, mostrar mensaje
  if (!valoresAnteriores && !valoresNuevos) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos de cambios disponibles</p>
      </div>
    );
  }

  // Obtener todas las claves únicas de ambos objetos
  const allKeys = new Set([
    ...Object.keys(valoresAnteriores || {}),
    ...Object.keys(valoresNuevos || {}),
  ]);

  // Función para formatear valores
  const formatValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Función para detectar si un campo cambió
  const hasChanged = (key) => {
    if (accion === "INSERT") return true;
    if (accion === "DELETE") return true;
    return JSON.stringify(valoresAnteriores?.[key]) !== JSON.stringify(valoresNuevos?.[key]);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px] font-semibold">Campo</TableHead>
            {accion !== "INSERT" && (
              <TableHead className="font-semibold">Valor Anterior</TableHead>
            )}
            {accion !== "DELETE" && (
              <TableHead className="font-semibold">Valor Nuevo</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(allKeys).map((key) => {
            const changed = hasChanged(key);
            return (
              <TableRow
                key={key}
                className={changed ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
              >
                <TableCell className="font-medium">
                  {key}
                  {changed && accion === "UPDATE" && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Modificado
                    </Badge>
                  )}
                </TableCell>
                {accion !== "INSERT" && (
                  <TableCell className="text-muted-foreground">
                    {formatValue(valoresAnteriores?.[key])}
                  </TableCell>
                )}
                {accion !== "DELETE" && (
                  <TableCell className="font-medium">
                    {formatValue(valoresNuevos?.[key])}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AuditChangesModal({ item, open, onClose }) {
  if (!item) return null;

  const valoresAnteriores = parseJSON(item.valoresAnteriores);
  const valoresNuevos = parseJSON(item.valoresNuevos);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalles de Auditoría #{item.idAuditoria}
          </DialogTitle>
          <DialogDescription>
            Información completa del cambio registrado en el sistema
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha/Hora</p>
                    <p className="font-medium">
                      {formatDateTime(item.fechaHora)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    <p className="font-medium">
                      {item.usuarioNombre || "Desconocido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {item.idUsuario}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileType className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entidad</p>
                    <p className="font-medium">{item.entidadTipo}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ID Entidad
                    </p>
                    <p className="font-mono text-sm">
                      {item.entidadId || "-"}
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Acción</p>
                  <Badge
                    variant={
                      item.accion === "INSERT"
                        ? "default"
                        : item.accion === "UPDATE"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {translateAction(item.accion)}
                  </Badge>
                </div>

                {item.detalle && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Detalle
                    </p>
                    <p className="text-sm">{item.detalle}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Cambios realizados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cambios Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  valoresAnteriores={valoresAnteriores}
                  valoresNuevos={valoresNuevos}
                  accion={item.accion}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
