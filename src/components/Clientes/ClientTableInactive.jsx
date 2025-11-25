import { CheckCircle } from "lucide-react";
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

export default function ClientTableInactive({ clientes, onActivate }) {
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
          {clientes.map((cliente) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActivate(cliente.idCliente)}
                    title="Activar cliente"
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
