import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  });
}

// Helper para colorear badges según la acción
function getActionBadgeVariant(accion) {
  switch (accion) {
    case "INSERT":
      return "default";
    case "UPDATE":
      return "secondary";
    case "DELETE":
      return "destructive";
    default:
      return "outline";
  }
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

export function AuditTable({ data, onViewChanges }) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron registros</p>
            <p className="text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-0">
        <div className="border rounded-md overflow-hidden">
          <div
            className="overflow-y-auto transition-all duration-300"
            style={{
              maxHeight: data.length > 10 ? "600px" : `${data.length * 60 + 60}px`,
            }}
          >
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="sticky top-0 bg-muted z-10">
                  <TableHead className="w-[100px]">Fecha/Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.idAuditoria}
                    className="hover:bg-muted/40 transition"
                  >
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(item.fechaHora)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {item.usuarioNombre || "Desconocido"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ID: {item.idUsuario}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(item.accion)}>
                        {translateAction(item.accion)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{item.entidadTipo}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.detalle || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onViewChanges(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver cambios</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
