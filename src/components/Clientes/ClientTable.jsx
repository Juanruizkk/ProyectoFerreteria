import { Eye, Pencil, Trash2 } from "lucide-react";
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

export default function ClientTable({ clientes, onEdit, onDelete, onViewDetails, isLoading }) {
  const getNombreCompleto = (cliente) => {
    if (cliente.razonSocial && cliente.razonSocial.trim() !== "") {
      return cliente.razonSocial;
    }
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  };

  const getIdentificacion = (cliente) => {
    if (cliente.dni && cliente.dni.trim() !== "") {
      return cliente.dni;
    }
    if (cliente.cuit && cliente.cuit.trim() !== "") {
      return cliente.cuit;
    }
    return "-";
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre / Empresa</TableHead>
            <TableHead>DNI / CUIT</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Mail</TableHead>
            <TableHead>Cuenta Corriente</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-36 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-5 w-10 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No se encontraron clientes
              </TableCell>
            </TableRow>
          ) : (
          clientes.map((cliente) => (
            <TableRow key={cliente.idCliente}>
              <TableCell className="font-medium">
                {getNombreCompleto(cliente)}
              </TableCell>
              <TableCell>{getIdentificacion(cliente)}</TableCell>
              <TableCell>{cliente.telefono || "-"}</TableCell>
              <TableCell>{cliente.mail || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    cliente.tieneCuentaCorriente ? "default" : "secondary"
                  }
                >
                  {cliente.tieneCuentaCorriente ? "Sí" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <PermissionGuard permission="CLI_READ">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(cliente.idCliente)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>

                  <PermissionGuard permission="CLI_UPDATE">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(cliente)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>

                  <PermissionGuard permission="CLI_DELETE">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(cliente)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </PermissionGuard>
                </div>
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </div>
  );
}
