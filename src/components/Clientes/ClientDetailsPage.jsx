import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClienteById } from "@/services/ClienteQueries";
import ClientCurrentAccountTab from "./ClientCurrentAccountTab";
import ClientSalesTab from "./ClientSalesTab";

export default function ClientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientDetails();
  }, [id]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const data = await getClienteById(id);
      setCliente(data);
    } catch (error) {
      toast.error("Error al cargar los detalles del cliente");
      console.error("Error loading client details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNombreCompleto = () => {
    if (!cliente) return "";
    if (cliente.razonSocial?.trim()) return cliente.razonSocial;
    return `${cliente.nombre} ${cliente.apellido}`.trim();
  };

  const getIdentificacion = () => {
    if (!cliente) return "-";
    if (cliente.dni?.trim()) return `DNI: ${cliente.dni}`;
    if (cliente.cuit?.trim()) return `CUIT: ${cliente.cuit}`;
    return "-";
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-8">Cargando detalles del cliente...</div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="text-center py-8">Cliente no encontrado</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/clientes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 mb-4">
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="cc">Cuenta Corriente</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{getNombreCompleto()}</CardTitle>
                  <CardDescription>{getIdentificacion()}</CardDescription>
                </div>
                <Badge
                  variant={cliente.tieneCuentaCorriente ? "default" : "secondary"}
                >
                  {cliente.tieneCuentaCorriente
                    ? "Con Cuenta Corriente"
                    : "Sin Cuenta Corriente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cliente.nombre && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-base">{cliente.nombre}</p>
                  </div>
                )}
                {cliente.apellido && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Apellido</p>
                    <p className="text-base">{cliente.apellido}</p>
                  </div>
                )}
                {cliente.razonSocial && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Razón Social
                    </p>
                    <p className="text-base">{cliente.razonSocial}</p>
                  </div>
                )}
                {cliente.dni && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">DNI</p>
                    <p className="text-base">{cliente.dni}</p>
                  </div>
                )}
                {cliente.cuit && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CUIT</p>
                    <p className="text-base">{cliente.cuit}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-base">{cliente.telefono || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{cliente.mail || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventas">
          <ClientSalesTab clientId={id} />
        </TabsContent>

        <TabsContent value="cc">
          <ClientCurrentAccountTab
            cliente={cliente}
            clientId={id}
            onAccountCreated={loadClientDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
