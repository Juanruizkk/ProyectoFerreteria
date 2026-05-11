import { Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PermissionGuard from "@/components/PermissionGuard";

export default function AccountConfigTable({ configs, onEdit, onToggleState, isActive }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Monto Límite</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No hay configuraciones {isActive ? "activas" : "inactivas"}
              </TableCell>
            </TableRow>
          ) : (
            configs.map((config) => (
              <TableRow key={config.idConfig}>
                <TableCell className="font-medium">{config.nombre}</TableCell>
                <TableCell>{formatCurrency(config.montoLimite)}</TableCell>
                <TableCell>
                  <Badge variant={config.activo ? "default" : "secondary"}>
                    {config.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <PermissionGuard permission="CC_MANAGE">
                    <div className="flex justify-end gap-2">
                      {isActive ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(config)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleState(config, false)}
                            title="Desactivar"
                          >
                            <PowerOff className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleState(config, true)}
                          title="Activar"
                        >
                          <Power className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
