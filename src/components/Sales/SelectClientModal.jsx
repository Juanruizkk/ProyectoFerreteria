import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, User } from "lucide-react";
import { fetchAllClients } from "@/services/SaleQueries";
import { toast } from "sonner";

export default function SelectClientModal({ open, onOpenChange, onClientSelected }) {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadClients();
      setSelectedClientId(null);
      setSearchTerm("");
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClients(clients);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          client.nombre?.toLowerCase().includes(search) ||
          client.apellido?.toLowerCase().includes(search) ||
          client.razonSocial?.toLowerCase().includes(search) ||
          client.dni?.toLowerCase().includes(search) ||
          client.cuit?.toLowerCase().includes(search)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchAllClients();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const client = clients.find(
      (c) => (c.id || c.idCliente) === selectedClientId
    );

    if (!client) {
      toast.error("Seleccione un cliente");
      return;
    }

    onClientSelected(client);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">
            Seleccionar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI, CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="text-muted-foreground">Cargando clientes...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <RadioGroup
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                className="space-y-2 py-4"
              >
                {filteredClients.map((client) => {
                  const clientId = client.id || client.idCliente;
                  const isSelected = selectedClientId === clientId;

                  return (
                    <Card
                      key={clientId}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "border-primary shadow-md" : ""
                      }`}
                      onClick={() => setSelectedClientId(clientId)}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={clientId} id={`client-${clientId}`} className="mt-1" />
                        <Label
                          htmlFor={`client-${clientId}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">
                                {client.nombre} {client.apellido || client.razonSocial}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {client.dni ? `DNI: ${client.dni}` : `CUIT: ${client.cuit}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge
                                variant="outline"
                                className={
                                  client.tipoPago === "Cuenta Corriente"
                                    ? "bg-orange-100 text-orange-800 border-orange-200"
                                    : ""
                                }
                              >
                                {client.tipoPago || "Contado"}
                              </Badge>
                              {client.tipoPago === "Cuenta Corriente" && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">Saldo</p>
                                  <p className="text-sm font-semibold text-orange-600">
                                    {formatCurrency(client.saldoActual || 0)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  );
                })}
              </RadioGroup>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedClientId}
          >
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
