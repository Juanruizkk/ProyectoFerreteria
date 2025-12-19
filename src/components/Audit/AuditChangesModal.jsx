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
import { ArrowRight, Calendar, User, FileType, Hash } from "lucide-react";

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

// Componente para mostrar valores en formato legible
function ValueDisplay({ label, value }) {
  if (value === null || value === undefined) {
    return (
      <div className="text-sm text-muted-foreground italic">Sin datos</div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </div>
      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Valores anteriores */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <h4 className="font-semibold text-sm">
                        Valores Anteriores
                      </h4>
                    </div>
                    <ValueDisplay
                      label="Datos previos"
                      value={valoresAnteriores}
                    />
                  </div>

                  {/* Flecha indicadora (solo en escritorio) */}
                  <div className="hidden lg:flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* Valores nuevos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <h4 className="font-semibold text-sm">Valores Nuevos</h4>
                    </div>
                    <ValueDisplay label="Datos actuales" value={valoresNuevos} />
                  </div>
                </div>

                {/* Mensaje si no hay cambios */}
                {!valoresAnteriores && !valoresNuevos && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay datos de cambios disponibles</p>
                  </div>
                )}
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
